import { writeFileSync } from "node:fs";

const outputPath = "docs/pin2win-mutual-nda-template.pdf";
const width = 612;
const height = 792;
const margin = 46;
const ink = [24 / 255, 33 / 255, 31 / 255];
const muted = [86 / 255, 96 / 255, 90 / 255];
const green = [47 / 255, 107 / 255, 63 / 255];
const lightGreen = [232 / 255, 242 / 255, 221 / 255];
const cream = [251 / 255, 248 / 255, 241 / 255];
const border = [222 / 255, 214 / 255, 200 / 255];
const dark = [16 / 255, 24 / 255, 22 / 255];

function esc(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function rgb([r, g, b]) {
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

function textWidth(text, size) {
  return String(text).length * size * 0.5;
}

function wrap(text, size, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (textWidth(next, size) <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

class PdfDoc {
  constructor() {
    this.pages = [];
    this.page = null;
    this.y = height - margin;
  }

  addPage(background = [1, 0.992, 0.973]) {
    this.page = [];
    this.pages.push(this.page);
    this.y = height - margin;
    this.rect(0, 0, width, height, background, null);
  }

  op(value) {
    this.page.push(value);
  }

  rect(x, y, w, h, fill, stroke = border) {
    if (fill) {
      this.op(`${rgb(fill)} rg`);
    }
    if (stroke) {
      this.op(`${rgb(stroke)} RG 0.75 w`);
    }
    this.op(`${x} ${y} ${w} ${h} re ${fill && stroke ? "B" : fill ? "f" : "S"}`);
  }

  line(x1, y1, x2, y2, color = border, thickness = 1) {
    this.op(`${rgb(color)} RG ${thickness} w ${x1} ${y1} m ${x2} ${y2} l S`);
  }

  text(value, x, y, size = 10.5, color = ink, font = "F1") {
    this.op(`${rgb(color)} rg BT /${font} ${size} Tf ${x} ${y} Td (${esc(value)}) Tj ET`);
  }

  wrapped(value, x, y, maxWidth, size = 10.5, color = ink, leading = size * 1.35) {
    const lines = wrap(value, size, maxWidth);
    lines.forEach((line, index) => this.text(line, x, y - index * leading, size, color));
    return lines.length * leading;
  }

  ensure(space) {
    if (this.y - space < margin) {
      this.addPage();
      this.header();
    }
  }

  header() {
    this.text("PIN2WIN PARTNER CONFIDENTIALITY AGREEMENT", margin, height - 30, 8.5, green, "F2");
    this.text("Confidential", width - margin - 48, height - 30, 8, muted);
    this.line(margin, height - 42, width - margin, height - 42, border, 0.7);
    this.y = height - 62;
  }

  h1(value) {
    this.ensure(48);
    this.text(value, margin, this.y, 22, ink, "F2");
    this.y -= 13;
    this.line(margin, this.y, width - margin, this.y, green, 2);
    this.y -= 24;
  }

  h2(value) {
    this.ensure(32);
    this.text(value, margin, this.y, 14, green, "F2");
    this.y -= 18;
  }

  p(value) {
    this.ensure(62);
    const used = this.wrapped(value, margin, this.y, width - margin * 2, 10.3, ink, 13.8);
    this.y -= used + 8;
  }

  callout(label, value) {
    this.ensure(74);
    const x = margin;
    const w = width - margin * 2;
    const lines = wrap(value, 9.8, w - 26);
    const h = 38 + lines.length * 13;
    this.rect(x, this.y - h + 8, w, h, lightGreen, green);
    this.text(label, x + 13, this.y - 10, 10.5, green, "F2");
    this.wrapped(value, x + 13, this.y - 27, w - 26, 9.8, ink, 13);
    this.y -= h + 10;
  }

  table(headers, rows, widths) {
    const totalW = width - margin * 2;
    const x = margin;
    this.ensure(58);
    this.rect(x, this.y - 23, totalW, 23, dark, null);
    let cx = x;
    headers.forEach((header, index) => {
      this.text(header, cx + 7, this.y - 15, 8.5, [1, 1, 1], "F2");
      cx += widths[index];
    });
    this.y -= 23;

    rows.forEach((row) => {
      const lineGroups = row.map((cell, index) => wrap(cell, 8.7, widths[index] - 14));
      const rowH = Math.max(...lineGroups.map((lines) => lines.length)) * 11.5 + 16;
      this.ensure(rowH + 12);
      let cellX = x;
      row.forEach((cell, index) => {
        this.rect(cellX, this.y - rowH, widths[index], rowH, [1, 0.992, 0.973], border);
        this.wrapped(cell, cellX + 7, this.y - 14, widths[index] - 14, 8.7, ink, 11.5);
        cellX += widths[index];
      });
      this.y -= rowH;
    });
    this.y -= 14;
  }

  signatureTable() {
    this.ensure(260);
    this.table(
      ["Pin2Win", "Partner"],
      [[
        "Signature: ________________________________\nPrinted name: _____________________________\nTitle: ___________________________________\nDate: ____________________________________",
        "Signature: ________________________________\nPrinted name: _____________________________\nTitle: ___________________________________\nDate: ____________________________________",
      ]],
      [260, 260],
    );
  }
}

const doc = new PdfDoc();

doc.addPage(dark);
doc.rect(0, 0, width, height, dark, null);
doc.rect(0, 0, 14, height, green, null);
doc.text("PIN2WIN", 54, 710, 15, [0.659, 0.784, 0.471], "F2");
doc.wrapped("Partner Confidentiality Agreement", 54, 615, 450, 32, [1, 1, 1], 38);
doc.wrapped(
  "Mutual non-disclosure, limited non-competition, and non-circumvention agreement for golf simulator partner discussions.",
  54,
  485,
  465,
  14,
  [0.85, 0.91, 0.77],
  21,
);
doc.text("Prepared for partner review and execution", 54, 90, 12, [0.85, 0.91, 0.77], "F2");
doc.text("May 2026", 54, 70, 10, [0.85, 0.91, 0.77]);

doc.addPage();
doc.header();
doc.h1("Partner Confidentiality Agreement");
doc.p("This Partner Confidentiality Agreement (\"Agreement\") is entered into as of ______________________, 20____ (\"Effective Date\"), by and between Pin2Win / PinSeekers (\"Pin2Win\") and __________________________________________ (\"Partner\"). Pin2Win and Partner may each be referred to as a \"Party\" and collectively as the \"Parties.\"");
doc.table(
  ["Pin2Win", "Partner"],
  [[
    "Legal name: _______________________________\nAddress: _________________________________\nContact: _________________________________\nEmail: ___________________________________",
    "Legal name: _______________________________\nLocation/DBA: _____________________________\nAddress: _________________________________\nContact: _________________________________\nEmail: ___________________________________",
  ]],
  [260, 260],
);
doc.callout("Business purpose", "The Parties wish to discuss a potential commercial relationship involving Pin2Win's golf simulator challenge platform, partner location onboarding, revenue tracking, launch marketing, and related business opportunities.");
doc.h2("1. Confidential Information");
doc.p("\"Confidential Information\" means non-public information disclosed by one Party (\"Disclosing Party\") to the other Party (\"Receiving Party\"), whether orally, visually, electronically, or in writing, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure.");
doc.p("Confidential Information may include business plans, pricing, revenue share models, partner lists, product designs, software workflows, platform architecture, admin portal screens, financial data, launch plans, marketing materials, trade secrets, customer or player information, technical documentation, and terms of any proposed partnership.");
doc.h2("2. Exclusions");
doc.p("Confidential Information does not include information that the Receiving Party can demonstrate: (a) is or becomes publicly available without breach of this Agreement; (b) was already known by the Receiving Party without confidentiality obligations; (c) is received from a third party without breach of any duty; or (d) is independently developed without use of or reference to the Disclosing Party's Confidential Information.");

doc.addPage();
doc.header();
doc.h2("3. Use and Protection of Confidential Information");
doc.p("The Receiving Party may use Confidential Information only to evaluate, negotiate, or perform a potential business relationship between the Parties. The Receiving Party will not disclose Confidential Information to any third party except to its owners, officers, employees, contractors, advisors, attorneys, or accountants who have a need to know for the business purpose and who are bound by confidentiality duties at least as protective as this Agreement.");
doc.p("The Receiving Party will protect Confidential Information using at least reasonable care and no less than the care it uses to protect its own similar confidential information.");
doc.h2("4. No License or Ownership Transfer");
doc.p("All Confidential Information remains the property of the Disclosing Party. No license, ownership interest, assignment, or other right is granted by this Agreement except the limited right to use Confidential Information for the stated business purpose.");
doc.h2("5. Required Disclosure");
doc.p("If the Receiving Party is required by law, court order, subpoena, or governmental request to disclose Confidential Information, the Receiving Party will, to the extent legally permitted, give prompt written notice to the Disclosing Party and reasonably cooperate with efforts to seek confidential treatment or limit disclosure.");
doc.h2("6. Return or Destruction");
doc.p("Upon written request, the Receiving Party will return or destroy the Disclosing Party's Confidential Information, except that the Receiving Party may retain archival copies required for legal, compliance, backup, or professional recordkeeping purposes, provided those copies remain subject to this Agreement.");
doc.h2("7. Term");
doc.p("This Agreement begins on the Effective Date and continues for three (3) years. The duty to protect trade secrets continues for as long as such information remains a trade secret under applicable law.");

doc.addPage();
doc.header();
doc.h2("8. No Obligation to Proceed");
doc.p("This Agreement does not require either Party to enter into any partnership, pilot program, revenue share agreement, purchase, license, or other commercial transaction. Any such arrangement must be documented in a separate written agreement signed by both Parties.");
doc.h2("9. Marketing and Publicity");
doc.p("The Parties may publicly announce, advertise, and promote the availability of Pin2Win entertainment services at Partner's location, including through websites, social media, email, in-location signage, digital displays, customer communications, and other ordinary marketing channels.");
doc.p("Each Party may use the other Party's name, logo, location name, trademarks, screenshots, QR codes, challenge names, and related brand assets as reasonably necessary to promote the partnership and customer participation, provided such use is accurate, professional, and not misleading.");
doc.p("This section does not permit either Party to disclose Confidential Information, non-public financial terms, trade secrets, private customer information, or unreleased product plans without prior written consent. Either Party may request correction or removal of inaccurate or inappropriate marketing use.");
doc.h2("10. Limited Partner Non-Competition and Non-Circumvention");
doc.p("For eighteen (18) months after the Effective Date, Partner will not, directly or indirectly, use Pin2Win Confidential Information to create, operate, market, sell, sponsor, or assist a competing paid golf simulator challenge, tournament-entry, player eligibility, prize administration, or location revenue-tracking platform or program that is substantially similar to Pin2Win's disclosed business model, technology workflow, or partner program.");
doc.p("During the same eighteen (18) month period, Partner will not use Pin2Win Confidential Information to circumvent Pin2Win by soliciting, contracting with, or assisting any third party introduced by Pin2Win for the purpose of developing or operating a competing paid golf simulator challenge, tournament-entry, player eligibility, prize administration, or location revenue-tracking platform or program. This restriction is limited to the State of Texas and to the specific business activities described in this section.");
doc.p("Nothing in this section prohibits Partner from operating its existing golf simulator business, hosting ordinary leagues or events at its own location, using general industry knowledge, or working with vendors on products or services that do not misuse Pin2Win Confidential Information.");
doc.h2("11. Remedies");
doc.p("The Parties acknowledge that unauthorized disclosure or misuse of Confidential Information may cause irreparable harm for which monetary damages may be inadequate. The Disclosing Party may seek injunctive relief, equitable relief, and any other remedies available at law or in equity.");
doc.h2("12. Governing Law and Venue");
doc.p("This Agreement will be governed by the laws of the State of Texas, without regard to conflict-of-law principles. The Parties consent to venue in the state or federal courts located in Bexar County, Texas, unless otherwise agreed in writing.");

doc.addPage();
doc.header();
doc.h2("13. Entire Agreement");
doc.p("This Agreement is the entire agreement between the Parties regarding confidentiality for the business purpose described above and supersedes prior discussions or agreements on that subject. This Agreement may be amended only in a writing signed by both Parties.");
doc.h2("14. Counterparts and Electronic Signatures");
doc.p("This Agreement may be signed in counterparts, including by electronic signature or scanned signature, each of which will be deemed an original and together will constitute one agreement.");
doc.h2("Signatures");
doc.signatureTable();

function buildPdf(pages) {
  const objects = [];
  const pageRefs = [];
  const add = (body) => {
    objects.push(body);
    return objects.length;
  };
  const fontRegular = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBold = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  for (const pageOps of pages) {
    const stream = pageOps.join("\n");
    const contentRef = add(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
    const pageRef = add(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentRef} 0 R >>`);
    pageRefs.push(pageRef);
  }

  const pagesRef = add(`<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`);
  const catalogRef = add(`<< /Type /Catalog /Pages ${pagesRef} 0 R >>`);
  const patched = objects.map((body) => body.replaceAll("/Parent 0 0 R", `/Parent ${pagesRef} 0 R`));
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  patched.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${patched.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${patched.length + 1} /Root ${catalogRef} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(pdf, "binary");
}

writeFileSync(outputPath, buildPdf(doc.pages));
console.log(outputPath);

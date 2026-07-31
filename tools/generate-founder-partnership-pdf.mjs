import { writeFileSync } from "node:fs";

const outputPath = "docs/pin2win-founder-partnership-agreement.pdf";
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
    this.text("PIN2WIN FOUNDER PARTNERSHIP AGREEMENT", margin, height - 30, 8.5, green, "F2");
    this.text("Draft for legal review", width - margin - 92, height - 30, 8, muted);
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
    this.ensure(34);
    this.text(value, margin, this.y, 14, green, "F2");
    this.y -= 18;
  }

  p(value) {
    this.ensure(64);
    const used = this.wrapped(value, margin, this.y, width - margin * 2, 10.2, ink, 13.7);
    this.y -= used + 8;
  }

  bullet(value) {
    this.ensure(38);
    this.text("•", margin + 3, this.y, 10.5, green, "F2");
    const used = this.wrapped(value, margin + 17, this.y, width - margin * 2 - 17, 9.9, ink, 13.2);
    this.y -= used + 5;
  }

  callout(label, value) {
    this.ensure(88);
    const x = margin;
    const w = width - margin * 2;
    const lines = wrap(value, 9.8, w - 26);
    const h = 39 + lines.length * 13;
    this.rect(x, this.y - h + 8, w, h, lightGreen, green);
    this.text(label, x + 13, this.y - 10, 10.5, green, "F2");
    this.wrapped(value, x + 13, this.y - 27, w - 26, 9.8, ink, 13);
    this.y -= h + 10;
  }

  table(headers, rows, widths) {
    const totalW = widths.reduce((sum, value) => sum + value, 0);
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
      const lineGroups = row.map((cell, index) => wrap(cell, 8.65, widths[index] - 14));
      const rowH = Math.max(...lineGroups.map((lines) => lines.length)) * 11.5 + 16;
      this.ensure(rowH + 12);
      let cellX = x;
      row.forEach((cell, index) => {
        this.rect(cellX, this.y - rowH, widths[index], rowH, cream, border);
        this.wrapped(cell, cellX + 7, this.y - 14, widths[index] - 14, 8.65, ink, 11.5);
        cellX += widths[index];
      });
      this.y -= rowH;
    });
    this.y -= 14;
  }

  signatures() {
    this.ensure(220);
    this.table(
      ["Christian Jans", "Pete Sanchez"],
      [[
        "Signature: ________________________________\nPrinted name: Christian Jans\nDate: ____________________________________",
        "Signature: ________________________________\nPrinted name: Pete Sanchez\nDate: ____________________________________",
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
doc.wrapped("Founder Partnership Agreement", 54, 615, 470, 32, [1, 1, 1], 38);
doc.wrapped(
  "Draft agreement between Christian Jans and Pete Sanchez outlining a 50/50 partnership, initial capital contributions, founder obligations, spending authority, decision rights, and operating cost ground rules.",
  54,
  485,
  465,
  14,
  [0.85, 0.91, 0.77],
  21,
);
doc.text("Prepared for legal and business review", 54, 90, 12, [0.85, 0.91, 0.77], "F2");
doc.text("May 2026", 54, 70, 10, [0.85, 0.91, 0.77]);

doc.addPage();
doc.header();
doc.h1("Founder Partnership Agreement");
doc.p("This Founder Partnership Agreement (\"Agreement\") is entered into as of ______________________, 20____ (\"Effective Date\"), by and between Christian Jans (\"Christian\") and Pete Sanchez (\"Pete\"). Christian and Pete may each be referred to as a \"Founder\" and collectively as the \"Founders.\"");
doc.p("The Founders intend to own and operate the business currently known as Pin2Win (\"Company\"), including its golf simulator challenge platform, partner location program, marketing operations, revenue tracking, and related business opportunities.");
doc.callout("Important", "This Agreement is intended to establish business expectations between the Founders. If Pin2Win is or becomes a limited liability company, corporation, or other legal entity, this Agreement should be incorporated into or replaced by a formal company agreement, operating agreement, shareholder agreement, or similar governing document prepared or reviewed by legal counsel.");
doc.h2("1. Ownership");
doc.p("Subject to the terms of this Agreement and any final governing documents, Christian and Pete will each own fifty percent (50%) of the Company. Ownership is intended to be equal as between the Founders.");
doc.p("No Founder may transfer, pledge, sell, assign, or encumber any ownership interest in the Company without the prior written consent of the other Founder, except as expressly allowed in a later written agreement.");
doc.h2("2. Initial Capital Contributions");
doc.table(
  ["Founder", "Initial Contribution", "Purpose"],
  [
    ["Christian Jans", "$10,000 buy-in contribution", "Initial Company capitalization, operating runway, launch costs, and agreed business expenses."],
    ["Pete Sanchez", "$10,000 matching contribution", "Initial Company capitalization, operating runway, launch costs, and agreed business expenses."],
  ],
  [130, 160, 230],
);
doc.p("The initial contributions will be deposited into a Company bank account or otherwise tracked in Company records. The Founders agree that these initial contributions are equal and support the 50/50 ownership structure.");

doc.addPage();
doc.header();
doc.h2("3. Operating Costs and Additional Capital");
doc.p("The Founders agree that equal ownership does not mean that every future operating cost is automatically owed 50/50 without discussion, approval, and planning. No Founder is personally obligated to fund additional operating costs, vendor expenses, advertising spend, legal fees, software subscriptions, travel, contractor payments, or other Company expenses unless such expense is approved under this Agreement.");
doc.p("The Company will operate from an approved budget. Any expense outside the approved budget, any single expense greater than $500, any recurring expense greater than $250 per month, or any capital call must be approved in writing by both Founders before either Founder is expected to pay or reimburse such amount.");
doc.p("If additional capital is needed, the Founders must agree in writing to the amount, timing, use of funds, and treatment of the contribution. Unless otherwise agreed in writing, any additional funds advanced by a Founder beyond the initial $10,000 contribution will be treated as a Company loan, not as an automatic ownership increase, dilution, or mandatory matching obligation by the other Founder.");
doc.p("No Founder may commit the Company or the other Founder to debt, credit, loans, guarantees, leases, or long-term obligations without prior written approval from both Founders.");
doc.h2("4. Founder Roles and Primary Responsibilities");
doc.table(
  ["Christian Jans", "Pete Sanchez"],
  [[
    "Engineering and product development; platform architecture; website, admin portal, QR flow, location/revenue systems, and technical maintenance; online marketing strategy and execution; digital content coordination; analytics and conversion tracking; initial $10,000 buy-in contribution.",
    "Matching $10,000 capital contribution; new partner development outreach; golf simulator venue relationships; sales strategy; business development expertise; financial oversight; budget review; partner pipeline management; revenue reporting review; support with sponsorships and strategic business relationships.",
  ]],
  [260, 260],
);
doc.h2("5. Time, Effort, and Good Faith");
doc.p("Each Founder will use commercially reasonable efforts to advance the Company within that Founder's role. The Founders acknowledge that their contributions may not be identical in form. Christian's contributions are expected to include substantial technical and online marketing labor. Pete's contributions are expected to include substantial business development, partner outreach, financial review, and relationship-based growth efforts.");

doc.addPage();
doc.header();
doc.h2("6. Management and Decision-Making");
doc.p("Day-to-day decisions within a Founder's assigned role may be made by that Founder, provided such decisions are consistent with the approved budget and agreed business plan.");
doc.p("The following decisions require written approval from both Founders:");
doc.bullet("Any ownership change, dilution, sale, merger, or admission of a new owner.");
doc.bullet("Any debt, loan, credit line, guarantee, or financing arrangement.");
doc.bullet("Any expense outside the approved budget or above the thresholds in Section 3.");
doc.bullet("Any revenue share, exclusive partner agreement, or material contract.");
doc.bullet("Any hiring of employees, contractors, agencies, or professional service providers above approved budget limits.");
doc.bullet("Any settlement, lawsuit, legal filing, or material legal position.");
doc.bullet("Any change to pricing, partner economics, or prize structure that materially affects the business model.");
doc.h2("7. Budgeting, Accounting, and Financial Oversight");
doc.p("The Founders will maintain accurate Company books and records. Pete will have primary responsibility for financial oversight and budget review, while Christian will provide access to platform revenue data, payment records, analytics, and technical reporting needed for accurate financial review.");
doc.p("The Company should maintain a separate Company bank account. Company funds should not be commingled with either Founder's personal funds. Monthly financial summaries should be made available to both Founders, including cash balance, revenue, expenses, approved budget variance, partner revenue, and expected near-term obligations.");
doc.h2("8. Compensation and Distributions");
doc.p("No Founder will receive salary, guaranteed payments, consulting fees, or reimbursement for personal time unless approved in writing by both Founders. Profits, if any, will be distributed 50/50 after payment of Company expenses, taxes, reserves, approved debts, and any agreed reinvestment amount.");

doc.addPage();
doc.header();
doc.h2("9. Intellectual Property");
doc.p("All Company-related software, source code, designs, documentation, workflows, branding, websites, domain assets, marketing materials, partner onboarding materials, data structures, and business processes created by either Founder for the Company after the Effective Date will be treated as Company assets, subject to final legal documentation.");
doc.p("Christian may have created software, code, designs, concepts, or other intellectual property before this Agreement. The Founders should identify any pre-existing intellectual property in an attached schedule. Any pre-existing assets used by the Company should be licensed or assigned to the Company under terms approved by both Founders.");
doc.h2("10. Confidentiality and Company Opportunities");
doc.p("Each Founder will keep Company confidential information confidential and will not use Company information for personal benefit outside the Company. Each Founder will present Company-related partner opportunities, sponsorship opportunities, platform opportunities, and investor opportunities to the Company before pursuing them personally or through another business.");
doc.h2("11. Deadlock and Dispute Resolution");
doc.p("Because the Founders are equal owners, deadlocks may occur. If the Founders cannot agree on a material decision, they will first meet in good faith within five (5) business days to attempt resolution. If the matter remains unresolved, the Founders will submit the dispute to a mutually agreed mediator in Bexar County, Texas before filing litigation, except for emergency injunctive relief.");
doc.p("If a deadlock prevents the Company from operating for more than thirty (30) days, the Founders will negotiate in good faith regarding a buyout, sale, restructuring, or orderly wind-down.");
doc.h2("12. Exit, Buyout, or Separation");
doc.p("Neither Founder may force the other Founder to fund the business beyond approved obligations. If a Founder wishes to leave, stop contributing, sell ownership, or materially reduce involvement, the Founders will negotiate a written separation or buyout agreement addressing ownership, intellectual property, debts, partner relationships, confidentiality, non-disparagement, and transition obligations.");

doc.addPage();
doc.header();
doc.h2("13. Standards of Conduct");
doc.p("Each Founder will act in good faith, avoid self-dealing, communicate material business information promptly, and avoid making statements or commitments that materially harm the Company or the other Founder's business reputation.");
doc.h2("14. Governing Law");
doc.p("This Agreement will be governed by the laws of the State of Texas. The Founders consent to venue in the state or federal courts located in Bexar County, Texas, unless otherwise agreed in writing.");
doc.h2("15. Entire Agreement; Amendments");
doc.p("This Agreement reflects the Founders' current understanding regarding ownership, contributions, roles, expenses, and governance. It may be amended only in a writing signed by both Founders.");
doc.h2("Signatures");
doc.signatures();
doc.p("Draft for legal review. The Founders should have this Agreement reviewed by an attorney and coordinated with the Company's formal entity documents, tax classification, ownership records, and operating agreement.");

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

import { writeFileSync } from "node:fs";

const outputPath = "docs/Pin2Win_Partner_Commercial_Proposal.pdf";
const width = 612;
const height = 792;
const margin = 46;
const green = [47 / 255, 107 / 255, 63 / 255];
const lightGreen = [232 / 255, 242 / 255, 221 / 255];
const ink = [24 / 255, 33 / 255, 31 / 255];
const muted = [86 / 255, 96 / 255, 90 / 255];
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
  return String(text).length * size * 0.52;
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
      this.op(`${rgb(stroke)} RG 0.8 w`);
    }
    this.op(`${x} ${y} ${w} ${h} re ${fill && stroke ? "B" : fill ? "f" : "S"}`);
  }

  line(x1, y1, x2, y2, color = border, thickness = 1) {
    this.op(`${rgb(color)} RG ${thickness} w ${x1} ${y1} m ${x2} ${y2} l S`);
  }

  text(value, x, y, size = 11, color = ink, font = "F1") {
    this.op(`${rgb(color)} rg BT /${font} ${size} Tf ${x} ${y} Td (${esc(value)}) Tj ET`);
  }

  wrapped(value, x, y, maxWidth, size = 11, color = ink, leading = size * 1.35) {
    const lines = wrap(value, size, maxWidth);
    lines.forEach((line, index) => this.text(line, x, y - index * leading, size, color));
    return lines.length * leading;
  }

  ensure(space) {
    if (this.y - space < margin) {
      this.addPage();
      this.header("Partner Commercial Proposal");
    }
  }

  header(title) {
    this.text("PIN2WIN", margin, height - 30, 9, green, "F2");
    this.text(title, width - margin - textWidth(title, 8), height - 30, 8, muted);
    this.line(margin, height - 42, width - margin, height - 42, border, 0.7);
    this.y = height - 62;
  }

  h1(value) {
    this.ensure(44);
    this.text(value, margin, this.y, 22, ink, "F2");
    this.y -= 12;
    this.line(margin, this.y, width - margin, this.y, green, 2);
    this.y -= 22;
  }

  h2(value) {
    this.ensure(30);
    this.text(value, margin, this.y, 15, green, "F2");
    this.y -= 20;
  }

  p(value) {
    this.ensure(70);
    const used = this.wrapped(value, margin, this.y, width - margin * 2, 10.8, ink, 14.7);
    this.y -= used + 8;
  }

  bullets(items) {
    for (const item of items) {
      this.ensure(34);
      this.text("•", margin + 4, this.y, 11, green, "F2");
      const used = this.wrapped(item, margin + 18, this.y, width - margin * 2 - 18, 10.4, ink, 14);
      this.y -= used + 5;
    }
    this.y -= 4;
  }

  callout(label, value) {
    this.ensure(82);
    const x = margin;
    const w = width - margin * 2;
    const lines = wrap(value, 10.3, w - 28);
    const h = 30 + lines.length * 14;
    this.rect(x, this.y - h + 10, w, h, lightGreen, green);
    this.text(label, x + 14, this.y - 10, 11, green, "F2");
    this.wrapped(value, x + 14, this.y - 27, w - 28, 10.3, ink, 14);
    this.y -= h + 10;
  }

  cards(cards) {
    const gap = 12;
    const cardW = (width - margin * 2 - gap) / 2;
    for (let i = 0; i < cards.length; i += 2) {
      this.ensure(116);
      const row = cards.slice(i, i + 2);
      const yTop = this.y;
      row.forEach((card, index) => {
        const x = margin + index * (cardW + gap);
        this.rect(x, yTop - 96, cardW, 96, cream, border);
        this.text(card.title, x + 12, yTop - 20, 10.5, green, "F2");
        this.wrapped(card.text, x + 12, yTop - 40, cardW - 24, 9.7, ink, 12.8);
      });
      this.y -= 110;
    }
  }

  table(headers, rows, columnWidths) {
    const x = margin;
    const totalW = width - margin * 2;
    const widths = columnWidths ?? headers.map(() => totalW / headers.length);
    this.ensure(58);
    this.rect(x, this.y - 24, totalW, 24, dark, null);
    let cx = x;
    headers.forEach((header, index) => {
      this.text(header, cx + 7, this.y - 16, 8.2, [1, 1, 1], "F2");
      cx += widths[index];
    });
    this.y -= 24;

    rows.forEach((row) => {
      const cellLines = row.map((cell, index) => wrap(cell, 8.6, widths[index] - 14));
      const rowH = Math.max(...cellLines.map((lines) => lines.length)) * 11.5 + 16;
      this.ensure(rowH + 14);
      let cellX = x;
      row.forEach((cell, index) => {
        this.rect(cellX, this.y - rowH, widths[index], rowH, [1, 0.992, 0.973], border);
        this.wrapped(cell, cellX + 7, this.y - 14, widths[index] - 14, 8.6, ink, 11.5);
        cellX += widths[index];
      });
      this.y -= rowH;
    });
    this.y -= 16;
  }
}

const doc = new PdfDoc();

doc.addPage(dark);
doc.rect(0, 0, width, height, dark, null);
doc.rect(0, 0, 14, height, green, null);
doc.text("PIN2WIN", 54, 710, 15, [0.659, 0.784, 0.471], "F2");
doc.wrapped("Partner Commercial Proposal", 54, 615, 460, 36, [1, 1, 1], 42);
doc.wrapped(
  "A 90-day launch partnership proposal with three commercial structures: revenue share only, hybrid revenue share plus rent, or flat monthly rent with a three-month deferred start.",
  54,
  500,
  470,
  14,
  [0.85, 0.91, 0.77],
  21,
);
doc.text("Prepared for partner discussion", 54, 90, 12, [0.85, 0.91, 0.77], "F2");
doc.text("June 2026", 54, 70, 10, [0.85, 0.91, 0.77]);

doc.addPage();
doc.header("Executive Summary");
doc.h1("Executive Summary");
doc.p("Pin2Win is proposing a flexible launch partnership with the partner location. The purpose of this proposal is not to force a permanent structure on day one, but to agree on a practical 90-day launch model that allows both parties to prove demand, measure revenue, and decide what structure makes the most sense after real operating data is available.");
doc.callout("Recommended launch approach", "Pin2Win recommends beginning with a 90-day launch pilot using either Scenario 1 or Scenario 2. Scenario 1 is the cleanest launch option, while Scenario 2 is a balanced option if the partner wants some predictable monthly income.");
doc.cards([
  { title: "Scenario 1", text: "20% revenue share with no monthly rent. Best for highest partner upside and lowest launch friction." },
  { title: "Scenario 2", text: "10% revenue share plus $500 per month. Best for balancing guaranteed monthly income with upside." },
  { title: "Scenario 3", text: "$1,000 per month flat rent with the first three months deferred. Best if the partner prefers predictable rent." },
  { title: "Launch review", text: "After 90 days, both parties review participation, revenue, customer response, and the best next structure." },
]);

doc.addPage();
doc.header("Launch Plan");
doc.h1("90-Day Launch Pilot");
doc.p("The initial launch period would focus on proving customer interest in Pin2Win challenges, creating incremental activity around the partner's simulator bays, and testing the player entry, payment, leaderboard, and reporting workflow.");
doc.h2("Pilot Goals");
doc.bullets([
  "Prove customer interest in Pin2Win challenges.",
  "Create incremental activity around simulator bays.",
  "Test the player entry, payment, leaderboard, and reporting workflow.",
  "Build a repeatable promotional rhythm for future events.",
  "Review actual revenue and participation before locking in a longer-term structure.",
]);
doc.callout("Meeting positioning", "We are not asking the partner to pick a permanent structure immediately. The goal is to agree on a launch model, prove demand, and review results after 90 days.");

doc.addPage();
doc.header("Partner Value");
doc.h1("Partner Value");
doc.cards([
  { title: "New revenue stream", text: "Pin2Win creates a revenue opportunity tied to challenges, events, paid entries, and future promotional formats." },
  { title: "Repeat visits", text: "Challenges give players a reason to return between leagues, lessons, or casual simulator sessions." },
  { title: "Low staff burden", text: "QR-based entry and Pin2Win-managed reporting keep the workflow simple for venue staff." },
  { title: "Marketing content", text: "Leaderboards, winners, and event nights create natural social and customer-engagement moments." },
]);
doc.h2("What Pin2Win Provides");
doc.bullets([
  "Challenge setup and event structure.",
  "QR code and player entry workflow.",
  "Payment and player entry process.",
  "Revenue tracking and monthly partner reporting.",
  "Leaderboard or results workflow, where applicable.",
  "Launch support for on-site promotion.",
  "Basic staff instructions so the venue can direct players without adding operational complexity.",
]);

doc.addPage();
doc.header("Scenario 1");
doc.h1("Scenario 1: Revenue Share Only");
doc.p("Under this scenario, Pin2Win would pay the partner a revenue share equal to 20% of qualifying revenue generated through the partnership.");
doc.table(
  ["Term", "Detail"],
  [
    ["Monthly rent", "$0"],
    ["Revenue share", "20% of qualifying Pin2Win revenue"],
    ["Deferred period", "Not applicable because no monthly rent is due"],
    ["Suggested initial term", "90-day launch pilot"],
    ["Partner upside", "Highest participation in Pin2Win revenue growth"],
    ["Pin2Win benefit", "Lowest fixed monthly operating cost during the scaling phase"],
  ],
  [150, 370],
);
doc.h2("Best Fit");
doc.p("This structure is best suited for a partner who wants to participate directly in Pin2Win's upside and is comfortable tying compensation to actual business performance during the launch period.");
doc.h2("Business Rationale");
doc.p("This option keeps Pin2Win's fixed costs low while the business is scaling. In return, the partner receives a larger share of revenue and benefits more directly as Pin2Win participation, event volume, and customer engagement grow.");

doc.addPage();
doc.header("Scenario 2");
doc.h1("Scenario 2: Hybrid Revenue Share and Monthly Rent");
doc.p("Under this scenario, Pin2Win would pay the partner a reduced revenue share plus a modest monthly rent payment.");
doc.table(
  ["Term", "Detail"],
  [
    ["Monthly rent", "$500 per month"],
    ["Revenue share", "10% of qualifying Pin2Win revenue"],
    ["Deferred period", "None unless separately agreed in writing"],
    ["Suggested initial term", "90-day launch pilot"],
    ["Partner upside", "Combination of predictable monthly rent and performance-based revenue share"],
    ["Pin2Win benefit", "Lower fixed rent than a flat-rent model while still sharing upside with the partner"],
  ],
  [150, 370],
);
doc.h2("Best Fit");
doc.p("This structure is best suited for a partner who wants some predictable monthly income while still participating in the growth of Pin2Win revenue.");
doc.h2("Business Rationale");
doc.p("The hybrid model balances risk and reward for both parties. The partner receives a guaranteed monthly amount, while Pin2Win maintains a manageable cost structure and continues to share revenue as the business scales.");

doc.addPage();
doc.header("Scenario 3");
doc.h1("Scenario 3: Flat Monthly Rent With Deferred Start");
doc.p("Under this scenario, Pin2Win would pay the partner a flat monthly rent of $1,000 per month, with the first three months deferred.");
doc.table(
  ["Term", "Detail"],
  [
    ["Monthly rent", "$1,000 per month"],
    ["Revenue share", "None"],
    ["Deferred period", "First 3 months"],
    ["Rent obligation during deferred period", "$0 rent obligated to be paid during the first 3 months"],
    ["Rent start date", "Beginning in month 4, unless otherwise agreed in writing"],
    ["Partner upside", "Predictable fixed monthly rent after the deferred period"],
    ["Pin2Win benefit", "Low-cost runway while Pin2Win activates the location and scales demand"],
  ],
  [190, 330],
);
doc.h2("Best Fit");
doc.p("This structure is best suited for a partner who prefers predictable monthly rent over revenue participation, while still giving Pin2Win a low-cost launch period.");
doc.h2("Business Rationale");
doc.p("The deferred period gives Pin2Win time to build customer demand, refine operations, and grow revenue before taking on the full monthly rent obligation. This supports a more sustainable launch while giving the partner a clear fixed-rent model after the initial three-month period.");

doc.addPage();
doc.header("Comparison");
doc.h1("Scenario Comparison");
doc.table(
  ["Scenario", "Rent", "Share", "Launch Structure", "Best Fit"],
  [
    ["Revenue Share Only", "$0", "20%", "90-day pilot", "Highest upside and lowest launch friction"],
    ["Hybrid", "$500/mo", "10%", "90-day pilot", "Guaranteed income plus revenue upside"],
    ["Flat Rent With Deferred Start", "$1,000/mo", "0%", "3-month deferral", "Predictable rent after launch period"],
  ],
  [135, 65, 60, 115, 220],
);
doc.h2("Decision Guide");
doc.table(
  ["If the partner prefers...", "Best option"],
  [
    ["Maximum upside with no fixed rent during launch", "Scenario 1"],
    ["A balance of guaranteed rent and upside", "Scenario 2"],
    ["Predictable monthly income after a launch runway", "Scenario 3"],
  ],
  [360, 160],
);

doc.addPage();
doc.header("Reporting");
doc.h1("Reporting and Review");
doc.h2("Qualifying Revenue");
doc.p("For purposes of discussion, qualifying revenue may include revenue directly generated by Pin2Win activity at or through the partner location, including approved challenges, events, competitions, player entries, sponsorship activations, or related promotional activity.");
doc.p("The final definition of qualifying revenue should be confirmed in the partnership agreement so both parties have a clear understanding of what is included, what is excluded, and how revenue will be reported.");
doc.h2("Monthly Reporting");
doc.p("Pin2Win would provide partner reporting on a monthly basis for any scenario that includes revenue share. Reports may include qualifying revenue, revenue-share calculation, payment amount, and supporting transaction or event summary detail.");
doc.h2("90-Day Review");
doc.bullets([
  "Number of challenges or events run.",
  "Paid player entries.",
  "Revenue generated.",
  "Partner payment amount.",
  "Customer response and staff feedback.",
  "Recommended next structure for the following term.",
]);

doc.addPage();
doc.header("Meeting Agenda");
doc.h1("Meeting Discussion Points");
doc.bullets([
  "Which scenario best matches the partner's preference?",
  "Is a 90-day launch pilot acceptable?",
  "What simulator availability can the partner provide?",
  "What days or times are best for launch activity?",
  "Who will be the primary partner contact?",
  "What on-site promotion is realistic?",
  "How should monthly reporting and payment be handled?",
  "What launch date should both parties target?",
]);
doc.h2("Recommended Next Step");
doc.p("Pin2Win recommends selecting Scenario 1 or Scenario 2 for a 90-day launch pilot, confirming the operating details, and then converting the selected structure into a simple written partnership agreement.");
doc.callout("Close", "This gives both parties a low-risk way to launch, measure real results, and decide whether to continue, adjust, or expand the relationship after the first 90 days.");

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

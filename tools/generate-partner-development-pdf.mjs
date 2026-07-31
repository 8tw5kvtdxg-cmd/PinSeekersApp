import { writeFileSync } from "node:fs";

const outputPath = "docs/partner-development-marketing-plan.pdf";
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
      this.header("Pin2Win Partner Development Marketing Plan");
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
    const used = this.wrapped(value, margin, this.y, width - margin * 2, 11, ink, 15);
    this.y -= used + 8;
  }

  bullets(items) {
    for (const item of items) {
      this.ensure(34);
      this.text("•", margin + 4, this.y, 11, green, "F2");
      const used = this.wrapped(item, margin + 18, this.y, width - margin * 2 - 18, 10.5, ink, 14);
      this.y -= used + 5;
    }
    this.y -= 4;
  }

  callout(label, value) {
    this.ensure(82);
    const x = margin;
    const w = width - margin * 2;
    const lines = wrap(`${label}: ${value}`, 10.5, w - 28);
    const h = 28 + lines.length * 14;
    this.rect(x, this.y - h + 10, w, h, lightGreen, green);
    this.text(label, x + 14, this.y - 10, 11, green, "F2");
    this.wrapped(value, x + 14, this.y - 27, w - 28, 10.5, ink, 14);
    this.y -= h + 10;
  }

  cards(cards) {
    const gap = 12;
    const cardW = (width - margin * 2 - gap) / 2;
    for (let i = 0; i < cards.length; i += 2) {
      this.ensure(104);
      const row = cards.slice(i, i + 2);
      const yTop = this.y;
      row.forEach((card, index) => {
        const x = margin + index * (cardW + gap);
        this.rect(x, yTop - 86, cardW, 86, cream, border);
        this.text(card.title, x + 12, yTop - 20, 10, green, "F2");
        this.wrapped(card.text, x + 12, yTop - 38, cardW - 24, 9.5, ink, 12.5);
      });
      this.y -= 100;
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
      this.text(header, cx + 7, this.y - 16, 8.5, [1, 1, 1], "F2");
      cx += widths[index];
    });
    this.y -= 24;

    rows.forEach((row) => {
      const cellLines = row.map((cell, index) => wrap(cell, 8.8, widths[index] - 14));
      const rowH = Math.max(...cellLines.map((lines) => lines.length)) * 11.5 + 16;
      this.ensure(rowH + 14);
      let cellX = x;
      row.forEach((cell, index) => {
        this.rect(cellX, this.y - rowH, widths[index], rowH, [1, 0.992, 0.973], border);
        this.wrapped(cell, cellX + 7, this.y - 14, widths[index] - 14, 8.8, ink, 11.5);
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
doc.wrapped("Partner Development Marketing Plan", 54, 615, 440, 36, [1, 1, 1], 42);
doc.wrapped(
  "A field-sales strategy for recruiting golf simulator locations as Pin2Win partner venues, built around in-person outreach, simple pilots, location-level revenue tracking, and repeatable monthly challenges.",
  54,
  500,
  470,
  14,
  [0.85, 0.91, 0.77],
  21,
);
["SIMULATOR VENUES", "REVENUE SHARE", "MONTHLY CHALLENGES", "QR-BASED ENTRY"].forEach((pill, index) => {
  const x = 54 + (index % 2) * 205;
  const y = 400 - Math.floor(index / 2) * 42;
  doc.rect(x, y, 185, 27, green, null);
  doc.text(pill, x + 12, y + 9, 9, [1, 1, 1], "F2");
});
doc.text("Prepared for partner discussion", 54, 90, 12, [0.85, 0.91, 0.77], "F2");
doc.text("May 2026", 54, 70, 10, [0.85, 0.91, 0.77]);

doc.addPage();
doc.header("Executive Summary");
doc.h1("Executive Summary");
doc.p("Pin2Win's near-term growth should be driven by direct partner development: visiting indoor golf simulator locations, demonstrating a simple monthly competition model, and closing low-friction pilot partnerships.");
doc.callout("Core pitch", "Pin2Win helps indoor golf locations run monthly closest-to-pin and long-drive competitions. Players scan the location QR code, enter the challenge, pay through Pin2Win, play on the simulator, and the venue gets location-level revenue reporting.");
doc.cards([
  { title: "Primary objective", text: "Close 3 to 5 pilot partner locations in the first 30 days." },
  { title: "Primary audience", text: "Independent indoor golf venues, golf bars, teaching studios, club fitters, and private simulator lounges." },
  { title: "Primary offer", text: "A 30-day launch pilot with QR codes, signage, staff script, and tracked revenue by location." },
  { title: "Primary proof", text: "Paid entries, repeat visits, player engagement, location revenue, and reusable social content." },
]);
doc.h2("Why This Works");
doc.bullets([
  "Simulator venues need reasons for players to return between leagues.",
  "Monthly challenges are easier to explain than full league formats.",
  "QR entry keeps staff involvement light.",
  "Location-level reporting makes the revenue story tangible.",
  "Leaderboards, winners, and near misses create natural marketing content.",
]);

doc.addPage();
doc.header("Ideal Partner Profile");
doc.h1("Ideal Partner Profile");
doc.p("Early partner outreach should prioritize locations that already have player traffic, repeat customers, and a manager or owner who values events and community.");
doc.table(
  ["Partner Type", "Why It Fits", "Priority"],
  [
    ["Independent indoor golf venues", "Flexible decision-making, recurring players, event potential.", "Highest"],
    ["Golf bars and simulator lounges", "Food and beverage upside, social groups, event-night energy.", "Highest"],
    ["Club fitting and teaching studios", "Golf-focused customers and instructors who can promote competition.", "High"],
    ["Country clubs with simulator rooms", "Strong member base, but may require longer approval cycles.", "Medium"],
    ["Apartment or community simulator rooms", "Useful later once the model has stronger proof.", "Later"],
  ],
  [170, 270, 80],
);
doc.h2("Qualification Checklist");
doc.bullets([
  "Multiple simulator bays or steady simulator usage.",
  "Active leagues, lessons, fittings, events, or repeat player groups.",
  "Visible signage areas near front desk, bar, or bays.",
  "Owner, GM, or event manager can make partnership decisions.",
  "Staff is willing to mention the challenge during check-in.",
  "Location has social media or an email list for launch promotion.",
]);

doc.addPage();
doc.header("Partner Value Proposition");
doc.h1("Partner Value Proposition");
doc.cards([
  { title: "Incremental revenue", text: "Paid entries create a new revenue stream tied directly to the partner location." },
  { title: "More repeat visits", text: "Monthly competitions give players a reason to come back and improve their score." },
  { title: "Simple staff workflow", text: "Staff points players to QR signs. Pin2Win handles entry, payment, and reporting." },
  { title: "Marketing content", text: "Winners, leaderboards, and prize pots become reusable social and email content." },
]);
doc.h2("Recommended Pilot Offer");
doc.p("Lead with a low-friction revenue-share pilot for the first partner group. This reduces resistance and lets Pin2Win build proof before introducing setup fees or monthly platform fees.");
doc.table(
  ["Offer", "Partner Commitment", "Pin2Win Commitment"],
  [
    ["30-day pilot", "Display QR signage, brief staff, mention the challenge to players.", "Create location setup, QR codes, signage assets, and revenue log."],
    ["Revenue share", "Promote the challenge on-site and through owned channels.", "Track paid entries and provide monthly reporting."],
    ["Launch support", "Pick a launch date and share venue details.", "Provide launch copy, social assets, and staff script."],
  ],
  [110, 205, 205],
);

doc.addPage();
doc.header("Field Visit Strategy");
doc.h1("Field Visit Strategy");
doc.p("The first visit is not meant to close every location. The goal is to identify decision-makers, learn the venue's current event model, give a short demo, and schedule a follow-up conversation with the owner or GM.");
doc.callout("Opening line", "We help indoor golf locations run monthly closest-to-pin and long-drive competitions using QR codes. Players scan, enter, pay, and compete. The location gets tracked revenue and a reason for players to come back.");
doc.h2("Questions To Ask");
doc.bullets([
  "Do you currently run leagues, contests, or event nights?",
  "Which days or times are slower than you would like?",
  "Do your players respond well to competitive formats?",
  "Who handles events, marketing, or promotions?",
  "Would a monthly QR-based challenge be useful if setup was simple?",
  "How do you currently communicate with regular players?",
]);
doc.h2("Materials To Bring");
doc.bullets([
  "One-page partner flyer.",
  "QR demo card.",
  "Sample location dashboard and revenue screenshots.",
  "Sample poster or table tent.",
  "Simple pilot proposal.",
]);

doc.addPage();
doc.header("Week-By-Week Schedule");
doc.h1("Week-By-Week Partner Development Schedule");
doc.table(
  ["Week", "Focus", "Actions", "Target Outcome"],
  [
    ["1", "Sales kit", "Create flyer, demo script, sample QR card, FAQ, launch checklist, and pilot offer.", "Partner kit ready."],
    ["2", "Target list", "Build list of 25 to 50 simulator venues with contact, website, social, bay count, and notes.", "Prioritized outreach list."],
    ["3", "First visit wave", "Visit 8 to 12 venues. Identify decision-makers, qualify fit, show quick demo.", "5 to 8 warm follow-ups."],
    ["4", "Follow-up demos", "Send thank-you messages, demo links, and pilot one-pagers. Schedule owner demos.", "3 to 5 serious prospects."],
    ["5", "Pilot close", "Offer 30-day pilot, confirm revenue share, collect location details and bay names.", "1 to 3 signed pilots."],
    ["6", "Partner setup", "Create locations in admin portal, generate QR codes, prepare signage and staff script.", "Launch-ready venues."],
    ["7", "Launch support", "Install signage, brief staff, publish launch posts, visit during peak hours.", "First paid entries."],
    ["8", "Learn and expand", "Review entries, revenue, objections, signage placement, and staff adoption.", "Improved second wave."],
  ],
  [45, 110, 260, 105],
);

doc.addPage();
doc.header("Objection Handling");
doc.h1("Objection Handling");
doc.table(
  ["Objection", "Response"],
  [
    ["We already run leagues.", "That is a strength. Pin2Win is lighter than a league and gives casual players a way to compete without committing to a full schedule."],
    ["Will this be hard for staff?", "No. Staff only needs to point players to the QR code. Pin2Win handles entry, payment, and tracking."],
    ["Do we need new hardware?", "No. The partner uses existing simulator bays. Pin2Win adds QR entry, reporting, and challenge structure."],
    ["How do we know our revenue?", "Each partner has location-specific QR codes and a dependent revenue log."],
    ["What if players share the E6 code?", "The E6 code can be shared, but prize eligibility is tied to paid Pin2Win entries and verification."],
  ],
  [190, 330],
);
doc.h2("Partner Onboarding Checklist");
doc.bullets([
  "Location name, address, website, and main contact.",
  "Number of bays and bay names.",
  "Simulator software and current event formats.",
  "Revenue share terms and launch date.",
  "QR codes generated and signage printed.",
  "Staff script delivered.",
  "First social and email announcement scheduled.",
]);

doc.addPage();
doc.header("Success Metrics");
doc.h1("Success Metrics");
doc.cards([
  { title: "Partner pipeline", text: "25 to 50 qualified venues in the first target list." },
  { title: "First month close target", text: "3 to 5 pilot partner locations." },
  { title: "Visit activity", text: "8 to 12 venue visits per week during outreach waves." },
  { title: "Follow-up speed", text: "Send recap and next step within 24 to 48 hours after each warm visit." },
]);
doc.h2("Operational KPIs");
doc.bullets([
  "Venues visited.",
  "Decision-makers reached.",
  "Follow-up demos scheduled.",
  "Pilot partners closed.",
  "QR codes installed.",
  "Paid entries by location.",
  "Revenue by location.",
  "Staff-reported player feedback.",
]);
doc.callout("Recommended next step", "Create the first 30-location target list, finish the one-page partner flyer, and begin the first in-person visit wave within one week.");

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

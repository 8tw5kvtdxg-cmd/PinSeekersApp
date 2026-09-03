import fs from "node:fs";

const outputPath = "docs/Pin2Win_Partner_Social_Launch_Playbook.pdf";
const width = 612;
const height = 792;
const margin = 46;
const colors = {
  green: [47 / 255, 107 / 255, 63 / 255],
  lime: [232 / 255, 242 / 255, 221 / 255],
  ink: [24 / 255, 33 / 255, 31 / 255],
  muted: [86 / 255, 96 / 255, 90 / 255],
  cream: [251 / 255, 248 / 255, 241 / 255],
  border: [222 / 255, 214 / 255, 200 / 255],
  dark: [16 / 255, 24 / 255, 22 / 255],
  gold: [193 / 151, 67 / 255],
  white: [1, 1, 1],
};

function esc(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function rgb([r, g, b]) {
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

function textWidth(value, size) {
  return String(value).length * size * 0.5;
}

function wrap(value, size, maxWidth) {
  const lines = String(value).split(/\s+/);
  const result = [];
  let current = "";

  for (const word of lines) {
    const next = current ? `${current} ${word}` : word;
    if (!current || textWidth(next, size) <= maxWidth) current = next;
    else {
      result.push(current);
      current = word;
    }
  }
  if (current) result.push(current);
  return result;
}

class PdfDoc {
  constructor() {
    this.pages = [];
    this.page = null;
    this.y = height - margin;
  }

  addPage() {
    this.page = [];
    this.pages.push(this.page);
    this.y = height - margin;
    this.rect(0, 0, width, height, colors.cream, null);
    this.text("PIN2WIN", margin, height - 30, 9, colors.green, "F2");
    this.text("PARTNER SOCIAL LAUNCH PLAYBOOK", width - margin - 188, height - 30, 8, colors.muted);
    this.line(margin, height - 42, width - margin, height - 42, colors.border, 0.7);
    this.y = height - 70;
  }

  op(value) { this.page.push(value); }
  rect(x, y, w, h, fill, stroke = colors.border) {
    if (fill) this.op(`${rgb(fill)} rg`);
    if (stroke) this.op(`${rgb(stroke)} RG 0.8 w`);
    this.op(`${x} ${y} ${w} ${h} re ${fill && stroke ? "B" : fill ? "f" : "S"}`);
  }
  line(x1, y1, x2, y2, color = colors.border, thickness = 1) {
    this.op(`${rgb(color)} RG ${thickness} w ${x1} ${y1} m ${x2} ${y2} l S`);
  }
  text(value, x, y, size = 11, color = colors.ink, font = "F1") {
    this.op(`${rgb(color)} rg BT /${font} ${size} Tf ${x} ${y} Td (${esc(value)}) Tj ET`);
  }
  paragraph(value, size = 10.5, color = colors.ink, leading = 14) {
    const lines = wrap(value, size, width - margin * 2);
    lines.forEach((line, index) => this.text(line, margin, this.y - index * leading, size, color));
    this.y -= lines.length * leading + 9;
  }
  heading(value) {
    this.text(value, margin, this.y, 23, colors.ink, "F2");
    this.y -= 14;
    this.line(margin, this.y, width - margin, this.y, colors.green, 2);
    this.y -= 24;
  }
  subheading(value) {
    this.text(value, margin, this.y, 15, colors.green, "F2");
    this.y -= 21;
  }
  bullet(value) {
    this.text("•", margin + 3, this.y, 11, colors.green, "F2");
    const lines = wrap(value, 10.2, width - margin * 2 - 18);
    lines.forEach((line, index) => this.text(line, margin + 18, this.y - index * 14, 10.2));
    this.y -= lines.length * 14 + 6;
  }
  bullets(value) {
    if (Array.isArray(value)) {
      value.forEach((item) => this.bullet(item));
      return;
    }

    this.bullet(value);
  }
  callout(label, value, fill = colors.lime) {
    const lines = wrap(value, 10.2, width - margin * 2 - 28);
    const boxHeight = 31 + lines.length * 14;
    this.rect(margin, this.y - boxHeight + 10, width - margin * 2, boxHeight, fill, colors.green);
    this.text(label, margin + 14, this.y - 11, 10.5, colors.green, "F2");
    lines.forEach((line, index) => this.text(line, margin + 14, this.y - 29 - index * 14, 10.2));
    this.y -= boxHeight + 13;
  }
  cards(items) {
    const gap = 12;
    const cardWidth = (width - margin * 2 - gap) / 2;
    for (let index = 0; index < items.length; index += 2) {
      const row = items.slice(index, index + 2);
      const top = this.y;
      const lines = row.map((item) => wrap(item.text, 9.4, cardWidth - 24));
      const cardHeight = Math.max(104, ...lines.map((set) => 40 + set.length * 13));
      row.forEach((item, cardIndex) => {
        const x = margin + cardIndex * (cardWidth + gap);
        this.rect(x, top - cardHeight + 10, cardWidth, cardHeight, colors.white, colors.border);
        this.text(item.title, x + 12, top - 20, 10.4, colors.green, "F2");
        lines[cardIndex].forEach((line, lineIndex) => this.text(line, x + 12, top - 40 - lineIndex * 13, 9.4));
      });
      this.y -= cardHeight + 14;
    }
  }
  numbered(items) {
    items.forEach((item, index) => {
      const lines = wrap(item, 10.2, width - margin * 2 - 42);
      const circleY = this.y - 4;
      this.rect(margin, circleY - 11, 22, 22, colors.green, colors.green);
      this.text(String(index + 1), margin + 8, circleY - 3, 9, colors.white, "F2");
      lines.forEach((line, lineIndex) => this.text(line, margin + 34, this.y - lineIndex * 14, 10.2));
      this.y -= lines.length * 14 + 13;
    });
  }
  table(headers, rows, widths) {
    const total = width - margin * 2;
    const columnWidths = widths ?? headers.map(() => total / headers.length);
    this.rect(margin, this.y - 25, total, 25, colors.dark, null);
    let x = margin;
    headers.forEach((header, index) => {
      this.text(header, x + 7, this.y - 16, 8.2, colors.white, "F2");
      x += columnWidths[index];
    });
    this.y -= 25;
    rows.forEach((row, rowIndex) => {
      const cellLines = row.map((cell, index) => wrap(cell, 8.8, columnWidths[index] - 14));
      const rowHeight = Math.max(30, ...cellLines.map((lines) => 10 + lines.length * 12));
      this.rect(margin, this.y - rowHeight, total, rowHeight, rowIndex % 2 ? colors.white : colors.cream, colors.border);
      let cellX = margin;
      cellLines.forEach((lines, index) => {
        lines.forEach((line, lineIndex) => this.text(line, cellX + 7, this.y - 15 - lineIndex * 12, 8.8));
        cellX += columnWidths[index];
      });
      this.y -= rowHeight;
    });
    this.y -= 16;
  }
  footer() {
    this.text("Pin2Win | Partner launch planning", margin, 25, 8, colors.muted);
  }
}

function buildPdf() {
  const doc = new PdfDoc();

  doc.addPage();
  doc.heading("Partner Social Launch Playbook");
  doc.text("ALAMO GOLF DEN × PIN2WIN", margin, doc.y, 10, colors.green, "F2");
  doc.y -= 25;
  doc.text("A practical roadmap to bring more local golfers into the challenge.", margin, doc.y, 15, colors.ink, "F2");
  doc.y -= 25;
  doc.paragraph("This playbook gives Alamo Golf Den and Pin2Win a repeatable way to create awareness, turn local attention into simulator bookings, and convert those visits into challenge entries. The approach is built around clear calls to action, short-form video, venue promotion, local targeting, and weekly measurement.", 11, colors.muted, 15);
  doc.callout("THE CORE OFFER", "Book a simulator bay at Alamo Golf Den, scan the Pin2Win QR code onsite, and take five shots for $20.");
  doc.subheading("The conversion path");
  doc.numbered([
    "See the challenge on social media or through Alamo Golf Den.",
    "Book simulator time at Alamo Golf Den.",
    "Scan the onsite Pin2Win QR code.",
    "Create an account or log in, then complete Square checkout.",
    "Enter the E6 event code and play.",
    "Submit the result and consider playing again.",
  ]);
  doc.subheading("What success looks like");
  doc.cards([
    { title: "Awareness", text: "Local golfers recognize the challenge and understand the prize, price, and location." },
    { title: "Action", text: "People click through, book a bay, scan the QR code, and complete an entry." },
    { title: "Experience", text: "Customers can move from payment to E6 play without confusion." },
    { title: "Momentum", text: "Results, reactions, and leaderboard updates create reasons to return." },
  ]);
  doc.footer();

  doc.addPage();
  doc.heading("Launch Foundations");
  doc.subheading("1. Make the message unmistakable");
  doc.paragraph("Every post should answer four questions quickly: What is it? Where is it? What does it cost? What should I do next? Keep the language consistent across Pin2Win, Alamo Golf Den, creator posts, and paid ads.");
  doc.callout("RECOMMENDED MESSAGE", "Think you can stick one? Book your bay at Alamo Golf Den, scan the Pin2Win QR code onsite, and take five shots for $20.");
  doc.subheading("2. Build one trackable campaign");
  doc.bullets("Use the same challenge landing page everywhere, with separate UTM tags for Instagram, TikTok, Facebook, Alamo Golf Den, and creator partners.");
  doc.bullets("Track landing-page visits, venue bookings, QR scans, paid entries, completed attempts, and repeat plays.");
  doc.bullets("Judge campaigns by paid entries and completed attempts, not likes alone.");
  doc.subheading("3. Activate the venue");
  doc.cards([
    { title: "Staff invitation", text: "Ask staff to mention the challenge at check-in and after a customer finishes a bay session." },
    { title: "Physical placement", text: "Place the QR poster and the customer steps poster together where customers wait or check in." },
    { title: "Booking touchpoints", text: "Add the challenge to the venue website, booking confirmation language, and social profile." },
    { title: "Reshares", text: "Have Alamo reshare Pin2Win videos, participant reactions, and leaderboard updates." },
  ]);
  doc.subheading("4. Use local proof");
  doc.paragraph("The best early content is real and local: the simulator, the target, the five-shot sequence, near-misses, customer reactions, and the current best result. Ask permission before reposting customer images or videos.");
  doc.footer();

  doc.addPage();
  doc.heading("Four-Week Content Plan");
  doc.table(["Week", "Objective", "Recommended content", "Primary CTA"], [
    ["Week 1", "Awareness", "Venue reveal, challenge announcement, simulator footage, poll: Would you take the shot?", "Book at Alamo Golf Den"],
    ["Week 2", "Demonstration", "Five-shot attempt, near-misses, E6 walkthrough, customer steps graphic", "See how it works"],
    ["Week 3", "Social proof", "Participant reactions, best attempts, leaderboard updates, friend tags", "Bring someone to try"],
    ["Week 4", "Urgency", "Countdowns, last-weekend reminders, current best result, group outing angle", "Book before it ends"],
  ], [55, 80, 285, 100]);
  doc.subheading("Suggested weekly cadence");
  doc.numbered([
    "Three short vertical videos showing the challenge, venue, or reactions.",
    "Two supporting photo or graphic posts with a clear local call to action.",
    "Stories on active challenge days with polls, countdowns, and reshares.",
    "One weekly leaderboard or best-attempt update.",
  ]);
  doc.subheading("Short-form video prompts");
  doc.cards([
    { title: "The fifth shot", text: "POV: your fifth shot is the one. Show the swing, ball flight, and reaction." },
    { title: "Would you take it?", text: "Ask a local golfer to predict whether they can make the shot before trying." },
    { title: "Five shots, one chance", text: "Show the full attempt quickly with a simple score or result overlay." },
    { title: "E6 access", text: "Show the event tab and explain that the code appears after payment is confirmed." },
  ]);
  doc.footer();

  doc.addPage();
  doc.heading("Distribution and Partnerships");
  doc.subheading("Local paid media");
  doc.paragraph("Start with a small test budget within roughly 5–15 miles of Alamo Golf Den. Test several vertical videos and move budget toward the creative that produces landing-page visits, QR scans, and paid entries.");
  doc.bullets("Target golf, indoor golf, simulator venues, Topgolf, sports entertainment, date nights, and local events.");
  doc.bullets("Use one clear action per ad: Book your bay, Try the challenge, or Bring a friend.");
  doc.bullets("Refresh creative when frequency rises or click-through declines.");
  doc.subheading("Local creator program");
  doc.numbered([
    "Invite San Antonio golf, sports, and entertainment creators for a supervised complimentary attempt.",
    "Give each creator the same facts: location, price, five shots, payment flow, QR requirement, and booking link.",
    "Ask them to show the actual venue, attempt, reaction, and next step rather than only a promotional graphic.",
    "Require clear disclosure for gifted or sponsored participation where applicable.",
  ]);
  doc.callout("CREATOR BRIEF", "Show the venue. Explain the five-shot challenge. Capture the attempt and reaction. Tell viewers to book Alamo Golf Den first, then scan the onsite QR code.");
  doc.subheading("Partner responsibilities");
  doc.table(["Pin2Win", "Alamo Golf Den", "Shared"], [
    ["Landing page, checkout, event-code flow, result capture", "Venue access, staff awareness, booking touchpoints", "Content approvals, customer experience, weekly review"],
    ["Track QR scans, entries, results, and repeat plays", "Reshare posts and invite customers onsite", "Collect permission for customer stories and reposts"],
  ], [175, 175, 170]);
  doc.footer();

  doc.addPage();
  doc.heading("Measurement and Weekly Review");
  doc.subheading("The funnel to monitor");
  doc.table(["Stage", "What to measure", "If it is weak"], [
    ["Awareness", "Video views and reach", "Improve the hook, local relevance, and first three seconds."],
    ["Interest", "Profile visits and link clicks", "Make the offer, location, price, and action clearer."],
    ["Intent", "Landing-page visits and venue bookings", "Reduce friction and strengthen the booking CTA."],
    ["Entry", "QR scans and paid entries", "Review onsite signage, staff prompts, and checkout clarity."],
    ["Completion", "E6 attempts and submitted results", "Make event-code and result-entry instructions more visible."],
    ["Repeat", "Play-again clicks and repeat entries", "Follow up with results, leaderboard updates, and limited-time urgency."],
  ], [75, 175, 270]);
  doc.subheading("Weekly decision rules");
  doc.bullets("High views but low clicks: revise the hook and call to action.");
  doc.bullets("High clicks but low bookings: improve the offer or booking handoff.");
  doc.bullets("High QR scans but low payments: simplify the account and Square experience.");
  doc.bullets("High payments but low completed attempts: improve staff prompts and E6 instructions.");
  doc.bullets("Strong first plays but weak repeats: feature results and make the next attempt easy to start.");
  doc.callout("PARTNER CHECK-IN", "Review the numbers once each week, choose the best-performing content, identify the biggest drop-off, and make one focused improvement before the next review.", colors.cream);
  doc.subheading("Ready-to-use caption");
  doc.paragraph("Think you can stick one? Book your simulator bay at Alamo Golf Den, scan the Pin2Win QR code onsite, and take five shots for your chance to win. Bring a friend and see who can get closest.", 11, colors.ink, 15);
  doc.footer();

  return doc;
}

function pdfBytes(doc) {
  const objects = [];
  const add = (content) => { objects.push(content); return objects.length; };
  const catalogId = add("<< /Type /Catalog /Pages 2 0 R /PageMode /UseNone >>");
  const pagesId = add("");
  const fontRegular = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBold = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageIds = [];

  for (const page of doc.pages) {
    const stream = Buffer.from(["q", ...page, "Q"].join("\n"));
    const contentId = add({ stream, dict: `<< /Length ${stream.length} >>` });
    const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  }
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  const chunks = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "binary")];
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets[index + 1] = Buffer.concat(chunks).length;
    chunks.push(Buffer.from(`${index + 1} 0 obj\n`));
    if (typeof object === "string") chunks.push(Buffer.from(`${object}\nendobj\n`));
    else {
      chunks.push(Buffer.from(`${object.dict}\nstream\n`));
      chunks.push(object.stream);
      chunks.push(Buffer.from("\nendstream\nendobj\n"));
    }
  });
  const body = Buffer.concat(chunks);
  const xrefOffset = body.length;
  const xref = ["xref", `0 ${objects.length + 1}`, "0000000000 65535 f ", ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `), "trailer", `<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>`, "startxref", String(xrefOffset), "%%EOF"].join("\n");
  return Buffer.concat([body, Buffer.from(xref)]);
}

fs.writeFileSync(outputPath, pdfBytes(buildPdf()));
console.log(outputPath);

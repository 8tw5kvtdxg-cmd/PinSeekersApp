import { readFileSync, writeFileSync } from "node:fs";

const inputPath = "docs/Pin2Win_Customer_Terms_and_Challenge_Rules_Draft.md";
const outputPath = "docs/Pin2Win_Customer_Terms_and_Challenge_Rules_Draft.pdf";
const width = 612;
const height = 792;
const margin = 52;
const ink = [24 / 255, 33 / 255, 31 / 255];
const muted = [86 / 255, 96 / 255, 90 / 255];
const green = [47 / 255, 107 / 255, 63 / 255];
const lime = [168 / 255, 200 / 255, 120 / 255];
const pale = [238 / 255, 247 / 255, 233 / 255];
const cream = [251 / 255, 248 / 255, 241 / 255];
const border = [222 / 255, 214 / 255, 200 / 255];
const dark = [16 / 255, 24 / 255, 22 / 255];
const white = [1, 1, 1];

function ascii(value) {
  return String(value)
    .replaceAll("—", "-")
    .replaceAll("–", "-")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("’", "'")
    .replaceAll("§", "Section")
    .replaceAll("©", "(c)")
    .replace(/[^\x20-\x7E]/g, "");
}

function plainMarkdown(value) {
  return ascii(value)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

function esc(value) {
  return ascii(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function rgb([r, g, b]) {
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

function textWidth(text, size, bold = false) {
  return ascii(text).length * size * (bold ? 0.525 : 0.49);
}

function wrap(text, size, maxWidth, bold = false) {
  const words = plainMarkdown(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (!current || textWidth(next, size, bold) <= maxWidth) current = next;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

class PdfDoc {
  constructor() {
    this.pages = [];
    this.page = null;
    this.y = height - margin;
    this.section = "CUSTOMER LEGAL PACKAGE";
  }

  op(value) {
    this.page.push(value);
  }

  rect(x, y, w, h, fill, stroke = border) {
    if (fill) this.op(`${rgb(fill)} rg`);
    if (stroke) this.op(`${rgb(stroke)} RG 0.75 w`);
    this.op(`${x} ${y} ${w} ${h} re ${fill && stroke ? "B" : fill ? "f" : "S"}`);
  }

  line(x1, y1, x2, y2, color = border, thickness = 1) {
    this.op(`${rgb(color)} RG ${thickness} w ${x1} ${y1} m ${x2} ${y2} l S`);
  }

  text(value, x, y, size = 10, color = ink, font = "F1") {
    this.op(`${rgb(color)} rg BT /${font} ${size} Tf ${x} ${y} Td (${esc(value)}) Tj ET`);
  }

  wrapped(value, x, y, maxWidth, size = 10, color = ink, leading = size * 1.35, font = "F1") {
    const lines = wrap(value, size, maxWidth, font === "F2");
    lines.forEach((line, index) => this.text(line, x, y - index * leading, size, color, font));
    return lines.length * leading;
  }

  addPage(section = this.section) {
    this.section = section;
    this.page = [];
    this.pages.push(this.page);
    this.rect(0, 0, width, height, cream, null);
    this.text("PIN2WIN", margin, height - 30, 9, green, "F2");
    this.text(section.toUpperCase(), margin + 59, height - 30, 7.6, muted, "F2");
    this.line(margin, height - 42, width - margin, height - 42, border, 0.7);
    this.y = height - 68;
  }

  ensure(space) {
    if (this.y - space < 48) this.addPage();
  }

  h1(value) {
    this.ensure(80);
    const lines = wrap(value, 22, width - margin * 2, true);
    lines.forEach((line, index) => this.text(line, margin, this.y - index * 27, 22, ink, "F2"));
    this.y -= lines.length * 27 + 6;
    this.line(margin, this.y, width - margin, this.y, green, 2);
    this.y -= 20;
  }

  h2(value) {
    const lines = wrap(value, 13.5, width - margin * 2, true);
    // Reserve the heading plus several lines of following body copy. This
    // prevents section titles from being stranded at the foot of a page.
    this.ensure(lines.length * 17 + 115);
    lines.forEach((line, index) => this.text(line, margin, this.y - index * 17, 13.5, green, "F2"));
    this.y -= lines.length * 17 + 8;
  }

  p(value) {
    const lines = wrap(value, 9.6, width - margin * 2);
    this.ensure(lines.length * 13.2 + 16);
    lines.forEach((line, index) => this.text(line, margin, this.y - index * 13.2, 9.6, ink));
    // A slightly larger paragraph gap improves scanability in dense legal
    // sections without loosening the individual lines excessively.
    this.y -= lines.length * 13.2 + 13;
  }

  listItem(value, marker = null) {
    const textX = margin + 17;
    const lines = wrap(value, 9.4, width - margin * 2 - 17);
    this.ensure(lines.length * 13 + 10);
    if (marker) this.text(marker, margin, this.y, 9.4, green, "F2");
    else this.rect(margin + 1, this.y + 2, 4, 4, green, null);
    lines.forEach((line, index) => this.text(line, textX, this.y - index * 13, 9.4, ink));
    this.y -= lines.length * 13 + 7;
  }

  callout(value) {
    const lines = wrap(value, 9.7, width - margin * 2 - 34, true);
    const boxHeight = lines.length * 13.5 + 28;
    this.ensure(boxHeight + 14);
    this.rect(margin, this.y - boxHeight + 8, width - margin * 2, boxHeight, pale, green);
    this.rect(margin, this.y - boxHeight + 8, 6, boxHeight, green, null);
    lines.forEach((line, index) => this.text(line, margin + 18, this.y - 13 - index * 13.5, 9.7, ink, "F2"));
    this.y -= boxHeight + 9;
  }

  divider() {
    this.ensure(24);
    this.line(margin, this.y - 4, width - margin, this.y - 4, border, 0.8);
    this.y -= 20;
  }
}

const markdown = readFileSync(inputPath, "utf8");
const doc = new PdfDoc();

doc.page = [];
doc.pages.push(doc.page);
doc.rect(0, 0, width, height, dark, null);
doc.rect(0, 0, 14, height, green, null);
doc.rect(52, 695, 66, 29, green, null);
doc.text("PIN2WIN", 62, 705, 12, white, "F2");
doc.wrapped("Customer Terms and Challenge Rules", 52, 612, 490, 31, white, 37, "F2");
doc.wrapped("Terms of Use | Official $5,000 Hole-in-One Challenge Rules | Refund Policy | Privacy Policy", 52, 475, 466, 13.5, [0.86, 0.91, 0.79], 20);
doc.line(52, 383, 200, 383, lime, 4);
doc.text("LEGAL-REVIEW DRAFT - NOT APPROVED FOR PUBLICATION", 52, 106, 9, lime, "F2");
doc.text("Draft date: September 11, 2026", 52, 83, 10.5, white);
doc.text("2300 Nacogdoches Rd Apt 124F, San Antonio, TX 78209, United States", 52, 65, 9.5, [0.75, 0.8, 0.76]);

doc.addPage();

const lines = markdown.split(/\r?\n/);
let paragraph = [];
let skippedDocumentTitle = false;

function flushParagraph() {
  if (!paragraph.length) return;
  doc.p(paragraph.join(" "));
  paragraph = [];
}

for (const rawLine of lines) {
  const line = rawLine.trim();
  if (!line) {
    flushParagraph();
    continue;
  }

  if (line === "---") {
    flushParagraph();
    doc.divider();
    continue;
  }

  if (line.startsWith("# ")) {
    flushParagraph();
    if (!skippedDocumentTitle) {
      skippedDocumentTitle = true;
      continue;
    }
    const heading = plainMarkdown(line.slice(2));
    // Keep major parts on a fresh page unless the preceding part ends with a
    // short closing section and leaves enough room for a useful transition.
    // This avoids orphaning a few lines on an otherwise blank page.
    if (doc.y < 570) doc.addPage(heading);
    else doc.section = heading;
    doc.h1(heading);
    continue;
  }

  if (line.startsWith("## ")) {
    flushParagraph();
    doc.h2(plainMarkdown(line.slice(3)));
    continue;
  }

  if (line.startsWith("> ")) {
    flushParagraph();
    doc.callout(plainMarkdown(line.slice(2)));
    continue;
  }

  const ordered = line.match(/^(\d+)\.\s+(.+)$/);
  if (ordered) {
    flushParagraph();
    doc.listItem(ordered[2], `${ordered[1]}.`);
    continue;
  }

  if (line.startsWith("- ")) {
    flushParagraph();
    doc.listItem(line.slice(2));
    continue;
  }

  paragraph.push(line);
}
flushParagraph();

doc.pages.forEach((page, index) => {
  const originalPage = doc.page;
  doc.page = page;
  doc.line(margin, 33, width - margin, 33, border, 0.6);
  doc.text("LEGAL-REVIEW DRAFT - NOT FOR PUBLICATION", margin, 20, 7.2, muted, "F2");
  doc.text(`${index + 1} / ${doc.pages.length}`, width - margin - 26, 20, 7.2, muted, "F2");
  doc.page = originalPage;
});

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
if (process.env.PIN2WIN_TERMS_PREVIEW_DIR) {
  doc.pages.forEach((page, index) => {
    writeFileSync(
      `${process.env.PIN2WIN_TERMS_PREVIEW_DIR}/page-${index + 1}.pdf`,
      buildPdf([page]),
    );
  });
}
console.log(`${outputPath} (${doc.pages.length} pages)`);

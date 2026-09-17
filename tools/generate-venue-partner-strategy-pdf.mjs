import { readFileSync, writeFileSync } from "node:fs";

const sourcePath = "docs/BOOTS_ON_THE_GROUND_VENUE_PARTNER_STRATEGY.md";
const outputPath = "docs/BOOTS_ON_THE_GROUND_VENUE_PARTNER_STRATEGY.pdf";
const source = readFileSync(sourcePath, "utf8");
const width = 612;
const height = 792;
const margin = 50;
const cream = [0.985, 0.974, 0.951];
const dark = [0.066, 0.103, 0.093];
const ink = [0.13, 0.17, 0.15];
const muted = [0.34, 0.39, 0.36];
const green = [0.18, 0.42, 0.25];
const pale = [0.92, 0.95, 0.91];
const border = [0.85, 0.88, 0.84];
const white = [1, 1, 1];

function ascii(value) {
  return String(value)
    .replaceAll("—", "-")
    .replaceAll("–", "-")
    .replaceAll("’", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("**", "")
    .replaceAll("`", "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

function escaped(value) {
  return ascii(value).replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function rgb(value) {
  return value.map((part) => part.toFixed(3)).join(" ");
}

function wrap(value, size, maxWidth, bold = false) {
  const maxChars = Math.floor(maxWidth / (size * (bold ? 0.55 : 0.5)));
  const words = ascii(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const chunks = word.length > maxChars ? word.match(new RegExp(`.{1,${maxChars}}`, "g")) : [word];
    for (const chunk of chunks) {
      if (!line) line = chunk;
      else if (`${line} ${chunk}`.length <= maxChars) line += ` ${chunk}`;
      else {
        lines.push(line);
        line = chunk;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

class Pdf {
  pages = [];
  page = null;
  y = 0;
  section = "FIELD PLAYBOOK";

  op(value) { this.page.push(value); }
  rect(x, y, w, h, fill) { this.op(`${rgb(fill)} rg ${x} ${y} ${w} ${h} re f`); }
  rule(x1, y1, x2, y2, color = border, weight = 0.7) {
    this.op(`${rgb(color)} RG ${weight} w ${x1} ${y1} m ${x2} ${y2} l S`);
  }
  text(value, x, y, size = 10, color = ink, bold = false) {
    this.op(`${rgb(color)} rg BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${escaped(value)}) Tj ET`);
  }
  addPage(section = this.section) {
    this.section = section;
    this.page = [];
    this.pages.push(this.page);
    this.rect(0, 0, width, height, cream);
    this.text("PIN2WIN", margin, height - 31, 10, green, true);
    this.text(section.toUpperCase().slice(0, 48), margin + 76, height - 31, 7.8, muted, true);
    this.rule(margin, height - 43, width - margin, height - 43);
    this.y = height - 71;
  }
  ensure(space) { if (this.y - space < 56) this.addPage(); }
  heading(value, large = false) {
    const size = large ? 15 : 11.2;
    const lineHeight = large ? 19 : 15;
    const lines = wrap(value, size, width - margin * 2, true);
    this.ensure(lines.length * lineHeight + 28);
    lines.forEach((line, index) => this.text(line, margin, this.y - index * lineHeight, size, green, true));
    this.y -= lines.length * lineHeight + 8;
  }
  paragraph(value, indent = 0, color = ink) {
    const size = 9.25;
    const lineHeight = 12.9;
    const lines = wrap(value, size, width - margin * 2 - indent);
    this.ensure(lines.length * lineHeight + 9);
    lines.forEach((line, index) => this.text(line, margin + indent, this.y - index * lineHeight, size, color));
    this.y -= lines.length * lineHeight + 8;
  }
  bullet(value, number = null) {
    const lines = wrap(value, 9.25, width - margin * 2 - 20);
    this.ensure(lines.length * 12.9 + 8);
    if (number) this.text(`${number}.`, margin + 1, this.y, 9.2, green, true);
    else this.rect(margin + 4, this.y + 2, 4, 4, green);
    lines.forEach((line, index) => this.text(line, margin + 20, this.y - index * 12.9, 9.25));
    this.y -= lines.length * 12.9 + 7;
  }
  card(label, value) {
    const title = wrap(label, 9, width - margin * 2 - 25, true);
    const body = wrap(value, 9, width - margin * 2 - 25);
    const blockHeight = title.length * 12 + body.length * 12.4 + 19;
    this.ensure(blockHeight + 6);
    this.rect(margin, this.y - blockHeight + 7, width - margin * 2, blockHeight, pale);
    title.forEach((line, index) => this.text(line, margin + 11, this.y - index * 12, 9, green, true));
    body.forEach((line, index) =>
      this.text(line, margin + 11, this.y - title.length * 12 - 3 - index * 12.4, 9));
    this.y -= blockHeight + 5;
  }
}

const pdf = new Pdf();
pdf.page = [];
pdf.pages.push(pdf.page);
pdf.rect(0, 0, width, height, dark);
pdf.rect(0, 0, 15, height, green);
pdf.rect(margin, 686, 84, 31, green);
pdf.text("PIN2WIN", margin + 10, 697, 12, white, true);
const title = wrap("Boots-on-the-Ground Venue Partner Strategy", 28, width - margin * 2, true);
title.forEach((line, index) => pdf.text(line, margin, 592 - index * 35, 28, white, true));
pdf.text("We market the venue. The venue hosts the challenge. Each keeps its revenue.", margin, 448, 10.5, [0.70, 0.82, 0.68]);
pdf.rule(margin, 417, margin + 185, 417, green, 4);
pdf.text("SAN ANTONIO + BOERNE STARTER TERRITORY", margin, 105, 9, [0.70, 0.82, 0.68], true);
pdf.text("Updated September 16, 2026", margin, 81, 10, white);
pdf.text("Partner acquisition and pilot planning - not launch approval", margin, 63, 9, [0.78, 0.83, 0.79]);
pdf.addPage();

let paragraph = [];
let inQuote = false;
let tableHeaders = null;
let firstHeading = true;

function flushParagraph() {
  if (!paragraph.length) return;
  const content = paragraph.join(" ");
  if (inQuote) pdf.card("SCRIPT", content);
  else pdf.paragraph(content);
  paragraph = [];
}

for (const raw of source.split(/\r?\n/)) {
  const line = raw.trim();
  if (!line) { flushParagraph(); inQuote = false; tableHeaders = null; continue; }
  if (line.startsWith("# ")) {
    flushParagraph();
    if (firstHeading) { firstHeading = false; continue; }
    pdf.heading(line.slice(2), true);
    continue;
  }
  if (line.startsWith("## ")) {
    flushParagraph();
    pdf.heading(line.slice(3), true);
    continue;
  }
  if (line.startsWith("### ")) {
    flushParagraph();
    pdf.heading(line.slice(4));
    continue;
  }
  if (line.startsWith("|")) {
    flushParagraph();
    const cells = line.split("|").slice(1, -1).map((cell) => ascii(cell));
    if (cells.every((cell) => /^:?-{2,}:?$/.test(cell))) continue;
    if (!tableHeaders) { tableHeaders = cells; continue; }
    pdf.card(cells[0], cells.slice(1).map((cell, index) => `${tableHeaders[index + 1]}: ${cell}`).join("  /  "));
    continue;
  }
  if (line.startsWith(">")) {
    if (!inQuote) flushParagraph();
    inQuote = true;
    paragraph.push(line.slice(1).trim());
    continue;
  }
  if (line.startsWith("- ")) { flushParagraph(); pdf.bullet(line.slice(2)); continue; }
  const numbered = line.match(/^(\d+)\.\s+(.+)$/);
  if (numbered) { flushParagraph(); pdf.bullet(numbered[2], numbered[1]); continue; }
  if (inQuote) { flushParagraph(); inQuote = false; }
  paragraph.push(line);
}
flushParagraph();

const externalSources = [...source.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)]
  .map((match) => ({ label: match[1], url: match[2] }));
const uniqueSources = [...new Map(externalSources.map((entry) => [entry.url, entry])).values()];
if (uniqueSources.length) {
  pdf.addPage("SOURCE LINKS");
  pdf.heading("Source links", true);
  pdf.paragraph("These public venue and discovery links informed the starter list. Confirm each prospect's current details before contacting them.");
  uniqueSources.forEach(({ label, url }) => pdf.card(label, url));
}

pdf.pages.forEach((page, index) => {
  const active = pdf.page;
  pdf.page = page;
  if (index > 0) {
    pdf.rule(margin, 40, width - margin, 40);
    pdf.text("PIN2WIN VENUE PARTNER STRATEGY", margin, 25, 7.3, muted, true);
    pdf.text(`${index + 1} / ${pdf.pages.length}`, width - margin - 34, 25, 7.3, muted, true);
  }
  pdf.page = active;
});

function buildPdf(pages) {
  const objects = [];
  const add = (body) => { objects.push(body); return objects.length; };
  const regularFont = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFont = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const references = [];
  for (const operations of pages) {
    const stream = operations.join("\n");
    const content = add(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
    references.push(add(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 ${regularFont} 0 R /F2 ${boldFont} 0 R >> >> /Contents ${content} 0 R >>`));
  }
  const pagesRef = add(`<< /Type /Pages /Kids [${references.map((reference) => `${reference} 0 R`).join(" ")}] /Count ${references.length} >>`);
  const catalog = add(`<< /Type /Catalog /Pages ${pagesRef} 0 R >>`);
  const patched = objects.map((body) => body.replaceAll("/Parent 0 0 R", `/Parent ${pagesRef} 0 R`));
  let output = "%PDF-1.4\n";
  const offsets = [0];
  patched.forEach((body, index) => {
    offsets.push(Buffer.byteLength(output));
    output += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(output);
  output += `xref\n0 ${patched.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { output += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  output += `trailer\n<< /Size ${patched.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(output, "binary");
}

writeFileSync(outputPath, buildPdf(pdf.pages));
console.log(`${outputPath} (${pdf.pages.length} pages)`);

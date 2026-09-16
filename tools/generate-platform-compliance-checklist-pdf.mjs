import { readFileSync, writeFileSync } from "node:fs";

const inputPath = "docs/PLATFORM_COMPLIANCE_IMPLEMENTATION_CHECKLIST.md";
const outputPath = "docs/PLATFORM_COMPLIANCE_IMPLEMENTATION_CHECKLIST.pdf";
const width = 612;
const height = 792;
const margin = 52;
const cream = [251 / 255, 248 / 255, 241 / 255];
const ink = [24 / 255, 33 / 255, 31 / 255];
const muted = [86 / 255, 96 / 255, 90 / 255];
const green = [47 / 255, 107 / 255, 63 / 255];
const lime = [168 / 255, 200 / 255, 120 / 255];
const amber = [161 / 255, 90 / 255, 36 / 255];
const blue = [36 / 255, 81 / 255, 138 / 255];
const border = [222 / 255, 214 / 255, 200 / 255];
const dark = [16 / 255, 24 / 255, 22 / 255];
const white = [1, 1, 1];

function ascii(value) {
  return String(value)
    .replaceAll("—", "-")
    .replaceAll("–", "-")
    .replaceAll("’", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("§", "Section")
    .replace(/[^\x20-\x7E]/g, "");
}

function clean(value) {
  return ascii(value)
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .trim();
}

function escapePdf(value) {
  return ascii(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function rgb([r, g, b]) {
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

function approximateWidth(value, size, bold = false) {
  return ascii(value).length * size * (bold ? 0.525 : 0.49);
}

function wrap(value, size, maxWidth, bold = false) {
  const words = clean(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (!current || approximateWidth(next, size, bold) <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

class PdfDocument {
  constructor() {
    this.pages = [];
    this.page = null;
    this.y = height - 68;
    this.section = "IMPLEMENTATION CHECKLIST";
  }

  operation(value) {
    this.page.push(value);
  }

  rectangle(x, y, boxWidth, boxHeight, fill, stroke = null) {
    if (fill) this.operation(`${rgb(fill)} rg`);
    if (stroke) this.operation(`${rgb(stroke)} RG 0.8 w`);
    this.operation(
      `${x} ${y} ${boxWidth} ${boxHeight} re ${fill && stroke ? "B" : fill ? "f" : "S"}`,
    );
  }

  line(x1, y1, x2, y2, color = border, thickness = 1) {
    this.operation(`${rgb(color)} RG ${thickness} w ${x1} ${y1} m ${x2} ${y2} l S`);
  }

  text(value, x, y, size = 10, color = ink, font = "F1") {
    this.operation(
      `${rgb(color)} rg BT /${font} ${size} Tf ${x} ${y} Td (${escapePdf(value)}) Tj ET`,
    );
  }

  addPage(section = this.section) {
    this.section = section;
    this.page = [];
    this.pages.push(this.page);
    this.rectangle(0, 0, width, height, cream);
    this.text("PIN2WIN", margin, height - 30, 9, green, "F2");
    this.text(section, margin + 59, height - 30, 7.6, muted, "F2");
    this.line(margin, height - 42, width - margin, height - 42, border, 0.7);
    this.y = height - 68;
  }

  ensure(space) {
    if (this.y - space < 48) this.addPage();
  }

  heading(value) {
    const lines = wrap(value, 15, width - margin * 2, true);
    this.ensure(lines.length * 19 + 85);
    lines.forEach((line, index) =>
      this.text(line, margin, this.y - index * 19, 15, green, "F2"),
    );
    this.y -= lines.length * 19 + 9;
  }

  paragraph(value) {
    const lines = wrap(value, 9.6, width - margin * 2);
    this.ensure(lines.length * 13.4 + 15);
    lines.forEach((line, index) =>
      this.text(line, margin, this.y - index * 13.4, 9.6, ink),
    );
    this.y -= lines.length * 13.4 + 12;
  }

  checklistItem(value, status) {
    const textX = margin + 29;
    const lines = wrap(value, 9.35, width - margin * 2 - 29);
    this.ensure(lines.length * 12.8 + 10);
    const statusColor =
      status === "complete"
        ? green
        : status === "progress"
          ? blue
          : status === "blocked"
            ? amber
            : muted;
    const marker =
      status === "complete"
        ? "OK"
        : status === "progress"
          ? "~"
          : status === "blocked"
            ? "!"
            : "";

    this.rectangle(margin, this.y - 3, 16, 16, cream, statusColor);
    if (marker) {
      this.text(marker, margin + (marker === "OK" ? 2.6 : 5.8), this.y + 1, 7.2, statusColor, "F2");
    }
    lines.forEach((line, index) =>
      this.text(line, textX, this.y - index * 12.8, 9.35, ink),
    );
    this.y -= lines.length * 12.8 + 8;
  }

  bullet(value) {
    const textX = margin + 18;
    const lines = wrap(value, 9.35, width - margin * 2 - 18);
    this.ensure(lines.length * 12.8 + 10);
    this.rectangle(margin + 2, this.y + 2, 4, 4, green);
    lines.forEach((line, index) =>
      this.text(line, textX, this.y - index * 12.8, 9.35, ink),
    );
    this.y -= lines.length * 12.8 + 8;
  }
}

const source = readFileSync(inputPath, "utf8");
const updatedDate =
  source.match(/^Last updated:\s*(.+)$/m)?.[1]?.trim() || "Date unavailable";
const pdf = new PdfDocument();

pdf.page = [];
pdf.pages.push(pdf.page);
pdf.rectangle(0, 0, width, height, dark);
pdf.rectangle(0, 0, 14, height, green);
pdf.rectangle(52, 695, 66, 29, green);
pdf.text("PIN2WIN", 62, 705, 12, white, "F2");

const coverTitle = wrap("Platform Compliance Implementation Checklist", 30, 490, true);
coverTitle.forEach((line, index) => pdf.text(line, 52, 612 - index * 37, 30, white, "F2"));
pdf.text("Engineering roadmap aligned to the customer legal-review package", 52, 482, 13, lime);
pdf.line(52, 442, 212, 442, lime, 4);
pdf.text("WORKING IMPLEMENTATION DOCUMENT", 52, 106, 9, lime, "F2");
pdf.text(`Updated ${updatedDate}`, 52, 83, 10.5, white);
pdf.text("Status: implementation in progress", 52, 65, 9.5, [0.75, 0.8, 0.76]);

pdf.addPage();

let paragraph = [];
let skippedTitle = false;
let sectionCount = 0;

function flushParagraph() {
  if (!paragraph.length) return;
  pdf.paragraph(paragraph.join(" "));
  paragraph = [];
}

for (const rawLine of source.split(/\r?\n/)) {
  const line = rawLine.trim();

  if (!line) {
    flushParagraph();
    continue;
  }

  if (line.startsWith("# ")) {
    flushParagraph();
    if (!skippedTitle) {
      skippedTitle = true;
      continue;
    }
    const heading = clean(line.slice(2)).toUpperCase();
    pdf.addPage(heading);
    pdf.heading(clean(line.slice(2)));
    continue;
  }

  if (line.startsWith("## ")) {
    flushParagraph();
    const heading = clean(line.slice(3));

    if (sectionCount > 0) {
      pdf.addPage(heading.toUpperCase());
    } else {
      pdf.section = heading.toUpperCase();
    }

    sectionCount += 1;
    pdf.heading(heading);
    continue;
  }

  const checklist = line.match(/^- \[([x~! ])\]\s+(.+)$/i);
  if (checklist) {
    flushParagraph();
    const status =
      checklist[1].toLowerCase() === "x"
        ? "complete"
        : checklist[1] === "~"
          ? "progress"
          : checklist[1] === "!"
            ? "blocked"
            : "pending";
    pdf.checklistItem(clean(checklist[2]), status);
    continue;
  }

  if (line.startsWith("- ")) {
    flushParagraph();
    pdf.bullet(clean(line.slice(2)));
    continue;
  }

  paragraph.push(line);
}

flushParagraph();

pdf.pages.forEach((page, index) => {
  const current = pdf.page;
  pdf.page = page;
  pdf.line(margin, 33, width - margin, 33, border, 0.6);
  pdf.text("PIN2WIN PLATFORM COMPLIANCE", margin, 20, 7.2, muted, "F2");
  pdf.text(`${index + 1} / ${pdf.pages.length}`, width - margin - 26, 20, 7.2, muted, "F2");
  pdf.page = current;
});

function buildPdf(pages) {
  const objects = [];
  const pageReferences = [];
  const add = (body) => {
    objects.push(body);
    return objects.length;
  };
  const regularFont = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFont = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  for (const operations of pages) {
    const stream = operations.join("\n");
    const contentReference = add(
      `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    );
    const pageReference = add(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 ${regularFont} 0 R /F2 ${boldFont} 0 R >> >> /Contents ${contentReference} 0 R >>`,
    );
    pageReferences.push(pageReference);
  }

  const pagesReference = add(
    `<< /Type /Pages /Kids [${pageReferences.map((reference) => `${reference} 0 R`).join(" ")}] /Count ${pageReferences.length} >>`,
  );
  const catalogReference = add(`<< /Type /Catalog /Pages ${pagesReference} 0 R >>`);
  const patchedObjects = objects.map((body) =>
    body.replaceAll("/Parent 0 0 R", `/Parent ${pagesReference} 0 R`),
  );
  let output = "%PDF-1.4\n";
  const offsets = [0];

  patchedObjects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(output));
    output += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(output);
  output += `xref\n0 ${patchedObjects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    output += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  output += `trailer\n<< /Size ${patchedObjects.length + 1} /Root ${catalogReference} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(output, "binary");
}

writeFileSync(outputPath, buildPdf(pdf.pages));
if (process.env.PIN2WIN_CHECKLIST_PREVIEW_DIR) {
  pdf.pages.forEach((page, index) => {
    writeFileSync(
      `${process.env.PIN2WIN_CHECKLIST_PREVIEW_DIR}/page-${index + 1}.pdf`,
      buildPdf([page]),
    );
  });
}
console.log(`${outputPath} (${pdf.pages.length} pages)`);

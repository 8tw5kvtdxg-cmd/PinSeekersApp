import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "public", "pin2win-print-ready-alamo");
const sourceImage = path.join(outputDir, "pin2win-alamo-final-print-master-centered.jpg");

const width = 3600;
const height = 5400;
const gold = "#e6b34f";
const white = "#ffffff";
const green = "#050505";

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function text(value, x, y, options = {}) {
  const {
    size = 72,
    weight = 800,
    fill = white,
    anchor = "middle",
    family = "Arial, Helvetica, sans-serif",
    style = "normal",
  } = options;

  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${family}" font-style="${style}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(value)}</text>`;
}

function roundedRect(x, y, w, h, options = {}) {
  const {
    fill = "#050505",
    stroke = "none",
    strokeWidth = 0,
    rx = 44,
    opacity = 1,
  } = options;

  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`;
}

function step(number, title, copy, y, secondCopy = "", showDivider = true) {
  const circleX = 870;
  const titleX = 1140;

  return `
    <circle cx="${circleX}" cy="${y - 26}" r="150" fill="${green}" stroke="${gold}" stroke-width="12"/>
    ${text(String(number), circleX, y + 16, { size: 164, weight: 900, fill: gold })}
    ${text(title, titleX, y - 46, { size: 114, weight: 900, fill: white, anchor: "start" })}
    ${text(copy, titleX, y + 82, { size: 64, weight: 700, fill: "#e6e6e6", anchor: "start" })}
    ${secondCopy ? text(secondCopy, titleX, y + 154, { size: 64, weight: 700, fill: "#e6e6e6", anchor: "start" }) : ""}
    ${showDivider ? `<line x1="1100" y1="${y + (secondCopy ? 250 : 190)}" x2="2950" y2="${y + (secondCopy ? 250 : 190)}" stroke="#6f5122" stroke-width="5"/>` : ""}
  `;
}

function overlaySvg(iconData) {
  const center = width / 2;
  const panelX = 420;
  const panelY = 180;
  const panelW = 2760;
  const panelH = 5000;

  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="goldText" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffe79a"/>
          <stop offset="48%" stop-color="#e8b34e"/>
          <stop offset="100%" stop-color="#bd8028"/>
        </linearGradient>
      </defs>

      <rect width="${width}" height="${height}" fill="#050505"/>
      ${roundedRect(panelX, panelY, panelW, panelH, { fill: "#030303", stroke: gold, strokeWidth: 8, rx: 56, opacity: 0.985 })}
      ${roundedRect(panelX + 22, panelY + 22, panelW - 44, panelH - 44, { fill: "none", stroke: "#7f5a1f", strokeWidth: 2, rx: 44, opacity: 0.65 })}

      ${text("HOW TO PLAY", center, 800, { size: 196, weight: 900, fill: "url(#goldText)" })}
      ${text("HOLE-IN-ONE CHALLENGE", center, 985, { size: 84, weight: 900, fill: "#ffe7a2" })}
      ${text("Follow these six steps to enter and play.", center, 1140, { size: 68, weight: 700, fill: "#eeeeee" })}

      ${step(1, "SCAN THE QR CODE", "Start from the QR code at the venue.", 1450)}
      ${step(2, "CREATE ACCOUNT / LOGIN", "Use the same username in E6 Golf to verify your results.", 2050)}
      ${step(3, "PAY THROUGH SQUARE", "Complete the secure payment for your five-shot entry.", 2650)}
      ${step(4, "GET YOUR EVENT CODE", "Payment confirmed: your code is revealed.", 3250, "Open the Events tab in E6 Golf.")}
      ${step(5, "ENTER THE EVENT CODE", "Bottom left: select Enter Event Code, then type in the code.", 3850)}
      ${step(6, "SWING AWAY!", "You are ready to take your shots. Good luck!", 4450, "", false)}
    </svg>
  `);
}

function pdfFromJpeg(imagePath, outputPath) {
  const objects = [];
  const pageWidth = 432;
  const pageHeight = 648;

  function addObject(content) {
    objects.push(content);
    return objects.length;
  }

  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = addObject("");
  const image = fs.readFileSync(imagePath);
  const imageId = addObject({
    stream: image,
    dict: `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>`,
  });
  const content = Buffer.from(`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im${imageId} Do\nQ\n`);
  const contentId = addObject({ stream: content, dict: `<< /Length ${content.length} >>` });
  const pageId = addObject(
    `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${imageId} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
  );

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageId} 0 R] /Count 1 >>`;

  const chunks = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "binary")];
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets[index + 1] = Buffer.concat(chunks).length;
    chunks.push(Buffer.from(`${index + 1} 0 obj\n`));

    if (typeof object === "string") {
      chunks.push(Buffer.from(`${object}\nendobj\n`));
      return;
    }

    chunks.push(Buffer.from(`${object.dict}\nstream\n`));
    chunks.push(object.stream);
    chunks.push(Buffer.from("\nendstream\nendobj\n"));
  });

  const body = Buffer.concat(chunks);
  const xrefOffset = body.length;
  const xref = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
  ].join("\n");

  fs.writeFileSync(outputPath, Buffer.concat([body, Buffer.from(xref)]));
}

fs.mkdirSync(outputDir, { recursive: true });

const base = await sharp(sourceImage)
  .resize(width, height, { fit: "cover", position: "center" })
  .jpeg({ quality: 94 })
  .toBuffer();
const outputJpg = path.join(outputDir, "pin2win-alamo-customer-steps-poster.jpg");
const outputPdf = path.join(outputDir, "pin2win-alamo-customer-steps-poster.pdf");

await sharp(base)
  .composite([
    { input: overlaySvg(), top: 0, left: 0 },
  ])
  .jpeg({ quality: 95, mozjpeg: true })
  .toFile(outputJpg);

pdfFromJpeg(outputJpg, outputPdf);

console.log(outputJpg);
console.log(outputPdf);

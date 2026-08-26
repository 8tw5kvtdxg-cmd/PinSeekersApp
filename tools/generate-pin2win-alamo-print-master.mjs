import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "public", "pin2win-print-ready-alamo");
const sourceImage = path.join(
  root,
  "public",
  "pin2win-higgsfield-banners-v1",
  "individual",
  "07-higgsfield-banner.jpg",
);
const qrImage = path.join(root, "public", "alamo-golf-den-qr.png");

const width = 2160;
const height = 3840;
const gold = "#e6b34f";
const white = "#ffffff";
const black = "#050505";

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
    fill = black,
    stroke = "none",
    strokeWidth = 0,
    rx = 44,
    opacity = 1,
  } = options;

  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`;
}

function overlaySvg() {
  const center = 1150;
  const lowerCenter = 1120;
  const mainX = 310;
  const mainY = 145;
  const mainW = 1680;
  const mainH = 1695;
  const pillX = 500;
  const pillY = 1478;
  const pillW = 1300;
  const pillH = 180;
  const qrCardX = 640;
  const qrCardY = 2515;
  const qrCardW = 960;
  const qrCardH = 1080;
  const qrX = 775;
  const qrY = 2630;
  const qrSize = 690;

  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="goldText" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffe79a"/>
          <stop offset="48%" stop-color="#e8b34e"/>
          <stop offset="100%" stop-color="#bd8028"/>
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000000" flood-opacity="0.55"/>
        </filter>
      </defs>

      ${roundedRect(mainX, mainY, mainW, mainH, {
        fill: "#030303",
        stroke: gold,
        strokeWidth: 7,
        rx: 54,
        opacity: 0.99,
      })}
      ${roundedRect(mainX + 20, mainY + 20, mainW - 40, mainH - 40, {
        fill: "none",
        stroke: "#7f5a1f",
        strokeWidth: 2,
        rx: 42,
        opacity: 0.55,
      })}

      ${text("Pin2Win", center, 505, {
        size: 252,
        weight: 900,
        fill: "url(#goldText)",
        style: "italic",
      })}
      ${text("HOLE-IN-ONE", center, 820, { size: 128, weight: 900, fill: "url(#goldText)" })}
      ${text("CHALLENGE", center, 1000, { size: 128, weight: 900, fill: "url(#goldText)" })}
      ${text("$5,000 PRIZE", center, 1370, { size: 188, weight: 900, fill: "url(#goldText)" })}

      ${roundedRect(pillX, pillY, pillW, pillH, {
        fill: "#050505",
        stroke: gold,
        strokeWidth: 7,
        rx: 90,
      })}
      ${text("$20 FOR 5 SHOTS", center, pillY + 117, { size: 92, weight: 900, fill: white })}

      ${text("SCAN TO PLAY", lowerCenter, 2055, {
        size: 62,
        weight: 900,
        fill: "#ffe7a2",
      })}

      ${roundedRect(qrCardX, qrCardY, qrCardW, qrCardH, {
        fill: "#040404",
        rx: 44,
        opacity: 0.96,
      })}
      ${roundedRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, {
        fill: white,
        rx: 0,
      })}
      ${text("SCAN TO PLAY", lowerCenter, 3450, { size: 102, weight: 900, fill: white })}
      ${text("pin2wingolf.com | @pin2wingolf", lowerCenter, 3532, {
        size: 40,
        weight: 800,
        fill: "#f6d783",
      })}

      ${roundedRect(325, 3685, 1590, 110, {
        fill: "#050505",
        rx: 56,
        opacity: 0.9,
      })}
      ${text("Valid onsite entry required. Eligibility and terms apply.", lowerCenter, 3756, {
        size: 38,
        weight: 800,
        fill: "#f2f2f2",
      })}
    </svg>
  `);
}

function pdfFromJpeg(imagePath, outputPath) {
  const objects = [];
  const pages = [];
  const pageWidth = 540;
  const pageHeight = 960;

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
  const contentId = addObject({
    stream: content,
    dict: `<< /Length ${content.length} >>`,
  });
  const pageId = addObject(
    `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${imageId} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
  );
  pages.push(pageId);

  objects[pagesId - 1] =
    `<< /Type /Pages /Kids [${pages.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;

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
    ...offsets
      .slice(1)
      .map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
  ].join("\n");

  fs.writeFileSync(outputPath, Buffer.concat([body, Buffer.from(xref)]));
}

fs.mkdirSync(outputDir, { recursive: true });

const base = await sharp(sourceImage).resize(width, height).jpeg({ quality: 94 }).toBuffer();
const qrBuffer = await sharp(qrImage)
  .resize(690, 690, { kernel: "nearest" })
  .png()
  .toBuffer();

const outputJpg = path.join(outputDir, "pin2win-alamo-final-print-master-centered.jpg");
const outputPdf = path.join(outputDir, "pin2win-alamo-final-print-master-centered.pdf");

await sharp(base)
  .composite([
    { input: overlaySvg(), top: 0, left: 0 },
    { input: qrBuffer, top: 2630, left: 775 },
  ])
  .jpeg({ quality: 95, mozjpeg: true })
  .toFile(outputJpg);

pdfFromJpeg(outputJpg, outputPdf);

console.log(outputJpg);
console.log(outputPdf);

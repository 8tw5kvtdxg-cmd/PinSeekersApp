import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "public", "pin2win-print-ready-alamo");

const sourceImage = "/Users/pinseekers/Downloads/ChatGPT Image Aug 27, 2026 at 01_20_09 PM.png";
const qrImage = path.join(root, "public", "alamo-golf-den-qr.png");

const width = 5400;
const height = 8100;
const density = 150;

const outputJpg = path.join(outputDir, "pin2win-alamo-36x54-print.jpg");
const outputTiff = path.join(outputDir, "pin2win-alamo-36x54-print.tiff");
const outputPdf = path.join(outputDir, "pin2win-alamo-36x54-print.pdf");

function svgOverlay() {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect x="1510" y="5740" width="2380" height="2210" rx="150" fill="#020202"/>
      <rect x="2020" y="5890" width="1360" height="1360" fill="#ffffff"/>
      <text x="2700" y="7480" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="230" font-weight="900" fill="#ffffff">SCAN TO PLAY</text>
      <text x="2700" y="7665" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="118" font-weight="900" fill="#ffd94f">pin2wingolf.com  |  @pin2wingolf</text>
      <text x="2700" y="7830" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="80" font-weight="700" fill="#ffffff">Valid onsite entry required. Eligibility and terms apply.</text>
    </svg>
  `);
}

function pdfFromJpeg(imagePath, outputPath) {
  const objects = [];
  const pageWidth = 36 * 72;
  const pageHeight = 54 * 72;

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
  const content = Buffer.from(
    `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im${imageId} Do\nQ\n`,
  );
  const contentId = addObject({
    stream: content,
    dict: `<< /Length ${content.length} >>`,
  });
  const pageId = addObject(
    `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${imageId} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
  );

  objects[pagesId - 1] =
    `<< /Type /Pages /Kids [${pageId} 0 R] /Count 1 >>`;

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

const base = await sharp(sourceImage)
  .resize(width, height, { fit: "cover", position: "center", kernel: "lanczos3" })
  .sharpen({ sigma: 0.8, m1: 0.7, m2: 1.6 })
  .jpeg({ quality: 96, mozjpeg: true })
  .toBuffer();

const qrBuffer = await sharp(qrImage)
  .resize(1240, 1240, { kernel: "nearest" })
  .png()
  .toBuffer();

await sharp(base)
  .composite([
    { input: svgOverlay(), left: 0, top: 0 },
    { input: qrBuffer, left: 2080, top: 5950 },
  ])
  .withMetadata({ density })
  .jpeg({ quality: 96, mozjpeg: true })
  .toFile(outputJpg);

await sharp(outputJpg)
  .withMetadata({ density })
  .tiff({ quality: 96, compression: "lzw" })
  .toFile(outputTiff);

pdfFromJpeg(outputJpg, outputPdf);

console.log(outputJpg);
console.log(outputTiff);
console.log(outputPdf);

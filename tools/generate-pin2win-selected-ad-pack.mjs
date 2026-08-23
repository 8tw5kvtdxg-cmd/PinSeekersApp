import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const outputDir = path.join(root, "public", "pin2win-portrait-ads-v3");
const selectedDir = path.join(root, "public", "pin2win-selected-ad-pack");
const qrBase64 = fs
  .readFileSync(path.join(root, "public", "alamo-golf-den-qr.png"))
  .toString("base64");

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(selectedDir, { recursive: true });

const width = 1080;
const height = 1920;

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function rect(x, y, w, h, r, fill, options = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" opacity="${options.opacity ?? 1}"${options.stroke ? ` stroke="${options.stroke}" stroke-width="${options.strokeWidth ?? 2}"` : ""}/>`;
}

function circle(cx, cy, r, fill, opacity = 1) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}"/>`;
}

function text(value, x, y, options = {}) {
  return `<text x="${x}" y="${y}" text-anchor="${options.anchor ?? "start"}" font-family="Inter, Arial, Helvetica, sans-serif" font-size="${options.size ?? 40}" font-weight="${options.weight ?? 800}" fill="${options.fill ?? "#ffffff"}" opacity="${options.opacity ?? 1}" letter-spacing="${options.tracking ?? 0}">${esc(value)}</text>`;
}

function logo(x, y, palette = {}) {
  const markFill = palette.markFill ?? "#ffffff";
  const markText = palette.markText ?? "#101514";
  const wordFill = palette.wordFill ?? "#ffffff";
  const subFill = palette.subFill ?? wordFill;

  return `
    <g transform="translate(${x} ${y})">
      ${rect(0, 0, 88, 88, 18, markFill)}
      ${text("P2W", 44, 55, { size: 27, weight: 900, fill: markText, anchor: "middle" })}
      ${text("Pin2Win", 112, 40, { size: 46, weight: 900, fill: wordFill })}
      ${text("Hole-in-One Challenge", 114, 76, { size: 20, weight: 700, fill: subFill, opacity: 0.78 })}
    </g>
  `;
}

function qrCard(x, y, size, palette = {}) {
  const cardFill = palette.cardFill ?? "#ffffff";
  const frameFill = palette.frameFill ?? "#f4f0e7";
  const titleFill = palette.titleFill ?? "#101514";
  const subFill = palette.subFill ?? "#66716b";

  return `
    <g transform="translate(${x} ${y})">
      ${rect(0, 0, size, size + 164, 32, cardFill)}
      ${rect(30, 30, size - 60, size - 60, 18, frameFill)}
      <image href="data:image/png;base64,${qrBase64}" x="52" y="52" width="${size - 104}" height="${size - 104}" preserveAspectRatio="xMidYMid meet"/>
      ${text("SCAN TO PLAY", size / 2, size + 78, { size: 38, weight: 900, fill: titleFill, anchor: "middle" })}
      ${text("Create your entry onsite", size / 2, size + 120, { size: 23, weight: 700, fill: subFill, anchor: "middle" })}
    </g>
  `;
}

function fine(fill = "#ffffff", y = 1870, opacity = 0.66) {
  return text("Valid onsite entry required. Terms apply.", 540, y, {
    size: 22,
    weight: 650,
    fill,
    anchor: "middle",
    opacity,
  });
}

const designs = [
  {
    id: "01-lime-spotlight",
    svg: `
      <rect width="${width}" height="${height}" fill="#080d0c"/>
      ${circle(858, 304, 384, "#b8ff5c", 0.14)}
      ${circle(96, 1450, 430, "#b8ff5c", 0.06)}
      ${logo(72, 78, { markFill: "#b8ff5c", markText: "#080d0c" })}
      ${text("WIN", 76, 424, { size: 118, weight: 900 })}
      ${text("$10,000", 76, 570, { size: 138, weight: 900 })}
      ${text("Hole-in-One Challenge", 80, 674, { size: 46, weight: 760, fill: "#b8ff5c" })}
      ${rect(80, 758, 512, 82, 41, "#ffffff")}
      ${text("$25 for 5 shots", 336, 813, { size: 37, weight: 900, fill: "#080d0c", anchor: "middle" })}
      ${text("Scan onsite to unlock your entry.", 82, 934, { size: 34, weight: 720, fill: "#dfe9e3" })}
      ${qrCard(212, 1030, 656, { frameFill: "#edf9e8" })}
      ${fine("#dfe9e3", 1878)}
    `,
  },
  {
    id: "02-gold-badge",
    svg: `
      <rect width="${width}" height="${height}" fill="#070707"/>
      ${rect(58, 58, 964, 1804, 34, "#101010", { stroke: "#d3aa55", strokeWidth: 3 })}
      ${circle(540, 508, 360, "#d3aa55", 0.11)}
      ${logo(92, 96, { markFill: "#d3aa55", markText: "#070707" })}
      ${text("PIN2WIN", 540, 370, { size: 36, weight: 900, fill: "#d3aa55", anchor: "middle", tracking: 8 })}
      ${text("Hole-in-One", 540, 502, { size: 74, weight: 840, anchor: "middle" })}
      ${text("$10,000", 540, 636, { size: 130, weight: 900, fill: "#ffffff", anchor: "middle" })}
      ${rect(270, 736, 540, 86, 43, "#d3aa55")}
      ${text("$25 FOR 5 SHOTS", 540, 794, { size: 37, weight: 900, fill: "#070707", anchor: "middle" })}
      ${qrCard(232, 1026, 616, { frameFill: "#f6eedf" })}
      ${fine("#f2eadb", 1858)}
    `,
  },
  {
    id: "03-lime-ticket",
    svg: `
      <rect width="${width}" height="${height}" fill="#0e1715"/>
      ${rect(76, 240, 928, 1438, 24, "#111f1b", { stroke: "#b8ff5c", strokeWidth: 3 })}
      ${logo(76, 78, { markFill: "#b8ff5c", markText: "#0e1715" })}
      ${text("ENTRY", 540, 390, { size: 42, weight: 900, fill: "#b8ff5c", anchor: "middle", tracking: 7 })}
      ${text("5 shots", 540, 540, { size: 92, weight: 900, anchor: "middle" })}
      ${text("$25", 540, 662, { size: 118, weight: 900, fill: "#b8ff5c", anchor: "middle" })}
      ${text("for a chance at $10,000", 540, 752, { size: 42, weight: 760, fill: "#e3eee7", anchor: "middle" })}
      ${qrCard(232, 980, 616, { frameFill: "#effbe9" })}
      ${fine("#dfe9e3", 1868)}
    `,
  },
  {
    id: "04-gold-frame",
    svg: `
      <rect width="${width}" height="${height}" fill="#f5f0e7"/>
      ${rect(84, 84, 912, 1752, 42, "#0c0c0c")}
      ${rect(126, 126, 828, 1668, 30, "#111111", { stroke: "#cba252", strokeWidth: 3 })}
      ${logo(154, 164, { markFill: "#cba252", markText: "#0c0c0c" })}
      ${text("ONE SWING", 540, 438, { size: 62, weight: 840, fill: "#ffffff", anchor: "middle", tracking: 2 })}
      ${text("COULD WIN", 540, 522, { size: 62, weight: 840, fill: "#ffffff", anchor: "middle", tracking: 2 })}
      ${text("$10,000", 540, 660, { size: 106, weight: 900, fill: "#cba252", anchor: "middle" })}
      ${rect(270, 748, 540, 78, 39, "#ffffff")}
      ${text("$25 • 5 shots", 540, 800, { size: 36, weight: 900, fill: "#111111", anchor: "middle" })}
      ${qrCard(232, 1014, 616, { frameFill: "#f5f0e7" })}
      ${fine("#f5f0e7", 1852)}
    `,
  },
  {
    id: "05-lime-minimal",
    svg: `
      <rect width="${width}" height="${height}" fill="#f8faf6"/>
      <rect x="0" y="0" width="1080" height="520" fill="#0c1512"/>
      ${circle(832, 208, 220, "#b8ff5c", 0.18)}
      ${logo(72, 78, { markFill: "#b8ff5c", markText: "#0c1512" })}
      ${text("$10,000", 540, 684, { size: 142, weight: 900, fill: "#0c1512", anchor: "middle" })}
      ${text("Hole-in-One Challenge", 540, 770, { size: 44, weight: 760, fill: "#5e6b65", anchor: "middle" })}
      ${rect(266, 850, 548, 82, 41, "#0c1512")}
      ${text("$25 for 5 shots", 540, 905, { size: 38, weight: 900, anchor: "middle" })}
      ${text("Scan the QR code onsite to get access.", 540, 1010, { size: 33, weight: 700, fill: "#5e6b65", anchor: "middle" })}
      ${qrCard(232, 1090, 616, { frameFill: "#f8faf6" })}
      ${fine("#6c746f", 1872, 0.9)}
    `,
  },
  {
    id: "06-gold-minimal",
    svg: `
      <rect width="${width}" height="${height}" fill="#fbf8f1"/>
      <rect x="0" y="0" width="1080" height="610" fill="#111111"/>
      ${logo(72, 78, { markFill: "#d3aa55", markText: "#111111" })}
      ${text("A REAL SHOT", 540, 372, { size: 48, weight: 900, fill: "#d3aa55", anchor: "middle", tracking: 5 })}
      ${text("AT $10,000", 540, 488, { size: 82, weight: 900, anchor: "middle" })}
      ${text("Hole-in-One Challenge", 540, 782, { size: 52, weight: 860, fill: "#111111", anchor: "middle" })}
      ${rect(256, 852, 568, 82, 41, "#d3aa55")}
      ${text("$25 ENTRY • 5 SHOTS", 540, 907, { size: 36, weight: 900, fill: "#111111", anchor: "middle" })}
      ${qrCard(232, 1060, 616, { frameFill: "#fbf8f1" })}
      ${fine("#6a6258", 1868, 0.9)}
    `,
  },
  {
    id: "07-lime-split",
    svg: `
      <rect width="${width}" height="${height}" fill="#101514"/>
      <path d="M0 0H1080V930C858 842 704 874 540 954C343 1050 178 1018 0 930V0Z" fill="#13251d"/>
      ${circle(226, 1380, 390, "#b8ff5c", 0.1)}
      ${logo(72, 78, { markFill: "#b8ff5c", markText: "#101514" })}
      ${text("SCAN.", 82, 396, { size: 94, weight: 900, fill: "#b8ff5c" })}
      ${text("SWING.", 82, 510, { size: 94, weight: 900 })}
      ${text("WIN.", 82, 624, { size: 94, weight: 900, fill: "#b8ff5c" })}
      ${text("$25 for 5 shots", 86, 758, { size: 42, weight: 860, fill: "#ffffff" })}
      ${text("$10,000 hole-in-one prize", 86, 824, { size: 35, weight: 740, fill: "#dfe9e3" })}
      ${qrCard(212, 1040, 656, { frameFill: "#effbe9" })}
      ${fine("#dfe9e3", 1880)}
    `,
  },
  {
    id: "08-gold-poster",
    svg: `
      <rect width="${width}" height="${height}" fill="#090909"/>
      ${circle(540, 510, 430, "#cba252", 0.12)}
      ${logo(72, 78, { markFill: "#cba252", markText: "#090909" })}
      ${text("THE", 540, 374, { size: 42, weight: 850, fill: "#cba252", anchor: "middle", tracking: 8 })}
      ${text("HOLE-IN-ONE", 540, 482, { size: 72, weight: 900, anchor: "middle" })}
      ${text("CHALLENGE", 540, 566, { size: 72, weight: 900, anchor: "middle" })}
      ${text("$10,000", 540, 726, { size: 118, weight: 900, fill: "#cba252", anchor: "middle" })}
      ${text("$25 for 5 shots", 540, 820, { size: 42, weight: 760, fill: "#f7f0e3", anchor: "middle" })}
      ${qrCard(232, 1018, 616, { frameFill: "#f7f0e3" })}
      ${fine("#f7f0e3", 1854)}
    `,
  },
  {
    id: "09-lime-card",
    svg: `
      <rect width="${width}" height="${height}" fill="#ecf7e8"/>
      ${rect(74, 74, 932, 1772, 40, "#0b1110")}
      ${circle(828, 282, 232, "#b8ff5c", 0.15)}
      ${logo(114, 116, { markFill: "#b8ff5c", markText: "#0b1110" })}
      ${text("Can you", 540, 430, { size: 72, weight: 820, anchor: "middle" })}
      ${text("ACE IT?", 540, 554, { size: 122, weight: 900, fill: "#b8ff5c", anchor: "middle" })}
      ${text("Win $10,000", 540, 700, { size: 78, weight: 900, anchor: "middle" })}
      ${rect(278, 780, 524, 78, 39, "#ffffff")}
      ${text("$25 • 5 shots", 540, 832, { size: 36, weight: 900, fill: "#0b1110", anchor: "middle" })}
      ${qrCard(232, 1018, 616, { frameFill: "#ecf7e8" })}
      ${fine("#dfe9e3", 1856)}
    `,
  },
  {
    id: "10-gold-clean",
    svg: `
      <rect width="${width}" height="${height}" fill="#ffffff"/>
      <rect x="0" y="0" width="1080" height="378" fill="#111111"/>
      ${logo(72, 78, { markFill: "#d3aa55", markText: "#111111" })}
      ${text("PIN2WIN", 540, 528, { size: 38, weight: 900, fill: "#b98f42", anchor: "middle", tracking: 8 })}
      ${text("$10,000", 540, 700, { size: 146, weight: 900, fill: "#111111", anchor: "middle" })}
      ${text("Hole-in-One Prize", 540, 788, { size: 44, weight: 740, fill: "#6d655a", anchor: "middle" })}
      ${rect(252, 874, 576, 84, 42, "#111111")}
      ${text("$25 for 5 shots", 540, 930, { size: 38, weight: 900, anchor: "middle" })}
      ${text("Scan onsite to get access", 540, 1032, { size: 33, weight: 720, fill: "#6d655a", anchor: "middle" })}
      ${qrCard(232, 1110, 616, { frameFill: "#faf7f0" })}
      ${fine("#6d655a", 1870, 0.9)}
    `,
  },
];

function wrap(svg) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`;
}

for (const design of designs) {
  const svg = wrap(design.svg);
  fs.writeFileSync(path.join(outputDir, `${design.id}.svg`), svg);
  await sharp(Buffer.from(svg), { density: 144 })
    .jpeg({ quality: 94, mozjpeg: true })
    .toFile(path.join(outputDir, `${design.id}.jpg`));
}

const selectedImages = [
  path.join(root, "public", "pin2win-portrait-ads-v2", "01-obsidian-lime.jpg"),
  path.join(root, "public", "pin2win-portrait-ads-v2", "05-black-gold.jpg"),
  ...designs.map((design) => path.join(outputDir, `${design.id}.jpg`)),
];

for (const [index, imagePath] of selectedImages.entries()) {
  fs.copyFileSync(
    imagePath,
    path.join(selectedDir, `${String(index + 1).padStart(2, "0")}-${path.basename(imagePath)}`),
  );
}

const thumbs = await Promise.all(
  selectedImages.map((imagePath, index) =>
    sharp(imagePath)
      .resize(270, 480)
      .extend({ top: 46, bottom: 18, left: 0, right: 0, background: "#ffffff" })
      .composite([
        {
          input: Buffer.from(
            `<svg width="270" height="46" xmlns="http://www.w3.org/2000/svg"><rect width="270" height="46" fill="#ffffff"/><text x="135" y="30" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="800" fill="#101514">${index < 2 ? `Favorite ${index + 1}` : `New ${index - 1}`}</text></svg>`,
          ),
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer(),
  ),
);

await sharp({
  create: {
    width: 270 * 4,
    height: 544 * 3,
    channels: 3,
    background: "#f3f4f1",
  },
})
  .composite(
    thumbs.map((input, index) => ({
      input,
      left: (index % 4) * 270,
      top: Math.floor(index / 4) * 544,
    })),
  )
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile(path.join(selectedDir, "contact-sheet.jpg"));

function pdfFromJpegs(imagePaths, outputPath) {
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

  for (const imagePath of imagePaths) {
    const image = fs.readFileSync(imagePath);
    const imageId = addObject({
      stream: image,
      dict: `<< /Type /XObject /Subtype /Image /Width ${width * 2} /Height ${height * 2} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>`,
      binary: true,
    });
    const content = Buffer.from(`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im${imageId} Do\nQ\n`);
    const contentId = addObject({
      stream: content,
      dict: `<< /Length ${content.length} >>`,
      binary: false,
    });
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${imageId} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pages.push(pageId);
  }

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pages.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;

  const chunks = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "binary")];
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets[index + 1] = Buffer.concat(chunks).length;
    chunks.push(Buffer.from(`${index + 1} 0 obj\n`));

    if (typeof object === "string") {
      chunks.push(Buffer.from(`${object}\nendobj\n`));
    } else {
      chunks.push(Buffer.from(`${object.dict}\nstream\n`));
      chunks.push(object.stream);
      chunks.push(Buffer.from("\nendstream\nendobj\n"));
    }
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

pdfFromJpegs(
  selectedImages,
  path.join(selectedDir, "pin2win-selected-ad-pack.pdf"),
);

console.log(`Generated ${designs.length} new ads and selected PDF in ${selectedDir}`);

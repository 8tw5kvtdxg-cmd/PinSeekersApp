import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const outputDir = path.join(root, "public", "pin2win-portrait-ads-v4");
const qrBase64 = fs
  .readFileSync(path.join(root, "public", "alamo-golf-den-qr.png"))
  .toString("base64");

fs.mkdirSync(outputDir, { recursive: true });

const width = 1080;
const height = 1920;

function escapeText(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function rect(x, y, w, h, r, fill, options = {}) {
  const opacity = options.opacity ?? 1;
  const stroke = options.stroke
    ? ` stroke="${options.stroke}" stroke-width="${options.strokeWidth ?? 2}"`
    : "";

  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" opacity="${opacity}"${stroke}/>`;
}

function circle(cx, cy, r, fill, opacity = 1) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}"/>`;
}

function pathShape(d, fill, opacity = 1) {
  return `<path d="${d}" fill="${fill}" opacity="${opacity}"/>`;
}

function line(x1, y1, x2, y2, stroke, widthValue, opacity = 1) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${widthValue}" opacity="${opacity}" stroke-linecap="round"/>`;
}

function text(value, x, y, options = {}) {
  const {
    size = 40,
    weight = 800,
    fill = "#ffffff",
    anchor = "start",
    opacity = 1,
    tracking = 0,
    family = "Arial, Helvetica, sans-serif",
  } = options;

  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" opacity="${opacity}" letter-spacing="${tracking}">${escapeText(value)}</text>`;
}

function logo(x, y, palette = {}) {
  const markFill = palette.markFill ?? "#ffffff";
  const markText = palette.markText ?? "#101514";
  const wordFill = palette.wordFill ?? "#ffffff";
  const subFill = palette.subFill ?? wordFill;

  return `
    <g transform="translate(${x} ${y})">
      ${rect(0, 0, 96, 96, 20, markFill)}
      ${text("P2W", 48, 61, { size: 30, weight: 900, fill: markText, anchor: "middle" })}
      ${text("Pin2Win", 122, 43, { size: 50, weight: 900, fill: wordFill })}
      ${text("Golf Challenge", 124, 80, { size: 22, weight: 760, fill: subFill, opacity: 0.78 })}
    </g>
  `;
}

function qrCard(x, y, size, palette = {}) {
  const cardFill = palette.cardFill ?? "#ffffff";
  const frameFill = palette.frameFill ?? "#f4f7f2";
  const titleFill = palette.titleFill ?? "#101514";
  const subFill = palette.subFill ?? "#5f6a65";

  return `
    <g transform="translate(${x} ${y})">
      ${rect(0, 0, size, size + 154, 34, cardFill)}
      ${rect(30, 30, size - 60, size - 60, 18, frameFill)}
      <image href="data:image/png;base64,${qrBase64}" x="54" y="54" width="${size - 108}" height="${size - 108}" preserveAspectRatio="xMidYMid meet"/>
      ${text("SCAN TO PLAY", size / 2, size + 74, { size: 38, weight: 900, fill: titleFill, anchor: "middle" })}
      ${text("Get challenge access onsite", size / 2, size + 116, { size: 23, weight: 750, fill: subFill, anchor: "middle" })}
    </g>
  `;
}

function finePrint(fill = "#ffffff", y = 1868) {
  return text("Valid onsite entry required. Terms apply.", 540, y, {
    size: 22,
    weight: 700,
    fill,
    anchor: "middle",
    opacity: 0.72,
  });
}

function golferSilhouette(x, y, scale = 1, fill = "#ffffff", opacity = 0.18) {
  return `
    <g transform="translate(${x} ${y}) scale(${scale})" opacity="${opacity}" fill="${fill}" stroke="${fill}" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="62" cy="36" r="24"/>
      <path d="M48 72L118 130L90 192L122 282L84 292L54 204L22 254L-10 232L52 132Z"/>
      <path d="M112 132L174 98L190 126L130 170Z"/>
      <line x1="178" y1="92" x2="256" y2="-28" stroke-width="13"/>
    </g>
  `;
}

function golfBall(cx, cy, r, fill = "#ffffff", opacity = 1) {
  return `
    <g opacity="${opacity}">
      ${circle(cx, cy, r, fill)}
      ${circle(cx - r * 0.34, cy - r * 0.24, r * 0.08, "#cbd5d1", 0.7)}
      ${circle(cx + r * 0.12, cy - r * 0.34, r * 0.07, "#cbd5d1", 0.7)}
      ${circle(cx + r * 0.34, cy + r * 0.02, r * 0.08, "#cbd5d1", 0.7)}
      ${circle(cx - r * 0.08, cy + r * 0.28, r * 0.07, "#cbd5d1", 0.7)}
    </g>
  `;
}

function headline(lines, x, y, options = {}) {
  const gap = options.gap ?? 92;

  return lines
    .map((value, index) =>
      text(value, x, y + index * gap, {
        size: options.size ?? 86,
        weight: options.weight ?? 900,
        fill: options.fill ?? "#ffffff",
        anchor: options.anchor ?? "start",
        tracking: options.tracking ?? 0,
      }),
    )
    .join("");
}

const designs = [
  {
    id: "01-night-lights",
    svg: `
      <rect width="${width}" height="${height}" fill="#06110f"/>
      ${circle(824, 350, 390, "#39ff88", 0.18)}
      ${circle(320, 1280, 560, "#00a3ff", 0.11)}
      ${golferSilhouette(606, 314, 1.6, "#ffffff", 0.12)}
      ${logo(72, 74, { markFill: "#39ff88", markText: "#06110f" })}
      ${headline(["STEP UP.", "TAKE 5.", "CHASE 10K."], 76, 414, { size: 82, gap: 104 })}
      ${text("$25 FOR 5 SHOTS", 80, 802, { size: 43, weight: 900, fill: "#39ff88" })}
      ${text("Hole-in-one challenge access starts here.", 82, 870, { size: 31, weight: 760, fill: "#d8efe5" })}
      ${qrCard(212, 1052, 656, { frameFill: "#eafff2" })}
      ${finePrint("#d8efe5")}
    `,
  },
  {
    id: "02-arcade-rush",
    svg: `
      <rect width="${width}" height="${height}" fill="#171019"/>
      ${pathShape("M0 0H1080V716C820 610 664 672 506 764C314 875 146 834 0 748Z", "#ff315a")}
      ${pathShape("M0 1210C210 1110 380 1132 540 1230C724 1343 900 1348 1080 1246V1920H0Z", "#ffe45e")}
      ${logo(72, 74, { markFill: "#ffe45e", markText: "#171019" })}
      ${text("CAN YOU", 82, 402, { size: 78, weight: 900 })}
      ${text("STICK IT?", 82, 512, { size: 118, weight: 900, fill: "#ffe45e" })}
      ${text("$10,000 Hole-in-One Challenge", 86, 670, { size: 40, weight: 860 })}
      ${rect(82, 734, 456, 74, 37, "#ffffff")}
      ${text("$25 • 5 SHOTS", 310, 784, { size: 34, weight: 900, fill: "#171019", anchor: "middle" })}
      ${qrCard(212, 1016, 656, { frameFill: "#fff8ca" })}
      ${finePrint("#171019", 1868)}
    `,
  },
  {
    id: "03-scoreboard-glow",
    svg: `
      <rect width="${width}" height="${height}" fill="#102027"/>
      ${rect(64, 64, 952, 1792, 34, "#152f38", { stroke: "#5eead4", strokeWidth: 4 })}
      ${line(100, 288, 980, 288, "#5eead4", 3, 0.35)}
      ${line(100, 1576, 980, 1576, "#5eead4", 3, 0.35)}
      ${logo(96, 94, { markFill: "#5eead4", markText: "#102027" })}
      ${text("LIVE CHALLENGE", 540, 404, { size: 48, weight: 900, fill: "#5eead4", anchor: "middle", tracking: 5 })}
      ${text("$10,000", 540, 620, { size: 146, weight: 900, anchor: "middle" })}
      ${text("HOLE-IN-ONE", 540, 724, { size: 62, weight: 900, fill: "#d7fffb", anchor: "middle", tracking: 2 })}
      ${text("$25 entry • 5 shots", 540, 812, { size: 42, weight: 780, fill: "#bdd8d5", anchor: "middle" })}
      ${golfBall(842, 930, 62, "#ffffff", 0.95)}
      ${qrCard(232, 1038, 616, { frameFill: "#ebfffb" })}
      ${finePrint("#bdd8d5")}
    `,
  },
  {
    id: "04-prize-spotlight",
    svg: `
      <rect width="${width}" height="${height}" fill="#050505"/>
      ${pathShape("M180 0H900L704 1920H376Z", "#facc15", 0.18)}
      ${circle(540, 608, 374, "#facc15", 0.15)}
      ${golferSilhouette(660, 356, 1.35, "#facc15", 0.18)}
      ${logo(72, 74, { markFill: "#facc15", markText: "#050505" })}
      ${text("ONE PERFECT", 80, 426, { size: 72, weight: 900 })}
      ${text("SHOT", 80, 550, { size: 154, weight: 900, fill: "#facc15" })}
      ${text("$10,000 is on the line.", 84, 680, { size: 42, weight: 820 })}
      ${text("$25 for 5 shots • scan to enter", 84, 748, { size: 34, weight: 760, fill: "#f7eab4" })}
      ${qrCard(212, 1044, 656, { frameFill: "#fff7d6" })}
      ${finePrint("#f7eab4")}
    `,
  },
  {
    id: "05-clean-electric",
    svg: `
      <rect width="${width}" height="${height}" fill="#f8fafc"/>
      ${rect(0, 0, 1080, 710, 0, "#0f172a")}
      ${pathShape("M0 642C230 714 344 698 540 624C736 550 874 574 1080 646V844H0Z", "#2563eb")}
      ${logo(72, 74, { markFill: "#ffffff", wordFill: "#ffffff" })}
      ${text("PLAY THE", 540, 392, { size: 70, weight: 900, anchor: "middle" })}
      ${text("PIN2WIN", 540, 506, { size: 108, weight: 900, fill: "#93c5fd", anchor: "middle" })}
      ${text("HOLE-IN-ONE CHALLENGE", 540, 650, { size: 44, weight: 900, anchor: "middle", tracking: 2 })}
      ${text("$25 for 5 shots • $10,000 prize", 540, 910, { size: 42, weight: 860, fill: "#0f172a", anchor: "middle" })}
      ${qrCard(232, 1016, 616, { frameFill: "#eef5ff" })}
      ${finePrint("#64748b")}
    `,
  },
  {
    id: "06-locker-room",
    svg: `
      <rect width="${width}" height="${height}" fill="#2a2118"/>
      ${rect(74, 74, 932, 1772, 28, "#3b2f22", { stroke: "#d9a441", strokeWidth: 4 })}
      ${line(112, 282, 968, 282, "#d9a441", 3, 0.45)}
      ${line(112, 900, 968, 900, "#d9a441", 3, 0.2)}
      ${logo(100, 102, { markFill: "#d9a441", markText: "#2a2118" })}
      ${text("BRAGGING", 540, 412, { size: 76, weight: 900, anchor: "middle" })}
      ${text("RIGHTS", 540, 512, { size: 92, weight: 900, fill: "#d9a441", anchor: "middle" })}
      ${text("+ $10,000", 540, 646, { size: 108, weight: 900, anchor: "middle" })}
      ${text("5 shots. 1 pin. No excuses.", 540, 756, { size: 40, weight: 820, fill: "#ecd7b0", anchor: "middle" })}
      ${rect(326, 806, 428, 74, 37, "#d9a441")}
      ${text("$25 ENTRY", 540, 856, { size: 34, weight: 900, fill: "#2a2118", anchor: "middle" })}
      ${qrCard(232, 1032, 616, { frameFill: "#fff4dd" })}
      ${finePrint("#ecd7b0")}
    `,
  },
  {
    id: "07-social-bold",
    svg: `
      <rect width="${width}" height="${height}" fill="#ffffff"/>
      ${rect(0, 0, 1080, 1920, 0, "#ffffff")}
      ${pathShape("M0 0H1080V1130L0 772Z", "#111827")}
      ${pathShape("M0 1230L1080 882V1920H0Z", "#22c55e")}
      ${golfBall(846, 300, 86, "#ffffff", 1)}
      ${logo(72, 74, { markFill: "#22c55e", markText: "#111827" })}
      ${text("THINK", 82, 390, { size: 96, weight: 900 })}
      ${text("YOU CAN", 82, 506, { size: 96, weight: 900 })}
      ${text("ACE IT?", 82, 622, { size: 116, weight: 900, fill: "#22c55e" })}
      ${text("$10,000 Hole-in-One Challenge", 86, 748, { size: 38, weight: 820 })}
      ${text("$25 for 5 shots", 86, 812, { size: 42, weight: 900, fill: "#bbf7d0" })}
      ${qrCard(212, 1044, 656, { frameFill: "#f0fff4" })}
      ${finePrint("#0f2418")}
    `,
  },
  {
    id: "08-red-zone",
    svg: `
      <rect width="${width}" height="${height}" fill="#190b0b"/>
      ${rect(0, 0, 1080, 520, 0, "#ef233c")}
      ${circle(896, 546, 290, "#ffffff", 0.1)}
      ${golferSilhouette(632, 282, 1.45, "#ffffff", 0.18)}
      ${logo(72, 74)}
      ${text("WARNING:", 82, 410, { size: 68, weight: 900 })}
      ${text("PINS MAY", 82, 540, { size: 106, weight: 900 })}
      ${text("BE HUNTED", 82, 656, { size: 106, weight: 900, fill: "#ffccd3" })}
      ${text("$25 for 5 shots • $10,000 prize", 86, 778, { size: 38, weight: 820 })}
      ${qrCard(212, 1036, 656, { frameFill: "#fff0f2" })}
      ${finePrint("#ffd6dc")}
    `,
  },
  {
    id: "09-country-club-neon",
    svg: `
      <rect width="${width}" height="${height}" fill="#eef8ef"/>
      ${pathShape("M0 0H1080V740C848 820 696 782 540 710C324 610 170 642 0 742Z", "#12372a")}
      ${pathShape("M0 1500C234 1396 374 1414 540 1504C714 1598 890 1582 1080 1496V1920H0Z", "#12372a")}
      ${circle(824, 284, 220, "#b5ff3d", 0.32)}
      ${logo(72, 74, { markFill: "#b5ff3d", markText: "#12372a" })}
      ${text("GREEN LIGHT", 540, 400, { size: 72, weight: 900, anchor: "middle" })}
      ${text("TO GO FOR IT", 540, 506, { size: 78, weight: 900, fill: "#b5ff3d", anchor: "middle" })}
      ${text("$10,000 Hole-in-One Challenge", 540, 844, { size: 42, weight: 880, fill: "#12372a", anchor: "middle" })}
      ${rect(304, 894, 472, 78, 39, "#12372a")}
      ${text("$25 • 5 SHOTS", 540, 947, { size: 35, weight: 900, anchor: "middle" })}
      ${qrCard(232, 1040, 616, { frameFill: "#f6fff5" })}
      ${finePrint("#d9f6df")}
    `,
  },
  {
    id: "10-vip-ticket",
    svg: `
      <rect width="${width}" height="${height}" fill="#101014"/>
      ${rect(86, 126, 908, 1668, 44, "#f5f0e8")}
      ${circle(86, 960, 70, "#101014")}
      ${circle(994, 960, 70, "#101014")}
      ${line(166, 960, 914, 960, "#101014", 4, 0.22)}
      ${logo(146, 194, { markFill: "#101014", markText: "#f5f0e8", wordFill: "#101014", subFill: "#101014" })}
      ${text("CHALLENGE", 540, 472, { size: 48, weight: 900, fill: "#6b5a3c", anchor: "middle", tracking: 6 })}
      ${text("TICKET", 540, 566, { size: 104, weight: 900, fill: "#101014", anchor: "middle" })}
      ${text("$10,000", 540, 740, { size: 126, weight: 900, fill: "#c28b20", anchor: "middle" })}
      ${text("HOLE-IN-ONE PRIZE", 540, 828, { size: 42, weight: 900, fill: "#101014", anchor: "middle" })}
      ${text("$25 for 5 shots", 540, 1068, { size: 44, weight: 900, fill: "#101014", anchor: "middle" })}
      ${qrCard(252, 1136, 576, { frameFill: "#f5f0e8" })}
      ${text("Scan onsite to unlock your entry.", 540, 1760, { size: 30, weight: 780, fill: "#6b5a3c", anchor: "middle" })}
    `,
  },
];

function svgDocument(body) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${body}
    </svg>
  `;
}

async function writeDesign(design) {
  const svg = svgDocument(design.svg);
  const svgPath = path.join(outputDir, `${design.id}.svg`);
  const jpgPath = path.join(outputDir, `${design.id}.jpg`);

  fs.writeFileSync(svgPath, svg);
  await sharp(Buffer.from(svg)).jpeg({ quality: 94 }).toFile(jpgPath);

  return jpgPath;
}

const jpgs = [];

for (const design of designs) {
  jpgs.push(await writeDesign(design));
}

const thumbWidth = 270;
const thumbHeight = 480;
const gap = 28;
const sheetWidth = thumbWidth * 5 + gap * 6;
const sheetHeight = (thumbHeight + 54) * 2 + gap * 3;
const composites = [];

for (const [index, jpgPath] of jpgs.entries()) {
  const column = index % 5;
  const row = Math.floor(index / 5);
  const left = gap + column * (thumbWidth + gap);
  const top = gap + row * (thumbHeight + 54 + gap);
  const imageBuffer = await sharp(jpgPath)
    .resize(thumbWidth, thumbHeight)
    .jpeg({ quality: 92 })
    .toBuffer();
  const labelSvg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${thumbWidth}" height="42">
      <rect width="${thumbWidth}" height="42" fill="#ffffff"/>
      <text x="${thumbWidth / 2}" y="28" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900" fill="#111827">${index + 1}. ${designs[index].id.replace(/^[0-9]+-/, "").replaceAll("-", " ")}</text>
    </svg>
  `);

  composites.push({ input: imageBuffer, left, top });
  composites.push({ input: labelSvg, left, top: top + thumbHeight + 8 });
}

await sharp({
  create: {
    width: sheetWidth,
    height: sheetHeight,
    channels: 3,
    background: "#f3f4f6",
  },
})
  .composite(composites)
  .jpeg({ quality: 94 })
  .toFile(path.join(outputDir, "contact-sheet.jpg"));

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
    pages.push(pageId);
  }

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

const pdfPath = path.join(outputDir, "pin2win-portrait-ads-v4.pdf");
pdfFromJpegs(jpgs, pdfPath);

console.log(`Generated ${jpgs.length} banners in ${outputDir}`);
console.log(path.join(outputDir, "contact-sheet.jpg"));
console.log(pdfPath);

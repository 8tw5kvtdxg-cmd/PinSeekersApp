import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const outputDir = path.join(root, "public", "pin2win-portrait-ads-v2");
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
  const markText = palette.markText ?? "#111817";
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
  const frameFill = palette.frameFill ?? "#f5f1e8";
  const titleFill = palette.titleFill ?? "#111817";
  const subFill = palette.subFill ?? "#66716b";

  return `
    <g transform="translate(${x} ${y})">
      ${rect(0, 0, size, size + 164, 32, cardFill)}
      ${rect(30, 30, size - 60, size - 60, 18, frameFill)}
      <image href="data:image/png;base64,${qrBase64}" x="52" y="52" width="${size - 104}" height="${size - 104}" preserveAspectRatio="xMidYMid meet"/>
      ${text("SCAN TO PLAY", size / 2, size + 78, { size: 39, weight: 900, fill: titleFill, anchor: "middle" })}
      ${text("Create your entry onsite", size / 2, size + 120, { size: 23, weight: 700, fill: subFill, anchor: "middle" })}
    </g>
  `;
}

function finePrint(fill = "#ffffff", opacity = 0.66, y = 1868) {
  return text("Valid onsite entry required. Terms apply.", 540, y, {
    size: 22,
    weight: 650,
    fill,
    anchor: "middle",
    opacity,
  });
}

function headlineLines(lines, x, y, options = {}) {
  const gap = options.gap ?? 94;
  return lines
    .map((line, index) =>
      text(line, x, y + index * gap, {
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
    id: "01-obsidian-lime",
    bg: "#0b1110",
    svg: `
      <rect width="${width}" height="${height}" fill="#0b1110"/>
      ${circle(820, 360, 420, "#b8ff5c", 0.12)}
      ${circle(260, 1520, 420, "#ffffff", 0.06)}
      ${logo(72, 78, { markFill: "#b8ff5c", markText: "#0b1110" })}
      ${headlineLines(["Win", "$10,000"], 76, 402, { size: 132, gap: 146 })}
      ${text("Hole-in-One Challenge", 80, 692, { size: 48, weight: 760, fill: "#b8ff5c" })}
      ${rect(78, 770, 512, 82, 41, "#ffffff")}
      ${text("$25 for 5 shots", 334, 825, { size: 38, weight: 900, fill: "#0b1110", anchor: "middle" })}
      ${text("Scan the QR code to unlock your entry.", 80, 936, { size: 35, weight: 720, fill: "#dbe6df" })}
      ${qrCard(212, 1028, 656, { frameFill: "#eef7e7", titleFill: "#0b1110" })}
      ${finePrint("#dbe6df", 0.66, 1876)}
    `,
  },
  {
    id: "02-cream-forest",
    bg: "#f7f1e6",
    svg: `
      <rect width="${width}" height="${height}" fill="#f7f1e6"/>
      <path d="M0 0H1080V690C882 750 704 724 540 658C341 578 174 598 0 690V0Z" fill="#173b2d"/>
      ${circle(830, 214, 260, "#d9a441", 0.32)}
      ${logo(72, 78)}
      ${text("A real shot", 540, 382, { size: 72, weight: 850, anchor: "middle" })}
      ${text("at $10,000", 540, 492, { size: 106, weight: 900, fill: "#f4d35e", anchor: "middle" })}
      ${text("Pin2Win Hole-in-One Challenge", 540, 792, { size: 45, weight: 850, fill: "#173b2d", anchor: "middle" })}
      ${rect(250, 846, 580, 78, 39, "#173b2d")}
      ${text("$25 entry • 5 shots", 540, 899, { size: 36, weight: 880, anchor: "middle" })}
      ${qrCard(212, 1038, 656, { frameFill: "#f7f1e6" })}
      ${finePrint("#53615b", 0.9, 1884)}
    `,
  },
  {
    id: "03-navy-mint",
    bg: "#0d1b2a",
    svg: `
      <rect width="${width}" height="${height}" fill="#0d1b2a"/>
      <path d="M68 324H1012V1668H68V324Z" fill="#13283a" stroke="#8ef4c9" stroke-width="4"/>
      ${circle(880, 232, 180, "#8ef4c9", 0.22)}
      ${logo(94, 88, { markFill: "#8ef4c9", markText: "#0d1b2a" })}
      ${text("HOLE-IN-ONE", 540, 470, { size: 54, weight: 900, fill: "#8ef4c9", anchor: "middle", tracking: 5 })}
      ${text("CHALLENGE", 540, 542, { size: 54, weight: 900, fill: "#8ef4c9", anchor: "middle", tracking: 5 })}
      ${text("$10,000", 540, 742, { size: 130, weight: 900, anchor: "middle" })}
      ${text("$25 for 5 shots", 540, 846, { size: 46, weight: 820, fill: "#ffffff", anchor: "middle" })}
      ${text("Scan onsite to get access", 540, 930, { size: 32, weight: 700, fill: "#c7d8e4", anchor: "middle" })}
      ${qrCard(232, 1052, 616, { frameFill: "#e9fff6" })}
      ${finePrint("#c7d8e4", 0.66, 1858)}
    `,
  },
  {
    id: "04-white-blue",
    bg: "#ffffff",
    svg: `
      <rect width="${width}" height="${height}" fill="#ffffff"/>
      <rect x="0" y="0" width="1080" height="930" fill="#f4f7fb"/>
      <path d="M0 0H426V1920H0V0Z" fill="#102331"/>
      ${logo(70, 78, { markFill: "#ffffff", wordFill: "#102331", subFill: "#102331" })}
      ${text("TAKE", 112, 410, { size: 104, weight: 900, fill: "#ffffff" })}
      ${text("YOUR", 112, 522, { size: 104, weight: 900, fill: "#ffffff" })}
      ${text("SHOT", 112, 634, { size: 104, weight: 900, fill: "#7dd3fc" })}
      ${text("$10,000", 542, 486, { size: 116, weight: 900, fill: "#102331" })}
      ${text("Hole-in-One Prize", 548, 562, { size: 38, weight: 740, fill: "#51616d" })}
      ${rect(548, 628, 402, 76, 38, "#102331")}
      ${text("$25 • 5 shots", 749, 680, { size: 36, weight: 850, anchor: "middle" })}
      ${qrCard(232, 1038, 616, { frameFill: "#f4f7fb" })}
      ${finePrint("#66716b", 0.88, 1856)}
    `,
  },
  {
    id: "05-black-gold",
    bg: "#080808",
    svg: `
      <rect width="${width}" height="${height}" fill="#080808"/>
      ${rect(54, 54, 972, 1812, 34, "#111111", { stroke: "#c9a24d", strokeWidth: 3 })}
      ${circle(540, 586, 410, "#c9a24d", 0.1)}
      ${logo(92, 98, { markFill: "#c9a24d", markText: "#080808" })}
      ${text("PIN2WIN", 540, 396, { size: 42, weight: 900, fill: "#c9a24d", anchor: "middle", tracking: 8 })}
      ${text("$10,000", 540, 608, { size: 138, weight: 900, anchor: "middle" })}
      ${text("Hole-in-One Challenge", 540, 692, { size: 45, weight: 760, fill: "#f3ead8", anchor: "middle" })}
      ${rect(270, 770, 540, 86, 43, "#c9a24d")}
      ${text("$25 FOR 5 SHOTS", 540, 828, { size: 38, weight: 900, fill: "#080808", anchor: "middle" })}
      ${qrCard(232, 1034, 616, { frameFill: "#f5efdf" })}
      ${finePrint("#f3ead8", 0.66, 1854)}
    `,
  },
  {
    id: "06-slate-coral",
    bg: "#263238",
    svg: `
      <rect width="${width}" height="${height}" fill="#263238"/>
      <path d="M0 1260C194 1188 347 1198 540 1276C733 1354 896 1344 1080 1260V1920H0V1260Z" fill="#f4efe8"/>
      ${circle(852, 292, 278, "#ff7f6e", 0.24)}
      ${logo(72, 78)}
      ${text("5 shots.", 82, 418, { size: 96, weight: 880 })}
      ${text("One ace.", 82, 532, { size: 96, weight: 880 })}
      ${text("$10,000.", 82, 646, { size: 104, weight: 900, fill: "#ffb56b" })}
      ${text("Entry is $25. Scan onsite to play.", 86, 762, { size: 36, weight: 700, fill: "#e5efec" })}
      ${qrCard(212, 1024, 656, { frameFill: "#f4efe8", titleFill: "#263238" })}
      ${finePrint("#6a726f", 0.9, 1872)}
    `,
  },
  {
    id: "07-sand-charcoal",
    bg: "#e9ddc7",
    svg: `
      <rect width="${width}" height="${height}" fill="#e9ddc7"/>
      <rect x="84" y="84" width="912" height="1752" rx="46" fill="#fbf8f1"/>
      <rect x="124" y="124" width="832" height="620" rx="34" fill="#202624"/>
      ${circle(792, 276, 180, "#d7ad55", 0.36)}
      ${logo(154, 164)}
      ${text("Your moment", 540, 418, { size: 62, weight: 820, anchor: "middle" })}
      ${text("to win", 540, 506, { size: 62, weight: 820, anchor: "middle" })}
      ${text("$10,000", 540, 636, { size: 96, weight: 900, fill: "#d7ad55", anchor: "middle" })}
      ${text("Hole-in-One Challenge", 540, 874, { size: 52, weight: 900, fill: "#202624", anchor: "middle" })}
      ${text("$25 for 5 shots", 540, 948, { size: 40, weight: 850, fill: "#657068", anchor: "middle" })}
      ${qrCard(232, 1048, 616, { frameFill: "#fbf8f1" })}
      ${finePrint("#657068", 0.9, 1866)}
    `,
  },
  {
    id: "08-teal-lime",
    bg: "#073b3a",
    svg: `
      <rect width="${width}" height="${height}" fill="#073b3a"/>
      <path d="M0 0H1080V760C858 672 704 712 540 788C343 878 178 856 0 760V0Z" fill="#0b5251"/>
      ${circle(198, 1410, 360, "#c7f464", 0.14)}
      ${logo(72, 78, { markFill: "#c7f464", markText: "#073b3a" })}
      ${text("SCAN.", 82, 376, { size: 92, weight: 900, fill: "#c7f464" })}
      ${text("SWING.", 82, 486, { size: 92, weight: 900 })}
      ${text("WIN.", 82, 596, { size: 92, weight: 900, fill: "#c7f464" })}
      ${text("$10,000 Hole-in-One Prize", 86, 730, { size: 42, weight: 820, fill: "#ffffff" })}
      ${rect(84, 792, 492, 74, 37, "#ffffff")}
      ${text("$25 for 5 shots", 330, 842, { size: 34, weight: 900, fill: "#073b3a", anchor: "middle" })}
      ${qrCard(212, 1038, 656, { frameFill: "#ebfff4" })}
      ${finePrint("#dff4ed", 0.66, 1884)}
    `,
  },
  {
    id: "09-red-black",
    bg: "#151515",
    svg: `
      <rect width="${width}" height="${height}" fill="#151515"/>
      <rect x="0" y="0" width="1080" height="500" fill="#ef4444"/>
      <path d="M0 430C186 502 348 490 540 422C732 354 896 338 1080 430V620H0V430Z" fill="#151515"/>
      ${logo(72, 78)}
      ${text("ACE", 540, 442, { size: 132, weight: 900, anchor: "middle" })}
      ${text("THE CHALLENGE", 540, 540, { size: 46, weight: 900, fill: "#fecaca", anchor: "middle", tracking: 4 })}
      ${text("Win $10,000", 540, 752, { size: 96, weight: 900, anchor: "middle" })}
      ${text("$25 entry • 5 shots", 540, 834, { size: 42, weight: 800, fill: "#f4f4f5", anchor: "middle" })}
      ${qrCard(212, 1036, 656, { frameFill: "#fff1f1" })}
      ${finePrint("#f4f4f5", 0.66, 1882)}
    `,
  },
  {
    id: "10-gallery-white",
    bg: "#f9faf8",
    svg: `
      <rect width="${width}" height="${height}" fill="#f9faf8"/>
      <rect x="0" y="0" width="1080" height="352" fill="#111817"/>
      ${logo(72, 78)}
      ${text("HOLE-IN-ONE CHALLENGE", 540, 512, { size: 42, weight: 900, fill: "#60746b", anchor: "middle", tracking: 4 })}
      ${text("$10,000", 540, 690, { size: 150, weight: 900, fill: "#111817", anchor: "middle" })}
      ${text("prize", 540, 768, { size: 48, weight: 760, fill: "#60746b", anchor: "middle" })}
      ${rect(242, 856, 596, 86, 43, "#111817")}
      ${text("$25 for 5 shots", 540, 914, { size: 39, weight: 900, anchor: "middle" })}
      ${text("Scan onsite to get access", 540, 1018, { size: 34, weight: 720, fill: "#60746b", anchor: "middle" })}
      ${qrCard(232, 1058, 616, { frameFill: "#f9faf8" })}
      ${finePrint("#60746b", 0.9, 1876)}
    `,
  },
];

function wrapSvg(inner) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

for (const design of designs) {
  const svg = wrapSvg(design.svg);
  const svgPath = path.join(outputDir, `${design.id}.svg`);
  const jpgPath = path.join(outputDir, `${design.id}.jpg`);

  fs.writeFileSync(svgPath, svg);
  await sharp(Buffer.from(svg), { density: 144 })
    .jpeg({ quality: 94, mozjpeg: true })
    .toFile(jpgPath);
}

const thumbs = await Promise.all(
  designs.map((design, index) =>
    sharp(path.join(outputDir, `${design.id}.jpg`))
      .resize(270, 480)
      .extend({
        top: 46,
        bottom: 18,
        left: 0,
        right: 0,
        background: "#ffffff",
      })
      .composite([
        {
          input: Buffer.from(
            `<svg width="270" height="46" xmlns="http://www.w3.org/2000/svg"><rect width="270" height="46" fill="#ffffff"/><text x="135" y="30" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="800" fill="#111817">Design ${String(index + 1).padStart(2, "0")}</text></svg>`,
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
    width: 270 * 5,
    height: 544 * 2,
    channels: 3,
    background: "#f2f4f1",
  },
})
  .composite(
    thumbs.map((input, index) => ({
      input,
      left: (index % 5) * 270,
      top: Math.floor(index / 5) * 544,
    })),
  )
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile(path.join(outputDir, "contact-sheet.jpg"));

console.log(`Generated ${designs.length} cleaner portrait ad designs in ${outputDir}`);

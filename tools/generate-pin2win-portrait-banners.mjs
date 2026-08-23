import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const outputDir = path.join(root, "public", "pin2win-portrait-ads");
const qrPath = path.join(root, "public", "alamo-golf-den-qr.png");
const qrBase64 = fs.readFileSync(qrPath).toString("base64");

fs.mkdirSync(outputDir, { recursive: true });

const width = 1080;
const height = 1920;

function text(
  content,
  {
    x,
    y,
    size,
    weight = 800,
    fill = "#ffffff",
    anchor = "start",
    letterSpacing = 0,
    opacity = 1,
  },
) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Inter, Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" letter-spacing="${letterSpacing}" opacity="${opacity}">${content}</text>`;
}

function roundedRect(x, y, w, h, r, fill, opacity = 1, stroke = "", sw = 0) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" opacity="${opacity}"${stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : ""}/>`;
}

function qrCard(x, y, size, labelFill = "#13201c", mutedFill = "#59655f") {
  return `
    <g transform="translate(${x} ${y})">
      ${roundedRect(0, 0, size, size + 166, 34, "#ffffff", 1)}
      ${roundedRect(28, 28, size - 56, size - 56, 22, "#f5efdf", 1)}
      <image href="data:image/png;base64,${qrBase64}" x="46" y="46" width="${size - 92}" height="${size - 92}" preserveAspectRatio="xMidYMid meet"/>
      ${text("SCAN TO PLAY", { x: size / 2, y: size + 76, size: 39, weight: 950, fill: labelFill, anchor: "middle" })}
      ${text("Onsite entry required", { x: size / 2, y: size + 121, size: 24, weight: 800, fill: mutedFill, anchor: "middle" })}
    </g>
  `;
}

function logo(x, y, fill = "#ffffff", markFill = "#f5efdf", markText = "#13201c") {
  return `
    <g transform="translate(${x} ${y})">
      ${roundedRect(0, 0, 94, 94, 20, markFill, 1)}
      ${text("P2W", { x: 47, y: 59, size: 28, weight: 950, fill: markText, anchor: "middle" })}
      ${text("Pin2Win", { x: 118, y: 43, size: 48, weight: 950, fill })}
      ${text("Golf entertainment challenge", { x: 120, y: 78, size: 22, weight: 800, fill, opacity: 0.82 })}
    </g>
  `;
}

function shotDots(x, y, color = "#f6d35f") {
  return Array.from({ length: 5 }, (_, index) => {
    const cx = x + index * 54;
    return `<circle cx="${cx}" cy="${y}" r="18" fill="${color}"/><circle cx="${cx}" cy="${y}" r="7" fill="#ffffff" opacity="0.75"/>`;
  }).join("");
}

const designs = [
  {
    name: "01-green-prize-card",
    svg: `
      <rect width="${width}" height="${height}" fill="#11231d"/>
      <circle cx="846" cy="238" r="410" fill="#f6d35f" opacity="0.22"/>
      <path d="M0 1392C201 1292 377 1313 558 1391C735 1467 893 1456 1080 1372V1920H0V1392Z" fill="#f5efdf"/>
      ${logo(74, 88)}
      ${text("HOLE-IN-ONE", { x: 74, y: 352, size: 62, weight: 950, fill: "#f6d35f", letterSpacing: 3 })}
      ${text("CHALLENGE", { x: 74, y: 424, size: 62, weight: 950, fill: "#f6d35f", letterSpacing: 3 })}
      ${text("Win $10,000", { x: 74, y: 598, size: 104, weight: 950 })}
      ${text("$25 for 5 shots", { x: 74, y: 710, size: 58, weight: 950, fill: "#f6d35f" })}
      ${shotDots(78, 790)}
      ${roundedRect(70, 884, 834, 142, 28, "#ffffff", 0.14)}
      ${text("Scan the QR code onsite to create your entry and unlock challenge access.", { x: 108, y: 940, size: 31, weight: 850 })}
      ${text("Valid onsite entry required. Terms apply.", { x: 108, y: 987, size: 23, weight: 760, fill: "#d9e8d2" })}
      ${qrCard(202, 1038, 676)}
    `,
  },
  {
    name: "02-white-luxury",
    svg: `
      <rect width="${width}" height="${height}" fill="#f8f5ec"/>
      <rect x="0" y="0" width="${width}" height="820" fill="#10251f"/>
      <path d="M0 702C182 632 338 657 515 716C721 786 891 771 1080 681V900H0V702Z" fill="#2f6b3f"/>
      <circle cx="875" cy="210" r="270" fill="#f6d35f" opacity="0.28"/>
      ${logo(70, 80)}
      ${text("5 SHOTS", { x: 540, y: 370, size: 70, weight: 950, fill: "#f6d35f", anchor: "middle", letterSpacing: 4 })}
      ${text("$25 ENTRY", { x: 540, y: 468, size: 70, weight: 950, fill: "#ffffff", anchor: "middle", letterSpacing: 2 })}
      ${text("ONE PERFECT SWING", { x: 540, y: 562, size: 40, weight: 950, fill: "#d9e8d2", anchor: "middle", letterSpacing: 2 })}
      ${roundedRect(76, 894, 928, 322, 36, "#ffffff", 1, "#ded6c8", 3)}
      ${text("Hole-in-One Challenge", { x: 540, y: 1006, size: 56, weight: 950, fill: "#13201c", anchor: "middle" })}
      ${text("Win $10,000", { x: 540, y: 1110, size: 86, weight: 950, fill: "#2f6b3f", anchor: "middle" })}
      ${qrCard(212, 1286, 656)}
    `,
  },
  {
    name: "03-bold-yellow",
    svg: `
      <rect width="${width}" height="${height}" fill="#f6d35f"/>
      <path d="M-40 0H1120V1010C914 914 731 920 532 1008C341 1092 158 1106 -40 1014V0Z" fill="#12241f"/>
      <circle cx="130" cy="1360" r="520" fill="#ffffff" opacity="0.42"/>
      ${logo(74, 88)}
      ${text("TAKE", { x: 74, y: 372, size: 112, weight: 950 })}
      ${text("YOUR", { x: 74, y: 492, size: 112, weight: 950 })}
      ${text("SHOT", { x: 74, y: 612, size: 112, weight: 950, fill: "#f6d35f" })}
      ${text("$10,000 HOLE-IN-ONE PRIZE", { x: 76, y: 716, size: 34, weight: 950, fill: "#ffffff", letterSpacing: 2 })}
      ${roundedRect(74, 786, 620, 88, 44, "#f6d35f")}
      ${text("$25 FOR 5 SHOTS", { x: 384, y: 845, size: 42, weight: 950, fill: "#13201c", anchor: "middle" })}
      ${qrCard(210, 988, 660)}
      ${text("Scan onsite to enter", { x: 540, y: 1848, size: 35, weight: 950, fill: "#13201c", anchor: "middle" })}
    `,
  },
  {
    name: "04-scoreboard",
    svg: `
      <rect width="${width}" height="${height}" fill="#0d1816"/>
      <g opacity="0.14">${Array.from({ length: 22 }, (_, row) => Array.from({ length: 10 }, (_, col) => `<circle cx="${110 + col * 96}" cy="${242 + row * 62}" r="5" fill="#f6d35f"/>`).join("")).join("")}</g>
      ${logo(74, 78)}
      ${roundedRect(70, 278, 940, 244, 18, "#13201c", 1, "#f6d35f", 4)}
      ${text("PRIZE", { x: 122, y: 374, size: 44, weight: 950, fill: "#d9e8d2", letterSpacing: 3 })}
      ${text("$10,000", { x: 122, y: 482, size: 104, weight: 950, fill: "#f6d35f" })}
      ${roundedRect(70, 572, 940, 258, 18, "#f5efdf")}
      ${text("HOLE-IN-ONE CHALLENGE", { x: 540, y: 670, size: 49, weight: 950, fill: "#13201c", anchor: "middle" })}
      ${text("$25 gets you 5 shots", { x: 540, y: 760, size: 53, weight: 950, fill: "#2f6b3f", anchor: "middle" })}
      ${qrCard(202, 1002, 676)}
      ${text("Scan the QR code to get access", { x: 540, y: 1888, size: 34, weight: 900, fill: "#ffffff", anchor: "middle" })}
    `,
  },
  {
    name: "05-minimal-premium",
    svg: `
      <rect width="${width}" height="${height}" fill="#ffffff"/>
      <rect x="0" y="0" width="${width}" height="1060" fill="#f5efdf"/>
      <circle cx="540" cy="480" r="390" fill="#2f6b3f" opacity="0.13"/>
      ${logo(72, 82, "#13201c", "#13201c", "#ffffff")}
      ${text("Can you", { x: 540, y: 420, size: 82, weight: 900, fill: "#13201c", anchor: "middle" })}
      ${text("ACE IT?", { x: 540, y: 548, size: 130, weight: 950, fill: "#2f6b3f", anchor: "middle", letterSpacing: 2 })}
      ${text("$10,000", { x: 540, y: 712, size: 122, weight: 950, fill: "#13201c", anchor: "middle" })}
      ${text("Hole-in-One Prize", { x: 540, y: 784, size: 40, weight: 850, fill: "#59655f", anchor: "middle" })}
      ${roundedRect(220, 856, 640, 86, 43, "#13201c")}
      ${text("$25 for 5 shots", { x: 540, y: 914, size: 42, weight: 950, fill: "#ffffff", anchor: "middle" })}
      ${qrCard(202, 1128, 676)}
    `,
  },
  {
    name: "06-action-lines",
    svg: `
      <rect width="${width}" height="${height}" fill="#173d29"/>
      <path d="M-80 322L1160 62" stroke="#f6d35f" stroke-width="34" opacity="0.28"/>
      <path d="M-100 500L1160 236" stroke="#ffffff" stroke-width="12" opacity="0.2"/>
      <path d="M-80 1200L1160 944" stroke="#f6d35f" stroke-width="28" opacity="0.18"/>
      ${logo(74, 82)}
      ${text("SWING FOR", { x: 74, y: 420, size: 72, weight: 950, fill: "#ffffff", letterSpacing: 3 })}
      ${text("$10,000", { x: 74, y: 564, size: 126, weight: 950, fill: "#f6d35f" })}
      ${text("Hole-in-One Challenge", { x: 76, y: 652, size: 48, weight: 900, fill: "#ffffff" })}
      ${roundedRect(74, 720, 760, 104, 24, "#ffffff", 0.95)}
      ${text("$25 ENTRY • 5 SHOTS", { x: 110, y: 790, size: 43, weight: 950, fill: "#13201c" })}
      ${qrCard(202, 1018, 676)}
      ${text("Scan onsite to unlock challenge access", { x: 540, y: 934, size: 31, weight: 850, fill: "#d9e8d2", anchor: "middle" })}
    `,
  },
  {
    name: "07-clubhouse-poster",
    svg: `
      <rect width="${width}" height="${height}" fill="#f5efdf"/>
      <rect x="52" y="52" width="976" height="1816" rx="44" fill="#ffffff" stroke="#ded6c8" stroke-width="4"/>
      <rect x="88" y="88" width="904" height="560" rx="34" fill="#13201c"/>
      <circle cx="812" cy="230" r="210" fill="#f6d35f" opacity="0.28"/>
      ${logo(126, 128)}
      ${text("PIN HUNTING", { x: 540, y: 386, size: 72, weight: 950, fill: "#f6d35f", anchor: "middle", letterSpacing: 3 })}
      ${text("STARTS HERE", { x: 540, y: 472, size: 58, weight: 950, fill: "#ffffff", anchor: "middle", letterSpacing: 2 })}
      ${text("Hole-in-One Challenge", { x: 540, y: 764, size: 58, weight: 950, fill: "#13201c", anchor: "middle" })}
      ${text("$10,000 Prize", { x: 540, y: 876, size: 90, weight: 950, fill: "#2f6b3f", anchor: "middle" })}
      ${text("$25 for 5 shots", { x: 540, y: 954, size: 48, weight: 950, fill: "#13201c", anchor: "middle" })}
      ${qrCard(232, 1116, 616)}
    `,
  },
  {
    name: "08-dark-ticket",
    svg: `
      <rect width="${width}" height="${height}" fill="#091512"/>
      <path d="M0 0H1080V1920H0V0Z" fill="#091512"/>
      <path d="M80 258H1000V1662H80V258Z" fill="#13201c" stroke="#f6d35f" stroke-width="4" stroke-dasharray="18 18"/>
      ${logo(126, 90)}
      ${text("ENTRY TICKET", { x: 540, y: 398, size: 46, weight: 950, fill: "#f6d35f", anchor: "middle", letterSpacing: 5 })}
      ${text("Hole-in-One", { x: 540, y: 534, size: 86, weight: 950, fill: "#ffffff", anchor: "middle" })}
      ${text("Challenge", { x: 540, y: 632, size: 86, weight: 950, fill: "#ffffff", anchor: "middle" })}
      ${roundedRect(176, 720, 728, 154, 24, "#f6d35f")}
      ${text("WIN $10,000", { x: 540, y: 820, size: 76, weight: 950, fill: "#13201c", anchor: "middle" })}
      ${text("$25 • 5 SHOTS", { x: 540, y: 966, size: 48, weight: 950, fill: "#ffffff", anchor: "middle", letterSpacing: 2 })}
      ${qrCard(232, 1104, 616)}
    `,
  },
  {
    name: "09-location-first",
    svg: `
      <rect width="${width}" height="${height}" fill="#e8f0e6"/>
      <rect x="0" y="0" width="${width}" height="720" fill="#2f6b3f"/>
      <path d="M0 650C178 584 355 612 540 676C725 740 896 738 1080 650V820H0V650Z" fill="#13201c"/>
      ${logo(74, 78)}
      ${text("PLAY AT A", { x: 74, y: 370, size: 56, weight: 950, fill: "#d9e8d2", letterSpacing: 3 })}
      ${text("PARTNER", { x: 74, y: 480, size: 96, weight: 950, fill: "#ffffff" })}
      ${text("LOCATION", { x: 74, y: 590, size: 96, weight: 950, fill: "#f6d35f" })}
      ${text("Hole-in-One Challenge", { x: 540, y: 914, size: 58, weight: 950, fill: "#13201c", anchor: "middle" })}
      ${text("$25 for 5 shots • $10,000 prize", { x: 540, y: 996, size: 43, weight: 950, fill: "#2f6b3f", anchor: "middle" })}
      ${qrCard(202, 1124, 676)}
    `,
  },
  {
    name: "10-social-story",
    svg: `
      <rect width="${width}" height="${height}" fill="#10201b"/>
      <rect x="0" y="0" width="${width}" height="${height}" fill="#10201b"/>
      <circle cx="540" cy="540" r="440" fill="#2f6b3f" opacity="0.46"/>
      <circle cx="778" cy="286" r="160" fill="#f6d35f" opacity="0.28"/>
      ${logo(74, 82)}
      ${roundedRect(90, 316, 900, 640, 40, "#ffffff", 0.1, "#ffffff", 2)}
      ${text("One shot", { x: 540, y: 500, size: 88, weight: 950, fill: "#ffffff", anchor: "middle" })}
      ${text("could change", { x: 540, y: 606, size: 88, weight: 950, fill: "#ffffff", anchor: "middle" })}
      ${text("everything.", { x: 540, y: 712, size: 88, weight: 950, fill: "#f6d35f", anchor: "middle" })}
      ${text("$10,000 Hole-in-One Prize", { x: 540, y: 842, size: 42, weight: 950, fill: "#ffffff", anchor: "middle" })}
      ${text("$25 for 5 shots", { x: 540, y: 908, size: 42, weight: 950, fill: "#d9e8d2", anchor: "middle" })}
      ${text("Scan the QR code to get access", { x: 540, y: 998, size: 31, weight: 900, fill: "#ffffff", anchor: "middle" })}
      ${qrCard(202, 1060, 676)}
    `,
  },
];

function wrapSvg(inner) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

for (const design of designs) {
  const svg = wrapSvg(design.svg);
  const svgPath = path.join(outputDir, `${design.name}.svg`);
  const jpgPath = path.join(outputDir, `${design.name}.jpg`);

  fs.writeFileSync(svgPath, svg);
  await sharp(Buffer.from(svg), { density: 144 })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(jpgPath);
}

const thumbs = await Promise.all(
  designs.map((design) =>
    sharp(path.join(outputDir, `${design.name}.jpg`))
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
            `<svg width="270" height="46" xmlns="http://www.w3.org/2000/svg"><rect width="270" height="46" fill="#ffffff"/><text x="135" y="30" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="800" fill="#13201c">Design ${design.name.slice(0, 2)}</text></svg>`,
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
    background: "#f5efdf",
  },
})
  .composite(
    thumbs.map((input, index) => ({
      input,
      left: (index % 5) * 270,
      top: Math.floor(index / 5) * 544,
    })),
  )
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(path.join(outputDir, "contact-sheet.jpg"));

console.log(`Generated ${designs.length} portrait ad designs in ${outputDir}`);

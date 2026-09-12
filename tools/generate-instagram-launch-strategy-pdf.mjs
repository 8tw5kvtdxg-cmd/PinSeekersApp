import { writeFileSync } from "node:fs";

const outputPath = "docs/Pin2Win_Instagram_Launch_Strategy.pdf";
const width = 612;
const height = 792;
const margin = 46;
const ink = [24 / 255, 33 / 255, 31 / 255];
const muted = [86 / 255, 96 / 255, 90 / 255];
const green = [47 / 255, 107 / 255, 63 / 255];
const lime = [168 / 255, 200 / 255, 120 / 255];
const pale = [238 / 255, 247 / 255, 233 / 255];
const cream = [251 / 255, 248 / 255, 241 / 255];
const border = [222 / 255, 214 / 255, 200 / 255];
const dark = [16 / 255, 24 / 255, 22 / 255];
const white = [1, 1, 1];

function esc(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function rgb([r, g, b]) {
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

function textWidth(text, size, bold = false) {
  return String(text).length * size * (bold ? 0.53 : 0.49);
}

function wrap(text, size, maxWidth, bold = false) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (textWidth(next, size, bold) <= maxWidth || !current) current = next;
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
  }

  addPage(background = cream) {
    this.page = [];
    this.pages.push(this.page);
    this.y = height - margin;
    this.rect(0, 0, width, height, background, null);
  }

  op(value) {
    this.page.push(value);
  }

  rect(x, y, w, h, fill, stroke = border, radius = 0) {
    if (fill) this.op(`${rgb(fill)} rg`);
    if (stroke) this.op(`${rgb(stroke)} RG 0.75 w`);
    if (!radius) {
      this.op(`${x} ${y} ${w} ${h} re ${fill && stroke ? "B" : fill ? "f" : "S"}`);
      return;
    }
    const k = radius * 0.5523;
    this.op(`${x + radius} ${y} m ${x + w - radius} ${y} l ${x + w - radius + k} ${y} ${x + w} ${y + radius - k} ${x + w} ${y + radius} c ${x + w} ${y + h - radius} l ${x + w} ${y + h - radius + k} ${x + w - radius + k} ${y + h} ${x + w - radius} ${y + h} c ${x + radius} ${y + h} l ${x + radius - k} ${y + h} ${x} ${y + h - radius + k} ${x} ${y + h - radius} c ${x} ${y + radius} l ${x} ${y + radius - k} ${x + radius - k} ${y} ${x + radius} ${y} c ${fill && stroke ? "B" : fill ? "f" : "S"}`);
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

  pageHeader(section, pageNumber) {
    this.text("PIN2WIN", margin, height - 30, 9, green, "F2");
    this.text(section.toUpperCase(), margin + 58, height - 30, 8, muted, "F2");
    this.text(String(pageNumber).padStart(2, "0"), width - margin - 12, height - 30, 8, muted, "F2");
    this.line(margin, height - 42, width - margin, height - 42, border, 0.7);
    this.y = height - 74;
  }

  title(value, subtitle) {
    this.wrapped(value, margin, this.y, width - margin * 2, 25, ink, 29, "F2");
    this.y -= wrap(value, 25, width - margin * 2, true).length * 29 + 7;
    if (subtitle) {
      this.wrapped(subtitle, margin, this.y, width - margin * 2, 11.5, muted, 16);
      this.y -= wrap(subtitle, 11.5, width - margin * 2).length * 16 + 20;
    } else this.y -= 14;
  }

  h2(value) {
    this.text(value, margin, this.y, 14, green, "F2");
    this.y -= 21;
  }

  p(value, gap = 13) {
    const used = this.wrapped(value, margin, this.y, width - margin * 2, 10.3, ink, 14);
    this.y -= used + gap;
  }

  bullet(value, x = margin, maxWidth = width - margin * 2, size = 10) {
    const bulletSize = 4;
    const textX = x + 16;
    this.rect(x, this.y + 2, bulletSize, bulletSize, green, null);
    const used = this.wrapped(value, textX, this.y, maxWidth - 16, size, ink, 13.5);
    this.y -= used + 7;
  }

  callout(label, value, accent = green) {
    const lines = wrap(value, 11, width - margin * 2 - 34);
    const h = 45 + lines.length * 15;
    this.rect(margin, this.y - h, width - margin * 2, h, pale, accent, 8);
    this.rect(margin, this.y - h, 7, h, accent, null);
    this.text(label.toUpperCase(), margin + 18, this.y - 22, 8.5, accent, "F2");
    this.wrapped(value, margin + 18, this.y - 43, width - margin * 2 - 36, 11, ink, 15, "F2");
    this.y -= h + 18;
  }

  cards(items, columns = 2) {
    const gap = 12;
    const cardW = (width - margin * 2 - gap * (columns - 1)) / columns;
    const rowCount = Math.ceil(items.length / columns);
    const cardH = 90;
    items.forEach((item, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = margin + col * (cardW + gap);
      const y = this.y - row * (cardH + gap) - cardH;
      this.rect(x, y, cardW, cardH, white, border, 7);
      this.text(item.label.toUpperCase(), x + 13, y + cardH - 22, 8, green, "F2");
      this.wrapped(item.value, x + 13, y + cardH - 44, cardW - 26, 10.3, ink, 13.5, item.bold ? "F2" : "F1");
    });
    this.y -= rowCount * (cardH + gap) + 8;
  }

  table(headers, rows, widths, rowHeight = 50) {
    let x = margin;
    this.rect(margin, this.y - 25, width - margin * 2, 25, dark, null);
    headers.forEach((header, index) => {
      this.text(header, x + 8, this.y - 17, 8.5, white, "F2");
      x += widths[index];
    });
    this.y -= 25;
    rows.forEach((row, rowIndex) => {
      x = margin;
      row.forEach((cell, index) => {
        this.rect(x, this.y - rowHeight, widths[index], rowHeight, rowIndex % 2 ? cream : white, border);
        this.wrapped(cell, x + 8, this.y - 16, widths[index] - 16, 8.6, ink, 11.5, index === 0 ? "F2" : "F1");
        x += widths[index];
      });
      this.y -= rowHeight;
    });
    this.y -= 16;
  }
}

const doc = new PdfDoc();

// 1. Cover
doc.addPage(dark);
doc.rect(0, 0, 14, height, green, null);
doc.rect(52, 696, 66, 29, green, null, 6);
doc.text("PIN2WIN", 62, 706, 12, white, "F2");
doc.wrapped("Instagram Launch Strategy", 52, 604, 500, 34, white, 40, "F2");
doc.wrapped("A focused 30-day plan to build local demand, support partner venues, and convert attention into paid challenge entries.", 52, 472, 466, 14, [0.86, 0.91, 0.79], 21);
doc.line(52, 392, 195, 392, lime, 4);
doc.text("PREPARED FOR BUSINESS PARTNER DISCUSSION", 52, 104, 9, lime, "F2");
doc.text("September 2026", 52, 82, 11, white);

// 2. Strategy
doc.addPage();
doc.pageHeader("Executive Summary", 2);
doc.title("Make the challenge the content", "Instagram should sell the feeling of competing - not explain the software behind it.");
doc.callout("Core campaign idea", "Five shots. One target. How close can you get?");
doc.h2("The strategic thesis");
doc.p("Pin2Win is naturally visual: pressure shots, close calls, reactions, rivalries, leaderboard movement, and recognizable local venues. A consistent stream of these moments can turn entertainment into measurable local demand.");
doc.h2("The customer journey");
doc.cards([
  { label: "1. Discover", value: "A local golfer sees an exciting Reel or venue collaboration." },
  { label: "2. Plan", value: "They visit the location page and book a simulator session." },
  { label: "3. Play", value: "Onsite, they scan the protected QR code and enter the challenge." },
  { label: "4. Multiply", value: "Their result, reaction, or win creates the next piece of content." },
]);
doc.callout("30-day objective", "Prove that one repeatable local content system can increase venue interest, booking clicks, QR scans, paid entries, and reusable player content.");

// 3. Positioning and audience
doc.addPage();
doc.pageHeader("Positioning and Audience", 3);
doc.title("Local competition first", "Build an entertaining golfer community while quietly demonstrating value to venue operators.");
doc.h2("Primary audience: local golfers (80%)");
doc.bullet("Indoor golf and simulator customers who already understand the setting.");
doc.bullet("Recreational golfers motivated by friendly competition and measurable improvement.");
doc.bullet("League players, golf groups, date-night customers, and social groups.");
doc.h2("Secondary audience: venue operators (20%)");
doc.bullet("Indoor golf owners, golf bars, simulator lounges, teaching studios, and event operators.");
doc.bullet("Show them visible proof of activity, repeat visits, customer engagement, and content creation.");
doc.h2("Brand guardrails");
doc.table(
  ["DO", "DO NOT"],
  [
    ["Lead with competition, emotion, personalities, and local pride.", "Lead with software screens, payment details, or technical explanations."],
    ["Be energetic, credible, welcoming, and skill focused.", "Present the experience as wagering, chance, or guaranteed winnings."],
    ["Build depth in one local market before expanding.", "Try to look national before the local model has been proven."],
  ],
  [260, 260],
  61,
);

// 4. Account and content
doc.addPage();
doc.pageHeader("Account and Content System", 4);
doc.title("A profile built to convert curiosity", "Every profile element should help a golfer understand the challenge and find a participating venue.");
doc.cards([
  { label: "Profile name", value: "Pin2Win | Indoor Golf Challenges", bold: true },
  { label: "Bio", value: "Five shots. One target. Monthly indoor golf challenges. Find a location below." },
]);
doc.h2("Five Story Highlights");
doc.cards([
  { label: "How it Works", value: "Book, scan, pay, play, and verify." },
  { label: "Locations", value: "Venues and direct booking links." },
  { label: "Leaderboard", value: "Standings and weekly movement." },
  { label: "Winners", value: "Verified wins and interviews." },
  { label: "Rules", value: "Eligibility, scoring, and timing." },
], 3);
doc.h2("Three pinned posts");
doc.bullet("A 15-second 'What is Pin2Win?' Reel.");
doc.bullet("A simple four-step 'How to play' carousel.");
doc.bullet("The current venue and active challenge.");
doc.callout("Traffic rule", "General Instagram traffic should go to a public location or booking page - never directly to the protected onsite QR checkout.");

// 5. Publishing system
doc.addPage();
doc.pageHeader("Publishing System", 5);
doc.title("Consistency without content fatigue", "Use a fixed weekly rhythm and rotate repeatable creative formats.");
doc.table(
  ["CONTENT PILLAR", "SHARE", "ROLE"],
  [
    ["Challenge drama", "40%", "Shots, near misses, reactions, pressure, leaderboard changes."],
    ["Player stories", "25%", "Personal bests, rivalries, profiles, and winner interviews."],
    ["Venue + community", "20%", "Venue tours, staff attempts, groups, and atmosphere."],
    ["Education", "10%", "How entry, scoring, and verification work."],
    ["Company story", "5%", "Building Pin2Win and launching new locations."],
  ],
  [147, 56, 317],
  48,
);
doc.h2("Weekly cadence");
doc.cards([
  { label: "Monday", value: "Leaderboard or weekend recap Reel." },
  { label: "Wednesday", value: "Challenge, near-miss, or player Reel." },
  { label: "Friday", value: "Partner-venue collaboration Reel." },
  { label: "Sunday", value: "Educational or recap carousel." },
]);
doc.callout("Production standard", "Shoot vertical 9:16, use clear audio, keep key text inside the safe zone, and communicate the premise in the opening seconds.");

// 6. Creative concepts and calendar
doc.addPage();
doc.pageHeader("30-Day Campaign", 6);
doc.title("Four weeks from introduction to payoff", "Each week advances the story instead of restarting it.");
doc.table(
  ["WEEK", "THEME", "KEY OUTPUTS"],
  [
    ["1", "Introduce", "Core campaign Reel; how-it-works carousel; founder or staff attempt; venue collaboration; Highlights."],
    ["2", "Make it social", "Slow-motion near miss; golfer to beat; staff leaderboard; club-choice polls; collect repost permissions."],
    ["3", "Build competition", "Leaderboard movement; two-shot comparison; booking-to-play journey; deadline countdown."],
    ["4", "Urgency + payoff", "Final-week reminder; reaction compilation; verified winner; interview; next challenge teaser."],
  ],
  [52, 105, 363],
  64,
);
doc.h2("Repeatable Reel hooks");
doc.cards([
  { label: "Near miss", value: "This missed by less than two feet." },
  { label: "Final shot", value: "His fifth shot changed the leaderboard." },
  { label: "Club choice", value: "Five shots. What club are you choosing?" },
  { label: "New leader", value: "We have a new leader - and it wasn't close." },
]);
doc.callout("30-day target", "12 Reels | 4 carousels | 4 venue collaborations | Stories on active days | 8+ reusable player or staff clips");

// 7. Distribution
doc.addPage();
doc.pageHeader("Distribution and Growth", 7);
doc.title("Turn the venue and every player into distribution", "The strongest growth loop already exists at the point of play.");
doc.h2("What the launch venue provides");
doc.bullet("One collaboration post per week and two or three Story reshares during active weeks.");
doc.bullet("Filming permission, one staff participant, a trackable booking link, and staff QR reminders.");
doc.h2("What Pin2Win provides");
doc.bullet("Finished captions, edited vertical clips, Story graphics, leaderboard cards, and a simple posting calendar.");
doc.bullet("The lower the workload for the venue, the more consistent the partnership will be.");
doc.h2("Player-generated content loop");
doc.cards([
  { label: "Prompt", value: "Invite verified players to follow and tag Pin2Win and the venue." },
  { label: "Permission", value: "Ask before reposting player footage, results, or reactions." },
  { label: "Recognition", value: "Celebrate strong shots, personal bests, and verified winners." },
  { label: "Reuse", value: "Convert authentic moments into future Reels, Stories, and recaps." },
]);
doc.callout("Disclosure guardrail", "Do not trade cash or prizes for likes, follows, shares, or comments. Use the paid-partnership label when free play, payment, or another benefit is exchanged for content.");

// 8. Paid opportunities
doc.addPage();
doc.pageHeader("Paid Promotion Opportunities", 8);
doc.title("Buy measurable local attention", "Meta ads are auction-priced. These are controllable planning budgets, not guaranteed platform rates.");
doc.h2("Five ways to promote Pin2Win");
doc.table(
  ["OPPORTUNITY", "SUGGESTED TEST", "BEST USE"],
  [
    ["Boost a proven Reel", "$10-$15/day x 7 days", "Fast awareness test using an existing organic winner; simplest setup, but less control."],
    ["Local traffic campaign", "$20-$30/day x 14 days", "Recommended core campaign; sends nearby golfers to a public venue or booking page."],
    ["Warm retargeting", "$5-$10/day x 14 days", "Deadline or booking message for prior viewers, engagers, and tracked visitors."],
    ["Venue partnership ad", "$150-$300 media", "Amplifies an approved collaboration post and borrows trust from the host venue."],
    ["Local creator ad", "$150-$300 media + talent", "Adds authentic third-party credibility; creator compensation is negotiated separately."],
  ],
  [139, 123, 258],
  63,
);
doc.callout("Recommended tool", "Use a simple boost for awareness experiments. Use Meta Ads Manager for the main pilot because it offers better control over objectives, audiences, placements, creative tests, destinations, and reporting.");

// 9. Budget and operation
doc.addPage();
doc.pageHeader("Paid Budget and Operation", 9);
doc.title("A $600-$900 recommended pilot", "Start after 15-20 organic posts reveal which creative deserves paid distribution.");
doc.h2("30-day media budget options");
doc.cards([
  { label: "Lean validation", value: "$300-$450 | Test two or three Reels near one venue." },
  { label: "Recommended", value: "$600-$900 | Test, concentrate spend, then retarget.", bold: true },
  { label: "Accelerated", value: "$1,200-$1,800 | More creative and sustained local reach." },
], 3);
doc.h2("How the campaign works");
doc.table(
  ["STAGE", "ACTION", "DECISION"],
  [
    ["1. Prepare", "Confirm eligibility; connect accounts; add tracked links and available website measurement.", "Do not launch until policy and destination-page checks pass."],
    ["2. Test", "Run near-miss, explainer, and venue Reels against the same local audience.", "Change one major variable at a time."],
    ["3. Focus", "Pause clear underperformers and move most remaining spend to the strongest creative.", "Use qualified traffic and downstream activity, not views alone."],
    ["4. Retarget", "Show deadline, leaderboard, or booking messages to warm audiences once large enough.", "Keep the warm budget smaller than prospecting."],
    ["5. Review", "Reconcile ad results with booking clicks, QR scans, entries, and revenue.", "Scale, revise, or stop using unit economics."],
  ],
  [76, 253, 191],
  58,
);
doc.callout("Production cost", "Media spend excludes filming, editing, and creator compensation. In-house production can keep costs low; outside creator or editing fees should be negotiated separately with deliverables and usage rights defined.");

// 10. Targeting, economics and measurement
doc.addPage();
doc.pageHeader("Targeting and Economics", 10);
doc.title("Connect every dollar to the funnel", "Reach and clicks are diagnostic signals; bookings, scans, and entries determine business value.");
doc.h2("Audience and placement approach");
doc.bullet("Target adults within a practical driving radius of the venue; adjust for real local travel patterns.");
doc.bullet("Begin broad inside that geography. Test golf interests separately instead of stacking restrictions.");
doc.bullet("Supply native 9:16 video with audio and safe-zone text; begin with Advantage+ placements.");
doc.bullet("Use venue or creator partnership ads only with documented promotion access and usage rights.");
doc.h2("Break-even framework");
doc.callout("Maximum affordable acquisition cost", "Entry revenue - prize allocation - venue share - payment fees - other variable costs - required profit contribution");
doc.callout("Modeled acquisition cost", "Cost per landing-page visit / landing-page-to-paid-entry conversion rate");
doc.p("Illustration: a $1.50 landing-page visit and a 5% visit-to-entry rate produce a modeled $30 acquisition cost. This example is not a forecast; replace both inputs with Pin2Win's measured results.");
doc.h2("Pilot decision rules");
doc.bullet("Do not scale inexpensive views unless they produce qualified traffic.");
doc.bullet("Do not scale inexpensive clicks unless bookings, scans, and entries follow.");
doc.bullet("Stop or revise a campaign when acquisition cost exceeds the affordable maximum.");

// 11. Measurement and policy
doc.addPage();
doc.pageHeader("Measurement and Policy", 11);
doc.title("Define success before launch", "The reporting view should connect Instagram activity to customer and venue outcomes.");
doc.h2("What to measure");
doc.table(
  ["LEVEL", "MEASURES"],
  [
    ["Content", "Watch time, completion, shares, saves, profile visits, and meaningful engagement."],
    ["Traffic", "Location-page visits, cost per visit, booking clicks, and cost per booking click."],
    ["Business", "QR scans, paid entries per scan, acquisition cost per entry, repeat entries, and contribution."],
  ],
  [92, 428],
  62,
);
doc.h2("Weekly review questions");
doc.cards([
  { label: "Creative", value: "Which hook creates qualified visits, not only inexpensive views?" },
  { label: "Funnel", value: "Where do people drop between page visit, booking, scan, and entry?" },
  { label: "Economics", value: "Is cost per entry below the approved acquisition ceiling?" },
  { label: "Action", value: "What should be scaled, refreshed, paused, or measured better?" },
]);
doc.callout("Policy gate", "Meta says accounts promoting online real-money games of skill require prior written permission. Confirm advertising permission, broader account eligibility, and legal positioning before launch; keep messaging transparent and skill focused.");

// 12. Decision page
doc.addPage();
doc.pageHeader("Partner Decision", 12);
doc.title("Approve one focused 30-day pilot", "Launch around one venue, one geographic market, and one accountable operating rhythm.");
doc.h2("First 14 days");
doc.bullet("Finalize the profile, public link, Highlights, and three pinned posts.");
doc.bullet("Confirm venue filming, collaboration, and player permission workflows.");
doc.bullet("Run one two-hour filming session and capture at least 20 vertical clips.");
doc.bullet("Edit the first six Reels before publishing the first one.");
doc.bullet("Add tracking to the venue link and record the baseline funnel data.");
doc.bullet("Review results after days 7 and 14; repeat the two strongest concepts.");
doc.h2("Five decisions to make together");
doc.cards([
  { label: "Ownership", value: "Who films, edits, posts, and responds?" },
  { label: "Market", value: "Which venue and local area launch first?" },
  { label: "Permissions", value: "What approvals are needed to film and repost?" },
  { label: "Destination", value: "Which public page receives and tracks traffic?" },
  { label: "Compliance", value: "Who confirms Meta ad eligibility before spending?" },
], 3);
doc.callout("Recommendation", "Approve the organic pilot now. Build around competition, personalities, and proof; make the venue a co-distributor; measure the full booking-to-entry funnel; and delay paid promotion until creative and policy eligibility are confirmed.");
doc.text("SOURCE NOTES", margin, 74, 8.5, green, "F2");
doc.text("Meta Reels ads guidance | Instagram branded content | Community Guidelines | Commercial music guidance", margin, 57, 8, muted);
doc.text("Full links and supporting notes are included in the editable strategy document.", margin, 43, 8, muted);

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
if (process.env.PIN2WIN_PREVIEW_DIR) {
  doc.pages.forEach((page, index) => {
    writeFileSync(
      `${process.env.PIN2WIN_PREVIEW_DIR}/page-${index + 1}.pdf`,
      buildPdf([page]),
    );
  });
}
console.log(outputPath);

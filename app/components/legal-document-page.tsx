import Link from "next/link";
import {
  getLegalDocumentDefinition,
  getLegalDocumentMarkdown,
  legalDocumentVersion,
  legalPublishedDate,
  legalEffectiveDate,
  type LegalDocumentKey,
} from "@/lib/legal-documents";

type Block =
  | { type: "heading"; value: string }
  | { type: "paragraph"; value: string }
  | { type: "bullets"; values: string[] }
  | { type: "numbers"; values: string[] };

function cleanInlineMarkdown(value: string) {
  return value
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function parseBlocks(markdown: string) {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];
  let numbers: string[] = [];

  function flushParagraph() {
    if (paragraph.length) {
      blocks.push({
        type: "paragraph",
        value: cleanInlineMarkdown(paragraph.join(" ")),
      });
      paragraph = [];
    }
  }

  function flushLists() {
    if (bullets.length) {
      blocks.push({ type: "bullets", values: bullets });
      bullets = [];
    }

    if (numbers.length) {
      blocks.push({ type: "numbers", values: numbers });
      numbers = [];
    }
  }

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushLists();
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushLists();
      blocks.push({
        type: "heading",
        value: cleanInlineMarkdown(line.slice(3)),
      });
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      if (numbers.length) flushLists();
      bullets.push(cleanInlineMarkdown(line.slice(2)));
      continue;
    }

    const orderedItem = line.match(/^\d+\.\s+(.+)$/);

    if (orderedItem) {
      flushParagraph();
      if (bullets.length) flushLists();
      numbers.push(cleanInlineMarkdown(orderedItem[1]));
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushLists();

  return blocks;
}

export function LegalDocumentPage({ documentKey }: { documentKey: LegalDocumentKey }) {
  const definition = getLegalDocumentDefinition(documentKey);
  const blocks = parseBlocks(getLegalDocumentMarkdown(documentKey));

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-12 text-[#18211f] sm:px-10">
      <article className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]"
        >
          Pin2Win
        </Link>

        <header className="mt-8 border-b border-[#ded6c8] pb-8">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
            Customer legal document
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            {definition.title}
          </h1>
          <dl className="mt-6 grid gap-2 text-sm text-[#59655f] sm:grid-cols-3">
            <div>
              <dt className="font-black">Document version</dt>
              <dd>{legalDocumentVersion}</dd>
            </div>
            <div>
              <dt className="font-black">Published date</dt>
              <dd>{legalPublishedDate}</dd>
            </div>
            <div>
              <dt className="font-black">Effective date</dt>
              <dd>{legalEffectiveDate}</dd>
            </div>
          </dl>
        </header>

        <div className="mt-10 space-y-6">
          {blocks.map((block, index) => {
            if (block.type === "heading") {
              return (
                <h2
                  key={`${block.type}-${index}`}
                  className="break-after-avoid pt-4 text-2xl font-black text-[#2f6b3f]"
                >
                  {block.value}
                </h2>
              );
            }

            if (block.type === "paragraph") {
              return (
                <p
                  key={`${block.type}-${index}`}
                  className="text-base leading-8 text-[#39443f]"
                >
                  {block.value}
                </p>
              );
            }

            const List = block.type === "numbers" ? "ol" : "ul";

            return (
              <List
                key={`${block.type}-${index}`}
                className={
                  block.type === "numbers"
                    ? "grid list-decimal gap-3 pl-7 leading-7 text-[#39443f]"
                    : "grid list-disc gap-3 pl-7 leading-7 text-[#39443f] marker:text-[#2f6b3f]"
                }
              >
                {block.values.map((value) => (
                  <li key={value}>{value}</li>
                ))}
              </List>
            );
          })}
        </div>

        <nav className="mt-12 grid gap-3 border-t border-[#ded6c8] pt-8 text-sm font-black text-[#2f6b3f] sm:grid-cols-2">
          <Link href="/terms">Terms of Use</Link>
          <Link href="/official-rules">Official Challenge Rules</Link>
          <Link href="/refund-policy">Refund Policy</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </nav>
      </article>
    </main>
  );
}

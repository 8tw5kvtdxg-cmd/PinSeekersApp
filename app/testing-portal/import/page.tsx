"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Database,
  FileJson,
  FileText,
  ShieldCheck,
  Table,
  Upload,
} from "lucide-react";

type PreviewRow = Record<string, string>;

type ParsedFile = {
  columns: string[];
  fileName: string;
  fileType: "CSV" | "JSON" | "TEXT";
  rows: PreviewRow[];
};

const fieldHints = [
  { field: "Pin2Win session ID", patterns: ["pin2winsessionid", "sessionid"] },
  { field: "Player alias", patterns: ["player", "alias", "name"] },
  { field: "Challenge type", patterns: ["challenge", "type", "event"] },
  { field: "Result", patterns: ["result", "distance", "score", "yards"] },
  { field: "Unit", patterns: ["unit", "resultunit"] },
  { field: "Evidence", patterns: ["evidence", "screenshot", "report"] },
  { field: "Verifier", patterns: ["verifier", "operator", "staff"] },
  { field: "Timestamp", patterns: ["created", "date", "time", "timestamp"] },
];

function parseCsv(text: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      row.push(current.trim());
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current.trim());
  if (row.some(Boolean)) {
    rows.push(row);
  }

  const headers = rows[0]?.map((header, index) => header || `Column ${index + 1}`) ?? [];
  const body = rows.slice(1).map((values) =>
    headers.reduce<PreviewRow>((record, header, index) => {
      record[header] = values[index] ?? "";
      return record;
    }, {}),
  );

  return { columns: headers, rows: body };
}

function flattenValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function parseJson(text: string) {
  const parsed = JSON.parse(text) as unknown;
  const rowsSource = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed && "rows" in parsed
      ? (parsed as { rows?: unknown }).rows
      : typeof parsed === "object" && parsed && "results" in parsed
        ? (parsed as { results?: unknown }).results
        : parsed;
  const items = Array.isArray(rowsSource) ? rowsSource : [rowsSource];
  const records = items
    .filter((item): item is Record<string, unknown> => {
      return typeof item === "object" && item !== null && !Array.isArray(item);
    })
    .map((item) =>
      Object.entries(item).reduce<PreviewRow>((record, [key, value]) => {
        record[key] = flattenValue(value);
        return record;
      }, {}),
    );
  const columns = Array.from(
    records.reduce<Set<string>>((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set()),
  );

  return { columns, rows: records };
}

function parseTextLog(text: string) {
  const rows = text
    .split(/\r?\n/)
    .map((line, index) => ({ line: String(index + 1), content: line.trim() }))
    .filter((row) => row.content);

  return { columns: ["line", "content"], rows };
}

function normalized(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function suggestedField(column: string) {
  const cleanColumn = normalized(column);
  const match = fieldHints.find((hint) =>
    hint.patterns.some((pattern) => cleanColumn.includes(pattern)),
  );

  return match?.field ?? "Review manually";
}

export default function ImportPreviewPage() {
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [message, setMessage] = useState("Upload a simulator export or log file.");

  const suggestedMappings = useMemo(() => {
    return parsedFile?.columns.map((column) => ({
      column,
      field: suggestedField(column),
    })) ?? [];
  }, [parsedFile]);

  const previewRows = parsedFile?.rows.slice(0, 50) ?? [];

  const handleFile = async (file: File) => {
    const text = await file.text();
    const name = file.name.toLowerCase();

    try {
      if (name.endsWith(".json")) {
        const parsed = parseJson(text);

        setParsedFile({
          ...parsed,
          fileName: file.name,
          fileType: "JSON",
        });
        setMessage(`${file.name} parsed for review.`);
        return;
      }

      if (name.endsWith(".csv")) {
        const parsed = parseCsv(text);

        setParsedFile({
          ...parsed,
          fileName: file.name,
          fileType: "CSV",
        });
        setMessage(`${file.name} parsed for review.`);
        return;
      }

      const parsed = parseTextLog(text);

      setParsedFile({
        ...parsed,
        fileName: file.name,
        fileType: "TEXT",
      });
      setMessage(`${file.name} loaded as a text log preview.`);
    } catch (error) {
      setParsedFile(null);
      setMessage(
        error instanceof Error
          ? `Could not parse file: ${error.message}`
          : "Could not parse file.",
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#18211f]">
      <header className="border-b border-[#d7dfd4] bg-white px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-black text-[#2f6b3f]"
              href="/testing-portal"
            >
              <ArrowLeft size={17} /> Testing portal
            </Link>
            <p className="mt-4 text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              Simulator file review
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Import preview
            </h1>
          </div>
          <span className="rounded-md bg-[#e3edd8] px-4 py-2 text-sm font-black text-[#2f6b3f]">
            Preview only
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 sm:px-10">
        <p className="rounded-lg border border-[#d7dfd4] bg-white px-5 py-4 text-sm font-black text-[#2f6b3f]">
          {message}
        </p>

        <section className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-lg border border-[#d7dfd4] bg-white p-6">
            <div className="flex items-center gap-3">
              <Upload className="text-[#2f6b3f]" size={28} />
              <h2 className="text-2xl font-black">Upload file</h2>
            </div>
            <label className="mt-6 flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#b9c6b5] bg-[#fbfdf9] p-6 text-center transition hover:border-[#2f6b3f]">
              <Upload className="text-[#2f6b3f]" size={34} />
              <span className="text-lg font-black">Choose simulator file</span>
              <span className="text-sm font-bold text-[#59655f]">
                CSV, JSON, TXT, or LOG
              </span>
              <input
                className="sr-only"
                type="file"
                accept=".csv,.json,.txt,.log"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    handleFile(file);
                  }
                }}
              />
            </label>

            <div className="mt-6 rounded-md bg-[#18211f] p-5 text-white">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-[#a8c878]" size={24} />
                <h3 className="font-black">Safety rules</h3>
              </div>
              <div className="mt-4 grid gap-3 text-sm leading-6 text-white/78">
                <p>No imported rows are saved to the database on this screen.</p>
                <p>No imported rows publish to the public leaderboard.</p>
                <p>Use this page to inspect whether simulator exports are usable.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <section className="grid gap-4 md:grid-cols-4">
              {[
                ["File", parsedFile?.fileName ?? "None", FileText],
                ["Type", parsedFile?.fileType ?? "Waiting", FileJson],
                ["Columns", String(parsedFile?.columns.length ?? 0), Table],
                ["Rows", String(parsedFile?.rows.length ?? 0), Database],
              ].map(([label, value, Icon]) => (
                <div
                  key={label as string}
                  className="rounded-lg border border-[#d7dfd4] bg-white p-5"
                >
                  <Icon className="text-[#2f6b3f]" size={26} />
                  <p className="mt-4 text-sm font-black text-[#59655f]">
                    {label as string}
                  </p>
                  <p className="mt-1 break-words text-lg font-black">
                    {value as string}
                  </p>
                </div>
              ))}
            </section>

            <section className="rounded-lg border border-[#d7dfd4] bg-white p-6">
              <div className="flex items-center gap-3">
                <ClipboardIcon />
                <h2 className="text-2xl font-black">Suggested mapping</h2>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {suggestedMappings.length > 0 ? (
                  suggestedMappings.map((mapping) => (
                    <div
                      key={mapping.column}
                      className="rounded-md bg-[#fbfdf9] p-4"
                    >
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#59655f]">
                        {mapping.column}
                      </p>
                      <p className="mt-2 font-black text-[#2f6b3f]">
                        {mapping.field}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md bg-[#fbfdf9] p-4 text-sm font-bold text-[#59655f] md:col-span-2">
                    Upload a file to see suggested field mapping.
                  </p>
                )}
              </div>
            </section>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-[#d7dfd4] bg-white">
          <div className="flex items-center gap-3 bg-[#18211f] px-6 py-5 text-white">
            <Table className="text-[#a8c878]" size={28} />
            <div>
              <h2 className="text-2xl font-black">Preview rows</h2>
              <p className="mt-1 text-sm font-bold text-white/58">
                Showing up to 50 rows.
              </p>
            </div>
          </div>

          {parsedFile && previewRows.length > 0 ? (
            <div className="overflow-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-[#f2eadb] text-xs font-black uppercase tracking-[0.12em] text-[#53605a]">
                    {parsedFile.columns.map((column) => (
                      <th
                        key={column}
                        className="whitespace-nowrap border-b border-[#d7dfd4] px-4 py-3"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={index} className="border-t border-[#d7dfd4]">
                      {parsedFile.columns.map((column) => (
                        <td
                          key={`${index}-${column}`}
                          className="max-w-72 truncate px-4 py-3 font-bold text-[#18211f]"
                          title={row[column]}
                        >
                          {row[column]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-sm font-bold text-[#59655f]">
              No file preview yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ClipboardIcon() {
  return <FileText className="text-[#2f6b3f]" size={28} />;
}

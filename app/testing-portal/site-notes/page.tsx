"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  HardDrive,
  KeyRound,
  Laptop,
  Network,
  Save,
  ShieldCheck,
} from "lucide-react";

type NotesForm = {
  partnerName: string;
  locationName: string;
  contactName: string;
  contactRole: string;
  testingDate: string;
  simulatorHardware: string;
  launchMonitorModel: string;
  launchMonitorSerial: string;
  simulatorSoftware: string;
  simulatorSoftwareVersion: string;
  operatorPcName: string;
  windowsVersion: string;
  internetAccess: string;
  nodeAllowed: string;
  portalAccess: string;
  localAgentApproved: boolean;
  operatorPcUseApproved: boolean;
  screenshotsApproved: boolean;
  noAutomationConfirmed: boolean;
  reportExportAvailable: string;
  reportLocation: string;
  screenshotLocation: string;
  csvExportAvailable: string;
  testNotes: string;
  ownerBoundaries: string;
  recommendedPath: string;
  ownerSignoffNotes: string;
};

const storageKey = "pin2win-partner-site-notes";

const defaultNotes: NotesForm = {
  partnerName: "",
  locationName: "",
  contactName: "",
  contactRole: "",
  testingDate: new Date().toISOString().slice(0, 10),
  simulatorHardware: "",
  launchMonitorModel: "",
  launchMonitorSerial: "",
  simulatorSoftware: "",
  simulatorSoftwareVersion: "",
  operatorPcName: "",
  windowsVersion: "",
  internetAccess: "Unknown",
  nodeAllowed: "Unknown",
  portalAccess: "Unknown",
  localAgentApproved: false,
  operatorPcUseApproved: false,
  screenshotsApproved: false,
  noAutomationConfirmed: true,
  reportExportAvailable: "Unknown",
  reportLocation: "",
  screenshotLocation: "",
  csvExportAvailable: "Unknown",
  testNotes: "",
  ownerBoundaries: "",
  recommendedPath: "Manual verified entry",
  ownerSignoffNotes: "",
};

const selectOptions = ["Unknown", "Yes", "No", "Not tested"];
const recommendationOptions = [
  "Manual verified entry",
  "CSV/report import",
  "Screenshot-assisted verification",
  "Local agent result submission",
  "Vendor-approved API",
  "Future owner-approved automation",
];

function downloadJson(notes: NotesForm) {
  const payload = {
    exportedAt: new Date().toISOString(),
    notes,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = notes.testingDate || new Date().toISOString().slice(0, 10);
  const partner = notes.partnerName
    ? notes.partnerName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    : "partner";

  link.href = url;
  link.download = `pin2win-${partner}-site-notes-${date}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function SiteNotesPage() {
  const [notes, setNotes] = useState<NotesForm>(defaultNotes);
  const [message, setMessage] = useState("Site notes ready.");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);

    if (saved) {
      setNotes({ ...defaultNotes, ...JSON.parse(saved) });
      setMessage("Saved site notes loaded.");
    }
  }, []);

  const completedChecks = useMemo(
    () =>
      [
        notes.localAgentApproved,
        notes.operatorPcUseApproved,
        notes.screenshotsApproved,
        notes.noAutomationConfirmed,
      ].filter(Boolean).length,
    [
      notes.localAgentApproved,
      notes.operatorPcUseApproved,
      notes.screenshotsApproved,
      notes.noAutomationConfirmed,
    ],
  );

  const updateNote = <Key extends keyof NotesForm>(
    key: Key,
    value: NotesForm[Key],
  ) => {
    setNotes((current) => ({ ...current, [key]: value }));
    setMessage("Unsaved changes.");
  };

  const saveNotes = () => {
    window.localStorage.setItem(storageKey, JSON.stringify(notes));
    setMessage("Site notes saved on this device.");
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
              Partner testing
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Site notes
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2f6b3f] px-4 text-sm font-black text-white transition hover:bg-[#3f7f4c]"
              type="button"
              onClick={saveNotes}
            >
              <Save size={16} /> Save
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d7dfd4] bg-white px-4 text-sm font-black text-[#18211f] transition hover:border-[#2f6b3f]"
              type="button"
              onClick={() => downloadJson(notes)}
            >
              <Download size={16} /> JSON
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 sm:px-10">
        <p className="rounded-lg border border-[#d7dfd4] bg-white px-5 py-4 text-sm font-black text-[#2f6b3f]">
          {message}
        </p>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Partner", notes.partnerName || "Not set", ClipboardCheck],
            ["Simulator", notes.simulatorSoftware || "Not set", HardDrive],
            ["Operator PC", notes.windowsVersion || "Not set", Laptop],
            ["Approvals", `${completedChecks}/4`, ShieldCheck],
          ].map(([label, value, Icon]) => (
            <div
              key={label as string}
              className="rounded-lg border border-[#d7dfd4] bg-white p-5"
            >
              <Icon className="text-[#2f6b3f]" size={26} />
              <p className="mt-4 text-sm font-black text-[#59655f]">
                {label as string}
              </p>
              <p className="mt-1 text-xl font-black">{value as string}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Panel icon={ClipboardCheck} title="Partner details">
            <Field
              label="Partner name"
              value={notes.partnerName}
              onChange={(value) => updateNote("partnerName", value)}
            />
            <Field
              label="Location"
              value={notes.locationName}
              onChange={(value) => updateNote("locationName", value)}
            />
            <Field
              label="Owner / operator contact"
              value={notes.contactName}
              onChange={(value) => updateNote("contactName", value)}
            />
            <Field
              label="Contact role"
              value={notes.contactRole}
              onChange={(value) => updateNote("contactRole", value)}
            />
            <Field
              label="Testing date"
              type="date"
              value={notes.testingDate}
              onChange={(value) => updateNote("testingDate", value)}
            />
          </Panel>

          <Panel icon={HardDrive} title="Simulator environment">
            <Field
              label="Simulator hardware"
              value={notes.simulatorHardware}
              onChange={(value) => updateNote("simulatorHardware", value)}
            />
            <Field
              label="Launch monitor model"
              value={notes.launchMonitorModel}
              onChange={(value) => updateNote("launchMonitorModel", value)}
            />
            <Field
              label="Launch monitor serial"
              value={notes.launchMonitorSerial}
              onChange={(value) => updateNote("launchMonitorSerial", value)}
            />
            <Field
              label="Simulator software"
              value={notes.simulatorSoftware}
              onChange={(value) => updateNote("simulatorSoftware", value)}
            />
            <Field
              label="Software version"
              value={notes.simulatorSoftwareVersion}
              onChange={(value) => updateNote("simulatorSoftwareVersion", value)}
            />
          </Panel>

          <Panel icon={Laptop} title="Operator PC">
            <Field
              label="PC name"
              value={notes.operatorPcName}
              onChange={(value) => updateNote("operatorPcName", value)}
            />
            <Field
              label="Windows version"
              value={notes.windowsVersion}
              onChange={(value) => updateNote("windowsVersion", value)}
            />
            <SelectField
              label="Internet access"
              value={notes.internetAccess}
              onChange={(value) => updateNote("internetAccess", value)}
            />
            <SelectField
              label="Node allowed"
              value={notes.nodeAllowed}
              onChange={(value) => updateNote("nodeAllowed", value)}
            />
            <SelectField
              label="Portal accessible"
              value={notes.portalAccess}
              onChange={(value) => updateNote("portalAccess", value)}
            />
          </Panel>

          <Panel icon={KeyRound} title="Owner approvals">
            <CheckField
              label="Local agent approved"
              checked={notes.localAgentApproved}
              onChange={(value) => updateNote("localAgentApproved", value)}
            />
            <CheckField
              label="Operator PC use approved"
              checked={notes.operatorPcUseApproved}
              onChange={(value) => updateNote("operatorPcUseApproved", value)}
            />
            <CheckField
              label="Screenshots / reports approved"
              checked={notes.screenshotsApproved}
              onChange={(value) => updateNote("screenshotsApproved", value)}
            />
            <CheckField
              label="No automation confirmed"
              checked={notes.noAutomationConfirmed}
              onChange={(value) => updateNote("noAutomationConfirmed", value)}
            />
          </Panel>

          <Panel icon={FileText} title="Evidence and exports">
            <SelectField
              label="Report export available"
              value={notes.reportExportAvailable}
              onChange={(value) => updateNote("reportExportAvailable", value)}
            />
            <Field
              label="Report location"
              value={notes.reportLocation}
              onChange={(value) => updateNote("reportLocation", value)}
            />
            <Field
              label="Screenshot location"
              value={notes.screenshotLocation}
              onChange={(value) => updateNote("screenshotLocation", value)}
            />
            <SelectField
              label="CSV export available"
              value={notes.csvExportAvailable}
              onChange={(value) => updateNote("csvExportAvailable", value)}
            />
          </Panel>

          <Panel icon={Network} title="Integration notes">
            <SelectField
              label="Recommended path"
              value={notes.recommendedPath}
              options={recommendationOptions}
              onChange={(value) => updateNote("recommendedPath", value)}
            />
            <TextAreaField
              label="Test session notes"
              value={notes.testNotes}
              onChange={(value) => updateNote("testNotes", value)}
            />
            <TextAreaField
              label="Owner boundaries"
              value={notes.ownerBoundaries}
              onChange={(value) => updateNote("ownerBoundaries", value)}
            />
            <TextAreaField
              label="Owner sign-off notes"
              value={notes.ownerSignoffNotes}
              onChange={(value) => updateNote("ownerSignoffNotes", value)}
            />
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Panel({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: typeof CheckCircle2;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-[#d7dfd4] bg-white p-6">
      <div className="flex items-center gap-3">
        <Icon className="text-[#2f6b3f]" size={28} />
        <h2 className="text-2xl font-black">{title}</h2>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#53605a]">
      {label}
      <input
        className="h-12 rounded-md border border-[#d7dfd4] bg-[#fbfdf9] px-4 text-base font-bold text-[#18211f] outline-none focus:border-[#2f6b3f]"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options = selectOptions,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options?: string[];
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#53605a]">
      {label}
      <select
        className="h-12 rounded-md border border-[#d7dfd4] bg-[#fbfdf9] px-4 text-base font-bold text-[#18211f] outline-none focus:border-[#2f6b3f]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex h-12 items-center gap-3 rounded-md border border-[#d7dfd4] bg-[#fbfdf9] px-4 text-sm font-black text-[#18211f]">
      <input
        className="size-4 accent-[#2f6b3f]"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#53605a] md:col-span-2">
      {label}
      <textarea
        className="min-h-28 rounded-md border border-[#d7dfd4] bg-[#fbfdf9] px-4 py-3 text-base font-bold text-[#18211f] outline-none focus:border-[#2f6b3f]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

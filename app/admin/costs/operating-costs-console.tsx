"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import type { OperatingCostRecord } from "@/lib/operating-cost-store";

type OperatingCostsConsoleProps = {
  initialCosts: OperatingCostRecord[];
};

type CostDraft = {
  id?: string;
  incurredAt: string;
  vendor: string;
  category: string;
  description: string;
  amount: string;
  paymentMethod: string;
  account: string;
  isDeductible: boolean;
};

const emptyDraft: CostDraft = {
  incurredAt: new Date().toISOString().slice(0, 10),
  vendor: "",
  category: "",
  description: "",
  amount: "",
  paymentMethod: "",
  account: "",
  isDeductible: true,
};

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function toDateInput(value: string) {
  const date = new Date(value);

  return Number.isFinite(date.getTime())
    ? date.toISOString().slice(0, 10)
    : value.slice(0, 10);
}

function toDraft(cost: OperatingCostRecord): CostDraft {
  return {
    id: cost.id,
    incurredAt: toDateInput(cost.incurredAt),
    vendor: cost.vendor,
    category: cost.category,
    description: cost.description,
    amount: (cost.amountCents / 100).toFixed(2),
    paymentMethod: cost.paymentMethod,
    account: cost.account,
    isDeductible: cost.isDeductible,
  };
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(cents / 100);
}

function formatMonth(value: string) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function amountToCents(value: string) {
  const parsed = Number(value.replace(/[$,]/g, ""));

  return Number.isFinite(parsed) ? Math.round(parsed * 100) : Number.NaN;
}

function buildMonthlyBuckets(costs: OperatingCostRecord[]) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const totals = Array.from({ length: 12 }, () => 0);

  costs.forEach((cost) => {
    const date = new Date(cost.incurredAt);

    if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() !== currentYear) {
      return;
    }

    totals[date.getUTCMonth()] += cost.amountCents;
  });

  return totals.map((amountCents, index) => ({
    amountCents,
    isFuture: index > currentMonth,
    label: monthLabels[index],
  }));
}

function chartMaxFromCents(maxCents: number) {
  if (maxCents <= 10000) {
    return 10000;
  }

  return Math.ceil(maxCents / 10000) * 10000;
}

function MonthlyCostChart({ costs }: { costs: OperatingCostRecord[] }) {
  const buckets = buildMonthlyBuckets(costs);
  const chartMax = chartMaxFromCents(
    Math.max(...buckets.map((bucket) => bucket.amountCents), 0),
  );
  const year = new Date().getFullYear();

  return (
    <div className="rounded-lg border border-[#ded6c8] bg-white p-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-black">Costs over time</h2>
          <p className="mt-1 text-sm font-bold text-[#59655f]">
            Monthly operating costs for {year}.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[76px_1fr] gap-3">
            <div className="grid h-72 grid-rows-2 text-right text-xs font-black text-[#87908a]">
              <span>{formatCurrency(chartMax)}</span>
              <span className="self-end">$0.00</span>
            </div>

            <div className="relative h-72 border-b border-l border-[#d8cfbf]">
              <div className="absolute inset-0 grid grid-rows-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="border-t border-dashed border-[#ece5d8]"
                  />
                ))}
              </div>

              <div className="relative z-10 grid h-full grid-cols-12 items-end gap-3 px-4">
                {buckets.map((bucket) => (
                  <div
                    key={bucket.label}
                    className="flex h-full flex-col justify-end gap-2"
                  >
                    <div className="flex justify-center">
                      <span className="text-[10px] font-black text-[#18211f]">
                        {bucket.amountCents > 0
                          ? formatCurrency(bucket.amountCents)
                          : ""}
                      </span>
                    </div>
                    <div
                      className={`min-h-1 rounded-t-md ${
                        bucket.isFuture ? "bg-[#cfd5cf]" : "bg-[#2f6b3f]"
                      }`}
                      style={{
                        height:
                          bucket.amountCents === 0
                            ? "4px"
                            : `${Math.max(
                                8,
                                (bucket.amountCents / chartMax) * 100,
                              )}%`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div />
            <div className="grid grid-cols-12 gap-3 px-4 pt-3 text-center text-xs font-black uppercase tracking-[0.08em] text-[#59655f]">
              {buckets.map((bucket) => (
                <span
                  key={bucket.label}
                  className={bucket.isFuture ? "text-[#b3bab4]" : undefined}
                >
                  {bucket.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CostInput({
  label,
  value,
  onChange,
  type = "text",
  list,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  list?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#53605a]">
      {label}
      <input
        className="h-11 rounded-md border border-[#ded6c8] bg-white px-3 text-sm font-bold text-[#18211f] outline-none focus:border-[#2f6b3f]"
        list={list}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function OperatingCostsConsole({
  initialCosts,
}: OperatingCostsConsoleProps) {
  const [costs, setCosts] = useState(initialCosts);
  const [newCost, setNewCost] = useState<CostDraft>(emptyDraft);
  const [editingCostId, setEditingCostId] = useState("");
  const [editingCost, setEditingCost] = useState<CostDraft | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const sortedCosts = useMemo(
    () =>
      [...costs].sort(
        (left, right) =>
          new Date(right.incurredAt).getTime() -
          new Date(left.incurredAt).getTime(),
      ),
    [costs],
  );
  const totalCents = costs.reduce((sum, cost) => sum + cost.amountCents, 0);
  const deductibleCents = costs.reduce(
    (sum, cost) => sum + (cost.isDeductible ? cost.amountCents : 0),
    0,
  );
  const averageCents = costs.length ? Math.round(totalCents / costs.length) : 0;
  const largestCost = costs.reduce<OperatingCostRecord | null>(
    (largest, cost) =>
      !largest || cost.amountCents > largest.amountCents ? cost : largest,
    null,
  );
  const categoryOptions = Array.from(
    new Set(costs.map((cost) => cost.category).filter(Boolean)),
  ).sort();
  const accountOptions = Array.from(
    new Set(costs.map((cost) => cost.account).filter(Boolean)),
  ).sort();
  const paymentMethodOptions = Array.from(
    new Set(costs.map((cost) => cost.paymentMethod).filter(Boolean)),
  ).sort();

  function updateDraft(
    draft: CostDraft,
    setter: (draft: CostDraft) => void,
    key: keyof CostDraft,
    value: string | boolean,
  ) {
    setter({ ...draft, [key]: value });
  }

  async function saveCost(draft: CostDraft, method: "POST" | "PATCH") {
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const amountCents = amountToCents(draft.amount);
      const response = await fetch("/api/admin/operating-costs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draft.id,
          incurredAt: draft.incurredAt,
          vendor: draft.vendor,
          category: draft.category,
          description: draft.description,
          amountCents,
          paymentMethod: draft.paymentMethod,
          account: draft.account,
          isDeductible: draft.isDeductible,
        }),
      });
      const data = (await response.json()) as {
        cost?: OperatingCostRecord;
        error?: string;
      };

      if (!response.ok || !data.cost) {
        throw new Error(data.error ?? "Could not save operating cost.");
      }

      setCosts((currentCosts) => {
        const remainingCosts = currentCosts.filter(
          (cost) => cost.id !== data.cost?.id,
        );

        return [data.cost as OperatingCostRecord, ...remainingCosts];
      });
      setMessage(method === "POST" ? "Operating cost added." : "Operating cost updated.");

      if (method === "POST") {
        setNewCost(emptyDraft);
      } else {
        setEditingCostId("");
        setEditingCost(null);
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save operating cost.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteCost(id: string) {
    if (!window.confirm("Delete this operating cost?")) {
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/operating-costs?id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not delete operating cost.");
      }

      setCosts((currentCosts) => currentCosts.filter((cost) => cost.id !== id));
      setMessage("Operating cost deleted.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete operating cost.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-8 grid gap-6">
      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total costs", value: formatCurrency(totalCents) },
          { label: "Deductible", value: formatCurrency(deductibleCents) },
          { label: "Transactions", value: String(costs.length) },
          {
            label: "Average cost",
            value: formatCurrency(averageCents),
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-[#ded6c8] bg-white p-5"
          >
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#59655f]">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-black text-[#18211f]">
              {metric.value}
            </p>
          </div>
        ))}
      </section>

      <MonthlyCostChart costs={costs} />

      <section className="rounded-lg border border-[#ded6c8] bg-white p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-black">Add operating cost</h2>
            <p className="mt-1 text-sm font-bold text-[#59655f]">
              New rows are saved to the Pin2Win database.
            </p>
          </div>
          {largestCost ? (
            <p className="text-sm font-bold text-[#59655f]">
              Largest expense:{" "}
              <span className="font-black text-[#18211f]">
                {formatCurrency(largestCost.amountCents)}
              </span>
            </p>
          ) : null}
        </div>

        <datalist id="cost-categories">
          {categoryOptions.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
        <datalist id="cost-accounts">
          {accountOptions.map((account) => (
            <option key={account} value={account} />
          ))}
        </datalist>
        <datalist id="payment-methods">
          {paymentMethodOptions.map((paymentMethod) => (
            <option key={paymentMethod} value={paymentMethod} />
          ))}
        </datalist>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <CostInput
            label="Date"
            type="date"
            value={newCost.incurredAt}
            onChange={(value) =>
              updateDraft(newCost, setNewCost, "incurredAt", value)
            }
          />
          <CostInput
            label="Vendor / Payee"
            value={newCost.vendor}
            onChange={(value) => updateDraft(newCost, setNewCost, "vendor", value)}
          />
          <CostInput
            label="Category"
            list="cost-categories"
            value={newCost.category}
            onChange={(value) =>
              updateDraft(newCost, setNewCost, "category", value)
            }
          />
          <CostInput
            label="Amount"
            type="number"
            value={newCost.amount}
            onChange={(value) => updateDraft(newCost, setNewCost, "amount", value)}
          />
          <CostInput
            label="Description"
            value={newCost.description}
            onChange={(value) =>
              updateDraft(newCost, setNewCost, "description", value)
            }
          />
          <CostInput
            label="Payment method"
            list="payment-methods"
            value={newCost.paymentMethod}
            onChange={(value) =>
              updateDraft(newCost, setNewCost, "paymentMethod", value)
            }
          />
          <CostInput
            label="Account"
            list="cost-accounts"
            value={newCost.account}
            onChange={(value) =>
              updateDraft(newCost, setNewCost, "account", value)
            }
          />
          <label className="flex h-11 items-center gap-3 self-end rounded-md border border-[#ded6c8] px-3 text-sm font-black text-[#18211f]">
            <input
              type="checkbox"
              checked={newCost.isDeductible}
              onChange={(event) =>
                updateDraft(
                  newCost,
                  setNewCost,
                  "isDeductible",
                  event.target.checked,
                )
              }
            />
            Deductible
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935] disabled:opacity-60"
            disabled={isSaving}
            type="button"
            onClick={() => saveCost(newCost, "POST")}
          >
            <Plus size={17} /> Add cost
          </button>
          {message ? (
            <p className="text-sm font-black text-[#2f6b3f]">{message}</p>
          ) : null}
          {error ? <p className="text-sm font-black text-[#b42318]">{error}</p> : null}
        </div>
      </section>

      <section className="rounded-lg border border-[#ded6c8] bg-white p-6">
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-black">Operating cost log</h2>
            <p className="mt-1 text-sm font-bold text-[#59655f]">
              Edit cost records as new expenses come up.
            </p>
          </div>
          <p className="text-sm font-black text-[#87908a]">
            {formatMonth(sortedCosts[0]?.incurredAt ?? "") || "No costs yet"}
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#ece5d8]">
          <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#f2eadb] text-xs font-black uppercase tracking-[0.12em] text-[#59655f]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Vendor / Payee</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Deductible</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece5d8]">
              {sortedCosts.map((cost) => {
                const isEditing = editingCostId === cost.id && editingCost !== null;
                const draft = isEditing ? editingCost : toDraft(cost);

                return (
                  <tr key={cost.id} className="align-top">
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          className="h-10 w-36 rounded-md border border-[#ded6c8] px-2 font-bold"
                          type="date"
                          value={draft.incurredAt}
                          onChange={(event) =>
                            setEditingCost({
                              ...draft,
                              incurredAt: event.target.value,
                            })
                          }
                        />
                      ) : (
                        <span className="font-black">{toDateInput(cost.incurredAt)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          className="h-10 w-44 rounded-md border border-[#ded6c8] px-2 font-bold"
                          value={draft.vendor}
                          onChange={(event) =>
                            setEditingCost({ ...draft, vendor: event.target.value })
                          }
                        />
                      ) : (
                        <span className="font-black">{cost.vendor}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          className="h-10 w-48 rounded-md border border-[#ded6c8] px-2 font-bold"
                          list="cost-categories"
                          value={draft.category}
                          onChange={(event) =>
                            setEditingCost({ ...draft, category: event.target.value })
                          }
                        />
                      ) : (
                        cost.category
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          className="h-10 w-56 rounded-md border border-[#ded6c8] px-2 font-bold"
                          value={draft.description}
                          onChange={(event) =>
                            setEditingCost({
                              ...draft,
                              description: event.target.value,
                            })
                          }
                        />
                      ) : (
                        cost.description || "No description"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          className="h-10 w-28 rounded-md border border-[#ded6c8] px-2 font-bold"
                          type="number"
                          value={draft.amount}
                          onChange={(event) =>
                            setEditingCost({ ...draft, amount: event.target.value })
                          }
                        />
                      ) : (
                        <span className="font-black">
                          {formatCurrency(cost.amountCents)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          className="h-10 w-36 rounded-md border border-[#ded6c8] px-2 font-bold"
                          list="payment-methods"
                          value={draft.paymentMethod}
                          onChange={(event) =>
                            setEditingCost({
                              ...draft,
                              paymentMethod: event.target.value,
                            })
                          }
                        />
                      ) : (
                        cost.paymentMethod || "Not set"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          className="h-10 w-40 rounded-md border border-[#ded6c8] px-2 font-bold"
                          list="cost-accounts"
                          value={draft.account}
                          onChange={(event) =>
                            setEditingCost({ ...draft, account: event.target.value })
                          }
                        />
                      ) : (
                        cost.account || "Not set"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={draft.isDeductible}
                          onChange={(event) =>
                            setEditingCost({
                              ...draft,
                              isDeductible: event.target.checked,
                            })
                          }
                        />
                      ) : cost.isDeductible ? (
                        "Yes"
                      ) : (
                        "No"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#18211f] px-3 text-xs font-black text-white disabled:opacity-60"
                            disabled={isSaving}
                            type="button"
                            onClick={() => saveCost(draft, "PATCH")}
                          >
                            <Save size={14} /> Save
                          </button>
                          <button
                            className="h-9 rounded-md border border-[#ded6c8] px-3 text-xs font-black"
                            type="button"
                            onClick={() => {
                              setEditingCostId("");
                              setEditingCost(null);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            className="h-9 rounded-md border border-[#ded6c8] px-3 text-xs font-black transition hover:bg-[#f5efdf]"
                            type="button"
                            onClick={() => {
                              setEditingCostId(cost.id);
                              setEditingCost(toDraft(cost));
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="inline-flex h-9 items-center justify-center rounded-md border border-[#f0c5bd] px-3 text-[#b42318] transition hover:bg-[#fff5f2]"
                            disabled={isSaving}
                            type="button"
                            onClick={() => deleteCost(cost.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

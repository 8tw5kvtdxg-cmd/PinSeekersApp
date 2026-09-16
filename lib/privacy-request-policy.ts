export const privacyRequestTypes = [
  "Access", "Correction", "Deletion", "Portable copy", "Opt out", "Appeal",
] as const;
export type PrivacyRequestType = (typeof privacyRequestTypes)[number];

export function privacyRequestDueAt(receivedAt: Date) {
  const due = new Date(receivedAt);
  due.setUTCDate(due.getUTCDate() + 45);
  return due;
}

export function validatePrivacyRequest(input: { requestType: string; detail: string }) {
  if (!privacyRequestTypes.includes(input.requestType as PrivacyRequestType)) throw new Error("Select a privacy request type.");
  const detail = input.detail.trim();
  if (detail.length < 10 || detail.length > 2000) throw new Error("Describe your request in 10 to 2000 characters.");
  return detail;
}

export type ClubhouseChallengeType = "HOLE_IN_ONE";

export type ClubhouseChallenge = {
  slug: string;
  name: string;
  type: ClubhouseChallengeType;
  venue: string;
  bayLabel: string;
  entryFeeCents: number;
  status: "Draft" | "Ready" | "Active" | "Completed";
  startsAt: string;
  endsAt: string;
  playWindowMinutes: number;
  e6EventName: string;
  e6JoinCode: string;
  e6QueueCode: string;
  e6ClubhouseUrl: string;
  prizeSummary: string;
  instructions: string[];
  eligibilityRules: string[];
};

export type ClubhouseEntry = {
  id: string;
  challengeSlug: string;
  playerName: string;
  phoneNumber?: string;
  e6DisplayName: string;
  paymentStatus: "Succeeded" | "Pending" | "Failed";
  paidAt: string;
  validFrom: string;
  validUntil: string;
  attemptLimit: number;
  resultStatus: "Pending E6 Result" | "Needs Review" | "Verified" | "Rejected";
  result?: string;
  resultValue?: number;
  resultUnit?: "inches" | "yards";
  evidence?: string;
};

export type VerificationRecord = ClubhouseEntry & {
  rank: number;
  e6LeaderboardResult: string;
  reviewNote: string;
};

export const clubhouseChallengeSlugs = {
  holeInOne: "alamo-hole-in-one-challenge",
} as const;

const legacyChallengeSlugMap: Record<string, string> = {
  "alamo-closest-pin-weekly": clubhouseChallengeSlugs.holeInOne,
  "alamo-closest-pin-monthly": clubhouseChallengeSlugs.holeInOne,
  "alamo-long-drive-weekly": clubhouseChallengeSlugs.holeInOne,
  "alamo-long-drive-monthly": clubhouseChallengeSlugs.holeInOne,
  "alamo-hole-in-one-monthly": clubhouseChallengeSlugs.holeInOne,
};

export const clubhouseChallenges: ClubhouseChallenge[] = [
  {
    slug: clubhouseChallengeSlugs.holeInOne,
    name: "Hole-in-One Challenge",
    type: "HOLE_IN_ONE",
    venue: "All partner locations",
    bayLabel: "Any active simulator bay",
    entryFeeCents: 2000,
    status: "Ready",
    startsAt: "",
    endsAt: "",
    playWindowMinutes: 15,
    e6EventName: "Pin2Win Hole-in-One Challenge",
    e6JoinCode: "",
    e6QueueCode: "",
    e6ClubhouseUrl: "https://e6golf.com/clubhouse",
    prizeSummary: "$5,000 Hole-in-One prize, subject to the published Official Rules and final challenge details.",
    instructions: [
      "Scan the Pin2Win QR code at the partner location.",
      "Create or load your Pin2Win player account.",
      "Enter the required player and simulator account information.",
      "Complete checkout through Pin2Win to unlock the simulator event code.",
      "Enter the event code in the simulator software once the event is active.",
      "Use the same simulator display name shown on your Pin2Win entry.",
    ],
    eligibilityRules: [
      "Only verified Pin2Win entries are included in official challenge records.",
      "Players must complete the Pin2Win entry flow before accessing the event code.",
      "One Pin2Win entry equals one eligible simulator attempt window.",
      "Shared or reused event codes do not create a valid Pin2Win entry.",
      "Results must match the Pin2Win player record, simulator display name, and play window.",
      "Results are verified against the simulator result record before final review.",
    ],
  },
];

export const clubhouseEntries: ClubhouseEntry[] = [];

export const verificationQueue: VerificationRecord[] = [];

export function formatEntryFee(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(cents / 100);
}

export function normalizeChallengeSlug(slug: string) {
  return legacyChallengeSlugMap[slug] ?? slug;
}

export function getClubhouseChallenge(slug: string) {
  const normalizedSlug = normalizeChallengeSlug(slug);

  return clubhouseChallenges.find((challenge) => challenge.slug === normalizedSlug);
}

export function getClubhouseChallengeByType(type: ClubhouseChallengeType) {
  return clubhouseChallenges.find((challenge) => challenge.type === type);
}

export function getClubhouseEntry(entryId: string) {
  return clubhouseEntries.find((entry) => entry.id === entryId);
}

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
    entryFeeCents: 10,
    status: "Ready",
    startsAt: "May 22, 2026, 10:00 AM",
    endsAt: "May 24, 2026, 8:00 PM",
    playWindowMinutes: 15,
    e6EventName: "Pin2Win Hole-in-One Challenge",
    e6JoinCode: "E6-P2W-7429",
    e6QueueCode: "QUEUE-118",
    e6ClubhouseUrl: "https://e6golf.com/clubhouse",
    prizeSummary: "A featured Pin2Win golf entertainment experience for partner simulator locations.",
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

export const clubhouseEntries: ClubhouseEntry[] = [
  {
    id: "P2W-ENTRY-20260522-0042",
    challengeSlug: clubhouseChallengeSlugs.holeInOne,
    playerName: "Jordan Smith",
    phoneNumber: "(210) 555-0101",
    e6DisplayName: "JSmith-SA",
    paymentStatus: "Succeeded",
    paidAt: "May 22, 2026, 1:55 PM",
    validFrom: "May 22, 2026, 2:00 PM",
    validUntil: "May 22, 2026, 2:10 PM",
    attemptLimit: 1,
    resultStatus: "Needs Review",
    result: "4 ft 8 in",
    evidence: "Simulator result screenshot pending admin review",
  },
  {
    id: "P2W-ENTRY-20260522-0043",
    challengeSlug: clubhouseChallengeSlugs.holeInOne,
    playerName: "Maya Chen",
    phoneNumber: "(210) 555-0102",
    e6DisplayName: "MayaC",
    paymentStatus: "Succeeded",
    paidAt: "May 22, 2026, 2:08 PM",
    validFrom: "May 22, 2026, 2:10 PM",
    validUntil: "May 22, 2026, 2:20 PM",
    attemptLimit: 1,
    resultStatus: "Verified",
    result: "3 ft 2 in",
    evidence: "Verified against simulator result record",
  },
];

export const verificationQueue: VerificationRecord[] = [
  {
    ...clubhouseEntries[0],
    rank: 2,
    e6LeaderboardResult: "4 ft 8 in",
    reviewNote:
      "Venue booking was registered before play window. Simulator display name matches Pin2Win entry.",
  },
  {
    ...clubhouseEntries[1],
    rank: 1,
    e6LeaderboardResult: "3 ft 2 in",
    reviewNote:
      "Verified result candidate. Keep E6 result proof attached before approval.",
  },
];

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

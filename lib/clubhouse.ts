export type ClubhouseChallengeType = "CLOSEST_TO_PIN" | "LONGEST_DRIVE";

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
  closestToPin: "alamo-closest-pin-monthly",
  longestDrive: "alamo-long-drive-monthly",
} as const;

const legacyChallengeSlugMap: Record<string, string> = {
  "alamo-closest-pin-weekly": clubhouseChallengeSlugs.closestToPin,
  "alamo-long-drive-weekly": clubhouseChallengeSlugs.longestDrive,
};

export const clubhouseChallenges: ClubhouseChallenge[] = [
  {
    slug: clubhouseChallengeSlugs.closestToPin,
    name: "Alamo Golf Den Closest to the Pin Monthly",
    type: "CLOSEST_TO_PIN",
    venue: "Alamo Golf Den",
    bayLabel: "Any active E6 2026 bay",
    entryFeeCents: 2000,
    status: "Ready",
    startsAt: "May 22, 2026, 10:00 AM",
    endsAt: "May 24, 2026, 8:00 PM",
    playWindowMinutes: 10,
    e6EventName: "Pin2Win CTP Monthly Qualifier",
    e6JoinCode: "E6-P2W-7429",
    e6QueueCode: "QUEUE-118",
    e6ClubhouseUrl: "https://e6golf.com/clubhouse",
    prizeSummary: "$20 entry. Monthly prize pot starts at $50 and grows with paid entries.",
    instructions: [
      "Scan the Pin2Win QR code before starting your E6 attempt.",
      "Create or load your Pin2Win player account.",
      "Pay the entry fee to unlock the E6 Event Join Code.",
      "Enter the E6 code in the Event option once the event is active.",
      "Use the same E6 display name shown on your Pin2Win entry.",
    ],
    eligibilityRules: [
      "Only paid Pin2Win entries are prize-eligible.",
      "Verified Closest to the Pin entrants are also eligible for the $10,000 hole-in-one prize.",
      "One Pin2Win entry equals one eligible E6 attempt window.",
      "Shared or reused E6 codes do not create prize eligibility.",
      "Results must match the Pin2Win player record, E6 display name, and play window.",
      "Prize results are verified against the E6 Clubhouse leaderboard before payout.",
    ],
  },
  {
    slug: clubhouseChallengeSlugs.longestDrive,
    name: "Alamo Golf Den Long Drive Monthly",
    type: "LONGEST_DRIVE",
    venue: "Alamo Golf Den",
    bayLabel: "Any active E6 2026 bay",
    entryFeeCents: 2000,
    status: "Draft",
    startsAt: "May 22, 2026, 10:00 AM",
    endsAt: "May 24, 2026, 8:00 PM",
    playWindowMinutes: 10,
    e6EventName: "Pin2Win Long Drive Monthly",
    e6JoinCode: "Pending E6 event finalization",
    e6QueueCode: "Generated after event start",
    e6ClubhouseUrl: "https://e6golf.com/clubhouse",
    prizeSummary: "$20 entry. Monthly prize pot starts at $50 and grows with paid entries.",
    instructions: [
      "Finalize the matching E6 Clubhouse event before opening paid entries.",
      "Load the E6 Event Join Code into the Pin2Win admin record.",
      "Reveal the E6 code only after payment succeeds.",
      "Verify prize-eligible results against the E6 leaderboard.",
    ],
    eligibilityRules: [
      "The E6 code can be shared by the event, but Pin2Win eligibility is unique per paid entry.",
      "Only results inside the valid play window are eligible.",
      "Duplicate unpaid E6 attempts can be rejected during verification.",
    ],
  },
];

export const clubhouseEntries: ClubhouseEntry[] = [
  {
    id: "P2W-ENTRY-20260522-0042",
    challengeSlug: clubhouseChallengeSlugs.closestToPin,
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
    evidence: "E6 Clubhouse leaderboard screenshot pending admin review",
  },
  {
    id: "P2W-ENTRY-20260522-0043",
    challengeSlug: clubhouseChallengeSlugs.closestToPin,
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
    evidence: "Verified against E6 Clubhouse leaderboard",
  },
];

export const verificationQueue: VerificationRecord[] = [
  {
    ...clubhouseEntries[0],
    rank: 2,
    e6LeaderboardResult: "4 ft 8 in",
    reviewNote:
      "Payment succeeded before play window. E6 display name matches paid entry.",
  },
  {
    ...clubhouseEntries[1],
    rank: 1,
    e6LeaderboardResult: "3 ft 2 in",
    reviewNote:
      "Verified winner candidate. Keep E6 leaderboard proof attached before payout.",
  },
];

export function formatEntryFee(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
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

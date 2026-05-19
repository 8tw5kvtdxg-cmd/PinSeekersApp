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
  e6DisplayName: string;
  paymentStatus: "Succeeded" | "Pending" | "Failed";
  paidAt: string;
  validFrom: string;
  validUntil: string;
  attemptLimit: number;
  resultStatus: "Pending E6 Result" | "Needs Review" | "Verified" | "Rejected";
  result?: string;
  evidence?: string;
};

export type VerificationRecord = ClubhouseEntry & {
  rank: number;
  e6LeaderboardResult: string;
  reviewNote: string;
};

export const clubhouseChallenges: ClubhouseChallenge[] = [
  {
    slug: "alamo-closest-pin-weekly",
    name: "Alamo Golf Den Closest to the Pin",
    type: "CLOSEST_TO_PIN",
    venue: "Alamo Golf Den",
    bayLabel: "Any active E6 2026 bay",
    entryFeeCents: 2000,
    status: "Ready",
    startsAt: "May 22, 2026, 10:00 AM",
    endsAt: "May 24, 2026, 8:00 PM",
    playWindowMinutes: 10,
    e6EventName: "Pin2Win CTP Weekend Qualifier",
    e6JoinCode: "E6-P2W-7429",
    e6QueueCode: "QUEUE-118",
    e6ClubhouseUrl: "https://e6golf.com/clubhouse",
    prizeSummary: "$20 entry. Top verified closest-to-the-pin result wins the weekly prize.",
    instructions: [
      "Scan the Pin2Win QR code before starting your E6 attempt.",
      "Create or load your Pin2Win player account.",
      "Pay the entry fee to unlock the E6 Event Join Code.",
      "Enter the E6 code in the Event option once the event is active.",
      "Use the same E6 display name shown on your Pin2Win entry.",
    ],
    eligibilityRules: [
      "Only paid Pin2Win entries are prize-eligible.",
      "One Pin2Win entry equals one eligible E6 attempt window.",
      "Shared or reused E6 codes do not create prize eligibility.",
      "Results must match the Pin2Win player record, E6 display name, and play window.",
      "Prize results are verified against the E6 Clubhouse leaderboard before payout.",
    ],
  },
  {
    slug: "alamo-long-drive-weekly",
    name: "Alamo Golf Den Long Drive",
    type: "LONGEST_DRIVE",
    venue: "Alamo Golf Den",
    bayLabel: "Any active E6 2026 bay",
    entryFeeCents: 2000,
    status: "Draft",
    startsAt: "May 22, 2026, 10:00 AM",
    endsAt: "May 24, 2026, 8:00 PM",
    playWindowMinutes: 10,
    e6EventName: "Pin2Win Long Drive Weekend",
    e6JoinCode: "Pending E6 event finalization",
    e6QueueCode: "Generated after event start",
    e6ClubhouseUrl: "https://e6golf.com/clubhouse",
    prizeSummary: "$20 entry. Longest verified drive wins the weekly prize.",
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
    challengeSlug: "alamo-closest-pin-weekly",
    playerName: "Jordan Smith",
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
    challengeSlug: "alamo-closest-pin-weekly",
    playerName: "Maya Chen",
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

export function getClubhouseChallenge(slug: string) {
  return clubhouseChallenges.find((challenge) => challenge.slug === slug);
}

export function getClubhouseEntry(entryId: string) {
  return clubhouseEntries.find((entry) => entry.id === entryId);
}

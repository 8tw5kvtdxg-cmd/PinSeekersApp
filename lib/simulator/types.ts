export type SimulatorProvider =
  | "TRUGOLF_APOGEE_E6"
  | "E6_CONNECT"
  | "FLIGHTSCOPE_E6"
  | "MANUAL"
  | "OTHER";

export type SimulatorChallengeType = "CLOSEST_TO_PIN" | "LONGEST_DRIVE";

export type SimulatorSessionStatus =
  | "CREATED"
  | "OPERATOR_READY"
  | "LAUNCHED"
  | "IN_PROGRESS"
  | "RESULT_PENDING"
  | "VERIFIED"
  | "SYNCED"
  | "CANCELLED";

export type SimulatorResultSource =
  | "MANUAL_ENTRY"
  | "SCREENSHOT"
  | "CSV_IMPORT"
  | "LOCAL_AGENT"
  | "VENDOR_API";

export type SimulatorSessionInput = {
  provider?: SimulatorProvider;
  challengeType: SimulatorChallengeType;
  playerAlias?: string;
  operatorName?: string;
  venueName?: string;
  bayName?: string;
  course?: string;
  hole?: number;
  teeBox?: string;
  pinLocation?: string;
  attempts?: number;
  playTimeMinutes?: number;
  e6SessionName?: string;
  e6SessionId?: string;
  externalSessionId?: string;
  syncEligible?: boolean;
};

export type SimulatorSession = SimulatorSessionInput & {
  id: string;
  pin2WinSessionId: string;
  provider: SimulatorProvider;
  status: SimulatorSessionStatus;
  createdAt: string;
  updatedAt: string;
};

export type SimulatorResultInput = {
  source?: SimulatorResultSource;
  challengeType?: SimulatorChallengeType;
  playerAlias?: string;
  rawResult: string;
  resultUnit?: string;
  evidenceUrl?: string;
  verifierName?: string;
  notes?: string;
  rawPayload?: unknown;
};

export type SimulatorResult = SimulatorResultInput & {
  id: string;
  sessionId: string;
  challengeType: SimulatorChallengeType;
  status: "PENDING_REVIEW" | "VERIFIED" | "REJECTED" | "SYNCED";
  normalizedValue: number | null;
  createdAt: string;
};

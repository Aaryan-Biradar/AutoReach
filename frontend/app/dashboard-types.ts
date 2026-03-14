export type DashboardTab = "logs" | "transcripts" | "planned" | "missed";
export type CallFreshness = "recent" | "aging" | "stale";

export type StoreRecord = {
  id: string;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  lastCalledHoursAgo: number;
  lastCalledLabel: string;
  callFreshness: CallFreshness;
  missedCalls: number;
  averageCallDurationLabel: string;
  pendingCallsCount: number;
  nextPendingCallLabel: string | null;
  pendingCallWindowLabel: string;
};

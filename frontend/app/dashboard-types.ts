export type DashboardTab = "logs" | "transcripts" | "planned" | "missed";
export type CallFreshness = "recent" | "aging" | "stale";
export type StoreIntegrationMode = "frontend-sample" | "backend-target";

export type StoreRecord = {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  longitude: number;
  latitude: number;
  integrationMode: StoreIntegrationMode;
  lastCalledHoursAgo: number;
  lastCalledLabel: string;
  callFreshness: CallFreshness;
  missedCalls: number;
  averageCallDurationSeconds: number;
  averageCallDurationLabel: string;
  pendingCallsCount: number;
  nextPendingCallLabel: string | null;
  pendingCallWindowLabel: string;
};

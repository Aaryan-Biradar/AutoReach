export type DashboardTab = "logs" | "transcripts" | "planned" | "missed";

export type StoreRecord = {
  id: string;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  lastCalledLabel: string;
};

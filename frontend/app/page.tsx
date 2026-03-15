"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { OttawaGroceryMap } from "./components/ottawa-grocery-map";
import type {
  CallFreshness,
  DashboardTab,
  StoreIntegrationMode,
  StoreRecord,
} from "./dashboard-types";

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const OTTAWA_GROCERY_SEARCH_URL = "https://api.mapbox.com/search/searchbox/v1/category";
const OTTAWA_BBOX = [-76.353915, 45.197522, -75.246597, 45.53758] as const;
const OTTAWA_PROXIMITY = "-75.6972,45.4215";
const GROCERY_CATEGORY_IDS = [
  "grocery",
  "supermarket",
  "market",
] as const;
const OTTAWA_QUERY_GRID_SIZE = 3;
const MAPBOX_REQUEST_BATCH_SIZE = 6;

type MapboxSearchFeature = {
  id?: string;
  geometry?: { coordinates?: [number, number] };
  properties?: {
    mapbox_id?: string;
    name?: string;
    full_address?: string;
    place_formatted?: string;
    coordinates?: {
      longitude?: number;
      latitude?: number;
    };
  };
};

type MockCallRecord = {
  id: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  occurredAtLabel: string;
  relativeAgeLabel: string;
  outcome: "Answered" | "Missed" | "Callback requested";
  durationLabel: string;
  durationSeconds: number;
  daysAgo: number;
};

const MOCK_REFERENCE_DATE = new Date("2026-03-14T12:00:00-04:00");
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Toronto",
});

function buildOttawaQueryBboxes(gridSize: number) {
  const [minLng, minLat, maxLng, maxLat] = OTTAWA_BBOX;
  const lngStep = (maxLng - minLng) / gridSize;
  const latStep = (maxLat - minLat) / gridSize;
  const cells: string[] = [];

  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      const cellMinLng = minLng + lngStep * column;
      const cellMaxLng = minLng + lngStep * (column + 1);
      const cellMinLat = minLat + latStep * row;
      const cellMaxLat = minLat + latStep * (row + 1);

      cells.push([cellMinLng, cellMinLat, cellMaxLng, cellMaxLat].join(","));
    }
  }

  return cells;
}

function normalizeStoreName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildStoreKey(name: string, longitude: number, latitude: number) {
  const roundedLongitude = longitude.toFixed(4);
  const roundedLatitude = latitude.toFixed(4);
  return `${normalizeStoreName(name)}-${roundedLongitude}-${roundedLatitude}`;
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function hashValue(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function formatRelativeAge(hoursAgo: number) {
  if (hoursAgo < 24) {
    return `${hoursAgo}h ago`;
  }

  const daysSince = Math.floor(hoursAgo / 24);

  if (daysSince <= 30) {
    return `${daysSince}d ago`;
  }

  if (daysSince <= 60) {
    return `${Math.max(2, Math.round(daysSince / 7))}w ago`;
  }

  return `${Math.max(2, Math.round(daysSince / 30))}mo ago`;
}

function buildMockPhoneNumber(seedSource: string) {
  const seed = hashValue(seedSource);
  const areaCode = seed % 2 === 0 ? "613" : "343";
  const reservedSuffix = (seed % 100).toString().padStart(2, "0");
  return `(${areaCode}) 555-01${reservedSuffix}`;
}

function buildMockStoreMetrics(seedSource: string) {
  const seed = hashValue(seedSource);
  const hoursSinceLastCall = 6 + (seed % (24 * 90));
  const missedCalls = seed % 6;
  const averageCallDurationSeconds = 95 + (seed % 265);
  const pendingCallsCount = (seed >> 4) % 3;
  const pendingCallOffsetHours = 8 + ((seed >> 7) % 60);
  const pendingCallDate = new Date("2026-03-16T09:00:00-04:00");
  pendingCallDate.setHours(pendingCallDate.getHours() + pendingCallOffsetHours);
  const callFreshness: CallFreshness =
    hoursSinceLastCall <= 24 * 30
      ? "recent"
      : hoursSinceLastCall <= 24 * 60
        ? "aging"
        : "stale";

  return {
    lastCalledHoursAgo: hoursSinceLastCall,
    lastCalledLabel: formatRelativeAge(hoursSinceLastCall),
    callFreshness,
    missedCalls,
    averageCallDurationSeconds,
    averageCallDurationLabel: formatDuration(averageCallDurationSeconds),
    pendingCallsCount,
    nextPendingCallLabel:
      pendingCallsCount > 0
        ? new Intl.DateTimeFormat("en-CA", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(pendingCallDate)
        : null,
    pendingCallWindowLabel:
      pendingCallsCount > 0
        ? `${pendingCallOffsetHours}h from now`
        : "No pending calls scheduled",
  };
}

function buildMockCallRecords(store: StoreRecord) {
  const seed = hashValue(`${store.id}-call-history`);
  const totalCalls = Math.max(store.missedCalls + 2, 3 + (seed % 5));
  const answeredSlots = totalCalls - store.missedCalls;
  const callbackOffset =
    store.pendingCallsCount > 0 && answeredSlots > 0
      ? (seed >> 3) % answeredSlots
      : -1;
  const records: MockCallRecord[] = [];

  for (let index = 0; index < totalCalls; index += 1) {
    const hoursAgo =
      store.lastCalledHoursAgo +
      index * (12 + ((seed >> ((index % 6) + 1)) % 40));
    const daysAgo = Number((hoursAgo / 24).toFixed(1));
    const occurredAt = new Date(
      MOCK_REFERENCE_DATE.getTime() - hoursAgo * 60 * 60 * 1000,
    );
    const answeredIndex = index - store.missedCalls;
    const outcome =
      index < store.missedCalls
        ? "Missed"
        : answeredIndex === callbackOffset
          ? "Callback requested"
          : "Answered";
    const durationSeconds =
      outcome === "Missed"
        ? 0
        : Math.max(
            50,
            store.averageCallDurationSeconds +
              (((seed >> ((index % 8) + 2)) % 70) - 35),
          );

    records.push({
      id: `${store.id}-call-${index + 1}`,
      storeId: store.id,
      storeName: store.name,
      storeAddress: store.address,
      occurredAtLabel: DATE_TIME_FORMATTER.format(occurredAt),
      relativeAgeLabel: formatRelativeAge(hoursAgo),
      outcome,
      durationLabel: outcome === "Missed" ? "0m 00s" : formatDuration(durationSeconds),
      durationSeconds,
      daysAgo,
    });
  }

  return records;
}

function buildManualStoreRecord({
  id,
  name,
  address,
  longitude,
  latitude,
  integrationMode = "frontend-sample",
  phoneNumber,
}: Pick<StoreRecord, "id" | "name" | "address" | "longitude" | "latitude"> & {
  integrationMode?: StoreIntegrationMode;
  phoneNumber?: string;
}) {
  return {
    id,
    name,
    address,
    phoneNumber: phoneNumber ?? buildMockPhoneNumber(`${id}-${name}`),
    longitude,
    latitude,
    integrationMode,
    ...buildMockStoreMetrics(`${id}-${name}`),
  } satisfies StoreRecord;
}

const BACKEND_TARGET_STORE = buildManualStoreRecord({
  id: "backend-target-ryans-grocery-store-lebreton-flats",
  name: "Ryans Grocery Store",
  address: "LeBreton Flats, Ottawa, Ontario",
  longitude: -75.7146,
  latitude: 45.4176,
  integrationMode: "backend-target",
  phoneNumber: "",
});

const MANUAL_SAMPLE_STORES: StoreRecord[] = [];

function toStoreRecord(feature: MapboxSearchFeature) {
  const properties = feature.properties;
  const coordinates = feature.geometry?.coordinates;
  const longitude =
    typeof coordinates?.[0] === "number"
      ? coordinates[0]
      : properties?.coordinates?.longitude;
  const latitude =
    typeof coordinates?.[1] === "number"
      ? coordinates[1]
      : properties?.coordinates?.latitude;
  const name = properties?.name?.trim();
  const address = (properties?.full_address ?? properties?.place_formatted ?? "").trim();

  if (
    !name ||
    typeof longitude !== "number" ||
    typeof latitude !== "number"
  ) {
    return null;
  }

  const searchableText = `${name} ${address}`.toLowerCase();
  if (!searchableText.includes("ottawa")) {
    return null;
  }

  const id =
    properties?.mapbox_id ??
    feature.id ??
    buildStoreKey(name, longitude, latitude);
  const metrics = buildMockStoreMetrics(`${id}-${name}`);

  return {
    id,
    name,
    address: address || "Ottawa, Ontario",
    phoneNumber: buildMockPhoneNumber(`${id}-${name}`),
    longitude,
    latitude,
    integrationMode: "frontend-sample",
    ...metrics,
  } satisfies StoreRecord;
}

const tabs: {
  id: DashboardTab;
  label: string;
  emptyTitle: string;
  emptyBody: string;
}[] = [
  {
    id: "logs",
    label: "Call history",
    emptyTitle: "No call history yet",
    emptyBody: "Store-specific call history will appear here after the backend is connected.",
  },
  {
    id: "transcripts",
    label: "Transcripts",
    emptyTitle: "No transcripts yet",
    emptyBody: "Transcript records will appear here once completed calls are available.",
  },
  {
    id: "planned",
    label: "Planned calls",
    emptyTitle: "No planned calls yet",
    emptyBody: "Scheduled outreach will appear here when planning data is connected.",
  },
  {
    id: "missed",
    label: "Missed calls",
    emptyTitle: "No missed calls yet",
    emptyBody: "Missed-call follow-up items will appear here after live data is available.",
  },
];

function MetricCard({
  label,
  value,
  onClick,
  tone = "default",
}: {
  label: string;
  value?: string;
  onClick?: () => void;
  tone?: "default" | "accent";
}) {
  const sharedClassName =
    "rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-2.5 shadow-[0_18px_45px_-32px_rgba(20,20,20,0.14)]";
  const accentClassName =
    "border-[color:var(--border-strong)] bg-[color:var(--accent)] text-[#1f1c19] hover:bg-[color:var(--accent-strong)]";
  const defaultClassName =
    "text-left transition hover:border-[color:var(--border-strong)] hover:bg-[#fff3df]";
  const labelClassName =
    tone === "accent"
      ? "text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1f1c19]"
      : "text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]";
  const valueClassName =
    tone === "accent"
      ? "mt-2 text-2xl font-semibold text-[#1f1c19]"
      : "mt-2 text-2xl font-semibold text-[color:var(--foreground)]";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${sharedClassName} ${defaultClassName} ${tone === "accent" ? accentClassName : ""}`}
      >
        <p className={labelClassName}>{label}</p>
        {value ? (
          <p className={valueClassName}>{value}</p>
        ) : null}
      </button>
    );
  }

  return (
    <div className={sharedClassName}>
      <p className={labelClassName}>{label}</p>
      {value ? <p className={valueClassName}>{value}</p> : null}
    </div>
  );
}

export default function Home() {
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [isStoresLoading, setIsStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("logs");
  const [isStoreWorkspaceOpen, setIsStoreWorkspaceOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [queuedCalls, setQueuedCalls] = useState<Record<string, string>>({});
  const [lookbackDays, setLookbackDays] = useState(30);
  const [historyOffsetDays, setHistoryOffsetDays] = useState(0);

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const filteredStores = stores.filter((store) =>
    store.name.toLowerCase().includes(normalizedQuery),
  );
  const redStores = stores.filter((store) => store.callFreshness === "stale");
  const unqueuedRedStores = redStores.filter((store) => !queuedCalls[store.id]);
  const allMockCallRecords = stores
    .flatMap((store) => buildMockCallRecords(store))
    .sort((left, right) => left.daysAgo - right.daysAgo);
  const historyWindowStartDays = historyOffsetDays;
  const historyWindowEndDays = historyOffsetDays + lookbackDays;
  const visibleRecentCallRecords = allMockCallRecords
    .filter(
      (record) =>
        record.daysAgo >= historyWindowStartDays &&
        record.daysAgo <= historyWindowEndDays,
    )
    .slice(0, 24);
  const answeredCallRecords = allMockCallRecords.filter(
    (record) => record.durationSeconds > 0,
  );
  const totalMissedCalls = allMockCallRecords.filter(
    (record) => record.outcome === "Missed",
  ).length;
  const totalCallsMade = allMockCallRecords.length;
  const answeredCalls = answeredCallRecords.length;
  const averageCallTimeLabel =
    answeredCallRecords.length > 0
      ? formatDuration(
          Math.round(
            answeredCallRecords.reduce(
              (total, record) => total + record.durationSeconds,
              0,
            ) / answeredCallRecords.length,
          ),
        )
      : "0m 00s";
  const plannedFollowUpsCount =
    stores.reduce((total, store) => total + store.pendingCallsCount, 0) +
    Object.keys(queuedCalls).length;
  const storesInHistoryWindow = new Set(
    visibleRecentCallRecords.map((record) => record.storeId),
  ).size;
  const missedCallsInHistoryWindow = visibleRecentCallRecords.filter(
    (record) => record.outcome === "Missed",
  ).length;
  const displayedStores = filteredStores.slice(0, 14);
  const selectedStore =
    stores.find((store) => store.id === selectedStoreId) ?? null;
  const selectedStoreIsBackendTarget =
    selectedStore?.integrationMode === "backend-target";
  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const queuedCallLabel = selectedStore ? queuedCalls[selectedStore.id] ?? null : null;
  const pendingCallsTotal =
    (selectedStore?.pendingCallsCount ?? 0) + (queuedCallLabel ? 1 : 0);
  const activePanelTitle =
    activeTab === "planned" && queuedCallLabel
      ? "1 planned call queued"
      : activeTab === "planned" && (selectedStore?.pendingCallsCount ?? 0) > 0
        ? `${selectedStore?.pendingCallsCount ?? 0} planned calls`
        : activeTab === "missed" && (selectedStore?.missedCalls ?? 0) > 0
          ? `${selectedStore?.missedCalls ?? 0} missed calls`
      : activeTabMeta.emptyTitle;
  const activePanelBody =
    activeTab === "planned" && queuedCallLabel
      ? `This store has a queued call scheduled for ${queuedCallLabel}.`
      : activeTab === "planned" && selectedStore?.nextPendingCallLabel
        ? `The next planned call for this store is scheduled for ${selectedStore.nextPendingCallLabel}.`
        : activeTab === "missed" && (selectedStore?.missedCalls ?? 0) > 0
          ? "These missed calls represent prior outreach attempts that were not answered."
      : activeTabMeta.emptyBody;

  useEffect(() => {
    const accessToken = MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
      setStores([]);
      setStoresError(null);
      setIsStoresLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadOttawaGroceryStores() {
      setIsStoresLoading(true);
      setStoresError(null);

      try {
        if (!accessToken) {
          return;
        }

        const token = accessToken;
        const queryBboxes = buildOttawaQueryBboxes(OTTAWA_QUERY_GRID_SIZE);
        const querySpecs = queryBboxes.flatMap((bbox) =>
          GROCERY_CATEGORY_IDS.map((categoryId) => ({
            bbox,
            categoryId,
          })),
        );
        const featureGroups: MapboxSearchFeature[][] = [];
        let failedQueryCount = 0;

        for (const batch of chunkArray(querySpecs, MAPBOX_REQUEST_BATCH_SIZE)) {
          const results = await Promise.allSettled(
            batch.map(async ({ bbox, categoryId }) => {
              const params = new URLSearchParams({
                language: "en",
                limit: "10",
                country: "CA",
                proximity: OTTAWA_PROXIMITY,
                bbox,
                access_token: token,
              });

              const response = await fetch(
                `${OTTAWA_GROCERY_SEARCH_URL}/${categoryId}?${params.toString()}`,
                {
                  signal: controller.signal,
                },
              );

              if (!response.ok) {
                throw new Error(`Mapbox category search failed for ${categoryId}.`);
              }

              const data = (await response.json()) as {
                features?: MapboxSearchFeature[];
              };

              return data.features ?? [];
            }),
          );

          for (const result of results) {
            if (result.status === "fulfilled") {
              featureGroups.push(result.value);
            } else {
              failedQueryCount += 1;
              console.warn(result.reason);
            }
          }
        }

        if (featureGroups.length === 0) {
          throw new Error("Unable to reach Mapbox Search.");
        }

        const uniqueStores = new Map<string, StoreRecord>();
        const fallbackStores = new Map<string, StoreRecord>();

        for (const featureGroup of featureGroups) {
          for (const feature of featureGroup) {
            const store = toStoreRecord(feature);

            if (!store) {
              continue;
            }

            if (feature.properties?.mapbox_id) {
              uniqueStores.set(feature.properties.mapbox_id, store);
            } else {
              fallbackStores.set(
                buildStoreKey(store.name, store.longitude, store.latitude),
                store,
              );
            }
          }
        }

        const mergedStores = new Map([
          ...uniqueStores.entries(),
          ...fallbackStores.entries(),
        ]);

        mergedStores.set(BACKEND_TARGET_STORE.id, BACKEND_TARGET_STORE);

        for (const store of MANUAL_SAMPLE_STORES) {
          mergedStores.set(store.id, store);
        }

        setStores(
          Array.from(mergedStores.values()).sort((left, right) =>
            left.name.localeCompare(right.name),
          ),
        );
        if (failedQueryCount > 0) {
          console.warn(`Mapbox category search failed for ${failedQueryCount} Ottawa queries.`);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setStores([]);
        setStoresError(
          error instanceof Error
            ? "Unable to load Ottawa grocery stores right now."
            : "Unable to load Ottawa grocery stores right now.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsStoresLoading(false);
        }
      }
    }

    loadOttawaGroceryStores();

    return () => controller.abort();
  }, []);

  function queueCallForSelectedStore() {
    if (!selectedStore) {
      return;
    }

    const scheduledTime = new Date(Date.now() + 30 * 60 * 1000);
    const formattedTime = new Intl.DateTimeFormat("en-CA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(scheduledTime);

    setQueuedCalls((current) => ({
      ...current,
      [selectedStore.id]: formattedTime,
    }));
    setActiveTab("planned");
  }

  function queueCallsForRedStores() {
    if (unqueuedRedStores.length === 0) {
      return;
    }

    setQueuedCalls((current) => {
      const nextQueuedCalls = { ...current };

      unqueuedRedStores.forEach((store, index) => {
        const scheduledTime = new Date(
          Date.now() + (30 + index * 15) * 60 * 1000,
        );
        const formattedTime = new Intl.DateTimeFormat("en-CA", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(scheduledTime);

        nextQueuedCalls[store.id] = formattedTime;
      });

      return nextQueuedCalls;
    });
  }

  function openStoreWindow(store: StoreRecord, tab: DashboardTab = "logs") {
    setSelectedStoreId(store.id);
    setActiveTab(tab);
    setIsSearchOpen(false);
    setIsStoreWorkspaceOpen(true);
  }

  function handleSelectStore(store: StoreRecord) {
    openStoreWindow(store, "logs");
  }

  return (
    <div className="h-screen overflow-hidden text-[color:var(--foreground)]">
      <main className="mx-auto flex h-full w-full max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6">
        <section className="rounded-[30px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_24px_80px_-46px_rgba(20,20,20,0.16)] backdrop-blur">
          <div className="flex h-full flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
                AutoReach Dashboard
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <a
                href="https://www.foodforthecapital.ca/?utm_source=ig&utm_medium=social&utm_content=link_in_bio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--accent)] px-4 py-2.5 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-[color:var(--accent-strong)]"
              >
                Visit Food for the Capital
              </a>

              <div className="grid grid-cols-1">
                <MetricCard
                  label="Call Statistics"
                  onClick={() => setIsStatsOpen(true)}
                  tone="accent"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="flex min-h-0 flex-col gap-4">
            <div className="rounded-[30px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_24px_80px_-46px_rgba(20,20,20,0.16)] backdrop-blur sm:p-6">
              <div className="max-w-xs">
                <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
                  Store controls
                </h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted-strong)]">
                  Search Ottawa grocery stores and open the full recent-history view from one place.
                </p>
              </div>

              <div className="relative mt-5">
                <label htmlFor="store-search" className="sr-only">
                  Search stores
                </label>
                <input
                  id="store-search"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Search Ottawa grocery stores"
                  className="w-full rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--border-strong)] focus:bg-[#fffdf8]"
                />

                {isSearchOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-3 shadow-[0_35px_75px_-38px_rgba(20,20,20,0.18)]">
                    <div className="flex items-center justify-between gap-3 px-1 pb-2">
                      <p className="text-sm text-[color:var(--muted-strong)]">
                        {!MAPBOX_ACCESS_TOKEN
                          ? "Mapbox token needed"
                          : isStoresLoading
                            ? "Loading Ottawa grocery stores..."
                            : storesError
                              ? "Map data unavailable"
                              : normalizedQuery
                                ? `${filteredStores.length} matching stores`
                                : `${stores.length} Ottawa grocery stores`}
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsSearchOpen(false)}
                        className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--foreground)]"
                      >
                        Close
                      </button>
                    </div>

                    <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                      {displayedStores.length > 0 ? (
                        displayedStores.map((store) => (
                          <button
                            key={store.id}
                            type="button"
                            onClick={() => handleSelectStore(store)}
                            className="flex w-full items-start justify-between gap-3 rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-left transition hover:border-[color:var(--border-strong)] hover:bg-[#fff3df]"
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-[color:var(--foreground)]">
                                {store.name}
                              </span>
                              {store.integrationMode === "backend-target" ? (
                                <span className="mt-1 inline-flex rounded-full border border-[color:var(--border-strong)] bg-[#fff3df] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground)]">
                                  Backend target
                                </span>
                              ) : null}
                            <span className="mt-1 block truncate text-xs text-[color:var(--muted-strong)]">
                              {store.address}
                            </span>
                            {store.phoneNumber ? (
                              <span className="mt-1 block text-xs text-[color:var(--muted)]">
                                {store.phoneNumber}
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 shrink-0 text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                            Select
                          </span>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-[18px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-8 text-center text-sm text-[color:var(--muted)]">
                          {!MAPBOX_ACCESS_TOKEN
                            ? "Add your Mapbox token in frontend/.env to load Ottawa grocery stores."
                            : isStoresLoading
                              ? "Loading Ottawa grocery stores..."
                              : storesError
                                ? storesError
                                : normalizedQuery
                                  ? "No Ottawa grocery stores match that search."
                                  : "No Ottawa grocery stores are available right now."}
                        </div>
                      )}
                    </div>
                    {filteredStores.length > displayedStores.length ? (
                      <p className="px-1 pt-3 text-xs text-[color:var(--muted)]">
                        Showing {displayedStores.length} of {filteredStores.length} stores. Keep typing to narrow the list.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 border-t border-[color:var(--border)] pt-5">
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className="w-full rounded-[24px] border border-[color:var(--border-strong)] bg-[color:var(--surface-soft)] px-4 py-4 text-left transition hover:bg-[#fff3df]"
                >
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                    All stores
                  </span>
                  <span className="mt-2 block text-lg font-semibold text-[color:var(--foreground)]">
                    Recent call history
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-[color:var(--muted-strong)]">
                    Open the full recent-history view and use the sliders to move further back in time.
                  </span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={queueCallsForRedStores}
              disabled={unqueuedRedStores.length === 0}
              className="rounded-[28px] border border-[color:var(--border-strong)] bg-[color:var(--surface)] p-5 text-left shadow-[0_24px_80px_-46px_rgba(20,20,20,0.16)] transition hover:bg-[#fff3df] disabled:cursor-not-allowed disabled:border-[color:var(--border)] disabled:bg-[color:var(--surface-soft)] disabled:opacity-70 sm:p-6"
            >
              <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Priority follow-up
              </span>
              <span className="mt-2 block text-lg font-semibold text-[color:var(--foreground)]">
                Queue follow-up calls
              </span>
              <span className="mt-2 block text-sm leading-6 text-[color:var(--muted-strong)]">
                {unqueuedRedStores.length > 0
                  ? `${unqueuedRedStores.length} priority locations will be added to the follow-up queue.`
                  : redStores.length > 0
                    ? "All priority locations are already queued."
                    : "No priority locations are currently available for follow-up."}
              </span>
            </button>

          </div>

          <section className="min-h-0 rounded-[32px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_24px_80px_-46px_rgba(20,20,20,0.16)] backdrop-blur sm:p-6">
            <div className="flex h-full min-h-0 flex-col">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-semibold text-[color:var(--foreground)] sm:text-[2rem]">
                  Visual map
                </h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted-strong)]">
                  Click the map to expand it. It shows Ottawa grocery stores from Mapbox Search. Click a store marker to open its metrics and last-call status.
                </p>
              </div>

              <OttawaGroceryMap
                accessToken={MAPBOX_ACCESS_TOKEN}
                stores={stores}
                selectedStoreId={selectedStoreId}
                onStoreSelect={(store) => openStoreWindow(store, "logs")}
                onBackgroundClick={() => setIsMapOpen(true)}
                className="mt-4 min-h-[320px] flex-1 rounded-[30px] border border-[color:var(--border-strong)] shadow-[0_24px_80px_-46px_rgba(20,20,20,0.16)] sm:min-h-[350px]"
                loading={isStoresLoading}
                error={storesError}
              />

            </div>
          </section>
        </section>
      </main>

      {isStoreWorkspaceOpen ? (
        <div className="fixed inset-0 z-30 flex bg-[rgba(24,21,18,0.58)] p-4 sm:p-6">
          <div className="mx-auto flex h-full w-full max-w-[1320px] flex-col overflow-y-auto rounded-[32px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.28)] sm:p-6">
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="min-w-0 sm:flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Store details
                </p>
                {selectedStoreIsBackendTarget ? (
                  <div className="mt-3 inline-flex rounded-full border border-[color:var(--border-strong)] bg-[#fff3df] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground)]">
                    Backend integration target
                  </div>
                ) : null}
                <h2 className="mt-2 break-words text-2xl font-semibold text-[color:var(--foreground)] sm:text-3xl">
                  {selectedStore ? selectedStore.name : "Selected store"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted-strong)]">
                  {selectedStoreIsBackendTarget
                    ? "This is the only store designated for backend integration. Review its call history, transcripts, map location, missed calls, and pending call timing here."
                    : "This store remains a frontend sample location. Review its call history, transcripts, map location, missed calls, and pending call timing here."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStoreWorkspaceOpen(false)}
                className="shrink-0 self-start rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--border-strong)] hover:bg-[#fff3df]"
              >
                Close workspace
              </button>
            </div>

            <div className="mt-5 grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="flex min-h-0 flex-col rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-4">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        activeTab === tab.id
                          ? "bg-[color:var(--panel-dark)] text-[#fff7ea]"
                          : "border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--muted-strong)] hover:border-[color:var(--border-strong)] hover:bg-[#fff3df]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="mt-5 flex min-h-[280px] flex-1 flex-col rounded-[24px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    {activeTabMeta.label}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                    {activePanelTitle}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted-strong)]">
                    {activePanelBody}
                  </p>
                </div>
              </div>

              <div className="grid content-start gap-4 xl:self-start">
                <div className="rounded-[26px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Location on map
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                    {selectedStore?.address ?? "Not available yet"}
                  </p>
                  {selectedStore?.phoneNumber ? (
                    <div className="mt-4 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                        Phone number
                      </p>
                      <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                        {selectedStore.phoneNumber}
                      </p>
                    </div>
                  ) : null}
                  <div className="mt-4 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Last called
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                      {selectedStore?.lastCalledLabel ?? "Not available yet"}
                    </p>
                  </div>
                  <div className="mt-4 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Integration status
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                      {selectedStoreIsBackendTarget
                        ? "Connected as the dedicated backend integration target."
                        : "Frontend-only sample store."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMapOpen(true)}
                    className="mt-4 rounded-full border border-[color:var(--border-strong)] bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-[color:var(--accent-strong)]"
                  >
                    Open map view
                  </button>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[26px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      Missed calls
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                      {selectedStore?.missedCalls ?? 0}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                      Total missed calls for this location.
                    </p>
                  </div>
                </div>

                <div className="rounded-[26px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Pending calls
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                    {pendingCallsTotal}
                  </p>
                  <button
                    type="button"
                    onClick={queueCallForSelectedStore}
                    className="mt-4 rounded-full border border-[color:var(--border-strong)] bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-[color:var(--accent-strong)]"
                  >
                    Queue a call
                  </button>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                        Next pending call
                      </p>
                      <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                        {queuedCallLabel ?? selectedStore?.nextPendingCallLabel ?? "Not scheduled"}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                        Pending call window
                      </p>
                      <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                        {queuedCallLabel
                          ? "Within the next hour"
                          : selectedStore?.pendingCallWindowLabel ?? "No pending calls scheduled"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isMapOpen ? (
        <div className="fixed inset-0 z-40 flex bg-[rgba(24,21,18,0.7)] p-4 sm:p-6">
          <div className="flex h-full w-full flex-col rounded-[32px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.35)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Ottawa grocery map
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)] sm:text-3xl">
                  Full-screen store map
                </h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted-strong)]">
                  Click any grocery-store marker to open that store&apos;s details, call history, transcripts, and queue controls.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMapOpen(false)}
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--border-strong)] hover:bg-[#fff3df]"
              >
                Close map
              </button>
            </div>

            <OttawaGroceryMap
              accessToken={MAPBOX_ACCESS_TOKEN}
              stores={stores}
              selectedStoreId={selectedStoreId}
              onStoreSelect={(store) => {
                setIsMapOpen(false);
                openStoreWindow(store, "logs");
              }}
              className="mt-5 min-h-0 flex-1 rounded-[28px] border border-[color:var(--border)]"
              loading={isStoresLoading}
              error={storesError}
              isFullscreen
            />
          </div>
        </div>
      ) : null}

      {isHistoryOpen ? (
        <div className="fixed inset-0 z-30 flex bg-[rgba(24,21,18,0.58)] p-4 sm:p-6">
          <div className="flex h-full w-full flex-col rounded-[32px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.28)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  All stores
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)] sm:text-3xl">
                  Recent call history
                </h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted-strong)]">
                  Frontend sample calls across all stores. Transcript contents still stay empty for now.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--border-strong)] hover:bg-[#fff3df]"
              >
                Close history
              </button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[26px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Look-back window
                </p>
                <p className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
                  {lookbackDays} days
                </p>
                <input
                  type="range"
                  min="7"
                  max="180"
                  step="1"
                  value={lookbackDays}
                  onChange={(event) => setLookbackDays(Number(event.target.value))}
                  className="mt-4 w-full accent-[color:var(--accent)]"
                />
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                  Slide to widen or narrow the recent-history window.
                </p>
              </div>

              <div className="rounded-[26px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Timeline offset
                </p>
                <p className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
                  {historyOffsetDays} days back
                </p>
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="1"
                  value={historyOffsetDays}
                  onChange={(event) =>
                    setHistoryOffsetDays(Number(event.target.value))
                  }
                  className="mt-4 w-full accent-[color:var(--accent)]"
                />
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                  Slide further back in time to inspect older call windows.
                </p>
              </div>
            </div>

            <div className="mt-5 grid min-h-0 flex-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
              <div className="grid content-start gap-4">
                <div className="rounded-[26px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Calls in range
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                    {visibleRecentCallRecords.length}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                    Calls shown for the current slider window.
                  </p>
                </div>

                <div className="rounded-[26px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Stores in range
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                    {storesInHistoryWindow}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                    Unique stores represented in this time window.
                  </p>
                </div>

                <div className="rounded-[26px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Missed in range
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                    {missedCallsInHistoryWindow}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                    Calls that were not answered in this view.
                  </p>
                </div>
              </div>

              <div className="min-h-0 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4 border-b border-[color:var(--border)] pb-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      Recent calls
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted-strong)]">
                      Showing the latest calls inside the selected window.
                    </p>
                  </div>
                  <div className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    0 transcripts
                  </div>
                </div>

                <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
                  {visibleRecentCallRecords.length > 0 ? (
                    visibleRecentCallRecords.map((record) => (
                      <div
                        key={record.id}
                        className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-[color:var(--foreground)]">
                              {record.storeName}
                            </p>
                            <p className="mt-1 text-sm text-[color:var(--muted-strong)]">
                              {record.storeAddress}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                              {record.outcome}
                            </span>
                            <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                              Transcript empty
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                              Call time
                            </p>
                            <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                              {record.occurredAtLabel}
                            </p>
                          </div>
                          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                              Relative age
                            </p>
                            <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                              {record.relativeAgeLabel}
                            </p>
                          </div>
                          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                              Duration
                            </p>
                            <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                              {record.durationLabel}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-full min-h-[220px] items-center justify-center rounded-[22px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] px-6 text-center">
                      <div className="max-w-lg">
                        <p className="text-lg font-semibold text-[color:var(--foreground)]">
                          No calls in this time window
                        </p>
                        <p className="mt-3 text-sm leading-7 text-[color:var(--muted-strong)]">
                          Try widening the look-back window or reducing the timeline offset to reveal more sample calls.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isStatsOpen ? (
        <div className="fixed inset-0 z-30 flex bg-[rgba(24,21,18,0.58)] p-4 sm:p-6">
          <div className="flex h-full w-full flex-col rounded-[32px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.28)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Dashboard stats
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)] sm:text-3xl">
                  Outreach statistics
                </h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted-strong)]">
                  Frontend sample totals based on the current mock call activity across Ottawa stores.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStatsOpen(false)}
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--border-strong)] hover:bg-[#fff3df]"
              >
                Close stats
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[26px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Calls made
                </p>
                <p className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                  {totalCallsMade}
                </p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                  Total completed and attempted calls across the dashboard.
                </p>
              </div>

              <div className="rounded-[26px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Stores outreached
                </p>
                <p className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                  {stores.length}
                </p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                  Unique stores touched by outreach activity.
                </p>
              </div>

              <div className="rounded-[26px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Average call time
                </p>
                <p className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                  {averageCallTimeLabel}
                </p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                  Average duration across connected call records.
                </p>
              </div>

              <div className="rounded-[26px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Answered calls
                </p>
                <p className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                  {answeredCalls}
                </p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                  Calls that connected successfully.
                </p>
              </div>

              <div className="rounded-[26px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Transcripts available
                </p>
                <p className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                  0
                </p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                  Calls with transcript records attached.
                </p>
              </div>

              <div className="rounded-[26px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Planned follow-ups
                </p>
                <p className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                  {plannedFollowUpsCount}
                </p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                  Next-step items created from call outcomes.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    Recent window
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                    {visibleRecentCallRecords.length} calls shown
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted-strong)]">
                    Matches the current recent-history slider range.
                  </p>
                </div>

                <div className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    Missed call share
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                    {totalCallsMade > 0
                      ? `${Math.round(
                          (totalMissedCalls / totalCallsMade) * 100,
                        )}%`
                      : "0%"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted-strong)]">
                    Percentage of sample calls that were not answered.
                  </p>
                </div>

                <div className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    Transcript status
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                    Intentionally empty
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted-strong)]">
                    Sample call totals are populated, but transcript contents remain blank.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

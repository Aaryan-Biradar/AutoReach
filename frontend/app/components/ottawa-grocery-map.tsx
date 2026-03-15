"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useEffectEvent, useRef } from "react";
import type { StoreRecord } from "../dashboard-types";

const OTTAWA_CENTER: [number, number] = [-75.6972, 45.4215];
const SOURCE_ID = "ottawa-grocery-stores";
const TERRAIN_SOURCE_ID = "ottawa-terrain-dem";
const BUILDINGS_LAYER_ID = "ottawa-3d-buildings";
const POINTS_LAYER_ID = "ottawa-grocery-points";
const SELECTED_LAYER_ID = "ottawa-grocery-selected";
const LABELS_LAYER_ID = "ottawa-grocery-labels";
const FRESHNESS_COLOR_EXPRESSION: import("mapbox-gl").ExpressionSpecification = [
  "match",
  ["get", "callFreshness"],
  "recent",
  "#4aa768",
  "aging",
  "#e0b03d",
  "#d55c57",
];

type OttawaGroceryMapProps = {
  accessToken?: string;
  stores: StoreRecord[];
  selectedStoreId: string | null;
  onStoreSelect: (store: StoreRecord) => void;
  onBackgroundClick?: () => void;
  className: string;
  loading?: boolean;
  error?: string | null;
  isFullscreen?: boolean;
};

function buildPopupContent(store: StoreRecord) {
  const root = document.createElement("div");
  root.className = "space-y-1";

  const title = document.createElement("p");
  title.className = "text-sm font-semibold text-[#1f1c19]";
  title.textContent = store.name;

  const address = document.createElement("p");
  address.className = "text-xs text-[#5d534b]";
  address.textContent = store.address || "Ottawa, Ontario";

  const integration = document.createElement("p");
  integration.className = "text-xs text-[#5d534b]";
  integration.textContent =
    store.integrationMode === "backend-target"
      ? "Backend integration target"
      : "Frontend sample store";

  const phoneNumber = document.createElement("p");
  phoneNumber.className = "text-xs text-[#5d534b]";
  phoneNumber.textContent = `Phone: ${store.phoneNumber}`;

  const lastCalled = document.createElement("p");
  lastCalled.className = "text-xs text-[#5d534b]";
  lastCalled.textContent = `Last called: ${store.lastCalledLabel}`;

  if (store.phoneNumber) {
    root.append(title, address, integration, phoneNumber, lastCalled);
    return root;
  }

  root.append(title, address, integration, lastCalled);
  return root;
}

function buildStoreFeatureCollection(stores: StoreRecord[]) {
  return {
    type: "FeatureCollection" as const,
    features: (Array.isArray(stores) ? stores : []).map((store) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [store.longitude, store.latitude],
      },
      properties: {
        storeId: store.id,
        name: store.name,
        callFreshness: store.callFreshness,
        lastCalledLabel: store.lastCalledLabel,
      },
    })),
  };
}

function syncMapData(
  map: import("mapbox-gl").Map,
  stores: StoreRecord[],
  selectedStoreId: string | null,
) {
  const source = map.getSource(SOURCE_ID) as import("mapbox-gl").GeoJSONSource | undefined;
  if (source) {
    source.setData(buildStoreFeatureCollection(stores));
  }

  if (map.getLayer(SELECTED_LAYER_ID)) {
    map.setFilter(SELECTED_LAYER_ID, [
      "==",
      ["get", "storeId"],
      selectedStoreId ?? "",
    ]);
  }
}

export function OttawaGroceryMap({
  accessToken,
  stores,
  selectedStoreId,
  onStoreSelect,
  onBackgroundClick,
  className,
  loading = false,
  error,
  isFullscreen = false,
}: OttawaGroceryMapProps) {
  const initialZoom = isFullscreen ? 14.7 : 13.8;
  const defaultPitch = isFullscreen ? 62 : 56;
  const defaultBearing = isFullscreen ? -20 : -16;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const popupRef = useRef<import("mapbox-gl").Popup | null>(null);
  const storesRef = useRef(stores);
  const selectedStoreIdRef = useRef(selectedStoreId);

  useEffect(() => {
    storesRef.current = stores;
  }, [stores]);

  useEffect(() => {
    selectedStoreIdRef.current = selectedStoreId;
  }, [selectedStoreId]);

  const handleStoreSelect = useEffectEvent((store: StoreRecord) => {
    onStoreSelect(store);
  });

  const handleBackgroundClick = useEffectEvent(() => {
    onBackgroundClick?.();
  });

  const openStoreFromFeature = useEffectEvent((storeId: string | undefined) => {
    const store = storesRef.current.find((entry) => entry.id === storeId);

    if (store) {
      handleStoreSelect(store);
    }
  });

  const showPopupFromFeature = useEffectEvent((storeId: string | undefined) => {
    const map = mapRef.current;
    const popup = popupRef.current;
    const store = storesRef.current.find((entry) => entry.id === storeId);

    if (!map || !popup || !store) {
      return;
    }

    popup
      .setLngLat([store.longitude, store.latitude])
      .setDOMContent(buildPopupContent(store))
      .addTo(map);
  });

  useEffect(() => {
    const token = typeof accessToken === "string" ? accessToken.trim() : "";
    if (!token || !containerRef.current || mapRef.current) {
      return;
    }

    let isDisposed = false;

    async function initializeMap() {
      const mapboxgl = (await import("mapbox-gl")).default;

      if (isDisposed || !containerRef.current) {
        return;
      }

      mapboxgl.accessToken = token;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: OTTAWA_CENTER,
        zoom: initialZoom,
        pitch: defaultPitch,
        bearing: defaultBearing,
        minZoom: 9.4,
        maxPitch: 75,
        antialias: true,
      });

      mapRef.current = map;
      popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 14,
      });

      map.addControl(
        new mapboxgl.NavigationControl({
          showCompass: true,
          visualizePitch: false,
        }),
        "top-right",
      );

      map.on("load", () => {
        if (isDisposed) {
          return;
        }

        map.addSource(TERRAIN_SOURCE_ID, {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });

        map.setTerrain({
          source: TERRAIN_SOURCE_ID,
          exaggeration: 1.2,
        });

        const labelLayerId = map
          .getStyle()
          .layers?.find(
            (layer) =>
              layer.type === "symbol" &&
              typeof layer.layout?.["text-field"] !== "undefined",
          )?.id;

        map.addLayer(
          {
            id: BUILDINGS_LAYER_ID,
            source: "composite",
            "source-layer": "building",
            filter: ["==", ["get", "extrude"], "true"],
            type: "fill-extrusion",
            minzoom: 14,
            paint: {
              "fill-extrusion-color": "#d8cfc1",
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                14,
                0,
                14.6,
                ["get", "height"],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                14,
                0,
                14.6,
                ["get", "min_height"],
              ],
              "fill-extrusion-opacity": 0.42,
            },
          },
          labelLayerId,
        );

        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: buildStoreFeatureCollection(storesRef.current),
        });

        map.addLayer({
          id: POINTS_LAYER_ID,
          type: "circle",
          source: SOURCE_ID,
          paint: {
            "circle-radius": isFullscreen ? 8 : 7,
            "circle-color": FRESHNESS_COLOR_EXPRESSION,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fffdf9",
            "circle-opacity": 0.95,
          },
        });

        map.addLayer({
          id: SELECTED_LAYER_ID,
          type: "circle",
          source: SOURCE_ID,
          filter: ["==", ["get", "storeId"], selectedStoreIdRef.current ?? ""],
          paint: {
            "circle-radius": isFullscreen ? 13 : 11,
            "circle-color": FRESHNESS_COLOR_EXPRESSION,
            "circle-stroke-width": 3,
            "circle-stroke-color": "#1f1c19",
          },
        });

        map.addLayer({
          id: LABELS_LAYER_ID,
          type: "symbol",
          source: SOURCE_ID,
          layout: {
            "text-field": ["get", "lastCalledLabel"],
            "text-size": isFullscreen ? 11 : 10,
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-offset": [1.2, 0],
            "text-anchor": "left",
            "text-pitch-alignment": "viewport",
            "text-rotation-alignment": "viewport",
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          },
          paint: {
            "text-color": "#5d534b",
            "text-halo-color": "#fffdf9",
            "text-halo-width": 1.2,
            "text-halo-blur": 0.2,
          },
        });

        [POINTS_LAYER_ID, SELECTED_LAYER_ID, LABELS_LAYER_ID].forEach((layerId) => {
          map.on("mouseenter", layerId, (event) => {
            map.getCanvas().style.cursor = "pointer";
            const feature = event.features?.[0];
            const storeId = feature?.properties?.storeId as string | undefined;
            showPopupFromFeature(storeId);
          });

          map.on("mouseleave", layerId, () => {
            map.getCanvas().style.cursor = "";
            popupRef.current?.remove();
          });

          map.on("click", layerId, (event) => {
            const feature = event.features?.[0];
            const storeId = feature?.properties?.storeId as string | undefined;
            openStoreFromFeature(storeId);
          });
        });

        map.on("click", (event) => {
          const features = map.queryRenderedFeatures(event.point, {
            layers: [POINTS_LAYER_ID, LABELS_LAYER_ID],
          });

          if (features.length === 0) {
            handleBackgroundClick();
          }
        });
      });
    }

    initializeMap();

    return () => {
      isDisposed = true;
      popupRef.current?.remove();
      popupRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [
    typeof accessToken === "string" ? accessToken.trim() : "",
    defaultBearing,
    defaultPitch,
    initialZoom,
    isFullscreen,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    syncMapData(map, stores, selectedStoreId);

    if (!selectedStoreId) {
      return;
    }

    const selectedStore = stores.find((store) => store.id === selectedStoreId);
    if (!selectedStore) {
      return;
    }

    map.flyTo({
      center: [selectedStore.longitude, selectedStore.latitude],
      zoom: isFullscreen ? 15.2 : 14.6,
      pitch: defaultPitch + 8,
      bearing: defaultBearing,
      essential: true,
      duration: 900,
    });
  }, [defaultBearing, defaultPitch, isFullscreen, selectedStoreId, stores]);

  const token = typeof accessToken === "string" ? accessToken.trim() : "";
  if (!token) {
    return (
      <div
        className={`${className} flex items-center justify-center rounded-[30px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-soft)] px-6 text-center`}
      >
        <div className="max-w-lg">
          <p className="text-lg font-semibold text-[color:var(--foreground)]">
            Add Your Mapbox Token To Load Ottawa Grocery Stores
          </p>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
            Set <code>NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> in
            {" "}
            <code>frontend/.env</code> to enable the live Ottawa grocery map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      <div
        ref={containerRef}
        className="h-full min-h-[280px] w-full"
        aria-hidden
      />

      {loading ? (
        <div className="pointer-events-none absolute inset-x-4 top-4 rounded-full border border-[color:var(--border)] bg-[rgba(255,255,255,0.92)] px-4 py-2 text-sm text-[color:var(--muted-strong)] shadow-[0_18px_45px_-32px_rgba(20,20,20,0.14)]">
          Loading Ottawa grocery stores...
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-x-4 bottom-4 rounded-[22px] border border-[color:var(--border)] bg-[rgba(255,255,255,0.94)] px-4 py-3 text-sm leading-6 text-[color:var(--muted-strong)] shadow-[0_18px_45px_-32px_rgba(20,20,20,0.14)]">
          {error}
        </div>
      ) : null}
    </div>
  );
}

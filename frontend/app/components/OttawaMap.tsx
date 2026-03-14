"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Call } from "../lib/api";

const OTTAWA_CENTER: [number, number] = [45.4215, -75.6972];
const ZOOM = 12;

const GROCERY_STORES = [
  { name: "Loblaws Merivale", lat: 45.3647, lng: -75.7427 },
  { name: "Loblaws St Laurent", lat: 45.4285, lng: -75.6214 },
  { name: "No Frills Carling", lat: 45.3926, lng: -75.7559 },
  { name: "Metro Baseline", lat: 45.3497, lng: -75.762 },
  { name: "Food Basics Cyrville", lat: 45.4142, lng: -75.5967 },
];

const FOOD_BANKS = [
  { name: "Food for the Capital", lat: 45.3583, lng: -75.7448 },
  { name: "Parkdale Food Centre", lat: 45.4033, lng: -75.7283 },
];

function makeIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

const blueIcon = makeIcon("#3b82f6");
const greenIcon = makeIcon("#22c55e");

interface OttawaMapProps {
  calls?: Call[];
}

export default function OttawaMap({ calls = [] }: OttawaMapProps) {
  const agreedStores = new Set(
    calls.filter((c) => c.outcome === "agreed").map((c) => c.store_name)
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-[520px]">
      <MapContainer
        center={OTTAWA_CENTER}
        zoom={ZOOM}
        className="h-full w-full rounded-lg"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {GROCERY_STORES.map((store) => (
          <Marker
            key={store.name}
            position={[store.lat, store.lng]}
            icon={agreedStores.has(store.name) ? greenIcon : blueIcon}
          >
            <Popup>
              <strong>{store.name}</strong>
              <br />
              {agreedStores.has(store.name) ? (
                <span className="text-green-700 font-medium">Agreed</span>
              ) : (
                <span className="text-blue-700">Pending outreach</span>
              )}
            </Popup>
          </Marker>
        ))}

        {FOOD_BANKS.map((bank) => (
          <Marker
            key={bank.name}
            position={[bank.lat, bank.lng]}
            icon={greenIcon}
          >
            <Popup>
              <strong>{bank.name}</strong>
              <br />
              <span className="text-green-700">Food Bank</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

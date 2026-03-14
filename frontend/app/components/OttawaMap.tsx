// Ottawa map — owned by Person 3.
// Leaflet map centered on Ottawa (45.4215, -75.6972) showing grocery store
// pins and food bank pins. MUST be dynamically imported in page.tsx with
// { ssr: false } because Leaflet requires the browser window object.

export default function OttawaMap() {
  // Leaflet + react-leaflet will be integrated here.
  // Store markers: Loblaws Merivale, Loblaws St Laurent, No Frills Carling,
  //   Metro Baseline, Food Basics Cyrville.
  // Food bank markers: Food for the Capital (1400 Clyde Ave),
  //   Parkdale Food Centre (30 Rosemount Ave).

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-[520px] flex items-center justify-center">
      <div className="border-2 border-dashed border-gray-200 rounded-lg w-full h-full flex flex-col items-center justify-center gap-3 text-gray-400">
        <svg
          className="h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 6.75V15m6-6v8.25m.503-11.307l3.841-1.6a.5.5 0 01.656.472V17.35a.5.5 0 01-.329.47l-4.17 1.52a.5.5 0 01-.344-.003L10.843 17.5a.5.5 0 00-.343-.002l-4.17 1.52a.5.5 0 01-.656-.472V6.81a.5.5 0 01.329-.47l3.841-1.6a.5.5 0 01.344.003L14.5 6.58a.5.5 0 00.503.003z"
          />
        </svg>
        <p className="text-sm font-medium">Ottawa Map — coming soon</p>
        <p className="text-xs">Leaflet + react-leaflet will be integrated here</p>
      </div>
    </div>
  );
}

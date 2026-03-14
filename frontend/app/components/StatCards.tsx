// Stat cards row — owned by Person 3.
// Renders the four summary metric cards at the top of the dashboard:
// Total Calls, Stores Agreed, Callbacks Pending, and Food Rescued.

import type { Stats } from "../lib/api";

export default function StatCards({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Total Calls", value: stats.total },
    { label: "Stores Agreed", value: stats.agreed },
    { label: "Callbacks Pending", value: stats.callback },
    { label: "Food Rescued", value: "~1,200 lbs" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <p className="text-sm text-gray-500">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

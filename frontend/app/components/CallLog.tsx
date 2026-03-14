// Live call log — owned by Person 3.
// Scrollable list of call cards sorted most-recent-first with color-coded
// outcome badges. Will auto-refresh via SWR once wired to the real API.

import type { Call } from "../lib/api";

const outcomeBadge: Record<
  Call["outcome"],
  { bg: string; text: string; label: string }
> = {
  agreed: { bg: "bg-green-100", text: "text-green-800", label: "Agreed" },
  rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
  callback: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Callback" },
  no_answer: { bg: "bg-gray-100", text: "text-gray-700", label: "No Answer" },
};

export default function CallLog({ calls }: { calls: Call[] }) {
  const sorted = [...calls].sort(
    (a, b) =>
      new Date(b.called_at).getTime() - new Date(a.called_at).getTime()
  );

  return (
    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
      {sorted.map((call) => {
        const badge = outcomeBadge[call.outcome];
        return (
          <div
            key={call.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">
                {call.store_name}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}
              >
                {badge.label}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
              <span>{call.phone_number}</span>
              <span>&middot;</span>
              <span>{new Date(call.called_at).toLocaleTimeString()}</span>
            </div>
            {call.notes && (
              <p className="mt-2 text-sm text-gray-500">{call.notes}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

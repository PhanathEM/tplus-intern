import { apiGet, apiPatch } from "../lib/apiClient";

// No dates -> today's normal view (latest entry per server). With a range,
// each server shows whatever was its most recent entry sometime within
// from..to (still listed, with blank usage fields, if it has nothing
// recorded in that window).
export function fetchServerUsage({ from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  return apiGet(`/api/server-usage${query ? `?${query}` : ""}`);
}

// Any logged-in user (not just admins) can update a server's usage
// numbers — unlike the rest of /api/server-usage, which stays admin-only.
// Keyed by equipment_id (not usage_id) — creates the usage row automatically
// if this server has never had one. cpu_core_total/memory_gb_total/
// hdd_gb_total ("Total Capacity") aren't touched here — those still need an
// admin via the Configure/Add flow.
export function updateServerUsageRow(equipmentId, payload) {
  return apiPatch(`/api/server-usage/equipment/${equipmentId}/usage`, payload);
}

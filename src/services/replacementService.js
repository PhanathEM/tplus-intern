import { apiGet } from "../lib/apiClient";

// Whole-device replacement (POST /api/replacements) and the old
// /api/replacements/replaceable device picker were intentionally removed
// backend-side — this history GET is the only surviving route under
// /api/replacements. The device picker now reads GET /api/equipment
// directly (see equipmentService.js), and submitting a replacement goes
// through partReplacementService.js instead.
export function fetchReplacements({ category, q, from, to } = {}) {
  const params = new URLSearchParams();
  if (category && category !== "All") params.set("category", category);
  if (q) params.set("q", q);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  return apiGet(`/api/replacements${query ? `?${query}` : ""}`);
}

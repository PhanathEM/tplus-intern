import { apiPost } from "../lib/apiClient";

export function submitPartReplacement(equipmentId, payload) {
  return apiPost(`/api/equipment/${equipmentId}/part-replacements`, payload);
}

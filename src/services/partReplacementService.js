import { apiPost, apiDelete } from "../lib/apiClient";

export function submitPartReplacement(equipmentId, payload) {
  return apiPost(`/api/equipment/${equipmentId}/part-replacements`, payload);
}

export function deletePartReplacement(equipmentId, replacementId) {
  return apiDelete(`/api/equipment/${equipmentId}/part-replacements/${replacementId}`);
}

import { apiGet, apiPost, apiDelete } from "../lib/apiClient";

export function fetchRecycleBin(entityType) {
  const query = entityType && entityType !== "All" ? `?entity_type=${encodeURIComponent(entityType)}` : "";
  return apiGet(`/api/recycle-bin${query}`);
}

export function fetchRecycleBinItem(id) {
  return apiGet(`/api/recycle-bin/${id}`);
}

export function restoreRecycleBinItem(id) {
  return apiPost(`/api/recycle-bin/${id}/restore`, {});
}

export function deleteRecycleBinItem(id) {
  return apiDelete(`/api/recycle-bin/${id}`);
}

export function purgeRecycleBin() {
  return apiDelete("/api/recycle-bin/purge-all?confirm=true");
}

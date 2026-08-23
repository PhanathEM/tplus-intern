import { apiGet, apiPost, apiDelete } from "../lib/apiClient";

// Same shelf list as Device Replacement's "fit a part" picker (working
// lines only, quantity above zero) — just under the part-borrow namespace.
export function fetchAvailablePartBorrowStock(partTypeId) {
  return apiGet(partTypeId ? `/api/part-borrow/available?part_type_id=${partTypeId}` : "/api/part-borrow/available");
}

export function fetchCurrentPartBorrows() {
  return apiGet("/api/part-borrow/current");
}

export function createPartBorrow(payload) {
  return apiPost("/api/part-borrow", payload);
}

export function returnPartBorrow(borrowId, payload) {
  return apiPost(`/api/part-borrow/${borrowId}/return`, payload);
}

// Admin-only — corrects a mistaken entry, restores quantity if still open.
export function deletePartBorrow(borrowId) {
  return apiDelete(`/api/part-borrow/${borrowId}`);
}

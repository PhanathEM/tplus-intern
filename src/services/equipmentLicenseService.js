import { apiGet, apiPost, apiDelete } from "../lib/apiClient";

const EQUIPMENT_LICENSE_API = "/api/equipment";

export function fetchEquipmentLicense(equipmentId) {
  return apiGet(`${EQUIPMENT_LICENSE_API}/${equipmentId}/license`);
}

export function assignEquipmentLicense(equipmentId, payload) {
  return apiPost(`${EQUIPMENT_LICENSE_API}/${equipmentId}/license`, payload);
}

export function unassignEquipmentLicense(equipmentId) {
  return apiDelete(`${EQUIPMENT_LICENSE_API}/${equipmentId}/license`);
}

import { apiGet, apiPost, apiDelete } from "../lib/apiClient";

const EQUIPMENT_LICENSE_API = "/api/equipment";

export function fetchEquipmentLicenseOptions() {
  return apiGet(`${EQUIPMENT_LICENSE_API}/licenses`);
}

export function fetchEquipmentLicenses(equipmentId) {
  return apiGet(`${EQUIPMENT_LICENSE_API}/${equipmentId}/licenses`);
}

export function assignEquipmentLicenses(equipmentId, licenseIds) {
  return apiPost(`${EQUIPMENT_LICENSE_API}/${equipmentId}/licenses`, { license_ids: licenseIds });
}

export function unassignEquipmentLicense(equipmentId, licenseId) {
  return apiDelete(`${EQUIPMENT_LICENSE_API}/${equipmentId}/licenses/${licenseId}`);
}

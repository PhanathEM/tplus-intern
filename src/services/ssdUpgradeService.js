import { apiGet } from "../lib/apiClient";

export function fetchSsdUpgrades() {
  return apiGet("/api/ssd-upgrades");
}

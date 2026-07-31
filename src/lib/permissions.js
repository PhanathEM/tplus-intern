export const ROLES = { ADMIN: "admin", VIEWER: "viewer" };

export function isAdmin(user) {
  return String(user?.role ?? "").toLowerCase() === ROLES.ADMIN;
}

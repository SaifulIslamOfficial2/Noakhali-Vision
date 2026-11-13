// Admin session helpers (token + user are kept in localStorage; the API re-checks everything on each request).
export function clearSession() {
  try { localStorage.removeItem("nv_token"); localStorage.removeItem("nv_user"); } catch { /* storage blocked */ }
}

/** Current admin/staff session. An expired token is removed right away so the login page shows instead of broken pages. */
export function readSession() {
  let token = "", user = null;
  try {
    token = localStorage.getItem("nv_token") || "";
    user = JSON.parse(localStorage.getItem("nv_user") || "null");
  } catch { /* ignore unreadable storage */ }
  if (!token) return { token: "", user: null };
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(part + "=".repeat((4 - (part.length % 4)) % 4)));
    if (payload.exp && payload.exp * 1000 < Date.now()) { clearSession(); return { token: "", user: null }; }
  } catch { /* unreadable token: the API will decide */ }
  return { token, user };
}

export const isStaffUser = (user) => user?.role === "staff";
/** The main admin can do everything; staff only what their permissions allow. */
export const hasPermission = (user, permission) => !isStaffUser(user) || (Array.isArray(user?.permissions) && user.permissions.includes(permission));

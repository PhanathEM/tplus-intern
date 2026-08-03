import { useEffect } from "react";
import {
  FiAlertTriangle as AlertTriangle,
  FiRefreshCw as RefreshCw,
  FiUsers as Users,
  FiX as X,
} from "react-icons/fi";
import { EmptyState, FormField, formInputClass } from "../../components/SharedControls";
import { userPermissionSections } from "../../dashboard.config";
import {
  ALL_PERMISSION_VALUES,
  getPermissionSummary,
  normalizeUserPermissions,
} from "../../../../lib/permissions";

export function UsersView({
  users,
  pendingCount,
  isLoading,
  error,
  onRetry,
  onApprove,
  onEditPermissions,
  onResetPassword,
}) {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">User accounts</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500">
                {users.length} account{users.length === 1 ? "" : "s"}
                {pendingCount > 0 && ` · ${pendingCount} pending approval`}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onRetry}
            disabled={isLoading}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {pendingCount > 0 && !isLoading && !error && (
          <div className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-[13px] font-medium text-amber-800">
            {pendingCount} account{pendingCount === 1 ? "" : "s"} waiting for approval.
          </div>
        )}

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500">Loading user accounts...</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700">Couldn&apos;t load user accounts</p>
            <p className="text-xs text-slate-500">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="No accounts found" description="Registered accounts will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[13px]">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Username</th>
                  <th className="px-5 py-3 font-semibold">Full Name</th>
                  <th className="px-5 py-3 font-semibold">Permissions</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => (
                  <tr key={user.user_id} className="transition hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-950">
                      {user.username}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{user.full_name || "—"}</td>
                    <td className="min-w-64 px-5 py-3.5 text-slate-600">
                      <span className="inline-flex max-w-72 items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        <span className="truncate">{getPermissionSummary(user)}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                          }`}
                      >
                        {user.is_active ? "Active" : "Pending"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!user.is_active && (
                          <button
                            type="button"
                            onClick={() => onApprove(user)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 outline-none transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEditPermissions(user)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          Permissions
                        </button>
                        <button
                          type="button"
                          onClick={() => onResetPassword(user)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function UserPermissionsModal({ isOpen, user, values, onChange, onSubmit, onClose, isSubmitting, error }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen || !user) return null;

  const selectedPermissions = new Set(normalizeUserPermissions({ permissions: values.permissions }));
  const allPermissionsSelected = ALL_PERMISSION_VALUES.every((permission) =>
    selectedPermissions.has(permission)
  );

  function updatePermissions(nextPermissions) {
    onChange("permissions", nextPermissions);
  }

  function handleToggleAll(checked) {
    updatePermissions(checked ? ALL_PERMISSION_VALUES : []);
  }

  function handleTogglePermission(permission, checked) {
    const nextPermissions = new Set(selectedPermissions);
    if (checked) {
      nextPermissions.add(permission);
    } else {
      nextPermissions.delete(permission);
    }
    updatePermissions([...nextPermissions]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Edit account</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">{user.username}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                {error}
              </div>
            )}
            <div className="grid gap-4">
              <FormField label="Full Name" htmlFor="user-full_name">
                <input
                  id="user-full_name"
                  type="text"
                  autoComplete="off"
                  value={values.full_name}
                  onChange={(e) => onChange("full_name", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-600">Permissions</p>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={allPermissionsSelected}
                      onChange={(event) => handleToggleAll(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-orange-500 accent-orange-500 focus:ring-orange-400"
                      disabled={isSubmitting}
                    />
                    All permissions
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {userPermissionSections.map((section) => (
                    <div key={section.label} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {section.label}
                      </p>
                      <div className="grid gap-2">
                        {section.permissions.map((permission) => (
                          <label
                            key={permission.value}
                            className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-[13px] font-medium text-slate-700 ring-1 ring-slate-100 transition hover:bg-orange-50 hover:text-slate-950"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.has(permission.value)}
                              onChange={(event) =>
                                handleTogglePermission(permission.value, event.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-orange-500 accent-orange-500 focus:ring-orange-400"
                              disabled={isSubmitting}
                            />
                            <span>{permission.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ResetPasswordModal({
  isOpen,
  user,
  password,
  confirmPassword,
  onChangePassword,
  onChangeConfirmPassword,
  onSubmit,
  onClose,
  isSubmitting,
  error,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950">Reset password</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">{user.username}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                {error}
              </div>
            )}
            <div className="grid gap-4">
              <FormField label="New Password *" htmlFor="reset-password">
                <input
                  id="reset-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => onChangePassword(e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
              <FormField label="Confirm Password *" htmlFor="reset-confirm-password">
                <input
                  id="reset-confirm-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => onChangeConfirmPassword(e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-[13px] font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Reset password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

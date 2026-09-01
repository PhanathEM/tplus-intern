import { useState } from "react";
import { fetchCurrentUser } from "../../../../services/authService";
import { resetUserPassword } from "../../../../services/userService";
import { setStoredCredentials } from "../../../../lib/apiClient";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";

export function useAccount({ user }) {
  // --- View profile -------------------------------------------------------

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  function handleOpenProfile() {
    setIsProfileOpen(true);
    setProfile(null);
    setProfileError(null);
    setIsProfileLoading(true);

    fetchCurrentUser()
      .then((data) => setProfile(data))
      // The cached login-time user still has username/full_name/role even
      // if this fresh fetch fails, so the panel still shows something
      // rather than an empty error state.
      .catch((error) => {
        setProfile(user || null);
        setProfileError(error.message || "Could not refresh your profile — showing what's on hand.");
      })
      .finally(() => setIsProfileLoading(false));
  }

  function handleCloseProfile() {
    setIsProfileOpen(false);
  }

  // --- Change password (self-service) --------------------------------------

  // There's no dedicated self-service change-password endpoint yet — this
  // reuses the same admin-authority reset endpoint the Users page uses to
  // reset someone else's password, just targeted at the logged-in user's
  // own account_id. That means it only actually works for admins today;
  // a non-admin will get back whatever permission error the backend sends.
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  function handleOpenChangePassword() {
    setIsPasswordOpen(true);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
  }

  function handleCloseChangePassword() {
    setIsPasswordOpen(false);
  }

  function handleSubmitChangePassword(event) {
    event.preventDefault();

    if (!newPassword.trim()) {
      setPasswordError("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    const userId = user?.user_id ?? user?.id;
    if (userId == null) {
      setPasswordError("Could not identify your account. Please sign in again.");
      return;
    }

    setIsSavingPassword(true);
    setPasswordError(null);

    resetUserPassword(userId, newPassword)
      .then(() => {
        // This changes the same account every other request on this page
        // authenticates as (see apiClient.js) — refresh the stored
        // credentials immediately so this tab keeps working right away,
        // instead of every request 401ing until the next fresh login.
        if (user?.username) setStoredCredentials(user.username, newPassword);
        logActivity({
          actor: user,
          action: "reset_password",
          module: ACTIVITY_MODULES.USER,
          entityId: userId,
          entityLabel: user?.username || user?.name || "My account",
        });
        setIsPasswordOpen(false);
      })
      .catch((error) => setPasswordError(error.message || "Could not update your password."))
      .finally(() => setIsSavingPassword(false));
  }

  return {
    isProfileOpen,
    profile,
    isProfileLoading,
    profileError,
    handleOpenProfile,
    handleCloseProfile,
    isPasswordOpen,
    newPassword,
    confirmPassword,
    setNewPassword,
    setConfirmPassword,
    isSavingPassword,
    passwordError,
    handleOpenChangePassword,
    handleCloseChangePassword,
    handleSubmitChangePassword,
  };
}

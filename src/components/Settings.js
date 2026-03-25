// src/components/Settings.js
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { toast } from "react-toastify";
import {
  FaUser,
  FaLock,
  FaBell,
  FaPalette,
  FaLanguage,
  FaSave,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaPhone,
  FaShieldAlt,
  FaKey,
  FaMobileAlt,
  FaClock,
  FaMoon,
  FaSun,
  FaCheckCircle,
  FaSpinner,
  FaUserCircle,
  FaCamera,
  FaMoneyBill,
  FaTrash,
} from "react-icons/fa";
import { authAPI, userAPI } from "../services/api";
import "./Settings.css";

const STORAGE_KEYS = {
  notifications: "settings.notifications",
  appearance: "settings.appearance",
  language: "settings.language",
};

const DEFAULT_NOTIFICATION_SETTINGS = {
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  announcementAlerts: true,
  eventReminders: true,
  resultAlerts: true,
  attendanceAlerts: true,
  feeReminders: true,
};

const DEFAULT_APPEARANCE_SETTINGS = {
  theme: "light",
  compactMode: false,
  fontSize: "medium",
  animations: true,
};

const DEFAULT_LANGUAGE_SETTINGS = {
  language: "en",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
};

const safeRead = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
};

function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { t: langT, language, setLanguage } = useLanguage();
  const { darkMode, setDarkMode } = useDarkMode();

  const [activeTab, setActiveTab] = useState("profile");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phoneNumber: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationSettings, setNotificationSettings] = useState(
    DEFAULT_NOTIFICATION_SETTINGS,
  );
  const [appearanceSettings, setAppearanceSettings] = useState(
    DEFAULT_APPEARANCE_SETTINGS,
  );
  const [languageSettings, setLanguageSettings] = useState(
    DEFAULT_LANGUAGE_SETTINGS,
  );

  const text = {
    settings: langT?.settings?.title || "Settings",
    manageAccount:
      langT?.settings?.subtitle ||
      "Manage your account preferences and settings",
    profile: langT?.settings?.profile || "Profile",
    security: langT?.settings?.security || "Security",
    notifications: langT?.settings?.notifications || "Notifications",
    appearance: langT?.settings?.appearance || "Appearance",
    language: langT?.settings?.language || "Language & Region",
    profileInformation:
      langT?.settings?.profileInformation || "Profile Information",
    updatePersonalInfo:
      langT?.settings?.updatePersonalInfo ||
      "Update your personal information and contact details",
    securitySettings: langT?.settings?.securitySettings || "Security Settings",
    changePasswordText:
      langT?.settings?.changePasswordText ||
      "Change your password and manage security preferences",
    notificationPreferences:
      langT?.settings?.notificationPreferences || "Notification Preferences",
    notificationText:
      langT?.settings?.notificationText ||
      "Choose how you want to receive notifications",
    appearanceTitle: langT?.settings?.appearanceTitle || "Appearance",
    appearanceText:
      langT?.settings?.appearanceText || "Customize how the application looks",
    languageTitle: langT?.settings?.languageTitle || "Language & Region",
    languageText:
      langT?.settings?.languageText ||
      "Set your language and regional preferences",
    firstName: langT?.common?.firstName || "First Name",
    lastName: langT?.common?.lastName || "Last Name",
    username: langT?.common?.username || "Username",
    emailAddress: langT?.common?.email || "Email Address",
    phoneNumber: langT?.common?.phone || "Phone Number",
    saveChanges: langT?.common?.saveChanges || "Save Changes",
    saving: langT?.common?.saving || "Saving...",
    currentPassword: langT?.settings?.currentPassword || "Current Password",
    newPassword: langT?.settings?.newPassword || "New Password",
    confirmNewPassword:
      langT?.settings?.confirmNewPassword || "Confirm New Password",
    changePassword: langT?.settings?.changePassword || "Change Password",
    updating: langT?.common?.updating || "Updating...",
    passwordHint:
      langT?.settings?.passwordHint ||
      "Password must be at least 6 characters long",
    profileUpdated:
      langT?.settings?.profileUpdated || "Profile updated successfully!",
    passwordChanged:
      langT?.settings?.passwordChanged || "Password changed successfully!",
    notificationSaved:
      langT?.settings?.notificationSaved || "Notification settings saved!",
    appearanceSaved:
      langT?.settings?.appearanceSaved || "Appearance settings saved!",
    languageSaved: langT?.settings?.languageSaved || "Language settings saved!",
    profileFailed: langT?.settings?.profileFailed || "Failed to update profile",
    passwordFailed:
      langT?.settings?.passwordFailed || "Failed to change password",
    notificationFailed:
      langT?.settings?.notificationFailed ||
      "Failed to save notification settings",
    appearanceFailed:
      langT?.settings?.appearanceFailed || "Failed to save appearance settings",
    languageFailed:
      langT?.settings?.languageFailed || "Failed to save language settings",
    currentPasswordRequired:
      langT?.settings?.currentPasswordRequired ||
      "Current password is required",
    passwordMin:
      langT?.settings?.passwordMin ||
      "Password must be at least 6 characters long",
    passwordsMismatch:
      langT?.settings?.passwordsMismatch || "New passwords do not match",
    securityTips: langT?.settings?.securityTips || "Security Tips",
    tip1:
      langT?.settings?.tip1 ||
      "Use a strong password with letters, numbers, and symbols.",
    tip2: langT?.settings?.tip2 || "Never share your password with anyone.",
    tip3: langT?.settings?.tip3 || "Change your password regularly.",
    communicationChannels:
      langT?.settings?.communicationChannels || "Communication Channels",
    alertTypes: langT?.settings?.alertTypes || "Alert Types",
    emailNotifications:
      langT?.settings?.emailNotifications || "Email Notifications",
    emailNotificationsText:
      langT?.settings?.emailNotificationsText ||
      "Receive notifications via email",
    pushNotifications:
      langT?.settings?.pushNotifications || "Push Notifications",
    pushNotificationsText:
      langT?.settings?.pushNotificationsText ||
      "Receive push notifications in browser",
    smsNotifications: langT?.settings?.smsNotifications || "SMS Notifications",
    smsNotificationsText:
      langT?.settings?.smsNotificationsText || "Receive notifications via SMS",
    announcements: langT?.settings?.announcements || "Announcements",
    announcementsText:
      langT?.settings?.announcementsText || "School announcements and news",
    eventReminders: langT?.settings?.eventReminders || "Event Reminders",
    eventRemindersText:
      langT?.settings?.eventRemindersText ||
      "Upcoming school events and activities",
    resultAlerts: langT?.settings?.resultAlerts || "Results & Grades",
    resultAlertsText:
      langT?.settings?.resultAlertsText ||
      "When results and grades are published",
    attendanceAlerts: langT?.settings?.attendanceAlerts || "Attendance Alerts",
    attendanceAlertsText:
      langT?.settings?.attendanceAlertsText || "When attendance is recorded",
    feeReminders: langT?.settings?.feeReminders || "Fee Reminders",
    feeRemindersText:
      langT?.settings?.feeRemindersText || "When fees are due or paid",
    savePreferences: langT?.settings?.savePreferences || "Save Preferences",
    applyChanges: langT?.settings?.applyChanges || "Apply Changes",
    theme: langT?.settings?.theme || "Theme",
    light: langT?.settings?.light || "Light",
    dark: langT?.settings?.dark || "Dark",
    fontSize: langT?.settings?.fontSize || "Font Size",
    small: langT?.settings?.small || "Small",
    medium: langT?.settings?.medium || "Medium",
    large: langT?.settings?.large || "Large",
    compactMode: langT?.settings?.compactMode || "Compact Mode",
    compactModeText:
      langT?.settings?.compactModeText ||
      "Reduce spacing and make UI more compact",
    animations: langT?.settings?.animations || "Animations",
    animationsText:
      langT?.settings?.animationsText ||
      "Enable smooth animations throughout the app",
    languageLabel: langT?.settings?.languageLabel || "Language",
    dateFormat: langT?.settings?.dateFormat || "Date Format",
    timeFormat: langT?.settings?.timeFormat || "Time Format",
    administrator: langT?.roles?.admin || "Administrator",
    teacher: langT?.roles?.teacher || "Teacher",
    student: langT?.roles?.student || "Student",
    parent: langT?.roles?.parent || "Parent",
    user: langT?.roles?.user || "User",
    deleteAccount: langT?.settings?.deleteAccount || "Delete Account",
    deleteAccountWarning:
      langT?.settings?.deleteAccountWarning ||
      "This action cannot be undone. All your data will be permanently deleted.",
    confirmDelete: langT?.common?.confirmDelete || "Confirm Delete",
    cancel: langT?.common?.cancel || "Cancel",
  };

  useEffect(() => {
    setNotificationSettings(
      safeRead(STORAGE_KEYS.notifications, DEFAULT_NOTIFICATION_SETTINGS),
    );
    setAppearanceSettings(
      safeRead(STORAGE_KEYS.appearance, DEFAULT_APPEARANCE_SETTINGS),
    );
    setLanguageSettings(
      safeRead(STORAGE_KEYS.language, DEFAULT_LANGUAGE_SETTINGS),
    );
  }, []);

  useEffect(() => {
    if (!user) return;

    setProfileForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || user.phone || "",
    });
  }, [user]);

  useEffect(() => {
    const theme = darkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute(
      "data-compact",
      appearanceSettings.compactMode ? "true" : "false",
    );
    document.documentElement.setAttribute(
      "data-animations",
      appearanceSettings.animations ? "true" : "false",
    );
    document.body.setAttribute("data-theme", theme);

    document.documentElement.style.fontSize =
      appearanceSettings.fontSize === "small"
        ? "14px"
        : appearanceSettings.fontSize === "large"
          ? "18px"
          : "16px";
  }, [darkMode, appearanceSettings]);

  useEffect(() => {
    const lang = languageSettings.language || language || "en";
    document.documentElement.lang = lang;
    setLanguage(lang);
  }, [languageSettings, language, setLanguage]);

  const getRoleLabel = (role) => {
    switch (role) {
      case "ADMIN":
        return text.administrator;
      case "TEACHER":
        return text.teacher;
      case "STUDENT":
        return text.student;
      case "PARENT":
        return text.parent;
      default:
        return text.user;
    }
  };

  const tabs = useMemo(
    () => [
      { id: "profile", label: text.profile, icon: <FaUser /> },
      { id: "security", label: text.security, icon: <FaLock /> },
      { id: "notifications", label: text.notifications, icon: <FaBell /> },
      { id: "appearance", label: text.appearance, icon: <FaPalette /> },
      { id: "language", label: text.language, icon: <FaLanguage /> },
    ],
    [text],
  );

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (setting) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleAppearanceChange = (setting, value) => {
    setAppearanceSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleLanguageChange = (setting, value) => {
    setLanguageSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleThemeChange = (theme) => {
    setDarkMode(theme === "dark");
    setAppearanceSettings((prev) => ({
      ...prev,
      theme,
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const payload = {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
        phoneNumber: profileForm.phoneNumber.trim(),
      };

      const response = await userAPI.updateCurrentUser(payload);
      const updated = response?.data || payload;

      updateUser({
        ...user,
        ...updated,
      });

      toast.success(text.profileUpdated);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error?.response?.data?.message || text.profileFailed);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword.trim()) {
      toast.error(text.currentPasswordRequired);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error(text.passwordMin);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(text.passwordsMismatch);
      return;
    }

    setSavingPassword(true);

    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success(text.passwordChanged);
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error?.response?.data?.message || text.passwordFailed);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleNotificationSubmit = async () => {
    setSavingNotifications(true);
    try {
      localStorage.setItem(
        STORAGE_KEYS.notifications,
        JSON.stringify(notificationSettings),
      );
      toast.success(text.notificationSaved);
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error(text.notificationFailed);
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleAppearanceSubmit = async () => {
    setSavingAppearance(true);
    try {
      localStorage.setItem(
        STORAGE_KEYS.appearance,
        JSON.stringify(appearanceSettings),
      );
      toast.success(text.appearanceSaved);
    } catch (error) {
      console.error("Error saving appearance settings:", error);
      toast.error(text.appearanceFailed);
    } finally {
      setSavingAppearance(false);
    }
  };

  const handleLanguageSubmit = async () => {
    setSavingLanguage(true);
    try {
      localStorage.setItem(
        STORAGE_KEYS.language,
        JSON.stringify(languageSettings),
      );
      toast.success(text.languageSaved);
    } catch (error) {
      console.error("Error saving language settings:", error);
      toast.error(text.languageFailed);
    } finally {
      setSavingLanguage(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await userAPI.deleteCurrentUser();
      toast.success("Account deleted successfully");
      logout();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>{text.settings}</h1>
        <p>{text.manageAccount}</p>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          <div className="user-info-card">
            <div className="user-avatar-large">
              {user?.profilePictureUrl ? (
                <img
                  src={user.profilePictureUrl}
                  alt={user?.firstName || "User"}
                />
              ) : (
                <FaUserCircle />
              )}
              <button
                type="button"
                className="change-avatar-btn"
                title="Profile picture"
              >
                <FaCamera />
              </button>
            </div>

            <h3>
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="user-email">{user?.email}</p>
            <p className="user-role">{getRoleLabel(user?.role)}</p>
          </div>

          <div className="settings-tabs">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-main">
          {activeTab === "profile" && (
            <div className="settings-section">
              <div className="section-header">
                <h2>{text.profileInformation}</h2>
                <p>{text.updatePersonalInfo}</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>{text.firstName}</label>
                    <div className="input-icon">
                      <FaUser />
                      <input
                        type="text"
                        name="firstName"
                        value={profileForm.firstName}
                        onChange={handleProfileChange}
                        placeholder={text.firstName}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{text.lastName}</label>
                    <div className="input-icon">
                      <FaUser />
                      <input
                        type="text"
                        name="lastName"
                        value={profileForm.lastName}
                        onChange={handleProfileChange}
                        placeholder={text.lastName}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{text.username}</label>
                    <div className="input-icon">
                      <FaUser />
                      <input
                        type="text"
                        name="username"
                        value={profileForm.username}
                        onChange={handleProfileChange}
                        placeholder={text.username}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{text.emailAddress}</label>
                    <div className="input-icon">
                      <FaEnvelope />
                      <input
                        type="email"
                        name="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        placeholder={text.emailAddress}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{text.phoneNumber}</label>
                    <div className="input-icon">
                      <FaPhone />
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={profileForm.phoneNumber}
                        onChange={handleProfileChange}
                        placeholder={text.phoneNumber}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-save"
                    disabled={savingProfile}
                  >
                    {savingProfile ? (
                      <>
                        <FaSpinner className="spinner" /> {text.saving}
                      </>
                    ) : (
                      <>
                        <FaSave /> {text.saveChanges}
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="danger-zone">
                <h3>Danger Zone</h3>
                <div className="danger-card">
                  <div className="danger-info">
                    <FaTrash className="danger-icon" />
                    <div>
                      <strong>{text.deleteAccount}</strong>
                      <p>{text.deleteAccountWarning}</p>
                    </div>
                  </div>
                  <button
                    className="btn-danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    {text.deleteAccount}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="settings-section">
              <div className="section-header">
                <h2>{text.securitySettings}</h2>
                <p>{text.changePasswordText}</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="settings-form">
                <div className="form-group">
                  <label>{text.currentPassword}</label>
                  <div className="input-icon">
                    <FaKey />
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder={text.currentPassword}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                    >
                      {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>{text.newPassword}</label>
                  <div className="input-icon">
                    <FaLock />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder={text.newPassword}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <small className="form-hint">{text.passwordHint}</small>
                </div>

                <div className="form-group">
                  <label>{text.confirmNewPassword}</label>
                  <div className="input-icon">
                    <FaShieldAlt />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder={text.confirmNewPassword}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-save"
                    disabled={savingPassword}
                  >
                    {savingPassword ? (
                      <>
                        <FaSpinner className="spinner" /> {text.updating}
                      </>
                    ) : (
                      <>
                        <FaLock /> {text.changePassword}
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="security-info">
                <div className="info-card">
                  <FaShieldAlt className="info-icon" />
                  <div>
                    <h4>{text.securityTips}</h4>
                    <ul>
                      <li>{text.tip1}</li>
                      <li>{text.tip2}</li>
                      <li>{text.tip3}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="settings-section">
              <div className="section-header">
                <h2>{text.notificationPreferences}</h2>
                <p>{text.notificationText}</p>
              </div>

              <div className="notification-settings">
                <div className="notification-group">
                  <h3>{text.communicationChannels}</h3>

                  {[
                    [
                      "emailNotifications",
                      text.emailNotifications,
                      text.emailNotificationsText,
                      <FaEnvelope />,
                    ],
                    [
                      "pushNotifications",
                      text.pushNotifications,
                      text.pushNotificationsText,
                      <FaMobileAlt />,
                    ],
                    [
                      "smsNotifications",
                      text.smsNotifications,
                      text.smsNotificationsText,
                      <FaPhone />,
                    ],
                  ].map(([key, title, desc, icon]) => (
                    <div className="notification-option" key={key}>
                      <div className="option-info">
                        {icon}
                        <div>
                          <strong>{title}</strong>
                          <p>{desc}</p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={notificationSettings[key]}
                          onChange={() => handleNotificationChange(key)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="notification-group">
                  <h3>{text.alertTypes}</h3>

                  {[
                    [
                      "announcementAlerts",
                      text.announcements,
                      text.announcementsText,
                      <FaBell />,
                    ],
                    [
                      "eventReminders",
                      text.eventReminders,
                      text.eventRemindersText,
                      <FaClock />,
                    ],
                    [
                      "resultAlerts",
                      text.resultAlerts,
                      text.resultAlertsText,
                      <FaCheckCircle />,
                    ],
                    [
                      "attendanceAlerts",
                      text.attendanceAlerts,
                      text.attendanceAlertsText,
                      <FaClock />,
                    ],
                    [
                      "feeReminders",
                      text.feeReminders,
                      text.feeRemindersText,
                      <FaMoneyBill />,
                    ],
                  ].map(([key, title, desc, icon]) => (
                    <div className="notification-option" key={key}>
                      <div className="option-info">
                        {icon}
                        <div>
                          <strong>{title}</strong>
                          <p>{desc}</p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={notificationSettings[key]}
                          onChange={() => handleNotificationChange(key)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-save"
                    onClick={handleNotificationSubmit}
                    disabled={savingNotifications}
                  >
                    {savingNotifications ? (
                      <>
                        <FaSpinner className="spinner" /> {text.saving}
                      </>
                    ) : (
                      <>
                        <FaSave /> {text.savePreferences}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="settings-section">
              <div className="section-header">
                <h2>{text.appearanceTitle}</h2>
                <p>{text.appearanceText}</p>
              </div>

              <div className="appearance-settings">
                <div className="setting-card">
                  <h3>{text.theme}</h3>
                  <div className="theme-options">
                    <button
                      type="button"
                      className={`theme-option ${!darkMode ? "active" : ""}`}
                      onClick={() => handleThemeChange("light")}
                    >
                      <FaSun />
                      <span>{text.light}</span>
                    </button>
                    <button
                      type="button"
                      className={`theme-option ${darkMode ? "active" : ""}`}
                      onClick={() => handleThemeChange("dark")}
                    >
                      <FaMoon />
                      <span>{text.dark}</span>
                    </button>
                  </div>
                </div>

                <div className="setting-card">
                  <h3>{text.fontSize}</h3>
                  <select
                    value={appearanceSettings.fontSize}
                    onChange={(e) =>
                      handleAppearanceChange("fontSize", e.target.value)
                    }
                  >
                    <option value="small">{text.small}</option>
                    <option value="medium">{text.medium}</option>
                    <option value="large">{text.large}</option>
                  </select>
                </div>

                <div className="setting-card">
                  <div className="notification-option">
                    <div className="option-info">
                      <FaPalette />
                      <div>
                        <strong>{text.compactMode}</strong>
                        <p>{text.compactModeText}</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={appearanceSettings.compactMode}
                        onChange={() =>
                          handleAppearanceChange(
                            "compactMode",
                            !appearanceSettings.compactMode,
                          )
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-option">
                    <div className="option-info">
                      <FaPalette />
                      <div>
                        <strong>{text.animations}</strong>
                        <p>{text.animationsText}</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={appearanceSettings.animations}
                        onChange={() =>
                          handleAppearanceChange(
                            "animations",
                            !appearanceSettings.animations,
                          )
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-save"
                    onClick={handleAppearanceSubmit}
                    disabled={savingAppearance}
                  >
                    {savingAppearance ? (
                      <>
                        <FaSpinner className="spinner" /> {text.saving}
                      </>
                    ) : (
                      <>
                        <FaSave /> {text.applyChanges}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "language" && (
            <div className="settings-section">
              <div className="section-header">
                <h2>{text.languageTitle}</h2>
                <p>{text.languageText}</p>
              </div>

              <div className="language-settings">
                <div className="setting-card">
                  <label>{text.languageLabel}</label>
                  <select
                    value={languageSettings.language}
                    onChange={(e) =>
                      handleLanguageChange("language", e.target.value)
                    }
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="ig">Igbo</option>
                  </select>
                </div>

                <div className="setting-card">
                  <label>{text.dateFormat}</label>
                  <select
                    value={languageSettings.dateFormat}
                    onChange={(e) =>
                      handleLanguageChange("dateFormat", e.target.value)
                    }
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="setting-card">
                  <label>{text.timeFormat}</label>
                  <select
                    value={languageSettings.timeFormat}
                    onChange={(e) =>
                      handleLanguageChange("timeFormat", e.target.value)
                    }
                  >
                    <option value="24h">24h</option>
                    <option value="12h">12h</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-save"
                    onClick={handleLanguageSubmit}
                    disabled={savingLanguage}
                  >
                    {savingLanguage ? (
                      <>
                        <FaSpinner className="spinner" /> {text.saving}
                      </>
                    ) : (
                      <>
                        <FaSave /> {text.savePreferences}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>{text.deleteAccount}</h3>
            <p>{text.deleteAccountWarning}</p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {text.cancel}
              </button>
              <button className="btn-danger" onClick={handleDeleteAccount}>
                {text.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;

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
  FaGlobe,
  FaLanguage,
  FaSave,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
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
  FaSignOutAlt,
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

const translations = {
  en: {
    settings: "Settings",
    manageAccount: "Manage your account preferences and settings",
    profile: "Profile",
    security: "Security",
    notifications: "Notifications",
    appearance: "Appearance",
    language: "Language & Region",
    profileInformation: "Profile Information",
    updatePersonalInfo: "Update your personal information and contact details",
    securitySettings: "Security Settings",
    changePasswordText: "Change your password and manage security preferences",
    notificationPreferences: "Notification Preferences",
    notificationText: "Choose how you want to receive notifications",
    appearanceTitle: "Appearance",
    appearanceText: "Customize how the application looks",
    languageTitle: "Language & Region",
    languageText: "Set your language and regional preferences",
    firstName: "First Name",
    lastName: "Last Name",
    username: "Username",
    emailAddress: "Email Address",
    phoneNumber: "Phone Number",
    dateOfBirth: "Date of Birth",
    saveChanges: "Save Changes",
    saving: "Saving...",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    changePassword: "Change Password",
    updating: "Updating...",
    passwordHint: "Password must be at least 6 characters long",
    securityTips: "Security Tips",
    tip1: "Use a strong password with letters, numbers, and symbols.",
    tip2: "Never share your password with anyone.",
    tip3: "Change your password regularly.",
    communicationChannels: "Communication Channels",
    alertTypes: "Alert Types",
    emailNotifications: "Email Notifications",
    emailNotificationsText: "Receive notifications via email",
    pushNotifications: "Push Notifications",
    pushNotificationsText: "Receive push notifications in browser",
    smsNotifications: "SMS Notifications",
    smsNotificationsText: "Receive notifications via SMS",
    announcements: "Announcements",
    announcementsText: "School announcements and news",
    eventReminders: "Event Reminders",
    eventRemindersText: "Upcoming school events and activities",
    resultAlerts: "Results & Grades",
    resultAlertsText: "When results and grades are published",
    attendanceAlerts: "Attendance Alerts",
    attendanceAlertsText: "When attendance is recorded",
    feeReminders: "Fee Reminders",
    feeRemindersText: "When fees are due or paid",
    savePreferences: "Save Preferences",
    applyChanges: "Apply Changes",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    fontSize: "Font Size",
    small: "Small",
    medium: "Medium",
    large: "Large",
    compactMode: "Compact Mode",
    compactModeText: "Reduce spacing and make UI more compact",
    animations: "Animations",
    animationsText: "Enable smooth animations throughout the app",
    languageLabel: "Language",
    dateFormat: "Date Format",
    timeFormat: "Time Format",
    profileUpdated: "Profile updated successfully!",
    passwordChanged: "Password changed successfully!",
    notificationSaved: "Notification settings saved!",
    appearanceSaved: "Appearance settings saved!",
    languageSaved: "Language preferences saved!",
    profileFailed: "Failed to update profile",
    passwordFailed: "Failed to change password",
    notificationFailed: "Failed to save notification settings",
    appearanceFailed: "Failed to save appearance settings",
    languageFailed: "Failed to save language settings",
    currentPasswordRequired: "Current password is required",
    passwordMin: "Password must be at least 6 characters long",
    passwordsMismatch: "New passwords do not match",
    administrator: "Administrator",
    teacher: "Teacher",
    student: "Student",
    parent: "Parent",
    user: "User",
    deleteAccount: "Delete Account",
    deleteAccountWarning:
      "This action cannot be undone. All your data will be permanently deleted.",
    confirmDelete: "Confirm Delete",
    cancel: "Cancel",
  },
  fr: {
    settings: "Paramètres",
    manageAccount: "Gérez les préférences et paramètres de votre compte",
    profile: "Profil",
    security: "Sécurité",
    notifications: "Notifications",
    appearance: "Apparence",
    language: "Langue et région",
    profileInformation: "Informations du profil",
    updatePersonalInfo:
      "Mettez à jour vos informations personnelles et vos coordonnées",
    securitySettings: "Paramètres de sécurité",
    changePasswordText:
      "Modifiez votre mot de passe et gérez vos préférences de sécurité",
    notificationPreferences: "Préférences de notification",
    notificationText:
      "Choisissez comment vous souhaitez recevoir les notifications",
    appearanceTitle: "Apparence",
    appearanceText: "Personnalisez l’apparence de l’application",
    languageTitle: "Langue et région",
    languageText: "Définissez vos préférences de langue et de région",
    firstName: "Prénom",
    lastName: "Nom",
    username: "Nom d’utilisateur",
    emailAddress: "Adresse e-mail",
    phoneNumber: "Numéro de téléphone",
    dateOfBirth: "Date de naissance",
    saveChanges: "Enregistrer les modifications",
    saving: "Enregistrement...",
    currentPassword: "Mot de passe actuel",
    newPassword: "Nouveau mot de passe",
    confirmNewPassword: "Confirmez le nouveau mot de passe",
    changePassword: "Changer le mot de passe",
    updating: "Mise à jour...",
    passwordHint: "Le mot de passe doit contenir au moins 6 caractères",
    securityTips: "Conseils de sécurité",
    tip1: "Utilisez un mot de passe fort avec des lettres, des chiffres et des symboles.",
    tip2: "Ne partagez jamais votre mot de passe avec qui que ce soit.",
    tip3: "Changez régulièrement votre mot de passe.",
    communicationChannels: "Canaux de communication",
    alertTypes: "Types d’alertes",
    emailNotifications: "Notifications par e-mail",
    emailNotificationsText: "Recevoir les notifications par e-mail",
    pushNotifications: "Notifications push",
    pushNotificationsText: "Recevoir les notifications push dans le navigateur",
    smsNotifications: "Notifications SMS",
    smsNotificationsText: "Recevoir les notifications par SMS",
    announcements: "Annonces",
    announcementsText: "Annonces et nouvelles de l’école",
    eventReminders: "Rappels d’événements",
    eventRemindersText: "Événements et activités scolaires à venir",
    resultAlerts: "Résultats et notes",
    resultAlertsText: "Lorsque les résultats et les notes sont publiés",
    attendanceAlerts: "Alertes de présence",
    attendanceAlertsText: "Lorsque la présence est enregistrée",
    feeReminders: "Rappels de frais",
    feeRemindersText: "Lorsque les frais sont dus ou payés",
    savePreferences: "Enregistrer les préférences",
    applyChanges: "Appliquer les modifications",
    theme: "Thème",
    light: "Clair",
    dark: "Sombre",
    fontSize: "Taille de police",
    small: "Petit",
    medium: "Moyen",
    large: "Grand",
    compactMode: "Mode compact",
    compactModeText: "Réduire l’espacement et rendre l’interface plus compacte",
    animations: "Animations",
    animationsText: "Activer des animations fluides dans l’application",
    languageLabel: "Langue",
    dateFormat: "Format de date",
    timeFormat: "Format de l’heure",
    profileUpdated: "Profil mis à jour avec succès !",
    passwordChanged: "Mot de passe modifié avec succès !",
    notificationSaved: "Paramètres de notification enregistrés !",
    appearanceSaved: "Paramètres d’apparence enregistrés !",
    languageSaved: "Préférences de langue enregistrées !",
    profileFailed: "Échec de la mise à jour du profil",
    passwordFailed: "Échec de la modification du mot de passe",
    notificationFailed: "Échec de l’enregistrement des notifications",
    appearanceFailed: "Échec de l’enregistrement de l’apparence",
    languageFailed: "Échec de l’enregistrement de la langue",
    currentPasswordRequired: "Le mot de passe actuel est requis",
    passwordMin: "Le mot de passe doit contenir au moins 6 caractères",
    passwordsMismatch: "Les nouveaux mots de passe ne correspondent pas",
    administrator: "Administrateur",
    teacher: "Enseignant",
    student: "Étudiant",
    parent: "Parent",
    user: "Utilisateur",
    deleteAccount: "Supprimer le compte",
    deleteAccountWarning:
      "Cette action est irréversible. Toutes vos données seront définitivement supprimées.",
    confirmDelete: "Confirmer la suppression",
    cancel: "Annuler",
  },
  ig: {
    settings: "Ntọala",
    manageAccount: "Jikwaa nhọrọ na ntọala akaụntụ gị",
    profile: "Profail",
    security: "Nchekwa",
    notifications: "Ọkwa",
    appearance: "Ọdịdị",
    language: "Asụsụ na Mpaghara",
    profileInformation: "Ozi Profail",
    updatePersonalInfo: "Melite ozi onwe gị na nkọwa kọntaktị",
    securitySettings: "Ntọala Nchekwa",
    changePasswordText: "Gbanwee paswọọdụ gị ma jikwaa nhọrọ nchekwa",
    notificationPreferences: "Nhọrọ Ọkwa",
    notificationText: "Họrọ otu ị chọrọ ịnweta ọkwa",
    appearanceTitle: "Ọdịdị",
    appearanceText: "Hazie otu ngwa ọrụ si adị",
    languageTitle: "Asụsụ na Mpaghara",
    languageText: "Tọọ asụsụ na nhọrọ mpaghara gị",
    firstName: "Aha Mbụ",
    lastName: "Aha Ikpeazụ",
    username: "Aha Njirimara",
    emailAddress: "Adresị Email",
    phoneNumber: "Nọmba Ekwentị",
    dateOfBirth: "Ụbọchị Ọmụmụ",
    saveChanges: "Chekwaa Mgbanwe",
    saving: "Na-echekwa...",
    currentPassword: "Paswọọdụ Ugbu a",
    newPassword: "Paswọọdụ Ọhụrụ",
    confirmNewPassword: "Kwado Paswọọdụ Ọhụrụ",
    changePassword: "Gbanwee Paswọọdụ",
    updating: "Na-emelite...",
    passwordHint: "Paswọọdụ ga-enwerịrị opekata mpe mkpụrụedemede 6",
    securityTips: "Ndụmọdụ Nchekwa",
    tip1: "Jiri paswọọdụ siri ike nke nwere mkpụrụedemede, ọnụọgụ, na akara.",
    tip2: "Ekekọrịtala paswọọdụ gị na onye ọ bụla.",
    tip3: "Gbanwee paswọọdụ gị mgbe niile.",
    communicationChannels: "Ụzọ Nkwurịta Okwu",
    alertTypes: "Ụdị Ịdọ aka ná ntị",
    emailNotifications: "Ọkwa Email",
    emailNotificationsText: "Nata ọkwa site na email",
    pushNotifications: "Ọkwa Push",
    pushNotificationsText: "Nata ọkwa push na ihe nchọgharị",
    smsNotifications: "Ọkwa SMS",
    smsNotificationsText: "Nata ọkwa site na SMS",
    announcements: "Ọkwa",
    announcementsText: "Ọkwa na akụkọ ụlọ akwụkwọ",
    eventReminders: "Ihe Ncheta Ihe Omume",
    eventRemindersText: "Ihe omume na mmemme ụlọ akwụkwọ na-abịa",
    resultAlerts: "Nsonaazụ & Ọkwa",
    resultAlertsText: "Mgbe e bipụtara nsonaazụ na ọkwa",
    attendanceAlerts: "Ịdọ aka ná ntị Ịbịa",
    attendanceAlertsText: "Mgbe edere ọbịa",
    feeReminders: "Ihe Ncheta Ụgwọ",
    feeRemindersText: "Mgbe ụgwọ ruru ma ọ bụ kwụrụ ya",
    savePreferences: "Chekwaa Nhọrọ",
    applyChanges: "Tinye Mgbanwe",
    theme: "Isiokwu",
    light: "Ọkụ",
    dark: "Ọchịchịrị",
    fontSize: "Oke Mkpụrụedemede",
    small: "Nta",
    medium: "Ọkara",
    large: "Nnukwu",
    compactMode: "Ụdị Mkpakọ",
    compactModeText: "Belata oghere ma mee ka UI dị mkpọkarị",
    animations: "Ihe ngosi",
    animationsText: "Gosi ihe ngosi dị nro na ngwa ọrụ",
    languageLabel: "Asụsụ",
    dateFormat: "Ụdị Ụbọchị",
    timeFormat: "Ụdị Oge",
    profileUpdated: "Emelitere profail nke ọma!",
    passwordChanged: "Gbanwere paswọọdụ nke ọma!",
    notificationSaved: "Echekwara ntọala ọkwa!",
    appearanceSaved: "Echekwara ntọala ọdịdị!",
    languageSaved: "Echekwara nhọrọ asụsụ!",
    profileFailed: "Ịmelite profail emeghị nke ọma",
    passwordFailed: "Ịgbanwe paswọọdụ emeghị nke ọma",
    notificationFailed: "Ịchekwa ntọala ọkwa emeghị nke ọma",
    appearanceFailed: "Ịchekwa ntọala ọdịdị emeghị nke ọma",
    languageFailed: "Ịchekwa ntọala asụsụ emeghị nke ọma",
    currentPasswordRequired: "Paswọọdụ ugbu a dị mkpa",
    passwordMin: "Paswọọdụ ga-enwerịrị opekata mpe mkpụrụedemede 6",
    passwordsMismatch: "Paswọọdụ ọhụrụ adabaghị",
    administrator: "Onye Nchịkwa",
    teacher: "Onye Nkụzi",
    student: "Nwa Akwụkwọ",
    parent: "Nne/Nna",
    user: "Onye Ọrụ",
    deleteAccount: "Hichapụ Akaụntụ",
    deleteAccountWarning:
      "Enweghị ike ịgbanwe ihe a. A ga-ehichapụ data gị niile kpamkpam.",
    confirmDelete: "Kwado Nhichapụ",
    cancel: "Kagbuo",
  },
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

const normalizeDateInput = (value) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().split("T")[0];
};

function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { t: langT, language, setLanguage } = useLanguage();
  const { darkMode, setDarkMode, toggleDarkMode } = useDarkMode();

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
    address: "",
    dateOfBirth: "",
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

  const currentLanguage = languageSettings.language || "en";
  const t = translations[currentLanguage] || translations.en;

  // Load saved settings on mount
  useEffect(() => {
    const savedNotifications = safeRead(
      STORAGE_KEYS.notifications,
      DEFAULT_NOTIFICATION_SETTINGS,
    );
    const savedAppearance = safeRead(
      STORAGE_KEYS.appearance,
      DEFAULT_APPEARANCE_SETTINGS,
    );
    const savedLanguage = safeRead(
      STORAGE_KEYS.language,
      DEFAULT_LANGUAGE_SETTINGS,
    );

    setNotificationSettings(savedNotifications);
    setAppearanceSettings(savedAppearance);
    setLanguageSettings(savedLanguage);
  }, []);

  // Sync with user data
  useEffect(() => {
    if (!user) return;

    setProfileForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || user.phone || "",
      address: user.address || "",
      dateOfBirth: normalizeDateInput(user.dateOfBirth),
    });
  }, [user]);

  // Apply appearance settings
  useEffect(() => {
    const theme = darkMode ? "dark" : "light";
    const compact = appearanceSettings.compactMode ? "true" : "false";
    const animations = appearanceSettings.animations ? "true" : "false";

    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-bs-theme", theme);
    document.documentElement.setAttribute("data-compact", compact);
    document.documentElement.setAttribute("data-animations", animations);

    document.body.setAttribute("data-theme", theme);
    document.body.setAttribute("data-bs-theme", theme);
    document.body.setAttribute("data-compact", compact);
    document.body.setAttribute("data-animations", animations);

    document.documentElement.style.fontSize =
      appearanceSettings.fontSize === "small"
        ? "14px"
        : appearanceSettings.fontSize === "large"
          ? "18px"
          : "16px";
  }, [darkMode, appearanceSettings]);

  // Apply language settings
  useEffect(() => {
    const lang = languageSettings.language || "en";
    document.documentElement.lang = lang;
    document.body.setAttribute("data-language", lang);
    setLanguage(lang);
  }, [languageSettings, setLanguage]);

  const getRoleLabel = (role) => {
    switch (role) {
      case "ADMIN":
        return t.administrator;
      case "TEACHER":
        return t.teacher;
      case "STUDENT":
        return t.student;
      case "PARENT":
        return t.parent;
      default:
        return t.user;
    }
  };

  const tabs = useMemo(
    () => [
      { id: "profile", label: t.profile, icon: <FaUser /> },
      { id: "security", label: t.security, icon: <FaLock /> },
      { id: "notifications", label: t.notifications, icon: <FaBell /> },
      { id: "appearance", label: t.appearance, icon: <FaPalette /> },
      { id: "language", label: t.language, icon: <FaLanguage /> },
    ],
    [t],
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
        ...user,
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
        phoneNumber: profileForm.phoneNumber.trim(),
        dateOfBirth: profileForm.dateOfBirth || null,
      };

      const response = await userAPI.updateCurrentUser(payload);
      updateUser(response.data);
      toast.success(t.profileUpdated);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error?.response?.data?.message || t.profileFailed);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword) {
      toast.error(t.currentPasswordRequired);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error(t.passwordMin);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t.passwordsMismatch);
      return;
    }

    setSavingPassword(true);

    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success(t.passwordChanged);
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error?.response?.data?.message || t.passwordFailed);
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
      toast.success(t.notificationSaved);
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error(t.notificationFailed);
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
      toast.success(t.appearanceSaved);
    } catch (error) {
      console.error("Error saving appearance settings:", error);
      toast.error(t.appearanceFailed);
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

      toast.success(t.languageSaved);
    } catch (error) {
      console.error("Error saving language settings:", error);
      toast.error(t.languageFailed);
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
        <h1>{t.settings}</h1>
        <p>{t.manageAccount}</p>
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
                className={`settings-tab ${
                  activeTab === tab.id ? "active" : ""
                }`}
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
                <h2>{t.profileInformation}</h2>
                <p>{t.updatePersonalInfo}</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>{t.firstName}</label>
                    <div className="input-icon">
                      <FaUser />
                      <input
                        type="text"
                        name="firstName"
                        value={profileForm.firstName}
                        onChange={handleProfileChange}
                        placeholder={t.firstName}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t.lastName}</label>
                    <div className="input-icon">
                      <FaUser />
                      <input
                        type="text"
                        name="lastName"
                        value={profileForm.lastName}
                        onChange={handleProfileChange}
                        placeholder={t.lastName}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t.username}</label>
                    <div className="input-icon">
                      <FaUser />
                      <input
                        type="text"
                        name="username"
                        value={profileForm.username}
                        onChange={handleProfileChange}
                        placeholder={t.username}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t.emailAddress}</label>
                    <div className="input-icon">
                      <FaEnvelope />
                      <input
                        type="email"
                        name="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        placeholder={t.emailAddress}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t.phoneNumber}</label>
                    <div className="input-icon">
                      <FaPhone />
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={profileForm.phoneNumber}
                        onChange={handleProfileChange}
                        placeholder={t.phoneNumber}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t.dateOfBirth}</label>
                    <div className="input-icon">
                      <FaCalendarAlt />
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={profileForm.dateOfBirth}
                        onChange={handleProfileChange}
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
                        <FaSpinner className="spinner" /> {t.saving}
                      </>
                    ) : (
                      <>
                        <FaSave /> {t.saveChanges}
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
                      <strong>{t.deleteAccount}</strong>
                      <p>{t.deleteAccountWarning}</p>
                    </div>
                  </div>
                  <button
                    className="btn-danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    {t.deleteAccount}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="settings-section">
              <div className="section-header">
                <h2>{t.securitySettings}</h2>
                <p>{t.changePasswordText}</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="settings-form">
                <div className="form-group">
                  <label>{t.currentPassword}</label>
                  <div className="input-icon">
                    <FaKey />
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder={t.currentPassword}
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
                  <label>{t.newPassword}</label>
                  <div className="input-icon">
                    <FaLock />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder={t.newPassword}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <small className="form-hint">{t.passwordHint}</small>
                </div>

                <div className="form-group">
                  <label>{t.confirmNewPassword}</label>
                  <div className="input-icon">
                    <FaShieldAlt />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder={t.confirmNewPassword}
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
                        <FaSpinner className="spinner" /> {t.updating}
                      </>
                    ) : (
                      <>
                        <FaLock /> {t.changePassword}
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="security-info">
                <div className="info-card">
                  <FaShieldAlt className="info-icon" />
                  <div>
                    <h4>{t.securityTips}</h4>
                    <ul>
                      <li>{t.tip1}</li>
                      <li>{t.tip2}</li>
                      <li>{t.tip3}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="settings-section">
              <div className="section-header">
                <h2>{t.notificationPreferences}</h2>
                <p>{t.notificationText}</p>
              </div>

              <div className="notification-settings">
                <div className="notification-group">
                  <h3>{t.communicationChannels}</h3>

                  <div className="notification-option">
                    <div className="option-info">
                      <FaEnvelope />
                      <div>
                        <strong>{t.emailNotifications}</strong>
                        <p>{t.emailNotificationsText}</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={() =>
                          handleNotificationChange("emailNotifications")
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-option">
                    <div className="option-info">
                      <FaMobileAlt />
                      <div>
                        <strong>{t.pushNotifications}</strong>
                        <p>{t.pushNotificationsText}</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={() =>
                          handleNotificationChange("pushNotifications")
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-option">
                    <div className="option-info">
                      <FaPhone />
                      <div>
                        <strong>{t.smsNotifications}</strong>
                        <p>{t.smsNotificationsText}</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.smsNotifications}
                        onChange={() =>
                          handleNotificationChange("smsNotifications")
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="notification-group">
                  <h3>{t.alertTypes}</h3>

                  <div className="notification-option">
                    <div className="option-info">
                      <FaBell />
                      <div>
                        <strong>{t.announcements}</strong>
                        <p>{t.announcementsText}</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.announcementAlerts}
                        onChange={() =>
                          handleNotificationChange("announcementAlerts")
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-option">
                    <div className="option-info">
                      <FaCalendarAlt />
                      <div>
                        <strong>{t.eventReminders}</strong>
                        <p>{t.eventRemindersText}</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.eventReminders}
                        onChange={() =>
                          handleNotificationChange("eventReminders")
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-option">
                    <div className="option-info">
                      <FaCheckCircle />
                      <div>
                        <strong>{t.resultAlerts}</strong>
                        <p>{t.resultAlertsText}</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.resultAlerts}
                        onChange={() =>
                          handleNotificationChange("resultAlerts")
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-option">
                    <div className="option-info">
                      <FaClock />
                      <div>
                        <strong>{t.attendanceAlerts}</strong>
                        <p>{t.attendanceAlertsText}</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.attendanceAlerts}
                        onChange={() =>
                          handleNotificationChange("attendanceAlerts")
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-option">
                    <div className="option-info">
                      <FaMoneyBill />
                      <div>
                        <strong>{t.feeReminders}</strong>
                        <p>{t.feeRemindersText}</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.feeReminders}
                        onChange={() =>
                          handleNotificationChange("feeReminders")
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
                    onClick={handleNotificationSubmit}
                    disabled={savingNotifications}
                  >
                    {savingNotifications ? (
                      <>
                        <FaSpinner className="spinner" /> {t.saving}
                      </>
                    ) : (
                      <>
                        <FaSave /> {t.savePreferences}
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
                <h2>{t.appearanceTitle}</h2>
                <p>{t.appearanceText}</p>
              </div>

              <div className="appearance-settings">
                <div className="setting-group">
                  <label>{t.theme}</label>
                  <div className="theme-options">
                    <button
                      type="button"
                      className={`theme-option ${!darkMode ? "active" : ""}`}
                      onClick={() => handleThemeChange("light")}
                    >
                      <FaSun />
                      <span>{t.light}</span>
                    </button>

                    <button
                      type="button"
                      className={`theme-option ${darkMode ? "active" : ""}`}
                      onClick={() => handleThemeChange("dark")}
                    >
                      <FaMoon />
                      <span>{t.dark}</span>
                    </button>
                  </div>
                </div>

                <div className="setting-group">
                  <label>{t.fontSize}</label>
                  <div className="font-options">
                    <button
                      type="button"
                      className={`font-option ${
                        appearanceSettings.fontSize === "small" ? "active" : ""
                      }`}
                      onClick={() =>
                        handleAppearanceChange("fontSize", "small")
                      }
                    >
                      A<small>{t.small}</small>
                    </button>
                    <button
                      type="button"
                      className={`font-option ${
                        appearanceSettings.fontSize === "medium" ? "active" : ""
                      }`}
                      onClick={() =>
                        handleAppearanceChange("fontSize", "medium")
                      }
                    >
                      A<small>{t.medium}</small>
                    </button>
                    <button
                      type="button"
                      className={`font-option ${
                        appearanceSettings.fontSize === "large" ? "active" : ""
                      }`}
                      onClick={() =>
                        handleAppearanceChange("fontSize", "large")
                      }
                    >
                      A<small>{t.large}</small>
                    </button>
                  </div>
                </div>

                <div className="setting-group">
                  <label>{t.compactMode}</label>
                  <div className="toggle-setting">
                    <span>{t.compactModeText}</span>
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
                </div>

                <div className="setting-group">
                  <label>{t.animations}</label>
                  <div className="toggle-setting">
                    <span>{t.animationsText}</span>
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
                        <FaSpinner className="spinner" /> {t.saving}
                      </>
                    ) : (
                      <>
                        <FaSave /> {t.applyChanges}
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
                <h2>{t.languageTitle}</h2>
                <p>{t.languageText}</p>
              </div>

              <div className="language-settings">
                <div className="setting-group">
                  <label>{t.languageLabel}</label>
                  <select
                    value={languageSettings.language}
                    onChange={(e) =>
                      handleLanguageChange("language", e.target.value)
                    }
                    className="language-select"
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="ig">Igbo</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label>{t.dateFormat}</label>
                  <select
                    value={languageSettings.dateFormat}
                    onChange={(e) =>
                      handleLanguageChange("dateFormat", e.target.value)
                    }
                    className="language-select"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label>{t.timeFormat}</label>
                  <select
                    value={languageSettings.timeFormat}
                    onChange={(e) =>
                      handleLanguageChange("timeFormat", e.target.value)
                    }
                    className="language-select"
                  >
                    <option value="12h">12-hour format (2:30 PM)</option>
                    <option value="24h">24-hour format (14:30)</option>
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
                        <FaSpinner className="spinner" /> {t.saving}
                      </>
                    ) : (
                      <>
                        <FaGlobe /> {t.savePreferences}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header danger">
              <h3>
                <FaTrash /> {t.deleteAccount}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowDeleteConfirm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>{t.deleteAccountWarning}</p>
              <p className="text-danger mt-3">
                This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteAccount}
              >
                {t.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;

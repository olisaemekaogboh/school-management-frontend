// src/components/Settings.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import {
  FaUser,
  FaLock,
  FaBell,
  FaPalette,
  FaGlobe,
  FaLanguage,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaPhone,
  FaAddressCard,
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
  FaEdit,
  FaCamera,
  FaMoneyBill,
} from "react-icons/fa";
import { userAPI } from "../services/api";
import "./Settings.css";

function Settings() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    bio: "",
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    announcementAlerts: true,
    eventReminders: true,
    resultAlerts: true,
    attendanceAlerts: true,
    feeReminders: true,
  });

  // Appearance Settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "dark",
    compactMode: false,
    fontSize: "medium",
    animations: true,
  });

  // Language Settings
  const [languageSettings, setLanguageSettings] = useState({
    language: "en",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        dateOfBirth: user.dateOfBirth || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

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

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profile API call
      const response = await userAPI.updateProfile(profileForm);
      if (response.data) {
        updateUser(response.data);
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      await userAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(
        error?.response?.data?.message || "Failed to change password",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async () => {
    setLoading(true);
    try {
      // Save notification settings
      await userAPI.updateNotificationSettings(notificationSettings);
      toast.success("Notification settings saved!");
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Failed to save notification settings");
    } finally {
      setLoading(false);
    }
  };

  const handleAppearanceSubmit = async () => {
    setLoading(true);
    try {
      // Save appearance settings
      localStorage.setItem("appearance", JSON.stringify(appearanceSettings));
      document.body.className = appearanceSettings.theme;
      document.body.style.fontSize =
        appearanceSettings.fontSize === "small"
          ? "14px"
          : appearanceSettings.fontSize === "large"
            ? "18px"
            : "16px";
      toast.success("Appearance settings saved!");
    } catch (error) {
      console.error("Error saving appearance settings:", error);
      toast.error("Failed to save appearance settings");
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSubmit = async () => {
    setLoading(true);
    try {
      // Save language settings
      localStorage.setItem("language", JSON.stringify(languageSettings));
      toast.success("Language settings saved!");
    } catch (error) {
      console.error("Error saving language settings:", error);
      toast.error("Failed to save language settings");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <FaUser /> },
    { id: "security", label: "Security", icon: <FaLock /> },
    { id: "notifications", label: "Notifications", icon: <FaBell /> },
    { id: "appearance", label: "Appearance", icon: <FaPalette /> },
    { id: "language", label: "Language", icon: <FaLanguage /> },
  ];

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account preferences and settings</p>
      </div>

      <div className="settings-content">
        {/* Sidebar */}
        <div className="settings-sidebar">
          <div className="user-info-card">
            <div className="user-avatar-large">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.firstName} />
              ) : (
                <FaUserCircle />
              )}
              <button className="change-avatar-btn">
                <FaCamera />
              </button>
            </div>
            <h3>
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="user-email">{user?.email}</p>
            <p className="user-role">
              {user?.role === "ADMIN"
                ? "Administrator"
                : user?.role === "TEACHER"
                  ? "Teacher"
                  : user?.role === "STUDENT"
                    ? "Student"
                    : "Parent"}
            </p>
          </div>

          <div className="settings-tabs">
            {tabs.map((tab) => (
              <button
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

        {/* Main Content */}
        <div className="settings-main">
          {/* Profile Settings */}
          {activeTab === "profile" && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Profile Information</h2>
                <p>Update your personal information and contact details</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <div className="input-icon">
                      <FaUser />
                      <input
                        type="text"
                        name="firstName"
                        value={profileForm.firstName}
                        onChange={handleProfileChange}
                        placeholder="Enter your first name"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Last Name</label>
                    <div className="input-icon">
                      <FaUser />
                      <input
                        type="text"
                        name="lastName"
                        value={profileForm.lastName}
                        onChange={handleProfileChange}
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="input-icon">
                      <FaEnvelope />
                      <input
                        type="email"
                        name="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        placeholder="Enter your email"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <div className="input-icon">
                      <FaPhone />
                      <input
                        type="tel"
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <div className="input-icon">
                    <FaAddressCard />
                    <input
                      type="text"
                      name="address"
                      value={profileForm.address}
                      onChange={handleProfileChange}
                      placeholder="Enter your address"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth</label>
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

                  <div className="form-group">
                    <label>Bio</label>
                    <div className="input-icon">
                      <FaUser />
                      <textarea
                        name="bio"
                        value={profileForm.bio}
                        onChange={handleProfileChange}
                        placeholder="Tell us about yourself"
                        rows="3"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? (
                      <>
                        <FaSpinner className="spinner" /> Saving...
                      </>
                    ) : (
                      <>
                        <FaSave /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Security Settings</h2>
                <p>Change your password and manage security preferences</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="settings-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <div className="input-icon">
                    <FaKey />
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <div className="input-icon">
                    <FaLock />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your new password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <small className="form-hint">
                    Password must be at least 6 characters long
                  </small>
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <div className="input-icon">
                    <FaShieldAlt />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? (
                      <>
                        <FaSpinner className="spinner" /> Updating...
                      </>
                    ) : (
                      <>
                        <FaLock /> Change Password
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="security-info">
                <div className="info-card">
                  <FaShieldAlt className="info-icon" />
                  <div>
                    <h4>Security Tips</h4>
                    <ul>
                      <li>
                        Use a strong password with mix of letters, numbers, and
                        symbols
                      </li>
                      <li>Never share your password with anyone</li>
                      <li>
                        Enable two-factor authentication for extra security
                      </li>
                      <li>Regularly update your password</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Notification Preferences</h2>
                <p>Choose how you want to receive notifications</p>
              </div>

              <div className="notification-settings">
                <div className="notification-group">
                  <h3>Communication Channels</h3>
                  <div className="notification-option">
                    <div className="option-info">
                      <FaEnvelope />
                      <div>
                        <strong>Email Notifications</strong>
                        <p>Receive notifications via email</p>
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
                        <strong>Push Notifications</strong>
                        <p>Receive push notifications in browser</p>
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
                        <strong>SMS Notifications</strong>
                        <p>Receive notifications via SMS</p>
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
                  <h3>Alert Types</h3>
                  <div className="notification-option">
                    <div className="option-info">
                      <FaBell />
                      <div>
                        <strong>Announcements</strong>
                        <p>School announcements and news</p>
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
                        <strong>Event Reminders</strong>
                        <p>Upcoming school events and activities</p>
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
                        <strong>Results & Grades</strong>
                        <p>When results and grades are published</p>
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
                        <strong>Attendance Alerts</strong>
                        <p>When attendance is recorded</p>
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
                        <strong>Fee Reminders</strong>
                        <p>When fees are due or paid</p>
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
                    className="btn-save"
                    onClick={handleNotificationSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="spinner" /> Saving...
                      </>
                    ) : (
                      <>
                        <FaSave /> Save Preferences
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === "appearance" && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Appearance</h2>
                <p>Customize how the application looks</p>
              </div>

              <div className="appearance-settings">
                <div className="setting-group">
                  <label>Theme</label>
                  <div className="theme-options">
                    <button
                      className={`theme-option ${appearanceSettings.theme === "light" ? "active" : ""}`}
                      onClick={() => handleAppearanceChange("theme", "light")}
                    >
                      <FaSun />
                      <span>Light</span>
                    </button>
                    <button
                      className={`theme-option ${appearanceSettings.theme === "dark" ? "active" : ""}`}
                      onClick={() => handleAppearanceChange("theme", "dark")}
                    >
                      <FaMoon />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>

                <div className="setting-group">
                  <label>Font Size</label>
                  <div className="font-options">
                    <button
                      className={`font-option ${appearanceSettings.fontSize === "small" ? "active" : ""}`}
                      onClick={() =>
                        handleAppearanceChange("fontSize", "small")
                      }
                    >
                      A<small>Small</small>
                    </button>
                    <button
                      className={`font-option ${appearanceSettings.fontSize === "medium" ? "active" : ""}`}
                      onClick={() =>
                        handleAppearanceChange("fontSize", "medium")
                      }
                    >
                      A<small>Medium</small>
                    </button>
                    <button
                      className={`font-option ${appearanceSettings.fontSize === "large" ? "active" : ""}`}
                      onClick={() =>
                        handleAppearanceChange("fontSize", "large")
                      }
                    >
                      A<small>Large</small>
                    </button>
                  </div>
                </div>

                <div className="setting-group">
                  <label>Compact Mode</label>
                  <div className="toggle-setting">
                    <span>Reduce spacing and make UI more compact</span>
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
                  <label>Animations</label>
                  <div className="toggle-setting">
                    <span>Enable smooth animations throughout the app</span>
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
                    className="btn-save"
                    onClick={handleAppearanceSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="spinner" /> Saving...
                      </>
                    ) : (
                      <>
                        <FaSave /> Apply Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Language Settings */}
          {activeTab === "language" && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Language & Region</h2>
                <p>Set your language and regional preferences</p>
              </div>

              <div className="language-settings">
                <div className="setting-group">
                  <label>Language</label>
                  <select
                    value={languageSettings.language}
                    onChange={(e) =>
                      handleLanguageChange("language", e.target.value)
                    }
                    className="language-select"
                  >
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                    <option value="pt">Portuguese</option>
                    <option value="ar">Arabic</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label>Date Format</label>
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
                  <label>Time Format</label>
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
                    className="btn-save"
                    onClick={handleLanguageSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="spinner" /> Saving...
                      </>
                    ) : (
                      <>
                        <FaGlobe /> Save Preferences
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;

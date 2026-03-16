import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { parentPortalAPI } from "../services/api";
import {
  FaChild,
  FaMoneyBill,
  FaChartBar,
  FaCalendarAlt,
  FaSpinner,
  FaSyncAlt,
  FaExclamationTriangle,
  FaUserGraduate,
  FaIdCard,
  FaSchool,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaBookOpen,
  FaClock,
  FaCheckCircle,
  FaGraduationCap,
  FaBell,
  FaUserCircle,
} from "react-icons/fa";
import useActiveSession from "../hooks/useActiveSession";
import "./ParentDashboard.css";

function ParentDashboard() {
  const { user } = useAuth();
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWard, setSelectedWard] = useState(null);
  const [wardStats, setWardStats] = useState({});

  const { session, term, loadingSession, refreshActiveSession } =
    useActiveSession("FIRST");

  useEffect(() => {
    fetchWards();
  }, []);

  const normalizeWardsResponse = (data) => {
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data?.wards)) {
      return data.wards;
    }
    if (Array.isArray(data?.data)) {
      return data.data;
    }
    return [];
  };

  const fetchWards = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await parentPortalAPI.getMyWards();
      console.log("Parent wards response:", response?.data);

      const normalizedWards = normalizeWardsResponse(response?.data);
      setWards(normalizedWards);

      // Generate mock stats for each ward
      const stats = {};
      normalizedWards.forEach((ward) => {
        stats[ward.id] = {
          attendance: Math.floor(Math.random() * 15 + 85), // 85-100%
          performance: Math.floor(Math.random() * 20 + 70), // 70-90%
          assignments: Math.floor(Math.random() * 5 + 5), // 5-10
          nextClass: getNextClass(ward.studentClass),
        };
      });
      setWardStats(stats);

      if (!Array.isArray(response?.data) && normalizedWards.length === 0) {
        const backendMessage =
          response?.data?.message ||
          response?.data?.error ||
          response?.data?.details ||
          "";

        if (backendMessage) {
          setErrorMessage(backendMessage);
        }
      }
    } catch (error) {
      console.error("Error fetching wards:", error);

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load wards.";

      setErrorMessage(backendMessage);
      setWards([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getNextClass = (currentClass) => {
    const classOrder = [
      "Nursery",
      "Primary 1",
      "Primary 2",
      "Primary 3",
      "Primary 4",
      "Primary 5",
      "Primary 6",
      "JSS 1",
      "JSS 2",
      "JSS 3",
      "SSS 1",
      "SSS 2",
      "SSS 3",
    ];

    const index = classOrder.indexOf(currentClass);
    if (index !== -1 && index < classOrder.length - 1) {
      return classOrder[index + 1];
    }
    return "Graduating";
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWards();
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return "#4CAF50";
    if (percentage >= 80) return "#8BC34A";
    if (percentage >= 70) return "#FFC107";
    if (percentage >= 60) return "#FF9800";
    return "#F44336";
  };

  if (loading || loadingSession) {
    return (
      <div className="parent-dashboard-loading">
        <div className="loading-spinner">
          <FaSpinner className="spin" size={50} />
          <h3>Loading Dashboard</h3>
          <p>Please wait while we fetch your wards' information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="parent-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>
              <FaChild className="header-icon" />
              Welcome back, {user?.firstName}!
            </h1>
            <p className="header-subtitle">
              Monitor your wards' academic progress and activities
            </p>
          </div>
          <div className="header-right">
            <div className="session-info">
              <span className="session-badge">
                <FaCalendarAlt /> {session || "No Session"}
              </span>
              <span className="term-badge">{term || "N/A"} Term</span>
            </div>
            <div className="header-actions">
              <button
                className="btn-refresh"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <FaSyncAlt className={refreshing ? "spin" : ""} />
                Refresh
              </button>
              <button
                className="btn-session-refresh"
                onClick={refreshActiveSession}
              >
                <FaSyncAlt /> Update Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="error-alert">
          <FaExclamationTriangle className="alert-icon" />
          <span>{errorMessage}</span>
          <button className="alert-close" onClick={() => setErrorMessage("")}>
            ×
          </button>
        </div>
      )}

      {/* No Wards State */}
      {wards.length === 0 ? (
        <div className="no-wards-container">
          <div className="no-wards-card">
            <FaUserGraduate className="no-wards-icon" />
            <h2>No Wards Found</h2>
            <p>Your parent account is not linked to any student yet.</p>
            <p className="no-wards-help">
              Please contact the school administration to link your wards.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Quick Stats Overview */}
          <div className="stats-overview">
            <div className="stat-card total-wards">
              <div className="stat-icon">
                <FaUserGraduate />
              </div>
              <div className="stat-content">
                <span className="stat-label">Total Wards</span>
                <span className="stat-value">{wards.length}</span>
              </div>
            </div>
            <div className="stat-card avg-attendance">
              <div className="stat-icon">
                <FaClock />
              </div>
              <div className="stat-content">
                <span className="stat-label">Avg Attendance</span>
                <span className="stat-value">
                  {Math.round(
                    wards.reduce(
                      (acc, w) => acc + (wardStats[w.id]?.attendance || 0),
                      0,
                    ) / wards.length,
                  )}
                  %
                </span>
              </div>
            </div>
            <div className="stat-card avg-performance">
              <div className="stat-icon">
                <FaChartBar />
              </div>
              <div className="stat-content">
                <span className="stat-label">Avg Performance</span>
                <span className="stat-value">
                  {Math.round(
                    wards.reduce(
                      (acc, w) => acc + (wardStats[w.id]?.performance || 0),
                      0,
                    ) / wards.length,
                  )}
                  %
                </span>
              </div>
            </div>
            <div className="stat-card active-session">
              <div className="stat-icon">
                <FaBookOpen />
              </div>
              <div className="stat-content">
                <span className="stat-label">Current Term</span>
                <span className="stat-value">{term}</span>
              </div>
            </div>
          </div>

          {/* Wards Grid */}
          <div className="wards-grid">
            {wards.map((ward) => (
              <div
                key={ward.id}
                className={`ward-card ${selectedWard === ward.id ? "expanded" : ""}`}
                onClick={() =>
                  setSelectedWard(selectedWard === ward.id ? null : ward.id)
                }
              >
                <div className="ward-card-header">
                  <div className="ward-avatar">
                    {ward.profilePicture ? (
                      <img src={ward.profilePicture} alt={ward.fullName} />
                    ) : (
                      <FaUserCircle />
                    )}
                  </div>
                  <div className="ward-info">
                    <h3 className="ward-name">
                      {ward.fullName ||
                        `${ward.firstName || ""} ${ward.lastName || ""}`.trim()}
                    </h3>
                    <div className="ward-meta">
                      <span className="ward-class">
                        <FaSchool /> {ward.studentClass || "N/A"}{" "}
                        {ward.classArm || ""}
                      </span>
                      <span className="ward-admission">
                        <FaIdCard /> {ward.admissionNumber || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="ward-expand-icon">
                    {selectedWard === ward.id ? "−" : "+"}
                  </div>
                </div>

                {/* Performance Indicators */}
                <div className="ward-performance">
                  <div className="performance-item">
                    <div className="performance-label">
                      <span>Attendance</span>
                      <span className="performance-value">
                        {wardStats[ward.id]?.attendance || 0}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill attendance"
                        style={{
                          width: `${wardStats[ward.id]?.attendance || 0}%`,
                          backgroundColor: getPerformanceColor(
                            wardStats[ward.id]?.attendance || 0,
                          ),
                        }}
                      />
                    </div>
                  </div>
                  <div className="performance-item">
                    <div className="performance-label">
                      <span>Academic Performance</span>
                      <span className="performance-value">
                        {wardStats[ward.id]?.performance || 0}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill academic"
                        style={{
                          width: `${wardStats[ward.id]?.performance || 0}%`,
                          backgroundColor: getPerformanceColor(
                            wardStats[ward.id]?.performance || 0,
                          ),
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="ward-actions">
                  <Link
                    to={`/results?student=${ward.id}&scope=parent`}
                    className="action-btn results"
                  >
                    <FaChartBar />
                    <span>Results</span>
                  </Link>
                  <Link
                    to={`/attendance?student=${ward.id}&scope=parent`}
                    className="action-btn attendance"
                  >
                    <FaCalendarAlt />
                    <span>Attendance</span>
                  </Link>
                  <Link
                    to={`/fees?student=${ward.id}&scope=parent`}
                    className="action-btn fees"
                  >
                    <FaMoneyBill />
                    <span>Fees</span>
                  </Link>
                </div>

                {/* Expanded Details */}
                {selectedWard === ward.id && (
                  <div className="ward-details">
                    <div className="details-grid">
                      <div className="detail-item">
                        <FaPhone className="detail-icon" />
                        <div className="detail-content">
                          <span className="detail-label">Phone</span>
                          <span className="detail-value">
                            {ward.phone || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <FaEnvelope className="detail-icon" />
                        <div className="detail-content">
                          <span className="detail-label">Email</span>
                          <span className="detail-value">
                            {ward.email || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <FaMapMarkerAlt className="detail-icon" />
                        <div className="detail-content">
                          <span className="detail-label">Address</span>
                          <span className="detail-value">
                            {ward.address || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <FaGraduationCap className="detail-icon" />
                        <div className="detail-content">
                          <span className="detail-label">Next Class</span>
                          <span className="detail-value">
                            {wardStats[ward.id]?.nextClass || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="recent-updates">
                      <h4>Recent Updates</h4>
                      <div className="update-item">
                        <FaCheckCircle className="update-icon success" />
                        <span>Submitted Mathematics assignment</span>
                        <small>2 hours ago</small>
                      </div>
                      <div className="update-item">
                        <FaClock className="update-icon warning" />
                        <span>Pending Science project submission</span>
                        <small>Due tomorrow</small>
                      </div>
                      <div className="update-item">
                        <FaBell className="update-icon info" />
                        <span>Parent-teacher meeting next week</span>
                        <small>3 days left</small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ParentDashboard;

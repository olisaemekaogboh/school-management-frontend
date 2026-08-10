import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { parentPortalAPI } from "../services/api";
import {
  FaChild,
  FaMoneyBill,
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
  FaUsers,
  FaArrowRight,
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
    if (!loadingSession) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingSession, session, term]);

  const normalizeWardsResponse = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.wards)) return data.wards;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const getApiMessage = (error, fallback = "") =>
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback;

  const getWardFullName = (ward) => {
    return (
      ward?.fullName ||
      ward?.studentName ||
      `${ward?.firstName || ""} ${ward?.middleName || ""} ${ward?.lastName || ""}`
        .replace(/\s+/g, " ")
        .trim()
    );
  };

  const getWardClassName = (ward) => {
    const className =
      ward?.studentClass ||
      ward?.className ||
      ward?.class ||
      ward?.schoolClass?.className ||
      "";

    const arm = ward?.classArm || ward?.arm || ward?.schoolClass?.arm || "";

    const combined = `${className} ${arm}`.replace(/\s+/g, " ").trim();
    return combined || "N/A";
  };

  const normalizeImageUrl = (url) => {
    if (!url) return "";

    const trimmed = String(url).trim();
    if (!trimmed) return "";

    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("data:")
    ) {
      return trimmed;
    }

    const apiBase =
      process.env.REACT_APP_API_BASE_URL || "https://localhost:8443/api";
    const origin = apiBase.replace(/\/api\/?$/, "");

    if (trimmed.startsWith("/")) {
      return `${origin}${trimmed}`;
    }

    return `${origin}/${trimmed}`;
  };

  const getWardProfilePicture = (ward) => {
    return normalizeImageUrl(
      ward?.profilePictureUrl ||
        ward?.profilePicture ||
        ward?.avatar ||
        ward?.studentProfilePictureUrl ||
        ward?.studentPhoto ||
        "",
    );
  };

  const normalizeAttendanceSummary = (data, ward) => {
    return {
      attendance: Number(data?.attendancePercentage || 0),
      totalSchoolDays: Number(data?.totalSchoolDays || 0),
      daysPresent: Number(data?.daysPresent || 0),
      daysAbsent: Number(data?.daysAbsent || 0),
      daysLate: Number(data?.daysLate || 0),
      daysExcused: Number(data?.daysExcused || 0),
      session: data?.session || session || "",
      term: data?.term || term || "",
      nextClass: getNextClass(
        ward?.studentClass ||
          ward?.className ||
          ward?.class ||
          ward?.schoolClass?.className,
      ),
    };
  };

  const normalizeFees = (data) => {
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.fees)
        ? data.fees
        : [];
    const total = list.reduce(
      (acc, item) => acc + Number(item?.amount || 0),
      0,
    );
    const paid = list.reduce(
      (acc, item) => acc + Number(item?.paidAmount || 0),
      0,
    );
    const balance = list.reduce(
      (acc, item) => acc + Number(item?.balance || 0),
      0,
    );

    return {
      total,
      paid,
      balance,
      count: list.length,
      fees: list,
    };
  };

  const getNextClass = (currentClass) => {
    const normalized = String(currentClass || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " ");

    const aliases = {
      "SS 1": "SSS 1",
      "SS 2": "SSS 2",
      "SS 3": "SSS 3",
      SS1: "SSS 1",
      SS2: "SSS 2",
      SS3: "SSS 3",
      SSS1: "SSS 1",
      SSS2: "SSS 2",
      SSS3: "SSS 3",
      JSS1: "JSS 1",
      JSS2: "JSS 2",
      JSS3: "JSS 3",
      PRIMARY1: "PRIMARY 1",
      PRIMARY2: "PRIMARY 2",
      PRIMARY3: "PRIMARY 3",
      PRIMARY4: "PRIMARY 4",
      PRIMARY5: "PRIMARY 5",
      PRIMARY6: "PRIMARY 6",
    };

    const resolved = aliases[normalized.replace(/\s+/g, "")] || normalized;

    const classOrder = [
      "NURSERY",
      "PRIMARY 1",
      "PRIMARY 2",
      "PRIMARY 3",
      "PRIMARY 4",
      "PRIMARY 5",
      "PRIMARY 6",
      "JSS 1",
      "JSS 2",
      "JSS 3",
      "SSS 1",
      "SSS 2",
      "SSS 3",
    ];

    const index = classOrder.findIndex((c) => c === resolved);

    if (index !== -1 && index < classOrder.length - 1) {
      return classOrder[index + 1];
    }
    return "Graduating";
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await parentPortalAPI.getMyWards();
      const normalizedWards = normalizeWardsResponse(response?.data);

      setWards(normalizedWards);

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

      const statsEntries = await Promise.all(
        normalizedWards.map(async (ward) => {
          const wardId = ward?.id;
          const stats = {
            attendance: 0,
            totalSchoolDays: 0,
            daysPresent: 0,
            daysAbsent: 0,
            daysLate: 0,
            daysExcused: 0,
            feeTotal: 0,
            feePaid: 0,
            feeBalance: 0,
            feeCount: 0,
            nextClass: getNextClass(
              ward?.studentClass ||
                ward?.className ||
                ward?.class ||
                ward?.schoolClass?.className,
            ),
          };

          if (!wardId) {
            return [String(Math.random()), stats];
          }

          const [attendanceRes, feesRes] = await Promise.allSettled([
            parentPortalAPI.getWardAttendance(wardId, session, term),
            parentPortalAPI.getWardFees
              ? parentPortalAPI.getWardFees(wardId, session, term)
              : Promise.resolve({ data: [] }),
          ]);

          if (attendanceRes.status === "fulfilled") {
            Object.assign(
              stats,
              normalizeAttendanceSummary(attendanceRes.value?.data, ward),
            );
          }

          if (feesRes.status === "fulfilled") {
            const feeSummary = normalizeFees(feesRes.value?.data);
            stats.feeTotal = feeSummary.total;
            stats.feePaid = feeSummary.paid;
            stats.feeBalance = feeSummary.balance;
            stats.feeCount = feeSummary.count;
          }

          return [wardId, stats];
        }),
      );

      setWardStats(Object.fromEntries(statsEntries));
    } catch (error) {
      console.error("Error fetching wards:", error);

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load wards.";

      setErrorMessage(backendMessage);
      setWards([]);
      setWardStats({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return "#22c55e";
    if (percentage >= 80) return "#84cc16";
    if (percentage >= 70) return "#f59e0b";
    if (percentage >= 60) return "#f97316";
    return "#ef4444";
  };

  const overviewStats = useMemo(() => {
    if (!wards.length) {
      return {
        avgAttendance: 0,
        totalOutstanding: 0,
        totalPaid: 0,
        totalSchoolDays: 0,
      };
    }

    const avgAttendance =
      wards.reduce(
        (acc, ward) => acc + Number(wardStats[ward.id]?.attendance || 0),
        0,
      ) / wards.length;

    const totalOutstanding = wards.reduce(
      (acc, ward) => acc + Number(wardStats[ward.id]?.feeBalance || 0),
      0,
    );

    const totalPaid = wards.reduce(
      (acc, ward) => acc + Number(wardStats[ward.id]?.feePaid || 0),
      0,
    );

    const totalSchoolDays = wards.reduce(
      (acc, ward) => acc + Number(wardStats[ward.id]?.totalSchoolDays || 0),
      0,
    );

    return {
      avgAttendance: Math.round(avgAttendance),
      totalOutstanding,
      totalPaid,
      totalSchoolDays,
    };
  }, [wards, wardStats]);

  if (loading || loadingSession) {
    return (
      <div className="parent-dashboard-loading">
        <div className="loading-spinner">
          <FaSpinner className="spin" size={50} />
          <h3>Loading Dashboard</h3>
          <p>Please wait while we fetch your wards&apos; information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="parent-dashboard modern-parent-dashboard">
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <FaUsers />
              Parent Portal
            </div>
            <h1>
              <FaChild className="header-icon" />
              Welcome back, {user?.firstName || "Parent"}!
            </h1>
            <p>
              Monitor your wards, track attendance, review fees, and keep up
              with the current school session.
            </p>
          </div>

          <div className="hero-meta">
            <div className="session-chip">
              <FaCalendarAlt />
              <span>{session || "No Session"}</span>
            </div>
            <div className="term-chip">{term || "N/A"} Term</div>
            <div className="hero-actions">
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
                <FaSyncAlt />
                Update Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="error-alert">
          <FaExclamationTriangle className="alert-icon" />
          <span>{errorMessage}</span>
          <button className="alert-close" onClick={() => setErrorMessage("")}>
            ×
          </button>
        </div>
      )}

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
          <div className="stats-overview redesigned-overview">
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
                <span className="stat-label">Average Attendance</span>
                <span className="stat-value">
                  {overviewStats.avgAttendance}%
                </span>
              </div>
            </div>

            <div className="stat-card fees-paid">
              <div className="stat-icon">
                <FaCheckCircle />
              </div>
              <div className="stat-content">
                <span className="stat-label">Total Fees Paid</span>
                <span className="stat-value">
                  ₦{overviewStats.totalPaid.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="stat-card outstanding-fees">
              <div className="stat-icon">
                <FaMoneyBill />
              </div>
              <div className="stat-content">
                <span className="stat-label">Outstanding Fees</span>
                <span className="stat-value">
                  ₦{overviewStats.totalOutstanding.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="dashboard-section-header">
            <h2>Your Wards</h2>
            <p>Click any card to see more details.</p>
          </div>

          <div className="wards-grid redesigned-wards-grid">
            {wards.map((ward) => {
              const stats = wardStats[ward.id] || {};

              return (
                <div
                  key={ward.id}
                  className={`ward-card redesigned-ward-card ${
                    selectedWard === ward.id ? "expanded" : ""
                  }`}
                  onClick={() =>
                    setSelectedWard(selectedWard === ward.id ? null : ward.id)
                  }
                >
                  <div className="ward-card-header">
                    <div className="ward-avatar">
                      {getWardProfilePicture(ward) ? (
                        <img
                          src={getWardProfilePicture(ward)}
                          alt={getWardFullName(ward)}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback =
                              e.currentTarget.parentElement?.querySelector(
                                ".avatar-fallback-icon",
                              );
                            if (fallback) fallback.style.display = "block";
                          }}
                        />
                      ) : null}
                      <FaUserCircle
                        className="avatar-fallback-icon"
                        style={{
                          display: getWardProfilePicture(ward)
                            ? "none"
                            : "block",
                        }}
                      />
                    </div>

                    <div className="ward-info">
                      <h3 className="ward-name">{getWardFullName(ward)}</h3>
                      <div className="ward-meta">
                        <span className="ward-class">
                          <FaSchool /> {getWardClassName(ward)}
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

                  <div className="ward-quick-metrics">
                    <div className="quick-metric">
                      <span className="quick-metric-label">Attendance</span>
                      <strong>
                        {Number(stats.attendance || 0).toFixed(1)}%
                      </strong>
                    </div>
                    <div className="quick-metric">
                      <span className="quick-metric-label">Fees Due</span>
                      <strong>
                        ₦{Number(stats.feeBalance || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div className="quick-metric">
                      <span className="quick-metric-label">Next Class</span>
                      <strong>{stats.nextClass || "N/A"}</strong>
                    </div>
                  </div>

                  <div className="ward-performance">
                    <div className="performance-item">
                      <div className="performance-label">
                        <span>Attendance Progress</span>
                        <span className="performance-value">
                          {Number(stats.attendance || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill attendance"
                          style={{
                            width: `${Math.min(
                              Number(stats.attendance || 0),
                              100,
                            )}%`,
                            backgroundColor: getPerformanceColor(
                              stats.attendance || 0,
                            ),
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="ward-actions redesigned-actions">
                    <Link
                      to={`/attendance?student=${ward.id}&scope=parent`}
                      className="action-btn attendance"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaCalendarAlt />
                      <span>Attendance</span>
                    </Link>

                    <Link
                      to={`/fees?student=${ward.id}&scope=parent`}
                      className="action-btn fees"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaMoneyBill />
                      <span>Fees</span>
                    </Link>
                  </div>

                  {selectedWard === ward.id && (
                    <div className="ward-details redesigned-details">
                      <div className="details-grid">
                        <div className="detail-item">
                          <FaPhone className="detail-icon" />
                          <div className="detail-content">
                            <span className="detail-label">Phone</span>
                            <span className="detail-value">
                              {ward.phone ||
                                ward.phoneNumber ||
                                ward.parentPhone ||
                                "N/A"}
                            </span>
                          </div>
                        </div>

                        <div className="detail-item">
                          <FaEnvelope className="detail-icon" />
                          <div className="detail-content">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">
                              {ward.email || ward.parentEmail || "N/A"}
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
                              {stats.nextClass || "N/A"}
                            </span>
                          </div>
                        </div>

                        <div className="detail-item">
                          <FaBookOpen className="detail-icon" />
                          <div className="detail-content">
                            <span className="detail-label">School Days</span>
                            <span className="detail-value">
                              {stats.totalSchoolDays || 0}
                            </span>
                          </div>
                        </div>

                        <div className="detail-item">
                          <FaCheckCircle className="detail-icon" />
                          <div className="detail-content">
                            <span className="detail-label">Present</span>
                            <span className="detail-value">
                              {stats.daysPresent || 0}
                            </span>
                          </div>
                        </div>

                        <div className="detail-item">
                          <FaExclamationTriangle className="detail-icon" />
                          <div className="detail-content">
                            <span className="detail-label">Absent</span>
                            <span className="detail-value">
                              {stats.daysAbsent || 0}
                            </span>
                          </div>
                        </div>

                        <div className="detail-item">
                          <FaMoneyBill className="detail-icon" />
                          <div className="detail-content">
                            <span className="detail-label">Fees Paid</span>
                            <span className="detail-value">
                              ₦{Number(stats.feePaid || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="detail-item">
                          <FaBell className="detail-icon" />
                          <div className="detail-content">
                            <span className="detail-label">Fees Count</span>
                            <span className="detail-value">
                              {stats.feeCount || 0}
                            </span>
                          </div>
                        </div>

                        <div className="detail-item">
                          <FaMoneyBill className="detail-icon" />
                          <div className="detail-content">
                            <span className="detail-label">
                              Outstanding Fees
                            </span>
                            <span className="detail-value">
                              ₦{Number(stats.feeBalance || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="recent-updates">
                        <h4>Current Summary</h4>

                        <div className="update-item">
                          <FaCheckCircle className="update-icon success" />
                          <span>
                            Attendance:{" "}
                            {Number(stats.attendance || 0).toFixed(1)}%
                          </span>
                          <small>
                            Present: {stats.daysPresent || 0} /{" "}
                            {stats.totalSchoolDays || 0}
                          </small>
                        </div>

                        <div className="update-item">
                          <FaBell className="update-icon warning" />
                          <span>Fee Items: {stats.feeCount || 0}</span>
                          <small>
                            Outstanding: ₦
                            {Number(stats.feeBalance || 0).toLocaleString()}
                          </small>
                        </div>

                        <div className="update-item">
                          <FaArrowRight className="update-icon info" />
                          <span>Promotion Path</span>
                          <small>{stats.nextClass || "N/A"}</small>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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

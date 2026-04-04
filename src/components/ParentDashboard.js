import React, { useEffect, useMemo, useState } from "react";
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
  FaLock,
  FaInfoCircle,
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

  const normalizeVisibilityStatus = (value) => {
    if (!value) return null;
    return String(value).trim().toUpperCase();
  };

  const normalizeTermResultMeta = (data) => {
    return {
      visibilityStatus: normalizeVisibilityStatus(
        data?.visibilityStatus || data?.resultVisibilityStatus,
      ),
      visibilityMessage: data?.visibilityMessage || data?.message || "",
      printable: data?.printable === true,
      printLockMessage: data?.printLockMessage || "",
      completed: data?.completed === true,
    };
  };

  const normalizeSessionResult = (data) => {
    return {
      annualAverage: Number(
        data?.annualAverage ??
          data?.annualSummary?.annualAverage ??
          data?.average ??
          0,
      ),
      annualTotal: Number(
        data?.annualTotal ?? data?.annualSummary?.annualTotal ?? 0,
      ),
      attendancePercentage: Number(data?.attendancePercentage || 0),
      promoted:
        typeof data?.promoted === "boolean"
          ? data.promoted
          : data?.promotion?.promoted || false,
      promotionRemark: data?.promotionRemark || data?.promotion?.remark || "",
      firstTermAverage: Number(data?.firstTermAverage || 0),
      secondTermAverage: Number(data?.secondTermAverage || 0),
      thirdTermAverage: Number(data?.thirdTermAverage || 0),
      visibilityStatus: normalizeVisibilityStatus(
        data?.resultVisibilityStatus || data?.visibilityStatus,
      ),
      visibilityMessage: data?.visibilityMessage || data?.message || "",
      printable: data?.printable === true,
      printLockMessage: data?.printLockMessage || "",
    };
  };

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
            annualAverage: 0,
            annualTotal: 0,
            promoted: false,
            promotionRemark: "",
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
            termResultVisibilityStatus: null,
            termResultVisibilityMessage: "",
            termResultPrintable: false,
            termResultPrintLockMessage: "",
            sessionResultVisibilityStatus: null,
            sessionResultVisibilityMessage: "",
            sessionResultPrintable: false,
            sessionResultPrintLockMessage: "",
          };

          if (!wardId) {
            return [String(Math.random()), stats];
          }

          try {
            const attendanceRes = await parentPortalAPI.getWardAttendance(
              wardId,
              session,
              term,
            );
            Object.assign(
              stats,
              normalizeAttendanceSummary(attendanceRes?.data, ward),
            );
          } catch (error) {
            console.error(`Attendance load failed for ward ${wardId}`, error);
          }

          try {
            const sessionResultRes = await parentPortalAPI.getWardSessionResult(
              wardId,
              session,
            );
            const normalized = normalizeSessionResult(sessionResultRes?.data);
            Object.assign(stats, normalized);
          } catch (error) {
            console.error(
              `Session result load failed for ward ${wardId}`,
              error,
            );
          }

          try {
            const termResultRes = await parentPortalAPI.getWardTermResult(
              wardId,
              session,
              term,
            );
            const meta = normalizeTermResultMeta(termResultRes?.data);
            stats.termResultVisibilityStatus = meta.visibilityStatus;
            stats.termResultVisibilityMessage = meta.visibilityMessage;
            stats.termResultPrintable = meta.printable;
            stats.termResultPrintLockMessage = meta.printLockMessage;
          } catch (error) {
            const message = getApiMessage(error, "");
            if (
              error?.response?.status !== 403 &&
              error?.response?.status !== 404
            ) {
              console.error(
                `Term result load failed for ward ${wardId}`,
                error,
              );
            }
            if (message) {
              stats.termResultVisibilityMessage = message;
              stats.termResultPrintLockMessage = message;
            }
          }

          try {
            if (parentPortalAPI.getWardFees) {
              const feesRes = await parentPortalAPI.getWardFees(
                wardId,
                session,
                term,
              );
              const feeSummary = normalizeFees(feesRes?.data);
              stats.feeTotal = feeSummary.total;
              stats.feePaid = feeSummary.paid;
              stats.feeBalance = feeSummary.balance;
              stats.feeCount = feeSummary.count;
            }
          } catch (error) {
            console.error(`Fees load failed for ward ${wardId}`, error);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return "#4CAF50";
    if (percentage >= 80) return "#8BC34A";
    if (percentage >= 70) return "#FFC107";
    if (percentage >= 60) return "#FF9800";
    return "#F44336";
  };

  const getResultStatusMeta = (stats) => {
    const termStatus = stats?.termResultVisibilityStatus;
    const sessionStatus = stats?.sessionResultVisibilityStatus;

    const termVisible =
      termStatus === "PUBLISHED" || termStatus === "PRINTABLE";
    const sessionVisible =
      sessionStatus === "PUBLISHED" || sessionStatus === "PRINTABLE";

    const termPrintable =
      termStatus === "PRINTABLE" && stats?.termResultPrintable === true;
    const sessionPrintable =
      sessionStatus === "PRINTABLE" && stats?.sessionResultPrintable === true;

    return {
      termVisible,
      termPrintable,
      sessionVisible,
      sessionPrintable,
      termMessage:
        stats?.termResultPrintLockMessage ||
        stats?.termResultVisibilityMessage ||
        "Term result is not available yet.",
      sessionMessage:
        stats?.sessionResultPrintLockMessage ||
        stats?.sessionResultVisibilityMessage ||
        "Session result is not available yet.",
    };
  };

  const overviewStats = useMemo(() => {
    if (!wards.length) {
      return {
        avgAttendance: 0,
        avgPerformance: 0,
        totalOutstanding: 0,
      };
    }

    const avgAttendance =
      wards.reduce(
        (acc, ward) => acc + Number(wardStats[ward.id]?.attendance || 0),
        0,
      ) / wards.length;

    const avgPerformance =
      wards.reduce(
        (acc, ward) => acc + Number(wardStats[ward.id]?.annualAverage || 0),
        0,
      ) / wards.length;

    const totalOutstanding = wards.reduce(
      (acc, ward) => acc + Number(wardStats[ward.id]?.feeBalance || 0),
      0,
    );

    return {
      avgAttendance: Math.round(avgAttendance),
      avgPerformance: Math.round(avgPerformance),
      totalOutstanding,
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
    <div className="parent-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>
              <FaChild className="header-icon" />
              Welcome back, {user?.firstName}!
            </h1>
            <p className="header-subtitle">
              Monitor your wards&apos; academic progress and activities
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
                  {overviewStats.avgAttendance}%
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
                  {overviewStats.avgPerformance}%
                </span>
              </div>
            </div>

            <div className="stat-card active-session">
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

          <div className="wards-grid">
            {wards.map((ward) => {
              const stats = wardStats[ward.id] || {};
              const resultMeta = getResultStatusMeta(stats);

              return (
                <div
                  key={ward.id}
                  className={`ward-card ${selectedWard === ward.id ? "expanded" : ""}`}
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

                  <div className="ward-performance">
                    <div className="performance-item">
                      <div className="performance-label">
                        <span>Attendance</span>
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

                    <div className="performance-item">
                      <div className="performance-label">
                        <span>Academic Performance</span>
                        <span className="performance-value">
                          {Number(stats.annualAverage || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill academic"
                          style={{
                            width: `${Math.min(
                              Number(stats.annualAverage || 0),
                              100,
                            )}%`,
                            backgroundColor: getPerformanceColor(
                              stats.annualAverage || 0,
                            ),
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="ward-actions">
                    <Link
                      to={`/results?student=${ward.id}&scope=parent`}
                      className={`action-btn results ${
                        resultMeta.termVisible ? "" : "disabled"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!resultMeta.termVisible) {
                          e.preventDefault();
                        }
                      }}
                      title={
                        resultMeta.termVisible
                          ? "View term result"
                          : resultMeta.termMessage
                      }
                      aria-disabled={!resultMeta.termVisible}
                    >
                      {resultMeta.termVisible ? <FaChartBar /> : <FaLock />}
                      <span>Results</span>
                    </Link>

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
                    <div className="ward-details">
                      {(resultMeta.termMessage ||
                        resultMeta.sessionMessage) && (
                        <div className="recent-updates mb-3">
                          <h4>Result Access Status</h4>

                          <div className="update-item">
                            {resultMeta.termVisible ? (
                              <FaInfoCircle className="update-icon info" />
                            ) : (
                              <FaLock className="update-icon warning" />
                            )}
                            <span>
                              Term Result:{" "}
                              {resultMeta.termVisible
                                ? resultMeta.termPrintable
                                  ? "Available and printable"
                                  : "Available for viewing"
                                : "Locked"}
                            </span>
                            <small>{resultMeta.termMessage}</small>
                          </div>

                          <div className="update-item">
                            {resultMeta.sessionVisible ? (
                              <FaInfoCircle className="update-icon info" />
                            ) : (
                              <FaLock className="update-icon warning" />
                            )}
                            <span>
                              Session Result:{" "}
                              {resultMeta.sessionVisible
                                ? resultMeta.sessionPrintable
                                  ? "Available and printable"
                                  : "Available for viewing"
                                : "Locked"}
                            </span>
                            <small>{resultMeta.sessionMessage}</small>
                          </div>
                        </div>
                      )}

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
                            <span className="detail-label">Annual Total</span>
                            <span className="detail-value">
                              {Number(stats.annualTotal || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="detail-item">
                          <FaCheckCircle className="detail-icon" />
                          <div className="detail-content">
                            <span className="detail-label">Promotion</span>
                            <span className="detail-value">
                              {stats.promoted ? "Promoted" : "Retained"}
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
                          <FaExclamationTriangle className="detail-icon" />
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
                          <FaChartBar className="update-icon info" />
                          <span>
                            Annual Average:{" "}
                            {Number(stats.annualAverage || 0).toFixed(1)}%
                          </span>
                          <small>
                            {stats.promotionRemark || "No remark yet"}
                          </small>
                        </div>

                        <div className="update-item">
                          <FaBell className="update-icon warning" />
                          <span>Fees Count: {stats.feeCount || 0}</span>
                          <small>
                            Outstanding: ₦
                            {Number(stats.feeBalance || 0).toLocaleString()}
                          </small>
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

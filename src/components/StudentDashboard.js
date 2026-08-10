import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { authAPI, studentAPI, attendanceAPI, feeAPI } from "../services/api";
import { Link } from "react-router-dom";
import {
  FaUserGraduate,
  FaMoneyBill,
  FaCalendarAlt,
  FaSpinner,
  FaSyncAlt,
  FaCheckCircle,
  FaUserCircle,
  FaSchool,
  FaIdCard,
  FaEnvelope,
  FaClock,
  FaArrowRight,
  FaBell,
} from "react-icons/fa";
import moment from "moment";
import useActiveSession from "../hooks/useActiveSession";
import "./StudentDashboard.css";

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const buildFullName = (...parts) =>
  parts
    .filter(
      (part) => part !== undefined && part !== null && `${part}`.trim() !== "",
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeStudentLike = (...candidates) => {
  const source = candidates.find(Boolean);
  if (!source) return null;

  return {
    id: source.id ?? source.studentId ?? null,
    firstName: source.firstName ?? "",
    middleName: source.middleName ?? "",
    lastName: source.lastName ?? "",
    fullName:
      source.fullName ??
      buildFullName(source.firstName, source.middleName, source.lastName),
    admissionNumber: source.admissionNumber ?? "",
    studentClass:
      source.studentClass ??
      source.className ??
      source.class ??
      source.schoolClass?.className ??
      "",
    classArm: source.classArm ?? source.arm ?? source.schoolClass?.arm ?? "",
    status: source.status ?? "ACTIVE",
    profilePictureUrl: source.profilePictureUrl ?? "",
    email: source.email ?? "",
    username: source.username ?? "",
  };
};

const normalizeAttendance = (payload) => {
  const data = payload?.data ?? payload ?? null;

  if (!data || typeof data !== "object") {
    return {
      daysPresent: 0,
      daysAbsent: 0,
      attendancePercentage: 0,
      totalSchoolDays: 0,
      daysLate: 0,
      daysExcused: 0,
    };
  }

  return {
    ...data,
    daysPresent: toNumber(data.daysPresent, 0),
    daysAbsent: toNumber(data.daysAbsent, 0),
    attendancePercentage: toNumber(data.attendancePercentage, 0),
    totalSchoolDays: toNumber(data.totalSchoolDays, 0),
    daysLate: toNumber(data.daysLate, 0),
    daysExcused: toNumber(data.daysExcused, 0),
  };
};

const normalizeFees = (payload) => {
  const data = payload?.data ?? payload ?? [];
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.fees)
      ? data.fees
      : [];

  return items.map((fee, index) => ({
    id: fee.id ?? index,
    feeType: fee.feeType ?? fee.name ?? "Fee",
    amount: toNumber(fee.amount, 0),
    paidAmount: toNumber(fee.paidAmount, 0),
    balance: toNumber(fee.balance, 0),
    dueDate: fee.dueDate ?? null,
    paymentStatus: fee.paymentStatus ?? fee.status ?? "PENDING",
  }));
};

const getStatusBadgeClass = (status) => {
  const normalized = `${status || ""}`.toUpperCase();
  if (["ACTIVE", "PAID", "CURRENT"].includes(normalized)) return "success";
  if (["PENDING", "PARTIAL", "INACTIVE"].includes(normalized)) return "warning";
  return "secondary";
};

const extractApiMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

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

function StudentDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [studentData, setStudentData] = useState(null);
  const [attendance, setAttendance] = useState({
    daysPresent: 0,
    daysAbsent: 0,
    attendancePercentage: 0,
    totalSchoolDays: 0,
    daysLate: 0,
    daysExcused: 0,
  });
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardMessage, setDashboardMessage] = useState("");

  const { session, term, loadingSession, refreshActiveSession } =
    useActiveSession("FIRST");

  const fetchStudentData = useCallback(async () => {
    if (!user) {
      setStudentData(null);
      setAttendance({
        daysPresent: 0,
        daysAbsent: 0,
        attendancePercentage: 0,
        totalSchoolDays: 0,
        daysLate: 0,
        daysExcused: 0,
      });
      setFees([]);
      setDashboardMessage("");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setDashboardMessage("");

      const requests = [
        authAPI.getCurrentUser().catch(() => ({ data: null })),
        studentAPI.getMyProfile().catch(() => ({ data: null })),
        session && term
          ? attendanceAPI
              .getMyAttendanceSummary(session, term)
              .catch(() => ({ data: null }))
          : Promise.resolve({ data: null }),
        session && term
          ? feeAPI.getMyFees(session, term).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ];

      const [meRes, profileRes, attendanceRes, feesRes] =
        await Promise.all(requests);

      const meUser = meRes?.data || null;
      const studentProfile = profileRes?.data || null;

      const resolvedProfile = normalizeStudentLike(
        studentProfile,
        meUser?.student,
        meUser?.studentProfile,
        meUser?.profile,
        user?.student,
        user?.studentProfile,
        user?.profile,
        meUser,
        user,
      );

      setStudentData(resolvedProfile);
      setAttendance(normalizeAttendance(attendanceRes));
      setFees(normalizeFees(feesRes));
    } catch (error) {
      console.error("Error fetching student dashboard data:", error);

      setStudentData(
        normalizeStudentLike(
          user?.student,
          user?.studentProfile,
          user?.profile,
          user,
        ),
      );
      setAttendance({
        daysPresent: 0,
        daysAbsent: 0,
        attendancePercentage: 0,
        totalSchoolDays: 0,
        daysLate: 0,
        daysExcused: 0,
      });
      setFees([]);
      setDashboardMessage(
        extractApiMessage(
          error,
          t?.studentDashboard?.dashboardLoadError ||
            "Some dashboard data could not be loaded.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [user, session, term, t]);

  useEffect(() => {
    if (!loadingSession) {
      fetchStudentData();
    }
  }, [fetchStudentData, loadingSession]);

  const displayName = useMemo(() => {
    const fallbackName = buildFullName(
      user?.firstName,
      user?.middleName,
      user?.lastName,
    );
    return studentData?.fullName || fallbackName || user?.username || "Student";
  }, [studentData, user]);

  const welcomeName = useMemo(() => {
    return studentData?.firstName || user?.firstName || "Student";
  }, [studentData, user]);

  const classDisplay = useMemo(() => {
    return (
      buildFullName(studentData?.studentClass, studentData?.classArm) || "N/A"
    );
  }, [studentData]);

  const attendancePercentage = Math.max(
    0,
    Math.min(100, toNumber(attendance?.attendancePercentage, 0)),
  );

  const totalOutstandingFees = useMemo(() => {
    return fees.reduce((sum, fee) => sum + toNumber(fee.balance, 0), 0);
  }, [fees]);

  const totalPaidFees = useMemo(() => {
    return fees.reduce((sum, fee) => sum + toNumber(fee.paidAmount, 0), 0);
  }, [fees]);

  const feeCount = useMemo(() => fees.length, [fees]);

  const profileImage = useMemo(
    () => normalizeImageUrl(studentData?.profilePictureUrl),
    [studentData],
  );

  if (loading || loadingSession) {
    return (
      <div className="student-dashboard text-center py-5">
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">{t?.common?.loading || "Loading dashboard..."}</p>
      </div>
    );
  }

  return (
    <div className="student-dashboard container py-4 redesigned-student-dashboard">
      <div className="student-hero card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="student-avatar">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={displayName}
                    className="student-avatar-img"
                  />
                ) : (
                  <FaUserCircle size={64} />
                )}
              </div>

              <div>
                <h2 className="mb-1">
                  <FaUserGraduate className="me-2" />
                  {t?.studentDashboard?.welcome || "Welcome"}, {welcomeName}!
                </h2>
                <p className="mb-1 text-muted">
                  {t?.studentDashboard?.studentPortalSubtitle ||
                    "Track your attendance, fees, and personal school information."}
                </p>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <span className="badge bg-primary-subtle text-dark">
                    <FaSchool className="me-1" />
                    {classDisplay}
                  </span>
                  <span className="badge bg-light text-dark border">
                    <FaIdCard className="me-1" />
                    {studentData?.admissionNumber || "N/A"}
                  </span>
                  <span
                    className={`badge bg-${getStatusBadgeClass(
                      studentData?.status,
                    )}`}
                  >
                    {studentData?.status || "ACTIVE"}
                  </span>
                </div>
              </div>
            </div>

            <button
              className="btn btn-outline-primary"
              onClick={refreshActiveSession}
              type="button"
            >
              <FaSyncAlt className="me-2" />
              {t?.common?.refresh || "Refresh Session"}
            </button>
          </div>

          <div className="mt-3 text-muted">
            {t?.feeManagement?.activeSession || "Active Session"}:{" "}
            <strong>
              {session || t?.common?.noActiveSession || "No active session"}
            </strong>{" "}
            | {t?.feeManagement?.term || "Term"}:{" "}
            <strong>{term || "N/A"}</strong>
          </div>
        </div>
      </div>

      {dashboardMessage ? (
        <div className="alert alert-info" role="alert">
          {dashboardMessage}
        </div>
      ) : null}

      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card h-100 shadow-sm border-0 mini-stat-card">
            <div className="card-body">
              <div className="mini-stat-icon text-success">
                <FaCalendarAlt />
              </div>
              <div className="mini-stat-label">
                {t?.studentDashboard?.attendance || "Attendance"}
              </div>
              <div className="mini-stat-value">
                {attendancePercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card h-100 shadow-sm border-0 mini-stat-card">
            <div className="card-body">
              <div className="mini-stat-icon text-primary">
                <FaCheckCircle />
              </div>
              <div className="mini-stat-label">
                {t?.studentDashboard?.daysPresent || "Days Present"}
              </div>
              <div className="mini-stat-value">
                {toNumber(attendance?.daysPresent, 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card h-100 shadow-sm border-0 mini-stat-card">
            <div className="card-body">
              <div className="mini-stat-icon text-warning">
                <FaMoneyBill />
              </div>
              <div className="mini-stat-label">
                {t?.studentDashboard?.feesPaid || "Fees Paid"}
              </div>
              <div className="mini-stat-value">
                ₦{totalPaidFees.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card h-100 shadow-sm border-0 mini-stat-card">
            <div className="card-body">
              <div className="mini-stat-icon text-danger">
                <FaBell />
              </div>
              <div className="mini-stat-label">
                {t?.studentDashboard?.outstanding || "Outstanding"}
              </div>
              <div className="mini-stat-value">
                ₦{totalOutstandingFees.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                {t?.studentDashboard?.myInfo || "My Information"}
              </h5>
            </div>
            <div className="card-body">
              <div className="dashboard-detail-row">
                <span className="detail-label">Name</span>
                <span className="detail-value">{displayName || "N/A"}</span>
              </div>
              <div className="dashboard-detail-row">
                <span className="detail-label">Admission No.</span>
                <span className="detail-value">
                  {studentData?.admissionNumber || "N/A"}
                </span>
              </div>
              <div className="dashboard-detail-row">
                <span className="detail-label">Class</span>
                <span className="detail-value">{classDisplay}</span>
              </div>
              <div className="dashboard-detail-row">
                <span className="detail-label">Email</span>
                <span className="detail-value">
                  {studentData?.email || user?.email || "N/A"}
                </span>
              </div>
              <div className="dashboard-detail-row mb-0">
                <span className="detail-label">Status</span>
                <span
                  className={`badge bg-${getStatusBadgeClass(
                    studentData?.status,
                  )}`}
                >
                  {studentData?.status || "ACTIVE"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                {t?.studentDashboard?.attendance || "Attendance"}
              </h5>
            </div>
            <div className="card-body text-center">
              <h1 className="display-4 text-success mb-2">
                {attendancePercentage.toFixed(1)}%
              </h1>
              <p className="text-muted">
                {t?.studentDashboard?.attendanceRate || "Attendance Rate"}
              </p>

              <div className="progress mb-4" style={{ height: "10px" }}>
                <div
                  className="progress-bar bg-success"
                  style={{ width: `${attendancePercentage}%` }}
                />
              </div>

              <div className="attendance-summary-grid">
                <div className="attendance-box">
                  <span className="attendance-box-label">Present</span>
                  <strong>{toNumber(attendance?.daysPresent, 0)}</strong>
                </div>
                <div className="attendance-box">
                  <span className="attendance-box-label">Absent</span>
                  <strong>{toNumber(attendance?.daysAbsent, 0)}</strong>
                </div>
                <div className="attendance-box">
                  <span className="attendance-box-label">Late</span>
                  <strong>{toNumber(attendance?.daysLate, 0)}</strong>
                </div>
                <div className="attendance-box">
                  <span className="attendance-box-label">School Days</span>
                  <strong>{toNumber(attendance?.totalSchoolDays, 0)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-warning">
              <h5 className="mb-0">
                {t?.studentDashboard?.feeStatus || "Fee Status"}
              </h5>
            </div>
            <div className="card-body">
              <div className="dashboard-detail-row">
                <span className="detail-label">Fee Items</span>
                <span className="detail-value">{feeCount}</span>
              </div>
              <div className="dashboard-detail-row">
                <span className="detail-label">Total Paid</span>
                <span className="detail-value text-success">
                  ₦{totalPaidFees.toLocaleString()}
                </span>
              </div>
              <div className="dashboard-detail-row">
                <span className="detail-label">Outstanding</span>
                <span className="detail-value text-danger">
                  ₦{totalOutstandingFees.toLocaleString()}
                </span>
              </div>

              <hr />

              {fees.length === 0 ? (
                <p className="text-muted mb-0">
                  {t?.studentDashboard?.noFeeRecords || "No fee records found."}
                </p>
              ) : (
                fees.slice(0, 4).map((fee) => {
                  const paidPercent =
                    fee.amount > 0
                      ? Math.min((fee.paidAmount / fee.amount) * 100, 100)
                      : 0;

                  return (
                    <div key={fee.id} className="mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>{fee.feeType}</span>
                        <span
                          className={`badge bg-${getStatusBadgeClass(
                            fee.paymentStatus,
                          )}`}
                        >
                          {fee.paymentStatus}
                        </span>
                      </div>

                      <div className="progress mt-2" style={{ height: "6px" }}>
                        <div
                          className="progress-bar bg-success"
                          style={{ width: `${paidPercent}%` }}
                        />
                      </div>

                      <small className="text-muted d-block mt-1">
                        Due:{" "}
                        {fee.dueDate
                          ? moment(fee.dueDate).format("DD/MM/YYYY")
                          : "-"}
                      </small>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4 g-4">
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-light">
              <h5 className="mb-0">Current Summary</h5>
            </div>
            <div className="card-body">
              <div className="summary-item">
                <FaCheckCircle className="summary-icon text-success" />
                <div>
                  <strong>Attendance</strong>
                  <p className="mb-0 text-muted">
                    {attendancePercentage.toFixed(1)}% attendance rate this term
                  </p>
                </div>
              </div>

              <div className="summary-item">
                <FaMoneyBill className="summary-icon text-warning" />
                <div>
                  <strong>Fees</strong>
                  <p className="mb-0 text-muted">
                    ₦{totalOutstandingFees.toLocaleString()} outstanding across{" "}
                    {feeCount} fee item{feeCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="summary-item">
                <FaSchool className="summary-icon text-primary" />
                <div>
                  <strong>Academic Placement</strong>
                  <p className="mb-0 text-muted">Currently in {classDisplay}</p>
                </div>
              </div>

              <div className="summary-item mb-0">
                <FaArrowRight className="summary-icon text-info" />
                <div>
                  <strong>Session</strong>
                  <p className="mb-0 text-muted">
                    {session || "No active session"} — {term || "N/A"} Term
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                {t?.studentDashboard?.quickLinks || "Quick Links"}
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-3">
                <Link to="/attendance" className="dashboard-link-card">
                  <div className="dashboard-link-icon bg-success-subtle text-success">
                    <FaCalendarAlt />
                  </div>
                  <div className="dashboard-link-text">
                    <strong>
                      {t?.studentDashboard?.myAttendance || "My Attendance"}
                    </strong>
                    <small>View your attendance details and summaries</small>
                  </div>
                </Link>

                <Link to="/fees" className="dashboard-link-card">
                  <div className="dashboard-link-icon bg-warning-subtle text-warning">
                    <FaMoneyBill />
                  </div>
                  <div className="dashboard-link-text">
                    <strong>
                      {t?.studentDashboard?.feeDetails || "Fee Details"}
                    </strong>
                    <small>Check payments, balances, and due dates</small>
                  </div>
                </Link>
              </div>

              <small className="text-muted d-block mt-4">
                This dashboard was simplified to avoid blocked result endpoint
                calls.
              </small>
            </div>
          </div>
        </div>
      </div>

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

export default StudentDashboard;

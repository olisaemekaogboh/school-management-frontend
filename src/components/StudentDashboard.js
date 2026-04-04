import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import {
  authAPI,
  studentAPI,
  resultAPI,
  attendanceAPI,
  feeAPI,
} from "../services/api";
import { Link } from "react-router-dom";
import {
  FaUserGraduate,
  FaMoneyBill,
  FaChartBar,
  FaCalendarAlt,
  FaSpinner,
  FaSyncAlt,
  FaLock,
  FaCheckCircle,
  FaInfoCircle,
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
    id: source.id ?? null,
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

const normalizeResults = (payload) => {
  const data = payload?.data ?? payload ?? {};
  const items = Array.isArray(data?.subjects)
    ? data.subjects
    : Array.isArray(data)
      ? data
      : [];

  return items.map((item, index) => ({
    id: item.id ?? index,
    subject: item.subject ?? "-",
    continuousAssessment: toNumber(
      item.continuousAssessment ??
        item.ca ??
        item.contAssessment ??
        item.assessment,
      0,
    ),
    examination: toNumber(item.examination ?? item.exam, 0),
    total: toNumber(item.total, 0),
    grade: item.grade ?? "-",
  }));
};

const normalizeAttendance = (payload) => {
  const data = payload?.data ?? payload ?? null;

  if (!data || typeof data !== "object") {
    return {
      daysPresent: 0,
      daysAbsent: 0,
      attendancePercentage: 0,
    };
  }

  return {
    ...data,
    daysPresent: toNumber(data.daysPresent, 0),
    daysAbsent: toNumber(data.daysAbsent, 0),
    attendancePercentage: toNumber(data.attendancePercentage, 0),
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

const getGradeBadgeClass = (grade) => {
  switch (`${grade || ""}`.toUpperCase()) {
    case "A":
      return "success";
    case "B":
      return "primary";
    case "C":
      return "info";
    case "D":
      return "warning";
    default:
      return "danger";
  }
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

function StudentDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const [studentData, setStudentData] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [attendance, setAttendance] = useState({
    daysPresent: 0,
    daysAbsent: 0,
    attendancePercentage: 0,
  });
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resultAccess, setResultAccess] = useState({
    canView: false,
    locked: false,
    message: "",
  });

  const { session, term, loadingSession, refreshActiveSession } =
    useActiveSession("FIRST");

  const fetchStudentData = useCallback(async () => {
    if (!user) {
      setStudentData(null);
      setRecentResults([]);
      setAttendance({
        daysPresent: 0,
        daysAbsent: 0,
        attendancePercentage: 0,
      });
      setFees([]);
      setResultAccess({
        canView: false,
        locked: false,
        message: "",
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const requests = [
        authAPI.getCurrentUser(),
        studentAPI.getMyProfile(),
        session && term
          ? resultAPI.getMyTermResult(session, term)
          : Promise.resolve({ data: [] }),
        session && term
          ? attendanceAPI.getMyAttendanceSummary(session, term)
          : Promise.resolve({ data: null }),
        session && term
          ? feeAPI.getMyFees(session, term)
          : Promise.resolve({ data: [] }),
      ];

      const [meRes, profileRes, resultsRes, attendanceRes, feesRes] =
        await Promise.allSettled(requests);

      const meUser =
        meRes.status === "fulfilled" ? meRes.value?.data || null : null;

      const studentProfile =
        profileRes.status === "fulfilled"
          ? profileRes.value?.data || null
          : null;

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

      if (resultsRes.status === "fulfilled") {
        const normalizedResults = normalizeResults(resultsRes.value);
        setRecentResults(normalizedResults.slice(0, 5));
        setResultAccess({
          canView: true,
          locked: false,
          message: "",
        });
      } else {
        const resultError = resultsRes.reason;
        const status = resultError?.response?.status;

        if (status === 403) {
          setRecentResults([]);
          setResultAccess({
            canView: false,
            locked: true,
            message: extractApiMessage(
              resultError,
              t?.studentDashboard?.resultLocked ||
                "Your result is not yet available. The school will release it when authorized.",
            ),
          });
        } else {
          setRecentResults([]);
          setResultAccess({
            canView: false,
            locked: false,
            message: extractApiMessage(
              resultError,
              t?.studentDashboard?.resultUnavailable ||
                "Result data could not be loaded right now.",
            ),
          });
        }
      }

      const normalizedAttendance =
        attendanceRes.status === "fulfilled"
          ? normalizeAttendance(attendanceRes.value)
          : {
              daysPresent: 0,
              daysAbsent: 0,
              attendancePercentage: 0,
            };

      const normalizedFees =
        feesRes.status === "fulfilled" ? normalizeFees(feesRes.value) : [];

      setAttendance(normalizedAttendance);
      setFees(normalizedFees);
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
      setRecentResults([]);
      setAttendance({
        daysPresent: 0,
        daysAbsent: 0,
        attendancePercentage: 0,
      });
      setFees([]);
      setResultAccess({
        canView: false,
        locked: false,
        message:
          t?.studentDashboard?.dashboardLoadError ||
          "Some dashboard data could not be loaded.",
      });
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

  if (loading || loadingSession) {
    return (
      <div className="student-dashboard text-center py-5">
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">{t?.common?.loading || "Loading dashboard..."}</p>
      </div>
    );
  }

  return (
    <div className="student-dashboard container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">
          <FaUserGraduate className="me-2" />
          {t?.studentDashboard?.welcome || "Welcome"}, {welcomeName}!
        </h2>

        <button
          className="btn btn-outline-primary"
          onClick={refreshActiveSession}
          type="button"
        >
          <FaSyncAlt className="me-2" />
          {t?.common?.refresh || "Refresh Session"}
        </button>
      </div>

      <div className="mb-3 text-muted">
        {t?.feeManagement?.activeSession || "Active Session"}:{" "}
        <strong>
          {session || t?.common?.noActiveSession || "No active session"}
        </strong>{" "}
        | {t?.feeManagement?.term || "Term"}: <strong>{term || "N/A"}</strong>
      </div>

      {resultAccess.message ? (
        <div
          className={`alert ${
            resultAccess.locked ? "alert-warning" : "alert-info"
          } d-flex align-items-start gap-2`}
          role="alert"
        >
          {resultAccess.locked ? (
            <FaLock className="mt-1 flex-shrink-0" />
          ) : (
            <FaInfoCircle className="mt-1 flex-shrink-0" />
          )}
          <div>
            <strong>
              {resultAccess.locked
                ? t?.studentDashboard?.resultAccessRestricted ||
                  "Result Access Restricted"
                : t?.studentDashboard?.resultInfo || "Result Information"}
            </strong>
            <div>{resultAccess.message}</div>
          </div>
        </div>
      ) : null}

      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                {t?.studentDashboard?.myInfo || "My Information"}
              </h5>
            </div>
            <div className="card-body">
              <p>
                <strong>{t?.studentDashboard?.name || "Name"}:</strong>{" "}
                {displayName || "N/A"}
              </p>
              <p>
                <strong>
                  {t?.studentDashboard?.admission || "Admission"}:
                </strong>{" "}
                {studentData?.admissionNumber || "N/A"}
              </p>
              <p>
                <strong>{t?.studentDashboard?.class || "Class"}:</strong>{" "}
                {classDisplay}
              </p>
              <p className="mb-0">
                <strong>{t?.studentDashboard?.status || "Status"}:</strong>{" "}
                <span
                  className={`badge bg-${getStatusBadgeClass(studentData?.status)}`}
                >
                  {studentData?.status || "ACTIVE"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                {t?.studentDashboard?.attendance || "Attendance"}
              </h5>
            </div>
            <div className="card-body text-center">
              <h1 className="display-1 text-success">
                {attendancePercentage.toFixed(1)}%
              </h1>
              <p>{t?.studentDashboard?.attendanceRate || "Attendance Rate"}</p>

              <div className="progress" style={{ height: "10px" }}>
                <div
                  className="progress-bar bg-success"
                  style={{ width: `${attendancePercentage}%` }}
                />
              </div>

              <p className="mt-3 mb-0">
                {t?.studentDashboard?.present || "Present"}:{" "}
                {toNumber(attendance?.daysPresent, 0)} |{" "}
                {t?.studentDashboard?.absent || "Absent"}:{" "}
                {toNumber(attendance?.daysAbsent, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-warning">
              <h5 className="mb-0">
                {t?.studentDashboard?.feeStatus || "Fee Status"}
              </h5>
            </div>
            <div className="card-body">
              {fees.length === 0 ? (
                <p className="text-muted mb-0">
                  {t?.studentDashboard?.noFeeRecords || "No fee records found."}
                </p>
              ) : (
                <>
                  <div className="mb-3">
                    <strong>
                      {t?.studentDashboard?.outstanding || "Outstanding"}:
                    </strong>{" "}
                    <span className="text-danger">
                      ₦{totalOutstandingFees.toLocaleString()}
                    </span>
                  </div>

                  {fees.map((fee) => {
                    const paidPercent =
                      fee.amount > 0
                        ? Math.min((fee.paidAmount / fee.amount) * 100, 100)
                        : 0;

                    return (
                      <div key={fee.id} className="mb-3">
                        <div className="d-flex justify-content-between">
                          <span>{fee.feeType}</span>
                          <span
                            className={
                              `${fee.paymentStatus}`.toUpperCase() === "PAID"
                                ? "text-success"
                                : "text-danger"
                            }
                          >
                            ₦{toNumber(fee.balance, 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="progress" style={{ height: "5px" }}>
                          <div
                            className="progress-bar bg-success"
                            style={{ width: `${paidPercent}%` }}
                          />
                        </div>

                        <small className="text-muted">
                          {t?.studentDashboard?.due || "Due"}:{" "}
                          {fee.dueDate
                            ? moment(fee.dueDate).format("DD/MM/YYYY")
                            : "-"}
                        </small>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="mb-0">
                {t?.studentDashboard?.recentResults || "Recent Results"}
              </h5>

              {resultAccess.canView ? (
                <span className="badge bg-light text-dark d-inline-flex align-items-center gap-1">
                  <FaCheckCircle />
                  {t?.studentDashboard?.released || "Released"}
                </span>
              ) : resultAccess.locked ? (
                <span className="badge bg-dark d-inline-flex align-items-center gap-1">
                  <FaLock />
                  {t?.studentDashboard?.locked || "Locked"}
                </span>
              ) : null}
            </div>

            <div className="card-body">
              {!resultAccess.canView ? (
                <div className="text-center py-3">
                  <FaLock size={28} className="mb-3 text-warning" />
                  <p className="mb-1 fw-semibold">
                    {t?.studentDashboard?.resultsUnavailable ||
                      "Results are not available for viewing right now."}
                  </p>
                  <small className="text-muted">
                    {resultAccess.message ||
                      t?.studentDashboard?.waitForRelease ||
                      "Please wait until the school releases your result."}
                  </small>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t?.studentDashboard?.subject || "Subject"}</th>
                        <th>{t?.studentDashboard?.ca || "CA"}</th>
                        <th>{t?.studentDashboard?.exam || "Exam"}</th>
                        <th>{t?.studentDashboard?.total || "Total"}</th>
                        <th>{t?.studentDashboard?.grade || "Grade"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentResults.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center text-muted">
                            {t?.studentDashboard?.noResults ||
                              "No result available yet."}
                          </td>
                        </tr>
                      ) : (
                        recentResults.map((subject) => (
                          <tr key={subject.id}>
                            <td>{subject.subject || "-"}</td>
                            <td>{toNumber(subject.continuousAssessment, 0)}</td>
                            <td>{toNumber(subject.examination, 0)}</td>
                            <td>
                              <strong>{toNumber(subject.total, 0)}</strong>
                            </td>
                            <td>
                              <span
                                className={`badge bg-${getGradeBadgeClass(subject.grade)}`}
                              >
                                {subject.grade || "-"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">
                {t?.studentDashboard?.quickLinks || "Quick Links"}
              </h5>
              <div className="d-flex gap-2 flex-wrap">
                <Link
                  to="/results"
                  className={`btn ${
                    resultAccess.canView
                      ? "btn-outline-primary"
                      : "btn-outline-secondary"
                  }`}
                >
                  <FaChartBar className="me-2" />
                  {t?.studentDashboard?.viewResults || "View My Results"}
                </Link>

                <Link to="/attendance" className="btn btn-outline-success">
                  <FaCalendarAlt className="me-2" />
                  {t?.studentDashboard?.myAttendance || "My Attendance"}
                </Link>

                <Link to="/fees" className="btn btn-outline-warning">
                  <FaMoneyBill className="me-2" />
                  {t?.studentDashboard?.feeDetails || "Fee Details"}
                </Link>
              </div>

              {!resultAccess.canView && resultAccess.locked ? (
                <small className="text-muted d-block mt-3">
                  {t?.studentDashboard?.resultReleasedBySchool ||
                    "Your result link may still open the result page, but the backend will block access until the school releases it."}
                </small>
              ) : null}
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

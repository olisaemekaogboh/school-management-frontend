import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authAPI, resultAPI, attendanceAPI, feeAPI } from "../services/api";
import { Link } from "react-router-dom";
import {
  FaUserGraduate,
  FaMoneyBill,
  FaChartBar,
  FaCalendarAlt,
  FaBookOpen,
  FaSpinner,
  FaSyncAlt,
} from "react-icons/fa";
import moment from "moment";
import useActiveSession from "../hooks/useActiveSession";

const getFirstDefined = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return null;
};

const toArray = (value) => (Array.isArray(value) ? value : []);
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
  const sources = candidates.filter(Boolean);

  const pick = (...selectors) => {
    for (const source of sources) {
      for (const selector of selectors) {
        const value = selector(source);
        if (value !== undefined && value !== null && value !== "") {
          return value;
        }
      }
    }
    return null;
  };

  const firstName = pick(
    (s) => s.firstName,
    (s) => s.firstname,
    (s) => s.givenName,
  );

  const middleName = pick(
    (s) => s.middleName,
    (s) => s.middlename,
    (s) => s.otherName,
    (s) => s.otherNames,
  );

  const lastName = pick(
    (s) => s.lastName,
    (s) => s.lastname,
    (s) => s.surname,
  );

  const fullName =
    pick(
      (s) => s.fullName,
      (s) => s.name,
      (s) => s.studentName,
    ) || buildFullName(firstName, middleName, lastName);

  return {
    id: pick(
      (s) => s.id,
      (s) => s.studentId,
      (s) => s.student_id,
    ),
    firstName,
    middleName,
    lastName,
    fullName,
    admissionNumber: pick(
      (s) => s.admissionNumber,
      (s) => s.admissionNo,
      (s) => s.admission_number,
      (s) => s.regNo,
      (s) => s.registrationNumber,
    ),
    studentClass: pick(
      (s) => s.studentClass,
      (s) => s.className,
      (s) => s.classLevel,
      (s) => s.classLabel,
      (s) => s.currentClass,
      (s) => s.class,
    ),
    classArm: pick(
      (s) => s.classArm,
      (s) => s.arm,
      (s) => s.classSection,
      (s) => s.section,
    ),
    status:
      pick(
        (s) => s.status,
        (s) => s.studentStatus,
        (s) => s.accountStatus,
      ) || "ACTIVE",
    profilePictureUrl: pick(
      (s) => s.profilePictureUrl,
      (s) => s.profileImageUrl,
      (s) => s.avatar,
      (s) => s.imageUrl,
    ),
    email: pick((s) => s.email),
    username: pick((s) => s.username),
  };
};

const normalizeResults = (payload) => {
  const data = payload?.data ?? payload ?? {};

  const items =
    data?.subjects ||
    data?.results ||
    data?.resultItems ||
    data?.records ||
    data?.items ||
    data?.content ||
    data?.data?.subjects ||
    data?.data?.results ||
    data?.data?.resultItems ||
    (Array.isArray(data) ? data : []);

  return toArray(items).map((item, index) => ({
    id: getFirstDefined(item?.id, item?.subjectId, item?.code, index),
    subject: getFirstDefined(
      item?.subject,
      item?.subjectName,
      item?.name,
      item?.course,
      item?.title,
      "-",
    ),
    continuousAssessment: getFirstDefined(
      item?.continuousAssessment,
      item?.ca,
      item?.caScore,
      item?.testScore,
      item?.assessment,
      0,
    ),
    examination: getFirstDefined(
      item?.examination,
      item?.exam,
      item?.examScore,
      item?.examMark,
      0,
    ),
    total: getFirstDefined(
      item?.total,
      item?.totalScore,
      item?.grandTotal,
      item?.score,
      0,
    ),
    grade: getFirstDefined(
      item?.grade,
      item?.remarkGrade,
      item?.letterGrade,
      "-",
    ),
  }));
};

const normalizeAttendance = (payload) => {
  const data =
    payload?.data?.summary ||
    payload?.data?.attendance ||
    payload?.data ||
    payload?.summary ||
    payload?.attendance ||
    payload ||
    null;

  if (!data || typeof data !== "object") {
    return {
      daysPresent: 0,
      daysAbsent: 0,
      attendancePercentage: 0,
    };
  }

  const daysPresent = toNumber(
    getFirstDefined(
      data.daysPresent,
      data.presentDays,
      data.presentCount,
      data.totalPresent,
      data.attendedDays,
    ),
    0,
  );

  const daysAbsent = toNumber(
    getFirstDefined(
      data.daysAbsent,
      data.absentDays,
      data.absentCount,
      data.totalAbsent,
      data.missedDays,
    ),
    0,
  );

  const explicitPercentage = getFirstDefined(
    data.attendancePercentage,
    data.percentage,
    data.attendanceRate,
    data.rate,
  );

  const attendancePercentage =
    explicitPercentage !== null
      ? toNumber(explicitPercentage, 0)
      : daysPresent + daysAbsent > 0
        ? (daysPresent / (daysPresent + daysAbsent)) * 100
        : 0;

  return {
    ...data,
    daysPresent,
    daysAbsent,
    attendancePercentage,
  };
};

const normalizeFees = (payload) => {
  const data = payload?.data ?? payload ?? {};

  const items =
    data?.fees ||
    data?.records ||
    data?.items ||
    data?.content ||
    data?.feeRecords ||
    data?.studentFees ||
    (Array.isArray(data) ? data : []);

  return toArray(items).map((fee, index) => {
    const amount = toNumber(
      getFirstDefined(
        fee?.amount,
        fee?.totalAmount,
        fee?.feeAmount,
        fee?.billAmount,
      ),
      0,
    );

    const paidAmount = toNumber(
      getFirstDefined(
        fee?.paidAmount,
        fee?.amountPaid,
        fee?.paid,
        fee?.paymentAmount,
      ),
      0,
    );

    const balance = toNumber(
      getFirstDefined(
        fee?.balance,
        fee?.outstandingAmount,
        amount - paidAmount,
      ),
      0,
    );

    return {
      id: getFirstDefined(fee?.id, fee?.feeId, fee?.code, index),
      feeType: getFirstDefined(fee?.feeType, fee?.name, fee?.title, "Fee"),
      amount,
      paidAmount,
      balance,
      dueDate: getFirstDefined(
        fee?.dueDate,
        fee?.paymentDueDate,
        fee?.deadline,
      ),
      paymentStatus: getFirstDefined(
        fee?.paymentStatus,
        fee?.status,
        balance <= 0 ? "PAID" : "PENDING",
      ),
    };
  });
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

function StudentDashboard() {
  const { user } = useAuth();

  const [studentData, setStudentData] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [attendance, setAttendance] = useState({
    daysPresent: 0,
    daysAbsent: 0,
    attendancePercentage: 0,
  });
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const requests = [
        authAPI.getCurrentUser(),
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

      const [meRes, resultsRes, attendanceRes, feesRes] =
        await Promise.allSettled(requests);

      const meUser =
        meRes.status === "fulfilled" ? meRes.value?.data || null : null;

      const resolvedProfile = normalizeStudentLike(
        user?.student,
        user?.studentProfile,
        user?.profile,
        user,
        meUser?.student,
        meUser?.studentProfile,
        meUser?.profile,
        meUser,
      );

      setStudentData(resolvedProfile);

      const normalizedResults =
        resultsRes.status === "fulfilled"
          ? normalizeResults(resultsRes.value)
          : [];

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

      setRecentResults(normalizedResults.slice(0, 5));
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
    } finally {
      setLoading(false);
    }
  }, [user, session, term]);

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

  if (loading || loadingSession) {
    return (
      <div className="text-center py-5">
        <FaSpinner className="spin" size={40} />
      </div>
    );
  }

  return (
    <div className="student-dashboard container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">
          <FaUserGraduate className="me-2" />
          Welcome, {welcomeName}!
        </h2>

        <button
          className="btn btn-outline-primary"
          onClick={refreshActiveSession}
          type="button"
        >
          <FaSyncAlt className="me-2" />
          Refresh Session
        </button>
      </div>

      <div className="mb-3 text-muted">
        Active Session: <strong>{session || "No active session"}</strong> |
        Term: <strong>{term || "N/A"}</strong>
      </div>

      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">My Information</h5>
            </div>
            <div className="card-body">
              <p>
                <strong>Name:</strong> {displayName || "N/A"}
              </p>
              <p>
                <strong>Admission:</strong>{" "}
                {studentData?.admissionNumber || "N/A"}
              </p>
              <p>
                <strong>Class:</strong> {classDisplay}
              </p>
              <p>
                <strong>Status:</strong>{" "}
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
              <h5 className="mb-0">Attendance</h5>
            </div>
            <div className="card-body text-center">
              <h1 className="display-1 text-success">
                {attendancePercentage.toFixed(1)}%
              </h1>
              <p>Attendance Rate</p>

              <div className="progress" style={{ height: "10px" }}>
                <div
                  className="progress-bar bg-success"
                  style={{ width: `${attendancePercentage}%` }}
                />
              </div>

              <p className="mt-3 mb-0">
                Present: {toNumber(attendance?.daysPresent, 0)} | Absent:{" "}
                {toNumber(attendance?.daysAbsent, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-warning">
              <h5 className="mb-0">Fee Status</h5>
            </div>
            <div className="card-body">
              {fees.length === 0 ? (
                <p className="text-muted mb-0">No fee records found.</p>
              ) : (
                fees.map((fee) => {
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

      <div className="row mt-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">Recent Results</h5>
            </div>
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>CA</th>
                    <th>Exam</th>
                    <th>Total</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {recentResults.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-muted">
                        No result available yet.
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
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Quick Links</h5>
              <div className="d-flex gap-2 flex-wrap">
                <Link to="/results" className="btn btn-outline-primary">
                  <FaChartBar className="me-2" /> View My Results
                </Link>
                <Link to="/attendance" className="btn btn-outline-success">
                  <FaCalendarAlt className="me-2" /> My Attendance
                </Link>
                <Link to="/fees" className="btn btn-outline-warning">
                  <FaMoneyBill className="me-2" /> Fee Details
                </Link>
                <Link to="/timetable" className="btn btn-outline-info">
                  <FaBookOpen className="me-2" /> Timetable
                </Link>
              </div>
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

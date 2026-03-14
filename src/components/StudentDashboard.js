import React, { useState, useEffect, useMemo } from "react";
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

function StudentDashboard() {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  const { session, term, loadingSession, refreshActiveSession } =
    useActiveSession("FIRST");

  useEffect(() => {
    if (user && session && term) {
      fetchStudentData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, session, term]);

  const getFirstDefined = (...values) => {
    for (const value of values) {
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return null;
  };

  const buildStudentProfile = (currentUser) => {
    const nestedStudent =
      currentUser?.student ||
      currentUser?.studentProfile ||
      currentUser?.profile ||
      null;

    const source = nestedStudent || currentUser || {};

    return {
      id: getFirstDefined(
        source.id,
        currentUser?.studentId,
        currentUser?.student_id,
      ),
      firstName: getFirstDefined(
        source.firstName,
        currentUser?.firstName,
        user?.firstName,
      ),
      lastName: getFirstDefined(
        source.lastName,
        currentUser?.lastName,
        user?.lastName,
      ),
      middleName: getFirstDefined(source.middleName, currentUser?.middleName),
      fullName: getFirstDefined(
        source.fullName,
        `${getFirstDefined(source.firstName, currentUser?.firstName, user?.firstName) || ""} ${
          getFirstDefined(source.middleName, currentUser?.middleName) || ""
        } ${getFirstDefined(source.lastName, currentUser?.lastName, user?.lastName) || ""}`
          .replace(/\s+/g, " ")
          .trim(),
      ),
      admissionNumber: getFirstDefined(
        source.admissionNumber,
        source.admissionNo,
        currentUser?.admissionNumber,
      ),
      studentClass: getFirstDefined(
        source.studentClass,
        source.className,
        currentUser?.studentClass,
      ),
      classArm: getFirstDefined(
        source.classArm,
        source.arm,
        currentUser?.classArm,
      ),
      status: getFirstDefined(source.status, currentUser?.status, "ACTIVE"),
      profilePictureUrl: getFirstDefined(
        source.profilePictureUrl,
        currentUser?.profilePictureUrl,
      ),
    };
  };

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      const [meRes, resultsRes, attendanceRes, feesRes] = await Promise.all([
        authAPI.getCurrentUser(),
        resultAPI.getMyTermResult(session, term),
        attendanceAPI.getMyAttendanceSummary(session, term),
        feeAPI.getMyFees(session, term),
      ]);

      const currentUser = meRes.data || {};
      console.log("Student dashboard current user response:", currentUser);

      const studentProfile = buildStudentProfile(currentUser);
      console.log("Resolved student profile:", studentProfile);

      setStudentData(studentProfile);

      const subjects =
        resultsRes.data?.subjects ||
        resultsRes.data?.results ||
        resultsRes.data?.resultItems ||
        [];

      setRecentResults(Array.isArray(subjects) ? subjects.slice(0, 5) : []);
      setAttendance(attendanceRes.data || null);
      setFees(Array.isArray(feesRes.data) ? feesRes.data : []);
    } catch (error) {
      console.error("Error fetching student data:", error);
      setRecentResults([]);
      setAttendance(null);
      setFees([]);
    } finally {
      setLoading(false);
    }
  };

  const attendancePercentage = Number(attendance?.attendancePercentage || 0);

  const displayName = useMemo(() => {
    return (
      studentData?.fullName ||
      `${studentData?.firstName || user?.firstName || ""} ${studentData?.lastName || user?.lastName || ""}`
        .replace(/\s+/g, " ")
        .trim() ||
      "Student"
    );
  }, [studentData, user]);

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
          <FaUserGraduate className="me-2" /> Welcome,{" "}
          {studentData?.firstName || user?.firstName || "Student"}!
        </h2>

        <button
          className="btn btn-outline-primary"
          onClick={refreshActiveSession}
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
                <strong>Class:</strong> {studentData?.studentClass || "N/A"}{" "}
                {studentData?.classArm || ""}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span className="badge bg-success">
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

              <p className="mt-3">
                Present: {attendance?.daysPresent || 0} | Absent:{" "}
                {attendance?.daysAbsent || 0}
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
                  const amount = Number(fee.amount || fee.totalAmount || 0);
                  const paidAmount = Number(fee.paidAmount || 0);
                  const balance = Number(
                    fee.balance ?? amount - paidAmount ?? 0,
                  );
                  const paidPercent =
                    amount > 0 ? Math.min((paidAmount / amount) * 100, 100) : 0;

                  return (
                    <div key={fee.id} className="mb-3">
                      <div className="d-flex justify-content-between">
                        <span>{fee.feeType || fee.name || "Fee"}</span>
                        <span
                          className={
                            fee.paymentStatus === "PAID" ||
                            fee.status === "PAID"
                              ? "text-success"
                              : "text-danger"
                          }
                        >
                          ₦{balance.toLocaleString()}
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
                    recentResults.map((subject, index) => (
                      <tr key={index}>
                        <td>
                          {subject.subject ||
                            subject.subjectName ||
                            subject.name ||
                            "-"}
                        </td>
                        <td>
                          {subject.continuousAssessment ??
                            subject.ca ??
                            subject.testScore ??
                            0}
                        </td>
                        <td>{subject.examination ?? subject.exam ?? 0}</td>
                        <td>
                          <strong>
                            {subject.total ?? subject.totalScore ?? 0}
                          </strong>
                        </td>
                        <td>
                          <span
                            className={`badge bg-${
                              subject.grade === "A"
                                ? "success"
                                : subject.grade === "B"
                                  ? "primary"
                                  : subject.grade === "C"
                                    ? "info"
                                    : subject.grade === "D"
                                      ? "warning"
                                      : "danger"
                            }`}
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

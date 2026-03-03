// src/components/StudentDashboard.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { studentAPI, resultAPI, attendanceAPI, feeAPI } from "../services/api";
import { Link } from "react-router-dom";
import {
  FaUserGraduate,
  FaMoneyBill,
  FaChartBar,
  FaCalendarAlt,
  FaBookOpen,
  FaSpinner,
} from "react-icons/fa";
import moment from "moment";

function StudentDashboard() {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      // Assuming the user object contains studentId
      const studentId = user?.studentId;

      if (!studentId) return;

      const [studentRes, resultsRes, attendanceRes, feesRes] =
        await Promise.all([
          studentAPI.getStudentById(studentId),
          resultAPI.getTermResult(studentId, "2025/2026", "FIRST"),
          attendanceAPI.getStudentTermSummary(studentId, "2025/2026", "FIRST"),
          feeAPI.getStudentFees(studentId, "2025/2026", "FIRST"),
        ]);

      setStudentData(studentRes.data);
      setRecentResults(resultsRes.data?.subjects?.slice(0, 5) || []);
      setAttendance(attendanceRes.data);
      setFees(feesRes.data);
    } catch (error) {
      console.error("Error fetching student data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <FaSpinner className="spin" size={40} />
      </div>
    );
  }

  return (
    <div className="student-dashboard container py-4">
      <h2 className="mb-4">
        <FaUserGraduate className="me-2" /> Welcome, {studentData?.firstName}!
      </h2>

      <div className="row">
        {/* Student Info Card */}
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">My Information</h5>
            </div>
            <div className="card-body">
              <p>
                <strong>Name:</strong> {studentData?.firstName}{" "}
                {studentData?.lastName}
              </p>
              <p>
                <strong>Admission:</strong> {studentData?.admissionNumber}
              </p>
              <p>
                <strong>Class:</strong> {studentData?.studentClass}{" "}
                {studentData?.classArm}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span className="badge bg-success">{studentData?.status}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Attendance Card */}
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Attendance</h5>
            </div>
            <div className="card-body text-center">
              <h1 className="display-1 text-success">
                {attendance?.attendancePercentage?.toFixed(1)}%
              </h1>
              <p>Attendance Rate</p>
              <div className="progress" style={{ height: "10px" }}>
                <div
                  className="progress-bar bg-success"
                  style={{ width: `${attendance?.attendancePercentage || 0}%` }}
                ></div>
              </div>
              <p className="mt-3">
                Present: {attendance?.daysPresent} | Absent:{" "}
                {attendance?.daysAbsent}
              </p>
            </div>
          </div>
        </div>

        {/* Fee Status Card */}
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-header bg-warning">
              <h5 className="mb-0">Fee Status</h5>
            </div>
            <div className="card-body">
              {fees.map((fee) => (
                <div key={fee.id} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>{fee.feeType}</span>
                    <span
                      className={
                        fee.status === "PAID" ? "text-success" : "text-danger"
                      }
                    >
                      ₦{fee.balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="progress" style={{ height: "5px" }}>
                    <div
                      className="progress-bar bg-success"
                      style={{
                        width: `${(fee.paidAmount / fee.amount) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <small className="text-muted">
                    Due: {moment(fee.dueDate).format("DD/MM/YYYY")}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Results */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
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
                  {recentResults.map((subject, index) => (
                    <tr key={index}>
                      <td>{subject.subject}</td>
                      <td>{subject.continuousAssessment}</td>
                      <td>{subject.examination}</td>
                      <td>
                        <strong>{subject.total}</strong>
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
                          {subject.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="mb-3">Quick Links</h5>
              <div className="d-flex gap-2 flex-wrap">
                <Link to="/results" className="btn btn-outline-primary">
                  <FaChartBar className="me-2" /> View All Results
                </Link>
                <Link to="/attendance" className="btn btn-outline-success">
                  <FaCalendarAlt className="me-2" /> Attendance History
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
    </div>
  );
}

export default StudentDashboard;

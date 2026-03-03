// src/components/SessionResult.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { studentAPI, sessionResultAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaChartBar,
  FaDownload,
  FaEye,
  FaPrint,
  FaTrophy,
  FaUsers,
  FaSchool,
  FaGraduationCap,
  FaArrowLeft,
  FaSpinner,
  FaUserGraduate,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaPlus,
  FaFilter,
  FaSync,
  FaFilePdf,
  FaFileExcel,
} from "react-icons/fa";
import moment from "moment";
import "./SessionResult.css";

function SessionResult() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [session, setSession] = useState("2025/2026");
  const [sessionResult, setSessionResult] = useState(null);
  const [rankings, setRankings] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [graduates, setGraduates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("view");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedArm, setSelectedArm] = useState("");

  const sessions = ["2023/2024", "2024/2025", "2025/2026", "2026/2027"];
  const terms = ["FIRST", "SECOND", "THIRD"];
  const classes = [
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

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchSessionResult();
    }
  }, [selectedStudent, session]);

  const fetchStudents = async () => {
    try {
      const response = await studentAPI.getAllStudents();
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    }
  };

  const fetchSessionResult = async () => {
    if (!selectedStudent) return;

    setLoading(true);
    try {
      const response = await sessionResultAPI.getSessionResult(
        selectedStudent.id,
        session,
      );
      setSessionResult(response.data);
    } catch (error) {
      console.error("Error fetching session result:", error);
      setSessionResult(null);
      toast.error("No session result found for this student");
    } finally {
      setLoading(false);
    }
  };

  const fetchRankings = async (type, className, arm) => {
    setLoading(true);
    try {
      let response;
      if (type === "school") {
        response = await sessionResultAPI.getSchoolRankings(session);
      } else if (type === "class" && className) {
        response = await sessionResultAPI.getClassRankings(className, session);
      } else if (type === "arm" && className && arm) {
        response = await sessionResultAPI.getArmRankings(
          className,
          arm,
          session,
        );
      }
      setRankings(response.data);
    } catch (error) {
      console.error("Error fetching rankings:", error);
      toast.error("Failed to load rankings");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await sessionResultAPI.getSessionStatistics(session);
      setStatistics(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchGraduates = async () => {
    setLoading(true);
    try {
      const response = await sessionResultAPI.getGraduationList(session);
      setGraduates(response.data);
    } catch (error) {
      console.error("Error fetching graduates:", error);
      toast.error("Failed to load graduation list");
    } finally {
      setLoading(false);
    }
  };

  const calculateAllResults = async () => {
    if (
      !window.confirm(
        `Calculate session results for all students in ${session}? This may take a moment.`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response =
        await sessionResultAPI.calculateAllSessionResults(session);
      toast.success(
        `Session results calculated for ${response.data.length} students`,
      );
      if (selectedStudent) {
        fetchSessionResult();
      }
    } catch (error) {
      console.error("Error calculating results:", error);
      toast.error("Failed to calculate session results");
    } finally {
      setLoading(false);
    }
  };

  const promoteStudents = async () => {
    if (
      !window.confirm(
        `Promote students based on ${session} results? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await sessionResultAPI.promoteStudents(session);
      toast.success(
        `Promotion complete: ${response.data.promoted} promoted, ${response.data.graduated} graduated, ${response.data.retained} retained`,
      );
      if (selectedStudent) {
        fetchSessionResult();
      }
    } catch (error) {
      console.error("Error promoting students:", error);
      toast.error("Failed to promote students");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return num !== null && num !== undefined ? num.toFixed(2) : "0.00";
  };

  const getGradeFromAverage = (avg) => {
    if (avg >= 70) return { grade: "A", class: "success" };
    if (avg >= 60) return { grade: "B", class: "primary" };
    if (avg >= 50) return { grade: "C", class: "info" };
    if (avg >= 45) return { grade: "D", class: "warning" };
    if (avg >= 40) return { grade: "E", class: "secondary" };
    return { grade: "F", class: "danger" };
  };

  const getPromotionBadge = (promoted) => {
    return promoted ? (
      <span className="badge bg-success">
        <FaCheckCircle className="me-1" /> Promoted
      </span>
    ) : (
      <span className="badge bg-danger">
        <FaTimesCircle className="me-1" /> Retained
      </span>
    );
  };

  return (
    <div className="session-result">
      <div className="content-header">
        <h2>
          <FaGraduationCap className="me-2" /> Session Result Management
        </h2>
        <p className="text-muted">Manage annual results and promotions</p>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === "view" ? "active" : ""}`}
          onClick={() => setActiveTab("view")}
        >
          <FaEye /> View Results
        </button>
        <button
          className={`tab-btn ${activeTab === "rankings" ? "active" : ""}`}
          onClick={() => setActiveTab("rankings")}
        >
          <FaTrophy /> Rankings
        </button>
        <button
          className={`tab-btn ${activeTab === "statistics" ? "active" : ""}`}
          onClick={() => setActiveTab("statistics")}
        >
          <FaChartBar /> Statistics
        </button>
        <button
          className={`tab-btn ${activeTab === "graduates" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("graduates");
            fetchGraduates();
          }}
        >
          <FaGraduationCap /> Graduates
        </button>
      </div>

      {/* Controls */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Session</label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
            >
              {sessions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Student</label>
            <select
              value={selectedStudent?.id || ""}
              onChange={(e) => {
                const student = students.find(
                  (s) => s.id === parseInt(e.target.value),
                );
                setSelectedStudent(student);
              }}
            >
              <option value="">Select Student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} - {s.admissionNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>&nbsp;</label>
            <button
              className="btn-primary"
              onClick={calculateAllResults}
              disabled={loading}
            >
              {loading ? <FaSpinner className="spin" /> : <FaPlus />}
              Calculate All
            </button>
          </div>

          <div className="filter-group">
            <label>&nbsp;</label>
            <button
              className="btn-success"
              onClick={promoteStudents}
              disabled={loading}
            >
              <FaGraduationCap /> Promote Students
            </button>
          </div>

          <div className="filter-group">
            <label>&nbsp;</label>
            <button className="btn-info" onClick={() => fetchStatistics()}>
              <FaSync /> Refresh Stats
            </button>
          </div>
        </div>
      </div>

      {/* View Results Tab */}
      {activeTab === "view" && (
        <div className="view-results">
          {selectedStudent && sessionResult ? (
            <div className="result-card">
              <div className="result-header">
                <h4>Annual Session Result: {session}</h4>
              </div>
              <div className="result-body">
                {/* Student Info */}
                <div className="student-info">
                  <div>
                    <h6>Student Information</h6>
                    <p>
                      <strong>Name:</strong>{" "}
                      {selectedStudent?.fullName || "N/A"}
                    </p>
                    <p>
                      <strong>Admission:</strong>{" "}
                      {selectedStudent?.admissionNumber || "N/A"}
                    </p>
                    <p>
                      <strong>Class:</strong>{" "}
                      {selectedStudent?.studentClass || "N/A"}{" "}
                      {selectedStudent?.classArm || ""}
                    </p>
                  </div>
                  <div>
                    <h6>Promotion Status</h6>
                    <p>
                      <strong>Status:</strong>{" "}
                      {sessionResult.promoted !== undefined ? (
                        getPromotionBadge(sessionResult.promoted)
                      ) : (
                        <span className="badge bg-secondary">Unknown</span>
                      )}
                    </p>
                    <p>
                      <strong>Remark:</strong>{" "}
                      {sessionResult.promotionRemark || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Term Summaries */}
                <div className="summary-cards">
                  <div className="summary-card">
                    <h6>First Term</h6>
                    <p className="text-primary">
                      {formatNumber(sessionResult.firstTermAverage)}%
                    </p>
                    <small>
                      Position: {sessionResult.firstTermPosition || "N/A"}
                    </small>
                  </div>
                  <div className="summary-card">
                    <h6>Second Term</h6>
                    <p className="text-success">
                      {formatNumber(sessionResult.secondTermAverage)}%
                    </p>
                    <small>
                      Position: {sessionResult.secondTermPosition || "N/A"}
                    </small>
                  </div>
                  <div className="summary-card">
                    <h6>Third Term</h6>
                    <p className="text-warning">
                      {formatNumber(sessionResult.thirdTermAverage)}%
                    </p>
                    <small>
                      Position: {sessionResult.thirdTermPosition || "N/A"}
                    </small>
                  </div>
                </div>

                {/* Subject Performance */}
                {sessionResult.subjectAverages &&
                  Object.keys(sessionResult.subjectAverages).length > 0 && (
                    <div className="subject-section">
                      <h6>Subject Performance (Annual Averages)</h6>
                      <div className="table-responsive">
                        <table className="result-table">
                          <thead>
                            <tr>
                              <th>Subject</th>
                              <th>Annual Average</th>
                              <th>Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(sessionResult.subjectAverages).map(
                              ([subject, average], index) => {
                                const grade = getGradeFromAverage(average);
                                return (
                                  <tr key={index}>
                                    <td className="fw-bold">{subject}</td>
                                    <td className="fw-bold">
                                      {formatNumber(average)}%
                                    </td>
                                    <td>
                                      <span
                                        className={`badge bg-${grade.class}`}
                                      >
                                        {grade.grade}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* Annual Summary */}
                <div className="summary-cards">
                  <div className="summary-card">
                    <h6>Annual Total</h6>
                    <p className="text-primary">
                      {sessionResult.annualTotal || 0}
                    </p>
                  </div>
                  <div className="summary-card">
                    <h6>Annual Average</h6>
                    <p className="text-success">
                      {formatNumber(sessionResult.annualAverage)}%
                    </p>
                  </div>
                  <div className="summary-card">
                    <h6>Class Position</h6>
                    <p className="text-warning">
                      {sessionResult.annualPositionInClass || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="summary-cards">
                  <div className="summary-card">
                    <h6>Attendance Summary</h6>
                    <table className="attendance-table">
                      <tbody>
                        <tr>
                          <th>Total School Days:</th>
                          <td className="fw-bold">
                            {sessionResult.totalSchoolDays || 0}
                          </td>
                        </tr>
                        <tr>
                          <th>Days Present:</th>
                          <td className="fw-bold text-success">
                            {sessionResult.daysPresent || 0}
                          </td>
                        </tr>
                        <tr>
                          <th>Days Absent:</th>
                          <td className="fw-bold text-danger">
                            {sessionResult.daysAbsent || 0}
                          </td>
                        </tr>
                        <tr>
                          <th>Attendance Rate:</th>
                          <td className="fw-bold">
                            {sessionResult.attendancePercentage?.toFixed(1) ||
                              0}
                            %
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="summary-card">
                    <h6>Attendance Performance</h6>
                    <div className="text-center mb-3">
                      <div className="progress" style={{ height: "20px" }}>
                        <div
                          className={`progress-bar ${
                            (sessionResult.attendancePercentage || 0) >= 90
                              ? "bg-success"
                              : (sessionResult.attendancePercentage || 0) >= 75
                                ? "bg-primary"
                                : (sessionResult.attendancePercentage || 0) >=
                                    60
                                  ? "bg-warning"
                                  : "bg-danger"
                          }`}
                          style={{
                            width: `${sessionResult.attendancePercentage || 0}%`,
                          }}
                        >
                          {sessionResult.attendancePercentage?.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <p className="mb-0">
                      <strong>Status:</strong>{" "}
                      {(sessionResult.attendancePercentage || 0) >= 90 ? (
                        <span className="badge bg-success">
                          Excellent Attendance
                        </span>
                      ) : (sessionResult.attendancePercentage || 0) >= 75 ? (
                        <span className="badge bg-primary">
                          Good Attendance
                        </span>
                      ) : (sessionResult.attendancePercentage || 0) >= 60 ? (
                        <span className="badge bg-warning">
                          Fair Attendance
                        </span>
                      ) : (
                        <span className="badge bg-danger">Poor Attendance</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert-info">
              {selectedStudent
                ? sessionResult === null
                  ? "No session result found for this student"
                  : "Loading..."
                : "Please select a student to view results"}
            </div>
          )}
        </div>
      )}

      {/* Rankings Tab */}
      {activeTab === "rankings" && (
        <div className="rankings-tab">
          <div className="filters-row">
            <button
              className="btn-primary"
              onClick={() => fetchRankings("school")}
            >
              <FaTrophy /> School Rankings
            </button>

            <select
              className="form-select"
              onChange={(e) => fetchRankings("class", e.target.value)}
            >
              <option value="">Select Class</option>
              {[...new Set(students.map((s) => s.studentClass))].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              onChange={(e) => {
                const [className, arm] = e.target.value.split("|");
                fetchRankings("arm", className, arm);
              }}
            >
              <option value="">Select Class & Arm</option>
              {students.map((s) => (
                <option key={s.id} value={`${s.studentClass}|${s.classArm}`}>
                  {s.studentClass} {s.classArm}
                </option>
              ))}
            </select>
          </div>

          {rankings && (
            <div className="rankings-card">
              <div className="rankings-header">
                <h4>
                  {rankings.className
                    ? `${rankings.className} ${rankings.arm || ""} `
                    : "School "}
                  Rankings - {rankings.session} Session
                </h4>
              </div>
              <div className="rankings-body">
                <div className="table-responsive">
                  <table className="rankings-table">
                    <thead>
                      <tr>
                        <th>Position</th>
                        <th>Student Name</th>
                        <th>Admission No</th>
                        <th>Class</th>
                        <th>Arm</th>
                        <th>Annual Average</th>
                        <th>Attendance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.rankings?.map((rank, index) => (
                        <tr key={index}>
                          <td>
                            {rank.position === 1 && "🥇 "}
                            {rank.position === 2 && "🥈 "}
                            {rank.position === 3 && "🥉 "}
                            <strong>{rank.position}</strong>
                          </td>
                          <td>{rank.studentName}</td>
                          <td>{rank.admissionNumber}</td>
                          <td>{rank.studentClass}</td>
                          <td>{rank.classArm}</td>
                          <td>
                            <strong className="text-success">
                              {rank.annualAverage?.toFixed(2)}%
                            </strong>
                          </td>
                          <td>
                            <span
                              className={
                                rank.attendance >= 75
                                  ? "text-success"
                                  : "text-danger"
                              }
                            >
                              {rank.attendance?.toFixed(1)}%
                            </span>
                          </td>
                          <td>
                            {rank.promoted ? (
                              <span className="badge bg-success">Promoted</span>
                            ) : (
                              <span className="badge bg-danger">Retained</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="total-count">
                  Total Students: {rankings.totalStudents}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === "statistics" && (
        <div className="statistics-tab">
          {loading ? (
            <div className="text-center py-5">
              <FaSpinner className="spin" size={40} />
              <p className="mt-3">Loading statistics...</p>
            </div>
          ) : statistics ? (
            <>
              {/* Summary Cards */}
              <div className="stats-grid">
                <div className="stat-card primary">
                  <FaUsers size={30} />
                  <div>
                    <h3>{statistics.totalStudents || 0}</h3>
                    <p>Total Students</p>
                  </div>
                </div>

                <div className="stat-card success">
                  <FaCheckCircle size={30} />
                  <div>
                    <h3>{statistics.promoted || 0}</h3>
                    <p>Promoted</p>
                  </div>
                  <div className="progress">
                    <div
                      style={{
                        width: `${(statistics.promoted / (statistics.totalStudents || 1)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="stat-card danger">
                  <FaTimesCircle size={30} />
                  <div>
                    <h3>{statistics.retained || 0}</h3>
                    <p>Retained</p>
                  </div>
                  <div className="progress">
                    <div
                      style={{
                        width: `${(statistics.retained / (statistics.totalStudents || 1)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="stat-card warning">
                  <FaTrophy size={30} />
                  <div>
                    <h3>{statistics.promotionRate?.toFixed(1) || 0}%</h3>
                    <p>Promotion Rate</p>
                  </div>
                </div>
              </div>

              {/* Performance Overview */}
              <div className="performance-grid">
                <div className="card">
                  <div className="card-header">Performance Overview</div>
                  <div className="card-body">
                    <div className="metric">
                      <span>Overall Average</span>
                      <strong>
                        {statistics.overallAverage?.toFixed(2) || 0}%
                      </strong>
                      <div className="progress">
                        <div
                          style={{
                            width: `${statistics.overallAverage || 0}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="metric">
                      <span>Highest Average</span>
                      <strong className="text-success">
                        {statistics.highestAverage?.toFixed(2) || 0}%
                      </strong>
                      <div className="progress">
                        <div
                          className="bg-success"
                          style={{
                            width: `${statistics.highestAverage || 0}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="metric">
                      <span>Lowest Average</span>
                      <strong className="text-danger">
                        {statistics.lowestAverage?.toFixed(2) || 0}%
                      </strong>
                      <div className="progress">
                        <div
                          className="bg-danger"
                          style={{ width: `${statistics.lowestAverage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grade Distribution */}
                <div className="card">
                  <div className="card-header">Grade Distribution</div>
                  <div className="card-body">
                    {statistics.gradeDistribution &&
                    Object.keys(statistics.gradeDistribution).length > 0 ? (
                      Object.entries(statistics.gradeDistribution).map(
                        ([grade, count]) => (
                          <div key={grade} className="grade-item">
                            <span
                              className={`badge bg-${grade === "A" ? "success" : grade === "B" ? "primary" : grade === "C" ? "info" : grade === "D" ? "warning" : grade === "E" ? "secondary" : "danger"}`}
                            >
                              Grade {grade}
                            </span>
                            <span>{count} students</span>
                            <div className="progress">
                              <div
                                style={{
                                  width: `${(count / (statistics.totalStudents || 1)) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ),
                      )
                    ) : (
                      <p className="text-muted">
                        No grade distribution data available
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="alert-info">
              Click "Refresh Stats" to load session statistics
            </div>
          )}
        </div>
      )}

      {/* Graduates Tab */}
      {activeTab === "graduates" && (
        <div className="graduates-tab">
          <div className="card">
            <div className="card-header bg-warning">
              <h5>Graduation List - {session}</h5>
            </div>
            <div className="card-body">
              {graduates.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>S/N</th>
                        <th>Student Name</th>
                        <th>Admission No</th>
                        <th>Final Average</th>
                        <th>Attendance</th>
                        <th>Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {graduates.map((grad, index) => (
                        <tr key={grad.studentId}>
                          <td>{index + 1}</td>
                          <td>{grad.studentName}</td>
                          <td>{grad.admissionNumber}</td>
                          <td className="fw-bold text-success">
                            {grad.finalAverage?.toFixed(2)}%
                          </td>
                          <td>{grad.attendance?.toFixed(1)}%</td>
                          <td>{grad.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted text-center py-4">
                  No graduates found for this session
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionResult;

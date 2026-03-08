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
} from "react-icons/fa";
import moment from "moment";

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
  const [rankingsType, setRankingsType] = useState("school");
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
      toast.success("Rankings loaded successfully");
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
      toast.success("Statistics loaded successfully");
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
      toast.success("Graduation list loaded successfully");
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
    <div className="session-result container-fluid py-4">
      <h2 className="mb-4">Session Result Management</h2>

      {/* Tabs with New Colors */}
      <div className="d-flex gap-2 mb-4">
        <button
          className={`btn ${activeTab === "view" ? "active" : ""}`}
          onClick={() => setActiveTab("view")}
          style={{
            backgroundColor: activeTab === "view" ? "#4CAF50" : "#f8f9fa",
            color: activeTab === "view" ? "white" : "#495057",
            border: activeTab === "view" ? "none" : "1px solid #dee2e6",
            padding: "10px 20px",
            fontWeight: "500",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FaEye /> View Results
        </button>

        <button
          className={`btn ${activeTab === "rankings" ? "active" : ""}`}
          onClick={() => setActiveTab("rankings")}
          style={{
            backgroundColor: activeTab === "rankings" ? "#FF9800" : "#f8f9fa",
            color: activeTab === "rankings" ? "white" : "#495057",
            border: activeTab === "rankings" ? "none" : "1px solid #dee2e6",
            padding: "10px 20px",
            fontWeight: "500",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FaTrophy /> Rankings
        </button>

        <button
          className={`btn ${activeTab === "statistics" ? "active" : ""}`}
          onClick={() => setActiveTab("statistics")}
          style={{
            backgroundColor: activeTab === "statistics" ? "#2196F3" : "#f8f9fa",
            color: activeTab === "statistics" ? "white" : "#495057",
            border: activeTab === "statistics" ? "none" : "1px solid #dee2e6",
            padding: "10px 20px",
            fontWeight: "500",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FaChartBar /> Statistics
        </button>

        <button
          className={`btn ${activeTab === "graduates" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("graduates");
            fetchGraduates();
          }}
          style={{
            backgroundColor: activeTab === "graduates" ? "#9C27B0" : "#f8f9fa",
            color: activeTab === "graduates" ? "white" : "#495057",
            border: activeTab === "graduates" ? "none" : "1px solid #dee2e6",
            padding: "10px 20px",
            fontWeight: "500",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FaGraduationCap /> Graduates
        </button>
      </div>

      {/* Session Selection Row - Always Visible */}
      <div className="row mb-4 align-items-end">
        <div className="col-md-3">
          <label className="form-label fw-bold">Academic Session</label>
          <select
            className="form-select"
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

        {/* Action Buttons - Always Visible */}
        <div className="col-md-9">
          <div className="d-flex gap-2 justify-content-end">
            <button
              className="btn"
              onClick={calculateAllResults}
              disabled={loading}
              style={{
                backgroundColor: "#dc3545",
                borderColor: "#dc3545",
                color: "white",
                padding: "10px 20px",
                fontWeight: "500",
                minWidth: "130px",
                borderRadius: "6px",
              }}
            >
              {loading ? <FaSpinner className="spinner" /> : "📊 Calculate All"}
            </button>

            <button
              className="btn"
              onClick={promoteStudents}
              disabled={loading}
              style={{
                backgroundColor: "#28a745",
                borderColor: "#28a745",
                color: "white",
                padding: "10px 20px",
                fontWeight: "500",
                minWidth: "150px",
                borderRadius: "6px",
              }}
            >
              🎓 Promote Students
            </button>

            <button
              className="btn"
              onClick={() => fetchStatistics()}
              disabled={loading}
              style={{
                backgroundColor: "#17a2b8",
                borderColor: "#17a2b8",
                color: "white",
                padding: "10px 20px",
                fontWeight: "500",
                minWidth: "130px",
                borderRadius: "6px",
              }}
            >
              📈 Refresh Stats
            </button>
          </div>
        </div>
      </div>

      {/* Tab-specific Controls */}
      {activeTab === "view" && (
        <div className="row mb-4">
          <div className="col-md-12">
            <div className="card">
              <div className="card-body">
                <div className="row align-items-end">
                  <div className="col-md-8">
                    <label className="form-label fw-bold">Select Student</label>
                    <select
                      className="form-select"
                      value={selectedStudent?.id || ""}
                      onChange={(e) => {
                        const student = students.find(
                          (s) => s.id === parseInt(e.target.value),
                        );
                        setSelectedStudent(student);
                      }}
                    >
                      <option value="">-- Choose a student --</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} - {s.admissionNumber} ({s.studentClass}{" "}
                          {s.classArm})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <button
                      className="btn w-100"
                      onClick={() => selectedStudent && fetchSessionResult()}
                      disabled={!selectedStudent || loading}
                      style={{
                        backgroundColor: "#4CAF50",
                        borderColor: "#4CAF50",
                        color: "white",
                        padding: "10px",
                        fontWeight: "500",
                        borderRadius: "6px",
                      }}
                    >
                      Load Result
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "rankings" && (
        <div className="row mb-4">
          <div className="col-md-12">
            <div className="card">
              <div className="card-body">
                <div className="row align-items-end">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Rankings Type</label>
                    <select
                      className="form-select"
                      value={rankingsType}
                      onChange={(e) => setRankingsType(e.target.value)}
                    >
                      <option value="school">🏫 School Rankings</option>
                      <option value="class">📚 Class Rankings</option>
                      <option value="arm">👥 Class Arm Rankings</option>
                    </select>
                  </div>

                  {rankingsType !== "school" && (
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Class</label>
                      <select
                        className="form-select"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                      >
                        <option value="">Select Class</option>
                        {classes.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {rankingsType === "arm" && (
                    <div className="col-md-2">
                      <label className="form-label fw-bold">Arm</label>
                      <select
                        className="form-select"
                        value={selectedArm}
                        onChange={(e) => setSelectedArm(e.target.value)}
                      >
                        <option value="">Select Arm</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </div>
                  )}

                  <div
                    className={`col-md-${rankingsType === "school" ? "3" : rankingsType === "arm" ? "2" : "4"}`}
                  >
                    <button
                      className="btn w-100"
                      onClick={() =>
                        fetchRankings(rankingsType, selectedClass, selectedArm)
                      }
                      disabled={loading}
                      style={{
                        backgroundColor: "#FF9800",
                        borderColor: "#FF9800",
                        color: "white",
                        padding: "10px",
                        fontWeight: "500",
                        borderRadius: "6px",
                      }}
                    >
                      View Rankings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "graduates" && (
        <div className="row mb-4">
          <div className="col-md-12">
            <div className="card">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-12">
                    <button
                      className="btn"
                      onClick={fetchGraduates}
                      disabled={loading}
                      style={{
                        backgroundColor: "#9C27B0",
                        borderColor: "#9C27B0",
                        color: "white",
                        padding: "10px 20px",
                        fontWeight: "500",
                        borderRadius: "6px",
                      }}
                    >
                      {loading ? (
                        <FaSpinner className="spinner" />
                      ) : (
                        "Load Graduates"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Results Tab Content */}
      {activeTab === "view" && (
        <div className="view-results">
          {selectedStudent && sessionResult ? (
            <div className="card">
              <div
                className="card-header"
                style={{ background: "#4CAF50", color: "white" }}
              >
                <h5 className="mb-0">Annual Session Result: {session}</h5>
              </div>
              <div className="card-body">
                {/* Student Info */}
                <div className="row mb-4">
                  <div className="col-md-6">
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
                  <div className="col-md-6">
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
                <div className="row mb-4">
                  <div className="col-md-4">
                    <div className="border p-3 rounded text-center">
                      <h6>First Term</h6>
                      <h3 className="text-primary">
                        {formatNumber(sessionResult.firstTermAverage)}%
                      </h3>
                      <p>
                        Position: {sessionResult.firstTermPosition || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="border p-3 rounded text-center">
                      <h6>Second Term</h6>
                      <h3 className="text-success">
                        {formatNumber(sessionResult.secondTermAverage)}%
                      </h3>
                      <p>
                        Position: {sessionResult.secondTermPosition || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="border p-3 rounded text-center">
                      <h6>Third Term</h6>
                      <h3 className="text-warning">
                        {formatNumber(sessionResult.thirdTermAverage)}%
                      </h3>
                      <p>
                        Position: {sessionResult.thirdTermPosition || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subject Performance */}
                {sessionResult.subjectAverages &&
                Object.keys(sessionResult.subjectAverages).length > 0 ? (
                  <div className="mb-4">
                    <h6>Subject Performance (Annual Averages)</h6>
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead className="bg-light">
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
                                  <td>{subject}</td>
                                  <td className="fw-bold">
                                    {formatNumber(average)}%
                                  </td>
                                  <td>
                                    <span className={`badge bg-${grade.class}`}>
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
                ) : (
                  <div className="alert alert-info">
                    No subject performance data available
                  </div>
                )}

                {/* Annual Summary */}
                <div className="row">
                  <div className="col-md-4">
                    <div className="border p-3 rounded bg-light">
                      <h6>Annual Total</h6>
                      <h3 className="text-primary">
                        {sessionResult.annualTotal || 0}
                      </h3>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="border p-3 rounded bg-light">
                      <h6>Annual Average</h6>
                      <h3 className="text-success">
                        {formatNumber(sessionResult.annualAverage)}%
                      </h3>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="border p-3 rounded bg-light">
                      <h6>Class Position</h6>
                      <h3 className="text-warning">
                        {sessionResult.annualPositionInClass || "N/A"}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="row mt-3">
                  <div className="col-md-6">
                    <div className="border p-3 rounded bg-light">
                      <h6>Attendance Summary</h6>
                      <table className="table table-sm">
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
                  </div>
                  <div className="col-md-6">
                    <div className="border p-3 rounded bg-light">
                      <h6>Attendance Performance</h6>
                      <div className="text-center mb-3">
                        <div className="progress" style={{ height: "20px" }}>
                          <div
                            className={`progress-bar ${
                              (sessionResult.attendancePercentage || 0) >= 90
                                ? "bg-success"
                                : (sessionResult.attendancePercentage || 0) >=
                                    75
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
                          <span className="badge bg-danger">
                            Poor Attendance
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-info">
              {selectedStudent
                ? sessionResult === null
                  ? "No session result found for this student"
                  : "Loading..."
                : "Please select a student to view results"}
            </div>
          )}
        </div>
      )}

      {/* Rankings Tab Content */}
      {activeTab === "rankings" && (
        <div className="rankings">
          {rankings ? (
            <div className="card">
              <div
                className="card-header"
                style={{ background: "#FF9800", color: "white" }}
              >
                <h5 className="mb-0">
                  {rankings.className
                    ? `${rankings.className} ${rankings.arm || ""} `
                    : "School "}
                  Rankings - {rankings.session} Session
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
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
                <p className="text-muted mt-3">
                  Total Students: {rankings.totalStudents}
                </p>
              </div>
            </div>
          ) : (
            <div className="alert alert-info">
              Select rankings type and click "View Rankings" to see results
            </div>
          )}
        </div>
      )}

      {/* Statistics Tab Content */}
      {activeTab === "statistics" && (
        <div className="statistics">
          {loading ? (
            <div className="text-center py-5">
              <FaSpinner className="spinner" size={40} />
              <p className="mt-3">Loading statistics...</p>
            </div>
          ) : statistics ? (
            <>
              {/* Summary Cards */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <div
                    className="stat-card"
                    style={{ background: "#2196F3", color: "white" }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white-50 mb-1">Total Students</h6>
                        <h2 className="mb-0">
                          {statistics.totalStudents || 0}
                        </h2>
                      </div>
                      <FaUsers size={40} className="opacity-50" />
                    </div>
                    <div className="mt-3 small">
                      <span className="text-white-50">Across all classes</span>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div
                    className="stat-card"
                    style={{ background: "#28a745", color: "white" }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white-50 mb-1">Promoted</h6>
                        <h2 className="mb-0">{statistics.promoted || 0}</h2>
                      </div>
                      <FaCheckCircle size={40} className="opacity-50" />
                    </div>
                    <div
                      className="progress mt-3"
                      style={{
                        height: "5px",
                        background: "rgba(255,255,255,0.3)",
                      }}
                    >
                      <div
                        className="progress-bar bg-white"
                        style={{
                          width: `${(statistics.promoted / (statistics.totalStudents || 1)) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="mt-2 small">
                      {(
                        (statistics.promoted /
                          (statistics.totalStudents || 1)) *
                        100
                      ).toFixed(1)}
                      % promotion rate
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div
                    className="stat-card"
                    style={{ background: "#dc3545", color: "white" }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white-50 mb-1">Retained</h6>
                        <h2 className="mb-0">{statistics.retained || 0}</h2>
                      </div>
                      <FaTimesCircle size={40} className="opacity-50" />
                    </div>
                    <div
                      className="progress mt-3"
                      style={{
                        height: "5px",
                        background: "rgba(255,255,255,0.3)",
                      }}
                    >
                      <div
                        className="progress-bar bg-white"
                        style={{
                          width: `${(statistics.retained / (statistics.totalStudents || 1)) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="mt-2 small">
                      {(
                        (statistics.retained /
                          (statistics.totalStudents || 1)) *
                        100
                      ).toFixed(1)}
                      % retention rate
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div
                    className="stat-card"
                    style={{ background: "#ffc107", color: "#212529" }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-dark-50 mb-1">Promotion Rate</h6>
                        <h2 className="mb-0">
                          {statistics.promotionRate?.toFixed(1) || 0}%
                        </h2>
                      </div>
                      <FaTrophy size={40} className="opacity-50" />
                    </div>
                    <div className="mt-3 small">
                      {statistics.promoted} out of {statistics.totalStudents}{" "}
                      students
                    </div>
                  </div>
                </div>
              </div>

              {/* Rest of the statistics content remains the same */}
              {/* Performance Overview */}
              <div className="row mb-4">
                <div className="col-md-4">
                  <div className="card h-100">
                    <div
                      className="card-header"
                      style={{ background: "#2196F3", color: "white" }}
                    >
                      <h5 className="mb-0">
                        <FaChartBar className="me-2" /> Performance Overview
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span>Overall Average</span>
                          <span className="fw-bold">
                            {statistics.overallAverage?.toFixed(2) || 0}%
                          </span>
                        </div>
                        <div className="progress" style={{ height: "8px" }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${statistics.overallAverage || 0}%`,
                              backgroundColor: "#2196F3",
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span>Highest Average</span>
                          <span className="fw-bold text-success">
                            {statistics.highestAverage?.toFixed(2) || 0}%
                          </span>
                        </div>
                        <div className="progress" style={{ height: "8px" }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${statistics.highestAverage || 0}%`,
                              backgroundColor: "#28a745",
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span>Lowest Average</span>
                          <span className="fw-bold text-danger">
                            {statistics.lowestAverage?.toFixed(2) || 0}%
                          </span>
                        </div>
                        <div className="progress" style={{ height: "8px" }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${statistics.lowestAverage || 0}%`,
                              backgroundColor: "#dc3545",
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Class Performance */}
                <div className="col-md-8">
                  <div className="card h-100">
                    <div
                      className="card-header"
                      style={{ background: "#28a745", color: "white" }}
                    >
                      <h5 className="mb-0">
                        <FaSchool className="me-2" /> Class Performance
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead className="table-light">
                            <tr>
                              <th>Class</th>
                              <th>Average</th>
                              <th>Performance</th>
                              <th>Students</th>
                              <th>Promotion Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(
                              statistics.classPerformance || {},
                            ).map(([className, avg]) => {
                              const classStudents = students.filter(
                                (s) => s.studentClass === className,
                              );
                              const classPromoted =
                                statistics.classPromoted?.[className] ||
                                Math.floor(classStudents.length * (avg / 100));
                              const promotionRate =
                                classStudents.length > 0
                                  ? (
                                      (classPromoted / classStudents.length) *
                                      100
                                    ).toFixed(1)
                                  : 0;

                              return (
                                <tr key={className}>
                                  <td className="fw-bold">{className}</td>
                                  <td className="fw-bold">
                                    {avg?.toFixed(2) || 0}%
                                  </td>
                                  <td style={{ minWidth: "150px" }}>
                                    <div
                                      className="progress"
                                      style={{ height: "8px" }}
                                    >
                                      <div
                                        className="progress-bar"
                                        style={{
                                          width: `${avg || 0}%`,
                                          backgroundColor:
                                            avg >= 70
                                              ? "#28a745"
                                              : avg >= 50
                                                ? "#ffc107"
                                                : "#dc3545",
                                        }}
                                      ></div>
                                    </div>
                                  </td>
                                  <td>{classStudents.length}</td>
                                  <td>
                                    <span
                                      className="badge"
                                      style={{
                                        backgroundColor:
                                          promotionRate >= 90
                                            ? "#28a745"
                                            : promotionRate >= 70
                                              ? "#2196F3"
                                              : promotionRate >= 50
                                                ? "#ffc107"
                                                : "#dc3545",
                                        color:
                                          promotionRate >= 50
                                            ? "white"
                                            : "white",
                                      }}
                                    >
                                      {promotionRate}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grade Distribution */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card">
                    <div
                      className="card-header"
                      style={{ background: "#17a2b8", color: "white" }}
                    >
                      <h5 className="mb-0">Grade Distribution</h5>
                    </div>
                    <div className="card-body">
                      {statistics.gradeDistribution &&
                      Object.keys(statistics.gradeDistribution).length > 0 ? (
                        <div className="row">
                          {Object.entries(statistics.gradeDistribution).map(
                            ([grade, count]) => {
                              const percentage = (
                                (count / (statistics.totalStudents || 1)) *
                                100
                              ).toFixed(1);

                              return (
                                <div className="col-md-6 mb-3" key={grade}>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <span
                                        className="badge p-2 me-2"
                                        style={{
                                          backgroundColor:
                                            grade === "A"
                                              ? "#28a745"
                                              : grade === "B"
                                                ? "#2196F3"
                                                : grade === "C"
                                                  ? "#17a2b8"
                                                  : grade === "D"
                                                    ? "#ffc107"
                                                    : grade === "E"
                                                      ? "#6c757d"
                                                      : "#dc3545",
                                          color: "white",
                                        }}
                                      >
                                        Grade {grade}
                                      </span>
                                    </div>
                                    <span className="fw-bold">
                                      {count} students
                                    </span>
                                  </div>
                                  <div
                                    className="progress mt-1"
                                    style={{ height: "6px" }}
                                  >
                                    <div
                                      className="progress-bar"
                                      style={{
                                        width: `${percentage}%`,
                                        backgroundColor:
                                          grade === "A"
                                            ? "#28a745"
                                            : grade === "B"
                                              ? "#2196F3"
                                              : grade === "C"
                                                ? "#17a2b8"
                                                : grade === "D"
                                                  ? "#ffc107"
                                                  : grade === "E"
                                                    ? "#6c757d"
                                                    : "#dc3545",
                                      }}
                                    ></div>
                                  </div>
                                  <small className="text-muted">
                                    {percentage}% of students
                                  </small>
                                </div>
                              );
                            },
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted">
                            No grade distribution data available
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attendance Overview */}
                <div className="col-md-6">
                  <div className="card">
                    <div
                      className="card-header"
                      style={{ background: "#ffc107", color: "#212529" }}
                    >
                      <h5 className="mb-0">
                        <FaCalendarAlt className="me-2" /> Attendance Overview
                      </h5>
                    </div>
                    <div className="card-body">
                      {statistics.attendanceStats ? (
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <div className="border rounded p-3 text-center">
                              <h6>Average Attendance</h6>
                              <h2 className="mb-0" style={{ color: "#2196F3" }}>
                                {statistics.attendanceStats.averageAttendance?.toFixed(
                                  1,
                                ) || 0}
                                %
                              </h2>
                              <small className="text-muted">
                                across all students
                              </small>
                            </div>
                          </div>
                          <div className="col-md-6 mb-3">
                            <div className="border rounded p-3 text-center">
                              <h6>Excellent Attendance</h6>
                              <h2 className="mb-0" style={{ color: "#28a745" }}>
                                {statistics.attendanceStats
                                  .excellentAttendance || 0}
                              </h2>
                              <small className="text-muted">{" (>90%)"}</small>
                            </div>
                          </div>
                          <div className="col-md-6 mb-3">
                            <div className="border rounded p-3 text-center">
                              <h6>Good Attendance</h6>
                              <h2 className="mb-0" style={{ color: "#17a2b8" }}>
                                {statistics.attendanceStats.goodAttendance || 0}
                              </h2>
                              <small className="text-muted">(75-90%)</small>
                            </div>
                          </div>
                          <div className="col-md-6 mb-3">
                            <div className="border rounded p-3 text-center">
                              <h6>Poor Attendance</h6>
                              <h2 className="mb-0" style={{ color: "#dc3545" }}>
                                {statistics.attendanceStats.poorAttendance || 0}
                              </h2>
                              <small className="text-muted">{" (<75%)"}</small>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted">
                            No attendance data available
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div className="row">
                <div className="col-12">
                  <div className="card">
                    <div
                      className="card-header"
                      style={{ background: "#9C27B0", color: "white" }}
                    >
                      <h5 className="mb-0">
                        <FaTrophy className="me-2" /> Top Performers
                      </h5>
                    </div>
                    <div className="card-body">
                      {statistics.topPerformers &&
                      statistics.topPerformers.length > 0 ? (
                        <div className="row">
                          {statistics.topPerformers.map((performer, index) => (
                            <div className="col-md-4 mb-3" key={index}>
                              <div className="card border-0 shadow-sm h-100">
                                <div className="card-body text-center">
                                  {index === 0 && (
                                    <span className="display-4">🥇</span>
                                  )}
                                  {index === 1 && (
                                    <span className="display-4">🥈</span>
                                  )}
                                  {index === 2 && (
                                    <span className="display-4">🥉</span>
                                  )}
                                  <h5 className="mt-2">
                                    {performer.studentName}
                                  </h5>
                                  <p className="text-muted mb-2">
                                    {performer.studentClass}{" "}
                                    {performer.classArm || ""}
                                  </p>
                                  <h3
                                    className="mb-0"
                                    style={{ color: "#28a745" }}
                                  >
                                    {performer.annualAverage?.toFixed(1)}%
                                  </h3>
                                  <small className="text-muted">
                                    {performer.admissionNumber}
                                  </small>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted">
                            No top performer data available
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="alert alert-info">
              Click "Refresh Stats" to load session statistics
            </div>
          )}
        </div>
      )}

      {/* Graduates Tab Content */}
      {activeTab === "graduates" && (
        <div className="graduates">
          {graduates.length > 0 ? (
            <div className="card">
              <div
                className="card-header"
                style={{ background: "#9C27B0", color: "white" }}
              >
                <h5 className="mb-0">Graduation List - {session}</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped">
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
                          <td className="fw-bold" style={{ color: "#28a745" }}>
                            {grad.finalAverage?.toFixed(2)}%
                          </td>
                          <td>{grad.attendance?.toFixed(1)}%</td>
                          <td>{grad.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-info">
              No graduates found for this session
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SessionResult;

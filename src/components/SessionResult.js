import React, { useState, useEffect, useMemo } from "react";
import { studentAPI, sessionResultAPI, sessionAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaChartBar,
  FaEye,
  FaTrophy,
  FaUsers,
  FaGraduationCap,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaSyncAlt,
} from "react-icons/fa";
import useActiveSession from "../hooks/useActiveSession";

function SessionResult() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sessionResult, setSessionResult] = useState(null);
  const [rankings, setRankings] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [graduates, setGraduates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [activeTab, setActiveTab] = useState("view");
  const [rankingsType, setRankingsType] = useState("school");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedArm, setSelectedArm] = useState("");

  const { session, setSession, loadingSession } = useActiveSession();

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

  const normalizedSessions = useMemo(() => {
    return (availableSessions || []).map((item) => ({
      id: item.id,
      session:
        item.session || item.sessionName || item.name || item.label || "",
      currentTerm: item.currentTerm || "FIRST",
      startDate: item.startDate,
      endDate: item.endDate,
      active: item.active === true || item.isActive === true,
    }));
  }, [availableSessions]);

  useEffect(() => {
    fetchStudents();
    fetchSessions();
  }, []);

  useEffect(() => {
    if (!session && normalizedSessions.length > 0) {
      const active = normalizedSessions.find((s) => s.active);
      const fallback = active || normalizedSessions[0];
      if (fallback?.session) {
        setSession(fallback.session);
      }
    }
  }, [normalizedSessions, session, setSession]);

  useEffect(() => {
    setSessionResult(null);
    setRankings(null);
    setStatistics(null);
    setGraduates([]);
  }, [session, activeTab, rankingsType, selectedClass, selectedArm]);

  useEffect(() => {
    if (selectedStudent && session) {
      fetchSessionResult();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent, session]);

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await sessionAPI.getAllSessions();
      const list = Array.isArray(response.data) ? response.data : [];

      const sorted = [...list].sort((a, b) => {
        const aDate = new Date(a.startDate || 0).getTime();
        const bDate = new Date(b.startDate || 0).getTime();
        return bDate - aDate;
      });

      setAvailableSessions(sorted);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setAvailableSessions([]);
      toast.error("Failed to load academic sessions");
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentAPI.getAllStudents();
      setStudents(response.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    }
  };

  const fetchSessionResult = async () => {
    if (!selectedStudent || !session) return;

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
    if (!session) {
      toast.error("No session selected");
      return;
    }

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
      } else {
        toast.error("Please select the required filters");
        setLoading(false);
        return;
      }

      setRankings(response.data);
      toast.success("Rankings loaded successfully");
    } catch (error) {
      console.error("Error fetching rankings:", error);
      setRankings(null);
      toast.error("Failed to load rankings");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!session) {
      toast.error("No session selected");
      return;
    }

    setLoading(true);
    try {
      const response = await sessionResultAPI.getSessionStatistics(session);
      setStatistics(response.data);
      toast.success("Statistics loaded successfully");
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setStatistics(null);
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchGraduates = async () => {
    if (!session) {
      toast.error("No session selected");
      return;
    }

    setLoading(true);
    try {
      const response = await sessionResultAPI.getGraduationList(session);
      setGraduates(response.data || []);
      toast.success("Graduation list loaded successfully");
    } catch (error) {
      console.error("Error fetching graduates:", error);
      setGraduates([]);
      toast.error("Failed to load graduation list");
    } finally {
      setLoading(false);
    }
  };

  const calculateAllResults = async () => {
    if (!session) {
      toast.error("No session selected");
      return;
    }

    if (
      !window.confirm(
        `Calculate session results for all students in ${session}?`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response =
        await sessionResultAPI.calculateAllSessionResults(session);
      const count = Array.isArray(response.data) ? response.data.length : 0;

      toast.success(`Session results calculated for ${count} students`);

      if (selectedStudent) {
        await fetchSessionResult();
      }
    } catch (error) {
      console.error("Error calculating results:", error);
      toast.error("Failed to calculate session results");
    } finally {
      setLoading(false);
    }
  };

  const promoteStudents = async () => {
    if (!session) {
      toast.error("No session selected");
      return;
    }

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
        await fetchSessionResult();
      }
    } catch (error) {
      console.error("Error promoting students:", error);
      toast.error("Failed to promote students");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    const n = Number(num);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  };

  const formatOneDecimal = (num) => {
    const n = Number(num);
    return Number.isFinite(n) ? n.toFixed(1) : "0.0";
  };

  const getGradeFromAverage = (avg) => {
    const value = Number(avg) || 0;
    if (value >= 70) return { grade: "A", class: "success" };
    if (value >= 60) return { grade: "B", class: "primary" };
    if (value >= 50) return { grade: "C", class: "info" };
    if (value >= 45) return { grade: "D", class: "warning" };
    if (value >= 40) return { grade: "E", class: "secondary" };
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

  if (loadingSession || sessionsLoading) {
    return (
      <div className="text-center py-5">
        <FaSpinner className="spinner" size={40} />
        <p className="mt-3">Loading academic session...</p>
      </div>
    );
  }

  return (
    <div className="session-result container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="mb-1">Session Result Management</h2>
          <div className="text-muted">
            Active Session: <strong>{session || "No active session"}</strong>
          </div>
        </div>

        <button className="btn btn-outline-primary" onClick={fetchSessions}>
          <FaSyncAlt className="me-2" />
          Refresh Sessions
        </button>
      </div>

      <div className="d-flex gap-2 mb-4 flex-wrap">
        <button
          className={`btn ${activeTab === "view" ? "active" : ""}`}
          onClick={() => setActiveTab("view")}
          style={{
            backgroundColor: activeTab === "view" ? "#4CAF50" : "#f8f9fa",
            color: activeTab === "view" ? "white" : "#495057",
            border: activeTab === "view" ? "none" : "1px solid #dee2e6",
          }}
        >
          <FaEye className="me-2" /> View Results
        </button>

        <button
          className={`btn ${activeTab === "rankings" ? "active" : ""}`}
          onClick={() => setActiveTab("rankings")}
          style={{
            backgroundColor: activeTab === "rankings" ? "#FF9800" : "#f8f9fa",
            color: activeTab === "rankings" ? "white" : "#495057",
            border: activeTab === "rankings" ? "none" : "1px solid #dee2e6",
          }}
        >
          <FaTrophy className="me-2" /> Rankings
        </button>

        <button
          className={`btn ${activeTab === "statistics" ? "active" : ""}`}
          onClick={() => setActiveTab("statistics")}
          style={{
            backgroundColor: activeTab === "statistics" ? "#2196F3" : "#f8f9fa",
            color: activeTab === "statistics" ? "white" : "#495057",
            border: activeTab === "statistics" ? "none" : "1px solid #dee2e6",
          }}
        >
          <FaChartBar className="me-2" /> Statistics
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
          }}
        >
          <FaGraduationCap className="me-2" /> Graduates
        </button>
      </div>

      <div className="row mb-4 align-items-end">
        <div className="col-md-3">
          <label className="form-label fw-bold">Academic Session</label>
          <select
            className="form-select"
            value={session}
            onChange={(e) => setSession(e.target.value)}
          >
            {normalizedSessions.length > 0 ? (
              normalizedSessions.map((s) => (
                <option key={s.id || s.session} value={s.session}>
                  {s.session}
                </option>
              ))
            ) : (
              <option value="">No session available</option>
            )}
          </select>
        </div>

        <div className="col-md-9">
          <div className="d-flex gap-2 justify-content-end flex-wrap">
            <button
              className="btn btn-danger"
              onClick={calculateAllResults}
              disabled={loading || !session}
            >
              {loading ? <FaSpinner className="spinner" /> : "📊 Calculate All"}
            </button>

            <button
              className="btn btn-success"
              onClick={promoteStudents}
              disabled={loading || !session}
            >
              🎓 Promote Students
            </button>

            <button
              className="btn btn-info text-white"
              onClick={fetchStatistics}
              disabled={loading || !session}
            >
              📈 Refresh Stats
            </button>
          </div>
        </div>
      </div>

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
                          (s) => s.id === parseInt(e.target.value, 10),
                        );
                        setSelectedStudent(student || null);
                      }}
                    >
                      <option value="">-- Choose a student --</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {(
                            s.fullName ||
                            `${s.firstName || ""} ${s.lastName || ""}`
                          ).trim()}{" "}
                          - {s.admissionNumber} ({s.studentClass} {s.classArm})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <button
                      className="btn btn-success w-100"
                      onClick={() => selectedStudent && fetchSessionResult()}
                      disabled={!selectedStudent || loading}
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
                    className={`col-md-${
                      rankingsType === "school"
                        ? "3"
                        : rankingsType === "arm"
                          ? "2"
                          : "4"
                    }`}
                  >
                    <button
                      className="btn btn-warning w-100 text-white"
                      onClick={() =>
                        fetchRankings(rankingsType, selectedClass, selectedArm)
                      }
                      disabled={loading}
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
                <button
                  className="btn text-white"
                  onClick={fetchGraduates}
                  disabled={loading}
                  style={{ backgroundColor: "#9C27B0" }}
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
      )}

      {activeTab === "view" && (
        <div className="view-results">
          {selectedStudent && sessionResult ? (
            <div className="card">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">Annual Session Result: {session}</h5>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6>Student Information</h6>
                    <p>
                      <strong>Name:</strong>{" "}
                      {selectedStudent?.fullName ||
                        `${selectedStudent?.firstName || ""} ${selectedStudent?.lastName || ""}`.trim() ||
                        "N/A"}
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

                <div className="row">
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

                <div className="row mt-3">
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

                {sessionResult.subjectAverages &&
                Object.keys(sessionResult.subjectAverages).length > 0 ? (
                  <div className="mt-4">
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
                  <div className="alert alert-info mt-4">
                    No subject performance data available
                  </div>
                )}
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

      {activeTab === "rankings" && (
        <div className="rankings">
          {rankings ? (
            <div className="card">
              <div className="card-header bg-warning text-white">
                <h5 className="mb-0">
                  {rankings.className
                    ? `${rankings.className} ${rankings.arm || ""} `
                    : "School "}
                  Rankings - {rankings.session || session} Session
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
                              {formatNumber(rank.annualAverage)}%
                            </strong>
                          </td>
                          <td>
                            <span
                              className={
                                Number(rank.attendance) >= 75
                                  ? "text-success"
                                  : "text-danger"
                              }
                            >
                              {formatOneDecimal(rank.attendance)}%
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

                      {!rankings.rankings?.length && (
                        <tr>
                          <td colSpan="8" className="text-center text-muted">
                            No ranking data found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-muted mt-3">
                  Total Students: {rankings.totalStudents || 0}
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

      {activeTab === "statistics" && (
        <div className="statistics">
          {loading ? (
            <div className="text-center py-5">
              <FaSpinner className="spinner" size={40} />
              <p className="mt-3">Loading statistics...</p>
            </div>
          ) : statistics ? (
            <>
              <div className="row mb-4">
                <div className="col-md-3">
                  <div className="stat-card bg-primary text-white p-3 rounded">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white-50 mb-1">Total Students</h6>
                        <h2 className="mb-0">
                          {statistics.totalStudents || 0}
                        </h2>
                      </div>
                      <FaUsers size={40} className="opacity-50" />
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="stat-card bg-success text-white p-3 rounded">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white-50 mb-1">Promoted</h6>
                        <h2 className="mb-0">{statistics.promoted || 0}</h2>
                      </div>
                      <FaCheckCircle size={40} className="opacity-50" />
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="stat-card bg-danger text-white p-3 rounded">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white-50 mb-1">Retained</h6>
                        <h2 className="mb-0">{statistics.retained || 0}</h2>
                      </div>
                      <FaTimesCircle size={40} className="opacity-50" />
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="stat-card bg-warning text-dark p-3 rounded">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">Promotion Rate</h6>
                        <h2 className="mb-0">
                          {formatOneDecimal(statistics.promotionRate)}%
                        </h2>
                      </div>
                      <FaTrophy size={40} className="opacity-50" />
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

      {activeTab === "graduates" && (
        <div className="graduates">
          {graduates.length > 0 ? (
            <div className="card">
              <div
                className="card-header text-white"
                style={{ background: "#9C27B0" }}
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
                        <tr key={grad.studentId || index}>
                          <td>{index + 1}</td>
                          <td>{grad.studentName}</td>
                          <td>{grad.admissionNumber}</td>
                          <td className="fw-bold text-success">
                            {formatNumber(grad.finalAverage)}%
                          </td>
                          <td>{formatOneDecimal(grad.attendance)}%</td>
                          <td>{grad.position || "N/A"}</td>
                        </tr>
                      ))}

                      {graduates.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center text-muted">
                            No graduates found
                          </td>
                        </tr>
                      )}
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

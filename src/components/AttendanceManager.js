import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  attendanceAPI,
  studentAPI,
  teacherAPI,
  sessionAPI,
} from "../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaUsers,
  FaChartBar,
  FaSpinner,
  FaSearch,
  FaEye,
  FaFilter,
  FaInfoCircle,
  FaSyncAlt,
} from "react-icons/fa";
import moment from "moment";

function AttendanceManager() {
  const { user } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role === "ADMIN";
  const isTeacher = user?.role === "TEACHER";

  const query = new URLSearchParams(location.search);
  const classNameFromQuery = query.get("className") || "";
  const armFromQuery = query.get("arm") || "";

  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);

  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(classNameFromQuery);
  const [selectedArm, setSelectedArm] = useState(armFromQuery);
  const [selectedDate, setSelectedDate] = useState(
    moment().format("YYYY-MM-DD"),
  );
  const [attendanceData, setAttendanceData] = useState({});
  const [classStats, setClassStats] = useState(null);
  const [viewMode, setViewMode] = useState("mark");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [studentSummary, setStudentSummary] = useState(null);
  const [teacherAssignments, setTeacherAssignments] = useState([]);

  const [availableSessions, setAvailableSessions] = useState([]);
  const [activeSessionObj, setActiveSessionObj] = useState(null);
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("FIRST");

  const classes = [
    { name: "Nursery", arms: ["A", "B"] },
    { name: "Primary 1", arms: ["A", "B", "C"] },
    { name: "Primary 2", arms: ["A", "B"] },
    { name: "Primary 3", arms: ["A", "B"] },
    { name: "Primary 4", arms: ["A", "B"] },
    { name: "Primary 5", arms: ["A", "B"] },
    { name: "Primary 6", arms: ["A", "B"] },
    { name: "JSS 1", arms: ["A", "B", "C"] },
    { name: "JSS 2", arms: ["A", "B"] },
    { name: "JSS 3", arms: ["A", "B"] },
    { name: "SSS 1", arms: ["A", "B"] },
    { name: "SSS 2", arms: ["A", "B"] },
    { name: "SSS 3", arms: ["A", "B"] },
  ];

  const terms = [
    { value: "FIRST", label: "First Term" },
    { value: "SECOND", label: "Second Term" },
    { value: "THIRD", label: "Third Term" },
  ];

  useEffect(() => {
    loadSessionData();
  }, []);

  useEffect(() => {
    if (isTeacher && session) {
      loadTeacherAssignments();
    }
  }, [isTeacher, session]);

  useEffect(() => {
    if (!selectedClass) return;

    const allowedArms =
      allowedClassOptions.find((c) => c.name === selectedClass)?.arms || [];

    if (!allowedArms.includes(selectedArm)) {
      if (allowedArms.length === 1) {
        setSelectedArm(allowedArms[0]);
      } else if (selectedArm) {
        setSelectedArm("");
      }
    }
  }, [selectedClass]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedClass || !selectedArm || !session || !term) return;

    if (viewMode === "mark" || viewMode === "report") {
      fetchStudents();
    } else if (viewMode === "stats") {
      fetchClassStatistics();
    }
  }, [selectedClass, selectedArm, selectedDate, session, term, viewMode]);

  useEffect(() => {
    if (selectedStudent && session && term) {
      fetchStudentAttendance();
    }
  }, [selectedStudent, session, term]);

  const getSessionName = (sessionItem) => {
    return sessionItem?.session || sessionItem?.sessionName || "";
  };

  const sortSessions = (sessionList) => {
    return [...sessionList].sort((a, b) => {
      const aDate = new Date(a.startDate || 0).getTime();
      const bDate = new Date(b.startDate || 0).getTime();
      return bDate - aDate;
    });
  };

  const loadSessionData = async () => {
    setLoadingSession(true);
    try {
      const [sessionsRes, activeRes] = await Promise.all([
        sessionAPI.getAllSessions(),
        sessionAPI.getActiveSession(),
      ]);

      const allSessions = Array.isArray(sessionsRes.data)
        ? sessionsRes.data
        : [];
      const sorted = sortSessions(allSessions);

      setAvailableSessions(sorted);

      const active = activeRes?.data || null;
      setActiveSessionObj(active);

      if (active) {
        setSession(getSessionName(active));
        setTerm(active.currentTerm || "FIRST");
      } else if (sorted.length > 0) {
        setSession(getSessionName(sorted[0]));
        setTerm(sorted[0].currentTerm || "FIRST");
      } else {
        setSession("");
        setTerm("FIRST");
      }
    } catch (error) {
      console.error("Error loading session data:", error);
      toast.error("Failed to load session information");
    } finally {
      setLoadingSession(false);
    }
  };

  const loadTeacherAssignments = async () => {
    if (!isTeacher) return;

    try {
      const response = await teacherAPI.getMyClasses();
      const classList = Array.isArray(response.data) ? response.data : [];

      const normalized = classList
        .filter((c) => c?.id && c?.className && c?.arm)
        .map((c) => ({
          id: c.id,
          className: c.className,
          arm: c.arm,
        }));

      setTeacherAssignments(normalized);

      if (!classNameFromQuery && normalized.length === 1) {
        setSelectedClass(normalized[0].className);
        setSelectedArm(normalized[0].arm);
      }

      if (
        classNameFromQuery &&
        armFromQuery &&
        !normalized.some(
          (c) => c.className === classNameFromQuery && c.arm === armFromQuery,
        )
      ) {
        setSelectedClass("");
        setSelectedArm("");
        toast.error("You can only access your assigned class arm");
      }
    } catch (error) {
      console.error("Error loading teacher assignments:", error);
      toast.error("Failed to load teacher class assignments");
      setTeacherAssignments([]);
    }
  };

  const allowedClassOptions = useMemo(() => {
    if (isAdmin) return classes;

    if (isTeacher) {
      const grouped = {};
      teacherAssignments.forEach((a) => {
        if (!grouped[a.className]) grouped[a.className] = [];
        if (!grouped[a.className].includes(a.arm)) {
          grouped[a.className].push(a.arm);
        }
      });

      return Object.entries(grouped).map(([name, arms]) => ({
        name,
        arms,
      }));
    }

    return [];
  }, [isAdmin, isTeacher, teacherAssignments]);

  const selectedTeacherAssignment = useMemo(() => {
    if (!isTeacher) return null;

    return (
      teacherAssignments.find(
        (a) => a.className === selectedClass && a.arm === selectedArm,
      ) || null
    );
  }, [isTeacher, teacherAssignments, selectedClass, selectedArm]);

  const isAllowedTeacherClass = (className, arm) => {
    if (isAdmin) return true;
    return teacherAssignments.some(
      (a) => a.className === className && a.arm === arm,
    );
  };

  const fetchStudents = async () => {
    if (!selectedClass || !selectedArm || !session || !term) return;

    if (isTeacher && !selectedTeacherAssignment) {
      toast.error("You can only manage attendance for your assigned class arm");
      return;
    }

    setLoading(true);
    try {
      let response;

      if (isTeacher) {
        response = await teacherAPI.getMyClassStudents(
          selectedTeacherAssignment.id,
        );
      } else {
        response = await studentAPI.getStudentsByClassAndArm(
          selectedClass,
          selectedArm,
        );
      }

      const studentList = Array.isArray(response.data) ? response.data : [];
      setStudents(studentList);

      const attendanceMap = {};
      studentList.forEach((student) => {
        attendanceMap[student.id] = null;
      });
      setAttendanceData(attendanceMap);

      await fetchExistingAttendance(studentList);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
      setStudents([]);
      setAttendanceData({});
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAttendance = async (studentList) => {
    try {
      for (const student of studentList) {
        try {
          const response = await attendanceAPI.getStudentAttendance(
            student.id,
            selectedDate,
            session,
            term,
          );

          if (response.data) {
            setAttendanceData((prev) => ({
              ...prev,
              [student.id]: response.data.status,
            }));
          }
        } catch (error) {
          if (error.response?.status !== 404) {
            console.error(
              "Error fetching attendance for student:",
              student.id,
              error,
            );
          }
        }
      }
    } catch (error) {
      console.error("Error fetching existing attendance:", error);
    }
  };

  const fetchClassStatistics = async () => {
    if (!selectedClass || !selectedArm || !session || !term) return;

    if (isTeacher && !isAllowedTeacherClass(selectedClass, selectedArm)) {
      toast.error(
        "You can only view attendance statistics for your assigned class arm",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await attendanceAPI.getClassTermStatistics(
        selectedClass,
        selectedArm,
        session,
        term,
      );
      setClassStats(response.data);
    } catch (error) {
      console.error("Error fetching class statistics:", error);
      toast.error(
        error?.response?.data?.message || "Failed to load class statistics",
      );
      setClassStats(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAttendance = async () => {
    if (!selectedStudent || !session || !term) return;

    setLoading(true);
    try {
      const [attendanceRes, summaryRes] = await Promise.all([
        attendanceAPI.getStudentTermAttendance(
          selectedStudent.id,
          session,
          term,
        ),
        attendanceAPI.getStudentTermSummary(selectedStudent.id, session, term),
      ]);

      setStudentAttendance(attendanceRes.data || []);
      setStudentSummary(summaryRes.data || null);
    } catch (error) {
      console.error("Error fetching student attendance:", error);
      toast.error(
        error?.response?.data?.message || "Failed to load student attendance",
      );
      setStudentAttendance([]);
      setStudentSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAll = async (status) => {
    if (!selectedClass || !selectedArm || students.length === 0) {
      toast.warning("Please select a class first");
      return;
    }

    if (!session || !term) {
      toast.warning("Session and term are required");
      return;
    }

    if (isTeacher && !selectedTeacherAssignment) {
      toast.error("You can only mark attendance for your assigned class arm");
      return;
    }

    const studentIds = students.map((s) => s.id);

    setLoading(true);
    try {
      if (isTeacher) {
        await teacherAPI.markMyClassAttendance(selectedTeacherAssignment.id, {
          studentIds,
          date: selectedDate,
          session,
          term,
          status,
        });
      } else {
        await attendanceAPI.markBulkAttendance(
          studentIds,
          selectedDate,
          session,
          term,
          status,
        );
      }

      toast.success(`All students marked as ${status}`);

      const newAttendanceData = {};
      studentIds.forEach((id) => {
        newAttendanceData[id] = status;
      });
      setAttendanceData(newAttendanceData);
    } catch (error) {
      console.error("Error marking bulk attendance:", error);
      toast.error(
        error?.response?.data?.message || "Failed to mark attendance",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMarkStudent = async (studentId, status) => {
    if (!session || !term) {
      toast.warning("Session and term are required");
      return;
    }

    if (isTeacher && !selectedTeacherAssignment) {
      toast.error("You can only mark attendance for your assigned class arm");
      return;
    }

    setLoading(true);
    try {
      await attendanceAPI.markAttendance(
        studentId,
        selectedDate,
        session,
        term,
        status,
      );

      toast.success(`Student marked as ${status}`);

      setAttendanceData((prev) => ({
        ...prev,
        [studentId]: status,
      }));
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error(
        error?.response?.data?.message || "Failed to mark attendance",
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return null;

    const badges = {
      PRESENT: {
        class: "bg-success",
        icon: <FaCheckCircle />,
        text: "Present",
      },
      ABSENT: {
        class: "bg-danger",
        icon: <FaTimesCircle />,
        text: "Absent",
      },
      LATE: {
        class: "bg-warning",
        icon: <FaClock />,
        text: "Late",
      },
      EXCUSED: {
        class: "bg-info",
        icon: <FaExclamationTriangle />,
        text: "Excused",
      },
      HOLIDAY: {
        class: "bg-secondary",
        icon: <FaCalendarAlt />,
        text: "Holiday",
      },
    };

    return badges[status] || null;
  };

  const getStatusColor = (status) => {
    const colors = {
      PRESENT: "success",
      ABSENT: "danger",
      LATE: "warning",
      EXCUSED: "info",
      HOLIDAY: "secondary",
    };
    return colors[status] || "secondary";
  };

  const filteredStudents = students.filter((student) => {
    const fullName =
      `${student.firstName || ""} ${student.lastName || ""}`.toLowerCase();
    const admission = student.admissionNumber?.toLowerCase() || "";
    const q = searchTerm.toLowerCase();
    return fullName.includes(q) || admission.includes(q);
  });

  if (loadingSession) {
    return (
      <div className="text-center py-5">
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">Loading active session...</p>

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

  return (
    <div className="attendance-manager container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">
          <FaCalendarAlt className="me-2" /> Attendance Management
        </h2>

        <button className="btn btn-outline-primary" onClick={loadSessionData}>
          <FaSyncAlt className="me-2" />
          Refresh Sessions
        </button>
      </div>

      <div className="mb-3 text-muted">
        Active Session:{" "}
        <strong>
          {activeSessionObj
            ? getSessionName(activeSessionObj)
            : "No active session"}
        </strong>{" "}
        | Current Backend Term:{" "}
        <strong>{activeSessionObj?.currentTerm || "-"}</strong>
      </div>

      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Attendance Controls</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-2 mb-3">
              <label className="form-label">View Mode</label>
              <select
                className="form-select"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
              >
                <option value="mark">Mark Attendance</option>
                <option value="stats">Class Statistics</option>
                <option value="report">Student Report</option>
              </select>
            </div>

            <div className="col-md-2 mb-3">
              <label className="form-label">Class</label>
              <select
                className="form-select"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedArm("");
                  setSelectedStudent(null);
                }}
              >
                <option value="">Select Class</option>
                {allowedClassOptions.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2 mb-3">
              <label className="form-label">Arm</label>
              <select
                className="form-select"
                value={selectedArm}
                onChange={(e) => {
                  setSelectedArm(e.target.value);
                  setSelectedStudent(null);
                }}
                disabled={!selectedClass}
              >
                <option value="">Select Arm</option>
                {selectedClass &&
                  allowedClassOptions
                    .find((c) => c.name === selectedClass)
                    ?.arms.map((arm) => (
                      <option key={arm} value={arm}>
                        Arm {arm}
                      </option>
                    ))}
              </select>
            </div>

            {(viewMode === "mark" || viewMode === "report") && (
              <div className="col-md-2 mb-3">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            )}

            <div className="col-md-2 mb-3">
              <label className="form-label">Session</label>
              <select
                className="form-select"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                disabled={availableSessions.length === 0}
              >
                <option value="">
                  {availableSessions.length === 0
                    ? "No sessions available"
                    : "Select Session"}
                </option>
                {availableSessions.map((s) => (
                  <option key={s.id} value={getSessionName(s)}>
                    {getSessionName(s)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2 mb-3">
              <label className="form-label">Term</label>
              <select
                className="form-select"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              >
                {terms.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {viewMode === "mark" && selectedClass && selectedArm && (
            <div className="mt-3">
              <label className="form-label me-3">Quick Actions:</label>

              <button
                className="btn btn-success me-2 mb-2"
                onClick={() => handleMarkAll("PRESENT")}
                disabled={loading}
              >
                <FaCheckCircle className="me-1" /> Mark All Present
              </button>

              <button
                className="btn btn-danger me-2 mb-2"
                onClick={() => handleMarkAll("ABSENT")}
                disabled={loading}
              >
                <FaTimesCircle className="me-1" /> Mark All Absent
              </button>

              <button
                className="btn btn-warning me-2 mb-2"
                onClick={() => handleMarkAll("LATE")}
                disabled={loading}
              >
                <FaClock className="me-1" /> Mark All Late
              </button>

              <button
                className="btn btn-info me-2 mb-2"
                onClick={() => handleMarkAll("EXCUSED")}
                disabled={loading}
              >
                <FaExclamationTriangle className="me-1" /> Mark All Excused
              </button>
            </div>
          )}

          {viewMode === "report" && selectedClass && selectedArm && (
            <div className="mt-3">
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search students by name or admission number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading...</p>
        </div>
      )}

      {!loading && viewMode === "stats" && classStats && (
        <div className="card">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">
              <FaChartBar className="me-2" />
              Class Statistics: {classStats.className} - Arm {classStats.arm}
            </h5>
          </div>
          <div className="card-body">
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <div className="card bg-primary text-white">
                  <div className="card-body text-center">
                    <h3>{classStats.totalStudents}</h3>
                    <small>Total Students</small>
                  </div>
                </div>
              </div>

              <div className="col-md-3 mb-3">
                <div className="card bg-success text-white">
                  <div className="card-body text-center">
                    <h3>{classStats.totalPresent}</h3>
                    <small>Total Present</small>
                  </div>
                </div>
              </div>

              <div className="col-md-3 mb-3">
                <div className="card bg-danger text-white">
                  <div className="card-body text-center">
                    <h3>{classStats.totalAbsent}</h3>
                    <small>Total Absent</small>
                  </div>
                </div>
              </div>

              <div className="col-md-3 mb-3">
                <div className="card bg-warning text-white">
                  <div className="card-body text-center">
                    <h3>{classStats.averageAttendance?.toFixed(1)}%</h3>
                    <small>Average Attendance</small>
                  </div>
                </div>
              </div>
            </div>

            <h6 className="mb-3">Student Breakdown</h6>
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Admission No.</th>
                    <th className="text-center">Present</th>
                    <th className="text-center">Absent</th>
                    <th className="text-center">Late</th>
                    <th className="text-center">Excused</th>
                    <th className="text-center">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {classStats.studentAttendance?.map((student) => (
                    <tr key={student.studentId}>
                      <td>{student.studentName}</td>
                      <td>{student.admissionNumber}</td>
                      <td className="text-center text-success">
                        {student.present}
                      </td>
                      <td className="text-center text-danger">
                        {student.absent}
                      </td>
                      <td className="text-center text-warning">
                        {student.late}
                      </td>
                      <td className="text-center text-info">
                        {student.excused}
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge ${
                            student.percentage >= 75
                              ? "bg-success"
                              : student.percentage >= 50
                                ? "bg-warning"
                                : "bg-danger"
                          }`}
                        >
                          {student.percentage?.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}

                  {!classStats.studentAttendance?.length && (
                    <tr>
                      <td colSpan="7" className="text-center text-muted">
                        No statistics found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && viewMode === "report" && (
        <div className="row">
          <div className="col-md-4 mb-4">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <FaUsers className="me-2" />
                  Students in {selectedClass || "-"} - Arm {selectedArm || "-"}
                </h5>
              </div>
              <div className="card-body p-0">
                <div
                  className="list-group list-group-flush"
                  style={{ maxHeight: "500px", overflowY: "auto" }}
                >
                  {filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                        selectedStudent?.id === student.id ? "active" : ""
                      }`}
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div>
                        <div className="fw-bold">
                          {student.firstName} {student.lastName}
                        </div>
                        <small className="text-muted">
                          {student.admissionNumber}
                        </small>
                      </div>
                      <FaEye />
                    </button>
                  ))}

                  {filteredStudents.length === 0 && (
                    <div className="list-group-item text-center text-muted">
                      No students found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-8">
            {selectedStudent ? (
              <div className="card">
                <div className="card-header bg-info text-white">
                  <h5 className="mb-0">
                    Attendance Report: {selectedStudent.firstName}{" "}
                    {selectedStudent.lastName}
                  </h5>
                </div>
                <div className="card-body">
                  {studentSummary && (
                    <div className="row mb-4">
                      <div className="col-md-3 mb-3">
                        <div className="card bg-primary text-white">
                          <div className="card-body text-center">
                            <h5>{studentSummary.totalSchoolDays}</h5>
                            <small>School Days</small>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-3 mb-3">
                        <div className="card bg-success text-white">
                          <div className="card-body text-center">
                            <h5>{studentSummary.daysPresent}</h5>
                            <small>Present</small>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-3 mb-3">
                        <div className="card bg-danger text-white">
                          <div className="card-body text-center">
                            <h5>{studentSummary.daysAbsent}</h5>
                            <small>Absent</small>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-3 mb-3">
                        <div className="card bg-warning text-white">
                          <div className="card-body text-center">
                            <h5>
                              {studentSummary.attendancePercentage?.toFixed(1)}%
                            </h5>
                            <small>Percentage</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <h6 className="mb-3">
                    Attendance Records for{" "}
                    {terms.find((t) => t.value === term)?.label}
                  </h6>

                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentAttendance.map((record) => (
                          <tr key={record.id}>
                            <td>{moment(record.date).format("DD/MM/YYYY")}</td>
                            <td>
                              <span
                                className={`badge bg-${getStatusColor(record.status)}`}
                              >
                                {record.status}
                              </span>
                            </td>
                            <td>{record.remarks || "-"}</td>
                          </tr>
                        ))}

                        {studentAttendance.length === 0 && (
                          <tr>
                            <td colSpan="3" className="text-center text-muted">
                              No attendance records found
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
                <FaInfoCircle className="me-2" />
                Select a student from the list to view their attendance report
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && viewMode === "mark" && students.length > 0 && (
        <div className="card">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h5 className="mb-0">
              <FaUsers className="me-2" />
              {selectedClass} - Arm {selectedArm} -{" "}
              {moment(selectedDate).format("DD/MM/YYYY")}
            </h5>
            <span className="badge bg-light text-dark">
              {
                Object.values(attendanceData).filter((s) => s === "PRESENT")
                  .length
              }{" "}
              Present / {students.length} Total
            </span>
          </div>

          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student Name</th>
                    <th>Admission No.</th>
                    <th className="text-center">Current Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => {
                    const status = attendanceData[student.id];
                    const badge = getStatusBadge(status);

                    return (
                      <tr key={student.id}>
                        <td>{index + 1}</td>
                        <td>
                          {student.firstName} {student.lastName}
                        </td>
                        <td>{student.admissionNumber}</td>
                        <td className="text-center">
                          {status ? (
                            <span className={`badge ${badge?.class}`}>
                              {badge?.icon} {badge?.text}
                            </span>
                          ) : (
                            <span className="badge bg-secondary">
                              <FaClock className="me-1" />
                              Not Marked
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm">
                            <button
                              className={`btn btn-outline-success ${status === "PRESENT" ? "active" : ""}`}
                              onClick={() =>
                                handleMarkStudent(student.id, "PRESENT")
                              }
                              disabled={loading}
                              title="Mark Present"
                            >
                              <FaCheckCircle />
                            </button>

                            <button
                              className={`btn btn-outline-danger ${status === "ABSENT" ? "active" : ""}`}
                              onClick={() =>
                                handleMarkStudent(student.id, "ABSENT")
                              }
                              disabled={loading}
                              title="Mark Absent"
                            >
                              <FaTimesCircle />
                            </button>

                            <button
                              className={`btn btn-outline-warning ${status === "LATE" ? "active" : ""}`}
                              onClick={() =>
                                handleMarkStudent(student.id, "LATE")
                              }
                              disabled={loading}
                              title="Mark Late"
                            >
                              <FaClock />
                            </button>

                            <button
                              className={`btn btn-outline-info ${status === "EXCUSED" ? "active" : ""}`}
                              onClick={() =>
                                handleMarkStudent(student.id, "EXCUSED")
                              }
                              disabled={loading}
                              title="Mark Excused"
                            >
                              <FaExclamationTriangle />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && !selectedClass && (
        <div className="alert alert-info">
          <FaFilter className="me-2" />
          Please select a class and arm to view attendance.
        </div>
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

export default AttendanceManager;

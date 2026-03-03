// src/components/AttendanceManagement.js
import React, { useState, useEffect } from "react";
import { studentAPI, attendanceAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaCheck,
  FaTimes,
  FaClock,
  FaUmbrella,
  FaCalendarAlt,
  FaChartBar,
  FaEye,
  FaSpinner,
  FaDownload,
  FaPrint,
  FaPlus,
  FaFilter,
  FaSync,
  FaUserGraduate,
  FaUsers,
  FaArrowLeft,
  FaInfoCircle,
} from "react-icons/fa";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import moment from "moment";
import "./AttendanceManagement.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
);

function AttendanceManagement() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    moment().format("YYYY-MM-DD"),
  );
  const [session, setSession] = useState("2025/2026");
  const [term, setTerm] = useState("FIRST");
  const [selectedClass, setSelectedClass] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [activeTab, setActiveTab] = useState("mark");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: moment().subtract(30, "days").format("YYYY-MM-DD"),
    endDate: moment().format("YYYY-MM-DD"),
  });
  const [classFilter, setClassFilter] = useState("");
  const [armFilter, setArmFilter] = useState("");

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
  const arms = ["A", "B", "C"];

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsByClass();
    }
  }, [selectedClass, armFilter]);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchExistingAttendance();
    }
  }, [selectedClass, selectedDate, session, term]);

  const fetchStudentsByClass = async () => {
    setLoading(true);
    try {
      const response = await studentAPI.getStudentsByClass(selectedClass);
      let filtered = response.data;

      // Apply arm filter if selected
      if (armFilter) {
        filtered = filtered.filter((s) => s.classArm === armFilter);
      }

      setStudents(filtered);
      setFilteredStudents(filtered);

      // Initialize attendance records
      const records = {};
      filtered.forEach((student) => {
        records[student.id] = {
          status: "PRESENT",
          remarks: "",
        };
      });
      setAttendanceRecords(records);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const response = await attendanceAPI.getClassAttendance(
        selectedClass,
        selectedDate,
        session,
        term,
      );

      if (response.data.length > 0) {
        const records = { ...attendanceRecords };
        response.data.forEach((att) => {
          if (records[att.student.id]) {
            records[att.student.id] = {
              status: att.status,
              remarks: att.remarks || "",
            };
          }
        });
        setAttendanceRecords(records);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  const fetchClassStatistics = async () => {
    if (!selectedClass) {
      toast.error("Please select a class first");
      return;
    }

    setLoading(true);
    try {
      const response = await attendanceAPI.getClassTermStatistics(
        selectedClass,
        session,
        term,
      );
      setStatistics(response.data);
      setActiveTab("statistics");
      toast.success("Statistics loaded successfully");
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentStatistics = async (studentId) => {
    setLoading(true);
    try {
      const response = await attendanceAPI.getStudentTermSummary(
        studentId,
        session,
        term,
      );
      setStudentStats(response.data);

      const historyResponse = await attendanceAPI.getStudentTermAttendance(
        studentId,
        session,
        term,
      );
      setAttendanceHistory(historyResponse.data);

      const student = students.find((s) => s.id === studentId);
      setSelectedStudent(student);
      toast.success("Student statistics loaded");
    } catch (error) {
      console.error("Error fetching student statistics:", error);
      toast.error("Failed to load student statistics");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const handleMarkAll = (status) => {
    const updated = { ...attendanceRecords };
    Object.keys(updated).forEach((id) => {
      updated[id].status = status;
    });
    setAttendanceRecords(updated);
    toast.success(`All students marked as ${status}`);
  };

  const handleSubmitAttendance = async () => {
    setLoading(true);
    try {
      const absentStudents = [];
      const presentStudents = [];
      const lateStudents = [];
      const excusedStudents = [];

      Object.entries(attendanceRecords).forEach(([studentId, record]) => {
        if (record.status === "ABSENT") {
          absentStudents.push(parseInt(studentId));
        } else if (record.status === "PRESENT") {
          presentStudents.push(parseInt(studentId));
        } else if (record.status === "LATE") {
          lateStudents.push(parseInt(studentId));
        } else if (record.status === "EXCUSED") {
          excusedStudents.push(parseInt(studentId));
        }
      });

      // Mark attendance for each status group
      const promises = [];

      if (absentStudents.length > 0) {
        promises.push(
          attendanceAPI.markBulkAttendance(
            absentStudents,
            selectedDate,
            session,
            term,
            "ABSENT",
          ),
        );
      }

      if (presentStudents.length > 0) {
        promises.push(
          attendanceAPI.markBulkAttendance(
            presentStudents,
            selectedDate,
            session,
            term,
            "PRESENT",
          ),
        );
      }

      if (lateStudents.length > 0) {
        promises.push(
          attendanceAPI.markBulkAttendance(
            lateStudents,
            selectedDate,
            session,
            term,
            "LATE",
          ),
        );
      }

      if (excusedStudents.length > 0) {
        promises.push(
          attendanceAPI.markBulkAttendance(
            excusedStudents,
            selectedDate,
            session,
            term,
            "EXCUSED",
          ),
        );
      }

      await Promise.all(promises);
      toast.success("Attendance marked successfully");

      // Refresh statistics if on statistics tab
      if (activeTab === "statistics") {
        fetchClassStatistics();
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Failed to mark attendance");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PRESENT: { class: "badge-present", icon: <FaCheck />, label: "Present" },
      ABSENT: { class: "badge-absent", icon: <FaTimes />, label: "Absent" },
      LATE: { class: "badge-late", icon: <FaClock />, label: "Late" },
      EXCUSED: {
        class: "badge-excused",
        icon: <FaUmbrella />,
        label: "Excused",
      },
    };
    const badge = badges[status] || badges["ABSENT"];
    return (
      <span className={`status-badge ${badge.class}`}>
        {badge.icon} {badge.label}
      </span>
    );
  };

  const getAttendanceRateColor = (rate) => {
    if (rate >= 90) return "rate-excellent";
    if (rate >= 75) return "rate-good";
    if (rate >= 60) return "rate-fair";
    return "rate-poor";
  };

  // Chart data for status distribution
  const getStatusChartData = () => {
    if (!studentStats) return null;

    return {
      labels: ["Present", "Absent", "Late", "Excused"],
      datasets: [
        {
          data: [
            studentStats.daysPresent || 0,
            studentStats.daysAbsent || 0,
            studentStats.daysLate || 0,
            studentStats.daysExcused || 0,
          ],
          backgroundColor: ["#28a745", "#dc3545", "#ffc107", "#17a2b8"],
          borderWidth: 1,
        },
      ],
    };
  };

  // Chart data for attendance trends
  const getTrendChartData = () => {
    if (!attendanceHistory.length) return null;

    const dates = [...new Set(attendanceHistory.map((a) => a.date))].sort();
    const presentData = dates.map(
      (date) =>
        attendanceHistory.filter(
          (a) => a.date === date && a.status === "PRESENT",
        ).length,
    );
    const lateData = dates.map(
      (date) =>
        attendanceHistory.filter((a) => a.date === date && a.status === "LATE")
          .length,
    );
    const absentData = dates.map(
      (date) =>
        attendanceHistory.filter(
          (a) => a.date === date && a.status === "ABSENT",
        ).length,
    );

    return {
      labels: dates.map((d) => moment(d).format("DD/MM")),
      datasets: [
        {
          label: "Present",
          data: presentData,
          borderColor: "#28a745",
          backgroundColor: "rgba(40, 167, 69, 0.1)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Late",
          data: lateData,
          borderColor: "#ffc107",
          backgroundColor: "rgba(255, 193, 7, 0.1)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Absent",
          data: absentData,
          borderColor: "#dc3545",
          backgroundColor: "rgba(220, 53, 69, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const clearStudentView = () => {
    setSelectedStudent(null);
    setStudentStats(null);
    setAttendanceHistory([]);
  };

  return (
    <div className="attendance-management">
      <div className="content-header">
        <h2>
          <FaCalendarAlt className="me-2" /> Attendance Management
        </h2>
        <p className="text-muted">Track and manage student attendance</p>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === "mark" ? "active" : ""}`}
          onClick={() => setActiveTab("mark")}
        >
          <FaCalendarAlt /> Mark Attendance
        </button>
        <button
          className={`tab-btn ${activeTab === "statistics" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("statistics");
            if (selectedClass) {
              fetchClassStatistics();
            }
          }}
        >
          <FaChartBar /> Statistics
        </button>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Class</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setArmFilter("");
              }}
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Arm</label>
            <select
              value={armFilter}
              onChange={(e) => setArmFilter(e.target.value)}
              disabled={!selectedClass}
            >
              <option value="">All Arms</option>
              {arms.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={moment().format("YYYY-MM-DD")}
            />
          </div>

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
            <label>Term</label>
            <select value={term} onChange={(e) => setTerm(e.target.value)}>
              {terms.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>&nbsp;</label>
            <button
              className="btn-primary"
              onClick={fetchClassStatistics}
              disabled={!selectedClass || loading}
            >
              {loading ? <FaSpinner className="spin" /> : <FaChartBar />}
              View Statistics
            </button>
          </div>
        </div>
      </div>

      {/* Mark Attendance Tab */}
      {activeTab === "mark" && selectedClass && (
        <div className="mark-attendance">
          <div className="section-header">
            <h3>
              {selectedClass} {armFilter && `- ${armFilter}`} -{" "}
              {moment(selectedDate).format("dddd, MMMM Do, YYYY")}
            </h3>
            <div className="header-actions">
              <button
                className="btn-success"
                onClick={() => handleMarkAll("PRESENT")}
              >
                <FaCheck /> All Present
              </button>
              <button
                className="btn-warning"
                onClick={() => handleMarkAll("LATE")}
              >
                <FaClock /> All Late
              </button>
              <button
                className="btn-danger"
                onClick={() => handleMarkAll("ABSENT")}
              >
                <FaTimes /> All Absent
              </button>
              <button
                className="btn-info"
                onClick={() => handleMarkAll("EXCUSED")}
              >
                <FaUmbrella /> All Excused
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-spinner">
              <FaSpinner className="spin" size={40} />
              <p>Loading students...</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>S/N</th>
                      <th>Admission No</th>
                      <th>Student Name</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student.id}>
                        <td>{index + 1}</td>
                        <td>{student.admissionNumber}</td>
                        <td>
                          <strong>{student.fullName}</strong>
                          <br />
                          <small>
                            {student.studentClass} {student.classArm}
                          </small>
                        </td>
                        <td>
                          <select
                            className={`status-select ${attendanceRecords[student.id]?.status?.toLowerCase() || "present"}`}
                            value={
                              attendanceRecords[student.id]?.status || "PRESENT"
                            }
                            onChange={(e) =>
                              handleStatusChange(student.id, e.target.value)
                            }
                          >
                            <option value="PRESENT">Present</option>
                            <option value="ABSENT">Absent</option>
                            <option value="LATE">Late</option>
                            <option value="EXCUSED">Excused</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="remarks-input"
                            placeholder="Remarks (optional)"
                            value={attendanceRecords[student.id]?.remarks || ""}
                            onChange={(e) =>
                              handleRemarksChange(student.id, e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="form-actions">
                <button
                  className="btn-primary btn-large"
                  onClick={handleSubmitAttendance}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <FaCheck /> Save Attendance ({students.length} students)
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === "statistics" && (
        <div className="statistics-tab">
          {loading ? (
            <div className="loading-spinner">
              <FaSpinner className="spin" size={40} />
              <p>Loading statistics...</p>
            </div>
          ) : selectedStudent ? (
            // Individual Student Statistics
            <div className="student-statistics">
              <div className="section-header">
                <h3>
                  <FaUserGraduate /> {selectedStudent?.fullName} - Attendance
                  Details
                </h3>
                <button className="btn-secondary" onClick={clearStudentView}>
                  <FaArrowLeft /> Back to Class View
                </button>
              </div>

              {/* Student Info Card */}
              <div className="info-card">
                <div className="info-grid">
                  <div>
                    <p>
                      <strong>Name:</strong> {selectedStudent?.fullName}
                    </p>
                    <p>
                      <strong>Admission:</strong>{" "}
                      {selectedStudent?.admissionNumber}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Class:</strong> {selectedStudent?.studentClass}{" "}
                      {selectedStudent?.classArm}
                    </p>
                    <p>
                      <strong>Term:</strong> {term} Term, {session}
                    </p>
                  </div>
                </div>
              </div>

              {studentStats && (
                <>
                  {/* Summary Cards */}
                  <div className="stats-grid">
                    <div className="stat-card primary">
                      <FaCalendarAlt size={30} />
                      <div>
                        <h3>{studentStats.totalSchoolDays || 0}</h3>
                        <p>School Days</p>
                      </div>
                    </div>
                    <div className="stat-card success">
                      <FaCheck size={30} />
                      <div>
                        <h3>{studentStats.daysPresent || 0}</h3>
                        <p>Present</p>
                      </div>
                    </div>
                    <div className="stat-card warning">
                      <FaClock size={30} />
                      <div>
                        <h3>{studentStats.daysLate || 0}</h3>
                        <p>Late</p>
                      </div>
                    </div>
                    <div className="stat-card danger">
                      <FaTimes size={30} />
                      <div>
                        <h3>{studentStats.daysAbsent || 0}</h3>
                        <p>Absent</p>
                      </div>
                    </div>
                    <div className="stat-card info">
                      <FaUmbrella size={30} />
                      <div>
                        <h3>{studentStats.daysExcused || 0}</h3>
                        <p>Excused</p>
                      </div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="charts-grid">
                    <div className="chart-card">
                      <h4>Attendance Distribution</h4>
                      {getStatusChartData() && (
                        <Pie
                          data={getStatusChartData()}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: {
                                position: "bottom",
                              },
                            },
                          }}
                        />
                      )}
                    </div>
                    <div className="chart-card">
                      <h4>Attendance Trend</h4>
                      {getTrendChartData() && (
                        <Line
                          data={getTrendChartData()}
                          options={{
                            responsive: true,
                            scales: {
                              y: {
                                beginAtZero: true,
                                max:
                                  Math.max(
                                    ...(getTrendChartData()?.datasets[0]
                                      ?.data || [1]),
                                    ...(getTrendChartData()?.datasets[1]
                                      ?.data || [1]),
                                    ...(getTrendChartData()?.datasets[2]
                                      ?.data || [1]),
                                  ) + 1,
                              },
                            },
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Attendance Rate */}
                  <div className="rate-card">
                    <h4>Attendance Rate</h4>
                    <div className="rate-display">
                      <span
                        className={`rate-value ${getAttendanceRateColor(studentStats.attendancePercentage)}`}
                      >
                        {studentStats.attendancePercentage?.toFixed(1)}%
                      </span>
                      <div className="rate-progress">
                        <div
                          className={`rate-progress-bar ${getAttendanceRateColor(studentStats.attendancePercentage)}`}
                          style={{
                            width: `${studentStats.attendancePercentage || 0}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Attendance History */}
                  <div className="history-card">
                    <h4>Attendance History</h4>
                    <div className="table-responsive">
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Day</th>
                            <th>Status</th>
                            <th>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceHistory
                            .filter((a) =>
                              moment(a.date).isBetween(
                                dateRange.startDate,
                                dateRange.endDate,
                                "days",
                                "[]",
                              ),
                            )
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map((record, index) => (
                              <tr key={index}>
                                <td>
                                  {moment(record.date).format("DD/MM/YYYY")}
                                </td>
                                <td>{moment(record.date).format("dddd")}</td>
                                <td>{getStatusBadge(record.status)}</td>
                                <td>{record.remarks || "-"}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : statistics ? (
            // Class Statistics View
            <div className="class-statistics">
              <h3>
                {selectedClass} {armFilter && `- ${armFilter}`} - Attendance
                Statistics
              </h3>

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
                  <FaCheck size={30} />
                  <div>
                    <h3>{statistics.totalPresent || 0}</h3>
                    <p>Total Present</p>
                  </div>
                </div>
                <div className="stat-card warning">
                  <FaClock size={30} />
                  <div>
                    <h3>{statistics.totalLate || 0}</h3>
                    <p>Total Late</p>
                  </div>
                </div>
                <div className="stat-card danger">
                  <FaTimes size={30} />
                  <div>
                    <h3>{statistics.totalAbsent || 0}</h3>
                    <p>Total Absent</p>
                  </div>
                </div>
                <div className="stat-card info">
                  <FaUmbrella size={30} />
                  <div>
                    <h3>{statistics.totalExcused || 0}</h3>
                    <p>Total Excused</p>
                  </div>
                </div>
              </div>

              {/* Average Attendance */}
              <div className="rate-card">
                <h4>Average Class Attendance</h4>
                <div className="rate-display">
                  <span
                    className={`rate-value ${getAttendanceRateColor(statistics.averageAttendance)}`}
                  >
                    {statistics.averageAttendance?.toFixed(1)}%
                  </span>
                  <div className="rate-progress">
                    <div
                      className={`rate-progress-bar ${getAttendanceRateColor(statistics.averageAttendance)}`}
                      style={{ width: `${statistics.averageAttendance || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Student Attendance Table */}
              <div className="student-table-card">
                <h4>Student Attendance Details</h4>
                <div className="table-responsive">
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th>Admission No</th>
                        <th>Student Name</th>
                        <th>Present</th>
                        <th>Late</th>
                        <th>Absent</th>
                        <th>Excused</th>
                        <th>Attendance %</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statistics.studentAttendance?.map((student, index) => (
                        <tr key={index}>
                          <td>{student.admissionNumber}</td>
                          <td>
                            <strong>{student.studentName}</strong>
                          </td>
                          <td className="text-success fw-bold">
                            {student.present || 0}
                          </td>
                          <td className="text-warning fw-bold">
                            {student.late || 0}
                          </td>
                          <td className="text-danger fw-bold">
                            {student.absent || 0}
                          </td>
                          <td className="text-info fw-bold">
                            {student.excused || 0}
                          </td>
                          <td>
                            <span
                              className={getAttendanceRateColor(
                                student.percentage,
                              )}
                            >
                              {student.percentage?.toFixed(1)}%
                            </span>
                          </td>
                          <td>
                            {student.percentage >= 90 ? (
                              <span className="badge badge-success">
                                Excellent
                              </span>
                            ) : student.percentage >= 75 ? (
                              <span className="badge badge-primary">Good</span>
                            ) : student.percentage >= 60 ? (
                              <span className="badge badge-warning">Fair</span>
                            ) : (
                              <span className="badge badge-danger">Poor</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn-icon btn-info"
                              onClick={() =>
                                fetchStudentStatistics(student.studentId)
                              }
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert-info">
              <FaInfoCircle /> Select a class and click "View Statistics" to see
              attendance data
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AttendanceManagement;

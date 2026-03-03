// src/components/AttendanceStatistics.js
import React, { useState, useEffect } from "react";
import { attendanceAPI, studentAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaCalendarAlt,
  FaChartBar,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUmbrella,
  FaDownload,
  FaEye,
  FaSpinner,
  FaArrowLeft,
  FaSchool,
} from "react-icons/fa";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import moment from "moment";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

function AttendanceStatistics() {
  const [selectedView, setSelectedView] = useState("school"); // school, class, student
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [session, setSession] = useState("2025/2026");
  const [term, setTerm] = useState("FIRST");
  const [students, setStudents] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [schoolStats, setSchoolStats] = useState(null);
  const [classStats, setClassStats] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: moment().subtract(30, "days").format("YYYY-MM-DD"),
    endDate: moment().format("YYYY-MM-DD"),
  });

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
    if (selectedView === "school") {
      fetchSchoolStatistics();
    }
  }, [session, term, selectedView]);

  useEffect(() => {
    if (selectedView === "class" && selectedClass) {
      fetchClassStatistics();
      fetchClassStudents();
    }
  }, [selectedClass, session, term, selectedView]);

  useEffect(() => {
    if (selectedView === "student" && selectedStudent) {
      fetchStudentStatistics();
      fetchAttendanceHistory();
    }
  }, [selectedStudent, session, term, dateRange, selectedView]);

  const fetchStudents = async () => {
    try {
      const response = await studentAPI.getAllStudents();
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    }
  };

  const fetchClassStudents = async () => {
    if (!selectedClass) return;
    try {
      const response = await studentAPI.getStudentsByClass(selectedClass);
      setClassStudents(response.data);
    } catch (error) {
      console.error("Error fetching class students:", error);
    }
  };

  const fetchSchoolStatistics = async () => {
    setLoading(true);
    try {
      const response = await attendanceAPI.getSchoolAttendanceStatistics(
        session,
        term,
      );
      setSchoolStats(response.data);
    } catch (error) {
      console.error("Error fetching school statistics:", error);
      toast.error("Failed to load school statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStatistics = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const response = await attendanceAPI.getClassTermStatistics(
        selectedClass,
        session,
        term,
      );
      setClassStats(response.data);
    } catch (error) {
      console.error("Error fetching class statistics:", error);
      toast.error("Failed to load class statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentStatistics = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const response = await attendanceAPI.getStudentTermSummary(
        selectedStudent.id,
        session,
        term,
      );
      setStudentStats(response.data);
    } catch (error) {
      console.error("Error fetching student statistics:", error);
      toast.error("Failed to load student statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    if (!selectedStudent) return;
    try {
      const response = await attendanceAPI.getStudentTermAttendance(
        selectedStudent.id,
        session,
        term,
      );
      setAttendanceHistory(response.data);
    } catch (error) {
      console.error("Error fetching attendance history:", error);
    }
  };

  const getAttendanceRateColor = (rate) => {
    if (rate >= 90) return "text-success";
    if (rate >= 75) return "text-primary";
    if (rate >= 60) return "text-warning";
    return "text-danger";
  };

  const getStatusBadge = (status) => {
    const badges = {
      PRESENT: {
        class: "bg-success",
        icon: <FaCheckCircle />,
        label: "Present",
      },
      ABSENT: { class: "bg-danger", icon: <FaTimesCircle />, label: "Absent" },
      LATE: { class: "bg-warning", icon: <FaClock />, label: "Late" },
      EXCUSED: { class: "bg-info", icon: <FaUmbrella />, label: "Excused" },
      HOLIDAY: {
        class: "bg-secondary",
        icon: <FaCalendarAlt />,
        label: "Holiday",
      },
    };
    const badge = badges[status] || badges["ABSENT"];
    return (
      <span className={`badge ${badge.class} p-2`}>
        {badge.icon} {badge.label}
      </span>
    );
  };

  // Chart data for attendance trends
  const getTrendChartData = () => {
    if (!attendanceHistory.length) return null;

    const dates = [...new Set(attendanceHistory.map((a) => a.date))].sort();
    const presentCount = dates.map(
      (date) =>
        attendanceHistory.filter(
          (a) => a.date === date && a.status === "PRESENT",
        ).length,
    );
    const absentCount = dates.map(
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
          data: presentCount,
          borderColor: "#28a745",
          backgroundColor: "rgba(40, 167, 69, 0.1)",
          tension: 0.4,
        },
        {
          label: "Absent",
          data: absentCount,
          borderColor: "#dc3545",
          backgroundColor: "rgba(220, 53, 69, 0.1)",
          tension: 0.4,
        },
      ],
    };
  };

  // Chart data for status distribution
  const getStatusChartData = () => {
    if (!studentStats) return null;

    return {
      labels: ["Present", "Absent", "Late", "Excused"],
      datasets: [
        {
          data: [
            studentStats.daysPresent,
            studentStats.daysAbsent,
            studentStats.daysLate || 0,
            studentStats.daysExcused || 0,
          ],
          backgroundColor: ["#28a745", "#dc3545", "#ffc107", "#17a2b8"],
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <div className="attendance-statistics container-fluid py-4">
      <h2 className="mb-4">Attendance Statistics</h2>

      {/* View Selector */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="btn-group" role="group">
            <button
              className={`btn ${selectedView === "school" ? "btn-nigerian" : "btn-outline-nigerian"}`}
              onClick={() => setSelectedView("school")}
            >
              <FaSchool className="me-2" /> School Overview
            </button>
            <button
              className={`btn ${selectedView === "class" ? "btn-nigerian" : "btn-outline-nigerian"}`}
              onClick={() => setSelectedView("class")}
            >
              <FaUsers className="me-2" /> Class View
            </button>
            <button
              className={`btn ${selectedView === "student" ? "btn-nigerian" : "btn-outline-nigerian"}`}
              onClick={() => setSelectedView("student")}
            >
              <FaEye className="me-2" /> Student View
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-2">
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
        <div className="col-md-2">
          <select
            className="form-select"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          >
            {terms.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {selectedView === "class" && (
          <div className="col-md-2">
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

        {selectedView === "student" && (
          <>
            <div className="col-md-3">
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
                <option value="">Select Student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} - {s.admissionNumber}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
              />
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
              />
            </div>
          </>
        )}
      </div>

      {loading && (
        <div className="text-center py-5">
          <FaSpinner className="spinner" size={40} />
          <p className="mt-3">Loading attendance statistics...</p>
        </div>
      )}

      {/* School View */}
      {selectedView === "school" && schoolStats && !loading && (
        <div className="school-view">
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="stat-card bg-primary text-white">
                <h3>{schoolStats.totalStudents}</h3>
                <p>Total Students</p>
                <small>Across all classes</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card bg-success text-white">
                <h3>{schoolStats.totalPresent}</h3>
                <p>Total Present</p>
                <small>This term</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card bg-danger text-white">
                <h3>{schoolStats.totalAbsent}</h3>
                <p>Total Absent</p>
                <small>This term</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card bg-warning text-dark">
                <h3>{schoolStats.attendanceRate?.toFixed(1)}%</h3>
                <p>Attendance Rate</p>
                <div className="progress mt-2" style={{ height: "5px" }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${schoolStats.attendanceRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header bg-info text-white">
                  <h5 className="mb-0">Class-wise Attendance</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Class</th>
                          <th>Present</th>
                          <th>Absent</th>
                          <th>Late</th>
                          <th>Excused</th>
                          <th>Attendance Rate</th>
                          <th>Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map((className) => {
                          const present =
                            schoolStats.classStatistics?.[
                              `${className}_present`
                            ] || 0;
                          const absent =
                            schoolStats.classStatistics?.[
                              `${className}_absent`
                            ] || 0;
                          const total = present + absent;
                          const rate = total > 0 ? (present * 100) / total : 0;

                          return (
                            <tr key={className}>
                              <td className="fw-bold">{className}</td>
                              <td className="text-success">{present}</td>
                              <td className="text-danger">{absent}</td>
                              <td className="text-warning">0</td>
                              <td className="text-info">0</td>
                              <td>
                                <span className={getAttendanceRateColor(rate)}>
                                  {rate.toFixed(1)}%
                                </span>
                              </td>
                              <td style={{ width: "200px" }}>
                                <div className="progress">
                                  <div
                                    className={`progress-bar ${
                                      rate >= 90
                                        ? "bg-success"
                                        : rate >= 75
                                          ? "bg-primary"
                                          : rate >= 60
                                            ? "bg-warning"
                                            : "bg-danger"
                                    }`}
                                    style={{ width: `${rate}%` }}
                                  ></div>
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
            </div>
          </div>
        </div>
      )}

      {/* Class View */}
      {selectedView === "class" && classStats && !loading && (
        <div className="class-view">
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="stat-card bg-primary text-white">
                <h3>{classStats.totalStudents}</h3>
                <p>Students in {selectedClass}</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card bg-success text-white">
                <h3>{classStats.totalPresent}</h3>
                <p>Total Present</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card bg-danger text-white">
                <h3>{classStats.totalAbsent}</h3>
                <p>Total Absent</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card bg-warning text-dark">
                <h3>{classStats.averageAttendance?.toFixed(1)}%</h3>
                <p>Average Attendance</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                Student Attendance Details - {selectedClass}
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>Admission No</th>
                      <th>Student Name</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Late</th>
                      <th>Attendance %</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStats.studentAttendance?.map((student, index) => (
                      <tr key={index}>
                        <td>{student.admissionNumber}</td>
                        <td>{student.studentName}</td>
                        <td className="text-success fw-bold">
                          {student.present}
                        </td>
                        <td className="text-danger fw-bold">
                          {student.absent}
                        </td>
                        <td className="text-warning fw-bold">
                          {student.late || 0}
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
                            <span className="badge bg-success">Excellent</span>
                          ) : student.percentage >= 75 ? (
                            <span className="badge bg-primary">Good</span>
                          ) : student.percentage >= 60 ? (
                            <span className="badge bg-warning">Fair</span>
                          ) : (
                            <span className="badge bg-danger">Poor</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => {
                              setSelectedStudent(
                                students.find(
                                  (s) => s.id === student.studentId,
                                ),
                              );
                              setSelectedView("student");
                            }}
                          >
                            <FaEye /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student View */}
      {selectedView === "student" && selectedStudent && !loading && (
        <div className="student-view">
          {/* Student Info Header */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Student Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p>
                    <strong>Name:</strong> {selectedStudent.fullName}
                  </p>
                  <p>
                    <strong>Admission:</strong>{" "}
                    {selectedStudent.admissionNumber}
                  </p>
                  <p>
                    <strong>Class:</strong> {selectedStudent.studentClass}{" "}
                    {selectedStudent.classArm}
                  </p>
                </div>
                <div className="col-md-6">
                  <p>
                    <strong>Session:</strong> {session}
                  </p>
                  <p>
                    <strong>Term:</strong> {term}
                  </p>
                  <p>
                    <strong>Date Range:</strong>{" "}
                    {moment(dateRange.startDate).format("DD/MM/YYYY")} -{" "}
                    {moment(dateRange.endDate).format("DD/MM/YYYY")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {studentStats && (
            <>
              {/* Summary Cards */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <div className="stat-card bg-primary text-white">
                    <h3>{studentStats.totalSchoolDays}</h3>
                    <p>School Days</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card bg-success text-white">
                    <h3>{studentStats.daysPresent}</h3>
                    <p>Days Present</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card bg-danger text-white">
                    <h3>{studentStats.daysAbsent}</h3>
                    <p>Days Absent</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card bg-warning text-dark">
                    <h3>{studentStats.attendancePercentage?.toFixed(1)}%</h3>
                    <p>Attendance Rate</p>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-header bg-info text-white">
                      <h5 className="mb-0">Attendance Distribution</h5>
                    </div>
                    <div className="card-body">
                      {getStatusChartData() && (
                        <Pie
                          data={getStatusChartData()}
                          options={{ responsive: true }}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-header bg-success text-white">
                      <h5 className="mb-0">Attendance Trend</h5>
                    </div>
                    <div className="card-body">
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
                                  ) + 1,
                              },
                            },
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance History */}
              <div className="card">
                <div className="card-header bg-warning text-dark">
                  <h5 className="mb-0">Attendance History</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
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
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AttendanceStatistics;

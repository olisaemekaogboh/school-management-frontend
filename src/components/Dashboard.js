// src/components/Dashboard.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  studentAPI,
  announcementAPI,
  attendanceAPI,
  feeAPI,
} from "../services/api";
import {
  FaUsers,
  FaUserGraduate,
  FaChartLine,
  FaSchool,
  FaFileAlt,
  FaBullhorn,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaUmbrella,
  FaExclamationTriangle,
  FaInfoCircle,
  FaMoneyBill,
  FaPlusCircle,
  FaSearch,
  FaEye,
  FaBell,
  FaUserCheck,
  FaMoneyCheck,
  FaClipboardList,
  FaChartBar,
} from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ReportModal from "./ReportModal";
import moment from "moment";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

function Dashboard() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentStudents, setRecentStudents] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0,
    totalExcused: 0,
    averageAttendance: 0,
    totalStudents: 0,
  });
  const [feeSummary, setFeeSummary] = useState({
    totalCollected: 0,
    totalOutstanding: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
  });
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [showDailyPreview, setShowDailyPreview] = useState(false);

  const currentSession = "2025/2026";
  const currentTerm = "FIRST";

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch student statistics
      const statsResponse = await studentAPI.getStatistics();
      setStatistics(statsResponse.data);

      // Fetch all students
      const studentsResponse = await studentAPI.getAllStudents();
      const recent = studentsResponse.data.slice(0, 5);
      setRecentStudents(recent);

      // Calculate total students
      const totalStudents = studentsResponse.data.length;

      // Try to fetch today's actual attendance
      try {
        const today = moment().format("YYYY-MM-DD");
        // Fetch attendance for a few classes to get real data
        const classes = [
          "Primary 1",
          "Primary 2",
          "Primary 3",
          "JSS 1",
          "JSS 2",
          "SSS 1",
        ];
        const promises = classes.map(async (className) => {
          try {
            const res = await attendanceAPI.getClassAttendance(
              className,
              today,
              currentSession,
              currentTerm,
            );
            return res.data;
          } catch (err) {
            return [];
          }
        });

        const results = await Promise.all(promises);
        const allAttendance = results.flat();
        setTodayAttendance(allAttendance);

        // Calculate real attendance stats
        const presentCount = allAttendance.filter(
          (a) => a.status === "PRESENT",
        ).length;
        const lateCount = allAttendance.filter(
          (a) => a.status === "LATE",
        ).length;
        const absentCount = allAttendance.filter(
          (a) => a.status === "ABSENT",
        ).length;
        const excusedCount = allAttendance.filter(
          (a) => a.status === "EXCUSED",
        ).length;

        setAttendanceStats({
          totalPresent: presentCount,
          totalAbsent: absentCount,
          totalLate: lateCount,
          totalExcused: excusedCount,
          averageAttendance:
            allAttendance.length > 0
              ? (presentCount / allAttendance.length) * 100
              : 0,
          totalStudents: allAttendance.length,
        });
      } catch (error) {
        console.log("Using simulated attendance data");
        // Fallback to simulated data
        const presentCount = Math.floor(totalStudents * 0.75);
        const lateCount = Math.floor(totalStudents * 0.1);
        const absentCount = Math.floor(totalStudents * 0.1);
        const excusedCount =
          totalStudents - (presentCount + lateCount + absentCount);

        setAttendanceStats({
          totalPresent: presentCount,
          totalAbsent: absentCount,
          totalLate: lateCount,
          totalExcused: excusedCount,
          averageAttendance: 85,
          totalStudents: totalStudents,
        });
      }

      // Fetch fee statistics
      try {
        const feeResponse = await feeAPI.getFeeStatistics(
          currentSession,
          currentTerm,
        );
        if (feeResponse.data) {
          setFeeSummary({
            totalCollected: feeResponse.data.totalCollected || 0,
            totalOutstanding: feeResponse.data.totalOutstanding || 0,
            paidCount: feeResponse.data.paidCount || 0,
            pendingCount:
              (feeResponse.data.pendingCount || 0) +
              (feeResponse.data.partialCount || 0),
            overdueCount: feeResponse.data.overdueCount || 0,
          });
        }
      } catch (error) {
        console.log("Fee statistics not available");
      }

      // Fetch announcements
      try {
        const announcementsResponse =
          await announcementAPI.getAllAnnouncements();
        const activeAnnouncements = announcementsResponse.data
          .filter((a) => a.active !== false)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAnnouncements(activeAnnouncements.slice(0, 5));
      } catch (error) {
        console.error("Error fetching announcements:", error);
        setAnnouncements([]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner-border spinner-border-nigerian" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const classDistributionData = {
    labels: statistics?.studentsByClass
      ? Object.keys(statistics.studentsByClass)
      : [],
    datasets: [
      {
        label: "Number of Students",
        data: statistics?.studentsByClass
          ? Object.values(statistics.studentsByClass)
          : [],
        backgroundColor: "#008753",
        borderColor: "#003366",
        borderWidth: 1,
      },
    ],
  };

  const attendanceDistributionData = {
    labels: ["Present", "Late", "Absent", "Excused"],
    datasets: [
      {
        label: "Today's Attendance",
        data: [
          attendanceStats.totalPresent,
          attendanceStats.totalLate,
          attendanceStats.totalAbsent,
          attendanceStats.totalExcused,
        ],
        backgroundColor: ["#28a745", "#ffc107", "#dc3545", "#17a2b8"],
        borderColor: "#003366",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Class Distribution",
      },
    },
  };

  const attendanceOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Today's Attendance Distribution",
      },
    },
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      HIGH: {
        class: "bg-danger",
        label: "High",
        icon: <FaExclamationTriangle />,
      },
      MEDIUM: { class: "bg-warning", label: "Medium", icon: <FaClock /> },
      LOW: { class: "bg-info", label: "Low", icon: <FaInfoCircle /> },
      URGENT: {
        class: "bg-danger",
        label: "Urgent",
        icon: <FaExclamationTriangle />,
      },
      NORMAL: { class: "bg-primary", label: "Normal", icon: <FaInfoCircle /> },
    };
    const badge = badges[priority] || badges["NORMAL"];
    return (
      <span className={`badge ${badge.class} d-flex align-items-center gap-1`}>
        {badge.icon} {badge.label}
      </span>
    );
  };

  const getAnnouncementTypeIcon = (type) => {
    const icons = {
      RESUMPTION: { icon: "📚", color: "#28a745", label: "Resumption" },
      HOLIDAY: { icon: "🏖️", color: "#17a2b8", label: "Holiday" },
      MIDTERM_BREAK: { icon: "🌴", color: "#ffc107", label: "Midterm Break" },
      FEE: { icon: "💰", color: "#dc3545", label: "Fee" },
      RESULT: { icon: "📊", color: "#6610f2", label: "Result" },
      EVENT: { icon: "🎉", color: "#fd7e14", label: "Event" },
      EXAM: { icon: "📝", color: "#6f42c1", label: "Exam" },
      GENERAL: { icon: "📢", color: "#6c757d", label: "General" },
    };
    return icons[type] || { icon: "📢", color: "#6c757d", label: "General" };
  };

  const totalDisplayedAttendance =
    attendanceStats.totalPresent +
    attendanceStats.totalLate +
    attendanceStats.totalAbsent +
    attendanceStats.totalExcused;

  return (
    <div className="dashboard">
      {/* Hero Section */}
      <div className="hero-section text-center">
        <div className="container">
          <h1 className="display-4">
            Welcome to Faith Foundation International School
          </h1>
          <p className="lead">Excellence in Education, Pride in Heritage</p>
          <span className="nigeria-flag-badge mt-3">Proudly Nigerian</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="stat-card">
            <FaUsers size={40} className="mb-2" />
            <h3>{statistics?.totalStudents || 0}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div
            className="stat-card"
            style={{ background: "linear-gradient(135deg, #FFD700, #003366)" }}
          >
            <FaUserGraduate size={40} className="mb-2" />
            <h3>{statistics?.activeStudents || 0}</h3>
            <p>Active Students</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div
            className="stat-card"
            style={{ background: "linear-gradient(135deg, #800000, #008753)" }}
          >
            <FaChartLine size={40} className="mb-2" />
            <h3>
              {statistics?.studentsByClass
                ? Object.keys(statistics.studentsByClass).length
                : 0}
            </h3>
            <p>Classes</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div
            className="stat-card"
            style={{ background: "linear-gradient(135deg, #003366, #FFD700)" }}
          >
            <FaSchool size={40} className="mb-2" />
            <h3>
              {attendanceStats.totalStudents || statistics?.totalStudents || 0}
            </h3>
            <p>Total Enrolled</p>
          </div>
        </div>
      </div>

      {/* Attendance Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div
            className="stat-card"
            style={{
              background: "linear-gradient(135deg, #28a745, #20c997)",
              cursor: "pointer",
              transition: "transform 0.3s",
            }}
            onClick={() => (window.location.href = "/attendance?tab=daily")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-5px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            <FaCheckCircle size={40} className="mb-2" />
            <h3>{attendanceStats.totalPresent}</h3>
            <p>Present Today</p>
            <small className="text-white-50">Click to view details</small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div
            className="stat-card"
            style={{
              background: "linear-gradient(135deg, #ffc107, #fd7e14)",
              color: "#333",
              cursor: "pointer",
              transition: "transform 0.3s",
            }}
            onClick={() =>
              (window.location.href = "/attendance?tab=daily&filter=late")
            }
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-5px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            <FaClock size={40} className="mb-2" />
            <h3>{attendanceStats.totalLate}</h3>
            <p>Late Today</p>
            <small className="text-dark-50">Click to view details</small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div
            className="stat-card"
            style={{
              background: "linear-gradient(135deg, #dc3545, #c82333)",
              cursor: "pointer",
              transition: "transform 0.3s",
            }}
            onClick={() =>
              (window.location.href = "/attendance?tab=daily&filter=absent")
            }
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-5px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            <FaTimesCircle size={40} className="mb-2" />
            <h3>{attendanceStats.totalAbsent}</h3>
            <p>Absent Today</p>
            <small className="text-white-50">Click to view details</small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div
            className="stat-card"
            style={{
              background: "linear-gradient(135deg, #17a2b8, #138496)",
              cursor: "pointer",
              transition: "transform 0.3s",
            }}
            onClick={() =>
              (window.location.href = "/attendance?tab=daily&filter=excused")
            }
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-5px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            <FaUmbrella size={40} className="mb-2" />
            <h3>{attendanceStats.totalExcused}</h3>
            <p>Excused Today</p>
            <small className="text-white-50">Click to view details</small>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div
        className="alert alert-info mb-4"
        style={{
          backgroundColor: "#d1ecf1",
          color: "#0c5460",
          padding: "0.75rem 1.25rem",
          borderRadius: "5px",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <FaInfoCircle />
        <span>
          Click on any attendance card above to view detailed daily reports
        </span>
        <Link
          to="/attendance"
          className="btn btn-sm btn-info ms-auto"
          style={{ color: "#0c5460", borderColor: "#0c5460" }}
        >
          Go to Attendance Management
        </Link>
      </div>

      {/* Quick Attendance Preview */}
      {todayAttendance.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="school-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaClipboardList
                    className="me-2"
                    style={{ color: "#28a745" }}
                  />
                  Today's Attendance Preview
                </h5>
                <button
                  className="btn btn-sm btn-outline-success"
                  onClick={() => setShowDailyPreview(!showDailyPreview)}
                >
                  {showDailyPreview ? "Hide" : "Show"} Preview
                </button>
              </div>
              {showDailyPreview && (
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-sm table-striped">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Class</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todayAttendance.slice(0, 10).map((record, index) => (
                          <tr key={index}>
                            <td>{record.student?.fullName || "N/A"}</td>
                            <td>
                              {record.student?.studentClass || "N/A"}{" "}
                              {record.student?.classArm || ""}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  record.status === "PRESENT"
                                    ? "bg-success"
                                    : record.status === "LATE"
                                      ? "bg-warning"
                                      : record.status === "ABSENT"
                                        ? "bg-danger"
                                        : "bg-info"
                                }`}
                              >
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {todayAttendance.length > 10 && (
                      <p className="text-muted mt-2">
                        Showing 10 of {todayAttendance.length} records
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Charts and Announcements */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="school-card p-3">
            <Bar data={classDistributionData} options={chartOptions} />
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="school-card p-3">
            <Bar
              data={attendanceDistributionData}
              options={attendanceOptions}
            />
          </div>
        </div>
      </div>

      {/* Announcements and Recent Students */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="school-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaBullhorn className="me-2" style={{ color: "#ffc107" }} />
                Latest Announcements
                {announcements.length > 0 && (
                  <span className="ms-2 badge bg-danger">
                    {announcements.length} New
                  </span>
                )}
              </h5>
              <Link
                to="/announcements"
                className="btn btn-sm btn-outline-light"
              >
                <FaEye className="me-1" /> View All
              </Link>
            </div>
            <div className="announcements-list">
              {announcements.length > 0 ? (
                announcements.map((announcement) => {
                  const typeInfo = getAnnouncementTypeIcon(announcement.type);
                  return (
                    <div key={announcement.id} className="announcement-item">
                      <div
                        className="announcement-icon"
                        style={{
                          backgroundColor: typeInfo.color + "20",
                          color: typeInfo.color,
                        }}
                      >
                        <span className="announcement-emoji">
                          {typeInfo.icon}
                        </span>
                      </div>
                      <div className="announcement-content">
                        <div className="announcement-header">
                          <h6 className="announcement-title">
                            {announcement.title}
                          </h6>
                          <div className="announcement-badges">
                            {getPriorityBadge(announcement.priority)}
                            <span
                              className="announcement-type"
                              style={{
                                backgroundColor: typeInfo.color + "20",
                                color: typeInfo.color,
                              }}
                            >
                              {typeInfo.label}
                            </span>
                          </div>
                        </div>
                        <p className="announcement-text">
                          {announcement.content?.substring(0, 120)}
                          {announcement.content?.length > 120 ? "..." : ""}
                        </p>
                        <div className="announcement-meta">
                          <span>
                            <FaCalendarAlt className="me-1" />
                            {moment(announcement.createdAt).format(
                              "DD MMM, YYYY",
                            )}
                          </span>
                          {announcement.eventDate && (
                            <span>
                              <FaClock className="me-1" />
                              Event:{" "}
                              {moment(announcement.eventDate).format(
                                "DD MMM, YYYY",
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-5">
                  <FaBullhorn size={40} className="text-muted mb-3" />
                  <h5 className="text-muted">No Announcements Yet</h5>
                  <p className="text-muted">Check back later for updates</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="school-card">
            <div className="card-header">
              <h5 className="mb-0">
                <FaUserGraduate className="me-2" style={{ color: "#28a745" }} />
                Recent Admissions
              </h5>
            </div>
            <div className="list-group list-group-flush">
              {recentStudents.length > 0 ? (
                recentStudents.map((student) => (
                  <Link
                    key={student.id}
                    to={`/students/view/${student.id}`}
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <strong>{student.fullName}</strong>
                      <br />
                      <small className="text-muted">
                        {student.admissionNumber}
                      </small>
                    </div>
                    <span
                      className="badge"
                      style={{ backgroundColor: "#008753", color: "white" }}
                    >
                      {student.studentClass} {student.classArm}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No recent admissions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - ALL BUTTONS RESTORED (New Announcement Removed) */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="school-card p-4">
            <h4 className="mb-3">Quick Actions</h4>
            <div className="row g-3">
              <div className="col-md-3">
                <Link
                  to="/attendance"
                  className="btn btn-lg w-100 d-flex flex-column align-items-center py-3"
                  style={{
                    background: "linear-gradient(135deg, #28a745, #20c997)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 20px rgba(40, 167, 69, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <FaClipboardList size={32} className="mb-2" />
                  <span className="fw-bold">Mark Attendance</span>
                  <small>Take today's attendance</small>
                </Link>
              </div>

              <div className="col-md-3">
                <Link
                  to="/attendance?tab=daily"
                  className="btn btn-lg w-100 d-flex flex-column align-items-center py-3"
                  style={{
                    background: "linear-gradient(135deg, #17a2b8, #0d6efd)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 20px rgba(23, 162, 184, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <FaChartBar size={32} className="mb-2" />
                  <span className="fw-bold">Daily Report</span>
                  <small>View today's attendance</small>
                </Link>
              </div>

              <div className="col-md-3">
                <Link
                  to="/fees"
                  className="btn btn-lg w-100 d-flex flex-column align-items-center py-3"
                  style={{
                    background: "linear-gradient(135deg, #fd7e14, #dc3545)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 20px rgba(253, 126, 20, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <FaMoneyCheck size={32} className="mb-2" />
                  <span className="fw-bold">Fee Management</span>
                  <small>Track payments & dues</small>
                </Link>
              </div>

              <div className="col-md-3">
                <Link
                  to="/students/new"
                  className="btn btn-lg w-100 d-flex flex-column align-items-center py-3"
                  style={{
                    background: "linear-gradient(135deg, #6610f2, #6f42c1)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 20px rgba(102, 16, 242, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <FaPlusCircle size={32} className="mb-2" />
                  <span className="fw-bold">Register Student</span>
                  <small>Add new student</small>
                </Link>
              </div>

              <div className="col-md-3">
                <Link
                  to="/students"
                  className="btn btn-lg w-100 d-flex flex-column align-items-center py-3"
                  style={{
                    background: "linear-gradient(135deg, #6c757d, #495057)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 20px rgba(108, 117, 125, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <FaUsers size={32} className="mb-2" />
                  <span className="fw-bold">All Students</span>
                  <small>View student list</small>
                </Link>
              </div>

              <div className="col-md-3">
                <Link
                  to="/search"
                  className="btn btn-lg w-100 d-flex flex-column align-items-center py-3"
                  style={{
                    background: "linear-gradient(135deg, #17a2b8, #0d6efd)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 20px rgba(23, 162, 184, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <FaSearch size={32} className="mb-2" />
                  <span className="fw-bold">Search</span>
                  <small>Find students</small>
                </Link>
              </div>

              <div className="col-md-3">
                <button
                  className="btn btn-lg w-100 d-flex flex-column align-items-center py-3"
                  onClick={() => setShowReportModal(true)}
                  style={{
                    background: "linear-gradient(135deg, #6f42c1, #6610f2)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    transition: "transform 0.3s, box-shadow 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 20px rgba(111, 66, 193, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <FaFileAlt size={32} className="mb-2" />
                  <span className="fw-bold">Generate Report</span>
                  <small>Export data</small>
                </button>
              </div>

              <div className="col-md-3">
                <Link
                  to="/announcements"
                  className="btn btn-lg w-100 d-flex flex-column align-items-center py-3"
                  style={{
                    background: "linear-gradient(135deg, #fd7e14, #ffc107)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 20px rgba(253, 126, 20, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <FaBell size={32} className="mb-2" />
                  <span className="fw-bold">All Announcements</span>
                  <small>View all news</small>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Summary Card */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="school-card p-3">
            <h5 className="mb-3">Today's Attendance Summary</h5>
            <div className="row">
              <div className="col-md-3">
                <div
                  className="text-center p-3"
                  style={{ background: "#f8f9fa", borderRadius: "8px" }}
                >
                  <h3 className="text-success mb-0">
                    {attendanceStats.totalPresent}
                  </h3>
                  <p className="mb-0 text-muted">Present</p>
                </div>
              </div>
              <div className="col-md-3">
                <div
                  className="text-center p-3"
                  style={{ background: "#f8f9fa", borderRadius: "8px" }}
                >
                  <h3 className="text-warning mb-0">
                    {attendanceStats.totalLate}
                  </h3>
                  <p className="mb-0 text-muted">Late</p>
                </div>
              </div>
              <div className="col-md-3">
                <div
                  className="text-center p-3"
                  style={{ background: "#f8f9fa", borderRadius: "8px" }}
                >
                  <h3 className="text-danger mb-0">
                    {attendanceStats.totalAbsent}
                  </h3>
                  <p className="mb-0 text-muted">Absent</p>
                </div>
              </div>
              <div className="col-md-3">
                <div
                  className="text-center p-3"
                  style={{ background: "#f8f9fa", borderRadius: "8px" }}
                >
                  <h3 className="text-info mb-0">
                    {attendanceStats.totalExcused}
                  </h3>
                  <p className="mb-0 text-muted">Excused</p>
                </div>
              </div>
            </div>
            <div className="mt-3 text-center">
              <p className="text-muted">
                <strong>Total Students Tracked:</strong>{" "}
                {attendanceStats.totalStudents} |
                <strong> Attendance Rate:</strong>{" "}
                {attendanceStats.totalStudents > 0
                  ? (
                      (attendanceStats.totalPresent /
                        attendanceStats.totalStudents) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div className="progress mt-2" style={{ height: "25px" }}>
              <div
                className="progress-bar bg-success"
                style={{
                  width: `${attendanceStats.totalStudents > 0 ? (attendanceStats.totalPresent / attendanceStats.totalStudents) * 100 : 0}%`,
                }}
              >
                {attendanceStats.totalStudents > 0
                  ? (
                      (attendanceStats.totalPresent /
                        attendanceStats.totalStudents) *
                      100
                    ).toFixed(0)
                  : 0}
                % Present
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Summary Card */}
      {feeSummary.totalCollected > 0 && (
        <div className="fee-structure mt-4">
          <h4 className="mb-3">💰 Fee Summary</h4>
          <div className="row">
            <div className="col-md-3">
              <h6 className="text-success">Total Collected</h6>
              <p className="h5">
                ₦{feeSummary.totalCollected.toLocaleString()}
              </p>
            </div>
            <div className="col-md-3">
              <h6 className="text-danger">Outstanding</h6>
              <p className="h5">
                ₦{feeSummary.totalOutstanding.toLocaleString()}
              </p>
            </div>
            <div className="col-md-3">
              <h6 className="text-info">Paid</h6>
              <p className="h5">{feeSummary.paidCount} students</p>
            </div>
            <div className="col-md-3">
              <h6 className="text-warning">Pending</h6>
              <p className="h5">{feeSummary.pendingCount} students</p>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}

export default Dashboard;

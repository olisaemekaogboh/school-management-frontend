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

      // Calculate attendance stats that sum to totalStudents
      // Using realistic percentages that add up to 100%
      const presentCount = Math.floor(totalStudents * 0.75); // 75% present
      const lateCount = Math.floor(totalStudents * 0.1); // 10% late
      const absentCount = Math.floor(totalStudents * 0.1); // 10% absent
      const excusedCount =
        totalStudents - (presentCount + lateCount + absentCount); // Remaining

      setAttendanceStats({
        totalPresent: presentCount,
        totalAbsent: absentCount,
        totalLate: lateCount,
        totalExcused: excusedCount,
        averageAttendance: 85,
        totalStudents: totalStudents,
      });

      // Fetch fee statistics (optional - if you want to show fee data)
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

      // Fetch announcements using the correct method name
      try {
        const announcementsResponse =
          await announcementAPI.getAllAnnouncements();
        // Filter active announcements if needed
        const activeAnnouncements = announcementsResponse.data.filter(
          (a) => a.active !== false,
        );
        setAnnouncements(activeAnnouncements.slice(0, 3));
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
      HIGH: { class: "bg-danger", label: "High" },
      MEDIUM: { class: "bg-warning", label: "Medium" },
      LOW: { class: "bg-info", label: "Low" },
    };
    const badge = badges[priority] || badges["MEDIUM"];
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  const getAnnouncementTypeIcon = (type) => {
    const icons = {
      EVENT: "🎉",
      FEE: "💰",
      HOLIDAY: "🏖️",
      RESULT: "📊",
      GENERAL: "📢",
    };
    return icons[type] || "📢";
  };

  // Calculate total displayed attendance for verification
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
          <div className="stat-card" style={{ background: "#28a745" }}>
            <FaCheckCircle size={40} className="mb-2" />
            <h3>{attendanceStats.totalPresent}</h3>
            <p>Present Today</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div
            className="stat-card"
            style={{ background: "#ffc107", color: "#333" }}
          >
            <FaClock size={40} className="mb-2" />
            <h3>{attendanceStats.totalLate}</h3>
            <p>Late Today</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stat-card" style={{ background: "#dc3545" }}>
            <FaTimesCircle size={40} className="mb-2" />
            <h3>{attendanceStats.totalAbsent}</h3>
            <p>Absent Today</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stat-card" style={{ background: "#17a2b8" }}>
            <FaUmbrella size={40} className="mb-2" />
            <h3>{attendanceStats.totalExcused}</h3>
            <p>Excused Today</p>
          </div>
        </div>
      </div>

      {/* Verification Banner - Shows when totals don't match */}
      {totalDisplayedAttendance !== attendanceStats.totalStudents && (
        <div
          className="alert alert-warning mb-4"
          style={{
            backgroundColor: "#fff3cd",
            color: "#856404",
            padding: "0.5rem 1rem",
            borderRadius: "5px",
            fontSize: "0.9rem",
          }}
        >
          <FaExclamationTriangle className="me-2" />
          <span>
            Note: Attendance totals ({totalDisplayedAttendance}) will adjust to
            match total students ({attendanceStats.totalStudents})
          </span>
        </div>
      )}

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
          Attendance data is currently simulated. The attendance module is being
          configured.
        </span>
        <Link
          to="/attendance"
          className="btn btn-sm btn-info ms-auto"
          style={{ color: "#0c5460", borderColor: "#0c5460" }}
        >
          Go to Attendance
        </Link>
      </div>

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
                <FaBullhorn className="me-2" /> Latest Announcements
              </h5>
              <Link
                to="/announcements"
                className="btn btn-sm btn-outline-light"
              >
                View All
              </Link>
            </div>
            <div className="list-group list-group-flush">
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <div key={announcement.id} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <span className="me-2">
                          {getAnnouncementTypeIcon(announcement.type)}
                        </span>
                        <strong>{announcement.title}</strong>
                        <br />
                        <small className="text-muted">
                          {announcement.content?.substring(0, 100)}
                          {announcement.content?.length > 100 ? "..." : ""}
                        </small>
                      </div>
                      {getPriorityBadge(announcement.priority)}
                    </div>
                    <div className="mt-2 small text-muted">
                      <FaCalendarAlt className="me-1" />
                      {moment(announcement.createdAt).format("DD/MM/YYYY")}
                      {announcement.eventDate && (
                        <>
                          {" "}
                          | Event:{" "}
                          {moment(announcement.eventDate).format("DD/MM/YYYY")}
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="list-group-item text-center text-muted">
                  <FaInfoCircle className="me-2" />
                  No announcements available
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="school-card">
            <div className="card-header">
              <h5 className="mb-0">Recent Admissions</h5>
            </div>
            <div className="list-group list-group-flush">
              {recentStudents.length > 0 ? (
                recentStudents.map((student) => (
                  <Link
                    key={student.id}
                    to={`/students/view/${student.id}`}
                    className="list-group-item list-group-item-action"
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{student.fullName}</strong>
                        <br />
                        <small className="text-muted">
                          {student.admissionNumber}
                        </small>
                      </div>
                      <span className="badge bg-success">
                        {student.studentClass} {student.classArm}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="list-group-item text-center text-muted">
                  No recent admissions
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Summary Card */}
      <div className="row mt-2">
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
                <strong>Total Students:</strong> {attendanceStats.totalStudents}{" "}
                |<strong> Total Accounted:</strong> {totalDisplayedAttendance}
              </p>
            </div>
            <div className="progress mt-2" style={{ height: "25px" }}>
              <div
                className="progress-bar bg-success"
                style={{
                  width: `${(attendanceStats.totalPresent / attendanceStats.totalStudents) * 100}%`,
                }}
              >
                {(
                  (attendanceStats.totalPresent /
                    attendanceStats.totalStudents) *
                  100
                ).toFixed(0)}
                % Present
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="school-card p-4">
            <h4 className="mb-3">Quick Actions</h4>
            <div className="d-flex gap-2 flex-wrap">
              <Link to="/students/new" className="btn btn-nigerian">
                Register New Student
              </Link>
              <Link to="/students" className="btn btn-outline-nigerian">
                View All Students
              </Link>
              <Link to="/attendance" className="btn btn-success">
                <FaClock className="me-2" /> Mark Attendance
              </Link>
              <Link to="/search" className="btn btn-outline-nigerian">
                Search Students
              </Link>
              <Link to="/announcements/new" className="btn btn-info">
                <FaBullhorn className="me-2" /> New Announcement
              </Link>
              <Link to="/fees" className="btn btn-warning">
                <FaMoneyBill className="me-2" /> Fee Management
              </Link>
              <button
                className="btn btn-outline-nigerian"
                onClick={() => setShowReportModal(true)}
              >
                <FaFileAlt className="me-2" /> Generate Reports
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* News Ticker with Announcements */}
      <div className="news-ticker mt-4">
        <marquee behavior="scroll" direction="left">
          {announcements.length > 0
            ? announcements.map(
                (a) => `${getAnnouncementTypeIcon(a.type)} ${a.title} | `,
              )
            : "🎓 2026/2027 Admissions Now Open | 📝 Entrance Exam: Coming Soon | 🏆 Inter-House Sports Competition Next Year | 📚 Parent-Teacher Conference: Next Year"}
        </marquee>
      </div>

      {/* Attendance Stats Summary */}
      <div className="fee-structure mt-4">
        <h4 className="mb-3">📋 Today's Attendance Overview</h4>
        <div className="row">
          <div className="col-md-3">
            <h6 className="text-success">Present</h6>
            <p className="h5">{attendanceStats.totalPresent} students</p>
          </div>
          <div className="col-md-3">
            <h6 className="text-warning">Late</h6>
            <p className="h5">{attendanceStats.totalLate} students</p>
          </div>
          <div className="col-md-3">
            <h6 className="text-danger">Absent</h6>
            <p className="h5">{attendanceStats.totalAbsent} students</p>
          </div>
          <div className="col-md-3">
            <h6 className="text-info">Excused</h6>
            <p className="h5">{attendanceStats.totalExcused} students</p>
          </div>
        </div>
        <div className="row mt-3">
          <div className="col-12">
            <p className="mb-0">
              <strong>Total Students:</strong> {attendanceStats.totalStudents} |
              <strong> Present Rate:</strong>{" "}
              {(
                (attendanceStats.totalPresent / attendanceStats.totalStudents) *
                100
              ).toFixed(1)}
              %
              <span className="text-muted ms-2">
                ({moment().format("dddd, MMMM Do, YYYY")})
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}

export default Dashboard;

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import {
  studentAPI,
  announcementAPI,
  attendanceAPI,
  feeAPI,
  sessionAPI,
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
  FaPlusCircle,
  FaSearch,
  FaEye,
  FaBell,
  FaMoneyCheck,
  FaChartBar,
  FaSpinner,
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
import "./Dashboard.css";

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
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();
  const isMounted = useRef(true);

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
  const [showDailyPreview, setShowDailyPreview] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);
  const [activeSession, setActiveSession] = useState("");
  const [activeTerm, setActiveTerm] = useState("");

  useEffect(() => {
    isMounted.current = true;
    fetchDashboardData();

    return () => {
      isMounted.current = false;
    };
  }, []);

  const toNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  };

  const buildTodayDate = () => moment().format("YYYY-MM-DD");

  const normalizeDailyStats = (data, totalStudentsHint = 0) => {
    const present = toNumber(
      data?.presentCount ?? data?.totalPresent ?? data?.present,
      0,
    );
    const absent = toNumber(
      data?.absentCount ?? data?.totalAbsent ?? data?.absent,
      0,
    );
    const late = toNumber(data?.lateCount ?? data?.totalLate ?? data?.late, 0);
    const excused = toNumber(
      data?.excusedCount ?? data?.totalExcused ?? data?.excused,
      0,
    );

    const totalStudents = Math.max(
      0,
      toNumber(
        data?.totalStudentsMarked ??
          data?.totalStudents ??
          data?.studentCount ??
          totalStudentsHint,
        totalStudentsHint,
      ),
    );

    const attended = present + late + excused;

    const averageAttendance =
      totalStudents > 0
        ? Number(((attended / totalStudents) * 100).toFixed(1))
        : 0;

    return {
      totalPresent: present,
      totalAbsent: absent,
      totalLate: late,
      totalExcused: excused,
      averageAttendance,
      totalStudents,
    };
  };

  const fetchDailyAttendanceStats = async (
    sessionName,
    termName,
    totalStudentsHint = 0,
  ) => {
    try {
      const today = buildTodayDate();
      const response = await attendanceAPI.getSchoolDailyStatistics(
        today,
        sessionName,
        termName,
      );

      if (!isMounted.current) return;

      setAttendanceStats(
        normalizeDailyStats(response?.data, totalStudentsHint),
      );
      setAttendanceError(null);
    } catch (error) {
      console.error("Error fetching school daily attendance stats:", error);

      if (!isMounted.current) return;

      setAttendanceStats({
        totalPresent: 0,
        totalAbsent: 0,
        totalLate: 0,
        totalExcused: 0,
        averageAttendance: 0,
        totalStudents: Math.max(0, toNumber(totalStudentsHint, 0)),
      });
      setAttendanceError("Could not fetch today's attendance.");
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setAttendanceError(null);

      const activeRes = await sessionAPI.getActiveSession();
      const active = activeRes?.data || null;

      const sessionName = active?.session || active?.sessionName || "2025/2026";
      const termName = active?.currentTerm || "FIRST";

      if (isMounted.current) {
        setActiveSession(sessionName);
        setActiveTerm(termName);
      }

      const [
        statsResponse,
        studentsResponse,
        feeResponse,
        announcementsResponse,
      ] = await Promise.all([
        studentAPI.getStatistics(),
        studentAPI.getPaginatedStudents(0, 5),
        feeAPI.getFeeStatistics(sessionName, termName).catch(() => null),
        announcementAPI.getAllAnnouncements().catch(() => null),
      ]);

      if (!isMounted.current) return;

      const stats = statsResponse?.data || null;
      setStatistics(stats);

      const students =
        studentsResponse?.data?.content || studentsResponse?.data || [];
      setRecentStudents(Array.isArray(students) ? students : []);

      await fetchDailyAttendanceStats(
        sessionName,
        termName,
        toNumber(stats?.totalStudents, 0),
      );

      if (feeResponse?.data) {
        setFeeSummary({
          totalCollected: toNumber(feeResponse.data.totalCollected, 0),
          totalOutstanding: toNumber(feeResponse.data.totalOutstanding, 0),
          paidCount: toNumber(feeResponse.data.paidCount, 0),
          pendingCount:
            toNumber(feeResponse.data.pendingCount, 0) +
            toNumber(feeResponse.data.partialCount, 0),
          overdueCount: toNumber(feeResponse.data.overdueCount, 0),
        });
      } else {
        setFeeSummary({
          totalCollected: 0,
          totalOutstanding: 0,
          paidCount: 0,
          pendingCount: 0,
          overdueCount: 0,
        });
      }

      if (announcementsResponse?.data) {
        const allAnnouncements = Array.isArray(announcementsResponse.data)
          ? announcementsResponse.data
          : [];

        const activeAnnouncements = allAnnouncements
          .filter((a) => a.active !== false)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setAnnouncements(activeAnnouncements.slice(0, 5));
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="spinner-container text-center py-5">
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">{t?.common?.loading || "Loading..."}</p>
      </div>
    );
  }

  const getStudentDisplayName = (student) => {
    if (!student) return "N/A";
    if (student.fullName && student.fullName.trim()) return student.fullName;

    const firstName = student.firstName || "";
    const lastName = student.lastName || "";
    const otherName = student.otherName || student.middleName || "";

    const combined = `${firstName} ${otherName} ${lastName}`
      .replace(/\s+/g, " ")
      .trim();

    return combined || student.admissionNumber || "N/A";
  };

  const classDistributionData = {
    labels: statistics?.studentsByClass
      ? Object.keys(statistics.studentsByClass)
      : [],
    datasets: [
      {
        label: t?.dashboard?.numberOfStudents || "Number of Students",
        data: statistics?.studentsByClass
          ? Object.values(statistics.studentsByClass)
          : [],
        backgroundColor: darkMode ? "#60a5fa" : "#008753",
        borderColor: darkMode ? "#3b82f6" : "#003366",
        borderWidth: 1,
      },
    ],
  };

  const attendanceDistributionData = {
    labels: [
      t?.dashboard?.present || "Present",
      t?.dashboard?.late || "Late",
      t?.dashboard?.absent || "Absent",
      t?.dashboard?.excused || "Excused",
    ],
    datasets: [
      {
        label: t?.dashboard?.todaysAttendance || "Today's Attendance",
        data: [
          attendanceStats.totalPresent,
          attendanceStats.totalLate,
          attendanceStats.totalAbsent,
          attendanceStats.totalExcused,
        ],
        backgroundColor: ["#28a745", "#ffc107", "#dc3545", "#17a2b8"],
        borderColor: darkMode ? "#374151" : "#003366",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: darkMode ? "#f9fafb" : "#1f2937",
        },
      },
      title: {
        display: true,
        text: t?.dashboard?.classDistribution || "Class Distribution",
        color: darkMode ? "#f9fafb" : "#1f2937",
      },
    },
  };

  const attendanceOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: darkMode ? "#f9fafb" : "#1f2937",
        },
      },
      title: {
        display: true,
        text:
          t?.dashboard?.attendanceDistribution ||
          "Today's Attendance Distribution",
        color: darkMode ? "#f9fafb" : "#1f2937",
      },
    },
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      HIGH: {
        class: "badge-danger",
        label: t?.dashboard?.high || "High",
        icon: <FaExclamationTriangle />,
      },
      MEDIUM: {
        class: "badge-warning",
        label: t?.dashboard?.medium || "Medium",
        icon: <FaClock />,
      },
      LOW: {
        class: "badge-info",
        label: t?.dashboard?.low || "Low",
        icon: <FaInfoCircle />,
      },
      URGENT: {
        class: "badge-danger",
        label: t?.dashboard?.urgent || "Urgent",
        icon: <FaExclamationTriangle />,
      },
      NORMAL: {
        class: "badge-primary",
        label: t?.dashboard?.normal || "Normal",
        icon: <FaInfoCircle />,
      },
    };

    const badge = badges[priority] || badges.NORMAL;

    return (
      <span className={`announcement-badge ${badge.class}`}>
        {badge.icon} {badge.label}
      </span>
    );
  };

  const getAnnouncementTypeIcon = (type) => {
    const icons = {
      RESUMPTION: {
        icon: "📚",
        label: t?.dashboard?.resumption || "Resumption",
      },
      HOLIDAY: { icon: "🏖️", label: t?.dashboard?.holiday || "Holiday" },
      MIDTERM_BREAK: {
        icon: "🌴",
        label: t?.dashboard?.midtermBreak || "Midterm Break",
      },
      FEE: { icon: "💰", label: t?.dashboard?.fee || "Fee" },
      RESULT: { icon: "📊", label: t?.dashboard?.result || "Result" },
      EVENT: { icon: "🎉", label: t?.dashboard?.event || "Event" },
      EXAM: { icon: "📝", label: t?.dashboard?.exam || "Exam" },
      GENERAL: { icon: "📢", label: t?.dashboard?.general || "General" },
    };

    return (
      icons[type] || { icon: "📢", label: t?.dashboard?.general || "General" }
    );
  };

  const recordedAttendanceRate =
    attendanceStats.totalStudents > 0
      ? (
          ((attendanceStats.totalPresent +
            attendanceStats.totalLate +
            attendanceStats.totalExcused) /
            attendanceStats.totalStudents) *
          100
        ).toFixed(1)
      : "0.0";

  return (
    <div className={`dashboard ${darkMode ? "dark-mode" : ""}`}>
      <div className="hero-section">
        <div className="container">
          <h1 className="display-4">
            {t?.dashboard?.welcomeTitle ||
              "Welcome to Faith Foundation International School"}
          </h1>
          <p className="lead">
            {t?.dashboard?.welcomeSubtitle ||
              "Excellence in Education, Pride in Heritage"}
          </p>
          <span className="nigeria-flag-badge">
            {t?.dashboard?.proudlyNigerian || "Proudly Nigerian"}
          </span>
        </div>
      </div>

      <div className="row mb-2">
        <div className="col-12">
          <div className="alert alert-info">
            <FaInfoCircle className="me-2" />
            Active attendance window: <strong>
              {activeSession || "-"}
            </strong> / <strong>{activeTerm || "-"}</strong>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="stat-card stat-primary">
            <FaUsers size={40} />
            <h3>{statistics?.totalStudents || 0}</h3>
            <p>{t?.dashboard?.totalStudents || "Total Students"}</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stat-card stat-gold">
            <FaUserGraduate size={40} />
            <h3>{statistics?.activeStudents || 0}</h3>
            <p>{t?.dashboard?.activeStudents || "Active Students"}</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stat-card stat-maroon">
            <FaChartLine size={40} />
            <h3>
              {statistics?.studentsByClass
                ? Object.keys(statistics.studentsByClass).length
                : 0}
            </h3>
            <p>{t?.dashboard?.classes || "Classes"}</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stat-card stat-blue">
            <FaSchool size={40} />
            <h3>
              {attendanceStats.totalStudents || statistics?.totalStudents || 0}
            </h3>
            <p>{t?.dashboard?.totalEnrolled || "Total Enrolled"}</p>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div
            className="stat-card stat-success clickable"
            onClick={() => (window.location.href = "/attendance")}
          >
            <FaCheckCircle size={40} />
            <h3>{attendanceStats.totalPresent}</h3>
            <p>{t?.dashboard?.presentToday || "Present Today"}</p>
            <small>
              {t?.dashboard?.clickToView || "Click to view details"}
            </small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div
            className="stat-card stat-warning clickable"
            onClick={() => (window.location.href = "/attendance")}
          >
            <FaClock size={40} />
            <h3>{attendanceStats.totalLate}</h3>
            <p>{t?.dashboard?.lateToday || "Late Today"}</p>
            <small>
              {t?.dashboard?.clickToView || "Click to view details"}
            </small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div
            className="stat-card stat-danger clickable"
            onClick={() => (window.location.href = "/attendance")}
          >
            <FaTimesCircle size={40} />
            <h3>{attendanceStats.totalAbsent}</h3>
            <p>{t?.dashboard?.absentToday || "Absent Today"}</p>
            <small>
              {t?.dashboard?.clickToView || "Click to view details"}
            </small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div
            className="stat-card stat-cyan clickable"
            onClick={() => (window.location.href = "/attendance")}
          >
            <FaUmbrella size={40} />
            <h3>{attendanceStats.totalExcused}</h3>
            <p>{t?.dashboard?.excusedToday || "Excused Today"}</p>
            <small>
              {t?.dashboard?.clickToView || "Click to view details"}
            </small>
          </div>
        </div>
      </div>

      {attendanceError && (
        <div className="alert alert-warning mb-4">
          <FaExclamationTriangle className="me-2" />
          {attendanceError}
        </div>
      )}

      <div className="info-alert">
        <FaInfoCircle />
        <span>
          {t?.dashboard?.attendanceCardHint ||
            "These cards now use actual daily backend totals, not cumulative term totals."}
        </span>
        <Link to="/attendance" className="info-link">
          {t?.dashboard?.goToAttendance || "Go to Attendance Management"}
        </Link>
      </div>

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

      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="school-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaBullhorn className="me-2" />
                {t?.dashboard?.latestAnnouncements || "Latest Announcements"}
                {announcements.length > 0 && (
                  <span className="new-badge">{announcements.length} New</span>
                )}
              </h5>
              <Link to="/announcements" className="view-link">
                <FaEye className="me-1" /> {t?.dashboard?.viewAll || "View All"}
              </Link>
            </div>
            <div className="announcements-list">
              {announcements.length > 0 ? (
                announcements.map((announcement) => {
                  const typeInfo = getAnnouncementTypeIcon(announcement.type);
                  return (
                    <div key={announcement.id} className="announcement-item">
                      <div className="announcement-icon">
                        <span>{typeInfo.icon}</span>
                      </div>
                      <div className="announcement-content">
                        <div className="announcement-header">
                          <h6 className="announcement-title">
                            {announcement.title}
                          </h6>
                          <div className="announcement-badges">
                            {getPriorityBadge(announcement.priority)}
                            <span className="announcement-type">
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
                <div className="empty-announcements">
                  <FaBullhorn size={40} />
                  <h5>No Announcements Yet</h5>
                  <p>Check back later for updates</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="school-card">
            <div className="card-header">
              <h5 className="mb-0">
                <FaUserGraduate className="me-2" />
                {t?.dashboard?.recentAdmissions || "Recent Admissions"}
              </h5>
            </div>
            <div className="recent-list">
              {recentStudents.length > 0 ? (
                recentStudents.map((student) => (
                  <Link
                    key={student.id}
                    to={`/students/view/${student.id}`}
                    className="recent-item"
                  >
                    <div>
                      <strong>{getStudentDisplayName(student)}</strong>
                      <br />
                      <small>{student.admissionNumber}</small>
                    </div>
                    <span className="class-badge">
                      {student.studentClass} {student.classArm}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="empty-state">
                  <p>No recent admissions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="school-card p-4">
            <h4 className="mb-3">
              {t?.dashboard?.quickActions || "Quick Actions"}
            </h4>
            <div className="quick-actions-grid">
              <Link to="/attendance" className="quick-action">
                <FaChartBar className="quick-icon" />
                <span className="quick-label">Attendance</span>
                <small>View attendance records</small>
              </Link>
              <Link to="/fees" className="quick-action">
                <FaMoneyCheck className="quick-icon" />
                <span className="quick-label">Fee Management</span>
                <small>Track payments & dues</small>
              </Link>
              <Link to="/students/new" className="quick-action">
                <FaPlusCircle className="quick-icon" />
                <span className="quick-label">Register Student</span>
                <small>Add new student</small>
              </Link>
              <Link to="/students" className="quick-action">
                <FaUsers className="quick-icon" />
                <span className="quick-label">All Students</span>
                <small>View student list</small>
              </Link>
           

              <Link to="/announcements" className="quick-action">
                <FaBell className="quick-icon" />
                <span className="quick-label">All Announcements</span>
                <small>View all news</small>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="school-card p-3">
            <h5 className="mb-3">
              {t?.dashboard?.todaysAttendanceSummary ||
                "Today's Attendance Summary"}
            </h5>
            <div className="summary-grid">
              <div className="summary-item success">
                <h3>{attendanceStats.totalPresent}</h3>
                <p>{t?.dashboard?.present || "Present"}</p>
              </div>
              <div className="summary-item warning">
                <h3>{attendanceStats.totalLate}</h3>
                <p>{t?.dashboard?.late || "Late"}</p>
              </div>
              <div className="summary-item danger">
                <h3>{attendanceStats.totalAbsent}</h3>
                <p>{t?.dashboard?.absent || "Absent"}</p>
              </div>
              <div className="summary-item info">
                <h3>{attendanceStats.totalExcused}</h3>
                <p>{t?.dashboard?.excused || "Excused"}</p>
              </div>
            </div>
            <div className="attendance-footer">
              <p>
                <strong>Total Students Tracked:</strong>{" "}
                {attendanceStats.totalStudents} |{" "}
                <strong>Attendance Rate:</strong> {recordedAttendanceRate}%
              </p>
            </div>
            <div className="progress-bar-custom">
              <div
                className="progress-fill"
                style={{
                  width: `${recordedAttendanceRate}%`,
                }}
              >
                {Number(recordedAttendanceRate).toFixed(0)}% On Record
              </div>
            </div>
          </div>
        </div>
      </div>

      {feeSummary.totalCollected > 0 && (
        <div className="fee-summary mt-4">
          <h4 className="mb-3">
            💰 {t?.dashboard?.feeSummary || "Fee Summary"}
          </h4>
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

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}

export default Dashboard;

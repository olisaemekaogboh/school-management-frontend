import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { teacherAPI } from "../services/api";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaCalendarAlt,
  FaChartBar,
  FaSpinner,
  FaGraduationCap,
  FaFileAlt,
  FaBell,
  FaClock,
  FaUserCheck,
  FaSchool,
  FaBookOpen,
} from "react-icons/fa";
import "./TeacherDashboard.css";

function TeacherDashboard() {
  const { user } = useAuth();
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeacherDashboard();
  }, []);

  const loadTeacherDashboard = async () => {
    try {
      const [teacherRes, classesRes] = await Promise.all([
        teacherAPI.getMyTeacherProfile(),
        teacherAPI.getMyClasses(),
      ]);

      const teacher = teacherRes.data;
      const classes = classesRes.data || [];

      setTeacherProfile(teacher);
      setAssignedClasses(classes);
    } catch (error) {
      console.error("Error loading teacher dashboard:", error);
      setAssignedClasses([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">
          <FaSpinner className="spinner" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const totalStudents = assignedClasses.reduce(
    (acc, cls) =>
      acc +
      (cls.studentCount || cls.currentEnrollment || cls.students?.length || 0),
    0,
  );

  const totalSubjects = assignedClasses.reduce(
    (acc, cls) => acc + (cls.subjects?.length || 0),
    0,
  );

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <div className="welcome-icon">
            <FaChalkboardTeacher />
          </div>
          <div className="welcome-text">
            <h2>
              Welcome back, {teacherProfile?.firstName || user?.firstName}!
            </h2>
            <p>
              <FaSchool />
              {teacherProfile?.department || "Teacher"} •{" "}
              {teacherProfile?.employeeId ||
                teacherProfile?.teacherId ||
                "Staff"}
            </p>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-info">
            <h3>{totalStudents}</h3>
            <p>Total Students</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaBookOpen />
          </div>
          <div className="stat-info">
            <h3>{totalSubjects}</h3>
            <p>Subjects Taught</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaGraduationCap />
          </div>
          <div className="stat-info">
            <h3>{assignedClasses.length}</h3>
            <p>Classes Assigned</p>
          </div>
        </div>
      </div>

      {assignedClasses.length === 0 ? (
        <div className="empty-state">
          <FaUsers className="empty-icon" />
          <h3>No Classes Assigned Yet</h3>
          <p>You haven't been assigned to any classes for this session.</p>
          <p className="text-muted">
            Please contact the administration for class assignments.
          </p>
        </div>
      ) : (
        <>
          <div className="row">
            {assignedClasses.map((schoolClass) => (
              <div className="col-md-6 col-lg-4 mb-4" key={schoolClass.id}>
                <div className="class-card">
                  <div className="class-header">
                    <h5>
                      {schoolClass.className} {schoolClass.arm}
                    </h5>
                    <p>Class Code: {schoolClass.classCode || "-"}</p>
                  </div>

                  <div className="class-body">
                    <div className="class-stats">
                      <div className="stat-item">
                        <div className="stat-value">
                          {schoolClass.studentCount ||
                            schoolClass.currentEnrollment ||
                            schoolClass.students?.length ||
                            0}
                        </div>
                        <div className="stat-label">Students</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">
                          {schoolClass.subjects?.length || 0}
                        </div>
                        <div className="stat-label">Subjects</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">
                          {schoolClass.arm || "-"}
                        </div>
                        <div className="stat-label">Section</div>
                      </div>
                    </div>

                    <div className="action-buttons">
                      <Link
                        to={`/students?classId=${schoolClass.id}&mine=true`}
                        className="action-btn students"
                      >
                        <FaUsers className="btn-icon" />
                        <span>My Students</span>
                      </Link>

                      <Link
                        to={`/results?classId=${schoolClass.id}&mine=true`}
                        className="action-btn results"
                      >
                        <FaChartBar className="btn-icon" />
                        <span>Results</span>
                      </Link>

                      <Link
                        to={`/attendance?classId=${schoolClass.id}&mine=true`}
                        className="action-btn attendance"
                      >
                        <FaCalendarAlt className="btn-icon" />
                        <span>Attendance</span>
                      </Link>

                      <Link
                        to={`/session-results?classId=${schoolClass.id}&mine=true`}
                        className="action-btn session"
                      >
                        <FaGraduationCap className="btn-icon" />
                        <span>Session</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="quick-actions-grid">
              <Link to="/timetable" className="quick-action-btn">
                <FaClock className="quick-action-icon" />
                <span className="quick-action-text">View Timetable</span>
              </Link>

              <Link to="/announcements" className="quick-action-btn">
                <FaBell className="quick-action-icon" />
                <span className="quick-action-text">Announcements</span>
              </Link>

              <Link to="/profile" className="quick-action-btn">
                <FaUserCheck className="quick-action-icon" />
                <span className="quick-action-text">My Profile</span>
              </Link>

              <Link to="/reports" className="quick-action-btn">
                <FaFileAlt className="quick-action-icon" />
                <span className="quick-action-text">Reports</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TeacherDashboard;

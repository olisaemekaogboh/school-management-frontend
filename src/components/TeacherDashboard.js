import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { teacherAPI } from "../services/api";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaCalendarAlt,
  FaChartBar,
  FaSpinner,
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

      setTeacherProfile(teacherRes.data || null);
      setAssignedClasses(classesRes.data || []);
    } catch (error) {
      console.error("Error loading teacher dashboard:", error);
      setAssignedClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = useMemo(() => {
    return assignedClasses.reduce(
      (acc, cls) =>
        acc +
        (cls.studentCount ||
          cls.currentEnrollment ||
          cls.students?.length ||
          0),
      0,
    );
  }, [assignedClasses]);

  const totalSubjects = useMemo(() => {
    const allSubjects = assignedClasses.flatMap((cls) => cls.subjects || []);
    return new Set(allSubjects).size;
  }, [assignedClasses]);
  if (loading) {
    return (
      <div className="teacher-dashboard-loading">
        <FaSpinner className="spin" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Welcome back, {teacherProfile?.firstName || user?.firstName}!</h2>
          <p>
            {teacherProfile?.department || "Teacher"} •{" "}
            {teacherProfile?.employeeId || teacherProfile?.teacherId || "Staff"}
          </p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <FaUsers className="stat-icon" />
          <div>
            <h3>{totalStudents}</h3>
            <p>Total Students</p>
          </div>
        </div>

        <div className="stat-card">
          <FaBookOpen className="stat-icon" />
          <div>
            <h3>{totalSubjects}</h3>
            <p>Subjects Taught</p>
          </div>
        </div>

        <div className="stat-card">
          <FaChalkboardTeacher className="stat-icon" />
          <div>
            <h3>{assignedClasses.length}</h3>
            <p>Classes Assigned</p>
          </div>
        </div>
      </div>

      <div className="assigned-classes-section">
        <h3>My Assigned Classes</h3>

        {assignedClasses.length === 0 ? (
          <div className="empty-state">
            <p>No class has been assigned to you yet.</p>
          </div>
        ) : (
          <div className="classes-grid">
            {assignedClasses.map((schoolClass) => (
              <div className="class-card" key={schoolClass.id}>
                <div className="class-card-header">
                  <h4>{schoolClass.className}</h4>
                  <span className="class-arm">{schoolClass.arm || "-"}</span>
                </div>

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
                    <div className="stat-value">{totalSubjects}</div>
                    <div className="stat-label">Subjects</div>
                  </div>

                  <div className="stat-item">
                    <div className="stat-value">{schoolClass.arm || "-"}</div>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherDashboard;

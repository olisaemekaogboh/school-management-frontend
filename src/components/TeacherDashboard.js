// src/components/TeacherDashboard.js
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { teacherAPI } from "../services/api";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaCalendarAlt,
  FaChartBar,
  FaSpinner,
  FaBookOpen,
  FaInfoCircle,
  FaUserTie,
  FaChalkboard,
} from "react-icons/fa";

function TeacherDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [subjectAssignments, setSubjectAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeacherDashboard();
  }, []);

  const loadTeacherDashboard = async () => {
    try {
      setLoading(true);

      const [teacherRes, classesRes, subjectsRes] = await Promise.all([
        teacherAPI.getMyTeacherProfile(),
        teacherAPI.getMyClasses(),
        teacherAPI.getMySubjectAssignments(),
      ]);

      setTeacherProfile(teacherRes?.data || null);
      setAssignedClasses(
        Array.isArray(classesRes?.data) ? classesRes.data : [],
      );
      setSubjectAssignments(
        Array.isArray(subjectsRes?.data) ? subjectsRes.data : [],
      );
    } catch (error) {
      console.error("Error loading teacher dashboard:", error);
      setTeacherProfile(null);
      setAssignedClasses([]);
      setSubjectAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // Group subject assignments by class
  const subjectsByClass = useMemo(() => {
    const grouped = {};
    subjectAssignments.forEach((assignment) => {
      const className = assignment.className;
      const classArm = assignment.classArm;
      const key = `${className}-${classArm}`;

      if (!grouped[key]) {
        grouped[key] = {
          className: className,
          arm: classArm,
          subjects: [],
        };
      }
      grouped[key].subjects.push({
        id: assignment.subjectId,
        name: assignment.subjectName,
      });
    });
    return Object.values(grouped);
  }, [subjectAssignments]);

  // Get form class (where teacher is class teacher)
  const formClass = useMemo(() => {
    // If classes have isFormTeacher flag, use that
    const form = assignedClasses.find((c) => c.isFormTeacher === true);
    if (form) return form;
    // Otherwise, return first class or null
    return assignedClasses.length > 0 ? assignedClasses[0] : null;
  }, [assignedClasses]);

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

  const totalSubjectsTaught = subjectAssignments.length;

  if (loading) {
    return (
      <div
        className={`teacher-dashboard-loading text-center py-5 ${darkMode ? "dark-mode" : ""}`}
      >
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">
          {t?.common?.loading || "Loading your dashboard..."}
        </p>
      </div>
    );
  }

  if (assignedClasses.length === 0 && subjectAssignments.length === 0) {
    return (
      <div className={`teacher-dashboard ${darkMode ? "dark-mode" : ""}`}>
        <div className="dashboard-header">
          <h2>
            {t?.teacherDashboard?.welcomeBack || "Welcome back"}{" "}
            {teacherProfile?.firstName || user?.firstName}!
          </h2>
          <div className="alert alert-warning mt-3">
            <FaInfoCircle className="me-2" />
            You have not been assigned to any class or subject yet. Please
            contact the administrator.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`teacher-dashboard ${darkMode ? "dark-mode" : ""}`}>
      <div className="dashboard-header">
        <div>
          <h2>
            {t?.teacherDashboard?.welcomeBack || "Welcome back"}{" "}
            {teacherProfile?.firstName || user?.firstName}!
          </h2>
          <p>
            {teacherProfile?.department ||
              t?.teacherDashboard?.teacher ||
              "Teacher"}{" "}
            •{" "}
            {teacherProfile?.employeeId ||
              teacherProfile?.teacherId ||
              t?.teacherDashboard?.staff ||
              "Staff"}
          </p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <FaUsers className="stat-icon" />
          <div>
            <h3>{totalStudents}</h3>
            <p>{t?.teacherDashboard?.totalStudents || "Total Students"}</p>
          </div>
        </div>

        <div className="stat-card">
          <FaBookOpen className="stat-icon" />
          <div>
            <h3>{totalSubjectsTaught}</h3>
            <p>{t?.teacherDashboard?.subjectsTaught || "Subjects I Teach"}</p>
          </div>
        </div>

        <div className="stat-card">
          <FaChalkboard className="stat-icon" />
          <div>
            <h3>{subjectsByClass.length}</h3>
            <p>{t?.teacherDashboard?.classesAssigned || "Classes I Teach"}</p>
          </div>
        </div>
      </div>

      {/* Form Class Section - Where teacher is Class Teacher */}
      {formClass && (
        <div className="form-class-section">
          <h3>
            <FaUserTie className="me-2" />
            {t?.teacherDashboard?.myFormClass || "My Form Class"} -{" "}
            {formClass.className} {formClass.arm}
          </h3>
          <div className="form-class-card">
            <div className="class-info">
              <p>
                <strong>{t?.teacherDashboard?.students || "Students"}:</strong>{" "}
                {formClass.studentCount || formClass.currentEnrollment || 0}
              </p>
              <p>
                <strong>{t?.teacherDashboard?.capacity || "Capacity"}:</strong>{" "}
                {formClass.capacity || 40}
              </p>
            </div>
            <div className="action-buttons">
              <Link
                to={`/students?classId=${formClass.id}&mine=true`}
                className="action-btn students"
              >
                <FaUsers className="btn-icon" />
                <span>
                  {t?.teacherDashboard?.myStudents || "View Students"}
                </span>
              </Link>
              <Link
                to={`/attendance?classId=${formClass.id}&mine=true`}
                className="action-btn attendance"
              >
                <FaCalendarAlt className="btn-icon" />
                <span>
                  {t?.teacherDashboard?.attendance || "Mark Attendance"}
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Subject Teaching Section - Subjects teacher teaches */}
      {subjectsByClass.length > 0 && (
        <div className="subject-teaching-section">
          <h3>
            <FaBookOpen className="me-2" />
            {t?.teacherDashboard?.myTeachingSubjects || "Subjects I Teach"}
          </h3>
          <div className="classes-grid">
            {subjectsByClass.map((cls, idx) => (
              <div className="class-card" key={idx}>
                <div className="class-card-header">
                  <h4>
                    {cls.className} {cls.arm}
                  </h4>
                </div>
                <div className="subjects-list">
                  <strong>
                    {t?.teacherDashboard?.subjects || "Subjects"}:
                  </strong>
                  <div className="subjects-tags">
                    {cls.subjects.map((subject, i) => (
                      <span key={i} className="subject-tag">
                        {subject.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="action-buttons">
                  <Link
                    to={`/results?classId=${formClass?.id || assignedClasses[0]?.id}&mine=true&subject=${cls.subjects[0]?.id}`}
                    className="action-btn results"
                  >
                    <FaChartBar className="btn-icon" />
                    <span>
                      {t?.teacherDashboard?.enterResults || "Enter Results"}
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .teacher-dashboard {
          padding: 2rem;
          background: var(--app-bg, #f8f9fa);
          min-height: 100vh;
          transition: all 0.3s ease;
        }
        .teacher-dashboard.dark-mode {
          background: #0f172a;
          color: #f1f5f9;
        }
        .teacher-dashboard .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .teacher-dashboard .stat-card {
          background: var(--app-card, white);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .teacher-dashboard.dark-mode .stat-card {
          background: #1e293b;
        }
        .teacher-dashboard .stat-icon {
          font-size: 2.5rem;
          color: var(--app-accent, #2563eb);
        }
        .teacher-dashboard .stat-card h3 {
          margin: 0;
          font-size: 2rem;
        }
        .teacher-dashboard .stat-card p {
          margin: 0;
          color: var(--app-text-soft, #6b7280);
        }
        .teacher-dashboard .form-class-section,
        .teacher-dashboard .subject-teaching-section {
          margin-bottom: 2rem;
        }
        .teacher-dashboard .form-class-section h3,
        .teacher-dashboard .subject-teaching-section h3 {
          margin-bottom: 1rem;
        }
        .teacher-dashboard .form-class-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 1.5rem;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .teacher-dashboard .class-info p {
          margin: 0.5rem 0;
        }
        .teacher-dashboard .classes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }
        .teacher-dashboard .class-card {
          background: var(--app-card, white);
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .teacher-dashboard.dark-mode .class-card {
          background: #1e293b;
        }
        .teacher-dashboard .class-card-header h4 {
          margin: 0 0 0.5rem;
        }
        .teacher-dashboard .subjects-list {
          margin: 1rem 0;
        }
        .teacher-dashboard .subjects-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .teacher-dashboard .subject-tag {
          background: var(--app-accent-soft, #e0e7ff);
          color: var(--app-accent, #2563eb);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
        }
        .teacher-dashboard .action-buttons {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .teacher-dashboard .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          text-decoration: none;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .teacher-dashboard .action-btn.students {
          background: #10b981;
          color: white;
        }
        .teacher-dashboard .action-btn.attendance {
          background: #f59e0b;
          color: white;
        }
        .teacher-dashboard .action-btn.results {
          background: #3b82f6;
          color: white;
        }
        .teacher-dashboard .action-btn:hover {
          transform: translateY(-2px);
        }
        .teacher-dashboard .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .teacher-dashboard {
            padding: 1rem;
          }
          .teacher-dashboard .form-class-card {
            flex-direction: column;
            text-align: center;
          }
          .teacher-dashboard .action-buttons {
            flex-direction: column;
            width: 100%;
          }
          .teacher-dashboard .action-btn {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default TeacherDashboard;

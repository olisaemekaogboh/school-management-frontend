import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { teacherAPI } from "../services/api";
import {
  FaUsers,
  FaCalendarAlt,
  FaChartBar,
  FaSpinner,
  FaBookOpen,
  FaInfoCircle,
  FaUserTie,
  FaChalkboard,
  FaArrowRight,
  FaSchool,
  FaLayerGroup,
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

  const normalizedAssignedClasses = useMemo(() => {
    return assignedClasses.map((cls) => ({
      ...cls,
      normalizedClassName: String(cls.className || "")
        .trim()
        .toLowerCase(),
      normalizedArm: String(cls.arm || "")
        .trim()
        .toLowerCase(),
    }));
  }, [assignedClasses]);

  const subjectsByClass = useMemo(() => {
    const grouped = {};

    subjectAssignments.forEach((assignment) => {
      const className = assignment.className;
      const classArm = assignment.classArm;
      const key = `${String(className || "")
        .trim()
        .toLowerCase()}-${String(classArm || "")
        .trim()
        .toLowerCase()}`;

      if (!grouped[key]) {
        const matchingClass = normalizedAssignedClasses.find(
          (cls) =>
            cls.normalizedClassName ===
              String(className || "")
                .trim()
                .toLowerCase() &&
            cls.normalizedArm ===
              String(classArm || "")
                .trim()
                .toLowerCase(),
        );

        grouped[key] = {
          key,
          className,
          arm: classArm,
          classId: matchingClass?.id || assignment.classId || null,
          subjects: [],
        };
      }

      grouped[key].subjects.push({
        id: assignment.subjectId,
        name: assignment.subjectName,
      });
    });

    return Object.values(grouped);
  }, [subjectAssignments, normalizedAssignedClasses]);

  const formClass = useMemo(() => {
    const form = assignedClasses.find((c) => c.isFormTeacher === true);
    if (form) return form;
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

  const totalClassesTaught = useMemo(() => {
    return subjectsByClass.length;
  }, [subjectsByClass]);

  if (loading) {
    return (
      <div
        className={`teacher-dashboard-loading text-center py-5 ${darkMode ? "dark-mode" : ""}`}
      >
        <div className="dashboard-loader">
          <FaSpinner className="spin" size={42} />
        </div>
        <p className="mt-3 fw-semibold">
          {t?.common?.loading || "Loading your dashboard..."}
        </p>

        <style>{`
          .teacher-dashboard-loading {
            min-height: 70vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background:
              radial-gradient(circle at top right, rgba(37,99,235,0.10), transparent 30%),
              radial-gradient(circle at bottom left, rgba(124,58,237,0.10), transparent 30%),
              var(--app-bg, #f8fafc);
          }
          .teacher-dashboard-loading.dark-mode {
            background:
              radial-gradient(circle at top right, rgba(59,130,246,0.16), transparent 30%),
              radial-gradient(circle at bottom left, rgba(168,85,247,0.16), transparent 30%),
              #0f172a;
            color: #f8fafc;
          }
          .dashboard-loader {
            width: 86px;
            height: 86px;
            border-radius: 24px;
            display: grid;
            place-items: center;
            background: rgba(255,255,255,0.8);
            box-shadow: 0 20px 40px rgba(15,23,42,0.08);
            backdrop-filter: blur(10px);
          }
          .teacher-dashboard-loading.dark-mode .dashboard-loader {
            background: rgba(30,41,59,0.8);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          }
          .spin {
            animation: spin 1s linear infinite;
            color: var(--app-accent, #2563eb);
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (assignedClasses.length === 0 && subjectAssignments.length === 0) {
    return (
      <div className={`teacher-dashboard ${darkMode ? "dark-mode" : ""}`}>
        <div className="dashboard-shell">
          <div className="dashboard-hero empty-state">
            <div className="hero-badge">
              <FaSchool />
              <span>{t?.teacherDashboard?.teacher || "Teacher"}</span>
            </div>

            <h2>
              {t?.teacherDashboard?.welcomeBack || "Welcome back"}{" "}
              {teacherProfile?.firstName || user?.firstName}!
            </h2>

            <p className="hero-subtitle">
              You have not been assigned to any class or subject yet.
            </p>

            <div className="empty-card">
              <FaInfoCircle className="me-2" />
              Please contact the administrator.
            </div>
          </div>
        </div>

        <style>{`
          .teacher-dashboard {
            min-height: 100vh;
            background:
              radial-gradient(circle at top right, rgba(37,99,235,0.08), transparent 28%),
              radial-gradient(circle at bottom left, rgba(124,58,237,0.08), transparent 28%),
              var(--app-bg, #f8fafc);
            padding: 2rem;
          }
          .teacher-dashboard.dark-mode {
            background:
              radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 28%),
              radial-gradient(circle at bottom left, rgba(168,85,247,0.12), transparent 28%),
              #0f172a;
            color: #f8fafc;
          }
          .dashboard-shell {
            max-width: 1200px;
            margin: 0 auto;
          }
          .dashboard-hero.empty-state {
            border-radius: 28px;
            padding: 2rem;
            background: rgba(255,255,255,0.84);
            border: 1px solid rgba(148,163,184,0.16);
            box-shadow: 0 25px 50px rgba(15,23,42,0.08);
            backdrop-filter: blur(12px);
          }
          .teacher-dashboard.dark-mode .dashboard-hero.empty-state {
            background: rgba(15,23,42,0.72);
            border-color: rgba(148,163,184,0.12);
            box-shadow: 0 25px 50px rgba(0,0,0,0.25);
          }
          .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.55rem 0.9rem;
            border-radius: 999px;
            background: rgba(37,99,235,0.1);
            color: #1d4ed8;
            font-weight: 700;
            font-size: 0.86rem;
            margin-bottom: 1rem;
          }
          .teacher-dashboard.dark-mode .hero-badge {
            background: rgba(96,165,250,0.14);
            color: #93c5fd;
          }
          .hero-subtitle {
            color: var(--app-text-soft, #64748b);
            max-width: 600px;
          }
          .teacher-dashboard.dark-mode .hero-subtitle {
            color: #cbd5e1;
          }
          .empty-card {
            margin-top: 1.25rem;
            display: inline-flex;
            align-items: center;
            background: #fff7ed;
            color: #9a3412;
            border: 1px solid #fdba74;
            padding: 0.9rem 1rem;
            border-radius: 14px;
            font-weight: 600;
          }
          .teacher-dashboard.dark-mode .empty-card {
            background: rgba(154,52,18,0.14);
            border-color: rgba(251,146,60,0.28);
            color: #fdba74;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`teacher-dashboard ${darkMode ? "dark-mode" : ""}`}>
      <div className="dashboard-shell">
        <section className="dashboard-hero">
          <div className="hero-content">
            <div className="hero-badge">
              <FaSchool />
              <span>
                {teacherProfile?.department ||
                  t?.teacherDashboard?.teacher ||
                  "Teacher"}
              </span>
            </div>

            <h2>
              {t?.teacherDashboard?.welcomeBack || "Welcome back"}{" "}
              {teacherProfile?.firstName || user?.firstName}!
            </h2>

            <p className="hero-subtitle">
              {teacherProfile?.employeeId ||
                teacherProfile?.teacherId ||
                t?.teacherDashboard?.staff ||
                "Staff"}
              {" • "}
              Manage your form class and subject-teaching workflow from one
              place.
            </p>
          </div>

          <div className="hero-panel">
            <div className="hero-panel-row">
              <span>Form Class</span>
              <strong>
                {formClass
                  ? `${formClass.className} ${formClass.arm}`
                  : "Not assigned"}
              </strong>
            </div>
            <div className="hero-panel-row">
              <span>Subjects</span>
              <strong>{totalSubjectsTaught}</strong>
            </div>
            <div className="hero-panel-row">
              <span>Teaching Classes</span>
              <strong>{totalClassesTaught}</strong>
            </div>
          </div>
        </section>

        <section className="dashboard-stats">
          <div className="stat-card glass">
            <div className="stat-icon-wrap blue">
              <FaUsers className="stat-icon" />
            </div>
            <div>
              <h3>{totalStudents}</h3>
              <p>{t?.teacherDashboard?.totalStudents || "Total Students"}</p>
            </div>
          </div>

          <div className="stat-card glass">
            <div className="stat-icon-wrap violet">
              <FaBookOpen className="stat-icon" />
            </div>
            <div>
              <h3>{totalSubjectsTaught}</h3>
              <p>{t?.teacherDashboard?.subjectsTaught || "Subjects I Teach"}</p>
            </div>
          </div>

          <div className="stat-card glass">
            <div className="stat-icon-wrap emerald">
              <FaChalkboard className="stat-icon" />
            </div>
            <div>
              <h3>{totalClassesTaught}</h3>
              <p>{t?.teacherDashboard?.classesAssigned || "Classes I Teach"}</p>
            </div>
          </div>
        </section>

        {formClass && (
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">Form Class</span>
                <h3>
                  <FaUserTie className="me-2" />
                  {t?.teacherDashboard?.myFormClass || "My Form Class"} -{" "}
                  {formClass.className} {formClass.arm}
                </h3>
              </div>
            </div>

            <div className="form-class-card modern-gradient">
              <div className="form-class-main">
                <div className="metric-chip">
                  <span>Students</span>
                  <strong>
                    {formClass.studentCount || formClass.currentEnrollment || 0}
                  </strong>
                </div>
                <div className="metric-chip">
                  <span>Capacity</span>
                  <strong>{formClass.capacity || 40}</strong>
                </div>
                <div className="metric-chip">
                  <span>Role</span>
                  <strong>Form Teacher</strong>
                </div>
              </div>

              <div className="action-buttons form-actions">
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

                <Link
                  to={`/results?classId=${formClass.id}&mine=true`}
                  className="action-btn results secondary"
                >
                  <FaChartBar className="btn-icon" />
                  <span>View Class Results</span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {subjectsByClass.length > 0 && (
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">Teaching Load</span>
                <h3>
                  <FaBookOpen className="me-2" />
                  {t?.teacherDashboard?.myTeachingSubjects ||
                    "Subjects I Teach"}
                </h3>
              </div>
            </div>

            <div className="classes-grid">
              {subjectsByClass.map((cls, idx) => {
                const matchingClass = assignedClasses.find(
                  (c) =>
                    String(c.className || "")
                      .trim()
                      .toLowerCase() ===
                      String(cls.className || "")
                        .trim()
                        .toLowerCase() &&
                    String(c.arm || "")
                      .trim()
                      .toLowerCase() ===
                      String(cls.arm || "")
                        .trim()
                        .toLowerCase(),
                );

                const classId = matchingClass?.id || cls.classId || null;

                return (
                  <div className="class-card glass-card" key={cls.key || idx}>
                    <div className="class-card-top">
                      <div className="class-badge">
                        <FaLayerGroup />
                        <span>
                          {cls.className} {cls.arm}
                        </span>
                      </div>
                      <span className="subject-count">
                        {cls.subjects.length} subject
                        {cls.subjects.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="subjects-list">
                      <strong>
                        {t?.teacherDashboard?.subjects || "Subjects"}:
                      </strong>
                      <div className="subjects-tags">
                        {cls.subjects.map((subject, i) => (
                          <span
                            key={`${subject.id || subject.name}-${i}`}
                            className="subject-tag"
                          >
                            {subject.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="action-buttons">
                      <Link
                        to={`/results?classId=${classId}&mine=true&subject=${cls.subjects[0]?.id}`}
                        className="action-btn results"
                      >
                        <FaChartBar className="btn-icon" />
                        <span>
                          {t?.teacherDashboard?.enterResults || "Enter Results"}
                        </span>
                        <FaArrowRight className="btn-trail" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <style>{`
        .teacher-dashboard {
          min-height: 100vh;
          padding: 2rem;
          background:
            radial-gradient(circle at top right, rgba(37,99,235,0.08), transparent 28%),
            radial-gradient(circle at bottom left, rgba(124,58,237,0.08), transparent 28%),
            var(--app-bg, #f8fafc);
          transition: all 0.3s ease;
        }

        .teacher-dashboard.dark-mode {
          background:
            radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 28%),
            radial-gradient(circle at bottom left, rgba(168,85,247,0.12), transparent 28%),
            #0f172a;
          color: #f8fafc;
        }

        .dashboard-shell {
          max-width: 1280px;
          margin: 0 auto;
        }

        .dashboard-hero {
          display: grid;
          grid-template-columns: 1.7fr 1fr;
          gap: 1.5rem;
          align-items: stretch;
          margin-bottom: 1.75rem;
          padding: 1.75rem;
          border-radius: 28px;
          background: rgba(255,255,255,0.84);
          border: 1px solid rgba(148,163,184,0.16);
          box-shadow: 0 25px 50px rgba(15,23,42,0.08);
          backdrop-filter: blur(12px);
        }

        .teacher-dashboard.dark-mode .dashboard-hero {
          background: rgba(15,23,42,0.72);
          border-color: rgba(148,163,184,0.12);
          box-shadow: 0 25px 50px rgba(0,0,0,0.25);
        }

        .hero-content h2 {
          margin: 0 0 0.75rem;
          font-size: clamp(1.9rem, 3vw, 2.6rem);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          margin: 0;
          color: var(--app-text-soft, #64748b);
          max-width: 680px;
          font-size: 1rem;
        }

        .teacher-dashboard.dark-mode .hero-subtitle {
          color: #cbd5e1;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.55rem 0.9rem;
          border-radius: 999px;
          background: rgba(37,99,235,0.1);
          color: #1d4ed8;
          font-weight: 700;
          font-size: 0.86rem;
          margin-bottom: 1rem;
        }

        .teacher-dashboard.dark-mode .hero-badge {
          background: rgba(96,165,250,0.14);
          color: #93c5fd;
        }

        .hero-panel {
          border-radius: 22px;
          padding: 1.1rem;
          background: linear-gradient(135deg, rgba(37,99,235,0.10), rgba(124,58,237,0.10));
          border: 1px solid rgba(99,102,241,0.12);
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.85rem;
        }

        .teacher-dashboard.dark-mode .hero-panel {
          background: linear-gradient(135deg, rgba(59,130,246,0.14), rgba(168,85,247,0.14));
          border-color: rgba(148,163,184,0.12);
        }

        .hero-panel-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.75rem 0.85rem;
          border-radius: 14px;
          background: rgba(255,255,255,0.7);
        }

        .teacher-dashboard.dark-mode .hero-panel-row {
          background: rgba(15,23,42,0.55);
        }

        .hero-panel-row span {
          color: var(--app-text-soft, #64748b);
          font-weight: 600;
        }

        .teacher-dashboard.dark-mode .hero-panel-row span {
          color: #cbd5e1;
        }

        .hero-panel-row strong {
          font-size: 1rem;
          font-weight: 800;
        }

        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1.25rem;
          margin-bottom: 2rem;
        }

        .glass,
        .glass-card {
          background: rgba(255,255,255,0.84);
          border: 1px solid rgba(148,163,184,0.16);
          box-shadow: 0 20px 40px rgba(15,23,42,0.06);
          backdrop-filter: blur(10px);
        }

        .teacher-dashboard.dark-mode .glass,
        .teacher-dashboard.dark-mode .glass-card {
          background: rgba(15,23,42,0.72);
          border-color: rgba(148,163,184,0.12);
          box-shadow: 0 20px 40px rgba(0,0,0,0.22);
        }

        .stat-card {
          border-radius: 22px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon-wrap {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .stat-icon-wrap.blue {
          background: rgba(37,99,235,0.12);
          color: #2563eb;
        }

        .stat-icon-wrap.violet {
          background: rgba(124,58,237,0.12);
          color: #7c3aed;
        }

        .stat-icon-wrap.emerald {
          background: rgba(16,185,129,0.12);
          color: #059669;
        }

        .teacher-dashboard.dark-mode .stat-icon-wrap.blue {
          background: rgba(59,130,246,0.18);
          color: #93c5fd;
        }

        .teacher-dashboard.dark-mode .stat-icon-wrap.violet {
          background: rgba(168,85,247,0.18);
          color: #d8b4fe;
        }

        .teacher-dashboard.dark-mode .stat-icon-wrap.emerald {
          background: rgba(16,185,129,0.18);
          color: #6ee7b7;
        }

        .stat-icon {
          font-size: 1.5rem;
        }

        .stat-card h3 {
          margin: 0;
          font-size: 2rem;
          font-weight: 800;
          line-height: 1;
        }

        .stat-card p {
          margin: 0.35rem 0 0;
          color: var(--app-text-soft, #64748b);
          font-weight: 600;
        }

        .teacher-dashboard.dark-mode .stat-card p {
          color: #cbd5e1;
        }

        .dashboard-section {
          margin-bottom: 2rem;
        }

        .section-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          margin-bottom: 1rem;
          gap: 1rem;
        }

        .section-kicker {
          display: inline-block;
          margin-bottom: 0.35rem;
          color: var(--app-accent, #2563eb);
          font-size: 0.82rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .teacher-dashboard.dark-mode .section-kicker {
          color: #93c5fd;
        }

        .section-heading h3 {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 800;
        }

        .modern-gradient {
          border-radius: 24px;
          padding: 1.5rem;
          background:
            linear-gradient(135deg, rgba(37,99,235,0.92), rgba(124,58,237,0.92)),
            linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          box-shadow: 0 24px 48px rgba(37,99,235,0.22);
        }

        .form-class-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .form-class-main {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem;
        }

        .metric-chip {
          min-width: 120px;
          padding: 0.9rem 1rem;
          border-radius: 18px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.16);
          backdrop-filter: blur(8px);
        }

        .metric-chip span {
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .metric-chip strong {
          display: block;
          margin-top: 0.35rem;
          font-size: 1.2rem;
          font-weight: 800;
        }

        .classes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .class-card {
          border-radius: 22px;
          padding: 1.2rem;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .class-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 28px 48px rgba(15,23,42,0.10);
        }

        .teacher-dashboard.dark-mode .class-card:hover {
          box-shadow: 0 28px 48px rgba(0,0,0,0.28);
        }

        .class-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.8rem;
          margin-bottom: 1rem;
        }

        .class-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.55rem 0.85rem;
          border-radius: 999px;
          background: rgba(37,99,235,0.10);
          color: #1d4ed8;
          font-weight: 800;
        }

        .teacher-dashboard.dark-mode .class-badge {
          background: rgba(96,165,250,0.12);
          color: #93c5fd;
        }

        .subject-count {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--app-text-soft, #64748b);
        }

        .teacher-dashboard.dark-mode .subject-count {
          color: #cbd5e1;
        }

        .subjects-list {
          margin: 1rem 0 1.1rem;
        }

        .subjects-list strong {
          font-size: 0.95rem;
        }

        .subjects-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
          margin-top: 0.7rem;
        }

        .subject-tag {
          background: var(--app-accent-soft, rgba(37,99,235,0.10));
          color: var(--app-accent, #2563eb);
          padding: 0.4rem 0.78rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          border: 1px solid rgba(37,99,235,0.10);
        }

        .teacher-dashboard.dark-mode .subject-tag {
          background: rgba(96,165,250,0.12);
          color: #bfdbfe;
          border-color: rgba(96,165,250,0.14);
        }

        .action-buttons {
          display: flex;
          gap: 0.7rem;
          flex-wrap: wrap;
          margin-top: 1rem;
        }

        .form-actions {
          justify-content: flex-end;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.55rem;
          padding: 0.82rem 1rem;
          border-radius: 14px;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 800;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
          box-shadow: 0 12px 20px rgba(15,23,42,0.10);
        }

        .action-btn:hover {
          transform: translateY(-2px);
          opacity: 0.96;
        }

        .action-btn.students {
          background: #10b981;
          color: white;
        }

        .action-btn.attendance {
          background: #f59e0b;
          color: white;
        }

        .action-btn.results {
          background: #2563eb;
          color: white;
        }

        .action-btn.results.secondary {
          background: rgba(255,255,255,0.18);
          color: white;
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: none;
        }

        .btn-icon,
        .btn-trail {
          font-size: 0.85rem;
        }

        @media (max-width: 991px) {
          .dashboard-hero {
            grid-template-columns: 1fr;
          }

          .dashboard-stats {
            grid-template-columns: 1fr;
          }

          .form-actions {
            justify-content: flex-start;
          }
        }

        @media (max-width: 768px) {
          .teacher-dashboard {
            padding: 1rem;
          }

          .dashboard-hero,
          .modern-gradient,
          .class-card,
          .stat-card {
            border-radius: 20px;
          }

          .form-class-card {
            flex-direction: column;
            align-items: stretch;
          }

          .form-class-main {
            flex-direction: column;
          }

          .action-buttons {
            flex-direction: column;
          }

          .action-btn {
            width: 100%;
          }

          .class-card-top {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

export default TeacherDashboard;

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { teacherAPI } from "../services/api";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaHeart,
  FaClock,
  FaBook,
  FaGraduationCap,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaArrowRight,
  FaHome,
  FaUser,
  FaCog,
  FaSignInAlt,
  FaUserPlus,
  FaClipboardList,
  FaChartBar,
  FaCalendarAlt,
  FaBus,
  FaMoneyBill,
  FaUsers,
  FaBullhorn,
  FaLayerGroup,
  FaSchool,
  FaComments,
  FaUserTie,
  FaUserShield,
  FaFileAlt,
} from "react-icons/fa";
import "./Footer.css";

function Footer() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const role = user?.role;
  const [teacherClasses, setTeacherClasses] = useState([]);

  const schoolAddress =
    "11 Bishop Shanahan Street, Fegge, Onitsha, Anambra State, Nigeria";
  const schoolPhone = "+234 903 017 5230";
  const schoolEmail = "info@faithfoundation.edu.ng";
  const officeHours = t.footer.officeHours || "Mon-Fri: 8:00 AM - 5:00 PM";

  useEffect(() => {
    let mounted = true;

    const loadTeacherClasses = async () => {
      if (!isAuthenticated || role !== "TEACHER") {
        if (mounted) setTeacherClasses([]);
        return;
      }

      try {
        const response = await teacherAPI.getMyClasses();
        if (!mounted) return;
        setTeacherClasses(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to load teacher classes for footer:", error);
        if (mounted) setTeacherClasses([]);
      }
    };

    loadTeacherClasses();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, role]);

  const normalizedTeacherClasses = useMemo(() => {
    return teacherClasses.map((cls) => ({
      ...cls,
      normalizedClassName: String(cls.className || "")
        .trim()
        .toLowerCase(),
      normalizedArm: String(cls.arm || "")
        .trim()
        .toLowerCase(),
    }));
  }, [teacherClasses]);

  const teacherFormClass = useMemo(() => {
    const flagged = normalizedTeacherClasses.find(
      (cls) => cls.isFormTeacher === true,
    );
    if (flagged) return flagged;
    return normalizedTeacherClasses.length > 0
      ? normalizedTeacherClasses[0]
      : null;
  }, [normalizedTeacherClasses]);

  const buildTeacherScopedPath = (
    basePath,
    classId = null,
    extraParams = {},
  ) => {
    const params = new URLSearchParams();
    params.set("mine", "true");

    if (classId) {
      params.set("classId", String(classId));
    }

    Object.entries(extraParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });

    return `${basePath}?${params.toString()}`;
  };

  const teacherStudentsPath = teacherFormClass
    ? buildTeacherScopedPath("/students", teacherFormClass.id)
    : "/students?mine=true";

  const teacherResultsPath = teacherFormClass
    ? buildTeacherScopedPath("/results", teacherFormClass.id)
    : "/results?mine=true";

  const teacherAttendancePath = teacherFormClass
    ? buildTeacherScopedPath("/attendance", teacherFormClass.id)
    : "/attendance?mine=true";

  const teacherSessionResultsPath = teacherFormClass
    ? buildTeacherScopedPath("/session-results", teacherFormClass.id)
    : "/session-results?mine=true";

  const publicQuickLinks = [
    { to: "/", icon: <FaHome className="link-icon" />, label: t.common.home },
    {
      to: "/about",
      icon: <FaArrowRight className="link-icon" />,
      label: t.footer.aboutUs,
    },
    {
      to: "/contact",
      icon: <FaArrowRight className="link-icon" />,
      label: t.common.contact,
    },
  ];

  const publicResourceLinks = [
    {
      to: "/login",
      icon: <FaSignInAlt className="link-icon" />,
      label: t.common.login,
    },
    {
      to: "/register",
      icon: <FaUserPlus className="link-icon" />,
      label: t.common.register,
    },
  ];

  const adminQuickLinks = [
    { to: "/", icon: <FaHome className="link-icon" />, label: t.common.home },
    {
      to: "/dashboard",
      icon: <FaSchool className="link-icon" />,
      label: t.common.dashboard,
    },
    {
      to: "/profile",
      icon: <FaUser className="link-icon" />,
      label: t.common.profile,
    },
    {
      to: "/settings",
      icon: <FaCog className="link-icon" />,
      label: t.common.settings,
    },
    {
      to: "/about",
      icon: <FaArrowRight className="link-icon" />,
      label: t.footer.aboutUs,
    },
    {
      to: "/contact",
      icon: <FaArrowRight className="link-icon" />,
      label: t.common.contact,
    },
    {
      to: "/support",
      icon: <FaComments className="link-icon" />,
      label: t.navbar.support || "Support Center",
    },
  ];

  const adminAcademicLinks = [
    {
      to: "/students",
      icon: <FaUserGraduate className="link-icon" />,
      label: t.navbar.students || "Students",
    },
    {
      to: "/teachers",
      icon: <FaChalkboardTeacher className="link-icon" />,
      label: t.navbar.teachers || "Teachers",
    },
    {
      to: "/parents",
      icon: <FaUserTie className="link-icon" />,
      label: t.navbar.parents || "Parents",
    },
    {
      to: "/users",
      icon: <FaUserShield className="link-icon" />,
      label: t.navbar.users || "Users",
    },
    {
      to: "/classes",
      icon: <FaLayerGroup className="link-icon" />,
      label: t.navbar.classes || "Classes",
    },
    {
      to: "/subjects",
      icon: <FaBook className="link-icon" />,
      label: t.navbar.subjects || "Subjects",
    },
    {
      to: "/results",
      icon: <FaChartBar className="link-icon" />,
      label: t.navbar.results || "Results",
    },
    {
      to: "/session-results",
      icon: <FaGraduationCap className="link-icon" />,
      label: t.navbar.sessionResults || "Session Results",
    },
  ];

  const adminResourceLinks = [
    {
      to: "/fees",
      icon: <FaMoneyBill className="link-icon" />,
      label: t.footer.feeManagement || "Fee Management",
    },
    {
      to: "/announcements",
      icon: <FaBullhorn className="link-icon" />,
      label: t.navbar.announcements || "Announcements",
    },
    {
      to: "/events",
      icon: <FaCalendarAlt className="link-icon" />,
      label: t.navbar.events || "Events",
    },
    {
      to: "/reports",
      icon: <FaFileAlt className="link-icon" />,
      label: t.navbar.reports || "Reports",
    },
    {
      to: "/email-queue",
      icon: <FaEnvelope className="link-icon" />,
      label: "Email Queue",
    },
    {
      to: "/library",
      icon: <FaClipboardList className="link-icon" />,
      label: "Library",
    },
    {
      to: "/transport/routes",
      icon: <FaBus className="link-icon" />,
      label: t.navbar.routes || "Routes",
    },
  ];

  const teacherQuickLinks = [
    { to: "/", icon: <FaHome className="link-icon" />, label: t.common.home },
    {
      to: "/teacher-dashboard",
      icon: <FaChalkboardTeacher className="link-icon" />,
      label: t.common.dashboard,
    },
    {
      to: "/profile",
      icon: <FaUser className="link-icon" />,
      label: t.common.profile,
    },
    {
      to: "/settings",
      icon: <FaCog className="link-icon" />,
      label: t.common.settings,
    },
    {
      to: "/about",
      icon: <FaArrowRight className="link-icon" />,
      label: t.footer.aboutUs,
    },
    {
      to: "/contact",
      icon: <FaArrowRight className="link-icon" />,
      label: t.common.contact,
    },
    {
      to: "/support",
      icon: <FaComments className="link-icon" />,
      label: t.navbar.support || "Support Center",
    },
  ];

  const teacherAcademicLinks = [
    {
      to: teacherStudentsPath,
      icon: <FaUsers className="link-icon" />,
      label: t.navbar.myStudents || "My Students",
    },
    {
      to: teacherResultsPath,
      icon: <FaChartBar className="link-icon" />,
      label: t.navbar.results || "Results",
    },
    {
      to: teacherAttendancePath,
      icon: <FaClipboardList className="link-icon" />,
      label: t.navbar.attendance || "Attendance",
    },
    {
      to: teacherSessionResultsPath,
      icon: <FaGraduationCap className="link-icon" />,
      label: t.navbar.sessionResults || "Session Results",
    },
    {
      to: "/timetable",
      icon: <FaCalendarAlt className="link-icon" />,
      label: t.navbar.myTimetable || "My Timetable",
    },
  ];

  const teacherResourceLinks = [
    {
      to: "/teacher-dashboard",
      icon: <FaChalkboardTeacher className="link-icon" />,
      label: t.footer.teacherPortal || "Teacher Portal",
    },
  ];

  const parentQuickLinks = [
    { to: "/", icon: <FaHome className="link-icon" />, label: t.common.home },
    {
      to: "/parent-dashboard",
      icon: <FaUsers className="link-icon" />,
      label: t.common.dashboard,
    },
    {
      to: "/parent/profile",
      icon: <FaUser className="link-icon" />,
      label: t.common.profile,
    },
    {
      to: "/settings",
      icon: <FaCog className="link-icon" />,
      label: t.common.settings,
    },
    {
      to: "/about",
      icon: <FaArrowRight className="link-icon" />,
      label: t.footer.aboutUs,
    },
    {
      to: "/contact",
      icon: <FaArrowRight className="link-icon" />,
      label: t.common.contact,
    },
    {
      to: "/support",
      icon: <FaComments className="link-icon" />,
      label: t.navbar.support || "Support Center",
    },
  ];

  const parentAcademicLinks = [
    {
      to: "/results",
      icon: <FaChartBar className="link-icon" />,
      label: t.navbar.wardResults || "Ward Results",
    },
    {
      to: "/attendance",
      icon: <FaClipboardList className="link-icon" />,
      label: t.navbar.wardAttendance || "Ward Attendance",
    },
    {
      to: "/session-results",
      icon: <FaGraduationCap className="link-icon" />,
      label: t.navbar.sessionResults || "Session Results",
    },
    {
      to: "/timetable",
      icon: <FaCalendarAlt className="link-icon" />,
      label: t.navbar.wardTimetable || "Ward Timetable",
    },
  ];

  const parentResourceLinks = [
    {
      to: "/fees",
      icon: <FaMoneyBill className="link-icon" />,
      label: t.navbar.wardFees || "Ward Fees",
    },
    {
      to: "/transport/tracking",
      icon: <FaBus className="link-icon" />,
      label: t.footer.busTracking || "Bus Tracking",
    },
  ];

  const studentQuickLinks = [
    { to: "/", icon: <FaHome className="link-icon" />, label: t.common.home },
    {
      to: "/student-dashboard",
      icon: <FaUserGraduate className="link-icon" />,
      label: t.common.dashboard,
    },
    {
      to: "/profile",
      icon: <FaUser className="link-icon" />,
      label: t.common.profile,
    },
    {
      to: "/settings",
      icon: <FaCog className="link-icon" />,
      label: t.common.settings,
    },
    {
      to: "/about",
      icon: <FaArrowRight className="link-icon" />,
      label: t.footer.aboutUs,
    },
    {
      to: "/contact",
      icon: <FaArrowRight className="link-icon" />,
      label: t.common.contact,
    },
    {
      to: "/support",
      icon: <FaComments className="link-icon" />,
      label: t.navbar.support || "Support Center",
    },
  ];

  const studentAcademicLinks = [
    {
      to: "/results",
      icon: <FaChartBar className="link-icon" />,
      label: t.navbar.myResults || "My Results",
    },
    {
      to: "/attendance",
      icon: <FaClipboardList className="link-icon" />,
      label: t.navbar.myAttendance || "My Attendance",
    },
    {
      to: "/session-results",
      icon: <FaGraduationCap className="link-icon" />,
      label: t.navbar.sessionResults || "Session Results",
    },
    {
      to: "/timetable",
      icon: <FaCalendarAlt className="link-icon" />,
      label: t.navbar.myTimetable || "My Timetable",
    },
  ];

  const studentResourceLinks = [
    {
      to: "/fees",
      icon: <FaMoneyBill className="link-icon" />,
      label: t.navbar.myFees || "My Fees",
    },
    {
      to: "/transport/tracking",
      icon: <FaBus className="link-icon" />,
      label: t.footer.busTracking || "Bus Tracking",
    },
  ];

  const getQuickLinks = () => {
    if (!isAuthenticated) return publicQuickLinks;
    if (role === "ADMIN") return adminQuickLinks;
    if (role === "TEACHER") return teacherQuickLinks;
    if (role === "PARENT") return parentQuickLinks;
    if (role === "STUDENT") return studentQuickLinks;
    return publicQuickLinks;
  };

  const getAcademicLinks = () => {
    if (!isAuthenticated) {
      return [
        {
          to: "/",
          icon: <FaHome className="link-icon" />,
          label: t.common.home,
        },
        {
          to: "/about",
          icon: <FaSchool className="link-icon" />,
          label: t.footer.aboutUs,
        },
        {
          to: "/contact",
          icon: <FaArrowRight className="link-icon" />,
          label: t.common.contact,
        },
      ];
    }

    if (role === "ADMIN") return adminAcademicLinks;
    if (role === "TEACHER") return teacherAcademicLinks;
    if (role === "PARENT") return parentAcademicLinks;
    if (role === "STUDENT") return studentAcademicLinks;
    return [];
  };

  const getResourceLinks = () => {
    if (!isAuthenticated) return publicResourceLinks;
    if (role === "ADMIN") return adminResourceLinks;
    if (role === "TEACHER") return teacherResourceLinks;
    if (role === "PARENT") return parentResourceLinks;
    if (role === "STUDENT") return studentResourceLinks;
    return [];
  };

  const quickLinks = getQuickLinks();
  const academicLinks = getAcademicLinks();
  const resourceLinks = getResourceLinks();

  const roleSectionTitle = () => {
    if (!isAuthenticated) return t.footer.resources;
    if (role === "ADMIN") return t.footer.resources;
    if (role === "TEACHER") return t.footer.teacherPortal || "Teacher Portal";
    if (role === "PARENT") return t.footer.parentPortal || "Parent Portal";
    if (role === "STUDENT") return t.footer.studentPortal || "Student Portal";
    return t.footer.resources;
  };

  return (
    <footer className="footer-modern">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <h5>{t.footer.schoolName}</h5>
            <p className="footer-description">{t.footer.slogan}</p>
            <p className="footer-text">{t.footer.description}</p>

            <div className="social-links">
              <a href="#" className="social-link" aria-label="Facebook">
                <FaFacebook size={14} />
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <FaTwitter size={14} />
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <FaInstagram size={14} />
              </a>
              <a href="#" className="social-link" aria-label="YouTube">
                <FaYoutube size={14} />
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h5>{t.footer.quickLinks}</h5>
            <ul className="footer-links">
              {quickLinks.map((item, index) => (
                <li key={index}>
                  <Link to={item.to}>
                    {item.icon} {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h5>{t.footer.academics}</h5>
            <ul className="footer-links">
              {academicLinks.map((item, index) => (
                <li key={index}>
                  <Link to={item.to}>
                    {item.icon} {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h5>{roleSectionTitle()}</h5>
            <ul className="footer-links">
              {resourceLinks.map((item, index) => (
                <li key={index}>
                  <Link to={item.to}>
                    {item.icon} {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h5>{t.footer.contact || "Contact"}</h5>
            <ul className="contact-info">
              <li>
                <FaMapMarkerAlt size={12} className="contact-icon" />
                <span>{schoolAddress}</span>
              </li>
              <li>
                <FaPhone size={12} className="contact-icon" />
                <span>{schoolPhone}</span>
              </li>
              <li>
                <FaEnvelope size={12} className="contact-icon" />
                <span>{schoolEmail}</span>
              </li>
              <li>
                <FaClock size={12} className="contact-icon" />
                <span>{officeHours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              &copy; {currentYear}{" "}
              {t.footer.schoolName || "Faith Foundation International School"}.
              {" "}
              {t.footer.rightsReserved || t.footer.allRightsReserved}
            </p>

            <div className="footer-legal">
              <Link to="/privacy-policy">
                {t.footer.privacyPolicy || "Privacy Policy"}
              </Link>
              <span className="separator">|</span>
              <Link to="/terms-of-service">
                {t.footer.termsOfService || "Terms of Service"}
              </Link>
              <span className="separator">|</span>
              <Link to="/faq">{t.footer.faq || "FAQ"}</Link>
            </div>

            <p className="credit">
              {t.footer.madeWith || "Made with"}{" "}
              <FaHeart size={10} className="heart" />{" "}
              {t.footer.inNigeria || t.footer.forEducation || "in Nigeria"}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
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
} from "react-icons/fa";
import "./Footer.css";

function Footer() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const role = user?.role;

  const getHomePath = () => {
    if (!isAuthenticated) return "/";
    if (role === "TEACHER") return "/teacher-dashboard";
    if (role === "PARENT") return "/parent-dashboard";
    if (role === "STUDENT") return "/student-dashboard";
    if (role === "ADMIN") return "/dashboard";
    return "/";
  };

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
  ];

  const adminAcademicLinks = [
    {
      to: "/students",
      icon: <FaUserGraduate className="link-icon" />,
      label: "Students",
    },
    {
      to: "/teachers",
      icon: <FaChalkboardTeacher className="link-icon" />,
      label: "Teachers",
    },
    {
      to: "/classes",
      icon: <FaLayerGroup className="link-icon" />,
      label: "Classes",
    },
    {
      to: "/subjects",
      icon: <FaBook className="link-icon" />,
      label: "Subjects",
    },
    {
      to: "/results",
      icon: <FaChartBar className="link-icon" />,
      label: "Results",
    },
    {
      to: "/session-results",
      icon: <FaGraduationCap className="link-icon" />,
      label: t.navbar.sessionResults || "Session Results",
    },
    {
      to: "/timetable",
      icon: <FaCalendarAlt className="link-icon" />,
      label: "Timetable",
    },
  ];

  const adminResourceLinks = [
    {
      to: "/users",
      icon: <FaUsers className="link-icon" />,
      label: t.navbar.users || "Users",
    },
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
  ];

  const teacherAcademicLinks = [
    {
      to: "/students",
      icon: <FaUsers className="link-icon" />,
      label: t.navbar.myStudents || "My Students",
    },
    {
      to: "/results",
      icon: <FaChartBar className="link-icon" />,
      label: t.navbar.results || "Results",
    },
    {
      to: "/attendance",
      icon: <FaClipboardList className="link-icon" />,
      label: t.navbar.attendance || "Attendance",
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

  const teacherResourceLinks = [
    {
      to: getHomePath(),
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
            <h5>{t.footer.contact}</h5>
            <ul className="contact-info">
              <li>
                <FaMapMarkerAlt size={12} className="contact-icon" />
                <span>
                  11 Bishop Shanahan Street, Fegge, Onitsha, Anambra State,
                  Nigeria
                </span>
              </li>
              <li>
                <FaPhone size={12} className="contact-icon" />
                <span>+234 903 017 5230</span>
              </li>
              <li>
                <FaEnvelope size={12} className="contact-icon" />
                <span>info@faithfoundation.edu.ng</span>
              </li>
              <li>
                <FaClock size={12} className="contact-icon" />
                <span>{t.footer.officeHours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              &copy; {currentYear} Faith Foundation International School.{" "}
              {t.footer.rightsReserved}
            </p>
            <div className="footer-legal">
              <Link to="/privacy-policy">{t.footer.privacyPolicy}</Link>
              <span className="separator">|</span>
              <Link to="/terms-of-service">{t.footer.termsOfService}</Link>
              <span className="separator">|</span>
              <Link to="/faq">{t.footer.faq}</Link>
            </div>
            <p className="credit">
              {t.footer.madeWith} <FaHeart size={10} className="heart" />{" "}
              {t.footer.inNigeria}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

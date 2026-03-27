import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaBars,
  FaTimes,
  FaCalendarAlt,
  FaGraduationCap,
  FaMoneyBill,
  FaChevronDown,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaSchool,
  FaBookOpen,
  FaUserPlus,
  FaSignInAlt,
  FaUserShield,
  FaUserTie,
  FaChalkboardTeacher,
  FaBus,
  FaClipboardCheck,
  FaPlusCircle,
  FaArrowUp,
  FaChartBar,
  FaLayerGroup,
  FaList,
  FaClock,
  FaBook,
  FaUserGraduate,
  FaBullhorn,
  FaEnvelope,
  FaComments,
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { teacherAPI } from "../services/api";
import "./Navbar.css";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [teacherClasses, setTeacherClasses] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();

  const role = user?.role;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setOpenDropdown(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const loadTeacherClasses = async () => {
      if (!isAuthenticated || role !== "TEACHER") {
        setTeacherClasses([]);
        return;
      }

      try {
        const response = await teacherAPI.getMyClasses();
        setTeacherClasses(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error loading teacher classes for navbar:", error);
        setTeacherClasses([]);
      }
    };

    loadTeacherClasses();
  }, [isAuthenticated, role]);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
    if (isOpen) setOpenDropdown(null);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setOpenDropdown(null);
  };

  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const isPathActive = (path) => {
    if (!path) return false;
    return location.pathname.startsWith(path);
  };

  const isDropdownActive = (items) =>
    items.some((item) => {
      if (item.activePath) return isPathActive(item.activePath);
      return isPathActive(item.path);
    });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getTeacherScopedPath = (basePath) => {
    const firstClass = teacherClasses[0];
    if (!firstClass?.id) return basePath;
    return `${basePath}?classId=${firstClass.id}&mine=true`;
  };

  const publicNavItems = [
    { type: "link", path: "/", icon: <FaHome />, label: t.common.home },
    { type: "link", path: "/about", icon: <FaBook />, label: t.common.about },
    {
      type: "link",
      path: "/contact",
      icon: <FaEnvelope />,
      label: t.common.contact,
    },
  ];

  const adminNavItems = [
    {
      type: "link",
      path: "/dashboard",
      icon: <FaHome />,
      label: t.common.dashboard,
    },
    {
      type: "dropdown",
      label: t.navbar.people,
      icon: <FaUsers />,
      name: "people",
      items: [
        {
          path: "/students",
          label: t.navbar.students,
          icon: <FaUserGraduate />,
        },
        {
          path: "/students/new",
          label: t.navbar.registerStudent,
          icon: <FaPlusCircle />,
        },
        {
          path: "/students/promotion",
          label: t.navbar.promotion,
          icon: <FaArrowUp />,
        },
        {
          path: "/teachers",
          label: t.navbar.teachers,
          icon: <FaChalkboardTeacher />,
        },
        {
          path: "/teachers/new",
          label: t.navbar.addTeacher,
          icon: <FaPlusCircle />,
        },
        { path: "/parents", label: t.navbar.parents, icon: <FaUserTie /> },
        {
          path: "/parents/register",
          label: t.navbar.registerParent,
          icon: <FaPlusCircle />,
        },
      ],
    },
    {
      type: "dropdown",
      label: t.navbar.academics,
      icon: <FaBookOpen />,
      name: "academics",
      items: [
        { path: "/classes", label: t.navbar.classes, icon: <FaLayerGroup /> },
        {
          path: "/classes/manage",
          label: t.navbar.manageClasses,
          icon: <FaList />,
        },
        { path: "/subjects", label: t.navbar.subjects, icon: <FaBookOpen /> },
        {
          path: "/timetable",
          label: t.navbar.timetable,
          icon: <FaCalendarAlt />,
        },
        { path: "/results", label: t.navbar.results, icon: <FaChartBar /> },
        {
          path: "/attendance",
          label: t.navbar.attendance,
          icon: <FaClipboardCheck />,
        },
        {
          path: "/session-results",
          label: t.navbar.sessionResults,
          icon: <FaGraduationCap />,
        },
        { path: "/sessions", label: t.navbar.sessions, icon: <FaClock /> },
      ],
    },
    {
      type: "dropdown",
      label: t.navbar.finance,
      icon: <FaMoneyBill />,
      name: "finance",
      items: [{ path: "/fees", label: t.navbar.fees, icon: <FaMoneyBill /> }],
    },
    {
      type: "dropdown",
      label: t.navbar.operations,
      icon: <FaBus />,
      name: "operations",
      items: [
        {
          path: "/announcements",
          label: t.navbar.announcements,
          icon: <FaBullhorn />,
        },
        { path: "/events", label: t.navbar.events, icon: <FaCalendarAlt /> },
        { path: "/transport/routes", label: t.navbar.routes, icon: <FaBus /> },
        {
          path: "/email-queue",
          label: "Email Queue",
          icon: <FaEnvelope />,
        },
        { path: "/library", label: t.navbar.library, icon: <FaBook /> },
      ],
    },
    {
      type: "link",
      path: "/users",
      icon: <FaUserShield />,
      label: t.navbar.users,
    },
    {
      type: "link",
      path: "/support",
      icon: <FaComments />,
      label: t.navbar.support || "Support",
    },
  ];

  const teacherNavItems = [
    {
      type: "link",
      path: "/teacher-dashboard",
      icon: <FaHome />,
      label: t.common.dashboard,
    },
    {
      type: "dropdown",
      label: t.navbar.academics || "Academics",
      icon: <FaBookOpen />,
      name: "teacher-academics",
      items: [
        {
          path: getTeacherScopedPath("/students"),
          activePath: "/students",
          icon: <FaUsers />,
          label: t.navbar.myStudents,
        },
        {
          path: getTeacherScopedPath("/results"),
          activePath: "/results",
          icon: <FaChartBar />,
          label: t.navbar.results,
        },
        {
          path: getTeacherScopedPath("/attendance"),
          activePath: "/attendance",
          icon: <FaClipboardCheck />,
          label: t.navbar.attendance,
        },
        {
          path: getTeacherScopedPath("/session-results"),
          activePath: "/session-results",
          icon: <FaGraduationCap />,
          label: t.navbar.sessionResults,
        },
        {
          path: "/timetable",
          activePath: "/timetable",
          icon: <FaCalendarAlt />,
          label: t.navbar.myTimetable,
        },
      ],
    },
    {
      type: "link",
      path: "/support",
      icon: <FaComments />,
      label: t.navbar.support || "Support",
    },
  ];

  const parentNavItems = [
    {
      type: "link",
      path: "/parent-dashboard",
      icon: <FaHome />,
      label: t.common.dashboard,
    },
    {
      type: "dropdown",
      label: t.navbar.wards || "Wards",
      icon: <FaUsers />,
      name: "parent-wards",
      items: [
        {
          path: "/results",
          icon: <FaChartBar />,
          label: t.navbar.wardResults,
        },
        {
          path: "/attendance",
          icon: <FaClipboardCheck />,
          label: t.navbar.wardAttendance,
        },
        {
          path: "/session-results",
          icon: <FaGraduationCap />,
          label: t.navbar.sessionResults,
        },
        {
          path: "/timetable",
          icon: <FaCalendarAlt />,
          label: t.navbar.wardTimetable,
        },
        {
          path: "/fees",
          icon: <FaMoneyBill />,
          label: t.navbar.wardFees,
        },
      ],
    },
    {
      type: "dropdown",
      label: t.navbar.services || "Services",
      icon: <FaBus />,
      name: "parent-services",
      items: [
        {
          path: "/transport/tracking",
          icon: <FaBus />,
          label: t.navbar.busTracking,
        },
        {
          path: "/support",
          icon: <FaComments />,
          label: t.navbar.support || "Support",
        },
      ],
    },
  ];

  const studentNavItems = [
    {
      type: "link",
      path: "/student-dashboard",
      icon: <FaHome />,
      label: t.common.dashboard,
    },
    {
      type: "dropdown",
      label: t.navbar.academics || "Academics",
      icon: <FaBookOpen />,
      name: "student-academics",
      items: [
        {
          path: "/results",
          icon: <FaChartBar />,
          label: t.navbar.myResults,
        },
        {
          path: "/attendance",
          icon: <FaClipboardCheck />,
          label: t.navbar.myAttendance,
        },
        {
          path: "/session-results",
          icon: <FaGraduationCap />,
          label: t.navbar.sessionResults,
        },
        {
          path: "/timetable",
          icon: <FaCalendarAlt />,
          label: t.navbar.myTimetable,
        },
      ],
    },
    {
      type: "dropdown",
      label: t.navbar.services || "Services",
      icon: <FaBus />,
      name: "student-services",
      items: [
        {
          path: "/fees",
          icon: <FaMoneyBill />,
          label: t.navbar.myFees,
        },
        {
          path: "/transport/tracking",
          icon: <FaBus />,
          label: t.navbar.busTracking,
        },
        {
          path: "/support",
          icon: <FaComments />,
          label: t.navbar.support || "Support",
        },
      ],
    },
  ];

  let navItems = publicNavItems;
  if (isAuthenticated) {
    if (role === "ADMIN") navItems = adminNavItems;
    else if (role === "TEACHER") navItems = teacherNavItems;
    else if (role === "PARENT") navItems = parentNavItems;
    else if (role === "STUDENT") navItems = studentNavItems;
  }

  const getHomePath = () => {
    if (!isAuthenticated) return "/";
    if (role === "TEACHER") return "/teacher-dashboard";
    if (role === "PARENT") return "/parent-dashboard";
    if (role === "STUDENT") return "/student-dashboard";
    if (role === "ADMIN") return "/dashboard";
    return "/";
  };

  const getPortalTitle = () => {
    if (role === "ADMIN") return t.navbar.adminPortal;
    if (role === "TEACHER") return t.navbar.teacherPortal;
    if (role === "PARENT") return t.navbar.parentPortal;
    if (role === "STUDENT") return t.navbar.studentPortal;
    return t.navbar.ffis;
  };

  const getDashboardPath = () => {
    if (role === "TEACHER") return "/teacher-dashboard";
    if (role === "PARENT") return "/parent-dashboard";
    if (role === "STUDENT") return "/student-dashboard";
    if (role === "ADMIN") return "/dashboard";
    return "/";
  };

  return (
    <nav
      className={`navbar navbar-expand-lg navbar-dark navbar-school ${scrolled ? "scrolled" : ""}`}
    >
      <div className="container-fluid">
        <Link
          className="navbar-brand school-logo"
          to={getHomePath()}
          onClick={closeMenu}
        >
          {role === "ADMIN" && <FaSchool className="me-2" />}
          {role === "TEACHER" && <FaChalkboardTeacher className="me-2" />}
          {role === "PARENT" && <FaUserTie className="me-2" />}
          {role === "STUDENT" && <FaUserGraduate className="me-2" />}
          {!isAuthenticated && <FaSchool className="me-2" />}
          <span className="brand-text">{getPortalTitle()}</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleMenu}
          aria-controls="navbarNav"
          aria-expanded={isOpen}
          aria-label={t.navbar.toggleNavigation}
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div
          className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}
          id="navbarNav"
        >
          <ul className="navbar-nav ms-auto">
            {navItems.map((item, index) => (
              <li key={index} className="nav-item">
                {item.type === "dropdown" ? (
                  <div className="nav-dropdown">
                    <button
                      className={`nav-link dropdown-toggle-btn ${
                        isDropdownActive(item.items) ? "active" : ""
                      }`}
                      onClick={() => toggleDropdown(item.name)}
                      aria-expanded={openDropdown === item.name}
                      type="button"
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-label">{item.label}</span>
                      <FaChevronDown
                        className={`dropdown-arrow ${openDropdown === item.name ? "rotated" : ""}`}
                      />
                    </button>

                    <div
                      className={`dropdown-menu-custom ${openDropdown === item.name ? "show" : ""}`}
                    >
                      {item.items.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          className={`dropdown-item-custom ${
                            isPathActive(subItem.activePath || subItem.path)
                              ? "active"
                              : ""
                          }`}
                          to={subItem.path}
                          onClick={closeMenu}
                        >
                          <span className="dropdown-icon">{subItem.icon}</span>
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    className={`nav-link ${
                      isPathActive(item.activePath || item.path) ? "active" : ""
                    }`}
                    to={item.path}
                    onClick={closeMenu}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {!isAuthenticated && (
            <div className="auth-buttons ms-lg-3">
              <Link to="/login" className="btn btn-outline-light me-2">
                <FaSignInAlt className="me-1" /> {t.common.login}
              </Link>
              <Link to="/register" className="btn btn-warning">
                <FaUserPlus className="me-1" /> {t.common.register}
              </Link>
            </div>
          )}

          {isAuthenticated && (
            <div className="user-menu ms-lg-3">
              <div className="nav-dropdown">
                <button
                  className="user-menu-btn"
                  onClick={() => toggleDropdown("user")}
                  aria-expanded={openDropdown === "user"}
                  type="button"
                >
                  <div className="user-avatar">
                    {role === "ADMIN" && <FaUserShield />}
                    {role === "TEACHER" && <FaChalkboardTeacher />}
                    {role === "PARENT" && <FaUserTie />}
                    {role === "STUDENT" && <FaUserGraduate />}
                  </div>
                  <span className="user-name d-none d-lg-inline">
                    {user?.firstName || t.navbar.user}
                  </span>
                  <FaChevronDown
                    className={`user-arrow ${openDropdown === "user" ? "rotated" : ""}`}
                  />
                </button>

                <div
                  className={`dropdown-menu-custom user-dropdown-menu ${openDropdown === "user" ? "show" : ""}`}
                >
                  <Link
                    to={getDashboardPath()}
                    className="dropdown-item-custom"
                    onClick={closeMenu}
                  >
                    <FaUser /> {t.common.dashboard}
                  </Link>
                  <Link
                    to="/profile"
                    className="dropdown-item-custom"
                    onClick={closeMenu}
                  >
                    <FaUser /> {t.common.profile}
                  </Link>
                  <Link
                    to="/settings"
                    className="dropdown-item-custom"
                    onClick={closeMenu}
                  >
                    <FaCog /> {t.common.settings}
                  </Link>
                  <div className="dropdown-divider-custom"></div>
                  <button
                    type="button"
                    className="dropdown-item-custom"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt /> {t.common.logout}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

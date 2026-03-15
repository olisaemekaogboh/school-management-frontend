import React, { useState, useEffect } from "react";
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
  FaRoute,
  FaBook,
  FaUserGraduate,
  FaBullhorn,
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
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

  const isActive = (path) => location.pathname === path;

  const isDropdownActive = (items) =>
    items.some((item) => location.pathname.startsWith(item.path));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getTeacherScopedPath = (basePath) => {
    const firstClass = teacherClasses[0];

    if (!firstClass?.id) {
      return basePath;
    }

    return `${basePath}?classId=${firstClass.id}&mine=true`;
  };

  const publicNavItems = [
    { type: "link", path: "/login", icon: <FaSignInAlt />, label: "Login" },
    {
      type: "link",
      path: "/register",
      icon: <FaUserPlus />,
      label: "Register",
    },
  ];

  const adminNavItems = [
    { type: "link", path: "/", icon: <FaHome />, label: "Dashboard" },

    {
      type: "dropdown",
      label: "People",
      icon: <FaUsers />,
      name: "people",
      items: [
        { path: "/students", label: "Students", icon: <FaUserGraduate /> },
        {
          path: "/students/new",
          label: "Register Student",
          icon: <FaPlusCircle />,
        },
        {
          path: "/students/promotion",
          label: "Promotion",
          icon: <FaArrowUp />,
        },
        { path: "/teachers", label: "Teachers", icon: <FaChalkboardTeacher /> },
        {
          path: "/teachers/new",
          label: "Add Teacher",
          icon: <FaPlusCircle />,
        },
        { path: "/parents", label: "Parents", icon: <FaUserTie /> },
        {
          path: "/parents/register",
          label: "Register Parent",
          icon: <FaPlusCircle />,
        },
      ],
    },

    {
      type: "dropdown",
      label: "Academics",
      icon: <FaBookOpen />,
      name: "academics",
      items: [
        { path: "/classes", label: "Classes", icon: <FaLayerGroup /> },
        {
          path: "/classes/manage",
          label: "Manage Classes",
          icon: <FaList />,
        },
        { path: "/subjects", label: "Subjects", icon: <FaBookOpen /> },
        { path: "/timetable", label: "Timetable", icon: <FaCalendarAlt /> },
        { path: "/results", label: "Results", icon: <FaChartBar /> },
        {
          path: "/attendance",
          label: "Attendance",
          icon: <FaClipboardCheck />,
        },
        {
          path: "/session-results",
          label: "Session Results",
          icon: <FaGraduationCap />,
        },
        { path: "/sessions", label: "Sessions", icon: <FaClock /> },
      ],
    },

    {
      type: "dropdown",
      label: "Finance",
      icon: <FaMoneyBill />,
      name: "finance",
      items: [
        { path: "/fees", label: "Fees", icon: <FaMoneyBill /> },
        {
          path: "/fees/payments",
          label: "Payments",
          icon: <FaMoneyBill />,
        },
        {
          path: "/fees/defaulters",
          label: "Defaulters",
          icon: <FaMoneyBill />,
        },
      ],
    },

    {
      type: "dropdown",
      label: "Operations",
      icon: <FaBus />,
      name: "operations",
      items: [
        {
          path: "/announcements",
          label: "Announcements",
          icon: <FaBullhorn />,
        },
        { path: "/transport", label: "Transport", icon: <FaBus /> },
        { path: "/transport/routes", label: "Routes", icon: <FaRoute /> },
        { path: "/library", label: "Library", icon: <FaBook /> },
      ],
    },

    { type: "link", path: "/users", icon: <FaUserShield />, label: "Users" },
  ];

  const teacherNavItems = [
    {
      type: "link",
      path: "/teacher-dashboard",
      icon: <FaHome />,
      label: "Dashboard",
    },
    {
      type: "link",
      path: getTeacherScopedPath("/students"),
      activePath: "/students",
      icon: <FaUsers />,
      label: "My Students",
    },
    {
      type: "link",
      path: getTeacherScopedPath("/results"),
      activePath: "/results",
      icon: <FaChartBar />,
      label: "Results",
    },
    {
      type: "link",
      path: getTeacherScopedPath("/attendance"),
      activePath: "/attendance",
      icon: <FaClipboardCheck />,
      label: "Attendance",
    },
    {
      type: "link",
      path: "/session-results",
      icon: <FaGraduationCap />,
      label: "Session Results",
    },
    {
      type: "link",
      path: "/timetable",
      icon: <FaCalendarAlt />,
      label: "Timetable",
    },
  ];

  const parentNavItems = [
    {
      type: "link",
      path: "/parent-dashboard",
      icon: <FaHome />,
      label: "Dashboard",
    },
    {
      type: "link",
      path: "/fees",
      icon: <FaMoneyBill />,
      label: "Ward Fees",
    },
    {
      type: "link",
      path: "/results",
      icon: <FaChartBar />,
      label: "Ward Results",
    },
    {
      type: "link",
      path: "/session-results",
      icon: <FaGraduationCap />,
      label: "Session Results",
    },
    {
      type: "link",
      path: "/transport/tracking",
      icon: <FaBus />,
      label: "Bus Tracking",
    },
  ];

  const studentNavItems = [
    {
      type: "link",
      path: "/student-dashboard",
      icon: <FaHome />,
      label: "Dashboard",
    },
    {
      type: "link",
      path: "/results",
      icon: <FaChartBar />,
      label: "My Results",
    },
    {
      type: "link",
      path: "/session-results",
      icon: <FaGraduationCap />,
      label: "Session Results",
    },
    {
      type: "link",
      path: "/fees",
      icon: <FaMoneyBill />,
      label: "My Fees",
    },
    {
      type: "link",
      path: "/timetable",
      icon: <FaCalendarAlt />,
      label: "Timetable",
    },
    {
      type: "link",
      path: "/transport/tracking",
      icon: <FaBus />,
      label: "Bus Tracking",
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
    return "/";
  };

  return (
    <nav
      className={`navbar navbar-expand-lg navbar-dark navbar-school ${
        scrolled ? "scrolled" : ""
      }`}
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

          <span className="brand-text">
            {role === "ADMIN" && "Admin Portal"}
            {role === "TEACHER" && "Teacher Portal"}
            {role === "PARENT" && "Parent Portal"}
            {role === "STUDENT" && "Student Portal"}
            {!isAuthenticated && "FFIS"}
          </span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleMenu}
          aria-controls="navbarNav"
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
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
                      className={`nav-link dropdown-toggle ${
                        isDropdownActive(item.items) ? "active" : ""
                      }`}
                      onClick={() => toggleDropdown(item.name)}
                      aria-expanded={openDropdown === item.name}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-label">{item.label}</span>
                      <FaChevronDown
                        className={`dropdown-arrow ${
                          openDropdown === item.name ? "rotated" : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`dropdown-menu ${
                        openDropdown === item.name ? "show" : ""
                      }`}
                    >
                      {item.items.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          className={`dropdown-item ${
                            isActive(subItem.path) ? "active" : ""
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
                      isActive(item.activePath || item.path) ? "active" : ""
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
                <FaSignInAlt className="me-1" /> Login
              </Link>
              <Link to="/register" className="btn btn-warning">
                <FaUserPlus className="me-1" /> Register
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
                >
                  <div className="user-avatar">
                    {role === "ADMIN" && <FaUserShield />}
                    {role === "TEACHER" && <FaChalkboardTeacher />}
                    {role === "PARENT" && <FaUserTie />}
                    {role === "STUDENT" && <FaUserGraduate />}
                  </div>
                  <span className="user-name d-none d-lg-inline">
                    {user?.firstName || "User"}
                  </span>
                  <FaChevronDown
                    className={`user-arrow ${
                      openDropdown === "user" ? "rotated" : ""
                    }`}
                  />
                </button>
                <div
                  className={`dropdown-menu user-dropdown-menu ${
                    openDropdown === "user" ? "show" : ""
                  }`}
                >
                  <Link
                    to={
                      role === "TEACHER"
                        ? "/teacher-dashboard"
                        : role === "PARENT"
                          ? "/parent-dashboard"
                          : role === "STUDENT"
                            ? "/student-dashboard"
                            : "/"
                    }
                    className="dropdown-item"
                    onClick={closeMenu}
                  >
                    <FaUser /> Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={closeMenu}
                  >
                    <FaUser /> Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="dropdown-item"
                    onClick={closeMenu}
                  >
                    <FaCog /> Settings
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item text-danger"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt /> Logout
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

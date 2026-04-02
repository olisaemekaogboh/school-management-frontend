import React, { useEffect, useMemo, useState } from "react";
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
  const [teacherClassesLoaded, setTeacherClassesLoaded] = useState(false);

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
    let mounted = true;

    const loadTeacherClasses = async () => {
      if (!isAuthenticated || role !== "TEACHER") {
        if (mounted) {
          setTeacherClasses([]);
          setTeacherClassesLoaded(false);
        }
        return;
      }

      try {
        const response = await teacherAPI.getMyClasses();
        if (!mounted) return;
        setTeacherClasses(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to load teacher classes for navbar:", error);
        if (mounted) setTeacherClasses([]);
      } finally {
        if (mounted) setTeacherClassesLoaded(true);
      }
    };

    loadTeacherClasses();

    return () => {
      mounted = false;
    };
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
    setOpenDropdown((prev) => (prev === dropdownName ? null : dropdownName));
  };

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const isPathActive = (path) => {
    if (!path) return false;
    return location.pathname.startsWith(path);
  };

  const isDropdownActive = (items = []) =>
    items.some((item) => {
      if (item.activePath) return isPathActive(item.activePath);
      if (!item.path) return false;
      const cleanPath = item.path.split("?")[0];
      return isPathActive(cleanPath);
    });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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

  const defaultTeacherStudentsPath = teacherFormClass
    ? buildTeacherScopedPath("/students", teacherFormClass.id)
    : "/students?mine=true";

  const defaultTeacherResultsPath = teacherFormClass
    ? buildTeacherScopedPath("/results", teacherFormClass.id)
    : "/results?mine=true";

  const defaultTeacherAttendancePath = teacherFormClass
    ? buildTeacherScopedPath("/attendance", teacherFormClass.id)
    : "/attendance?mine=true";

  const defaultTeacherSessionResultsPath = teacherFormClass
    ? buildTeacherScopedPath("/session-results", teacherFormClass.id)
    : "/session-results?mine=true";

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
    label: t.common.dashboard || "Dashboard",
  },
  {
    type: "link",
    path: "/students",
    icon: <FaUserGraduate />,
    label: t.navbar.students || "Students",
  },
  {
    type: "dropdown",
    label: t.navbar.people || "People",
    icon: <FaUsers />,
    name: "admin-people",
    items: [
      {
        path: "/teachers",
        label: t.navbar.teachers || "Teachers",
        icon: <FaChalkboardTeacher />,
      },
      {
        path: "/parents",
        label: t.navbar.parents || "Parents",
        icon: <FaUserTie />,
      },
      {
        path: "/users",
        label: t.navbar.users || "Users",
        icon: <FaUserShield />,
      },
    ],
  },
  {
    type: "dropdown",
    label: t.navbar.academics || "Academics",
    icon: <FaBookOpen />,
    name: "admin-academics",
    items: [
      {
        path: "/classes",
        label: t.navbar.classes || "Classes",
        icon: <FaLayerGroup />,
      },
      {
        path: "/classes/manage",
        label: t.navbar.manageClasses || "Class Manager",
        icon: <FaList />,
      },
      {
        path: "/subjects",
        label: t.navbar.subjects || "Subjects",
        icon: <FaBookOpen />,
      },
      {
        path: "/timetable",
        label: t.navbar.timetable || "Timetable",
        icon: <FaCalendarAlt />,
      },
      {
        path: "/results",
        label: t.navbar.results || "Results",
        icon: <FaChartBar />,
      },
      {
        path: "/attendance",
        label: t.navbar.attendance || "Attendance",
        icon: <FaClipboardCheck />,
      },
      {
        path: "/session-results",
        label: t.navbar.sessionResults || "Session Results",
        icon: <FaGraduationCap />,
      },
      {
        path: "/sessions",
        label: t.navbar.sessions || "Sessions",
        icon: <FaClock />,
      },
    ],
  },
  {
    type: "dropdown",
    label: t.navbar.operations || "Operations",
    icon: <FaBus />,
    name: "admin-operations",
    items: [
      {
        path: "/fees",
        label: t.navbar.fees || "Fees",
        icon: <FaMoneyBill />,
      },
      {
        path: "/announcements",
        label: t.navbar.announcements || "Announcements",
        icon: <FaBullhorn />,
      },
      {
        path: "/events",
        label: t.navbar.events || "Events",
        icon: <FaCalendarAlt />,
      },
      {
        path: "/transport/routes",
        label: t.navbar.routes || "Transport",
        icon: <FaBus />,
      },
      {
        path: "/library",
        label: t.navbar.library || "Library",
        icon: <FaBook />,
      },
      {
        path: "/support",
        label: t.navbar.support || "Support",
        icon: <FaComments />,
      },
      {
        path: "/email-queue",
        label: "Email Queue",
        icon: <FaEnvelope />,
      },
    ],
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
          path: defaultTeacherStudentsPath,
          activePath: "/students",
          icon: <FaUsers />,
          label: t.navbar.myStudents || "My Students",
        },
        {
          path: defaultTeacherResultsPath,
          activePath: "/results",
          icon: <FaChartBar />,
          label: t.navbar.results || "Results",
        },
        {
          path: defaultTeacherAttendancePath,
          activePath: "/attendance",
          icon: <FaClipboardCheck />,
          label: t.navbar.attendance || "Attendance",
        },
        {
          path: defaultTeacherSessionResultsPath,
          activePath: "/session-results",
          icon: <FaGraduationCap />,
          label: t.navbar.sessionResults || "Session Results",
        },
        {
          path: "/timetable",
          activePath: "/timetable",
          icon: <FaCalendarAlt />,
          label: t.navbar.myTimetable || "My Timetable",
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
          label: t.navbar.wardResults || "Ward Results",
        },
        {
          path: "/attendance",
          icon: <FaClipboardCheck />,
          label: t.navbar.wardAttendance || "Ward Attendance",
        },
        {
          path: "/session-results",
          icon: <FaGraduationCap />,
          label: t.navbar.sessionResults || "Session Results",
        },
        {
          path: "/timetable",
          icon: <FaCalendarAlt />,
          label: t.navbar.wardTimetable || "Ward Timetable",
        },
        {
          path: "/fees",
          icon: <FaMoneyBill />,
          label: t.navbar.wardFees || "Ward Fees",
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
          label: t.navbar.busTracking || "Bus Tracking",
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
          label: t.navbar.myResults || "My Results",
        },
        {
          path: "/attendance",
          icon: <FaClipboardCheck />,
          label: t.navbar.myAttendance || "My Attendance",
        },
        {
          path: "/session-results",
          icon: <FaGraduationCap />,
          label: t.navbar.sessionResults || "Session Results",
        },
        {
          path: "/timetable",
          icon: <FaCalendarAlt />,
          label: t.navbar.myTimetable || "My Timetable",
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
          label: t.navbar.myFees || "My Fees",
        },
        {
          path: "/transport/tracking",
          icon: <FaBus />,
          label: t.navbar.busTracking || "Bus Tracking",
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
    if (role === "ADMIN") return t.navbar.adminPortal || "Admin Portal";
    if (role === "TEACHER") return t.navbar.teacherPortal || "Teacher Portal";
    if (role === "PARENT") return t.navbar.parentPortal || "Parent Portal";
    if (role === "STUDENT") return t.navbar.studentPortal || "Student Portal";
    return t.navbar.ffis || "School Portal";
  };

  const getDashboardPath = () => {
    if (role === "TEACHER") return "/teacher-dashboard";
    if (role === "PARENT") return "/parent-dashboard";
    if (role === "STUDENT") return "/student-dashboard";
    if (role === "ADMIN") return "/dashboard";
    return "/";
  };

  const getProfilePath = () => {
    if (role === "PARENT") return "/profile";
    return "/profile";
  };

  const renderNavItem = (item) => {
    if (item.type === "dropdown") {
      const isOpenDropdown = openDropdown === item.name;
      const active = isDropdownActive(item.items);

      return (
        <li
          className={`nav-item dropdown ${active ? "active" : ""} ${isOpenDropdown ? "show" : ""}`}
          key={item.name}
        >
          <button
            type="button"
            className="nav-link dropdown-toggle btn btn-link"
            onClick={() => toggleDropdown(item.name)}
          >
            <span className="me-2">{item.icon}</span>
            {item.label}
            <FaChevronDown className="ms-2 small" />
          </button>

          <ul className={`dropdown-menu ${isOpenDropdown ? "show" : ""}`}>
            {item.items.map((subItem, index) => (
              <li key={`${item.name}-${index}`}>
                <Link
                  className={`dropdown-item ${
                    (subItem.activePath && isPathActive(subItem.activePath)) ||
                    isActive(subItem.path?.split("?")[0])
                      ? "active"
                      : ""
                  }`}
                  to={subItem.path}
                  onClick={closeMenu}
                >
                  <span className="me-2">{subItem.icon}</span>
                  {subItem.label}
                </Link>
              </li>
            ))}
          </ul>
        </li>
      );
    }

    return (
      <li className="nav-item" key={item.path}>
        <Link
          className={`nav-link ${isActive(item.path) ? "active" : ""}`}
          to={item.path}
          onClick={closeMenu}
        >
          <span className="me-2">{item.icon}</span>
          {item.label}
        </Link>
      </li>
    );
  };

  return (
    <nav
      className={`navbar navbar-expand-lg navbar-dark navbar-school ${scrolled ? "scrolled" : ""}`}
    >
      <div className="container">
        <Link
          className="navbar-brand d-flex align-items-center"
          to={getHomePath()}
        >
          <FaSchool className="me-2" />
          <span>{getPortalTitle()}</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleMenu}
          aria-label="Toggle navigation"
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {navItems.map(renderNavItem)}
          </ul>

          <ul className="navbar-nav ms-auto align-items-lg-center">
            {isAuthenticated ? (
              <li className="nav-item dropdown">
                <button
                  type="button"
                  className="nav-link dropdown-toggle btn btn-link"
                  onClick={() => toggleDropdown("user-menu")}
                >
                  <FaUser className="me-2" />
                  {user?.firstName || t.common.dashboard}
                  <FaChevronDown className="ms-2 small" />
                </button>

                <ul
                  className={`dropdown-menu dropdown-menu-end ${
                    openDropdown === "user-menu" ? "show" : ""
                  }`}
                >
                  <li>
                    <Link
                      className="dropdown-item"
                      to={getDashboardPath()}
                      onClick={closeMenu}
                    >
                      <FaHome className="me-2" />
                      {t.common.dashboard}
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item"
                      to={getProfilePath()}
                      onClick={closeMenu}
                    >
                      <FaUser className="me-2" />
                      {t.common.profile}
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item"
                      to="/settings"
                      onClick={closeMenu}
                    >
                      <FaCog className="me-2" />
                      {t.common.settings}
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt className="me-2" />
                      {t.common.logout || "Logout"}
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${isActive("/login") ? "active" : ""}`}
                    to="/login"
                    onClick={closeMenu}
                  >
                    <FaSignInAlt className="me-2" />
                    {t.common.login}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${isActive("/register") ? "active" : ""}`}
                    to="/register"
                    onClick={closeMenu}
                  >
                    <FaUserPlus className="me-2" />
                    {t.common.register}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      {role === "TEACHER" && !teacherClassesLoaded && (
        <div className="teacher-scope-loading d-none" aria-hidden="true" />
      )}
    </nav>
  );
}

export default Navbar;

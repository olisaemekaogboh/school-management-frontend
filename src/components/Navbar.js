// src/components/Navbar.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaUserGraduate,
  FaHome,
  FaUsers,
  FaSearch,
  FaChartBar,
  FaPlusCircle,
  FaBars,
  FaTimes,
  FaArrowUp,
  FaCalendarAlt,
  FaGraduationCap,
  FaBullhorn,
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
  FaUserTie, // For Parents
  FaChalkboardTeacher, // For Teachers
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
    setOpenDropdown(null);
  }, [location]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setOpenDropdown(null);
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    setOpenDropdown(null);
  };

  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Check if any item in a dropdown is active
  const isDropdownActive = (items) => {
    return items.some((item) => location.pathname === item.path);
  };

  // Nav items for authenticated users
  const authNavItems = [
    {
      type: "link",
      path: "/",
      icon: <FaHome />,
      label: "Dashboard",
    },
    {
      type: "dropdown",
      label: "Students",
      icon: <FaUsers />,
      name: "students",
      items: [
        { path: "/students", label: "All Students", icon: <FaUsers /> },
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
      ],
    },
    // ===== TEACHERS MANAGEMENT DROPDOWN =====
    {
      type: "dropdown",
      label: "Teachers",
      icon: <FaChalkboardTeacher />,
      name: "teachers",
      items: [
        { path: "/teachers", label: "All Teachers", icon: <FaUsers /> },
        {
          path: "/teachers/new",
          label: "Add Teacher",
          icon: <FaPlusCircle />,
        },
        {
          path: "/teachers/invite",
          label: "Invite Teacher",
          icon: <FaUserPlus />,
        },
      ],
    },
    // ===== PARENTS MANAGEMENT DROPDOWN =====
    {
      type: "dropdown",
      label: "Parents",
      icon: <FaUserTie />,
      name: "parents",
      items: [
        { path: "/parents", label: "All Parents", icon: <FaUsers /> },
        {
          path: "/parents/register",
          label: "Register Parent",
          icon: <FaPlusCircle />,
        },
        {
          path: "/verify-parent",
          label: "Verify Email",
          icon: <FaSearch />,
        },
      ],
    },
    {
      type: "dropdown",
      label: "Academics",
      icon: <FaBookOpen />,
      name: "academics",
      items: [
        { path: "/results", label: "Results", icon: <FaChartBar /> },
        { path: "/attendance", label: "Attendance", icon: <FaCalendarAlt /> },
        {
          path: "/session-results",
          label: "Session Results",
          icon: <FaGraduationCap />,
        },
      ],
    },
    {
      type: "link",
      path: "/fees",
      icon: <FaMoneyBill />,
      label: "Fees",
    },
    {
      type: "link",
      path: "/announcements",
      icon: <FaBullhorn />,
      label: "Announcements",
    },
    {
      type: "link",
      path: "/users",
      icon: <FaUserShield />,
      label: "Users",
    },
  ];

  // Nav items for unauthenticated users
  const publicNavItems = [
    {
      type: "link",
      path: "/",
      icon: <FaHome />,
      label: "Home",
    },
    {
      type: "link",
      path: "/about",
      icon: <FaSchool />,
      label: "About",
    },
    {
      type: "link",
      path: "/contact",
      icon: <FaBullhorn />,
      label: "Contact",
    },
    // Public email verification for parents
    {
      type: "link",
      path: "/verify-parent",
      icon: <FaSearch />,
      label: "Verify Parent",
    },
  ];

  const navItems = isAuthenticated ? authNavItems : publicNavItems;

  return (
    <nav
      className={`navbar navbar-expand-lg navbar-dark navbar-school ${scrolled ? "scrolled" : ""}`}
    >
      <div className="container-fluid">
        <Link className="navbar-brand school-logo" to="/" onClick={closeMenu}>
          <FaSchool className="me-2" />
          <span className="brand-text">FFIS</span>
          <span className="brand-full d-none d-md-inline">
            {" "}
            - Faith Foundation
          </span>
        </Link>

        {/* Mobile toggle button */}
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
                      className={`nav-link dropdown-toggle ${isDropdownActive(item.items) ? "active" : ""}`}
                      onClick={() => toggleDropdown(item.name)}
                      aria-expanded={openDropdown === item.name}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-label">{item.label}</span>
                      <FaChevronDown
                        className={`dropdown-arrow ${openDropdown === item.name ? "rotated" : ""}`}
                      />
                    </button>
                    <div
                      className={`dropdown-menu ${openDropdown === item.name ? "show" : ""}`}
                    >
                      {item.items.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          className={`dropdown-item ${isActive(subItem.path) ? "active" : ""}`}
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
                    className={`nav-link ${isActive(item.path) ? "active" : ""}`}
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

          {/* Auth buttons for unauthenticated users */}
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

          {/* User menu for authenticated users */}
          {isAuthenticated && (
            <div className="user-menu ms-lg-3">
              <div className="nav-dropdown">
                <button
                  className="user-menu-btn"
                  onClick={() => toggleDropdown("user")}
                  aria-expanded={openDropdown === "user"}
                >
                  <div className="user-avatar">
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt={user.firstName} />
                    ) : (
                      <FaUser />
                    )}
                  </div>
                  <span className="user-name d-none d-lg-inline">
                    {user?.firstName || "User"}
                  </span>
                  <FaChevronDown
                    className={`user-arrow ${openDropdown === "user" ? "rotated" : ""}`}
                  />
                </button>
                <div
                  className={`dropdown-menu user-dropdown-menu ${openDropdown === "user" ? "show" : ""}`}
                >
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

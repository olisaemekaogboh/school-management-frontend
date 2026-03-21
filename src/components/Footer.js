// src/components/Footer.js
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
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
} from "react-icons/fa";

import "./Footer.css";

function Footer() {
  const { isAuthenticated, user } = useAuth();
  const currentYear = new Date().getFullYear();

  // Get dashboard link based on user role
  const getDashboardLink = () => {
    if (!isAuthenticated) return "/";
    switch (user?.role) {
      case "TEACHER":
        return "/teacher-dashboard";
      case "PARENT":
        return "/parent-dashboard";
      case "STUDENT":
        return "/student-dashboard";
      default:
        return "/";
    }
  };

  // Get profile link based on user role
  const getProfileLink = () => {
    if (!isAuthenticated) return "/login";
    if (user?.role === "PARENT") return "/parent/profile";
    return "/profile";
  };

  return (
    <footer className="footer-modern">
      <div className="container">
        {/* Main Footer Grid */}
        <div className="footer-grid">
          {/* School Info */}
          <div className="footer-col">
            <h5>Faith Foundation</h5>
            <p className="footer-description">
              Excellence in Education, Pride in Heritage
            </p>
            <p className="footer-text">
              Providing quality education that nurtures academic excellence,
              character development, and spiritual growth.
            </p>
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

          {/* Quick Links - Based on Auth Status */}
          <div className="footer-col">
            <h5>Quick Links</h5>
            <ul className="footer-links">
              <li>
                <Link to="/">
                  <FaHome className="link-icon" /> Home
                </Link>
              </li>
              <li>
                <Link to="/about">
                  <FaArrowRight className="link-icon" /> About Us
                </Link>
              </li>
              {isAuthenticated ? (
                <>
                  <li>
                    <Link to={getDashboardLink()}>
                      <FaGraduationCap className="link-icon" /> Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to={getProfileLink()}>
                      <FaUser className="link-icon" /> Profile
                    </Link>
                  </li>
                  <li>
                    <Link to="/settings">
                      <FaCog className="link-icon" /> Settings
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login">
                      <FaSignInAlt className="link-icon" /> Login
                    </Link>
                  </li>
                  <li>
                    <Link to="/register">
                      <FaUserPlus className="link-icon" /> Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Academics & Resources - Role-Based */}
          <div className="footer-col">
            <h5>Academics</h5>
            <ul className="footer-links">
              {user?.role === "ADMIN" && (
                <>
                  <li>
                    <Link to="/classes">
                      <FaBook className="link-icon" /> Classes
                    </Link>
                  </li>
                  <li>
                    <Link to="/subjects">
                      <FaBook className="link-icon" /> Subjects
                    </Link>
                  </li>
                </>
              )}
              {(user?.role === "TEACHER" || user?.role === "ADMIN") && (
                <li>
                  <Link to="/attendance">
                    <FaClipboardList className="link-icon" /> Attendance
                  </Link>
                </li>
              )}
              {(user?.role === "STUDENT" ||
                user?.role === "PARENT" ||
                user?.role === "TEACHER" ||
                user?.role === "ADMIN") && (
                <li>
                  <Link to="/results">
                    <FaChartBar className="link-icon" /> Results
                  </Link>
                </li>
              )}
              {(user?.role === "STUDENT" ||
                user?.role === "PARENT" ||
                user?.role === "TEACHER" ||
                user?.role === "ADMIN") && (
                <li>
                  <Link to="/timetable">
                    <FaCalendarAlt className="link-icon" /> Timetable
                  </Link>
                </li>
              )}
              <li>
                <Link to="/announcements">
                  <FaArrowRight className="link-icon" /> Announcements
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Services */}
          <div className="footer-col">
            <h5>Resources</h5>
            <ul className="footer-links">
              {user?.role === "ADMIN" && (
                <>
                  <li>
                    <Link to="/library/books">
                      <FaBook className="link-icon" /> Library
                    </Link>
                  </li>
                  <li>
                    <Link to="/transport">
                      <FaBus className="link-icon" /> Transport
                    </Link>
                  </li>
                  <li>
                    <Link to="/fees">
                      <FaMoneyBill className="link-icon" /> Fee Management
                    </Link>
                  </li>
                </>
              )}
              {(user?.role === "STUDENT" || user?.role === "PARENT") && (
                <>
                  <li>
                    <Link to="/fees">
                      <FaMoneyBill className="link-icon" /> My Fees
                    </Link>
                  </li>
                  <li>
                    <Link to="/transport/tracking">
                      <FaBus className="link-icon" /> Bus Tracking
                    </Link>
                  </li>
                </>
              )}
              {user?.role === "TEACHER" && (
                <li>
                  <Link to="/teacher-dashboard">
                    <FaChalkboardTeacher className="link-icon" /> Teacher Portal
                  </Link>
                </li>
              )}
              {user?.role === "PARENT" && (
                <li>
                  <Link to="/parent">
                    <FaUserGraduate className="link-icon" /> Parent Portal
                  </Link>
                </li>
              )}
              {user?.role === "STUDENT" && (
                <li>
                  <Link to="/student-dashboard">
                    <FaUserGraduate className="link-icon" /> Student Portal
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-col">
            <h5>Contact</h5>
            <ul className="contact-info">
              <li>
                <FaMapMarkerAlt size={12} className="contact-icon" />
                <span>12 Bishop Shanahan, Fegge, Onitsha, Nigeria</span>
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
                <span>Mon-Fri: 8:00 AM - 5:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              &copy; {currentYear} Faith Foundation International School. All
              rights reserved.
            </p>
            <div className="footer-legal">
              <Link to="/privacy-policy">Privacy Policy</Link>
              <span className="separator">|</span>
              <Link to="/terms-of-service">Terms of Service</Link>
              <span className="separator">|</span>
              <Link to="/faq">FAQ</Link>
            </div>
            <p className="credit">
              Made with <FaHeart size={10} className="heart" /> in Nigeria
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

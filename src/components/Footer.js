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

  return (
    <footer className="footer-simple">
      <div className="container">
        <div className="footer-grid">
          {/* School Info */}
          <div className="footer-col">
            <h5>Faith Foundation</h5>
            <p className="footer-description">
              Excellence in Education, Pride in Heritage
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
                <Link to={getDashboardLink()}>Dashboard</Link>
              </li>
              {isAuthenticated ? (
                <>
                  <li>
                    <Link to="/profile">Profile</Link>
                  </li>
                  <li>
                    <Link to="/settings">Settings</Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login">Login</Link>
                  </li>
                  <li>
                    <Link to="/register">Register</Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Resources - Conditional based on role */}
          <div className="footer-col">
            <h5>Resources</h5>
            <ul className="footer-links">
              {user?.role === "TEACHER" && (
                <li>
                  <Link to="/attendance">Attendance</Link>
                </li>
              )}
              {(user?.role === "STUDENT" || user?.role === "PARENT") && (
                <li>
                  <Link to="/results">Results</Link>
                </li>
              )}
              <li>
                <Link to="/announcements">Announcements</Link>
              </li>
              <li>
                <Link to="/timetable">Timetable</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-col">
            <h5>Contact</h5>
            <ul className="contact-info">
              <li>
                <FaMapMarkerAlt size={12} className="contact-icon" />
                <span>12 Bishop Shanahan, Fegge</span>
              </li>
              <li>
                <FaPhone size={12} className="contact-icon" />
                <span>+234 903 017 5230</span>
              </li>
              <li>
                <FaEnvelope size={12} className="contact-icon" />
                <span>info@faithfoundation.edu.ng</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="copyright">&copy; {currentYear} Faith Foundation</p>
          <p className="credit">
            Made with <FaHeart size={10} className="heart" /> in Nigeria
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

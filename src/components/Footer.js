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
} from "react-icons/fa";
import "./Footer.css";

function Footer() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const getDashboardLink = () => {
    if (!isAuthenticated) return "/";
    switch (user?.role) {
      case "TEACHER":
        return "/teacher-dashboard";
      case "PARENT":
        return "/parent-dashboard";
      case "STUDENT":
        return "/student-dashboard";
      case "ADMIN":
        return "/dashboard";
      default:
        return "/";
    }
  };

  const getProfileLink = () => {
    if (!isAuthenticated) return "/login";
    if (user?.role === "PARENT") return "/parent/profile";
    return "/profile";
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
              <li>
                <Link to="/">
                  <FaHome className="link-icon" /> {t.common.home}
                </Link>
              </li>
              <li>
                <Link to="/about">
                  <FaArrowRight className="link-icon" /> {t.footer.aboutUs}
                </Link>
              </li>
              <li>
                <Link to="/contact">
                  <FaArrowRight className="link-icon" /> {t.common.contact}
                </Link>
              </li>
              <li>
                <Link to={getDashboardLink()}>
                  <FaArrowRight className="link-icon" /> {t.common.dashboard}
                </Link>
              </li>
              <li>
                <Link to={getProfileLink()}>
                  <FaArrowRight className="link-icon" /> {t.common.profile}
                </Link>
              </li>
              <li>
                <Link to="/settings">
                  <FaArrowRight className="link-icon" /> {t.common.settings}
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>{t.footer.academics}</h5>
            <ul className="footer-links">
              <li>
                <Link to="/subjects">
                  <FaBook className="link-icon" /> Subjects
                </Link>
              </li>
              <li>
                <Link to="/results">
                  <FaChartBar className="link-icon" /> Results
                </Link>
              </li>
              <li>
                <Link to="/timetable">
                  <FaCalendarAlt className="link-icon" /> Timetable
                </Link>
              </li>
              <li>
                <Link to="/teachers">
                  <FaChalkboardTeacher className="link-icon" />{" "}
                  {t.footer.teacherPortal}
                </Link>
              </li>
              <li>
                <Link to="/students">
                  <FaUserGraduate className="link-icon" /> Students
                </Link>
              </li>
              <li>
                <Link to="/library">
                  <FaClipboardList className="link-icon" /> Library
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>{t.footer.resources}</h5>
            <ul className="footer-links">
              {!isAuthenticated ? (
                <>
                  <li>
                    <Link to="/login">
                      <FaSignInAlt className="link-icon" /> {t.common.login}
                    </Link>
                  </li>
                  <li>
                    <Link to="/register">
                      <FaUserPlus className="link-icon" /> {t.common.register}
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to={getDashboardLink()}>
                      <FaUser className="link-icon" /> {t.common.dashboard}
                    </Link>
                  </li>
                  <li>
                    <Link to="/fees">
                      <FaMoneyBill className="link-icon" />{" "}
                      {t.footer.feeManagement}
                    </Link>
                  </li>
                  <li>
                    <Link to="/transport/tracking">
                      <FaBus className="link-icon" /> {t.footer.busTracking}
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          <div className="footer-col">
            <h5>{t.footer.contact}</h5>
            <ul className="contact-info">
              <li>
                <FaMapMarkerAlt size={12} className="contact-icon" />
                <span>
                  12 Bishop Shanahan Fegge, Onitsha, Anambra State, Nigeria
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

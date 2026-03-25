// src/components/TermsOfService.js
import React from "react";
import { Link } from "react-router-dom";
import {
  FaFileContract,
  FaGavel,
  FaShieldAlt,
  FaUserCheck,
  FaCopyright,
  FaExclamationTriangle,
  FaRegHandshake,
  FaMoneyBillWave,
  FaUserGraduate,
  FaSchool,
  FaArrowRight,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import "./TermsOfService.css";

function TermsOfService() {
  const { t, language } = useLanguage();
  const { darkMode } = useDarkMode();

  const sections = [
    {
      icon: <FaFileContract />,
      title: t.terms?.acceptance || "Acceptance of Terms",
      content:
        t.terms?.acceptanceText ||
        "By accessing or using Faith Foundation International School's website, services, and facilities, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. These terms apply to all visitors, users, and others who access or use the service.",
    },
    {
      icon: <FaSchool />,
      title: t.terms?.schoolServices || "School Services",
      content:
        t.terms?.schoolServicesText ||
        "Our services include educational programs, extracurricular activities, communication platforms, and administrative services. We reserve the right to modify, suspend, or discontinue any service at any time without notice. We strive to maintain service quality but cannot guarantee uninterrupted service.",
    },
    {
      icon: <FaUserGraduate />,
      title: t.terms?.studentConduct || "Student Code of Conduct",
      content:
        t.terms?.studentConductText ||
        "All students are expected to adhere to our code of conduct, which promotes respect, responsibility, and academic integrity. Violations may result in disciplinary action, including suspension or expulsion. Parents are responsible for ensuring their children comply with school policies.",
    },
    {
      icon: <FaMoneyBillWave />,
      title: t.terms?.feesPayments || "Fees and Payments",
      content:
        t.terms?.feesPaymentsText ||
        "Tuition and other fees are due as specified in the fee schedule. Late payments may incur additional charges. We reserve the right to withhold academic records or deny access to services for unpaid fees. Refund policies apply as outlined in the school handbook.",
    },
    {
      icon: <FaUserCheck />,
      title: t.terms?.parentResponsibilities || "Parent Responsibilities",
      content:
        t.terms?.parentResponsibilitiesText ||
        "Parents are responsible for: ensuring their children attend school regularly, monitoring academic progress, paying fees on time, communicating with teachers, and supporting school policies. Parents must provide accurate contact information and update it promptly when changes occur.",
    },
    {
      icon: <FaCopyright />,
      title: t.terms?.intellectualProperty || "Intellectual Property",
      content:
        t.terms?.intellectualPropertyText ||
        "All content on our website, including text, graphics, logos, and educational materials, is the property of Faith Foundation International School and protected by copyright laws. You may not reproduce, distribute, or create derivative works without our written permission.",
    },
    {
      icon: <FaGavel />,
      title: t.terms?.limitationLiability || "Limitation of Liability",
      content:
        t.terms?.limitationLiabilityText ||
        "To the fullest extent permitted by law, Faith Foundation International School shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services. We are not responsible for personal injury, property damage, or educational outcomes beyond our control.",
    },
    {
      icon: <FaExclamationTriangle />,
      title: t.terms?.disclaimer || "Disclaimer of Warranties",
      content:
        t.terms?.disclaimerText ||
        'Our services are provided "as is" without warranties of any kind, either express or implied. We do not warrant that the services will be uninterrupted, error-free, or secure. We are not responsible for the accuracy of information provided by third parties.',
    },
    {
      icon: <FaRegHandshake />,
      title: t.terms?.governingLaw || "Governing Law",
      content:
        t.terms?.governingLawText ||
        "These Terms shall be governed by the laws of Nigeria. Any disputes arising from these terms shall be resolved in the courts of Anambra State. By using our services, you consent to the exclusive jurisdiction of these courts.",
    },
    {
      icon: <FaShieldAlt />,
      title: t.terms?.modifications || "Modifications to Terms",
      content:
        t.terms?.modificationsText ||
        "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of our services after any changes constitutes acceptance of the new terms. Please review these terms periodically for updates.",
    },
  ];

  const lastUpdated = new Date().toLocaleDateString(
    language === "fr" ? "fr-FR" : language === "ig" ? "ig-NG" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <div className={`terms-page ${darkMode ? "dark" : "light"}`}>
      {/* Hero Section */}
      <section className="terms-hero">
        <div className="terms-container">
          <div className="hero-content">
            <span className="hero-badge">
              {t.terms?.badge || "Terms of Service"}
            </span>
            <h1 className="hero-title">
              {t.terms?.title || "Terms of Service"}
            </h1>
            <p className="hero-description">
              {t.terms?.subtitle ||
                "Please read these terms carefully before using our services"}
            </p>
            <div className="last-updated">
              <FaFileContract />
              <span>
                {t.terms?.effectiveDate || "Effective Date"}: {lastUpdated}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="terms-intro">
        <div className="terms-container">
          <div className="intro-card">
            <p>
              {t.terms?.intro ||
                "Welcome to Faith Foundation International School. These Terms of Service govern your use of our website, educational services, and facilities. By enrolling your child or using our services, you agree to these terms. Please read them carefully."}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="terms-content">
        <div className="terms-container">
          <div className="terms-sections">
            {sections.map((section, index) => (
              <div key={index} className="terms-section">
                <div className="section-icon">{section.icon}</div>
                <div className="section-content">
                  <h2>{section.title}</h2>
                  <p>{section.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="terms-contact">
        <div className="terms-container">
          <div className="contact-card">
            <h2>{t.terms?.questions || "Questions About Terms?"}</h2>
            <p>
              {t.terms?.contactMessage ||
                "If you have questions about these Terms of Service, please contact us."}
            </p>
            <div className="contact-options">
              <div className="contact-option">
                <FaEnvelope />
                <span>legal@ffis.edu.ng</span>
              </div>
              <div className="contact-option">
                <FaPhone />
                <span>+234 903 017 5230</span>
              </div>
            </div>
            <Link to="/contact" className="btn-contact">
              {t.common?.contactUs || "Contact Us"} <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TermsOfService;

// src/components/PrivacyPolicy.js
import React from "react";
import { Link } from "react-router-dom";
import {
  FaShieldAlt,
  FaLock,
  FaUserSecret,
  FaCookie,
  FaDatabase,
  FaEnvelope,
  FaGlobe,
  FaArrowRight,
  FaCheckCircle,
  FaPhone,
} from "react-icons/fa";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import "./PrivacyPolicy.css";

function PrivacyPolicy() {
  const { t, language } = useLanguage();
  const { darkMode } = useDarkMode();

  const sections = [
    {
      icon: <FaUserSecret />,
      title: t.privacy?.infoCollect || "Information We Collect",
      content:
        t.privacy?.infoCollectText ||
        "We collect personal information that you voluntarily provide to us when you register for admission, express interest in obtaining information about us or our services, participate in school activities, or otherwise contact us. The personal information we collect may include: names, addresses, email addresses, phone numbers, date of birth, academic records, and medical information (for emergency purposes).",
    },
    {
      icon: <FaLock />,
      title: t.privacy?.useInfo || "How We Use Your Information",
      content:
        t.privacy?.useInfoText ||
        "We use the information we collect to: process your admission applications, communicate with you about school activities and academic progress, provide educational services, ensure student safety, comply with legal obligations, improve our educational programs, and manage school operations efficiently.",
    },
    {
      icon: <FaShieldAlt />,
      title: t.privacy?.shareInfo || "Sharing Your Information",
      content:
        t.privacy?.shareInfoText ||
        "We do not sell, trade, or rent your personal information to third parties. We may share information with: educational authorities for regulatory compliance, healthcare providers in case of medical emergencies, third-party service providers who assist in school operations, and as required by law or to protect rights and safety.",
    },
    {
      icon: <FaDatabase />,
      title: t.privacy?.dataSecurity || "Data Security",
      content:
        t.privacy?.dataSecurityText ||
        "We implement appropriate technical and organizational security measures to protect your personal information. These include: encryption of data transmission, secure servers, access controls, regular security assessments, and staff training on data protection. However, no method of transmission over the Internet is 100% secure.",
    },
    {
      icon: <FaCookie />,
      title: t.privacy?.cookies || "Cookies and Tracking",
      content:
        t.privacy?.cookiesText ||
        "Our website uses cookies to enhance user experience, analyze site traffic, and personalize content. You can set your browser to refuse cookies, but this may limit some website functionality. We use both session cookies (expire when you close your browser) and persistent cookies (remain until deleted).",
    },
    {
      icon: <FaEnvelope />,
      title: t.privacy?.childPrivacy || "Children's Privacy",
      content:
        t.privacy?.childPrivacyText ||
        "We are committed to protecting children's privacy. For students under 13, we obtain parental consent before collecting personal information. Parents can review, update, or delete their child's information by contacting our school administration. We do not knowingly collect information from children without parental consent.",
    },
    {
      icon: <FaGlobe />,
      title: t.privacy?.international || "International Data Transfers",
      content:
        t.privacy?.internationalText ||
        "Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers. By using our services, you consent to the transfer of your information to countries with different data protection laws.",
    },
    {
      icon: <FaShieldAlt />,
      title: t.privacy?.rights || "Your Rights",
      content:
        t.privacy?.rightsText ||
        "You have the right to: access your personal information, request correction of inaccurate data, request deletion of your data, object to processing of your data, request data portability, and withdraw consent at any time. To exercise these rights, please contact our Data Protection Officer.",
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
    <div className={`privacy-page ${darkMode ? "dark" : "light"}`}>
      {/* Hero Section */}
      <section className="privacy-hero">
        <div className="privacy-container">
          <div className="hero-content">
            <span className="hero-badge">
              {t.privacy?.badge || "Privacy Policy"}
            </span>
            <h1 className="hero-title">
              {t.privacy?.title || "Privacy Policy"}
            </h1>
            <p className="hero-description">
              {t.privacy?.subtitle ||
                "How we collect, use, and protect your information"}
            </p>
            <div className="last-updated">
              <FaShieldAlt />
              <span>
                {t.privacy?.lastUpdated || "Last Updated"}: {lastUpdated}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="privacy-intro">
        <div className="privacy-container">
          <div className="intro-card">
            <p>
              {t.privacy?.intro ||
                'Faith Foundation International School ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or interact with our school. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site or provide us with your personal information.'}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="privacy-content">
        <div className="privacy-container">
          <div className="privacy-sections">
            {sections.map((section, index) => (
              <div key={index} className="privacy-section">
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
      <section className="privacy-contact">
        <div className="privacy-container">
          <div className="contact-card">
            <h2>{t.privacy?.questions || "Questions About Privacy?"}</h2>
            <p>
              {t.privacy?.contactMessage ||
                "If you have questions about this Privacy Policy, please contact us."}
            </p>
            <div className="contact-options">
              <div className="contact-option">
                <FaEnvelope />
                <span>privacy@ffis.edu.ng</span>
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

export default PrivacyPolicy;

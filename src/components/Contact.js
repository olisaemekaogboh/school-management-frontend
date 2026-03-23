import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaPaperPlane,
  FaUser,
  FaComment,
  FaCheckCircle,
  FaSpinner,
  FaHeadset,
  FaGlobe,
  FaComments,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useLanguage } from "../contexts/LanguageContext";
import "./Contact.css";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { t } = useLanguage();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error(t.contact.requiredFields);
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success(t.contact.messageSent);
      setFormData({ name: "", email: "", subject: "", message: "" });

      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    }, 1500);
  };

  const contactInfo = [
    {
      icon: <FaMapMarkerAlt />,
      title: t.contact.visitUs,
      details: [
        "12 Bishop Shanahan Fegge",
        "Onitsha, Anambra State",
        "Nigeria",
      ],
      color: "#ffd700",
    },
    {
      icon: <FaPhone />,
      title: t.contact.callUs,
      details: ["+234 903 017 5230", "+234 816 547 3400", "+234 802 345 6789"],
      color: "#ff6b6b",
    },
    {
      icon: <FaEnvelope />,
      title: t.contact.emailUs,
      details: [
        "info@ffis.edu.ng",
        "admissions@ffis.edu.ng",
        "support@ffis.edu.ng",
      ],
      color: "#4ecdc4",
    },
    {
      icon: <FaClock />,
      title: t.contact.officeHours,
      details: [
        "Monday - Friday: 8:00 AM - 5:00 PM",
        "Saturday: 9:00 AM - 1:00 PM",
        "Sunday: Closed",
      ],
      color: "#96ceb4",
    },
  ];

  const socialLinks = [
    {
      icon: <FaFacebook />,
      url: "https://facebook.com",
      label: "Facebook",
      color: "#1877f2",
    },
    {
      icon: <FaTwitter />,
      url: "https://twitter.com",
      label: "Twitter",
      color: "#1da1f2",
    },
    {
      icon: <FaInstagram />,
      url: "https://instagram.com",
      label: "Instagram",
      color: "#e4405f",
    },
    {
      icon: <FaLinkedin />,
      url: "https://linkedin.com",
      label: "LinkedIn",
      color: "#0077b5",
    },
    {
      icon: <FaYoutube />,
      url: "https://youtube.com",
      label: "YouTube",
      color: "#ff0000",
    },
    {
      icon: <FaComments />,
      url: "https://wa.me/2349030175230",
      label: "WhatsApp",
      color: "#25D366",
    },
  ];

  const faqs = [
    { question: t.contact.faqs.q1, answer: t.contact.faqs.a1 },
    { question: t.contact.faqs.q2, answer: t.contact.faqs.a2 },
    { question: t.contact.faqs.q3, answer: t.contact.faqs.a3 },
    { question: t.contact.faqs.q4, answer: t.contact.faqs.a4 },
  ];

  return (
    <div className="contact-container-dark">
      <section className="contact-hero-dark">
        <div className="hero-bg-dark"></div>
        <div className="container">
          <div className="hero-content-dark">
            <div className="hero-badge">{t.contact.badge}</div>
            <h1 className="hero-title-dark">{t.contact.title}</h1>
            <p className="hero-subtitle-dark">{t.contact.subtitle}</p>
          </div>
        </div>
      </section>

      <section className="contact-info-section">
        <div className="container">
          <div className="contact-info-grid">
            {contactInfo.map((info, index) => (
              <div key={index} className="contact-info-card">
                <div className="info-icon" style={{ color: info.color }}>
                  {info.icon}
                </div>
                <h3>{info.title}</h3>
                {info.details.map((detail, i) => (
                  <p key={i}>{detail}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="contact-form-section">
        <div className="container">
          <div className="form-map-wrapper">
            <div className="contact-form-container">
              <div className="form-header">
                <h2>{t.contact.sendMessage}</h2>
                <p>{t.contact.sendMessageText}</p>
              </div>

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <div className="input-icon">
                    <FaUser />
                  </div>
                  <input
                    type="text"
                    name="name"
                    placeholder={t.contact.yourName}
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <div className="input-icon">
                    <FaEnvelope />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder={t.contact.yourEmail}
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <div className="input-icon">
                    <FaComment />
                  </div>
                  <input
                    type="text"
                    name="subject"
                    placeholder={t.contact.subject}
                    value={formData.subject}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <div className="input-icon">
                    <FaComment />
                  </div>
                  <textarea
                    name="message"
                    placeholder={t.contact.yourMessage}
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    className="form-textarea"
                  ></textarea>
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <FaSpinner className="spinner" /> {t.contact.sending}
                    </>
                  ) : submitted ? (
                    <>
                      <FaCheckCircle /> {t.contact.sent}
                    </>
                  ) : (
                    <>
                      {t.contact.sendMessageBtn} <FaPaperPlane />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="map-container">
              <div className="map-header">
                <h3>{t.contact.findUs}</h3>
                <p>12 Bishop Shanahan Fegge, Onitsha</p>
              </div>
              <iframe
                title="School Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.547812345678!2d6.7833!3d6.1667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1043938b7e3f2e2b%3A0x9f5c5e5e5e5e5e5e!2sOnitsha%2C%20Anambra!5e0!3m2!1sen!2sng!4v1700000000000!5m2!1sen!2sng"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="container">
          <div className="section-header-dark">
            <div className="section-badge-dark">{t.contact.faqBadge}</div>
            <h2 className="section-title-dark">{t.contact.faqTitle}</h2>
            <p className="section-subtitle-dark">{t.contact.faqSubtitle}</p>
          </div>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-card">
                <div className="faq-icon">
                  <FaHeadset />
                </div>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="social-section">
        <div className="container">
          <div className="social-wrapper">
            <h2>{t.contact.connectTitle}</h2>
            <p>{t.contact.connectText}</p>
            <div className="social-links-grid">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link-card"
                  style={{ "--hover-color": social.color }}
                >
                  <div className="social-icon-wrapper">{social.icon}</div>
                  <span>{social.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section-dark">
        <div className="container">
          <div className="cta-wrapper-dark">
            <h2>{t.contact.campusTitle}</h2>
            <p>{t.contact.campusText}</p>
            <Link to="/register" className="btn-cta-dark">
              {t.common.scheduleVisit} <FaGlobe />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;

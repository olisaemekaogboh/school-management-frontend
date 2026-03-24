// src/components/Contact.js
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
import { useDarkMode } from "../contexts/DarkModeContext";
import "./Contact.css";

function Contact() {
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });

      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    }, 1500);
  };

  const contactInfo = [
    {
      icon: <FaMapMarkerAlt />,
      title: "Visit Us",
      details: [
        "11 Bishop Shanahan Street",
        "Fegge, Onitsha",
        "Anambra State, Nigeria",
      ],
    },
    {
      icon: <FaPhone />,
      title: "Call Us",
      details: ["+234 903 017 5230", "+234 816 547 3400", "+234 802 345 6789"],
    },
    {
      icon: <FaEnvelope />,
      title: "Email Us",
      details: [
        "info@ffis.edu.ng",
        "admissions@ffis.edu.ng",
        "support@ffis.edu.ng",
      ],
    },
    {
      icon: <FaClock />,
      title: "Office Hours",
      details: [
        "Mon-Fri: 8:00 AM - 5:00 PM",
        "Saturday: 9:00 AM - 1:00 PM",
        "Sunday: Closed",
      ],
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
    {
      q: "How can I apply for admission?",
      a: "You can apply online through our admissions portal.",
    },
    { q: "What are the school fees?", a: "School fees vary by grade level." },
    {
      q: "Does the school offer transportation?",
      a: "Yes, we provide school bus services for students.",
    },
    {
      q: "What extracurricular activities are available?",
      a: "We offer sports, arts, music, STEM clubs, debate, and more.",
    },
  ];

  return (
    <div className={`contact-page ${darkMode ? "dark" : "light"}`}>
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="contact-container">
          <div className="hero-content">
            <span className="hero-badge">Get In Touch</span>
            <h1 className="hero-title">Contact Us</h1>
            <p className="hero-description">
              We'd love to hear from you. Reach out with any questions,
              feedback, or inquiries.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="contact-info">
        <div className="contact-container">
          <div className="info-grid">
            {contactInfo.map((info, index) => (
              <div key={index} className="info-card">
                <div className="info-icon">{info.icon}</div>
                <h3>{info.title}</h3>
                <div className="info-details">
                  {info.details.map((detail, i) => (
                    <p key={i}>{detail}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="contact-form-section">
        <div className="contact-container">
          <div className="form-map-grid">
            <div className="form-card">
              <h2>Send Us a Message</h2>
              <p>
                Fill out the form below and we'll get back to you as soon as
                possible.
              </p>

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name *"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email *"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <FaComment className="input-icon" />
                  <input
                    type="text"
                    name="subject"
                    placeholder="Subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <FaComment className="input-icon" />
                  <textarea
                    name="message"
                    placeholder="Your Message *"
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    className="form-textarea"
                  />
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <FaSpinner className="spinner" /> Sending...
                    </>
                  ) : submitted ? (
                    <>
                      <FaCheckCircle /> Sent!
                    </>
                  ) : (
                    <>
                      Send Message <FaPaperPlane />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="map-card">
              <h3>Find Us Here</h3>
              <p>11 Bishop Shanahan Street, Fegge, Onitsha</p>
              <div className="map-container">
                <iframe
                  title="St. Faith Anglican Church, Fegge Onitsha - Google Maps"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.572352270629!2d6.777705!3d6.162446!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1043938b7e3f2e2b%3A0x9f5c5e5e5e5e5e5e!2sSt.%20Faith%20Anglican%20Church%2C%20Fegge%2C%20Onitsha!5e0!3m2!1sen!2sng!4v1700000000000!5m2!1sen!2sng"
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
        </div>
      </section>

      {/* FAQ Section */}
      <section className="contact-faq">
        <div className="contact-container">
          <div className="section-header">
            <span className="section-badge">FAQ</span>
            <h2>Frequently Asked Questions</h2>
            <p>Find answers to common questions about our school</p>
          </div>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-card">
                <div className="faq-icon">
                  <FaHeadset />
                </div>
                <h3>{faq.q}</h3>
                <p>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Section */}
      <section className="contact-social">
        <div className="contact-container">
          <div className="social-content">
            <h2>Connect With Us</h2>
            <p>Follow us on social media for updates, news, and events</p>
            <div className="social-grid">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-card"
                  style={{ "--hover-color": social.color }}
                >
                  <div className="social-icon">{social.icon}</div>
                  <span>{social.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="contact-cta">
        <div className="contact-container">
          <div className="cta-content">
            <h2>Visit Our Campus</h2>
            <p>Schedule a tour and see our facilities firsthand</p>
            <Link to="/register" className="cta-button">
              Schedule a Visit <FaGlobe />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;

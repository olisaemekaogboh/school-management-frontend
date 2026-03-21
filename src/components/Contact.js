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
  FaWhatsapp,
  FaGlobe,
} from "react-icons/fa";
import { toast } from "react-toastify";
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

    // Simulate API call
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
        "12 Bishop Shanahan Fegge",
        "Onitsha, Anambra State",
        "Nigeria",
      ],
      color: "#ffd700",
    },
    {
      icon: <FaPhone />,
      title: "Call Us",
      details: ["+234 903 017 5230", "+234 816 547 3400", "+234 802 345 6789"],
      color: "#ff6b6b",
    },
    {
      icon: <FaEnvelope />,
      title: "Email Us",
      details: [
        "info@ffis.edu.ng",
        "admissions@ffis.edu.ng",
        "support@ffis.edu.ng",
      ],
      color: "#4ecdc4",
    },
    {
      icon: <FaClock />,
      title: "Office Hours",
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
      icon: <FaWhatsapp />,
      url: "https://wa.me/2349030175230",
      label: "WhatsApp",
      color: "#25D366",
    },
  ];

  const faqs = [
    {
      question: "How can I apply for admission?",
      answer:
        "You can apply online through our admissions portal or visit our campus for assistance. The application process includes filling out the form, submitting required documents, and attending an interview.",
    },
    {
      question: "What are the school fees?",
      answer:
        "School fees vary by grade level. Please contact our admissions office for detailed fee structure and payment plans.",
    },
    {
      question: "Does the school offer transportation?",
      answer:
        "Yes, we provide school bus services for students. Bus routes cover major areas within Onitsha and surrounding communities.",
    },
    {
      question: "What extracurricular activities are available?",
      answer:
        "We offer sports, arts, music, STEM clubs, debate, cultural activities, and various leadership programs.",
    },
  ];

  return (
    <div className="contact-container-dark">
      {/* Hero Section */}
      <section className="contact-hero-dark">
        <div className="hero-bg-dark"></div>
        <div className="container">
          <div className="hero-content-dark">
            <div className="hero-badge">Get In Touch</div>
            <h1 className="hero-title-dark">Contact Us</h1>
            <p className="hero-subtitle-dark">
              We'd love to hear from you. Reach out with any questions,
              feedback, or inquiries.
            </p>
          </div>
        </div>
        <div className="hero-wave-dark">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path
              fill="#0a0a0a"
              fillOpacity="1"
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Contact Info Cards */}
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

      {/* Contact Form and Map Section */}
      <section className="contact-form-section">
        <div className="container">
          <div className="form-map-wrapper">
            {/* Contact Form */}
            <div className="contact-form-container">
              <div className="form-header">
                <h2>Send Us a Message</h2>
                <p>
                  Fill out the form below and we'll get back to you as soon as
                  possible.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <div className="input-icon">
                    <FaUser />
                  </div>
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
                  <div className="input-icon">
                    <FaEnvelope />
                  </div>
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
                  <div className="input-icon">
                    <FaComment />
                  </div>
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
                  <div className="input-icon">
                    <FaComment />
                  </div>
                  <textarea
                    name="message"
                    placeholder="Your Message *"
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    className="form-textarea"
                  ></textarea>
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

            {/* Google Maps */}
            <div className="map-container">
              <div className="map-header">
                <h3>Find Us Here</h3>
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

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <div className="section-header-dark">
            <div className="section-badge-dark">FAQ</div>
            <h2 className="section-title-dark">Frequently Asked Questions</h2>
            <p className="section-subtitle-dark">
              Find answers to common questions about our school
            </p>
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

      {/* Social Media Section */}
      <section className="social-section">
        <div className="container">
          <div className="social-wrapper">
            <h2>Connect With Us</h2>
            <p>Follow us on social media for updates, news, and events</p>
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

      {/* CTA Section */}
      <section className="cta-section-dark">
        <div className="container">
          <div className="cta-wrapper-dark">
            <h2>Visit Our Campus</h2>
            <p>Schedule a tour and see our facilities firsthand</p>
            <Link to="/register" className="btn-cta-dark">
              Schedule a Visit <FaGlobe />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;

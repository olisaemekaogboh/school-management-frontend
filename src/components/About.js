// src/components/About.js
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaHistory,
  FaBullhorn,
  FaHandsHelping,
  FaRegLightbulb,
  FaUsers,
  FaGlobe,
  FaAward,
  FaChartLine,
  FaGraduationCap,
  FaBookOpen,
  FaChalkboardTeacher,
  FaQuoteLeft,
  FaQuoteRight,
  FaStar,
  FaRocket,
  FaShieldAlt,
  FaLinkedin,
  FaTwitter,
  FaEnvelope,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaArrowRight,
  FaCheckCircle,
} from "react-icons/fa";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import "./About.css";

function About() {
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();
  const [animated, setAnimated] = useState(false);
  const statsRef = useRef(null);

  const values = [
    {
      icon: <FaRegLightbulb />,
      title: "Innovation",
      desc: "Embracing modern technology and innovative teaching methods.",
    },
    {
      icon: <FaUsers />,
      title: "Community",
      desc: "Building a strong, supportive community.",
    },
    {
      icon: <FaGlobe />,
      title: "Global Perspective",
      desc: "Preparing students for a globalized world.",
    },
    {
      icon: <FaHandsHelping />,
      title: "Excellence",
      desc: "Striving for excellence in everything we do.",
    },
    {
      icon: <FaShieldAlt />,
      title: "Integrity",
      desc: "Upholding the highest standards of honesty.",
    },
    {
      icon: <FaAward />,
      title: "Leadership",
      desc: "Developing confident leaders.",
    },
  ];

  const milestones = [
    {
      year: "2015",
      title: "School Founded",
      desc: "FFIS opened its doors to 100 students",
      icon: <FaHistory />,
    },
    {
      year: "2018",
      title: "Digital Transformation",
      desc: "Launched integrated school management system",
      icon: <FaRocket />,
    },
    {
      year: "2020",
      title: "Online Learning",
      desc: "Adapted to remote learning during global challenges",
      icon: <FaBookOpen />,
    },
    {
      year: "2023",
      title: "1000+ Students",
      desc: "Reached milestone of 1000 enrolled students",
      icon: <FaGraduationCap />,
    },
    {
      year: "2024",
      title: "Global Recognition",
      desc: "Received international accreditation",
      icon: <FaAward />,
    },
  ];

  const leadership = [
    {
      name: "Mrs. Cynthia Okeke",
      role: "Principal & CEO",
      bio: "Masters in Education Leadership with 20+ years of experience.",
      image: "👩‍🏫",
    },
    {
      name: "Mr. James Okonkwo",
      role: "Academic Director",
      bio: "Expert in curriculum development and educational technology.",
      image: "👨‍🏫",
    },
    {
      name: "Mr. Ebuka Okafor",
      role: "Administrative Director",
      bio: "Specializes in school operations and student welfare.",
      image: "👨‍💼",
    },
    {
      name: "Dr. Ngozi Adeyemi",
      role: "Head of Academics",
      bio: "PhD in Educational Psychology.",
      image: "👩‍🎓",
    },
  ];

  const stats = [
    { value: "10+", label: "Years of Excellence", icon: <FaHistory /> },
    { value: "50+", label: "Awards & Recognition", icon: <FaAward /> },
    { value: "98%", label: "Graduation Rate", icon: <FaChartLine /> },
    { value: "1000+", label: "Happy Students", icon: <FaUsers /> },
    { value: "100+", label: "Expert Teachers", icon: <FaChalkboardTeacher /> },
    { value: "30+", label: "Classrooms", icon: <FaBookOpen /> },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setAnimated(true);
      },
      { threshold: 0.2 },
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`about-page ${darkMode ? "dark" : "light"}`}>
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-container">
          <div className="hero-content">
            <span className="hero-badge">Est. 2015</span>
            <h1 className="hero-title">
              Faith Foundation
              <br />
              International School
            </h1>
            <p className="hero-description">
              Empowering the next generation of African leaders through quality
              education and innovation
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary btn-hero">
                Join Our Family <FaArrowRight />
              </Link>
              <Link to="/contact" className="btn btn-outline btn-hero">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-stats" ref={statsRef}>
        <div className="about-container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-value">{animated ? stat.value : "0"}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="about-mission-vision">
        <div className="about-container">
          <div className="mv-grid">
            <div className="mv-card">
              <div className="mv-icon">
                <FaBullhorn />
              </div>
              <h3>Our Mission</h3>
              <p>
                To provide a nurturing and innovative learning environment that
                empowers students to reach their full potential.
              </p>
            </div>
            <div className="mv-card">
              <div className="mv-icon">
                <FaRegLightbulb />
              </div>
              <h3>Our Vision</h3>
              <p>
                To be a world-class educational institution that prepares
                students to become responsible global citizens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="about-story">
        <div className="about-container">
          <div className="story-wrapper">
            <div className="story-text">
              <span className="section-badge">Our Journey</span>
              <h2>The Story of Faith Foundation</h2>
              <p>
                Faith Foundation International School (FFIS) was founded in 2015
                with a vision to revolutionize education.
              </p>
              <p>
                Our journey has been marked by continuous innovation and a
                commitment to excellence.
              </p>
              <p>Today, FFIS stands as a beacon of modern education.</p>
              <div className="story-features">
                <span>
                  <FaCheckCircle /> Accredited Institution
                </span>
                <span>
                  <FaCheckCircle /> Modern Facilities
                </span>
                <span>
                  <FaCheckCircle /> Expert Faculty
                </span>
              </div>
            </div>
            <div className="story-image">
              <div className="floating-card">
                <FaCalendarAlt /> Est. 2015
              </div>
              <div className="floating-card second">
                <FaMapMarkerAlt /> Onitsha, Nigeria
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="about-values">
        <div className="about-container">
          <div className="section-header">
            <span className="section-badge">What We Believe</span>
            <h2>Our Core Values</h2>
            <p>The principles that guide everything we do</p>
          </div>
          <div className="values-grid">
            {values.map((value, index) => (
              <div key={index} className="value-card">
                <div className="value-icon">{value.icon}</div>
                <h3>{value.title}</h3>
                <p>{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="about-timeline">
        <div className="about-container">
          <div className="section-header">
            <span className="section-badge">Our History</span>
            <h2>Key Milestones</h2>
            <p>Celebrating our journey of growth and excellence</p>
          </div>
          <div className="timeline">
            {milestones.map((item, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-marker">
                  <div className="timeline-icon">{item.icon}</div>
                  {index < milestones.length - 1 && (
                    <div className="timeline-line"></div>
                  )}
                </div>
                <div className="timeline-content">
                  <div className="timeline-year">{item.year}</div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="about-leadership">
        <div className="about-container">
          <div className="section-header">
            <span className="section-badge">Meet Our Leaders</span>
            <h2>Leadership Team</h2>
            <p>Dedicated professionals shaping the future of education</p>
          </div>
          <div className="leadership-grid">
            {leadership.map((leader, index) => (
              <div key={index} className="leader-card">
                <div className="leader-avatar">{leader.image}</div>
                <h3>{leader.name}</h3>
                <p className="leader-role">{leader.role}</p>
                <p className="leader-bio">{leader.bio}</p>
                <div className="leader-social">
                  <a href="#">
                    <FaLinkedin />
                  </a>
                  <a href="#">
                    <FaTwitter />
                  </a>
                  <a href="#">
                    <FaEnvelope />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="about-testimonial">
        <div className="about-container">
          <div className="testimonial-card">
            <FaQuoteLeft className="quote-left" />
            <p>
              "Faith Foundation International School has transformed our
              community."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">👨‍👩‍👧‍👦</div>
              <div>
                <h4>The Okafor Family</h4>
                <p>Parents of 3 Students</p>
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} />
                  ))}
                </div>
              </div>
            </div>
            <FaQuoteRight className="quote-right" />
          </div>
        </div>
      </section>

      {/* CTA Section - Clear Enroll Button */}
      <section className="about-cta">
        <div className="about-container">
          <div className="cta-content">
            <h2>Ready to Join Our Community?</h2>
            <p>
              Take the first step towards an exceptional education for your
              child
            </p>
            <Link to="/register" className="btn-enroll">
              Enroll Now <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;

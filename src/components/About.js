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
import "./About.css";

function About() {
  const [animated, setAnimated] = useState(false);
  const statsRef = useRef(null);
  const { t } = useLanguage();

  const values = [
    {
      icon: <FaRegLightbulb />,
      title: t.about.values.innovation,
      description: t.about.values.innovationDesc,
      color: "#FFD700",
    },
    {
      icon: <FaUsers />,
      title: t.about.values.community,
      description: t.about.values.communityDesc,
      color: "#FF6B6B",
    },
    {
      icon: <FaGlobe />,
      title: t.about.values.globalPerspective,
      description: t.about.values.globalPerspectiveDesc,
      color: "#4ECDC4",
    },
    {
      icon: <FaHandsHelping />,
      title: t.about.values.excellence,
      description: t.about.values.excellenceDesc,
      color: "#B83B5E",
    },
    {
      icon: <FaShieldAlt />,
      title: t.about.values.integrity,
      description: t.about.values.integrityDesc,
      color: "#F9D56E",
    },
    {
      icon: <FaAward />,
      title: t.about.values.leadership,
      description: t.about.values.leadershipDesc,
      color: "#E84545",
    },
  ];

  const milestones = [
    {
      year: "2015",
      title: "School Founded",
      description: "FFIS opened its doors to 100 students",
      icon: <FaHistory />,
    },
    {
      year: "2018",
      title: "Digital Transformation",
      description: "Launched integrated school management system",
      icon: <FaRocket />,
    },
    {
      year: "2020",
      title: "Online Learning",
      description: "Adapted to remote learning during global challenges",
      icon: <FaBookOpen />,
    },
    {
      year: "2023",
      title: "1000+ Students",
      description: "Reached milestone of 1000 enrolled students",
      icon: <FaGraduationCap />,
    },
    {
      year: "2024",
      title: "Global Recognition",
      description: "Received international accreditation",
      icon: <FaAward />,
    },
  ];

  const leadership = [
    {
      name: "Mrs. Cynthia Okeke",
      role: "Principal & CEO",
      bio: "Masters in Education Leadership with 20+ years of experience. Visionary leader transforming education.",
      image: "👩‍🏫",
      gradient: "gradient-1",
    },
    {
      name: "Mr. James Okonkwo",
      role: "Academic Director",
      bio: "Expert in curriculum development and educational technology integration. Committed to excellence.",
      image: "👨‍🏫",
      gradient: "gradient-2",
    },
    {
      name: "Mr. Ebuka Okafor",
      role: "Administrative Director",
      bio: "Specializes in school operations and student welfare. Dedicated to creating nurturing environments.",
      image: "👨‍💼",
      gradient: "gradient-3",
    },
    {
      name: "Dr. Ngozi Adeyemi",
      role: "Head of Academics",
      bio: "PhD in Educational Psychology. Expert in student development and learning methodologies.",
      image: "👩‍🎓",
      gradient: "gradient-4",
    },
  ];

  const stats = [
    {
      value: "10+",
      label: "Years of Excellence",
      icon: <FaHistory />,
      suffix: "",
    },
    {
      value: "50+",
      label: "Awards & Recognition",
      icon: <FaAward />,
      suffix: "+",
    },
    {
      value: "98",
      label: "Graduation Rate",
      icon: <FaChartLine />,
      suffix: "%",
    },
    { value: "1000", label: "Happy Students", icon: <FaUsers />, suffix: "+" },
    {
      value: "100",
      label: "Expert Teachers",
      icon: <FaChalkboardTeacher />,
      suffix: "+",
    },
    { value: "30", label: "Classrooms", icon: <FaBookOpen />, suffix: "+" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setAnimated(true);
      },
      { threshold: 0.3 },
    );

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-container-dark">
      <section className="about-hero-dark">
        <div className="hero-bg-dark"></div>
        <div className="container">
          <div className="hero-content-dark">
            <div className="hero-badge">{t.about.est}</div>
            <h1 className="hero-title-dark">
              <span className="title-gradient-dark">{t.about.heroTitle1}</span>
              <br />
              {t.about.heroTitle2}
            </h1>
            <p className="hero-subtitle-dark">{t.about.heroSubtitle}</p>
            <div className="hero-buttons-dark">
              <Link to="/register" className="btn-primary-dark">
                {t.common.joinOurFamily} <FaArrowRight className="btn-icon" />
              </Link>
              <Link to="/contact" className="btn-outline-dark">
                {t.common.contactUs}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section-dark" ref={statsRef}>
        <div className="container">
          <div className="stats-grid-dark">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card-dark">
                <div className="stat-icon-dark">{stat.icon}</div>
                <h3 className="stat-value-dark">
                  {animated ? stat.value : "0"}
                  {stat.suffix}
                </h3>
                <p className="stat-label-dark">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mission-vision-dark">
        <div className="container">
          <div className="mv-grid-dark">
            <div className="mv-card-dark mission-card-dark">
              <div className="card-glow"></div>
              <div className="card-icon-dark">
                <FaBullhorn />
              </div>
              <h3>{t.about.mission}</h3>
              <p>{t.about.missionText}</p>
            </div>
            <div className="mv-card-dark vision-card-dark">
              <div className="card-glow"></div>
              <div className="card-icon-dark">
                <FaRegLightbulb />
              </div>
              <h3>{t.about.vision}</h3>
              <p>{t.about.visionText}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="story-section-dark">
        <div className="container">
          <div className="story-wrapper-dark">
            <div className="story-text-dark">
              <div className="section-badge-dark">{t.about.ourJourney}</div>
              <h2 className="section-title-dark">{t.about.storyTitle}</h2>
              <div className="story-content-dark">
                <p>{t.about.storyP1}</p>
                <p>{t.about.storyP2}</p>
                <p>{t.about.storyP3}</p>
              </div>
              <div className="story-features-dark">
                <div className="feature-dark">
                  <FaCheckCircle className="feature-icon-dark" />
                  <span>{t.about.accredited}</span>
                </div>
                <div className="feature-dark">
                  <FaCheckCircle className="feature-icon-dark" />
                  <span>{t.about.facilities}</span>
                </div>
                <div className="feature-dark">
                  <FaCheckCircle className="feature-icon-dark" />
                  <span>{t.about.faculty}</span>
                </div>
              </div>
            </div>
            <div className="story-image-dark">
              <div className="image-glow"></div>
              <div className="image-content-dark">
                <div className="floating-card-dark">
                  <FaCalendarAlt />
                  <span>{t.about.est}</span>
                </div>
                <div className="floating-card-dark second">
                  <FaMapMarkerAlt />
                  <span>Onitsha, Nigeria</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="values-section-dark">
        <div className="container">
          <div className="section-header-dark">
            <div className="section-badge-dark">{t.about.whatWeBelieve}</div>
            <h2 className="section-title-dark">{t.about.coreValues}</h2>
            <p className="section-subtitle-dark">{t.about.valuesSubtitle}</p>
          </div>
          <div className="values-grid-dark">
            {values.map((value, index) => (
              <div key={index} className="value-card-dark">
                <div className="value-icon-dark" style={{ color: value.color }}>
                  {value.icon}
                </div>
                <h3 className="value-title-dark">{value.title}</h3>
                <p className="value-description-dark">{value.description}</p>
                <div
                  className="value-border"
                  style={{ background: value.color }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="timeline-section-dark">
        <div className="container">
          <div className="section-header-dark">
            <div className="section-badge-dark">{t.about.history}</div>
            <h2 className="section-title-dark">{t.about.milestones}</h2>
            <p className="section-subtitle-dark">
              {t.about.milestonesSubtitle}
            </p>
          </div>
          <div className="timeline-dark">
            {milestones.map((milestone, index) => (
              <div key={index} className="timeline-item-dark">
                <div className="timeline-marker-dark">
                  <div className="timeline-icon-dark">{milestone.icon}</div>
                  {index < milestones.length - 1 && (
                    <div className="timeline-line-dark"></div>
                  )}
                </div>
                <div className="timeline-content-dark">
                  <div className="timeline-year-dark">{milestone.year}</div>
                  <h3>{milestone.title}</h3>
                  <p>{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="leadership-section-dark">
        <div className="container">
          <div className="section-header-dark">
            <div className="section-badge-dark">{t.about.leadersBadge}</div>
            <h2 className="section-title-dark">{t.about.leadersTitle}</h2>
            <p className="section-subtitle-dark">{t.about.leadersSubtitle}</p>
          </div>
          <div className="leadership-grid-dark">
            {leadership.map((leader, index) => (
              <div
                key={index}
                className={`leader-card-dark ${leader.gradient}`}
              >
                <div className="leader-image-dark">
                  <div className="leader-avatar-dark">{leader.image}</div>
                  <div className="leader-social-dark">
                    <a href="#" className="social-icon-dark">
                      <FaLinkedin />
                    </a>
                    <a href="#" className="social-icon-dark">
                      <FaTwitter />
                    </a>
                    <a href="#" className="social-icon-dark">
                      <FaEnvelope />
                    </a>
                  </div>
                </div>
                <div className="leader-info-dark">
                  <h3>{leader.name}</h3>
                  <p className="leader-role-dark">{leader.role}</p>
                  <p className="leader-bio-dark">{leader.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="testimonial-section-dark">
        <div className="container">
          <div className="testimonial-wrapper-dark">
            <FaQuoteLeft className="quote-icon-left-dark" />
            <div className="testimonial-content-dark">
              <p className="testimonial-text-dark">{t.about.testimonial}</p>
              <div className="testimonial-author-dark">
                <div className="author-avatar-dark">👨‍👩‍👧‍👦</div>
                <div className="author-info-dark">
                  <h4>{t.about.testimonialAuthor}</h4>
                  <p>{t.about.testimonialRole}</p>
                  <div className="author-stars">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className="star-filled-dark" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <FaQuoteRight className="quote-icon-right-dark" />
          </div>
        </div>
      </section>

      <section className="cta-section-dark">
        <div className="container">
          <div className="cta-wrapper-dark">
            <h2>{t.about.ctaTitle}</h2>
            <p>{t.about.ctaText}</p>
            <Link to="/register" className="btn-cta-dark">
              {t.common.enrollNow} <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;

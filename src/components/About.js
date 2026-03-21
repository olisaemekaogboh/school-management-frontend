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
  FaHeart,
  FaQuoteLeft,
  FaQuoteRight,
  FaStar,
  FaRocket,
  FaShieldAlt,
  FaLeaf,
  FaHandshake,
  FaUserTie,
  FaLinkedin,
  FaTwitter,
  FaEnvelope,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaArrowRight,
  FaCheckCircle,
  FaCrown,
  FaGem,
  FaInfinity,
} from "react-icons/fa";
import "./About.css";

function About() {
  const [animated, setAnimated] = useState(false);
  const statsRef = useRef(null);

  const values = [
    {
      icon: <FaRegLightbulb />,
      title: "Innovation",
      description:
        "Embracing modern technology and innovative teaching methods to enhance learning experiences.",
      color: "#FFD700",
    },
    {
      icon: <FaUsers />,
      title: "Community",
      description:
        "Building a strong, supportive community of learners, educators, and parents.",
      color: "#FF6B6B",
    },
    {
      icon: <FaGlobe />,
      title: "Global Perspective",
      description:
        "Preparing students for a globalized world with international standards.",
      color: "#4ECDC4",
    },
    {
      icon: <FaHandsHelping />,
      title: "Excellence",
      description:
        "Striving for excellence in everything we do, from academics to extracurricular activities.",
      color: "#B83B5E",
    },
    {
      icon: <FaShieldAlt />,
      title: "Integrity",
      description:
        "Upholding the highest standards of honesty and moral principles.",
      color: "#F9D56E",
    },
    {
      icon: <FaCrown />,
      title: "Leadership",
      description:
        "Developing confident leaders who will shape tomorrow's world.",
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
        if (entries[0].isIntersecting) {
          setAnimated(true);
        }
      },
      { threshold: 0.3 },
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-container-dark">
      {/* Hero Section with Dark Gradient */}
      <section className="about-hero-dark">
        <div className="hero-bg-dark"></div>
        <div className="container">
          <div className="hero-content-dark">
            <div className="hero-badge">Est. 2015</div>
            <h1 className="hero-title-dark">
              <span className="title-gradient-dark">Faith Foundation</span>
              <br />
              International School
            </h1>
            <p className="hero-subtitle-dark">
              Empowering the next generation of African leaders through quality
              education and innovation
            </p>
            <div className="hero-buttons-dark">
              <Link to="/register" className="btn-primary-dark">
                Join Our Family <FaArrowRight className="btn-icon" />
              </Link>
              <Link to="/contact" className="btn-outline-dark">
                Contact Us
              </Link>
            </div>
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

      {/* Stats Section */}
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

      {/* Mission & Vision Cards */}
      <section className="mission-vision-dark">
        <div className="container">
          <div className="mv-grid-dark">
            <div className="mv-card-dark mission-card-dark">
              <div className="card-glow"></div>
              <div className="card-icon-dark">
                <FaBullhorn />
              </div>
              <h3>Our Mission</h3>
              <p>
                To provide a nurturing and innovative learning environment that
                empowers students to reach their full potential, fostering
                critical thinking, creativity, and lifelong learning skills.
              </p>
            </div>
            <div className="mv-card-dark vision-card-dark">
              <div className="card-glow"></div>
              <div className="card-icon-dark">
                <FaRegLightbulb />
              </div>
              <h3>Our Vision</h3>
              <p>
                To be a world-class educational institution that prepares
                students to become responsible global citizens and future
                leaders who make a positive impact on society.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="story-section-dark">
        <div className="container">
          <div className="story-wrapper-dark">
            <div className="story-text-dark">
              <div className="section-badge-dark">Our Journey</div>
              <h2 className="section-title-dark">
                The Story of Faith Foundation
              </h2>
              <div className="story-content-dark">
                <p>
                  Faith Foundation International School (FFIS) was founded in
                  2015 with a vision to revolutionize education. What started as
                  a small institution with just 100 students has grown into a
                  thriving community of over 1000 learners, educators, and
                  staff.
                </p>
                <p>
                  Our journey has been marked by continuous innovation and a
                  commitment to excellence. We've embraced technology to enhance
                  learning, built state-of-the-art facilities, and assembled a
                  team of passionate educators dedicated to student success.
                </p>
                <p>
                  Today, FFIS stands as a beacon of modern education, combining
                  traditional African values with contemporary teaching
                  methodologies to prepare students for the challenges of
                  tomorrow.
                </p>
              </div>
              <div className="story-features-dark">
                <div className="feature-dark">
                  <FaCheckCircle className="feature-icon-dark" />
                  <span>Accredited Institution</span>
                </div>
                <div className="feature-dark">
                  <FaCheckCircle className="feature-icon-dark" />
                  <span>Modern Facilities</span>
                </div>
                <div className="feature-dark">
                  <FaCheckCircle className="feature-icon-dark" />
                  <span>Expert Faculty</span>
                </div>
              </div>
            </div>
            <div className="story-image-dark">
              <div className="image-glow"></div>
              <div className="image-content-dark">
                <div className="floating-card-dark">
                  <FaCalendarAlt />
                  <span>Est. 2015</span>
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

      {/* Core Values Section */}
      <section className="values-section-dark">
        <div className="container">
          <div className="section-header-dark">
            <div className="section-badge-dark">What We Believe</div>
            <h2 className="section-title-dark">Our Core Values</h2>
            <p className="section-subtitle-dark">
              The principles that guide everything we do
            </p>
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

      {/* Timeline Section */}
      <section className="timeline-section-dark">
        <div className="container">
          <div className="section-header-dark">
            <div className="section-badge-dark">Our History</div>
            <h2 className="section-title-dark">Key Milestones</h2>
            <p className="section-subtitle-dark">
              Celebrating our journey of growth and excellence
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

      {/* Leadership Team Section */}
      <section className="leadership-section-dark">
        <div className="container">
          <div className="section-header-dark">
            <div className="section-badge-dark">Meet Our Leaders</div>
            <h2 className="section-title-dark">Leadership Team</h2>
            <p className="section-subtitle-dark">
              Dedicated professionals shaping the future of education
            </p>
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

      {/* Testimonial Section */}
      <section className="testimonial-section-dark">
        <div className="container">
          <div className="testimonial-wrapper-dark">
            <FaQuoteLeft className="quote-icon-left-dark" />
            <div className="testimonial-content-dark">
              <p className="testimonial-text-dark">
                "Faith Foundation International School has transformed our
                community. The dedication of the teachers and the quality of
                education is unparalleled. Our children are not just learning;
                they are becoming future leaders."
              </p>
              <div className="testimonial-author-dark">
                <div className="author-avatar-dark">👨‍👩‍👧‍👦</div>
                <div className="author-info-dark">
                  <h4>The Okafor Family</h4>
                  <p>Parents of 3 Students</p>
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

      {/* CTA Section */}
      <section className="cta-section-dark">
        <div className="container">
          <div className="cta-wrapper-dark">
            <h2>Ready to Join Our Community?</h2>
            <p>
              Take the first step towards an exceptional education for your
              child
            </p>
            <Link to="/register" className="btn-cta-dark">
              Enroll Now <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;

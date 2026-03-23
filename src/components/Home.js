import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBook,
  FaUsers,
  FaArrowRight,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaChevronLeft,
  FaChevronRight,
  FaGraduationCap,
  FaFlask,
  FaMusic,
  FaFutbol,
  FaLaptopCode,
  FaHeart,
  FaAward,
  FaSpinner,
  FaCalendarAlt,
} from "react-icons/fa";
import { eventAPI } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import "./Home.css";

function Home() {
  const { t, language } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentEventSlide, setCurrentEventSlide] = useState(0);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const homeT = t?.home || {};
  const commonT = t?.common || {};
  const footerT = t?.footer || {};

  const heroSlides = [
    {
      image:
        "https://images.pexels.com/photos/2076917/pexels-photo-2076917.jpeg?auto=compress&cs=tinysrgb&w=1600",
      title: homeT.welcomeTitle || "Welcome to FFIS",
      subtitle:
        homeT.welcomeSubtitle || "Faith Foundation International School",
      description:
        homeT.welcomeDescription ||
        "Empowering the next generation of African leaders through quality education and innovation",
    },
    {
      image:
        "https://images.pexels.com/photos/3147268/pexels-photo-3147268.jpeg?auto=compress&cs=tinysrgb&w=1600",
      title: homeT.excellenceTitle || "Excellence in Education",
      subtitle: homeT.excellenceSubtitle || "Modern Learning Environment",
      description:
        homeT.excellenceDescription ||
        "State-of-the-art facilities and cutting-edge technology for optimal learning in Africa",
    },
    {
      image:
        "https://images.pexels.com/photos/2422294/pexels-photo-2422294.jpeg?auto=compress&cs=tinysrgb&w=1600",
      title: homeT.heritageTitle || "African Heritage & Culture",
      subtitle: homeT.heritageSubtitle || "Celebrating Our Roots",
      description:
        homeT.heritageDescription ||
        "Preserving African heritage while preparing students for global success",
    },
    {
      image:
        "https://images.pexels.com/photos/2166719/pexels-photo-2166719.jpeg?auto=compress&cs=tinysrgb&w=1600",
      title: homeT.innovationTitle || "Innovation Hub",
      subtitle: homeT.innovationSubtitle || "Technology-Driven Learning",
      description:
        homeT.innovationDescription ||
        "Equipping students with 21st-century skills for a digital future",
    },
  ];

  const programs = [
    {
      icon: <FaGraduationCap />,
      title: homeT.kindergarten || "Kindergarten/Nursery",
      age: "Ages 0-5",
      description:
        homeT.kindergartenDesc || "Nurturing curiosity and foundational skills",
    },
    {
      icon: <FaBook />,
      title: homeT.primary || "Primary School",
      age: "Grades 1-6",
      description: homeT.primaryDesc || "Building strong academic foundations",
    },
    {
      icon: <FaFlask />,
      title: homeT.juniorSecondary || "Junior Secondary",
      age: "Grades 7-9",
      description:
        homeT.juniorSecondaryDesc ||
        "Exploring interests and developing critical thinking",
    },
    {
      icon: <FaLaptopCode />,
      title: homeT.seniorSecondary || "Senior Secondary",
      age: "Grades 10-12",
      description:
        homeT.seniorSecondaryDesc || "College preparation and career guidance",
    },
  ];

  const extracurriculars = [
    {
      icon: <FaFutbol />,
      name: homeT.sports || "Sports",
      activities: homeT.sportsActivities || "Football, Volleyball, Athletics",
    },
    {
      icon: <FaMusic />,
      name: homeT.arts || "Arts",
      activities:
        homeT.artsActivities || "African Drumming, Dance, Drama, Visual Arts",
    },
    {
      icon: <FaFlask />,
      name: homeT.stem || "STEM",
      activities: homeT.stemActivities || "Robotics, Science Club, Coding",
    },
    {
      icon: <FaUsers />,
      name: homeT.leadership || "Leadership",
      activities:
        homeT.leadershipActivities || "Student Council, Debate, Model UN",
    },
  ];

  const achievements = [
    {
      value: "95%",
      label: homeT.graduationRate || "Graduation Rate",
      icon: <FaGraduationCap />,
    },
    {
      value: "50+",
      label: homeT.awardsWon || "Awards Won",
      icon: <FaAward />,
    },
    {
      value: "1000+",
      label: homeT.students || "Students",
      icon: <FaUsers />,
    },
    {
      value: "98%",
      label: homeT.parentSatisfaction || "Parent Satisfaction",
      icon: <FaHeart />,
    },
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        const response = await eventAPI.getUpcomingEvents();
        setEvents(response.data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + heroSlides.length) % heroSlides.length,
    );
  };

  const nextEventSlide = () => {
    const totalPages = Math.max(1, Math.ceil(events.length / 3));
    setCurrentEventSlide((prev) => (prev + 1) % totalPages);
  };

  const prevEventSlide = () => {
    const totalPages = Math.max(1, Math.ceil(events.length / 3));
    setCurrentEventSlide((prev) => (prev - 1 + totalPages) % totalPages);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const pagedEvents = [];
  for (let i = 0; i < events.length; i += 3) {
    pagedEvents.push(events.slice(i, i + 3));
  }

  return (
    <div className="home-container">
      <section className="hero-carousel">
        <div className="carousel-container">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`carousel-slide ${index === currentSlide ? "active" : ""}`}
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(${slide.image})`,
              }}
            >
              <div className="carousel-content">
                <h1 className="carousel-title">{slide.title}</h1>
                <p className="carousel-subtitle">{slide.subtitle}</p>
                <p className="carousel-description">{slide.description}</p>
                <div className="hero-buttons">
                  <Link to="/register" className="btn-primary-home">
                    {commonT.getStarted || "Get Started"}{" "}
                    <FaArrowRight className="ms-2" />
                  </Link>
                  <Link to="/about" className="btn-outline-home">
                    {commonT.learnMore || "Learn More"}
                  </Link>
                </div>
              </div>
            </div>
          ))}

          <button className="carousel-btn prev" onClick={prevSlide}>
            <FaChevronLeft />
          </button>
          <button className="carousel-btn next" onClick={nextSlide}>
            <FaChevronRight />
          </button>

          <div className="carousel-dots">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="quick-stats">
        <div className="container">
          <div className="stats-grid">
            {achievements.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="programs-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              {homeT.programsTitle || "Our Academic Programs"}
            </h2>
            <p className="section-subtitle">
              {homeT.programsSubtitle ||
                "Comprehensive education for every stage of development"}
            </p>
          </div>
          <div className="programs-grid">
            {programs.map((program, index) => (
              <div key={index} className="program-card">
                <div className="program-icon">{program.icon}</div>
                <h3 className="program-title">{program.title}</h3>
                <p className="program-age">{program.age}</p>
                <p className="program-description">{program.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="extracurricular-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              {homeT.beyondAcademics || "Beyond Academics"}
            </h2>
            <p className="section-subtitle">
              {homeT.beyondAcademicsSubtitle ||
                "Holistic development through diverse activities"}
            </p>
          </div>
          <div className="extracurricular-grid">
            {extracurriculars.map((item, index) => (
              <div key={index} className="extracurricular-card">
                <div className="extracurricular-icon">{item.icon}</div>
                <h3>{item.name}</h3>
                <p>{item.activities}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="events-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              {homeT.upcomingEvents || "Upcoming Events"}
            </h2>
            <p className="section-subtitle">
              {homeT.upcomingEventsSubtitle ||
                "Stay updated with our school activities and celebrations"}
            </p>
          </div>

          {loadingEvents ? (
            <div className="events-loading">
              <FaSpinner className="spinner" />
              <p>{homeT.loadingEvents || "Loading events..."}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="events-empty">
              <p>{homeT.noEvents || "No upcoming events at the moment."}</p>
            </div>
          ) : (
            <div className="events-carousel-container">
              {pagedEvents.length > 1 && (
                <button className="event-nav-btn prev" onClick={prevEventSlide}>
                  <FaChevronLeft />
                </button>
              )}

              <div className="events-carousel">
                <div
                  className="events-track"
                  style={{
                    transform: `translateX(-${currentEventSlide * 100}%)`,
                  }}
                >
                  {pagedEvents.map((page, pageIndex) => (
                    <div key={pageIndex} className="events-page">
                      {page.map((event) => (
                        <div key={event.id} className="event-card">
                          <div className="event-image">
                            <img
                              src={
                                event.imageUrl ||
                                "https://images.pexels.com/photos/8471814/pexels-photo-8471814.jpeg?auto=compress&cs=tinysrgb&w=1200"
                              }
                              alt={event.title}
                            />
                          </div>
                          <div className="event-content">
                            <h3>{event.title}</h3>
                            <p className="event-date">
                              <FaCalendarAlt className="me-2" />
                              {formatDate(event.eventDate)}
                            </p>
                            {event.eventTime && (
                              <p className="event-time">
                                <FaClock className="me-2" />
                                {event.eventTime}
                              </p>
                            )}
                            {event.location && (
                              <p className="event-location">
                                <FaMapMarkerAlt />
                                {event.location}
                              </p>
                            )}
                            <p>{event.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {pagedEvents.length > 1 && (
                <button className="event-nav-btn next" onClick={nextEventSlide}>
                  <FaChevronRight />
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="map-contact-section">
        <div className="container">
          <div className="map-contact-grid">
            <div className="contact-info">
              <h2 className="section-title">
                {homeT.visitCampus || "Visit Our Campus"}
              </h2>
              <p className="contact-description">
                {homeT.visitCampusText ||
                  "Come see our state-of-the-art facilities and meet our dedicated team."}
              </p>

              <div className="contact-details">
                <div className="contact-item">
                  <FaMapMarkerAlt className="contact-icon" />
                  <div>
                    <h4>{homeT.address || "Address"}</h4>
                    <p>
                      12 Bishop Shanahan Fegge, Onitsha, Anambra State, Nigeria
                    </p>
                  </div>
                </div>

                <div className="contact-item">
                  <FaPhone className="contact-icon" />
                  <div>
                    <h4>{homeT.phone || "Phone"}</h4>
                    <p>+234 903 017 5230</p>
                  </div>
                </div>

                <div className="contact-item">
                  <FaEnvelope className="contact-icon" />
                  <div>
                    <h4>{homeT.email || "Email"}</h4>
                    <p>info@faithfoundation.edu.ng</p>
                  </div>
                </div>

                <div className="contact-item">
                  <FaClock className="contact-icon" />
                  <div>
                    <h4>{homeT.officeHours || "Office Hours"}</h4>
                    <p>{footerT.officeHours || "Mon-Fri: 8:00 AM - 5:00 PM"}</p>
                  </div>
                </div>
              </div>

              <div className="social-links">
                <a href="#" className="social-link" aria-label="Facebook">
                  <FaFacebook />
                </a>
                <a href="#" className="social-link" aria-label="Twitter">
                  <FaTwitter />
                </a>
                <a href="#" className="social-link" aria-label="Instagram">
                  <FaInstagram />
                </a>
                <a href="#" className="social-link" aria-label="LinkedIn">
                  <FaLinkedin />
                </a>
              </div>
            </div>

            <div className="map-container">
              <iframe
                title="Faith Foundation School Location"
                src="https://www.google.com/maps?q=Onitsha,+Anambra,+Nigeria&output=embed"
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;

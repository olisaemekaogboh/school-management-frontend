import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaBook,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaTrophy,
  FaCalendarAlt,
  FaUsers,
  FaArrowRight,
  FaStar,
  FaQuoteLeft,
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
} from "react-icons/fa";
import { eventAPI } from "../services/api";
import { toast } from "react-toastify";
import "./Home.css";

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentEventSlide, setCurrentEventSlide] = useState(0);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const heroSlides = [
    {
      image:
        "https://images.pexels.com/photos/2076917/pexels-photo-2076917.jpeg?auto=compress&cs=tinysrgb&w=1600",
      title: "Welcome to FFIS",
      subtitle: "Faith Foundation International School",
      description:
        "Empowering the next generation of African leaders through quality education and innovation",
    },
    {
      image:
        "https://images.pexels.com/photos/3147268/pexels-photo-3147268.jpeg?auto=compress&cs=tinysrgb&w=1600",
      title: "Excellence in Education",
      subtitle: "Modern Learning Environment",
      description:
        "State-of-the-art facilities and cutting-edge technology for optimal learning in Africa",
    },
    {
      image:
        "https://images.pexels.com/photos/2422294/pexels-photo-2422294.jpeg?auto=compress&cs=tinysrgb&w=1600",
      title: "African Heritage & Culture",
      subtitle: "Celebrating Our Roots",
      description:
        "Preserving African heritage while preparing students for global success",
    },
    {
      image:
        "https://images.pexels.com/photos/2166719/pexels-photo-2166719.jpeg?auto=compress&cs=tinysrgb&w=1600",
      title: "Innovation Hub",
      subtitle: "Technology-Driven Learning",
      description:
        "Equipping students with 21st-century skills for a digital future",
    },
  ];

  const programs = [
    {
      icon: <FaGraduationCap />,
      title: "Kindergarten/Nursery",
      age: "Ages 0-5",
      description: "Nurturing curiosity and foundational skills",
    },
    {
      icon: <FaBook />,
      title: "Primary School",
      age: "Grades 1-6",
      description: "Building strong academic foundations",
    },
    {
      icon: <FaFlask />,
      title: "Junior Secondary",
      age: "Grades 7-9",
      description: "Exploring interests and developing critical thinking",
    },
    {
      icon: <FaLaptopCode />,
      title: "Senior Secondary",
      age: "Grades 9-12",
      description: "College preparation and career guidance",
    },
  ];

  const extracurriculars = [
    {
      icon: <FaFutbol />,
      name: "Sports",
      activities: "Football, Volleyball, Athletics",
    },
    {
      icon: <FaMusic />,
      name: "Arts",
      activities: "African Drumming, Dance, Drama, Visual Arts",
    },
    {
      icon: <FaFlask />,
      name: "STEM",
      activities: "Robotics, Science Club, Coding",
    },
    {
      icon: <FaUsers />,
      name: "Leadership",
      activities: "Student Council, Debate, Model UN",
    },
  ];

  const achievements = [
    { value: "95%", label: "Graduation Rate", icon: <FaGraduationCap /> },
    { value: "50+", label: "Awards Won", icon: <FaAward /> },
    { value: "1000+", label: "Students", icon: <FaUsers /> },
    { value: "98%", label: "Parent Satisfaction", icon: <FaHeart /> },
  ];

  // Fetch events from API - Public access
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        const response = await eventAPI.getUpcomingEvents();
        setEvents(response.data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
        // Don't show toast for public users, just set empty array
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
    setCurrentEventSlide((prev) => (prev + 1) % Math.ceil(events.length / 3));
  };

  const prevEventSlide = () => {
    setCurrentEventSlide(
      (prev) =>
        (prev - 1 + Math.ceil(events.length / 3)) %
        Math.ceil(events.length / 3),
    );
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="home-container">
      {/* Hero Carousel Section */}
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
                    Get Started <FaArrowRight className="ms-2" />
                  </Link>
                  <Link to="/about" className="btn-outline-home">
                    Learn More
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

      {/* Quick Stats */}
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

      {/* Academic Programs */}
      <section className="programs-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Academic Programs</h2>
            <p className="section-subtitle">
              Comprehensive education for every stage of development
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

      {/* Extracurricular Activities */}
      <section className="extracurricular-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Beyond Academics</h2>
            <p className="section-subtitle">
              Holistic development through diverse activities
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

      {/* Events Carousel - Public Access */}
      <section className="events-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Upcoming Events</h2>
            <p className="section-subtitle">
              Stay updated with our school activities and celebrations
            </p>
          </div>
          {loadingEvents ? (
            <div className="events-loading">
              <FaSpinner className="spinner" />
              <p>Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="no-events">
              <p>No upcoming events at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="events-carousel-container">
              <button className="event-nav-btn prev" onClick={prevEventSlide}>
                <FaChevronLeft />
              </button>
              <div className="events-carousel">
                <div
                  className="events-track"
                  style={{
                    transform: `translateX(-${currentEventSlide * 100}%)`,
                  }}
                >
                  {Array.from({ length: Math.ceil(events.length / 3) }).map(
                    (_, pageIndex) => (
                      <div key={pageIndex} className="events-page">
                        {events
                          .slice(pageIndex * 3, pageIndex * 3 + 3)
                          .map((event, eventIndex) => (
                            <div
                              key={event.id || eventIndex}
                              className="event-card"
                            >
                              <div className="event-image">
                                <img
                                  src={
                                    event.imageUrl ||
                                    "https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=400"
                                  }
                                  alt={event.title}
                                />
                              </div>
                              <div className="event-content">
                                <h3>{event.title}</h3>
                                <p className="event-date">
                                  <FaCalendarAlt className="event-icon" />{" "}
                                  {formatDate(event.eventDate)}
                                </p>
                                {event.eventTime && (
                                  <p className="event-time">
                                    <FaClock className="event-icon" />{" "}
                                    {event.eventTime}
                                  </p>
                                )}
                                <p className="event-location">
                                  <FaMapMarkerAlt className="event-icon" />{" "}
                                  {event.location}
                                </p>
                                {event.description && (
                                  <p className="event-description">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    ),
                  )}
                </div>
              </div>
              <button className="event-nav-btn next" onClick={nextEventSlide}>
                <FaChevronRight />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Map and Contact Section */}
      <section className="map-contact-section">
        <div className="container">
          <div className="map-contact-grid">
            <div className="contact-info">
              <h2 className="section-title">Visit Our Campus</h2>
              <p className="contact-description">
                Come see our state-of-the-art facilities and meet our dedicated
                team.
              </p>
              <div className="contact-details">
                <div className="contact-item">
                  <FaMapMarkerAlt className="contact-icon" />
                  <div>
                    <h4>Address</h4>
                    <p>
                      12 Bishop Shanahan Fegge, Onitsha, Anambra State, Nigeria
                    </p>
                  </div>
                </div>
                <div className="contact-item">
                  <FaPhone className="contact-icon" />
                  <div>
                    <h4>Phone</h4>
                    <p>+234 903 017 5230</p>
                    <p>+234 816 547 3400</p>
                  </div>
                </div>
                <div className="contact-item">
                  <FaEnvelope className="contact-icon" />
                  <div>
                    <h4>Email</h4>
                    <p>info@ffis.edu.ng</p>
                    <p>admissions@ffis.edu.ng</p>
                  </div>
                </div>
                <div className="contact-item">
                  <FaClock className="contact-icon" />
                  <div>
                    <h4>Office Hours</h4>
                    <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                  </div>
                </div>
              </div>
              <div className="social-links">
                <a href="#" className="social-link">
                  <FaFacebook />
                </a>
                <a href="#" className="social-link">
                  <FaTwitter />
                </a>
                <a href="#" className="social-link">
                  <FaInstagram />
                </a>
                <a href="#" className="social-link">
                  <FaLinkedin />
                </a>
              </div>
            </div>
            <div className="map-container">
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

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">What Our Community Says</h2>
            <p className="section-subtitle">
              Hear from parents, students, and teachers about their experience
            </p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <FaQuoteLeft className="quote-icon" />
              <p className="testimonial-content">
                "Faith Foundation has transformed my child's education. The
                teachers are dedicated, and the facilities are world-class."
              </p>
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="star-filled" />
                ))}
              </div>
              <h4 className="testimonial-name">Soludo Charles</h4>
              <p className="testimonial-role">Parent</p>
            </div>
            <div className="testimonial-card">
              <FaQuoteLeft className="quote-icon" />
              <p className="testimonial-content">
                "The digital library and online resources have made learning so
                much more engaging. I love studying here!"
              </p>
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="star-filled" />
                ))}
              </div>
              <h4 className="testimonial-name">Ogboh Olisa</h4>
              <p className="testimonial-role">Student, Primary 6</p>
            </div>
            <div className="testimonial-card">
              <FaQuoteLeft className="quote-icon" />
              <p className="testimonial-content">
                "Working at FFIS has been incredibly rewarding. The supportive
                environment and innovative approach to education are
                outstanding."
              </p>
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="star-filled" />
                ))}
              </div>
              <h4 className="testimonial-name">Mr. Ikechukwu Mbah</h4>
              <p className="testimonial-role">Science Teacher</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Join FFIS?</h2>
            <p className="cta-description">
              Take the first step towards an exceptional education. Admissions
              are now open!
            </p>
            <Link to="/register" className="btn-cta">
              Apply Now <FaArrowRight className="ms-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;

// src/components/Faq.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaQuestionCircle,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaHeadset,
  FaGraduationCap,
  FaMoneyBill,
  FaBus,
  FaLaptop,
  FaBook,
  FaCalendarAlt,
  FaUserGraduate,
  FaUsers,
  FaSchool,
  FaArrowRight,
} from "react-icons/fa";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import "./Faq.css";

function Faq() {
  const { t, language } = useLanguage();
  const { darkMode } = useDarkMode();
  const [searchTerm, setSearchTerm] = useState("");
  const [openQuestions, setOpenQuestions] = useState({});

  const faqCategories = [
    {
      id: "admissions",
      icon: <FaUserGraduate />,
      title: t.faq?.categories?.admissions || "Admissions",
      questions: [
        {
          q: t.faq?.admissions?.q1 || "How can I apply for admission?",
          a:
            t.faq?.admissions?.a1 ||
            "You can apply online through our admissions portal. Visit the Register page and fill out the application form. You'll need to upload your child's birth certificate, previous school records (if applicable), and passport photograph.",
        },
        {
          q: t.faq?.admissions?.q2 || "What are the admission requirements?",
          a:
            t.faq?.admissions?.a2 ||
            "Requirements include: completed application form, birth certificate, previous school records (for transfer students), passport photographs, and successful completion of entrance assessment.",
        },
        {
          q: t.faq?.admissions?.q3 || "Is there an entrance examination?",
          a:
            t.faq?.admissions?.a3 ||
            "Yes, prospective students undergo an entrance assessment in Mathematics, English, and General Knowledge. The assessment helps us place students in the appropriate class level.",
        },
        {
          q: t.faq?.admissions?.q4 || "When does the academic session start?",
          a:
            t.faq?.admissions?.a4 ||
            "The academic session typically begins in September. However, we also have mid-year admissions in January for available spaces. Contact admissions for specific dates.",
        },
      ],
    },
    {
      id: "academics",
      icon: <FaGraduationCap />,
      title: t.faq?.categories?.academics || "Academics",
      questions: [
        {
          q: t.faq?.academics?.q1 || "What curriculum do you follow?",
          a:
            t.faq?.academics?.a1 ||
            "We follow the Nigerian National Curriculum, integrated with British curriculum elements for certain subjects. This combination prepares students for both local and international examinations.",
        },
        {
          q: t.faq?.academics?.q2 || "What subjects are offered?",
          a:
            t.faq?.academics?.a2 ||
            "We offer a comprehensive range of subjects including Mathematics, English, Sciences, Social Studies, Computer Science, French, and various vocational subjects. Specialized subjects are available for senior secondary students.",
        },
        {
          q: t.faq?.academics?.q3 || "Do you offer foreign languages?",
          a:
            t.faq?.academics?.a3 ||
            "Yes, we offer French as a compulsory subject from Primary 1. We also offer Spanish as an elective for senior secondary students. Our language program includes cultural exchange activities.",
        },
        {
          q: t.faq?.academics?.q4 || "How are students assessed?",
          a:
            t.faq?.academics?.a4 ||
            "Students are assessed through continuous assessment (assignments, projects, tests) and end-of-term examinations. We provide detailed report cards and parent-teacher conferences to discuss progress.",
        },
      ],
    },
    {
      id: "fees",
      icon: <FaMoneyBill />,
      title: t.faq?.categories?.fees || "School Fees",
      questions: [
        {
          q: t.faq?.fees?.q1 || "What are the school fees?",
          a:
            t.faq?.fees?.a1 ||
            "School fees vary by class level. Please contact our admissions office for the current fee structure. We offer payment plans and early payment discounts. Fees cover tuition, books, and extracurricular activities.",
        },
        {
          q: t.faq?.fees?.q2 || "Are there payment plans available?",
          a:
            t.faq?.fees?.a2 ||
            "Yes, we offer flexible payment plans including termly payments. Parents can also pay in installments with prior arrangement. Late payment fees apply after the deadline.",
        },
        {
          q: t.faq?.fees?.q3 || "What is included in the fees?",
          a:
            t.faq?.fees?.a3 ||
            "Fees cover tuition, textbooks, workbooks, sports participation, and most extracurricular activities. Additional costs include uniforms, field trips, and optional activities like music lessons.",
        },
        {
          q: t.faq?.fees?.q4 || "Is there a sibling discount?",
          a:
            t.faq?.fees?.a4 ||
            "Yes, we offer a 5% sibling discount for the second child and 10% for the third child onward. This applies to tuition fees only and requires all siblings to be enrolled simultaneously.",
        },
      ],
    },
    {
      id: "transport",
      icon: <FaBus />,
      title: t.faq?.categories?.transport || "Transportation",
      questions: [
        {
          q: t.faq?.transport?.q1 || "Does the school offer transportation?",
          a:
            t.faq?.transport?.a1 ||
            "Yes, we provide school bus services for students within designated routes. Our buses are equipped with GPS tracking and have trained drivers and attendants for student safety.",
        },
        {
          q: t.faq?.transport?.q2 || "What areas do the buses cover?",
          a:
            t.faq?.transport?.a2 ||
            "Our buses cover major areas including Fegge, 33, Onitsha Main Market, Awada, and surrounding neighborhoods. Contact the transport office for specific route information.",
        },
        {
          q: t.faq?.transport?.q3 || "How can I track my child's bus?",
          a:
            t.faq?.transport?.a3 ||
            "Parents can track buses through our mobile app. You'll receive real-time location updates, estimated arrival times, and notifications when your child boards or alights the bus.",
        },
        {
          q: t.faq?.transport?.q4 || "What are the transport fees?",
          a:
            t.faq?.transport?.a4 ||
            "Transport fees vary by route distance and are charged termly. They can be paid alongside school fees. Discounts are available for siblings using the transport service.",
        },
      ],
    },
    {
      id: "technology",
      icon: <FaLaptop />,
      title: t.faq?.categories?.technology || "Technology",
      questions: [
        {
          q: t.faq?.technology?.q1 || "Do students use computers?",
          a:
            t.faq?.technology?.a1 ||
            "Yes, we have a well-equipped computer laboratory. Students from Primary 3 upwards have regular computer classes. We also integrate technology into other subjects.",
        },
        {
          q: t.faq?.technology?.q2 || "Is there internet access?",
          a:
            t.faq?.technology?.a2 ||
            "Yes, the school has high-speed internet connectivity for educational purposes. Students use the internet for research, online learning platforms, and digital projects under supervision.",
        },
        {
          q: t.faq?.technology?.q3 || "What about remote learning?",
          a:
            t.faq?.technology?.a3 ||
            "We have a robust remote learning platform that allows students to continue learning from home when needed. The platform includes video lessons, assignments, and virtual classrooms.",
        },
        {
          q: t.faq?.technology?.q4 || "Do you teach coding?",
          a:
            t.faq?.technology?.a4 ||
            "Yes, we offer coding and robotics as extracurricular activities. Students learn programming languages like Scratch, Python, and participate in robotics competitions.",
        },
      ],
    },
  ];

  const filteredCategories = faqCategories
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.a.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter((category) => category.questions.length > 0);

  const toggleQuestion = (categoryId, questionIndex) => {
    const key = `${categoryId}-${questionIndex}`;
    setOpenQuestions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className={`faq-page ${darkMode ? "dark" : "light"}`}>
      {/* Hero Section */}
      <section className="faq-hero">
        <div className="faq-container">
          <div className="hero-content">
            <span className="hero-badge">FAQ</span>
            <h1 className="hero-title">
              {t.faq?.title || "Frequently Asked Questions"}
            </h1>
            <p className="hero-description">
              {t.faq?.subtitle ||
                "Find answers to common questions about our school"}
            </p>
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder={t.faq?.searchPlaceholder || "Search questions..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="faq-content">
        <div className="faq-container">
          {filteredCategories.length === 0 ? (
            <div className="no-results">
              <FaQuestionCircle />
              <h3>{t.faq?.noResults || "No questions found"}</h3>
              <p>
                {t.faq?.noResultsMessage ||
                  "Try searching with different keywords"}
              </p>
              <button onClick={() => setSearchTerm("")} className="btn-reset">
                {t.faq?.clearSearch || "Clear Search"}
              </button>
            </div>
          ) : (
            <div className="faq-grid">
              {filteredCategories.map((category, catIndex) => (
                <div key={category.id} className="faq-category">
                  <div className="category-header">
                    <div className="category-icon">{category.icon}</div>
                    <h2>{category.title}</h2>
                  </div>
                  <div className="category-questions">
                    {category.questions.map((question, qIndex) => {
                      const isOpen = openQuestions[`${category.id}-${qIndex}`];
                      return (
                        <div
                          key={qIndex}
                          className={`question-item ${isOpen ? "open" : ""}`}
                        >
                          <button
                            className="question-button"
                            onClick={() => toggleQuestion(category.id, qIndex)}
                          >
                            <span className="question-text">{question.q}</span>
                            {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                          </button>
                          {isOpen && (
                            <div className="answer-content">
                              <p>{question.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Still Have Questions Section */}
      <section className="faq-contact">
        <div className="faq-container">
          <div className="contact-card">
            <FaHeadset className="contact-icon" />
            <h2>{t.faq?.stillQuestions || "Still Have Questions?"}</h2>
            <p>
              {t.faq?.contactMessage ||
                "Can't find what you're looking for? Our team is here to help."}
            </p>
            <Link to="/contact" className="btn-contact">
              {t.faq?.contactUs || "Contact Us"} <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Faq;

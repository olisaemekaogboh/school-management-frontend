import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentAPI, resultAPI, teacherAPI } from "../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import {
  FaPlus,
  FaEye,
  FaChartLine,
  FaSave,
  FaTrash,
  FaPrint,
  FaSearch,
  FaSpinner,
  FaInfoCircle,
} from "react-icons/fa";
import moment from "moment";
import "./ResultManagement.css";

function ResultManagement() {
  const navigate = useNavigate();
  const { user, isAdmin, isTeacher, isStudent, isParent } = useAuth();

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [session, setSession] = useState("2025/2026");
  const [term, setTerm] = useState("FIRST");
  const [subjects, setSubjects] = useState([]);
  const [resultSheet, setResultSheet] = useState(null);
  const [rankings, setRankings] = useState(null);
  const [activeTab, setActiveTab] = useState(isStudent ? "view" : "input");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [rankingsType, setRankingsType] = useState("school");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedArm, setSelectedArm] = useState("");
  const [teacherClasses, setTeacherClasses] = useState([]);

  const subjectList = [
    "Mathematics",
    "English Language",
    "Biology",
    "Chemistry",
    "Physics",
    "Economics",
    "Government",
    "Literature in English",
    "History",
    "Geography",
    "Agricultural Science",
    "Further Mathematics",
    "Computer Science",
    "Civic Education",
    "Christian Religious Studies",
    "Islamic Studies",
    "Yoruba Language",
    "Hausa Language",
    "Igbo Language",
    "French",
    "Physical Education",
    "Basic Science",
    "Basic Technology",
    "Business Studies",
    "Home Economics",
    "Music",
    "Fine Arts",
  ];

  const sessions = ["2023/2024", "2024/2025", "2025/2026", "2026/2027"];
  const terms = ["FIRST", "SECOND", "THIRD"];
  const classes = [
    "Nursery",
    "Primary 1",
    "Primary 2",
    "Primary 3",
    "Primary 4",
    "Primary 5",
    "Primary 6",
    "JSS 1",
    "JSS 2",
    "JSS 3",
    "SSS 1",
    "SSS 2",
    "SSS 3",
  ];

  const safeNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const safeFixed = (value, digits = 2) => {
    return safeNumber(value, 0).toFixed(digits);
  };

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;

    const q = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(q) ||
        s.admissionNumber?.toLowerCase().includes(q) ||
        s.studentClass?.toLowerCase().includes(q),
    );
  }, [students, searchTerm]);

  const availableRankingClasses = useMemo(() => {
    if (isAdmin) return classes;
    if (isTeacher) return teacherClasses;
    return [];
  }, [isAdmin, isTeacher, teacherClasses]);

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      if (isParent) {
        setStudents([]);
        return;
      }

      if (isStudent && user?.studentId) {
        const response = await studentAPI.getStudentById(user.studentId);
        const me = response.data;
        const oneStudent = [me];

        setStudents(oneStudent);
        setSelectedStudent(me);
        setActiveTab("view");
        return;
      }

      if (isTeacher) {
        let allowedClasses = [];

        try {
          const teacherProfile = await teacherAPI.getMyTeacherProfile();
          allowedClasses =
            teacherProfile.data?.assignedClasses?.map((c) => c.className) ||
            teacherProfile.data?.classNames ||
            [];
        } catch (error) {
          console.error("Error loading teacher classes:", error);
        }

        setTeacherClasses(allowedClasses);

        if (allowedClasses.length === 0) {
          setStudents([]);
          return;
        }

        const responses = await Promise.all(
          allowedClasses.map((className) =>
            studentAPI.getStudentsByClass(className),
          ),
        );

        const combined = responses.flatMap((res) => res.data || []);
        const uniqueStudents = Array.from(
          new Map(combined.map((student) => [student.id, student])).values(),
        );

        setStudents(uniqueStudents);

        if (allowedClasses.length === 1) {
          setSelectedClass(allowedClasses[0]);
        }

        return;
      }

      const response = await studentAPI.getAllStudents();
      setStudents(response.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = () => {
    setSubjects((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        name: "",
        resumptionTest: 0,
        assignments: 0,
        project: 0,
        midtermTest: 0,
        secondTest: 0,
        examination: 0,
      },
    ]);
  };

  const handleSubjectChange = (id, field, value) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === id
          ? {
              ...subject,
              [field]: field === "name" ? value : parseFloat(value) || 0,
            }
          : subject,
      ),
    );
  };

  const handleRemoveSubject = (id) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const calculateSubjectTotal = (subject) => {
    const ca =
      safeNumber(subject.resumptionTest) +
      safeNumber(subject.assignments) +
      safeNumber(subject.project) +
      safeNumber(subject.midtermTest) +
      safeNumber(subject.secondTest);

    return ca + safeNumber(subject.examination);
  };

  const validateScores = (subject) => {
    if (safeNumber(subject.resumptionTest) > 5) return false;
    if (safeNumber(subject.assignments) > 10) return false;
    if (safeNumber(subject.project) > 10) return false;
    if (safeNumber(subject.midtermTest) > 10) return false;
    if (safeNumber(subject.secondTest) > 5) return false;
    if (safeNumber(subject.examination) > 60) return false;
    return true;
  };

  const handleSubmitResults = async () => {
    if (!(isAdmin || isTeacher)) {
      toast.error("You are not allowed to enter results");
      return;
    }

    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }

    if (subjects.length === 0) {
      toast.error("Please add at least one subject");
      return;
    }

    for (const subject of subjects) {
      if (!subject.name) {
        toast.error("Please select a subject for all entries");
        return;
      }
      if (!validateScores(subject)) {
        toast.error(`Scores exceed maximum for ${subject.name}`);
        return;
      }
    }

    setLoading(true);

    try {
      let successCount = 0;

      for (const subject of subjects) {
        const resultData = {
          studentId: selectedStudent.id,
          subject: subject.name,
          session,
          term,
          resumptionTest: safeNumber(subject.resumptionTest),
          assignments: safeNumber(subject.assignments),
          project: safeNumber(subject.project),
          midtermTest: safeNumber(subject.midtermTest),
          secondTest: safeNumber(subject.secondTest),
          examination: safeNumber(subject.examination),
          remarks: "",
        };

        await resultAPI.addOrUpdateResultDTO(resultData);
        successCount++;
      }

      toast.success(`${successCount} subject(s) saved successfully`);
      setSubjects([]);

      if (activeTab === "view") {
        await fetchStudentResult();
      }
    } catch (error) {
      console.error("Error saving results:", error);
      toast.error(error?.response?.data?.message || "Failed to save results");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentResult = async () => {
    setLoading(true);

    try {
      if (isStudent) {
        const response = await resultAPI.getMyTermResult(session, term);
        setResultSheet(response.data);
        toast.success("Result loaded successfully");
        return;
      }

      if (!selectedStudent) {
        toast.error("Please select a student");
        return;
      }

      const response = await resultAPI.getTermResult(
        selectedStudent.id,
        session,
        term,
      );
      setResultSheet(response.data);
      toast.success("Result loaded successfully");
    } catch (error) {
      console.error("Error fetching result:", error);
      setResultSheet(null);
      toast.info("No results found for the selected term");
    } finally {
      setLoading(false);
    }
  };

  const fetchRankings = async () => {
    if (!(isAdmin || isTeacher)) {
      toast.error("You are not allowed to view rankings");
      return;
    }

    setLoading(true);
    try {
      let response;

      if (rankingsType === "school") {
        response = await resultAPI.getSchoolRankings(session, term);
      } else if (rankingsType === "class" && selectedClass) {
        response = await resultAPI.getClassRankings(
          selectedClass,
          session,
          term,
        );
      } else if (rankingsType === "arm" && selectedClass && selectedArm) {
        response = await resultAPI.getArmRankings(
          selectedClass,
          selectedArm,
          session,
          term,
        );
      } else {
        toast.error("Please select all required fields");
        setLoading(false);
        return;
      }

      setRankings(response.data);
      toast.success("Rankings loaded successfully");
    } catch (error) {
      console.error("Error fetching rankings:", error);
      toast.error("Failed to load rankings");
    } finally {
      setLoading(false);
    }
  };

  const viewResultSheet = () => {
    const targetStudent = isStudent
      ? selectedStudent || students[0]
      : selectedStudent;

    if (!targetStudent) {
      toast.error("Please select a student");
      return;
    }

    const sessionParts = session.split("/");
    if (sessionParts.length !== 2) {
      toast.error("Invalid session format");
      return;
    }

    const [year, termPart] = sessionParts;

    navigate(`/results/${targetStudent.id}/${year}/${termPart}/${term}`);
  };

  const clearForm = () => {
    setSubjects([]);
    setResultSheet(null);
    setSearchTerm("");

    if (!isStudent) {
      setSelectedStudent(null);
    }
  };

  const getGradeBadge = (grade) => {
    const colors = {
      A: "bg-success",
      B: "bg-primary",
      C: "bg-info",
      D: "bg-warning",
      E: "bg-secondary",
      F: "bg-danger",
    };
    return colors[grade] || "bg-secondary";
  };

  if (isParent) {
    return (
      <div className="result-management">
        <div className="alert alert-info">
          Please access your ward&apos;s results from the Parent Dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="result-management">
      <div className="content-header">
        <h2>
          <FaChartLine className="me-2" /> Result Management System
        </h2>
        <p className="text-muted">
          {isStudent
            ? "View your academic results"
            : isTeacher
              ? "Enter and view results for your class"
              : "Enter, view and analyze student results"}
        </p>
      </div>

      <div className="tabs-container">
        {(isAdmin || isTeacher) && (
          <button
            className={`tab-btn ${activeTab === "input" ? "active" : ""}`}
            onClick={() => setActiveTab("input")}
          >
            <FaPlus /> Input Results
          </button>
        )}

        <button
          className={`tab-btn ${activeTab === "view" ? "active" : ""}`}
          onClick={() => setActiveTab("view")}
        >
          <FaEye /> View Results
        </button>

        {(isAdmin || isTeacher) && (
          <button
            className={`tab-btn ${activeTab === "rankings" ? "active" : ""}`}
            onClick={() => setActiveTab("rankings")}
          >
            <FaChartLine /> Rankings
          </button>
        )}
      </div>

      {(isAdmin || isTeacher || isStudent) && activeTab !== "rankings" && (
        <div className="filters-section">
          <div className="filters-grid">
            {!isStudent && (
              <>
                <div className="filter-group">
                  <label>Search Student</label>
                  <div className="search-box">
                    <FaSearch />
                    <input
                      type="text"
                      placeholder="Search by name, admission or class..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="filter-group">
                  <label>Select Student</label>
                  <select
                    value={selectedStudent?.id || ""}
                    onChange={(e) => {
                      const student = students.find(
                        (s) => s.id === parseInt(e.target.value, 10),
                      );
                      setSelectedStudent(student || null);
                      setResultSheet(null);
                    }}
                  >
                    <option value="">Choose a student</option>
                    {filteredStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} - {s.admissionNumber} ({s.studentClass}{" "}
                        {s.classArm})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="filter-group">
              <label>Session</label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
              >
                {sessions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Term</label>
              <select value={term} onChange={(e) => setTerm(e.target.value)}>
                {terms.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === "input" && (isAdmin || isTeacher) && (
        <div className="input-results">
          <div className="section-header">
            <h3>
              Enter Scores for {selectedStudent?.fullName || "Selected Student"}
            </h3>
            <div className="header-actions">
              <button className="btn-secondary" onClick={clearForm}>
                Clear
              </button>
              <button className="btn-primary" onClick={handleAddSubject}>
                <FaPlus /> Add Subject
              </button>
            </div>
          </div>

          {!selectedStudent && (
            <div className="alert-info">
              <FaInfoCircle /> Please select a student from the dropdown above
              to enter results.
            </div>
          )}

          {selectedStudent && subjects.length === 0 && (
            <div className="alert-warning">
              <FaPlus /> No subjects added. Click "Add Subject" to start
              entering results.
            </div>
          )}

          {subjects.map((subject, index) => (
            <div key={subject.id} className="subject-card">
              <div className="subject-header">
                <h6>Subject {index + 1}</h6>
                <button
                  className="btn-icon btn-danger"
                  onClick={() => handleRemoveSubject(subject.id)}
                >
                  <FaTrash />
                </button>
              </div>

              <div className="subject-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Subject</label>
                    <select
                      value={subject.name}
                      onChange={(e) =>
                        handleSubjectChange(subject.id, "name", e.target.value)
                      }
                    >
                      <option value="">Select Subject</option>
                      {subjectList.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>RT (5)</label>
                    <input
                      type="number"
                      value={subject.resumptionTest}
                      onChange={(e) =>
                        handleSubjectChange(
                          subject.id,
                          "resumptionTest",
                          e.target.value,
                        )
                      }
                      min="0"
                      max="5"
                      step="0.5"
                    />
                  </div>

                  <div className="form-group">
                    <label>Ass (10)</label>
                    <input
                      type="number"
                      value={subject.assignments}
                      onChange={(e) =>
                        handleSubjectChange(
                          subject.id,
                          "assignments",
                          e.target.value,
                        )
                      }
                      min="0"
                      max="10"
                      step="0.5"
                    />
                  </div>

                  <div className="form-group">
                    <label>Proj (10)</label>
                    <input
                      type="number"
                      value={subject.project}
                      onChange={(e) =>
                        handleSubjectChange(
                          subject.id,
                          "project",
                          e.target.value,
                        )
                      }
                      min="0"
                      max="10"
                      step="0.5"
                    />
                  </div>

                  <div className="form-group">
                    <label>MT (10)</label>
                    <input
                      type="number"
                      value={subject.midtermTest}
                      onChange={(e) =>
                        handleSubjectChange(
                          subject.id,
                          "midtermTest",
                          e.target.value,
                        )
                      }
                      min="0"
                      max="10"
                      step="0.5"
                    />
                  </div>

                  <div className="form-group">
                    <label>2nd (5)</label>
                    <input
                      type="number"
                      value={subject.secondTest}
                      onChange={(e) =>
                        handleSubjectChange(
                          subject.id,
                          "secondTest",
                          e.target.value,
                        )
                      }
                      min="0"
                      max="5"
                      step="0.5"
                    />
                  </div>

                  <div className="form-group">
                    <label>Exam (60)</label>
                    <input
                      type="number"
                      value={subject.examination}
                      onChange={(e) =>
                        handleSubjectChange(
                          subject.id,
                          "examination",
                          e.target.value,
                        )
                      }
                      min="0"
                      max="60"
                      step="0.5"
                    />
                  </div>

                  <div className="form-group">
                    <label>Total</label>
                    <input
                      type="text"
                      className="total-field"
                      value={calculateSubjectTotal(subject).toFixed(1)}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {subjects.length > 0 && (
            <div className="form-actions">
              <button
                className="btn-success btn-large"
                onClick={handleSubmitResults}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spin" /> Saving...
                  </>
                ) : (
                  <>
                    <FaSave /> Save All Results ({subjects.length} subjects)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "view" && (
        <div className="view-results">
          <div className="section-header">
            <h3>{isStudent ? "My Results" : "View Student Results"}</h3>
            <div className="header-actions">
              <button
                className="btn-primary"
                onClick={fetchStudentResult}
                disabled={loading || (!isStudent && !selectedStudent)}
              >
                {loading ? <FaSpinner className="spin" /> : <FaEye />}
                Load Result
              </button>

              {resultSheet && (
                <button
                  className="btn-success"
                  onClick={viewResultSheet}
                  title="View printable result sheet"
                >
                  <FaPrint /> Printable Result
                </button>
              )}
            </div>
          </div>

          {resultSheet ? (
            <div className="result-card">
              <div className="result-header">
                <h4>Term Result Summary</h4>
              </div>

              <div className="result-body">
                <div className="student-info">
                  <div>
                    <p>
                      <strong>Student:</strong>{" "}
                      {resultSheet.studentInfo?.name ||
                        selectedStudent?.fullName ||
                        user?.firstName}
                    </p>
                    <p>
                      <strong>Admission:</strong>{" "}
                      {resultSheet.studentInfo?.admissionNumber ||
                        selectedStudent?.admissionNumber ||
                        "-"}
                    </p>
                    <p>
                      <strong>Class:</strong>{" "}
                      {resultSheet.studentInfo?.class ||
                        selectedStudent?.studentClass ||
                        "-"}{" "}
                      {resultSheet.studentInfo?.arm ||
                        selectedStudent?.classArm ||
                        ""}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Session:</strong> {session}
                    </p>
                    <p>
                      <strong>Term:</strong> {term}
                    </p>
                    <p>
                      <strong>Date:</strong> {moment().format("DD/MM/YYYY")}
                    </p>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>CA</th>
                        <th>Exam</th>
                        <th>Total</th>
                        <th>Grade</th>
                        <th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultSheet.subjects?.map((subject, index) => (
                        <tr key={index}>
                          <td className="fw-bold">{subject.subject}</td>
                          <td>{subject.continuousAssessment}</td>
                          <td>{subject.examination}</td>
                          <td className="fw-bold">{subject.total}</td>
                          <td>
                            <span
                              className={`badge ${getGradeBadge(subject.grade)}`}
                            >
                              {subject.grade}
                            </span>
                          </td>
                          <td>{subject.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="summary-cards">
                  <div className="summary-card">
                    <h6>Total Score</h6>
                    <p className="text-primary">
                      {safeNumber(resultSheet.summary?.totalScore)}
                    </p>
                  </div>
                  <div className="summary-card">
                    <h6>Average</h6>
                    <p className="text-success">
                      {safeFixed(resultSheet.summary?.average, 2)}%
                    </p>
                  </div>
                  <div className="summary-card">
                    <h6>Class Position</h6>
                    <p className="text-warning">
                      {resultSheet.summary?.positionInClass || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert-info">
              {isStudent
                ? 'Click "Load Result" to view your result.'
                : selectedStudent
                  ? 'Click "Load Result" to view results for this student.'
                  : "Please select a student to view results."}
            </div>
          )}
        </div>
      )}

      {activeTab === "rankings" && (isAdmin || isTeacher) && (
        <div className="rankings-tab">
          <div className="filters-row">
            <select
              className="form-select"
              value={rankingsType}
              onChange={(e) => setRankingsType(e.target.value)}
            >
              <option value="school">School Rankings</option>
              <option value="class">Class Rankings</option>
              <option value="arm">Class Arm Rankings</option>
            </select>

            {rankingsType !== "school" && (
              <select
                className="form-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select Class</option>
                {availableRankingClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {rankingsType === "arm" && (
              <select
                className="form-select"
                value={selectedArm}
                onChange={(e) => setSelectedArm(e.target.value)}
              >
                <option value="">Select Arm</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            )}

            <button
              className="btn-primary"
              onClick={fetchRankings}
              disabled={loading}
            >
              {loading ? <FaSpinner className="spin" /> : <FaChartLine />}
              View Rankings
            </button>
          </div>

          {rankings && (
            <div className="rankings-card">
              <div className="rankings-header">
                <h4>
                  {rankings.className
                    ? `${rankings.className} ${rankings.arm || ""} `
                    : "School "}
                  Rankings - {rankings.term} Term {rankings.session}
                </h4>
              </div>

              <div className="rankings-body">
                <div className="table-responsive">
                  <table className="rankings-table">
                    <thead>
                      <tr>
                        <th>Position</th>
                        <th>Student Name</th>
                        <th>Admission No</th>
                        <th>Class</th>
                        <th>Arm</th>
                        <th>Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.rankings?.map((rank, index) => (
                        <tr key={index}>
                          <td>
                            {rank.position === 1 && "🥇 "}
                            {rank.position === 2 && "🥈 "}
                            {rank.position === 3 && "🥉 "}
                            <strong>{rank.position}</strong>
                          </td>
                          <td>{rank.studentName}</td>
                          <td>{rank.admissionNumber}</td>
                          <td>{rank.class}</td>
                          <td>{rank.arm}</td>
                          <td>
                            <strong className="text-success">
                              {safeFixed(rank.average, 2)}%
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="total-count">
                  Total Students: {safeNumber(rankings.totalStudents)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ResultManagement;

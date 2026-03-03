// src/components/ResultManagement.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { studentAPI, resultAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaEye,
  FaChartLine,
  FaSave,
  FaTrash,
  FaPrint,
  FaDownload,
  FaArrowLeft,
  FaSearch,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaEdit,
  FaFilePdf,
  FaFileExcel,
  FaFilter,
  FaSync,
} from "react-icons/fa";
import moment from "moment";
import "./ResultManagement.css"; // We'll create this

function ResultManagement() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [session, setSession] = useState("2025/2026");
  const [term, setTerm] = useState("FIRST");
  const [subjects, setSubjects] = useState([]);
  const [resultSheet, setResultSheet] = useState(null);
  const [rankings, setRankings] = useState(null);
  const [activeTab, setActiveTab] = useState("input");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [rankingsType, setRankingsType] = useState("school");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedArm, setSelectedArm] = useState("");

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

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = students.filter(
        (s) =>
          s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.studentClass?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      const response = await studentAPI.getAllStudents();
      setStudents(response.data);
      setFilteredStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    }
  };

  const handleAddSubject = () => {
    setSubjects([
      ...subjects,
      {
        id: Date.now(),
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
    const updatedSubjects = subjects.map((subject) =>
      subject.id === id
        ? {
            ...subject,
            [field]: field === "name" ? value : parseFloat(value) || 0,
          }
        : subject,
    );
    setSubjects(updatedSubjects);
  };

  const handleRemoveSubject = (id) => {
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  const calculateSubjectTotal = (subject) => {
    const ca =
      (subject.resumptionTest || 0) +
      (subject.assignments || 0) +
      (subject.project || 0) +
      (subject.midtermTest || 0) +
      (subject.secondTest || 0);
    return ca + (subject.examination || 0);
  };

  const validateScores = (subject) => {
    if (subject.resumptionTest > 5) return false;
    if (subject.assignments > 10) return false;
    if (subject.project > 10) return false;
    if (subject.midtermTest > 10) return false;
    if (subject.secondTest > 5) return false;
    if (subject.examination > 60) return false;
    return true;
  };

  const handleSubmitResults = async () => {
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
    let successCount = 0;
    let failCount = 0;

    try {
      for (const subject of subjects) {
        const resultData = {
          studentId: selectedStudent.id,
          subject: subject.name,
          session: session,
          term: term,
          resumptionTest: Number(subject.resumptionTest) || 0,
          assignments: Number(subject.assignments) || 0,
          project: Number(subject.project) || 0,
          midtermTest: Number(subject.midtermTest) || 0,
          secondTest: Number(subject.secondTest) || 0,
          examination: Number(subject.examination) || 0,
          remarks: "",
        };

        await resultAPI.addOrUpdateResultDTO(resultData);
        successCount++;
      }

      toast.success(`${successCount} subject(s) saved successfully`);
      setSubjects([]);

      if (activeTab === "view") {
        fetchStudentResult();
      }
    } catch (error) {
      console.error("Error saving results:", error);
      toast.error("Failed to save results");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentResult = async () => {
    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }

    setLoading(true);
    try {
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
      toast.info("No results found for this student in the selected term");
    } finally {
      setLoading(false);
    }
  };

  const fetchRankings = async () => {
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
    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }

    const [year, termPart] = session.split("/");
    navigate(`/results/${selectedStudent.id}/${year}/${termPart}/${term}`);
  };

  const clearForm = () => {
    setSubjects([]);
    setSelectedStudent(null);
    setResultSheet(null);
    setSearchTerm("");
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

  return (
    <div className="result-management">
      <div className="content-header">
        <h2>
          <FaChartLine className="me-2" /> Result Management System
        </h2>
        <p className="text-muted">Enter, view and analyze student results</p>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === "input" ? "active" : ""}`}
          onClick={() => setActiveTab("input")}
        >
          <FaPlus /> Input Results
        </button>
        <button
          className={`tab-btn ${activeTab === "view" ? "active" : ""}`}
          onClick={() => setActiveTab("view")}
        >
          <FaEye /> View Results
        </button>
        <button
          className={`tab-btn ${activeTab === "rankings" ? "active" : ""}`}
          onClick={() => setActiveTab("rankings")}
        >
          <FaChartLine /> Rankings
        </button>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-grid">
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
                  (s) => s.id === parseInt(e.target.value),
                );
                setSelectedStudent(student);
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

      {/* Input Results Tab */}
      {activeTab === "input" && (
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
              <FaEye /> Please select a student from the dropdown above to enter
              results.
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

      {/* View Results Tab */}
      {activeTab === "view" && (
        <div className="view-results">
          <div className="section-header">
            <h3>View Student Results</h3>
            <div className="header-actions">
              <button
                className="btn-primary"
                onClick={fetchStudentResult}
                disabled={!selectedStudent || loading}
              >
                {loading ? <FaSpinner className="spin" /> : <FaEye />}
                Load Result
              </button>
              {resultSheet && (
                <button className="btn-success" onClick={viewResultSheet}>
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
                        selectedStudent?.fullName}
                    </p>
                    <p>
                      <strong>Admission:</strong>{" "}
                      {resultSheet.studentInfo?.admissionNumber ||
                        selectedStudent?.admissionNumber}
                    </p>
                    <p>
                      <strong>Class:</strong>{" "}
                      {resultSheet.studentInfo?.class ||
                        selectedStudent?.studentClass}{" "}
                      {resultSheet.studentInfo?.arm ||
                        selectedStudent?.classArm}
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
                      {resultSheet.summary?.totalScore || 0}
                    </p>
                  </div>
                  <div className="summary-card">
                    <h6>Average</h6>
                    <p className="text-success">
                      {resultSheet.summary?.average?.toFixed(2) || 0}%
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
              {selectedStudent
                ? 'Click "Load Result" to view results for this student.'
                : "Please select a student to view results."}
            </div>
          )}
        </div>
      )}

      {/* Rankings Tab */}
      {activeTab === "rankings" && (
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
                {classes.map((c) => (
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
                              {rank.average?.toFixed(2)}%
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="total-count">
                  Total Students: {rankings.totalStudents}
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

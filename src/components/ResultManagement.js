import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  resultAPI,
  sessionAPI,
  studentAPI,
  teacherAPI,
  parentPortalAPI,
  subjectAPI,
} from "../services/api";
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
  FaUserGraduate,
  FaUsers,
  FaBookOpen,
  FaSyncAlt,
} from "react-icons/fa";
import moment from "moment";
import "./ResultManagement.css";

function ResultManagement() {
  const navigate = useNavigate();
  const { user, isAdmin, isTeacher, isStudent, isParent } = useAuth();

  const [students, setStudents] = useState([]);
  const [parentWards, setParentWards] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [availableSessions, setAvailableSessions] = useState([]);
  const [activeSessionObj, setActiveSessionObj] = useState(null);
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("FIRST");

  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [resultSheet, setResultSheet] = useState(null);
  const [rankings, setRankings] = useState(null);

  const [activeTab, setActiveTab] = useState(() => {
    if (isStudent || isParent) return "view";
    return "input";
  });

  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rankingsType, setRankingsType] = useState("school");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedArm, setSelectedArm] = useState("");
  const [teacherClasses, setTeacherClasses] = useState([]);

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

  const getSessionName = (item) => {
    return item?.session || item?.sessionName || item?.name || "";
  };

  const sortSessions = (list) => {
    return [...list].sort((a, b) => {
      const aDate = new Date(a.startDate || 0).getTime();
      const bDate = new Date(b.startDate || 0).getTime();
      return bDate - aDate;
    });
  };

  const normalizedAvailableSessions = useMemo(() => {
    return (availableSessions || []).map((item) => ({
      id: item.id,
      session: getSessionName(item),
      term: item.currentTerm || item.term || "FIRST",
      active: item.active === true || item.isActive === true,
      startDate: item.startDate,
      endDate: item.endDate,
    }));
  }, [availableSessions]);

  const filteredStudents = useMemo(() => {
    const source = isParent ? parentWards : students;

    if (!searchTerm.trim()) return source;

    const q = searchTerm.toLowerCase();
    return source.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(q) ||
        `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase().includes(q) ||
        s.admissionNumber?.toLowerCase().includes(q) ||
        s.studentClass?.toLowerCase().includes(q),
    );
  }, [students, parentWards, searchTerm, isParent]);

  const availableRankingClasses = useMemo(() => {
    if (isAdmin) return classes;
    if (isTeacher) return teacherClasses;
    return [];
  }, [isAdmin, isTeacher, teacherClasses]);

  const sortedSubjects = useMemo(() => {
    return [...availableSubjects].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );
  }, [availableSubjects]);

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setResultSheet(null);
    setRankings(null);
  }, [
    session,
    term,
    selectedStudent,
    selectedClass,
    selectedArm,
    rankingsType,
  ]);

  const loadSessionData = async () => {
    setSessionsLoading(true);

    try {
      const [sessionsRes, activeRes] = await Promise.all([
        sessionAPI.getAllSessions(),
        sessionAPI.getActiveSession(),
      ]);

      const allSessions = Array.isArray(sessionsRes.data)
        ? sessionsRes.data
        : [];
      const sorted = sortSessions(allSessions);

      setAvailableSessions(sorted);

      const active = activeRes?.data || null;
      setActiveSessionObj(active);

      if (active) {
        setSession(getSessionName(active));
        setTerm(active.currentTerm || "FIRST");
      } else if (sorted.length > 0) {
        setSession(getSessionName(sorted[0]));
        setTerm(sorted[0].currentTerm || "FIRST");
      } else {
        setSession("");
        setTerm("FIRST");
      }
    } catch (error) {
      console.error("Error loading session data:", error);
      setAvailableSessions([]);
      setActiveSessionObj(null);
      toast.error("Failed to load session information");
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadSubjects = async () => {
    setSubjectsLoading(true);
    try {
      const response = await subjectAPI.getAllSubjects();
      setAvailableSubjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error loading subjects:", error);
      setAvailableSubjects([]);
      toast.error("Failed to load subjects");
    } finally {
      setSubjectsLoading(false);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);

    try {
      await Promise.all([loadSessionData(), loadSubjects()]);

      if (isParent) {
        await loadParentWards();
        return;
      }

      if (isStudent && user?.studentId) {
        await loadStudentSelf();
        return;
      }

      if (isTeacher) {
        await loadTeacherStudents();
        return;
      }

      await loadAdminStudents();
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.error("Failed to load result management data");
    } finally {
      setLoading(false);
    }
  };

  const loadParentWards = async () => {
    try {
      const response = await parentPortalAPI.getMyWards();
      const wards = response.data || [];
      setParentWards(wards);

      if (wards.length === 1) {
        setSelectedStudent(wards[0]);
      }

      setActiveTab("view");
    } catch (error) {
      console.error("Error loading parent wards:", error);
      setParentWards([]);
      toast.error("Failed to load your wards");
    }
  };

  const loadStudentSelf = async () => {
    try {
      const response = await studentAPI.getStudentById(user.studentId);
      const me = response.data;
      const oneStudent = me ? [me] : [];

      setStudents(oneStudent);
      setSelectedStudent(me || null);
      setActiveTab("view");
    } catch (error) {
      console.error("Error loading student profile:", error);
      toast.error("Failed to load your profile");
    }
  };

  const loadTeacherStudents = async () => {
    try {
      let assignedClasses = [];

      try {
        const teacherProfile = await teacherAPI.getMyTeacherProfile();
        const profile = teacherProfile.data || {};

        if (Array.isArray(profile.assignedClasses)) {
          assignedClasses = profile.assignedClasses.map((c) => ({
            className: c.className || c.name || "",
            arm: c.arm || c.classArm || "",
          }));
        } else if (Array.isArray(profile.classNames)) {
          assignedClasses = profile.classNames.map((className) => ({
            className,
            arm: "",
          }));
        } else if (profile.className) {
          assignedClasses = [
            {
              className: profile.className,
              arm: profile.arm || profile.classArm || "",
            },
          ];
        }
      } catch (error) {
        console.error("Error loading teacher profile:", error);
      }

      const normalizedClasses = assignedClasses.filter((c) => c.className);
      const uniqueClassNames = Array.from(
        new Set(normalizedClasses.map((c) => c.className)),
      );

      setTeacherClasses(uniqueClassNames);

      if (normalizedClasses.length === 0) {
        setStudents([]);
        toast.info("No class assigned to this teacher account");
        return;
      }

      const responses = await Promise.all(
        normalizedClasses.map((entry) => {
          if (entry.arm) {
            return studentAPI.getStudentsByClassAndArm(
              entry.className,
              entry.arm,
            );
          }
          return studentAPI.getStudentsByClass(entry.className);
        }),
      );

      const combined = responses.flatMap((res) => res.data || []);
      const uniqueStudents = Array.from(
        new Map(combined.map((student) => [student.id, student])).values(),
      );

      setStudents(uniqueStudents);

      if (normalizedClasses.length === 1) {
        setSelectedClass(normalizedClasses[0].className);
        if (normalizedClasses[0].arm) {
          setSelectedArm(normalizedClasses[0].arm);
        }
      }
    } catch (error) {
      console.error("Error loading teacher students:", error);
      toast.error("Failed to load your students");
      setStudents([]);
    }
  };

  const loadAdminStudents = async () => {
    try {
      const response = await studentAPI.getAllStudents();
      setStudents(response.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    }
  };

  const handleAddSubject = () => {
    setSubjects((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        subjectId: "",
        subjectName: "",
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
      prev.map((subject) => {
        if (subject.id !== id) return subject;

        if (field === "subjectId") {
          const selected = sortedSubjects.find(
            (s) => String(s.id) === String(value),
          );

          return {
            ...subject,
            subjectId: value,
            subjectName: selected?.name || "",
          };
        }

        return {
          ...subject,
          [field]: parseFloat(value) || 0,
        };
      }),
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

  const ensureSessionAndTerm = () => {
    if (!session) {
      toast.error("No session selected");
      return false;
    }
    if (!term) {
      toast.error("No term selected");
      return false;
    }
    return true;
  };

  const handleSubmitResults = async () => {
    if (!(isAdmin || isTeacher)) {
      toast.error("You are not allowed to enter results");
      return;
    }

    if (!ensureSessionAndTerm()) return;

    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }

    if (subjects.length === 0) {
      toast.error("Please add at least one subject");
      return;
    }

    for (const subject of subjects) {
      if (!subject.subjectId) {
        toast.error("Please select a subject for all entries");
        return;
      }

      if (!validateScores(subject)) {
        toast.error(
          `Scores exceed maximum for ${subject.subjectName || "a subject"}`,
        );
        return;
      }
    }

    setLoading(true);

    try {
      let successCount = 0;

      for (const subject of subjects) {
        const resultData = {
          studentId: selectedStudent.id,
          subjectId: Number(subject.subjectId),
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
    } catch (error) {
      console.error("Error saving results:", error);
      toast.error(error?.response?.data?.message || "Failed to save results");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentResult = async () => {
    if (!ensureSessionAndTerm()) return;

    setLoading(true);

    try {
      if (isStudent) {
        const response = await resultAPI.getMyTermResult(session, term);
        setResultSheet(response.data);
        toast.success("Result loaded successfully");
        return;
      }

      if (isParent) {
        if (!selectedStudent) {
          toast.error("Please select a ward");
          return;
        }

        const response = await parentPortalAPI.getWardTermResult(
          selectedStudent.id,
          session,
          term,
        );
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

    if (!ensureSessionAndTerm()) return;

    setLoading(true);

    try {
      let response;

      if (rankingsType === "school") {
        response = await resultAPI.getSchoolRankings(session, term);
      } else if (rankingsType === "class") {
        if (!selectedClass) {
          toast.error("Please select a class");
          setLoading(false);
          return;
        }

        response = await resultAPI.getClassRankings(
          selectedClass,
          session,
          term,
        );
      } else if (rankingsType === "arm") {
        if (!selectedClass || !selectedArm) {
          toast.error("Please select class and arm");
          setLoading(false);
          return;
        }

        response = await resultAPI.getArmRankings(
          selectedClass,
          selectedArm,
          session,
          term,
        );
      } else {
        toast.error("Invalid ranking type");
        setLoading(false);
        return;
      }

      setRankings(response.data);
      toast.success("Rankings loaded successfully");
    } catch (error) {
      console.error("Error fetching rankings:", error);
      setRankings(null);
      toast.error(error?.response?.data?.message || "Failed to load rankings");
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

    if (!session || !term) {
      toast.error("Please select session and term");
      return;
    }

    navigate(
      `/results/${targetStudent.id}?session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`,
    );
  };

  const clearForm = () => {
    setSubjects([]);
    setResultSheet(null);
    setSearchTerm("");
    if (!isStudent && !isParent) {
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

  const renderStudentSelectorLabel = () => {
    if (isParent) return "Select Ward";
    return "Select Student";
  };

  const renderPageTitle = () => {
    if (isStudent) return "View your academic results";
    if (isParent) return "View your ward's academic results";
    if (isTeacher) return "Enter and view results for your assigned class";
    return "Enter, view and analyze student results";
  };

  const currentStudentList = isParent ? parentWards : students;

  if ((sessionsLoading || subjectsLoading) && currentStudentList.length === 0) {
    return (
      <div className="result-management">
        <div className="text-center py-5">
          <FaSpinner className="spin" size={36} />
          <div className="mt-3">Loading result management...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="result-management">
      <div className="content-header d-flex justify-content-between align-items-start flex-wrap gap-3">
        <div>
          <h2>
            <FaChartLine className="me-2" /> Result Management System
          </h2>
          <p className="text-muted mb-0">{renderPageTitle()}</p>
        </div>

        <button
          className="btn btn-outline-primary"
          onClick={() => {
            loadSessionData();
            loadSubjects();
          }}
        >
          <FaSyncAlt className="me-2" />
          Refresh
        </button>
      </div>

      <div className="mt-3 mb-3 text-muted small">
        <FaBookOpen className="me-1" />
        Active backend session:{" "}
        <strong>
          {activeSessionObj ? getSessionName(activeSessionObj) : "None"}
        </strong>
        {" | "}
        Current backend term:{" "}
        <strong>{activeSessionObj?.currentTerm || "-"}</strong>
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

      {activeTab !== "rankings" && (
        <div className="filters-section">
          <div className="filters-grid">
            {!isStudent && (
              <>
                <div className="filter-group">
                  <label>{isParent ? "Search Ward" : "Search Student"}</label>
                  <div className="search-box">
                    <FaSearch />
                    <input
                      type="text"
                      placeholder={
                        isParent
                          ? "Search by ward name, admission or class..."
                          : "Search by name, admission or class..."
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="filter-group">
                  <label>{renderStudentSelectorLabel()}</label>
                  <select
                    value={selectedStudent?.id || ""}
                    onChange={(e) => {
                      const selected = filteredStudents.find(
                        (s) => s.id === parseInt(e.target.value, 10),
                      );
                      setSelectedStudent(selected || null);
                      setResultSheet(null);
                    }}
                  >
                    <option value="">
                      {isParent ? "Choose a ward" : "Choose a student"}
                    </option>
                    {filteredStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {(
                          s.fullName ||
                          `${s.firstName || ""} ${s.lastName || ""}`
                        ).trim()}{" "}
                        - {s.admissionNumber} ({s.studentClass} {s.classArm})
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
                {normalizedAvailableSessions.length > 0 ? (
                  normalizedAvailableSessions.map((s) => (
                    <option key={s.id || s.session} value={s.session}>
                      {s.session}
                    </option>
                  ))
                ) : (
                  <option value="">No session available</option>
                )}
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

          {(session || term) && (
            <div className="mt-2 text-muted small">
              <FaBookOpen className="me-1" />
              Current selection: {session || "No session"}{" "}
              {term ? `- ${term} term` : ""}
            </div>
          )}
        </div>
      )}

      {activeTab === "input" && (isAdmin || isTeacher) && (
        <div className="input-results">
          <div className="section-header">
            <h3>
              Enter Scores for{" "}
              {selectedStudent
                ? selectedStudent.fullName ||
                  `${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`.trim()
                : "Selected Student"}
            </h3>
            <div className="header-actions">
              <button className="btn-secondary" onClick={clearForm}>
                Clear
              </button>
              <button
                className="btn-primary"
                onClick={handleAddSubject}
                disabled={subjectsLoading}
              >
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
                      value={subject.subjectId}
                      onChange={(e) =>
                        handleSubjectChange(
                          subject.id,
                          "subjectId",
                          e.target.value,
                        )
                      }
                    >
                      <option value="">Select Subject</option>
                      {sortedSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
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
            <h3>
              {isStudent
                ? "My Results"
                : isParent
                  ? "Ward Results"
                  : "View Student Results"}
            </h3>
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
                        `${selectedStudent?.firstName || ""} ${selectedStudent?.lastName || ""}`.trim() ||
                        user?.firstName ||
                        "-"}
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
                          <td className="fw-bold">
                            {subject.subjectName || subject.subject}
                          </td>
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
                : isParent
                  ? selectedStudent
                    ? 'Click "Load Result" to view this ward result.'
                    : "Please select a ward to view results."
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

            <select
              className="form-select"
              value={session}
              onChange={(e) => setSession(e.target.value)}
            >
              {normalizedAvailableSessions.length > 0 ? (
                normalizedAvailableSessions.map((s) => (
                  <option key={s.id || s.session} value={s.session}>
                    {s.session}
                  </option>
                ))
              ) : (
                <option value="">No session available</option>
              )}
            </select>

            <select
              className="form-select"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            >
              {terms.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {rankingsType !== "school" && (
              <select
                className="form-select"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  if (rankingsType === "class") {
                    setSelectedArm("");
                  }
                }}
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
                  Rankings - {rankings.term || term} Term{" "}
                  {rankings.session || session}
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
                          <td>
                            {rank.class ||
                              rank.studentClass ||
                              rankings.className ||
                              "-"}
                          </td>
                          <td>
                            {rank.arm || rank.classArm || rankings.arm || "-"}
                          </td>
                          <td>
                            <strong className="text-success">
                              {safeFixed(rank.average, 2)}%
                            </strong>
                          </td>
                        </tr>
                      ))}

                      {!rankings.rankings?.length && (
                        <tr>
                          <td colSpan="6" className="text-center text-muted">
                            No ranking data found
                          </td>
                        </tr>
                      )}
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

      {currentStudentList.length === 0 && !loading && !sessionsLoading && (
        <div className="alert alert-info mt-3">
          <FaUsers className="me-2" />
          {isParent
            ? "No ward linked to this parent account."
            : isTeacher
              ? "No student data available for your assigned class."
              : isStudent
                ? "No student profile linked to this account."
                : "No students found."}
        </div>
      )}

      {isParent && parentWards.length > 0 && !selectedStudent && (
        <div className="alert alert-info mt-3">
          <FaUserGraduate className="me-2" />
          Select a ward to view results.
        </div>
      )}
    </div>
  );
}

export default ResultManagement;

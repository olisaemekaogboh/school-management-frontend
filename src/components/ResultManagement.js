// src/components/ResultManagement.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  resultAPI,
  sessionAPI,
  studentAPI,
  teacherAPI,
  parentPortalAPI,
  subjectAPI,
} from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
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
  FaUsers,
  FaBookOpen,
  FaSyncAlt,
} from "react-icons/fa";
import moment from "moment";
import "./ResultManagement.css";

function ResultManagement() {
  const { user, isAdmin, isTeacher, isStudent, isParent } = useAuth();
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const classIdFromQuery = query.get("classId") || "";
  const mineFromQuery = query.get("mine") === "true";
  const subjectIdFromQuery = query.get("subject") || "";

  const [lockedTeacherClassId, setLockedTeacherClassId] = useState(null);

  const [students, setStudents] = useState([]);
  const [parentWards, setParentWards] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [availableSessions, setAvailableSessions] = useState([]);
  const [activeSessionObj, setActiveSessionObj] = useState(null);
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("FIRST");

  const [allSubjects, setAllSubjects] = useState([]);
  const [teacherSubjectAssignments, setTeacherSubjectAssignments] = useState(
    [],
  );
  const [subjects, setSubjects] = useState([]);
  const [resultSheet, setResultSheet] = useState(null);
  const [rankings, setRankings] = useState(null);

  // INPUT FLOW
  const [teachingClasses, setTeachingClasses] = useState([]);
  const [inputClass, setInputClass] = useState("");
  const [inputArm, setInputArm] = useState("");
  const [inputStudents, setInputStudents] = useState([]);

  // VIEW / RANKINGS FLOW
  const [teacherFormClass, setTeacherFormClass] = useState(null);
  const [formStudents, setFormStudents] = useState([]);

  // RAW BACKEND CLASS DATA
  const [teacherClassAssignments, setTeacherClassAssignments] = useState([]);

  const [activeTab, setActiveTab] = useState(() => {
    if (isStudent || isParent) return "view";
    return "input";
  });

  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rankingsType, setRankingsType] = useState(
    isTeacher ? "arm" : "school",
  );
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedArm, setSelectedArm] = useState("");

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

  const normalizeClassName = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

  const normalizeArm = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const safeNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const safeFixed = (value, digits = 2) => safeNumber(value, 0).toFixed(digits);

  const getSessionName = (item) =>
    item?.session || item?.sessionName || item?.name || "";

  const sortSessions = (list) =>
    [...list].sort((a, b) => {
      const aDate = new Date(a.startDate || 0).getTime();
      const bDate = new Date(b.startDate || 0).getTime();
      return bDate - aDate;
    });

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

  const teacherSubjectsForCurrentInputClass = useMemo(() => {
    if (!isTeacher || !inputClass || !inputArm) return [];
    return teacherSubjectAssignments
      .filter(
        (item) =>
          normalizeClassName(item.className) ===
            normalizeClassName(inputClass) &&
          normalizeArm(item.classArm) === normalizeArm(inputArm),
      )
      .map((item) => ({
        subjectId: item.subjectId,
        subjectName: item.subjectName,
      }));
  }, [isTeacher, teacherSubjectAssignments, inputClass, inputArm]);

  const availableSubjects = useMemo(() => {
    if (!isTeacher) return allSubjects;
    const allowedIds = new Set(
      teacherSubjectsForCurrentInputClass.map((s) => String(s.subjectId)),
    );
    return allSubjects.filter((subject) => allowedIds.has(String(subject.id)));
  }, [allSubjects, isTeacher, teacherSubjectsForCurrentInputClass]);

  const sortedSubjects = useMemo(() => {
    return [...availableSubjects].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );
  }, [availableSubjects]);

  const availableRankingClasses = useMemo(() => {
    if (isAdmin) return classes;
    if (isTeacher) return teacherFormClass ? [teacherFormClass.className] : [];
    return [];
  }, [isAdmin, isTeacher, teacherFormClass]);

  const availableRankingArms = useMemo(() => {
    if (!selectedClass) return [];
    if (isAdmin) return ["A", "B", "C"];
    if (isTeacher) {
      return teacherFormClass &&
        normalizeClassName(teacherFormClass.className) ===
          normalizeClassName(selectedClass)
        ? [teacherFormClass.arm]
        : [];
    }
    return [];
  }, [selectedClass, isAdmin, isTeacher, teacherFormClass]);

  const displayedStudents = useMemo(() => {
    if (isParent) return parentWards;
    if (!isTeacher) return students;
    if (activeTab === "input") return inputStudents;
    if (activeTab === "view") return formStudents;
    return formStudents;
  }, [
    isParent,
    isTeacher,
    students,
    parentWards,
    inputStudents,
    formStudents,
    activeTab,
  ]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return displayedStudents;

    const q = searchTerm.toLowerCase();
    return displayedStudents.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(q) ||
        `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase().includes(q) ||
        s.admissionNumber?.toLowerCase().includes(q) ||
        s.studentClass?.toLowerCase().includes(q),
    );
  }, [displayedStudents, searchTerm]);

  const termPrintableMessage =
    resultSheet?.printLockMessage ||
    "Printable result is locked. The admin will unlock it when it is ready.";

  const canOpenPrintableResult =
    !isStudent &&
    !isParent &&
    !!resultSheet &&
    resultSheet?.printable === true &&
    !!session &&
    !!term &&
    !!(selectedStudent?.id || students[0]?.id || user?.student?.id);

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mineFromQuery) {
      setLockedTeacherClassId(null);
    }
  }, [mineFromQuery]);

  useEffect(() => {
    setResultSheet(null);
    setRankings(null);
  }, [
    session,
    term,
    selectedStudent,
    selectedClass,
    selectedArm,
    inputClass,
    inputArm,
    rankingsType,
  ]);

  useEffect(() => {
    if (!isTeacher) return;
    if (teachingClasses.length > 0 && !inputClass) {
      setInputClass(teachingClasses[0].className);
      setInputArm(teachingClasses[0].arm);
    }
  }, [isTeacher, teachingClasses, inputClass]);

  useEffect(() => {
    if (!isTeacher) return;
    if (activeTab !== "input") return;
    if (!inputClass || !inputArm) {
      setInputStudents([]);
      return;
    }
    loadTeacherStudentsForTeachingClass(inputClass, inputArm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher, activeTab, inputClass, inputArm]);

  useEffect(() => {
    if (!isTeacher) return;
    if (activeTab !== "view") return;
    if (!teacherFormClass?.id) {
      setFormStudents([]);
      return;
    }
    loadTeacherStudentsForFormClass();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher, activeTab, teacherFormClass]);

  useEffect(() => {
    if (!isTeacher) return;
    if (activeTab === "rankings" && teacherFormClass) {
      setSelectedClass(teacherFormClass.className);
      setSelectedArm(teacherFormClass.arm);
    }
  }, [isTeacher, activeTab, teacherFormClass]);
  const [termPrintableBusy, setTermPrintableBusy] = useState(false);
  const [termLockMessageInput, setTermLockMessageInput] = useState("");

  const effectiveTermLockMessage =
    termLockMessageInput.trim() ||
    resultSheet?.printLockMessage ||
    "Printable result is locked. The admin will unlock it when it is ready.";

  const syncTermLockMessageFromResult = (data) => {
    setTermLockMessageInput(
      data?.printLockMessage ||
        "Printable result is locked. The admin will unlock it when it is ready.",
    );
  };

  const updateTermPrintableStatus = async (printable) => {
    if (!isAdmin) {
      toast.error("Only admin can change printable status");
      return;
    }

    if (!selectedStudent?.id || !session || !term) {
      toast.error("Please select a student, session and term first");
      return;
    }

    setTermPrintableBusy(true);
    try {
      const response = await resultAPI.setTermPrintableStatus(
        selectedStudent.id,
        session,
        term,
        printable,
        printable ? null : effectiveTermLockMessage,
      );

      const updated =
        response?.data && typeof response.data === "object"
          ? {
              ...resultSheet,
              printable: response.data.printable,
              printLockMessage:
                response.data.printLockMessage || effectiveTermLockMessage,
            }
          : {
              ...resultSheet,
              printable,
              printLockMessage: printable ? null : effectiveTermLockMessage,
            };

      setResultSheet(updated);
      syncTermLockMessageFromResult(updated);

      toast.success(
        printable
          ? "Term printable result unlocked successfully"
          : "Term printable result locked successfully",
      );
    } catch (error) {
      console.error("Error updating term printable status:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to update term printable status",
      );
    } finally {
      setTermPrintableBusy(false);
    }
  };
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
      toast.error(
        t?.resultManagement?.sessionLoadFailed ||
          "Failed to load session information",
      );
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadSubjects = async () => {
    setSubjectsLoading(true);
    try {
      const response = await subjectAPI.getAllSubjects();
      setAllSubjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error loading subjects:", error);
      setAllSubjects([]);
      toast.error(
        t?.resultManagement?.subjectsLoadFailed || "Failed to load subjects",
      );
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

      if (isStudent) {
        await loadStudentSelf();
        return;
      }

      if (isTeacher) {
        await loadTeacherSetup();
        return;
      }

      await loadAdminStudents();
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.error(
        t?.resultManagement?.initialLoadFailed ||
          "Failed to load result management data",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadParentWards = async () => {
    try {
      const response = await parentPortalAPI.getMyWards();
      const wards = Array.isArray(response.data) ? response.data : [];
      setParentWards(wards);
      if (wards.length === 1) setSelectedStudent(wards[0]);
      setActiveTab("view");
    } catch (error) {
      console.error("Error loading parent wards:", error);
      setParentWards([]);
      toast.error(
        t?.resultManagement?.wardsLoadFailed || "Failed to load your wards",
      );
    }
  };

  const loadStudentSelf = async () => {
    try {
      let me = null;

      if (studentAPI.getMyProfile) {
        const response = await studentAPI.getMyProfile();
        me = response?.data || null;
      } else if (user?.studentId) {
        const response = await studentAPI.getStudentById(user.studentId);
        me = response?.data || null;
      }

      const oneStudent = me ? [me] : [];
      setStudents(oneStudent);
      setSelectedStudent(me || null);
      setActiveTab("view");
    } catch (error) {
      console.error("Error loading student profile:", error);
      setStudents([]);
      setSelectedStudent(null);
      toast.error(
        t?.resultManagement?.profileLoadFailed || "Failed to load your profile",
      );
    }
  };

  const loadTeacherSetup = async () => {
    try {
      const [classesResponse, subjectsResponse] = await Promise.all([
        teacherAPI.getMyClasses(),
        teacherAPI.getMySubjectAssignments(),
      ]);

      const classesData = Array.isArray(classesResponse.data)
        ? classesResponse.data
        : [];
      const assignmentsData = Array.isArray(subjectsResponse.data)
        ? subjectsResponse.data
        : [];

      console.log("GET /teachers/me/classes =>", classesData);
      console.log("GET /teachers/me/subject-assignments =>", assignmentsData);

      setTeacherClassAssignments(classesData);
      setTeacherSubjectAssignments(assignmentsData);

      const teachingClassesMap = new Map();

      assignmentsData.forEach((assignment) => {
        const matchedClass = classesData.find(
          (c) =>
            normalizeClassName(c.className) ===
              normalizeClassName(assignment.className) &&
            normalizeArm(c.arm) === normalizeArm(assignment.classArm),
        );

        const key = `${normalizeClassName(assignment.className)}::${normalizeArm(
          assignment.classArm,
        )}`;

        if (!teachingClassesMap.has(key)) {
          teachingClassesMap.set(key, {
            id: matchedClass?.id || assignment.classId || null,
            className: assignment.className,
            arm: assignment.classArm,
            subjects: [],
          });
        }

        const existing = teachingClassesMap.get(key);

        if (!existing.id && (matchedClass?.id || assignment.classId)) {
          existing.id = matchedClass?.id || assignment.classId;
        }

        existing.subjects.push({
          id: assignment.subjectId,
          name: assignment.subjectName,
        });
      });

      const teachingClassesList = Array.from(teachingClassesMap.values());

      console.log("Resolved teachingClassesList =>", teachingClassesList);

      setTeachingClasses(teachingClassesList);

      const formClass =
        classesData.find((c) => c.isFormTeacher === true) || null;
      setTeacherFormClass(formClass);

      if (classesData.length === 0 && teachingClassesList.length === 0) {
        setInputStudents([]);
        setFormStudents([]);
        setInputClass("");
        setInputArm("");
        toast.info(
          t?.resultManagement?.noClassAssigned ||
            "No class assigned to this teacher account",
        );
        return;
      }

      if (classIdFromQuery && mineFromQuery) {
        const matched =
          teachingClassesList.find(
            (c) => String(c.id) === String(classIdFromQuery),
          ) ||
          classesData.find((c) => String(c.id) === String(classIdFromQuery));

        if (!matched) {
          setLockedTeacherClassId(null);
          setInputStudents([]);
          setInputClass("");
          setInputArm("");
          toast.error(
            t?.resultManagement?.accessRestricted ||
              "You can only access your assigned class arm",
          );
          return;
        }

        setLockedTeacherClassId(matched.id || null);
        setInputClass(matched.className);
        setInputArm(matched.arm);

        if (matched.id) {
          const response = await teacherAPI.getMyClassStudents(matched.id);
          setInputStudents(Array.isArray(response.data) ? response.data : []);
        } else {
          setInputStudents([]);
        }

        if (subjectIdFromQuery) {
          const assignmentSubjects = assignmentsData
            .filter(
              (a) =>
                normalizeClassName(a.className) ===
                  normalizeClassName(matched.className) &&
                normalizeArm(a.classArm) === normalizeArm(matched.arm),
            )
            .map((a) => ({
              id: a.subjectId,
              name: a.subjectName,
            }));

          const uniqueMap = new Map();
          assignmentSubjects.forEach((s) => {
            if (!uniqueMap.has(String(s.id))) uniqueMap.set(String(s.id), s);
          });

          const subjectToAdd = Array.from(uniqueMap.values()).find(
            (s) => String(s.id) === String(subjectIdFromQuery),
          );

          if (subjectToAdd) handleAddSubjectWithPreset(subjectToAdd);
        }

        return;
      }

      setLockedTeacherClassId(null);

      if (teachingClassesList.length > 0) {
        setInputClass(teachingClassesList[0].className);
        setInputArm(teachingClassesList[0].arm);
      }

      if (formClass) {
        setSelectedClass(formClass.className);
        setSelectedArm(formClass.arm);
      }
    } catch (error) {
      console.error("Error loading teacher setup:", error?.response || error);
      toast.error(
        t?.resultManagement?.teacherSetupFailed ||
          "Failed to load your class assignments",
      );
      setTeachingClasses([]);
      setTeacherClassAssignments([]);
      setTeacherSubjectAssignments([]);
      setTeacherFormClass(null);
      setInputStudents([]);
      setFormStudents([]);
      setLockedTeacherClassId(null);
    }
  };

  const loadTeacherStudentsForTeachingClass = async (className, classArm) => {
    const teachingMatch = teachingClasses.find(
      (c) =>
        normalizeClassName(c.className) === normalizeClassName(className) &&
        normalizeArm(c.arm) === normalizeArm(classArm),
    );

    const fallbackMatch = teacherClassAssignments.find(
      (c) =>
        normalizeClassName(c.className) === normalizeClassName(className) &&
        normalizeArm(c.arm) === normalizeArm(classArm),
    );

    const classIdToLoad = teachingMatch?.id || fallbackMatch?.id || null;

    console.log("loadTeacherStudentsForTeachingClass =>", {
      className,
      classArm,
      teachingMatch,
      fallbackMatch,
      classIdToLoad,
    });

    if (!classIdToLoad) {
      setInputStudents([]);
      if (activeTab === "input") setSelectedStudent(null);
      return;
    }

    setLoading(true);
    try {
      const response = await teacherAPI.getMyClassStudents(classIdToLoad);
      const scopedStudents = Array.isArray(response.data) ? response.data : [];
      setInputStudents(scopedStudents);

      if (
        activeTab === "input" &&
        selectedStudent &&
        !scopedStudents.some((student) => student.id === selectedStudent.id)
      ) {
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error(
        "Error loading teacher students:",
        error?.response || error,
      );
      setInputStudents([]);
      if (activeTab === "input") setSelectedStudent(null);
      toast.error(
        t?.resultManagement?.studentsLoadFailed ||
          "Failed to load students for selected class",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherStudentsForFormClass = async () => {
    const formClassAssignment = teacherClassAssignments.find(
      (c) => c.isFormTeacher === true,
    );
    const classIdToLoad = formClassAssignment?.id || teacherFormClass?.id;

    if (!classIdToLoad) {
      setFormStudents([]);
      if (activeTab === "view") setSelectedStudent(null);
      return;
    }

    setLoading(true);
    try {
      const response = await teacherAPI.getMyClassStudents(classIdToLoad);
      const scopedStudents = Array.isArray(response.data) ? response.data : [];
      setFormStudents(scopedStudents);

      if (
        activeTab === "view" &&
        selectedStudent &&
        !scopedStudents.some((student) => student.id === selectedStudent.id)
      ) {
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error(
        "Error loading form class students:",
        error?.response || error,
      );
      setFormStudents([]);
      if (activeTab === "view") setSelectedStudent(null);
      toast.error(
        t?.resultManagement?.studentsLoadFailed ||
          "Failed to load students for your form class",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAdminStudents = async () => {
    try {
      const response = await studentAPI.getAllStudents();
      setStudents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error(
        t?.resultManagement?.studentsLoadFailed || "Failed to load students",
      );
    }
  };

  const teacherCanInputStudent = (student) => {
    if (!isTeacher) return true;
    if (!inputClass || !inputArm) return false;

    return (
      normalizeClassName(student?.studentClass) ===
        normalizeClassName(inputClass) &&
      normalizeArm(student?.classArm) === normalizeArm(inputArm)
    );
  };

  const teacherCanViewStudent = (student) => {
    if (!isTeacher) return true;
    if (!teacherFormClass) return false;

    return (
      normalizeClassName(student?.studentClass) ===
        normalizeClassName(teacherFormClass.className) &&
      normalizeArm(student?.classArm) === normalizeArm(teacherFormClass.arm)
    );
  };

  const teacherCanTeachSubject = (subjectId) => {
    if (!isTeacher) return true;
    return teacherSubjectsForCurrentInputClass.some(
      (item) => String(item.subjectId) === String(subjectId),
    );
  };

  const handleAddSubjectWithPreset = (subject) => {
    setSubjects((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        subjectId: subject.id,
        subjectName: subject.name,
        resumptionTest: 0,
        assignments: 0,
        project: 0,
        midtermTest: 0,
        secondTest: 0,
        examination: 0,
      },
    ]);
  };

  const handleAddSubject = () => {
    if (isTeacher && sortedSubjects.length === 0) {
      toast.error(
        t?.resultManagement?.noSubjectAssigned ||
          "No subject assigned to you for this class arm",
      );
      return;
    }

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

        return { ...subject, [field]: parseFloat(value) || 0 };
      }),
    );
  };

  const handleRemoveSubject = (id) =>
    setSubjects((prev) => prev.filter((s) => s.id !== id));

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
      toast.error(
        t?.resultManagement?.noSessionSelected || "No session selected",
      );
      return false;
    }
    if (!term) {
      toast.error(t?.resultManagement?.noTermSelected || "No term selected");
      return false;
    }
    return true;
  };

  const handleSubmitResults = async () => {
    if (!(isAdmin || isTeacher)) {
      toast.error(
        t?.resultManagement?.notAllowed ||
          "You are not allowed to enter results",
      );
      return;
    }

    if (!ensureSessionAndTerm()) return;

    if (!selectedStudent) {
      toast.error(
        t?.resultManagement?.selectStudent || "Please select a student",
      );
      return;
    }

    if (isTeacher) {
      if (!inputClass || !inputArm) {
        toast.error(
          t?.resultManagement?.selectClassArm ||
            "Please select a class and arm to enter results",
        );
        return;
      }

      if (!teacherCanInputStudent(selectedStudent)) {
        toast.error(
          t?.resultManagement?.studentNotInClass ||
            "You can only enter results for students in the class you are teaching",
        );
        return;
      }
    }

    if (subjects.length === 0) {
      toast.error(
        t?.resultManagement?.addSubject || "Please add at least one subject",
      );
      return;
    }

    const usedSubjects = new Set();

    for (const subject of subjects) {
      if (!subject.subjectId) {
        toast.error(
          t?.resultManagement?.selectSubject ||
            "Please select a subject for all entries",
        );
        return;
      }

      if (usedSubjects.has(String(subject.subjectId))) {
        toast.error(
          t?.resultManagement?.duplicateSubject || "Duplicate subject selected",
        );
        return;
      }

      usedSubjects.add(String(subject.subjectId));

      if (isTeacher && !teacherCanTeachSubject(subject.subjectId)) {
        toast.error(
          `${
            t?.resultManagement?.notAllowedForSubject ||
            "You are not allowed to enter result for"
          } ${subject.subjectName || "this subject"}`,
        );
        return;
      }

      if (!validateScores(subject)) {
        toast.error(
          `${
            t?.resultManagement?.scoresExceed || "Scores exceed maximum for"
          } ${subject.subjectName || "a subject"}`,
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

        console.log("Submitting resultData =>", resultData);
        const response = await resultAPI.addOrUpdateResultDTO(resultData);
        console.log("Save response =>", response?.data);

        successCount++;
      }

      toast.success(
        `${successCount} ${
          t?.resultManagement?.subjectsSaved || "subject(s) saved successfully"
        }`,
      );
      setSubjects([]);
    } catch (error) {
      console.error("Error saving results:", {
        status: error?.response?.status,
        data: error?.response?.data,
        error,
      });

      toast.error(
        error?.response?.data?.message ||
          t?.resultManagement?.saveFailed ||
          "Failed to save results",
      );
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
        syncTermLockMessageFromResult(response.data);
        toast.success(
          t?.resultManagement?.resultLoaded || "Result loaded successfully",
        );
        return;
      }

      if (isParent) {
        if (!selectedStudent) {
          toast.error(
            t?.resultManagement?.selectWard || "Please select a ward",
          );
          return;
        }

        const response = await parentPortalAPI.getWardTermResult(
          selectedStudent.id,
          session,
          term,
        );
        setResultSheet(response.data);
        syncTermLockMessageFromResult(response.data);
        toast.success(
          t?.resultManagement?.resultLoaded || "Result loaded successfully",
        );
        return;
      }

      if (!selectedStudent) {
        toast.error(
          t?.resultManagement?.selectStudent || "Please select a student",
        );
        return;
      }

      if (isTeacher) {
        if (!teacherFormClass) {
          toast.error(
            t?.resultManagement?.formTeacherOnly ||
              "You can only view results for your form class",
          );
          return;
        }

        if (!teacherCanViewStudent(selectedStudent)) {
          toast.error(
            t?.resultManagement?.formTeacherOnlyView ||
              "You can only view results for students in your form class",
          );
          return;
        }
      }

      const response = await resultAPI.getTermResult(
        selectedStudent.id,
        session,
        term,
      );
      setResultSheet(response.data);
      syncTermLockMessageFromResult(response.data);
      toast.success(
        t?.resultManagement?.resultLoaded || "Result loaded successfully",
      );
    } catch (error) {
      console.error("Error fetching result:", error);
      setResultSheet(null);
      toast.error(
        error?.response?.data?.message ||
          t?.resultManagement?.noResultsFound ||
          "No results found for the selected term",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRankings = async () => {
    if (!(isAdmin || isTeacher)) {
      toast.error(
        t?.resultManagement?.notAllowedRankings ||
          "You are not allowed to view rankings",
      );
      return;
    }

    if (!ensureSessionAndTerm()) return;

    setLoading(true);
    try {
      let response;

      if (isTeacher) {
        const formClassAssignment = teacherClassAssignments.find(
          (c) => c.isFormTeacher === true,
        );
        const formClassId = formClassAssignment?.id || teacherFormClass?.id;

        if (!formClassId) {
          toast.error(
            t?.resultManagement?.formTeacherOnlyRankings ||
              "Only your form class rankings are available",
          );
          return;
        }

        response = await teacherAPI.getMyClassResults(
          formClassId,
          session,
          term,
        );
      } else {
        if (rankingsType === "school") {
          response = await resultAPI.getSchoolRankings(session, term);
        } else if (rankingsType === "class") {
          if (!selectedClass) {
            toast.error(
              t?.resultManagement?.selectClass || "Please select a class",
            );
            return;
          }
          response = await resultAPI.getClassRankings(
            selectedClass,
            session,
            term,
          );
        } else if (rankingsType === "arm") {
          if (!selectedClass || !selectedArm) {
            toast.error(
              t?.resultManagement?.selectClassArm ||
                "Please select class and arm",
            );
            return;
          }
          response = await resultAPI.getArmRankings(
            selectedClass,
            selectedArm,
            session,
            term,
          );
        } else {
          toast.error(
            t?.resultManagement?.invalidRankingType || "Invalid ranking type",
          );
          return;
        }
      }

      setRankings(response.data);
      toast.success(
        t?.resultManagement?.rankingsLoaded || "Rankings loaded successfully",
      );
    } catch (error) {
      console.error("Error fetching rankings:", error);
      setRankings(null);
      toast.error(
        error?.response?.data?.message ||
          t?.resultManagement?.rankingsLoadFailed ||
          "Failed to load rankings",
      );
    } finally {
      setLoading(false);
    }
  };

  const viewResultSheet = () => {
    if (!resultSheet) {
      toast.error(
        t?.resultManagement?.loadResultFirst || "Load a result first",
      );
      return;
    }

    if (isStudent || isParent) {
      toast.error(termPrintableMessage);
      return;
    }

    if (resultSheet?.printable !== true) {
      toast.error(termPrintableMessage);
      return;
    }

    let targetStudent = null;

    if (isStudent) {
      targetStudent = selectedStudent || students[0] || user?.student || null;
    } else {
      targetStudent = selectedStudent;
    }

    if (!targetStudent?.id) {
      toast.error(
        t?.resultManagement?.selectStudent || "Please select a student",
      );
      return;
    }

    if (!session || !term) {
      toast.error(
        t?.resultManagement?.selectSessionTerm ||
          "Please select session and term",
      );
      return;
    }

    navigate(
      `/results/${targetStudent.id}?session=${encodeURIComponent(
        session,
      )}&term=${encodeURIComponent(term)}`,
    );
  };

  const clearForm = () => {
    setSubjects([]);
    setResultSheet(null);
    setSearchTerm("");
    if (!isStudent && !isParent) setSelectedStudent(null);
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

  const renderStudentSelectorLabel = () =>
    isParent
      ? t?.resultManagement?.selectWard || "Select Ward"
      : t?.resultManagement?.selectStudent || "Select Student";

  const renderPageTitle = () => {
    if (isStudent) {
      return (
        t?.resultManagement?.viewResultsTitle || "View your academic results"
      );
    }
    if (isParent) {
      return (
        t?.resultManagement?.wardResultsTitle ||
        "View your ward's academic results"
      );
    }
    if (isTeacher) {
      return (
        t?.resultManagement?.teacherResultsTitle ||
        "Input results for teaching classes, view results and rankings only for form class"
      );
    }
    return (
      t?.resultManagement?.adminResultsTitle ||
      "Enter, view and analyze student results"
    );
  };

  if ((sessionsLoading || subjectsLoading) && displayedStudents.length === 0) {
    return (
      <div className="result-management">
        <div className="text-center py-5">
          <FaSpinner className="spin" size={36} />
          <div className="mt-3">
            {t?.common?.loading || "Loading result management..."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`result-management ${darkMode ? "dark-mode" : ""}`}>
      <div className="content-header d-flex justify-content-between align-items-start flex-wrap gap-3 no-print">
        <div>
          <h2>
            <FaChartLine className="me-2" />{" "}
            {t?.resultManagement?.title || "Result Management System"}
          </h2>
          <p className="text-muted mb-0">{renderPageTitle()}</p>

          {isTeacher && teacherFormClass && (
            <small className="text-info d-block mt-1">
              <FaInfoCircle className="me-1" />
              Form Class: {teacherFormClass.className} {teacherFormClass.arm}
            </small>
          )}

          {isTeacher && teachingClasses.length > 0 && (
            <small className="text-success d-block mt-1">
              <FaBookOpen className="me-1" />
              Teaching Classes:{" "}
              {teachingClasses.map((c) => `${c.className} ${c.arm}`).join(", ")}
            </small>
          )}
        </div>

        <button
          className="btn btn-outline-primary"
          onClick={() => {
            loadSessionData();
            loadSubjects();
            if (isTeacher) loadTeacherSetup();
            if (isStudent) loadStudentSelf();
            if (isParent) loadParentWards();
            if (isAdmin) loadAdminStudents();
          }}
        >
          <FaSyncAlt className="me-2" /> {t?.common?.refresh || "Refresh"}
        </button>
      </div>

      <div className="mt-3 mb-3 text-muted small no-print">
        <FaBookOpen className="me-1" />
        {t?.resultManagement?.activeBackendSession ||
          "Active backend session"}:{" "}
        <strong>
          {activeSessionObj ? getSessionName(activeSessionObj) : "None"}
        </strong>{" "}
        | {t?.resultManagement?.currentBackendTerm || "Current backend term"}:{" "}
        <strong>{activeSessionObj?.currentTerm || "-"}</strong>
      </div>

      <div className="tabs-container no-print">
        {(isAdmin || isTeacher) && (
          <button
            className={`tab-btn ${activeTab === "input" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("input");
              setSelectedStudent(null);
              setResultSheet(null);
            }}
          >
            <FaPlus /> {t?.resultManagement?.inputResults || "Input Results"}
          </button>
        )}

        <button
          className={`tab-btn ${activeTab === "view" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("view");
            setSelectedStudent(null);
            setResultSheet(null);
          }}
        >
          <FaEye /> {t?.resultManagement?.viewResults || "View Results"}
        </button>

        {(isAdmin || isTeacher) && (
          <button
            className={`tab-btn ${activeTab === "rankings" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("rankings");
              setSelectedStudent(null);
              setResultSheet(null);
            }}
          >
            <FaChartLine /> {t?.resultManagement?.rankings || "Rankings"}
          </button>
        )}
      </div>

      {activeTab !== "rankings" && (
        <div className="filters-section no-print">
          <div className="filters-grid">
            {!isStudent && (
              <>
                <div className="filter-group">
                  <label>
                    {isParent
                      ? t?.resultManagement?.searchWard || "Search Ward"
                      : t?.resultManagement?.searchStudent || "Search Student"}
                  </label>
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

                {isTeacher && activeTab === "input" && (
                  <>
                    <div className="filter-group">
                      <label>{t?.resultManagement?.class || "Class"}</label>
                      <select
                        value={inputClass}
                        onChange={(e) => {
                          const newClass = e.target.value;

                          setInputClass(newClass);

                          const matchingArms = teachingClasses
                            .filter(
                              (c) =>
                                normalizeClassName(c.className) ===
                                normalizeClassName(newClass),
                            )
                            .map((c) => c.arm);

                          setInputArm(matchingArms[0] || "");
                          setSelectedStudent(null);
                          setSubjects([]);

                          console.log("Changed input class =>", {
                            newClass,
                            matchingArms,
                            teachingClasses,
                          });
                        }}
                        disabled={false}
                      >
                        <option value="">
                          {t?.common?.select || "Select Class"}
                        </option>
                        {Array.from(
                          new Map(
                            teachingClasses.map((c) => [
                              normalizeClassName(c.className),
                              c.className,
                            ]),
                          ).values(),
                        ).map((className) => (
                          <option key={className} value={className}>
                            {className}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-group">
                      <label>{t?.resultManagement?.arm || "Arm"}</label>
                      <select
                        value={inputArm}
                        onChange={(e) => {
                          const newArm = e.target.value;
                          setInputArm(newArm);
                          setSelectedStudent(null);
                          setSubjects([]);

                          console.log("Changed input arm =>", {
                            inputClass,
                            newArm,
                          });
                        }}
                        disabled={!inputClass}
                      >
                        <option value="">
                          {t?.common?.select || "Select Arm"}
                        </option>
                        {teachingClasses
                          .filter(
                            (c) =>
                              normalizeClassName(c.className) ===
                              normalizeClassName(inputClass),
                          )
                          .map((c) => (
                            <option
                              key={`${c.className}-${c.arm}`}
                              value={c.arm}
                            >
                              {c.arm}
                            </option>
                          ))}
                      </select>
                    </div>
                  </>
                )}

                {isTeacher && activeTab === "view" && teacherFormClass && (
                  <div className="filter-group">
                    <label>Form Class</label>
                    <input
                      type="text"
                      readOnly
                      className="form-control bg-light"
                      value={`${teacherFormClass.className} ${teacherFormClass.arm}`}
                    />
                  </div>
                )}

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
                        ).trim()}
                        {" - "} {s.admissionNumber} ({s.studentClass}{" "}
                        {s.classArm})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="filter-group">
              <label>{t?.resultManagement?.session || "Session"}</label>
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
              <label>{t?.resultManagement?.term || "Term"}</label>
              <select value={term} onChange={(e) => setTerm(e.target.value)}>
                {terms.map((tt) => (
                  <option key={tt} value={tt}>
                    {tt}
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
                disabled={
                  subjectsLoading || (isTeacher && sortedSubjects.length === 0)
                }
              >
                <FaPlus /> Add Subject
              </button>
            </div>
          </div>

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
                      min="0"
                      max="5"
                      step="0.5"
                      value={subject.resumptionTest}
                      onChange={(e) =>
                        handleSubjectChange(
                          subject.id,
                          "resumptionTest",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Ass (10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={subject.assignments}
                      onChange={(e) =>
                        handleSubjectChange(
                          subject.id,
                          "assignments",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Proj (10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={subject.project}
                      onChange={(e) =>
                        handleSubjectChange(
                          subject.id,
                          "project",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>MT (10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={subject.midtermTest}
                      onChange={(e) =>
                        handleSubjectChange(
                          subject.id,
                          "midtermTest",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>2nd (5)</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.5"
                      value={subject.secondTest}
                      onChange={(e) =>
                        handleSubjectChange(
                          subject.id,
                          "secondTest",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Exam (60)</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      step="0.5"
                      value={subject.examination}
                      onChange={(e) =>
                        handleSubjectChange(
                          subject.id,
                          "examination",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Total</label>
                    <input
                      type="text"
                      readOnly
                      className="total-field"
                      value={calculateSubjectTotal(subject).toFixed(1)}
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
                    <FaSave /> Save All Results
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "view" && (
        <div className="view-results">
          <div className="section-header no-print">
            <h3>
              {isStudent
                ? "My Results"
                : isParent
                  ? "Ward Results"
                  : "View Student Results"}
            </h3>

            <div className="header-actions">
              <button
                className="btn btn-outline-primary"
                onClick={fetchStudentResult}
                disabled={loading || (!isStudent && !selectedStudent)}
              >
                {loading ? (
                  <FaSpinner className="spin me-2" />
                ) : (
                  <FaEye className="me-2" />
                )}
                Load Result
              </button>

              {resultSheet && !isStudent && !isParent && (
                <button
                  className="btn btn-success"
                  onClick={viewResultSheet}
                  disabled={!canOpenPrintableResult}
                  title={
                    canOpenPrintableResult
                      ? "Open printable result"
                      : termPrintableMessage
                  }
                >
                  <FaPrint size={14} />{" "}
                  <span>
                    {canOpenPrintableResult
                      ? "Printable Result"
                      : "Printable Locked"}
                  </span>
                </button>
              )}

              {resultSheet && isAdmin && (
                <>
                  <button
                    className="btn btn-warning"
                    onClick={() => updateTermPrintableStatus(false)}
                    disabled={
                      termPrintableBusy || resultSheet?.printable !== true
                    }
                    title="Lock printable term result"
                  >
                    {termPrintableBusy ? (
                      <FaSpinner className="spin me-2" />
                    ) : null}
                    Lock Print
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={() => updateTermPrintableStatus(true)}
                    disabled={
                      termPrintableBusy || resultSheet?.printable === true
                    }
                    title="Unlock printable term result"
                  >
                    {termPrintableBusy ? (
                      <FaSpinner className="spin me-2" />
                    ) : null}
                    Unlock Print
                  </button>
                </>
              )}
            </div>
          </div>
          {resultSheet && isAdmin && (
            <div className="result-lock-admin-panel no-print">
              <label className="form-label fw-bold">Print lock message</label>
              <textarea
                className="form-control"
                rows="2"
                value={termLockMessageInput}
                onChange={(e) => setTermLockMessageInput(e.target.value)}
                placeholder="Printable result is locked. The admin will unlock it when it is ready."
              />
              <div className="small text-muted mt-2">
                This message is shown when printable term result is locked.
              </div>
            </div>
          )}
          {resultSheet && resultSheet?.printable !== true && (
            <div className="result-lock-banner no-print" role="alert">
              {termPrintableMessage}
            </div>
          )}

          {resultSheet && (
            <div className="result-card print-area">
              <div className="result-header">
                <h4 className="mb-0">Term Result Summary</h4>
              </div>

              <div className="result-body">
                <div className="student-info">
                  <div>
                    <p>
                      <strong>Student:</strong>{" "}
                      {resultSheet.studentInfo?.name ||
                        selectedStudent?.fullName ||
                        `${selectedStudent?.firstName || ""} ${selectedStudent?.lastName || ""}`.trim() ||
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
                  <table className="table table-bordered table-hover">
                    <thead className="table-dark">
                      <tr>
                        <th>Subject</th>
                        <th>RT (5)</th>
                        <th>Ass (10)</th>
                        <th>Proj (10)</th>
                        <th>MT (10)</th>
                        <th>2nd (5)</th>
                        <th>CA Total</th>
                        <th>Exam (60)</th>
                        <th>Total (100)</th>
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
                          <td className="text-center">
                            {safeNumber(subject.resumptionTest)}
                          </td>
                          <td className="text-center">
                            {safeNumber(subject.assignments)}
                          </td>
                          <td className="text-center">
                            {safeNumber(subject.project)}
                          </td>
                          <td className="text-center">
                            {safeNumber(subject.midtermTest)}
                          </td>
                          <td className="text-center">
                            {safeNumber(subject.secondTest)}
                          </td>
                          <td className="text-center fw-bold text-primary">
                            {safeNumber(subject.continuousAssessment)}
                          </td>
                          <td className="text-center">
                            {safeNumber(subject.examination)}
                          </td>
                          <td className="text-center fw-bold">
                            {safeNumber(subject.total)}
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge ${getGradeBadge(subject.grade)}`}
                            >
                              {subject.grade}
                            </span>
                          </td>
                          <td className="text-center">{subject.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="row mt-4">
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h6 className="card-subtitle mb-2 text-muted">
                          Total Score
                        </h6>
                        <h3 className="card-title text-primary mb-0">
                          {safeNumber(resultSheet.summary?.totalScore)}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h6 className="card-subtitle mb-2 text-muted">
                          Average
                        </h6>
                        <h3 className="card-title text-success mb-0">
                          {safeFixed(resultSheet.summary?.average, 2)}%
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h6 className="card-subtitle mb-2 text-muted">
                          Class Position
                        </h6>
                        <h3 className="card-title text-warning mb-0">
                          {resultSheet.summary?.positionInClass || "N/A"}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h6 className="card-subtitle mb-2 text-muted">
                          Arm Position
                        </h6>
                        <h3 className="card-title text-info mb-0">
                          {resultSheet.summary?.positionInArm || "N/A"}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "rankings" && (isAdmin || isTeacher) && (
        <div className="rankings-section">
          <div className="section-header no-print">
            <h3>Rankings</h3>

            <div className="header-actions d-flex flex-wrap gap-2">
              {!isTeacher && (
                <>
                  <select
                    value={rankingsType}
                    onChange={(e) => {
                      setRankingsType(e.target.value);
                      setRankings(null);
                    }}
                  >
                    <option value="school">School</option>
                    <option value="class">Class</option>
                    <option value="arm">Arm</option>
                  </select>

                  {(rankingsType === "class" || rankingsType === "arm") && (
                    <select
                      value={selectedClass}
                      onChange={(e) => {
                        setSelectedClass(e.target.value);
                        if (rankingsType === "class") setSelectedArm("");
                        setRankings(null);
                      }}
                    >
                      <option value="">Select Class</option>
                      {availableRankingClasses.map((className) => (
                        <option key={className} value={className}>
                          {className}
                        </option>
                      ))}
                    </select>
                  )}

                  {rankingsType === "arm" && (
                    <select
                      value={selectedArm}
                      onChange={(e) => {
                        setSelectedArm(e.target.value);
                        setRankings(null);
                      }}
                      disabled={!selectedClass}
                    >
                      <option value="">Select Arm</option>
                      {availableRankingArms.map((arm) => (
                        <option key={arm} value={arm}>
                          {arm}
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}

              <button
                className="btn btn-outline-primary"
                onClick={fetchRankings}
                disabled={loading}
              >
                {loading ? <FaSpinner className="spin" /> : <FaChartLine />}{" "}
                View Rankings
              </button>
            </div>
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

      {displayedStudents.length === 0 && !loading && !sessionsLoading && (
        <div className="alert alert-info mt-3 no-print">
          <FaUsers className="me-2" />
          {isParent
            ? "No wards found."
            : isStudent
              ? "Student profile not found."
              : isTeacher
                ? "No students found."
                : "No students found."}
        </div>
      )}
    </div>
  );
}

export default ResultManagement;

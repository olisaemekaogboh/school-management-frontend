// src/components/SessionResult.js
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  studentAPI,
  sessionResultAPI,
  sessionAPI,
  teacherAPI,
  parentPortalAPI,
} from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import {
  FaChartBar,
  FaEye,
  FaTrophy,
  FaUsers,
  FaGraduationCap,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaSyncAlt,
  FaPrint,
} from "react-icons/fa";
import useActiveSession from "../hooks/useActiveSession";
import "./SessionResult.css";

function SessionResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();
  const initializedRef = useRef(false);

  const isAdmin = user?.role === "ADMIN";
  const isTeacher = user?.role === "TEACHER";
  const isParent = user?.role === "PARENT";
  const isStudent = user?.role === "STUDENT";

  const [students, setStudents] = useState([]);
  const [parentWards, setParentWards] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sessionResult, setSessionResult] = useState(null);
  const [rankings, setRankings] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [graduates, setGraduates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [activeTab, setActiveTab] = useState("view");
  const [rankingsType, setRankingsType] = useState(
    isTeacher ? "arm" : "school",
  );
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedArm, setSelectedArm] = useState("");
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [lockedTeacherClassId, setLockedTeacherClassId] = useState(null);

  const { session, setSession, loadingSession, refreshActiveSession } =
    useActiveSession();

  const query = new URLSearchParams(location.search);
  const classIdFromQuery = query.get("classId") || "";
  const mineFromQuery = query.get("mine") === "true";
  const studentIdFromQuery = query.get("student") || "";
  const scopeFromQuery = query.get("scope") || "";

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
      .replace(/\s+/g, "")
      .toLowerCase();

  const normalizeArm = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const buildName = (...parts) =>
    parts
      .filter(
        (part) =>
          part !== undefined && part !== null && `${part}`.trim() !== "",
      )
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

  const normalizeStudentLike = (...candidates) => {
    const sources = candidates.filter(Boolean);

    const pick = (...selectors) => {
      for (const selector of selectors) {
        for (const source of sources) {
          const value = selector(source);
          if (value !== undefined && value !== null && value !== "") {
            return value;
          }
        }
      }
      return null;
    };

    const firstName = pick(
      (s) => s.firstName,
      (s) => s.firstname,
      (s) => s.givenName,
    );

    const middleName = pick(
      (s) => s.middleName,
      (s) => s.middlename,
      (s) => s.otherName,
      (s) => s.otherNames,
    );

    const lastName = pick(
      (s) => s.lastName,
      (s) => s.lastname,
      (s) => s.surname,
    );

    const fullName =
      pick(
        (s) => s.fullName,
        (s) => s.name,
        (s) => s.studentName,
      ) || buildName(firstName, middleName, lastName);

    return {
      id: pick(
        (s) => s.studentId,
        (s) => s.student_id,
        (s) => s.id,
      ),
      firstName,
      middleName,
      lastName,
      fullName,
      admissionNumber: pick(
        (s) => s.admissionNumber,
        (s) => s.admissionNo,
        (s) => s.registrationNumber,
        (s) => s.regNo,
      ),
      studentClass: pick(
        (s) => s.studentClass,
        (s) => s.className,
        (s) => s.class,
      ),
      classArm: pick(
        (s) => s.classArm,
        (s) => s.arm,
      ),
    };
  };

  const normalizedSessions = useMemo(() => {
    return (availableSessions || []).map((item) => ({
      id: item.id,
      session:
        item.session || item.sessionName || item.name || item.label || "",
      currentTerm: item.currentTerm || "FIRST",
      startDate: item.startDate,
      endDate: item.endDate,
      active: item.active === true || item.isActive === true,
    }));
  }, [availableSessions]);

  const currentStudentList = isParent ? parentWards : students;

  const teacherCanAccessStudent = useCallback(
    (student) => {
      if (!isTeacher) return true;

      const studentClass = normalizeClassName(student?.studentClass);
      const studentArm = normalizeArm(student?.classArm);

      return teacherAssignments.some(
        (a) =>
          normalizeClassName(a.className) === studentClass &&
          normalizeArm(a.arm) === studentArm,
      );
    },
    [isTeacher, teacherAssignments],
  );

  const lockedAssignment = useMemo(() => {
    if (!isTeacher || !mineFromQuery || !lockedTeacherClassId) return null;

    return (
      teacherAssignments.find(
        (a) => String(a.id) === String(lockedTeacherClassId),
      ) || null
    );
  }, [isTeacher, mineFromQuery, lockedTeacherClassId, teacherAssignments]);

  const allowedClassOptions = useMemo(() => {
    if (isAdmin) {
      return classes.map((name) => ({ name, arms: ["A", "B", "C"] }));
    }

    if (isTeacher) {
      if (mineFromQuery && lockedTeacherClassId && lockedAssignment) {
        return [
          {
            name: lockedAssignment.className,
            arms: [lockedAssignment.arm],
          },
        ];
      }

      const grouped = {};

      teacherAssignments.forEach((a) => {
        const classKey = a.className;
        if (!grouped[classKey]) grouped[classKey] = [];

        const armExists = grouped[classKey].some(
          (existingArm) => normalizeArm(existingArm) === normalizeArm(a.arm),
        );

        if (!armExists) {
          grouped[classKey].push(a.arm);
        }
      });

      return Object.entries(grouped).map(([name, arms]) => ({
        name,
        arms,
      }));
    }

    return [];
  }, [
    isAdmin,
    isTeacher,
    teacherAssignments,
    mineFromQuery,
    lockedTeacherClassId,
    lockedAssignment,
  ]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!session && normalizedSessions.length > 0) {
      const active = normalizedSessions.find((s) => s.active);
      const fallback = active || normalizedSessions[0];
      if (fallback?.session) {
        setSession(fallback.session);
      }
    }
  }, [normalizedSessions, session, setSession]);

  useEffect(() => {
    if (!mineFromQuery || !classIdFromQuery) {
      setLockedTeacherClassId(null);
      return;
    }

    setLockedTeacherClassId(Number(classIdFromQuery));
  }, [mineFromQuery, classIdFromQuery]);

  useEffect(() => {
    if (isTeacher && session) {
      loadTeacherAssignments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher, session]);

  useEffect(() => {
    if (!isTeacher || !teacherAssignments.length) return;

    if (mineFromQuery && lockedTeacherClassId) {
      const matched = teacherAssignments.find(
        (a) => String(a.id) === String(lockedTeacherClassId),
      );

      if (matched) {
        const shouldUpdate =
          normalizeClassName(selectedClass) !==
            normalizeClassName(matched.className) ||
          normalizeArm(selectedArm) !== normalizeArm(matched.arm);

        if (shouldUpdate) {
          setSelectedClass(matched.className);
          setSelectedArm(matched.arm);
          setSelectedStudent(null);
          setSessionResult(null);
          setRankings(null);
        }
      }
      return;
    }

    if (teacherAssignments.length === 1) {
      const only = teacherAssignments[0];
      const shouldUpdate =
        normalizeClassName(selectedClass) !==
          normalizeClassName(only.className) ||
        normalizeArm(selectedArm) !== normalizeArm(only.arm);

      if (shouldUpdate) {
        setSelectedClass(only.className);
        setSelectedArm(only.arm);
      }

      if (rankingsType === "school") {
        setRankingsType("arm");
      }
    }
  }, [
    isTeacher,
    teacherAssignments,
    rankingsType,
    mineFromQuery,
    lockedTeacherClassId,
    selectedClass,
    selectedArm,
  ]);

  useEffect(() => {
    setSessionResult(null);
    setRankings(null);
    setStatistics(null);
    setGraduates([]);
  }, [session, activeTab, rankingsType, selectedClass, selectedArm]);

  useEffect(() => {
    if (!session) return;
    if (selectedStudent) {
      fetchSessionResult();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent, session]);

  useEffect(() => {
    if (
      isTeacher &&
      selectedClass &&
      selectedArm &&
      teacherAssignments.length
    ) {
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher, selectedClass, selectedArm, teacherAssignments]);

  const loadInitialData = async () => {
    await Promise.all([
      fetchSessions(),
      isTeacher
        ? loadTeacherAssignments()
        : isParent
          ? loadParentWards()
          : isStudent
            ? loadStudentSelf()
            : fetchStudents(),
    ]);
  };

  const loadTeacherAssignments = async () => {
    try {
      const response = await teacherAPI.getMyClasses();
      const classList = Array.isArray(response.data) ? response.data : [];

      const normalized = classList
        .filter((c) => c?.id && c?.className && c?.arm)
        .map((c) => ({
          id: c.id,
          className: c.className,
          arm: c.arm,
        }));

      setTeacherAssignments(normalized);

      if (classIdFromQuery && mineFromQuery) {
        const matched = normalized.find(
          (c) => String(c.id) === String(classIdFromQuery),
        );

        if (!matched) {
          setLockedTeacherClassId(null);
          setSelectedClass("");
          setSelectedArm("");
          setStudents([]);
          setSelectedStudent(null);
          toast.error(
            t?.sessionResult?.accessRestricted ||
              "You can only access your assigned class arm",
          );
          return;
        }

        setLockedTeacherClassId(matched.id || null);
        setSelectedClass(matched.className);
        setSelectedArm(matched.arm);

        if (rankingsType === "school") {
          setRankingsType("arm");
        }
        return;
      }

      if (normalized.length === 1) {
        setSelectedClass(normalized[0].className);
        setSelectedArm(normalized[0].arm);
        return;
      }

      if (!selectedClass && normalized.length > 0) {
        setSelectedClass(normalized[0].className);
        setSelectedArm(normalized[0].arm);
      }
    } catch (error) {
      console.error("Error loading teacher assignments:", error);
      setTeacherAssignments([]);
      toast.error(
        t?.sessionResult?.loadAssignmentsFailed ||
          "Failed to load teacher class assignments",
      );
    }
  };

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await sessionAPI.getAllSessions();
      const list = Array.isArray(response.data) ? response.data : [];

      const sorted = [...list].sort((a, b) => {
        const aDate = new Date(a.startDate || 0).getTime();
        const bDate = new Date(b.startDate || 0).getTime();
        return bDate - aDate;
      });

      setAvailableSessions(sorted);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setAvailableSessions([]);
      toast.error(
        t?.sessionResult?.loadSessionsFailed ||
          "Failed to load academic sessions",
      );
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadParentWards = async () => {
    try {
      const response = await parentPortalAPI.getMyWards();
      const wards = Array.isArray(response.data) ? response.data : [];
      setParentWards(wards);

      if (studentIdFromQuery) {
        const matchedWard = wards.find(
          (ward) => String(ward.id) === String(studentIdFromQuery),
        );
        setSelectedStudent(matchedWard || wards[0] || null);
      } else if (wards.length === 1) {
        setSelectedStudent(wards[0]);
      }
    } catch (error) {
      console.error("Error loading parent wards:", error);
      setParentWards([]);
      toast.error(
        t?.sessionResult?.loadWardsFailed || "Failed to load your wards",
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

      const normalizedStudent = normalizeStudentLike(me, user);
      const oneStudent = normalizedStudent?.id ? [normalizedStudent] : [];

      setStudents(oneStudent);
      setSelectedStudent(normalizedStudent?.id ? normalizedStudent : null);
      setActiveTab("view");
    } catch (error) {
      console.error("Error loading student profile:", error);
      setStudents([]);
      setSelectedStudent(null);
      toast.error(
        t?.sessionResult?.loadProfileFailed || "Failed to load your profile",
      );
    }
  };

  const fetchStudents = async () => {
    try {
      let response;

      if (isTeacher) {
        const assignment = teacherAssignments.find(
          (a) =>
            normalizeClassName(a.className) ===
              normalizeClassName(selectedClass) &&
            normalizeArm(a.arm) === normalizeArm(selectedArm),
        );

        if (!assignment) {
          setStudents([]);
          return;
        }

        response = await teacherAPI.getMyClassStudents(assignment.id);
      } else {
        response = await studentAPI.getAllStudents();
      }

      const data = Array.isArray(response.data) ? response.data : [];
      setStudents(data);

      if (
        selectedStudent &&
        !data.some((student) => student.id === selectedStudent.id)
      ) {
        setSelectedStudent(null);
        setSessionResult(null);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error(
        t?.sessionResult?.loadStudentsFailed || "Failed to load students",
      );
      setStudents([]);
    }
  };

  const normalizeParentSessionResult = (data) => {
    if (!data) return null;

    if (
      data.firstTermAverage !== undefined ||
      data.annualAverage !== undefined ||
      data.subjectAverages !== undefined
    ) {
      return data;
    }

    const firstTerm = data.termResults?.firstTerm || {};
    const secondTerm = data.termResults?.secondTerm || {};
    const thirdTerm = data.termResults?.thirdTerm || {};
    const annual = data.annualSummary || {};

    return {
      firstTermTotal: firstTerm.total ?? 0,
      secondTermTotal: secondTerm.total ?? 0,
      thirdTermTotal: thirdTerm.total ?? 0,
      firstTermAverage: firstTerm.average ?? 0,
      secondTermAverage: secondTerm.average ?? 0,
      thirdTermAverage: thirdTerm.average ?? 0,
      firstTermPosition: firstTerm.position ?? null,
      secondTermPosition: secondTerm.position ?? null,
      thirdTermPosition: thirdTerm.position ?? null,
      annualTotal: annual.annualTotal ?? 0,
      annualAverage: annual.annualAverage ?? 0,
      annualPositionInClass: annual.positionInClass ?? null,
      annualPositionInArm: annual.positionInArm ?? null,
      annualPositionInSchool: annual.positionInSchool ?? null,
      attendancePercentage: annual.attendancePercentage ?? 0,
      promoted: annual.promoted ?? false,
      promotionRemark: annual.remark ?? "",
      subjectAverages: annual.subjectAverages || data.subjectAverages || {},
    };
  };

  const fetchSessionResult = async () => {
    if (!selectedStudent || !session) return;

    if (isTeacher && !teacherCanAccessStudent(selectedStudent)) {
      toast.error(
        t?.sessionResult?.studentNotInClass ||
          "You can only access results of students in your class arm",
      );
      setSessionResult(null);
      return;
    }

    setLoading(true);
    try {
      let response;
      let resultData = null;

      if (isParent || scopeFromQuery === "parent") {
        response = await parentPortalAPI.getWardSessionResult(
          selectedStudent.id,
          session,
        );
        resultData = normalizeParentSessionResult(response?.data);
      } else {
        response = await sessionResultAPI.getSessionResult(
          selectedStudent.id,
          session,
        );
        resultData = response?.data || null;
      }

      setSessionResult(resultData);
    } catch (error) {
      console.error("Error fetching session result:", error);
      setSessionResult(null);
      toast.error(
        error?.response?.data?.message ||
          t?.sessionResult?.noResultFound ||
          "No session result found for this student",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRankings = async (type, className, arm) => {
    if (!session) {
      toast.error(t?.sessionResult?.noSessionSelected || "No session selected");
      return;
    }

    if (!(isAdmin || isTeacher)) {
      toast.error(
        t?.sessionResult?.notAllowed || "You are not allowed to view rankings",
      );
      return;
    }

    if (isTeacher) {
      if (type === "school") {
        toast.error(
          t?.sessionResult?.teacherSchoolRankings ||
            "Teachers can only view rankings for their assigned class arm",
        );
        return;
      }

      const allowed = teacherAssignments.some(
        (a) =>
          normalizeClassName(a.className) === normalizeClassName(className) &&
          normalizeArm(a.arm) === normalizeArm(arm),
      );

      if (!allowed) {
        toast.error(
          t?.sessionResult?.classArmOnly ||
            "You can only view rankings for your assigned class arm",
        );
        return;
      }
    }

    setLoading(true);
    try {
      let response;

      if (type === "school") {
        response = await sessionResultAPI.getSchoolRankings(session);
      } else if (type === "class" && className) {
        response = await sessionResultAPI.getClassRankings(className, session);
      } else if (type === "arm" && className && arm) {
        response = await sessionResultAPI.getArmRankings(
          className,
          arm,
          session,
        );
      } else {
        toast.error(
          t?.sessionResult?.selectFilters ||
            "Please select the required filters",
        );
        setLoading(false);
        return;
      }

      setRankings(response.data || null);
      toast.success(
        t?.sessionResult?.rankingsLoaded || "Rankings loaded successfully",
      );
    } catch (error) {
      console.error("Error fetching rankings:", error);
      setRankings(null);
      toast.error(
        error?.response?.data?.message ||
          t?.sessionResult?.rankingsFailed ||
          "Failed to load rankings",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!session) {
      toast.error(t?.sessionResult?.noSessionSelected || "No session selected");
      return;
    }

    if (!isAdmin) {
      toast.error(
        t?.sessionResult?.adminOnly || "Only admin can access statistics",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await sessionResultAPI.getSessionStatistics(session);
      setStatistics(response.data || null);
      toast.success(
        t?.sessionResult?.statisticsLoaded || "Statistics loaded successfully",
      );
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setStatistics(null);
      toast.error(
        error?.response?.data?.message ||
          t?.sessionResult?.statisticsFailed ||
          "Failed to load statistics",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchGraduates = async () => {
    if (!session) {
      toast.error(t?.sessionResult?.noSessionSelected || "No session selected");
      return;
    }

    if (!isAdmin) {
      toast.error(
        t?.sessionResult?.adminOnlyGraduates ||
          "Only admin can access the graduation list",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await sessionResultAPI.getGraduationList(session);
      setGraduates(Array.isArray(response.data) ? response.data : []);
      toast.success(
        t?.sessionResult?.graduatesLoaded ||
          "Graduation list loaded successfully",
      );
    } catch (error) {
      console.error("Error fetching graduates:", error);
      setGraduates([]);
      toast.error(
        error?.response?.data?.message ||
          t?.sessionResult?.graduatesFailed ||
          "Failed to load graduation list",
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateAllResults = async () => {
    if (!session) {
      toast.error(t?.sessionResult?.noSessionSelected || "No session selected");
      return;
    }

    if (!isAdmin) {
      toast.error(
        t?.sessionResult?.adminOnlyCalculate ||
          "Only admin can calculate all session results",
      );
      return;
    }

    if (
      !window.confirm(
        t?.sessionResult?.confirmCalculateAll?.replace("{session}", session) ||
          `Calculate session results for all students in ${session}?`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response =
        await sessionResultAPI.calculateAllSessionResults(session);
      const count = Array.isArray(response.data) ? response.data.length : 0;
      toast.success(
        t?.sessionResult?.calculatedSuccess?.replace("{count}", count) ||
          `Session results calculated for ${count} students`,
      );

      if (selectedStudent) await fetchSessionResult();
      if (activeTab === "rankings") setRankings(null);
      if (activeTab === "statistics") setStatistics(null);
      if (activeTab === "graduates") setGraduates([]);
    } catch (error) {
      console.error("Error calculating results:", error);
      toast.error(
        error?.response?.data?.message ||
          t?.sessionResult?.calculateFailed ||
          "Failed to calculate session results",
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateTeacherClassResults = async () => {
    if (!session) {
      toast.error(t?.sessionResult?.noSessionSelected || "No session selected");
      return;
    }

    if (!selectedClass || !selectedArm) {
      toast.error(
        t?.sessionResult?.selectClassArm || "Please select your class and arm",
      );
      return;
    }

    const allowed = teacherAssignments.some(
      (a) =>
        normalizeClassName(a.className) === normalizeClassName(selectedClass) &&
        normalizeArm(a.arm) === normalizeArm(selectedArm),
    );

    if (!allowed) {
      toast.error(
        t?.sessionResult?.classArmOnlyCalculate ||
          "You can only calculate results for your assigned class arm",
      );
      return;
    }

    if (
      !window.confirm(
        t?.sessionResult?.confirmCalculateClass
          ?.replace("{class}", selectedClass)
          .replace("{arm}", selectedArm)
          .replace("{session}", session) ||
          `Calculate session results for ${selectedClass} ${selectedArm} in ${session}?`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await sessionResultAPI.calculateClassArmSessionResults(
        selectedClass,
        selectedArm,
        session,
      );
      const count = Array.isArray(response.data) ? response.data.length : 0;
      toast.success(
        t?.sessionResult?.calculatedSuccess?.replace("{count}", count) ||
          `Session results calculated for ${count} students`,
      );

      await fetchStudents();
      if (selectedStudent) await fetchSessionResult();
      if (activeTab === "rankings")
        await fetchRankings("arm", selectedClass, selectedArm);
    } catch (error) {
      console.error("Error calculating teacher class session results:", error);
      toast.error(
        error?.response?.data?.message ||
          t?.sessionResult?.calculateClassFailed ||
          "Failed to calculate class arm session results",
      );
    } finally {
      setLoading(false);
    }
  };

  const promoteStudents = async () => {
    if (!session) {
      toast.error(t?.sessionResult?.noSessionSelected || "No session selected");
      return;
    }

    if (!isAdmin) {
      toast.error(
        t?.sessionResult?.adminOnlyPromote ||
          "Only admin can promote students globally",
      );
      return;
    }

    if (
      !window.confirm(
        t?.sessionResult?.confirmPromote?.replace("{session}", session) ||
          `Promote students based on ${session} results? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await sessionResultAPI.promoteStudents(session);
      toast.success(
        t?.sessionResult?.promoteSuccess
          ?.replace("{promoted}", response.data?.promoted || 0)
          .replace("{graduated}", response.data?.graduated || 0)
          .replace("{retained}", response.data?.retained || 0) ||
          `Promotion complete: ${response.data?.promoted || 0} promoted, ${response.data?.graduated || 0} graduated, ${response.data?.retained || 0} retained`,
      );

      if (selectedStudent) await fetchSessionResult();
      if (isAdmin) await fetchStudents();
    } catch (error) {
      console.error("Error promoting students:", error);
      toast.error(
        error?.response?.data?.message ||
          t?.sessionResult?.promoteFailed ||
          "Failed to promote students",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAll = async () => {
    await Promise.all([
      fetchSessions(),
      isTeacher
        ? loadTeacherAssignments()
        : isParent
          ? loadParentWards()
          : isStudent
            ? loadStudentSelf()
            : fetchStudents(),
      refreshActiveSession(),
    ]);
  };

  const formatNumber = (num) => {
    const n = Number(num);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  };

  const formatOneDecimal = (num) => {
    const n = Number(num);
    return Number.isFinite(n) ? n.toFixed(1) : "0.0";
  };

  const getGradeFromAverage = (avg) => {
    const value = Number(avg) || 0;
    if (value >= 70) return { grade: "A", class: "success" };
    if (value >= 60) return { grade: "B", class: "primary" };
    if (value >= 50) return { grade: "C", class: "info" };
    if (value >= 45) return { grade: "D", class: "warning" };
    if (value >= 40) return { grade: "E", class: "secondary" };
    return { grade: "F", class: "danger" };
  };

  const getPromotionBadge = (promoted) => {
    return promoted ? (
      <span className="badge bg-success">
        <FaCheckCircle className="me-1" />{" "}
        {t?.sessionResult?.promoted || "Promoted"}
      </span>
    ) : (
      <span className="badge bg-danger">
        <FaTimesCircle className="me-1" />{" "}
        {t?.sessionResult?.retained || "Retained"}
      </span>
    );
  };

  const viewPrintableSessionResult = () => {
    const targetStudent = isStudent
      ? selectedStudent || students[0] || normalizeStudentLike(user)
      : selectedStudent;

    if (!sessionResult) {
      toast.error(
        t?.sessionResult?.loadResultFirst || "Load a session result first",
      );
      return;
    }

    if (!targetStudent?.id) {
      toast.error(t?.sessionResult?.selectStudent || "Please select a student");
      return;
    }

    if (!session) {
      toast.error(t?.sessionResult?.noSessionSelected || "No session selected");
      return;
    }

    navigate(
      `/session-results/${targetStudent.id}?session=${encodeURIComponent(session)}`,
    );
  };

  if (loadingSession || sessionsLoading) {
    return (
      <div className="session-result text-center py-5">
        <FaSpinner className="spinner" size={40} />
        <p className="mt-3">
          {t?.common?.loading || "Loading academic session..."}
        </p>
      </div>
    );
  }

  return (
    <div className={`session-result ${darkMode ? "dark-mode" : ""}`}>
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h2 className="mb-1">
              {t?.sessionResult?.title || "Session Result Management"}
            </h2>
            <div className="text-muted">
              {t?.sessionResult?.activeSession || "Active Session"}:{" "}
              <strong>
                {session || t?.common?.noActiveSession || "No active session"}
              </strong>
            </div>
          </div>

          <button className="btn-refresh" onClick={handleRefreshAll}>
            <FaSyncAlt className="me-2" />
            {t?.common?.refresh || "Refresh"}
          </button>
        </div>

        <div className="tab-buttons mb-4">
          <button
            className={`tab-btn ${activeTab === "view" ? "active" : ""}`}
            onClick={() => setActiveTab("view")}
          >
            <FaEye className="me-2" />{" "}
            {t?.sessionResult?.viewResults || "View Results"}
          </button>

          {(isAdmin || isTeacher) && (
            <button
              className={`tab-btn ${activeTab === "rankings" ? "active" : ""}`}
              onClick={() => setActiveTab("rankings")}
            >
              <FaTrophy className="me-2" />{" "}
              {t?.sessionResult?.rankings || "Rankings"}
            </button>
          )}

          {isAdmin && (
            <>
              <button
                className={`tab-btn ${activeTab === "statistics" ? "active" : ""}`}
                onClick={() => setActiveTab("statistics")}
              >
                <FaChartBar className="me-2" />{" "}
                {t?.sessionResult?.statistics || "Statistics"}
              </button>

              <button
                className={`tab-btn ${activeTab === "graduates" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("graduates");
                  fetchGraduates();
                }}
              >
                <FaGraduationCap className="me-2" />{" "}
                {t?.sessionResult?.graduates || "Graduates"}
              </button>
            </>
          )}
        </div>

        <div className="row mb-4 align-items-end">
          <div className="col-md-3">
            <label className="form-label fw-bold">
              {t?.sessionResult?.academicSession || "Academic Session"}
            </label>
            <select
              className="form-select"
              value={session}
              onChange={(e) => setSession(e.target.value)}
            >
              {normalizedSessions.length > 0 ? (
                normalizedSessions.map((s) => (
                  <option key={s.id || s.session} value={s.session}>
                    {s.session}
                  </option>
                ))
              ) : (
                <option value="">
                  {t?.common?.noSessionAvailable || "No session available"}
                </option>
              )}
            </select>
          </div>

          {isTeacher && (
            <>
              <div className="col-md-3">
                <label className="form-label fw-bold">
                  {t?.sessionResult?.class || "Class"}
                </label>
                <select
                  className="form-select"
                  value={selectedClass}
                  onChange={(e) => {
                    const newClass = e.target.value;

                    const allowedArms =
                      allowedClassOptions.find(
                        (c) =>
                          normalizeClassName(c.name) ===
                          normalizeClassName(newClass),
                      )?.arms || [];

                    setSelectedClass(newClass);
                    setSelectedArm(allowedArms[0] || "");
                    setSelectedStudent(null);
                    setSessionResult(null);
                    setRankings(null);
                  }}
                  disabled={Boolean(mineFromQuery && lockedTeacherClassId)}
                >
                  <option value="">
                    {t?.common?.select || "Select Class"}
                  </option>
                  {allowedClassOptions.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label fw-bold">
                  {t?.sessionResult?.arm || "Arm"}
                </label>
                <select
                  className="form-select"
                  value={selectedArm}
                  onChange={(e) => {
                    setSelectedArm(e.target.value);
                    setSelectedStudent(null);
                    setSessionResult(null);
                    setRankings(null);
                  }}
                  disabled={
                    !selectedClass ||
                    Boolean(mineFromQuery && lockedTeacherClassId)
                  }
                >
                  <option value="">{t?.common?.select || "Select Arm"}</option>
                  {selectedClass &&
                    allowedClassOptions
                      .find(
                        (c) =>
                          normalizeClassName(c.name) ===
                          normalizeClassName(selectedClass),
                      )
                      ?.arms.map((arm) => (
                        <option key={arm} value={arm}>
                          {arm}
                        </option>
                      ))}
                </select>
              </div>
            </>
          )}

          <div className={isTeacher ? "col-md-4" : "col-md-9"}>
            <div className="d-flex gap-2 justify-content-end flex-wrap">
              {isAdmin ? (
                <>
                  <button
                    className="btn btn-danger"
                    onClick={calculateAllResults}
                    disabled={loading || !session}
                  >
                    {loading ? (
                      <FaSpinner className="spinner" />
                    ) : (
                      "📊 " +
                      (t?.sessionResult?.calculateAll || "Calculate All")
                    )}
                  </button>

                  <button
                    className="btn btn-success"
                    onClick={promoteStudents}
                    disabled={loading || !session}
                  >
                    🎓 {t?.sessionResult?.promoteStudents || "Promote Students"}
                  </button>

                  <button
                    className="btn btn-info text-white"
                    onClick={fetchStatistics}
                    disabled={loading || !session}
                  >
                    📈 {t?.sessionResult?.refreshStats || "Refresh Stats"}
                  </button>
                </>
              ) : isTeacher ? (
                <button
                  className="btn btn-primary"
                  onClick={calculateTeacherClassResults}
                  disabled={
                    loading || !session || !selectedClass || !selectedArm
                  }
                >
                  {loading ? (
                    <FaSpinner className="spinner" />
                  ) : (
                    "📊 " +
                    (t?.sessionResult?.calculateMyClass || "Calculate My Class")
                  )}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {activeTab === "view" && (
          <div className="row mb-4">
            <div className="col-md-12">
              <div className="card">
                <div className="card-body">
                  <div className="row align-items-end">
                    {!isStudent && (
                      <div className={isTeacher ? "col-md-10" : "col-md-8"}>
                        <label className="form-label fw-bold">
                          {isParent
                            ? t?.sessionResult?.selectWard || "Select Ward"
                            : t?.sessionResult?.selectStudent ||
                              "Select Student"}
                        </label>
                        <select
                          className="form-select"
                          value={selectedStudent?.id || ""}
                          onChange={(e) => {
                            const source = isParent ? parentWards : students;
                            const student = source.find(
                              (s) => String(s.id) === String(e.target.value),
                            );
                            setSelectedStudent(student || null);
                          }}
                        >
                          <option value="">
                            {isParent
                              ? t?.sessionResult?.chooseWard ||
                                "-- Choose a ward --"
                              : t?.sessionResult?.chooseStudent ||
                                "-- Choose a student --"}
                          </option>
                          {currentStudentList.map((s) => (
                            <option key={s.id} value={s.id}>
                              {(
                                s.fullName ||
                                `${s.firstName || ""} ${s.lastName || ""}`
                              ).trim()}{" "}
                              - {s.admissionNumber} ({s.studentClass}{" "}
                              {s.classArm})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div
                      className={
                        isStudent
                          ? "col-md-12"
                          : isTeacher
                            ? "col-md-2"
                            : "col-md-4"
                      }
                    >
                      <button
                        className="btn btn-success w-100"
                        onClick={() => {
                          if (selectedStudent) {
                            fetchSessionResult();
                          }
                        }}
                        disabled={!selectedStudent || loading}
                      >
                        {t?.sessionResult?.loadResult || "Load Result"}
                      </button>
                    </div>
                  </div>

                  {isTeacher && (
                    <div className="mt-3 text-muted small">
                      {t?.sessionResult?.teacherAccessMessage ||
                        "Teachers can only access and calculate session results for students in their assigned class arm."}
                    </div>
                  )}

                  {isParent && (
                    <div className="mt-3 text-muted small">
                      {t?.sessionResult?.parentAccessMessage ||
                        "Parents can only access session results for their linked wards."}
                    </div>
                  )}

                  {isStudent && (
                    <div className="mt-3 text-muted small">
                      {t?.sessionResult?.studentAccessMessage ||
                        "Students can view only their own session result."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "rankings" && (isAdmin || isTeacher) && (
          <div className="row mb-4">
            <div className="col-md-12">
              <div className="card">
                <div className="card-body">
                  <div className="row align-items-end">
                    <div className="col-md-3">
                      <label className="form-label fw-bold">
                        {t?.sessionResult?.rankingsType || "Rankings Type"}
                      </label>
                      <select
                        className="form-select"
                        value={rankingsType}
                        onChange={(e) => setRankingsType(e.target.value)}
                      >
                        {!isTeacher && (
                          <option value="school">
                            🏫{" "}
                            {t?.sessionResult?.schoolRankings ||
                              "School Rankings"}
                          </option>
                        )}
                        {!isTeacher && (
                          <option value="class">
                            📚{" "}
                            {t?.sessionResult?.classRankings ||
                              "Class Rankings"}
                          </option>
                        )}
                        <option value="arm">
                          👥{" "}
                          {t?.sessionResult?.classArmRankings ||
                            "Class Arm Rankings"}
                        </option>
                      </select>
                    </div>

                    {rankingsType !== "school" && !isTeacher && (
                      <div className="col-md-3">
                        <label className="form-label fw-bold">
                          {t?.sessionResult?.class || "Class"}
                        </label>
                        <select
                          className="form-select"
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                        >
                          <option value="">
                            {t?.common?.select || "Select Class"}
                          </option>
                          {classes.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {(rankingsType === "arm" || isTeacher) && !isTeacher && (
                      <div className="col-md-2">
                        <label className="form-label fw-bold">
                          {t?.sessionResult?.arm || "Arm"}
                        </label>
                        <select
                          className="form-select"
                          value={selectedArm}
                          onChange={(e) => setSelectedArm(e.target.value)}
                        >
                          <option value="">
                            {t?.common?.select || "Select Arm"}
                          </option>
                          {["A", "B", "C"].map((arm) => (
                            <option key={arm} value={arm}>
                              {arm}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div
                      className={`col-md-${
                        isTeacher
                          ? "3"
                          : rankingsType === "school"
                            ? "3"
                            : rankingsType === "arm"
                              ? "2"
                              : "4"
                      }`}
                    >
                      <button
                        className="btn btn-warning w-100 text-white"
                        onClick={() =>
                          fetchRankings(
                            rankingsType,
                            selectedClass,
                            selectedArm,
                          )
                        }
                        disabled={loading}
                      >
                        {t?.sessionResult?.viewRankings || "View Rankings"}
                      </button>
                    </div>
                  </div>

                  {isTeacher && (
                    <div className="mt-3 text-muted small">
                      {t?.sessionResult?.teacherRankingsMessage ||
                        "Teachers can only view rankings for their assigned class arm."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {isAdmin && activeTab === "graduates" && (
          <div className="row mb-4">
            <div className="col-md-12">
              <div className="card">
                <div className="card-body">
                  <button
                    className="btn text-white"
                    onClick={fetchGraduates}
                    disabled={loading}
                    style={{ background: "#9C27B0" }}
                  >
                    {loading ? (
                      <FaSpinner className="spinner" />
                    ) : (
                      t?.sessionResult?.loadGraduates || "Load Graduates"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "view" && (
          <div className="view-results">
            {selectedStudent && sessionResult ? (
              <div className="card">
                <div className="card-header bg-success text-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <h5 className="mb-0">
                    {t?.sessionResult?.annualSessionResult ||
                      "Annual Session Result"}
                    : {session}
                  </h5>

                  <button
                    className="btn btn-light btn-sm"
                    onClick={viewPrintableSessionResult}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 12px",
                      fontSize: "13px",
                      fontWeight: "500",
                      borderRadius: "4px",
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: "#fff",
                      color: "#28a745",
                    }}
                  >
                    <FaPrint size={14} />
                    <span>
                      {t?.sessionResult?.printableResult ||
                        "Printable Session Result"}
                    </span>
                  </button>
                </div>

                <div className="card-body">
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <h6>
                        {t?.sessionResult?.studentInfo || "Student Information"}
                      </h6>
                      <p>
                        <strong>
                          {t?.studentDetails?.fullName || "Name"}:
                        </strong>{" "}
                        {selectedStudent?.fullName ||
                          `${selectedStudent?.firstName || ""} ${selectedStudent?.lastName || ""}`.trim() ||
                          "N/A"}
                      </p>
                      <p>
                        <strong>
                          {t?.studentDetails?.admissionNumber || "Admission"}:
                        </strong>{" "}
                        {selectedStudent?.admissionNumber || "N/A"}
                      </p>
                      <p>
                        <strong>{t?.studentDetails?.class || "Class"}:</strong>{" "}
                        {selectedStudent?.studentClass || "N/A"}{" "}
                        {selectedStudent?.classArm || ""}
                      </p>
                    </div>

                    <div className="col-md-6">
                      <h6>
                        {t?.sessionResult?.promotionStatus ||
                          "Promotion Status"}
                      </h6>
                      <p>
                        <strong>{t?.sessionResult?.status || "Status"}:</strong>{" "}
                        {sessionResult.promoted !== undefined ? (
                          getPromotionBadge(sessionResult.promoted)
                        ) : (
                          <span className="badge bg-secondary">
                            {t?.common?.unknown || "Unknown"}
                          </span>
                        )}
                      </p>
                      <p>
                        <strong>{t?.sessionResult?.remark || "Remark"}:</strong>{" "}
                        {sessionResult.promotionRemark || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="border p-3 rounded text-center">
                        <h6>{t?.sessionResult?.firstTerm || "First Term"}</h6>
                        <h3 className="text-primary">
                          {formatNumber(sessionResult.firstTermAverage)}%
                        </h3>
                        <p>
                          {t?.sessionResult?.position || "Position"}:{" "}
                          {sessionResult.firstTermPosition || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="border p-3 rounded text-center">
                        <h6>{t?.sessionResult?.secondTerm || "Second Term"}</h6>
                        <h3 className="text-success">
                          {formatNumber(sessionResult.secondTermAverage)}%
                        </h3>
                        <p>
                          {t?.sessionResult?.position || "Position"}:{" "}
                          {sessionResult.secondTermPosition || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="border p-3 rounded text-center">
                        <h6>{t?.sessionResult?.thirdTerm || "Third Term"}</h6>
                        <h3 className="text-warning">
                          {formatNumber(sessionResult.thirdTermAverage)}%
                        </h3>
                        <p>
                          {t?.sessionResult?.position || "Position"}:{" "}
                          {sessionResult.thirdTermPosition || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="row mt-3">
                    <div className="col-md-3">
                      <div className="border p-3 rounded bg-light">
                        <h6>
                          {t?.sessionResult?.annualTotal || "Annual Total"}
                        </h6>
                        <h3 className="text-primary">
                          {formatNumber(sessionResult.annualTotal)}
                        </h3>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="border p-3 rounded bg-light">
                        <h6>
                          {t?.sessionResult?.annualAverage || "Annual Average"}
                        </h6>
                        <h3 className="text-success">
                          {formatNumber(sessionResult.annualAverage)}%
                        </h3>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="border p-3 rounded bg-light">
                        <h6>
                          {t?.sessionResult?.classPosition || "Class Position"}
                        </h6>
                        <h3 className="text-warning">
                          {sessionResult.annualPositionInClass || "N/A"}
                        </h3>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="border p-3 rounded bg-light">
                        <h6>{t?.sessionResult?.attendance || "Attendance"}</h6>
                        <h3 className="text-info">
                          {formatOneDecimal(sessionResult.attendancePercentage)}
                          %
                        </h3>
                      </div>
                    </div>
                  </div>

                  {sessionResult.subjectAverages &&
                  Object.keys(sessionResult.subjectAverages).length > 0 ? (
                    <div className="mt-4">
                      <h6>
                        {t?.sessionResult?.subjectPerformance ||
                          "Subject Performance (Annual Averages)"}
                      </h6>
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead className="bg-light">
                            <tr>
                              <th>
                                {t?.studentDashboard?.subject || "Subject"}
                              </th>
                              <th>
                                {t?.sessionResult?.annualAverage ||
                                  "Annual Average"}
                              </th>
                              <th>{t?.studentDashboard?.grade || "Grade"}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(sessionResult.subjectAverages).map(
                              ([subject, average], index) => {
                                const grade = getGradeFromAverage(average);
                                return (
                                  <tr key={index}>
                                    <td>{subject}</td>
                                    <td className="fw-bold">
                                      {formatNumber(average)}%
                                    </td>
                                    <td>
                                      <span
                                        className={`badge bg-${grade.class}`}
                                      >
                                        {grade.grade}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="alert alert-info mt-4">
                      {t?.sessionResult?.noSubjectData ||
                        "No subject performance data available"}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="alert alert-info">
                {isStudent
                  ? t?.sessionResult?.clickLoadStudent ||
                    "Click 'Load Result' to view your session result."
                  : isParent
                    ? selectedStudent
                      ? t?.sessionResult?.clickLoadWard ||
                        "Click 'Load Result' to view this ward's session result."
                      : t?.sessionResult?.selectWardToView ||
                        "Please select a ward to view session result."
                    : selectedStudent
                      ? sessionResult === null
                        ? t?.sessionResult?.noResultFoundTeacher ||
                          "No session result found for this student. Click 'Calculate My Class' first if you are a teacher."
                        : t?.common?.loading || "Loading..."
                      : t?.sessionResult?.selectStudentToView ||
                        "Please select a student to view results"}
              </div>
            )}
          </div>
        )}

        {activeTab === "rankings" && (isAdmin || isTeacher) && (
          <div className="rankings">
            {rankings ? (
              <div className="card">
                <div className="card-header bg-warning text-white">
                  <h5 className="mb-0">
                    {rankings.className
                      ? `${rankings.className} ${rankings.arm || ""} `
                      : t?.sessionResult?.school || "School "}
                    {t?.sessionResult?.rankings} - {rankings.session || session}{" "}
                    {t?.sessionResult?.session}
                  </h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead>
                        <tr>
                          <th>{t?.sessionResult?.position || "Position"}</th>
                          <th>
                            {t?.sessionResult?.studentName || "Student Name"}
                          </th>
                          <th>
                            {t?.studentDetails?.admissionNumber ||
                              "Admission No"}
                          </th>
                          <th>{t?.sessionResult?.class || "Class"}</th>
                          <th>{t?.sessionResult?.arm || "Arm"}</th>
                          <th>
                            {t?.sessionResult?.annualAverage ||
                              "Annual Average"}
                          </th>
                          <th>
                            {t?.attendanceManager?.attendance || "Attendance"}
                          </th>
                          <th>{t?.sessionResult?.status || "Status"}</th>
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
                              {rank.studentClass || rankings.className || "-"}
                            </td>
                            <td>{rank.classArm || rankings.arm || "-"}</td>
                            <td>
                              <strong className="text-success">
                                {formatNumber(rank.annualAverage)}%
                              </strong>
                            </td>
                            <td>
                              <span
                                className={
                                  Number(rank.attendance) >= 75
                                    ? "text-success"
                                    : "text-danger"
                                }
                              >
                                {formatOneDecimal(rank.attendance)}%
                              </span>
                            </td>
                            <td>
                              {rank.promoted ? (
                                <span className="badge bg-success">
                                  {t?.sessionResult?.promoted || "Promoted"}
                                </span>
                              ) : (
                                <span className="badge bg-danger">
                                  {t?.sessionResult?.retained || "Retained"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}

                        {!rankings.rankings?.length && (
                          <tr>
                            <td colSpan="8" className="text-center text-muted">
                              {t?.sessionResult?.noRankingData ||
                                "No ranking data found"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-muted mt-3">
                    {t?.sessionResult?.totalStudents || "Total Students"}:{" "}
                    {rankings.totalStudents || 0}
                  </p>
                </div>
              </div>
            ) : (
              <div className="alert alert-info">
                {t?.sessionResult?.selectRankingsType ||
                  'Select rankings type and click "View Rankings" to see results'}
              </div>
            )}
          </div>
        )}

        {isAdmin && activeTab === "statistics" && (
          <div className="statistics">
            {loading ? (
              <div className="text-center py-5">
                <FaSpinner className="spinner" size={40} />
                <p className="mt-3">
                  {t?.common?.loading || "Loading statistics..."}
                </p>
              </div>
            ) : statistics ? (
              <>
                <div className="row mb-4">
                  <div className="col-md-3">
                    <div className="stat-card bg-primary text-white p-3 rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-white-50 mb-1">
                            {t?.sessionResult?.totalStudents ||
                              "Total Students"}
                          </h6>
                          <h2 className="mb-0">
                            {statistics.totalStudents || 0}
                          </h2>
                        </div>
                        <FaUsers size={40} className="opacity-50" />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="stat-card bg-success text-white p-3 rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-white-50 mb-1">
                            {t?.sessionResult?.promoted || "Promoted"}
                          </h6>
                          <h2 className="mb-0">{statistics.promoted || 0}</h2>
                        </div>
                        <FaCheckCircle size={40} className="opacity-50" />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="stat-card bg-danger text-white p-3 rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-white-50 mb-1">
                            {t?.sessionResult?.retained || "Retained"}
                          </h6>
                          <h2 className="mb-0">{statistics.retained || 0}</h2>
                        </div>
                        <FaTimesCircle size={40} className="opacity-50" />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="stat-card bg-warning text-dark p-3 rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">
                            {t?.sessionResult?.promotionRate ||
                              "Promotion Rate"}
                          </h6>
                          <h2 className="mb-0">
                            {formatOneDecimal(statistics.promotionRate)}%
                          </h2>
                        </div>
                        <FaTrophy size={40} className="opacity-50" />
                      </div>
                    </div>
                  </div>
                </div>

                {statistics.topPerformers?.length > 0 && (
                  <div className="card">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">
                        {t?.sessionResult?.topPerformers || "Top Performers"}
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>
                                {t?.sessionResult?.studentName || "Student"}
                              </th>
                              <th>
                                {t?.studentDetails?.admissionNumber ||
                                  "Admission No"}
                              </th>
                              <th>{t?.sessionResult?.class || "Class"}</th>
                              <th>{t?.sessionResult?.average || "Average"}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {statistics.topPerformers.map((item, index) => (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{item.studentName}</td>
                                <td>{item.admissionNumber}</td>
                                <td>
                                  {item.studentClass} {item.classArm}
                                </td>
                                <td className="fw-bold text-success">
                                  {formatNumber(item.annualAverage)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="alert alert-info">
                {t?.sessionResult?.clickRefreshStats ||
                  'Click "Refresh Stats" to load session statistics'}
              </div>
            )}
          </div>
        )}

        {isAdmin && activeTab === "graduates" && (
          <div className="graduates">
            {graduates.length > 0 ? (
              <div className="card">
                <div
                  className="card-header text-white"
                  style={{ background: "#9C27B0" }}
                >
                  <h5 className="mb-0">
                    {t?.sessionResult?.graduationList || "Graduation List"} -{" "}
                    {session}
                  </h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>S/N</th>
                          <th>
                            {t?.sessionResult?.studentName || "Student Name"}
                          </th>
                          <th>
                            {t?.studentDetails?.admissionNumber ||
                              "Admission No"}
                          </th>
                          <th>
                            {t?.sessionResult?.finalAverage || "Final Average"}
                          </th>
                          <th>
                            {t?.attendanceManager?.attendance || "Attendance"}
                          </th>
                          <th>{t?.sessionResult?.position || "Position"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {graduates.map((grad, index) => (
                          <tr key={grad.studentId || index}>
                            <td>{index + 1}</td>
                            <td>{grad.studentName}</td>
                            <td>{grad.admissionNumber}</td>
                            <td className="fw-bold text-success">
                              {formatNumber(grad.finalAverage)}%
                            </td>
                            <td>{formatOneDecimal(grad.attendance)}%</td>
                            <td>{grad.position || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-info">
                {t?.sessionResult?.noGraduates ||
                  "No graduates found for this session"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionResult;

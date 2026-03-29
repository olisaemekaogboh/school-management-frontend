import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  attendanceAPI,
  studentAPI,
  teacherAPI,
  sessionAPI,
  parentPortalAPI,
  classAPI,
} from "../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaUsers,
  FaChartBar,
  FaSpinner,
  FaSearch,
  FaEye,
  FaFilter,
  FaInfoCircle,
  FaSyncAlt,
  FaDownload,
  FaFilePdf,
  FaUserFriends,
} from "react-icons/fa";
import moment from "moment";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function AttendanceManager() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const initializedTeacherDefaults = useRef(false);
  const statsExportRef = useRef(null);

  const ui = {
    loadingActiveSession:
      t?.attendanceManager?.loadingActiveSession || "Loading active session...",
    refreshSessions:
      t?.attendanceManager?.refreshSessions || "Refresh Sessions",
    activeSession: t?.attendanceManager?.activeSession || "Active Session",
    noActiveSession:
      t?.attendanceManager?.noActiveSession || "No active session",
    currentBackendTerm:
      t?.attendanceManager?.currentBackendTerm || "Current Backend Term",
    wardAttendance: t?.attendanceManager?.wardAttendance || "Ward Attendance",
    attendanceManagement:
      t?.attendanceManager?.attendanceManagement || "Attendance Management",
    wardAttendanceControls:
      t?.attendanceManager?.wardAttendanceControls ||
      "Ward Attendance Controls",
    attendanceControls:
      t?.attendanceManager?.attendanceControls || "Attendance Controls",
    viewMode: t?.attendanceManager?.viewMode || "View Mode",
    markAttendance: t?.attendanceManager?.markAttendance || "Mark Attendance",
    classStatistics:
      t?.attendanceManager?.classStatistics || "Class Statistics",
    myAttendanceReport:
      t?.attendanceManager?.myAttendanceReport || "My Attendance Report",
    wardAttendanceReport:
      t?.attendanceManager?.wardAttendanceReport || "Ward Attendance Report",
    studentReport: t?.attendanceManager?.studentReport || "Student Report",
    selectWard: t?.attendanceManager?.selectWard || "Select Ward",
    selectWardPlaceholder:
      t?.attendanceManager?.selectWardPlaceholder || "Select Ward",
    classLabel: t?.attendanceManager?.classLabel || "Class",
    selectClass: t?.attendanceManager?.selectClass || "Select Class",
    arm: t?.attendanceManager?.arm || "Arm",
    selectArm: t?.attendanceManager?.selectArm || "Select Arm",
    date: t?.attendanceManager?.date || "Date",
    firstTerm: t?.attendanceManager?.firstTerm || "First Term",
    secondTerm: t?.attendanceManager?.secondTerm || "Second Term",
    thirdTerm: t?.attendanceManager?.thirdTerm || "Third Term",
    failedSessionInfo:
      t?.attendanceManager?.failedSessionInfo ||
      "Failed to load session information",
    failedStudentProfile:
      t?.attendanceManager?.failedStudentProfile ||
      "Failed to load your student profile",
    failedWards: t?.attendanceManager?.failedWards || "Failed to load wards",
    failedAssignments:
      t?.attendanceManager?.failedAssignments ||
      "Failed to load teacher class assignments",
    teacherClassRestriction:
      t?.attendanceManager?.teacherClassRestriction ||
      "You can only access your assigned class arm",
    failedStudents:
      t?.attendanceManager?.failedStudents || "Failed to load students",
    failedClassStats:
      t?.attendanceManager?.failedClassStats ||
      "Failed to load class statistics",
    failedStudentAttendance:
      t?.attendanceManager?.failedStudentAttendance ||
      "Failed to load student attendance",
    failedWardAttendance:
      t?.attendanceManager?.failedWardAttendance ||
      "Failed to load ward attendance",
    failedMarkAttendance:
      t?.attendanceManager?.failedMarkAttendance || "Failed to mark attendance",
    failedExportPdf:
      t?.attendanceManager?.failedExportPdf || "Failed to export PDF",
    exportedCsv:
      t?.attendanceManager?.exportedCsv ||
      "Attendance statistics exported to CSV",
    exportedPdf:
      t?.attendanceManager?.exportedPdf ||
      "Attendance statistics exported to PDF",
    noStatsToExport:
      t?.attendanceManager?.noStatsToExport ||
      "No attendance statistics to export",
    selectClassFirst:
      t?.attendanceManager?.selectClassFirst || "Please select a class first",
    sessionTermRequired:
      t?.attendanceManager?.sessionTermRequired ||
      "Session and term are required",
    selectClassArmSessionTerm:
      t?.attendanceManager?.selectClassArmSessionTerm ||
      "Please select class, arm, session and term first",
    present: t?.attendanceManager?.present || "Present",
    absent: t?.attendanceManager?.absent || "Absent",
    late: t?.attendanceManager?.late || "Late",
    excused: t?.attendanceManager?.excused || "Excused",
    holiday: t?.attendanceManager?.holiday || "Holiday",
  };

  const isAdmin = user?.role === "ADMIN";
  const isTeacher = user?.role === "TEACHER";
  const isStudent = user?.role === "STUDENT";
  const isParent = user?.role === "PARENT";

  const query = new URLSearchParams(location.search);
  const classIdFromQuery = query.get("classId") || "";
  const mineFromQuery = query.get("mine") === "true";

  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);

  const [students, setStudents] = useState([]);
  const [backendClasses, setBackendClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedArm, setSelectedArm] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    moment().format("YYYY-MM-DD"),
  );
  const [attendanceData, setAttendanceData] = useState({});
  const [classStats, setClassStats] = useState(null);
  const [showInlineStats, setShowInlineStats] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [viewMode, setViewMode] = useState(
    isStudent || isParent ? "report" : "mark",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [studentSummary, setStudentSummary] = useState(null);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [lockedTeacherClassId, setLockedTeacherClassId] = useState(null);
  const [myStudentProfile, setMyStudentProfile] = useState(null);
  const [parentWards, setParentWards] = useState([]);
  const [selectedWardId, setSelectedWardId] = useState("");
  const [availableSessions, setAvailableSessions] = useState([]);
  const [activeSessionObj, setActiveSessionObj] = useState(null);
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("FIRST");

  const fallbackClasses = [
    { name: "Nursery", arms: ["A", "B"] },
    { name: "Primary 1", arms: ["A", "B", "C"] },
    { name: "Primary 2", arms: ["A", "B"] },
    { name: "Primary 3", arms: ["A", "B"] },
    { name: "Primary 4", arms: ["A", "B"] },
    { name: "Primary 5", arms: ["A", "B"] },
    { name: "Primary 6", arms: ["A", "B"] },
    { name: "JSS 1", arms: ["A", "B", "C"] },
    { name: "JSS 2", arms: ["A", "B"] },
    { name: "JSS 3", arms: ["A", "B"] },
    { name: "SSS 1", arms: ["A", "B"] },
    { name: "SSS 2", arms: ["A", "B"] },
    { name: "SSS 3", arms: ["A", "B"] },
  ];

  const terms = [
    { value: "FIRST", label: ui.firstTerm },
    { value: "SECOND", label: ui.secondTerm },
    { value: "THIRD", label: ui.thirdTerm },
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

  const buildClassOptionsFromBackend = (classList = []) => {
    const grouped = {};

    classList
      .filter((c) => c?.className && c?.arm)
      .forEach((c) => {
        const classKey = c.className;
        if (!grouped[classKey]) grouped[classKey] = [];

        const armExists = grouped[classKey].some(
          (arm) => normalizeArm(arm) === normalizeArm(c.arm),
        );

        if (!armExists) grouped[classKey].push(c.arm);
      });

    return Object.entries(grouped).map(([name, arms]) => ({
      name,
      arms,
    }));
  };

  const getSessionName = (sessionItem) =>
    sessionItem?.session || sessionItem?.sessionName || "";

  const sortSessions = (sessionList) =>
    [...sessionList].sort((a, b) => {
      const aDate = new Date(a.startDate || 0).getTime();
      const bDate = new Date(b.startDate || 0).getTime();
      return bDate - aDate;
    });
  const loadSessionData = async () => {
    setLoadingSession(true);
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
      toast.error(ui.failedSessionInfo);
    } finally {
      setLoadingSession(false);
    }
  };

  const loadMyStudentProfile = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getMyProfile();
      const student = response?.data || null;

      setMyStudentProfile(student);
      setSelectedStudent(student || null);

      if (student) {
        setSelectedClass(student.studentClass || "");
        setSelectedArm(student.classArm || "");
        setStudents([student]);
      }
    } catch (error) {
      console.error("Error loading student profile:", error);
      toast.error(ui.failedStudentProfile);
      setMyStudentProfile(null);
      setSelectedStudent(null);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadParentWards = async () => {
    try {
      setLoading(true);
      const response = await parentPortalAPI.getMyWards();
      const wards = Array.isArray(response?.data) ? response.data : [];

      setParentWards(wards);

      if (wards.length > 0) {
        const firstWard = wards[0];
        setSelectedWardId(String(firstWard.id));
        setSelectedStudent(firstWard);
        setSelectedClass(firstWard.studentClass || "");
        setSelectedArm(firstWard.classArm || "");
      }
    } catch (error) {
      console.error("Error loading parent wards:", error);
      toast.error(ui.failedWards);
      setParentWards([]);
      setSelectedWardId("");
      setSelectedStudent(null);
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherAssignments = async () => {
    if (!isTeacher) return;

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
          toast.error(ui.teacherClassRestriction);
          return;
        }

        setLockedTeacherClassId(matched.id || null);
        setSelectedClass(matched.className);
        setSelectedArm(matched.arm);
        return;
      }

      if (normalized.length === 1) {
        setSelectedClass(normalized[0].className);
        setSelectedArm(normalized[0].arm);
      }
    } catch (error) {
      console.error("Error loading teacher assignments:", error);
      toast.error(ui.failedAssignments);
      setTeacherAssignments([]);
    }
  };

  const fetchStudents = async () => {
    if (!session || !term) return;

    const classId = isTeacher ? selectedTeacherAssignment?.id : selectedClassId;

    if (!classId) {
      setStudents([]);
      setAttendanceData({});
      return;
    }

    setLoading(true);

    try {
      // 🔥 USE CLASS ATTENDANCE ENDPOINT (ONE CALL ONLY)
      const response = await attendanceAPI.getClassAttendance(
        classId,
        selectedDate,
        session,
        term,
      );

      const data = response?.data?.attendance || [];

      // extract students
      const studentList = data.map((item) => item.student);

      setStudents(studentList);

      // build attendance map
      const map = {};
      data.forEach((item) => {
        map[item.student.id] = item.status || null;
      });

      setAttendanceData(map);
    } catch (error) {
      console.error("FETCH CLASS ATTENDANCE ERROR:", error);
      toast.error(ui.failedStudents);
      setStudents([]);
      setAttendanceData({});
    } finally {
      setLoading(false);
    }
  };
  const fetchClassStatistics = async () => {
    if (!session || !term) return;

    if (isTeacher && !selectedTeacherAssignment) {
      toast.error(ui.teacherClassRestriction);
      return;
    }

    if (!isTeacher && !selectedClassId) {
      setClassStats(null);
      return;
    }

    setLoading(true);
    try {
      const classId = isTeacher
        ? selectedTeacherAssignment?.id
        : selectedClassId;

      const response = await attendanceAPI.getClassTermStatisticsByClassId(
        classId,
        session,
        term,
      );

      setClassStats(response.data || null);
      setShowInlineStats(true);

      if (!selectedClass && response?.data?.className) {
        setSelectedClass(response.data.className);
      }
      if (!selectedArm && response?.data?.arm) {
        setSelectedArm(response.data.arm);
      }
    } catch (error) {
      console.error("Error fetching class statistics:", error);
      toast.error(error?.response?.data?.message || ui.failedClassStats);
      setClassStats(null);
      setShowInlineStats(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAttendance = async (studentArg = selectedStudent) => {
    if (!studentArg || !session || !term) return;

    setLoading(true);
    try {
      const [attendanceRes, summaryRes] = await Promise.all([
        attendanceAPI.getStudentTermAttendance(studentArg.id, session, term),
        attendanceAPI.getStudentTermSummary(studentArg.id, session, term),
      ]);

      const records = Array.isArray(attendanceRes.data)
        ? attendanceRes.data
        : [];

      setStudentAttendance(records);
      setStudentSummary(summaryRes.data || null);
    } catch (error) {
      console.error("Error fetching student attendance:", error);
      toast.error(error?.response?.data?.message || ui.failedStudentAttendance);
      setStudentAttendance([]);
      setStudentSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchParentWardAttendance = async (wardArg = selectedStudent) => {
    if (!wardArg || !session || !term) return;

    setLoading(true);
    try {
      const summaryRes = await parentPortalAPI.getWardAttendance(
        wardArg.id,
        session,
        term,
      );

      const recordsRes = await attendanceAPI.getStudentTermAttendance(
        wardArg.id,
        session,
        term,
      );

      const records = Array.isArray(recordsRes.data) ? recordsRes.data : [];

      setStudentAttendance(records);
      setStudentSummary(summaryRes.data || null);
    } catch (error) {
      console.error("Error fetching ward attendance:", error);
      toast.error(error?.response?.data?.message || ui.failedWardAttendance);
      setStudentAttendance([]);
      setStudentSummary(null);
    } finally {
      setLoading(false);
    }
  };
  const handleShowInlineStats = async () => {
    if (!session || !term) {
      toast.warning(ui.selectClassArmSessionTerm);
      return;
    }
    await fetchClassStatistics();
  };

  const handleHideInlineStats = () => {
    setShowInlineStats(false);
  };

  const handleMarkAll = async (status) => {
    if (students.length === 0) {
      toast.warning(ui.selectClassFirst);
      return;
    }

    if (!session || !term) {
      toast.warning(ui.sessionTermRequired);
      return;
    }

    if (isTeacher && !selectedTeacherAssignment) {
      toast.error(ui.teacherClassRestriction);
      return;
    }

    const studentIds = students.map((s) => s.id);

    setLoading(true);
    try {
      if (isTeacher) {
        await teacherAPI.markMyClassAttendance(selectedTeacherAssignment.id, {
          studentIds,
          date: selectedDate,
          session,
          term,
          status,
        });
      } else {
        await attendanceAPI.markBulkAttendance(
          studentIds,
          selectedDate,
          session,
          term,
          status,
        );
      }

      toast.success(`All students marked as ${status}`);

      const newAttendanceData = {};
      studentIds.forEach((id) => {
        newAttendanceData[id] = status;
      });
      setAttendanceData(newAttendanceData);

      if (showInlineStats) fetchClassStatistics();
    } catch (error) {
      console.error("Error marking bulk attendance:", error);
      toast.error(error?.response?.data?.message || ui.failedMarkAttendance);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkStudent = async (studentId, status) => {
    if (!session || !term) {
      toast.warning(ui.sessionTermRequired);
      return;
    }

    if (isTeacher && !selectedTeacherAssignment) {
      toast.error(ui.teacherClassRestriction);
      return;
    }

    setLoading(true);
    try {
      if (isTeacher) {
        await teacherAPI.markMyClassAttendance(selectedTeacherAssignment.id, {
          studentIds: [studentId],
          date: selectedDate,
          session,
          term,
          status,
        });
      } else {
        await attendanceAPI.markAttendance(
          studentId,
          selectedDate,
          session,
          term,
          status,
        );
      }

      toast.success(`Student marked as ${status}`);

      setAttendanceData((prev) => ({
        ...prev,
        [studentId]: status,
      }));

      if (selectedStudent?.id === studentId) fetchStudentAttendance();
      if (showInlineStats) fetchClassStatistics();
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error(error?.response?.data?.message || ui.failedMarkAttendance);
    } finally {
      setLoading(false);
    }
  };

  const exportStatisticsToCsv = () => {
    if (!classStats?.studentAttendance?.length) {
      toast.warning(ui.noStatsToExport);
      return;
    }

    const header = [
      "S/N",
      "Student Name",
      "Admission No.",
      "Class",
      "Arm",
      "Present",
      "Absent",
      "Late",
      "Excused",
      "Percentage",
      "Session",
      "Term",
    ];

    const rows = classStats.studentAttendance.map((student, index) => [
      index + 1,
      `"${student.studentName || ""}"`,
      `"${student.admissionNumber || ""}"`,
      `"${student.class || selectedClass}"`,
      `"${student.arm || selectedArm}"`,
      student.present ?? 0,
      student.absent ?? 0,
      student.late ?? 0,
      student.excused ?? 0,
      Number(student.percentage || 0).toFixed(1),
      `"${session}"`,
      `"${term}"`,
    ]);

    const csvContent = [header.join(","), ...rows.map((r) => r.join(","))].join(
      "\n",
    );

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeSession = session.replace(/[\/\\]/g, "_");
    link.href = url;
    link.setAttribute(
      "download",
      `attendance_statistics_${selectedClass || "class"}_${selectedArm || "arm"}_${term}_${safeSession}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success(ui.exportedCsv);
  };

  const exportStatisticsToPdf = async () => {
    if (!statsExportRef.current || !classStats?.studentAttendance?.length) {
      toast.warning(ui.noStatsToExport);
      return;
    }

    setExportingPdf(true);
    try {
      const canvas = await html2canvas(statsExportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "px", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeSession = session.replace(/[\/\\]/g, "_");
      pdf.save(
        `attendance_statistics_${selectedClass || "class"}_${selectedArm || "arm"}_${term}_${safeSession}.pdf`,
      );

      toast.success(ui.exportedPdf);
    } catch (error) {
      console.error("Error exporting statistics PDF:", error);
      toast.error(ui.failedExportPdf);
    } finally {
      setExportingPdf(false);
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return null;

    const badges = {
      PRESENT: {
        class: "bg-success",
        icon: <FaCheckCircle />,
        text: "Present",
      },
      ABSENT: {
        class: "bg-danger",
        icon: <FaTimesCircle />,
        text: "Absent",
      },
      LATE: {
        class: "bg-warning",
        icon: <FaClock />,
        text: "Late",
      },
      EXCUSED: {
        class: "bg-info",
        icon: <FaExclamationTriangle />,
        text: "Excused",
      },
      HOLIDAY: {
        class: "bg-secondary",
        icon: <FaCalendarAlt />,
        text: "Holiday",
      },
    };

    return badges[status] || null;
  };

  const getStatusColor = (status) => {
    const colors = {
      PRESENT: "success",
      ABSENT: "danger",
      LATE: "warning",
      EXCUSED: "info",
      HOLIDAY: "secondary",
    };
    return colors[status] || "secondary";
  };

  const filteredStudents = students.filter((student) => {
    const fullName =
      `${student.firstName || ""} ${student.lastName || ""}`.toLowerCase();
    const admission = student.admissionNumber?.toLowerCase() || "";
    const q = searchTerm.toLowerCase();
    return fullName.includes(q) || admission.includes(q);
  });

  const lockedTeacherAssignment = useMemo(() => {
    if (!isTeacher || !mineFromQuery || !lockedTeacherClassId) return null;

    return (
      teacherAssignments.find(
        (a) => String(a.id) === String(lockedTeacherClassId),
      ) || null
    );
  }, [isTeacher, mineFromQuery, lockedTeacherClassId, teacherAssignments]);

  const allowedClassOptions = useMemo(() => {
    if (isAdmin) {
      const backendOptions = buildClassOptionsFromBackend(backendClasses);
      return backendOptions.length ? backendOptions : fallbackClasses;
    }

    if (isTeacher) {
      if (mineFromQuery && lockedTeacherClassId && lockedTeacherAssignment) {
        return [
          {
            name: lockedTeacherAssignment.className,
            arms: [lockedTeacherAssignment.arm],
          },
        ];
      }

      const grouped = {};
      teacherAssignments.forEach((a) => {
        const classKey = a.className;
        if (!grouped[classKey]) grouped[classKey] = [];

        const armExists = grouped[classKey].some(
          (arm) => normalizeArm(arm) === normalizeArm(a.arm),
        );

        if (!armExists) grouped[classKey].push(a.arm);
      });

      return Object.entries(grouped).map(([name, arms]) => ({ name, arms }));
    }

    if (isStudent && myStudentProfile?.studentClass) {
      return [
        {
          name: myStudentProfile.studentClass,
          arms: [myStudentProfile.classArm].filter(Boolean),
        },
      ];
    }

    if (isParent && selectedStudent?.studentClass) {
      return [
        {
          name: selectedStudent.studentClass,
          arms: [selectedStudent.classArm].filter(Boolean),
        },
      ];
    }

    return [];
  }, [
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    backendClasses,
    teacherAssignments,
    myStudentProfile,
    selectedStudent,
    mineFromQuery,
    lockedTeacherClassId,
    lockedTeacherAssignment,
  ]);

  const selectedTeacherAssignment = useMemo(() => {
    if (!isTeacher) return null;

    return (
      teacherAssignments.find(
        (a) =>
          normalizeClassName(a.className) ===
            normalizeClassName(selectedClass) &&
          normalizeArm(a.arm) === normalizeArm(selectedArm),
      ) || null
    );
  }, [isTeacher, teacherAssignments, selectedClass, selectedArm]);

  const selectedClassId = useMemo(() => {
    if (isTeacher) return selectedTeacherAssignment?.id || null;

    const fromQuery = classIdFromQuery ? Number(classIdFromQuery) : null;
    if (fromQuery) return fromQuery;

    if (!selectedClass || !selectedArm) return null;

    const matchedBackendClass = backendClasses.find(
      (c) =>
        normalizeClassName(c.className) === normalizeClassName(selectedClass) &&
        normalizeArm(c.arm) === normalizeArm(selectedArm),
    );

    return matchedBackendClass?.id || null;
  }, [
    isTeacher,
    selectedTeacherAssignment,
    classIdFromQuery,
    selectedClass,
    selectedArm,
    backendClasses,
  ]);

  const reportStats = useMemo(() => {
    const present = studentAttendance.filter(
      (r) => r.status === "PRESENT",
    ).length;
    const absent = studentAttendance.filter(
      (r) => r.status === "ABSENT",
    ).length;
    const late = studentAttendance.filter((r) => r.status === "LATE").length;
    const excused = studentAttendance.filter(
      (r) => r.status === "EXCUSED",
    ).length;

    return { present, absent, late, excused };
  }, [studentAttendance]);
  useEffect(() => {
    loadSessionData();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const loadBackendClasses = async () => {
      try {
        const response = await classAPI.getAllClasses();
        const classList = Array.isArray(response?.data) ? response.data : [];
        setBackendClasses(classList);
      } catch (error) {
        console.error("Error loading backend classes:", error);
        setBackendClasses([]);
      }
    };

    loadBackendClasses();
  }, [isAdmin]);

  useEffect(() => {
    if (!mineFromQuery || !classIdFromQuery) {
      setLockedTeacherClassId(null);
      return;
    }
    setLockedTeacherClassId(Number(classIdFromQuery));
  }, [mineFromQuery, classIdFromQuery]);

  useEffect(() => {
    if (isTeacher || !classIdFromQuery || !backendClasses.length) return;

    const matched = backendClasses.find(
      (c) => String(c.id) === String(classIdFromQuery),
    );

    if (!matched) return;

    const shouldUpdate =
      normalizeClassName(selectedClass) !==
        normalizeClassName(matched.className) ||
      normalizeArm(selectedArm) !== normalizeArm(matched.arm);

    if (shouldUpdate) {
      setSelectedClass(matched.className || "");
      setSelectedArm(matched.arm || "");
    }
  }, [isTeacher, classIdFromQuery, backendClasses, selectedClass, selectedArm]);

  useEffect(() => {
    if (isTeacher && session) loadTeacherAssignments();
  }, [isTeacher, session]);

  useEffect(() => {
    if (isStudent) loadMyStudentProfile();
    if (isParent) loadParentWards();
  }, [isStudent, isParent]);

  useEffect(() => {
    if (!isTeacher || !teacherAssignments.length) return;

    if (mineFromQuery && lockedTeacherClassId) {
      const matched = teacherAssignments.find(
        (a) => String(a.id) === String(lockedTeacherClassId),
      );
      if (!matched) return;

      const shouldUpdate =
        normalizeClassName(selectedClass) !==
          normalizeClassName(matched.className) ||
        normalizeArm(selectedArm) !== normalizeArm(matched.arm);

      if (shouldUpdate) {
        setSelectedClass(matched.className);
        setSelectedArm(matched.arm);
        setSelectedStudent(null);
        setShowInlineStats(false);
      }
      return;
    }

    if (
      !initializedTeacherDefaults.current &&
      teacherAssignments.length === 1
    ) {
      setSelectedClass(teacherAssignments[0].className);
      setSelectedArm(teacherAssignments[0].arm);
      initializedTeacherDefaults.current = true;
    }
  }, [
    isTeacher,
    teacherAssignments,
    mineFromQuery,
    lockedTeacherClassId,
    selectedClass,
    selectedArm,
  ]);

  useEffect(() => {
    if (!selectedClass) return;

    const allowedArms =
      allowedClassOptions.find(
        (c) => normalizeClassName(c.name) === normalizeClassName(selectedClass),
      )?.arms || [];

    const armStillExists = allowedArms.some(
      (arm) => normalizeArm(arm) === normalizeArm(selectedArm),
    );

    if (!armStillExists) {
      if (allowedArms.length >= 1) setSelectedArm(allowedArms[0]);
      else if (selectedArm) setSelectedArm("");
    }
  }, [selectedClass, allowedClassOptions, selectedArm]);

  useEffect(() => {
    if (isStudent || isParent) return;
    if (!session || !term) return;

    if (viewMode === "mark" || viewMode === "report") {
      fetchStudents();
    } else if (viewMode === "stats") {
      fetchClassStatistics();
    }
  }, [
    selectedClass,
    selectedArm,
    selectedDate,
    session,
    term,
    viewMode,
    classIdFromQuery,
    selectedClassId,
  ]);

  useEffect(() => {
    if (isStudent && myStudentProfile && session && term) {
      setSelectedStudent(myStudentProfile);
      fetchStudentAttendance(myStudentProfile);
    }
  }, [isStudent, myStudentProfile, session, term]);

  useEffect(() => {
    if (isParent && selectedWardId && session && term) {
      const ward = parentWards.find(
        (w) => String(w.id) === String(selectedWardId),
      );
      if (ward) {
        setSelectedStudent(ward);
        setSelectedClass(ward.studentClass || "");
        setSelectedArm(ward.classArm || "");
        fetchParentWardAttendance(ward);
      }
    }
  }, [isParent, selectedWardId, session, term, parentWards]);

  useEffect(() => {
    if (!isStudent && !isParent && selectedStudent && session && term) {
      fetchStudentAttendance(selectedStudent);
    }
  }, [selectedStudent, session, term, isStudent, isParent]);

  if (loadingSession) {
    return (
      <div className="text-center py-5">
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">{ui.loadingActiveSession}</p>
        <style>{`
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="attendance-manager container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">
          <FaCalendarAlt className="me-2" />
          {isParent ? ui.wardAttendance : ui.attendanceManagement}
        </h2>

        <button className="btn btn-outline-primary" onClick={loadSessionData}>
          <FaSyncAlt className="me-2" />
          {ui.refreshSessions}
        </button>
      </div>

      <div className="mb-3 text-muted">
        {ui.activeSession}:{" "}
        <strong>
          {activeSessionObj
            ? getSessionName(activeSessionObj)
            : ui.noActiveSession}
        </strong>{" "}
        | {ui.currentBackendTerm}:{" "}
        <strong>{activeSessionObj?.currentTerm || "-"}</strong>
      </div>

      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            {isParent ? ui.wardAttendanceControls : ui.attendanceControls}
          </h5>
        </div>

        <div className="card-body">
          <div className="row">
            <div className="col-md-2 mb-3">
              <label className="form-label">{ui.viewMode}</label>
              <select
                className="form-select"
                value={viewMode}
                onChange={(e) => {
                  setViewMode(e.target.value);
                  if (e.target.value !== "stats") setShowInlineStats(false);
                }}
                disabled={isStudent || isParent}
              >
                {!isStudent && !isParent && (
                  <option value="mark">{ui.markAttendance}</option>
                )}
                {!isStudent && !isParent && (
                  <option value="stats">{ui.classStatistics}</option>
                )}
                <option value="report">
                  {isStudent
                    ? ui.myAttendanceReport
                    : isParent
                      ? ui.wardAttendanceReport
                      : ui.studentReport}
                </option>
              </select>
            </div>

            {isParent && (
              <div className="col-md-3 mb-3">
                <label className="form-label">{ui.selectWard}</label>
                <select
                  className="form-select"
                  value={selectedWardId}
                  onChange={(e) => setSelectedWardId(e.target.value)}
                >
                  <option value="">{ui.selectWardPlaceholder}</option>
                  {parentWards.map((ward) => (
                    <option key={ward.id} value={ward.id}>
                      {ward.fullName || `${ward.firstName} ${ward.lastName}`} (
                      {ward.studentClass} {ward.classArm})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!isStudent && !isParent && (
              <>
                <div className="col-md-2 mb-3">
                  <label className="form-label">{ui.classLabel}</label>
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
                      setClassStats(null);
                      setShowInlineStats(false);
                    }}
                    disabled={
                      isAdmin
                        ? Boolean(classIdFromQuery)
                        : Boolean(mineFromQuery && lockedTeacherClassId)
                    }
                  >
                    <option value="">{ui.selectClass}</option>
                    {allowedClassOptions.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-2 mb-3">
                  <label className="form-label">{ui.arm}</label>
                  <select
                    className="form-select"
                    value={selectedArm}
                    onChange={(e) => {
                      setSelectedArm(e.target.value);
                      setSelectedStudent(null);
                      setClassStats(null);
                      setShowInlineStats(false);
                    }}
                    disabled={
                      !selectedClass ||
                      (isAdmin
                        ? Boolean(classIdFromQuery)
                        : Boolean(mineFromQuery && lockedTeacherClassId))
                    }
                  >
                    <option value="">{ui.selectArm}</option>
                    {selectedClass &&
                      allowedClassOptions
                        .find(
                          (c) =>
                            normalizeClassName(c.name) ===
                            normalizeClassName(selectedClass),
                        )
                        ?.arms.map((arm) => (
                          <option key={arm} value={arm}>
                            Arm {arm}
                          </option>
                        ))}
                  </select>
                </div>
              </>
            )}

            {(viewMode === "mark" ||
              (!isStudent && !isParent && viewMode === "report")) && (
              <div className="col-md-2 mb-3">
                <label className="form-label">{ui.date}</label>
                <input
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={isStudent || isParent}
                />
              </div>
            )}

            <div className="col-md-2 mb-3">
              <label className="form-label">Session</label>
              <select
                className="form-select"
                value={session}
                onChange={(e) => {
                  setSession(e.target.value);
                  setClassStats(null);
                  setShowInlineStats(false);
                }}
              >
                {availableSessions.map((sessionItem) => {
                  const sessionName = getSessionName(sessionItem);
                  return (
                    <option key={sessionName} value={sessionName}>
                      {sessionName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="col-md-2 mb-3">
              <label className="form-label">Term</label>
              <select
                className="form-select"
                value={term}
                onChange={(e) => {
                  setTerm(e.target.value);
                  setClassStats(null);
                  setShowInlineStats(false);
                }}
              >
                {terms.map((termItem) => (
                  <option key={termItem.value} value={termItem.value}>
                    {termItem.label}
                  </option>
                ))}
              </select>
            </div>

            {!isStudent && !isParent && viewMode === "stats" && (
              <div className="col-md-2 mb-3 d-flex align-items-end">
                <button
                  className="btn btn-outline-info w-100"
                  onClick={handleShowInlineStats}
                  disabled={!selectedClassId || !session || !term}
                  type="button"
                >
                  <FaChartBar className="me-2" />
                  Show Stats
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {viewMode === "stats" && showInlineStats && (
        <div className="card mb-4">
          <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FaChartBar className="me-2" />
              Attendance Statistics
              {selectedClass ? ` - ${selectedClass}` : ""}
              {selectedArm ? ` Arm ${selectedArm}` : ""}
            </h5>
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-light"
                onClick={exportStatisticsToCsv}
                type="button"
                disabled={!classStats}
              >
                <FaDownload className="me-1" />
                CSV
              </button>
              <button
                className="btn btn-sm btn-light"
                onClick={exportStatisticsToPdf}
                type="button"
                disabled={!classStats || exportingPdf}
              >
                <FaFilePdf className="me-1" />
                {exportingPdf ? "Exporting..." : "PDF"}
              </button>
              <button
                className="btn btn-sm btn-outline-light"
                onClick={handleHideInlineStats}
                type="button"
              >
                Hide
              </button>
            </div>
          </div>

          <div className="card-body" ref={statsExportRef}>
            {!classStats ? (
              <div className="alert alert-warning mb-0">
                <FaInfoCircle className="me-2" />
                No statistics available for this class, session and term.
              </div>
            ) : (
              <>
                <div className="row mb-3">
                  <div className="col-md-3">
                    <div className="alert alert-success mb-2">
                      Present:{" "}
                      <strong>
                        {classStats.present ?? classStats.presentCount ?? 0}
                      </strong>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="alert alert-danger mb-2">
                      Absent:{" "}
                      <strong>
                        {classStats.absent ?? classStats.absentCount ?? 0}
                      </strong>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="alert alert-warning mb-2">
                      Late:{" "}
                      <strong>
                        {classStats.late ?? classStats.lateCount ?? 0}
                      </strong>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="alert alert-info mb-2">
                      Excused:{" "}
                      <strong>
                        {classStats.excused ?? classStats.excusedCount ?? 0}
                      </strong>
                    </div>
                  </div>
                </div>

                {(classStats.studentAttendance || []).length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-bordered table-striped table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Student Name</th>
                          <th>Admission No.</th>
                          <th className="text-center">Present</th>
                          <th className="text-center">Absent</th>
                          <th className="text-center">Late</th>
                          <th className="text-center">Excused</th>
                          <th className="text-center">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(classStats.studentAttendance || []).map(
                          (student, index) => (
                            <tr key={student.studentId || index}>
                              <td>{index + 1}</td>
                              <td>{student.studentName || "-"}</td>
                              <td>{student.admissionNumber || "-"}</td>
                              <td className="text-center text-success fw-bold">
                                {student.present ?? 0}
                              </td>
                              <td className="text-center text-danger fw-bold">
                                {student.absent ?? 0}
                              </td>
                              <td className="text-center text-warning fw-bold">
                                {student.late ?? 0}
                              </td>
                              <td className="text-center text-info fw-bold">
                                {student.excused ?? 0}
                              </td>
                              <td className="text-center">
                                <span
                                  className={`badge ${
                                    Number(student.percentage || 0) >= 75
                                      ? "bg-success"
                                      : Number(student.percentage || 0) >= 50
                                        ? "bg-warning text-dark"
                                        : "bg-danger"
                                  }`}
                                >
                                  {Number(student.percentage || 0).toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-info mb-0">
                    <FaInfoCircle className="me-2" />
                    No attendance statistics found
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {!loading && !isStudent && !isParent && viewMode === "mark" && (
        <div className="card mb-4">
          <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FaUsers className="me-2" />
              Students - {selectedClass || "Selected Class"}{" "}
              {selectedArm ? `Arm ${selectedArm}` : ""}
            </h5>
            <span className="badge bg-light text-dark">
              {students.length} students
            </span>
          </div>

          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name or admission number"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {students.length > 0 && (
                <div className="col-md-6 d-flex justify-content-md-end gap-2 mt-3 mt-md-0 flex-wrap">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleMarkAll("PRESENT")}
                    disabled={loading}
                    type="button"
                  >
                    {ui.present}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleMarkAll("ABSENT")}
                    disabled={loading}
                    type="button"
                  >
                    {ui.absent}
                  </button>
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => handleMarkAll("LATE")}
                    disabled={loading}
                    type="button"
                  >
                    {ui.late}
                  </button>
                  <button
                    className="btn btn-info btn-sm"
                    onClick={() => handleMarkAll("EXCUSED")}
                    disabled={loading}
                    type="button"
                  >
                    {ui.excused}
                  </button>
                </div>
              )}
            </div>

            {students.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>S/N</th>
                      <th>Student Name</th>
                      <th>Admission No.</th>
                      <th>Current Status</th>
                      <th>Mark Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => {
                      const status = attendanceData[student.id];
                      const badge = getStatusBadge(status);

                      return (
                        <tr key={student.id}>
                          <td>{index + 1}</td>
                          <td>{`${student.firstName || ""} ${student.lastName || ""}`}</td>
                          <td>{student.admissionNumber}</td>
                          <td>
                            {badge ? (
                              <span className={`badge ${badge.class}`}>
                                {badge.icon}
                                <span className="ms-1">{badge.text}</span>
                              </span>
                            ) : (
                              <span className="badge bg-secondary">
                                Not marked
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm flex-wrap">
                              {["PRESENT", "ABSENT", "LATE", "EXCUSED"].map(
                                (s) => (
                                  <button
                                    key={s}
                                    className={`btn btn-outline-${getStatusColor(s)} ${
                                      status === s
                                        ? `active btn-${getStatusColor(s)}`
                                        : ""
                                    }`}
                                    onClick={() =>
                                      handleMarkStudent(student.id, s)
                                    }
                                    disabled={loading}
                                    type="button"
                                  >
                                    {s}
                                  </button>
                                ),
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info mb-0">
                <FaInfoCircle className="me-2" />
                No students found for the selected class.
              </div>
            )}
          </div>
        </div>
      )}

      {!loading &&
        (isStudent ||
          isParent ||
          (!isStudent && !isParent && viewMode === "report")) && (
          <div className="card mb-4">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">
                <FaEye className="me-2" />
                {isStudent
                  ? ui.myAttendanceReport
                  : isParent
                    ? ui.wardAttendanceReport
                    : ui.studentReport}
              </h5>
            </div>

            <div className="card-body">
              {!isStudent && !isParent && (
                <div className="mb-4">
                  <label className="form-label fw-bold">
                    Select Student for Report View
                  </label>
                  <select
                    className="form-select"
                    value={selectedStudent?.id || ""}
                    onChange={(e) => {
                      const student = students.find(
                        (s) => String(s.id) === String(e.target.value),
                      );
                      setSelectedStudent(student || null);
                    }}
                  >
                    <option value="">Choose student</option>
                    {filteredStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {`${student.firstName || ""} ${student.lastName || ""}`}{" "}
                        ({student.admissionNumber})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedStudent ? (
                <>
                  <h6 className="mb-3">
                    {selectedStudent.fullName ||
                      `${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`}
                  </h6>

                  {studentSummary && (
                    <div className="row mb-4">
                      <div className="col-md-3">
                        <div className="alert alert-success mb-2">
                          Present:{" "}
                          <strong>
                            {studentSummary.present ??
                              studentSummary.daysPresent ??
                              0}
                          </strong>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="alert alert-danger mb-2">
                          Absent:{" "}
                          <strong>
                            {studentSummary.absent ??
                              studentSummary.daysAbsent ??
                              0}
                          </strong>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="alert alert-warning mb-2">
                          Late:{" "}
                          <strong>
                            {studentSummary.late ??
                              studentSummary.daysLate ??
                              0}
                          </strong>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="alert alert-info mb-2">
                          Excused:{" "}
                          <strong>
                            {studentSummary.excused ??
                              studentSummary.daysExcused ??
                              0}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentAttendance.length > 0 ? (
                          studentAttendance.map((record) => {
                            const badge = getStatusBadge(record.status);
                            return (
                              <tr key={record.id}>
                                <td>
                                  {moment(record.date).format("DD/MM/YYYY")}
                                </td>
                                <td>
                                  {badge ? (
                                    <span className={`badge ${badge.class}`}>
                                      {badge.icon}
                                      <span className="ms-1">{badge.text}</span>
                                    </span>
                                  ) : (
                                    record.status
                                  )}
                                </td>
                                <td>{record.remarks || "-"}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="3" className="text-center text-muted">
                              No attendance records found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {studentAttendance.length > 0 && (
                    <div className="row mt-4">
                      <div className="col-md-3">
                        <div className="alert alert-success mb-2">
                          Present: <strong>{reportStats.present}</strong>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="alert alert-danger mb-2">
                          Absent: <strong>{reportStats.absent}</strong>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="alert alert-warning mb-2">
                          Late: <strong>{reportStats.late}</strong>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="alert alert-info mb-2">
                          Excused: <strong>{reportStats.excused}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="alert alert-info mb-0">
                  <FaInfoCircle className="me-2" />
                  Please select a student to view report.
                </div>
              )}
            </div>
          </div>
        )}

      {loading && (
        <div className="text-center py-5">
          <FaSpinner className="spin" size={32} />
          <p className="mt-3 mb-0">Loading...</p>
        </div>
      )}

      {!loading && !isStudent && !isParent && !selectedClass && (
        <div className="alert alert-info">
          <FaFilter className="me-2" />
          Please select a class and arm to view attendance.
        </div>
      )}

      {!loading && isParent && !selectedWardId && (
        <div className="alert alert-info">
          <FaUserFriends className="me-2" />
          Please select a ward to view attendance.
        </div>
      )}

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AttendanceManager;

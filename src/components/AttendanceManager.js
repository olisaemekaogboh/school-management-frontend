import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  attendanceAPI,
  studentAPI,
  teacherAPI,
  sessionAPI,
  parentPortalAPI,
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
  const [myStudentProfile, setMyStudentProfile] = useState(null);
  const [parentWards, setParentWards] = useState([]);
  const [selectedWardId, setSelectedWardId] = useState("");

  const [availableSessions, setAvailableSessions] = useState([]);
  const [activeSessionObj, setActiveSessionObj] = useState(null);
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("FIRST");

  const statsExportRef = useRef(null);

  const classes = [
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
  useEffect(() => {
    loadSessionData();
  }, []);

  useEffect(() => {
    if (isTeacher && session) {
      loadTeacherAssignments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher, session]);

  useEffect(() => {
    if (isStudent) {
      loadMyStudentProfile();
    }
    if (isParent) {
      loadParentWards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudent, isParent]);

  useEffect(() => {
    if (!selectedClass) return;

    const allowedArms =
      allowedClassOptions.find((c) => c.name === selectedClass)?.arms || [];

    if (!allowedArms.includes(selectedArm)) {
      if (allowedArms.length === 1) {
        setSelectedArm(allowedArms[0]);
      } else if (selectedArm) {
        setSelectedArm("");
      }
    }
  }, [selectedClass]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isStudent || isParent) return;
    if (!selectedClass || !selectedArm || !session || !term) return;

    if (viewMode === "mark" || viewMode === "report") {
      fetchStudents();
    } else if (viewMode === "stats") {
      fetchClassStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedArm, selectedDate, session, term, viewMode]);

  useEffect(() => {
    if (isStudent && myStudentProfile && session && term) {
      setSelectedStudent(myStudentProfile);
      fetchStudentAttendance(myStudentProfile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isParent, selectedWardId, session, term, parentWards]);

  useEffect(() => {
    if (!isStudent && !isParent && selectedStudent && session && term) {
      fetchStudentAttendance(selectedStudent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent, session, term, isStudent, isParent]);

  const getSessionName = (sessionItem) => {
    return sessionItem?.session || sessionItem?.sessionName || "";
  };

  const sortSessions = (sessionList) => {
    return [...sessionList].sort((a, b) => {
      const aDate = new Date(a.startDate || 0).getTime();
      const bDate = new Date(b.startDate || 0).getTime();
      return bDate - aDate;
    });
  };

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
      toast.error("Failed to load session information");
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
      toast.error("Failed to load your student profile");
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
      toast.error("Failed to load wards");
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
          setSelectedClass("");
          setSelectedArm("");
          toast.error("You can only access your assigned class arm");
          return;
        }

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
      toast.error("Failed to load teacher class assignments");
      setTeacherAssignments([]);
    }
  };

  const allowedClassOptions = useMemo(() => {
    if (isAdmin) return classes;

    if (isTeacher) {
      const grouped = {};
      teacherAssignments.forEach((a) => {
        if (!grouped[a.className]) grouped[a.className] = [];
        if (!grouped[a.className].includes(a.arm)) {
          grouped[a.className].push(a.arm);
        }
      });

      return Object.entries(grouped).map(([name, arms]) => ({
        name,
        arms,
      }));
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
    teacherAssignments,
    myStudentProfile,
    selectedStudent,
  ]);

  const selectedTeacherAssignment = useMemo(() => {
    if (!isTeacher) return null;

    return (
      teacherAssignments.find(
        (a) => a.className === selectedClass && a.arm === selectedArm,
      ) || null
    );
  }, [isTeacher, teacherAssignments, selectedClass, selectedArm]);

  const isAllowedTeacherClass = (className, arm) => {
    if (isAdmin) return true;
    return teacherAssignments.some(
      (a) => a.className === className && a.arm === arm,
    );
  };

  const fetchStudents = async () => {
    if (!selectedClass || !selectedArm || !session || !term) return;

    if (isTeacher && !selectedTeacherAssignment) {
      toast.error("You can only manage attendance for your assigned class arm");
      return;
    }

    setLoading(true);
    try {
      let response;

      if (isTeacher) {
        response = await teacherAPI.getMyClassStudents(
          selectedTeacherAssignment.id,
        );
      } else {
        response = await studentAPI.getStudentsByClassAndArm(
          selectedClass,
          selectedArm,
        );
      }

      const studentList = Array.isArray(response.data) ? response.data : [];
      setStudents(studentList);

      const attendanceMap = {};
      studentList.forEach((student) => {
        attendanceMap[student.id] = null;
      });
      setAttendanceData(attendanceMap);

      await fetchExistingAttendance(studentList);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
      setStudents([]);
      setAttendanceData({});
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAttendance = async (studentList) => {
    try {
      const updates = {};

      for (const student of studentList) {
        try {
          const response = await attendanceAPI.getStudentAttendance(
            student.id,
            selectedDate,
            session,
            term,
          );

          const data = response?.data;

          if (data?.exists === false) {
            updates[student.id] = null;
          } else if (data?.status) {
            updates[student.id] = data.status;
          } else {
            updates[student.id] = null;
          }
        } catch (error) {
          console.error(
            "Error fetching attendance for student:",
            student.id,
            error,
          );
          updates[student.id] = null;
        }
      }

      setAttendanceData((prev) => ({
        ...prev,
        ...updates,
      }));
    } catch (error) {
      console.error("Error fetching existing attendance:", error);
    }
  };

  const fetchClassStatistics = async () => {
    if (!selectedClass || !selectedArm || !session || !term) return;

    if (isTeacher && !isAllowedTeacherClass(selectedClass, selectedArm)) {
      toast.error(
        "You can only view attendance statistics for your assigned class arm",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await attendanceAPI.getClassTermStatistics(
        selectedClass,
        selectedArm,
        session,
        term,
      );
      setClassStats(response.data);
    } catch (error) {
      console.error("Error fetching class statistics:", error);
      toast.error(
        error?.response?.data?.message || "Failed to load class statistics",
      );
      setClassStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleShowInlineStats = async () => {
    if (!selectedClass || !selectedArm || !session || !term) {
      toast.warning("Please select class, arm, session and term first");
      return;
    }

    await fetchClassStatistics();
    setShowInlineStats(true);
  };

  const handleHideInlineStats = () => {
    setShowInlineStats(false);
  };

  const exportStatisticsToCsv = () => {
    if (!classStats?.studentAttendance?.length) {
      toast.warning("No attendance statistics to export");
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
      `attendance_statistics_${selectedClass}_${selectedArm}_${term}_${safeSession}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("Attendance statistics exported to CSV");
  };

  const exportStatisticsToPdf = async () => {
    if (!statsExportRef.current || !classStats?.studentAttendance?.length) {
      toast.warning("No attendance statistics to export");
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
        `attendance_statistics_${selectedClass}_${selectedArm}_${term}_${safeSession}.pdf`,
      );

      toast.success("Attendance statistics exported to PDF");
    } catch (error) {
      console.error("Error exporting statistics PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      setExportingPdf(false);
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
      toast.error(
        error?.response?.data?.message || "Failed to load student attendance",
      );
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
      toast.error(
        error?.response?.data?.message || "Failed to load ward attendance",
      );
      setStudentAttendance([]);
      setStudentSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAll = async (status) => {
    if (!selectedClass || !selectedArm || students.length === 0) {
      toast.warning("Please select a class first");
      return;
    }

    if (!session || !term) {
      toast.warning("Session and term are required");
      return;
    }

    if (isTeacher && !selectedTeacherAssignment) {
      toast.error("You can only mark attendance for your assigned class arm");
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

      if (showInlineStats) {
        fetchClassStatistics();
      }
    } catch (error) {
      console.error("Error marking bulk attendance:", error);
      toast.error(
        error?.response?.data?.message || "Failed to mark attendance",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMarkStudent = async (studentId, status) => {
    if (!session || !term) {
      toast.warning("Session and term are required");
      return;
    }

    if (isTeacher && !selectedTeacherAssignment) {
      toast.error("You can only mark attendance for your assigned class arm");
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

      if (selectedStudent?.id === studentId) {
        fetchStudentAttendance();
      }

      if (showInlineStats) {
        fetchClassStatistics();
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error(
        error?.response?.data?.message || "Failed to mark attendance",
      );
    } finally {
      setLoading(false);
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

  if (loadingSession) {
    return (
      <div className="text-center py-5">
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">{ui.loadingActiveSession}</p>

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

  return (
    <div className="attendance-manager container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">
          <FaCalendarAlt className="me-2" />{" "}
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
                onChange={(e) => setViewMode(e.target.value)}
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
                      setSelectedClass(e.target.value);
                      setSelectedArm("");
                      setSelectedStudent(null);
                      setShowInlineStats(false);
                    }}
                    disabled={isTeacher && mineFromQuery}
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
                      setShowInlineStats(false);
                    }}
                    disabled={!selectedClass || (isTeacher && mineFromQuery)}
                  >
                    <option value="">{ui.selectArm}</option>
                    {selectedClass &&
                      allowedClassOptions
                        .find((c) => c.name === selectedClass)
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
                  setShowInlineStats(false);
                }}
                disabled={availableSessions.length === 0}
              >
                <option value="">
                  {availableSessions.length === 0
                    ? "No sessions available"
                    : "Select Session"}
                </option>
                {availableSessions.map((s) => (
                  <option key={s.id} value={getSessionName(s)}>
                    {getSessionName(s)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2 mb-3">
              <label className="form-label">Term</label>
              <select
                className="form-select"
                value={term}
                onChange={(e) => {
                  setTerm(e.target.value);
                  setShowInlineStats(false);
                }}
              >
                {terms.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!isStudent &&
            !isParent &&
            viewMode === "mark" &&
            selectedClass &&
            selectedArm && (
              <div className="mt-3">
                <label className="form-label me-3 fw-bold">
                  Quick Actions:
                </label>

                <div className="d-flex flex-wrap gap-2">
                  <button
                    className="btn btn-success"
                    onClick={() => handleMarkAll("PRESENT")}
                    disabled={loading}
                  >
                    <FaCheckCircle className="me-2" />
                    Mark All Present
                  </button>

                  <button
                    className="btn btn-danger"
                    onClick={() => handleMarkAll("ABSENT")}
                    disabled={loading}
                  >
                    <FaTimesCircle className="me-2" />
                    Mark All Absent
                  </button>

                  <button
                    className="btn btn-warning"
                    onClick={() => handleMarkAll("LATE")}
                    disabled={loading}
                  >
                    <FaClock className="me-2" />
                    Mark All Late
                  </button>

                  <button
                    className="btn btn-info"
                    onClick={() => handleMarkAll("EXCUSED")}
                    disabled={loading}
                  >
                    <FaExclamationTriangle className="me-2" />
                    Mark All Excused
                  </button>

                  <button
                    className="btn btn-outline-dark"
                    onClick={handleShowInlineStats}
                    disabled={loading}
                  >
                    <FaChartBar className="me-2" />
                    Show Statistics
                  </button>
                </div>

                {showInlineStats && (
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <button
                      className="btn btn-outline-success"
                      onClick={exportStatisticsToCsv}
                      disabled={
                        loading || !classStats?.studentAttendance?.length
                      }
                    >
                      <FaDownload className="me-2" />
                      Export Excel (CSV)
                    </button>

                    <button
                      className="btn btn-outline-danger"
                      onClick={exportStatisticsToPdf}
                      disabled={
                        loading ||
                        exportingPdf ||
                        !classStats?.studentAttendance?.length
                      }
                    >
                      {exportingPdf ? (
                        <>
                          <FaSpinner className="spin me-2" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <FaFilePdf className="me-2" />
                          Export PDF
                        </>
                      )}
                    </button>

                    <button
                      className="btn btn-outline-secondary"
                      onClick={handleHideInlineStats}
                      disabled={loading}
                    >
                      <FaTimesCircle className="me-2" />
                      Hide Statistics
                    </button>
                  </div>
                )}
              </div>
            )}

          {!isStudent &&
            !isParent &&
            viewMode === "report" &&
            selectedClass &&
            selectedArm && (
              <div className="mt-3">
                <div className="input-group">
                  <span className="input-group-text">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search students by name or admission number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading...</p>
        </div>
      )}

      {!loading &&
        !isStudent &&
        !isParent &&
        viewMode === "stats" &&
        classStats && (
          <div className="card">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">
                <FaChartBar className="me-2" />
                Class Statistics: {classStats.className} - Arm {classStats.arm}
              </h5>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-3 mb-3">
                  <div className="card bg-primary text-white">
                    <div className="card-body text-center">
                      <h3>{classStats.totalStudents}</h3>
                      <small>Total Students</small>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="card bg-success text-white">
                    <div className="card-body text-center">
                      <h3>{classStats.totalPresent}</h3>
                      <small>Total Present</small>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="card bg-danger text-white">
                    <div className="card-body text-center">
                      <h3>{classStats.totalAbsent}</h3>
                      <small>Total Absent</small>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="card bg-warning text-white">
                    <div className="card-body text-center">
                      <h3>{classStats.averageAttendance?.toFixed(1)}%</h3>
                      <small>Average Attendance</small>
                    </div>
                  </div>
                </div>
              </div>

              <h6 className="mb-3">Student Breakdown</h6>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Admission No.</th>
                      <th className="text-center">Present</th>
                      <th className="text-center">Absent</th>
                      <th className="text-center">Late</th>
                      <th className="text-center">Excused</th>
                      <th className="text-center">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStats.studentAttendance?.map((student) => (
                      <tr key={student.studentId}>
                        <td>{student.studentName}</td>
                        <td>{student.admissionNumber}</td>
                        <td className="text-center text-success">
                          {student.present}
                        </td>
                        <td className="text-center text-danger">
                          {student.absent}
                        </td>
                        <td className="text-center text-warning">
                          {student.late}
                        </td>
                        <td className="text-center text-info">
                          {student.excused}
                        </td>
                        <td className="text-center">
                          <span
                            className={`badge ${
                              student.percentage >= 75
                                ? "bg-success"
                                : student.percentage >= 50
                                  ? "bg-warning"
                                  : "bg-danger"
                            }`}
                          >
                            {student.percentage?.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}

                    {!classStats.studentAttendance?.length && (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">
                          No statistics found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {!loading && viewMode === "report" && (
        <div className="row">
          {!isStudent && !isParent && (
            <div className="col-md-4 mb-4">
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <FaUsers className="me-2" />
                    Students in {selectedClass || "-"} - Arm{" "}
                    {selectedArm || "-"}
                  </h5>
                </div>
                <div className="card-body p-0">
                  <div
                    className="list-group list-group-flush"
                    style={{ maxHeight: "500px", overflowY: "auto" }}
                  >
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                          selectedStudent?.id === student.id ? "active" : ""
                        }`}
                        onClick={() => setSelectedStudent(student)}
                      >
                        <div>
                          <div className="fw-bold">
                            {student.firstName} {student.lastName}
                          </div>
                          <small className="text-muted">
                            {student.admissionNumber}
                          </small>
                        </div>
                        <FaEye />
                      </button>
                    ))}

                    {filteredStudents.length === 0 && (
                      <div className="list-group-item text-center text-muted">
                        No students found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={isStudent || isParent ? "col-12" : "col-md-8"}>
            {selectedStudent ? (
              <div className="card">
                <div
                  className={`card-header text-white ${
                    isParent ? "bg-success" : "bg-info"
                  }`}
                >
                  <h5 className="mb-0">
                    {isParent ? (
                      <>
                        <FaUserFriends className="me-2" />
                        Ward Attendance Report: {selectedStudent.firstName}{" "}
                        {selectedStudent.lastName}
                      </>
                    ) : (
                      <>
                        Attendance Report: {selectedStudent.firstName}{" "}
                        {selectedStudent.lastName}
                      </>
                    )}
                  </h5>
                </div>
                <div className="card-body">
                  {studentSummary && (
                    <>
                      <div className="row mb-4">
                        <div className="col-md-3 mb-3">
                          <div className="card bg-primary text-white">
                            <div className="card-body text-center">
                              <h5>{studentSummary.totalSchoolDays}</h5>
                              <small>School Days</small>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-3 mb-3">
                          <div className="card bg-success text-white">
                            <div className="card-body text-center">
                              <h5>{studentSummary.daysPresent}</h5>
                              <small>Present</small>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-3 mb-3">
                          <div className="card bg-danger text-white">
                            <div className="card-body text-center">
                              <h5>{studentSummary.daysAbsent}</h5>
                              <small>Absent</small>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-3 mb-3">
                          <div className="card bg-warning text-white">
                            <div className="card-body text-center">
                              <h5>
                                {studentSummary.attendancePercentage?.toFixed(
                                  1,
                                )}
                                %
                              </h5>
                              <small>Percentage</small>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="row mb-4">
                        <div className="col-md-3 mb-3">
                          <div className="card border-success">
                            <div className="card-body text-center">
                              <h6 className="text-success">
                                {reportStats.present}
                              </h6>
                              <small>Present Records</small>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-3 mb-3">
                          <div className="card border-danger">
                            <div className="card-body text-center">
                              <h6 className="text-danger">
                                {reportStats.absent}
                              </h6>
                              <small>Absent Records</small>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-3 mb-3">
                          <div className="card border-warning">
                            <div className="card-body text-center">
                              <h6 className="text-warning">
                                {reportStats.late}
                              </h6>
                              <small>Late Records</small>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-3 mb-3">
                          <div className="card border-info">
                            <div className="card-body text-center">
                              <h6 className="text-info">
                                {reportStats.excused}
                              </h6>
                              <small>Excused Records</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {isParent && (
                    <div className="alert alert-light border mb-4">
                      <div className="row">
                        <div className="col-md-4">
                          <strong>Ward:</strong>{" "}
                          {selectedStudent.fullName ||
                            `${selectedStudent.firstName} ${selectedStudent.lastName}`}
                        </div>
                        <div className="col-md-4">
                          <strong>Class:</strong> {selectedStudent.studentClass}{" "}
                          {selectedStudent.classArm}
                        </div>
                        <div className="col-md-4">
                          <strong>Session / Term:</strong> {session} /{" "}
                          {terms.find((t) => t.value === term)?.label}
                        </div>
                      </div>
                    </div>
                  )}

                  <h6 className="mb-3">
                    Attendance History for{" "}
                    {terms.find((t) => t.value === term)?.label}
                  </h6>

                  <div className="table-responsive">
                    <table className="table table-striped table-bordered align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Date</th>
                          <th>Day</th>
                          <th>Status</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentAttendance.map((record, index) => (
                          <tr key={record.id || `${record.date}-${index}`}>
                            <td>{index + 1}</td>
                            <td>{moment(record.date).format("DD/MM/YYYY")}</td>
                            <td>{moment(record.date).format("dddd")}</td>
                            <td>
                              <span
                                className={`badge bg-${getStatusColor(record.status)}`}
                              >
                                {record.status}
                              </span>
                            </td>
                            <td>{record.remarks || "-"}</td>
                          </tr>
                        ))}

                        {studentAttendance.length === 0 && (
                          <tr>
                            <td colSpan="5" className="text-center text-muted">
                              No attendance records found for this term
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-info">
                <FaInfoCircle className="me-2" />
                {isStudent
                  ? "Your attendance record is not available yet."
                  : isParent
                    ? "Select a ward to view attendance report."
                    : "Select a student from the list to view their attendance report"}
              </div>
            )}
          </div>
        </div>
      )}

      {!loading &&
        !isStudent &&
        !isParent &&
        viewMode === "mark" &&
        students.length > 0 && (
          <>
            <div className="card">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h5 className="mb-0">
                  <FaUsers className="me-2" />
                  {selectedClass} - Arm {selectedArm} -{" "}
                  {moment(selectedDate).format("DD/MM/YYYY")}
                </h5>
                <span className="badge bg-light text-dark">
                  {
                    Object.values(attendanceData).filter((s) => s === "PRESENT")
                      .length
                  }{" "}
                  Present / {students.length} Total
                </span>
              </div>

              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student Name</th>
                        <th>Admission No.</th>
                        <th className="text-center">Current Status</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => {
                        const status = attendanceData[student.id];
                        const badge = getStatusBadge(status);

                        return (
                          <tr key={student.id}>
                            <td>{index + 1}</td>
                            <td>
                              {student.firstName} {student.lastName}
                            </td>
                            <td>{student.admissionNumber}</td>
                            <td className="text-center">
                              {status ? (
                                <span className={`badge ${badge?.class}`}>
                                  {badge?.icon} {badge?.text}
                                </span>
                              ) : (
                                <span className="badge bg-secondary">
                                  <FaClock className="me-1" />
                                  Not Marked
                                </span>
                              )}
                            </td>
                            <td className="text-center">
                              <div className="btn-group btn-group-sm">
                                <button
                                  className={`btn btn-outline-success ${status === "PRESENT" ? "active" : ""}`}
                                  onClick={() =>
                                    handleMarkStudent(student.id, "PRESENT")
                                  }
                                  disabled={loading}
                                  title="Mark Present"
                                >
                                  <FaCheckCircle />
                                </button>

                                <button
                                  className={`btn btn-outline-danger ${status === "ABSENT" ? "active" : ""}`}
                                  onClick={() =>
                                    handleMarkStudent(student.id, "ABSENT")
                                  }
                                  disabled={loading}
                                  title="Mark Absent"
                                >
                                  <FaTimesCircle />
                                </button>

                                <button
                                  className={`btn btn-outline-warning ${status === "LATE" ? "active" : ""}`}
                                  onClick={() =>
                                    handleMarkStudent(student.id, "LATE")
                                  }
                                  disabled={loading}
                                  title="Mark Late"
                                >
                                  <FaClock />
                                </button>

                                <button
                                  className={`btn btn-outline-info ${status === "EXCUSED" ? "active" : ""}`}
                                  onClick={() =>
                                    handleMarkStudent(student.id, "EXCUSED")
                                  }
                                  disabled={loading}
                                  title="Mark Excused"
                                >
                                  <FaExclamationTriangle />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {showInlineStats && classStats && (
              <div className="card mt-4" ref={statsExportRef}>
                <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <h5 className="mb-0">
                    <FaChartBar className="me-2" />
                    All Students Attendance Statistics - {
                      selectedClass
                    } Arm {selectedArm}
                  </h5>
                  <span className="badge bg-light text-dark">
                    {terms.find((t) => t.value === term)?.label} | {session}
                  </span>
                </div>

                <div className="card-body">
                  <div className="row mb-4">
                    <div className="col-md-3 mb-3">
                      <div className="card bg-primary text-white">
                        <div className="card-body text-center">
                          <h3>{classStats.totalStudents}</h3>
                          <small>Total Students</small>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-3 mb-3">
                      <div className="card bg-success text-white">
                        <div className="card-body text-center">
                          <h3>{classStats.totalPresent}</h3>
                          <small>Total Present</small>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-3 mb-3">
                      <div className="card bg-danger text-white">
                        <div className="card-body text-center">
                          <h3>{classStats.totalAbsent}</h3>
                          <small>Total Absent</small>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-3 mb-3">
                      <div className="card bg-warning text-white">
                        <div className="card-body text-center">
                          <h3>{classStats.averageAttendance?.toFixed(1)}%</h3>
                          <small>Average Attendance</small>
                        </div>
                      </div>
                    </div>
                  </div>

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
                        {classStats.studentAttendance?.map((student, index) => (
                          <tr key={student.studentId}>
                            <td>{index + 1}</td>
                            <td>{student.studentName}</td>
                            <td>{student.admissionNumber}</td>
                            <td className="text-center text-success fw-bold">
                              {student.present}
                            </td>
                            <td className="text-center text-danger fw-bold">
                              {student.absent}
                            </td>
                            <td className="text-center text-warning fw-bold">
                              {student.late}
                            </td>
                            <td className="text-center text-info fw-bold">
                              {student.excused}
                            </td>
                            <td className="text-center">
                              <span
                                className={`badge ${
                                  student.percentage >= 75
                                    ? "bg-success"
                                    : student.percentage >= 50
                                      ? "bg-warning text-dark"
                                      : "bg-danger"
                                }`}
                              >
                                {student.percentage?.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}

                        {!classStats.studentAttendance?.length && (
                          <tr>
                            <td colSpan="8" className="text-center text-muted">
                              No attendance statistics found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
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

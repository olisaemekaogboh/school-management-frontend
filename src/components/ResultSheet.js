import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { studentAPI, resultAPI, parentPortalAPI } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { toast } from "react-toastify";
import {
  FaPrint,
  FaDownload,
  FaArrowLeft,
  FaUserCircle,
  FaSpinner,
  FaSignature,
  FaCheckDouble,
  FaLock,
  FaInfoCircle,
} from "react-icons/fa";
import moment from "moment";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useAuth } from "../contexts/AuthContext";
import "./ResultSheet.css";

function ResultSheet() {
  const { studentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isStudent, isParent } = useAuth();
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const query = new URLSearchParams(location.search);
  const session = query.get("session") || "";
  const term = query.get("term") || "";

  const [resultData, setResultData] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(false);
  const [resultLoading, setResultLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [accessState, setAccessState] = useState({
    visibilityStatus: null,
    visibilityMessage: "",
    printable: false,
    printLockMessage: "",
    completed: false,
  });

  const [editableCharacterTraits, setEditableCharacterTraits] = useState([]);
  const [editablePsychomotorTraits, setEditablePsychomotorTraits] = useState(
    [],
  );
  const [editableSummary, setEditableSummary] = useState({
    teacherComment: "",
    principalComment: "",
    nextTermBegins: "",
  });
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [signingInProgress, setSigningInProgress] = useState(false);

  const componentRef = useRef(null);

  const safeNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const safeFixed = (value, digits = 2) => {
    return safeNumber(value, 0).toFixed(digits);
  };

  const getFirstDefined = (...values) => {
    for (const value of values) {
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return null;
  };

  const buildName = (...parts) =>
    parts
      .filter(
        (part) =>
          part !== undefined && part !== null && `${part}`.trim() !== "",
      )
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

  const getApiMessage = (err, fallback) =>
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback;

  const normalizeStudent = (rawStudent, rawResultData) => {
    const studentInfo = rawResultData?.studentInfo || {};
    const source = rawStudent || studentInfo || {};

    return {
      id: source.id ?? studentId,
      firstName: source.firstName ?? "",
      middleName: source.middleName ?? "",
      lastName: source.lastName ?? "",
      fullName:
        source.fullName ||
        buildName(source.firstName, source.middleName, source.lastName),
      admissionNumber: source.admissionNumber ?? "",
      studentClass:
        source.studentClass ??
        source.class ??
        source.className ??
        source.schoolClass?.className ??
        "",
      classArm: source.classArm ?? source.arm ?? source.schoolClass?.arm ?? "",
      parentName: source.parentName ?? "",
      parentPhone: source.parentPhone ?? "",
      address: source.address ?? "",
      dateOfBirth: source.dateOfBirth ?? null,
      profilePictureUrl: source.profilePictureUrl ?? "",
    };
  };

  const normalizeSubjects = (rawResultData) => {
    const rawSubjects = Array.isArray(rawResultData?.subjects)
      ? rawResultData.subjects
      : [];

    return rawSubjects.map((subject, index) => ({
      id: subject.id ?? index,
      subject: subject.subject ?? "-",
      resumptionTest: safeNumber(subject.resumptionTest),
      assignments: safeNumber(subject.assignments),
      secondTest: safeNumber(subject.secondTest),
      midtermTest: safeNumber(subject.midtermTest),
      project: safeNumber(subject.project),
      continuousAssessment: safeNumber(subject.continuousAssessment),
      examination: safeNumber(subject.examination),
      total: safeNumber(subject.total),
      grade: subject.grade ?? "-",
      remarks: subject.remarks ?? "-",
      raw: subject,
    }));
  };

  const normalizeSummary = (rawResultData) => {
    const summary = rawResultData?.summary || {};
    return {
      totalScore: safeNumber(summary.totalScore),
      average: safeNumber(summary.average),
      positionInClass: getFirstDefined(
        summary.positionInClass,
        summary.classPosition,
        t?.resultSheet?.na || "N/A",
      ),
      positionInArm: getFirstDefined(
        summary.positionInArm,
        summary.armPosition,
        t?.resultSheet?.na || "N/A",
      ),
      positionInSchool: getFirstDefined(
        summary.positionInSchool,
        summary.schoolPosition,
        t?.resultSheet?.na || "N/A",
      ),
      totalSchoolDays: safeNumber(summary.totalSchoolDays),
      daysPresent: safeNumber(summary.daysPresent),
      daysAbsent: safeNumber(summary.daysAbsent),
      attendancePercentage: safeNumber(summary.attendancePercentage),
      teacherComment: getFirstDefined(
        summary.teacherComment,
        rawResultData?.teacherComment,
        "",
      ),
      principalComment: getFirstDefined(
        summary.principalComment,
        rawResultData?.principalComment,
        "",
      ),
      nextTermBegins: getFirstDefined(
        summary.nextTermBegins,
        rawResultData?.nextTermBegins,
        null,
      ),
    };
  };

  const normalizeRatingItems = (rawResultData) => {
    const defaultCharacterTraits = [
      "Punctuality",
      "Attendance",
      "Neatness",
      "Politeness",
      "Honesty",
      "Relationship With Others",
      "Leadership",
      "Emotional Stability",
    ];

    const defaultPsychomotorTraits = [
      "Handwriting",
      "Verbal Fluency",
      "Sports",
      "Drawing / Creativity",
      "Craft",
      "Musical Skills",
    ];

    const possibleCharacterSources = [
      rawResultData?.characterTraits,
      rawResultData?.gradeCharacter,
      rawResultData?.characterAssessment,
      rawResultData?.affectiveDomain,
      rawResultData?.traits,
    ];

    const possiblePsychomotorSources = [
      rawResultData?.psychomotorTraits,
      rawResultData?.psychomotor,
      rawResultData?.psychomotorDomain,
      rawResultData?.skillsAssessment,
    ];

    const toArray = (source, defaults) => {
      if (Array.isArray(source) && source.length > 0) {
        return source.map((item, index) => ({
          id: item.id ?? index,
          label:
            item.label ||
            item.name ||
            item.trait ||
            item.title ||
            defaults[index] ||
            `Item ${index + 1}`,
          score: Math.max(
            1,
            Math.min(
              5,
              safeNumber(
                getFirstDefined(item.score, item.value, item.rating),
                1,
              ),
            ),
          ),
        }));
      }

      if (source && typeof source === "object") {
        return Object.entries(source).map(([key, value], index) => ({
          id: index,
          label: key,
          score: Math.max(
            1,
            Math.min(
              5,
              safeNumber(
                typeof value === "object"
                  ? getFirstDefined(value.score, value.value, value.rating)
                  : value,
                1,
              ),
            ),
          ),
        }));
      }

      return defaults.map((label, index) => ({
        id: index,
        label,
        score: 1,
      }));
    };

    const characterSource = possibleCharacterSources.find(
      (item) =>
        (Array.isArray(item) && item.length > 0) ||
        (item && typeof item === "object" && Object.keys(item).length > 0),
    );

    const psychomotorSource = possiblePsychomotorSources.find(
      (item) =>
        (Array.isArray(item) && item.length > 0) ||
        (item && typeof item === "object" && Object.keys(item).length > 0),
    );

    return {
      characterTraits: toArray(characterSource, defaultCharacterTraits),
      psychomotorTraits: toArray(psychomotorSource, defaultPsychomotorTraits),
    };
  };

  const normalizeGradingScale = (rawResultData) => {
    const incomingScale =
      rawResultData?.gradingScale || rawResultData?.gradeScale;

    const defaultScale = [
      { grade: "A", min: 70, max: 100, remark: "Excellent" },
      { grade: "B", min: 60, max: 69, remark: "Very Good" },
      { grade: "C", min: 50, max: 59, remark: "Good" },
      { grade: "D", min: 45, max: 49, remark: "Fair" },
      { grade: "E", min: 40, max: 44, remark: "Pass" },
      { grade: "F", min: 0, max: 39, remark: "Fail" },
    ];

    if (!Array.isArray(incomingScale) || incomingScale.length === 0) {
      return defaultScale;
    }

    return incomingScale.map((item, index) => ({
      id: item.id ?? index,
      grade: item.grade ?? "-",
      min: safeNumber(getFirstDefined(item.min, item.from, item.start), 0),
      max: safeNumber(getFirstDefined(item.max, item.to, item.end), 0),
      remark: item.remark ?? item.description ?? "-",
    }));
  };

  const normalizedSubjects = useMemo(
    () => normalizeSubjects(resultData),
    [resultData],
  );

  const normalizedSummary = useMemo(
    () => normalizeSummary(resultData),
    [resultData, t],
  );

  const normalizedRatings = useMemo(
    () => normalizeRatingItems(resultData),
    [resultData],
  );

  const gradingScale = useMemo(
    () => normalizeGradingScale(resultData),
    [resultData],
  );

  const role = user?.role?.name || user?.role || "";
  const isAdmin = role === "ADMIN";
  const isTeacher = role === "TEACHER" || role === "FORM_TEACHER";
  const canEditTeacherSection = isTeacher || isAdmin;
  const canEditAdminSection = isAdmin;

  const visibilityStatus = accessState.visibilityStatus;
  const printable = accessState.printable === true;
  const completed = accessState.completed === true;

  const canFamilyView =
    visibilityStatus === "PUBLISHED" || visibilityStatus === "PRINTABLE";
  const canFamilyPrint = visibilityStatus === "PRINTABLE" && printable;
  const isFamilyUser = isStudent || isParent;

  const canPrintDocument = isFamilyUser
    ? completed && canFamilyPrint
    : completed;

  const printDisabledReason = isFamilyUser
    ? accessState.printLockMessage ||
      accessState.visibilityMessage ||
      "Printing is not enabled for this result."
    : !completed
      ? "Result is incomplete. Required signatures are missing."
      : "";

  const getStudentName = () => {
    return (
      resultData?.studentInfo?.fullName ||
      resultData?.studentInfo?.name ||
      student?.fullName ||
      buildName(student?.firstName, student?.middleName, student?.lastName) ||
      buildName(user?.firstName, user?.middleName, user?.lastName) ||
      t?.resultSheet?.student ||
      "Student"
    );
  };

  useEffect(() => {
    if (session && term) {
      fetchResultData();
    } else {
      setError(t?.resultSheet?.missingParams || "Missing required parameters");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, session, term]);

  useEffect(() => {
    if (!resultData) return;

    setEditableCharacterTraits(
      Array.isArray(normalizedRatings.characterTraits)
        ? normalizedRatings.characterTraits
        : [],
    );

    setEditablePsychomotorTraits(
      Array.isArray(normalizedRatings.psychomotorTraits)
        ? normalizedRatings.psychomotorTraits
        : [],
    );

    setEditableSummary({
      teacherComment: normalizedSummary.teacherComment || "",
      principalComment: normalizedSummary.principalComment || "",
      nextTermBegins: normalizedSummary.nextTermBegins || "",
    });
  }, [resultData, normalizedRatings, normalizedSummary]);

  const fetchStudentRecord = async (rawResult) => {
    const resultStudentInfo = rawResult?.studentInfo || {};
    let fetchedStudent = null;

    if (isStudent && studentAPI.getMyProfile) {
      try {
        const response = await studentAPI.getMyProfile();
        fetchedStudent = response?.data || null;
      } catch (err) {
        console.warn("Failed to fetch current student profile:", err);
      }
    }

    if (!fetchedStudent && studentId) {
      try {
        const response = await studentAPI.getStudentById(studentId);
        fetchedStudent = response?.data || null;
      } catch (err) {
        console.warn("Failed to fetch student by id:", err);
      }
    }

    if (!fetchedStudent && isStudent) {
      fetchedStudent = {
        id: user?.studentId || user?.id,
        firstName: user?.firstName,
        middleName: user?.middleName,
        lastName: user?.lastName,
        fullName: buildName(user?.firstName, user?.middleName, user?.lastName),
        admissionNumber: user?.admissionNumber,
        studentClass: user?.studentClass,
        classArm: user?.classArm,
      };
    }

    if (!fetchedStudent && Object.keys(resultStudentInfo).length > 0) {
      fetchedStudent = {
        id: studentId,
        fullName:
          resultStudentInfo.fullName ||
          resultStudentInfo.name ||
          getStudentName(),
        admissionNumber: resultStudentInfo.admissionNumber,
        studentClass: resultStudentInfo.studentClass || resultStudentInfo.class,
        classArm: resultStudentInfo.classArm || resultStudentInfo.arm,
        profilePictureUrl: resultStudentInfo.profilePictureUrl,
        parentName: resultStudentInfo.parentName,
        parentPhone: resultStudentInfo.parentPhone,
        address: resultStudentInfo.address,
        dateOfBirth: resultStudentInfo.dateOfBirth,
      };
    }

    return normalizeStudent(fetchedStudent, rawResult);
  };

  const fetchResultRecord = async () => {
    if (isStudent) {
      const response = await resultAPI.getMyTermResult(session, term);
      return response?.data || null;
    }

    if (isParent) {
      if (!studentId) {
        throw new Error(t?.resultSheet?.missingWardId || "Missing ward id");
      }
      const response = await parentPortalAPI.getWardTermResult(
        studentId,
        session,
        term,
      );
      return response?.data || null;
    }

    if (!studentId) {
      throw new Error(t?.resultSheet?.missingStudentId || "Missing student id");
    }

    const response = await resultAPI.getTermResult(studentId, session, term);
    return response?.data || null;
  };

  const extractAccessState = (rawResult) => {
    return {
      visibilityStatus:
        rawResult?.visibilityStatus ||
        rawResult?.resultVisibilityStatus ||
        null,
      visibilityMessage:
        rawResult?.visibilityMessage || rawResult?.message || "",
      printable: rawResult?.printable === true,
      printLockMessage: rawResult?.printLockMessage || "",
      completed: rawResult?.completed === true,
    };
  };

  const fetchResultData = async () => {
    setLoading(true);
    setStudentLoading(true);
    setResultLoading(true);
    setError(null);
    setImageError(false);

    try {
      const rawResult = await fetchResultRecord();
      setResultData(rawResult);
      setAccessState(extractAccessState(rawResult));
      setResultLoading(false);

      const fetchedStudent = await fetchStudentRecord(rawResult);
      setStudent(fetchedStudent);
      setStudentLoading(false);
    } catch (err) {
      console.error("Error fetching result sheet:", err);

      if (err.response?.status === 404) {
        setError(
          t?.resultSheet?.noResultFound ||
            "No result found for this student in the selected term",
        );
      } else if (err.response?.status === 403) {
        setError(
          getApiMessage(
            err,
            t?.resultSheet?.accessDenied ||
              "You are not allowed to view this result",
          ),
        );
      } else {
        setError(
          getApiMessage(
            err,
            t?.resultSheet?.loadFailed || "Failed to load result sheet",
          ),
        );
      }
    } finally {
      setResultLoading(false);
      setStudentLoading(false);
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date ? moment(date).format("DD/MM/YYYY") : "N/A";
  };

  const getGradeBadgeClass = (grade) => {
    const gradeMap = {
      A: "bg-success",
      B: "bg-primary",
      C: "bg-info",
      D: "bg-warning",
      E: "bg-secondary",
      F: "bg-danger",
    };
    return gradeMap[String(grade || "").toUpperCase()] || "bg-secondary";
  };

  const buildFileName = () => {
    const cleanName = getStudentName().replace(/\s+/g, "_");
    const cleanSession = String(session || "").replace(/[\/\\]/g, "_");
    return `${cleanName}_${term}_${cleanSession}`;
  };

  const updateTraitScore = (setter, id, value) => {
    const score = Math.max(1, Math.min(5, Number(value) || 1));

    setter((prev) =>
      prev.map((item, index) =>
        (item.id ?? index) === id ? { ...item, score } : item,
      ),
    );
  };

  const handleSaveAssessment = async () => {
    try {
      setSavingAssessment(true);

      const targetStudentId =
        studentId || resultData?.studentInfo?.id || student?.id;

      if (!targetStudentId) {
        throw new Error("Missing student id");
      }

      const payload = {
        characterTraits: editableCharacterTraits.map((item) => ({
          label: item.label,
          score: Math.max(1, Math.min(5, Number(item.score) || 1)),
        })),
        psychomotorTraits: editablePsychomotorTraits.map((item) => ({
          label: item.label,
          score: Math.max(1, Math.min(5, Number(item.score) || 1)),
        })),
        classTeacherComment: editableSummary.teacherComment || "",
        principalComment: editableSummary.principalComment || "",
        nextTermBegins: editableSummary.nextTermBegins || null,
      };

      await resultAPI.updateTermAssessment(
        targetStudentId,
        session,
        term,
        payload,
      );

      toast.success("Assessment saved successfully");
      await fetchResultData();
    } catch (err) {
      console.error("Failed to save term assessment:", err);
      toast.error(getApiMessage(err, "Failed to save assessment"));
    } finally {
      setSavingAssessment(false);
    }
  };

  const handleSignAsClassTeacher = async () => {
    const targetStudentId =
      studentId || resultData?.studentInfo?.id || student?.id;
    if (!targetStudentId) {
      toast.error("Missing student information");
      return;
    }

    setSigningInProgress(true);
    try {
      await resultAPI.signAsClassTeacher(targetStudentId, session, term);
      toast.success("Signed as Class Teacher successfully");
      await fetchResultData();
    } catch (err) {
      console.error("Error signing as class teacher:", err);
      toast.error(getApiMessage(err, "Failed to sign as Class Teacher"));
    } finally {
      setSigningInProgress(false);
    }
  };

  const handleSignAsAdmin = async () => {
    const targetStudentId =
      studentId || resultData?.studentInfo?.id || student?.id;
    if (!targetStudentId) {
      toast.error("Missing student information");
      return;
    }

    setSigningInProgress(true);
    try {
      await resultAPI.signAsAdmin(targetStudentId, session, term);
      toast.success("Result approved by Admin successfully");
      await fetchResultData();
    } catch (err) {
      console.error("Error approving result:", err);
      toast.error(getApiMessage(err, "Failed to approve result"));
    } finally {
      setSigningInProgress(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: buildFileName(),
    onAfterPrint: () =>
      toast.success(
        t?.resultSheet?.printSuccess || "Result sheet printed successfully",
      ),
  });

  const handlePrintClick = () => {
    if (!canPrintDocument) {
      toast.error(printDisabledReason);
      return;
    }
    handlePrint();
  };

  const handleDownloadPDF = async () => {
    if (!componentRef.current) {
      toast.error(t?.resultSheet?.notReady || "Result sheet not ready");
      return;
    }

    if (!canPrintDocument) {
      toast.error(printDisabledReason);
      return;
    }

    setDownloading(true);
    try {
      const element = componentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        allowTaint: true,
        useCORS: true,
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${buildFileName()}.pdf`);
      toast.success(
        t?.resultSheet?.downloadSuccess || "PDF downloaded successfully",
      );
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error(t?.resultSheet?.downloadFailed || "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const buildMediaUrl = (rawUrl) => {
    if (!rawUrl) return null;

    const cleaned = String(rawUrl).trim();
    if (!cleaned) return null;

    if (
      cleaned.startsWith("http://") ||
      cleaned.startsWith("https://") ||
      cleaned.startsWith("data:")
    ) {
      return cleaned;
    }

    const apiBase =
      process.env.REACT_APP_API_BASE_URL || "https://localhost:8443/api";
    const origin = apiBase.replace(/\/api\/?$/, "");

    if (cleaned.startsWith("/")) {
      return `${origin}${cleaned}`;
    }

    return `${origin}/${cleaned}`;
  };

  const studentPhotoUrl = useMemo(() => {
    const rawUrl =
      resultData?.studentInfo?.profilePictureUrl || student?.profilePictureUrl;

    return buildMediaUrl(rawUrl);
  }, [resultData, student]);

  const classTeacherSignatureUrl = useMemo(() => {
    return buildMediaUrl(
      resultData?.signatures?.classTeacherSignature ||
        resultData?.signatures?.classTeacherSignatureUrl,
    );
  }, [resultData]);

  const adminSignatureUrl = useMemo(() => {
    return buildMediaUrl(
      resultData?.signatures?.adminSignature ||
        resultData?.signatures?.adminSignatureUrl,
    );
  }, [resultData]);

  const totalSchoolDays = normalizedSummary.totalSchoolDays;
  const daysPresent = normalizedSummary.daysPresent;
  const daysAbsent = normalizedSummary.daysAbsent;
  const attendancePercentage = normalizedSummary.attendancePercentage;

  const getCaColumnOrder = () => {
    return [
      {
        key: "resumptionTest",
        label: "RES",
        possibleKeys: ["resumptionTest", "resumption", "resit", "resitTest"],
      },
      {
        key: "assignments",
        label: "ASSGN",
        possibleKeys: [
          "assignments",
          "assignment",
          "assgn",
          "assg",
          "homework",
          "hw",
        ],
      },
      {
        key: "secondTest",
        label: "2ND",
        possibleKeys: ["secondTest", "second", "test2", "2ndTest"],
      },
      {
        key: "midtermTest",
        label: "MID",
        possibleKeys: ["midtermTest", "midterm", "mid", "midTest"],
      },
      {
        key: "project",
        label: "PROJ",
        possibleKeys: ["project", "proj", "projects"],
      },
    ];
  };

  const getExistingCaColumns = () => {
    if (!normalizedSubjects.length) return [];
    const firstSubject = normalizedSubjects[0];

    return getCaColumnOrder()
      .filter((col) =>
        col.possibleKeys.some((key) => typeof firstSubject[key] === "number"),
      )
      .map((col) => {
        const actualKey = col.possibleKeys.find(
          (key) => typeof firstSubject[key] === "number",
        );
        return {
          ...col,
          actualKey: actualKey || col.key,
        };
      });
  };

  const existingCaColumns = getExistingCaColumns();

  const calculateCATotal = (subject) => {
    if (safeNumber(subject.continuousAssessment) > 0) {
      return safeNumber(subject.continuousAssessment);
    }

    return existingCaColumns.reduce((total, col) => {
      return total + safeNumber(subject[col.actualKey]);
    }, 0);
  };

  const ratingLegend = [
    { value: 5, label: "Excellent" },
    { value: 4, label: "Very Good" },
    { value: 3, label: "Good" },
    { value: 2, label: "Fair" },
    { value: 1, label: "Poor" },
  ];

  const classTeacherSignedAt =
    resultData?.signatures?.classTeacherSignedAt ||
    resultData?.signatures?.classTeacherSignedDate;

  const adminSignedAt =
    resultData?.signatures?.adminSignedAt ||
    resultData?.signatures?.adminSignedDate;

  if (loading || resultLoading || studentLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="text-center">
          <FaSpinner className="spinner mb-3" size={40} />
          <h5>{t?.common?.loading || "Loading result sheet..."}</h5>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>{t?.resultSheet?.errorTitle || "Error Loading Result"}</h4>
          <p>{error}</p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate("/results")}
          >
            <FaArrowLeft className="me-2" />{" "}
            {t?.resultSheet?.backToResults || "Back to Results"}
          </button>
        </div>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          <h4>{t?.resultSheet?.noResultTitle || "No Result Found"}</h4>
          <p>
            {t?.resultSheet?.noResultMessage ||
              "No result found for this student in"}{" "}
            {term} {t?.resultSheet?.term || "term"}, {session}{" "}
            {t?.resultSheet?.session || "session"}.
          </p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate("/results")}
          >
            <FaArrowLeft className="me-2" />{" "}
            {t?.resultSheet?.backToResults || "Back to Results"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`result-sheet-wrapper ${darkMode ? "dark-mode" : "light-mode"}`}
    >
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft className="me-2" /> {t?.common?.back || "Back"}
        </button>

        <div className="d-flex flex-wrap gap-2">
          {(canEditTeacherSection || canEditAdminSection) && (
            <div className="btn-group me-2">
              {canEditTeacherSection &&
                !resultData?.signatures?.classTeacherSigned && (
                  <button
                    className="btn btn-outline-dark"
                    onClick={handleSignAsClassTeacher}
                    disabled={
                      signingInProgress || savingAssessment || downloading
                    }
                  >
                    {signingInProgress ? (
                      <FaSpinner className="spinner me-2" />
                    ) : (
                      <FaSignature className="me-2" />
                    )}
                    Sign as Class Teacher
                  </button>
                )}

              {canEditAdminSection && !resultData?.signatures?.adminSigned && (
                <button
                  className="btn btn-dark"
                  onClick={handleSignAsAdmin}
                  disabled={
                    signingInProgress || savingAssessment || downloading
                  }
                >
                  {signingInProgress ? (
                    <FaSpinner className="spinner me-2" />
                  ) : (
                    <FaCheckDouble className="me-2" />
                  )}
                  Approve Result
                </button>
              )}
            </div>
          )}

          {(canEditTeacherSection || canEditAdminSection) && (
            <button
              className="btn btn-primary"
              onClick={handleSaveAssessment}
              disabled={savingAssessment || downloading || signingInProgress}
            >
              {savingAssessment ? (
                <>
                  <FaSpinner className="spinner me-2" /> Saving...
                </>
              ) : (
                "Save Assessment"
              )}
            </button>
          )}

          <button
            className="btn btn-outline-success"
            onClick={handlePrintClick}
            disabled={
              !canPrintDocument ||
              downloading ||
              savingAssessment ||
              signingInProgress
            }
            title={!canPrintDocument ? printDisabledReason : ""}
          >
            <FaPrint className="me-2" /> {t?.common?.print || "Print"}
          </button>

          <button
            className="btn btn-outline-primary"
            onClick={handleDownloadPDF}
            disabled={
              !canPrintDocument ||
              downloading ||
              savingAssessment ||
              signingInProgress
            }
            title={!canPrintDocument ? printDisabledReason : ""}
          >
            {downloading ? (
              <>
                <FaSpinner className="spinner me-2" />{" "}
                {t?.common?.generating || "Generating..."}
              </>
            ) : (
              <>
                <FaDownload className="me-2" />{" "}
                {t?.common?.downloadPDF || "Download PDF"}
              </>
            )}
          </button>
        </div>
      </div>

      {(accessState.visibilityMessage || accessState.printLockMessage) && (
        <div className="alert alert-info no-print d-flex align-items-start gap-2">
          {canPrintDocument || canFamilyView || !isFamilyUser ? (
            <FaInfoCircle className="mt-1" />
          ) : (
            <FaLock className="mt-1" />
          )}
          <div>
            <strong>
              {canPrintDocument || canFamilyView || !isFamilyUser
                ? "Result Information"
                : "Access Restriction"}
            </strong>
            <div>
              {canPrintDocument || !isFamilyUser
                ? accessState.visibilityMessage || accessState.printLockMessage
                : accessState.printLockMessage || accessState.visibilityMessage}
            </div>
          </div>
        </div>
      )}

      <div className="result-sheet-container" ref={componentRef}>
        <div className="result-sheet-content">
          <div className="school-header">
            <div className="school-name">
              FAITH FOUNDATION INTERNATIONAL SCHOOL
            </div>
            <div className="school-address">
              12 Bishop Shanahan, Fegge Onitsha, Anambra
            </div>
            <div className="school-contact">
              Tel: +234 903 017 5230 | Email: info@faithfoundation.edu.ng
            </div>
          </div>

          <div className="text-end mb-2">
            {completed ? (
              <span className="badge bg-success">RESULT COMPLETE</span>
            ) : (
              <span className="badge bg-danger">RESULT INCOMPLETE</span>
            )}{" "}
            {visibilityStatus ? (
              <span className="badge bg-secondary ms-2">
                {String(visibilityStatus).replace(/_/g, " ")}
              </span>
            ) : null}
          </div>

          <div className="result-title">
            {term} {t?.resultSheet?.termResult || "TERM RESULT SHEET"} -{" "}
            {session} {t?.resultSheet?.session || "SESSION"}
          </div>

          <div className="student-info-section">
            <table className="student-info-table">
              <tbody>
                <tr>
                  <td className="label">
                    {t?.studentDetails?.fullName || "Student Name"}:
                  </td>
                  <td className="value">{getStudentName()}</td>
                  <td className="label">
                    {t?.studentDetails?.admissionNumber || "Admission No"}:
                  </td>
                  <td className="value">
                    {resultData?.studentInfo?.admissionNumber ||
                      student?.admissionNumber ||
                      "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="label">
                    {t?.studentDetails?.class || "Class"}:
                  </td>
                  <td className="value">
                    {student?.studentClass ||
                      resultData?.studentInfo?.studentClass ||
                      resultData?.studentInfo?.class ||
                      "N/A"}{" "}
                    {student?.classArm ||
                      resultData?.studentInfo?.classArm ||
                      resultData?.studentInfo?.arm ||
                      ""}
                  </td>
                  <td className="label">
                    {t?.studentDetails?.dob || "Date of Birth"}:
                  </td>
                  <td className="value">{formatDate(student?.dateOfBirth)}</td>
                </tr>
                <tr>
                  <td className="label">
                    {t?.studentDetails?.parentGuardian || "Parent/Guardian"}:
                  </td>
                  <td className="value">{student?.parentName || "N/A"}</td>
                  <td className="label">
                    {t?.studentDetails?.parentPhone || "Parent Phone"}:
                  </td>
                  <td className="value">{student?.parentPhone || "N/A"}</td>
                </tr>
                <tr>
                  <td className="label">
                    {t?.studentDetails?.address || "Address"}:
                  </td>
                  <td className="value" colSpan="3">
                    {student?.address || "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="student-photo">
              {studentPhotoUrl && !imageError ? (
                <img
                  src={studentPhotoUrl}
                  alt={getStudentName()}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="photo-placeholder">
                  <FaUserCircle />
                </div>
              )}
            </div>
          </div>

          <div className="results-table-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  <th rowSpan="2" className="sn">
                    S/N
                  </th>
                  <th rowSpan="2" className="subject">
                    {t?.studentDashboard?.subject || "SUBJECT"}
                  </th>
                  <th colSpan={existingCaColumns.length} className="ca-section">
                    CONTINUOUS ASSESSMENT (CA)
                  </th>
                  <th rowSpan="2" className="ca-total">
                    CA
                    <br />
                    TOTAL
                  </th>
                  <th rowSpan="2" className="exam">
                    EXAM
                    <br />
                    (60)
                  </th>
                  <th rowSpan="2" className="total">
                    TOTAL
                    <br />
                    (100)
                  </th>
                  <th rowSpan="2" className="grade">
                    {t?.studentDashboard?.grade || "GRADE"}
                  </th>
                  <th rowSpan="2" className="remark">
                    REMARK
                  </th>
                </tr>
                <tr className="ca-headers">
                  {existingCaColumns.map((col) => (
                    <th key={col.key} className="ca-header">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {normalizedSubjects.map((subject, index) => {
                  const caTotal = calculateCATotal(subject);
                  return (
                    <tr key={subject.id}>
                      <td className="sn">{index + 1}</td>
                      <td className="subject">{subject.subject}</td>
                      {existingCaColumns.map((col) => (
                        <td key={col.key} className="ca-score">
                          {safeNumber(subject[col.actualKey])}
                        </td>
                      ))}
                      <td className="ca-total-score">{caTotal}</td>
                      <td className="exam-score">
                        {safeNumber(subject.examination)}
                      </td>
                      <td className="total-score">
                        {safeNumber(subject.total)}
                      </td>
                      <td className="grade">
                        <span
                          className={`grade-badge ${getGradeBadgeClass(subject.grade)}`}
                        >
                          {subject.grade || "-"}
                        </span>
                      </td>
                      <td className="remark">{subject.remarks || "-"}</td>
                    </tr>
                  );
                })}
                {normalizedSubjects.length === 0 && (
                  <tr>
                    <td
                      colSpan={8 + existingCaColumns.length}
                      className="text-center"
                    >
                      {t?.resultSheet?.noSubjects ||
                        "No subjects found for this result."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="summary-row">
            <div className="summary-item">
              <span className="summary-label">
                {t?.studentDetails?.totalScore || "Total Score"}:
              </span>
              <span className="summary-value">
                {normalizedSummary.totalScore}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">
                {t?.studentDetails?.average || "Average"}:
              </span>
              <span className="summary-value">
                {safeFixed(normalizedSummary.average)}%
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">
                {t?.studentDetails?.classPosition || "Class Position"}:
              </span>
              <span className="summary-value">
                {normalizedSummary.positionInClass}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">
                {t?.studentDetails?.armPosition || "Arm Position"}:
              </span>
              <span className="summary-value">
                {normalizedSummary.positionInArm}
              </span>
            </div>
          </div>

          <div className="attendance-section">
            <div className="attendance-header">
              {t?.attendanceManager?.attendanceSummary || "ATTENDANCE SUMMARY"}
            </div>
            <div className="attendance-grid">
              <div className="attendance-item">
                <span className="attendance-label">
                  {t?.attendanceManager?.totalDays || "Total Days"}:
                </span>
                <span className="attendance-value">{totalSchoolDays}</span>
              </div>
              <div className="attendance-item present">
                <span className="attendance-label">
                  {t?.attendanceManager?.present || "Present"}:
                </span>
                <span className="attendance-value">{daysPresent}</span>
              </div>
              <div className="attendance-item absent">
                <span className="attendance-label">
                  {t?.attendanceManager?.absent || "Absent"}:
                </span>
                <span className="attendance-value">{daysAbsent}</span>
              </div>
              <div className="attendance-item">
                <span className="attendance-label">
                  {t?.attendanceManager?.percentage || "Percentage"}:
                </span>
                <span className="attendance-value">
                  {attendancePercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="extra-result-sections">
            <div className="rating-card">
              <div className="section-subtitle">
                GRADE CHARACTER / AFFECTIVE TRAITS (1 - 5)
              </div>
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Trait</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {editableCharacterTraits.map((item, index) => (
                    <tr key={`character-${item.id ?? index}`}>
                      <td>{item.label}</td>
                      <td>
                        {canEditTeacherSection ? (
                          <input
                            type="number"
                            min="1"
                            max="5"
                            className="form-control form-control-sm"
                            value={item.score ?? 1}
                            onChange={(e) =>
                              updateTraitScore(
                                setEditableCharacterTraits,
                                item.id ?? index,
                                e.target.value,
                              )
                            }
                          />
                        ) : (
                          item.score || "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rating-card">
              <div className="section-subtitle">
                PSYCHOMOTOR / SKILLS ASSESSMENT (1 - 5)
              </div>
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Skill</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {editablePsychomotorTraits.map((item, index) => (
                    <tr key={`psychomotor-${item.id ?? index}`}>
                      <td>{item.label}</td>
                      <td>
                        {canEditTeacherSection ? (
                          <input
                            type="number"
                            min="1"
                            max="5"
                            className="form-control form-control-sm"
                            value={item.score ?? 1}
                            onChange={(e) =>
                              updateTraitScore(
                                setEditablePsychomotorTraits,
                                item.id ?? index,
                                e.target.value,
                              )
                            }
                          />
                        ) : (
                          item.score || "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grading-reference-section">
            <div className="rating-card">
              <div className="section-subtitle">GRADING SCALE</div>
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Grade</th>
                    <th>Range</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {gradingScale.map((item, index) => (
                    <tr key={`grade-scale-${item.id ?? index}`}>
                      <td>{item.grade}</td>
                      <td>
                        {item.min} - {item.max}
                      </td>
                      <td>{item.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rating-card">
              <div className="section-subtitle">CHARACTER RATING KEY</div>
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Value</th>
                    <th>Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {ratingLegend.map((item) => (
                    <tr key={`legend-${item.value}`}>
                      <td>{item.value}</td>
                      <td>{item.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="comments-section">
            <div className="comment-box">
              <div className="comment-title">Class Teacher's Comment</div>
              {canEditTeacherSection ? (
                <textarea
                  className="form-control"
                  rows="4"
                  value={editableSummary.teacherComment}
                  onChange={(e) =>
                    setEditableSummary((prev) => ({
                      ...prev,
                      teacherComment: e.target.value,
                    }))
                  }
                />
              ) : (
                <div className="comment-body">
                  {editableSummary.teacherComment || "No comment available."}
                </div>
              )}
            </div>

            <div className="comment-box">
              <div className="comment-title">Principal's Comment</div>
              {canEditAdminSection ? (
                <textarea
                  className="form-control"
                  rows="4"
                  value={editableSummary.principalComment}
                  onChange={(e) =>
                    setEditableSummary((prev) => ({
                      ...prev,
                      principalComment: e.target.value,
                    }))
                  }
                />
              ) : (
                <div className="comment-body">
                  {editableSummary.principalComment || "No comment available."}
                </div>
              )}
            </div>
          </div>

          <div className="next-term-section">
            <span className="summary-label">Next Term Begins:</span>{" "}
            {canEditAdminSection ? (
              <input
                type="date"
                className="form-control mt-2"
                value={editableSummary.nextTermBegins || ""}
                onChange={(e) =>
                  setEditableSummary((prev) => ({
                    ...prev,
                    nextTermBegins: e.target.value,
                  }))
                }
              />
            ) : (
              <span className="summary-value">
                {editableSummary.nextTermBegins
                  ? formatDate(editableSummary.nextTermBegins)
                  : "To be announced"}
              </span>
            )}
          </div>

          {completed && <div className="approval-stamp">APPROVED</div>}

          <div className="signatures-section">
            <div className="signature-item">
              <div className="signature-sign">
                {resultData?.signatures?.classTeacherSigned &&
                classTeacherSignatureUrl ? (
                  <img
                    src={classTeacherSignatureUrl}
                    alt="Class Teacher Signature"
                    className="signature-image"
                  />
                ) : (
                  <div className="signature-line"></div>
                )}
              </div>
              <div className="signature-label">Class Teacher's Signature</div>
              {resultData?.signatures?.classTeacherSigned && (
                <div className="signature-date">
                  {classTeacherSignedAt && formatDate(classTeacherSignedAt)}
                </div>
              )}
            </div>

            <div className="signature-item">
              <div className="signature-sign">
                {resultData?.signatures?.adminSigned && adminSignatureUrl ? (
                  <img
                    src={adminSignatureUrl}
                    alt="Principal Signature"
                    className="signature-image"
                  />
                ) : (
                  <div className="signature-line"></div>
                )}
              </div>
              <div className="signature-label">Principal / Admin Signature</div>
              {resultData?.signatures?.adminSigned && (
                <div className="signature-date">
                  {adminSignedAt && formatDate(adminSignedAt)}
                </div>
              )}
            </div>

            <div className="signature-item">
              <div className="signature-sign">
                <div className="signature-line"></div>
              </div>
              <div className="signature-label">Parent / Guardian Signature</div>
            </div>
          </div>

          <div className="result-footer">
            <div className="footer-note">
              This result is not valid unless signed by the Class Teacher and
              the Principal.
            </div>
            <div className="footer-date">
              {t?.resultSheet?.generatedOn || "Generated on"}:{" "}
              {moment().format("DD/MM/YYYY h:mm A")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultSheet;

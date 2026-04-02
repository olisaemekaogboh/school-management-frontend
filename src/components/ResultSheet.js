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
      studentClass: source.studentClass ?? "",
      classArm: source.classArm ?? "",
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
      totalSchoolDays: safeNumber(summary.totalSchoolDays),
      daysPresent: safeNumber(summary.daysPresent),
      daysAbsent: safeNumber(summary.daysAbsent),
      attendancePercentage: safeNumber(summary.attendancePercentage),
    };
  };

  const printableMessage =
    resultData?.printLockMessage ||
    "Printable result is locked. The admin will unlock it when it is ready.";

  const canAccessPrintablePage = !isStudent && !isParent;
  const canPrint = canAccessPrintablePage && resultData?.printable === true;

  const normalizedSubjects = useMemo(
    () => normalizeSubjects(resultData),
    [resultData],
  );

  const normalizedSummary = useMemo(
    () => normalizeSummary(resultData),
    [resultData],
  );

  const getStudentName = () => {
    return (
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

  const fetchStudentRecord = async (rawResult) => {
    const resultStudentInfo = rawResult?.studentInfo || {};
    let fetchedStudent = null;

    if (isStudent && studentAPI.getMyProfile) {
      try {
        const response = await studentAPI.getMyProfile();
        fetchedStudent = response?.data || null;
      } catch (fetchProfileError) {
        console.warn(
          "Failed to fetch current student profile:",
          fetchProfileError,
        );
      }
    }

    if (!fetchedStudent && studentId) {
      try {
        const response = await studentAPI.getStudentById(studentId);
        fetchedStudent = response?.data || null;
      } catch (fetchStudentError) {
        console.warn("Failed to fetch student by id:", fetchStudentError);
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
        fullName: resultStudentInfo.name,
        admissionNumber: resultStudentInfo.admissionNumber,
        studentClass: resultStudentInfo.class,
        classArm: resultStudentInfo.arm,
        profilePictureUrl: resultStudentInfo.profilePictureUrl,
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

  const fetchResultData = async () => {
    setLoading(true);
    setStudentLoading(true);
    setResultLoading(true);
    setError(null);
    setImageError(false);

    try {
      const rawResult = await fetchResultRecord();
      setResultData(rawResult);
      setResultLoading(false);

      const fetchedStudent = await fetchStudentRecord(rawResult);
      setStudent(fetchedStudent);
      setStudentLoading(false);
    } catch (fetchError) {
      console.error("Error fetching result sheet:", fetchError);

      if (fetchError.response?.status === 404) {
        setError(
          t?.resultSheet?.noResultFound ||
            "No result found for this student in the selected term",
        );
      } else if (fetchError.response?.status === 403) {
        setError(
          fetchError.response?.data?.message ||
            t?.resultSheet?.accessDenied ||
            "You are not allowed to view this result",
        );
      } else {
        setError(
          fetchError.response?.data?.message ||
            fetchError.message ||
            t?.resultSheet?.loadFailed ||
            "Failed to load result sheet",
        );
      }
    } finally {
      setResultLoading(false);
      setStudentLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!resultData) return;

    if (!canAccessPrintablePage) {
      toast.error(printableMessage);
      navigate("/results", { replace: true });
    }
  }, [resultData, canAccessPrintablePage, printableMessage, navigate]);

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
    return gradeMap[grade] || "bg-secondary";
  };

  const buildFileName = () => {
    const cleanName = getStudentName().replace(/\s+/g, "_");
    const cleanSession = String(session || "").replace(/[\/\\]/g, "_");
    return `${cleanName}_${term}_${cleanSession}`;
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${getStudentName().replace(/\s+/g, "_")}_${session}_${term}_RESULT`,
    onBeforePrint: async () => {
      if (!canPrint) {
        toast.error(printableMessage);
        throw new Error(printableMessage);
      }
    },
  });

  const handleDownloadPdf = async () => {
    if (!canPrint) {
      toast.error(printableMessage);
      return;
    }

    if (!componentRef.current) {
      toast.error("Result sheet not ready");
      return;
    }

    try {
      setDownloading(true);

      const canvas = await html2canvas(componentRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        allowTaint: true,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width * 0.75, canvas.height * 0.75],
      });

      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        canvas.width * 0.75,
        canvas.height * 0.75,
      );

      pdf.save(`${buildFileName()}.pdf`);

      toast.success("PDF downloaded successfully");
    } catch (downloadError) {
      console.error("Error generating PDF:", downloadError);
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const studentPhotoUrl = useMemo(() => {
    const rawUrl =
      resultData?.studentInfo?.profilePictureUrl || student?.profilePictureUrl;

    if (!rawUrl) return null;
    if (rawUrl.startsWith("https://") || rawUrl.startsWith("http://")) {
      return rawUrl;
    }
    return `https://localhost:8443${rawUrl}`;
  }, [resultData, student]);

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
            <FaArrowLeft className="me-2" />
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
            <FaArrowLeft className="me-2" />
            {t?.resultSheet?.backToResults || "Back to Results"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="result-sheet-wrapper">
      {!isStudent && !isParent && (
        <>
          <div className="result-sheet-actions">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft />
              <span>Back</span>
            </button>

            <button
              type="button"
              className={`btn ${canPrint ? "btn-primary" : "btn-secondary"}`}
              onClick={() => {
                if (!canPrint) {
                  toast.error(printableMessage);
                  return;
                }
                handlePrint();
              }}
              disabled={loading || resultLoading || !canPrint}
              title={!canPrint ? printableMessage : "Print result"}
            >
              <FaPrint />
              <span>{canPrint ? "Print" : "Print Locked"}</span>
            </button>

            <button
              type="button"
              className={`btn ${canPrint ? "btn-success" : "btn-secondary"}`}
              onClick={handleDownloadPdf}
              disabled={loading || downloading || !canPrint}
              title={!canPrint ? printableMessage : "Download PDF"}
            >
              <FaDownload />
              <span>
                {canPrint
                  ? downloading
                    ? "Preparing..."
                    : "Download PDF"
                  : "Download Locked"}
              </span>
            </button>
          </div>

          {!canPrint && (
            <div className="result-lock-banner" role="alert">
              {printableMessage}
            </div>
          )}
        </>
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
                    {student?.studentClass || "N/A"}{" "}
                    {resultData?.studentInfo?.arm || student?.classArm || ""}
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

          <div className="signatures-section">
            <div className="signature-item">
              <div className="signature-line"></div>
              <div className="signature-label">
                {t?.sessionResultSheet?.classTeacherSignature ||
                  "Class Teacher's Signature"}
              </div>
            </div>
            <div className="signature-item">
              <div className="signature-line"></div>
              <div className="signature-label">
                {t?.sessionResultSheet?.principalSignature ||
                  "Principal's Signature"}
              </div>
            </div>
            <div className="signature-item">
              <div className="signature-line"></div>
              <div className="signature-label">
                {t?.sessionResultSheet?.parentSignature ||
                  "Parent's Signature"}
              </div>
            </div>
          </div>

          <div className="result-footer">
            <div className="footer-note">
              {t?.resultSheet?.footerNote ||
                "This is a computer-generated result. Valid without signature."}
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
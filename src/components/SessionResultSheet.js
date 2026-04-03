import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { studentAPI, sessionResultAPI } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import {
  FaPrint,
  FaDownload,
  FaArrowLeft,
  FaUserCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaGraduationCap,
} from "react-icons/fa";
import moment from "moment";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./ResultSheet.css";

function SessionResultSheet() {
  const { studentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();
  const { isStudent, isParent } = useAuth();

  const query = new URLSearchParams(location.search);
  const session = query.get("session") || "";

  const [sessionResult, setSessionResult] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const componentRef = useRef(null);

  const safeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const safeFixed = (value, digits = 2) => safeNumber(value, 0).toFixed(digits);

  const safeText = (value, fallback = "N/A") => {
    if (value === null || value === undefined) return fallback;
    const text = String(value).trim();
    return text ? text : fallback;
  };

  const studentInfo = useMemo(() => {
    const fallback = student || {};

    return {
      id: fallback.id || studentId,
      fullName:
        fallback.fullName ||
        [fallback.firstName, fallback.middleName, fallback.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        "Student",
      admissionNumber: fallback.admissionNumber || "N/A",
      studentClass:
        fallback.studentClass || fallback?.schoolClass?.className || "N/A",
      arm: fallback.classArm || fallback?.schoolClass?.arm || "",
      dateOfBirth: fallback.dateOfBirth || null,
      parentName:
        fallback.parentName ||
        fallback?.parent?.fullName ||
        fallback?.parent?.name ||
        [fallback?.parent?.firstName, fallback?.parent?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        "N/A",
      parentPhone:
        fallback.parentPhone ||
        fallback?.parent?.phone ||
        fallback?.parent?.phoneNumber ||
        "N/A",
      address:
        fallback.address ||
        fallback.homeAddress ||
        fallback?.parent?.address ||
        "N/A",
      profilePictureUrl: fallback.profilePictureUrl || null,
    };
  }, [student, studentId]);

  const annualSummary = useMemo(() => {
    return {
      annualTotal: safeNumber(sessionResult?.annualTotal),
      annualAverage: safeNumber(sessionResult?.annualAverage),
      positionInClass: sessionResult?.annualPositionInClass ?? "N/A",
      positionInArm: sessionResult?.annualPositionInArm ?? "N/A",
      positionInSchool: sessionResult?.annualPositionInSchool ?? "N/A",
    };
  }, [sessionResult]);

  const termSummaryRows = useMemo(() => {
    return [
      {
        label: "FIRST",
        total: safeNumber(sessionResult?.firstTermTotal),
        average: safeNumber(sessionResult?.firstTermAverage),
        position: sessionResult?.firstTermPosition ?? "N/A",
      },
      {
        label: "SECOND",
        total: safeNumber(sessionResult?.secondTermTotal),
        average: safeNumber(sessionResult?.secondTermAverage),
        position: sessionResult?.secondTermPosition ?? "N/A",
      },
      {
        label: "THIRD",
        total: safeNumber(sessionResult?.thirdTermTotal),
        average: safeNumber(sessionResult?.thirdTermAverage),
        position: sessionResult?.thirdTermPosition ?? "N/A",
      },
    ];
  }, [sessionResult]);

  const attendance = useMemo(() => {
    return {
      totalSchoolDays: safeNumber(sessionResult?.totalSchoolDays),
      daysPresent: safeNumber(sessionResult?.totalDaysPresent),
      daysAbsent: safeNumber(sessionResult?.totalDaysAbsent),
      attendancePercentage: safeNumber(sessionResult?.attendancePercentage),
    };
  }, [sessionResult]);

  const promotion = useMemo(() => {
    return {
      promoted: Boolean(sessionResult?.promoted),
      remark: safeText(
        sessionResult?.promotionRemark,
        sessionResult?.promoted ? "Promoted" : "Not promoted",
      ),
    };
  }, [sessionResult]);

  const subjectPerformance = useMemo(() => {
    const annual = sessionResult?.subjectAverages || {};
    const first = sessionResult?.firstTermSubjectScores || {};
    const second = sessionResult?.secondTermSubjectScores || {};
    const third = sessionResult?.thirdTermSubjectScores || {};

    const subjects = Array.from(
      new Set([
        ...Object.keys(annual),
        ...Object.keys(first),
        ...Object.keys(second),
        ...Object.keys(third),
      ]),
    ).sort((a, b) => a.localeCompare(b));

    return subjects.map((subject) => ({
      subject,
      firstTerm: safeNumber(first[subject]),
      secondTerm: safeNumber(second[subject]),
      thirdTerm: safeNumber(third[subject]),
      annualAverage: safeNumber(annual[subject]),
    }));
  }, [sessionResult]);

  const formatDate = (date) => {
    return date ? moment(date).format("DD/MM/YYYY") : "N/A";
  };

  const getStudentName = () => {
    return studentInfo.fullName || "Student";
  };

  useEffect(() => {
    if (!studentId || !session) {
      setError(
        t?.sessionResultSheet?.missingParams || "Missing required parameters",
      );
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [resultResponse, studentResponse] = await Promise.all([
          sessionResultAPI.getSessionResult(studentId, session),
          studentAPI.getStudentById(studentId).catch(() => ({ data: null })),
        ]);

        setSessionResult(resultResponse?.data || null);
        setStudent(studentResponse?.data || null);
      } catch (fetchError) {
        console.error("Error fetching session result sheet:", fetchError);

        if (fetchError.response?.status === 404) {
          setError(
            t?.sessionResultSheet?.noResult ||
              "No session result found for this student",
          );
        } else if (fetchError.response?.status === 403) {
          setError(
            fetchError.response?.data?.message ||
              t?.sessionResultSheet?.accessDenied ||
              "You are not allowed to view this result",
          );
        } else {
          setError(
            fetchError.response?.data?.message ||
              t?.sessionResultSheet?.loadFailed ||
              "Failed to load session result sheet",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, session, t]);

  const getGradeFromAverage = (avg) => {
    const value = Number(avg) || 0;
    if (value >= 70) return { grade: "A", remark: "Excellent" };
    if (value >= 60) return { grade: "B", remark: "Very Good" };
    if (value >= 50) return { grade: "C", remark: "Good" };
    if (value >= 45) return { grade: "D", remark: "Fair" };
    if (value >= 40) return { grade: "E", remark: "Pass" };
    return { grade: "F", remark: "Fail" };
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

  const buildFileName = () =>
    `${studentInfo.fullName.replace(/\s+/g, "_")}_SESSION_${session.replace(/[\/\\]/g, "_")}`;

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: buildFileName(),
    onAfterPrint: () =>
      toast.success(
        t?.sessionResultSheet?.printSuccess ||
          "Session result sheet printed successfully",
      ),
  });

  const handleDownloadPDF = async () => {
    if (!componentRef.current) {
      toast.error(t?.sessionResultSheet?.notReady || "Result sheet not ready");
      return;
    }

    setDownloading(true);
    try {
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

      toast.success(
        t?.sessionResultSheet?.downloadSuccess || "PDF downloaded successfully",
      );
    } catch (downloadError) {
      console.error("Error generating PDF:", downloadError);
      toast.error(
        t?.sessionResultSheet?.downloadFailed || "Failed to download PDF",
      );
    } finally {
      setDownloading(false);
    }
  };

  const studentPhotoUrl = studentInfo.profilePictureUrl
    ? studentInfo.profilePictureUrl.startsWith("http")
      ? studentInfo.profilePictureUrl
      : `https://localhost:8443${studentInfo.profilePictureUrl}`
    : null;

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="mt-3">
            {t?.sessionResultSheet?.loading ||
              "Loading session result sheet..."}
          </h5>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>{t?.sessionResultSheet?.errorTitle || "Error Loading Result"}</h4>
          <p>{error}</p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate("/session-results")}
          >
            <FaArrowLeft className="me-2" />
            {t?.sessionResultSheet?.back || "Back to Session Results"}
          </button>
        </div>
      </div>
    );
  }

  if (!sessionResult) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          <h4>{t?.sessionResultSheet?.noDataTitle || "No Data Available"}</h4>
          <p>
            {t?.sessionResultSheet?.noData ||
              "No session result data was returned."}
          </p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate("/session-results")}
          >
            <FaArrowLeft className="me-2" />
            {t?.sessionResultSheet?.back || "Back to Session Results"}
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
          <button
            className="btn btn-outline-success"
            onClick={handlePrint}
            disabled={loading || downloading}
          >
            <FaPrint className="me-2" /> {t?.common?.print || "Print"}
          </button>

          <button
            className="btn btn-outline-primary"
            onClick={handleDownloadPDF}
            disabled={loading || downloading}
          >
            {downloading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
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
            {sessionResult?.completed ? (
              <span className="badge bg-success">SESSION RESULT COMPLETE</span>
            ) : (
              <span className="badge bg-danger">SESSION RESULT INCOMPLETE</span>
            )}
          </div>

          <div className="result-title">
            ANNUAL SESSION RESULT SHEET - {session}
          </div>

          {/* Student Information Section - Using Table layout like ResultSheet */}
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
                  <td className="value">{studentInfo.admissionNumber}</td>
                </tr>
                <tr>
                  <td className="label">
                    {t?.studentDetails?.class || "Class"}:
                  </td>
                  <td className="value">
                    {studentInfo.studentClass} {studentInfo.arm}
                  </td>
                  <td className="label">
                    {t?.studentDetails?.dob || "Date of Birth"}:
                  </td>
                  <td className="value">
                    {formatDate(studentInfo.dateOfBirth)}
                  </td>
                </tr>
                <tr>
                  <td className="label">
                    {t?.studentDetails?.parentGuardian || "Parent/Guardian"}:
                  </td>
                  <td className="value">{safeText(studentInfo.parentName)}</td>
                  <td className="label">
                    {t?.studentDetails?.parentPhone || "Parent Phone"}:
                  </td>
                  <td className="value">{safeText(studentInfo.parentPhone)}</td>
                </tr>
                <tr>
                  <td className="label">
                    {t?.studentDetails?.address || "Address"}:
                  </td>
                  <td className="value" colSpan="3">
                    {safeText(studentInfo.address)}
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

          {/* Subject Performance Table */}
          <div className="results-table-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  <th className="sn">S/N</th>
                  <th className="subject">
                    {t?.sessionResultSheet?.subject || "SUBJECT"}
                  </th>
                  <th>{t?.sessionResultSheet?.firstTerm || "1ST TERM"}</th>
                  <th>{t?.sessionResultSheet?.secondTerm || "2ND TERM"}</th>
                  <th>{t?.sessionResultSheet?.thirdTerm || "3RD TERM"}</th>
                  <th>
                    {t?.sessionResultSheet?.annualAverage || "ANNUAL AVG"}
                  </th>
                  <th>{t?.sessionResultSheet?.grade || "GRADE"}</th>
                  <th>{t?.sessionResultSheet?.remark || "REMARK"}</th>
                </tr>
              </thead>
              <tbody>
                {subjectPerformance.length > 0 ? (
                  subjectPerformance.map((item, index) => {
                    const avg = safeNumber(item.annualAverage);
                    const gradeInfo = getGradeFromAverage(avg);

                    return (
                      <tr key={`${item.subject}-${index}`}>
                        <td className="sn">{index + 1}</td>
                        <td className="subject">{item.subject}</td>
                        <td>{safeFixed(item.firstTerm)}</td>
                        <td>{safeFixed(item.secondTerm)}</td>
                        <td>{safeFixed(item.thirdTerm)}</td>
                        <td className="total-score">
                          {safeFixed(item.annualAverage)}
                        </td>
                        <td className="grade">
                          <span
                            className={`grade-badge ${getGradeBadgeClass(gradeInfo.grade)}`}
                          >
                            {gradeInfo.grade}
                          </span>
                        </td>
                        <td className="remark">{gradeInfo.remark}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center">
                      {t?.sessionResultSheet?.noSubjects ||
                        "No subject performance available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Annual Summary and Attendance Section */}
          <div className="summary-row">
            <div className="summary-item">
              <span className="summary-label">
                {t?.sessionResultSheet?.annualTotal || "Annual Total"}:
              </span>
              <span className="summary-value">
                {safeFixed(annualSummary.annualTotal)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">
                {t?.sessionResultSheet?.annualAverage || "Annual Average"}:
              </span>
              <span className="summary-value">
                {safeFixed(annualSummary.annualAverage)}%
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">
                {t?.sessionResultSheet?.positionInClass || "Class Position"}:
              </span>
              <span className="summary-value">
                {annualSummary.positionInClass}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">
                {t?.sessionResultSheet?.positionInArm || "Arm Position"}:
              </span>
              <span className="summary-value">
                {annualSummary.positionInArm}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">
                {t?.sessionResultSheet?.positionInSchool || "School Position"}:
              </span>
              <span className="summary-value">
                {annualSummary.positionInSchool}
              </span>
            </div>
          </div>

          {/* Attendance Section */}
          <div className="attendance-section">
            <div className="attendance-header">
              {t?.attendanceManager?.attendanceSummary || "ATTENDANCE SUMMARY"}
            </div>
            <div className="attendance-grid">
              <div className="attendance-item">
                <span className="attendance-label">
                  {t?.attendanceManager?.totalDays || "Total Days"}:
                </span>
                <span className="attendance-value">
                  {attendance.totalSchoolDays}
                </span>
              </div>
              <div className="attendance-item present">
                <span className="attendance-label">
                  {t?.attendanceManager?.present || "Present"}:
                </span>
                <span className="attendance-value">
                  {attendance.daysPresent}
                </span>
              </div>
              <div className="attendance-item absent">
                <span className="attendance-label">
                  {t?.attendanceManager?.absent || "Absent"}:
                </span>
                <span className="attendance-value">
                  {attendance.daysAbsent}
                </span>
              </div>
              <div className="attendance-item">
                <span className="attendance-label">
                  {t?.attendanceManager?.percentage || "Percentage"}:
                </span>
                <span className="attendance-value">
                  {safeFixed(attendance.attendancePercentage)}%
                </span>
              </div>
            </div>
          </div>

          {/* Term Breakdown Section */}
          <div className="extra-result-sections">
            <div className="rating-card">
              <div className="section-subtitle">
                <FaGraduationCap className="me-2" />
                {t?.sessionResultSheet?.termBreakdown || "TERM BREAKDOWN"}
              </div>
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>{t?.sessionResultSheet?.term || "Term"}</th>
                    <th>{t?.sessionResultSheet?.total || "Total"}</th>
                    <th>{t?.sessionResultSheet?.average || "Average"}</th>
                    <th>{t?.sessionResultSheet?.position || "Position"}</th>
                  </tr>
                </thead>
                <tbody>
                  {termSummaryRows.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>{safeFixed(row.total)}</td>
                      <td>{safeFixed(row.average)}%</td>
                      <td>{row.position}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Promotion Decision Card */}
            <div className="rating-card">
              <div className="section-subtitle">
                {t?.sessionResultSheet?.promotionDecision ||
                  "PROMOTION DECISION"}
              </div>
              <div className="d-flex align-items-center gap-3 mb-3">
                {promotion.promoted ? (
                  <FaCheckCircle className="text-success" size={32} />
                ) : (
                  <FaTimesCircle className="text-danger" size={32} />
                )}
                <div>
                  <h4 className="mb-1">
                    {promotion.promoted
                      ? t?.sessionResultSheet?.promoted || "PROMOTED"
                      : t?.sessionResultSheet?.notPromoted || "NOT PROMOTED"}
                  </h4>
                  <div className="summary-label">{promotion.remark}</div>
                </div>
              </div>
              <div className="summary-item mt-2">
                <span className="summary-label">
                  {t?.sessionResultSheet?.remark || "Remark"}:
                </span>
                <span className="summary-value">{promotion.remark}</span>
              </div>
            </div>
          </div>

          {/* Grading Scale Reference */}
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
                  <tr>
                    <td>A</td>
                    <td>70 - 100</td>
                    <td>Excellent</td>
                  </tr>
                  <tr>
                    <td>B</td>
                    <td>60 - 69</td>
                    <td>Very Good</td>
                  </tr>
                  <tr>
                    <td>C</td>
                    <td>50 - 59</td>
                    <td>Good</td>
                  </tr>
                  <tr>
                    <td>D</td>
                    <td>45 - 49</td>
                    <td>Fair</td>
                  </tr>
                  <tr>
                    <td>E</td>
                    <td>40 - 44</td>
                    <td>Pass</td>
                  </tr>
                  <tr>
                    <td>F</td>
                    <td>0 - 39</td>
                    <td>Fail</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures Section */}
          <div className="signatures-section">
            <div className="signature-item">
              <div className="signature-sign">
                <div className="signature-line"></div>
              </div>
              <div className="signature-label">Class Teacher's Signature</div>
            </div>

            <div className="signature-item">
              <div className="signature-sign">
                <div className="signature-line"></div>
              </div>
              <div className="signature-label">Principal / Admin Signature</div>
            </div>

            <div className="signature-item">
              <div className="signature-sign">
                <div className="signature-line"></div>
              </div>
              <div className="signature-label">Parent / Guardian Signature</div>
            </div>
          </div>

          {/* Footer */}
          <div className="result-footer">
            <div className="footer-note">
              This session result is a compilation of all term results for the
              academic session.
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

export default SessionResultSheet;

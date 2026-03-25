// src/components/SessionResultSheet.js
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { studentAPI, sessionResultAPI } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { toast } from "react-toastify";
import {
  FaPrint,
  FaDownload,
  FaArrowLeft,
  FaUserCircle,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaGraduationCap,
  FaCalendarAlt,
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

  const query = new URLSearchParams(location.search);
  const session = query.get("session") || "";

  const [resultData, setResultData] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const componentRef = useRef(null);

  const safeNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const safeFixed = (value, digits = 2) => {
    return safeNumber(value, 0).toFixed(digits);
  };

  const getStudentName = () => {
    return (
      resultData?.studentInfo?.name ||
      student?.fullName ||
      `${student?.firstName || ""} ${student?.lastName || ""}`.trim() ||
      t?.sessionResultSheet?.student ||
      "Student"
    );
  };

  useEffect(() => {
    if (studentId && session) {
      fetchResultData();
    } else {
      setError(
        t?.sessionResultSheet?.missingParams || "Missing required parameters",
      );
      setLoading(false);
    }
  }, [studentId, session]);

  const fetchResultData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [studentResponse, resultResponse] = await Promise.all([
        studentAPI.getStudentById(studentId),
        sessionResultAPI.getSessionResult(studentId, session),
      ]);

      setStudent(studentResponse.data || null);
      setResultData(resultResponse.data || null);
    } catch (error) {
      console.error("Error fetching session result sheet:", error);
      if (error.response?.status === 404) {
        setError(
          t?.sessionResultSheet?.noResult ||
            "No session result found for this student",
        );
      } else if (error.response?.status === 403) {
        setError(
          t?.sessionResultSheet?.accessDenied ||
            "You are not allowed to view this result",
        );
      } else {
        setError(
          error.response?.data?.message ||
            t?.sessionResultSheet?.loadFailed ||
            "Failed to load session result sheet",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) =>
    date ? moment(date).format("DD/MM/YYYY") : "N/A";

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

  const getGradeFromAverage = (avg) => {
    const value = Number(avg) || 0;
    if (value >= 70) return { grade: "A", class: "success" };
    if (value >= 60) return { grade: "B", class: "primary" };
    if (value >= 50) return { grade: "C", class: "info" };
    if (value >= 45) return { grade: "D", class: "warning" };
    if (value >= 40) return { grade: "E", class: "secondary" };
    return { grade: "F", class: "danger" };
  };

  const buildFileName = () =>
    `${getStudentName().replace(/\s+/g, "_")}_SESSION_${session.replace(/[\/\\]/g, "_")}`;

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
      const element = componentRef.current;
      const canvas = await html2canvas(element, {
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
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(
        t?.sessionResultSheet?.downloadFailed || "Failed to download PDF",
      );
    } finally {
      setDownloading(false);
    }
  };

  const studentPhotoUrl = resultData?.studentInfo?.profilePictureUrl
    ? `https://localhost:8443${resultData.studentInfo.profilePictureUrl}`
    : student?.profilePictureUrl
      ? `https://localhost:8443${student.profilePictureUrl}`
      : null;

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="text-center">
          <FaSpinner className="spinner mb-3" size={40} />
          <h5>
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
            <FaArrowLeft className="me-2" />{" "}
            {t?.sessionResultSheet?.back || "Back to Session Results"}
          </button>
        </div>
      </div>
    );
  }

  if (!resultData || !student) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          <h4>
            {t?.sessionResultSheet?.noResultTitle || "No Session Result Found"}
          </h4>
          <p>
            {t?.sessionResultSheet?.noResultMessage ||
              "No session result found for this student in"}{" "}
            {session} {t?.sessionResultSheet?.session || "session"}.
          </p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate("/session-results")}
          >
            <FaArrowLeft className="me-2" />{" "}
            {t?.sessionResultSheet?.back || "Back to Session Results"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="result-sheet-wrapper">
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft className="me-2" /> {t?.common?.back || "Back"}
        </button>
        <div>
          <button
            className="btn btn-outline-success me-2"
            onClick={handlePrint}
            disabled={downloading}
          >
            <FaPrint className="me-2" /> {t?.common?.print || "Print"}
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={handleDownloadPDF}
            disabled={downloading}
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

          <div
            className="result-title"
            style={{ background: "#9C27B0", color: "white" }}
          >
            <FaGraduationCap className="me-2" />{" "}
            {t?.sessionResultSheet?.annualResult ||
              "ANNUAL SESSION RESULT SHEET"}{" "}
            - {session} {t?.sessionResultSheet?.session || "SESSION"}
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
                    {resultData?.studentInfo?.class ||
                      student?.studentClass ||
                      "N/A"}{" "}
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
              {studentPhotoUrl ? (
                <img
                  src={studentPhotoUrl}
                  alt={getStudentName()}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentNode.innerHTML =
                      '<div class="photo-placeholder"><FaUserCircle /></div>';
                  }}
                />
              ) : (
                <div className="photo-placeholder">
                  <FaUserCircle />
                </div>
              )}
            </div>
          </div>

          <div className="promotion-status mb-4">
            <div
              className={`alert ${resultData.promoted ? "alert-success" : "alert-danger"}`}
            >
              <div className="d-flex align-items-center">
                {resultData.promoted ? (
                  <FaCheckCircle size={24} className="me-3" />
                ) : (
                  <FaTimesCircle size={24} className="me-3" />
                )}
                <div>
                  <h5 className="mb-1">
                    {t?.sessionResultSheet?.promotionStatus ||
                      "Promotion Status"}
                    :{" "}
                    {resultData.promoted
                      ? t?.sessionResultSheet?.promoted || "PROMOTED"
                      : t?.sessionResultSheet?.retained || "RETAINED"}
                  </h5>
                  <p className="mb-0">{resultData.promotionRemark || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="term-averages mb-4">
            <h5 className="section-subtitle">
              {t?.sessionResultSheet?.termPerformance || "Term Performance"}
            </h5>
            <div className="row">
              <div className="col-md-4 mb-3">
                <div className="term-card first-term">
                  <h6>{t?.sessionResultSheet?.firstTerm || "First Term"}</h6>
                  <h3>{safeFixed(resultData.firstTermAverage)}%</h3>
                  <p>
                    {t?.sessionResultSheet?.position || "Position"}:{" "}
                    {resultData.firstTermPosition || "N/A"}
                  </p>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="term-card second-term">
                  <h6>{t?.sessionResultSheet?.secondTerm || "Second Term"}</h6>
                  <h3>{safeFixed(resultData.secondTermAverage)}%</h3>
                  <p>
                    {t?.sessionResultSheet?.position || "Position"}:{" "}
                    {resultData.secondTermPosition || "N/A"}
                  </p>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="term-card third-term">
                  <h6>{t?.sessionResultSheet?.thirdTerm || "Third Term"}</h6>
                  <h3>{safeFixed(resultData.thirdTermAverage)}%</h3>
                  <p>
                    {t?.sessionResultSheet?.position || "Position"}:{" "}
                    {resultData.thirdTermPosition || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="annual-summary mb-4">
            <h5 className="section-subtitle">
              {t?.sessionResultSheet?.annualSummary || "Annual Summary"}
            </h5>
            <div className="summary-row">
              <div className="summary-item">
                <span className="summary-label">
                  {t?.sessionResultSheet?.annualTotal || "Annual Total"}:
                </span>
                <span className="summary-value">
                  {safeNumber(resultData.annualTotal)}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">
                  {t?.sessionResultSheet?.annualAverage || "Annual Average"}:
                </span>
                <span className="summary-value text-success">
                  {safeFixed(resultData.annualAverage)}%
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">
                  {t?.sessionResultSheet?.classPosition || "Class Position"}:
                </span>
                <span className="summary-value text-warning">
                  {resultData.annualPositionInClass || "N/A"}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">
                  {t?.studentDashboard?.attendance || "Attendance"}:
                </span>
                <span className="summary-value text-info">
                  {safeFixed(resultData.attendancePercentage)}%
                </span>
              </div>
            </div>
          </div>

          {resultData.subjectAverages &&
            Object.keys(resultData.subjectAverages).length > 0 && (
              <div className="subject-averages mb-4">
                <h5 className="section-subtitle">
                  {t?.sessionResultSheet?.subjectPerformance ||
                    "Subject Performance (Annual Averages)"}
                </h5>
                <div className="table-responsive">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>S/N</th>
                        <th>{t?.studentDashboard?.subject || "SUBJECT"}</th>
                        <th>
                          {t?.sessionResultSheet?.annualAverage ||
                            "ANNUAL AVERAGE"}
                        </th>
                        <th>{t?.studentDashboard?.grade || "GRADE"}</th>
                        <th>REMARK</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(resultData.subjectAverages).map(
                        ([subject, average], index) => {
                          const grade = getGradeFromAverage(average);
                          return (
                            <tr key={index}>
                              <td className="text-center">{index + 1}</td>
                              <td>{subject}</td>
                              <td className="text-center fw-bold">
                                {safeFixed(average)}%
                              </td>
                              <td className="text-center">
                                <span
                                  className={`grade-badge bg-${grade.class}`}
                                >
                                  {grade.grade}
                                </span>
                              </td>
                              <td className="text-center">
                                {grade.grade === "A"
                                  ? "Excellent"
                                  : grade.grade === "B"
                                    ? "Very Good"
                                    : grade.grade === "C"
                                      ? "Good"
                                      : grade.grade === "D"
                                        ? "Fair"
                                        : grade.grade === "E"
                                          ? "Pass"
                                          : "Fail"}
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
                {t?.sessionResultSheet?.parentSignature || "Parent's Signature"}
              </div>
            </div>
          </div>

          <div className="result-footer">
            <div className="footer-note">
              {t?.sessionResultSheet?.footerNote ||
                "This is a computer-generated annual session result. Valid without signature."}
            </div>
            <div className="footer-date">
              {t?.sessionResultSheet?.generatedOn || "Generated on"}:{" "}
              {moment().format("DD/MM/YYYY h:mm A")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionResultSheet;

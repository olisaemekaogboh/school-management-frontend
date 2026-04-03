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

  const printableMessage =
    sessionResult?.printLockMessage ||
    "Printable result is locked. The admin will unlock it when it is ready.";

  const canAccessPrintablePage = !isStudent && !isParent;
  const canPrint = canAccessPrintablePage && sessionResult?.printable === true;

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

  useEffect(() => {
    if (!sessionResult) return;

    if (!canAccessPrintablePage) {
      toast.error(printableMessage);
      navigate("/session-results", { replace: true });
    }
  }, [sessionResult, canAccessPrintablePage, printableMessage, navigate]);

  const getGradeFromAverage = (avg) => {
    const value = Number(avg) || 0;
    if (value >= 70) return { grade: "A", remark: "Excellent" };
    if (value >= 60) return { grade: "B", remark: "Very Good" };
    if (value >= 50) return { grade: "C", remark: "Good" };
    if (value >= 45) return { grade: "D", remark: "Fair" };
    if (value >= 40) return { grade: "E", remark: "Pass" };
    return { grade: "F", remark: "Fail" };
  };

  const buildFileName = () =>
    `${studentInfo.fullName.replace(/\s+/g, "_")}_SESSION_${session.replace(/[\/\\]/g, "_")}`;

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: buildFileName(),
    onBeforePrint: async () => {
      if (!canPrint) {
        toast.error(printableMessage);
        throw new Error(printableMessage);
      }
    },
    onAfterPrint: () =>
      toast.success(
        t?.sessionResultSheet?.printSuccess ||
          "Session result sheet printed successfully",
      ),
  });

  const handleDownloadPDF = async () => {
    if (!canPrint) {
      toast.error(printableMessage);
      return;
    }

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
    ? `https://localhost:8443${studentInfo.profilePictureUrl}`
    : null;

  if (loading) {
    return (
      <div className={`session-result-page ${darkMode ? "dark-mode" : ""}`}>
        <div className="container py-5 text-center">
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
      <div className={`session-result-page ${darkMode ? "dark-mode" : ""}`}>
        <div className="container py-5 text-center">
          <h4>{t?.sessionResultSheet?.errorTitle || "Error Loading Result"}</h4>
          <p>{error}</p>
          <button
            className="btn btn-secondary"
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
      <div className={`session-result-page ${darkMode ? "dark-mode" : ""}`}>
        <div className="container py-5 text-center">
          <h4>{t?.sessionResultSheet?.noDataTitle || "No Data Available"}</h4>
          <p>
            {t?.sessionResultSheet?.noData ||
              "No session result data was returned."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`session-result-page result-sheet-page ${darkMode ? "dark-mode" : ""}`}
    >
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
              disabled={loading || !canPrint}
              title={!canPrint ? printableMessage : "Print result"}
            >
              <FaPrint />
              <span>{canPrint ? "Print" : "Print Locked"}</span>
            </button>

            <button
              type="button"
              className={`btn ${canPrint ? "btn-success" : "btn-secondary"}`}
              onClick={handleDownloadPDF}
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

      <div className="card shadow-sm result-sheet-card" ref={componentRef}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h2 className="mb-1">
              {t?.sessionResultSheet?.title || "Session Result Sheet"}
            </h2>
            <p className="mb-0">
              {t?.sessionResultSheet?.sessionLabel || "Academic Session"}:{" "}
              <strong>{session}</strong>
            </p>
          </div>

          <div className="row g-4 align-items-center mb-4">
            <div className="col-md-3 text-center">
              {studentPhotoUrl ? (
                <img
                  src={studentPhotoUrl}
                  alt={studentInfo.fullName}
                  className="img-fluid rounded-circle border session-student-photo"
                />
              ) : (
                <div className="session-avatar-fallback">
                  <FaUserCircle size={90} />
                </div>
              )}
            </div>

            <div className="col-md-9">
              <div className="row g-3">
                <div className="col-md-6">
                  <strong>
                    {t?.sessionResultSheet?.studentName || "Student Name"}:
                  </strong>
                  <div>{studentInfo.fullName}</div>
                </div>
                <div className="col-md-6">
                  <strong>
                    {t?.sessionResultSheet?.admissionNumber ||
                      "Admission Number"}
                    :
                  </strong>
                  <div>{studentInfo.admissionNumber}</div>
                </div>
                <div className="col-md-6">
                  <strong>{t?.sessionResultSheet?.class || "Class"}:</strong>
                  <div>
                    {studentInfo.studentClass} {studentInfo.arm}
                  </div>
                </div>
                <div className="col-md-6">
                  <strong>
                    {t?.sessionResultSheet?.dateOfBirth || "Date of Birth"}:
                  </strong>
                  <div>
                    {studentInfo.dateOfBirth
                      ? moment(studentInfo.dateOfBirth).format("DD/MM/YYYY")
                      : "N/A"}
                  </div>
                </div>
                <div className="col-md-6">
                  <strong>
                    {t?.sessionResultSheet?.parentName || "Parent/Guardian"}:
                  </strong>
                  <div>{safeText(studentInfo.parentName)}</div>
                </div>
                <div className="col-md-6">
                  <strong>
                    {t?.sessionResultSheet?.parentPhone || "Parent Phone"}:
                  </strong>
                  <div>{safeText(studentInfo.parentPhone)}</div>
                </div>
                <div className="col-12">
                  <strong>
                    {t?.sessionResultSheet?.address || "Address"}:
                  </strong>
                  <div>{safeText(studentInfo.address)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="table-responsive mb-4">
            <table className="table table-bordered align-middle session-table">
              <thead>
                <tr>
                  <th>{t?.sessionResultSheet?.subject || "Subject"}</th>
                  <th>{t?.sessionResultSheet?.firstTerm || "1st Term"}</th>
                  <th>{t?.sessionResultSheet?.secondTerm || "2nd Term"}</th>
                  <th>{t?.sessionResultSheet?.thirdTerm || "3rd Term"}</th>
                  <th>{t?.sessionResultSheet?.annualAverage || "Annual Avg"}</th>
                  <th>{t?.sessionResultSheet?.grade || "Grade"}</th>
                  <th>{t?.sessionResultSheet?.remark || "Remark"}</th>
                </tr>
              </thead>
              <tbody>
                {subjectPerformance.length > 0 ? (
                  subjectPerformance.map((item, index) => {
                    const avg = safeNumber(item.annualAverage);
                    const gradeInfo = getGradeFromAverage(avg);

                    return (
                      <tr key={`${item.subject}-${index}`}>
                        <td>{item.subject}</td>
                        <td>{safeFixed(item.firstTerm)}</td>
                        <td>{safeFixed(item.secondTerm)}</td>
                        <td>{safeFixed(item.thirdTerm)}</td>
                        <td>{safeFixed(item.annualAverage)}</td>
                        <td>{gradeInfo.grade}</td>
                        <td>{gradeInfo.remark}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">
                      {t?.sessionResultSheet?.noSubjects ||
                        "No subject performance available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="card h-100 session-info-card">
                <div className="card-body">
                  <h5 className="mb-3">
                    <FaGraduationCap className="me-2" />
                    {t?.sessionResultSheet?.annualSummary || "Annual Summary"}
                  </h5>
                  <p className="mb-2">
                    <strong>
                      {t?.sessionResultSheet?.annualTotal || "Annual Total"}:
                    </strong>{" "}
                    {safeFixed(annualSummary.annualTotal)}
                  </p>
                  <p className="mb-2">
                    <strong>
                      {t?.sessionResultSheet?.annualAverage || "Annual Average"}
                      :
                    </strong>{" "}
                    {safeFixed(annualSummary.annualAverage)}
                  </p>
                  <p className="mb-2">
                    <strong>
                      {t?.sessionResultSheet?.positionInClass ||
                        "Position in Class"}
                      :
                    </strong>{" "}
                    {annualSummary.positionInClass}
                  </p>
                  <p className="mb-2">
                    <strong>
                      {t?.sessionResultSheet?.positionInArm || "Position in Arm"}
                      :
                    </strong>{" "}
                    {annualSummary.positionInArm}
                  </p>
                  <p className="mb-0">
                    <strong>
                      {t?.sessionResultSheet?.positionInSchool ||
                        "Position in School"}
                      :
                    </strong>{" "}
                    {annualSummary.positionInSchool}
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card h-100 session-info-card">
                <div className="card-body">
                  <h5 className="mb-3">
                    {t?.sessionResultSheet?.attendance || "Attendance"}
                  </h5>
                  <p className="mb-2">
                    <strong>
                      {t?.sessionResultSheet?.totalSchoolDays ||
                        "Total School Days"}
                      :
                    </strong>{" "}
                    {attendance.totalSchoolDays}
                  </p>
                  <p className="mb-2">
                    <strong>
                      {t?.sessionResultSheet?.daysPresent || "Days Present"}:
                    </strong>{" "}
                    {attendance.daysPresent}
                  </p>
                  <p className="mb-2">
                    <strong>
                      {t?.sessionResultSheet?.daysAbsent || "Days Absent"}:
                    </strong>{" "}
                    {attendance.daysAbsent}
                  </p>
                  <p className="mb-0">
                    <strong>
                      {t?.sessionResultSheet?.attendancePercentage ||
                        "Attendance Percentage"}
                      :
                    </strong>{" "}
                    {safeFixed(attendance.attendancePercentage)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-12">
              <div className="card session-info-card">
                <div className="card-body">
                  <h5 className="mb-3">
                    {t?.sessionResultSheet?.termBreakdown || "Term Breakdown"}
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-bordered mb-0 session-table">
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
                            <td>{safeFixed(row.average)}</td>
                            <td>{row.position}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 session-promotion-card">
            <div className="card-body">
              <h5 className="mb-3">
                {t?.sessionResultSheet?.promotionDecision ||
                  "Promotion Decision"}
              </h5>
              <div className="d-flex align-items-center gap-2 mb-2">
                {promotion.promoted ? (
                  <FaCheckCircle className="text-success" />
                ) : (
                  <FaTimesCircle className="text-danger" />
                )}
                <strong>
                  {promotion.promoted
                    ? t?.sessionResultSheet?.promoted || "Promoted"
                    : t?.sessionResultSheet?.notPromoted || "Not Promoted"}
                </strong>
              </div>
              <p className="mb-0">
                <strong>{t?.sessionResultSheet?.remark || "Remark"}:</strong>{" "}
                {promotion.remark}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionResultSheet;
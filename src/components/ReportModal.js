// src/components/ReportModal.js
import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import {
  FaTimes,
  FaDownload,
  FaPrint,
  FaSpinner,
  FaFilePdf,
  FaFileExcel,
  FaChartBar,
} from "react-icons/fa";
import {
  studentAPI,
  resultAPI,
  attendanceAPI,
  sessionResultAPI,
} from "../services/api";
import { toast } from "react-toastify";
import moment from "moment";

function ReportModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const [reportType, setReportType] = useState("student");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSession, setSelectedSession] = useState("2025/2026");
  const [selectedTerm, setSelectedTerm] = useState("FIRST");
  const [dateRange, setDateRange] = useState({
    startDate: moment().subtract(30, "days").format("YYYY-MM-DD"),
    endDate: moment().format("YYYY-MM-DD"),
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportPreview, setReportPreview] = useState(null);

  const sessions = ["2023/2024", "2024/2025", "2025/2026", "2026/2027"];
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

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await studentAPI.getAllStudents();
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error(t?.reportModal?.loadFailed || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    setReportPreview(null);

    try {
      let response;
      let reportData;

      switch (reportType) {
        case "student":
          if (!selectedStudent) {
            toast.error(
              t?.reportModal?.selectStudent || "Please select a student",
            );
            setGenerating(false);
            return;
          }
          response = await resultAPI.getTermResult(
            selectedStudent.id,
            selectedSession,
            selectedTerm,
          );
          reportData = {
            type: t?.reportModal?.studentTermReport || "Student Term Report",
            student: selectedStudent,
            session: selectedSession,
            term: selectedTerm,
            data: response.data,
          };
          break;

        case "class":
          if (!selectedClass) {
            toast.error(t?.reportModal?.selectClass || "Please select a class");
            setGenerating(false);
            return;
          }
          response = await resultAPI.getClassRankings(
            selectedClass,
            selectedSession,
            selectedTerm,
          );
          reportData = {
            type: t?.reportModal?.classReport || "Class Report",
            className: selectedClass,
            session: selectedSession,
            term: selectedTerm,
            data: response.data,
          };
          break;

        case "attendance":
          if (!selectedClass) {
            toast.error(t?.reportModal?.selectClass || "Please select a class");
            setGenerating(false);
            return;
          }
          response = await attendanceAPI.getClassTermStatistics(
            selectedClass,
            selectedSession,
            selectedTerm,
          );
          reportData = {
            type: t?.reportModal?.attendanceReport || "Attendance Report",
            className: selectedClass,
            session: selectedSession,
            term: selectedTerm,
            dateRange: dateRange,
            data: response.data,
          };
          break;

        case "session":
          if (!selectedStudent) {
            toast.error(
              t?.reportModal?.selectStudent || "Please select a student",
            );
            setGenerating(false);
            return;
          }
          response = await sessionResultAPI.getSessionResult(
            selectedStudent.id,
            selectedSession,
          );
          reportData = {
            type:
              t?.reportModal?.sessionResultReport || "Session Result Report",
            student: selectedStudent,
            session: selectedSession,
            data: response.data,
          };
          break;

        case "school":
          response = await sessionResultAPI.getSchoolRankings(selectedSession);
          reportData = {
            type: t?.reportModal?.schoolReport || "School Performance Report",
            session: selectedSession,
            data: response.data,
          };
          break;

        default:
          break;
      }

      setReportPreview(reportData);
      toast.success(
        t?.reportModal?.generated || "Report generated successfully",
      );

      if (reportFormat === "pdf") {
        generatePDF(reportData);
      } else if (reportFormat === "excel") {
        generateExcel(reportData);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(
        t?.reportModal?.generateFailed || "Failed to generate report",
      );
    } finally {
      setGenerating(false);
    }
  };

  const generatePDF = (data) => {
    console.log("Generating PDF:", data);
    toast.info(
      t?.reportModal?.pdfGeneration || "PDF generation would happen here",
    );
  };

  const generateExcel = (data) => {
    console.log("Generating Excel:", data);
    toast.info(
      t?.reportModal?.excelGeneration || "Excel generation would happen here",
    );
  };

  const handleDownload = () => {
    toast.success(
      t?.reportModal?.downloaded ||
        `Report downloaded as ${reportFormat.toUpperCase()}`,
    );
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <FaChartBar className="me-2" />{" "}
              {t?.reportModal?.title || "Generate Report"}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-12">
                <label className="form-label fw-bold">
                  {t?.reportModal?.reportType || "Report Type"}
                </label>
                <div className="btn-group d-flex flex-wrap" role="group">
                  <button
                    type="button"
                    className={`btn ${reportType === "student" ? "btn-nigerian" : "btn-outline-nigerian"}`}
                    onClick={() => setReportType("student")}
                  >
                    {t?.reportModal?.studentTermReport || "Student Term Report"}
                  </button>
                  <button
                    type="button"
                    className={`btn ${reportType === "session" ? "btn-nigerian" : "btn-outline-nigerian"}`}
                    onClick={() => setReportType("session")}
                  >
                    {t?.reportModal?.sessionReport || "Session Report"}
                  </button>
                  <button
                    type="button"
                    className={`btn ${reportType === "class" ? "btn-nigerian" : "btn-outline-nigerian"}`}
                    onClick={() => setReportType("class")}
                  >
                    {t?.reportModal?.classReport || "Class Report"}
                  </button>
                  <button
                    type="button"
                    className={`btn ${reportType === "attendance" ? "btn-nigerian" : "btn-outline-nigerian"}`}
                    onClick={() => setReportType("attendance")}
                  >
                    {t?.reportModal?.attendanceReport || "Attendance Report"}
                  </button>
                  <button
                    type="button"
                    className={`btn ${reportType === "school" ? "btn-nigerian" : "btn-outline-nigerian"}`}
                    onClick={() => setReportType("school")}
                  >
                    {t?.reportModal?.schoolReport || "School Report"}
                  </button>
                </div>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  {t?.reportModal?.session || "Session"}
                </label>
                <select
                  className="form-select"
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                >
                  {sessions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {(reportType === "student" ||
                reportType === "class" ||
                reportType === "attendance") && (
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    {t?.reportModal?.term || "Term"}
                  </label>
                  <select
                    className="form-select"
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                  >
                    {terms.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(reportType === "student" || reportType === "session") && (
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    {t?.reportModal?.student || "Student"}
                  </label>
                  <select
                    className="form-select"
                    value={selectedStudent?.id || ""}
                    onChange={(e) => {
                      const student = students.find(
                        (s) => s.id === parseInt(e.target.value),
                      );
                      setSelectedStudent(student);
                    }}
                  >
                    <option value="">
                      {t?.common?.select || "Select Student"}
                    </option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} - {s.admissionNumber}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(reportType === "class" || reportType === "attendance") && (
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    {t?.reportModal?.class || "Class"}
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

              {reportType === "attendance" && (
                <>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      {t?.reportModal?.startDate || "Start Date"}
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={dateRange.startDate}
                      onChange={(e) =>
                        setDateRange({
                          ...dateRange,
                          startDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      {t?.reportModal?.endDate || "End Date"}
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={dateRange.endDate}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, endDate: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              <div className="col-md-6 mb-3">
                <label className="form-label">
                  {t?.reportModal?.format || "Format"}
                </label>
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn ${reportFormat === "pdf" ? "btn-danger" : "btn-outline-danger"}`}
                    onClick={() => setReportFormat("pdf")}
                  >
                    <FaFilePdf className="me-2" /> PDF
                  </button>
                  <button
                    type="button"
                    className={`btn ${reportFormat === "excel" ? "btn-success" : "btn-outline-success"}`}
                    onClick={() => setReportFormat("excel")}
                  >
                    <FaFileExcel className="me-2" /> Excel
                  </button>
                </div>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-12 text-center">
                <button
                  className="btn btn-nigerian btn-lg px-5"
                  onClick={handleGenerateReport}
                  disabled={generating || loading}
                >
                  {generating ? (
                    <>
                      <FaSpinner className="spinner me-2" />{" "}
                      {t?.common?.generating || "Generating..."}
                    </>
                  ) : (
                    <>
                      <FaChartBar className="me-2" />{" "}
                      {t?.reportModal?.generate || "Generate Report"}
                    </>
                  )}
                </button>
              </div>
            </div>

            {reportPreview && (
              <div className="report-preview">
                <h6 className="border-bottom pb-2 mb-3">
                  {t?.reportModal?.preview || "Report Preview"}
                </h6>
                <div className="preview-content">
                  <div className="alert alert-info">
                    <p>
                      <strong>{t?.reportModal?.type || "Type"}:</strong>{" "}
                      {reportPreview.type}
                    </p>
                    <p>
                      <strong>{t?.reportModal?.session || "Session"}:</strong>{" "}
                      {reportPreview.session || selectedSession}
                    </p>
                    {reportPreview.term && (
                      <p>
                        <strong>{t?.reportModal?.term || "Term"}:</strong>{" "}
                        {reportPreview.term}
                      </p>
                    )}
                    {reportPreview.student && (
                      <p>
                        <strong>{t?.reportModal?.student || "Student"}:</strong>{" "}
                        {reportPreview.student.fullName}
                      </p>
                    )}
                    {reportPreview.className && (
                      <p>
                        <strong>{t?.reportModal?.class || "Class"}:</strong>{" "}
                        {reportPreview.className}
                      </p>
                    )}
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button className="btn btn-success" onClick={handleDownload}>
                    <FaDownload className="me-2" />{" "}
                    {t?.common?.download || "Download"}{" "}
                    {reportFormat.toUpperCase()}
                  </button>
                  <button className="btn btn-info" onClick={handlePrint}>
                    <FaPrint className="me-2" /> {t?.common?.print || "Print"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportModal;

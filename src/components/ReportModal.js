// src/components/ReportModal.js
import React, { useState, useEffect } from "react";
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
      toast.error("Failed to load students");
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
            toast.error("Please select a student");
            setGenerating(false);
            return;
          }
          response = await resultAPI.getTermResult(
            selectedStudent.id,
            selectedSession,
            selectedTerm,
          );
          reportData = {
            type: "Student Term Report",
            student: selectedStudent,
            session: selectedSession,
            term: selectedTerm,
            data: response.data,
          };
          break;

        case "class":
          if (!selectedClass) {
            toast.error("Please select a class");
            setGenerating(false);
            return;
          }
          response = await resultAPI.getClassRankings(
            selectedClass,
            selectedSession,
            selectedTerm,
          );
          reportData = {
            type: "Class Report",
            className: selectedClass,
            session: selectedSession,
            term: selectedTerm,
            data: response.data,
          };
          break;

        case "attendance":
          if (!selectedClass) {
            toast.error("Please select a class");
            setGenerating(false);
            return;
          }
          response = await attendanceAPI.getClassTermStatistics(
            selectedClass,
            selectedSession,
            selectedTerm,
          );
          reportData = {
            type: "Attendance Report",
            className: selectedClass,
            session: selectedSession,
            term: selectedTerm,
            dateRange: dateRange,
            data: response.data,
          };
          break;

        case "session":
          if (!selectedStudent) {
            toast.error("Please select a student");
            setGenerating(false);
            return;
          }
          response = await sessionResultAPI.getSessionResult(
            selectedStudent.id,
            selectedSession,
          );
          reportData = {
            type: "Session Result Report",
            student: selectedStudent,
            session: selectedSession,
            data: response.data,
          };
          break;

        case "school":
          response = await sessionResultAPI.getSchoolRankings(selectedSession);
          reportData = {
            type: "School Performance Report",
            session: selectedSession,
            data: response.data,
          };
          break;

        default:
          break;
      }

      setReportPreview(reportData);
      toast.success("Report generated successfully");

      // In a real implementation, you would generate PDF/Excel here
      if (reportFormat === "pdf") {
        generatePDF(reportData);
      } else if (reportFormat === "excel") {
        generateExcel(reportData);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const generatePDF = (data) => {
    // This would integrate with a PDF library like jsPDF
    console.log("Generating PDF:", data);
    toast.info("PDF generation would happen here");
  };

  const generateExcel = (data) => {
    // This would integrate with an Excel library
    console.log("Generating Excel:", data);
    toast.info("Excel generation would happen here");
  };

  const handleDownload = () => {
    toast.success(`Report downloaded as ${reportFormat.toUpperCase()}`);
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
              <FaChartBar className="me-2" /> Generate Report
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            {/* Report Type Selection */}
            <div className="row mb-4">
              <div className="col-12">
                <label className="form-label fw-bold">Report Type</label>
                <div className="btn-group d-flex flex-wrap" role="group">
                  <button
                    type="button"
                    className={`btn ${reportType === "student" ? "btn-nigerian" : "btn-outline-nigerian"}`}
                    onClick={() => setReportType("student")}
                  >
                    Student Term Report
                  </button>
                  <button
                    type="button"
                    className={`btn ${reportType === "session" ? "btn-nigerian" : "btn-outline-nigerian"}`}
                    onClick={() => setReportType("session")}
                  >
                    Session Report
                  </button>
                  <button
                    type="button"
                    className={`btn ${reportType === "class" ? "btn-nigerian" : "btn-outline-nigerian"}`}
                    onClick={() => setReportType("class")}
                  >
                    Class Report
                  </button>
                  <button
                    type="button"
                    className={`btn ${reportType === "attendance" ? "btn-nigerian" : "btn-outline-nigerian"}`}
                    onClick={() => setReportType("attendance")}
                  >
                    Attendance Report
                  </button>
                  <button
                    type="button"
                    className={`btn ${reportType === "school" ? "btn-nigerian" : "btn-outline-nigerian"}`}
                    onClick={() => setReportType("school")}
                  >
                    School Report
                  </button>
                </div>
              </div>
            </div>

            {/* Report Parameters */}
            <div className="row mb-4">
              <div className="col-md-6 mb-3">
                <label className="form-label">Session</label>
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
                  <label className="form-label">Term</label>
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
                  <label className="form-label">Student</label>
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
                    <option value="">Select Student</option>
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
                  <label className="form-label">Class</label>
                  <select
                    className="form-select"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="">Select Class</option>
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
                    <label className="form-label">Start Date</label>
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
                    <label className="form-label">End Date</label>
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
                <label className="form-label">Format</label>
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

            {/* Generate Button */}
            <div className="row mb-4">
              <div className="col-12 text-center">
                <button
                  className="btn btn-nigerian btn-lg px-5"
                  onClick={handleGenerateReport}
                  disabled={generating || loading}
                >
                  {generating ? (
                    <>
                      <FaSpinner className="spinner me-2" /> Generating...
                    </>
                  ) : (
                    <>
                      <FaChartBar className="me-2" /> Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Report Preview */}
            {reportPreview && (
              <div className="report-preview">
                <h6 className="border-bottom pb-2 mb-3">Report Preview</h6>

                {/* Student Term Report Preview */}
                {reportPreview.type === "Student Term Report" &&
                  reportPreview.data && (
                    <div className="preview-content">
                      <div className="alert alert-info">
                        <p>
                          <strong>Student:</strong>{" "}
                          {reportPreview.student?.fullName}
                        </p>
                        <p>
                          <strong>Class:</strong>{" "}
                          {reportPreview.student?.studentClass}{" "}
                          {reportPreview.student?.classArm}
                        </p>
                        <p>
                          <strong>Session:</strong> {reportPreview.session}
                        </p>
                        <p>
                          <strong>Term:</strong> {reportPreview.term}
                        </p>
                        <p>
                          <strong>Average:</strong>{" "}
                          {reportPreview.data.summary?.average?.toFixed(2)}%
                        </p>
                        <p>
                          <strong>Position:</strong>{" "}
                          {reportPreview.data.summary?.positionInClass}
                        </p>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered">
                          <thead className="table-light">
                            <tr>
                              <th>Subject</th>
                              <th>CA</th>
                              <th>Exam</th>
                              <th>Total</th>
                              <th>Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportPreview.data.subjects
                              ?.slice(0, 3)
                              .map((subject, idx) => (
                                <tr key={idx}>
                                  <td>{subject.subject}</td>
                                  <td>{subject.continuousAssessment}</td>
                                  <td>{subject.examination}</td>
                                  <td>{subject.total}</td>
                                  <td>{subject.grade}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        {reportPreview.data.subjects?.length > 3 && (
                          <p className="text-muted small">
                            ... and {reportPreview.data.subjects.length - 3}{" "}
                            more subjects
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                {/* Class Report Preview */}
                {reportPreview.type === "Class Report" &&
                  reportPreview.data && (
                    <div className="preview-content">
                      <div className="alert alert-info">
                        <p>
                          <strong>Class:</strong> {reportPreview.className}
                        </p>
                        <p>
                          <strong>Session:</strong> {reportPreview.session}
                        </p>
                        <p>
                          <strong>Term:</strong> {reportPreview.term}
                        </p>
                        <p>
                          <strong>Total Students:</strong>{" "}
                          {reportPreview.data.totalStudents}
                        </p>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered">
                          <thead className="table-light">
                            <tr>
                              <th>Position</th>
                              <th>Student</th>
                              <th>Average</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportPreview.data.rankings
                              ?.slice(0, 5)
                              .map((rank, idx) => (
                                <tr key={idx}>
                                  <td>{rank.position}</td>
                                  <td>{rank.studentName}</td>
                                  <td>{rank.average?.toFixed(2)}%</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* Attendance Report Preview */}
                {reportPreview.type === "Attendance Report" &&
                  reportPreview.data && (
                    <div className="preview-content">
                      <div className="alert alert-info">
                        <p>
                          <strong>Class:</strong> {reportPreview.className}
                        </p>
                        <p>
                          <strong>Session:</strong> {reportPreview.session}
                        </p>
                        <p>
                          <strong>Term:</strong> {reportPreview.term}
                        </p>
                        <p>
                          <strong>Period:</strong>{" "}
                          {moment(reportPreview.dateRange.startDate).format(
                            "DD/MM/YYYY",
                          )}{" "}
                          -{" "}
                          {moment(reportPreview.dateRange.endDate).format(
                            "DD/MM/YYYY",
                          )}
                        </p>
                      </div>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="border p-2 rounded text-center">
                            <h6>Total Present</h6>
                            <h3 className="text-success">
                              {reportPreview.data.totalPresent}
                            </h3>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="border p-2 rounded text-center">
                            <h6>Total Absent</h6>
                            <h3 className="text-danger">
                              {reportPreview.data.totalAbsent}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Session Report Preview */}
                {reportPreview.type === "Session Result Report" &&
                  reportPreview.data && (
                    <div className="preview-content">
                      <div className="alert alert-info">
                        <p>
                          <strong>Student:</strong>{" "}
                          {reportPreview.student?.fullName}
                        </p>
                        <p>
                          <strong>Class:</strong>{" "}
                          {reportPreview.student?.studentClass}{" "}
                          {reportPreview.student?.classArm}
                        </p>
                        <p>
                          <strong>Session:</strong> {reportPreview.session}
                        </p>
                        <p>
                          <strong>Annual Average:</strong>{" "}
                          {reportPreview.data.annualAverage?.toFixed(2)}%
                        </p>
                        <p>
                          <strong>Promoted:</strong>{" "}
                          {reportPreview.data.promoted ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>
                  )}

                {/* School Report Preview */}
                {reportPreview.type === "School Performance Report" &&
                  reportPreview.data && (
                    <div className="preview-content">
                      <div className="alert alert-info">
                        <p>
                          <strong>Session:</strong> {reportPreview.session}
                        </p>
                        <p>
                          <strong>Total Students:</strong>{" "}
                          {reportPreview.data.totalStudents}
                        </p>
                        <p>
                          <strong>Promotion Rate:</strong>{" "}
                          {reportPreview.data.statistics?.promotionRate?.toFixed(
                            1,
                          )}
                          %
                        </p>
                      </div>
                    </div>
                  )}

                {/* Action Buttons */}
                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button className="btn btn-success" onClick={handleDownload}>
                    <FaDownload className="me-2" /> Download{" "}
                    {reportFormat.toUpperCase()}
                  </button>
                  <button className="btn btn-info" onClick={handlePrint}>
                    <FaPrint className="me-2" /> Print
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

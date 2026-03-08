// src/components/ResultSheet.js
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { studentAPI, resultAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaPrint,
  FaDownload,
  FaArrowLeft,
  FaUserCircle,
  FaSpinner,
  FaCamera,
} from "react-icons/fa";
import moment from "moment";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./ResultSheet.css";

function ResultSheet() {
  const { studentId, sessionYear, sessionTerm, term } = useParams();
  const navigate = useNavigate();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const componentRef = useRef();

  // Reconstruct session from URL parameters
  const session = `${sessionYear}/${sessionTerm}`;

  useEffect(() => {
    console.log("ResultSheet mounted with params:", {
      studentId,
      sessionYear,
      sessionTerm,
      term,
      reconstructedSession: session,
    });

    if (studentId && session && term) {
      fetchResultData();
    } else {
      setError("Missing required parameters");
      setLoading(false);
    }
  }, [studentId, session, term]);

  const fetchResultData = async () => {
    console.log("Fetching result data...");
    setLoading(true);
    setError(null);

    try {
      // Fetch student details first
      console.log("Fetching student with ID:", studentId);
      const studentResponse = await studentAPI.getStudentById(studentId);
      console.log("Student response:", studentResponse.data);
      setStudent(studentResponse.data);

      // Fetch result sheet
      console.log("Fetching result for:", { studentId, session, term });
      console.log(
        "API URL:",
        `/results/student/${studentId}/term?session=${session}&term=${term}`,
      );

      const resultResponse = await resultAPI.getTermResult(
        studentId,
        session,
        term,
      );

      console.log("Result response:", resultResponse.data);
      setResultData(resultResponse.data);
      toast.success("Result loaded successfully");
    } catch (error) {
      console.error("Error fetching result:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: error.config,
      });

      // Handle specific error cases
      if (error.response?.status === 404) {
        setError("No result found for this student in the selected term");
        toast.info("No results found for this student in the selected term");
      } else {
        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load result sheet",
        );
        toast.error("Failed to load result sheet");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date ? moment(date).format("DD/MM/YYYY") : "N/A";
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case "A":
        return "text-success";
      case "B":
        return "text-primary";
      case "C":
        return "text-info";
      case "D":
        return "text-warning";
      case "E":
        return "text-secondary";
      case "F":
        return "text-danger";
      default:
        return "";
    }
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `${student?.fullName || "student"}_${term}_${sessionYear}_${sessionTerm}`,
    onAfterPrint: () => toast.success("Result sheet printed successfully"),
  });

  const handleDownloadPDF = async () => {
    if (!componentRef.current) {
      toast.error("Result sheet not ready");
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

      const fileName = `${student?.fullName?.replace(/\s+/g, "_") || "student"}_${term}_${sessionYear}_${sessionTerm}.pdf`;

      pdf.save(fileName);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="text-center">
          <FaSpinner className="spinner mb-3" size={40} />
          <h5>Loading result sheet...</h5>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Error Loading Result</h4>
          <p>{error}</p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate("/results")}
          >
            <FaArrowLeft className="me-2" /> Back to Results
          </button>
        </div>
      </div>
    );
  }

  if (!resultData || !student) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          <h4>No Result Found</h4>
          <p>
            No result found for this student in {term} term, {session} session.
          </p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate("/results")}
          >
            <FaArrowLeft className="me-2" /> Back to Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="result-sheet-container">
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <FaArrowLeft className="me-2" /> Back
        </button>
        <div>
          <button
            className="btn btn-nigerian me-2"
            onClick={handlePrint}
            disabled={downloading}
          >
            <FaPrint className="me-2" /> Print
          </button>
          <button
            className="btn btn-outline-nigerian"
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <FaSpinner className="spinner me-2" /> Generating...
              </>
            ) : (
              <>
                <FaDownload className="me-2" /> Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Printable Result Sheet */}
      <div
        ref={componentRef}
        className="result-sheet printable bg-white p-4"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        {/* School Header */}
        <div className="text-center mb-4 border-bottom pb-3">
          <h1 className="display-6 text-success mb-0">
            FAITH FOUNDATION INTERNATIONAL SCHOOL
          </h1>
          <p className="mb-0">12 Bishop Shanahan, Fegge Onitsha, Anambra</p>
          <p className="mb-0">
            Tel: +234 903 017 5230 | Email: info@faithfoundation.edu.ng
          </p>
          <p className="mb-0">Website: www.faithfoundation.edu.ng</p>
        </div>

        {/* Result Title */}
        <h3 className="text-center mb-4 text-uppercase fw-bold">
          {term} TERM RESULT SHEET - {session} SESSION
        </h3>

        {/* Student Info with Photo */}
        <div className="row mb-4">
          <div className="col-md-8">
            <table className="table table-bordered">
              <tbody>
                <tr>
                  <td className="bg-light fw-bold" style={{ width: "200px" }}>
                    Student Name:
                  </td>
                  <td className="fw-bold">
                    {resultData?.studentInfo?.name || student?.fullName}
                  </td>
                </tr>
                <tr>
                  <td className="bg-light fw-bold">Admission Number:</td>
                  <td>
                    {resultData?.studentInfo?.admissionNumber ||
                      student?.admissionNumber}
                  </td>
                </tr>
                <tr>
                  <td className="bg-light fw-bold">Class:</td>
                  <td>
                    {resultData?.studentInfo?.class || student?.studentClass}{" "}
                    {resultData?.studentInfo?.arm || student?.classArm}
                  </td>
                </tr>
                <tr>
                  <td className="bg-light fw-bold">Date of Birth:</td>
                  <td>{formatDate(student?.dateOfBirth)}</td>
                </tr>
                <tr>
                  <td className="bg-light fw-bold">Parent/Guardian:</td>
                  <td>{student?.parentName}</td>
                </tr>
                <tr>
                  <td className="bg-light fw-bold">Parent Phone:</td>
                  <td>{student?.parentPhone}</td>
                </tr>
                <tr>
                  <td className="bg-light fw-bold">Student Address:</td>
                  <td>{student?.address}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="col-md-4 text-center">
            <div className="student-photo-container p-3 bg-light rounded">
              {resultData?.studentInfo?.profilePictureUrl ? (
                <div className="position-relative">
                  <img
                    src={`http://localhost:8080${resultData.studentInfo.profilePictureUrl}`}
                    alt={resultData.studentInfo.name}
                    className="img-fluid rounded-circle border border-4 border-success"
                    style={{
                      width: "180px",
                      height: "180px",
                      objectFit: "cover",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                    }}
                    onError={(e) => {
                      console.error("Image failed to load:", e.target.src);
                      e.target.onerror = null;
                      e.target.src = "/default-avatar.png";
                    }}
                  />
                  <div className="mt-2">
                    <span className="badge bg-success">
                      ID: {resultData.studentInfo.admissionNumber}
                    </span>
                  </div>
                </div>
              ) : student?.profilePictureUrl ? (
                <div className="position-relative">
                  <img
                    src={`http://localhost:8080${student.profilePictureUrl}`}
                    alt={student.fullName}
                    className="img-fluid rounded-circle border border-4 border-success"
                    style={{
                      width: "180px",
                      height: "180px",
                      objectFit: "cover",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                    }}
                    onError={(e) => {
                      console.error("Image failed to load:", e.target.src);
                      e.target.onerror = null;
                      e.target.src = "/default-avatar.png";
                    }}
                  />
                </div>
              ) : (
                <div className="text-center">
                  <FaUserCircle size={150} color="#ccc" />
                  <p className="mt-2 text-muted">
                    <em>No photo available</em>
                  </p>
                </div>
              )}
            </div>
            <p className="mt-2 text-muted small">
              <FaCamera className="me-1" /> Student Photograph
            </p>
          </div>
        </div>

        {/* Attendance Record */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="border p-3 rounded">
              <h6 className="bg-light p-2 mb-3">ATTENDANCE RECORD</h6>
              <table className="table table-sm">
                <tbody>
                  <tr>
                    <td>Total School Days:</td>
                    <td className="fw-bold">
                      {resultData?.summary?.totalSchoolDays || 0}
                    </td>
                  </tr>
                  <tr>
                    <td>Days Present:</td>
                    <td className="fw-bold text-success">
                      {resultData?.summary?.daysPresent || 0}
                    </td>
                  </tr>
                  <tr>
                    <td>Days Absent:</td>
                    <td className="fw-bold text-danger">
                      {resultData?.summary?.daysAbsent || 0}
                    </td>
                  </tr>
                  <tr>
                    <td>Attendance Percentage:</td>
                    <td className="fw-bold">
                      {resultData?.summary?.attendancePercentage?.toFixed(1) ||
                        0}
                      %
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="2">
                      <div className="progress" style={{ height: "10px" }}>
                        <div
                          className={`progress-bar ${
                            (resultData?.summary?.attendancePercentage || 0) >=
                            90
                              ? "bg-success"
                              : (resultData?.summary?.attendancePercentage ||
                                    0) >= 75
                                ? "bg-primary"
                                : (resultData?.summary?.attendancePercentage ||
                                      0) >= 60
                                  ? "bg-warning"
                                  : "bg-danger"
                          }`}
                          style={{
                            width: `${resultData?.summary?.attendancePercentage || 0}%`,
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="col-md-6">
            <div className="border p-3 rounded">
              <h6 className="bg-light p-2 mb-3">ATTENDANCE STATUS</h6>
              <div className="row text-center">
                <div className="col-4">
                  <div className="p-2">
                    <span
                      className="badge bg-success p-3"
                      style={{ fontSize: "1.2rem" }}
                    >
                      {resultData?.summary?.daysPresent || 0}
                    </span>
                    <p className="mt-2 mb-0">Present</p>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-2">
                    <span
                      className="badge bg-danger p-3"
                      style={{ fontSize: "1.2rem" }}
                    >
                      {resultData?.summary?.daysAbsent || 0}
                    </span>
                    <p className="mt-2 mb-0">Absent</p>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-2">
                    <span
                      className="badge bg-info p-3"
                      style={{ fontSize: "1.2rem" }}
                    >
                      {(
                        ((resultData?.summary?.daysPresent || 0) /
                          (resultData?.summary?.totalSchoolDays || 1)) *
                        100
                      ).toFixed(0)}
                      %
                    </span>
                    <p className="mt-2 mb-0">Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="table-responsive mb-4">
          <table className="table table-bordered table-striped">
            <thead className="bg-success text-white">
              <tr>
                <th rowSpan="2">S/N</th>
                <th rowSpan="2">SUBJECT</th>
                <th colSpan="5" className="text-center">
                  CONTINUOUS ASSESSMENT (40)
                </th>
                <th rowSpan="2">CA TOTAL (40)</th>
                <th rowSpan="2">EXAM (60)</th>
                <th rowSpan="2">TOTAL (100)</th>
                <th rowSpan="2">GRADE</th>
                <th rowSpan="2">REMARK</th>
              </tr>
              <tr>
                <th>RT (5)</th>
                <th>ASS (10)</th>
                <th>PROJ (10)</th>
                <th>MT (10)</th>
                <th>2ND (5)</th>
              </tr>
            </thead>
            <tbody>
              {resultData?.subjects?.map((subject, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className="fw-bold">{subject.subject}</td>
                  <td>{subject.resumptionTest}</td>
                  <td>{subject.assignments}</td>
                  <td>{subject.project}</td>
                  <td>{subject.midtermTest}</td>
                  <td>{subject.secondTest}</td>
                  <td className="fw-bold">{subject.continuousAssessment}</td>
                  <td>{subject.examination}</td>
                  <td className="fw-bold">{subject.total}</td>
                  <td className={`fw-bold ${getGradeColor(subject.grade)}`}>
                    {subject.grade}
                  </td>
                  <td>{subject.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="border p-3 rounded bg-light text-center">
              <h6>TOTAL SCORE</h6>
              <h3 className="text-primary">
                {resultData?.summary?.totalScore}
              </h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="border p-3 rounded bg-light text-center">
              <h6>AVERAGE</h6>
              <h3 className="text-success">
                {resultData?.summary?.average?.toFixed(2)}%
              </h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="border p-3 rounded bg-light text-center">
              <h6>CLASS POSITION</h6>
              <h3 className="text-warning">
                {resultData?.summary?.positionInClass} /{" "}
                {resultData?.summary?.totalStudentsInClass}
              </h3>
              <small className="text-muted">
                Out of {resultData?.summary?.totalStudentsInClass} students
              </small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="border p-3 rounded bg-light text-center">
              <h6>ARM POSITION</h6>
              <h3 className="text-info">
                {resultData?.summary?.positionInArm} /{" "}
                {resultData?.summary?.totalStudentsInArm || 1}
              </h3>
              <small className="text-muted">
                Out of {resultData?.summary?.totalStudentsInArm || 1} students
              </small>
            </div>
          </div>
        </div>

        {/* Grade Key */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="border p-3 rounded">
              <h6 className="bg-light p-2 mb-3">GRADING SYSTEM</h6>
              <div className="row">
                <div className="col-md-2">
                  <span className="badge bg-success">A</span> 70-100% -
                  Excellent
                </div>
                <div className="col-md-2">
                  <span className="badge bg-primary">B</span> 60-69% - Very Good
                </div>
                <div className="col-md-2">
                  <span className="badge bg-info">C</span> 50-59% - Good
                </div>
                <div className="col-md-2">
                  <span className="badge bg-warning">D</span> 45-49% - Pass
                </div>
                <div className="col-md-2">
                  <span className="badge bg-secondary">E</span> 40-44% - Fair
                </div>
                <div className="col-md-2">
                  <span className="badge bg-danger">F</span> 0-39% - Fail
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments and Signatures */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="border p-3 rounded">
              <h6 className="bg-light p-2 mb-3">CLASS TEACHER'S COMMENT</h6>
              <p className="fst-italic">
                "A very good performance. Keep up the good work!"
              </p>
              <div className="row mt-4">
                <div className="col-6">
                  <p>_________________________</p>
                  <p className="fw-bold">Class Teacher's Signature</p>
                  <p className="text-muted small">
                    Date: {formatDate(new Date())}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="border p-3 rounded">
              <h6 className="bg-light p-2 mb-3">PRINCIPAL'S COMMENT</h6>
              <p className="fst-italic">
                "Excellent performance. Promoted to the next class."
              </p>
              <div className="row mt-4">
                <div className="col-6">
                  <p>_________________________</p>
                  <p className="fw-bold">Principal's Signature</p>
                  <p className="text-muted small">
                    Date: {formatDate(new Date())}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Term Information */}
        <div className="border p-3 rounded bg-light">
          <div className="row">
            <div className="col-md-4">
              <p className="mb-0">
                <strong>Term Ends:</strong> 12th December, 2025
              </p>
            </div>
            <div className="col-md-4">
              <p className="mb-0">
                <strong>Next Term Begins:</strong> 6th January, 2026
              </p>
            </div>
            <div className="col-md-4">
              <p className="mb-0">
                <strong>Next Term Class:</strong>{" "}
                {resultData?.studentInfo?.class} {resultData?.studentInfo?.arm}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 pt-3 border-top">
          <p className="text-muted small mb-0">
            This is a computer-generated result and is valid without signature
          </p>
          <p className="text-muted small">
            Powered by Faith Foundation International School Management System
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResultSheet;

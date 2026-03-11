import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  const { studentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const query = new URLSearchParams(location.search);
  const session = query.get("session") || "";
  const term = query.get("term") || "";

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
      "student"
    );
  };

  useEffect(() => {
    if (studentId && session && term) {
      fetchResultData();
    } else {
      setError("Missing required parameters");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, session, term]);

  const fetchResultData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [studentResponse, resultResponse] = await Promise.all([
        studentAPI.getStudentById(studentId),
        resultAPI.getTermResult(studentId, session, term),
      ]);

      setStudent(studentResponse.data || null);
      setResultData(resultResponse.data || null);
    } catch (error) {
      console.error("Error fetching result sheet:", error);

      if (error.response?.status === 404) {
        setError("No result found for this student in the selected term");
      } else if (error.response?.status === 403) {
        setError("You are not allowed to view this result");
      } else {
        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load result sheet",
        );
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

  const buildFileName = () => {
    const cleanName = getStudentName().replace(/\s+/g, "_");
    const cleanSession = session.replace(/[\/\\]/g, "_");
    return `${cleanName}_${term}_${cleanSession}`;
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: buildFileName(),
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

      const pdfWidth = canvas.width * 0.75;
      const pdfHeight = canvas.height * 0.75;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${buildFileName()}.pdf`);

      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const studentPhotoUrl = resultData?.studentInfo?.profilePictureUrl
    ? `http://localhost:8080${resultData.studentInfo.profilePictureUrl}`
    : student?.profilePictureUrl
      ? `http://localhost:8080${student.profilePictureUrl}`
      : null;

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

      <div
        ref={componentRef}
        className="result-sheet printable bg-white p-4"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
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

        <h3 className="text-center mb-4 text-uppercase fw-bold">
          {term} TERM RESULT SHEET - {session} SESSION
        </h3>

        <div className="row mb-4">
          <div className="col-md-8">
            <table className="table table-bordered">
              <tbody>
                <tr>
                  <td className="bg-light fw-bold" style={{ width: "200px" }}>
                    Student Name:
                  </td>
                  <td className="fw-bold">{getStudentName()}</td>
                </tr>
                <tr>
                  <td className="bg-light fw-bold">Admission Number:</td>
                  <td>
                    {resultData?.studentInfo?.admissionNumber ||
                      student?.admissionNumber ||
                      "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="bg-light fw-bold">Class:</td>
                  <td>
                    {resultData?.studentInfo?.class ||
                      student?.studentClass ||
                      "N/A"}{" "}
                    {resultData?.studentInfo?.arm || student?.classArm || ""}
                  </td>
                </tr>
                <tr>
                  <td className="bg-light fw-bold">Date of Birth:</td>
                  <td>{formatDate(student?.dateOfBirth)}</td>
                </tr>
                <tr>
                  <td className="bg-light fw-bold">Parent/Guardian:</td>
                  <td>{student?.parentName || "N/A"}</td>
                </tr>
                <tr>
                  <td className="bg-light fw-bold">Parent Phone:</td>
                  <td>{student?.parentPhone || "N/A"}</td>
                </tr>
                <tr>
                  <td className="bg-light fw-bold">Student Address:</td>
                  <td>{student?.address || "N/A"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="col-md-4 text-center">
            <div className="student-photo-container p-3 bg-light rounded">
              {studentPhotoUrl ? (
                <img
                  src={studentPhotoUrl}
                  alt={getStudentName()}
                  className="img-fluid rounded-circle border border-4 border-success"
                  style={{
                    width: "180px",
                    height: "180px",
                    objectFit: "cover",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
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

        <div className="table-responsive mb-4">
          <table className="table table-bordered table-striped">
            <thead className="bg-success text-white">
              <tr>
                <th>S/N</th>
                <th>SUBJECT</th>
                <th>CA</th>
                <th>EXAM</th>
                <th>TOTAL</th>
                <th>GRADE</th>
                <th>REMARK</th>
              </tr>
            </thead>
            <tbody>
              {resultData?.subjects?.length > 0 ? (
                resultData.subjects.map((subject, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td className="fw-bold">{subject.subject}</td>
                    <td>{safeNumber(subject.continuousAssessment)}</td>
                    <td>{safeNumber(subject.examination)}</td>
                    <td className="fw-bold">{safeNumber(subject.total)}</td>
                    <td className={`fw-bold ${getGradeColor(subject.grade)}`}>
                      {subject.grade || "-"}
                    </td>
                    <td>{subject.remarks || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted">
                    No subject records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="row mb-4">
          <div className="col-md-3">
            <div className="border p-3 rounded bg-light text-center">
              <h6>TOTAL SCORE</h6>
              <h3 className="text-primary">
                {safeNumber(resultData?.summary?.totalScore)}
              </h3>
            </div>
          </div>

          <div className="col-md-3">
            <div className="border p-3 rounded bg-light text-center">
              <h6>AVERAGE</h6>
              <h3 className="text-success">
                {safeFixed(resultData?.summary?.average, 2)}%
              </h3>
            </div>
          </div>

          <div className="col-md-3">
            <div className="border p-3 rounded bg-light text-center">
              <h6>CLASS POSITION</h6>
              <h3 className="text-warning">
                {resultData?.summary?.positionInClass || "N/A"}
              </h3>
            </div>
          </div>

          <div className="col-md-3">
            <div className="border p-3 rounded bg-light text-center">
              <h6>ARM POSITION</h6>
              <h3 className="text-info">
                {resultData?.summary?.positionInArm || "N/A"}
              </h3>
            </div>
          </div>
        </div>

        <div className="text-center mt-4 pt-3 border-top">
          <p className="text-muted small mb-0">
            This is a computer-generated result and is valid without signature
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResultSheet;

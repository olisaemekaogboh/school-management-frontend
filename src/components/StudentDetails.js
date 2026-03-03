// src/components/StudentDetails.js
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { studentAPI, resultAPI } from "../services/api";
import {
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaPrint,
  FaUserCircle,
  FaChartBar,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaVenusMars,
  FaBirthdayCake,
  FaUserGraduate,
  FaSchool,
  FaIdCard,
  FaUsers,
  FaDownload,
  FaEye,
  FaHistory,
  FaAward,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaCamera,
} from "react-icons/fa";
import { toast } from "react-toastify";
import moment from "moment";
import "./StudentDetails.css"; // Import custom CSS for additional styles

function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [termResults, setTermResults] = useState([]);
  const [annualResult, setAnnualResult] = useState(null);
  const [selectedSession, setSelectedSession] = useState("2025/2026");
  const [selectedTerm, setSelectedTerm] = useState("FIRST");
  const [resultHistory, setResultHistory] = useState({});
  const [imageError, setImageError] = useState(false);

  const sessions = ["2023/2024", "2024/2025", "2025/2026", "2026/2027"];
  const terms = ["FIRST", "SECOND", "THIRD"];

  useEffect(() => {
    fetchStudentDetails();
  }, [id]);

  useEffect(() => {
    if (student) {
      if (activeTab === "results") {
        fetchTermResult();
      } else if (activeTab === "annual") {
        fetchAnnualResult();
      } else if (activeTab === "history") {
        fetchAllResults();
      }
    }
  }, [activeTab, selectedSession, selectedTerm, student]);

  const fetchStudentDetails = async () => {
    try {
      const response = await studentAPI.getStudentById(id);
      setStudent(response.data);
      setImageError(false); // Reset image error state when new student loads
    } catch (error) {
      console.error("Error fetching student details:", error);
      toast.error("Failed to load student details");
    } finally {
      setLoading(false);
    }
  };

  const fetchTermResult = async () => {
    try {
      const response = await resultAPI.getTermResult(
        id,
        selectedSession,
        selectedTerm,
      );
      setTermResults(response.data);
    } catch (error) {
      console.error("Error fetching term result:", error);
      setTermResults(null);
    }
  };

  const fetchAnnualResult = async () => {
    try {
      const response = await resultAPI.getAnnualResult(id, selectedSession);
      setAnnualResult(response.data);
    } catch (error) {
      console.error("Error fetching annual result:", error);
      setAnnualResult(null);
    }
  };

  const fetchAllResults = async () => {
    const history = {};
    try {
      for (const sess of sessions) {
        history[sess] = {};
        for (const t of terms) {
          try {
            const response = await resultAPI.getTermResult(id, sess, t);
            history[sess][t] = response.data;
          } catch (error) {
            history[sess][t] = null;
          }
        }
      }
      setResultHistory(history);
    } catch (error) {
      console.error("Error fetching result history:", error);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${student.fullName}? This action cannot be undone.`,
      )
    ) {
      try {
        await studentAPI.deleteStudent(id);
        toast.success("Student deleted successfully");
        navigate("/students");
      } catch (error) {
        console.error("Error deleting student:", error);
        toast.error("Failed to delete student");
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: { class: "bg-success", icon: <FaCheckCircle /> },
      GRADUATED: { class: "bg-primary", icon: <FaAward /> },
      TRANSFERRED: { class: "bg-info", icon: <FaHistory /> },
      SUSPENDED: { class: "bg-warning", icon: <FaExclamationTriangle /> },
      WITHDRAWN: { class: "bg-danger", icon: <FaTimesCircle /> },
    };
    const badge = badges[status] || { class: "bg-secondary", icon: null };
    return (
      <span className={`badge ${badge.class} p-2`}>
        {badge.icon} {status}
      </span>
    );
  };

  const calculateAge = (dateOfBirth) => {
    return moment().diff(dateOfBirth, "years");
  };

  const viewResultSheet = () => {
    navigate(`/results/${id}/${selectedSession}/${selectedTerm}`);
  };

  const getGradeBadge = (grade) => {
    const colors = {
      A: "bg-success",
      B: "bg-primary",
      C: "bg-info",
      D: "bg-warning",
      E: "bg-secondary",
      F: "bg-danger",
    };
    return colors[grade] || "bg-secondary";
  };

  const testImage = () => {
    console.log("Profile picture URL:", student?.profilePictureUrl);
    if (student?.profilePictureUrl) {
      const img = new Image();
      img.onload = () => {
        console.log("Image loads successfully");
        toast.success("Image loads successfully!");
      };
      img.onerror = () => {
        console.error("Image fails to load");
        toast.error("Image fails to load");
      };
      img.src = student.profilePictureUrl.startsWith("http")
        ? student.profilePictureUrl
        : `http://localhost:8080${student.profilePictureUrl}`;
    } else {
      console.log("No profile picture URL");
      toast.info("No profile picture available");
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner-border spinner-border-nigerian" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!student) {
    return <div className="alert alert-danger">Student not found</div>;
  }

  const getImageUrl = () => {
    if (!student.profilePictureUrl) return null;

    // Extract just the filename from the URL
    const filename = student.profilePictureUrl.split("/").pop();

    // Construct the full URL
    return `http://localhost:8080/uploads/profile-pictures/${filename}`;
  };

  const imageUrl = getImageUrl();

  return (
    <div className="student-details">
      {/* Header with Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <h2 className="mb-0">Student Profile</h2>
        <div>
          <Link to="/students" className="btn btn-secondary me-2">
            <FaArrowLeft className="me-2" /> Back
          </Link>
          <Link to={`/students/edit/${id}`} className="btn btn-warning me-2">
            <FaEdit className="me-2" /> Edit
          </Link>
          <button className="btn btn-info me-2" onClick={testImage}>
            Test Image
          </button>
          <button onClick={handleDelete} className="btn btn-danger me-2">
            <FaTrash className="me-2" /> Delete
          </button>
          <button onClick={handlePrint} className="btn btn-info">
            <FaPrint className="me-2" /> Print
          </button>
        </div>
      </div>

      {/* Profile Header with Photo - UPDATED STYLING */}
      <div className="card mb-4 profile-header-card">
        <div className="card-body">
          <div className="row">
            {/* Profile Photo - Enhanced Styling */}
            <div className="col-md-3 text-center mb-3">
              <div className="profile-image-container">
                <div className="position-relative d-inline-block">
                  {imageUrl && !imageError ? (
                    <img
                      src={imageUrl}
                      alt={student.fullName}
                      className="profile-image"
                      onError={(e) => {
                        console.error("Image failed to load:", imageUrl);
                        setImageError(true);
                        e.target.onerror = null;
                      }}
                    />
                  ) : (
                    <div className="profile-image-placeholder">
                      <FaUserCircle className="profile-placeholder-icon" />
                    </div>
                  )}
                  <Link
                    to={`/students/edit/${id}`}
                    className="btn btn-primary btn-sm profile-image-edit-btn"
                    title={
                      student.profilePictureUrl ? "Change Photo" : "Add Photo"
                    }
                  >
                    <FaCamera />
                  </Link>
                </div>
                <h4 className="mt-3 mb-2">{student.fullName}</h4>
                <div className="mb-2">{getStatusBadge(student.status)}</div>
                <div className="student-id-badge">
                  <small className="text-muted">
                    ID: {student.admissionNumber}
                  </small>
                </div>
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="col-md-9">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="quick-info-card">
                    <FaIdCard className="quick-info-icon text-primary" />
                    <h6>Admission Number</h6>
                    <p className="fw-bold">{student.admissionNumber}</p>
                    <small>
                      Admitted:{" "}
                      {moment(student.admissionDate).format("DD/MM/YYYY")}
                    </small>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="quick-info-card">
                    <FaSchool className="quick-info-icon text-success" />
                    <h6>Current Class</h6>
                    <p className="fw-bold">
                      {student.studentClass} {student.classArm}
                    </p>
                    {student.excludeFromPromotion && (
                      <small className="text-danger">
                        Excluded from promotion
                      </small>
                    )}
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="quick-info-card">
                    <FaBirthdayCake className="quick-info-icon text-warning" />
                    <h6>Age</h6>
                    <p className="fw-bold">
                      {calculateAge(student.dateOfBirth)} years
                    </p>
                    <small>
                      DOB: {moment(student.dateOfBirth).format("DD/MM/YYYY")}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            <FaUserGraduate className="me-2" /> Personal Info
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "results" ? "active" : ""}`}
            onClick={() => setActiveTab("results")}
          >
            <FaChartBar className="me-2" /> Term Results
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "annual" ? "active" : ""}`}
            onClick={() => setActiveTab("annual")}
          >
            <FaAward className="me-2" /> Annual Result
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <FaHistory className="me-2" /> Result History
          </button>
        </li>
      </ul>

      {/* Tab Content - Keep all your existing tab content here */}
      <div className="tab-content">
        {/* Personal Information Tab */}
        {activeTab === "info" && (
          <div className="row">
            {/* ... your existing personal info content ... */}
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">Personal Details</h5>
                </div>
                <div className="card-body">
                  <table className="table">
                    <tbody>
                      <tr>
                        <th style={{ width: "200px" }}>Full Name:</th>
                        <td className="fw-bold">{student.fullName}</td>
                      </tr>
                      <tr>
                        <th>Gender:</th>
                        <td>
                          <FaVenusMars className="me-2" /> {student.gender}
                        </td>
                      </tr>
                      <tr>
                        <th>Date of Birth:</th>
                        <td>
                          <FaCalendarAlt className="me-2" />{" "}
                          {moment(student.dateOfBirth).format("DD/MM/YYYY")}
                        </td>
                      </tr>
                      <tr>
                        <th>Age:</th>
                        <td>{calculateAge(student.dateOfBirth)} years</td>
                      </tr>
                      <tr>
                        <th>Religion:</th>
                        <td>{student.religion || "Not specified"}</td>
                      </tr>
                      <tr>
                        <th>Nationality:</th>
                        <td>{student.nationality || "Nigerian"}</td>
                      </tr>
                      <tr>
                        <th>State of Origin:</th>
                        <td>{student.stateOfOrigin}</td>
                      </tr>
                      <tr>
                        <th>LGA:</th>
                        <td>{student.localGovtArea}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">Contact Information</h5>
                </div>
                <div className="card-body">
                  <table className="table">
                    <tbody>
                      <tr>
                        <th style={{ width: "200px" }}>Address:</th>
                        <td>
                          <FaMapMarkerAlt className="me-2" /> {student.address}
                        </td>
                      </tr>
                      <tr>
                        <th>Parent/Guardian:</th>
                        <td>
                          <FaUsers className="me-2" /> {student.parentName}
                        </td>
                      </tr>
                      <tr>
                        <th>Parent Phone:</th>
                        <td>
                          <FaPhone className="me-2" /> {student.parentPhone}
                        </td>
                      </tr>
                      <tr>
                        <th>Parent Email:</th>
                        <td>
                          <FaEnvelope className="me-2" />{" "}
                          {student.parentEmail || "Not provided"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card mt-4">
                <div className="card-header bg-warning">
                  <h5 className="mb-0">Emergency Contact</h5>
                </div>
                <div className="card-body">
                  <table className="table">
                    <tbody>
                      <tr>
                        <th style={{ width: "200px" }}>Name:</th>
                        <td>
                          {student.emergencyContactName || "Not specified"}
                        </td>
                      </tr>
                      <tr>
                        <th>Phone:</th>
                        <td>
                          {student.emergencyContactPhone || "Not specified"}
                        </td>
                      </tr>
                      <tr>
                        <th>Relationship:</th>
                        <td>
                          {student.emergencyContactRelationship ||
                            "Not specified"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="card">
                <div className="card-header bg-info text-white">
                  <h5 className="mb-0">Admission Details</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-3">
                      <div className="border p-3 rounded text-center">
                        <h6>Admission Date</h6>
                        <p className="fw-bold">
                          {moment(student.admissionDate).format("DD/MM/YYYY")}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="border p-3 rounded text-center">
                        <h6>Previous School</h6>
                        <p className="fw-bold">
                          {student.previousSchool || "None"}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="border p-3 rounded text-center">
                        <h6>Exclude from Promotion</h6>
                        <p className="fw-bold">
                          {student.excludeFromPromotion ? (
                            <span className="text-danger">Yes</span>
                          ) : (
                            <span className="text-success">No</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {student.promotionHoldReason && (
                      <div className="col-md-3">
                        <div className="border p-3 rounded text-center">
                          <h6>Hold Reason</h6>
                          <p className="fw-bold text-warning">
                            {student.promotionHoldReason}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Term Results Tab */}
        {activeTab === "results" && (
          <div className="card">
            <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Term Results</h5>
              <div>
                <select
                  className="form-select form-select-sm d-inline-block me-2 bg-dark text-white"
                  style={{ width: "150px" }}
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                >
                  {sessions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  className="form-select form-select-sm d-inline-block me-2 bg-dark text-white"
                  style={{ width: "120px" }}
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                >
                  {terms.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {termResults && (
                  <>
                    <button
                      className="btn btn-light btn-sm"
                      onClick={viewResultSheet}
                    >
                      <FaEye className="me-1" /> View Full Sheet
                    </button>
                    {/* Add attendance summary below the table */}
                    <div className="row mt-4">
                      <div className="col-md-4">
                        <div className="border p-3 rounded bg-light">
                          <h6>Attendance</h6>
                          <p>
                            <strong>Present:</strong>{" "}
                            {termResults.summary?.daysPresent || 0} days
                          </p>
                          <p>
                            <strong>Absent:</strong>{" "}
                            {termResults.summary?.daysAbsent || 0} days
                          </p>
                          <p>
                            <strong>Rate:</strong>{" "}
                            {termResults.summary?.attendancePercentage?.toFixed(
                              1,
                            )}
                            %
                          </p>
                        </div>
                      </div>
                      <div className="col-md-8">
                        <div className="border p-3 rounded bg-light">
                          <h6>Attendance Performance</h6>
                          <div className="progress" style={{ height: "20px" }}>
                            <div
                              className={`progress-bar ${
                                (termResults.summary?.attendancePercentage ||
                                  0) >= 90
                                  ? "bg-success"
                                  : (termResults.summary
                                        ?.attendancePercentage || 0) >= 75
                                    ? "bg-primary"
                                    : (termResults.summary
                                          ?.attendancePercentage || 0) >= 60
                                      ? "bg-warning"
                                      : "bg-danger"
                              }`}
                              style={{
                                width: `${termResults.summary?.attendancePercentage || 0}%`,
                              }}
                            >
                              {termResults.summary?.attendancePercentage?.toFixed(
                                1,
                              )}
                              %
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="card-body">
              {termResults ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <thead className="bg-light">
                        <tr>
                          <th>Subject</th>
                          <th>RT (5)</th>
                          <th>Ass (10)</th>
                          <th>Proj (10)</th>
                          <th>MT (10)</th>
                          <th>2nd (5)</th>
                          <th>CA (40)</th>
                          <th>Exam (60)</th>
                          <th>Total</th>
                          <th>Grade</th>
                          <th>Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {termResults.subjects?.map((subject, index) => (
                          <tr key={index}>
                            <td className="fw-bold">{subject.subject}</td>
                            <td>{subject.resumptionTest}</td>
                            <td>{subject.assignments}</td>
                            <td>{subject.project}</td>
                            <td>{subject.midtermTest}</td>
                            <td>{subject.secondTest}</td>
                            <td className="fw-bold">
                              {subject.continuousAssessment}
                            </td>
                            <td>{subject.examination}</td>
                            <td className="fw-bold">{subject.total}</td>
                            <td>
                              <span
                                className={`badge ${getGradeBadge(subject.grade)}`}
                              >
                                {subject.grade}
                              </span>
                            </td>
                            <td>{subject.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="row mt-4">
                    <div className="col-md-4">
                      <div className="border p-3 rounded bg-light">
                        <h6>Total Score</h6>
                        <h3 className="text-primary">
                          {termResults.summary?.totalScore}
                        </h3>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="border p-3 rounded bg-light">
                        <h6>Average</h6>
                        <h3 className="text-success">
                          {termResults.summary?.average?.toFixed(2)}%
                        </h3>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="border p-3 rounded bg-light">
                        <h6>Class Position</h6>
                        <h3 className="text-warning">
                          {termResults.summary?.positionInClass}
                        </h3>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted">No results found for this term</p>
                  <Link to="/results" className="btn btn-nigerian">
                    Enter Results
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Annual Result Tab */}
        {activeTab === "annual" && (
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Annual Result</h5>
              <select
                className="form-select form-select-sm bg-dark text-white"
                style={{ width: "150px" }}
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
            <div className="card-body">
              {annualResult ? (
                <>
                  <div className="row mb-4">
                    <div className="col-md-4">
                      <div className="border p-3 rounded text-center">
                        <h6>First Term</h6>
                        <h3 className="text-primary">
                          {annualResult.termResults?.firstTerm?.total || 0}
                        </h3>
                        <p>
                          Avg:{" "}
                          {annualResult.termResults?.firstTerm?.average?.toFixed(
                            2,
                          )}
                          %
                        </p>
                        <p>
                          Pos: {annualResult.termResults?.firstTerm?.position}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="border p-3 rounded text-center">
                        <h6>Second Term</h6>
                        <h3 className="text-success">
                          {annualResult.termResults?.secondTerm?.total || 0}
                        </h3>
                        <p>
                          Avg:{" "}
                          {annualResult.termResults?.secondTerm?.average?.toFixed(
                            2,
                          )}
                          %
                        </p>
                        <p>
                          Pos: {annualResult.termResults?.secondTerm?.position}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="border p-3 rounded text-center">
                        <h6>Third Term</h6>
                        <h3 className="text-warning">
                          {annualResult.termResults?.thirdTerm?.total || 0}
                        </h3>
                        <p>
                          Avg:{" "}
                          {annualResult.termResults?.thirdTerm?.average?.toFixed(
                            2,
                          )}
                          %
                        </p>
                        <p>
                          Pos: {annualResult.termResults?.thirdTerm?.position}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="border p-4 rounded bg-light">
                        <h5>Annual Summary</h5>
                        <table className="table">
                          <tbody>
                            <tr>
                              <th>First Term Total:</th>
                              <td>
                                {annualResult.annualSummary?.firstTermTotal}
                              </td>
                            </tr>
                            <tr>
                              <th>Second Term Total:</th>
                              <td>
                                {annualResult.annualSummary?.secondTermTotal}
                              </td>
                            </tr>
                            <tr>
                              <th>Third Term Total:</th>
                              <td>
                                {annualResult.annualSummary?.thirdTermTotal}
                              </td>
                            </tr>
                            <tr>
                              <th>Annual Total:</th>
                              <td className="fw-bold">
                                {annualResult.annualSummary?.annualTotal}
                              </td>
                            </tr>
                            <tr>
                              <th>Annual Average:</th>
                              <td className="fw-bold text-success">
                                {annualResult.annualSummary?.annualAverage?.toFixed(
                                  2,
                                )}
                                %
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="border p-4 rounded bg-light">
                        <h5>Annual Positions</h5>
                        <table className="table">
                          <tbody>
                            <tr>
                              <th>Position in Class:</th>
                              <td className="fw-bold">
                                {annualResult.annualSummary?.positionInClass}
                              </td>
                            </tr>
                            <tr>
                              <th>Position in Arm:</th>
                              <td className="fw-bold">
                                {annualResult.annualSummary?.positionInArm}
                              </td>
                            </tr>
                            <tr>
                              <th>Position in School:</th>
                              <td className="fw-bold">
                                {annualResult.annualSummary?.positionInSchool}
                              </td>
                            </tr>
                            <tr>
                              <th>Promotion Status:</th>
                              <td>
                                {annualResult.annualSummary?.promoted ? (
                                  <span className="badge bg-success">
                                    Promoted
                                  </span>
                                ) : (
                                  <span className="badge bg-danger">
                                    Not Promoted
                                  </span>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted">
                    No annual result found for this session
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Result History Tab */}
        {activeTab === "history" && (
          <div className="card">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">Result History</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead className="bg-light">
                    <tr>
                      <th>Session</th>
                      <th>First Term</th>
                      <th>Second Term</th>
                      <th>Third Term</th>
                      <th>Annual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((sess) => {
                      const firstTerm = resultHistory[sess]?.FIRST;
                      const secondTerm = resultHistory[sess]?.SECOND;
                      const thirdTerm = resultHistory[sess]?.THIRD;
                      const hasFirst = firstTerm?.subjects?.length > 0;
                      const hasSecond = secondTerm?.subjects?.length > 0;
                      const hasThird = thirdTerm?.subjects?.length > 0;

                      return (
                        <tr key={sess}>
                          <td className="fw-bold">{sess}</td>
                          <td>
                            {hasFirst ? (
                              <span className="badge bg-success">
                                Completed
                              </span>
                            ) : (
                              <span className="badge bg-secondary">
                                Not Available
                              </span>
                            )}
                          </td>
                          <td>
                            {hasSecond ? (
                              <span className="badge bg-success">
                                Completed
                              </span>
                            ) : (
                              <span className="badge bg-secondary">
                                Not Available
                              </span>
                            )}
                          </td>
                          <td>
                            {hasThird ? (
                              <span className="badge bg-success">
                                Completed
                              </span>
                            ) : (
                              <span className="badge bg-secondary">
                                Not Available
                              </span>
                            )}
                          </td>
                          <td>
                            {hasFirst && hasSecond && hasThird ? (
                              <span className="badge bg-primary">
                                Annual Available
                              </span>
                            ) : (
                              <span className="badge bg-secondary">
                                Incomplete
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>
        {`
        @media print {
          .no-print {
            display: none !important;
          }
          .card {
            border: 1px solid #000 !important;
            box-shadow: none !important;
          }
          .bg-primary {
            background-color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bg-success {
            background-color: #008753 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .profile-image {
            border: 2px solid #000 !important;
          }
        }
        `}
      </style>
    </div>
  );
}

export default StudentDetails;

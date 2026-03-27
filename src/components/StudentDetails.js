import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { studentAPI, resultAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
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
  FaHistory,
  FaAward,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaCamera,
  FaEye,
  FaSpinner,
  FaSyncAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import moment from "moment";
import useActiveSession from "../hooks/useActiveSession";
import "./StudentDetails.css";

function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const isAdmin = user?.role === "ADMIN";
  const isTeacher = user?.role === "TEACHER";

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [termResults, setTermResults] = useState(null);
  const [annualResult, setAnnualResult] = useState(null);
  const [resultHistory, setResultHistory] = useState({});
  const [imageError, setImageError] = useState(false);

  const backPath =
    location.state?.from || (isTeacher ? "/teacher-dashboard" : "/students");

  const {
    session,
    setSession,
    term,
    setTerm,
    loadingSession,
    availableSessions,
    refreshActiveSession,
  } = useActiveSession("FIRST");

  const terms = ["FIRST", "SECOND", "THIRD"];

  const apiBase =
    process.env.REACT_APP_API_BASE_URL?.replace("/api", "") ||
    "https://localhost:8443";

  useEffect(() => {
    fetchStudentDetails();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!student || !session) return;

    if (activeTab === "results") {
      fetchTermResult();
    } else if (activeTab === "annual") {
      fetchAnnualResult();
    } else if (activeTab === "history") {
      fetchAllResults();
    }
  }, [activeTab, session, term, student]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStudentDetails = async () => {
    try {
      const response = await studentAPI.getStudentById(id);
      setStudent(response.data);
      setImageError(false);
    } catch (error) {
      console.error("Error fetching student details:", error);
      toast.error(
        t?.studentDetails?.loadFailed || "Failed to load student details",
      );
      navigate(backPath);
    } finally {
      setLoading(false);
    }
  };

  const fetchTermResult = async () => {
    try {
      const response = await resultAPI.getTermResult(id, session, term);
      setTermResults(response.data);
    } catch (error) {
      console.error("Error fetching term result:", error);
      setTermResults(null);
    }
  };

  const fetchAnnualResult = async () => {
    try {
      const response = await resultAPI.getAnnualResult(id, session);
      setAnnualResult(response.data);
    } catch (error) {
      console.error("Error fetching annual result:", error);
      setAnnualResult(null);
    }
  };

  const fetchAllResults = async () => {
    const history = {};
    const sessionsToCheck = availableSessions
      .map((s) => s.session)
      .filter(Boolean);

    for (const sess of sessionsToCheck) {
      history[sess] = {};

      for (const currentTerm of terms) {
        try {
          const response = await resultAPI.getTermResult(id, sess, currentTerm);
          history[sess][currentTerm] = response.data;
        } catch {
          history[sess][currentTerm] = null;
        }
      }
    }

    setResultHistory(history);
  };

  const handleDelete = async () => {
    if (!isAdmin) return;

    if (
      window.confirm(
        t?.studentDetails?.confirmDelete ||
          `Are you sure you want to delete ${
            studentDisplayName
          }? This action cannot be undone.`,
      )
    ) {
      try {
        await studentAPI.deleteStudent(id);
        toast.success(
          t?.studentDetails?.deleteSuccess || "Student deleted successfully",
        );
        navigate(backPath);
      } catch (error) {
        console.error("Error deleting student:", error);
        toast.error(
          t?.studentDetails?.deleteFailed || "Failed to delete student",
        );
      }
    }
  };

  const handlePrint = () => window.print();

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "-";
    const years = moment().diff(dateOfBirth, "years");
    return Number.isFinite(years) ? years : "-";
  };

  const renderValue = useCallback(
    (value, fallback = null) => {
      const fallbackValue =
        fallback || t?.common?.notSpecified || "Not specified";

      if (value === null || value === undefined) return fallbackValue;
      if (typeof value === "string" && !value.trim()) return fallbackValue;
      return value;
    },
    [t],
  );

  const studentDisplayName = useMemo(() => {
    if (!student) return "";
    return (
      student.fullName ||
      [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim() ||
      t?.studentDetails?.unknownStudent ||
      "Unknown Student"
    );
  }, [student, t]);

  const studentClassDisplay = useMemo(() => {
    if (!student) return "-";

    const className =
      student.studentClass ||
      student.className ||
      student.schoolClass?.className ||
      student.schoolClassName ||
      "";

    const arm =
      student.classArm ||
      student.arm ||
      student.schoolClass?.arm ||
      student.schoolClassArm ||
      "";

    return [className, arm].filter(Boolean).join(" ") || "-";
  }, [student]);

  const admissionNumber = useMemo(() => {
    if (!student) return "-";
    return (
      student.admissionNumber ||
      student.studentId ||
      student.registrationNumber ||
      "-"
    );
  }, [student]);

  const admissionDateDisplay = useMemo(() => {
    if (!student) return "-";

    const raw =
      student.admissionDate ||
      student.createdAt ||
      student.dateAdmitted ||
      student.registrationDate;

    return raw ? moment(raw).format("DD/MM/YYYY") : "-";
  }, [student]);

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: {
        class: "bg-success",
        icon: <FaCheckCircle />,
        label: t?.studentDetails?.statusActive || "Active",
      },
      GRADUATED: {
        class: "bg-primary",
        icon: <FaAward />,
        label: t?.studentDetails?.statusGraduated || "Graduated",
      },
      TRANSFERRED: {
        class: "bg-info",
        icon: <FaHistory />,
        label: t?.studentDetails?.statusTransferred || "Transferred",
      },
      SUSPENDED: {
        class: "bg-warning",
        icon: <FaExclamationTriangle />,
        label: t?.studentDetails?.statusSuspended || "Suspended",
      },
      WITHDRAWN: {
        class: "bg-danger",
        icon: <FaTimesCircle />,
        label: t?.studentDetails?.statusWithdrawn || "Withdrawn",
      },
    };

    const badge = badges[status] || {
      class: "bg-secondary",
      icon: null,
      label: renderValue(status, "Unknown"),
    };

    return (
      <span className={`badge ${badge.class} p-2`}>
        {badge.icon} {badge.label}
      </span>
    );
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

  const getImageUrl = () => {
    if (!student?.profilePictureUrl) return null;

    const raw = String(student.profilePictureUrl).trim();
    if (!raw) return null;

    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      return raw;
    }

    if (raw.startsWith("/uploads/")) {
      return `${apiBase}${raw}`;
    }

    const filename = raw.split("/").pop();
    return `${apiBase}/uploads/${filename}`;
  };

  const safeFixed = (value, digits = 2) => {
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(digits) : "0.00";
  };

  const numberValue = useCallback((...values) => {
    for (const value of values) {
      const num = Number(value);
      if (Number.isFinite(num)) return num;
    }
    return 0;
  }, []);

  const annualSummaryResolved = useMemo(() => {
    if (!annualResult) return null;

    const summary =
      annualResult.annualSummary ||
      annualResult.summary ||
      annualResult.resultSummary ||
      annualResult;

    const termResultsMap =
      annualResult.termResults ||
      annualResult.terms ||
      annualResult.termSummaries ||
      {};

    const firstTermTotal = numberValue(
      summary?.firstTermTotal,
      summary?.firstTermScore,
      summary?.first,
      termResultsMap?.FIRST?.totalScore,
      termResultsMap?.FIRST?.total,
      annualResult?.firstTermTotal,
    );

    const secondTermTotal = numberValue(
      summary?.secondTermTotal,
      summary?.secondTermScore,
      summary?.second,
      termResultsMap?.SECOND?.totalScore,
      termResultsMap?.SECOND?.total,
      annualResult?.secondTermTotal,
    );

    const thirdTermTotal = numberValue(
      summary?.thirdTermTotal,
      summary?.thirdTermScore,
      summary?.third,
      termResultsMap?.THIRD?.totalScore,
      termResultsMap?.THIRD?.total,
      annualResult?.thirdTermTotal,
    );

    const computedAnnualTotal =
      firstTermTotal + secondTermTotal + thirdTermTotal;

    const annualTotal = numberValue(
      summary?.annualTotal,
      summary?.totalScore,
      summary?.grandTotal,
      annualResult?.annualTotal,
      annualResult?.totalScore,
      computedAnnualTotal,
    );

    const annualAverage = numberValue(
      summary?.annualAverage,
      summary?.average,
      summary?.avg,
      annualResult?.annualAverage,
      annualResult?.average,
      annualTotal > 0 ? annualTotal / 3 : 0,
    );

    const position =
      summary?.positionInClass ||
      summary?.classPosition ||
      annualResult?.positionInClass ||
      annualResult?.classPosition ||
      "N/A";

    const grade = summary?.grade || annualResult?.grade || "N/A";

    const remark =
      summary?.remark ||
      summary?.remarks ||
      annualResult?.remark ||
      annualResult?.remarks ||
      "-";

    return {
      firstTermTotal,
      secondTermTotal,
      thirdTermTotal,
      annualTotal,
      annualAverage,
      position,
      grade,
      remark,
    };
  }, [annualResult, numberValue]);

  const annualSubjects = useMemo(() => {
    if (!annualResult) return [];

    const directSubjects =
      annualResult.subjects ||
      annualResult.annualSubjects ||
      annualResult.subjectResults ||
      annualResult.results;

    if (Array.isArray(directSubjects) && directSubjects.length > 0) {
      return directSubjects.map((item) => ({
        subject: item.subject || item.subjectName || item.name || "-",
        firstTerm: numberValue(item.firstTerm, item.firstTermScore, item.term1),
        secondTerm: numberValue(
          item.secondTerm,
          item.secondTermScore,
          item.term2,
        ),
        thirdTerm: numberValue(item.thirdTerm, item.thirdTermScore, item.term3),
        total: numberValue(item.total, item.annualTotal, item.totalScore),
        average: numberValue(item.average, item.avg),
        grade: item.grade || "-",
        remark: item.remark || item.remarks || "-",
      }));
    }

    const termResultsMap =
      annualResult.termResults ||
      annualResult.terms ||
      annualResult.termSummaries;

    if (!termResultsMap) return [];

    const aggregate = {};

    const addTermSubjects = (termKey, targetField) => {
      const subjects = termResultsMap?.[termKey]?.subjects;
      if (!Array.isArray(subjects)) return;

      subjects.forEach((subject) => {
        const subjectName =
          subject.subject || subject.subjectName || subject.name || "-";

        if (!aggregate[subjectName]) {
          aggregate[subjectName] = {
            subject: subjectName,
            firstTerm: 0,
            secondTerm: 0,
            thirdTerm: 0,
            total: 0,
            average: 0,
            grade: "-",
            remark: "-",
          };
        }

        aggregate[subjectName][targetField] = numberValue(
          subject.total,
          subject.totalScore,
        );
      });
    };

    addTermSubjects("FIRST", "firstTerm");
    addTermSubjects("SECOND", "secondTerm");
    addTermSubjects("THIRD", "thirdTerm");

    return Object.values(aggregate).map((item) => {
      const total = item.firstTerm + item.secondTerm + item.thirdTerm;
      const average = total > 0 ? total / 3 : 0;

      return {
        ...item,
        total,
        average,
      };
    });
  }, [annualResult, numberValue]);

  const viewResultSheet = () => {
    if (!student || !session || !term) {
      toast.error(
        t?.studentDetails?.missingParams ||
          "Student, session, or term not available",
      );
      return;
    }

    navigate(
      `/results/${student.id}?session=${encodeURIComponent(
        session,
      )}&term=${encodeURIComponent(term)}`,
    );
  };

  if (loading || loadingSession) {
    return (
      <div className={`spinner-container ${darkMode ? "dark-mode" : ""}`}>
        <div className="spinner-border spinner-border-nigerian" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3 text-center">
          <FaSpinner className="spin me-2" />
          {t?.common?.loading || "Loading student details..."}
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="alert alert-danger">
        {t?.studentDetails?.notFound || "Student not found"}
      </div>
    );
  }

  const imageUrl = getImageUrl();

  return (
    <div className={`student-details ${darkMode ? "dark-mode" : ""}`}>
      <div className="d-flex justify-content-between align-items-center mb-4 no-print flex-wrap gap-2">
        <h2 className="mb-0">
          {t?.studentDetails?.profile || "Student Profile"}
        </h2>
        <div>
          <Link to={backPath} className="btn btn-secondary me-2">
            <FaArrowLeft className="me-2" /> {t?.common?.back || "Back"}
          </Link>

          {isAdmin && (
            <>
              <Link
                to={`/students/edit/${id}`}
                state={{ from: backPath }}
                className="btn btn-warning me-2"
              >
                <FaEdit className="me-2" /> {t?.common?.edit || "Edit"}
              </Link>

              <button onClick={handleDelete} className="btn btn-danger me-2">
                <FaTrash className="me-2" /> {t?.common?.delete || "Delete"}
              </button>
            </>
          )}

          {isTeacher && (
            <span className="btn btn-info me-2 disabled">
              <FaEye className="me-2" />{" "}
              {t?.studentDetails?.viewOnly || "View Only"}
            </span>
          )}

          <button onClick={handlePrint} className="btn btn-info me-2">
            <FaPrint className="me-2" /> {t?.common?.print || "Print"}
          </button>

          <button
            onClick={refreshActiveSession}
            className="btn btn-outline-primary"
          >
            <FaSyncAlt className="me-2" />{" "}
            {t?.common?.refresh || "Refresh Session"}
          </button>
        </div>
      </div>

      <div className="card mb-4 profile-header-card">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3 text-center mb-3">
              <div className="profile-image-container">
                <div className="position-relative d-inline-block">
                  {imageUrl && !imageError ? (
                    <img
                      src={imageUrl}
                      alt={studentDisplayName}
                      className="profile-image"
                      onError={(e) => {
                        setImageError(true);
                        e.target.onerror = null;
                      }}
                    />
                  ) : (
                    <div className="profile-image-placeholder">
                      <FaUserCircle className="profile-placeholder-icon" />
                    </div>
                  )}

                  {isAdmin && (
                    <Link
                      to={`/students/edit/${id}`}
                      state={{ from: backPath }}
                      className="btn btn-primary btn-sm profile-image-edit-btn"
                      title={
                        student.profilePictureUrl
                          ? t?.studentDetails?.changePhoto || "Change Photo"
                          : t?.studentDetails?.addPhoto || "Add Photo"
                      }
                    >
                      <FaCamera />
                    </Link>
                  )}
                </div>

                <h4 className="mt-3 mb-2">{studentDisplayName}</h4>
                <div className="mb-2">{getStatusBadge(student.status)}</div>
                <div className="student-id-badge">
                  <small className="text-muted">
                    {t?.studentDetails?.id || "ID"}: {admissionNumber}
                  </small>
                </div>
              </div>
            </div>

            <div className="col-md-9">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="quick-info-card">
                    <FaIdCard className="quick-info-icon text-primary" />
                    <h6>
                      {t?.studentDetails?.admissionNumber || "Admission Number"}
                    </h6>
                    <p className="fw-bold">{admissionNumber}</p>
                    <small>
                      {t?.studentDetails?.admitted || "Admitted"}:{" "}
                      {admissionDateDisplay}
                    </small>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="quick-info-card">
                    <FaSchool className="quick-info-icon text-success" />
                    <h6>
                      {t?.studentDetails?.currentClass || "Current Class"}
                    </h6>
                    <p className="fw-bold">{studentClassDisplay}</p>
                    {student.excludeFromPromotion && (
                      <small className="text-danger">
                        {t?.studentDetails?.excludedFromPromotion ||
                          "Excluded from promotion"}
                      </small>
                    )}
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="quick-info-card">
                    <FaBirthdayCake className="quick-info-icon text-warning" />
                    <h6>{t?.studentDetails?.age || "Age"}</h6>
                    <p className="fw-bold">
                      {calculateAge(student.dateOfBirth)}{" "}
                      {t?.studentDetails?.years || "years"}
                    </p>
                    <small>
                      {t?.studentDetails?.dob || "DOB"}:{" "}
                      {student.dateOfBirth
                        ? moment(student.dateOfBirth).format("DD/MM/YYYY")
                        : "-"}
                    </small>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-muted sd-active-session">
                {t?.feeManagement?.activeSession || "Active Session"}:{" "}
                <strong>
                  {session || t?.common?.noActiveSession || "No active session"}
                </strong>{" "}
                | {t?.feeManagement?.term || "Term"}:{" "}
                <strong>{term || "N/A"}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sd-tabs-wrap">
        <ul className="nav nav-tabs mb-4 sd-tabs">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "info" ? "active" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              <FaUserGraduate className="me-2" />{" "}
              {t?.studentDetails?.personalInfo || "Personal Info"}
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "results" ? "active" : ""}`}
              onClick={() => setActiveTab("results")}
            >
              <FaChartBar className="me-2" />{" "}
              {t?.studentDetails?.termResults || "Term Results"}
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "annual" ? "active" : ""}`}
              onClick={() => setActiveTab("annual")}
            >
              <FaAward className="me-2" />{" "}
              {t?.studentDetails?.annualResult || "Annual Result"}
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              <FaHistory className="me-2" />{" "}
              {t?.studentDetails?.resultHistory || "Result History"}
            </button>
          </li>
        </ul>
      </div>

      <div className="tab-content sd-content-scroll">
        {activeTab === "info" && (
          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="card h-100 sd-card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    {t?.studentDetails?.personalDetails || "Personal Details"}
                  </h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table sd-table">
                      <tbody>
                        <tr>
                          <th style={{ width: "200px" }}>
                            {t?.studentDetails?.fullName || "Full Name"}:
                          </th>
                          <td className="fw-bold">{studentDisplayName}</td>
                        </tr>
                        <tr>
                          <th>{t?.studentDetails?.gender || "Gender"}:</th>
                          <td>
                            <FaVenusMars className="me-2" />{" "}
                            {renderValue(student.gender)}
                          </td>
                        </tr>
                        <tr>
                          <th>{t?.studentDetails?.dob || "Date of Birth"}:</th>
                          <td>
                            <FaCalendarAlt className="me-2" />{" "}
                            {student.dateOfBirth
                              ? moment(student.dateOfBirth).format("DD/MM/YYYY")
                              : renderValue(null)}
                          </td>
                        </tr>
                        <tr>
                          <th>{t?.studentDetails?.age || "Age"}:</th>
                          <td>
                            {calculateAge(student.dateOfBirth)}{" "}
                            {t?.studentDetails?.years || "years"}
                          </td>
                        </tr>
                        <tr>
                          <th>{t?.studentDetails?.religion || "Religion"}:</th>
                          <td>{renderValue(student.religion)}</td>
                        </tr>
                        <tr>
                          <th>
                            {t?.studentDetails?.nationality || "Nationality"}:
                          </th>
                          <td>
                            {renderValue(student.nationality, "Nigerian")}
                          </td>
                        </tr>
                        <tr>
                          <th>
                            {t?.studentDetails?.stateOfOrigin ||
                              "State of Origin"}
                            :
                          </th>
                          <td>{renderValue(student.stateOfOrigin)}</td>
                        </tr>
                        <tr>
                          <th>{t?.studentDetails?.lga || "LGA"}:</th>
                          <td>{renderValue(student.localGovtArea)}</td>
                        </tr>
                        <tr>
                          <th>{t?.studentDetails?.class || "Class"}:</th>
                          <td>{studentClassDisplay}</td>
                        </tr>
                        <tr>
                          <th>{t?.studentDetails?.status || "Status"}:</th>
                          <td>{renderValue(student.status)}</td>
                        </tr>
                        <tr>
                          <th>
                            {t?.studentDetails?.admissionDate ||
                              "Admission Date"}
                            :
                          </th>
                          <td>{admissionDateDisplay}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="card h-100 sd-card">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">
                    {t?.studentDetails?.contactInfo || "Contact Information"}
                  </h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table sd-table">
                      <tbody>
                        <tr>
                          <th style={{ width: "200px" }}>
                            {t?.studentDetails?.address || "Address"}:
                          </th>
                          <td>
                            <FaMapMarkerAlt className="me-2" />{" "}
                            {renderValue(student.address)}
                          </td>
                        </tr>
                        <tr>
                          <th>
                            {t?.studentDetails?.parentGuardian ||
                              "Parent/Guardian"}
                            :
                          </th>
                          <td>
                            <FaUsers className="me-2" />{" "}
                            {renderValue(student.parentName)}
                          </td>
                        </tr>
                        <tr>
                          <th>
                            {t?.studentDetails?.parentPhone || "Parent Phone"}:
                          </th>
                          <td>
                            <FaPhone className="me-2" />{" "}
                            {renderValue(student.parentPhone)}
                          </td>
                        </tr>
                        <tr>
                          <th>
                            {t?.studentDetails?.parentEmail || "Parent Email"}:
                          </th>
                          <td>
                            <FaEnvelope className="me-2" />{" "}
                            {renderValue(
                              student.parentEmail,
                              t?.common?.notProvided || "Not provided",
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>
                            {t?.studentDetails?.previousSchool ||
                              "Previous School"}
                            :
                          </th>
                          <td>{renderValue(student.previousSchool, "-")}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="card mt-4 sd-card">
                <div className="card-header bg-warning">
                  <h5 className="mb-0">
                    {t?.studentDetails?.emergencyContact || "Emergency Contact"}
                  </h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table sd-table">
                      <tbody>
                        <tr>
                          <th style={{ width: "200px" }}>
                            {t?.studentDetails?.name || "Name"}:
                          </th>
                          <td>{renderValue(student.emergencyContactName)}</td>
                        </tr>
                        <tr>
                          <th>{t?.common?.phone || "Phone"}:</th>
                          <td>{renderValue(student.emergencyContactPhone)}</td>
                        </tr>
                        <tr>
                          <th>
                            {t?.studentDetails?.relationship || "Relationship"}:
                          </th>
                          <td>
                            {renderValue(student.emergencyContactRelationship)}
                          </td>
                        </tr>
                        <tr>
                          <th>
                            {t?.studentDetails?.promotionHold ||
                              "Promotion Hold"}
                            :
                          </th>
                          <td>
                            {student.excludeFromPromotion
                              ? student.promotionHoldReason || "Yes"
                              : "No"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "results" && (
          <div className="card sd-card">
            <div className="card-header bg-success text-white d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="mb-0">
                {t?.studentDetails?.termResults || "Term Results"}
              </h5>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <select
                  className="form-select form-select-sm d-inline-block sd-select"
                  style={{ width: "150px" }}
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                >
                  {availableSessions.length > 0 ? (
                    availableSessions.map((s) => (
                      <option key={s.id || s.session} value={s.session}>
                        {s.session}
                      </option>
                    ))
                  ) : (
                    <option value="">
                      {t?.common?.noSessionAvailable || "No session available"}
                    </option>
                  )}
                </select>

                <select
                  className="form-select form-select-sm d-inline-block sd-select"
                  style={{ width: "120px" }}
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                >
                  {terms.map((termName) => (
                    <option key={termName} value={termName}>
                      {termName}
                    </option>
                  ))}
                </select>

                {termResults && (
                  <button
                    className="btn btn-light btn-sm"
                    onClick={viewResultSheet}
                  >
                    <FaEye className="me-1" />{" "}
                    {t?.studentDetails?.viewFullSheet || "View Full Sheet"}
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              {termResults ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover sd-table sd-table-bordered">
                      <thead>
                        <tr>
                          <th>{t?.studentDashboard?.subject || "Subject"}</th>
                          <th>RT (5)</th>
                          <th>Ass (10)</th>
                          <th>Proj (10)</th>
                          <th>MT (10)</th>
                          <th>2nd (5)</th>
                          <th>CA</th>
                          <th>Exam</th>
                          <th>{t?.studentDashboard?.total || "Total"}</th>
                          <th>{t?.studentDashboard?.grade || "Grade"}</th>
                          <th>Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {termResults.subjects?.map((subject, index) => (
                          <tr key={index}>
                            <td className="fw-bold">{subject.subject}</td>
                            <td>{subject.resumptionTest ?? 0}</td>
                            <td>{subject.assignments ?? 0}</td>
                            <td>{subject.project ?? 0}</td>
                            <td>{subject.midtermTest ?? 0}</td>
                            <td>{subject.secondTest ?? 0}</td>
                            <td className="fw-bold">
                              {subject.continuousAssessment ?? 0}
                            </td>
                            <td>{subject.examination ?? 0}</td>
                            <td className="fw-bold">{subject.total ?? 0}</td>
                            <td>
                              <span
                                className={`badge ${getGradeBadge(subject.grade)}`}
                              >
                                {subject.grade}
                              </span>
                            </td>
                            <td>{subject.remarks || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="row mt-4">
                    <div className="col-md-4 mb-3">
                      <div className="sd-summary-box">
                        <h6>
                          {t?.studentDetails?.totalScore || "Total Score"}
                        </h6>
                        <h3 className="text-primary">
                          {termResults.summary?.totalScore ?? 0}
                        </h3>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="sd-summary-box">
                        <h6>{t?.studentDetails?.average || "Average"}</h6>
                        <h3 className="text-success">
                          {safeFixed(termResults.summary?.average, 2)}%
                        </h3>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="sd-summary-box">
                        <h6>
                          {t?.studentDetails?.classPosition || "Class Position"}
                        </h6>
                        <h3 className="text-warning">
                          {termResults.summary?.positionInClass || "N/A"}
                        </h3>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-5 sd-empty-state">
                  <p className="text-muted">
                    {t?.studentDetails?.noResultsFound ||
                      "No results found for this term"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "annual" && (
          <div className="card sd-card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="mb-0">
                {t?.studentDetails?.annualResult || "Annual Result"}
              </h5>
              <select
                className="form-select form-select-sm sd-select"
                style={{ width: "150px" }}
                value={session}
                onChange={(e) => setSession(e.target.value)}
              >
                {availableSessions.length > 0 ? (
                  availableSessions.map((s) => (
                    <option key={s.id || s.session} value={s.session}>
                      {s.session}
                    </option>
                  ))
                ) : (
                  <option value="">
                    {t?.common?.noSessionAvailable || "No session available"}
                  </option>
                )}
              </select>
            </div>
            <div className="card-body">
              {annualResult && annualSummaryResolved ? (
                <>
                  <div className="row">
                    <div className="col-lg-6 mb-4">
                      <div className="sd-summary-box">
                        <h5>
                          {t?.studentDetails?.annualSummary || "Annual Summary"}
                        </h5>
                        <div className="table-responsive">
                          <table className="table sd-table">
                            <tbody>
                              <tr>
                                <th>
                                  {t?.studentDetails?.firstTermTotal ||
                                    "First Term Total"}
                                  :
                                </th>
                                <td>{annualSummaryResolved.firstTermTotal}</td>
                              </tr>
                              <tr>
                                <th>
                                  {t?.studentDetails?.secondTermTotal ||
                                    "Second Term Total"}
                                  :
                                </th>
                                <td>{annualSummaryResolved.secondTermTotal}</td>
                              </tr>
                              <tr>
                                <th>
                                  {t?.studentDetails?.thirdTermTotal ||
                                    "Third Term Total"}
                                  :
                                </th>
                                <td>{annualSummaryResolved.thirdTermTotal}</td>
                              </tr>
                              <tr>
                                <th>
                                  {t?.studentDetails?.annualTotal ||
                                    "Annual Total"}
                                  :
                                </th>
                                <td className="fw-bold">
                                  {annualSummaryResolved.annualTotal}
                                </td>
                              </tr>
                              <tr>
                                <th>
                                  {t?.studentDetails?.annualAverage ||
                                    "Annual Average"}
                                  :
                                </th>
                                <td className="fw-bold text-success">
                                  {safeFixed(
                                    annualSummaryResolved.annualAverage,
                                    2,
                                  )}
                                  %
                                </td>
                              </tr>
                              <tr>
                                <th>
                                  {t?.studentDetails?.classPosition ||
                                    "Class Position"}
                                  :
                                </th>
                                <td>{annualSummaryResolved.position}</td>
                              </tr>
                              <tr>
                                <th>{t?.studentDetails?.grade || "Grade"}:</th>
                                <td>{annualSummaryResolved.grade}</td>
                              </tr>
                              <tr>
                                <th>
                                  {t?.studentDetails?.remark || "Remark"}:
                                </th>
                                <td>{annualSummaryResolved.remark}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-6 mb-4">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="sd-summary-box">
                            <h6>
                              {t?.studentDetails?.firstTermTotal ||
                                "First Term Total"}
                            </h6>
                            <h3 className="text-primary">
                              {annualSummaryResolved.firstTermTotal}
                            </h3>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="sd-summary-box">
                            <h6>
                              {t?.studentDetails?.secondTermTotal ||
                                "Second Term Total"}
                            </h6>
                            <h3 className="text-info">
                              {annualSummaryResolved.secondTermTotal}
                            </h3>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="sd-summary-box">
                            <h6>
                              {t?.studentDetails?.thirdTermTotal ||
                                "Third Term Total"}
                            </h6>
                            <h3 className="text-warning">
                              {annualSummaryResolved.thirdTermTotal}
                            </h3>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="sd-summary-box">
                            <h6>
                              {t?.studentDetails?.annualAverage ||
                                "Annual Average"}
                            </h6>
                            <h3 className="text-success">
                              {safeFixed(
                                annualSummaryResolved.annualAverage,
                                2,
                              )}
                              %
                            </h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {annualSubjects.length > 0 && (
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover sd-table sd-table-bordered">
                        <thead>
                          <tr>
                            <th>{t?.studentDashboard?.subject || "Subject"}</th>
                            <th>
                              {t?.studentDetails?.firstTerm || "First Term"}
                            </th>
                            <th>
                              {t?.studentDetails?.secondTerm || "Second Term"}
                            </th>
                            <th>
                              {t?.studentDetails?.thirdTerm || "Third Term"}
                            </th>
                            <th>{t?.studentDetails?.annualTotal || "Total"}</th>
                            <th>
                              {t?.studentDetails?.annualAverage || "Average"}
                            </th>
                            <th>{t?.studentDetails?.grade || "Grade"}</th>
                            <th>{t?.studentDetails?.remark || "Remark"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {annualSubjects.map((subject, index) => (
                            <tr key={`${subject.subject}-${index}`}>
                              <td className="fw-bold">{subject.subject}</td>
                              <td>{subject.firstTerm}</td>
                              <td>{subject.secondTerm}</td>
                              <td>{subject.thirdTerm}</td>
                              <td className="fw-bold">{subject.total}</td>
                              <td>{safeFixed(subject.average, 2)}</td>
                              <td>
                                <span
                                  className={`badge ${getGradeBadge(
                                    subject.grade,
                                  )}`}
                                >
                                  {subject.grade}
                                </span>
                              </td>
                              <td>{subject.remark}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-5 sd-empty-state">
                  <p className="text-muted">
                    {t?.studentDetails?.noAnnualResult ||
                      "No annual result found for this session"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="card sd-card">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">
                {t?.studentDetails?.resultHistory || "Result History"}
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered sd-table sd-table-bordered">
                  <thead>
                    <tr>
                      <th>{t?.studentDetails?.session || "Session"}</th>
                      <th>{t?.studentDetails?.firstTerm || "First Term"}</th>
                      <th>{t?.studentDetails?.secondTerm || "Second Term"}</th>
                      <th>{t?.studentDetails?.thirdTerm || "Third Term"}</th>
                      <th>{t?.studentDetails?.annual || "Annual"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableSessions.map((sessionItem) => {
                      const sess = sessionItem.session;
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
                                {t?.studentDetails?.completed || "Completed"}
                              </span>
                            ) : (
                              <span className="badge bg-secondary">
                                {t?.studentDetails?.notAvailable ||
                                  "Not Available"}
                              </span>
                            )}
                          </td>
                          <td>
                            {hasSecond ? (
                              <span className="badge bg-success">
                                {t?.studentDetails?.completed || "Completed"}
                              </span>
                            ) : (
                              <span className="badge bg-secondary">
                                {t?.studentDetails?.notAvailable ||
                                  "Not Available"}
                              </span>
                            )}
                          </td>
                          <td>
                            {hasThird ? (
                              <span className="badge bg-success">
                                {t?.studentDetails?.completed || "Completed"}
                              </span>
                            ) : (
                              <span className="badge bg-secondary">
                                {t?.studentDetails?.notAvailable ||
                                  "Not Available"}
                              </span>
                            )}
                          </td>
                          <td>
                            {hasFirst && hasSecond && hasThird ? (
                              <span className="badge bg-primary">
                                {t?.studentDetails?.annualAvailable ||
                                  "Annual Available"}
                              </span>
                            ) : (
                              <span className="badge bg-secondary">
                                {t?.studentDetails?.incomplete || "Incomplete"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {availableSessions.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center text-muted">
                          {t?.studentDetails?.noHistoryAvailable ||
                            "No session history available"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>
        {`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media print {
          .no-print {
            display: none !important;
          }
          .card {
            border: 1px solid #000 !important;
            box-shadow: none !important;
          }
        }
        `}
      </style>
    </div>
  );
}

export default StudentDetails;

// src/components/StudentPromotion.jsx
import React, { useState, useEffect } from "react";
import { studentAPI } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { toast } from "react-toastify";
import {
  FaArrowUp,
  FaGraduationCap,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaSpinner,
  FaUserGraduate,
  FaChartBar,
  FaFilter,
  FaDownload,
  FaPrint,
  FaEye,
  FaBan,
  FaCheck,
  FaUsers,
  FaSchool,
  FaArrowRight,
  FaHome,
  FaList,
  FaChartPie,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import moment from "moment";
import "./StudentPromotion.css";

function StudentPromotion() {
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const [preview, setPreview] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [showExclusionModal, setShowExclusionModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [excludeReason, setExcludeReason] = useState("");
  const [promotionResult, setPromotionResult] = useState(null);
  const [excludedStudents, setExcludedStudents] = useState([]);
  const [expandedDetails, setExpandedDetails] = useState({});

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
    fetchPromotionPreview();
    fetchExcludedStudents();
    fetchAllStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, classFilter, students]);

  const fetchPromotionPreview = async () => {
    setLoading(true);
    try {
      const response = await studentAPI.getPromotionPreview();
      setPreview(response.data);
    } catch (error) {
      console.error("Error fetching promotion preview:", error);
      toast.error(
        t?.promotionManager?.failedPreview ||
          "Failed to load promotion preview",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchExcludedStudents = async () => {
    try {
      const response = await studentAPI.getExcludedStudents();
      setExcludedStudents(response.data);
    } catch (error) {
      console.error("Error fetching excluded students:", error);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await studentAPI.getAllStudents();
      setStudents(response.data);
      setFilteredStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.fullName?.toLowerCase().includes(term) ||
          s.admissionNumber?.toLowerCase().includes(term),
      );
    }

    if (classFilter) {
      filtered = filtered.filter((s) => s.studentClass === classFilter);
    }

    setFilteredStudents(filtered);
  };

  const handleSelectAll = () => {
    const availableStudentIds = filteredStudents
      .filter((s) => !s.excludeFromPromotion)
      .map((s) => s.id);

    if (selectedStudents.length === availableStudentIds.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(availableStudentIds);
    }
  };

  const handleSelectStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleToggleExclusion = async (student) => {
    if (!student) return;

    try {
      const response = await studentAPI.getStudentById(student.id);
      setCurrentStudent(response.data);
      setExcludeReason(response.data.promotionHoldReason || "");
      setShowExclusionModal(true);
    } catch (error) {
      console.error("Error fetching student details:", error);
      toast.error(
        t?.promotionManager?.failedExclusion ||
          "Failed to load student details",
      );
    }
  };

  const handleExcludeStudent = async () => {
    if (!currentStudent) return;

    try {
      await studentAPI.togglePromotionExclusion(
        currentStudent.id,
        !currentStudent.excludeFromPromotion,
        excludeReason,
      );
      toast.success(
        !currentStudent.excludeFromPromotion
          ? t?.promotionManager?.excludedSuccess ||
              "Student excluded from promotion"
          : t?.promotionManager?.includedSuccess ||
              "Student included in promotion",
      );

      await fetchPromotionPreview();
      await fetchExcludedStudents();
      await fetchAllStudents();

      setShowExclusionModal(false);
      setCurrentStudent(null);
      setExcludeReason("");
    } catch (error) {
      console.error("Error toggling exclusion:", error);
      toast.error(
        t?.promotionManager?.failedExclusion ||
          "Failed to update exclusion status",
      );
    }
  };

  const handlePromoteAll = async () => {
    if (
      !window.confirm(
        t?.promotionManager?.allConfirmMessage ||
          "Are you sure you want to promote ALL eligible students? This action cannot be undone.",
      )
    ) {
      return;
    }

    setProcessing(true);
    try {
      const response = await studentAPI.promoteAllStudents();
      setPromotionResult(response.data);
      toast.success(
        t?.promotionManager?.promotionCompletePrefix +
          " " +
          response.data.promoted +
          " " +
          (t?.promotionManager?.promotedLabel || "promoted"),
      );
      await fetchPromotionPreview();
      await fetchExcludedStudents();
      await fetchAllStudents();
      setActiveTab("results");
    } catch (error) {
      console.error("Error promoting all students:", error);
      toast.error(
        t?.promotionManager?.failedPromote || "Failed to promote students",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handlePromoteSelected = async () => {
    if (selectedStudents.length === 0) {
      toast.warning(t?.promotionManager?.noSelection || "No students selected");
      return;
    }

    if (
      !window.confirm(
        t?.promotionManager?.selectedConfirmPrefix +
          " " +
          selectedStudents.length +
          " " +
          (t?.promotionManager?.selectedConfirmSuffix ||
            "selected student(s)?"),
      )
    ) {
      return;
    }

    setProcessing(true);
    try {
      const response =
        await studentAPI.promoteSelectedStudents(selectedStudents);
      setPromotionResult(response.data);
      toast.success(
        t?.promotionManager?.promotionCompletePrefix +
          " " +
          response.data.promoted +
          " " +
          (t?.promotionManager?.promotedLabel || "promoted"),
      );
      await fetchPromotionPreview();
      await fetchExcludedStudents();
      await fetchAllStudents();
      setSelectedStudents([]);
      setActiveTab("results");
    } catch (error) {
      console.error("Error promoting selected students:", error);
      toast.error(
        t?.promotionManager?.failedPromote ||
          "Failed to promote selected students",
      );
    } finally {
      setProcessing(false);
    }
  };

  const toggleDetails = (studentId) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const getClassColor = (className) => {
    if (className?.includes("Primary")) return "success";
    if (className?.includes("JSS")) return "primary";
    if (className?.includes("SSS")) return "warning";
    if (className?.includes("Nursery")) return "info";
    return "secondary";
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      READY: {
        class: "bg-success",
        label: t?.promotionManager?.ready || "Ready for Promotion",
      },
      EXCLUDED: {
        class: "bg-danger",
        label: t?.promotionManager?.excludedBadge || "Excluded",
      },
      PROMOTED: {
        class: "bg-success",
        label: t?.promotionManager?.promotedLabel || "Promoted",
      },
      GRADUATED: {
        class: "bg-warning",
        label: t?.promotionManager?.graduatedLabel || "Graduated",
      },
      UNCHANGED: { class: "bg-secondary", label: "Unchanged" },
    };
    const badge = statusMap[status] || { class: "bg-secondary", label: status };
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  const readyCount =
    preview?.promotions?.filter((p) => p.status === "READY").length || 0;
  const excludedCount = preview?.excludedCount || 0;
  const totalStudents = preview?.totalStudents || 0;
  const promotionRate =
    totalStudents > 0 ? ((readyCount / totalStudents) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className={`text-center py-5 ${darkMode ? "dark-mode" : ""}`}>
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">{t?.common?.loading || "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className={`student-promotion ${darkMode ? "dark-mode" : ""}`}>
      <div className="content-header">
        <h2 className="mb-4">
          <FaArrowUp className="me-2" />{" "}
          {t?.promotionManager?.title || "Student Promotion Management"}
        </h2>
        <p className="text-muted">
          {t?.promotionManager?.title ||
            "Manage end-of-session promotion for all students"}
        </p>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "preview" ? "active" : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            <FaList className="me-2" />{" "}
            {t?.promotionManager?.studentPromotionStatus || "Preview"}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "excluded" ? "active" : ""}`}
            onClick={() => setActiveTab("excluded")}
          >
            <FaBan className="me-2" />{" "}
            {t?.promotionManager?.excluded || "Excluded"} (
            {excludedStudents.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "results" ? "active" : ""}`}
            onClick={() => setActiveTab("results")}
            disabled={!promotionResult}
          >
            <FaChartPie className="me-2" />{" "}
            {t?.promotionManager?.promotionCompletePrefix || "Results"}
          </button>
        </li>
      </ul>

      {/* Preview Tab */}
      {activeTab === "preview" && preview && (
        <>
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card bg-primary text-white h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-white-50 mb-1">
                        {t?.promotionManager?.totalActiveStudents ||
                          "Total Students"}
                      </h6>
                      <h2 className="mb-0">{totalStudents}</h2>
                    </div>
                    <FaUsers size={40} className="opacity-50" />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-success text-white h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-white-50 mb-1">
                        {t?.promotionManager?.willBePromoted ||
                          "Ready for Promotion"}
                      </h6>
                      <h2 className="mb-0">{readyCount}</h2>
                    </div>
                    <FaCheckCircle size={40} className="opacity-50" />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-warning text-dark h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-dark-50 mb-1">
                        {t?.promotionManager?.excluded || "Excluded"}
                      </h6>
                      <h2 className="mb-0">{excludedCount}</h2>
                    </div>
                    <FaBan size={40} className="opacity-50" />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-info text-white h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-white-50 mb-1">Promotion Rate</h6>
                      <h2 className="mb-0">{promotionRate}%</h2>
                    </div>
                    <FaChartBar size={40} className="opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-6 mb-3">
              <div
                className={`card h-100 ${darkMode ? "bg-dark text-white" : ""}`}
              >
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">Current Class Distribution</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table
                      className={`table ${darkMode ? "table-dark" : ""} table-sm`}
                    >
                      <thead>
                        <tr>
                          <th>Class</th>
                          <th>Students</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(preview.currentDistribution || {}).map(
                          ([className, count]) => (
                            <tr key={className}>
                              <td>
                                <span
                                  className={`badge bg-${getClassColor(className)}`}
                                >
                                  {className}
                                </span>
                              </td>
                              <td className="fw-bold">{count}</td>
                              <td style={{ width: "200px" }}>
                                <div className="progress-container">
                                  <div className="progress-label">
                                    <span>
                                      {((count / totalStudents) * 100).toFixed(
                                        1,
                                      )}
                                      %
                                    </span>
                                  </div>
                                  <div className="progress-bar-wrapper">
                                    <div
                                      className={`progress-bar-fill ${getClassColor(className)}`}
                                      style={{
                                        width: `${(count / totalStudents) * 100}%`,
                                      }}
                                    >
                                      <span className="progress-count">
                                        {count} students
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div
                className={`card h-100 ${darkMode ? "bg-dark text-white" : ""}`}
              >
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    Projected Distribution After Promotion
                  </h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table
                      className={`table ${darkMode ? "table-dark" : ""} table-sm`}
                    >
                      <thead>
                        <tr>
                          <th>Class</th>
                          <th>Students</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(
                          preview.projectedDistribution || {},
                        ).map(([className, count]) => (
                          <tr key={className}>
                            <td>
                              <span
                                className={`badge bg-${getClassColor(className)}`}
                              >
                                {className}
                              </span>
                            </td>
                            <td className="fw-bold">{count}</td>
                            <td style={{ width: "200px" }}>
                              <div className="progress-container">
                                <div className="progress-label">
                                  <span>
                                    {((count / totalStudents) * 100).toFixed(1)}
                                    %
                                  </span>
                                </div>
                                <div className="progress-bar-wrapper">
                                  <div
                                    className={`progress-bar-fill ${getClassColor(className)}`}
                                    style={{
                                      width: `${(count / totalStudents) * 100}%`,
                                    }}
                                  >
                                    <span className="progress-count">
                                      {count} students
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`card mb-4 ${darkMode ? "bg-dark text-white" : ""}`}>
            <div className="card-header bg-warning d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                {t?.promotionManager?.studentPromotionStatus ||
                  "Student Promotion List"}
              </h5>
              <div>
                <span className="badge bg-success me-2">
                  {t?.promotionManager?.ready || "Ready"}
                </span>
                <span className="badge bg-danger">
                  {t?.promotionManager?.excluded || "Excluded"}
                </span>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table
                  className={`table table-hover table-bordered ${darkMode ? "table-dark" : ""}`}
                >
                  <thead
                    className={darkMode ? "table-secondary" : "table-light"}
                  >
                    <tr>
                      <th style={{ width: "50px" }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={
                            selectedStudents.length === readyCount &&
                            readyCount > 0
                          }
                          onChange={handleSelectAll}
                          disabled={readyCount === 0}
                        />
                      </th>
                      <th>{t?.classView?.admissionNo || "Admission No."}</th>
                      <th>{t?.promotionManager?.student || "Student Name"}</th>
                      <th>
                        {t?.promotionManager?.currentClass || "Current Class"}
                      </th>
                      <th>{t?.promotionManager?.nextClass || "Next Class"}</th>
                      <th>{t?.promotionManager?.status || "Status"}</th>
                      <th>
                        {t?.promotionManager?.reasonForExclusion || "Reason"}
                      </th>
                      <th>{t?.common?.actions || "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.promotions?.map((promo) => {
                      const student = students.find(
                        (s) => s.id === promo.studentId,
                      );
                      const isExcluded = promo.status === "EXCLUDED";
                      return (
                        <tr
                          key={promo.studentId}
                          className={isExcluded ? "table-danger" : ""}
                        >
                          <td className="text-center">
                            {!isExcluded && (
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectedStudents.includes(
                                  promo.studentId,
                                )}
                                onChange={() =>
                                  handleSelectStudent(promo.studentId)
                                }
                              />
                            )}
                          </td>
                          <td>
                            <small>{student?.admissionNumber || "N/A"}</small>
                          </td>
                          <td>
                            <strong>{promo.student}</strong>
                          </td>
                          <td>
                            <span
                              className={`badge bg-${getClassColor(promo.from)}`}
                            >
                              {promo.from}
                            </span>
                          </td>
                          <td>
                            {promo.to === "EXCLUDED" ? (
                              <span className="badge bg-danger">
                                {t?.promotionManager?.excludedBadge ||
                                  "EXCLUDED"}
                              </span>
                            ) : (
                              <span
                                className={`badge bg-${getClassColor(promo.to)}`}
                              >
                                {promo.to}
                              </span>
                            )}
                          </td>
                          <td>{getStatusBadge(promo.status)}</td>
                          <td>
                            <small className="text-muted">
                              {promo.reason || "-"}
                            </small>
                          </td>
                          <td>
                            <button
                              className={`btn btn-sm ${isExcluded ? "btn-success" : "btn-warning"}`}
                              onClick={() => handleToggleExclusion(student)}
                            >
                              {isExcluded
                                ? t?.promotionManager?.include || "Include"
                                : t?.promotionManager?.exclude || "Exclude"}
                            </button>
                            <button
                              className="btn btn-sm btn-info ms-2"
                              onClick={() => toggleDetails(promo.studentId)}
                            >
                              {expandedDetails[promo.studentId]
                                ? t?.common?.hide || "Hide"
                                : t?.common?.details || "Details"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12 text-center">
              <button
                className="btn btn-success btn-lg me-3"
                onClick={handlePromoteSelected}
                disabled={processing || selectedStudents.length === 0}
              >
                {processing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />{" "}
                    {t?.common?.processing || "Processing..."}
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="me-2" />{" "}
                    {t?.promotionManager?.promoteSelected || "Promote Selected"}{" "}
                    ({selectedStudents.length})
                  </>
                )}
              </button>
              <button
                className="btn btn-warning btn-lg"
                onClick={handlePromoteAll}
                disabled={processing || readyCount === 0}
              >
                {processing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />{" "}
                    {t?.common?.processing || "Processing..."}
                  </>
                ) : (
                  <>
                    <FaArrowUp className="me-2" />{" "}
                    {t?.promotionManager?.promoteAll || "Promote All Eligible"}{" "}
                    ({readyCount})
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Excluded Students Tab */}
      {activeTab === "excluded" && (
        <div className={`card ${darkMode ? "bg-dark text-white" : ""}`}>
          <div className="card-header bg-danger text-white">
            <h5 className="mb-0">
              <FaBan className="me-2" />{" "}
              {t?.promotionManager?.excluded || "Excluded Students"}
            </h5>
          </div>
          <div className="card-body">
            {excludedStudents.length > 0 ? (
              <div className="table-responsive">
                <table
                  className={`table table-hover ${darkMode ? "table-dark" : ""}`}
                >
                  <thead
                    className={darkMode ? "table-secondary" : "table-light"}
                  >
                    <tr>
                      <th>{t?.classView?.admissionNo || "Admission No."}</th>
                      <th>{t?.promotionManager?.student || "Student Name"}</th>
                      <th>
                        {t?.promotionManager?.currentClass || "Current Class"}
                      </th>
                      <th>{t?.classView?.arm || "Arm"}</th>
                      <th>
                        {t?.promotionManager?.reasonForExclusion ||
                          "Reason for Exclusion"}
                      </th>
                      <th>{t?.common?.action || "Action"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excludedStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <small>{student.admissionNumber}</small>
                        </td>
                        <td>
                          <strong>{student.fullName}</strong>
                        </td>
                        <td>
                          <span
                            className={`badge bg-${getClassColor(student.studentClass)}`}
                          >
                            {student.studentClass}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-secondary">
                            {student.classArm || "-"}
                          </span>
                        </td>
                        <td>
                          <small className="text-muted">
                            {student.promotionHoldReason ||
                              "No reason provided"}
                          </small>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleToggleExclusion(student)}
                          >
                            <FaCheckCircle className="me-1" />{" "}
                            {t?.promotionManager?.include ||
                              "Include in Promotion"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <FaBan size={60} className="text-muted mb-3" />
                <h5>No Excluded Students</h5>
                <p className="text-muted">
                  All students are currently eligible for promotion.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === "results" && promotionResult && (
        <div className={`card ${darkMode ? "bg-dark text-white" : ""}`}>
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">
              <FaCheckCircle className="me-2" /> Promotion Results
            </h5>
          </div>
          <div className="card-body">
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <div className="card bg-success text-white h-100">
                  <div className="card-body text-center">
                    <h3>{promotionResult.promoted || 0}</h3>
                    <p className="mb-0">
                      {t?.promotionManager?.promotedLabel || "Promoted"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card bg-warning text-dark h-100">
                  <div className="card-body text-center">
                    <h3>{promotionResult.graduated || 0}</h3>
                    <p className="mb-0">
                      {t?.promotionManager?.graduatedLabel || "Graduated"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card bg-secondary text-white h-100">
                  <div className="card-body text-center">
                    <h3>{promotionResult.unchanged || 0}</h3>
                    <p className="mb-0">Unchanged</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card bg-danger text-white h-100">
                  <div className="card-body text-center">
                    <h3>{promotionResult.excluded || 0}</h3>
                    <p className="mb-0">
                      {t?.promotionManager?.excluded || "Excluded"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {promotionResult.details && promotionResult.details.length > 0 && (
              <div className="table-responsive">
                <h6 className="mb-3">Promotion Details</h6>
                <table
                  className={`table table-bordered table-hover ${darkMode ? "table-dark" : ""}`}
                >
                  <thead
                    className={darkMode ? "table-secondary" : "table-light"}
                  >
                    <tr>
                      <th>{t?.promotionManager?.student || "Student Name"}</th>
                      <th>
                        {t?.promotionManager?.currentClass || "Current Class"}
                      </th>
                      <th>{t?.promotionManager?.nextClass || "Next Class"}</th>
                      <th>{t?.promotionManager?.status || "Status"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promotionResult.details.map((detail, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{detail.studentName}</strong>
                        </td>
                        <td>
                          <span
                            className={`badge bg-${getClassColor(detail.currentClass)}`}
                          >
                            {detail.currentClass}
                          </span>
                        </td>
                        <td>
                          {detail.nextClass === "GRADUATED" ? (
                            <span className="badge bg-warning">Graduated</span>
                          ) : detail.nextClass === "EXCLUDED" ? (
                            <span className="badge bg-danger">Excluded</span>
                          ) : (
                            <span
                              className={`badge bg-${getClassColor(detail.nextClass)}`}
                            >
                              {detail.nextClass}
                            </span>
                          )}
                        </td>
                        <td>{getStatusBadge(detail.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="text-center mt-4">
              <button
                className="btn btn-primary"
                onClick={() => setActiveTab("preview")}
              >
                <FaArrowUp className="me-2" /> Back to Promotion Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {!preview && !loading && (
        <div className="text-center py-5">
          <FaExclamationTriangle size={60} className="text-warning mb-3" />
          <h5>No Promotion Data Available</h5>
          <p className="text-muted">
            There are no students to promote at this time.
          </p>
        </div>
      )}

      {/* Exclusion Modal */}
      {showExclusionModal && currentStudent && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div
              className={`modal-content ${darkMode ? "bg-dark text-white" : ""}`}
            >
              <div className="modal-header bg-warning">
                <h5 className="modal-title">
                  {currentStudent.excludeFromPromotion
                    ? t?.promotionManager?.include || "Include Student"
                    : t?.promotionManager?.exclude ||
                      "Exclude Student from Promotion"}
                </h5>
                <button
                  type="button"
                  className={`btn-close ${darkMode ? "btn-close-white" : ""}`}
                  onClick={() => setShowExclusionModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <p>
                    <strong>Student:</strong> {currentStudent.fullName}
                  </p>
                  <p>
                    <strong>Admission No:</strong>{" "}
                    {currentStudent.admissionNumber}
                  </p>
                  <p>
                    <strong>Current Class:</strong>{" "}
                    <span
                      className={`badge bg-${getClassColor(currentStudent.studentClass)}`}
                    >
                      {currentStudent.studentClass}{" "}
                      {currentStudent.classArm || ""}
                    </span>
                  </p>
                </div>
                {!currentStudent.excludeFromPromotion && (
                  <div className="mb-3">
                    <label className="form-label">
                      {t?.promotionManager?.reasonForExclusion ||
                        "Reason for Exclusion"}{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className={`form-control ${darkMode ? "bg-dark text-white border-secondary" : ""}`}
                      rows="3"
                      value={excludeReason}
                      onChange={(e) => setExcludeReason(e.target.value)}
                      placeholder={
                        t?.promotionManager?.reasonPlaceholder ||
                        "e.g., Academic performance, Age, Parent request, etc."
                      }
                    ></textarea>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowExclusionModal(false)}
                >
                  {t?.common?.cancel || "Cancel"}
                </button>
                <button
                  className={`btn ${currentStudent.excludeFromPromotion ? "btn-success" : "btn-danger"}`}
                  onClick={handleExcludeStudent}
                  disabled={
                    !currentStudent.excludeFromPromotion &&
                    !excludeReason.trim()
                  }
                >
                  {currentStudent.excludeFromPromotion
                    ? t?.promotionManager?.include || "Include Student"
                    : t?.promotionManager?.exclude || "Exclude Student"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentPromotion;

// src/components/PromotionManager.js
import React, { useState, useEffect } from "react";
import { studentAPI } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { toast } from "react-toastify";
import {
  FaArrowUp,
  FaEye,
  FaBan,
  FaInfoCircle,
  FaSpinner,
} from "react-icons/fa";

function PromotionManager() {
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [excludedStudents, setExcludedStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showExclusionModal, setShowExclusionModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [exclusionReason, setExclusionReason] = useState("");
  const [promotionMode, setPromotionMode] = useState("all");

  useEffect(() => {
    loadPreview();
    loadExcludedStudents();
  }, []);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const response = await studentAPI.getPromotionPreview();
      setPreview(response.data);
    } catch (error) {
      console.error("Error loading preview:", error);
      toast.error(
        t?.promotionManager?.failedPreview ||
          "Failed to load promotion preview",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadExcludedStudents = async () => {
    try {
      const response = await studentAPI.getExcludedStudents();
      setExcludedStudents(response.data || []);
    } catch (error) {
      console.error("Error loading excluded students:", error);
    }
  };

  const handleToggleExclusion = async (student) => {
    setCurrentStudent(student);
    setExclusionReason(student.promotionHoldReason || "");
    setShowExclusionModal(true);
  };

  const confirmExclusion = async () => {
    try {
      const exclude = !currentStudent.excludeFromPromotion;
      await studentAPI.togglePromotionExclusion(
        currentStudent.id,
        exclude,
        exclusionReason,
      );
      toast.success(
        exclude
          ? `${currentStudent.fullName} ${t?.promotionManager?.excludedSuccess || "excluded from promotion"}`
          : `${currentStudent.fullName} ${t?.promotionManager?.includedSuccess || "included in promotion"}`,
      );
      loadPreview();
      loadExcludedStudents();
      setShowExclusionModal(false);
    } catch (error) {
      console.error("Error toggling exclusion:", error);
      toast.error(
        t?.promotionManager?.failedExclusion ||
          "Failed to update exclusion status",
      );
    }
  };

  const handlePromote = async () => {
    let message = "";
    if (promotionMode === "all") {
      message =
        t?.promotionManager?.allConfirmMessage ||
        "Are you sure you want to promote ALL students? Excluded students will not be promoted.";
    } else {
      if (selectedStudents.length === 0) {
        toast.warning(
          t?.promotionManager?.noSelection ||
            "Please select at least one student to promote",
        );
        return;
      }
      message = `${t?.promotionManager?.selectedConfirmPrefix || "Promote"} ${selectedStudents.length} ${t?.promotionManager?.selectedConfirmSuffix || "selected student(s)?"}`;
    }
    if (!window.confirm(message)) return;

    setPromoting(true);
    try {
      let response;
      if (promotionMode === "all") {
        response = await studentAPI.promoteAllStudents();
      } else {
        response = await studentAPI.promoteSelectedStudents(selectedStudents);
      }
      toast.success(
        `${t?.promotionManager?.promotionCompletePrefix || "Promotion complete!"} ${response.data.promoted} ${t?.promotionManager?.promotedLabel || "promoted"}, ${response.data.graduated} ${t?.promotionManager?.graduatedLabel || "graduated"}`,
      );
      setSelectedStudents([]);
      loadPreview();
      loadExcludedStudents();
    } catch (error) {
      console.error("Error promoting students:", error);
      toast.error(
        t?.promotionManager?.failedPromote || "Failed to promote students",
      );
    } finally {
      setPromoting(false);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const selectAll = () => {
    if (preview?.promotions) {
      setSelectedStudents(preview.promotions.map((p) => p.studentId));
    }
  };

  const clearSelection = () => setSelectedStudents([]);

  if (loading) {
    return (
      <div className={`text-center py-5 ${darkMode ? "dark-mode" : ""}`}>
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">{t?.common?.loading || "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className={`promotion-manager ${darkMode ? "dark-mode" : ""}`}>
      <h2 className="mb-4">
        {t?.promotionManager?.title || "End of Session Promotion"}
      </h2>

      <div className="row mb-4">
        <div className="col-12">
          <div className="btn-group" role="group">
            <button
              className={`btn ${promotionMode === "all" ? "btn-nigerian" : "btn-outline-nigerian"}`}
              onClick={() => setPromotionMode("all")}
            >
              {t?.promotionManager?.promoteAll || "Promote All"}
            </button>
            <button
              className={`btn ${promotionMode === "selected" ? "btn-nigerian" : "btn-outline-nigerian"}`}
              onClick={() => setPromotionMode("selected")}
            >
              {t?.promotionManager?.promoteSelected || "Promote Selected"}
            </button>
          </div>
        </div>
      </div>

      {preview && (
        <>
          <div className="row mb-4">
            <div className="col-md-3">
              <div
                className={`stat-card ${darkMode ? "bg-dark text-white" : ""}`}
              >
                <h3>{preview.totalStudents}</h3>
                <p>
                  {t?.promotionManager?.totalActiveStudents ||
                    "Total Active Students"}
                </p>
              </div>
            </div>
            <div className="col-md-3">
              <div
                className={`stat-card ${darkMode ? "bg-success-dark" : ""}`}
                style={{ background: darkMode ? "#1e7e34" : "#28a745" }}
              >
                <h3>{preview.promotions?.length || 0}</h3>
                <p>
                  {t?.promotionManager?.willBePromoted || "Will Be Promoted"}
                </p>
              </div>
            </div>
            <div className="col-md-3">
              <div
                className={`stat-card ${darkMode ? "bg-danger-dark" : ""}`}
                style={{ background: darkMode ? "#a71d2a" : "#dc3545" }}
              >
                <h3>{excludedStudents.length}</h3>
                <p>{t?.promotionManager?.excluded || "Excluded"}</p>
              </div>
            </div>
          </div>

          <div
            className={`school-card p-3 mb-4 ${darkMode ? "bg-dark text-white" : ""}`}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                {t?.promotionManager?.studentPromotionStatus ||
                  "Student Promotion Status"}
              </h5>
              {promotionMode === "selected" && (
                <div>
                  <button
                    className={`btn btn-sm btn-outline-primary me-2 ${darkMode ? "text-white" : ""}`}
                    onClick={selectAll}
                  >
                    {t?.promotionManager?.selectAll || "Select All"}
                  </button>
                  <button
                    className={`btn btn-sm btn-outline-secondary ${darkMode ? "text-white" : ""}`}
                    onClick={clearSelection}
                  >
                    {t?.promotionManager?.clear || "Clear"}
                  </button>
                </div>
              )}
            </div>
            <div className="table-responsive">
              <table
                className={`table ${darkMode ? "table-dark" : "table-striped"}`}
              >
                <thead>
                  <tr>
                    {promotionMode === "selected" && (
                      <th>{t?.promotionManager?.select || "Select"}</th>
                    )}
                    <th>{t?.promotionManager?.student || "Student"}</th>
                    <th>
                      {t?.promotionManager?.currentClass || "Current Class"}
                    </th>
                    <th>{t?.promotionManager?.nextClass || "Next Class"}</th>
                    <th>{t?.promotionManager?.status || "Status"}</th>
                    <th>{t?.common?.actions || "Action"}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.promotions?.map((promo) => {
                    const excludedStudent = excludedStudents.find(
                      (e) => e.id === promo.studentId,
                    );
                    const isExcluded = !!excludedStudent;
                    return (
                      <tr key={promo.studentId}>
                        {promotionMode === "selected" && (
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(
                                promo.studentId,
                              )}
                              onChange={() =>
                                toggleStudentSelection(promo.studentId)
                              }
                              disabled={isExcluded}
                            />
                          </td>
                        )}
                        <td>{promo.student}</td>
                        <td>{promo.from}</td>
                        <td>
                          {isExcluded ? (
                            <span className="badge bg-secondary">
                              <FaBan className="me-1" />{" "}
                              {t?.promotionManager?.excludedBadge || "EXCLUDED"}
                            </span>
                          ) : (
                            <span className="badge bg-success">
                              <FaArrowUp className="me-1" /> {promo.to}
                            </span>
                          )}
                        </td>
                        <td>
                          {isExcluded ? (
                            <span className="text-danger">
                              <FaInfoCircle className="me-1" />
                              {excludedStudent?.promotionHoldReason ||
                                t?.promotionManager?.onHold ||
                                "On hold"}
                            </span>
                          ) : (
                            <span className="text-success">
                              {t?.promotionManager?.ready || "Ready"}
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${isExcluded ? "btn-success" : "btn-warning"}`}
                            onClick={() =>
                              handleToggleExclusion({
                                id: promo.studentId,
                                fullName: promo.student,
                                excludeFromPromotion: isExcluded,
                                promotionHoldReason:
                                  excludedStudent?.promotionHoldReason,
                              })
                            }
                          >
                            {isExcluded
                              ? t?.promotionManager?.include || "Include"
                              : t?.promotionManager?.exclude || "Exclude"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              onClick={handlePromote}
              className="btn btn-nigerian"
              disabled={
                promoting ||
                (promotionMode === "selected" && selectedStudents.length === 0)
              }
            >
              {promoting
                ? t?.promotionManager?.promotingText || "Promoting..."
                : promotionMode === "all"
                  ? t?.promotionManager?.promoteAllStudents ||
                    "Promote All Students"
                  : `${t?.promotionManager?.promoteSelectedCount || "Promote Selected"} (${selectedStudents.length})`}
            </button>
            <button
              onClick={loadPreview}
              className="btn btn-outline-nigerian"
              disabled={loading}
            >
              <FaEye className="me-2" />{" "}
              {t?.promotionManager?.refreshPreview || "Refresh Preview"}
            </button>
          </div>
        </>
      )}

      {showExclusionModal && currentStudent && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className={`modal-dialog ${darkMode ? "modal-dark" : ""}`}>
            <div
              className={`modal-content ${darkMode ? "bg-dark text-white" : ""}`}
            >
              <div className="modal-header">
                <h5 className="modal-title">
                  {currentStudent.excludeFromPromotion
                    ? t?.promotionManager?.includeInPromotion ||
                      "Include in Promotion"
                    : t?.promotionManager?.excludeFromPromotion ||
                      "Exclude from Promotion"}
                </h5>
                <button
                  type="button"
                  className={`btn-close ${darkMode ? "btn-close-white" : ""}`}
                  onClick={() => setShowExclusionModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  {currentStudent.excludeFromPromotion
                    ? `${t?.promotionManager?.confirmIncludeMessage || "Are you sure you want to include"} ${currentStudent.fullName} ${t?.promotionManager?.inPromotion || "in promotion?"}`
                    : `${t?.promotionManager?.confirmExcludeMessage || "Are you sure you want to exclude"} ${currentStudent.fullName} ${t?.promotionManager?.fromPromotion || "from promotion?"}`}
                </p>
                {!currentStudent.excludeFromPromotion && (
                  <div className="mb-3">
                    <label className="form-label">
                      {t?.promotionManager?.reasonForExclusion ||
                        "Reason for exclusion:"}
                    </label>
                    <textarea
                      className={`form-control ${darkMode ? "bg-dark text-white border-secondary" : ""}`}
                      value={exclusionReason}
                      onChange={(e) => setExclusionReason(e.target.value)}
                      rows="3"
                      placeholder={
                        t?.promotionManager?.reasonPlaceholder ||
                        "Enter reason for holding this student back..."
                      }
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className={`btn btn-secondary ${darkMode ? "btn-outline-light" : ""}`}
                  onClick={() => setShowExclusionModal(false)}
                >
                  {t?.common?.cancel || "Cancel"}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={confirmExclusion}
                >
                  {t?.common?.confirm || "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PromotionManager;

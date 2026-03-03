// src/components/PromotionManager.js
import React, { useState, useEffect } from "react";
import { studentAPI } from "../services/api";
import { toast } from "react-toastify";
import { FaArrowUp, FaEye, FaCheck, FaBan, FaInfoCircle } from "react-icons/fa";

function PromotionManager() {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [excludedStudents, setExcludedStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showExclusionModal, setShowExclusionModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [exclusionReason, setExclusionReason] = useState("");
  const [promotionMode, setPromotionMode] = useState("all"); // 'all' or 'selected'

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
      toast.error("Failed to load promotion preview");
    } finally {
      setLoading(false);
    }
  };

  const loadExcludedStudents = async () => {
    try {
      const response = await studentAPI.getExcludedStudents();
      setExcludedStudents(response.data);
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
          ? `${currentStudent.fullName} excluded from promotion`
          : `${currentStudent.fullName} included in promotion`,
      );
      loadPreview();
      loadExcludedStudents();
      setShowExclusionModal(false);
    } catch (error) {
      console.error("Error toggling exclusion:", error);
      toast.error("Failed to update exclusion status");
    }
  };

  const handlePromote = async () => {
    let message = "";
    if (promotionMode === "all") {
      message =
        "Are you sure you want to promote ALL students? Excluded students will not be promoted.";
    } else {
      if (selectedStudents.length === 0) {
        toast.warning("Please select at least one student to promote");
        return;
      }
      message = `Promote ${selectedStudents.length} selected student(s)?`;
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
        `Promotion complete! ${response.data.promoted} promoted, ${response.data.graduated} graduated`,
      );
      setSelectedStudents([]);
      loadPreview();
      loadExcludedStudents();
    } catch (error) {
      console.error("Error promoting students:", error);
      toast.error("Failed to promote students");
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
      const allIds = preview.promotions.map((p) => p.studentId);
      setSelectedStudents(allIds);
    }
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  if (loading) {
    return <div className="text-center py-5">Loading preview...</div>;
  }

  return (
    <div className="promotion-manager">
      <h2 className="mb-4">End of Session Promotion</h2>

      {/* Mode Selection */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="btn-group" role="group">
            <button
              className={`btn ${promotionMode === "all" ? "btn-nigerian" : "btn-outline-nigerian"}`}
              onClick={() => setPromotionMode("all")}
            >
              Promote All
            </button>
            <button
              className={`btn ${promotionMode === "selected" ? "btn-nigerian" : "btn-outline-nigerian"}`}
              onClick={() => setPromotionMode("selected")}
            >
              Promote Selected
            </button>
          </div>
        </div>
      </div>

      {preview && (
        <>
          {/* Summary Cards */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="stat-card">
                <h3>{preview.totalStudents}</h3>
                <p>Total Active Students</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card" style={{ background: "#28a745" }}>
                <h3>{preview.promotions?.length || 0}</h3>
                <p>Will Be Promoted</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card" style={{ background: "#dc3545" }}>
                <h3>{excludedStudents.length}</h3>
                <p>Excluded</p>
              </div>
            </div>
          </div>

          {/* Promotion List */}
          <div className="school-card p-3 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Student Promotion Status</h5>
              {promotionMode === "selected" && (
                <div>
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={selectAll}
                  >
                    Select All
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={clearSelection}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    {promotionMode === "selected" && <th>Select</th>}
                    <th>Student</th>
                    <th>Current Class</th>
                    <th>Next Class</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.promotions?.map((promo) => {
                    const isExcluded = excludedStudents.some(
                      (e) => e.id === promo.studentId,
                    );

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
                              <FaBan className="me-1" /> EXCLUDED
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
                              {excludedStudents.find(
                                (e) => e.id === promo.studentId,
                              )?.promotionHoldReason || "On hold"}
                            </span>
                          ) : (
                            <span className="text-success">Ready</span>
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
                                promotionHoldReason: excludedStudents.find(
                                  (e) => e.id === promo.studentId,
                                )?.promotionHoldReason,
                              })
                            }
                          >
                            {isExcluded ? "Include" : "Exclude"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
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
                ? "Promoting..."
                : promotionMode === "all"
                  ? "Promote All Students"
                  : `Promote Selected (${selectedStudents.length})`}
            </button>
            <button
              onClick={loadPreview}
              className="btn btn-outline-nigerian"
              disabled={loading}
            >
              <FaEye className="me-2" /> Refresh Preview
            </button>
          </div>
        </>
      )}

      {/* Exclusion Modal */}
      {showExclusionModal && currentStudent && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {currentStudent.excludeFromPromotion
                    ? "Include in Promotion"
                    : "Exclude from Promotion"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowExclusionModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  {currentStudent.excludeFromPromotion
                    ? `Are you sure you want to include ${currentStudent.fullName} in promotion?`
                    : `Are you sure you want to exclude ${currentStudent.fullName} from promotion?`}
                </p>
                {!currentStudent.excludeFromPromotion && (
                  <div className="mb-3">
                    <label className="form-label">Reason for exclusion:</label>
                    <textarea
                      className="form-control"
                      value={exclusionReason}
                      onChange={(e) => setExclusionReason(e.target.value)}
                      rows="3"
                      placeholder="Enter reason for holding this student back..."
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowExclusionModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={confirmExclusion}
                >
                  Confirm
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

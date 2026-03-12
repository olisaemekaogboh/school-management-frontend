// src/components/SubjectManagement.js
import React, { useEffect, useMemo, useState } from "react";
import { subjectAPI, teacherAPI, classAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaBook,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaSyncAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaChalkboardTeacher,
  FaSchool,
} from "react-icons/fa";

function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [classSubjects, setClassSubjects] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    active: true,
  });

  const [classAssignData, setClassAssignData] = useState({
    classId: "",
    subjectId: "",
  });

  const [teacherAssignData, setTeacherAssignData] = useState({
    teacherId: "",
    subjectId: "",
    classId: "",
  });

  const sortedSubjects = useMemo(() => {
    return [...subjects].sort((a, b) => a.name.localeCompare(b.name));
  }, [subjects]);

  const selectedClass = useMemo(() => {
    return (
      schoolClasses.find((c) => String(c.id) === String(selectedClassId)) ||
      null
    );
  }, [schoolClasses, selectedClassId]);

  const classOptions = useMemo(() => {
    return [...schoolClasses].sort((a, b) => {
      const aLabel = `${a.className || ""} ${a.arm || ""}`.trim();
      const bLabel = `${b.className || ""} ${b.arm || ""}`.trim();
      return aLabel.localeCompare(bLabel);
    });
  }, [schoolClasses]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadClassSubjects(selectedClass.className, selectedClass.arm);
    } else {
      setClassSubjects([]);
    }
  }, [selectedClass]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [subjectsRes, teachersRes, classesRes] = await Promise.all([
        subjectAPI.getAllSubjects(),
        teacherAPI.getAllTeachers(),
        classAPI.getAllClasses(),
      ]);

      const loadedSubjects = subjectsRes.data || [];
      const loadedTeachers = teachersRes.data || [];
      const loadedClasses = classesRes.data || [];

      setSubjects(loadedSubjects);
      setTeachers(loadedTeachers);
      setSchoolClasses(loadedClasses);

      if (loadedClasses.length > 0) {
        const firstClassId = String(loadedClasses[0].id);
        setSelectedClassId(firstClassId);

        setClassAssignData((prev) => ({
          ...prev,
          classId: prev.classId || firstClassId,
        }));

        setTeacherAssignData((prev) => ({
          ...prev,
          classId: prev.classId || firstClassId,
        }));

        const firstClass = loadedClasses[0];
        await loadClassSubjects(firstClass.className, firstClass.arm);
      } else {
        setSelectedClassId("");
        setClassSubjects([]);
      }
    } catch (error) {
      console.error("Error loading subject module:", error);
      toast.error("Failed to load subject data");
    } finally {
      setLoading(false);
    }
  };

  const loadClassSubjects = async (className, classArm) => {
    if (!className || !classArm) {
      setClassSubjects([]);
      return;
    }

    try {
      const response = await subjectAPI.getSubjectsForClass(
        className,
        classArm,
      );
      setClassSubjects(response.data || []);
    } catch (error) {
      console.error("Error loading class subjects:", error);
      setClassSubjects([]);
    }
  };

  const loadTeacherAssignments = async (teacherId) => {
    if (!teacherId) {
      setTeacherAssignments([]);
      return;
    }

    try {
      const response = await subjectAPI.getTeacherSubjects(teacherId);
      setTeacherAssignments(response.data || []);
    } catch (error) {
      console.error("Error loading teacher assignments:", error);
      setTeacherAssignments([]);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      active: true,
    });
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.warning("Subject name is required");
      return;
    }

    if (!formData.code.trim()) {
      toast.warning("Subject code is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        active: formData.active,
      };

      if (editingId) {
        await subjectAPI.updateSubject(editingId, payload);
        toast.success("Subject updated successfully");
      } else {
        await subjectAPI.createSubject(payload);
        toast.success("Subject created successfully");
      }

      resetForm();
      await loadInitialData();
    } catch (error) {
      console.error("Error saving subject:", error);
      toast.error(error?.response?.data?.message || "Failed to save subject");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (subject) => {
    setEditingId(subject.id);
    setFormData({
      name: subject.name || "",
      code: subject.code || "",
      active: subject.active ?? true,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete subject "${name}"?`)) return;

    setDeletingId(id);
    try {
      await subjectAPI.deleteSubject(id);
      toast.success("Subject deleted successfully");
      if (editingId === id) resetForm();
      await loadInitialData();
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast.error(error?.response?.data?.message || "Failed to delete subject");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (subject) => {
    try {
      await subjectAPI.toggleStatus(subject.id, !subject.active);
      toast.success(
        `Subject ${subject.active ? "deactivated" : "activated"} successfully`,
      );
      await loadInitialData();
    } catch (error) {
      console.error("Error toggling subject status:", error);
      toast.error("Failed to update subject status");
    }
  };

  const handleAssignToClass = async (e) => {
    e.preventDefault();

    if (!classAssignData.classId) {
      toast.warning("Please select a class");
      return;
    }

    if (!classAssignData.subjectId) {
      toast.warning("Please select a subject");
      return;
    }

    const schoolClass = schoolClasses.find(
      (c) => String(c.id) === String(classAssignData.classId),
    );

    if (!schoolClass) {
      toast.warning("Selected class not found");
      return;
    }

    try {
      await subjectAPI.assignSubjectToClass({
        className: schoolClass.className,
        classArm: schoolClass.arm,
        subjectId: Number(classAssignData.subjectId),
      });

      toast.success("Subject assigned to class successfully");

      if (String(selectedClassId) === String(schoolClass.id)) {
        await loadClassSubjects(schoolClass.className, schoolClass.arm);
      }
    } catch (error) {
      console.error("Error assigning subject to class:", error);
      toast.error(
        error?.response?.data?.message || "Failed to assign subject to class",
      );
    }
  };

  const handleRemoveFromClass = async (className, classArm, subjectId) => {
    if (!window.confirm("Remove this subject from class?")) return;

    try {
      await subjectAPI.removeSubjectFromClass(className, classArm, subjectId);
      toast.success("Subject removed from class");
      await loadClassSubjects(className, classArm);
    } catch (error) {
      console.error("Error removing subject from class:", error);
      toast.error("Failed to remove subject from class");
    }
  };

  const handleAssignToTeacher = async (e) => {
    e.preventDefault();

    if (!teacherAssignData.teacherId || !teacherAssignData.subjectId) {
      toast.warning("Please select teacher and subject");
      return;
    }

    if (!teacherAssignData.classId) {
      toast.warning("Please select a class");
      return;
    }

    const schoolClass = schoolClasses.find(
      (c) => String(c.id) === String(teacherAssignData.classId),
    );

    if (!schoolClass) {
      toast.warning("Selected class not found");
      return;
    }

    try {
      await subjectAPI.assignSubjectToTeacher({
        teacherId: Number(teacherAssignData.teacherId),
        subjectId: Number(teacherAssignData.subjectId),
        className: schoolClass.className,
        classArm: schoolClass.arm,
      });

      toast.success("Subject assigned to teacher successfully");
      await loadTeacherAssignments(teacherAssignData.teacherId);
    } catch (error) {
      console.error("Error assigning subject to teacher:", error);
      toast.error(
        error?.response?.data?.message || "Failed to assign subject to teacher",
      );
    }
  };

  const handleRemoveTeacherAssignment = async (id) => {
    if (!window.confirm("Remove this teacher subject assignment?")) return;

    try {
      await subjectAPI.removeTeacherSubject(id);
      toast.success("Assignment removed successfully");
      await loadTeacherAssignments(teacherAssignData.teacherId);
    } catch (error) {
      console.error("Error removing assignment:", error);
      toast.error("Failed to remove assignment");
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="mb-1">Subject Management</h2>
          <p className="text-muted mb-0">
            Manage subjects, class subject lists, and teacher subject
            assignments
          </p>
        </div>

        <button className="btn btn-outline-primary" onClick={loadInitialData}>
          <FaSyncAlt className="me-2" />
          Refresh
        </button>
      </div>

      <div className="row">
        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                {editingId ? (
                  <>
                    <FaEdit className="me-2" />
                    Edit Subject
                  </>
                ) : (
                  <>
                    <FaPlus className="me-2" />
                    Create Subject
                  </>
                )}
              </h5>
            </div>

            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Subject Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Mathematics"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Subject Code</label>
                  <input
                    type="text"
                    className="form-control"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g. MTH"
                  />
                </div>

                <div className="form-check mb-3">
                  <input
                    id="activeSubject"
                    type="checkbox"
                    className="form-check-input"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                  />
                  <label htmlFor="activeSubject" className="form-check-label">
                    Active
                  </label>
                </div>

                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="me-2 spin" />
                        {editingId ? "Updating..." : "Creating..."}
                      </>
                    ) : editingId ? (
                      <>
                        <FaEdit className="me-2" />
                        Update Subject
                      </>
                    ) : (
                      <>
                        <FaPlus className="me-2" />
                        Create Subject
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={resetForm}
                    disabled={submitting}
                  >
                    {editingId ? "Cancel Edit" : "Clear"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="card shadow-sm mt-4">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <FaSchool className="me-2" />
                Assign Subject to Class
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleAssignToClass}>
                <div className="mb-3">
                  <label className="form-label">Class and Arm</label>
                  <select
                    className="form-select"
                    value={classAssignData.classId}
                    onChange={(e) => {
                      const classId = e.target.value;
                      setClassAssignData((prev) => ({
                        ...prev,
                        classId,
                      }));
                      setSelectedClassId(classId);
                    }}
                  >
                    <option value="">Select Class</option>
                    {classOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.className} {c.arm}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Subject</label>
                  <select
                    className="form-select"
                    value={classAssignData.subjectId}
                    onChange={(e) =>
                      setClassAssignData((prev) => ({
                        ...prev,
                        subjectId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select Subject</option>
                    {sortedSubjects
                      .filter((s) => s.active)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                  </select>
                </div>

                <button type="submit" className="btn btn-success w-100">
                  Assign to Class
                </button>
              </form>
            </div>
          </div>

          <div className="card shadow-sm mt-4">
            <div className="card-header bg-warning">
              <h5 className="mb-0">
                <FaChalkboardTeacher className="me-2" />
                Assign Subject to Teacher
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleAssignToTeacher}>
                <div className="mb-3">
                  <label className="form-label">Teacher</label>
                  <select
                    className="form-select"
                    value={teacherAssignData.teacherId}
                    onChange={(e) => {
                      const teacherId = e.target.value;
                      setTeacherAssignData((prev) => ({
                        ...prev,
                        teacherId,
                      }));
                      loadTeacherAssignments(teacherId);
                    }}
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {(
                          t.fullName ||
                          `${t.firstName || ""} ${t.lastName || ""}`
                        ).trim()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Subject</label>
                  <select
                    className="form-select"
                    value={teacherAssignData.subjectId}
                    onChange={(e) =>
                      setTeacherAssignData((prev) => ({
                        ...prev,
                        subjectId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select Subject</option>
                    {sortedSubjects
                      .filter((s) => s.active)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Class and Arm</label>
                  <select
                    className="form-select"
                    value={teacherAssignData.classId}
                    onChange={(e) =>
                      setTeacherAssignData((prev) => ({
                        ...prev,
                        classId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select Class</option>
                    {classOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.className} {c.arm}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn btn-dark w-100">
                  Assign to Teacher
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-8 mb-4">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">
                <FaBook className="me-2" />
                All Subjects
              </h5>
            </div>

            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <FaSpinner className="spin mb-3" size={32} />
                  <div>Loading subjects...</div>
                </div>
              ) : sortedSubjects.length === 0 ? (
                <div className="alert alert-info mb-0">No subjects found.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSubjects.map((subject) => (
                        <tr key={subject.id}>
                          <td className="fw-bold">{subject.name}</td>
                          <td>{subject.code}</td>
                          <td>
                            {subject.active ? (
                              <span className="badge bg-success">Active</span>
                            ) : (
                              <span className="badge bg-danger">Inactive</span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex justify-content-end gap-2 flex-wrap">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(subject)}
                              >
                                <FaEdit className="me-1" />
                                Edit
                              </button>

                              <button
                                className={`btn btn-sm ${
                                  subject.active
                                    ? "btn-outline-warning"
                                    : "btn-outline-success"
                                }`}
                                onClick={() => handleToggleStatus(subject)}
                              >
                                {subject.active ? (
                                  <>
                                    <FaTimesCircle className="me-1" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <FaCheckCircle className="me-1" />
                                    Activate
                                  </>
                                )}
                              </button>

                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() =>
                                  handleDelete(subject.id, subject.name)
                                }
                                disabled={deletingId === subject.id}
                              >
                                {deletingId === subject.id ? (
                                  <>
                                    <FaSpinner className="me-1 spin" />
                                    Deleting
                                  </>
                                ) : (
                                  <>
                                    <FaTrash className="me-1" />
                                    Delete
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                Subjects for{" "}
                {selectedClass
                  ? `${selectedClass.className} ${selectedClass.arm}`
                  : "Selected Class"}
              </h5>
              <select
                className="form-select form-select-sm"
                style={{ width: "220px" }}
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">Select Class</option>
                {classOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.className} {c.arm}
                  </option>
                ))}
              </select>
            </div>

            <div className="card-body">
              {!selectedClass ? (
                <div className="alert alert-info mb-0">
                  Select a class and arm first.
                </div>
              ) : classSubjects.length === 0 ? (
                <div className="alert alert-info mb-0">
                  No subjects assigned to this class arm yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered align-middle">
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Arm</th>
                        <th>Subject</th>
                        <th>Code</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classSubjects.map((item) => (
                        <tr key={item.id}>
                          <td>{item.className}</td>
                          <td>{item.classArm}</td>
                          <td>{item.subjectName}</td>
                          <td>{item.subjectCode}</td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() =>
                                handleRemoveFromClass(
                                  item.className,
                                  item.classArm,
                                  item.subjectId,
                                )
                              }
                            >
                              <FaTrash className="me-1" />
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">Selected Teacher Assignments</h5>
            </div>

            <div className="card-body">
              {!teacherAssignData.teacherId ? (
                <div className="alert alert-info mb-0">
                  Select a teacher to view subject assignments.
                </div>
              ) : teacherAssignments.length === 0 ? (
                <div className="alert alert-warning mb-0">
                  No subject assignments found for this teacher.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped align-middle">
                    <thead>
                      <tr>
                        <th>Teacher</th>
                        <th>Subject</th>
                        <th>Class</th>
                        <th>Arm</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherAssignments.map((item) => (
                        <tr key={item.id}>
                          <td>{item.teacherName}</td>
                          <td>
                            {item.subjectName} ({item.subjectCode})
                          </td>
                          <td>{item.className}</td>
                          <td>{item.classArm || "-"}</td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() =>
                                handleRemoveTeacherAssignment(item.id)
                              }
                            >
                              <FaTrash className="me-1" />
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default SubjectManagement;

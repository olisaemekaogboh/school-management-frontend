// src/components/SubjectManagement.js
import React, { useEffect, useMemo, useState } from "react";
import { subjectAPI, teacherAPI, classAPI } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
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
  FaInfoCircle,
  FaExclamationTriangle,
  FaUserTie,
} from "react-icons/fa";
import "./SubjectManagement.css";

function SubjectManagement() {
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

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
      toast.error(
        t?.subjectManagement?.loadFailed || "Failed to load subject data",
      );
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
      toast.warning(
        t?.subjectManagement?.nameRequired || "Subject name is required",
      );
      return;
    }

    if (!formData.code.trim()) {
      toast.warning(
        t?.subjectManagement?.codeRequired || "Subject code is required",
      );
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
        toast.success(
          t?.subjectManagement?.updateSuccess || "Subject updated successfully",
        );
      } else {
        await subjectAPI.createSubject(payload);
        toast.success(
          t?.subjectManagement?.createSuccess || "Subject created successfully",
        );
      }

      resetForm();
      await loadInitialData();
    } catch (error) {
      console.error("Error saving subject:", error);
      toast.error(
        error?.response?.data?.message ||
          t?.subjectManagement?.saveFailed ||
          "Failed to save subject",
      );
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
    if (
      !window.confirm(
        t?.subjectManagement?.confirmDelete?.replace("{name}", name) ||
          `Delete subject "${name}"?`,
      )
    )
      return;

    setDeletingId(id);
    try {
      await subjectAPI.deleteSubject(id);
      toast.success(
        t?.subjectManagement?.deleteSuccess || "Subject deleted successfully",
      );
      if (editingId === id) resetForm();
      await loadInitialData();
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast.error(
        error?.response?.data?.message ||
          t?.subjectManagement?.deleteFailed ||
          "Failed to delete subject",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (subject) => {
    try {
      await subjectAPI.toggleStatus(subject.id, !subject.active);
      toast.success(
        subject.active
          ? t?.subjectManagement?.deactivated ||
              "Subject deactivated successfully"
          : t?.subjectManagement?.activated || "Subject activated successfully",
      );
      await loadInitialData();
    } catch (error) {
      console.error("Error toggling subject status:", error);
      toast.error(
        t?.subjectManagement?.statusFailed || "Failed to update subject status",
      );
    }
  };

  const handleAssignToClass = async (e) => {
    e.preventDefault();

    if (!classAssignData.classId) {
      toast.warning(
        t?.subjectManagement?.selectClass || "Please select a class",
      );
      return;
    }

    if (!classAssignData.subjectId) {
      toast.warning(
        t?.subjectManagement?.selectSubject || "Please select a subject",
      );
      return;
    }

    const schoolClass = schoolClasses.find(
      (c) => String(c.id) === String(classAssignData.classId),
    );

    if (!schoolClass) {
      toast.warning(
        t?.subjectManagement?.classNotFound || "Selected class not found",
      );
      return;
    }

    try {
      await subjectAPI.assignSubjectToClass({
        className: schoolClass.className,
        classArm: schoolClass.arm,
        subjectId: Number(classAssignData.subjectId),
      });

      toast.success(
        t?.subjectManagement?.assignSuccess ||
          "Subject assigned to class successfully",
      );

      if (String(selectedClassId) === String(schoolClass.id)) {
        await loadClassSubjects(schoolClass.className, schoolClass.arm);
      }
    } catch (error) {
      console.error("Error assigning subject to class:", error);
      toast.error(
        error?.response?.data?.message ||
          t?.subjectManagement?.assignFailed ||
          "Failed to assign subject to class",
      );
    }
  };

  const handleRemoveFromClass = async (className, classArm, subjectId) => {
    if (
      !window.confirm(
        t?.subjectManagement?.confirmRemove ||
          "Remove this subject from class?",
      )
    )
      return;

    try {
      await subjectAPI.removeSubjectFromClass(className, classArm, subjectId);
      toast.success(
        t?.subjectManagement?.removeSuccess || "Subject removed from class",
      );
      await loadClassSubjects(className, classArm);
    } catch (error) {
      console.error("Error removing subject from class:", error);
      toast.error(
        t?.subjectManagement?.removeFailed ||
          "Failed to remove subject from class",
      );
    }
  };

  const handleAssignToTeacher = async (e) => {
    e.preventDefault();

    if (!teacherAssignData.teacherId || !teacherAssignData.subjectId) {
      toast.warning(
        t?.subjectManagement?.selectTeacherSubject ||
          "Please select teacher and subject",
      );
      return;
    }

    if (!teacherAssignData.classId) {
      toast.warning(
        t?.subjectManagement?.selectClass || "Please select a class",
      );
      return;
    }

    const schoolClass = schoolClasses.find(
      (c) => String(c.id) === String(teacherAssignData.classId),
    );

    if (!schoolClass) {
      toast.warning(
        t?.subjectManagement?.classNotFound || "Selected class not found",
      );
      return;
    }

    try {
      await subjectAPI.assignSubjectToTeacher({
        teacherId: Number(teacherAssignData.teacherId),
        subjectId: Number(teacherAssignData.subjectId),
        className: schoolClass.className,
        classArm: schoolClass.arm,
      });

      toast.success(
        t?.subjectManagement?.teacherAssignSuccess ||
          "Subject assigned to teacher successfully",
      );
      await loadTeacherAssignments(teacherAssignData.teacherId);
    } catch (error) {
      console.error("Error assigning subject to teacher:", error);
      toast.error(
        error?.response?.data?.message ||
          t?.subjectManagement?.teacherAssignFailed ||
          "Failed to assign subject to teacher",
      );
    }
  };

  const handleRemoveTeacherAssignment = async (id) => {
    if (
      !window.confirm(
        t?.subjectManagement?.confirmRemoveAssignment ||
          "Remove this teacher subject assignment?",
      )
    )
      return;

    try {
      await subjectAPI.removeTeacherSubject(id);
      toast.success(
        t?.subjectManagement?.removeAssignmentSuccess ||
          "Assignment removed successfully",
      );
      await loadTeacherAssignments(teacherAssignData.teacherId);
    } catch (error) {
      console.error("Error removing assignment:", error);
      toast.error(
        t?.subjectManagement?.removeAssignmentFailed ||
          "Failed to remove assignment",
      );
    }
  };

  if (loading && subjects.length === 0) {
    return (
      <div className={`text-center py-5 ${darkMode ? "dark-mode" : ""}`}>
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">{t?.common?.loading || "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className={`subject-management ${darkMode ? "dark-mode" : ""}`}>
      <div className="subject-header">
        <div className="subject-header-info">
          <h2>
            <FaBook className="me-2" />
            {t?.subjectManagement?.title || "Subject Management"}
          </h2>
          <p className="subject-description">
            {t?.subjectManagement?.subtitle ||
              "Manage subjects, class subject lists, and teacher subject assignments"}
          </p>
        </div>

        <button className="btn-refresh" onClick={loadInitialData}>
          <FaSyncAlt className="me-2" />
          {t?.common?.refresh || "Refresh"}
        </button>
      </div>

      <div className="subject-grid">
        <div className="subject-left-col">
          <div className="subject-card">
            <div className="subject-card-header primary">
              <h5>
                {editingId ? (
                  <>
                    <FaEdit className="me-2" />
                    {t?.subjectManagement?.editSubject || "Edit Subject"}
                  </>
                ) : (
                  <>
                    <FaPlus className="me-2" />
                    {t?.subjectManagement?.createSubject || "Create Subject"}
                  </>
                )}
              </h5>
            </div>

            <div className="subject-card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>
                    {t?.subjectManagement?.subjectName || "Subject Name"}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={
                      t?.subjectManagement?.subjectNamePlaceholder ||
                      "e.g. Mathematics"
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    {t?.subjectManagement?.subjectCode || "Subject Code"}
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder={
                      t?.subjectManagement?.subjectCodePlaceholder || "e.g. MTH"
                    }
                  />
                </div>

                <div className="form-check">
                  <input
                    id="activeSubject"
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                  />
                  <label htmlFor="activeSubject">
                    {t?.subjectManagement?.active || "Active"}
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="spin" />
                        {editingId
                          ? t?.common?.updating || "Updating..."
                          : t?.common?.creating || "Creating..."}
                      </>
                    ) : editingId ? (
                      <>
                        <FaEdit />
                        {t?.common?.update || "Update Subject"}
                      </>
                    ) : (
                      <>
                        <FaPlus />
                        {t?.common?.create || "Create Subject"}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={resetForm}
                    disabled={submitting}
                  >
                    {editingId
                      ? t?.common?.cancelEdit || "Cancel Edit"
                      : t?.common?.clear || "Clear"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="subject-card">
            <div className="subject-card-header success">
              <h5>
                <FaSchool className="me-2" />
                {t?.subjectManagement?.assignToClass ||
                  "Assign Subject to Class"}
              </h5>
            </div>
            <div className="subject-card-body">
              <form onSubmit={handleAssignToClass}>
                <div className="form-group">
                  <label>
                    {t?.subjectManagement?.classAndArm || "Class and Arm"}
                  </label>
                  <select
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
                    <option value="">
                      {t?.common?.select || "Select Class"}
                    </option>
                    {classOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.className} {c.arm}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t?.subjectManagement?.subject || "Subject"}</label>
                  <select
                    value={classAssignData.subjectId}
                    onChange={(e) =>
                      setClassAssignData((prev) => ({
                        ...prev,
                        subjectId: e.target.value,
                      }))
                    }
                  >
                    <option value="">
                      {t?.common?.select || "Select Subject"}
                    </option>
                    {sortedSubjects
                      .filter((s) => s.active)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                  </select>
                </div>

                <button type="submit" className="btn-success w-100">
                  {t?.subjectManagement?.assignToClass || "Assign to Class"}
                </button>
              </form>
            </div>
          </div>

          <div className="subject-card">
            <div className="subject-card-header warning">
              <h5>
                <FaChalkboardTeacher className="me-2" />
                {t?.subjectManagement?.assignToTeacher ||
                  "Assign Subject to Teacher"}
              </h5>
            </div>
            <div className="subject-card-body">
              <form onSubmit={handleAssignToTeacher}>
                <div className="form-group">
                  <label>{t?.subjectManagement?.teacher || "Teacher"}</label>
                  <select
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
                    <option value="">
                      {t?.common?.select || "Select Teacher"}
                    </option>
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

                <div className="form-group">
                  <label>{t?.subjectManagement?.subject || "Subject"}</label>
                  <select
                    value={teacherAssignData.subjectId}
                    onChange={(e) =>
                      setTeacherAssignData((prev) => ({
                        ...prev,
                        subjectId: e.target.value,
                      }))
                    }
                  >
                    <option value="">
                      {t?.common?.select || "Select Subject"}
                    </option>
                    {sortedSubjects
                      .filter((s) => s.active)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    {t?.subjectManagement?.classAndArm || "Class and Arm"}
                  </label>
                  <select
                    value={teacherAssignData.classId}
                    onChange={(e) =>
                      setTeacherAssignData((prev) => ({
                        ...prev,
                        classId: e.target.value,
                      }))
                    }
                  >
                    <option value="">
                      {t?.common?.select || "Select Class"}
                    </option>
                    {classOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.className} {c.arm}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn-dark w-100">
                  {t?.subjectManagement?.assignToTeacher || "Assign to Teacher"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="subject-right-col">
          <div className="subject-card">
            <div className="subject-card-header dark">
              <h5>
                <FaBook className="me-2" />
                {t?.subjectManagement?.allSubjects || "All Subjects"}
              </h5>
            </div>

            <div className="subject-card-body">
              {sortedSubjects.length === 0 ? (
                <div className="empty-state">
                  {t?.subjectManagement?.noSubjects || "No subjects found."}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="subject-table">
                    <thead>
                      <tr>
                        <th>{t?.subjectManagement?.name || "Name"}</th>
                        <th>{t?.subjectManagement?.code || "Code"}</th>
                        <th>{t?.subjectManagement?.status || "Status"}</th>
                        <th className="text-end">
                          {t?.common?.actions || "Actions"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSubjects.map((subject) => (
                        <tr key={subject.id}>
                          <td className="fw-bold">{subject.name}</td>
                          <td>{subject.code}</td>
                          <td>
                            {subject.active ? (
                              <span className="badge success">
                                {t?.subjectManagement?.active || "Active"}
                              </span>
                            ) : (
                              <span className="badge danger">
                                {t?.subjectManagement?.inactive || "Inactive"}
                              </span>
                            )}
                          </td>
                          <td className="text-end">
                            <div className="action-buttons">
                              <button
                                className="btn-icon edit"
                                onClick={() => handleEdit(subject)}
                                title={t?.common?.edit || "Edit"}
                              >
                                <FaEdit />
                              </button>

                              <button
                                className={`btn-icon ${subject.active ? "warning" : "success"}`}
                                onClick={() => handleToggleStatus(subject)}
                                title={
                                  subject.active ? "Deactivate" : "Activate"
                                }
                              >
                                {subject.active ? (
                                  <FaTimesCircle />
                                ) : (
                                  <FaCheckCircle />
                                )}
                              </button>

                              <button
                                className="btn-icon delete"
                                onClick={() =>
                                  handleDelete(subject.id, subject.name)
                                }
                                disabled={deletingId === subject.id}
                                title={t?.common?.delete || "Delete"}
                              >
                                {deletingId === subject.id ? (
                                  <FaSpinner className="spin" />
                                ) : (
                                  <FaTrash />
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

          <div className="subject-card">
            <div className="subject-card-header info">
              <div className="header-left">
                <h5>
                  {t?.subjectManagement?.subjectsFor || "Subjects for"}{" "}
                  {selectedClass
                    ? `${selectedClass.className} ${selectedClass.arm}`
                    : t?.subjectManagement?.selectedClass || "Selected Class"}
                </h5>
              </div>
              <select
                className="class-select"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">{t?.common?.select || "Select Class"}</option>
                {classOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.className} {c.arm}
                  </option>
                ))}
              </select>
            </div>

            <div className="subject-card-body">
              {!selectedClass ? (
                <div className="empty-state">
                  {t?.subjectManagement?.selectClassFirst ||
                    "Select a class and arm first."}
                </div>
              ) : classSubjects.length === 0 ? (
                <div className="empty-state">
                  {t?.subjectManagement?.noSubjectsAssigned ||
                    "No subjects assigned to this class arm yet."}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="subject-table striped">
                    <thead>
                      <tr>
                        <th>{t?.subjectManagement?.class || "Class"}</th>
                        <th>{t?.subjectManagement?.arm || "Arm"}</th>
                        <th>{t?.subjectManagement?.subject || "Subject"}</th>
                        <th>{t?.subjectManagement?.code || "Code"}</th>
                        <th className="text-end">
                          {t?.common?.actions || "Actions"}
                        </th>
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
                              className="btn-icon delete"
                              onClick={() =>
                                handleRemoveFromClass(
                                  item.className,
                                  item.classArm,
                                  item.subjectId,
                                )
                              }
                              title={t?.common?.remove || "Remove"}
                            >
                              <FaTrash />
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

          <div className="subject-card">
            <div className="subject-card-header secondary">
              <h5>
                <FaUserTie className="me-2" />
                {t?.subjectManagement?.teacherAssignments ||
                  "Selected Teacher Assignments"}
              </h5>
            </div>

            <div className="subject-card-body">
              {!teacherAssignData.teacherId ? (
                <div className="empty-state">
                  {t?.subjectManagement?.selectTeacherToView ||
                    "Select a teacher to view subject assignments."}
                </div>
              ) : teacherAssignments.length === 0 ? (
                <div className="empty-state warning">
                  {t?.subjectManagement?.noTeacherAssignments ||
                    "No subject assignments found for this teacher."}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="subject-table striped">
                    <thead>
                      <tr>
                        <th>{t?.subjectManagement?.teacher || "Teacher"}</th>
                        <th>{t?.subjectManagement?.subject || "Subject"}</th>
                        <th>{t?.subjectManagement?.class || "Class"}</th>
                        <th>{t?.subjectManagement?.arm || "Arm"}</th>
                        <th className="text-end">
                          {t?.common?.actions || "Actions"}
                        </th>
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
                              className="btn-icon delete"
                              onClick={() =>
                                handleRemoveTeacherAssignment(item.id)
                              }
                              title={t?.common?.remove || "Remove"}
                            >
                              <FaTrash />
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
    </div>
  );
}

export default SubjectManagement;

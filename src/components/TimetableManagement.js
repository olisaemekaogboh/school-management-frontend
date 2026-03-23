// src/components/TimetableManagement.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  timetableAPI,
  classAPI,
  teacherAPI,
  sessionAPI,
  parentPortalAPI,
} from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import {
  FaCalendarAlt,
  FaPlus,
  FaSave,
  FaTrash,
  FaCheckCircle,
  FaSpinner,
  FaSyncAlt,
  FaEdit,
  FaUser,
  FaBook,
  FaClock,
  FaDoorOpen,
} from "react-icons/fa";
import useActiveSession from "../hooks/useActiveSession";

const empty = {
  classId: "",
  teacherId: "",
  subject: "",
  dayOfWeek: "MONDAY",
  startTime: "09:00",
  endTime: "10:00",
  room: "",
};

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const TERMS_ENUM = ["FIRST", "SECOND", "THIRD"];

const buildName = (...parts) =>
  parts
    .filter(
      (part) => part !== undefined && part !== null && `${part}`.trim() !== "",
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

export default function TimetableManagement() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();
  const initializedRef = useRef(false);

  const isAdmin = user?.role === "ADMIN";
  const isTeacher = user?.role === "TEACHER";
  const isParent = user?.role === "PARENT";
  const isStudent = user?.role === "STUDENT";

  const {
    session,
    term,
    setSession,
    setTerm,
    loadingSession,
    refreshActiveSession,
  } = useActiveSession("FIRST");

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [parentWards, setParentWards] = useState([]);
  const [teacherSubjectAssignments, setTeacherSubjectAssignments] = useState(
    [],
  );
  const [teacherAssignedSubjectIds, setTeacherAssignedSubjectIds] = useState(
    new Set(),
  );

  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const [mode, setMode] = useState("class");
  const [viewClassId, setViewClassId] = useState("");
  const [viewTeacherId, setViewTeacherId] = useState("");
  const [selectedWardId, setSelectedWardId] = useState("");

  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const getSessionLabel = (s) =>
    s?.sessionName || s?.session || s?.name || s?.label || "";

  const classMap = useMemo(() => {
    const map = new Map();
    classes.forEach((c) => {
      map.set(Number(c.id), `${c.className || ""} ${c.arm || ""}`.trim());
    });
    return map;
  }, [classes]);

  const teacherMap = useMemo(() => {
    const map = new Map();
    teachers.forEach((t) => {
      map.set(
        Number(t.id),
        t.fullName || buildName(t.firstName, t.lastName) || `Teacher #${t.id}`,
      );
    });
    return map;
  }, [teachers]);

  // Load teacher's subject assignments
  const loadTeacherSubjects = async () => {
    if (!isTeacher) return;
    try {
      const response = await teacherAPI.getMySubjectAssignments();
      const assignments = Array.isArray(response.data) ? response.data : [];
      setTeacherSubjectAssignments(assignments);

      // Create a set of subject IDs the teacher is assigned to teach
      const subjectIds = new Set();
      assignments.forEach((assignment) => {
        if (assignment.subjectId) {
          subjectIds.add(Number(assignment.subjectId));
        }
      });
      setTeacherAssignedSubjectIds(subjectIds);
    } catch (error) {
      console.error("Error loading teacher subject assignments:", error);
      setTeacherSubjectAssignments([]);
      setTeacherAssignedSubjectIds(new Set());
    }
  };

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await sessionAPI.getAllSessions();
      const list = Array.isArray(response.data) ? response.data : [];
      setAvailableSessions(list);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setAvailableSessions([]);
      toast.error(
        t?.timetableManagement?.loadFailed || "Failed to load sessions",
      );
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadRefs = async () => {
    try {
      if (isAdmin) {
        const [cRes, tRes] = await Promise.all([
          classAPI.getAllClasses(),
          teacherAPI.getAllTeachers(),
        ]);

        setClasses(Array.isArray(cRes.data) ? cRes.data : []);
        setTeachers(Array.isArray(tRes.data) ? tRes.data : []);
        return;
      }

      if (isParent) {
        const response = await parentPortalAPI.getMyWards();
        const wards = Array.isArray(response.data) ? response.data : [];
        setParentWards(wards);
        if (wards.length === 1) {
          setSelectedWardId(String(wards[0].id));
        }
        return;
      }

      if (isTeacher) {
        await loadTeacherSubjects();
      }

      setClasses([]);
      setTeachers([]);
      setParentWards([]);
    } catch (error) {
      console.error("Error loading refs:", error);
      setClasses([]);
      setTeachers([]);
      setParentWards([]);
      toast.error(
        error?.response?.data?.message ||
          t?.timetableManagement?.loadRefsFailed ||
          "Failed to load timetable references",
      );
    }
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    fetchSessions();
    loadRefs();
  }, []);

  useEffect(() => {
    if (!session && availableSessions.length > 0) {
      const active =
        availableSessions.find(
          (s) => s.active === true || s.isActive === true,
        ) || availableSessions[0];

      const sessionName = getSessionLabel(active);
      const currentTerm =
        active?.currentTerm || active?.term || active?.activeTerm || "FIRST";

      if (sessionName) {
        setSession(sessionName);
      }

      if (TERMS_ENUM.includes(currentTerm)) {
        setTerm(currentTerm);
      }
    }
  }, [availableSessions, session, setSession, setTerm]);

  const normalizeEntries = (rows) => {
    const list = Array.isArray(rows) ? rows : [];

    return list.map((entry) => {
      const schoolClassId = Number(
        entry.schoolClassId ?? entry.classId ?? entry.school_class_id ?? 0,
      );
      const teacherId = Number(entry.teacherId ?? entry.teacher_id ?? 0);

      const className =
        entry.className ||
        entry.studentClass ||
        entry.schoolClassName ||
        classMap.get(schoolClassId) ||
        (schoolClassId ? `Class #${schoolClassId}` : "N/A");

      const teacherName =
        entry.teacherName ||
        entry.fullTeacherName ||
        entry.staffName ||
        teacherMap.get(teacherId) ||
        (teacherId ? `Teacher #${teacherId}` : "N/A");

      return {
        ...entry,
        schoolClassId,
        teacherId,
        className,
        teacherName,
        classArm: entry.classArm || entry.arm || "",
      };
    });
  };

  const loadTimetable = async () => {
    if (!session || !term) {
      setEntries([]);
      return;
    }

    setLoading(true);
    try {
      let res;

      if (isTeacher) {
        res = await timetableAPI.getMyTimetable(session, term);
        const allEntries = Array.isArray(res.data) ? res.data : [];

        // Filter timetable entries to only show subjects the teacher is assigned to teach
        const filteredEntries = allEntries.filter((entry) => {
          // If entry has subjectId, check if teacher is assigned to that subject
          if (entry.subjectId) {
            return teacherAssignedSubjectIds.has(Number(entry.subjectId));
          }
          // If no subjectId, check by subject name against teacher's assigned subjects
          if (entry.subject) {
            return teacherSubjectAssignments.some(
              (assignment) =>
                assignment.subjectName?.toLowerCase() ===
                entry.subject?.toLowerCase(),
            );
          }
          return false;
        });

        setEntries(normalizeEntries(filteredEntries));
      } else if (isStudent) {
        res = await timetableAPI.getMyStudentTimetable(session, term);
        setEntries(normalizeEntries(res.data));
      } else if (isParent) {
        if (!selectedWardId) {
          setEntries([]);
          setLoading(false);
          return;
        }
        res = await timetableAPI.getWardTimetable(
          selectedWardId,
          session,
          term,
        );
        setEntries(normalizeEntries(res.data));
      } else if (mode === "class") {
        if (!viewClassId) {
          setEntries([]);
          setLoading(false);
          return;
        }
        res = await timetableAPI.getClassTimetable(viewClassId, session, term);
        setEntries(normalizeEntries(res.data));
      } else if (mode === "teacher") {
        if (!viewTeacherId) {
          setEntries([]);
          setLoading(false);
          return;
        }
        res = await timetableAPI.getTeacherTimetable(
          viewTeacherId,
          session,
          term,
        );
        setEntries(normalizeEntries(res.data));
      } else {
        res = await timetableAPI.getSchoolTimetable(session, term);
        setEntries(normalizeEntries(res.data));
      }
    } catch (error) {
      console.error("Error loading timetable:", error);
      toast.error(
        error?.response?.data?.message ||
          t?.timetableManagement?.loadFailed ||
          "Failed to load timetable",
      );
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [
    session,
    term,
    mode,
    viewClassId,
    viewTeacherId,
    selectedWardId,
    teacherAssignedSubjectIds,
  ]);

  const startCreate = () => {
    setEditingId(null);
    setForm(empty);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setForm({
      classId: entry.schoolClassId || entry.classId || "",
      teacherId: entry.teacherId || "",
      subject: entry.subject || "",
      dayOfWeek: entry.dayOfWeek || "MONDAY",
      startTime: entry.startTime || "09:00",
      endTime: entry.endTime || "10:00",
      room: entry.room || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const checkAvailability = async () => {
    if (!isAdmin) {
      toast.error(
        t?.timetableManagement?.adminOnly ||
          "Only admin can check teacher availability here",
      );
      return;
    }

    if (!session || !term) {
      toast.error(
        t?.timetableManagement?.selectSessionTerm ||
          "Select session and term first",
      );
      return;
    }

    if (!form.teacherId) {
      toast.error(
        t?.timetableManagement?.selectTeacherFirst || "Select teacher first",
      );
      return;
    }

    setCheckingAvailability(true);
    try {
      const res = await timetableAPI.checkAvailability({
        teacherId: form.teacherId,
        day: form.dayOfWeek,
        session,
        term,
        startTime: form.startTime,
        endTime: form.endTime,
      });

      if (res.data === true) {
        toast.success(
          t?.timetableManagement?.teacherAvailable || "Teacher is available",
        );
      } else {
        toast.error(
          t?.timetableManagement?.teacherConflict ||
            "Teacher has a conflict at this time",
        );
      }
    } catch (error) {
      console.error("Availability check error:", error);
      toast.error(
        error?.response?.data?.message ||
          t?.timetableManagement?.availabilityCheckFailed ||
          "Availability check failed",
      );
    } finally {
      setCheckingAvailability(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      toast.error(
        t?.timetableManagement?.adminOnlyCreate ||
          "Only admin can create or edit timetable entries",
      );
      return;
    }

    if (!session) {
      toast.error(
        t?.timetableManagement?.selectSessionFirst ||
          "Please select a session first",
      );
      return;
    }

    if (!TERMS_ENUM.includes(term)) {
      toast.error(
        t?.timetableManagement?.invalidTerm || "Invalid term selected",
      );
      return;
    }

    if (!form.classId) {
      toast.error(
        t?.timetableManagement?.selectClass || "Please select a class",
      );
      return;
    }

    if (!form.teacherId) {
      toast.error(
        t?.timetableManagement?.selectTeacher || "Please select a teacher",
      );
      return;
    }

    if (!form.subject.trim()) {
      toast.error(
        t?.timetableManagement?.subjectRequired || "Subject is required",
      );
      return;
    }

    const payload = {
      schoolClassId: Number(form.classId),
      teacherId: Number(form.teacherId),
      subject: form.subject.trim(),
      dayOfWeek: form.dayOfWeek,
      startTime: form.startTime,
      endTime: form.endTime,
      room: form.room || null,
      session,
      term,
    };

    setLoading(true);
    try {
      if (editingId) {
        await timetableAPI.updateTimetableEntry(editingId, payload);
        toast.success(
          t?.timetableManagement?.updateSuccess ||
            "Timetable entry updated successfully",
        );
      } else {
        await timetableAPI.createTimetableEntry(payload);
        toast.success(
          t?.timetableManagement?.createSuccess ||
            "Timetable entry created successfully",
        );
      }

      startCreate();
      await loadTimetable();
    } catch (err) {
      console.error("Save error:", err);
      toast.error(
        err?.response?.data?.message ||
          t?.timetableManagement?.saveFailed ||
          "Failed to save timetable entry",
      );
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!isAdmin) {
      toast.error(
        t?.timetableManagement?.adminOnlyDelete ||
          "Only admin can delete timetable entries",
      );
      return;
    }

    if (
      !window.confirm(
        t?.timetableManagement?.confirmDelete ||
          "Are you sure you want to delete this timetable entry?",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await timetableAPI.deleteTimetableEntry(id);
      toast.success(
        t?.timetableManagement?.deleteSuccess ||
          "Timetable entry deleted successfully",
      );
      await loadTimetable();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error?.response?.data?.message ||
          t?.timetableManagement?.deleteFailed ||
          "Failed to delete entry",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingSession || sessionsLoading) {
    return (
      <div className="text-center py-5">
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">{t?.common?.loading || "Loading session..."}</p>
      </div>
    );
  }

  return (
    <div
      className={`timetable-management ${darkMode ? "dark-mode" : ""} container-fluid py-4`}
    >
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="mb-1">
            <FaCalendarAlt className="me-2 text-primary" />
            {isAdmin
              ? t?.timetableManagement?.title || "Timetable Management"
              : isTeacher
                ? t?.timetableManagement?.myTimetable || "My Timetable"
                : isParent
                  ? t?.timetableManagement?.wardTimetable || "Ward Timetable"
                  : t?.timetableManagement?.myTimetable || "My Timetable"}
          </h2>
          <p className="text-muted mb-0">
            {isAdmin
              ? t?.timetableManagement?.description ||
                "Create and manage class schedules"
              : isTeacher
                ? t?.timetableManagement?.myDescription ||
                  "View your teaching schedule (only subjects you teach)"
                : isParent
                  ? t?.timetableManagement?.wardDescription ||
                    "View timetable for your ward"
                  : t?.timetableManagement?.studentDescription ||
                    "View your class timetable"}
          </p>
          {isTeacher && teacherAssignedSubjectIds.size > 0 && (
            <small className="text-success d-block mt-1">
              <FaCheckCircle className="me-1" />
              Showing timetable for {teacherAssignedSubjectIds.size} subject(s)
              you teach
            </small>
          )}
        </div>

        <button
          className="btn btn-outline-primary"
          onClick={async () => {
            await refreshActiveSession();
            await fetchSessions();
            await loadRefs();
            await loadTimetable();
          }}
          disabled={loading}
        >
          <FaSyncAlt className={`me-2 ${loading ? "spin" : ""}`} />
          {t?.common?.refresh || "Refresh"}
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className={isParent ? "col-md-4 mb-3" : "col-md-6 mb-3"}>
              <label className="form-label fw-bold">
                {t?.timetableManagement?.academicSession || "Academic Session"}
              </label>
              <select
                className="form-select"
                value={session || ""}
                onChange={(e) => setSession(e.target.value)}
              >
                <option value="">
                  {t?.common?.select || "Select Session..."}
                </option>
                {availableSessions.map((s) => (
                  <option
                    key={s.id || getSessionLabel(s)}
                    value={getSessionLabel(s)}
                  >
                    {getSessionLabel(s)}
                  </option>
                ))}
              </select>
            </div>

            <div className={isParent ? "col-md-4 mb-3" : "col-md-6 mb-3"}>
              <label className="form-label fw-bold">
                {t?.timetableManagement?.term || "Term"}
              </label>
              <select
                className="form-select"
                value={term || "FIRST"}
                onChange={(e) => setTerm(e.target.value)}
              >
                {TERMS_ENUM.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {isParent && (
              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold">
                  {t?.timetableManagement?.selectWard || "Select Ward"}
                </label>
                <select
                  className="form-select"
                  value={selectedWardId}
                  onChange={(e) => setSelectedWardId(e.target.value)}
                >
                  <option value="">
                    {t?.common?.select || "Choose ward..."}
                  </option>
                  {parentWards.map((ward) => (
                    <option key={ward.id} value={ward.id}>
                      {(
                        ward.fullName ||
                        `${ward.firstName || ""} ${ward.lastName || ""}`
                      ).trim()}{" "}
                      ({ward.studentClass || "-"} {ward.classArm || ""})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="text-muted small">
            {t?.timetableManagement?.activeSession || "Active Session"}:{" "}
            <strong>{session || "None"}</strong> |{" "}
            {t?.timetableManagement?.term || "Term"}:{" "}
            <strong>{term || "None"}</strong>
          </div>
        </div>
      </div>

      {isAdmin && (
        <>
          <div className="card mb-4">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                {editingId
                  ? t?.timetableManagement?.editEntry || "Edit Timetable Entry"
                  : t?.timetableManagement?.createEntry ||
                    "Create New Timetable Entry"}
              </h5>
              <button className="btn btn-light btn-sm" onClick={startCreate}>
                <FaPlus className="me-1" />
                {t?.timetableManagement?.newEntry || "New Entry"}
              </button>
            </div>

            <div className="card-body">
              <form onSubmit={save}>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">
                      {t?.timetableManagement?.classLabel || "Class"} *
                    </label>
                    <select
                      className="form-select"
                      value={form.classId}
                      onChange={(e) =>
                        setForm({ ...form, classId: e.target.value })
                      }
                      required
                    >
                      <option value="">
                        {t?.common?.select || "Select Class..."}
                      </option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.className} {c.arm || ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">
                      {t?.timetableManagement?.teacherLabel || "Teacher"} *
                    </label>
                    <select
                      className="form-select"
                      value={form.teacherId}
                      onChange={(e) =>
                        setForm({ ...form, teacherId: e.target.value })
                      }
                      required
                    >
                      <option value="">
                        {t?.common?.select || "Select Teacher..."}
                      </option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName || buildName(t.firstName, t.lastName)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">
                      {t?.timetableManagement?.subjectLabel || "Subject"} *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.subject}
                      onChange={(e) =>
                        setForm({ ...form, subject: e.target.value })
                      }
                      placeholder="e.g. Mathematics"
                      required
                    />
                  </div>

                  <div className="col-md-3 mb-3">
                    <label className="form-label fw-bold">
                      {t?.timetableManagement?.day || "Day"} *
                    </label>
                    <select
                      className="form-select"
                      value={form.dayOfWeek}
                      onChange={(e) =>
                        setForm({ ...form, dayOfWeek: e.target.value })
                      }
                      required
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-2 mb-3">
                    <label className="form-label fw-bold">
                      {t?.timetableManagement?.startTime || "Start Time"} *
                    </label>
                    <input
                      type="time"
                      className="form-control"
                      value={form.startTime}
                      onChange={(e) =>
                        setForm({ ...form, startTime: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="col-md-2 mb-3">
                    <label className="form-label fw-bold">
                      {t?.timetableManagement?.endTime || "End Time"} *
                    </label>
                    <input
                      type="time"
                      className="form-control"
                      value={form.endTime}
                      onChange={(e) =>
                        setForm({ ...form, endTime: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="col-md-2 mb-3">
                    <label className="form-label fw-bold">
                      {t?.timetableManagement?.room || "Room"}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.room}
                      onChange={(e) =>
                        setForm({ ...form, room: e.target.value })
                      }
                      placeholder="e.g. Hall A"
                    />
                  </div>

                  <div className="col-md-3 mb-3 d-flex align-items-end">
                    <button
                      type="button"
                      className="btn btn-outline-info w-100"
                      onClick={checkAvailability}
                      disabled={checkingAvailability || !form.teacherId}
                    >
                      {checkingAvailability ? (
                        <>
                          <FaSpinner className="spin me-2" />{" "}
                          {t?.common?.checking || "Checking..."}
                        </>
                      ) : (
                        <>
                          <FaCheckCircle className="me-2" />{" "}
                          {t?.timetableManagement?.checkAvailability ||
                            "Check Availability"}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="d-flex gap-2 mt-3">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="spin me-2" />{" "}
                        {t?.common?.saving || "Saving..."}
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />{" "}
                        {editingId
                          ? t?.common?.update || "Update Entry"
                          : t?.timetableManagement?.saveEntry || "Save Entry"}
                      </>
                    )}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={startCreate}
                    >
                      {t?.timetableManagement?.cancelEdit || "Cancel Edit"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                {t?.timetableManagement?.viewMode || "View Timetable"}
              </h5>
            </div>
            <div className="card-body">
              <div className="row align-items-end">
                <div className="col-md-3 mb-2">
                  <label className="form-label fw-bold">
                    {t?.timetableManagement?.viewMode || "View Mode"}
                  </label>
                  <select
                    className="form-select"
                    value={mode}
                    onChange={(e) => {
                      setMode(e.target.value);
                      setViewClassId("");
                      setViewTeacherId("");
                    }}
                  >
                    <option value="class">
                      {t?.timetableManagement?.byClass || "By Class"}
                    </option>
                    <option value="teacher">
                      {t?.timetableManagement?.byTeacher || "By Teacher"}
                    </option>
                    <option value="school">
                      {t?.timetableManagement?.wholeSchool || "Whole School"}
                    </option>
                  </select>
                </div>

                {mode === "class" && (
                  <div className="col-md-4 mb-2">
                    <label className="form-label fw-bold">
                      {t?.timetableManagement?.selectClass || "Select Class"}
                    </label>
                    <select
                      className="form-select"
                      value={viewClassId}
                      onChange={(e) => setViewClassId(e.target.value)}
                    >
                      <option value="">
                        {t?.common?.select || "Choose a class..."}
                      </option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.className} {c.arm || ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {mode === "teacher" && (
                  <div className="col-md-4 mb-2">
                    <label className="form-label fw-bold">
                      {t?.timetableManagement?.selectTeacher ||
                        "Select Teacher"}
                    </label>
                    <select
                      className="form-select"
                      value={viewTeacherId}
                      onChange={(e) => setViewTeacherId(e.target.value)}
                    >
                      <option value="">
                        {t?.common?.select || "Choose a teacher..."}
                      </option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName || buildName(t.firstName, t.lastName)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="col-md-2 mb-2">
                  <button
                    className="btn btn-primary w-100"
                    onClick={loadTimetable}
                    disabled={loading}
                  >
                    <FaSyncAlt className={`me-2 ${loading ? "spin" : ""}`} />{" "}
                    {t?.timetableManagement?.load || "Load"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="card">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">
            {isTeacher
              ? t?.timetableManagement?.myTimetable ||
                "My Timetable (Only Subjects I Teach)"
              : isStudent
                ? t?.timetableManagement?.myTimetable || "My Timetable"
                : isParent
                  ? t?.timetableManagement?.wardTimetable || "Ward Timetable"
                  : mode === "class" && viewClassId
                    ? `${t?.timetableManagement?.timetableFor || "Timetable for"} ${classMap.get(Number(viewClassId)) || "Selected Class"}`
                    : mode === "teacher" && viewTeacherId
                      ? `${t?.timetableManagement?.timetableFor || "Timetable for"} ${teacherMap.get(Number(viewTeacherId)) || "Selected Teacher"}`
                      : mode === "school"
                        ? t?.timetableManagement?.wholeSchoolTimetable ||
                          "School-Wide Timetable"
                        : t?.timetableManagement?.entries ||
                          "Timetable Entries"}
          </h5>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">
                {t?.common?.loading || "Loading timetable..."}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>{t?.timetableManagement?.day || "Day"}</th>
                    <th>{t?.timetableManagement?.time || "Time"}</th>
                    <th>{t?.timetableManagement?.classLabel || "Class"}</th>
                    <th>{t?.timetableManagement?.teacherLabel || "Teacher"}</th>
                    <th>{t?.timetableManagement?.subjectLabel || "Subject"}</th>
                    <th>{t?.timetableManagement?.room || "Room"}</th>
                    {isAdmin && <th>{t?.common?.actions || "Actions"}</th>}
                  </tr>
                </thead>
                <tbody>
                  {entries.length > 0 ? (
                    entries.map((entry, index) => (
                      <tr key={entry.id}>
                        <td>{index + 1}</td>
                        <td>
                          <span className="badge bg-primary">
                            {entry.dayOfWeek}
                          </span>
                        </td>
                        <td>
                          {entry.startTime} - {entry.endTime}
                        </td>
                        <td>
                          <strong>
                            {entry.className}
                            {entry.classArm ? ` ${entry.classArm}` : ""}
                          </strong>
                        </td>
                        <td>{entry.teacherName}</td>
                        <td>
                          <span className="fw-bold">{entry.subject}</span>
                        </td>
                        <td>
                          {entry.room ? (
                            <span className="badge bg-secondary">
                              {entry.room}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => startEdit(entry)}
                                title={t?.common?.edit || "Edit"}
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => remove(entry.id)}
                                title={t?.common?.delete || "Delete"}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={isAdmin ? 8 : 7}
                        className="text-center py-5"
                      >
                        <p className="text-muted mb-0">
                          {!session
                            ? t?.timetableManagement?.selectSessionFirst ||
                              "Please select a session and term above"
                            : isParent && !selectedWardId
                              ? t?.timetableManagement?.selectWardFirst ||
                                "Please select a ward to view timetable"
                              : isAdmin && mode === "class" && !viewClassId
                                ? t?.timetableManagement?.selectClassFirst ||
                                  "Please select a class to view its timetable"
                                : isAdmin &&
                                    mode === "teacher" &&
                                    !viewTeacherId
                                  ? t?.timetableManagement
                                      ?.selectTeacherFirst ||
                                    "Please select a teacher to view their timetable"
                                  : isTeacher
                                    ? t?.timetableManagement
                                        ?.noTeacherEntries ||
                                      "No timetable entries found for your assigned subjects"
                                    : t?.timetableManagement?.noEntries ||
                                      "No timetable entries found for the selected criteria"}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

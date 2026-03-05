import React, { useEffect, useState } from "react";
import { timetableAPI, classAPI, teacherAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaCalendarAlt,
  FaPlus,
  FaSave,
  FaTrash,
  FaCheckCircle,
} from "react-icons/fa";
import SessionTermBar from "./SessionTermBar";

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
const TERMS_ENUM = ["FIRST", "SECOND", "THIRD"]; // must match backend Timetable.Term

export default function TimetableManagement() {
  const [active, setActive] = useState({ session: "", term: "FIRST" });

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const [mode, setMode] = useState("class"); // class | teacher | school
  const [viewClassId, setViewClassId] = useState("");
  const [viewTeacherId, setViewTeacherId] = useState("");

  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);

  const loadRefs = async () => {
    try {
      const [cRes, tRes] = await Promise.all([
        classAPI.getAllClasses(),
        teacherAPI.getAllTeachers(),
      ]);
      setClasses(cRes.data || []);
      setTeachers(tRes.data || []);
    } catch {
      toast.error("Failed to load classes/teachers");
    }
  };

  useEffect(() => {
    loadRefs();
  }, []);

  const loadTimetable = async () => {
    if (!active.session || !active.term) {
      setEntries([]);
      return;
    }

    setLoading(true);
    try {
      let res;
      if (mode === "class") {
        if (!viewClassId) return setEntries([]);
        res = await timetableAPI.getClassTimetable(
          viewClassId,
          active.session,
          active.term,
        );
      } else if (mode === "teacher") {
        if (!viewTeacherId) return setEntries([]);
        res = await timetableAPI.getTeacherTimetable(
          viewTeacherId,
          active.session,
          active.term,
        );
      } else {
        res = await timetableAPI.getSchoolTimetable(
          active.session,
          active.term,
        );
      }
      setEntries(res.data || []);
    } catch {
      toast.error("Failed to load timetable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
    // eslint-disable-next-line
  }, [active.session, active.term, mode, viewClassId, viewTeacherId]);

  const startCreate = () => {
    setEditingId(null);
    setForm(empty);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEdit = (e) => {
    setEditingId(e.id);
    setForm({
      classId: e.classId,
      teacherId: e.teacherId,
      subject: e.subject,
      dayOfWeek: e.dayOfWeek,
      startTime: e.startTime,
      endTime: e.endTime,
      room: e.room || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const checkAvailability = async () => {
    if (!form.teacherId) return toast.error("Select teacher first");
    try {
      const res = await timetableAPI.checkAvailability({
        teacherId: form.teacherId,
        day: form.dayOfWeek,
        session: active.session,
        term: active.term,
        startTime: form.startTime,
        endTime: form.endTime,
      });
      if (res.data === true) toast.success("Teacher is available ✅");
      else toast.error("Teacher has a conflict ❌");
    } catch {
      toast.error("Availability check failed");
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!active.session) return toast.error("Set active session first");
    if (!TERMS_ENUM.includes(active.term)) return toast.error("Invalid term");

    if (!form.classId || !form.teacherId || !form.subject.trim()) {
      toast.error("Class, Teacher and Subject are required");
      return;
    }

    const payload = {
      classId: Number(form.classId),
      teacherId: Number(form.teacherId),
      subject: form.subject.trim(),
      dayOfWeek: form.dayOfWeek,
      startTime: form.startTime,
      endTime: form.endTime,
      room: form.room || null,
      session: active.session,
      term: active.term,
      active: true,
    };

    try {
      if (editingId) {
        await timetableAPI.updateTimetableEntry(editingId, payload);
        toast.success("Entry updated");
      } else {
        await timetableAPI.createTimetableEntry(payload);
        toast.success("Entry created");
      }
      startCreate();
      await loadTimetable();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this timetable entry?")) return;
    try {
      await timetableAPI.deleteTimetableEntry(id);
      toast.success("Deleted");
      await loadTimetable();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="content-wrapper earth-pattern">
      <div className="hero-section p-4">
        <h2 className="mb-2">
          <FaCalendarAlt className="me-2" />
          Timetable
        </h2>
        <p className="mb-0">
          Create timetable entries and view by class/teacher/school.
        </p>
      </div>

      <SessionTermBar onChange={setActive} />

      {/* Create/Edit */}
      <div className="form-container mt-3 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">{editingId ? "Edit Entry" : "Create Entry"}</h4>
          <button
            className="btn-outline-nigerian"
            type="button"
            onClick={startCreate}
          >
            <FaPlus className="me-2" />
            New
          </button>
        </div>

        <form onSubmit={save}>
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Class *</label>
              <select
                className="form-select"
                value={form.classId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, classId: e.target.value }))
                }
              >
                <option value="">Select class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} - {c.className}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Teacher *</label>
              <select
                className="form-select"
                value={form.teacherId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, teacherId: e.target.value }))
                }
              >
                <option value="">Select teacher...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.id} -{" "}
                    {t.fullName || `${t.firstName || ""} ${t.lastName || ""}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Subject *</label>
              <input
                className="form-control"
                value={form.subject}
                onChange={(e) =>
                  setForm((p) => ({ ...p, subject: e.target.value }))
                }
                placeholder="e.g. Mathematics"
              />
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">Day</label>
              <select
                className="form-select"
                value={form.dayOfWeek}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dayOfWeek: e.target.value }))
                }
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">Start</label>
              <input
                type="time"
                className="form-control"
                value={form.startTime}
                onChange={(e) =>
                  setForm((p) => ({ ...p, startTime: e.target.value }))
                }
              />
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">End</label>
              <input
                type="time"
                className="form-control"
                value={form.endTime}
                onChange={(e) =>
                  setForm((p) => ({ ...p, endTime: e.target.value }))
                }
              />
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">Room</label>
              <input
                className="form-control"
                value={form.room}
                onChange={(e) =>
                  setForm((p) => ({ ...p, room: e.target.value }))
                }
                placeholder="e.g. SS2 Room"
              />
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button className="btn-nigerian" type="submit">
              <FaSave className="me-2" />
              {editingId ? "Update" : "Save"}
            </button>

            <button
              className="btn-outline-nigerian"
              type="button"
              onClick={checkAvailability}
            >
              <FaCheckCircle className="me-2" />
              Check Teacher Availability
            </button>
          </div>
        </form>
      </div>

      {/* View controls */}
      <div className="form-container mb-3">
        <div className="row align-items-end">
          <div className="col-md-3 mb-2">
            <label className="form-label">View Mode</label>
            <select
              className="form-select"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="class">By Class</option>
              <option value="teacher">By Teacher</option>
              <option value="school">Whole School</option>
            </select>
          </div>

          {mode === "class" && (
            <div className="col-md-5 mb-2">
              <label className="form-label">Select Class</label>
              <select
                className="form-select"
                value={viewClassId}
                onChange={(e) => setViewClassId(e.target.value)}
              >
                <option value="">Select class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.className}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "teacher" && (
            <div className="col-md-5 mb-2">
              <label className="form-label">Select Teacher</label>
              <select
                className="form-select"
                value={viewTeacherId}
                onChange={(e) => setViewTeacherId(e.target.value)}
              >
                <option value="">Select teacher...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName || `${t.firstName || ""} ${t.lastName || ""}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="col-md-4 mb-2">
            <button
              className="btn-outline-nigerian w-100"
              type="button"
              onClick={loadTimetable}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <h4 className="mb-3">Timetable Entries</h4>

        {loading ? (
          <div className="spinner-container">
            <div className="spinner-border-nigerian" />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Class</th>
                  <th>Teacher</th>
                  <th>Subject</th>
                  <th>Room</th>
                  <th style={{ width: 200 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td>{e.dayOfWeek}</td>
                    <td>
                      {e.startTime} - {e.endTime}
                    </td>
                    <td>{e.className || `#${e.classId}`}</td>
                    <td>{e.teacherName || `#${e.teacherId}`}</td>
                    <td>
                      <b>{e.subject}</b>
                    </td>
                    <td>{e.room || "-"}</td>
                    <td className="d-flex flex-wrap gap-2">
                      <button
                        className="btn-outline-nigerian"
                        type="button"
                        onClick={() => startEdit(e)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-nigerian"
                        type="button"
                        onClick={() => remove(e.id)}
                      >
                        <FaTrash className="me-1" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {entries.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      No timetable entries found for this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

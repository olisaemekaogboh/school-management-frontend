import React, { useEffect, useState } from "react";
import { libraryAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaCheck,
  FaClock,
  FaExclamationTriangle,
  FaHandHolding,
  FaRedo,
  FaTimes,
} from "react-icons/fa";

const empty = {
  bookId: "",
  studentId: "",
  teacherId: "",
  dueDate: "", // yyyy-mm-dd
};

export default function BorrowingManagement() {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [borrowings, setBorrowings] = useState([]);
  const [filterStudentId, setFilterStudentId] = useState("");
  const [filterTeacherId, setFilterTeacherId] = useState("");

  const load = async () => {
    try {
      setLoading(true);

      // If you have “overdue” endpoint in backend, you can load that too.
      // For now: load by student/teacher if set, else keep empty list.
      if (filterStudentId) {
        const res = await libraryAPI.getBorrowingsByStudent(filterStudentId);
        setBorrowings(res.data || []);
      } else if (filterTeacherId) {
        const res = await libraryAPI.getBorrowingsByTeacher(filterTeacherId);
        setBorrowings(res.data || []);
      } else {
        setBorrowings([]);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [filterStudentId, filterTeacherId]);

  const borrow = async (e) => {
    e.preventDefault();

    const hasStudent = !!form.studentId.trim();
    const hasTeacher = !!form.teacherId.trim();
    if (!form.bookId.trim()) return toast.error("bookId is required");

    if (!hasStudent && !hasTeacher)
      return toast.error("Provide studentId OR teacherId");
    if (hasStudent && hasTeacher)
      return toast.error("Provide only one: studentId OR teacherId");

    try {
      await libraryAPI.borrowBook({
        bookId: Number(form.bookId),
        studentId: hasStudent ? Number(form.studentId) : null,
        teacherId: hasTeacher ? Number(form.teacherId) : null,
        dueDate: form.dueDate || null,
      });

      toast.success("Book borrowed");
      setForm(empty);
      await load();
    } catch (e2) {}
  };

  const action = async (type, id) => {
    try {
      if (type === "return") await libraryAPI.returnBook(id);
      if (type === "renew") await libraryAPI.renewBook(id);
      if (type === "lost") await libraryAPI.reportLost(id);
      toast.success("Updated");
      await load();
    } catch (e) {}
  };

  return (
    <div className="content-wrapper earth-pattern">
      <div className="hero-section p-4">
        <h2 className="mb-2">Borrowing</h2>
        <p className="mb-0">Borrow / return / renew / report lost.</p>
      </div>

      <div className="form-container mb-4">
        <h4 className="mb-3 d-flex align-items-center gap-2">
          <FaHandHolding /> Borrow a Book
        </h4>

        <form onSubmit={borrow}>
          <div className="row">
            <div className="col-md-3 mb-3">
              <label className="form-label">Book ID *</label>
              <input
                className="form-control"
                value={form.bookId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bookId: e.target.value }))
                }
              />
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">Student ID</label>
              <input
                className="form-control"
                value={form.studentId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, studentId: e.target.value }))
                }
              />
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">Teacher ID</label>
              <input
                className="form-control"
                value={form.teacherId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, teacherId: e.target.value }))
                }
              />
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-control"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dueDate: e.target.value }))
                }
              />
            </div>
          </div>

          <button className="btn-nigerian" type="submit">
            <FaCheck className="me-2" />
            Borrow
          </button>
        </form>
      </div>

      <div className="table-container">
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
          <h4 className="mb-0">Borrowing History</h4>

          <div className="d-flex flex-wrap gap-2">
            <input
              className="form-control"
              style={{ maxWidth: 220 }}
              placeholder="Filter by studentId"
              value={filterStudentId}
              onChange={(e) => {
                setFilterTeacherId("");
                setFilterStudentId(e.target.value);
              }}
            />
            <input
              className="form-control"
              style={{ maxWidth: 220 }}
              placeholder="Filter by teacherId"
              value={filterTeacherId}
              onChange={(e) => {
                setFilterStudentId("");
                setFilterTeacherId(e.target.value);
              }}
            />
          </div>
        </div>

        {!filterStudentId && !filterTeacherId && (
          <div className="news-ticker">
            <FaClock className="me-2" />
            Enter a studentId or teacherId to load borrowing records.
          </div>
        )}

        {loading ? (
          <div className="spinner-container">
            <div className="spinner-border-nigerian" />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Borrower</th>
                  <th>Status</th>
                  <th>Borrow Date</th>
                  <th>Due</th>
                  <th>Return</th>
                  <th style={{ width: 240 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {borrowings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.bookTitle || `Book #${b.bookId}`}</td>
                    <td>
                      {b.studentId
                        ? `Student #${b.studentId}`
                        : b.teacherId
                          ? `Teacher #${b.teacherId}`
                          : "-"}
                    </td>
                    <td>
                      {b.status === "LOST" ? (
                        <span className="text-danger">
                          <FaTimes className="me-1" /> LOST
                        </span>
                      ) : (
                        b.status
                      )}
                    </td>
                    <td>{b.borrowDate || "-"}</td>
                    <td>{b.dueDate || "-"}</td>
                    <td>{b.returnDate || "-"}</td>
                    <td className="d-flex flex-wrap gap-2">
                      <button
                        className="btn-outline-nigerian"
                        type="button"
                        onClick={() => action("return", b.id)}
                      >
                        <FaCheck className="me-1" /> Return
                      </button>
                      <button
                        className="btn-outline-nigerian"
                        type="button"
                        onClick={() => action("renew", b.id)}
                      >
                        <FaRedo className="me-1" /> Renew
                      </button>
                      <button
                        className="btn-nigerian"
                        type="button"
                        onClick={() => action("lost", b.id)}
                      >
                        <FaExclamationTriangle className="me-1" /> Lost
                      </button>
                    </td>
                  </tr>
                ))}

                {borrowings.length === 0 &&
                  (filterStudentId || filterTeacherId) && (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        No borrowings found for this filter.
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

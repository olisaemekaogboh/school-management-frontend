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
  FaChartBar,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaSyncAlt,
  FaIdCard,
} from "react-icons/fa";

const empty = {
  bookId: "",
  borrowerType: "student",
  studentAdmissionNumber: "",
  teacherEmployeeId: "",
  dueDate: "",
  remarks: "",
};

export default function BorrowingManagement() {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [borrowings, setBorrowings] = useState([]);
  const [stats, setStats] = useState(null);
  const [mode, setMode] = useState("all");

  const load = async () => {
    try {
      setLoading(true);

      const [statsRes, borrowingsRes] = await Promise.all([
        libraryAPI.getLibraryStatistics(),
        mode === "overdue"
          ? libraryAPI.getOverdueBorrowings()
          : libraryAPI.getAllBorrowings(),
      ]);

      setStats(statsRes.data || null);
      setBorrowings(borrowingsRes.data || []);
    } catch (error) {
      console.error("Error loading library data:", error);
      setStats(null);
      setBorrowings([]);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load library data",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [mode]);

  const handleBorrowerTypeChange = (type) => {
    setForm((prev) => ({
      ...prev,
      borrowerType: type,
      studentAdmissionNumber:
        type === "student" ? prev.studentAdmissionNumber : "",
      teacherEmployeeId: type === "teacher" ? prev.teacherEmployeeId : "",
    }));
  };

  const borrow = async (e) => {
    e.preventDefault();

    const bookId = Number(form.bookId);

    if (!form.bookId.trim()) {
      toast.error("Book ID is required");
      return;
    }

    if (Number.isNaN(bookId) || bookId <= 0) {
      toast.error("Enter a valid Book ID");
      return;
    }

    if (form.borrowerType === "student") {
      if (!form.studentAdmissionNumber.trim()) {
        toast.error("Student admission number is required");
        return;
      }
    }

    if (form.borrowerType === "teacher") {
      if (!form.teacherEmployeeId.trim()) {
        toast.error("Teacher employee ID is required");
        return;
      }
    }

    const payload = {
      bookId,
      studentAdmissionNumber:
        form.borrowerType === "student"
          ? form.studentAdmissionNumber.trim()
          : null,
      teacherEmployeeId:
        form.borrowerType === "teacher" ? form.teacherEmployeeId.trim() : null,
      dueDate: form.dueDate || null,
      remarks: form.remarks?.trim() || null,
    };

    try {
      await libraryAPI.borrowBook(payload);
      toast.success("Book borrowed successfully");
      setForm(empty);
      await load();
    } catch (error) {
      console.error("Borrow error:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to borrow book",
      );
    }
  };

  const action = async (type, id) => {
    try {
      if (type === "return") await libraryAPI.returnBook(id);
      if (type === "renew") await libraryAPI.renewBook(id);
      if (type === "lost") await libraryAPI.reportLost(id);

      toast.success("Updated successfully");
      await load();
    } catch (error) {
      console.error(`Error performing ${type}:`, error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Action failed",
      );
    }
  };

  return (
    <div className="content-wrapper earth-pattern">
      <div className="hero-section p-4">
        <h2 className="mb-2">Borrowing Management</h2>
        <p className="mb-0">
          Track borrowing, returns, renewals and overdue items.
        </p>
      </div>

      {stats && (
        <div className="row mb-4">
          <div className="col-md-2 mb-3">
            <div className="card p-3 text-center">
              <strong>Total Books</strong>
              <h4>{stats.totalBooks || 0}</h4>
            </div>
          </div>

          <div className="col-md-2 mb-3">
            <div className="card p-3 text-center">
              <strong>Total Copies</strong>
              <h4>{stats.totalCopies || 0}</h4>
            </div>
          </div>

          <div className="col-md-2 mb-3">
            <div className="card p-3 text-center">
              <strong>Available</strong>
              <h4>{stats.availableCopies || 0}</h4>
            </div>
          </div>

          <div className="col-md-2 mb-3">
            <div className="card p-3 text-center">
              <strong>Borrowed</strong>
              <h4>{stats.borrowedCount || 0}</h4>
            </div>
          </div>

          <div className="col-md-2 mb-3">
            <div className="card p-3 text-center">
              <strong>Overdue</strong>
              <h4 className="text-danger">{stats.overdueCount || 0}</h4>
            </div>
          </div>

          <div className="col-md-2 mb-3">
            <div className="card p-3 text-center">
              <strong>Lost</strong>
              <h4 className="text-warning">{stats.lostCount || 0}</h4>
            </div>
          </div>
        </div>
      )}

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
                  setForm((prev) => ({ ...prev, bookId: e.target.value }))
                }
                placeholder="Enter book ID"
              />
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">Borrower Type *</label>
              <select
                className="form-select"
                value={form.borrowerType}
                onChange={(e) => handleBorrowerTypeChange(e.target.value)}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            {form.borrowerType === "student" ? (
              <div className="col-md-3 mb-3">
                <label className="form-label">Student Admin No.*</label>
                <input
                  className="form-control"
                  value={form.studentAdmissionNumber}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      studentAdmissionNumber: e.target.value,
                    }))
                  }
                  placeholder="Enter admission number"
                />
              </div>
            ) : (
              <div className="col-md-3 mb-3">
                <label className="form-label">Teacher Employee ID *</label>
                <input
                  className="form-control"
                  value={form.teacherEmployeeId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      teacherEmployeeId: e.target.value,
                    }))
                  }
                  placeholder="Enter employee ID"
                />
              </div>
            )}

            <div className="col-md-3 mb-3">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-control"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dueDate: e.target.value }))
                }
              />
            </div>

            <div className="col-12 mb-3">
              <label className="form-label">Remarks</label>
              <textarea
                className="form-control"
                rows="2"
                value={form.remarks}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, remarks: e.target.value }))
                }
                placeholder="Optional remarks"
              />
            </div>
          </div>

          <button className="btn-nigerian" type="submit">
            <FaCheck className="me-2" />
            Borrow Book
          </button>
        </form>
      </div>

      <div className="table-container">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <FaChartBar /> Borrowing Records
          </h4>

          <div className="d-flex gap-2 flex-wrap">
            <button
              type="button"
              className={
                mode === "all" ? "btn-nigerian" : "btn-outline-nigerian"
              }
              onClick={() => setMode("all")}
            >
              All Records
            </button>

            <button
              type="button"
              className={
                mode === "overdue" ? "btn-nigerian" : "btn-outline-nigerian"
              }
              onClick={() => setMode("overdue")}
            >
              Overdue Only
            </button>

            <button
              type="button"
              className="btn-outline-nigerian"
              onClick={load}
            >
              <FaSyncAlt className="me-2" />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="spinner-container">
            <div
              className="spinner-border spinner-border-nigerian"
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Borrower</th>
                  <th>Identifier</th>
                  <th>Status</th>
                  <th>Borrow Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Remarks</th>
                  <th style={{ width: 240 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {borrowings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.bookTitle || `Book #${b.bookId}`}</td>

                    <td>
                      {b.studentName ? (
                        <span>
                          <FaUserGraduate className="me-1" />
                          {b.studentName}
                        </span>
                      ) : b.teacherName ? (
                        <span>
                          <FaChalkboardTeacher className="me-1" />
                          {b.teacherName}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>
                      {b.studentAdmissionNumber ? (
                        <span>
                          <FaIdCard className="me-1" />
                          {b.studentAdmissionNumber}
                        </span>
                      ) : b.teacherEmployeeId ? (
                        <span>
                          <FaIdCard className="me-1" />
                          {b.teacherEmployeeId}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>
                      {b.status === "LOST" ? (
                        <span className="text-danger">
                          <FaTimes className="me-1" /> LOST
                        </span>
                      ) : b.status === "OVERDUE" ? (
                        <span className="text-warning">
                          <FaExclamationTriangle className="me-1" /> OVERDUE
                        </span>
                      ) : b.status === "RENEWED" ? (
                        <span className="text-info">
                          <FaRedo className="me-1" /> RENEWED
                        </span>
                      ) : b.status === "RETURNED" ? (
                        <span className="text-success">
                          <FaCheck className="me-1" /> RETURNED
                        </span>
                      ) : (
                        <span>
                          <FaClock className="me-1" /> {b.status}
                        </span>
                      )}
                    </td>

                    <td>{b.borrowDate || "-"}</td>
                    <td>{b.dueDate || "-"}</td>
                    <td>{b.returnDate || "-"}</td>
                    <td>{b.remarks || "-"}</td>

                    <td className="d-flex flex-wrap gap-2">
                      <button
                        className="btn-outline-nigerian"
                        type="button"
                        onClick={() => action("return", b.id)}
                        disabled={
                          b.status === "RETURNED" || b.status === "LOST"
                        }
                      >
                        <FaCheck className="me-1" /> Return
                      </button>

                      <button
                        className="btn-outline-nigerian"
                        type="button"
                        onClick={() => action("renew", b.id)}
                        disabled={
                          b.status === "RETURNED" || b.status === "LOST"
                        }
                      >
                        <FaRedo className="me-1" /> Renew
                      </button>

                      <button
                        className="btn-nigerian"
                        type="button"
                        onClick={() => action("lost", b.id)}
                        disabled={
                          b.status === "RETURNED" || b.status === "LOST"
                        }
                      >
                        <FaExclamationTriangle className="me-1" /> Lost
                      </button>
                    </td>
                  </tr>
                ))}

                {borrowings.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      No borrowing records found.
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

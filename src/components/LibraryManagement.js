import React from "react";
import { Link } from "react-router-dom";
import {
  FaBook,
  FaHandHolding,
  FaSearch,
  FaChartBar,
  FaUndoAlt,
  FaExclamationTriangle,
  FaIdCard,
} from "react-icons/fa";

export default function LibraryManagement() {
  return (
    <div className="content-wrapper earth-pattern">
      <div className="hero-section p-4">
        <h2 className="mb-2">Library Management</h2>
        <p className="mb-0">
          Manage books, borrowing, returns, renewals, overdue items and reports.
        </p>
      </div>

      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card school-card h-100">
            <div className="card-header d-flex align-items-center gap-2">
              <FaBook /> Books
            </div>
            <div className="card-body d-flex flex-column">
              <p className="mb-3">
                Create, edit, delete, organize and search library books by
                title, author, ISBN and category.
              </p>

              <div className="small text-muted mb-3">
                <div className="mb-1">
                  <FaSearch className="me-2" />
                  Fast search and stock tracking
                </div>
                <div className="mb-1">
                  <FaChartBar className="me-2" />
                  Better visibility of total and available copies
                </div>
              </div>

              <div className="mt-auto">
                <Link className="btn-nigerian" to="/library/books">
                  Manage Books
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card school-card h-100">
            <div className="card-header d-flex align-items-center gap-2">
              <FaHandHolding /> Borrowing
            </div>
            <div className="card-body d-flex flex-column">
              <p className="mb-3">
                Borrow, return, renew, mark lost books and monitor overdue
                records.
              </p>

              <div className="small text-muted mb-3">
                <div className="mb-1">
                  <FaUndoAlt className="me-2" />
                  Return and renew active borrowings
                </div>
                <div className="mb-1">
                  <FaExclamationTriangle className="me-2" />
                  Track overdue and lost books
                </div>
                <div className="mb-1">
                  <FaIdCard className="me-2" />
                  Borrow with admission number or employee ID
                </div>
              </div>

              <div className="mt-auto">
                <Link className="btn-nigerian" to="/library/borrowings">
                  Manage Borrowings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="news-ticker mt-3">
        <FaSearch className="me-2" />
        Tip: In Borrowing, choose borrower type first, then enter student
        admission number or teacher employee ID before submitting.
      </div>
    </div>
  );
}

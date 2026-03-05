import React from "react";
import { Link } from "react-router-dom";
import { FaBook, FaHandHolding, FaSearch } from "react-icons/fa";

export default function LibraryManagement() {
  return (
    <div className="content-wrapper earth-pattern">
      <div className="hero-section p-4">
        <h2 className="mb-2">Library Management</h2>
        <p className="mb-0">
          Manage books, borrowing, returns, renewals and reports.
        </p>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card school-card">
            <div className="card-header d-flex align-items-center gap-2">
              <FaBook /> Books
            </div>
            <div className="card-body">
              <p className="mb-3">
                Create, update, search and categorize library books.
              </p>
              <Link className="btn-nigerian" to="/library/books">
                Manage Books
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card school-card">
            <div className="card-header d-flex align-items-center gap-2">
              <FaHandHolding /> Borrowing
            </div>
            <div className="card-body">
              <p className="mb-3">
                Borrow / return / renew / lost reports and history.
              </p>
              <Link className="btn-nigerian" to="/library/borrowings">
                Manage Borrowings
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="news-ticker mt-3">
        <FaSearch className="me-2" />
        Tip: Use the search bar in Books to find by title/author/ISBN quickly.
      </div>
    </div>
  );
}

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
import { useLanguage } from "../contexts/LanguageContext";

export default function LibraryManagement() {
  const { t } = useLanguage();

  const ui = {
    title: t?.libraryManagement?.title || "Library Management",
    subtitle:
      t?.libraryManagement?.subtitle ||
      "Manage books, borrowing, returns, renewals, overdue items and reports.",
    books: t?.libraryManagement?.books || "Books",
    booksText:
      t?.libraryManagement?.booksText ||
      "Create, edit, delete, organize and search library books by title, author, ISBN and category.",
    fastSearch:
      t?.libraryManagement?.fastSearch || "Fast search and stock tracking",
    stockVisibility:
      t?.libraryManagement?.stockVisibility ||
      "Better visibility of total and available copies",
    manageBooks: t?.libraryManagement?.manageBooks || "Manage Books",
    borrowing: t?.libraryManagement?.borrowing || "Borrowing",
    borrowingText:
      t?.libraryManagement?.borrowingText ||
      "Borrow, return, renew, mark lost books and monitor overdue records.",
    returnRenew:
      t?.libraryManagement?.returnRenew || "Return and renew active borrowings",
    trackOverdue:
      t?.libraryManagement?.trackOverdue || "Track overdue and lost books",
    borrowerId:
      t?.libraryManagement?.borrowerId ||
      "Borrow with admission number or employee ID",
    manageBorrowings:
      t?.libraryManagement?.manageBorrowings || "Manage Borrowings",
    tip:
      t?.libraryManagement?.tip ||
      "Tip: In Borrowing, choose borrower type first, then enter student admission number or teacher employee ID before submitting.",
  };

  return (
    <div className="content-wrapper earth-pattern">
      <div className="hero-section p-4">
        <h2 className="mb-2">{ui.title}</h2>
        <p className="mb-0">{ui.subtitle}</p>
      </div>

      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card school-card h-100">
            <div className="card-header d-flex align-items-center gap-2">
              <FaBook /> {ui.books}
            </div>
            <div className="card-body d-flex flex-column">
              <p className="mb-3">{ui.booksText}</p>

              <div className="small text-muted mb-3">
                <div className="mb-1">
                  <FaSearch className="me-2" />
                  {ui.fastSearch}
                </div>
                <div className="mb-1">
                  <FaChartBar className="me-2" />
                  {ui.stockVisibility}
                </div>
              </div>

              <div className="mt-auto">
                <Link className="btn-nigerian" to="/library/books">
                  {ui.manageBooks}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card school-card h-100">
            <div className="card-header d-flex align-items-center gap-2">
              <FaHandHolding /> {ui.borrowing}
            </div>
            <div className="card-body d-flex flex-column">
              <p className="mb-3">{ui.borrowingText}</p>

              <div className="small text-muted mb-3">
                <div className="mb-1">
                  <FaUndoAlt className="me-2" />
                  {ui.returnRenew}
                </div>
                <div className="mb-1">
                  <FaExclamationTriangle className="me-2" />
                  {ui.trackOverdue}
                </div>
                <div className="mb-1">
                  <FaIdCard className="me-2" />
                  {ui.borrowerId}
                </div>
              </div>

              <div className="mt-auto">
                <Link className="btn-nigerian" to="/library/borrowings">
                  {ui.manageBorrowings}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="news-ticker mt-3">
        <FaSearch className="me-2" />
        {ui.tip}
      </div>
    </div>
  );
}

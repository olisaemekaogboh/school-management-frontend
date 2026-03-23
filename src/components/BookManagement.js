import React, { useEffect, useMemo, useState } from "react";
import { libraryAPI } from "../services/api";
import { toast } from "react-toastify";
import { FaPlus, FaSave, FaTrash, FaEdit, FaSearch } from "react-icons/fa";
import { useLanguage } from "../contexts/LanguageContext";

const emptyForm = {
  title: "",
  author: "",
  isbn: "",
  publisher: "",
  publicationDate: "",
  edition: "",
  category: "",
  shelfLocation: "",
  description: "",
  totalCopies: 1,
  availableCopies: 1,
};

export default function BookManagement() {
  const { t } = useLanguage();

  const ui = {
    title: t?.bookManagement?.title || "Books",
    subtitle:
      t?.bookManagement?.subtitle || "Manage your library catalogue properly.",
    editBook: t?.bookManagement?.editBook || "Edit Book",
    addBook: t?.bookManagement?.addBook || "Add Book",
    new: t?.bookManagement?.new || "New",
    save: t?.common?.save || "Save",
    update: t?.bookManagement?.update || "Update",
    allBooks: t?.bookManagement?.allBooks || "All Books",
    searchPlaceholder:
      t?.bookManagement?.searchPlaceholder ||
      "Search title, author, ISBN, category...",
    id: t?.bookManagement?.id || "ID",
    titleLabel: t?.bookManagement?.titleLabel || "Title",
    author: t?.bookManagement?.author || "Author",
    isbn: t?.bookManagement?.isbn || "ISBN",
    publisher: t?.bookManagement?.publisher || "Publisher",
    publicationDate: t?.bookManagement?.publicationDate || "Publication Date",
    edition: t?.bookManagement?.edition || "Edition",
    category: t?.bookManagement?.category || "Category",
    shelfLocation: t?.bookManagement?.shelfLocation || "Shelf Location",
    total: t?.bookManagement?.total || "Total",
    available: t?.bookManagement?.available || "Available",
    description: t?.bookManagement?.description || "Description",
    status: t?.bookManagement?.status || "Status",
    actions: t?.bookManagement?.actions || "Actions",
    edit: t?.bookManagement?.edit || "Edit",
    delete: t?.bookManagement?.delete || "Delete",
    noBooksFound: t?.bookManagement?.noBooksFound || "No books found.",
    loading: t?.common?.loading || "Loading...",
    titleRequired: t?.bookManagement?.titleRequired || "Title is required",
    authorRequired: t?.bookManagement?.authorRequired || "Author is required",
    totalNegative:
      t?.bookManagement?.totalNegative || "Total copies cannot be negative",
    availableNegative:
      t?.bookManagement?.availableNegative ||
      "Available copies cannot be negative",
    availableGreater:
      t?.bookManagement?.availableGreater ||
      "Available copies cannot be greater than total copies",
    loadFailed: t?.bookManagement?.loadFailed || "Failed to load books",
    saveFailed: t?.bookManagement?.saveFailed || "Failed to save book",
    deleteFailed: t?.bookManagement?.deleteFailed || "Failed to delete book",
    created: t?.bookManagement?.created || "Book created",
    updated: t?.bookManagement?.updated || "Book updated",
    deleted: t?.bookManagement?.deleted || "Book deleted",
    confirmDelete: t?.bookManagement?.confirmDelete || "Delete this book?",
  };

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return books;
    const q = searchTerm.toLowerCase();

    return books.filter(
      (b) =>
        (b.title || "").toLowerCase().includes(q) ||
        (b.author || "").toLowerCase().includes(q) ||
        (b.isbn || "").toLowerCase().includes(q) ||
        (b.category || "").toLowerCase().includes(q) ||
        (b.publisher || "").toLowerCase().includes(q),
    );
  }, [books, searchTerm]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await libraryAPI.getAllBooks();
      setBooks(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error loading books:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          ui.loadFailed,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEdit = (b) => {
    setEditingId(b.id);
    setForm({
      title: b.title || "",
      author: b.author || "",
      isbn: b.isbn || "",
      publisher: b.publisher || "",
      publicationDate: b.publicationDate || "",
      edition: b.edition || "",
      category: b.category || "",
      shelfLocation: b.shelfLocation || "",
      description: b.description || "",
      totalCopies: b.totalCopies ?? 1,
      availableCopies: b.availableCopies ?? 1,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      totalCopies: Number(form.totalCopies),
      availableCopies: Number(form.availableCopies),
    };

    if (!payload.title.trim()) {
      toast.error(ui.titleRequired);
      return;
    }

    if (!payload.author.trim()) {
      toast.error(ui.authorRequired);
      return;
    }

    if (payload.totalCopies < 0) {
      toast.error(ui.totalNegative);
      return;
    }

    if (payload.availableCopies < 0) {
      toast.error(ui.availableNegative);
      return;
    }

    if (payload.availableCopies > payload.totalCopies) {
      toast.error(ui.availableGreater);
      return;
    }

    try {
      if (editingId) {
        await libraryAPI.updateBook(editingId, payload);
        toast.success(ui.updated);
      } else {
        await libraryAPI.createBook(payload);
        toast.success(ui.created);
      }

      startCreate();
      await load();
    } catch (error) {
      console.error("Error saving book:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          ui.saveFailed,
      );
    }
  };

  const remove = async (id) => {
    if (!window.confirm(ui.confirmDelete)) return;

    try {
      await libraryAPI.deleteBook(id);
      toast.success(ui.deleted);
      await load();
    } catch (error) {
      console.error("Error deleting book:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          ui.deleteFailed,
      );
    }
  };

  return (
    <div className="content-wrapper earth-pattern">
      <div className="hero-section p-4">
        <h2 className="mb-2">{ui.title}</h2>
        <p className="mb-0">{ui.subtitle}</p>
      </div>

      <div className="form-container mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">{editingId ? ui.editBook : ui.addBook}</h4>
          <button
            type="button"
            className="btn-outline-nigerian"
            onClick={startCreate}
          >
            <FaPlus className="me-2" />
            {ui.new}
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">{ui.titleLabel} *</label>
              <input
                className="form-control"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">{ui.author} *</label>
              <input
                className="form-control"
                value={form.author}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, author: e.target.value }))
                }
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">{ui.isbn}</label>
              <input
                className="form-control"
                value={form.isbn}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isbn: e.target.value }))
                }
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">{ui.publisher}</label>
              <input
                className="form-control"
                value={form.publisher}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, publisher: e.target.value }))
                }
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">{ui.publicationDate}</label>
              <input
                type="date"
                className="form-control"
                value={form.publicationDate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    publicationDate: e.target.value,
                  }))
                }
              />
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">{ui.edition}</label>
              <input
                className="form-control"
                value={form.edition}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, edition: e.target.value }))
                }
              />
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">{ui.category}</label>
              <input
                className="form-control"
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, category: e.target.value }))
                }
              />
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">{ui.shelfLocation}</label>
              <input
                className="form-control"
                value={form.shelfLocation}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    shelfLocation: e.target.value,
                  }))
                }
              />
            </div>

            <div className="col-md-1 mb-3">
              <label className="form-label">{ui.total}</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={form.totalCopies}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, totalCopies: e.target.value }))
                }
              />
            </div>

            <div className="col-md-2 mb-3">
              <label className="form-label">{ui.available}</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={form.availableCopies}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    availableCopies: e.target.value,
                  }))
                }
              />
            </div>

            <div className="col-12 mb-3">
              <label className="form-label">{ui.description}</label>
              <textarea
                className="form-control"
                rows="3"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
          </div>

          <button className="btn-nigerian" type="submit">
            <FaSave className="me-2" />
            {editingId ? ui.update : ui.save}
          </button>
        </form>
      </div>

      <div className="table-container">
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
          <h4 className="mb-0">{ui.allBooks}</h4>

          <div className="d-flex gap-2 align-items-center">
            <FaSearch />
            <input
              className="form-control"
              style={{ maxWidth: 320 }}
              placeholder={ui.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="spinner-container">
            <div className="spinner-border-nigerian" />
            <div className="mt-2">{ui.loading}</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>{ui.id}</th>
                  <th>{ui.titleLabel}</th>
                  <th>{ui.author}</th>
                  <th>{ui.isbn}</th>
                  <th>{ui.category}</th>
                  <th>{ui.shelfLocation}</th>
                  <th>{ui.total}</th>
                  <th>{ui.available}</th>
                  <th>{ui.status}</th>
                  <th style={{ width: 160 }}>{ui.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <code>{b.id}</code>
                    </td>
                    <td>{b.title}</td>
                    <td>{b.author}</td>
                    <td>{b.isbn || "-"}</td>
                    <td>{b.category || "-"}</td>
                    <td>{b.shelfLocation || "-"}</td>
                    <td>{b.totalCopies}</td>
                    <td>{b.availableCopies}</td>
                    <td>{b.status || "-"}</td>
                    <td className="d-flex gap-2">
                      <button
                        className="btn-outline-nigerian"
                        onClick={() => startEdit(b)}
                        type="button"
                      >
                        <FaEdit className="me-1" /> {ui.edit}
                      </button>

                      <button
                        className="btn-nigerian"
                        onClick={() => remove(b.id)}
                        type="button"
                      >
                        <FaTrash className="me-1" /> {ui.delete}
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="10" className="text-center py-4">
                      {ui.noBooksFound}
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

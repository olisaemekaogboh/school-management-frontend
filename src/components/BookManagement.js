import React, { useEffect, useMemo, useState } from "react";
import { libraryAPI } from "../services/api";
import { toast } from "react-toastify";
import { FaPlus, FaSave, FaTrash, FaEdit, FaSearch } from "react-icons/fa";

const emptyForm = {
  title: "",
  author: "",
  isbn: "",
  category: "",
  totalCopies: 1,
  availableCopies: 1,
};

export default function BookManagement() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return books;
    const t = searchTerm.toLowerCase();
    return books.filter(
      (b) =>
        (b.title || "").toLowerCase().includes(t) ||
        (b.author || "").toLowerCase().includes(t) ||
        (b.isbn || "").toLowerCase().includes(t) ||
        (b.category || "").toLowerCase().includes(t),
    );
  }, [books, searchTerm]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await libraryAPI.getAllBooks();
      setBooks(res.data || []);
    } catch (e) {
      // interceptor already toasts
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
      category: b.category || "",
      totalCopies: b.totalCopies ?? 0,
      availableCopies: b.availableCopies ?? 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        totalCopies: Number(form.totalCopies),
        availableCopies: Number(form.availableCopies),
      };

      if (!payload.title.trim()) {
        toast.error("Title is required");
        return;
      }

      if (editingId) {
        await libraryAPI.updateBook(editingId, payload);
        toast.success("Book updated");
      } else {
        await libraryAPI.createBook(payload);
        toast.success("Book created");
      }

      startCreate();
      await load();
    } catch (e2) {}
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this book?")) return;
    try {
      await libraryAPI.deleteBook(id);
      toast.success("Book deleted");
      await load();
    } catch (e) {}
  };

  return (
    <div className="content-wrapper earth-pattern">
      <div className="hero-section p-4">
        <h2 className="mb-2">Books</h2>
        <p className="mb-0">Add books, keep stock counts and search easily.</p>
      </div>

      <div className="form-container mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">{editingId ? "Edit Book" : "Add Book"}</h4>
          <button
            type="button"
            className="btn-outline-nigerian"
            onClick={startCreate}
          >
            <FaPlus className="me-2" />
            New
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Title *</label>
              <input
                className="form-control"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Author</label>
              <input
                className="form-control"
                value={form.author}
                onChange={(e) =>
                  setForm((p) => ({ ...p, author: e.target.value }))
                }
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">ISBN</label>
              <input
                className="form-control"
                value={form.isbn}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isbn: e.target.value }))
                }
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Category</label>
              <input
                className="form-control"
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
              />
            </div>

            <div className="col-md-2 mb-3">
              <label className="form-label">Total</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={form.totalCopies}
                onChange={(e) =>
                  setForm((p) => ({ ...p, totalCopies: e.target.value }))
                }
              />
            </div>

            <div className="col-md-2 mb-3">
              <label className="form-label">Available</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={form.availableCopies}
                onChange={(e) =>
                  setForm((p) => ({ ...p, availableCopies: e.target.value }))
                }
              />
            </div>
          </div>

          <button className="btn-nigerian" type="submit">
            <FaSave className="me-2" />
            {editingId ? "Update" : "Save"}
          </button>
        </form>
      </div>

      <div className="table-container">
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
          <h4 className="mb-0">All Books</h4>

          <div className="d-flex gap-2 align-items-center">
            <FaSearch />
            <input
              className="form-control"
              style={{ maxWidth: 320 }}
              placeholder="Search title, author, ISBN, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="spinner-container">
            <div className="spinner-border-nigerian" />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>ISBN</th>
                  <th>Category</th>
                  <th>Total</th>
                  <th>Available</th>
                  <th style={{ width: 160 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td>{b.title}</td>
                    <td>{b.author}</td>
                    <td>{b.isbn}</td>
                    <td>{b.category}</td>
                    <td>{b.totalCopies}</td>
                    <td>{b.availableCopies}</td>
                    <td className="d-flex gap-2">
                      <button
                        className="btn-outline-nigerian"
                        onClick={() => startEdit(b)}
                        type="button"
                      >
                        <FaEdit className="me-1" /> Edit
                      </button>
                      <button
                        className="btn-nigerian"
                        onClick={() => remove(b.id)}
                        type="button"
                      >
                        <FaTrash className="me-1" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      No books found.
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

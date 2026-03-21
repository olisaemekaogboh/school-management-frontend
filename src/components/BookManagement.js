import React, { useEffect, useMemo, useState } from "react";
import { libraryAPI } from "../services/api";
import { toast } from "react-toastify";
import { FaPlus, FaSave, FaTrash, FaEdit, FaSearch } from "react-icons/fa";

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
        (b.category || "").toLowerCase().includes(t) ||
        (b.publisher || "").toLowerCase().includes(t),
    );
  }, [books, searchTerm]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await libraryAPI.getAllBooks();
      setBooks(res.data || []);
    } catch (error) {
      console.error("Error loading books:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load books",
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
      toast.error("Title is required");
      return;
    }

    if (!payload.author.trim()) {
      toast.error("Author is required");
      return;
    }

    if (payload.totalCopies < 0) {
      toast.error("Total copies cannot be negative");
      return;
    }

    if (payload.availableCopies < 0) {
      toast.error("Available copies cannot be negative");
      return;
    }

    if (payload.availableCopies > payload.totalCopies) {
      toast.error("Available copies cannot be greater than total copies");
      return;
    }

    try {
      if (editingId) {
        await libraryAPI.updateBook(editingId, payload);
        toast.success("Book updated");
      } else {
        await libraryAPI.createBook(payload);
        toast.success("Book created");
      }

      startCreate();
      await load();
    } catch (error) {
      console.error("Error saving book:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to save book",
      );
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this book?")) return;

    try {
      await libraryAPI.deleteBook(id);
      toast.success("Book deleted");
      await load();
    } catch (error) {
      console.error("Error deleting book:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to delete book",
      );
    }
  };

  return (
    <div className="content-wrapper earth-pattern">
      <div className="hero-section p-4">
        <h2 className="mb-2">Books</h2>
        <p className="mb-0">Manage your library catalogue properly.</p>
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
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Author *</label>
              <input
                className="form-control"
                value={form.author}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, author: e.target.value }))
                }
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">ISBN</label>
              <input
                className="form-control"
                value={form.isbn}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isbn: e.target.value }))
                }
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Publisher</label>
              <input
                className="form-control"
                value={form.publisher}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, publisher: e.target.value }))
                }
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Publication Date</label>
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
              <label className="form-label">Edition</label>
              <input
                className="form-control"
                value={form.edition}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, edition: e.target.value }))
                }
              />
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">Category</label>
              <input
                className="form-control"
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, category: e.target.value }))
                }
              />
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">Shelf Location</label>
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
              <label className="form-label">Total</label>
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
              <label className="form-label">Available</label>
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
              <label className="form-label">Description</label>
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
                  <th>ID</th> {/* Added ID column */}
                  <th>Title</th>
                  <th>Author</th>
                  <th>ISBN</th>
                  <th>Category</th>
                  <th>Shelf</th>
                  <th>Total</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th style={{ width: 160 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <code>{b.id}</code> {/* Display the ID */}
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
                    <td colSpan="10" className="text-center py-4">
                      {" "}
                      {/* Updated colSpan from 9 to 10 */}
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

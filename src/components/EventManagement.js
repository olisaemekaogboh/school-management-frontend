import React, { useState, useEffect } from "react";
import { eventAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaImage,
  FaUser,
  FaSpinner,
} from "react-icons/fa";
import "./EventManagement.css";

const emptyForm = {
  title: "",
  description: "",
  eventDate: "",
  eventTime: "",
  location: "",
  imageUrl: "",
  organizer: "",
};

export default function EventManagement() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getAllEvents();
      setEvents(response.data || []);
    } catch (error) {
      console.error("Error loading events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (event) => {
    setEditingId(event.id);
    setForm({
      title: event.title || "",
      description: event.description || "",
      eventDate: event.eventDate || "",
      eventTime: event.eventTime || "",
      location: event.location || "",
      imageUrl: event.imageUrl || "",
      organizer: event.organizer || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Event title is required");
      return;
    }

    if (!form.eventDate) {
      toast.error("Event date is required");
      return;
    }

    if (!form.location.trim()) {
      toast.error("Event location is required");
      return;
    }

    try {
      if (editingId) {
        await eventAPI.updateEvent(editingId, form);
        toast.success("Event updated successfully");
      } else {
        await eventAPI.createEvent(form);
        toast.success("Event created successfully");
      }
      resetForm();
      loadEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error(error?.response?.data?.message || "Failed to save event");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await eventAPI.deleteEvent(id);
      toast.success("Event deleted successfully");
      loadEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="event-management-container">
      <div className="event-management-header">
        <h2>Event Management</h2>
        <p>Manage school events, announcements, and activities</p>
      </div>

      {showForm && (
        <div className="event-form-container">
          <div className="event-form-header">
            <h3>{editingId ? "Edit Event" : "Create New Event"}</h3>
            <button className="close-form-btn" onClick={resetForm}>
              <FaTimes />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="event-form">
            <div className="form-group">
              <label>Event Title *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleInputChange}
                placeholder="Enter event title"
                className="form-control"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Event Date *</label>
                <input
                  type="date"
                  name="eventDate"
                  value={form.eventDate}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Event Time</label>
                <input
                  type="text"
                  name="eventTime"
                  value={form.eventTime}
                  onChange={handleInputChange}
                  placeholder="e.g., 9:00 AM - 4:00 PM"
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Location *</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleInputChange}
                placeholder="Event location"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Organizer</label>
              <input
                type="text"
                name="organizer"
                value={form.organizer}
                onChange={handleInputChange}
                placeholder="Event organizer"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Image URL</label>
              <input
                type="text"
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Event description"
                className="form-control"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                <FaSave /> {editingId ? "Update Event" : "Create Event"}
              </button>
              <button type="button" className="btn-cancel" onClick={resetForm}>
                <FaTimes /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="create-event-btn-container">
          <button className="btn-create-event" onClick={handleCreate}>
            <FaPlus /> Create New Event
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">
          <FaSpinner className="spinner" />
          <p>Loading events...</p>
        </div>
      ) : (
        <div className="events-list">
          {events.length === 0 ? (
            <div className="no-events">
              <p>No events found. Create your first event!</p>
            </div>
          ) : (
            <div className="events-grid">
              {events.map((event) => (
                <div key={event.id} className="event-card-admin">
                  <div className="event-card-image">
                    <img
                      src={
                        event.imageUrl ||
                        "https://via.placeholder.com/400x200?text=Event"
                      }
                      alt={event.title}
                    />
                  </div>
                  <div className="event-card-content">
                    <h3>{event.title}</h3>
                    <div className="event-details">
                      <p className="event-date">
                        <FaCalendarAlt /> {formatDate(event.eventDate)}
                      </p>
                      {event.eventTime && (
                        <p className="event-time">
                          <FaClock /> {event.eventTime}
                        </p>
                      )}
                      <p className="event-location">
                        <FaMapMarkerAlt /> {event.location}
                      </p>
                      {event.organizer && (
                        <p className="event-organizer">
                          <FaUser /> {event.organizer}
                        </p>
                      )}
                    </div>
                    {event.description && (
                      <p className="event-description">{event.description}</p>
                    )}
                    <div className="event-actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(event)}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(event.id)}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
import { useLanguage } from "../contexts/LanguageContext";
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
  const { t, language } = useLanguage();

  const ui = {
    loadFailed: t?.eventManagement?.loadFailed || "Failed to load events",
    titleRequired:
      t?.eventManagement?.titleRequired || "Event title is required",
    dateRequired: t?.eventManagement?.dateRequired || "Event date is required",
    locationRequired:
      t?.eventManagement?.locationRequired || "Event location is required",
    updated: t?.eventManagement?.updated || "Event updated successfully",
    created: t?.eventManagement?.created || "Event created successfully",
    saveFailed: t?.eventManagement?.saveFailed || "Failed to save event",
    deleteConfirm:
      t?.eventManagement?.deleteConfirm ||
      "Are you sure you want to delete this event?",
    deleted: t?.eventManagement?.deleted || "Event deleted successfully",
    deleteFailed: t?.eventManagement?.deleteFailed || "Failed to delete event",
    title: t?.eventManagement?.title || "Event Management",
    subtitle:
      t?.eventManagement?.subtitle ||
      "Manage school events, announcements, and activities",
    editEvent: t?.eventManagement?.editEvent || "Edit Event",
    createNewEvent: t?.eventManagement?.createNewEvent || "Create New Event",
    eventTitle: t?.eventManagement?.eventTitle || "Event Title",
    enterEventTitle: t?.eventManagement?.enterEventTitle || "Enter event title",
    eventDate: t?.eventManagement?.eventDate || "Event Date",
    eventTime: t?.eventManagement?.eventTime || "Event Time",
    eventTimePlaceholder:
      t?.eventManagement?.eventTimePlaceholder || "e.g., 9:00 AM - 4:00 PM",
    location: t?.eventManagement?.location || "Location",
    locationPlaceholder:
      t?.eventManagement?.locationPlaceholder || "Event location",
    organizer: t?.eventManagement?.organizer || "Organizer",
    organizerPlaceholder:
      t?.eventManagement?.organizerPlaceholder || "Event organizer",
    imageUrl: t?.eventManagement?.imageUrl || "Image URL",
    imageUrlPlaceholder:
      t?.eventManagement?.imageUrlPlaceholder ||
      "https://example.com/image.jpg",
    description: t?.eventManagement?.description || "Description",
    descriptionPlaceholder:
      t?.eventManagement?.descriptionPlaceholder || "Event description",
    updateEvent: t?.eventManagement?.updateEvent || "Update Event",
    createEvent: t?.eventManagement?.createEvent || "Create Event",
    cancel: t?.eventManagement?.cancel || "Cancel",
    createNewEventBtn:
      t?.eventManagement?.createNewEventBtn || "Create New Event",
    loading: t?.common?.loading || "Loading...",
    noEvents: t?.eventManagement?.noEvents || "No events found.",
    date: t?.eventManagement?.date || "Date",
    time: t?.eventManagement?.time || "Time",
    venue: t?.eventManagement?.venue || "Venue",
    by: t?.eventManagement?.by || "By",
    actions: t?.eventManagement?.actions || "Actions",
    edit: t?.eventManagement?.edit || "Edit",
    delete: t?.eventManagement?.delete || "Delete",
  };

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
      toast.error(ui.loadFailed);
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
      toast.error(ui.titleRequired);
      return;
    }

    if (!form.eventDate) {
      toast.error(ui.dateRequired);
      return;
    }

    if (!form.location.trim()) {
      toast.error(ui.locationRequired);
      return;
    }

    try {
      if (editingId) {
        await eventAPI.updateEvent(editingId, form);
        toast.success(ui.updated);
      } else {
        await eventAPI.createEvent(form);
        toast.success(ui.created);
      }
      resetForm();
      loadEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error(error?.response?.data?.message || ui.saveFailed);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(ui.deleteConfirm)) return;

    try {
      await eventAPI.deleteEvent(id);
      toast.success(ui.deleted);
      loadEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error(ui.deleteFailed);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="event-management-container">
      <div className="event-management-header">
        <h2>{ui.title}</h2>
        <p>{ui.subtitle}</p>
      </div>

      {showForm && (
        <div className="event-form-container">
          <div className="event-form-header">
            <h3>{editingId ? ui.editEvent : ui.createNewEvent}</h3>
            <button className="close-form-btn" onClick={resetForm}>
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="event-form">
            <div className="form-group">
              <label>{ui.eventTitle} *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleInputChange}
                placeholder={ui.enterEventTitle}
                className="form-control"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{ui.eventDate} *</label>
                <input
                  type="date"
                  name="eventDate"
                  value={form.eventDate}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>{ui.eventTime}</label>
                <input
                  type="text"
                  name="eventTime"
                  value={form.eventTime}
                  onChange={handleInputChange}
                  placeholder={ui.eventTimePlaceholder}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label>{ui.location} *</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleInputChange}
                placeholder={ui.locationPlaceholder}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>{ui.organizer}</label>
              <input
                type="text"
                name="organizer"
                value={form.organizer}
                onChange={handleInputChange}
                placeholder={ui.organizerPlaceholder}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>{ui.imageUrl}</label>
              <input
                type="text"
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleInputChange}
                placeholder={ui.imageUrlPlaceholder}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>{ui.description}</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                rows="4"
                placeholder={ui.descriptionPlaceholder}
                className="form-control"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                <FaSave /> {editingId ? ui.updateEvent : ui.createEvent}
              </button>
              <button type="button" className="btn-cancel" onClick={resetForm}>
                <FaTimes /> {ui.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="create-event-btn-container">
          <button className="btn-create-event" onClick={handleCreate}>
            <FaPlus /> {ui.createNewEventBtn}
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <FaSpinner className="spinner" />
          <p>{ui.loading}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <p>{ui.noEvents}</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <div key={event.id} className="event-card">
              <div className="event-image-wrapper">
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="event-image"
                  />
                ) : (
                  <div className="event-image-placeholder">
                    <FaImage />
                  </div>
                )}
              </div>

              <div className="event-card-content">
                <h3>{event.title}</h3>

                <p className="event-meta">
                  <FaCalendarAlt /> <strong>{ui.date}:</strong>{" "}
                  {formatDate(event.eventDate)}
                </p>

                {event.eventTime && (
                  <p className="event-meta">
                    <FaClock /> <strong>{ui.time}:</strong> {event.eventTime}
                  </p>
                )}

                {event.location && (
                  <p className="event-meta">
                    <FaMapMarkerAlt /> <strong>{ui.venue}:</strong>{" "}
                    {event.location}
                  </p>
                )}

                {event.organizer && (
                  <p className="event-meta">
                    <FaUser /> <strong>{ui.by}:</strong> {event.organizer}
                  </p>
                )}

                {event.description && (
                  <p className="event-description">{event.description}</p>
                )}

                <div className="event-actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(event)}
                  >
                    <FaEdit /> {ui.edit}
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(event.id)}
                  >
                    <FaTrash /> {ui.delete}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

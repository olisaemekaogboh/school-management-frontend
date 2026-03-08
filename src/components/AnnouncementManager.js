// src/components/AnnouncementManager.js
import React, { useState, useEffect } from "react";
import { announcementAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaBullhorn,
  FaCalendarAlt,
  FaMoneyBill,
  FaFileAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaBell,
  FaDownload,
  FaUsers,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaSpinner,
  FaClock,
  FaTimesCircle,
  FaEye,
  FaSchool,
  FaUmbrellaBeach,
  FaSun,
  FaCloudSun,
} from "react-icons/fa";
import moment from "moment";

function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [filter, setFilter] = useState("all");
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [smsResults, setSmsResults] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(
    moment().format("YYYY-MM"),
  );
  const [showSmsHistory, setShowSmsHistory] = useState(false);
  const [smsHistory, setSmsHistory] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "GENERAL",
    priority: "NORMAL",
    audience: ["ALL"],
    startDate: "",
    endDate: "",
    eventDate: "",
    eventLocation: "",
    eventTime: "",
    feeAmount: "",
    feeDescription: "",
    feeDueDate: "",
    resultReleaseDate: "",
    term: "FIRST",
    session: "2025/2026",
    active: true,
  });

  const sessions = ["2023/2024", "2024/2025", "2025/2026", "2026/2027"];
  const terms = ["FIRST", "SECOND", "THIRD"];
  const types = [
    "RESUMPTION",
    "HOLIDAY",
    "MIDTERM_BREAK",
    "EXAM",
    "RESULT",
    "FEE",
    "EVENT",
    "MEETING",
    "SPORTS",
    "CULTURAL",
    "EMERGENCY",
    "GENERAL",
  ];
  const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"];
  const audienceOptions = [
    "ALL",
    "STUDENTS",
    "PARENTS",
    "TEACHERS",
    "STAFF",
    "BOARDING",
    "DAY",
  ];

  useEffect(() => {
    fetchAnnouncements();
  }, [filter]);

  useEffect(() => {
    generateCalendarEvents();
  }, [announcements]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      let response;
      if (filter === "all") {
        response = await announcementAPI.getAllAnnouncements();
      } else if (filter === "upcoming") {
        response = await announcementAPI.getUpcomingEvents();
      } else if (filter === "fees") {
        response = await announcementAPI.getUpcomingFees();
      } else {
        response = await announcementAPI.getAnnouncementsByType(filter);
      }
      setAnnouncements(response.data);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };
  const fetchSmsHistory = async (announcementId) => {
    try {
      console.log("Fetching SMS history for announcement:", announcementId);
      const response = await announcementAPI.getSmsHistory(announcementId);
      console.log("SMS history response:", response.data);

      // Check if response.data is an array
      if (Array.isArray(response.data)) {
        if (response.data.length === 0) {
          toast.info("No SMS records found for this announcement");
        }
        setSmsHistory(response.data);
      } else {
        console.error("Expected array but got:", typeof response.data);
        setSmsHistory([]);
      }

      setShowSmsHistory(true);
    } catch (error) {
      console.error("Error fetching SMS history:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Error status:", error.response.status);
        toast.error(`Failed to load SMS history: ${error.response.status}`);
      } else {
        toast.error("Failed to load SMS history. Please try again.");
      }
    }
  };
  const generateCalendarEvents = () => {
    const events = [];

    announcements.forEach((announcement) => {
      // Add event date as calendar event
      if (announcement.eventDate) {
        events.push({
          id: `event-${announcement.id}`,
          title: announcement.title,
          date: announcement.eventDate,
          type: announcement.type,
          priority: announcement.priority,
          description: announcement.content,
          time: announcement.eventTime,
          location: announcement.eventLocation,
          icon: <FaCalendarAlt />,
        });
      }

      // Add start/end dates as date range events
      if (announcement.startDate && announcement.endDate) {
        events.push({
          id: `range-${announcement.id}`,
          title: announcement.title,
          startDate: announcement.startDate,
          endDate: announcement.endDate,
          type: announcement.type,
          priority: announcement.priority,
          description: announcement.content,
          isRange: true,
          icon: <FaClock />,
        });
      }

      // Add fee due dates
      if (announcement.feeDueDate) {
        events.push({
          id: `fee-${announcement.id}`,
          title: `Fee Due: ${announcement.title}`,
          date: announcement.feeDueDate,
          type: "FEE",
          priority: "HIGH",
          description: announcement.feeDescription || announcement.content,
          amount: announcement.feeAmount,
          icon: <FaMoneyBill />,
        });
      }

      // Add result release dates
      if (announcement.resultReleaseDate) {
        events.push({
          id: `result-${announcement.id}`,
          title: `Results: ${announcement.title}`,
          date: announcement.resultReleaseDate,
          type: "RESULT",
          priority: "HIGH",
          description: announcement.content,
          term: announcement.term,
          session: announcement.session,
          icon: <FaFileAlt />,
        });
      }
    });

    // Sort events by date
    events.sort((a, b) => {
      const dateA = a.date || a.startDate;
      const dateB = b.date || b.startDate;
      return moment(dateA).valueOf() - moment(dateB).valueOf();
    });

    setCalendarEvents(events);
  };

  const getEventsForSelectedMonth = () => {
    return calendarEvents.filter((event) => {
      const eventDate = event.date || event.startDate;
      return moment(eventDate).format("YYYY-MM") === selectedMonth;
    });
  };

  const getEventBadgeColor = (type) => {
    const colors = {
      RESUMPTION: "success",
      HOLIDAY: "info",
      MIDTERM_BREAK: "warning",
      EXAM: "danger",
      RESULT: "primary",
      FEE: "warning",
      EVENT: "info",
      MEETING: "secondary",
      SPORTS: "success",
      CULTURAL: "info",
      EMERGENCY: "danger",
      GENERAL: "secondary",
    };
    return colors[type] || "secondary";
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "audience") {
      const selectedAudience = formData.audience.includes(value)
        ? formData.audience.filter((a) => a !== value)
        : [...formData.audience, value];
      setFormData({ ...formData, audience: selectedAudience });
    } else if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingAnnouncement) {
        await announcementAPI.updateAnnouncement(
          editingAnnouncement.id,
          formData,
        );
        toast.success("Announcement updated successfully");
      } else {
        await announcementAPI.createAnnouncement(formData);
        toast.success("Announcement created successfully");
      }

      setShowForm(false);
      setEditingAnnouncement(null);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error("Error saving announcement:", error);

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((err) => `${err.field}: ${err.defaultMessage}`)
          .join(", ");
        toast.error(errorMessages);
      } else {
        toast.error("Failed to save announcement. Please check all fields.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title || "",
      content: announcement.content || "",
      type: announcement.type || "GENERAL",
      priority: announcement.priority || "NORMAL",
      audience: announcement.audience || ["ALL"],
      startDate: announcement.startDate || "",
      endDate: announcement.endDate || "",
      eventDate: announcement.eventDate || "",
      eventLocation: announcement.eventLocation || "",
      eventTime: announcement.eventTime || "",
      feeAmount: announcement.feeAmount || "",
      feeDescription: announcement.feeDescription || "",
      feeDueDate: announcement.feeDueDate || "",
      resultReleaseDate: announcement.resultReleaseDate || "",
      term: announcement.term || "FIRST",
      session: announcement.session || "2025/2026",
      active: announcement.active !== undefined ? announcement.active : true,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        await announcementAPI.deleteAnnouncement(id);
        toast.success("Announcement deleted successfully");
        fetchAnnouncements();
      } catch (error) {
        console.error("Error deleting announcement:", error);
        toast.error("Failed to delete announcement");
      }
    }
  };
  const handleSendSms = async (announcement) => {
    if (
      !window.confirm(
        `Send SMS notification for "${announcement.title}" to all recipients?`,
      )
    ) {
      return;
    }

    setSendingSms(true);
    try {
      const response = await announcementAPI.sendNotifications(announcement.id);
      console.log("SMS response:", response.data);

      // Check if we got a summary object
      if (response.data) {
        const successCount = response.data.successCount || 0;
        const failedCount = response.data.failedCount || 0;
        const failedNumbers = response.data.failedNumbers || [];

        // Show success message
        if (successCount > 0) {
          toast.success(`✅ ${successCount} SMS message(s) sent successfully!`);
        }

        // Show failure message if any
        if (failedCount > 0) {
          toast.warning(`⚠️ ${failedCount} message(s) failed to send`);

          // Store results for the modal
          setSmsResults({
            successCount: successCount,
            failedCount: failedCount,
            failedNumbers: failedNumbers,
            message: response.data.message || "SMS delivery report",
          });
        } else {
          // All succeeded
          toast.success(
            `✅ All ${successCount} SMS messages sent successfully!`,
          );
        }

        // Refresh announcements after a delay to get updated logs
        setTimeout(() => {
          fetchAnnouncements();
        }, 2000);
      }
    } catch (error) {
      console.error("Error sending SMS:", error);

      let errorMessage = "Failed to send SMS notifications";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data) {
        errorMessage =
          typeof error.response.data === "string"
            ? error.response.data
            : JSON.stringify(error.response.data);
      }

      toast.error(`❌ ${errorMessage}`);

      // Set error results
      setSmsResults({
        successCount: 0,
        failedCount: 0,
        error: errorMessage,
        failedNumbers: [],
      });
    } finally {
      setSendingSms(false);
    }
  };
  const handleQuickAnnouncement = (type) => {
    let data = {
      active: true,
      audience: ["ALL"],
    };

    switch (type) {
      case "resumption":
        data = {
          ...data,
          title: "School Resumption Announcement",
          content:
            "Dear Parents and Guardians, we are pleased to announce that school will resume for the FIRST term of the 2025/2026 academic session on September 8th, 2025. All students are expected to resume on this date. Boarding students can return on September 7th. We look forward to welcoming all students back for a new term of academic excellence.",
          type: "RESUMPTION",
          priority: "HIGH",
          eventDate: "2025-09-08",
          term: "FIRST",
          session: "2025/2026",
        };
        break;
      case "midterm":
        data = {
          ...data,
          title: "Midterm Break Schedule",
          content:
            "This is to inform all parents and students that the midterm break for the FIRST term will run from October 15th to October 22nd, 2025. School will resume on October 23rd. Students are encouraged to use this break to catch up on assignments and rest. Boarding students will depart on October 14th after school.",
          type: "MIDTERM_BREAK",
          priority: "NORMAL",
          startDate: "2025-10-15",
          endDate: "2025-10-22",
        };
        break;
      case "result":
        data = {
          ...data,
          title: "First Term Results Release",
          content:
            "Dear Parents, the results for the FIRST term of the 2025/2026 session will be released on December 20th, 2025. Results will be available on the school portal. Parents are advised to log in to their accounts to access their wards' results. For any issues accessing results, please contact the class teacher or the IT department.",
          type: "RESULT",
          priority: "HIGH",
          audience: ["PARENTS", "STUDENTS"],
          resultReleaseDate: "2025-12-20",
          term: "FIRST",
          session: "2025/2026",
        };
        break;
      case "fee":
        data = {
          ...data,
          title: "School Fees Payment Deadline",
          content:
            "This is a reminder that the deadline for payment of school fees for the FIRST term of the 2025/2026 session is August 30th, 2025. The total fees for the term are ₦45,000. Please make payments via the school portal or bank to avoid penalties. For payment inquiries, contact the accounts department.",
          type: "FEE",
          priority: "HIGH",
          audience: ["PARENTS"],
          feeAmount: 45000,
          feeDescription: "First Term School Fees",
          feeDueDate: "2025-08-30",
        };
        break;
      default:
        break;
    }

    setFormData(data);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      type: "GENERAL",
      priority: "NORMAL",
      audience: ["ALL"],
      startDate: "",
      endDate: "",
      eventDate: "",
      eventLocation: "",
      eventTime: "",
      feeAmount: "",
      feeDescription: "",
      feeDueDate: "",
      resultReleaseDate: "",
      term: "FIRST",
      session: "2025/2026",
      active: true,
    });
    setEditingAnnouncement(null);
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      LOW: { class: "bg-secondary", icon: <FaInfoCircle /> },
      NORMAL: { class: "bg-info", icon: <FaClock /> },
      HIGH: { class: "bg-warning", icon: <FaExclamationTriangle /> },
      URGENT: { class: "bg-danger", icon: <FaTimesCircle /> },
    };
    const badge = badges[priority] || badges.NORMAL;
    return (
      <span className={`badge ${badge.class} p-2`}>
        {badge.icon} {priority}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    const icons = {
      RESUMPTION: <FaCalendarAlt className="text-success" />,
      HOLIDAY: <FaCalendarAlt className="text-info" />,
      MIDTERM_BREAK: <FaCalendarAlt className="text-warning" />,
      EXAM: <FaFileAlt className="text-danger" />,
      RESULT: <FaFileAlt className="text-primary" />,
      FEE: <FaMoneyBill className="text-success" />,
      EVENT: <FaBullhorn className="text-info" />,
      MEETING: <FaUsers className="text-primary" />,
      EMERGENCY: <FaExclamationTriangle className="text-danger" />,
      GENERAL: <FaInfoCircle className="text-secondary" />,
    };
    return icons[type] || <FaBullhorn />;
  };

  const getStatusBadge = (active) => {
    return active ? (
      <span className="badge bg-success">Active</span>
    ) : (
      <span className="badge bg-secondary">Inactive</span>
    );
  };

  const filteredEvents = getEventsForSelectedMonth();

  return (
    <div className="announcement-manager container-fluid py-4">
      <h2 className="mb-4">
        <FaBullhorn className="me-2" /> School Announcements
      </h2>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div
              className="card-header"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
              }}
            >
              <h5 className="mb-0">
                <FaPlus className="me-2" /> Quick Announcements
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex gap-3 flex-wrap justify-content-center">
                {/* Resumption Button */}
                <button
                  className="btn btn-lg"
                  onClick={() => handleQuickAnnouncement("resumption")}
                  style={{
                    background:
                      "linear-gradient(135deg, #43a047 0%, #1e5f1e 100%)",
                    color: "white",
                    padding: "15px 30px",
                    borderRadius: "50px",
                    border: "none",
                    boxShadow: "0 4px 15px rgba(67, 160, 71, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "16px",
                    fontWeight: "600",
                    minWidth: "200px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-3px)";
                    e.target.style.boxShadow =
                      "0 6px 20px rgba(67, 160, 71, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 15px rgba(67, 160, 71, 0.3)";
                  }}
                >
                  <FaSchool size={24} />
                  <span>📚 Resumption</span>
                </button>

                {/* Midterm Break Button */}
                <button
                  className="btn btn-lg"
                  onClick={() => handleQuickAnnouncement("midterm")}
                  style={{
                    background:
                      "linear-gradient(135deg, #f9a826 0%, #f57c00 100%)",
                    color: "white",
                    padding: "15px 30px",
                    borderRadius: "50px",
                    border: "none",
                    boxShadow: "0 4px 15px rgba(249, 168, 38, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "16px",
                    fontWeight: "600",
                    minWidth: "200px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-3px)";
                    e.target.style.boxShadow =
                      "0 6px 20px rgba(249, 168, 38, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 15px rgba(249, 168, 38, 0.3)";
                  }}
                >
                  <FaUmbrellaBeach size={24} />
                  <span>🌴 Midterm Break</span>
                </button>

                {/* Result Release Button */}
                <button
                  className="btn btn-lg"
                  onClick={() => handleQuickAnnouncement("result")}
                  style={{
                    background:
                      "linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)",
                    color: "white",
                    padding: "15px 30px",
                    borderRadius: "50px",
                    border: "none",
                    boxShadow: "0 4px 15px rgba(67, 97, 238, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "16px",
                    fontWeight: "600",
                    minWidth: "200px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-3px)";
                    e.target.style.boxShadow =
                      "0 6px 20px rgba(67, 97, 238, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 15px rgba(67, 97, 238, 0.3)";
                  }}
                >
                  <FaFileAlt size={22} />
                  <span>📋 Result Release</span>
                </button>

                {/* School Fees Button */}
                <button
                  className="btn btn-lg"
                  onClick={() => handleQuickAnnouncement("fee")}
                  style={{
                    background:
                      "linear-gradient(135deg, #e54d42 0%, #b71c1c 100%)",
                    color: "white",
                    padding: "15px 30px",
                    borderRadius: "50px",
                    border: "none",
                    boxShadow: "0 4px 15px rgba(229, 77, 66, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "16px",
                    fontWeight: "600",
                    minWidth: "200px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-3px)";
                    e.target.style.boxShadow =
                      "0 6px 20px rgba(229, 77, 66, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 15px rgba(229, 77, 66, 0.3)";
                  }}
                >
                  <FaMoneyBill size={22} />
                  <span>💰 School Fees</span>
                </button>

                {/* Custom Announcement Button */}
                <button
                  className="btn btn-lg"
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                  style={{
                    background:
                      "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
                    color: "white",
                    padding: "15px 30px",
                    borderRadius: "50px",
                    border: "none",
                    boxShadow: "0 4px 15px rgba(108, 117, 125, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "16px",
                    fontWeight: "600",
                    minWidth: "200px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-3px)";
                    e.target.style.boxShadow =
                      "0 6px 20px rgba(108, 117, 125, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 15px rgba(108, 117, 125, 0.3)";
                  }}
                >
                  <FaPlus size={20} />
                  <span>✨ Custom</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-4">
          <select
            className="form-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Announcements</option>
            <option value="upcoming">Upcoming Events</option>
            <option value="fees">Fee Deadlines</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar View */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaCalendarAlt className="me-2" /> School Events Calendar
              </h5>
              <div>
                <input
                  type="month"
                  className="form-control form-control-sm"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ width: "200px" }}
                />
              </div>
            </div>
            <div className="card-body">
              {calendarEvents.length > 0 ? (
                <div className="row">
                  {/* Calendar Mini View */}
                  <div className="col-md-4 mb-3">
                    <div className="border rounded p-3">
                      <h6 className="mb-3">Month Overview</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {Array.from(
                          { length: moment(selectedMonth).daysInMonth() },
                          (_, i) => i + 1,
                        ).map((day) => {
                          const dateStr = `${selectedMonth}-${String(day).padStart(2, "0")}`;
                          const hasEvents = calendarEvents.some((event) => {
                            const eventDate = event.date || event.startDate;
                            return (
                              moment(eventDate).format("YYYY-MM-DD") === dateStr
                            );
                          });
                          return (
                            <div
                              key={day}
                              className={`text-center p-2 ${hasEvents ? "bg-info text-white rounded-circle" : ""}`}
                              style={{ width: "35px", height: "35px" }}
                            >
                              {day}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Events List */}
                  <div className="col-md-8">
                    <h6 className="mb-3">
                      Events for {moment(selectedMonth).format("MMMM YYYY")}
                    </h6>
                    <div className="list-group">
                      {filteredEvents.length > 0 ? (
                        filteredEvents.map((event, index) => (
                          <div
                            key={index}
                            className="list-group-item list-group-item-action"
                          >
                            <div className="d-flex w-100 justify-content-between align-items-center">
                              <div className="d-flex align-items-center">
                                <span
                                  className={`me-3 text-${getEventBadgeColor(event.type)}`}
                                >
                                  {event.icon}
                                </span>
                                <div>
                                  <h6 className="mb-1">{event.title}</h6>
                                  <p className="mb-1 small text-muted">
                                    {event.description}
                                  </p>
                                  <div className="d-flex gap-3 mt-2">
                                    <small className="text-muted">
                                      <strong>Date:</strong>{" "}
                                      {event.date
                                        ? moment(event.date).format(
                                            "DD/MM/YYYY",
                                          )
                                        : `${moment(event.startDate).format("DD/MM/YYYY")} - ${moment(event.endDate).format("DD/MM/YYYY")}`}
                                    </small>
                                    {event.time && (
                                      <small className="text-muted">
                                        <strong>Time:</strong> {event.time}
                                      </small>
                                    )}
                                    {event.location && (
                                      <small className="text-muted">
                                        <strong>Location:</strong>{" "}
                                        {event.location}
                                      </small>
                                    )}
                                    {event.amount && (
                                      <small className="text-success">
                                        <strong>Amount:</strong> ₦
                                        {event.amount.toLocaleString()}
                                      </small>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span
                                className={`badge bg-${getEventBadgeColor(event.type)}`}
                              >
                                {event.type}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="alert alert-info">
                          No events scheduled for{" "}
                          {moment(selectedMonth).format("MMMM YYYY")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="alert alert-info">
                  No calendar events found. Create announcements with dates to
                  see them here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SMS History Modal */}
      {showSmsHistory && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">
                  <FaBell className="me-2" /> SMS Delivery Report
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowSmsHistory(false)}
                ></button>
              </div>
              <div className="modal-body">
                {smsHistory && smsHistory.length > 0 ? (
                  <>
                    {/* Summary Cards */}
                    <div className="row mb-4">
                      <div className="col-md-3">
                        <div className="border p-3 rounded text-center bg-success text-white">
                          <h3>
                            {
                              smsHistory.filter((s) => s.status === "DELIVERED")
                                .length
                            }
                          </h3>
                          <small>Delivered</small>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="border p-3 rounded text-center bg-primary text-white">
                          <h3>
                            {
                              smsHistory.filter((s) => s.status === "SENT")
                                .length
                            }
                          </h3>
                          <small>Sent</small>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="border p-3 rounded text-center bg-warning text-dark">
                          <h3>
                            {
                              smsHistory.filter((s) => s.status === "PENDING")
                                .length
                            }
                          </h3>
                          <small>Pending</small>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="border p-3 rounded text-center bg-danger text-white">
                          <h3>
                            {
                              smsHistory.filter((s) => s.status === "FAILED")
                                .length
                            }
                          </h3>
                          <small>Failed</small>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Timeline */}
                    {smsHistory.length > 0 && (
                      <div className="mb-4">
                        <h6>Delivery Timeline</h6>
                        <div className="progress" style={{ height: "30px" }}>
                          <div
                            className="progress-bar bg-success"
                            style={{
                              width: `${(smsHistory.filter((s) => s.status === "DELIVERED").length / smsHistory.length) * 100}%`,
                            }}
                          >
                            Delivered
                          </div>
                          <div
                            className="progress-bar bg-primary"
                            style={{
                              width: `${(smsHistory.filter((s) => s.status === "SENT").length / smsHistory.length) * 100}%`,
                            }}
                          >
                            Sent
                          </div>
                          <div
                            className="progress-bar bg-warning"
                            style={{
                              width: `${(smsHistory.filter((s) => s.status === "PENDING").length / smsHistory.length) * 100}%`,
                            }}
                          >
                            Pending
                          </div>
                          <div
                            className="progress-bar bg-danger"
                            style={{
                              width: `${(smsHistory.filter((s) => s.status === "FAILED").length / smsHistory.length) * 100}%`,
                            }}
                          >
                            Failed
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SMS List */}
                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                        <thead>
                          <tr>
                            <th>Parent Name</th>
                            <th>Phone Number</th>
                            <th>Student</th>
                            <th>Status</th>
                            <th>Sent At</th>
                            <th>Delivered At</th>
                            <th>Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {smsHistory.map((log, index) => (
                            <tr key={index}>
                              <td>{log.parentName || "N/A"}</td>
                              <td>{log.parentPhone}</td>
                              <td>
                                {log.studentName || "N/A"}{" "}
                                {log.studentClass
                                  ? `(${log.studentClass})`
                                  : ""}
                              </td>
                              <td>
                                {log.status === "DELIVERED" && (
                                  <span className="badge bg-success">
                                    Delivered
                                  </span>
                                )}
                                {log.status === "SENT" && (
                                  <span className="badge bg-primary">Sent</span>
                                )}
                                {log.status === "PENDING" && (
                                  <span className="badge bg-warning">
                                    Pending
                                  </span>
                                )}
                                {log.status === "FAILED" && (
                                  <span
                                    className="badge bg-danger"
                                    title={log.errorMessage}
                                  >
                                    Failed
                                  </span>
                                )}
                              </td>
                              <td>
                                {log.sentAt
                                  ? moment(log.sentAt).format(
                                      "DD/MM/YYYY HH:mm",
                                    )
                                  : "-"}
                              </td>
                              <td>
                                {log.deliveredAt
                                  ? moment(log.deliveredAt).format(
                                      "DD/MM/YYYY HH:mm",
                                    )
                                  : "-"}
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-info"
                                  onClick={() => alert(log.messageContent)}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-5">
                    <FaInfoCircle size={50} className="text-muted mb-3" />
                    <h5>No SMS History Found</h5>
                    <p className="text-muted">
                      No SMS messages have been sent for this announcement yet.
                    </p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowSmsHistory(false)}
                >
                  Close
                </button>
                {smsHistory &&
                  smsHistory.filter((s) => s.status === "FAILED").length >
                    0 && (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        const failedNumbers = smsHistory
                          .filter((s) => s.status === "FAILED")
                          .map((s) => s.parentPhone);
                        if (failedNumbers.length > 0 && selectedAnnouncement) {
                          handleSendSms(selectedAnnouncement);
                          setShowSmsHistory(false);
                        }
                      }}
                    >
                      Retry Failed (
                      {smsHistory.filter((s) => s.status === "FAILED").length})
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Form Modal */}
      {showForm && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  {editingAnnouncement
                    ? "Edit Announcement"
                    : "Create Announcement"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Type *</label>
                      <select
                        className="form-select"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                      >
                        {types.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Content *</label>
                    <textarea
                      className="form-control"
                      name="content"
                      rows="4"
                      value={formData.content}
                      onChange={handleInputChange}
                      required
                      minLength="10"
                    ></textarea>
                    <small className="text-muted">Minimum 10 characters</small>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Priority *</label>
                      <select
                        className="form-select"
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                      >
                        {priorities.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Audience *</label>
                      <div className="border rounded p-2">
                        {audienceOptions.map((option) => (
                          <div
                            key={option}
                            className="form-check form-check-inline"
                          >
                            <input
                              type="checkbox"
                              className="form-check-input"
                              name="audience"
                              value={option}
                              checked={formData.audience.includes(option)}
                              onChange={handleInputChange}
                              id={`audience-${option}`}
                            />
                            <label
                              className="form-check-label"
                              htmlFor={`audience-${option}`}
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Status</label>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="active"
                          checked={formData.active}
                          onChange={handleInputChange}
                          id="activeSwitch"
                        />
                        <label
                          className="form-check-label"
                          htmlFor="activeSwitch"
                        >
                          {formData.active ? "Active" : "Inactive"}
                        </label>
                      </div>
                    </div>
                  </div>

                  <h6 className="mt-3 mb-2">Event Details</h6>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Event Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="eventDate"
                        value={formData.eventDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Event Time</label>
                      <input
                        type="time"
                        className="form-control"
                        name="eventTime"
                        value={formData.eventTime}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        className="form-control"
                        name="eventLocation"
                        value={formData.eventLocation}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <h6 className="mt-3 mb-2">Fee Details</h6>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Amount (₦)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="feeAmount"
                        value={formData.feeAmount}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Due Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="feeDueDate"
                        value={formData.feeDueDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Description</label>
                      <input
                        type="text"
                        className="form-control"
                        name="feeDescription"
                        value={formData.feeDescription}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <h6 className="mt-3 mb-2">Result Details</h6>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Release Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="resultReleaseDate"
                        value={formData.resultReleaseDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Term</label>
                      <select
                        className="form-select"
                        name="term"
                        value={formData.term}
                        onChange={handleInputChange}
                      >
                        {terms.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Session</label>
                      <select
                        className="form-select"
                        name="session"
                        value={formData.session}
                        onChange={handleInputChange}
                      >
                        {sessions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-nigerian"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="spinner me-2" /> Saving...
                      </>
                    ) : editingAnnouncement ? (
                      "Update"
                    ) : (
                      "Create"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SMS Results Modal */}
      {smsResults && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">
                  <FaBell className="me-2" /> SMS Delivery Report
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSmsResults(null)}
                ></button>
              </div>
              <div className="modal-body">
                {smsResults.error ? (
                  <div className="alert alert-danger">
                    <h6>Error:</h6>
                    <p>{smsResults.error}</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      {smsResults.successCount > 0 &&
                      smsResults.failedCount === 0 ? (
                        <div className="text-success">
                          <FaCheckCircle size={60} />
                          <h4 className="mt-3">
                            All Messages Sent Successfully!
                          </h4>
                        </div>
                      ) : smsResults.failedCount > 0 &&
                        smsResults.successCount === 0 ? (
                        <div className="text-danger">
                          <FaTimesCircle size={60} />
                          <h4 className="mt-3">All Messages Failed</h4>
                        </div>
                      ) : (
                        <div className="text-warning">
                          <FaExclamationTriangle size={60} />
                          <h4 className="mt-3">Partial Success</h4>
                        </div>
                      )}
                    </div>

                    <div className="row mb-4">
                      <div className="col-6">
                        <div className="border p-3 rounded text-center bg-success text-white">
                          <h2>{smsResults.successCount || 0}</h2>
                          <p className="mb-0">Successful</p>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="border p-3 rounded text-center bg-danger text-white">
                          <h2>{smsResults.failedCount || 0}</h2>
                          <p className="mb-0">Failed</p>
                        </div>
                      </div>
                    </div>

                    {smsResults.message && (
                      <div className="alert alert-info">
                        {smsResults.message}
                      </div>
                    )}

                    {smsResults.failedNumbers &&
                      smsResults.failedNumbers.length > 0 && (
                        <div>
                          <h6>Failed Numbers:</h6>
                          <div
                            className="bg-light p-3 rounded"
                            style={{ maxHeight: "150px", overflowY: "auto" }}
                          >
                            {smsResults.failedNumbers.map((num, idx) => (
                              <div key={idx} className="text-danger mb-1">
                                • {num}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSmsResults(null)}
                >
                  Close
                </button>
                {smsResults.failedCount > 0 && (
                  <button
                    className="btn btn-warning"
                    onClick={() => {
                      setSmsResults(null);
                      // Retry logic here
                    }}
                  >
                    Retry Failed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="row">
        <div className="col-12">
          {loading ? (
            <div className="text-center py-5">
              <FaSpinner className="spinner" size={40} />
              <p className="mt-3">Loading announcements...</p>
            </div>
          ) : (
            <div className="row">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="col-md-6 mb-3">
                  <div
                    className={`card h-100 ${
                      !announcement.active ? "bg-light" : ""
                    }`}
                  >
                    <div className="card-header bg-light d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <span className="me-2">
                          {getTypeIcon(announcement.type)}
                        </span>
                        <h6 className="mb-0">{announcement.title}</h6>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {getPriorityBadge(announcement.priority)}
                        {getStatusBadge(announcement.active)}
                      </div>
                    </div>
                    <div className="card-body">
                      <p className="card-text">{announcement.content}</p>

                      <div className="small text-muted mb-2">
                        {announcement.eventDate && (
                          <div>
                            <strong>Event Date:</strong>{" "}
                            {moment(announcement.eventDate).format(
                              "DD/MM/YYYY",
                            )}{" "}
                            {announcement.eventTime &&
                              `at ${announcement.eventTime}`}
                          </div>
                        )}
                        {announcement.eventLocation && (
                          <div>
                            <strong>Location:</strong>{" "}
                            {announcement.eventLocation}
                          </div>
                        )}
                        {announcement.startDate && announcement.endDate && (
                          <div>
                            <strong>Date Range:</strong>{" "}
                            {moment(announcement.startDate).format(
                              "DD/MM/YYYY",
                            )}{" "}
                            -{" "}
                            {moment(announcement.endDate).format("DD/MM/YYYY")}
                          </div>
                        )}
                        {announcement.feeAmount && (
                          <div>
                            <strong>Fee:</strong> ₦
                            {announcement.feeAmount.toLocaleString()} - Due{" "}
                            {moment(announcement.feeDueDate).format(
                              "DD/MM/YYYY",
                            )}
                          </div>
                        )}
                        {announcement.resultReleaseDate && (
                          <div>
                            <strong>Results Release:</strong>{" "}
                            {moment(announcement.resultReleaseDate).format(
                              "DD/MM/YYYY",
                            )}
                          </div>
                        )}
                        <div className="mt-2">
                          <strong>Audience:</strong>{" "}
                          {announcement.audience?.map((a) => (
                            <span key={a} className="badge bg-secondary me-1">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <small className="text-muted">
                          {moment(announcement.createdAt).format("DD/MM/YYYY")}
                        </small>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => handleSendSms(announcement)}
                            disabled={sendingSms}
                            title="Send SMS Notifications"
                          >
                            {sendingSms ? (
                              <FaSpinner className="spinner" />
                            ) : (
                              <FaBell />
                            )}
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              setSelectedAnnouncement(announcement);
                              fetchSmsHistory(announcement.id);
                            }}
                            title="View SMS History"
                          >
                            <FaEye />
                          </button>
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => handleEdit(announcement)}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(announcement.id)}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {announcements.length === 0 && !loading && (
                <div className="col-12">
                  <div className="alert alert-info">
                    <FaInfoCircle className="me-2" /> No announcements found.
                    Click "Create Announcement" to add one.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnnouncementManager;

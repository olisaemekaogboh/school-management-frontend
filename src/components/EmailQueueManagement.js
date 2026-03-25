// src/components/EmailQueueManagement.js
import React, { useEffect, useMemo, useState } from "react";
import { emailQueueAPI } from "../services/api";
import { toast } from "react-toastify";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import {
  FaEnvelope,
  FaSyncAlt,
  FaRedo,
  FaFilter,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaPaperPlane,
} from "react-icons/fa";
import "./EmailQueueManagement.css";

function EmailQueueManagement() {
  const [emails, setEmails] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [retryingId, setRetryingId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const emailQueueT = t?.emailQueue || {};

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [emailsRes, statsRes] = await Promise.all([
        emailQueueAPI.getAll(),
        emailQueueAPI.getStats(),
      ]);

      setEmails(emailsRes.data || []);
      setStats(statsRes.data || {});
    } catch (error) {
      console.error("Error loading email queue dashboard:", error);
      toast.error(
        emailQueueT.loadError || "Failed to load email queue dashboard",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (status) => {
    setSelectedStatus(status);
    setLoading(true);

    try {
      const emailRes =
        status === "ALL"
          ? await emailQueueAPI.getAll()
          : await emailQueueAPI.getByStatus(status);

      setEmails(emailRes.data || []);
    } catch (error) {
      console.error("Error filtering emails:", error);
      toast.error(emailQueueT.filterError || "Failed to filter emails");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessNow = async () => {
    setProcessing(true);
    try {
      const response = await emailQueueAPI.processNow();
      toast.success(
        response.data?.message ||
          emailQueueT.processTriggered ||
          "Email queue processing triggered",
      );
      await loadDashboard();
    } catch (error) {
      console.error("Error processing queue:", error);
      toast.error(emailQueueT.processError || "Failed to process email queue");
    } finally {
      setProcessing(false);
    }
  };

  const handleRetry = async (queueId) => {
    setRetryingId(queueId);
    try {
      const response = await emailQueueAPI.retryEmail(queueId);
      toast.success(
        response.data?.message ||
          emailQueueT.retryQueued ||
          "Email queued for retry",
      );
      await loadDashboard();
    } catch (error) {
      console.error("Error retrying email:", error);
      toast.error(
        error?.response?.data?.message ||
          emailQueueT.retryError ||
          "Failed to retry email",
      );
    } finally {
      setRetryingId(null);
    }
  };

  const filteredEmails = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return emails;

    return emails.filter((item) => {
      return (
        (item.toEmail || "").toLowerCase().includes(q) ||
        (item.subject || "").toLowerCase().includes(q) ||
        (item.status || "").toLowerCase().includes(q) ||
        String(item.announcementId || "").includes(q)
      );
    });
  }, [emails, searchTerm]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "SENT":
        return "badge-sent";
      case "FAILED":
        return "badge-failed";
      case "PENDING":
        return "badge-pending";
      case "PROCESSING":
        return "badge-processing";
      case "RETRYING":
        return "badge-retrying";
      default:
        return "badge-default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "SENT":
        return <FaCheckCircle className="me-1" />;
      case "FAILED":
        return <FaExclamationTriangle className="me-1" />;
      case "PENDING":
        return <FaClock className="me-1" />;
      case "PROCESSING":
        return <FaSpinner className="me-1 spinner" />;
      case "RETRYING":
        return <FaRedo className="me-1" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      SENT: emailQueueT.statusSent || "Sent",
      FAILED: emailQueueT.statusFailed || "Failed",
      PENDING: emailQueueT.statusPending || "Pending",
      PROCESSING: emailQueueT.statusProcessing || "Processing",
      RETRYING: emailQueueT.statusRetrying || "Retrying",
    };
    return statusMap[status] || status;
  };

  return (
    <div className={`email-queue-container ${darkMode ? "dark-mode" : ""}`}>
      <div className="container py-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
          <div>
            <h2 className="mb-1">
              <FaEnvelope className="me-2 text-primary" />
              {emailQueueT.title || "Email Queue Dashboard"}
            </h2>
            <p className="text-muted mb-0">
              {emailQueueT.subtitle ||
                "Monitor pending, retrying, failed, and sent announcement emails"}
            </p>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button
              className="btn btn-outline-primary"
              onClick={loadDashboard}
              disabled={loading}
            >
              <FaSyncAlt className={loading ? "me-2 spinner" : "me-2"} />
              {emailQueueT.refresh || "Refresh"}
            </button>

            <button
              className="btn btn-primary"
              onClick={handleProcessNow}
              disabled={processing}
            >
              {processing ? (
                <>
                  <FaSpinner className="me-2 spinner" />
                  {emailQueueT.processing || "Processing..."}
                </>
              ) : (
                <>
                  <FaPaperPlane className="me-2" />
                  {emailQueueT.processQueueNow || "Process Queue Now"}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-2 col-6">
            <div className="stat-card stat-card-total">
              <div className="stat-card-body">
                <h6 className="stat-label">{emailQueueT.total || "Total"}</h6>
                <h3 className="stat-value mb-0">{stats.TOTAL || 0}</h3>
              </div>
            </div>
          </div>

          <div className="col-md-2 col-6">
            <div className="stat-card stat-card-pending">
              <div className="stat-card-body">
                <h6 className="stat-label">
                  {emailQueueT.pending || "Pending"}
                </h6>
                <h3 className="stat-value mb-0 text-warning">
                  {stats.PENDING || 0}
                </h3>
              </div>
            </div>
          </div>

          <div className="col-md-2 col-6">
            <div className="stat-card stat-card-processing">
              <div className="stat-card-body">
                <h6 className="stat-label">
                  {emailQueueT.processing || "Processing"}
                </h6>
                <h3 className="stat-value mb-0 text-info">
                  {stats.PROCESSING || 0}
                </h3>
              </div>
            </div>
          </div>

          <div className="col-md-2 col-6">
            <div className="stat-card stat-card-retrying">
              <div className="stat-card-body">
                <h6 className="stat-label">
                  {emailQueueT.retrying || "Retrying"}
                </h6>
                <h3 className="stat-value mb-0 text-secondary">
                  {stats.RETRYING || 0}
                </h3>
              </div>
            </div>
          </div>

          <div className="col-md-2 col-6">
            <div className="stat-card stat-card-sent">
              <div className="stat-card-body">
                <h6 className="stat-label">{emailQueueT.sent || "Sent"}</h6>
                <h3 className="stat-value mb-0 text-success">
                  {stats.SENT || 0}
                </h3>
              </div>
            </div>
          </div>

          <div className="col-md-2 col-6">
            <div className="stat-card stat-card-failed">
              <div className="stat-card-body">
                <h6 className="stat-label">{emailQueueT.failed || "Failed"}</h6>
                <h3 className="stat-value mb-0 text-danger">
                  {stats.FAILED || 0}
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label">
                  <FaFilter className="me-2" />
                  {emailQueueT.statusFilter || "Status Filter"}
                </label>
                <select
                  className="form-select"
                  value={selectedStatus}
                  onChange={(e) => handleFilterChange(e.target.value)}
                >
                  <option value="ALL">{emailQueueT.all || "All"}</option>
                  <option value="PENDING">
                    {emailQueueT.pending || "Pending"}
                  </option>
                  <option value="PROCESSING">
                    {emailQueueT.processing || "Processing"}
                  </option>
                  <option value="RETRYING">
                    {emailQueueT.retrying || "Retrying"}
                  </option>
                  <option value="SENT">{emailQueueT.sent || "Sent"}</option>
                  <option value="FAILED">
                    {emailQueueT.failed || "Failed"}
                  </option>
                </select>
              </div>

              <div className="col-md-8">
                <label className="form-label">
                  {emailQueueT.search || "Search"}
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={
                    emailQueueT.searchPlaceholder ||
                    "Search by email, subject, status, or announcement ID"
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white">
            <h5 className="mb-0">
              {emailQueueT.queuedEmails || "Queued Emails"}
            </h5>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <FaSpinner className="spinner me-2" />
                {emailQueueT.loading || "Loading email queue..."}
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="alert alert-info mb-0">
                {emailQueueT.noRecords || "No email queue records found."}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>{emailQueueT.id || "ID"}</th>
                      <th>{emailQueueT.announcement || "Announcement"}</th>
                      <th>{emailQueueT.recipient || "Recipient"}</th>
                      <th>{emailQueueT.subject || "Subject"}</th>
                      <th>{emailQueueT.status || "Status"}</th>
                      <th>{emailQueueT.retries || "Retries"}</th>
                      <th>{emailQueueT.nextRetry || "Next Retry"}</th>
                      <th>{emailQueueT.sentAt || "Sent At"}</th>
                      <th>{emailQueueT.error || "Error"}</th>
                      <th>{emailQueueT.action || "Action"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmails.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.announcementId || "-"}</td>
                        <td>{item.toEmail}</td>
                        <td style={{ minWidth: "220px" }}>{item.subject}</td>
                        <td>
                          <span
                            className={`badge ${getStatusBadgeClass(item.status)}`}
                          >
                            {getStatusIcon(item.status)}
                            {getStatusLabel(item.status)}
                          </span>
                        </td>
                        <td>
                          {item.retryCount || 0} / {item.maxRetries || 0}
                        </td>
                        <td>{item.nextRetryAt || "-"}</td>
                        <td>{item.sentAt || "-"}</td>
                        <td style={{ maxWidth: "260px", whiteSpace: "normal" }}>
                          {item.errorMessage || "-"}
                        </td>
                        <td>
                          {(item.status === "FAILED" ||
                            item.status === "RETRYING") && (
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => handleRetry(item.id)}
                              disabled={retryingId === item.id}
                            >
                              {retryingId === item.id ? (
                                <>
                                  <FaSpinner className="spinner me-1" />
                                  {emailQueueT.retrying || "Retrying"}
                                </>
                              ) : (
                                <>
                                  <FaRedo className="me-1" />
                                  {emailQueueT.retry || "Retry"}
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailQueueManagement;

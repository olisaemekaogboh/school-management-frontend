import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import {
  FaDownload,
  FaPrint,
  FaSpinner,
  FaFilePdf,
  FaFileExcel,
  FaChartBar,
  FaUserGraduate,
  FaSchool,
  FaClipboardCheck,
  FaGraduationCap,
  FaLayerGroup,
  FaCalendarAlt,
  FaTimes,
} from "react-icons/fa";
import {
  studentAPI,
  resultAPI,
  attendanceAPI,
  sessionResultAPI,
  classAPI,
} from "../services/api";
import { toast } from "react-toastify";
import moment from "moment";

function ReportModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const [reportType, setReportType] = useState("student");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSession, setSelectedSession] = useState("2025/2026");
  const [selectedTerm, setSelectedTerm] = useState("FIRST");
  const [dateRange, setDateRange] = useState({
    startDate: moment().subtract(30, "days").format("YYYY-MM-DD"),
    endDate: moment().format("YYYY-MM-DD"),
  });

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportPreview, setReportPreview] = useState(null);

  const sessions = ["2023/2024", "2024/2025", "2025/2026", "2026/2027"];
  const terms = ["FIRST", "SECOND", "THIRD"];

  const reportTypeOptions = [
    {
      key: "student",
      label: t?.reportModal?.studentTermReport || "Student Report",
      icon: <FaUserGraduate />,
      description: "Single student term performance",
    },
    {
      key: "session",
      label: t?.reportModal?.sessionResultReport || "Session Result",
      icon: <FaGraduationCap />,
      description: "Single student annual/session report",
    },
    {
      key: "class",
      label: t?.reportModal?.classReport || "Class Report",
      icon: <FaLayerGroup />,
      description: "Rankings and class performance",
    },
    {
      key: "attendance",
      label: t?.reportModal?.attendanceReport || "Attendance Report",
      icon: <FaClipboardCheck />,
      description: "Class attendance overview",
    },
    {
      key: "school",
      label: t?.reportModal?.schoolReport || "School Report",
      icon: <FaSchool />,
      description: "Whole-school performance summary",
    },
  ];

  const selectedStudent = useMemo(
    () =>
      students.find((s) => String(s.id) === String(selectedStudentId)) || null,
    [students, selectedStudentId],
  );

  const selectedClass = useMemo(
    () => classes.find((c) => String(c.id) === String(selectedClassId)) || null,
    [classes, selectedClassId],
  );

  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.content)) return value.content;
    if (Array.isArray(value?.data)) return value.data;
    return [];
  };

  const getStudentDisplayName = (student) => {
    if (!student) return "Unknown Student";
    if (student.fullName && String(student.fullName).trim()) {
      return student.fullName;
    }

    return [student.firstName, student.middleName, student.lastName]
      .filter((part) => part && String(part).trim())
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const getClassDisplayName = (classItem) => {
    if (!classItem) return "";
    const className =
      classItem.className || classItem.studentClass || classItem.name || "";
    const arm = classItem.arm || classItem.classArm || "";
    return `${className}${arm ? ` - ${arm}` : ""}`.trim();
  };

  const normalizeStudents = (raw) => {
    return toArray(raw).map((student) => ({
      id: student.id,
      fullName: student.fullName || getStudentDisplayName(student),
      admissionNumber: student.admissionNumber || "",
      studentClass: student.studentClass || student.className || "",
      classArm: student.classArm || student.arm || "",
    }));
  };

  const normalizeClasses = (rawClasses, fallbackStudents = []) => {
    const classList = toArray(rawClasses);

    if (classList.length > 0) {
      return classList.map((item) => ({
        id: item.id,
        className: item.className || item.studentClass || item.name || "",
        arm: item.arm || item.classArm || "",
        classCode: item.classCode || "",
      }));
    }

    const derived = new Map();

    fallbackStudents.forEach((student) => {
      const className = student.studentClass || "";
      const arm = student.classArm || "";
      const key = `${className}__${arm}`;
      if (!className) return;

      if (!derived.has(key)) {
        derived.set(key, {
          id: key,
          className,
          arm,
          classCode: `${String(className)
            .replace(/\s+/g, "")
            .toUpperCase()}${arm ? `-${arm}` : ""}`,
        });
      }
    });

    return Array.from(derived.values());
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [studentsRes, classesRes] = await Promise.all([
          studentAPI.getPaginatedStudents
            ? studentAPI.getPaginatedStudents(0, 200)
            : studentAPI.getAllStudents(),
          classAPI?.getAllClasses
            ? classAPI.getAllClasses()
            : Promise.resolve({ data: [] }),
        ]);

        const normalizedStudents = normalizeStudents(studentsRes?.data);
        const normalizedClasses = normalizeClasses(
          classesRes?.data,
          normalizedStudents,
        );

        setStudents(normalizedStudents);
        setClasses(normalizedClasses);
      } catch (error) {
        console.error("Error loading report modal data:", error);
        toast.error(t?.reportModal?.loadFailed || "Failed to load report data");
        setStudents([]);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [isOpen, t]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEsc);
    document.body.classList.add("modal-open");
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    setReportPreview(null);
  }, [
    reportType,
    reportFormat,
    selectedStudentId,
    selectedClassId,
    selectedSession,
    selectedTerm,
    dateRange,
  ]);

  const buildPreview = (typeLabel, responseData, extra = {}) => ({
    type: typeLabel,
    generatedAt: moment().format("DD/MM/YYYY h:mm A"),
    session: selectedSession,
    term: selectedTerm,
    reportFormat,
    data: responseData,
    ...extra,
  });

  const validateSelection = () => {
    if (
      (reportType === "student" || reportType === "session") &&
      !selectedStudentId
    ) {
      toast.error(t?.reportModal?.selectStudent || "Please select a student");
      return false;
    }

    if (
      (reportType === "class" || reportType === "attendance") &&
      !selectedClassId
    ) {
      toast.error(t?.reportModal?.selectClass || "Please select a class");
      return false;
    }

    if (
      reportType === "attendance" &&
      dateRange.startDate &&
      dateRange.endDate &&
      dateRange.startDate > dateRange.endDate
    ) {
      toast.error(
        t?.reportModal?.invalidDateRange ||
          "Start date cannot be after end date",
      );
      return false;
    }

    return true;
  };

  const handleGenerateReport = async () => {
    if (!validateSelection()) return;

    setGenerating(true);
    setReportPreview(null);

    try {
      let response;
      let preview;

      switch (reportType) {
        case "student": {
          response = await resultAPI.getTermResult(
            selectedStudentId,
            selectedSession,
            selectedTerm,
          );

          preview = buildPreview(
            t?.reportModal?.studentTermReport || "Student Term Report",
            response?.data,
            { student: selectedStudent },
          );
          break;
        }

        case "session": {
          response = await sessionResultAPI.getSessionResult(
            selectedStudentId,
            selectedSession,
          );

          preview = buildPreview(
            t?.reportModal?.sessionResultReport || "Session Result Report",
            response?.data,
            { student: selectedStudent },
          );
          break;
        }

        case "class": {
          response = await resultAPI.getClassRankings(
            selectedClassId,
            selectedSession,
            selectedTerm,
          );

          preview = buildPreview(
            t?.reportModal?.classReport || "Class Report",
            response?.data,
            { classItem: selectedClass },
          );
          break;
        }

        case "attendance": {
          response = await attendanceAPI.getClassTermStatistics(
            selectedClassId,
            selectedSession,
            selectedTerm,
          );

          preview = buildPreview(
            t?.reportModal?.attendanceReport || "Attendance Report",
            response?.data,
            {
              classItem: selectedClass,
              dateRange,
            },
          );
          break;
        }

        case "school": {
          response = await sessionResultAPI.getSchoolRankings(selectedSession);

          preview = buildPreview(
            t?.reportModal?.schoolReport || "School Performance Report",
            response?.data,
          );
          break;
        }

        default:
          preview = null;
      }

      setReportPreview(preview);
      toast.success(
        t?.reportModal?.generated || "Report generated successfully",
      );
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(
        error?.response?.data?.message ||
          t?.reportModal?.generateFailed ||
          "Failed to generate report",
      );
    } finally {
      setGenerating(false);
    }
  };

  const convertArrayToCSV = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return "";

    const normalizedRows = rows.map((row) =>
      row && typeof row === "object" ? row : { value: row },
    );

    const headers = Array.from(
      normalizedRows.reduce((set, row) => {
        Object.keys(row).forEach((key) => set.add(key));
        return set;
      }, new Set()),
    );

    const escapeCell = (value) => {
      const str = value == null ? "" : String(value);
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = [
      headers.join(","),
      ...normalizedRows.map((row) =>
        headers.map((header) => escapeCell(row[header])).join(","),
      ),
    ];

    return lines.join("\n");
  };

  const previewSummary = useMemo(() => {
    if (!reportPreview?.data) return [];

    const data = reportPreview.data;
    const items = [];

    if (reportType === "student" || reportType === "session") {
      items.push({
        label: t?.reportModal?.student || "Student",
        value: selectedStudent?.fullName || "N/A",
      });
    }

    if (reportType === "class" || reportType === "attendance") {
      items.push({
        label: t?.reportModal?.class || "Class",
        value: getClassDisplayName(selectedClass) || "N/A",
      });
    }

    items.push({
      label: t?.reportModal?.session || "Session",
      value: reportPreview.session || selectedSession,
    });

    if (reportType !== "school" && reportType !== "session") {
      items.push({
        label: t?.reportModal?.term || "Term",
        value: reportPreview.term || selectedTerm,
      });
    }

    if (reportType === "attendance") {
      items.push({
        label: t?.reportModal?.dateRange || "Date Range",
        value: `${dateRange.startDate} → ${dateRange.endDate}`,
      });
    }

    if (Array.isArray(data)) {
      items.push({
        label: t?.reportModal?.records || "Records",
        value: data.length,
      });
    } else if (typeof data === "object") {
      items.push({
        label: t?.reportModal?.dataType || "Data Type",
        value: "Object response",
      });
    }

    return items;
  }, [
    reportPreview,
    reportType,
    selectedStudent,
    selectedClass,
    selectedSession,
    selectedTerm,
    dateRange,
    t,
  ]);

  const handleDownload = () => {
    if (!reportPreview) {
      toast.error(t?.reportModal?.generateFirst || "Generate a report first");
      return;
    }

    const safeType = String(reportType || "report").toLowerCase();
    const safeSession = String(selectedSession || "session").replace(
      /[^\w-]/g,
      "_",
    );
    const safeTerm = String(selectedTerm || "term").toLowerCase();
    const filenameBase = `${safeType}_${safeSession}_${safeTerm}_${moment().format("YYYYMMDD_HHmmss")}`;

    let blob;
    let filename;

    if (reportFormat === "excel") {
      const csvContent = Array.isArray(reportPreview.data)
        ? convertArrayToCSV(reportPreview.data)
        : convertArrayToCSV([reportPreview.data || {}]);

      blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      filename = `${filenameBase}.csv`;
    } else {
      const printableText = `
${reportPreview.type}
Generated: ${reportPreview.generatedAt}
Session: ${reportPreview.session || ""}
Term: ${reportPreview.term || ""}

${previewSummary.map((item) => `${item.label}: ${item.value}`).join("\n")}

Data:
${JSON.stringify(reportPreview.data, null, 2)}
      `.trim();

      blob = new Blob([printableText], { type: "text/plain;charset=utf-8;" });
      filename = `${filenameBase}.txt`;
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success(t?.common?.download || "Download started");
  };

  const handlePrint = () => {
    if (!reportPreview) {
      toast.error(t?.reportModal?.generateFirst || "Generate a report first");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      toast.error("Popup blocked. Please allow popups to print.");
      return;
    }

    const summaryHtml = previewSummary
      .map(
        (item) =>
          `<p style="margin:0 0 8px;"><strong>${item.label}:</strong> ${item.value}</p>`,
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${reportPreview.type}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #111827;
            }
            h1 {
              margin-bottom: 8px;
            }
            .meta {
              margin-bottom: 20px;
              padding: 16px;
              background: #f3f4f6;
              border-radius: 10px;
            }
            pre {
              white-space: pre-wrap;
              word-break: break-word;
              background: #fafafa;
              padding: 16px;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
            }
          </style>
        </head>
        <body>
          <h1>${reportPreview.type}</h1>
          <div class="meta">
            ${summaryHtml}
            <p style="margin:12px 0 0;"><strong>Generated On:</strong> ${reportPreview.generatedAt}</p>
          </div>
          <pre>${JSON.stringify(reportPreview.data, null, 2)}</pre>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const renderValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return <span className="rm-empty">—</span>;
    }

    if (typeof value === "object") {
      return (
        <span className="rm-pill rm-pill-muted">
          {Array.isArray(value) ? `${value.length} items` : "Object"}
        </span>
      );
    }

    return String(value);
  };

  const renderObjectGrid = (obj) => {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;

    const entries = Object.entries(obj);

    if (entries.length === 0) {
      return <div className="rm-empty-state">No data available</div>;
    }

    return (
      <div className="rm-object-grid">
        {entries.map(([key, value]) => (
          <div key={key} className="rm-object-card">
            <div className="rm-object-key">{key}</div>
            <div className="rm-object-value">{renderValue(value)}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderArrayTable = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) {
      return <div className="rm-empty-state">No records found</div>;
    }

    const normalized = arr.map((item) =>
      item && typeof item === "object" ? item : { value: item },
    );

    const columns = Array.from(
      normalized.reduce((set, row) => {
        Object.keys(row).forEach((key) => set.add(key));
        return set;
      }, new Set()),
    ).slice(0, 8);

    return (
      <div className="rm-table-wrap">
        <table className="table rm-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {normalized.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column}>{renderValue(row[column])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPreviewContent = () => {
    if (!reportPreview?.data) return null;

    if (Array.isArray(reportPreview.data)) {
      return renderArrayTable(reportPreview.data);
    }

    if (typeof reportPreview.data === "object") {
      return renderObjectGrid(reportPreview.data);
    }

    return <div className="rm-empty-state">{String(reportPreview.data)}</div>;
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal fade show d-block"
        style={{
          backgroundColor: "rgba(2, 6, 23, 0.68)",
          backdropFilter: "blur(4px)",
        }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
      >
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div
            className={`modal-content rm-modal ${darkMode ? "dark-mode" : ""}`}
          >
            <div className="modal-header rm-header border-0">
              <div>
                <h5 className="modal-title d-flex align-items-center gap-2 mb-1">
                  <FaChartBar />
                  {t?.reportModal?.title || "Generate Report"}
                </h5>
                <div className="rm-subtitle">
                  Build, preview, print, or export school reports
                </div>
              </div>

              <button
                type="button"
                className="btn rm-close-btn"
                onClick={onClose}
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body rm-body">
              <div className="rm-layout">
                <div className="rm-left">
                  <div className="rm-section-card">
                    <div className="rm-section-title">
                      {t?.reportModal?.reportType || "Report Type"}
                    </div>

                    <div className="rm-type-grid">
                      {reportTypeOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          className={`rm-type-card ${
                            reportType === option.key ? "active" : ""
                          }`}
                          onClick={() => setReportType(option.key)}
                        >
                          <div className="rm-type-icon">{option.icon}</div>
                          <div className="rm-type-text">
                            <div className="rm-type-label">{option.label}</div>
                            <div className="rm-type-desc">
                              {option.description}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rm-section-card">
                    <div className="rm-section-title">Filters</div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label rm-label">
                          {t?.reportModal?.session || "Session"}
                        </label>
                        <select
                          className="form-select rm-select"
                          value={selectedSession}
                          onChange={(e) => setSelectedSession(e.target.value)}
                        >
                          {sessions.map((session) => (
                            <option key={session} value={session}>
                              {session}
                            </option>
                          ))}
                        </select>
                      </div>

                      {(reportType === "student" ||
                        reportType === "class" ||
                        reportType === "attendance") && (
                        <div className="col-md-6">
                          <label className="form-label rm-label">
                            {t?.reportModal?.term || "Term"}
                          </label>
                          <select
                            className="form-select rm-select"
                            value={selectedTerm}
                            onChange={(e) => setSelectedTerm(e.target.value)}
                          >
                            {terms.map((term) => (
                              <option key={term} value={term}>
                                {term}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {(reportType === "student" ||
                        reportType === "session") && (
                        <div className="col-md-12">
                          <label className="form-label rm-label">
                            {t?.reportModal?.student || "Student"}
                          </label>
                          <select
                            className="form-select rm-select"
                            value={selectedStudentId}
                            onChange={(e) =>
                              setSelectedStudentId(e.target.value)
                            }
                            disabled={loading}
                          >
                            <option value="">
                              {loading
                                ? t?.common?.loading || "Loading..."
                                : t?.common?.select || "Select Student"}
                            </option>
                            {students.map((student) => (
                              <option key={student.id} value={student.id}>
                                {student.fullName} - {student.admissionNumber}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {(reportType === "class" ||
                        reportType === "attendance") && (
                        <div className="col-md-12">
                          <label className="form-label rm-label">
                            {t?.reportModal?.class || "Class"}
                          </label>
                          <select
                            className="form-select rm-select"
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            disabled={loading}
                          >
                            <option value="">
                              {loading
                                ? t?.common?.loading || "Loading..."
                                : t?.common?.select || "Select Class"}
                            </option>
                            {classes.map((classItem) => (
                              <option key={classItem.id} value={classItem.id}>
                                {getClassDisplayName(classItem)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {reportType === "attendance" && (
                        <>
                          <div className="col-md-6">
                            <label className="form-label rm-label">
                              {t?.reportModal?.startDate || "Start Date"}
                            </label>
                            <div className="rm-input-icon">
                              <FaCalendarAlt className="rm-input-icon-svg" />
                              <input
                                type="date"
                                className="form-control rm-input"
                                value={dateRange.startDate}
                                onChange={(e) =>
                                  setDateRange((prev) => ({
                                    ...prev,
                                    startDate: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <div className="col-md-6">
                            <label className="form-label rm-label">
                              {t?.reportModal?.endDate || "End Date"}
                            </label>
                            <div className="rm-input-icon">
                              <FaCalendarAlt className="rm-input-icon-svg" />
                              <input
                                type="date"
                                className="form-control rm-input"
                                value={dateRange.endDate}
                                onChange={(e) =>
                                  setDateRange((prev) => ({
                                    ...prev,
                                    endDate: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rm-section-card">
                    <div className="rm-section-title">
                      {t?.reportModal?.format || "Export Format"}
                    </div>

                    <div className="rm-format-toggle">
                      <button
                        type="button"
                        className={`rm-format-btn ${
                          reportFormat === "pdf" ? "active pdf" : ""
                        }`}
                        onClick={() => setReportFormat("pdf")}
                      >
                        <FaFilePdf />
                        <span>PDF</span>
                      </button>

                      <button
                        type="button"
                        className={`rm-format-btn ${
                          reportFormat === "excel" ? "active excel" : ""
                        }`}
                        onClick={() => setReportFormat("excel")}
                      >
                        <FaFileExcel />
                        <span>Excel</span>
                      </button>
                    </div>

                    <div className="rm-generate-wrap">
                      <button
                        className="btn rm-generate-btn"
                        onClick={handleGenerateReport}
                        disabled={generating || loading}
                      >
                        {generating ? (
                          <>
                            <FaSpinner className="spinner me-2" />
                            {t?.common?.generating || "Generating..."}
                          </>
                        ) : (
                          <>
                            <FaChartBar className="me-2" />
                            {t?.reportModal?.generate || "Generate Report"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rm-right">
                  <div className="rm-preview-card">
                    <div className="rm-preview-head">
                      <div>
                        <div className="rm-preview-kicker">
                          {t?.reportModal?.preview || "Report Preview"}
                        </div>
                        <h6 className="mb-0">
                          {reportPreview?.type || "No report generated yet"}
                        </h6>
                      </div>

                      {reportPreview && (
                        <div className="rm-preview-actions">
                          <button
                            className="btn rm-action-btn download"
                            onClick={handleDownload}
                          >
                            <FaDownload />
                            <span>{t?.common?.download || "Download"}</span>
                          </button>
                          <button
                            className="btn rm-action-btn print"
                            onClick={handlePrint}
                          >
                            <FaPrint />
                            <span>{t?.common?.print || "Print"}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {!reportPreview ? (
                      <div className="rm-empty-preview">
                        <div className="rm-empty-icon">
                          <FaChartBar />
                        </div>
                        <h6>Nothing to preview yet</h6>
                        <p>
                          Select a report type, choose the right filters, and
                          generate a preview.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="rm-summary-grid">
                          {previewSummary.map((item) => (
                            <div key={item.label} className="rm-summary-card">
                              <div className="rm-summary-label">
                                {item.label}
                              </div>
                              <div className="rm-summary-value">
                                {item.value}
                              </div>
                            </div>
                          ))}
                          <div className="rm-summary-card">
                            <div className="rm-summary-label">
                              {t?.reportModal?.generatedOn || "Generated On"}
                            </div>
                            <div className="rm-summary-value">
                              {reportPreview.generatedAt}
                            </div>
                          </div>
                        </div>

                        <div className="rm-data-panel">
                          <div className="rm-data-title">Preview Data</div>
                          {renderPreviewContent()}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .rm-modal {
          border: 0;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(2, 6, 23, 0.32);
          background: #ffffff;
        }

        .rm-modal.dark-mode {
          background: #0f172a;
          color: #f8fafc;
        }

        .rm-header {
          padding: 1.25rem 1.5rem 0.75rem;
          background:
            linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(124, 58, 237, 0.08));
        }

        .rm-modal.dark-mode .rm-header {
          background:
            linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(124, 58, 237, 0.16));
        }

        .rm-subtitle {
          color: #64748b;
          font-size: 0.92rem;
        }

        .rm-modal.dark-mode .rm-subtitle {
          color: #cbd5e1;
        }

        .rm-close-btn {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.06);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          flex-shrink: 0;
        }

        .rm-modal.dark-mode .rm-close-btn {
          background: rgba(255, 255, 255, 0.08);
          color: #f8fafc;
        }

        .rm-body {
          padding: 1.25rem 1.5rem 1.5rem;
          overflow-x: hidden;
        }

        .rm-layout {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 1.25rem;
          min-width: 0;
        }

        .rm-left,
        .rm-right {
          min-width: 0;
          width: 100%;
        }

        .rm-section-card,
        .rm-preview-card {
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.9);
          padding: 1rem;
          min-width: 0;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .rm-modal.dark-mode .rm-section-card,
        .rm-modal.dark-mode .rm-preview-card {
          background: rgba(15, 23, 42, 0.72);
          border-color: rgba(148, 163, 184, 0.16);
        }

        .rm-section-title {
          font-size: 0.95rem;
          font-weight: 800;
          margin-bottom: 0.95rem;
          color: #0f172a;
        }

        .rm-modal.dark-mode .rm-section-title {
          color: #f8fafc;
        }

        .rm-type-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          min-width: 0;
        }

        .rm-type-card {
          width: 100%;
          min-width: 0;
          display: flex;
          align-items: flex-start;
          gap: 0.9rem;
          padding: 1rem;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.88);
          text-align: left;
          transition: all 0.25s ease;
          overflow: hidden;
        }

        .rm-modal.dark-mode .rm-type-card {
          background: rgba(15, 23, 42, 0.72);
          border-color: rgba(148, 163, 184, 0.2);
          color: #f8fafc;
        }

        .rm-type-card:hover {
          transform: translateY(-2px);
          border-color: rgba(37, 99, 235, 0.35);
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
        }

        .rm-type-card.active {
          border-color: #2563eb;
          background: rgba(37, 99, 235, 0.08);
          box-shadow: 0 10px 24px rgba(37, 99, 235, 0.14);
        }

        .rm-modal.dark-mode .rm-type-card.active {
          background: rgba(37, 99, 235, 0.16);
          border-color: #60a5fa;
        }

        .rm-type-icon {
          flex: 0 0 52px;
          width: 52px;
          height: 52px;
          min-width: 52px;
          min-height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          background: linear-gradient(135deg, #008753, #003366);
          color: #fff;
          overflow: hidden;
        }

        .rm-type-text {
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
        }

        .rm-type-label {
          font-size: 0.98rem;
          font-weight: 700;
          line-height: 1.35;
          color: inherit;
          word-break: break-word;
        }

        .rm-type-desc {
          margin-top: 0.25rem;
          font-size: 0.85rem;
          line-height: 1.45;
          color: #64748b;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .rm-modal.dark-mode .rm-type-desc {
          color: #cbd5e1;
        }

        .rm-label {
          font-weight: 700;
          color: #334155;
          margin-bottom: 0.4rem;
        }

        .rm-modal.dark-mode .rm-label {
          color: #e2e8f0;
        }

        .rm-select,
        .rm-input {
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.24);
          min-width: 0;
        }

        .rm-modal.dark-mode .rm-select,
        .rm-modal.dark-mode .rm-input {
          background: #0b1220;
          color: #f8fafc;
          border-color: rgba(148, 163, 184, 0.16);
        }

        .rm-input-icon {
          position: relative;
          min-width: 0;
        }

        .rm-input-icon-svg {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }

        .rm-input-icon .rm-input {
          padding-left: 2.5rem;
        }

        .rm-format-toggle {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.85rem;
        }

        .rm-format-btn {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: #ffffff;
          border-radius: 16px;
          padding: 0.95rem 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.55rem;
          font-weight: 700;
          transition: all 0.2s ease;
          min-width: 0;
        }

        .rm-format-btn span {
          min-width: 0;
        }

        .rm-format-btn.active.pdf {
          border-color: #dc2626;
          background: rgba(220, 38, 38, 0.08);
          color: #dc2626;
        }

        .rm-format-btn.active.excel {
          border-color: #008753;
          background: rgba(0, 135, 83, 0.08);
          color: #008753;
        }

        .rm-modal.dark-mode .rm-format-btn {
          background: #111827;
          color: #f8fafc;
          border-color: rgba(148, 163, 184, 0.16);
        }

        .rm-generate-wrap {
          margin-top: 1rem;
        }

        .rm-generate-btn {
          width: 100%;
          border: 0;
          border-radius: 16px;
          padding: 0.95rem 1rem;
          font-weight: 800;
          background: linear-gradient(135deg, #008753, #003366);
          color: #ffffff;
        }

        .rm-generate-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .rm-preview-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
          min-width: 0;
        }

        .rm-preview-kicker {
          font-size: 0.76rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 800;
          color: #64748b;
          margin-bottom: 0.25rem;
        }

        .rm-modal.dark-mode .rm-preview-kicker {
          color: #94a3b8;
        }

        .rm-preview-actions {
          display: flex;
          gap: 0.65rem;
          flex-wrap: wrap;
          min-width: 0;
        }

        .rm-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          border-radius: 12px;
          font-weight: 700;
          border: 0;
          padding: 0.7rem 0.95rem;
          white-space: nowrap;
        }

        .rm-action-btn.download {
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
        }

        .rm-action-btn.print {
          background: rgba(0, 135, 83, 0.1);
          color: #008753;
        }

        .rm-empty-preview {
          min-height: 340px;
          border: 1px dashed rgba(148, 163, 184, 0.24);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          padding: 2rem 1.25rem;
          color: #64748b;
        }

        .rm-modal.dark-mode .rm-empty-preview {
          color: #cbd5e1;
          border-color: rgba(148, 163, 184, 0.16);
        }

        .rm-empty-icon {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(124, 58, 237, 0.12));
          color: #2563eb;
        }

        .rm-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
          min-width: 0;
        }

        .rm-summary-card {
          border-radius: 14px;
          padding: 0.85rem;
          background: #f8fafc;
          border: 1px solid rgba(148, 163, 184, 0.12);
          min-width: 0;
          overflow: hidden;
        }

        .rm-modal.dark-mode .rm-summary-card {
          background: #111827;
          border-color: rgba(148, 163, 184, 0.1);
        }

        .rm-summary-label {
          font-size: 0.76rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.3rem;
        }

        .rm-modal.dark-mode .rm-summary-label {
          color: #94a3b8;
        }

        .rm-summary-value {
          font-size: 0.94rem;
          font-weight: 700;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .rm-data-panel {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 16px;
          padding: 1rem;
          min-width: 0;
          overflow: hidden;
        }

        .rm-data-title {
          font-weight: 800;
          margin-bottom: 0.9rem;
        }

        .rm-object-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          min-width: 0;
        }

        .rm-object-card {
          border-radius: 14px;
          padding: 0.85rem;
          background: #f8fafc;
          border: 1px solid rgba(148, 163, 184, 0.12);
          min-width: 0;
        }

        .rm-modal.dark-mode .rm-object-card {
          background: #111827;
          border-color: rgba(148, 163, 184, 0.1);
        }

        .rm-object-key {
          font-size: 0.78rem;
          font-weight: 800;
          color: #64748b;
          margin-bottom: 0.35rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .rm-modal.dark-mode .rm-object-key {
          color: #94a3b8;
        }

        .rm-object-value {
          font-size: 0.94rem;
          font-weight: 600;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .rm-table-wrap {
          overflow: auto;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          max-width: 100%;
        }

        .rm-table {
          margin-bottom: 0;
          font-size: 0.88rem;
          min-width: 100%;
        }

        .rm-table thead th {
          position: sticky;
          top: 0;
          background: #eef2ff;
          color: #1e293b;
          border-bottom: 1px solid rgba(148, 163, 184, 0.16);
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .rm-modal.dark-mode .rm-table thead th {
          background: #1e293b;
          color: #e2e8f0;
          border-bottom-color: rgba(148, 163, 184, 0.14);
        }

        .rm-table td {
          word-break: break-word;
          overflow-wrap: anywhere;
          vertical-align: top;
        }

        .rm-modal.dark-mode .rm-table td {
          background: #0b1220;
          color: #f8fafc;
          border-color: rgba(148, 163, 184, 0.08);
        }

        .rm-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.55rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          max-width: 100%;
        }

        .rm-pill-muted {
          background: rgba(100, 116, 139, 0.12);
          color: #475569;
        }

        .rm-modal.dark-mode .rm-pill-muted {
          background: rgba(148, 163, 184, 0.16);
          color: #cbd5e1;
        }

        .rm-empty,
        .rm-empty-state {
          color: #94a3b8;
        }

        .spinner {
          animation: rmSpin 1s linear infinite;
        }

        @keyframes rmSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1199px) {
          .rm-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 991.98px) {
          .rm-type-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 767px) {
          .rm-body {
            padding: 1rem;
          }

          .rm-header {
            padding: 1rem 1rem 0.65rem;
          }

          .rm-summary-grid,
          .rm-object-grid,
          .rm-format-toggle {
            grid-template-columns: 1fr;
          }

          .rm-preview-head {
            flex-direction: column;
            align-items: stretch;
          }

          .rm-preview-actions {
            width: 100%;
          }

          .rm-action-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 576px) {
          .rm-type-card {
            padding: 0.85rem;
            gap: 0.75rem;
          }

          .rm-type-icon {
            flex: 0 0 44px;
            width: 44px;
            height: 44px;
            min-width: 44px;
            min-height: 44px;
            font-size: 1rem;
          }

          .rm-type-label {
            font-size: 0.92rem;
          }

          .rm-type-desc {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </>
  );
}

export default ReportModal;
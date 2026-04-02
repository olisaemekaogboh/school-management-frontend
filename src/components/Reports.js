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
  FaFilter,
  FaFolderOpen,
  FaBolt,
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

function Reports() {
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
        console.error("Error loading reports page data:", error);
        toast.error(t?.reportModal?.loadFailed || "Failed to load report data");
        setStudents([]);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [t]);

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
            { classItem: selectedClass, dateRange },
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

  const normalizeRowsForTable = (data) => {
    if (Array.isArray(data)) {
      return data.map((item) =>
        item && typeof item === "object" ? item : { value: item },
      );
    }

    if (data && typeof data === "object") {
      return Object.entries(data).map(([key, value]) => ({
        field: key,
        value:
          value && typeof value === "object"
            ? Array.isArray(value)
              ? `${value.length} items`
              : JSON.stringify(value)
            : value ?? "",
      }));
    }

    return [{ value: data ?? "" }];
  };

  const getTableColumns = (rows) => {
    return Array.from(
      rows.reduce((set, row) => {
        Object.keys(row || {}).forEach((key) => set.add(key));
        return set;
      }, new Set()),
    );
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

  const escapeHtml = (value) => {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
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

  const renderHtmlTable = (data) => {
    const rows = normalizeRowsForTable(data);
    const columns = getTableColumns(rows);

    if (!rows.length || !columns.length) {
      return `<div class="print-empty">No data available</div>`;
    }

    return `
      <div class="print-table-wrap">
        <table class="print-table">
          <thead>
            <tr>
              ${columns.map((col) => `<th>${escapeHtml(col)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>
                    ${columns
                      .map((col) => {
                        const value = row[col];
                        const safeValue =
                          value && typeof value === "object"
                            ? Array.isArray(value)
                              ? `${value.length} items`
                              : JSON.stringify(value)
                            : value ?? "—";

                        return `<td>${escapeHtml(safeValue)}</td>`;
                      })
                      .join("")}
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  };

  const buildReportHtml = () => {
    const summaryHtml = previewSummary
      .map(
        (item) => `
          <div class="print-summary-card">
            <div class="print-summary-label">${escapeHtml(item.label)}</div>
            <div class="print-summary-value">${escapeHtml(item.value)}</div>
          </div>
        `,
      )
      .join("");

    const tableHtml = renderHtmlTable(reportPreview?.data);

    return `
      <html>
        <head>
          <title>${escapeHtml(reportPreview?.type || "Report")}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #111827;
              background: #ffffff;
            }

            .print-header {
              margin-bottom: 24px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 16px;
            }

            .print-kicker {
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
              letter-spacing: 0.08em;
              margin-bottom: 6px;
            }

            .print-title {
              font-size: 28px;
              font-weight: 800;
              margin: 0 0 8px;
              color: #0f172a;
            }

            .print-subtitle {
              margin: 0;
              color: #475569;
              font-size: 14px;
            }

            .print-summary-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 12px;
              margin: 20px 0 24px;
            }

            .print-summary-card {
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              padding: 12px;
              background: #f8fafc;
            }

            .print-summary-label {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 6px;
            }

            .print-summary-value {
              font-size: 14px;
              font-weight: 700;
              color: #111827;
              word-break: break-word;
            }

            .print-section-title {
              font-size: 16px;
              font-weight: 800;
              margin: 0 0 12px;
              color: #0f172a;
            }

            .print-table-wrap {
              overflow: visible;
            }

            .print-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
            }

            .print-table th {
              background: #eaf2ff;
              color: #0f172a;
              text-align: left;
              padding: 10px;
              border: 1px solid #dbe3ea;
            }

            .print-table td {
              padding: 10px;
              border: 1px solid #e5e7eb;
              vertical-align: top;
              word-break: break-word;
            }

            .print-empty {
              padding: 16px;
              border: 1px dashed #cbd5e1;
              border-radius: 10px;
              color: #64748b;
            }

            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <div class="print-kicker">School Report</div>
            <h1 class="print-title">${escapeHtml(reportPreview?.type || "Report")}</h1>
            <p class="print-subtitle">Generated on ${escapeHtml(reportPreview?.generatedAt || "")}</p>
          </div>

          <div class="print-summary-grid">
            ${summaryHtml}
            <div class="print-summary-card">
              <div class="print-summary-label">Format</div>
              <div class="print-summary-value">${escapeHtml(reportFormat.toUpperCase())}</div>
            </div>
          </div>

          <h2 class="print-section-title">Report Data</h2>
          ${tableHtml}
        </body>
      </html>
    `;
  };

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
      const rows = normalizeRowsForTable(reportPreview.data);
      const csvContent = convertArrayToCSV(rows);
      blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      filename = `${filenameBase}.csv`;
    } else {
      const htmlContent = buildReportHtml();
      blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
      filename = `${filenameBase}.html`;
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

    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) {
      toast.error("Popup blocked. Please allow popups to print.");
      return;
    }

    printWindow.document.write(buildReportHtml());
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const renderValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return <span className="rp-empty">—</span>;
    }

    if (typeof value === "object") {
      return (
        <span className="rp-pill rp-pill-muted">
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
      return <div className="rp-empty-state">No data available</div>;
    }

    return (
      <div className="rp-object-grid">
        {entries.map(([key, value]) => (
          <div key={key} className="rp-object-card">
            <div className="rp-object-key">{key}</div>
            <div className="rp-object-value">{renderValue(value)}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderArrayTable = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) {
      return <div className="rp-empty-state">No records found</div>;
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
      <div className="rp-table-wrap">
        <table className="table rp-table">
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

    return <div className="rp-empty-state">{String(reportPreview.data)}</div>;
  };

  return (
    <>
      <div className={`reports-page ${darkMode ? "dark-mode" : ""}`}>
        <div className="container-fluid reports-shell">
          <div className="reports-hero">
            <div className="reports-hero-copy">
              <div className="reports-page-kicker">Admin Reports Center</div>
              <h1 className="reports-page-title">
                Generate School Reports
              </h1>
              <p className="reports-page-subtitle">
                Build polished academic and operational reports for students,
                classes, attendance, sessions, and school-wide performance.
              </p>

              <div className="reports-hero-badges">
                <span className="reports-badge">
                  <FaBolt /> Fast generation
                </span>
                <span className="reports-badge">
                  <FaFolderOpen /> Centralized exports
                </span>
                <span className="reports-badge">
                  <FaChartBar /> Admin-only reporting
                </span>
              </div>
            </div>

            <div className="reports-hero-panel">
              <div className="reports-mini-stat">
                <span className="reports-mini-label">Report Types</span>
                <strong>{reportTypeOptions.length}</strong>
              </div>
              <div className="reports-mini-stat">
                <span className="reports-mini-label">Students Loaded</span>
                <strong>{students.length}</strong>
              </div>
              <div className="reports-mini-stat">
                <span className="reports-mini-label">Classes Loaded</span>
                <strong>{classes.length}</strong>
              </div>
            </div>
          </div>

          <div className="reports-toolbar">
            <div className="reports-toolbar-title">
              <FaFilter />
              <span>Report Builder</span>
            </div>

            <div className="reports-toolbar-actions">
              <button
                type="button"
                className={`rp-format-btn ${reportFormat === "pdf" ? "active pdf" : ""}`}
                onClick={() => setReportFormat("pdf")}
              >
                <FaFilePdf />
                <span>PDF</span>
              </button>

              <button
                type="button"
                className={`rp-format-btn ${reportFormat === "excel" ? "active excel" : ""}`}
                onClick={() => setReportFormat("excel")}
              >
                <FaFileExcel />
                <span>Excel</span>
              </button>
            </div>
          </div>

          <div className="rp-layout">
            <div className="rp-left">
              <div className="rp-section-card">
                <div className="rp-card-head">
                  <div>
                    <div className="rp-section-kicker">Step 1</div>
                    <div className="rp-section-title">
                      {t?.reportModal?.reportType || "Report Type"}
                    </div>
                  </div>
                </div>

                <div className="rp-type-grid">
                  {reportTypeOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={`rp-type-card ${
                        reportType === option.key ? "active" : ""
                      }`}
                      onClick={() => setReportType(option.key)}
                    >
                      <div className="rp-type-icon">{option.icon}</div>
                      <div className="rp-type-text">
                        <div className="rp-type-label">{option.label}</div>
                        <div className="rp-type-desc">{option.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rp-section-card">
                <div className="rp-card-head">
                  <div>
                    <div className="rp-section-kicker">Step 2</div>
                    <div className="rp-section-title">Filters</div>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label rp-label">
                      {t?.reportModal?.session || "Session"}
                    </label>
                    <select
                      className="form-select rp-select"
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
                      <label className="form-label rp-label">
                        {t?.reportModal?.term || "Term"}
                      </label>
                      <select
                        className="form-select rp-select"
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

                  {(reportType === "student" || reportType === "session") && (
                    <div className="col-12">
                      <label className="form-label rp-label">
                        {t?.reportModal?.student || "Student"}
                      </label>
                      <select
                        className="form-select rp-select"
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
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

                  {(reportType === "class" || reportType === "attendance") && (
                    <div className="col-12">
                      <label className="form-label rp-label">
                        {t?.reportModal?.class || "Class"}
                      </label>
                      <select
                        className="form-select rp-select"
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
                        <label className="form-label rp-label">
                          {t?.reportModal?.startDate || "Start Date"}
                        </label>
                        <div className="rp-input-icon">
                          <FaCalendarAlt className="rp-input-icon-svg" />
                          <input
                            type="date"
                            className="form-control rp-input"
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
                        <label className="form-label rp-label">
                          {t?.reportModal?.endDate || "End Date"}
                        </label>
                        <div className="rp-input-icon">
                          <FaCalendarAlt className="rp-input-icon-svg" />
                          <input
                            type="date"
                            className="form-control rp-input"
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

                <div className="rp-generate-wrap">
                  <button
                    className="btn rp-generate-btn"
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

            <div className="rp-right">
              <div className="rp-preview-card">
                <div className="rp-preview-head">
                  <div>
                    <div className="rp-preview-kicker">
                      {t?.reportModal?.preview || "Report Preview"}
                    </div>
                    <h4 className="rp-preview-title">
                      {reportPreview?.type || "No report generated yet"}
                    </h4>
                  </div>

                  {reportPreview && (
                    <div className="rp-preview-actions">
                      <button
                        className="btn rp-action-btn download"
                        onClick={handleDownload}
                      >
                        <FaDownload />
                        <span>{t?.common?.download || "Download"}</span>
                      </button>
                      <button
                        className="btn rp-action-btn print"
                        onClick={handlePrint}
                      >
                        <FaPrint />
                        <span>{t?.common?.print || "Print"}</span>
                      </button>
                    </div>
                  )}
                </div>

                {!reportPreview ? (
                  <div className="rp-empty-preview">
                    <div className="rp-empty-icon">
                      <FaChartBar />
                    </div>
                    <h5>Nothing to preview yet</h5>
                    <p>
                      Choose a report type, set the filters, and generate a
                      preview here.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rp-summary-grid">
                      {previewSummary.map((item) => (
                        <div key={item.label} className="rp-summary-card">
                          <div className="rp-summary-label">{item.label}</div>
                          <div className="rp-summary-value">{item.value}</div>
                        </div>
                      ))}
                      <div className="rp-summary-card">
                        <div className="rp-summary-label">
                          {t?.reportModal?.generatedOn || "Generated On"}
                        </div>
                        <div className="rp-summary-value">
                          {reportPreview.generatedAt}
                        </div>
                      </div>
                    </div>

                    <div className="rp-data-panel">
                      <div className="rp-data-title">Preview Data</div>
                      {renderPreviewContent()}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .reports-page {
          min-height: 100%;
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.06), transparent 28%),
            radial-gradient(circle at top right, rgba(0, 135, 83, 0.06), transparent 24%);
          color: #0f172a;
        }

        .reports-page.dark-mode {
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 28%),
            radial-gradient(circle at top right, rgba(0, 135, 83, 0.1), transparent 24%),
            #020617;
          color: #f8fafc;
        }

        .reports-shell {
          padding: 1.5rem 1.25rem 2rem;
        }

        .reports-hero {
          display: grid;
          grid-template-columns: 1.6fr 0.8fr;
          gap: 1rem;
          align-items: stretch;
          margin-bottom: 1.25rem;
        }

        .reports-hero-copy,
        .reports-hero-panel,
        .reports-toolbar,
        .rp-section-card,
        .rp-preview-card {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(255, 255, 255, 0.92);
          border-radius: 22px;
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.06);
        }

        .reports-page.dark-mode .reports-hero-copy,
        .reports-page.dark-mode .reports-hero-panel,
        .reports-page.dark-mode .reports-toolbar,
        .reports-page.dark-mode .rp-section-card,
        .reports-page.dark-mode .rp-preview-card {
          background: rgba(15, 23, 42, 0.78);
          border-color: rgba(148, 163, 184, 0.14);
          box-shadow: none;
        }

        .reports-hero-copy {
          padding: 1.5rem;
        }

        .reports-hero-panel {
          padding: 1rem;
          display: grid;
          gap: 0.75rem;
        }

        .reports-page-kicker {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 800;
          color: #64748b;
          margin-bottom: 0.4rem;
        }

        .reports-page.dark-mode .reports-page-kicker {
          color: #94a3b8;
        }

        .reports-page-title {
          font-size: 2.2rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          line-height: 1.1;
        }

        .reports-page-subtitle {
          color: #64748b;
          font-size: 1rem;
          max-width: 780px;
          margin-bottom: 1rem;
        }

        .reports-page.dark-mode .reports-page-subtitle {
          color: #cbd5e1;
        }

        .reports-hero-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .reports-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.6rem 0.9rem;
          border-radius: 999px;
          background: rgba(37, 99, 235, 0.08);
          color: #1d4ed8;
          font-weight: 700;
          font-size: 0.88rem;
        }

        .reports-page.dark-mode .reports-badge {
          background: rgba(37, 99, 235, 0.16);
          color: #bfdbfe;
        }

        .reports-mini-stat {
          padding: 0.95rem 1rem;
          border-radius: 16px;
          background: rgba(248, 250, 252, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.12);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .reports-page.dark-mode .reports-mini-stat {
          background: #111827;
          border-color: rgba(148, 163, 184, 0.1);
        }

        .reports-mini-label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #64748b;
        }

        .reports-page.dark-mode .reports-mini-label {
          color: #94a3b8;
        }

        .reports-toolbar {
          padding: 1rem 1.1rem;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .reports-toolbar-title {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          font-weight: 800;
          font-size: 1rem;
        }

        .reports-toolbar-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .rp-layout {
          display: grid;
          grid-template-columns: minmax(340px, 0.95fr) minmax(380px, 1.05fr);
          gap: 1.25rem;
          min-width: 0;
        }

        .rp-left,
        .rp-right {
          min-width: 0;
          width: 100%;
        }

        .rp-section-card,
        .rp-preview-card {
          padding: 1.1rem;
          min-width: 0;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .rp-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .rp-section-kicker {
          font-size: 0.74rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          font-weight: 800;
          margin-bottom: 0.2rem;
        }

        .reports-page.dark-mode .rp-section-kicker {
          color: #94a3b8;
        }

        .rp-section-title {
          font-size: 1rem;
          font-weight: 800;
        }

        .rp-type-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          min-width: 0;
        }

        .rp-type-card {
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

        .reports-page.dark-mode .rp-type-card {
          background: rgba(15, 23, 42, 0.72);
          border-color: rgba(148, 163, 184, 0.16);
          color: #f8fafc;
        }

        .rp-type-card:hover {
          transform: translateY(-2px);
          border-color: rgba(37, 99, 235, 0.35);
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
        }

        .rp-type-card.active {
          border-color: #2563eb;
          background: rgba(37, 99, 235, 0.08);
          box-shadow: 0 10px 24px rgba(37, 99, 235, 0.14);
        }

        .reports-page.dark-mode .rp-type-card.active {
          background: rgba(37, 99, 235, 0.16);
          border-color: #60a5fa;
        }

        .rp-type-icon {
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

        .rp-type-text {
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
        }

        .rp-type-label {
          font-size: 0.98rem;
          font-weight: 700;
          line-height: 1.35;
          color: inherit;
          word-break: break-word;
        }

        .rp-type-desc {
          margin-top: 0.25rem;
          font-size: 0.85rem;
          line-height: 1.45;
          color: #64748b;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .reports-page.dark-mode .rp-type-desc {
          color: #cbd5e1;
        }

        .rp-label {
          font-weight: 700;
          color: #334155;
          margin-bottom: 0.4rem;
        }

        .reports-page.dark-mode .rp-label {
          color: #e2e8f0;
        }

        .rp-select,
        .rp-input {
          background: var(--app-input-bg);
          border: 1px solid var(--app-border);
          color: var(--app-text);
          border-radius: 14px;
          min-width: 0;
        }

        .rp-select:focus,
        .rp-input:focus {
          border-color: #008753;
          box-shadow: 0 0 0 0.2rem rgba(0, 135, 83, 0.25);
          background: var(--app-input-bg);
          color: var(--app-text);
        }

        .rp-input-icon {
          position: relative;
          min-width: 0;
        }

        .rp-input-icon-svg {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }

        .rp-input-icon .rp-input {
          padding-left: 2.5rem;
        }

        .rp-format-btn {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: #ffffff;
          border-radius: 16px;
          padding: 0.85rem 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.55rem;
          font-weight: 700;
          transition: all 0.2s ease;
          min-width: 120px;
        }

        .reports-page.dark-mode .rp-format-btn {
          background: #111827;
          color: #f8fafc;
          border-color: rgba(148, 163, 184, 0.16);
        }

        .rp-format-btn.active.pdf {
          border-color: #dc2626;
          background: rgba(220, 38, 38, 0.08);
          color: #dc2626;
        }

        .rp-format-btn.active.excel {
          border-color: #008753;
          background: rgba(0, 135, 83, 0.08);
          color: #008753;
        }

        .rp-generate-wrap {
          margin-top: 1rem;
        }

        .rp-generate-btn {
          width: 100%;
          border: 0;
          border-radius: 16px;
          padding: 1rem;
          font-weight: 800;
          background: linear-gradient(135deg, #008753, #003366);
          color: #ffffff;
          box-shadow: 0 14px 30px rgba(0, 135, 83, 0.18);
        }

        .rp-generate-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }

        .rp-preview-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
          min-width: 0;
        }

        .rp-preview-kicker {
          font-size: 0.76rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 800;
          color: #64748b;
          margin-bottom: 0.25rem;
        }

        .reports-page.dark-mode .rp-preview-kicker {
          color: #94a3b8;
        }

        .rp-preview-title {
          margin: 0;
          font-weight: 800;
          font-size: 1.1rem;
        }

        .rp-preview-actions {
          display: flex;
          gap: 0.65rem;
          flex-wrap: wrap;
          min-width: 0;
        }

        .rp-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          border-radius: 12px;
          font-weight: 700;
          border: 0;
          padding: 0.7rem 0.95rem;
          white-space: nowrap;
        }

        .rp-action-btn.download {
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
        }

        .rp-action-btn.print {
          background: rgba(0, 135, 83, 0.1);
          color: #008753;
        }

        .rp-empty-preview {
          min-height: 420px;
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

        .reports-page.dark-mode .rp-empty-preview {
          color: #cbd5e1;
          border-color: rgba(148, 163, 184, 0.16);
        }

        .rp-empty-icon {
          width: 78px;
          height: 78px;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(124, 58, 237, 0.12));
          color: #2563eb;
        }

        .rp-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
          min-width: 0;
        }

        .rp-summary-card {
          border-radius: 14px;
          padding: 0.85rem;
          background: #f8fafc;
          border: 1px solid rgba(148, 163, 184, 0.12);
          min-width: 0;
          overflow: hidden;
        }

        .reports-page.dark-mode .rp-summary-card {
          background: #111827;
          border-color: rgba(148, 163, 184, 0.1);
        }

        .rp-summary-label {
          font-size: 0.76rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.3rem;
        }

        .reports-page.dark-mode .rp-summary-label {
          color: #94a3b8;
        }

        .rp-summary-value {
          font-size: 0.94rem;
          font-weight: 700;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .rp-data-panel {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 16px;
          padding: 1rem;
          min-width: 0;
          overflow: hidden;
        }

        .rp-data-title {
          font-weight: 800;
          margin-bottom: 0.9rem;
        }

        .rp-object-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          min-width: 0;
        }

        .rp-object-card {
          border-radius: 14px;
          padding: 0.85rem;
          background: #f8fafc;
          border: 1px solid rgba(148, 163, 184, 0.12);
          min-width: 0;
        }

        .reports-page.dark-mode .rp-object-card {
          background: #111827;
          border-color: rgba(148, 163, 184, 0.1);
        }

        .rp-object-key {
          font-size: 0.78rem;
          font-weight: 800;
          color: #64748b;
          margin-bottom: 0.35rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .reports-page.dark-mode .rp-object-key {
          color: #94a3b8;
        }

        .rp-object-value {
          font-size: 0.94rem;
          font-weight: 600;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .rp-table-wrap {
          overflow: auto;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          max-width: 100%;
        }

        .rp-table {
          margin-bottom: 0;
          font-size: 0.88rem;
          min-width: 100%;
        }

        .rp-table thead th {
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

        .reports-page.dark-mode .rp-table thead th {
          background: #1e293b;
          color: #e2e8f0;
          border-bottom-color: rgba(148, 163, 184, 0.14);
        }

        .rp-table td {
          word-break: break-word;
          overflow-wrap: anywhere;
          vertical-align: top;
        }

        .reports-page.dark-mode .rp-table td {
          background: #0b1220;
          color: #f8fafc;
          border-color: rgba(148, 163, 184, 0.08);
        }

        .rp-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.55rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          max-width: 100%;
        }

        .rp-pill-muted {
          background: rgba(100, 116, 139, 0.12);
          color: #475569;
        }

        .reports-page.dark-mode .rp-pill-muted {
          background: rgba(148, 163, 184, 0.16);
          color: #cbd5e1;
        }

        .rp-empty,
        .rp-empty-state {
          color: #94a3b8;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        body[data-language="ar"] .reports-page {
          direction: rtl;
          text-align: right;
        }

        @media (max-width: 1200px) {
          .reports-hero {
            grid-template-columns: 1fr;
          }

          .rp-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 992px) {
          .rp-type-grid,
          .rp-summary-grid,
          .rp-object-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .reports-shell {
            padding: 1rem 0.75rem 1.5rem;
          }

          .reports-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .reports-toolbar-actions {
            width: 100%;
          }

          .rp-format-btn {
            flex: 1 1 0;
          }

          .rp-preview-head {
            flex-direction: column;
            align-items: stretch;
          }

          .rp-preview-actions {
            width: 100%;
          }

          .rp-action-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 576px) {
          .reports-page-title {
            font-size: 1.7rem;
          }

          .rp-type-card {
            padding: 0.85rem;
            gap: 0.75rem;
          }

          .rp-type-icon {
            flex: 0 0 44px;
            width: 44px;
            height: 44px;
            min-width: 44px;
            min-height: 44px;
            font-size: 1rem;
          }

          .rp-type-label {
            font-size: 0.92rem;
          }

          .rp-type-desc {
            font-size: 0.8rem;
          }
        }

        @media print {
          .reports-hero,
          .reports-toolbar,
          .rp-left,
          .rp-preview-actions,
          .rp-generate-btn {
            display: none !important;
          }

          .reports-page,
          .reports-page.dark-mode {
            background: white !important;
            color: black !important;
          }

          .rp-layout {
            grid-template-columns: 1fr !important;
          }

          .rp-preview-card,
          .rp-data-panel,
          .rp-summary-card {
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }

          .rp-table thead th,
          .rp-table td {
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </>
  );
}

export default Reports;
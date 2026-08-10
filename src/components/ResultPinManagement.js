import React, { useEffect, useMemo, useState } from "react";
import {
  resultPinAPI,
  sessionAPI,
  classAPI,
  studentAPI,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { toast } from "react-toastify";
import {
  FaKey,
  FaPlus,
  FaSpinner,
  FaCopy,
  FaPowerOff,
  FaSyncAlt,
  FaPrint,
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import "./ResultPinManagement.css";

function ResultPinManagement() {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [targetsLoading, setTargetsLoading] = useState(true);

  const [availableSessions, setAvailableSessions] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);

  const [pins, setPins] = useState([]);
  const [generatedPins, setGeneratedPins] = useState([]);

  const [session, setSession] = useState("");
  const [term, setTerm] = useState("FIRST");

  const [pinScope, setPinScope] = useState("TERM");
  const [targetType, setTargetType] = useState("CLASS");
  const [targetId, setTargetId] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [maxUsage, setMaxUsage] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const terms = ["FIRST", "SECOND", "THIRD"];

  const getApiMessage = (error, fallback) => {
    const data = error?.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data?.message) {
      return data.message;
    }

    if (data?.error) {
      return data.error;
    }

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return data.errors.join(", ");
    }

    if (Array.isArray(data?.details) && data.details.length > 0) {
      return data.details.join(", ");
    }

    return error?.message || fallback;
  };

  const getSessionName = (item) =>
    item?.session || item?.sessionName || item?.name || "";

  const sortSessions = (list) =>
    [...list].sort((a, b) => {
      const aDate = new Date(a?.startDate || 0).getTime();
      const bDate = new Date(b?.startDate || 0).getTime();
      return bDate - aDate;
    });

  const normalizeClassItem = (item, index = 0) => ({
    id: item?.id ?? item?.classId ?? `class-${index}`,
    className:
      item?.className ||
      item?.name ||
      item?.class ||
      item?.displayName ||
      "Unnamed Class",
    arm: item?.arm || item?.classArm || "",
  });

  const normalizeStudentItem = (item, index = 0) => ({
    id: item?.id ?? item?.studentId ?? `student-${index}`,
    fullName:
      item?.fullName ||
      item?.studentName ||
      `${item?.firstName || ""} ${item?.middleName || ""} ${item?.lastName || ""}`
        .replace(/\s+/g, " ")
        .trim(),
    admissionNumber: item?.admissionNumber || item?.admissionNo || "",
    studentClass:
      item?.studentClass ||
      item?.className ||
      item?.class ||
      item?.schoolClass?.className ||
      "",
    classArm: item?.classArm || item?.arm || item?.schoolClass?.arm || "",
  });

  const normalizePin = (pin, index = 0) => ({
    id: pin?.id ?? pin?.pinId ?? `pin-${index}`,
    pin: pin?.pin || pin?.pinCode || pin?.code || "",
    pinType: String(
      pin?.pinType || pin?.type || pin?.resultType || pin?.pinScope || "TERM",
    ).toUpperCase(),
    pinScope: String(pin?.pinScope || pin?.pinType || "TERM").toUpperCase(),
    targetType: String(pin?.targetType || "CLASS").toUpperCase(),
    targetId:
      pin?.targetId ?? pin?.classId ?? pin?.studentId ?? pin?.ownerId ?? null,
    classId: pin?.classId ?? null,
    studentId: pin?.studentId ?? null,
    session: pin?.session || "",
    term:
      typeof pin?.term === "string"
        ? pin.term.toUpperCase()
        : pin?.term?.name || pin?.term || "",
    used:
      pin?.used === true ||
      (typeof pin?.usedCount === "number" && pin.usedCount > 0),
    active: pin?.active !== false,
    maxUsage: pin?.maxUsage ?? 1,
    usedCount: pin?.usedCount ?? 0,
    usedByStudentId: pin?.usedByStudentId || null,
    usedAt: pin?.usedAt || null,
    expiresAt: pin?.expiresAt || null,
    createdAt: pin?.createdAt || null,
  });

  const normalizePinList = (data) => {
    if (Array.isArray(data)) {
      return data.map(normalizePin);
    }

    if (Array.isArray(data?.content)) {
      return data.content.map(normalizePin);
    }

    if (Array.isArray(data?.pins)) {
      return data.pins.map(normalizePin);
    }

    if (Array.isArray(data?.data)) {
      return data.data.map(normalizePin);
    }

    return [];
  };

  const normalizedAvailableSessions = useMemo(() => {
    return (availableSessions || []).map((item) => ({
      id: item?.id,
      session: getSessionName(item),
      currentTerm: item?.currentTerm || item?.term || "FIRST",
      active: item?.active === true || item?.isActive === true,
      startDate: item?.startDate,
      endDate: item?.endDate,
    }));
  }, [availableSessions]);

  const normalizedClasses = useMemo(() => {
    return (availableClasses || []).map(normalizeClassItem);
  }, [availableClasses]);

  const normalizedStudents = useMemo(() => {
    return (availableStudents || []).map(normalizeStudentItem);
  }, [availableStudents]);

  const selectedTargetLabel = useMemo(() => {
    if (!targetId) return "";

    if (targetType === "CLASS") {
      const selectedClass = normalizedClasses.find(
        (item) => String(item.id) === String(targetId),
      );

      return selectedClass
        ? `${selectedClass.className}${selectedClass.arm ? ` ${selectedClass.arm}` : ""}`
        : "";
    }

    const selectedStudent = normalizedStudents.find(
      (item) => String(item.id) === String(targetId),
    );

    return selectedStudent
      ? `${selectedStudent.fullName} (${selectedStudent.admissionNumber || "N/A"})`
      : "";
  }, [targetId, targetType, normalizedClasses, normalizedStudents]);

  const filteredPins = useMemo(() => {
    return pins.filter((pin) => {
      const matchesSearch =
        !searchTerm.trim() ||
        String(pin.pin).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(pin.session).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(pin.term).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(pin.targetType).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
            ? pin.active === true
            : statusFilter === "INACTIVE"
              ? pin.active === false
              : statusFilter === "USED"
                ? pin.used === true
                : statusFilter === "UNUSED"
                  ? pin.used === false
                  : true;

      const matchesType =
        typeFilter === "ALL"
          ? true
          : String(pin.pinScope || pin.pinType).toUpperCase() === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [pins, searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    if (!isAdmin) return;
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    setTargetId("");
  }, [targetType]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadSessions(), loadTargets(), loadPins(false)]);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const [sessionsRes, activeRes] = await Promise.all([
        sessionAPI.getAllSessions(),
        sessionAPI.getActiveSession(),
      ]);

      const allSessions = Array.isArray(sessionsRes?.data)
        ? sessionsRes.data
        : [];

      const sorted = sortSessions(allSessions);
      setAvailableSessions(sorted);

      const active = activeRes?.data || null;

      if (active) {
        setSession(getSessionName(active));
        setTerm(String(active.currentTerm || "FIRST").toUpperCase());
      } else if (sorted.length > 0) {
        setSession(getSessionName(sorted[0]));
        setTerm(String(sorted[0].currentTerm || "FIRST").toUpperCase());
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error(
        getApiMessage(
          error,
          t?.resultPinManagement?.sessionLoadFailed ||
            "Failed to load sessions",
        ),
      );
      setAvailableSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadTargets = async () => {
    setTargetsLoading(true);
    try {
      const [classesRes, studentsRes] = await Promise.all([
        classAPI.getAllClasses(),
        studentAPI.getAllStudents(),
      ]);

      const classesData = Array.isArray(classesRes?.data)
        ? classesRes.data
        : [];
      const studentsData = Array.isArray(studentsRes?.data)
        ? studentsRes.data
        : [];

      setAvailableClasses(classesData);
      setAvailableStudents(studentsData);
    } catch (error) {
      console.error("Error loading targets:", error);
      setAvailableClasses([]);
      setAvailableStudents([]);
      toast.error(
        getApiMessage(
          error,
          t?.resultPinManagement?.targetsLoadFailed ||
            "Failed to load classes and students",
        ),
      );
    } finally {
      setTargetsLoading(false);
    }
  };

  const loadPins = async (showErrorToast = true) => {
    try {
      const response = await resultPinAPI.getAllPins();
      setPins(normalizePinList(response?.data));
    } catch (error) {
      console.error("Error loading pins:", error);
      setPins([]);

      if (showErrorToast) {
        toast.error(
          getApiMessage(
            error,
            t?.resultPinManagement?.pinsLoadFailed || "Failed to load pins",
          ),
        );
      }
    }
  };

  const buildGeneratePayload = () => {
    const normalizedScope = String(pinScope || "")
      .trim()
      .toUpperCase();
    const normalizedTargetType = String(targetType || "")
      .trim()
      .toUpperCase();
    const numericTargetId = Number(targetId);
    const normalizedSession = String(session || "").trim();
    const normalizedTerm = String(term || "")
      .trim()
      .toUpperCase();
    const normalizedCount = Number(quantity);
    const normalizedMaxUsage = Number(maxUsage);

    const payload = {
      pinScope: normalizedScope,
      targetType: normalizedTargetType,
      session: normalizedSession,
      count: normalizedCount,
      maxUsage: normalizedMaxUsage,
    };

    if (normalizedScope === "TERM") {
      payload.term = normalizedTerm;
    }

    if (normalizedTargetType === "CLASS") {
      payload.classId = numericTargetId;
    } else {
      payload.studentId = numericTargetId;
    }

    return payload;
  };

  const handleGeneratePins = async () => {
    if (!session) {
      toast.error(
        t?.resultPinManagement?.selectSession || "Please select a session",
      );
      return;
    }

    if (!pinScope) {
      toast.error(
        t?.resultPinManagement?.selectPinScope || "Please select a pin scope",
      );
      return;
    }

    if (!targetType) {
      toast.error(
        t?.resultPinManagement?.selectTargetType ||
          "Please select a target type",
      );
      return;
    }

    if (!targetId) {
      toast.error(
        t?.resultPinManagement?.selectTarget ||
          "Please select a class or student",
      );
      return;
    }

    if (pinScope === "TERM" && !term) {
      toast.error(t?.resultPinManagement?.selectTerm || "Please select a term");
      return;
    }

    if (!quantity || Number(quantity) < 1) {
      toast.error(
        t?.resultPinManagement?.invalidQuantity ||
          "Please enter a valid quantity",
      );
      return;
    }

    if (Number(quantity) > 500) {
      toast.error("Quantity cannot exceed 500");
      return;
    }

    if (!maxUsage || Number(maxUsage) < 1) {
      toast.error("Please enter a valid max usage");
      return;
    }

    if (Number(maxUsage) > 100) {
      toast.error("Max usage cannot exceed 100");
      return;
    }

    if (Number.isNaN(Number(targetId))) {
      toast.error("Invalid target selected");
      return;
    }

    setLoading(true);
    try {
      const payload = buildGeneratePayload();

      console.log("Generate PIN payload:", payload);

      const response = await resultPinAPI.generatePins(payload);
      const newlyGenerated = normalizePinList(response?.data);

      setGeneratedPins(newlyGenerated);
      await loadPins(false);

      toast.success(
        t?.resultPinManagement?.pinsGenerated ||
          "Result checker pins generated successfully",
      );
    } catch (error) {
      console.error("Error generating pins:", error);
      console.error("Generate PIN error response:", error?.response?.data);

      toast.error(
        getApiMessage(
          error,
          t?.resultPinManagement?.generateFailed || "Failed to generate pins",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivatePin = async (pinId) => {
    setLoading(true);
    try {
      await resultPinAPI.deactivatePin(pinId);

      toast.success(
        t?.resultPinManagement?.pinDeactivated ||
          "PIN deactivated successfully",
      );

      await loadPins(false);

      setGeneratedPins((prev) =>
        prev.map((item) =>
          String(item.id) === String(pinId) ? { ...item, active: false } : item,
        ),
      );
    } catch (error) {
      console.error("Error deactivating pin:", error);
      toast.error(
        getApiMessage(
          error,
          t?.resultPinManagement?.deactivateFailed ||
            "Failed to deactivate pin",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const copyPins = async (list) => {
    const text = list
      .map((item) => {
        const scope = item.pinScope || item.pinType || "TERM";
        const usageText = `${item.usedCount ?? 0}/${item.maxUsage ?? 1}`;

        return scope === "TERM"
          ? `${item.pin} | ${scope} | ${item.session} | ${item.term || "-"} | ${item.targetType || "-"} | usage ${usageText}`
          : `${item.pin} | ${scope} | ${item.session} | ${item.targetType || "-"} | usage ${usageText}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast.success(
        t?.resultPinManagement?.copied || "Pins copied to clipboard",
      );
    } catch (error) {
      toast.error(t?.resultPinManagement?.copyFailed || "Failed to copy pins");
    }
  };

  const handlePrintGenerated = () => {
    if (!generatedPins.length) {
      toast.error(
        t?.resultPinManagement?.noGeneratedPins || "No generated pins to print",
      );
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      toast.error(
        t?.resultPinManagement?.printBlocked || "Unable to open print window",
      );
      return;
    }

    const rows = generatedPins
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.pin}</td>
            <td>${item.pinScope || item.pinType}</td>
            <td>${item.targetType || "-"}</td>
            <td>${item.session || "-"}</td>
            <td>${item.term || "-"}</td>
            <td>${item.usedCount ?? 0}/${item.maxUsage ?? 1}</td>
            <td>${item.active ? "ACTIVE" : "INACTIVE"}</td>
          </tr>
        `,
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Generated Result Pins</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h2 { margin-bottom: 8px; }
            p { margin-top: 0; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h2>Generated Result Checker Pins</h2>
          <p>
            Session: ${session}
            ${pinScope === "TERM" ? ` | Term: ${term}` : ""}
            | Scope: ${pinScope}
            | Target Type: ${targetType}
            ${selectedTargetLabel ? ` | Target: ${selectedTargetLabel}` : ""}
            | Max Usage: ${maxUsage}
          </p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>PIN</th>
                <th>Scope</th>
                <th>Target Type</th>
                <th>Session</th>
                <th>Term</th>
                <th>Usage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (!isAdmin) {
    return (
      <div className="result-pin-management">
        <div className="alert alert-danger mt-4">
          {t?.resultPinManagement?.adminOnly ||
            "Only admin can manage result checker pins."}
        </div>
      </div>
    );
  }

  return (
    <div className={`result-pin-management ${darkMode ? "dark-mode" : ""}`}>
      <div className="rpm-header">
        <div>
          <h2>
            <FaKey className="me-2" />
            {t?.resultPinManagement?.title || "Result PIN Management"}
          </h2>
          <p className="text-muted mb-0">
            {t?.resultPinManagement?.subtitle ||
              "Generate, copy, print and deactivate result checker pins"}
          </p>
        </div>

        <button className="btn btn-outline-primary" onClick={loadInitialData}>
          <FaSyncAlt className="me-2" />
          {t?.common?.refresh || "Refresh"}
        </button>
      </div>

      <div className="rpm-card">
        <div className="rpm-card-header">
          <h4 className="mb-0">
            <FaPlus className="me-2" />
            {t?.resultPinManagement?.generatePins || "Generate Pins"}
          </h4>
        </div>

        <div className="rpm-card-body">
          <div className="rpm-grid">
            <div className="rpm-field">
              <label>{t?.resultPinManagement?.pinScope || "PIN Scope"}</label>
              <select
                value={pinScope}
                onChange={(e) =>
                  setPinScope(String(e.target.value).toUpperCase())
                }
              >
                <option value="TERM">TERM</option>
                <option value="SESSION">SESSION</option>
              </select>
            </div>

            <div className="rpm-field">
              <label>
                {t?.resultPinManagement?.targetType || "Target Type"}
              </label>
              <select
                value={targetType}
                onChange={(e) =>
                  setTargetType(String(e.target.value).toUpperCase())
                }
              >
                <option value="CLASS">CLASS</option>
                <option value="STUDENT">STUDENT</option>
              </select>
            </div>

            <div className="rpm-field">
              <label>{t?.resultPinManagement?.session || "Session"}</label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                disabled={sessionsLoading}
              >
                <option value="">
                  {t?.common?.select || "Select Session"}
                </option>
                {normalizedAvailableSessions.map((item) => (
                  <option key={item.id || item.session} value={item.session}>
                    {item.session}
                  </option>
                ))}
              </select>
            </div>

            {pinScope === "TERM" && (
              <div className="rpm-field">
                <label>{t?.resultPinManagement?.term || "Term"}</label>
                <select
                  value={term}
                  onChange={(e) =>
                    setTerm(String(e.target.value).toUpperCase())
                  }
                >
                  {terms.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="rpm-field">
              <label>
                {targetType === "CLASS"
                  ? t?.resultPinManagement?.selectClass || "Select Class"
                  : t?.resultPinManagement?.selectStudent || "Select Student"}
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                disabled={targetsLoading}
              >
                <option value="">
                  {targetType === "CLASS"
                    ? t?.common?.select || "Select Class"
                    : t?.common?.select || "Select Student"}
                </option>

                {targetType === "CLASS"
                  ? normalizedClasses.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.className}
                        {item.arm ? ` ${item.arm}` : ""}
                      </option>
                    ))
                  : normalizedStudents.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.fullName || "Unnamed Student"}
                        {item.admissionNumber
                          ? ` - ${item.admissionNumber}`
                          : ""}
                        {item.studentClass || item.classArm
                          ? ` (${item.studentClass || ""} ${item.classArm || ""})`
                          : ""}
                      </option>
                    ))}
              </select>
            </div>

            <div className="rpm-field">
              <label>{t?.resultPinManagement?.quantity || "Quantity"}</label>
              <input
                type="number"
                min="1"
                max="500"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="rpm-field">
              <label>{t?.resultPinManagement?.maxUsage || "Max Usage"}</label>
              <input
                type="number"
                min="1"
                max="100"
                value={maxUsage}
                onChange={(e) => setMaxUsage(e.target.value)}
              />
            </div>
          </div>

          <div className="rpm-actions">
            <button
              className="btn btn-primary"
              onClick={handleGeneratePins}
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="spin me-2" />
                  Generating...
                </>
              ) : (
                <>
                  <FaKey className="me-2" />
                  {t?.resultPinManagement?.generateNow || "Generate Now"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {generatedPins.length > 0 && (
        <div className="rpm-card">
          <div className="rpm-card-header rpm-card-header-space">
            <h4 className="mb-0">
              {t?.resultPinManagement?.latestGenerated ||
                "Latest Generated Pins"}
            </h4>

            <div className="rpm-header-actions">
              <button
                className="btn btn-outline-secondary"
                onClick={() => copyPins(generatedPins)}
              >
                <FaCopy className="me-2" />
                Copy
              </button>

              <button
                className="btn btn-outline-success"
                onClick={handlePrintGenerated}
              >
                <FaPrint className="me-2" />
                Print
              </button>
            </div>
          </div>

          <div className="rpm-card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>PIN</th>
                    <th>Scope</th>
                    <th>Target Type</th>
                    <th>Session</th>
                    <th>Term</th>
                    <th>Usage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedPins.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td className="fw-bold">{item.pin}</td>
                      <td>{item.pinScope || item.pinType}</td>
                      <td>{item.targetType || "-"}</td>
                      <td>{item.session || "-"}</td>
                      <td>{item.term || "-"}</td>
                      <td>
                        {item.usedCount ?? 0}/{item.maxUsage ?? 1}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            item.active ? "bg-success" : "bg-secondary"
                          }`}
                        >
                          {item.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="rpm-card">
        <div className="rpm-card-header">
          <h4 className="mb-0">
            <FaFilter className="me-2" />
            {t?.resultPinManagement?.allPins || "All Pins"}
          </h4>
        </div>

        <div className="rpm-card-body">
          <div className="rpm-filter-grid">
            <div className="rpm-search">
              <FaSearch />
              <input
                type="text"
                placeholder={
                  t?.resultPinManagement?.searchPins ||
                  "Search by pin, session, term or target type"
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="USED">Used</option>
              <option value="UNUSED">Unused</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="TERM">TERM</option>
              <option value="SESSION">SESSION</option>
            </select>
          </div>

          <div className="table-responsive mt-3">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>PIN</th>
                  <th>Scope</th>
                  <th>Target Type</th>
                  <th>Session</th>
                  <th>Term</th>
                  <th>Usage</th>
                  <th>Used</th>
                  <th>Active</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPins.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center text-muted">
                      {t?.resultPinManagement?.noPinsFound || "No pins found"}
                    </td>
                  </tr>
                ) : (
                  filteredPins.map((item) => (
                    <tr key={item.id}>
                      <td className="fw-bold">{item.pin}</td>
                      <td>{item.pinScope || item.pinType}</td>
                      <td>{item.targetType || "-"}</td>
                      <td>{item.session || "-"}</td>
                      <td>{item.term || "-"}</td>
                      <td>
                        {item.usedCount ?? 0}/{item.maxUsage ?? 1}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            item.used ? "bg-warning text-dark" : "bg-success"
                          }`}
                        >
                          {item.used ? "USED" : "UNUSED"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            item.active ? "bg-success" : "bg-secondary"
                          }`}
                        >
                          {item.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          disabled={loading || item.active === false}
                          onClick={() => handleDeactivatePin(item.id)}
                        >
                          <FaPowerOff className="me-1" />
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultPinManagement;

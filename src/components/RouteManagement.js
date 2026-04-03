// src/components/RouteManagement.js
import React, { useEffect, useMemo, useState } from "react";
import { studentAPI, transportAPI } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUserPlus,
  FaUsers,
  FaSyncAlt,
  FaSpinner,
  FaMapMarkerAlt,
  FaClock,
  FaPhone,
  FaDollarSign,
} from "react-icons/fa";

const initialForm = {
  routeName: "",
  routeCode: "",
  pickupLocation: "",
  dropoffLocation: "",
  pickupTime: "",
  dropoffTime: "",
  driverName: "",
  driverPhone: "",
  assistantName: "",
  assistantPhone: "",
  monthlyFee: "",
  capacity: "",
  active: true,
};

function RouteManagement() {
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const [routes, setRoutes] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [routeStudents, setRouteStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [routesRes, studentsRes] = await Promise.all([
        transportAPI.getAllRoutes(),
        studentAPI.getAllStudents(),
      ]);

      setRoutes(routesRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(
        t?.routeManagement?.loadFailed || "Failed to load routes or students",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadRouteStudents = async (routeId) => {
    if (!routeId) {
      setRouteStudents([]);
      return;
    }

    try {
      const res = await transportAPI.getRouteStudents(routeId);
      setRouteStudents(res.data || []);
    } catch (error) {
      console.error("Error loading route students:", error);
      toast.error(
        t?.routeManagement?.loadStudentsFailed ||
          "Failed to load students on this route",
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRouteId) {
      loadRouteStudents(selectedRouteId);
    }
  }, [selectedRouteId]);

  const filteredRoutes = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return routes;

    return routes.filter((route) =>
      [
        route.routeName,
        route.routeCode,
        route.pickupLocation,
        route.dropoffLocation,
        route.driverName,
      ]
        .filter(Boolean)
        .some((item) => item.toLowerCase().includes(q)),
    );
  }, [routes, search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEdit = (route) => {
    setEditingId(route.id);
    setForm({
      routeName: route.routeName || "",
      routeCode: route.routeCode || "",
      pickupLocation: route.pickupLocation || "",
      dropoffLocation: route.dropoffLocation || "",
      pickupTime: route.pickupTime || "",
      dropoffTime: route.dropoffTime || "",
      driverName: route.driverName || "",
      driverPhone: route.driverPhone || "",
      assistantName: route.assistantName || "",
      assistantPhone: route.assistantPhone || "",
      monthlyFee: route.monthlyFee || "",
      capacity: route.capacity || "",
      active: !!route.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      monthlyFee: Number(form.monthlyFee),
      capacity: Number(form.capacity),
    };

    try {
      setSaving(true);
      if (editingId) {
        await transportAPI.updateRoute(editingId, payload);
        toast.success(
          t?.routeManagement?.updateSuccess || "Route updated successfully",
        );
      } else {
        await transportAPI.createRoute(payload);
        toast.success(
          t?.routeManagement?.createSuccess || "Route created successfully",
        );
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error("Error saving route:", error);
      toast.error(
        error?.response?.data?.message ||
          t?.routeManagement?.saveFailed ||
          "Failed to save route",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (routeId) => {
    const confirmed = window.confirm(
      t?.routeManagement?.confirmDelete ||
        "Are you sure you want to delete this route?",
    );
    if (!confirmed) return;

    try {
      await transportAPI.deleteRoute(routeId);
      toast.success(
        t?.routeManagement?.deleteSuccess || "Route deleted successfully",
      );
      if (selectedRouteId === String(routeId)) {
        setSelectedRouteId("");
        setRouteStudents([]);
      }
      loadData();
    } catch (error) {
      console.error("Error deleting route:", error);
      toast.error(
        error?.response?.data?.message ||
          t?.routeManagement?.deleteFailed ||
          "Failed to delete route",
      );
    }
  };

  const handleAssignStudent = async () => {
    if (!selectedStudentId || !selectedRouteId) {
      toast.error(
        t?.routeManagement?.selectBoth || "Please select a route and a student",
      );
      return;
    }

    try {
      await transportAPI.assignStudentToRoute(
        selectedStudentId,
        selectedRouteId,
        0,
      );
      toast.success(
        t?.routeManagement?.assignSuccess || "Student assigned successfully",
      );
      setSelectedStudentId("");
      loadData();
      loadRouteStudents(selectedRouteId);
    } catch (error) {
      console.error("Error assigning student:", error);
      toast.error(
        error?.response?.data?.message ||
          t?.routeManagement?.assignFailed ||
          "Failed to assign student",
      );
    }
  };

  const handleRemoveStudent = async (studentId) => {
    const confirmed = window.confirm(
      t?.routeManagement?.confirmRemove ||
        "Remove this student from the route?",
    );
    if (!confirmed) return;

    try {
      await transportAPI.removeStudentFromRoute(studentId);
      toast.success(
        t?.routeManagement?.removeSuccess || "Student removed from route",
      );
      loadData();
      loadRouteStudents(selectedRouteId);
    } catch (error) {
      console.error("Error removing student:", error);
      toast.error(
        error?.response?.data?.message ||
          t?.routeManagement?.removeFailed ||
          "Failed to remove student",
      );
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">{t?.common?.loading || "Loading..."}</p>
      </div>
    );
  }

  // Dynamic classes based on dark mode
  const cardBgClass = darkMode ? "bg-dark text-white" : "";
  const cardHeaderClass = darkMode ? "bg-dark border-secondary" : "bg-white";
  const tableClass = darkMode ? "table-dark" : "";
  const formControlClass = darkMode
    ? "bg-dark text-white border-secondary"
    : "";
  const selectClass = darkMode ? "bg-dark text-white border-secondary" : "";
  const alertClass = darkMode ? "alert-dark" : "";

  return (
    <div
      className={`container-fluid py-4 ${darkMode ? "bg-dark text-white" : ""}`}
    >
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="mb-1">
            {t?.routeManagement?.title || "Route Management"}
          </h2>
          <p className={`mb-0 ${darkMode ? "text-secondary" : "text-muted"}`}>
            {t?.routeManagement?.description ||
              "Create routes and assign students to transport routes."}
          </p>
        </div>

        <button className="btn btn-outline-primary" onClick={loadData}>
          <FaSyncAlt className="me-2" />
          {t?.common?.refresh || "Refresh"}
        </button>
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className={`card shadow-sm border-0 ${cardBgClass}`}>
            <div className={`card-header ${cardHeaderClass} border-0`}>
              <h5 className="mb-0">
                {editingId
                  ? t?.routeManagement?.editRoute || "Edit Route"
                  : t?.routeManagement?.createRoute || "Create Route"}
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">
                      {t?.routeManagement?.routeName || "Route Name"} *
                    </label>
                    <input
                      type="text"
                      className={`form-control ${formControlClass}`}
                      name="routeName"
                      value={form.routeName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      {t?.routeManagement?.routeCode || "Route Code"} *
                    </label>
                    <input
                      type="text"
                      className={`form-control ${formControlClass}`}
                      name="routeCode"
                      value={form.routeCode}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      {t?.routeManagement?.pickupLocation || "Pickup Location"}{" "}
                      *
                    </label>
                    <input
                      type="text"
                      className={`form-control ${formControlClass}`}
                      name="pickupLocation"
                      value={form.pickupLocation}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      {t?.routeManagement?.dropoffLocation ||
                        "Drop-off Location"}{" "}
                      *
                    </label>
                    <input
                      type="text"
                      className={`form-control ${formControlClass}`}
                      name="dropoffLocation"
                      value={form.dropoffLocation}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      {t?.routeManagement?.pickupTime || "Pickup Time"} *
                    </label>
                    <input
                      type="time"
                      className={`form-control ${formControlClass}`}
                      name="pickupTime"
                      value={form.pickupTime}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      {t?.routeManagement?.dropoffTime || "Drop-off Time"} *
                    </label>
                    <input
                      type="time"
                      className={`form-control ${formControlClass}`}
                      name="dropoffTime"
                      value={form.dropoffTime}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      {t?.routeManagement?.driverName || "Driver Name"} *
                    </label>
                    <input
                      type="text"
                      className={`form-control ${formControlClass}`}
                      name="driverName"
                      value={form.driverName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      {t?.routeManagement?.driverPhone || "Driver Phone"} *
                    </label>
                    <input
                      type="tel"
                      className={`form-control ${formControlClass}`}
                      name="driverPhone"
                      value={form.driverPhone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      {t?.routeManagement?.assistantName || "Assistant Name"}
                    </label>
                    <input
                      type="text"
                      className={`form-control ${formControlClass}`}
                      name="assistantName"
                      value={form.assistantName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      {t?.routeManagement?.assistantPhone || "Assistant Phone"}
                    </label>
                    <input
                      type="tel"
                      className={`form-control ${formControlClass}`}
                      name="assistantPhone"
                      value={form.assistantPhone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      {t?.routeManagement?.monthlyFee || "Monthly Fee"} *
                    </label>
                    <input
                      type="number"
                      className={`form-control ${formControlClass}`}
                      name="monthlyFee"
                      value={form.monthlyFee}
                      onChange={handleChange}
                      required
                      min="0"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      {t?.routeManagement?.capacity || "Capacity"} *
                    </label>
                    <input
                      type="number"
                      className={`form-control ${formControlClass}`}
                      name="capacity"
                      value={form.capacity}
                      onChange={handleChange}
                      required
                      min="1"
                    />
                  </div>

                  <div className="col-12">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="active"
                        checked={form.active}
                        onChange={handleChange}
                        id="activeCheck"
                      />
                      <label className="form-check-label" htmlFor="activeCheck">
                        {t?.routeManagement?.activeRoute || "Active Route"}
                      </label>
                    </div>
                  </div>

                  <div className="col-12 d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <FaSpinner className="spin me-2" />{" "}
                          {t?.common?.saving || "Saving..."}
                        </>
                      ) : editingId ? (
                        <>
                          <FaEdit className="me-2" />{" "}
                          {t?.routeManagement?.updateRoute || "Update Route"}
                        </>
                      ) : (
                        <>
                          <FaPlus className="me-2" />{" "}
                          {t?.routeManagement?.createRoute || "Create Route"}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={resetForm}
                    >
                      {t?.routeManagement?.reset || "Reset"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className={`card shadow-sm border-0 mt-4 ${cardBgClass}`}>
            <div className={`card-header ${cardHeaderClass} border-0`}>
              <h5 className="mb-0">
                {t?.routeManagement?.assignStudent || "Assign Student to Route"}
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">
                  {t?.routeManagement?.selectRoute || "Select Route"}
                </label>
                <select
                  className={`form-select ${selectClass}`}
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                >
                  <option value="">
                    {t?.common?.select || "Choose route"}
                  </option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.routeName} ({route.routeCode}) -{" "}
                      {route.capacity - (route.assignedStudents || 0)}{" "}
                      {t?.routeManagement?.slotsLeft || "slots left"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  {t?.routeManagement?.selectStudent || "Select Student"}
                </label>
                <select
                  className={`form-select ${selectClass}`}
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">
                    {t?.common?.select || "Choose student"}
                  </option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} (
                      {student.admissionNumber})
                    </option>
                  ))}
                </select>
              </div>

              <button className="btn btn-success" onClick={handleAssignStudent}>
                <FaUserPlus className="me-2" />
                {t?.routeManagement?.assign || "Assign Student"}
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className={`card shadow-sm border-0 ${cardBgClass}`}>
            <div
              className={`card-header ${cardHeaderClass} border-0 d-flex flex-wrap justify-content-between align-items-center gap-2`}
            >
              <h5 className="mb-0">{t?.routeManagement?.routes || "Routes"}</h5>
              <input
                type="text"
                className={`form-control ${formControlClass}`}
                style={{ maxWidth: "280px" }}
                placeholder={t?.common?.search || "Search routes..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="card-body">
              {filteredRoutes.length === 0 ? (
                <div
                  className={`alert alert-warning mb-0 ${darkMode ? "alert-dark" : ""}`}
                >
                  {t?.routeManagement?.noRoutes || "No routes found."}
                </div>
              ) : (
                <div className="table-responsive">
                  <table
                    className={`table ${tableClass} table-hover align-middle`}
                  >
                    <thead>
                      <tr className={darkMode ? "table-dark" : ""}>
                        <th>{t?.routeManagement?.route || "Route"}</th>
                        <th>{t?.routeManagement?.driver || "Driver"}</th>
                        <th>{t?.routeManagement?.students || "Students"}</th>
                        <th>{t?.routeManagement?.fee || "Fee"}</th>
                        <th>{t?.common?.actions || "Actions"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoutes.map((route) => (
                        <tr key={route.id}>
                          <td>
                            <div className="fw-bold">{route.routeName}</div>
                            <small
                              className={
                                darkMode ? "text-secondary" : "text-muted"
                              }
                            >
                              <FaMapMarkerAlt className="me-1" />{" "}
                              {route.pickupLocation} → {route.dropoffLocation}
                            </small>
                          </td>
                          <td>
                            <div>{route.driverName}</div>
                            <small
                              className={
                                darkMode ? "text-secondary" : "text-muted"
                              }
                            >
                              <FaPhone className="me-1" /> {route.driverPhone}
                            </small>
                          </td>
                          <td>
                            <FaUsers className="me-1" />{" "}
                            {route.assignedStudents || 0}/{route.capacity}
                          </td>
                          <td>
                            <FaDollarSign className="me-1" /> {route.monthlyFee}
                          </td>
                          <td className="d-flex gap-2 flex-wrap">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEdit(route)}
                              title={t?.common?.edit || "Edit"}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(route.id)}
                              title={t?.common?.delete || "Delete"}
                            >
                              <FaTrash />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setSelectedRouteId(String(route.id));
                                loadRouteStudents(route.id);
                              }}
                              title={
                                t?.routeManagement?.viewStudents ||
                                "View Students"
                              }
                            >
                              <FaUsers />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className={`card shadow-sm border-0 mt-4 ${cardBgClass}`}>
            <div className={`card-header ${cardHeaderClass} border-0`}>
              <h5 className="mb-0">
                {t?.routeManagement?.studentsOnRoute ||
                  "Students on Selected Route"}
              </h5>
            </div>
            <div className="card-body">
              {!selectedRouteId ? (
                <div
                  className={`alert alert-secondary mb-0 ${darkMode ? "alert-dark" : ""}`}
                >
                  {t?.routeManagement?.selectRouteToView ||
                    "Select a route to see assigned students."}
                </div>
              ) : routeStudents.length === 0 ? (
                <div
                  className={`alert alert-warning mb-0 ${darkMode ? "alert-dark" : ""}`}
                >
                  {t?.routeManagement?.noStudentsAssigned ||
                    "No students assigned to this route yet."}
                </div>
              ) : (
                <div className="table-responsive">
                  <table
                    className={`table ${tableClass} table-striped align-middle`}
                  >
                    <thead>
                      <tr className={darkMode ? "table-dark" : ""}>
                        <th>{t?.studentManagement?.studentName || "Name"}</th>
                        <th>
                          {t?.studentManagement?.admissionNo || "Admission No."}
                        </th>
                        <th>{t?.studentManagement?.class || "Class"}</th>
                        <th>{t?.studentManagement?.parentName || "Parent"}</th>
                        <th>{t?.common?.action || "Action"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routeStudents.map((student) => (
                        <tr key={student.id}>
                          <td>
                            {student.firstName} {student.middleName || ""}{" "}
                            {student.lastName}
                          </td>
                          <td>{student.admissionNumber}</td>
                          <td>
                            {student.studentClass}
                            {student.classArm ? ` ${student.classArm}` : ""}
                          </td>
                          <td>
                            <div>{student.parentName || "-"}</div>
                            <small
                              className={
                                darkMode ? "text-secondary" : "text-muted"
                              }
                            >
                              {student.parentPhone || "-"}
                            </small>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemoveStudent(student.id)}
                            >
                              {t?.routeManagement?.remove || "Remove"}
                            </button>
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

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default RouteManagement;

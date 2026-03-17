import React, { useEffect, useMemo, useState } from "react";
import { studentAPI, transportAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUserPlus,
  FaUsers,
  FaSyncAlt,
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
      toast.error("Failed to load routes or students");
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
      toast.error("Failed to load students on this route");
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
        toast.success("Route updated successfully");
      } else {
        await transportAPI.createRoute(payload);
        toast.success("Route created successfully");
      }

      resetForm();
      loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save route");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (routeId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this route?",
    );
    if (!confirmed) return;

    try {
      await transportAPI.deleteRoute(routeId);
      toast.success("Route deleted successfully");
      if (selectedRouteId === String(routeId)) {
        setSelectedRouteId("");
        setRouteStudents([]);
      }
      loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete route");
    }
  };

  const handleAssignStudent = async () => {
    if (!selectedStudentId || !selectedRouteId) {
      toast.error("Please select a route and a student");
      return;
    }

    try {
      await transportAPI.assignStudentToRoute(
        selectedStudentId,
        selectedRouteId,
        0,
      );
      toast.success("Student assigned successfully");
      setSelectedStudentId("");
      loadData();
      loadRouteStudents(selectedRouteId);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to assign student");
    }
  };

  const handleRemoveStudent = async (studentId) => {
    const confirmed = window.confirm("Remove this student from the route?");
    if (!confirmed) return;

    try {
      await transportAPI.removeStudentFromRoute(studentId);
      toast.success("Student removed from route");
      loadData();
      loadRouteStudents(selectedRouteId);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to remove student");
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="mb-1">Route Management</h2>
          <p className="text-muted mb-0">
            Create routes and assign students to transport routes.
          </p>
        </div>

        <button className="btn btn-outline-primary" onClick={loadData}>
          <FaSyncAlt className="me-2" />
          Refresh
        </button>
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white">
              <h5 className="mb-0">
                {editingId ? "Edit Route" : "Create Route"}
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Route Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="routeName"
                      value={form.routeName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Route Code</label>
                    <input
                      type="text"
                      className="form-control"
                      name="routeCode"
                      value={form.routeCode}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Pickup Location</label>
                    <input
                      type="text"
                      className="form-control"
                      name="pickupLocation"
                      value={form.pickupLocation}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Drop-off Location</label>
                    <input
                      type="text"
                      className="form-control"
                      name="dropoffLocation"
                      value={form.dropoffLocation}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Pickup Time</label>
                    <input
                      type="time"
                      className="form-control"
                      name="pickupTime"
                      value={form.pickupTime}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Drop-off Time</label>
                    <input
                      type="time"
                      className="form-control"
                      name="dropoffTime"
                      value={form.dropoffTime}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Driver Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="driverName"
                      value={form.driverName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Driver Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      name="driverPhone"
                      value={form.driverPhone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Assistant Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="assistantName"
                      value={form.assistantName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Assistant Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      name="assistantPhone"
                      value={form.assistantPhone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Monthly Fee</label>
                    <input
                      type="number"
                      className="form-control"
                      name="monthlyFee"
                      value={form.monthlyFee}
                      onChange={handleChange}
                      required
                      min="0"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Capacity</label>
                    <input
                      type="number"
                      className="form-control"
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
                        Active Route
                      </label>
                    </div>
                  </div>

                  <div className="col-12 d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving}
                    >
                      {editingId ? (
                        <>
                          <FaEdit className="me-2" />
                          Update Route
                        </>
                      ) : (
                        <>
                          <FaPlus className="me-2" />
                          Create Route
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={resetForm}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="card shadow-sm border-0 mt-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">Assign Student to Route</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Select Route</label>
                <select
                  className="form-select"
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                >
                  <option value="">Choose route</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.routeName} ({route.routeCode}) -{" "}
                      {route.availableSlots} slots left
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Select Student</label>
                <select
                  className="form-select"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">Choose student</option>
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
                Assign Student
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h5 className="mb-0">Routes</h5>
              <input
                type="text"
                className="form-control"
                style={{ maxWidth: "280px" }}
                placeholder="Search routes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="card-body">
              {loading ? (
                <div className="alert alert-info mb-0">Loading routes...</div>
              ) : filteredRoutes.length === 0 ? (
                <div className="alert alert-warning mb-0">No routes found.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Route</th>
                        <th>Driver</th>
                        <th>Students</th>
                        <th>Fee</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoutes.map((route) => (
                        <tr key={route.id}>
                          <td>
                            <div className="fw-bold">{route.routeName}</div>
                            <small className="text-muted">
                              {route.pickupLocation} → {route.dropoffLocation}
                            </small>
                          </td>
                          <td>
                            <div>{route.driverName}</div>
                            <small className="text-muted">
                              {route.driverPhone}
                            </small>
                          </td>
                          <td>
                            <FaUsers className="me-1" />
                            {route.assignedStudents}/{route.capacity}
                          </td>
                          <td>₦{route.monthlyFee}</td>
                          <td className="d-flex gap-2 flex-wrap">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEdit(route)}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(route.id)}
                            >
                              <FaTrash />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setSelectedRouteId(String(route.id));
                                loadRouteStudents(route.id);
                              }}
                            >
                              View Students
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

          <div className="card shadow-sm border-0 mt-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">Students on Selected Route</h5>
            </div>
            <div className="card-body">
              {!selectedRouteId ? (
                <div className="alert alert-secondary mb-0">
                  Select a route to see assigned students.
                </div>
              ) : routeStudents.length === 0 ? (
                <div className="alert alert-warning mb-0">
                  No students assigned to this route yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped align-middle">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Admission No.</th>
                        <th>Class</th>
                        <th>Parent</th>
                        <th>Action</th>
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
                            <small className="text-muted">
                              {student.parentPhone || "-"}
                            </small>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemoveStudent(student.id)}
                            >
                              Remove
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
    </div>
  );
}

export default RouteManagement;

import React, { useEffect, useMemo, useState } from "react";
import { transportAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaSave,
  FaTrash,
  FaEdit,
  FaSearch,
  FaUsers,
  FaMapMarkerAlt,
  FaLocationArrow,
} from "react-icons/fa";

const emptyRoute = {
  routeName: "",
  routeNumber: "",
  driverName: "",
  driverPhone: "",
  assistantName: "",
  assistantPhone: "",
  busNumber: "",
  capacity: 0,
  stops: [], // array of strings
  morningPickupTime: "",
  afternoonDropoffTime: "",
  monthlyFee: 0,
  status: "ACTIVE", // ACTIVE, INACTIVE, MAINTENANCE (based on your model)
};

export default function RouteManagement() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [routeForm, setRouteForm] = useState(emptyRoute);
  const [stopsInput, setStopsInput] = useState(""); // comma separated input

  // Assignment form
  const [assignStudentId, setAssignStudentId] = useState("");
  const [assignRouteId, setAssignRouteId] = useState("");
  const [assignStopIndex, setAssignStopIndex] = useState("");

  // View students for route
  const [viewRouteId, setViewRouteId] = useState("");
  const [routeStudents, setRouteStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const res = onlyActive
        ? await transportAPI.getActiveRoutes()
        : await transportAPI.getAllRoutes();
      setRoutes(res.data || []);
    } catch (e) {
      toast.error("Failed to load routes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
    // eslint-disable-next-line
  }, [onlyActive]);

  const filteredRoutes = useMemo(() => {
    if (!searchTerm.trim()) return routes;
    const t = searchTerm.toLowerCase();
    return routes.filter((r) => {
      const stops = Array.isArray(r.stops) ? r.stops.join(", ") : "";
      return (
        (r.routeName || "").toLowerCase().includes(t) ||
        (r.routeNumber || "").toLowerCase().includes(t) ||
        (r.busNumber || "").toLowerCase().includes(t) ||
        (r.driverName || "").toLowerCase().includes(t) ||
        stops.toLowerCase().includes(t)
      );
    });
  }, [routes, searchTerm]);

  const startCreate = () => {
    setEditingId(null);
    setRouteForm(emptyRoute);
    setStopsInput("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setRouteForm({
      ...emptyRoute,
      ...r,
      capacity: r.capacity ?? 0,
      monthlyFee: r.monthlyFee ?? 0,
      stops: Array.isArray(r.stops) ? r.stops : [],
    });
    setStopsInput(Array.isArray(r.stops) ? r.stops.join(", ") : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveRoute = async (e) => {
    e.preventDefault();

    if (!routeForm.routeName.trim()) {
      toast.error("Route name is required");
      return;
    }

    const stops = stopsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      ...routeForm,
      capacity: Number(routeForm.capacity || 0),
      monthlyFee: Number(routeForm.monthlyFee || 0),
      stops,
      // times can be empty string -> backend can store null; keep as is
      morningPickupTime: routeForm.morningPickupTime || null,
      afternoonDropoffTime: routeForm.afternoonDropoffTime || null,
    };

    try {
      if (editingId) {
        await transportAPI.updateRoute(editingId, payload);
        toast.success("Route updated");
      } else {
        await transportAPI.createRoute(payload);
        toast.success("Route created");
      }
      startCreate();
      await loadRoutes();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    }
  };

  const removeRoute = async (id) => {
    if (!window.confirm("Delete this route?")) return;
    try {
      await transportAPI.deleteRoute(id);
      toast.success("Route deleted");
      await loadRoutes();
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  // ---- Assign / Remove student ----
  const assignStudent = async (e) => {
    e.preventDefault();

    if (!assignStudentId.trim() || !assignRouteId.trim()) {
      toast.error("studentId and routeId are required");
      return;
    }

    const stopIndex = assignStopIndex === "" ? 0 : Number(assignStopIndex);

    try {
      await transportAPI.assignStudentToRoute(
        Number(assignStudentId),
        Number(assignRouteId),
        stopIndex,
      );
      toast.success("Student assigned");
      setAssignStudentId("");
      setAssignStopIndex("");
      // refresh students if viewing same route
      if (String(viewRouteId) === String(assignRouteId)) {
        await loadRouteStudents(assignRouteId);
      }
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Assign failed");
    }
  };

  const removeStudent = async (studentId) => {
    if (!window.confirm(`Remove student #${studentId} from route?`)) return;
    try {
      await transportAPI.removeStudentFromRoute(studentId);
      toast.success("Student removed");
      if (viewRouteId) await loadRouteStudents(viewRouteId);
    } catch {
      toast.error("Remove failed");
    }
  };

  // ---- Students on route ----
  const loadRouteStudents = async (routeId) => {
    setStudentsLoading(true);
    try {
      const res = await transportAPI.getRouteStudents(routeId);
      setRouteStudents(res.data || []);
    } catch (e) {
      toast.error("Failed to load route students");
    } finally {
      setStudentsLoading(false);
    }
  };

  const openRouteStudents = async (routeId) => {
    setViewRouteId(routeId);
    await loadRouteStudents(routeId);
  };

  return (
    <div className="content-wrapper earth-pattern">
      <div className="hero-section p-4">
        <h2 className="mb-2">Routes</h2>
        <p className="mb-0">Create routes, assign students and track buses.</p>
      </div>

      {/* Create/Edit Route */}
      <div className="form-container mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">{editingId ? "Edit Route" : "Create Route"}</h4>
          <button
            type="button"
            className="btn-outline-nigerian"
            onClick={startCreate}
          >
            <FaPlus className="me-2" />
            New
          </button>
        </div>

        <form onSubmit={saveRoute}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Route Name *</label>
              <input
                className="form-control"
                value={routeForm.routeName}
                onChange={(e) =>
                  setRouteForm((p) => ({ ...p, routeName: e.target.value }))
                }
              />
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">Route Number</label>
              <input
                className="form-control"
                value={routeForm.routeNumber}
                onChange={(e) =>
                  setRouteForm((p) => ({ ...p, routeNumber: e.target.value }))
                }
              />
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">Bus Number</label>
              <input
                className="form-control"
                value={routeForm.busNumber}
                onChange={(e) =>
                  setRouteForm((p) => ({ ...p, busNumber: e.target.value }))
                }
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Driver Name</label>
              <input
                className="form-control"
                value={routeForm.driverName}
                onChange={(e) =>
                  setRouteForm((p) => ({ ...p, driverName: e.target.value }))
                }
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Driver Phone</label>
              <input
                className="form-control"
                value={routeForm.driverPhone}
                onChange={(e) =>
                  setRouteForm((p) => ({ ...p, driverPhone: e.target.value }))
                }
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Capacity</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={routeForm.capacity}
                onChange={(e) =>
                  setRouteForm((p) => ({ ...p, capacity: e.target.value }))
                }
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Assistant Name</label>
              <input
                className="form-control"
                value={routeForm.assistantName}
                onChange={(e) =>
                  setRouteForm((p) => ({ ...p, assistantName: e.target.value }))
                }
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Assistant Phone</label>
              <input
                className="form-control"
                value={routeForm.assistantPhone}
                onChange={(e) =>
                  setRouteForm((p) => ({
                    ...p,
                    assistantPhone: e.target.value,
                  }))
                }
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Monthly Fee</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={routeForm.monthlyFee}
                onChange={(e) =>
                  setRouteForm((p) => ({ ...p, monthlyFee: e.target.value }))
                }
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Morning Pickup Time</label>
              <input
                type="time"
                className="form-control"
                value={routeForm.morningPickupTime || ""}
                onChange={(e) =>
                  setRouteForm((p) => ({
                    ...p,
                    morningPickupTime: e.target.value,
                  }))
                }
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Afternoon Dropoff Time</label>
              <input
                type="time"
                className="form-control"
                value={routeForm.afternoonDropoffTime || ""}
                onChange={(e) =>
                  setRouteForm((p) => ({
                    ...p,
                    afternoonDropoffTime: e.target.value,
                  }))
                }
              />
            </div>

            <div className="col-md-8 mb-3">
              <label className="form-label">Stops (comma separated)</label>
              <input
                className="form-control"
                value={stopsInput}
                onChange={(e) => setStopsInput(e.target.value)}
                placeholder="e.g. Rumuola, GRA, Mile 3..."
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={routeForm.status}
                onChange={(e) =>
                  setRouteForm((p) => ({ ...p, status: e.target.value }))
                }
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>
          </div>

          <button className="btn-nigerian" type="submit">
            <FaSave className="me-2" />
            {editingId ? "Update Route" : "Save Route"}
          </button>
        </form>
      </div>

      {/* Assign Student */}
      <div className="form-container mb-4">
        <h4 className="mb-3 d-flex align-items-center gap-2">
          <FaUsers /> Assign Student To Route
        </h4>

        <form onSubmit={assignStudent}>
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Student ID *</label>
              <input
                className="form-control"
                value={assignStudentId}
                onChange={(e) => setAssignStudentId(e.target.value)}
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Route ID *</label>
              <select
                className="form-select"
                value={assignRouteId}
                onChange={(e) => setAssignRouteId(e.target.value)}
              >
                <option value="">Select route</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    #{r.id} - {r.routeName}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Stop Index</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={assignStopIndex}
                onChange={(e) => setAssignStopIndex(e.target.value)}
                placeholder="0"
              />
              <small className="text-muted">
                0 = first stop, 1 = second stop...
              </small>
            </div>
          </div>

          <button className="btn-nigerian" type="submit">
            Assign
          </button>
        </form>
      </div>

      {/* Routes Table */}
      <div className="table-container mb-4">
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
          <h4 className="mb-0">All Routes</h4>

          <div className="d-flex flex-wrap gap-2 align-items-center">
            <FaSearch />
            <input
              className="form-control"
              style={{ maxWidth: 320 }}
              placeholder="Search route name, driver, bus, stops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <button
              className={onlyActive ? "btn-nigerian" : "btn-outline-nigerian"}
              type="button"
              onClick={() => setOnlyActive((p) => !p)}
            >
              {onlyActive ? "Showing Active" : "Show Only Active"}
            </button>
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
                  <th>ID</th>
                  <th>Route</th>
                  <th>Bus</th>
                  <th>Driver</th>
                  <th>Stops</th>
                  <th>Status</th>
                  <th style={{ width: 260 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.map((r) => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>
                      <b>{r.routeName}</b>
                      {r.routeNumber ? (
                        <div className="text-muted">{r.routeNumber}</div>
                      ) : null}
                    </td>
                    <td>{r.busNumber || "-"}</td>
                    <td>
                      {r.driverName || "-"}
                      {r.driverPhone ? (
                        <div className="text-muted">{r.driverPhone}</div>
                      ) : null}
                    </td>
                    <td>
                      {Array.isArray(r.stops) && r.stops.length
                        ? r.stops.join(", ")
                        : "-"}
                    </td>
                    <td>{r.status}</td>
                    <td className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-outline-nigerian"
                        onClick={() => startEdit(r)}
                      >
                        <FaEdit className="me-1" />
                        Edit
                      </button>

                      <button
                        type="button"
                        className="btn-outline-nigerian"
                        onClick={() => openRouteStudents(r.id)}
                      >
                        <FaUsers className="me-1" />
                        Students
                      </button>

                      <button
                        type="button"
                        className="btn-nigerian"
                        onClick={() => removeRoute(r.id)}
                      >
                        <FaTrash className="me-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredRoutes.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      No routes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Students + Location Panel */}
      {viewRouteId && (
        <div className="row g-3">
          <div className="col-lg-7">
            <div className="table-container">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Route #{viewRouteId} Students</h4>
                <button
                  className="btn-outline-nigerian"
                  type="button"
                  onClick={() => loadRouteStudents(viewRouteId)}
                >
                  Refresh
                </button>
              </div>

              {studentsLoading ? (
                <div className="spinner-container">
                  <div className="spinner-border-nigerian" />
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Full Name</th>
                        <th>Class</th>
                        <th style={{ width: 160 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routeStudents.map((s) => (
                        <tr key={s.id}>
                          <td>#{s.id}</td>
                          <td>
                            {s.fullName ||
                              `${s.firstName || ""} ${s.lastName || ""}`}
                          </td>
                          <td>{s.schoolClass?.className || "-"}</td>
                          <td>
                            <button
                              className="btn-nigerian"
                              type="button"
                              onClick={() => removeStudent(s.id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}

                      {routeStudents.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center py-4">
                            No students assigned to this route.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-5">
            <BusLocationCard routeId={viewRouteId} />
          </div>
        </div>
      )}

      {!viewRouteId && (
        <div className="news-ticker">
          <FaMapMarkerAlt className="me-2" />
          Click <b>Students</b> on a route to view assigned students and manage
          bus location.
        </div>
      )}
    </div>
  );
}

function BusLocationCard({ routeId }) {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [last, setLast] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await transportAPI.getBusLocation(routeId);
      setLast(res.data);
    } catch {
      toast.error("Could not load bus location");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [routeId]);

  const update = async (e) => {
    e.preventDefault();
    if (lat === "" || lng === "") {
      toast.error("Latitude and longitude are required");
      return;
    }
    try {
      await transportAPI.updateBusLocation(routeId, Number(lat), Number(lng));
      toast.success("Location updated");
      setLat("");
      setLng("");
      await load();
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <div className="card school-card">
      <div className="card-header d-flex align-items-center gap-2">
        <FaLocationArrow /> Bus Location (Route #{routeId})
      </div>
      <div className="card-body">
        <form onSubmit={update} className="mb-3">
          <div className="row">
            <div className="col-6 mb-2">
              <label className="form-label">Latitude</label>
              <input
                className="form-control"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="e.g. 4.8156"
              />
            </div>
            <div className="col-6 mb-2">
              <label className="form-label">Longitude</label>
              <input
                className="form-control"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="e.g. 7.0498"
              />
            </div>
          </div>

          <button className="btn-nigerian" type="submit">
            Update Location
          </button>
        </form>

        <div className="fee-structure">
          <h5 className="mb-2">Last Known Location</h5>
          {loading ? (
            <div className="text-muted">Loading...</div>
          ) : (
            <>
              <div>
                <b>Lat:</b> {last?.lat ?? "-"} &nbsp; <b>Lng:</b>{" "}
                {last?.lng ?? "-"}
              </div>
              <div className="text-muted">
                <b>Updated:</b> {last?.updatedAt ? String(last.updatedAt) : "-"}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { transportAPI } from "../services/api";
import {
  FaBus,
  FaRoute,
  FaUsers,
  FaMapMarkerAlt,
  FaSyncAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";

function TransportManagement() {
  const [stats, setStats] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTransportData = async () => {
    try {
      setLoading(true);
      const [statsRes, routesRes] = await Promise.all([
        transportAPI.getTransportStatistics(),
        transportAPI.getAllRoutes(),
      ]);

      setStats(statsRes.data);
      setRoutes(routesRes.data || []);
    } catch (error) {
      toast.error("Failed to load transport dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransportData();
  }, []);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="mb-1">
            <FaBus className="me-2" />
            Transport Dashboard
          </h2>
          <p className="text-muted mb-0">
            Manage school transport routes, assignments, and bus tracking.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary"
            onClick={loadTransportData}
          >
            <FaSyncAlt className="me-2" />
            Refresh
          </button>
          <Link to="/transport/routes" className="btn btn-primary">
            Manage Routes
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="alert alert-info">Loading transport data...</div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <h6 className="text-muted">Total Routes</h6>
                  <h3>{stats?.totalRoutes ?? 0}</h3>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <h6 className="text-muted">Assigned Students</h6>
                  <h3>{stats?.assignedStudents ?? 0}</h3>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <h6 className="text-muted">Available Slots</h6>
                  <h3>{stats?.availableSlots ?? 0}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaRoute className="me-2" />
                Route Overview
              </h5>
              <Link
                to="/transport/routes"
                className="btn btn-sm btn-outline-primary"
              >
                Open Full Route Manager
              </Link>
            </div>

            <div className="card-body">
              {routes.length === 0 ? (
                <div className="alert alert-warning mb-0">
                  No transport routes created yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Route</th>
                        <th>Driver</th>
                        <th>Time</th>
                        <th>Fee</th>
                        <th>Capacity</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routes.map((route) => (
                        <tr key={route.id}>
                          <td>
                            <div className="fw-bold">{route.routeName}</div>
                            <small className="text-muted">
                              <FaMapMarkerAlt className="me-1" />
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
                            {route.pickupTime} - {route.dropoffTime}
                          </td>
                          <td>₦{route.monthlyFee}</td>
                          <td>
                            <FaUsers className="me-1" />
                            {route.assignedStudents}/{route.capacity}
                          </td>
                          <td>
                            <span
                              className={`badge ${route.active ? "bg-success" : "bg-secondary"}`}
                            >
                              {route.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TransportManagement;

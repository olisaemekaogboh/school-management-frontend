import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { transportAPI } from "../services/api";
import { FaBus, FaRoute, FaChartBar } from "react-icons/fa";
import { toast } from "react-toastify";

export default function TransportManagement() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await transportAPI.getTransportStatistics();
        setStats(res.data);
      } catch (e) {
        // Interceptor already shows toast if backend returns message
        toast.error("Could not load transport statistics");
      }
    })();
  }, []);

  return (
    <div className="content-wrapper earth-pattern">
      <div className="hero-section p-4">
        <h2 className="mb-2">Transport Management</h2>
        <p className="mb-0">
          Manage bus routes, assign students, and track location.
        </p>
      </div>

      <div className="row g-3">
        <div className="col-md-4">
          <div className="stat-card">
            <h3>{stats?.totalRoutes ?? "-"}</h3>
            <p>Total Routes</p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="stat-card">
            <h3>{stats?.activeRoutes ?? "-"}</h3>
            <p>Active Routes</p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="stat-card">
            <h3>
              <FaChartBar />
            </h3>
            <p>Quick Overview</p>
          </div>
        </div>
      </div>

      <div className="row mt-3">
        <div className="col-md-6">
          <div className="card school-card">
            <div className="card-header d-flex align-items-center gap-2">
              <FaRoute /> Routes
            </div>
            <div className="card-body">
              <p className="mb-3">
                Create / edit routes, set stops, assign students, view route
                students.
              </p>
              <Link to="/transport/routes" className="btn-nigerian">
                Manage Routes
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card school-card">
            <div className="card-header d-flex align-items-center gap-2">
              <FaBus /> Live Location
            </div>
            <div className="card-body">
              <p className="mb-3">
                Update bus location and view last location for any route.
              </p>
              <Link to="/transport/routes" className="btn-outline-nigerian">
                Open Route Tracking
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="news-ticker mt-3">
        Tip: Add stops first → then assign students using stopIndex (0 = first
        stop).
      </div>
    </div>
  );
}

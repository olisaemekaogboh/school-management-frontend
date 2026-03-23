// src/components/TransportManagement.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { transportAPI } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import {
  FaBus,
  FaRoute,
  FaUsers,
  FaMapMarkerAlt,
  FaSyncAlt,
  FaSpinner,
  FaClock,
  FaDollarSign,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "./TransportManagement.css";

function TransportManagement() {
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

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
      console.error("Error loading transport data:", error);
      toast.error(
        t?.transportManagement?.loadFailed ||
          "Failed to load transport dashboard",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransportData();
  }, []);

  if (loading) {
    return (
      <div className={`text-center py-5 ${darkMode ? "dark-mode" : ""}`}>
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">
          {t?.common?.loading || "Loading transport data..."}
        </p>
      </div>
    );
  }

  return (
    <div className={`transport-management ${darkMode ? "dark-mode" : ""}`}>
      <div className="transport-header">
        <div className="transport-header-info">
          <h2>
            <FaBus className="me-2" />
            {t?.transportManagement?.title || "Transport Dashboard"}
          </h2>
          <p className="transport-description">
            {t?.transportManagement?.description ||
              "Manage school transport routes, assignments, and bus tracking."}
          </p>
        </div>

        <div className="transport-header-actions">
          <button
            className="btn-refresh"
            onClick={loadTransportData}
            title={t?.common?.refresh || "Refresh"}
          >
            <FaSyncAlt />
          </button>
          <Link to="/transport/routes" className="btn-primary">
            {t?.transportManagement?.manageRoutes || "Manage Routes"}
          </Link>
        </div>
      </div>

      <div className="transport-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FaRoute />
          </div>
          <div className="stat-content">
            <h6>{t?.transportManagement?.totalRoutes || "Total Routes"}</h6>
            <h3>{stats?.totalRoutes ?? 0}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h6>
              {t?.transportManagement?.assignedStudents || "Assigned Students"}
            </h6>
            <h3>{stats?.assignedStudents ?? 0}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaBus />
          </div>
          <div className="stat-content">
            <h6>
              {t?.transportManagement?.availableSlots || "Available Slots"}
            </h6>
            <h3>{stats?.availableSlots ?? 0}</h3>
          </div>
        </div>
      </div>

      <div className="transport-card">
        <div className="transport-card-header">
          <h5 className="mb-0">
            <FaRoute className="me-2" />
            {t?.transportManagement?.routeOverview || "Route Overview"}
          </h5>
          <Link to="/transport/routes" className="btn-outline-primary">
            {t?.transportManagement?.openRouteManager ||
              "Open Full Route Manager"}
          </Link>
        </div>

        <div className="transport-card-body">
          {routes.length === 0 ? (
            <div className="empty-state">
              <FaBus size={48} />
              <p>
                {t?.transportManagement?.noRoutes ||
                  "No transport routes created yet."}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="transport-table">
                <thead>
                  <tr>
                    <th>{t?.transportManagement?.route || "Route"}</th>
                    <th>{t?.transportManagement?.driver || "Driver"}</th>
                    <th>{t?.transportManagement?.time || "Time"}</th>
                    <th>{t?.transportManagement?.fee || "Fee"}</th>
                    <th>{t?.transportManagement?.capacity || "Capacity"}</th>
                    <th>{t?.transportManagement?.status || "Status"}</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((route) => (
                    <tr key={route.id}>
                      <td className="route-cell">
                        <div className="route-name">{route.routeName}</div>
                        <div className="route-location">
                          <FaMapMarkerAlt className="me-1" />
                          {route.pickupLocation} → {route.dropoffLocation}
                        </div>
                      </td>
                      <td className="driver-cell">
                        <div className="driver-name">{route.driverName}</div>
                        <div className="driver-phone">{route.driverPhone}</div>
                      </td>
                      <td className="time-cell">
                        <FaClock className="me-1" />
                        {route.pickupTime} - {route.dropoffTime}
                      </td>
                      <td className="fee-cell">
                        <FaDollarSign className="me-1" />₦
                        {route.monthlyFee?.toLocaleString() || 0}
                      </td>
                      <td className="capacity-cell">
                        <FaUsers className="me-1" />
                        {route.assignedStudents || 0}/{route.capacity}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            route.active ? "status-active" : "status-inactive"
                          }`}
                        >
                          {route.active
                            ? t?.transportManagement?.active || "Active"
                            : t?.transportManagement?.inactive || "Inactive"}
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

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default TransportManagement;

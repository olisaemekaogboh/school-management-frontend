import React, { useEffect, useState } from "react";
import {
  authAPI,
  parentPortalAPI,
  studentAPI,
  transportAPI,
} from "../services/api";
import { toast } from "react-toastify";
import {
  FaBus,
  FaMapMarkerAlt,
  FaPhone,
  FaClock,
  FaMoneyBill,
  FaSpinner,
} from "react-icons/fa";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import "./BusTracking.css";

function BusTracking() {
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const [user, setUser] = useState(null);
  const [route, setRoute] = useState(null);
  const [location, setLocation] = useState(null);
  const [wards, setWards] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ui = {
    loadFailed:
      t?.busTracking?.loadFailed || "Failed to load transport tracking",
    noRouteAssigned: t?.busTracking?.noRouteAssigned || "No route assigned yet",
    loading: t?.busTracking?.loading || "Loading bus tracking...",
    title: t?.busTracking?.title || "Bus Tracking",
    subtitle:
      t?.busTracking?.subtitle ||
      "View assigned transport route and latest bus location.",
    selectWard: t?.busTracking?.selectWard || "Select Ward",
    chooseWard: t?.busTracking?.chooseWard || "Choose ward",
    noTransportRoute:
      t?.busTracking?.noTransportRoute ||
      "No transport route is assigned to this student yet.",
    assignedRoute: t?.busTracking?.assignedRoute || "Assigned Route",
    pickup: t?.busTracking?.pickup || "Pickup",
    dropOff: t?.busTracking?.dropOff || "Drop-off",
    pickupTime: t?.busTracking?.pickupTime || "Pickup Time",
    dropOffTime: t?.busTracking?.dropOffTime || "Drop-off Time",
    driver: t?.busTracking?.driver || "Driver",
    assistant: t?.busTracking?.assistant || "Assistant",
    notAssigned: t?.busTracking?.notAssigned || "Not assigned",
    noPhone: t?.busTracking?.noPhone || "No phone",
    monthlyFee: t?.busTracking?.monthlyFee || "Monthly Fee",
    currentBusLocation:
      t?.busTracking?.currentBusLocation || "Current Bus Location",
    latitude: t?.busTracking?.latitude || "Latitude",
    longitude: t?.busTracking?.longitude || "Longitude",
    latestLocationRecorded:
      t?.busTracking?.latestLocationRecorded ||
      "Latest location has been recorded for this bus route.",
    locationNotUpdated:
      t?.busTracking?.locationNotUpdated ||
      "Bus location has not been updated yet.",
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const meRes = await authAPI.getCurrentUser();
      const currentUser = meRes.data;
      setUser(currentUser);

      if (currentUser?.role === "STUDENT") {
        const profileRes = await studentAPI.getMyProfile();
        const student = profileRes.data;
        if (student?.id) {
          await loadStudentRoute(student.id);
        }
      } else if (currentUser?.role === "PARENT") {
        const wardsRes = await parentPortalAPI.getMyWards();
        const wardList = wardsRes.data || [];
        setWards(wardList);

        if (wardList.length > 0) {
          const firstWardId = wardList[0].id;
          setSelectedStudentId(String(firstWardId));
          await loadStudentRoute(firstWardId);
        } else {
          setError("No wards found");
        }
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      setError(ui.loadFailed);
      toast.error(ui.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentRoute = async (studentId) => {
    try {
      setError(null);
      
      // Try multiple API methods with better error handling
      let routeRes = null;
      const apiMethods = [
        () => transportAPI.getRouteByStudent?.(studentId),
        () => transportAPI.getStudentRoute?.(studentId),
        () => transportAPI.getAssignedRoute?.(studentId),
        () => transportAPI.getStudentAssignedRoute?.(studentId),
      ];

      for (const method of apiMethods) {
        try {
          const res = await method();
          if (res?.data) {
            routeRes = res;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      const routeData = routeRes?.data;
      if (!routeData) {
        setRoute(null);
        setLocation(null);
        return;
      }

      setRoute(routeData);

      // Load bus location if route has an ID
      if (routeData.id) {
        try {
          const locationRes = await transportAPI.getBusLocation(routeData.id);
          setLocation(locationRes.data || null);
        } catch (err) {
          setLocation(null);
        }
      }
    } catch (error) {
      console.error("Error loading student route:", error);
      setRoute(null);
      setLocation(null);
    }
  };

  const handleWardChange = async (e) => {
    const studentId = e.target.value;
    setSelectedStudentId(studentId);
    if (studentId) {
      setLoading(true);
      await loadStudentRoute(studentId);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bus-tracking text-center py-5">
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">{ui.loading}</p>
      </div>
    );
  }

  return (
    <div className="bus-tracking container py-4">
      <div className="mb-4">
        <h2 className="mb-1">
          <FaBus className="me-2" />
          {ui.title}
        </h2>
        <p className="text-muted mb-0">{ui.subtitle}</p>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {user?.role === "PARENT" && wards.length > 0 && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <label className="form-label fw-bold">{ui.selectWard}</label>
            <select
              className="form-select"
              value={selectedStudentId}
              onChange={handleWardChange}
            >
              <option value="">{ui.chooseWard}</option>
              {wards.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {ward.firstName} {ward.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {!route ? (
        <div className="alert alert-warning">
          <FaBus className="me-2" />
          {ui.noTransportRoute}
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="card shadow-sm h-100">
              <div className="card-header border-bottom">
                <h5 className="mb-0">{ui.assignedRoute}</h5>
              </div>
              <div className="card-body">
                <h4 className="mb-2">{route.routeName}</h4>
                {route.routeCode && (
                  <p className="text-muted mb-3">{route.routeCode}</p>
                )}

                <div className="route-details">
                  <p className="mb-2">
                    <FaMapMarkerAlt className="me-2 text-primary" />
                    <strong>{ui.pickup}:</strong> {route.pickupLocation || "N/A"}
                  </p>
                  <p className="mb-2">
                    <FaMapMarkerAlt className="me-2 text-success" />
                    <strong>{ui.dropOff}:</strong> {route.dropoffLocation || "N/A"}
                  </p>
                  <p className="mb-2">
                    <FaClock className="me-2 text-warning" />
                    <strong>{ui.pickupTime}:</strong> {route.pickupTime || "N/A"}
                  </p>
                  <p className="mb-2">
                    <FaClock className="me-2 text-warning" />
                    <strong>{ui.dropOffTime}:</strong> {route.dropoffTime || "N/A"}
                  </p>
                  <p className="mb-2">
                    <FaPhone className="me-2 text-info" />
                    <strong>{ui.driver}:</strong> {route.driverName || "N/A"} 
                    {route.driverPhone && ` (${route.driverPhone})`}
                  </p>
                  <p className="mb-2">
                    <FaPhone className="me-2 text-info" />
                    <strong>{ui.assistant}:</strong>{" "}
                    {route.assistantName
                      ? `${route.assistantName}${route.assistantPhone ? ` (${route.assistantPhone})` : ` (${ui.noPhone})`}`
                      : ui.notAssigned}
                  </p>
                  {route.monthlyFee && (
                    <p className="mb-0">
                      <FaMoneyBill className="me-2 text-success" />
                      <strong>{ui.monthlyFee}:</strong> ₦
                      {typeof route.monthlyFee === 'number' 
                        ? route.monthlyFee.toLocaleString() 
                        : route.monthlyFee}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card shadow-sm h-100">
              <div className="card-header border-bottom">
                <h5 className="mb-0">{ui.currentBusLocation}</h5>
              </div>
              <div className="card-body">
                {location?.latitude != null && location?.longitude != null ? (
                  <>
                    <div className="location-coordinates">
                      <p className="mb-2">
                        <strong>{ui.latitude}:</strong>{" "}
                        <code>{location.latitude}</code>
                      </p>
                      <p className="mb-2">
                        <strong>{ui.longitude}:</strong>{" "}
                        <code>{location.longitude}</code>
                      </p>
                      {location.lastUpdated && (
                        <p className="mb-2">
                          <strong>Last Updated:</strong>{" "}
                          {new Date(location.lastUpdated).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="alert alert-success mt-3 mb-0">
                      <FaBus className="me-2" />
                      {ui.latestLocationRecorded}
                    </div>
                  </>
                ) : (
                  <div className="alert alert-secondary mb-0">
                    <FaMapMarkerAlt className="me-2" />
                    {ui.locationNotUpdated}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default BusTracking;
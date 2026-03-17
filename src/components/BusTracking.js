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
} from "react-icons/fa";

function BusTracking() {
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState(null);
  const [location, setLocation] = useState(null);
  const [wards, setWards] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    try {
      setLoading(true);
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
        }
      }
    } catch (error) {
      toast.error("Failed to load transport tracking");
    } finally {
      setLoading(false);
    }
  };

  const loadStudentRoute = async (studentId) => {
    try {
      const routeRes =
        (await transportAPI.getRouteByStudent?.(studentId)) ||
        (await transportAPI.getStudentRoute?.(studentId)) ||
        (await transportAPI.getAssignedRoute?.(studentId)) ||
        (await transportAPI.getStudentAssignedRoute?.(studentId));

      const routeData = routeRes?.data;
      if (!routeData) return;

      setRoute(routeData);

      const locationRes = await transportAPI.getBusLocation(routeData.id);
      setLocation(locationRes.data || null);
    } catch (error) {
      setRoute(null);
      setLocation(null);
      toast.info("No route assigned yet");
    }
  };

  const handleWardChange = async (e) => {
    const studentId = e.target.value;
    setSelectedStudentId(studentId);
    if (studentId) {
      await loadStudentRoute(studentId);
    }
  };

  if (loading) {
    return (
      <div className="container py-4">
        <div className="alert alert-info">Loading bus tracking...</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="mb-1">
          <FaBus className="me-2" />
          Bus Tracking
        </h2>
        <p className="text-muted mb-0">
          View assigned transport route and latest bus location.
        </p>
      </div>

      {user?.role === "PARENT" && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <label className="form-label fw-bold">Select Ward</label>
            <select
              className="form-select"
              value={selectedStudentId}
              onChange={handleWardChange}
            >
              <option value="">Choose ward</option>
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
          No transport route is assigned to this student yet.
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white">
                <h5 className="mb-0">Assigned Route</h5>
              </div>
              <div className="card-body">
                <h4>{route.routeName}</h4>
                <p className="text-muted">{route.routeCode}</p>

                <p>
                  <FaMapMarkerAlt className="me-2 text-primary" />
                  <strong>Pickup:</strong> {route.pickupLocation}
                </p>
                <p>
                  <FaMapMarkerAlt className="me-2 text-success" />
                  <strong>Drop-off:</strong> {route.dropoffLocation}
                </p>
                <p>
                  <FaClock className="me-2 text-warning" />
                  <strong>Pickup Time:</strong> {route.pickupTime}
                </p>
                <p>
                  <FaClock className="me-2 text-warning" />
                  <strong>Drop-off Time:</strong> {route.dropoffTime}
                </p>
                <p>
                  <FaPhone className="me-2 text-info" />
                  <strong>Driver:</strong> {route.driverName} (
                  {route.driverPhone})
                </p>
                <p>
                  <FaPhone className="me-2 text-info" />
                  <strong>Assistant:</strong>{" "}
                  {route.assistantName
                    ? `${route.assistantName} (${route.assistantPhone || "No phone"})`
                    : "Not assigned"}
                </p>
                <p className="mb-0">
                  <FaMoneyBill className="me-2 text-success" />
                  <strong>Monthly Fee:</strong> ₦{route.monthlyFee}
                </p>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white">
                <h5 className="mb-0">Current Bus Location</h5>
              </div>
              <div className="card-body">
                {location?.latitude != null && location?.longitude != null ? (
                  <>
                    <p>
                      <strong>Latitude:</strong> {location.latitude}
                    </p>
                    <p>
                      <strong>Longitude:</strong> {location.longitude}
                    </p>
                    <div className="alert alert-success mb-0">
                      Latest location has been recorded for this bus route.
                    </div>
                  </>
                ) : (
                  <div className="alert alert-secondary mb-0">
                    Bus location has not been updated yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BusTracking;

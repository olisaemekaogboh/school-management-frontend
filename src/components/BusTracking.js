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
import { useLanguage } from "../contexts/LanguageContext";

function BusTracking() {
  const { t } = useLanguage();

  const [user, setUser] = useState(null);
  const [route, setRoute] = useState(null);
  const [location, setLocation] = useState(null);
  const [wards, setWards] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);

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
      toast.error(ui.loadFailed);
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
      toast.info(ui.noRouteAssigned);
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
        <div className="alert alert-info">{ui.loading}</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="mb-1">
          <FaBus className="me-2" />
          {ui.title}
        </h2>
        <p className="text-muted mb-0">{ui.subtitle}</p>
      </div>

      {user?.role === "PARENT" && (
        <div className="card shadow-sm border-0 mb-4">
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
        <div className="alert alert-warning">{ui.noTransportRoute}</div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white">
                <h5 className="mb-0">{ui.assignedRoute}</h5>
              </div>
              <div className="card-body">
                <h4>{route.routeName}</h4>
                <p className="text-muted">{route.routeCode}</p>

                <p>
                  <FaMapMarkerAlt className="me-2 text-primary" />
                  <strong>{ui.pickup}:</strong> {route.pickupLocation}
                </p>
                <p>
                  <FaMapMarkerAlt className="me-2 text-success" />
                  <strong>{ui.dropOff}:</strong> {route.dropoffLocation}
                </p>
                <p>
                  <FaClock className="me-2 text-warning" />
                  <strong>{ui.pickupTime}:</strong> {route.pickupTime}
                </p>
                <p>
                  <FaClock className="me-2 text-warning" />
                  <strong>{ui.dropOffTime}:</strong> {route.dropoffTime}
                </p>
                <p>
                  <FaPhone className="me-2 text-info" />
                  <strong>{ui.driver}:</strong> {route.driverName} (
                  {route.driverPhone})
                </p>
                <p>
                  <FaPhone className="me-2 text-info" />
                  <strong>{ui.assistant}:</strong>{" "}
                  {route.assistantName
                    ? `${route.assistantName} (${route.assistantPhone || ui.noPhone})`
                    : ui.notAssigned}
                </p>
                <p className="mb-0">
                  <FaMoneyBill className="me-2 text-success" />
                  <strong>{ui.monthlyFee}:</strong> ₦{route.monthlyFee}
                </p>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white">
                <h5 className="mb-0">{ui.currentBusLocation}</h5>
              </div>
              <div className="card-body">
                {location?.latitude != null && location?.longitude != null ? (
                  <>
                    <p>
                      <strong>{ui.latitude}:</strong> {location.latitude}
                    </p>
                    <p>
                      <strong>{ui.longitude}:</strong> {location.longitude}
                    </p>
                    <div className="alert alert-success mb-0">
                      {ui.latestLocationRecorded}
                    </div>
                  </>
                ) : (
                  <div className="alert alert-secondary mb-0">
                    {ui.locationNotUpdated}
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

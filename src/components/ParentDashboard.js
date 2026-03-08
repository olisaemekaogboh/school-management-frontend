import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { parentAPI } from "../services/api";
import {
  FaChild,
  FaMoneyBill,
  FaChartBar,
  FaCalendarAlt,
  FaSpinner,
} from "react-icons/fa";

function ParentDashboard() {
  const { user } = useAuth();
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.parentId) {
      fetchWards();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchWards = async () => {
    try {
      const response = await parentAPI.getWards(user.parentId);
      setWards(response.data || []);
    } catch (error) {
      console.error("Error fetching wards:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <FaSpinner className="spin" size={40} />
      </div>
    );
  }

  return (
    <div className="parent-dashboard container py-4">
      <h2 className="mb-4">
        <FaChild className="me-2" /> Welcome, {user?.firstName}!
      </h2>

      {wards.length === 0 ? (
        <div className="alert alert-info">
          No ward linked to this parent account yet.
        </div>
      ) : (
        <div className="row">
          {wards.map((ward) => (
            <div key={ward.id} className="col-md-6 mb-4">
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    {ward.fullName || `${ward.firstName} ${ward.lastName}`}
                  </h5>
                </div>
                <div className="card-body">
                  <p>
                    <strong>Admission:</strong> {ward.admissionNumber}
                  </p>
                  <p>
                    <strong>Class:</strong> {ward.studentClass} {ward.classArm}
                  </p>

                  <div className="d-flex gap-2 mt-3 flex-wrap">
                    <Link
                      to={`/results?student=${ward.id}`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      <FaChartBar /> Results
                    </Link>
                    <Link
                      to={`/attendance?student=${ward.id}`}
                      className="btn btn-sm btn-outline-success"
                    >
                      <FaCalendarAlt /> Attendance
                    </Link>
                    <Link
                      to={`/fees?student=${ward.id}`}
                      className="btn btn-sm btn-outline-warning"
                    >
                      <FaMoneyBill /> Fees
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ParentDashboard;

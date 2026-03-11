import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { parentPortalAPI } from "../services/api";
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
    fetchWards();
  }, []);

  const fetchWards = async () => {
    try {
      const response = await parentPortalAPI.getMyWards();
      setWards(response.data || []);
    } catch (error) {
      console.error("Error fetching wards:", error);
      setWards([]);
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
              <div className="card shadow-sm h-100">
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
                      to={`/results?student=${ward.id}&scope=parent`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      <FaChartBar className="me-1" />
                      Results
                    </Link>

                    <Link
                      to={`/attendance?student=${ward.id}&scope=parent`}
                      className="btn btn-sm btn-outline-success"
                    >
                      <FaCalendarAlt className="me-1" />
                      Attendance
                    </Link>

                    <Link
                      to={`/fees?student=${ward.id}&scope=parent`}
                      className="btn btn-sm btn-outline-warning"
                    >
                      <FaMoneyBill className="me-1" />
                      Fees
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
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaBookOpen,
  FaCalendarAlt,
  FaChartBar,
} from "react-icons/fa";

function TeacherDashboard() {
  const { user } = useAuth();

  return (
    <div className="teacher-dashboard container py-4">
      <h2 className="mb-4">
        <FaChalkboardTeacher className="me-2" /> Welcome, {user?.firstName}!
      </h2>

      <div className="row">
        <div className="col-md-3 mb-4">
          <div className="card text-center h-100">
            <div className="card-body">
              <FaUsers size={40} className="text-primary mb-3" />
              <h5>My Class Students</h5>
              <p>View only students in your assigned class</p>
              <Link to="/students" className="btn btn-primary">
                Go to Students
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-4">
          <div className="card text-center h-100">
            <div className="card-body">
              <FaBookOpen size={40} className="text-success mb-3" />
              <h5>Results</h5>
              <p>Enter and view results for your class only</p>
              <Link to="/results" className="btn btn-success">
                Manage Results
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-4">
          <div className="card text-center h-100">
            <div className="card-body">
              <FaCalendarAlt size={40} className="text-warning mb-3" />
              <h5>Attendance</h5>
              <p>Mark attendance only for your class</p>
              <Link to="/attendance" className="btn btn-warning">
                Mark Attendance
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-4">
          <div className="card text-center h-100">
            <div className="card-body">
              <FaChartBar size={40} className="text-info mb-3" />
              <h5>Session Results</h5>
              <p>View term and session performance</p>
              <Link to="/session-results" className="btn btn-info">
                View Session Results
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;

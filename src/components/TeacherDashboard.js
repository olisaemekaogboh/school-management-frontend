import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaBookOpen,
  FaCalendarAlt,
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
              <h5>My Students</h5>
              <p>View and manage your students</p>
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
              <h5>My Classes</h5>
              <p>View your assigned classes</p>
              <Link to="/classes" className="btn btn-success">
                Go to Classes
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-4">
          <div className="card text-center h-100">
            <div className="card-body">
              <FaCalendarAlt size={40} className="text-warning mb-3" />
              <h5>Timetable</h5>
              <p>View your teaching schedule</p>
              <Link to="/timetable" className="btn btn-warning">
                View Timetable
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-4">
          <div className="card text-center h-100">
            <div className="card-body">
              <FaChalkboardTeacher size={40} className="text-info mb-3" />
              <h5>Attendance</h5>
              <p>Mark student attendance</p>
              <Link to="/attendance" className="btn btn-info">
                Mark Attendance
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;

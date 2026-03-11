import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { teacherAPI, classAPI } from "../services/api";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaBookOpen,
  FaCalendarAlt,
  FaChartBar,
  FaSpinner,
} from "react-icons/fa";

function TeacherDashboard() {
  const { user } = useAuth();
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeacherDashboard();
  }, []);

  const loadTeacherDashboard = async () => {
    try {
      const [teacherRes, classesRes] = await Promise.all([
        teacherAPI.getMyTeacherProfile(),
        classAPI.getAllClasses(),
      ]);

      const teacher = teacherRes.data;
      const teacherId = teacher?.id;

      const classes = (classesRes.data || []).filter(
        (cls) =>
          cls?.classTeacher?.id === teacherId ||
          cls?.classTeacherId === teacherId
      );

      setTeacherProfile(teacher);
      setAssignedClasses(classes);
    } catch (error) {
      console.error("Error loading teacher dashboard:", error);
      setAssignedClasses([]);
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
    <div className="teacher-dashboard container py-4">
      <h2 className="mb-4">
        <FaChalkboardTeacher className="me-2" /> Welcome,{" "}
        {teacherProfile?.firstName || user?.firstName}!
      </h2>

      {assignedClasses.length === 0 ? (
        <div className="alert alert-info">
          No class has been assigned to this teacher yet.
        </div>
      ) : (
        <div className="row">
          {assignedClasses.map((schoolClass) => (
            <div className="col-md-6 col-lg-4 mb-4" key={schoolClass.id}>
              <div className="card shadow-sm h-100">
                <div className="card-header bg-dark text-white">
                  <h5 className="mb-0">
                    {schoolClass.className} {schoolClass.arm}
                  </h5>
                </div>

                <div className="card-body">
                  <p>
                    <strong>Class Code:</strong> {schoolClass.classCode || "-"}
                  </p>

                  <div className="d-grid gap-2">
                    <Link
                      to={`/students?className=${encodeURIComponent(
                        schoolClass.className
                      )}&arm=${encodeURIComponent(schoolClass.arm)}`}
                      className="btn btn-primary"
                    >
                      <FaUsers className="me-2" />
                      My Class Students
                    </Link>

                    <Link
                      to={`/results?className=${encodeURIComponent(
                        schoolClass.className
                      )}&arm=${encodeURIComponent(schoolClass.arm)}`}
                      className="btn btn-success"
                    >
                      <FaBookOpen className="me-2" />
                      Manage Results
                    </Link>

                    <Link
                      to={`/attendance?className=${encodeURIComponent(
                        schoolClass.className
                      )}&arm=${encodeURIComponent(schoolClass.arm)}`}
                      className="btn btn-warning"
                    >
                      <FaCalendarAlt className="me-2" />
                      Mark Attendance
                    </Link>

                    <Link
                      to={`/session-results?className=${encodeURIComponent(
                        schoolClass.className
                      )}&arm=${encodeURIComponent(schoolClass.arm)}`}
                      className="btn btn-info"
                    >
                      <FaChartBar className="me-2" />
                      View Session Results
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

export default TeacherDashboard;
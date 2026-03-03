// src/components/ClassView.js
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { studentAPI } from "../services/api";
import { FaEye } from "react-icons/fa";

function ClassView() {
  const { className } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classStats, setClassStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    arms: [],
  });

  useEffect(() => {
    fetchClassStudents();
  }, [className]);

  const fetchClassStudents = async () => {
    try {
      const response = await studentAPI.getStudentsByClass(className);
      setStudents(response.data);

      // Calculate statistics
      const male = response.data.filter((s) => s.gender === "MALE").length;
      const female = response.data.filter((s) => s.gender === "FEMALE").length;
      const arms = [
        ...new Set(response.data.map((s) => s.classArm).filter(Boolean)),
      ];

      setClassStats({
        total: response.data.length,
        male,
        female,
        arms,
      });
    } catch (error) {
      console.error("Error fetching class students:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner-border spinner-border-nigerian" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="class-view">
      <h2 className="mb-4">Class {className}</h2>

      {/* Class Statistics */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <h3>{classStats.total}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card" style={{ background: "#003366" }}>
            <h3>{classStats.male}</h3>
            <p>Male</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card" style={{ background: "#800000" }}>
            <h3>{classStats.female}</h3>
            <p>Female</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card" style={{ background: "#008753" }}>
            <h3>{classStats.arms.length}</h3>
            <p>Class Arms</p>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="table-container">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Admission No.</th>
              <th>Full Name</th>
              <th>Arm</th>
              <th>Gender</th>
              <th>Parent Name</th>
              <th>Parent Phone</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.admissionNumber}</td>
                <td>{student.fullName}</td>
                <td>{student.classArm || "N/A"}</td>
                <td>{student.gender}</td>
                <td>{student.parentName}</td>
                <td>{student.parentPhone}</td>
                <td>
                  <Link
                    to={`/students/view/${student.id}`}
                    className="btn btn-sm btn-info"
                  >
                    <FaEye className="me-1" /> View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClassView;

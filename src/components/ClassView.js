import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { studentAPI } from "../services/api";
import { FaEye } from "react-icons/fa";
import { useLanguage } from "../contexts/LanguageContext";

function ClassView() {
  const { className } = useParams();
  const { t } = useLanguage();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [className]);

  const fetchClassStudents = async () => {
    try {
      const response = await studentAPI.getStudentsByClass(className);
      const data = Array.isArray(response.data) ? response.data : [];
      setStudents(data);

      const male = data.filter((s) => s.gender === "MALE").length;
      const female = data.filter((s) => s.gender === "FEMALE").length;
      const arms = [...new Set(data.map((s) => s.classArm).filter(Boolean))];

      setClassStats({
        total: data.length,
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

  const ui = {
    loading: t?.common?.loading || "Loading...",
    classLabel: t?.classView?.classLabel || "Class",
    totalStudents: t?.classView?.totalStudents || "Total Students",
    male: t?.classView?.male || "Male",
    female: t?.classView?.female || "Female",
    classArms: t?.classView?.classArms || "Class Arms",
    admissionNo: t?.classView?.admissionNo || "Admission No.",
    fullName: t?.classView?.fullName || "Full Name",
    arm: t?.classView?.arm || "Arm",
    gender: t?.classView?.gender || "Gender",
    parentName: t?.classView?.parentName || "Parent Name",
    parentPhone: t?.classView?.parentPhone || "Parent Phone",
    action: t?.classView?.action || "Action",
    view: t?.classView?.view || "View",
    notAvailable: t?.classView?.notAvailable || "N/A",
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner-border spinner-border-nigerian" role="status">
          <span className="visually-hidden">{ui.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="class-view">
      <h2 className="mb-4">
        {ui.classLabel} {className}
      </h2>

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <h3>{classStats.total}</h3>
            <p>{ui.totalStudents}</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card" style={{ background: "#003366" }}>
            <h3>{classStats.male}</h3>
            <p>{ui.male}</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card" style={{ background: "#800000" }}>
            <h3>{classStats.female}</h3>
            <p>{ui.female}</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card" style={{ background: "#008753" }}>
            <h3>{classStats.arms.length}</h3>
            <p>{ui.classArms}</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>{ui.admissionNo}</th>
              <th>{ui.fullName}</th>
              <th>{ui.arm}</th>
              <th>{ui.gender}</th>
              <th>{ui.parentName}</th>
              <th>{ui.parentPhone}</th>
              <th>{ui.action}</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.admissionNumber}</td>
                <td>{student.fullName}</td>
                <td>{student.classArm || ui.notAvailable}</td>
                <td>{student.gender}</td>
                <td>{student.parentName}</td>
                <td>{student.parentPhone}</td>
                <td>
                  <Link
                    to={`/students/view/${student.id}`}
                    className="btn btn-sm btn-info"
                  >
                    <FaEye className="me-1" /> {ui.view}
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

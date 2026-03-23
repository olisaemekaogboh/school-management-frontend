// src/components/Statistics.js
import React, { useState, useEffect } from "react";
import { studentAPI } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import {
  FaSpinner,
  FaUsers,
  FaUserGraduate,
  FaMapMarkerAlt,
  FaSchool,
} from "react-icons/fa";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

function Statistics() {
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentsByState, setStudentsByState] = useState({});
  const [studentsByStatus, setStudentsByStatus] = useState({});

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await studentAPI.getStatistics();
      setStatistics(response.data);

      const allStudentsResponse = await studentAPI.getAllStudents();
      const students = allStudentsResponse.data;

      const stateMap = {};
      students.forEach((student) => {
        if (student.stateOfOrigin) {
          stateMap[student.stateOfOrigin] =
            (stateMap[student.stateOfOrigin] || 0) + 1;
        }
      });
      setStudentsByState(stateMap);

      const statusMap = {};
      students.forEach((student) => {
        if (student.status) {
          statusMap[student.status] = (statusMap[student.status] || 0) + 1;
        }
      });
      setStudentsByStatus(statusMap);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container text-center py-5">
        <FaSpinner className="spin" size={40} />
        <p className="mt-3">{t?.common?.loading || "Loading statistics..."}</p>
      </div>
    );
  }

  const classDistributionData = {
    labels: statistics?.studentsByClass
      ? Object.keys(statistics.studentsByClass)
      : [],
    datasets: [
      {
        label: t?.statistics?.numberOfStudents || "Number of Students",
        data: statistics?.studentsByClass
          ? Object.values(statistics.studentsByClass)
          : [],
        backgroundColor: "#008753",
        borderColor: "#003366",
        borderWidth: 1,
      },
    ],
  };

  const stateDistributionData = {
    labels: Object.keys(studentsByState),
    datasets: [
      {
        label: t?.statistics?.studentsByState || "Students by State",
        data: Object.values(studentsByState),
        backgroundColor: [
          "#008753",
          "#003366",
          "#FFD700",
          "#800000",
          "#FF6B6B",
          "#4ECDC4",
          "#45B7D1",
          "#96CEB4",
          "#FFE194",
          "#E6B89C",
        ],
      },
    ],
  };

  const statusDistributionData = {
    labels: Object.keys(studentsByStatus),
    datasets: [
      {
        data: Object.values(studentsByStatus),
        backgroundColor: [
          "#28a745",
          "#17a2b8",
          "#ffc107",
          "#fd7e14",
          "#dc3545",
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: t?.statistics?.classDistribution || "Class Distribution",
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: { legend: { position: "right" } },
  };

  return (
    <div className="statistics container py-4">
      <h2 className="mb-4">{t?.statistics?.title || "School Statistics"}</h2>

      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="stat-card">
            <h3>{statistics?.totalStudents || 0}</h3>
            <p>{t?.statistics?.totalStudents || "Total Students"}</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stat-card" style={{ background: "#003366" }}>
            <h3>{statistics?.activeStudents || 0}</h3>
            <p>{t?.statistics?.activeStudents || "Active Students"}</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stat-card" style={{ background: "#800000" }}>
            <h3>{Object.keys(studentsByState).length}</h3>
            <p>{t?.statistics?.statesRepresented || "States Represented"}</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stat-card" style={{ background: "#008753" }}>
            <h3>
              {statistics?.studentsByClass
                ? Object.keys(statistics.studentsByClass).length
                : 0}
            </h3>
            <p>{t?.statistics?.classes || "Classes"}</p>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="school-card p-3">
            <Bar data={classDistributionData} options={chartOptions} />
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="school-card p-3">
            <Pie data={stateDistributionData} options={pieOptions} />
            <h5 className="text-center mt-3">
              {t?.statistics?.studentsByStateTitle ||
                "Students by State of Origin"}
            </h5>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="school-card p-3">
            <Pie data={statusDistributionData} options={pieOptions} />
            <h5 className="text-center mt-3">
              {t?.statistics?.studentsByStatusTitle || "Students by Status"}
            </h5>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="school-card p-3">
            <h5 className="mb-3">
              {t?.statistics?.recentAdmissions || "Recent Admissions"}
            </h5>
            <div className="list-group">
              {statistics?.recentAdmissions?.map((student) => (
                <div key={student.id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{student.fullName}</strong>
                      <br />
                      <small className="text-muted">
                        {student.admissionNumber}
                      </small>
                    </div>
                    <span className="badge bg-success">
                      {student.studentClass}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="school-card p-3">
            <h5 className="mb-3">
              {t?.statistics?.stateDistribution ||
                "Student Distribution by State"}
            </h5>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>{t?.statistics?.state || "State"}</th>
                    <th>
                      {t?.statistics?.numberOfStudents || "Number of Students"}
                    </th>
                    <th>{t?.statistics?.percentage || "Percentage"}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(studentsByState)
                    .sort((a, b) => b[1] - a[1])
                    .map(([state, count]) => (
                      <tr key={state}>
                        <td>{state}</td>
                        <td>{count}</td>
                        <td>
                          {((count / statistics?.totalStudents) * 100).toFixed(
                            1,
                          )}
                          %
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Statistics;

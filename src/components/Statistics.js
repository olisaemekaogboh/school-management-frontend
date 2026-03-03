// src/components/Statistics.js
import React, { useState, useEffect } from "react";
import { studentAPI } from "../services/api";
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

      // Fetch all students to calculate additional statistics
      const allStudentsResponse = await studentAPI.getAllStudents();
      const students = allStudentsResponse.data;

      // Calculate students by state
      const stateMap = {};
      students.forEach((student) => {
        if (student.stateOfOrigin) {
          stateMap[student.stateOfOrigin] =
            (stateMap[student.stateOfOrigin] || 0) + 1;
        }
      });
      setStudentsByState(stateMap);

      // Calculate students by status
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
      <div className="spinner-container">
        <div className="spinner-border spinner-border-nigerian" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Class distribution chart data
  const classDistributionData = {
    labels: statistics?.studentsByClass
      ? Object.keys(statistics.studentsByClass)
      : [],
    datasets: [
      {
        label: "Number of Students",
        data: statistics?.studentsByClass
          ? Object.values(statistics.studentsByClass)
          : [],
        backgroundColor: "#008753",
        borderColor: "#003366",
        borderWidth: 1,
      },
    ],
  };

  // State distribution chart data
  const stateDistributionData = {
    labels: Object.keys(studentsByState),
    datasets: [
      {
        label: "Students by State",
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

  // Status distribution chart data
  const statusDistributionData = {
    labels: Object.keys(studentsByStatus),
    datasets: [
      {
        data: Object.values(studentsByStatus),
        backgroundColor: [
          "#28a745", // Active - green
          "#17a2b8", // Graduated - teal
          "#ffc107", // Transferred - yellow
          "#fd7e14", // Suspended - orange
          "#dc3545", // Withdrawn - red
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Class Distribution",
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
      },
    },
  };

  return (
    <div className="statistics">
      <h2 className="mb-4">School Statistics</h2>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="stat-card">
            <h3>{statistics?.totalStudents || 0}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stat-card" style={{ background: "#003366" }}>
            <h3>{statistics?.activeStudents || 0}</h3>
            <p>Active Students</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stat-card" style={{ background: "#800000" }}>
            <h3>{Object.keys(studentsByState).length}</h3>
            <p>States Represented</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stat-card" style={{ background: "#008753" }}>
            <h3>
              {statistics?.studentsByClass
                ? Object.keys(statistics.studentsByClass).length
                : 0}
            </h3>
            <p>Classes</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="school-card p-3">
            <Bar data={classDistributionData} options={chartOptions} />
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="school-card p-3">
            <Pie data={stateDistributionData} options={pieOptions} />
            <h5 className="text-center mt-3">Students by State of Origin</h5>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="school-card p-3">
            <Pie data={statusDistributionData} options={pieOptions} />
            <h5 className="text-center mt-3">Students by Status</h5>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="school-card p-3">
            <h5 className="mb-3">Recent Admissions</h5>
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

      {/* State Distribution Table */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="school-card p-3">
            <h5 className="mb-3">Student Distribution by State</h5>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>State</th>
                    <th>Number of Students</th>
                    <th>Percentage</th>
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
    </div>
  );
}

export default Statistics;

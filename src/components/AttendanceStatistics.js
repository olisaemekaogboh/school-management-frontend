// // src/components/AttendanceStatistics.js
// import React, { useState, useEffect } from "react";
// import { attendanceAPI, studentAPI } from "../services/api";
// import { toast } from "react-toastify";
// import {
//   FaCalendarAlt,
//   FaChartBar,
//   FaUsers,
//   FaCheckCircle,
//   FaTimesCircle,
//   FaClock,
//   FaUmbrella,
//   FaDownload,
//   FaEye,
//   FaSpinner,
//   FaArrowLeft,
//   FaSchool,
//   FaExclamationTriangle,
//   FaInfoCircle,
//   FaClipboardList,
//   FaFilter,
//   FaSearch,
//   FaFileExcel,
// } from "react-icons/fa";
// import { Line, Bar, Pie } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   ArcElement,
// } from "chart.js";
// import moment from "moment";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   ArcElement,
// );

// function AttendanceStatistics() {
//   const [selectedView, setSelectedView] = useState("daily"); // daily, school, class, student
//   const [selectedClass, setSelectedClass] = useState("");
//   const [selectedStudent, setSelectedStudent] = useState(null);
//   const [session, setSession] = useState("2025/2026");
//   const [term, setTerm] = useState("FIRST");
//   const [students, setStudents] = useState([]);
//   const [classStudents, setClassStudents] = useState([]);
//   const [schoolStats, setSchoolStats] = useState(null);
//   const [classStats, setClassStats] = useState(null);
//   const [studentStats, setStudentStats] = useState(null);
//   const [attendanceHistory, setAttendanceHistory] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [validationErrors, setValidationErrors] = useState([]);
//   const [showDuplicates, setShowDuplicates] = useState(false);

//   // Daily report states
//   const [dailyDate, setDailyDate] = useState(moment().format("YYYY-MM-DD"));
//   const [dailyAttendance, setDailyAttendance] = useState([]);
//   const [dailySummary, setDailySummary] = useState({
//     total: 0,
//     present: 0,
//     absent: 0,
//     late: 0,
//     excused: 0,
//   });
//   const [classFilter, setClassFilter] = useState("");
//   const [armFilter, setArmFilter] = useState("");

//   const [dateRange, setDateRange] = useState({
//     startDate: moment().subtract(30, "days").format("YYYY-MM-DD"),
//     endDate: moment().format("YYYY-MM-DD"),
//   });

//   const sessions = ["2023/2024", "2024/2025", "2025/2026", "2026/2027"];
//   const terms = ["FIRST", "SECOND", "THIRD"];
//   const classes = [
//     "Nursery",
//     "Primary 1",
//     "Primary 2",
//     "Primary 3",
//     "Primary 4",
//     "Primary 5",
//     "Primary 6",
//     "JSS 1",
//     "JSS 2",
//     "JSS 3",
//     "SSS 1",
//     "SSS 2",
//     "SSS 3",
//   ];
//   const arms = ["A", "B", "C"];

//   useEffect(() => {
//     fetchStudents();
//   }, []);

//   useEffect(() => {
//     if (selectedView === "school") {
//       fetchSchoolStatistics();
//     }
//   }, [session, term, selectedView]);

//   useEffect(() => {
//     if (selectedView === "class" && selectedClass) {
//       fetchClassStatistics();
//       fetchClassStudents();
//     }
//   }, [selectedClass, session, term, selectedView]);

//   useEffect(() => {
//     if (selectedView === "student" && selectedStudent) {
//       fetchStudentStatistics();
//       fetchAttendanceHistory();
//     }
//   }, [selectedStudent, session, term, dateRange, selectedView]);

//   useEffect(() => {
//     if (selectedView === "daily") {
//       fetchDailyAttendance();
//     }
//   }, [dailyDate, session, term, selectedView]);

//   // Helper function to safely format percentage values
//   const formatPercentage = (value) => {
//     if (value === null || value === undefined) return "0.0";
//     if (typeof value === "number") return value.toFixed(1);
//     if (typeof value === "string") {
//       const parsed = parseFloat(value);
//       return isNaN(parsed) ? "0.0" : parsed.toFixed(1);
//     }
//     return "0.0";
//   };

//   // Helper function to safely get numeric value
//   const getNumericValue = (value, defaultValue = 0) => {
//     if (value === null || value === undefined) return defaultValue;
//     if (typeof value === "number") return value;
//     if (typeof value === "string") {
//       const parsed = parseFloat(value);
//       return isNaN(parsed) ? defaultValue : parsed;
//     }
//     return defaultValue;
//   };

//   // Check for duplicate attendance records
//   const checkForDuplicates = (attendanceData) => {
//     const dateMap = new Map();
//     const duplicates = [];

//     attendanceData.forEach((record) => {
//       const key = `${record.studentId}_${record.date}`;
//       if (dateMap.has(key)) {
//         duplicates.push({
//           studentId: record.studentId,
//           date: record.date,
//           existingRecord: dateMap.get(key),
//           duplicateRecord: record,
//         });
//       } else {
//         dateMap.set(key, record);
//       }
//     });

//     return duplicates;
//   };

//   // Validate attendance data
//   const validateAttendanceData = (attendanceData) => {
//     const errors = [];
//     const duplicates = checkForDuplicates(attendanceData);

//     if (duplicates.length > 0) {
//       errors.push({
//         type: "duplicate",
//         message: `Found ${duplicates.length} duplicate attendance records`,
//         details: duplicates,
//       });
//     }

//     // Check for future dates
//     const today = moment().startOf("day");
//     attendanceData.forEach((record) => {
//       if (moment(record.date).isAfter(today)) {
//         errors.push({
//           type: "future_date",
//           message: `Attendance record for ${record.date} is in the future`,
//           details: record,
//         });
//       }
//     });

//     setValidationErrors(errors);
//     return errors;
//   };

//   const fetchStudents = async () => {
//     try {
//       const response = await studentAPI.getAllStudents();
//       setStudents(response.data);
//     } catch (error) {
//       console.error("Error fetching students:", error);
//       toast.error("Failed to load students");
//     }
//   };

//   const fetchClassStudents = async () => {
//     if (!selectedClass) return;
//     try {
//       const response = await studentAPI.getStudentsByClass(selectedClass);
//       setClassStudents(response.data);
//     } catch (error) {
//       console.error("Error fetching class students:", error);
//     }
//   };

//   const fetchDailyAttendance = async () => {
//     setLoading(true);
//     try {
//       let response;
//       let allAttendance = [];

//       if (classFilter) {
//         // Fetch attendance for specific class
//         response = await attendanceAPI.getClassAttendance(
//           classFilter,
//           dailyDate,
//           session,
//           term,
//         );
//         allAttendance = response.data;
//       } else {
//         // Fetch attendance for all classes (you might need a school-wide endpoint)
//         // For now, we'll fetch class by class
//         const promises = classes.map(async (className) => {
//           try {
//             const res = await attendanceAPI.getClassAttendance(
//               className,
//               dailyDate,
//               session,
//               term,
//             );
//             return res.data;
//           } catch (err) {
//             return [];
//           }
//         });

//         const results = await Promise.all(promises);
//         allAttendance = results.flat();
//       }

//       // Filter by arm if specified
//       if (armFilter && classFilter) {
//         // Get students in this class and arm
//         const studentsInArm = await studentAPI.getStudentsByClassAndArm(
//           classFilter,
//           armFilter,
//         );
//         const studentIdsInArm = studentsInArm.data.map((s) => s.id);
//         allAttendance = allAttendance.filter((a) =>
//           studentIdsInArm.includes(a.student?.id),
//         );
//       }

//       setDailyAttendance(allAttendance);

//       // Calculate summary
//       const summary = {
//         total: allAttendance.length,
//         present: allAttendance.filter((a) => a.status === "PRESENT").length,
//         absent: allAttendance.filter((a) => a.status === "ABSENT").length,
//         late: allAttendance.filter((a) => a.status === "LATE").length,
//         excused: allAttendance.filter((a) => a.status === "EXCUSED").length,
//       };
//       setDailySummary(summary);
//     } catch (error) {
//       console.error("Error fetching daily attendance:", error);
//       toast.error("Failed to load daily attendance");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchSchoolStatistics = async () => {
//     setLoading(true);
//     setValidationErrors([]);
//     try {
//       const response = await attendanceAPI.getSchoolAttendanceStatistics(
//         session,
//         term,
//       );

//       // Validate the fetched data
//       if (response.data && response.data.attendanceRecords) {
//         validateAttendanceData(response.data.attendanceRecords);
//       }

//       setSchoolStats(response.data);
//     } catch (error) {
//       console.error("Error fetching school statistics:", error);
//       toast.error("Failed to load school statistics");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchClassStatistics = async () => {
//     if (!selectedClass) return;
//     setLoading(true);
//     setValidationErrors([]);
//     try {
//       const response = await attendanceAPI.getClassTermStatistics(
//         selectedClass,
//         session,
//         term,
//       );

//       // Validate the fetched data
//       if (response.data && response.data.attendanceRecords) {
//         validateAttendanceData(response.data.attendanceRecords);
//       }

//       setClassStats(response.data);
//     } catch (error) {
//       console.error("Error fetching class statistics:", error);
//       toast.error("Failed to load class statistics");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchStudentStatistics = async () => {
//     if (!selectedStudent) return;
//     setLoading(true);
//     setValidationErrors([]);
//     try {
//       const response = await attendanceAPI.getStudentTermSummary(
//         selectedStudent.id,
//         session,
//         term,
//       );

//       setStudentStats(response.data);
//     } catch (error) {
//       console.error("Error fetching student statistics:", error);
//       toast.error("Failed to load student statistics");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchAttendanceHistory = async () => {
//     if (!selectedStudent) return;
//     try {
//       const response = await attendanceAPI.getStudentTermAttendance(
//         selectedStudent.id,
//         session,
//         term,
//       );

//       // Validate for duplicates within the student's history
//       const duplicates = checkForDuplicates(response.data);
//       if (duplicates.length > 0) {
//         toast.warning(
//           <div>
//             <FaExclamationTriangle /> Found {duplicates.length} duplicate
//             attendance records for this student
//           </div>,
//         );
//       }

//       setAttendanceHistory(response.data);
//     } catch (error) {
//       console.error("Error fetching attendance history:", error);
//     }
//   };

//   const exportToExcel = () => {
//     if (dailyAttendance.length === 0) {
//       toast.warning("No data to export");
//       return;
//     }

//     // Create CSV content
//     const headers = [
//       "S/N",
//       "Admission No",
//       "Student Name",
//       "Class",
//       "Arm",
//       "Status",
//       "Remarks",
//     ];
//     const csvRows = [];

//     csvRows.push(headers.join(","));

//     dailyAttendance.forEach((record, index) => {
//       const row = [
//         index + 1,
//         record.student?.admissionNumber || "N/A",
//         record.student?.fullName || "N/A",
//         record.student?.studentClass || "N/A",
//         record.student?.classArm || "N/A",
//         record.status || "N/A",
//         record.remarks || "",
//       ];
//       csvRows.push(row.join(","));
//     });

//     const csvContent = csvRows.join("\n");
//     const blob = new Blob([csvContent], { type: "text/csv" });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `attendance_${dailyDate}.csv`;
//     a.click();
//     window.URL.revokeObjectURL(url);

//     toast.success("Attendance report exported successfully");
//   };

//   const getAttendanceRateColor = (rate) => {
//     const numericRate = getNumericValue(rate);
//     if (numericRate >= 90) return "text-success";
//     if (numericRate >= 75) return "text-primary";
//     if (numericRate >= 60) return "text-warning";
//     return "text-danger";
//   };

//   const getStatusBadge = (status) => {
//     const badges = {
//       PRESENT: {
//         class: "bg-success",
//         icon: <FaCheckCircle />,
//         label: "Present",
//       },
//       ABSENT: { class: "bg-danger", icon: <FaTimesCircle />, label: "Absent" },
//       LATE: { class: "bg-warning", icon: <FaClock />, label: "Late" },
//       EXCUSED: { class: "bg-info", icon: <FaUmbrella />, label: "Excused" },
//       HOLIDAY: {
//         class: "bg-secondary",
//         icon: <FaCalendarAlt />,
//         label: "Holiday",
//       },
//     };
//     const badge = badges[status] || badges["ABSENT"];
//     return (
//       <span className={`badge ${badge.class} p-2`}>
//         {badge.icon} {badge.label}
//       </span>
//     );
//   };

//   // Chart data for attendance trends
//   const getTrendChartData = () => {
//     if (!attendanceHistory.length) return null;

//     // Group by date and count unique statuses per day
//     const dailyStatus = {};
//     attendanceHistory.forEach((record) => {
//       if (!dailyStatus[record.date]) {
//         dailyStatus[record.date] = {
//           PRESENT: 0,
//           ABSENT: 0,
//           LATE: 0,
//           EXCUSED: 0,
//         };
//       }
//       dailyStatus[record.date][record.status]++;
//     });

//     const dates = Object.keys(dailyStatus).sort();
//     const presentData = dates.map((date) => dailyStatus[date].PRESENT || 0);
//     const absentData = dates.map((date) => dailyStatus[date].ABSENT || 0);
//     const lateData = dates.map((date) => dailyStatus[date].LATE || 0);

//     return {
//       labels: dates.map((d) => moment(d).format("DD/MM")),
//       datasets: [
//         {
//           label: "Present",
//           data: presentData,
//           borderColor: "#28a745",
//           backgroundColor: "rgba(40, 167, 69, 0.1)",
//           tension: 0.4,
//         },
//         {
//           label: "Absent",
//           data: absentData,
//           borderColor: "#dc3545",
//           backgroundColor: "rgba(220, 53, 69, 0.1)",
//           tension: 0.4,
//         },
//         {
//           label: "Late",
//           data: lateData,
//           borderColor: "#ffc107",
//           backgroundColor: "rgba(255, 193, 7, 0.1)",
//           tension: 0.4,
//         },
//       ],
//     };
//   };

//   // Chart data for status distribution
//   const getStatusChartData = () => {
//     if (!studentStats) return null;

//     return {
//       labels: ["Present", "Absent", "Late", "Excused"],
//       datasets: [
//         {
//           data: [
//             getNumericValue(studentStats.daysPresent),
//             getNumericValue(studentStats.daysAbsent),
//             getNumericValue(studentStats.daysLate) || 0,
//             getNumericValue(studentStats.daysExcused) || 0,
//           ],
//           backgroundColor: ["#28a745", "#dc3545", "#ffc107", "#17a2b8"],
//           borderWidth: 1,
//         },
//       ],
//     };
//   };

//   // Function to check if a date has multiple records
//   const hasDuplicateOnDate = (date) => {
//     const recordsOnDate = attendanceHistory.filter((a) => a.date === date);
//     return recordsOnDate.length > 1;
//   };

//   return (
//     <div className="attendance-statistics container-fluid py-4">
//       <h2 className="mb-4">
//         <FaChartBar className="me-2" /> Attendance Management
//       </h2>

//       {/* View Selector */}
//       <div className="row mb-4">
//         <div className="col-md-12">
//           <div className="btn-group" role="group">
//             <button
//               className={`btn ${selectedView === "daily" ? "btn-success" : "btn-outline-success"}`}
//               onClick={() => setSelectedView("daily")}
//             >
//               <FaClipboardList className="me-2" /> Daily Report
//             </button>
//             <button
//               className={`btn ${selectedView === "school" ? "btn-primary" : "btn-outline-primary"}`}
//               onClick={() => setSelectedView("school")}
//             >
//               <FaSchool className="me-2" /> School Overview
//             </button>
//             <button
//               className={`btn ${selectedView === "class" ? "btn-info" : "btn-outline-info"}`}
//               onClick={() => setSelectedView("class")}
//             >
//               <FaUsers className="me-2" /> Class View
//             </button>
//             <button
//               className={`btn ${selectedView === "student" ? "btn-warning" : "btn-outline-warning"}`}
//               onClick={() => setSelectedView("student")}
//             >
//               <FaEye className="me-2" /> Student View
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Daily Report View */}
//       {selectedView === "daily" && (
//         <>
//           {/* Daily Report Filters */}
//           <div className="row mb-4">
//             <div className="col-md-2">
//               <label className="form-label fw-bold">Date</label>
//               <input
//                 type="date"
//                 className="form-control"
//                 value={dailyDate}
//                 onChange={(e) => setDailyDate(e.target.value)}
//                 max={moment().format("YYYY-MM-DD")}
//               />
//             </div>
//             <div className="col-md-2">
//               <label className="form-label fw-bold">Session</label>
//               <select
//                 className="form-select"
//                 value={session}
//                 onChange={(e) => setSession(e.target.value)}
//               >
//                 {sessions.map((s) => (
//                   <option key={s} value={s}>
//                     {s}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div className="col-md-2">
//               <label className="form-label fw-bold">Term</label>
//               <select
//                 className="form-select"
//                 value={term}
//                 onChange={(e) => setTerm(e.target.value)}
//               >
//                 {terms.map((t) => (
//                   <option key={t} value={t}>
//                     {t}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div className="col-md-2">
//               <label className="form-label fw-bold">Class Filter</label>
//               <select
//                 className="form-select"
//                 value={classFilter}
//                 onChange={(e) => {
//                   setClassFilter(e.target.value);
//                   setArmFilter("");
//                 }}
//               >
//                 <option value="">All Classes</option>
//                 {classes.map((c) => (
//                   <option key={c} value={c}>
//                     {c}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div className="col-md-2">
//               <label className="form-label fw-bold">Arm Filter</label>
//               <select
//                 className="form-select"
//                 value={armFilter}
//                 onChange={(e) => setArmFilter(e.target.value)}
//                 disabled={!classFilter}
//               >
//                 <option value="">All Arms</option>
//                 {arms.map((a) => (
//                   <option key={a} value={a}>
//                     {a}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div className="col-md-2 d-flex align-items-end">
//               <button
//                 className="btn btn-success w-100"
//                 onClick={exportToExcel}
//                 disabled={dailyAttendance.length === 0}
//               >
//                 <FaFileExcel className="me-2" /> Export
//               </button>
//             </div>
//           </div>

//           {/* Daily Summary Cards */}
//           <div className="row mb-4">
//             <div className="col-md-2">
//               <div className="stat-card bg-primary text-white">
//                 <h3>{dailySummary.total}</h3>
//                 <p>Total Students</p>
//               </div>
//             </div>
//             <div className="col-md-2">
//               <div className="stat-card bg-success text-white">
//                 <h3>{dailySummary.present}</h3>
//                 <p>Present</p>
//               </div>
//             </div>
//             <div className="col-md-2">
//               <div className="stat-card bg-danger text-white">
//                 <h3>{dailySummary.absent}</h3>
//                 <p>Absent</p>
//               </div>
//             </div>
//             <div className="col-md-2">
//               <div className="stat-card bg-warning text-dark">
//                 <h3>{dailySummary.late}</h3>
//                 <p>Late</p>
//               </div>
//             </div>
//             <div className="col-md-2">
//               <div className="stat-card bg-info text-white">
//                 <h3>{dailySummary.excused}</h3>
//                 <p>Excused</p>
//               </div>
//             </div>
//             <div className="col-md-2">
//               <div className="stat-card bg-secondary text-white">
//                 <h3>
//                   {dailySummary.total > 0
//                     ? (
//                         (dailySummary.present / dailySummary.total) *
//                         100
//                       ).toFixed(1)
//                     : 0}
//                   %
//                 </h3>
//                 <p>Attendance Rate</p>
//               </div>
//             </div>
//           </div>

//           {/* Daily Attendance Table */}
//           <div className="card">
//             <div className="card-header bg-success text-white">
//               <h5 className="mb-0">
//                 <FaCalendarAlt className="me-2" />
//                 Daily Attendance Report -{" "}
//                 {moment(dailyDate).format("dddd, MMMM Do, YYYY")}
//               </h5>
//             </div>
//             <div className="card-body">
//               {loading ? (
//                 <div className="text-center py-5">
//                   <FaSpinner className="spinner" size={40} />
//                   <p className="mt-3">Loading attendance data...</p>
//                 </div>
//               ) : (
//                 <div className="table-responsive">
//                   <table className="table table-striped table-hover">
//                     <thead>
//                       <tr>
//                         <th>S/N</th>
//                         <th>Admission No</th>
//                         <th>Student Name</th>
//                         <th>Class</th>
//                         <th>Arm</th>
//                         <th>Status</th>
//                         <th>Remarks</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {dailyAttendance.length > 0 ? (
//                         dailyAttendance.map((record, index) => (
//                           <tr key={index}>
//                             <td>{index + 1}</td>
//                             <td>{record.student?.admissionNumber || "N/A"}</td>
//                             <td>
//                               <strong>
//                                 {record.student?.fullName || "N/A"}
//                               </strong>
//                             </td>
//                             <td>{record.student?.studentClass || "N/A"}</td>
//                             <td>{record.student?.classArm || "N/A"}</td>
//                             <td>{getStatusBadge(record.status)}</td>
//                             <td>{record.remarks || "-"}</td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td colSpan="7" className="text-center py-4">
//                             <FaInfoCircle className="me-2" />
//                             No attendance records found for this date
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>
//           </div>
//         </>
//       )}

//       {/* Filters for other views */}
//       {selectedView !== "daily" && (
//         <div className="row mb-4">
//           <div className="col-md-2">
//             <select
//               className="form-select"
//               value={session}
//               onChange={(e) => setSession(e.target.value)}
//             >
//               {sessions.map((s) => (
//                 <option key={s} value={s}>
//                   {s}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div className="col-md-2">
//             <select
//               className="form-select"
//               value={term}
//               onChange={(e) => setTerm(e.target.value)}
//             >
//               {terms.map((t) => (
//                 <option key={t} value={t}>
//                   {t}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {selectedView === "class" && (
//             <div className="col-md-2">
//               <select
//                 className="form-select"
//                 value={selectedClass}
//                 onChange={(e) => setSelectedClass(e.target.value)}
//               >
//                 <option value="">Select Class</option>
//                 {classes.map((c) => (
//                   <option key={c} value={c}>
//                     {c}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           )}

//           {selectedView === "student" && (
//             <>
//               <div className="col-md-3">
//                 <select
//                   className="form-select"
//                   value={selectedStudent?.id || ""}
//                   onChange={(e) => {
//                     const student = students.find(
//                       (s) => s.id === parseInt(e.target.value),
//                     );
//                     setSelectedStudent(student);
//                   }}
//                 >
//                   <option value="">Select Student</option>
//                   {students.map((s) => (
//                     <option key={s.id} value={s.id}>
//                       {s.fullName} - {s.admissionNumber}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div className="col-md-2">
//                 <input
//                   type="date"
//                   className="form-control"
//                   value={dateRange.startDate}
//                   onChange={(e) =>
//                     setDateRange({ ...dateRange, startDate: e.target.value })
//                   }
//                 />
//               </div>
//               <div className="col-md-2">
//                 <input
//                   type="date"
//                   className="form-control"
//                   value={dateRange.endDate}
//                   onChange={(e) =>
//                     setDateRange({ ...dateRange, endDate: e.target.value })
//                   }
//                 />
//               </div>
//             </>
//           )}
//         </div>
//       )}

//       {/* Validation Warnings */}
//       {validationErrors.length > 0 && selectedView !== "daily" && (
//         <div className="alert alert-warning mb-4">
//           <h5 className="alert-heading">
//             <FaExclamationTriangle /> Data Validation Warnings
//           </h5>
//           {validationErrors.map((error, index) => (
//             <div key={index} className="mb-2">
//               <strong>{error.message}</strong>
//               {error.type === "duplicate" && (
//                 <button
//                   className="btn btn-sm btn-outline-warning ms-3"
//                   onClick={() => setShowDuplicates(!showDuplicates)}
//                 >
//                   {showDuplicates ? "Hide" : "Show"} Details
//                 </button>
//               )}
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Duplicate Details */}
//       {showDuplicates &&
//         validationErrors.some((e) => e.type === "duplicate") && (
//           <div className="card mb-4 border-warning">
//             <div className="card-header bg-warning text-dark">
//               <h5 className="mb-0">Duplicate Attendance Records</h5>
//             </div>
//             <div className="card-body">
//               <div className="table-responsive">
//                 <table className="table table-sm table-bordered">
//                   <thead>
//                     <tr>
//                       <th>Student ID</th>
//                       <th>Date</th>
//                       <th>Status 1</th>
//                       <th>Status 2</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {validationErrors
//                       .filter((e) => e.type === "duplicate")
//                       .flatMap((e) => e.details)
//                       .map((dup, index) => (
//                         <tr key={index}>
//                           <td>{dup.studentId}</td>
//                           <td>{moment(dup.date).format("DD/MM/YYYY")}</td>
//                           <td>{dup.existingRecord?.status || "N/A"}</td>
//                           <td>{dup.duplicateRecord?.status || "N/A"}</td>
//                         </tr>
//                       ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>
//         )}

//       {loading && selectedView !== "daily" && (
//         <div className="text-center py-5">
//           <FaSpinner className="spinner" size={40} />
//           <p className="mt-3">Loading attendance statistics...</p>
//         </div>
//       )}

//       {/* School View */}
//       {selectedView === "school" && schoolStats && !loading && (
//         <div className="school-view">
//           <div className="row mb-4">
//             <div className="col-md-3">
//               <div className="stat-card bg-primary text-white">
//                 <h3>{getNumericValue(schoolStats.totalStudents)}</h3>
//                 <p>Total Students</p>
//                 <small>Across all classes</small>
//               </div>
//             </div>
//             <div className="col-md-3">
//               <div className="stat-card bg-success text-white">
//                 <h3>{getNumericValue(schoolStats.totalPresent)}</h3>
//                 <p>Total Present</p>
//                 <small>This term</small>
//               </div>
//             </div>
//             <div className="col-md-3">
//               <div className="stat-card bg-danger text-white">
//                 <h3>{getNumericValue(schoolStats.totalAbsent)}</h3>
//                 <p>Total Absent</p>
//                 <small>This term</small>
//               </div>
//             </div>
//             <div className="col-md-3">
//               <div className="stat-card bg-warning text-dark">
//                 <h3>{formatPercentage(schoolStats.attendanceRate)}%</h3>
//                 <p>Attendance Rate</p>
//                 <div className="progress mt-2" style={{ height: "5px" }}>
//                   <div
//                     className="progress-bar bg-success"
//                     style={{
//                       width: `${getNumericValue(schoolStats.attendanceRate)}%`,
//                     }}
//                   ></div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="row">
//             <div className="col-12">
//               <div className="card">
//                 <div className="card-header bg-info text-white">
//                   <h5 className="mb-0">Class-wise Attendance</h5>
//                 </div>
//                 <div className="card-body">
//                   <div className="table-responsive">
//                     <table className="table table-hover">
//                       <thead>
//                         <tr>
//                           <th>Class</th>
//                           <th>Present</th>
//                           <th>Absent</th>
//                           <th>Late</th>
//                           <th>Excused</th>
//                           <th>Attendance Rate</th>
//                           <th>Performance</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {classes.map((className) => {
//                           const present = getNumericValue(
//                             schoolStats.classStatistics?.[
//                               `${className}_present`
//                             ],
//                           );
//                           const absent = getNumericValue(
//                             schoolStats.classStatistics?.[
//                               `${className}_absent`
//                             ],
//                           );
//                           const late = getNumericValue(
//                             schoolStats.classStatistics?.[`${className}_late`],
//                           );
//                           const excused = getNumericValue(
//                             schoolStats.classStatistics?.[
//                               `${className}_excused`
//                             ],
//                           );
//                           const total = present + absent + late + excused;
//                           const rate = total > 0 ? (present * 100) / total : 0;

//                           return (
//                             <tr key={className}>
//                               <td className="fw-bold">{className}</td>
//                               <td className="text-success">{present}</td>
//                               <td className="text-danger">{absent}</td>
//                               <td className="text-warning">{late}</td>
//                               <td className="text-info">{excused}</td>
//                               <td>
//                                 <span className={getAttendanceRateColor(rate)}>
//                                   {rate.toFixed(1)}%
//                                 </span>
//                               </td>
//                               <td style={{ width: "200px" }}>
//                                 <div className="progress">
//                                   <div
//                                     className={`progress-bar ${
//                                       rate >= 90
//                                         ? "bg-success"
//                                         : rate >= 75
//                                           ? "bg-primary"
//                                           : rate >= 60
//                                             ? "bg-warning"
//                                             : "bg-danger"
//                                     }`}
//                                     style={{ width: `${rate}%` }}
//                                   ></div>
//                                 </div>
//                               </td>
//                             </tr>
//                           );
//                         })}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Class View */}
//       {selectedView === "class" && classStats && !loading && (
//         <div className="class-view">
//           <div className="row mb-4">
//             <div className="col-md-3">
//               <div className="stat-card bg-primary text-white">
//                 <h3>{getNumericValue(classStats.totalStudents)}</h3>
//                 <p>Students in {selectedClass}</p>
//               </div>
//             </div>
//             <div className="col-md-3">
//               <div className="stat-card bg-success text-white">
//                 <h3>{getNumericValue(classStats.totalPresent)}</h3>
//                 <p>Total Present</p>
//               </div>
//             </div>
//             <div className="col-md-3">
//               <div className="stat-card bg-danger text-white">
//                 <h3>{getNumericValue(classStats.totalAbsent)}</h3>
//                 <p>Total Absent</p>
//               </div>
//             </div>
//             <div className="col-md-3">
//               <div className="stat-card bg-warning text-dark">
//                 <h3>{formatPercentage(classStats.averageAttendance)}%</h3>
//                 <p>Average Attendance</p>
//               </div>
//             </div>
//           </div>

//           <div className="card">
//             <div className="card-header bg-success text-white">
//               <h5 className="mb-0">
//                 Student Attendance Details - {selectedClass}
//               </h5>
//             </div>
//             <div className="card-body">
//               <div className="table-responsive">
//                 <table className="table table-striped table-hover">
//                   <thead>
//                     <tr>
//                       <th>Admission No</th>
//                       <th>Student Name</th>
//                       <th>Present</th>
//                       <th>Absent</th>
//                       <th>Late</th>
//                       <th>Excused</th>
//                       <th>Attendance %</th>
//                       <th>Status</th>
//                       <th>Action</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {classStats.studentAttendance?.map((student, index) => (
//                       <tr key={index}>
//                         <td>{student.admissionNumber}</td>
//                         <td>{student.studentName}</td>
//                         <td className="text-success fw-bold">
//                           {getNumericValue(student.present)}
//                         </td>
//                         <td className="text-danger fw-bold">
//                           {getNumericValue(student.absent)}
//                         </td>
//                         <td className="text-warning fw-bold">
//                           {getNumericValue(student.late) || 0}
//                         </td>
//                         <td className="text-info fw-bold">
//                           {getNumericValue(student.excused) || 0}
//                         </td>
//                         <td>
//                           <span
//                             className={getAttendanceRateColor(
//                               student.percentage,
//                             )}
//                           >
//                             {formatPercentage(student.percentage)}%
//                           </span>
//                         </td>
//                         <td>
//                           {getNumericValue(student.percentage) >= 90 ? (
//                             <span className="badge bg-success">Excellent</span>
//                           ) : getNumericValue(student.percentage) >= 75 ? (
//                             <span className="badge bg-primary">Good</span>
//                           ) : getNumericValue(student.percentage) >= 60 ? (
//                             <span className="badge bg-warning">Fair</span>
//                           ) : (
//                             <span className="badge bg-danger">Poor</span>
//                           )}
//                         </td>
//                         <td>
//                           <button
//                             className="btn btn-sm btn-info"
//                             onClick={() => {
//                               const studentInfo = students.find(
//                                 (s) => s.id === student.studentId,
//                               );
//                               if (studentInfo) {
//                                 setSelectedStudent(studentInfo);
//                                 setSelectedView("student");
//                               } else {
//                                 toast.error("Student information not found");
//                               }
//                             }}
//                           >
//                             <FaEye /> View
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Student View */}
//       {selectedView === "student" && selectedStudent && !loading && (
//         <div className="student-view">
//           {/* Student Info Header */}
//           <div className="card mb-4">
//             <div className="card-header bg-primary text-white">
//               <h5 className="mb-0">
//                 <FaInfoCircle className="me-2" /> Student Information
//               </h5>
//             </div>
//             <div className="card-body">
//               <div className="row">
//                 <div className="col-md-6">
//                   <p>
//                     <strong>Name:</strong> {selectedStudent.fullName}
//                   </p>
//                   <p>
//                     <strong>Admission:</strong>{" "}
//                     {selectedStudent.admissionNumber}
//                   </p>
//                   <p>
//                     <strong>Class:</strong> {selectedStudent.studentClass}{" "}
//                     {selectedStudent.classArm}
//                   </p>
//                 </div>
//                 <div className="col-md-6">
//                   <p>
//                     <strong>Session:</strong> {session}
//                   </p>
//                   <p>
//                     <strong>Term:</strong> {term}
//                   </p>
//                   <p>
//                     <strong>Date Range:</strong>{" "}
//                     {moment(dateRange.startDate).format("DD/MM/YYYY")} -{" "}
//                     {moment(dateRange.endDate).format("DD/MM/YYYY")}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {studentStats && (
//             <>
//               {/* Summary Cards */}
//               <div className="row mb-4">
//                 <div className="col-md-3">
//                   <div className="stat-card bg-primary text-white">
//                     <h3>{getNumericValue(studentStats.totalSchoolDays)}</h3>
//                     <p>School Days</p>
//                   </div>
//                 </div>
//                 <div className="col-md-3">
//                   <div className="stat-card bg-success text-white">
//                     <h3>{getNumericValue(studentStats.daysPresent)}</h3>
//                     <p>Days Present</p>
//                   </div>
//                 </div>
//                 <div className="col-md-3">
//                   <div className="stat-card bg-danger text-white">
//                     <h3>{getNumericValue(studentStats.daysAbsent)}</h3>
//                     <p>Days Absent</p>
//                   </div>
//                 </div>
//                 <div className="col-md-3">
//                   <div className="stat-card bg-warning text-dark">
//                     <h3>
//                       {formatPercentage(studentStats.attendancePercentage)}%
//                     </h3>
//                     <p>Attendance Rate</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Charts */}
//               <div className="row mb-4">
//                 <div className="col-md-6">
//                   <div className="card h-100">
//                     <div className="card-header bg-info text-white">
//                       <h5 className="mb-0">Attendance Distribution</h5>
//                     </div>
//                     <div className="card-body">
//                       {getStatusChartData() && (
//                         <Pie
//                           data={getStatusChartData()}
//                           options={{ responsive: true }}
//                         />
//                       )}
//                     </div>
//                   </div>
//                 </div>
//                 <div className="col-md-6">
//                   <div className="card h-100">
//                     <div className="card-header bg-success text-white">
//                       <h5 className="mb-0">Attendance Trend</h5>
//                     </div>
//                     <div className="card-body">
//                       {getTrendChartData() && (
//                         <Line
//                           data={getTrendChartData()}
//                           options={{
//                             responsive: true,
//                             scales: {
//                               y: {
//                                 beginAtZero: true,
//                                 max:
//                                   Math.max(
//                                     ...(getTrendChartData()?.datasets[0]
//                                       ?.data || [1]),
//                                     ...(getTrendChartData()?.datasets[1]
//                                       ?.data || [1]),
//                                     ...(getTrendChartData()?.datasets[2]
//                                       ?.data || [1]),
//                                   ) + 1,
//                               },
//                             },
//                           }}
//                         />
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Attendance History */}
//               <div className="card">
//                 <div className="card-header bg-warning text-dark">
//                   <h5 className="mb-0">Attendance History</h5>
//                 </div>
//                 <div className="card-body">
//                   <div className="table-responsive">
//                     <table className="table table-bordered table-hover">
//                       <thead>
//                         <tr>
//                           <th>Date</th>
//                           <th>Day</th>
//                           <th>Status</th>
//                           <th>Remarks</th>
//                           <th>Validation</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {attendanceHistory
//                           .filter((a) =>
//                             moment(a.date).isBetween(
//                               dateRange.startDate,
//                               dateRange.endDate,
//                               "days",
//                               "[]",
//                             ),
//                           )
//                           .sort((a, b) => new Date(b.date) - new Date(a.date))
//                           .map((record, index, array) => {
//                             const hasDuplicate =
//                               array.filter((r) => r.date === record.date)
//                                 .length > 1;

//                             return (
//                               <tr
//                                 key={index}
//                                 className={hasDuplicate ? "table-warning" : ""}
//                               >
//                                 <td>
//                                   {moment(record.date).format("DD/MM/YYYY")}
//                                 </td>
//                                 <td>{moment(record.date).format("dddd")}</td>
//                                 <td>{getStatusBadge(record.status)}</td>
//                                 <td>{record.remarks || "-"}</td>
//                                 <td>
//                                   {hasDuplicate ? (
//                                     <span className="badge bg-warning text-dark">
//                                       <FaExclamationTriangle /> Duplicate
//                                     </span>
//                                   ) : (
//                                     <span className="badge bg-success">
//                                       <FaCheckCircle /> Valid
//                                     </span>
//                                   )}
//                                 </td>
//                               </tr>
//                             );
//                           })}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// export default AttendanceStatistics;

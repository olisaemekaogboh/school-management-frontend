// // components/AttendanceManager.js
// import React, { useState, useEffect } from "react";
// import attendanceService from "../services/attendanceService";
// import { studentAPI } from "../services/api";
// import { toast } from "react-toastify";
// import {
//   FaCheckCircle,
//   FaTimesCircle,
//   FaClock,
//   FaExclamationTriangle,
//   FaCalendarAlt,
//   FaUsers,
//   FaChartBar,
//   FaSpinner,
//   FaSave,
//   FaSearch,
//   FaEye,
//   FaInfoCircle,
// } from "react-icons/fa";
// import moment from "moment";

// function AttendanceManager() {
//   const [loading, setLoading] = useState(false);
//   const [students, setStudents] = useState([]);
//   const [selectedClass, setSelectedClass] = useState("");
//   const [selectedArm, setSelectedArm] = useState("");
//   const [selectedDate, setSelectedDate] = useState(
//     moment().format("YYYY-MM-DD"),
//   );
//   const [session, setSession] = useState("2025/2026");
//   const [term, setTerm] = useState("FIRST");
//   const [attendanceData, setAttendanceData] = useState({});
//   const [classStats, setClassStats] = useState(null);
//   const [viewMode, setViewMode] = useState("mark"); // 'mark', 'stats', 'report'
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedStudent, setSelectedStudent] = useState(null);
//   const [studentAttendance, setStudentAttendance] = useState([]);
//   const [studentSummary, setStudentSummary] = useState(null);

//   const classes = [
//     { name: "Nursery", arms: ["A", "B"] },
//     { name: "Primary 1", arms: ["A", "B", "C"] },
//     { name: "Primary 2", arms: ["A", "B"] },
//     { name: "Primary 3", arms: ["A", "B"] },
//     { name: "Primary 4", arms: ["A", "B"] },
//     { name: "Primary 5", arms: ["A", "B"] },
//     { name: "Primary 6", arms: ["A", "B"] },
//     { name: "JSS 1", arms: ["A", "B", "C"] },
//     { name: "JSS 2", arms: ["A", "B"] },
//     { name: "JSS 3", arms: ["A", "B"] },
//     { name: "SSS 1", arms: ["A", "B"] },
//     { name: "SSS 2", arms: ["A", "B"] },
//     { name: "SSS 3", arms: ["A", "B"] },
//   ];

//   const terms = [
//     { value: "FIRST", label: "First Term" },
//     { value: "SECOND", label: "Second Term" },
//     { value: "THIRD", label: "Third Term" },
//   ];

//   const sessions = ["2023/2024", "2024/2025", "2025/2026", "2026/2027"];

//   useEffect(() => {
//     if (selectedClass && selectedArm) {
//       if (viewMode === "mark" || viewMode === "report") {
//         fetchStudents();
//       } else if (viewMode === "stats") {
//         fetchClassStatistics();
//       }
//     }
//   }, [selectedClass, selectedArm, selectedDate, session, term, viewMode]);

//   useEffect(() => {
//     if (selectedStudent) {
//       fetchStudentAttendance();
//     }
//   }, [selectedStudent, session, term]);

//   const fetchStudents = async () => {
//     if (!selectedClass || !selectedArm) return;

//     setLoading(true);
//     try {
//       const response = await studentAPI.getStudentsByClassAndArm(
//         selectedClass,
//         selectedArm,
//       );
//       setStudents(response.data);

//       // Initialize attendance data
//       const attendanceMap = {};
//       response.data.forEach((student) => {
//         attendanceMap[student.id] = null;
//       });
//       setAttendanceData(attendanceMap);

//       // Fetch existing attendance for the date
//       await fetchExistingAttendance(response.data);
//     } catch (error) {
//       console.error("Error fetching students:", error);
//       toast.error("Failed to load students");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchExistingAttendance = async (studentList) => {
//     try {
//       for (const student of studentList) {
//         const response = await attendanceService.getStudentAttendance(
//           student.id,
//           selectedDate,
//           session,
//           term,
//         );
//         if (response) {
//           setAttendanceData((prev) => ({
//             ...prev,
//             [student.id]: response.status,
//           }));
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching existing attendance:", error);
//     }
//   };

//   const fetchClassStatistics = async () => {
//     if (!selectedClass || !selectedArm) return;

//     setLoading(true);
//     try {
//       const stats = await attendanceService.getClassStatistics(
//         selectedClass,
//         selectedArm,
//         session,
//         term,
//       );
//       setClassStats(stats);
//     } catch (error) {
//       console.error("Error fetching class statistics:", error);
//       toast.error("Failed to load class statistics");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchStudentAttendance = async () => {
//     if (!selectedStudent) return;

//     setLoading(true);
//     try {
//       const [attendance, summary] = await Promise.all([
//         attendanceService.getStudentTermAttendance(
//           selectedStudent.id,
//           session,
//           term,
//         ),
//         attendanceService.getStudentTermSummary(
//           selectedStudent.id,
//           session,
//           term,
//         ),
//       ]);
//       setStudentAttendance(attendance);
//       setStudentSummary(summary);
//     } catch (error) {
//       console.error("Error fetching student attendance:", error);
//       toast.error("Failed to load student attendance");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleMarkAll = async (status) => {
//     if (!selectedClass || !selectedArm || students.length === 0) {
//       toast.warning("Please select a class first");
//       return;
//     }

//     const studentIds = students.map((s) => s.id);

//     setLoading(true);
//     try {
//       await attendanceService.markBulkAttendance(
//         studentIds,
//         selectedDate,
//         session,
//         term,
//         status,
//       );

//       toast.success(`All students marked as ${status}`);

//       // Update local state
//       const newAttendanceData = {};
//       studentIds.forEach((id) => {
//         newAttendanceData[id] = status;
//       });
//       setAttendanceData(newAttendanceData);
//     } catch (error) {
//       console.error("Error marking bulk attendance:", error);
//       toast.error("Failed to mark attendance");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleMarkStudent = async (studentId, status) => {
//     setLoading(true);
//     try {
//       await attendanceService.markAttendance(
//         studentId,
//         selectedDate,
//         session,
//         term,
//         status,
//       );

//       toast.success(`Student marked as ${status}`);

//       // Update local state
//       setAttendanceData((prev) => ({
//         ...prev,
//         [studentId]: status,
//       }));
//     } catch (error) {
//       console.error("Error marking attendance:", error);
//       toast.error("Failed to mark attendance");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusBadge = (status) => {
//     if (!status) return null;

//     const badges = {
//       PRESENT: {
//         class: "bg-success",
//         icon: <FaCheckCircle />,
//         text: "Present",
//       },
//       ABSENT: { class: "bg-danger", icon: <FaTimesCircle />, text: "Absent" },
//       LATE: { class: "bg-warning", icon: <FaClock />, text: "Late" },
//       EXCUSED: {
//         class: "bg-info",
//         icon: <FaExclamationTriangle />,
//         text: "Excused",
//       },
//       HOLIDAY: {
//         class: "bg-secondary",
//         icon: <FaCalendarAlt />,
//         text: "Holiday",
//       },
//     };
//     return badges[status] || badges.PRESENT;
//   };

//   const getStatusColor = (status) => {
//     const colors = {
//       PRESENT: "success",
//       ABSENT: "danger",
//       LATE: "warning",
//       EXCUSED: "info",
//       HOLIDAY: "secondary",
//     };
//     return colors[status] || "secondary";
//   };

//   const filteredStudents = students.filter((student) => {
//     const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
//     const admission = student.admissionNumber?.toLowerCase() || "";
//     const term = searchTerm.toLowerCase();
//     return fullName.includes(term) || admission.includes(term);
//   });

//   return (
//     <div className="attendance-manager container-fluid py-4">
//       <h2 className="mb-4">
//         <FaCalendarAlt className="me-2" /> Attendance Management
//       </h2>

//       {/* Control Panel */}
//       <div className="card mb-4">
//         <div className="card-header bg-primary text-white">
//           <h5 className="mb-0">Attendance Controls</h5>
//         </div>
//         <div className="card-body">
//           <div className="row">
//             <div className="col-md-2 mb-3">
//               <label className="form-label">View Mode</label>
//               <select
//                 className="form-select"
//                 value={viewMode}
//                 onChange={(e) => setViewMode(e.target.value)}
//               >
//                 <option value="mark">Mark Attendance</option>
//                 <option value="stats">Class Statistics</option>
//                 <option value="report">Student Report</option>
//               </select>
//             </div>
//             <div className="col-md-2 mb-3">
//               <label className="form-label">Class</label>
//               <select
//                 className="form-select"
//                 value={selectedClass}
//                 onChange={(e) => {
//                   setSelectedClass(e.target.value);
//                   setSelectedArm("");
//                   setSelectedStudent(null);
//                 }}
//               >
//                 <option value="">Select Class</option>
//                 {classes.map((c) => (
//                   <option key={c.name} value={c.name}>
//                     {c.name}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div className="col-md-2 mb-3">
//               <label className="form-label">Arm</label>
//               <select
//                 className="form-select"
//                 value={selectedArm}
//                 onChange={(e) => {
//                   setSelectedArm(e.target.value);
//                   setSelectedStudent(null);
//                 }}
//                 disabled={!selectedClass}
//               >
//                 <option value="">Select Arm</option>
//                 {selectedClass &&
//                   classes
//                     .find((c) => c.name === selectedClass)
//                     ?.arms.map((arm) => (
//                       <option key={arm} value={arm}>
//                         Arm {arm}
//                       </option>
//                     ))}
//               </select>
//             </div>
//             {(viewMode === "mark" || viewMode === "report") && (
//               <div className="col-md-2 mb-3">
//                 <label className="form-label">Date</label>
//                 <input
//                   type="date"
//                   className="form-control"
//                   value={selectedDate}
//                   onChange={(e) => setSelectedDate(e.target.value)}
//                 />
//               </div>
//             )}
//             <div className="col-md-2 mb-3">
//               <label className="form-label">Session</label>
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
//             <div className="col-md-2 mb-3">
//               <label className="form-label">Term</label>
//               <select
//                 className="form-select"
//                 value={term}
//                 onChange={(e) => setTerm(e.target.value)}
//               >
//                 {terms.map((t) => (
//                   <option key={t.value} value={t.value}>
//                     {t.label}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           {viewMode === "mark" && selectedClass && selectedArm && (
//             <div className="mt-3">
//               <label className="form-label me-3">Quick Actions:</label>
//               <button
//                 className="btn btn-success me-2"
//                 onClick={() => handleMarkAll("PRESENT")}
//                 disabled={loading}
//               >
//                 <FaCheckCircle className="me-1" /> Mark All Present
//               </button>
//               <button
//                 className="btn btn-danger me-2"
//                 onClick={() => handleMarkAll("ABSENT")}
//                 disabled={loading}
//               >
//                 <FaTimesCircle className="me-1" /> Mark All Absent
//               </button>
//               <button
//                 className="btn btn-warning me-2"
//                 onClick={() => handleMarkAll("LATE")}
//                 disabled={loading}
//               >
//                 <FaClock className="me-1" /> Mark All Late
//               </button>
//               <button
//                 className="btn btn-info me-2"
//                 onClick={() => handleMarkAll("EXCUSED")}
//                 disabled={loading}
//               >
//                 <FaExclamationTriangle className="me-1" /> Mark All Excused
//               </button>
//             </div>
//           )}

//           {viewMode === "report" && selectedClass && selectedArm && (
//             <div className="mt-3">
//               <div className="input-group">
//                 <span className="input-group-text">
//                   <FaSearch />
//                 </span>
//                 <input
//                   type="text"
//                   className="form-control"
//                   placeholder="Search students by name or admission number..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Loading Spinner */}
//       {loading && (
//         <div className="text-center py-5">
//           <FaSpinner className="spinner" size={40} />
//           <p className="mt-3">Loading...</p>
//         </div>
//       )}

//       {/* Statistics View */}
//       {!loading && viewMode === "stats" && classStats && (
//         <div className="card">
//           <div className="card-header bg-info text-white">
//             <h5 className="mb-0">
//               <FaChartBar className="me-2" />
//               Class Statistics: {classStats.className} - Arm {classStats.arm}
//             </h5>
//           </div>
//           <div className="card-body">
//             <div className="row mb-4">
//               <div className="col-md-3">
//                 <div className="border p-3 rounded text-center bg-primary text-white">
//                   <h3>{classStats.totalStudents}</h3>
//                   <small>Total Students</small>
//                 </div>
//               </div>
//               <div className="col-md-3">
//                 <div className="border p-3 rounded text-center bg-success text-white">
//                   <h3>{classStats.totalPresent}</h3>
//                   <small>Total Present</small>
//                 </div>
//               </div>
//               <div className="col-md-3">
//                 <div className="border p-3 rounded text-center bg-danger text-white">
//                   <h3>{classStats.totalAbsent}</h3>
//                   <small>Total Absent</small>
//                 </div>
//               </div>
//               <div className="col-md-3">
//                 <div className="border p-3 rounded text-center bg-warning text-dark">
//                   <h3>{classStats.averageAttendance?.toFixed(1)}%</h3>
//                   <small>Average Attendance</small>
//                 </div>
//               </div>
//             </div>

//             <h6 className="mb-3">Student Breakdown</h6>
//             <div className="table-responsive">
//               <table className="table table-striped table-hover">
//                 <thead>
//                   <tr>
//                     <th>Student</th>
//                     <th>Admission No.</th>
//                     <th className="text-center">Present</th>
//                     <th className="text-center">Absent</th>
//                     <th className="text-center">Late</th>
//                     <th className="text-center">Excused</th>
//                     <th className="text-center">Percentage</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {classStats.studentAttendance?.map((student) => (
//                     <tr key={student.studentId}>
//                       <td>{student.studentName}</td>
//                       <td>{student.admissionNumber}</td>
//                       <td className="text-center text-success">
//                         {student.present}
//                       </td>
//                       <td className="text-center text-danger">
//                         {student.absent}
//                       </td>
//                       <td className="text-center text-warning">
//                         {student.late}
//                       </td>
//                       <td className="text-center text-info">
//                         {student.excused}
//                       </td>
//                       <td className="text-center">
//                         <span
//                           className={`badge ${
//                             student.percentage >= 75
//                               ? "bg-success"
//                               : student.percentage >= 50
//                                 ? "bg-warning"
//                                 : "bg-danger"
//                           }`}
//                         >
//                           {student.percentage?.toFixed(1)}%
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Student Report View */}
//       {!loading && viewMode === "report" && (
//         <div className="row">
//           {/* Student List */}
//           <div className="col-md-4">
//             <div className="card">
//               <div className="card-header bg-primary text-white">
//                 <h5 className="mb-0">
//                   <FaUsers className="me-2" /> Students in {selectedClass} - Arm{" "}
//                   {selectedArm}
//                 </h5>
//               </div>
//               <div className="card-body p-0">
//                 <div
//                   className="list-group list-group-flush"
//                   style={{ maxHeight: "500px", overflowY: "auto" }}
//                 >
//                   {filteredStudents.map((student) => (
//                     <button
//                       key={student.id}
//                       className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
//                         selectedStudent?.id === student.id ? "active" : ""
//                       }`}
//                       onClick={() => setSelectedStudent(student)}
//                     >
//                       <div>
//                         <div className="fw-bold">
//                           {student.firstName} {student.lastName}
//                         </div>
//                         <small className="text-muted">
//                           {student.admissionNumber}
//                         </small>
//                       </div>
//                       <FaEye />
//                     </button>
//                   ))}
//                   {filteredStudents.length === 0 && (
//                     <div className="list-group-item text-center text-muted">
//                       No students found
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Student Attendance Details */}
//           <div className="col-md-8">
//             {selectedStudent ? (
//               <div className="card">
//                 <div className="card-header bg-info text-white">
//                   <h5 className="mb-0">
//                     Attendance Report: {selectedStudent.firstName}{" "}
//                     {selectedStudent.lastName}
//                   </h5>
//                 </div>
//                 <div className="card-body">
//                   {/* Summary Cards */}
//                   {studentSummary && (
//                     <div className="row mb-4">
//                       <div className="col-md-3">
//                         <div className="border p-2 rounded text-center bg-primary text-white">
//                           <h5>{studentSummary.totalSchoolDays}</h5>
//                           <small>School Days</small>
//                         </div>
//                       </div>
//                       <div className="col-md-3">
//                         <div className="border p-2 rounded text-center bg-success text-white">
//                           <h5>{studentSummary.daysPresent}</h5>
//                           <small>Present</small>
//                         </div>
//                       </div>
//                       <div className="col-md-3">
//                         <div className="border p-2 rounded text-center bg-danger text-white">
//                           <h5>{studentSummary.daysAbsent}</h5>
//                           <small>Absent</small>
//                         </div>
//                       </div>
//                       <div className="col-md-3">
//                         <div className="border p-2 rounded text-center bg-warning text-dark">
//                           <h5>
//                             {studentSummary.attendancePercentage?.toFixed(1)}%
//                           </h5>
//                           <small>Percentage</small>
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {/* Attendance Records */}
//                   <h6 className="mb-3">
//                     Attendance Records for{" "}
//                     {terms.find((t) => t.value === term)?.label}
//                   </h6>
//                   <div className="table-responsive">
//                     <table className="table table-striped">
//                       <thead>
//                         <tr>
//                           <th>Date</th>
//                           <th>Status</th>
//                           <th>Remarks</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {studentAttendance.map((record) => (
//                           <tr key={record.id}>
//                             <td>{moment(record.date).format("DD/MM/YYYY")}</td>
//                             <td>
//                               <span
//                                 className={`badge bg-${getStatusColor(record.status)}`}
//                               >
//                                 {record.status}
//                               </span>
//                             </td>
//                             <td>{record.remarks || "-"}</td>
//                           </tr>
//                         ))}
//                         {studentAttendance.length === 0 && (
//                           <tr>
//                             <td colSpan="3" className="text-center text-muted">
//                               No attendance records found
//                             </td>
//                           </tr>
//                         )}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               <div className="alert alert-info">
//                 <FaInfoCircle className="me-2" />
//                 Select a student from the list to view their attendance report
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Attendance Marking View */}
//       {!loading && viewMode === "mark" && students.length > 0 && (
//         <div className="card">
//           <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
//             <h5 className="mb-0">
//               <FaUsers className="me-2" />
//               {selectedClass} - Arm {selectedArm} -{" "}
//               {moment(selectedDate).format("DD/MM/YYYY")}
//             </h5>
//             <span className="badge bg-light text-dark">
//               {
//                 Object.values(attendanceData).filter((s) => s === "PRESENT")
//                   .length
//               }{" "}
//               Present / {students.length} Total
//             </span>
//           </div>
//           <div className="card-body">
//             <div className="table-responsive">
//               <table className="table table-striped table-hover">
//                 <thead>
//                   <tr>
//                     <th>#</th>
//                     <th>Student Name</th>
//                     <th>Admission No.</th>
//                     <th className="text-center">Current Status</th>
//                     <th className="text-center">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {students.map((student, index) => {
//                     const status = attendanceData[student.id];
//                     const badge = getStatusBadge(status);

//                     return (
//                       <tr key={student.id}>
//                         <td>{index + 1}</td>
//                         <td>
//                           {student.firstName} {student.lastName}
//                         </td>
//                         <td>{student.admissionNumber}</td>
//                         <td className="text-center">
//                           {status ? (
//                             <span className={`badge ${badge?.class}`}>
//                               {badge?.icon} {badge?.text}
//                             </span>
//                           ) : (
//                             <span className="badge bg-secondary">
//                               <FaClock /> Not Marked
//                             </span>
//                           )}
//                         </td>
//                         <td className="text-center">
//                           <div className="btn-group btn-group-sm">
//                             <button
//                               className={`btn btn-outline-success ${status === "PRESENT" ? "active" : ""}`}
//                               onClick={() =>
//                                 handleMarkStudent(student.id, "PRESENT")
//                               }
//                               disabled={loading}
//                               title="Mark Present"
//                             >
//                               <FaCheckCircle />
//                             </button>
//                             <button
//                               className={`btn btn-outline-danger ${status === "ABSENT" ? "active" : ""}`}
//                               onClick={() =>
//                                 handleMarkStudent(student.id, "ABSENT")
//                               }
//                               disabled={loading}
//                               title="Mark Absent"
//                             >
//                               <FaTimesCircle />
//                             </button>
//                             <button
//                               className={`btn btn-outline-warning ${status === "LATE" ? "active" : ""}`}
//                               onClick={() =>
//                                 handleMarkStudent(student.id, "LATE")
//                               }
//                               disabled={loading}
//                               title="Mark Late"
//                             >
//                               <FaClock />
//                             </button>
//                             <button
//                               className={`btn btn-outline-info ${status === "EXCUSED" ? "active" : ""}`}
//                               onClick={() =>
//                                 handleMarkStudent(student.id, "EXCUSED")
//                               }
//                               disabled={loading}
//                               title="Mark Excused"
//                             >
//                               <FaExclamationTriangle />
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* No Selection Message */}
//       {!loading && !selectedClass && (
//         <div className="alert alert-info">
//           <FaInfoCircle className="me-2" /> Please select a class and arm to
//           view attendance.
//         </div>
//       )}
//     </div>
//   );
// }

// export default AttendanceManager;

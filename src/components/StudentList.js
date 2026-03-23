// // src/components/StudentList.js
// import React, { useEffect, useState } from "react";
// import { Link, Navigate } from "react-router-dom";
// import { studentAPI } from "../services/api";
// import { useAuth } from "../contexts/AuthContext";
// import { useLanguage } from "../context/LanguageContext";
// import { useDarkMode } from "../context/DarkModeContext";
// import { FaEdit, FaTrash, FaEye, FaPlus, FaSpinner } from "react-icons/fa";
// import { toast } from "react-toastify";

// function StudentList() {
//   const { user } = useAuth();
//   const { t } = useLanguage();
//   const { darkMode } = useDarkMode();

//   const [students, setStudents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentPage, setCurrentPage] = useState(0);
//   const [totalPages, setTotalPages] = useState(0);
//   const [pageSize] = useState(10);
//   const [sortBy, setSortBy] = useState("id");
//   const [sortDir, setSortDir] = useState("asc");

//   // Check if user is admin, if not redirect
//   if (user?.role !== "ADMIN") {
//     return <Navigate to="/dashboard" replace />;
//   }

//   useEffect(() => {
//     fetchStudents();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [currentPage, sortBy, sortDir]);

//   const fetchStudents = async () => {
//     setLoading(true);
//     try {
//       const response = await studentAPI.getPaginatedStudents(
//         currentPage,
//         pageSize,
//         sortBy,
//         sortDir
//       );

//       setStudents(response.data?.content || []);
//       setTotalPages(response.data?.totalPages || 0);
//     } catch (error) {
//       console.error("Error fetching students:", error);
//       toast.error(t?.studentList?.loadFailed || "Failed to load students");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (id, name) => {
//     const confirmMessage = t?.studentList?.confirmDelete
//       ? t.studentList.confirmDelete.replace("{name}", name)
//       : `Are you sure you want to delete ${name}?`;

//     if (!window.confirm(confirmMessage)) return;

//     try {
//       await studentAPI.deleteStudent(id);
//       toast.success(t?.studentList?.deleteSuccess || "Student deleted successfully");
//       fetchStudents();
//     } catch (error) {
//       console.error("Error deleting student:", error);
//       toast.error(t?.studentList?.deleteFailed || "Failed to delete student");
//     }
//   };

//   const handleSort = (column) => {
//     if (sortBy === column) {
//       setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
//     } else {
//       setSortBy(column);
//       setSortDir("asc");
//     }
//   };

//   const getStatusBadgeClass = (status) => {
//     switch (status) {
//       case "ACTIVE":
//         return "bg-success";
//       case "GRADUATED":
//         return "bg-primary";
//       case "TRANSFERRED":
//         return "bg-info";
//       case "SUSPENDED":
//         return "bg-warning";
//       case "WITHDRAWN":
//         return "bg-danger";
//       default:
//         return "bg-secondary";
//     }
//   };

//   if (loading && students.length === 0) {
//     return (
//       <div className="spinner-container text-center py-5">
//         <FaSpinner className="spin" size={40} />
//         <p className="mt-3">{t?.common?.loading || "Loading..."}</p>
//       </div>
//     );
//   }

//   return (
//     <div className="student-list container-fluid py-4">
//       <div className="d-flex justify-content-between align-items-center mb-4">
//         <h2>{t?.studentList?.title || "Student Management"}</h2>
//         <Link to="/students/new" className="btn btn-nigerian">
//           <FaPlus className="me-2" />{" "}
//           {t?.studentList?.registerNew || "Register New Student"}
//         </Link>
//       </div>

//       <div className="table-responsive">
//         <table className="table table-striped table-hover">
//           <thead>
//             <tr>
//               <th
//                 onClick={() => handleSort("id")}
//                 style={{ cursor: "pointer" }}
//               >
//                 ID {sortBy === "id" && (sortDir === "asc" ? "↑" : "↓")}
//               </th>
//               <th
//                 onClick={() => handleSort("firstName")}
//                 style={{ cursor: "pointer" }}
//               >
//                 {t?.studentList?.name || "Name"}{" "}
//                 {sortBy === "firstName" && (sortDir === "asc" ? "↑" : "↓")}
//               </th>
//               <th>{t?.studentList?.admissionNo || "Admission No."}</th>
//               <th>{t?.studentList?.class || "Class"}</th>
//               <th>{t?.studentList?.parentName || "Parent Name"}</th>
//               <th>{t?.studentList?.parentPhone || "Parent Phone"}</th>
//               <th>{t?.studentList?.status || "Status"}</th>
//               <th>{t?.studentList?.actions || "Actions"}</th>
//              </thead>

//           <tbody>
//             {students.map((student) => (
//               <tr key={student.id}>
//                 <td>{student.id} </td>
//                 <td>
//                   {student.fullName ||
//                     `${student.firstName || ""} ${student.lastName || ""}`.trim()}
//                  </td>
//                 <td>{student.admissionNumber} </td>
//                 <td>
//                   {student.studentClass} {student.classArm}
//                  </td>
//                 <td>{student.parentName} </td>
//                 <td>{student.parentPhone} </td>
//                 <td>
//                   <span
//                     className={`badge ${getStatusBadgeClass(student.status)}`}
//                   >
//                     {student.status}
//                   </span>
//                  </td>
//                 <td>
//                   <Link
//                     to={`/students/view/${student.id}`}
//                     className="btn btn-sm btn-info me-2"
//                     title={t?.common?.view || "View"}
//                   >
//                     <FaEye />
//                   </Link>
//                   <Link
//                     to={`/students/edit/${student.id}`}
//                     className="btn btn-sm btn-warning me-2"
//                     title={t?.common?.edit || "Edit"}
//                   >
//                     <FaEdit />
//                   </Link>
//                   <button
//                     onClick={() => handleDelete(student.id, student.fullName)}
//                     className="btn btn-sm btn-danger"
//                     title={t?.common?.delete || "Delete"}
//                   >
//                     <FaTrash />
//                   </button>
//                  </td>
//                </tr>
//             ))}

//             {!loading && students.length === 0 && (
//               <tr>
//                 <td colSpan="8" className="text-center py-4 text-muted">
//                   {t?.studentList?.noStudents || "No students found"}
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {totalPages > 0 && (
//         <nav className="mt-4">
//           <ul className="pagination justify-content-center">
//             <li className={`page-item ${currentPage === 0 ? "disabled" : ""}`}>
//               <button
//                 className="page-link"
//                 onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
//               >
//                 {t?.common?.previous || "Previous"}
//               </button>
//             </li>

//             {[...Array(totalPages).keys()].map((page) => (
//               <li
//                 key={page}
//                 className={`page-item ${currentPage === page ? "active" : ""}`}
//               >
//                 <button
//                   className="page-link"
//                   onClick={() => setCurrentPage(page)}
//                 >
//                   {page + 1}
//                 </button>
//               </li>
//             ))}

//             <li
//               className={`page-item ${currentPage === totalPages - 1 ? "disabled" : ""}`}
//             >
//               <button
//                 className="page-link"
//                 onClick={() =>
//                   setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
//                 }
//               >
//                 {t?.common?.next || "Next"}
//               </button>
//             </li>
//           </ul>
//         </nav>
//       )}

//       <style>{`
//         .spin {
//           animation: spin 1s linear infinite;
//         }
//         @keyframes spin {
//           from { transform: rotate(0deg); }
//           to { transform: rotate(360deg); }
//         }
//       `}</style>
//     </div>
//   );
// }

// export default StudentList;

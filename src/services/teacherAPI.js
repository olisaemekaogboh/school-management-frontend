// src/services/teacherAPI.js
import api from "./api";

export const teacherAPI = {
  // Basic CRUD
  createTeacher: (formData) =>
    api.post("/teachers", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateTeacher: (id, formData) =>
    api.put(`/teachers/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getTeacher: (id) => api.get(`/teachers/${id}`),

  getTeacherByTeacherId: (teacherId) =>
    api.get(`/teachers/teacher-id/${teacherId}`),

  deleteTeacher: (id) => api.delete(`/teachers/${id}`),

  getAllTeachers: () => api.get("/teachers"),

  getPaginatedTeachers: (page = 0, size = 10, sortBy = "id", sortDir = "asc") =>
    api.get("/teachers/paginated", { params: { page, size, sortBy, sortDir } }),

  // Search
  searchTeachers: (term) => api.get("/teachers/search", { params: { term } }),

  searchTeachersPaginated: (
    term,
    page = 0,
    size = 10,
    sortBy = "id",
    sortDir = "asc",
  ) =>
    api.get("/teachers/search/paginated", {
      params: { term, page, size, sortBy, sortDir },
    }),

  // Filters
  getTeachersByStatus: (status) => api.get(`/teachers/status/${status}`),

  getTeachersBySubject: (subject) => api.get(`/teachers/subject/${subject}`),

  // Subject management
  addSubject: (id, subject) =>
    api.post(`/teachers/${id}/subjects?subject=${subject}`),

  removeSubject: (id, subject) =>
    api.delete(`/teachers/${id}/subjects?subject=${subject}`),

  // Qualification management
  addQualification: (id, qualification) =>
    api.post(`/teachers/${id}/qualifications?qualification=${qualification}`),

  // Status management
  updateEmploymentStatus: (id, status) =>
    api.patch(`/teachers/${id}/status?status=${status}`),

  // Statistics
  getTeacherStatistics: () => api.get("/teachers/statistics"),

  // Utilities
  generateTeacherId: () => api.get("/teachers/generate-id"),

  checkEmailExists: (email) =>
    api.get("/teachers/check-email", { params: { email } }),

  checkTeacherIdExists: (teacherId) =>
    api.get("/teachers/check-teacher-id", { params: { teacherId } }),

  // Export
  exportToPDF: () => api.get("/teachers/export/pdf", { responseType: "blob" }),

  exportToExcel: () =>
    api.get("/teachers/export/excel", { responseType: "blob" }),
};

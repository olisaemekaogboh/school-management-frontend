// src/services/api.js

import axios from "axios";
import { toast } from "react-toastify";

const API_BASE_URL = "http://localhost:8080/api";

/* ================================
   AXIOS INSTANCE
================================ */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

/* ================================
   REQUEST INTERCEPTOR
================================ */
api.interceptors.request.use(
  (config) => {
    console.log(
      `Making ${config.method?.toUpperCase()} request to: ${config.url}`,
    );

    // Get token from localStorage
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/* ================================
   RESPONSE INTERCEPTOR
================================ */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      toast.error("Session expired. Please login again.");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    // Handle 403 Forbidden
    else if (error.response?.status === 403) {
      // Try to refresh token if we have a refresh token and not already retrying
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh-token`,
              {
                refreshToken: refreshToken,
              },
            );

            if (response.data.accessToken) {
              localStorage.setItem("accessToken", response.data.accessToken);
              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
              return api(originalRequest);
            }
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      }

      toast.error("You don't have permission to access this resource");
    } else {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "An unexpected error occurred";
      toast.error(message);
    }

    return Promise.reject(error);
  },
);

/* ================================
   HELPER FUNCTION
================================ */
const sendData = (method, url, data) => {
  if (data instanceof FormData) {
    return api({
      method,
      url,
      data,
      headers: { Accept: "application/json" },
    });
  }

  return api({
    method,
    url,
    data,
  });
};

/* ================================
   AUTH HELPERS
================================ */
export const setAuthToken = (accessToken, refreshToken, user) => {
  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
  }

  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

export const clearAuthToken = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  delete api.defaults.headers.common["Authorization"];
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

/* ================================
   AUTH API
================================ */

export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  logout: () => api.post("/auth/logout"),
  refreshToken: (refreshToken) => api.post("/auth/refresh-token", refreshToken),
  getCurrentUser: () => api.get("/auth/me"),
  changePassword: (data) => api.post("/auth/change-password", data),
  forgotPassword: (emailData) => api.post("/auth/forgot-password", emailData), // Accepts { email: "user@example.com" }
  resetPassword: (token, newPassword) =>
    api.post("/auth/reset-password", { token, newPassword }),
  verifyEmail: (token) => api.post("/auth/verify-email", { token }),
};

/* ================================
   STUDENT API
================================ */
export const studentAPI = {
  getAllStudents: () => api.get("/students"),
  getPaginatedStudents: (page = 0, size = 10, sortBy = "id", sortDir = "asc") =>
    api.get("/students/paginated", {
      params: { page, size, sortBy, sortDir },
    }),
  getStudentById: (id) => api.get(`/students/${id}`),
  getStudentByAdmissionNumber: (admissionNumber) =>
    api.get(`/students/admission/${admissionNumber}`),
  createStudent: (data) => sendData("post", "/students", data),
  updateStudent: (id, data) => sendData("put", `/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/students/${id}`),
  deleteStudentByAdmissionNumber: (admissionNumber) =>
    api.delete(`/students/admission/${admissionNumber}`),
  searchStudents: (term) => api.get("/students/search", { params: { term } }),
  getStudentsByClass: (className) => api.get(`/students/class/${className}`),
  getStudentsByClassAndArm: (className, arm) =>
    api.get(`/students/class/${className}/arm/${arm}`),
  getStudentsByState: (state) =>
    api.get("/students/state", { params: { state } }),
  getStudentsByLGA: (lga) => api.get("/students/lga", { params: { lga } }),
  getActiveStudents: () => api.get("/students/active"),
  getStudentsByStatus: (status) =>
    api.get("/students/status", { params: { status } }),
  getStatistics: () => api.get("/students/statistics"),
  bulkRegisterStudents: (students) => api.post("/students/bulk", students),
  bulkUpdateClass: (studentIds, newClass) =>
    api.patch("/students/bulk/class", studentIds, {
      params: { newClass },
    }),
  generateAdmissionNumber: () => api.get("/students/generate-admission"),
  checkAdmissionNumber: (admissionNumber) =>
    api.get(`/students/check-admission/${admissionNumber}`),
  getPromotionPreview: () => api.get("/students/promote/preview"),
  promoteAllStudents: () => api.post("/students/promote/all"),
  promoteClass: (className) => api.post(`/students/promote/class/${className}`),
  togglePromotionExclusion: (id, exclude, reason) =>
    api.post(`/students/${id}/toggle-exclusion`, null, {
      params: { exclude, reason },
    }),
  getExcludedStudents: () => api.get("/students/excluded"),
  promoteSelectedStudents: (studentIds) =>
    api.post("/students/promote/selected", studentIds),
};

/* ================================
   TEACHER API
================================ */
export const teacherAPI = {
  // In src/services/api.js, add these methods to teacherAPI

  inviteTeacher: (data) => api.post("/teachers/invite", data),
  verifyInvitationToken: (token) =>
    api.get(`/teachers/verify-invitation?token=${token}`),
  completeRegistration: (data) =>
    api.post("/teachers/complete-registration", data),
  getAllTeachers: () => api.get("/teachers"),
  getTeacher: (id) => api.get(`/teachers/${id}`),
  getTeacherByTeacherId: (teacherId) =>
    api.get(`/teachers/teacher-id/${teacherId}`),
  createTeacher: (formData) =>
    api.post("/teachers", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateTeacher: (id, formData) =>
    api.put(`/teachers/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteTeacher: (id) => api.delete(`/teachers/${id}`),
  searchTeachers: (term) => api.get("/teachers/search", { params: { term } }),
  getTeachersByStatus: (status) => api.get(`/teachers/status/${status}`),
  getTeachersBySubject: (subject) => api.get(`/teachers/subject/${subject}`),
  addSubject: (id, subject) =>
    api.post(`/teachers/${id}/subjects?subject=${subject}`),
  removeSubject: (id, subject) =>
    api.delete(`/teachers/${id}/subjects?subject=${subject}`),
  addQualification: (id, qualification) =>
    api.post(`/teachers/${id}/qualifications?qualification=${qualification}`),
  updateEmploymentStatus: (id, status) =>
    api.patch(`/teachers/${id}/status?status=${status}`),
  getTeacherStatistics: () => api.get("/teachers/statistics"),
  generateTeacherId: () => api.get("/teachers/generate-id"),
  checkEmailExists: (email) =>
    api.get("/teachers/check-email", { params: { email } }),
  checkTeacherIdExists: (teacherId) =>
    api.get("/teachers/check-teacher-id", { params: { teacherId } }),
  exportToPDF: () => api.get("/teachers/export/pdf", { responseType: "blob" }),
  exportToExcel: () =>
    api.get("/teachers/export/excel", { responseType: "blob" }),
};

/* ================================
   CLASS API
================================ */
export const classAPI = {
  createClass: (data) => api.post("/classes", data),
  updateClass: (id, data) => api.put(`/classes/${id}`, data),
  getClass: (id) => api.get(`/classes/${id}`),
  getClassByName: (className) => api.get(`/classes/name/${className}`),
  deleteClass: (id) => api.delete(`/classes/${id}`),
  getAllClasses: () => api.get("/classes"),
  getClassesByCategory: (category) => api.get(`/classes/category/${category}`),
  assignClassTeacher: (classId, teacherId) =>
    api.post(`/classes/${classId}/assign-teacher/${teacherId}`),
  addSubject: (classId, subject) =>
    api.post(`/classes/${classId}/subjects?subject=${subject}`),
  removeSubject: (classId, subject) =>
    api.delete(`/classes/${classId}/subjects?subject=${subject}`),
  getStudentsInClass: (classId) => api.get(`/classes/${classId}/students`),
  getClassStatistics: () => api.get("/classes/statistics"),
  exportToPDF: (classId) =>
    api.get(`/classes/${classId}/export/pdf`, { responseType: "blob" }),
  exportToExcel: (classId) =>
    api.get(`/classes/${classId}/export/excel`, { responseType: "blob" }),
};

/* ================================
   RESULT API
================================ */
export const resultAPI = {
  addOrUpdateResultDTO: (resultData) => {
    return api.post(`/results/student/${resultData.studentId}`, resultData);
  },
  addOrUpdateResult: (studentId, subject, session, term, scores) => {
    return api.post(
      `/results/student/${studentId}?subject=${subject}&session=${session}&term=${term}`,
      scores,
    );
  },
  getTermResult: (studentId, session, term) =>
    api.get(`/results/student/${studentId}/term`, {
      params: { session, term },
    }),
  getAnnualResult: (studentId, session) =>
    api.get(`/results/student/${studentId}/annual`, {
      params: { session },
    }),
  getClassRankings: (className, session, term) =>
    api.get(`/results/rankings/class/${className}`, {
      params: { session, term },
    }),
  getArmRankings: (className, arm, session, term) =>
    api.get(`/results/rankings/class/${className}/arm/${arm}`, {
      params: { session, term },
    }),
  getSchoolRankings: (session, term) =>
    api.get("/results/rankings/school", {
      params: { session, term },
    }),
  calculateAllTermResults: (session, term) =>
    api.post("/results/calculate/term", null, {
      params: { session, term },
    }),
  calculateAllAnnualResults: (session) =>
    api.post("/results/calculate/annual", null, {
      params: { session },
    }),
};

/* ================================
   ATTENDANCE API
================================ */
export const attendanceAPI = {
  markAttendance: (studentId, date, session, term, status, remarks) =>
    api.post(
      `/attendance/student/${studentId}?date=${date}&session=${session}&term=${term}&status=${status}${remarks ? `&remarks=${encodeURIComponent(remarks)}` : ""}`,
    ),
  markBulkAttendance: (studentIds, date, session, term, status) =>
    api.post(
      `/attendance/bulk?date=${date}&session=${session}&term=${term}&status=${status}`,
      studentIds,
    ),
  getStudentAttendance: (studentId, date, session, term) =>
    api.get(
      `/attendance/student/${studentId}?date=${date}&session=${session}&term=${term}`,
    ),
  getStudentTermAttendance: (studentId, session, term) =>
    api.get(
      `/attendance/student/${studentId}/term?session=${session}&term=${term}`,
    ),
  getStudentTermSummary: (studentId, session, term) =>
    api.get(
      `/attendance/student/${studentId}/summary?session=${session}&term=${term}`,
    ),
  getStudentSessionSummary: (studentId, session) =>
    api.get(`/attendance/student/${studentId}/session?session=${session}`),
  getClassAttendance: (className, date, session, term) =>
    api.get(
      `/attendance/class/${className}?date=${date}&session=${session}&term=${term}`,
    ),
  getClassTermStatistics: (className, session, term) =>
    api.get(
      `/attendance/statistics/class/${className}?session=${session}&term=${term}`,
    ),
  getSchoolAttendanceStatistics: (session, term) =>
    api.get(`/attendance/statistics/school?session=${session}&term=${term}`),
  initializeSchoolDays: (dates, session, term) =>
    api.post(
      `/attendance/initialize-days?session=${session}&term=${term}`,
      dates,
    ),
  calculateAllTermSummaries: (session, term) =>
    api.post(`/attendance/calculate-all?session=${session}&term=${term}`),
};

/* ================================
   SESSION RESULT API
================================ */
export const sessionResultAPI = {
  calculateSessionResult: (studentId, session) =>
    api.post(
      `/session-results/calculate/student/${studentId}?session=${session}`,
    ),
  calculateAllSessionResults: (session) =>
    api.post(`/session-results/calculate/all?session=${session}`),
  getSessionResult: (studentId, session) =>
    api.get(`/session-results/student/${studentId}?session=${session}`),
  getClassSessionResults: (className, session) =>
    api.get(`/session-results/class/${className}?session=${session}`),
  getArmSessionResults: (className, arm, session) =>
    api.get(
      `/session-results/class/${className}/arm/${arm}?session=${session}`,
    ),
  getSchoolRankings: (session) =>
    api.get(`/session-results/rankings/school?session=${session}`),
  getClassRankings: (className, session) =>
    api.get(`/session-results/rankings/class/${className}?session=${session}`),
  getArmRankings: (className, arm, session) =>
    api.get(
      `/session-results/rankings/class/${className}/arm/${arm}?session=${session}`,
    ),
  generateSessionReport: (studentId, session) =>
    api.get(`/session-results/report/${studentId}?session=${session}`),
  getSessionStatistics: (session) =>
    api.get(`/session-results/statistics?session=${session}`),
  promoteStudents: (session) =>
    api.post(`/session-results/promote?session=${session}`),
  getGraduationList: (session) =>
    api.get(`/session-results/graduation-list?session=${session}`),
};

/* ================================
   ANNOUNCEMENT API
================================ */
export const announcementAPI = {
  createAnnouncement: (data) => api.post("/announcements", data),
  getSmsHistory: (id) => api.get(`/announcements/${id}/sms-history`),
  updateAnnouncement: (id, data) => api.put(`/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),
  getAnnouncement: (id) => api.get(`/announcements/${id}`),
  getAllAnnouncements: () => api.get("/announcements"),
  getAnnouncementsByType: (type) => api.get(`/announcements/type/${type}`),
  getAnnouncementsByAudience: (audience) =>
    api.get(`/announcements/audience/${audience}`),
  getUpcomingEvents: () => api.get("/announcements/upcoming/events"),
  getUpcomingFees: () => api.get("/announcements/upcoming/fees"),
  getSchoolCalendar: (session) =>
    api.get(`/announcements/calendar?session=${session}`),
  createResumption: (session, date, term) =>
    api.post(
      `/announcements/resumption?session=${session}&date=${date}&term=${term}`,
    ),
  createMidtermBreak: (session, start, end) =>
    api.post(
      `/announcements/midterm-break?session=${session}&start=${start}&end=${end}`,
    ),
  createResultRelease: (session, term, date) =>
    api.post(
      `/announcements/result-release?session=${session}&term=${term}&date=${date}`,
    ),
  createFeeAnnouncement: (description, amount, dueDate, audience) =>
    api.post(
      `/announcements/fee?description=${description}&amount=${amount}&dueDate=${dueDate}&audience=${audience}`,
    ),
  sendNotifications: (id) => api.post(`/announcements/${id}/notify`),
};

/* ================================
   FEE API
================================ */
export const feeAPI = {
  createFee: (data) => api.post("/fees", data),
  updateFee: (id, data) => api.put(`/fees/${id}`, data),
  getFee: (id) => api.get(`/fees/${id}`),
  getStudentFees: (studentId, session, term) =>
    api.get(`/fees/student/${studentId}?session=${session}&term=${term}`),
  recordPayment: (feeId, amount, paymentMethod, reference) =>
    api.post(
      `/fees/${feeId}/payment?amount=${amount}&paymentMethod=${paymentMethod}${reference ? `&reference=${reference}` : ""}`,
    ),
  getOverdueFees: () => api.get("/fees/overdue"),
  getUpcomingFees: (days = 7) => api.get(`/fees/upcoming?days=${days}`),
  getFeeStatistics: async (session, term) => {
    try {
      const response = await api.get(
        `/fees/statistics?session=${session}&term=${term}`,
      );
      return response;
    } catch (error) {
      console.error("Error fetching fee statistics:", error);
      throw error;
    }
  },
  getDefaultingStudents: (session, term) =>
    api.get(`/fees/defaulters?session=${session}&term=${term}`),
  sendFeeReminders: (session, term, daysBeforeDue = 7) =>
    api.post(
      `/fees/reminders/send?session=${session}&term=${term}&daysBeforeDue=${daysBeforeDue}`,
    ),
  sendOverdueReminders: () => api.post("/fees/reminders/overdue"),
  generateFeeReport: (session, term) =>
    api.get(`/fees/report?session=${session}&term=${term}`),
  getPaymentHistory: (feeId) => api.get(`/fees/${feeId}/payments`),
  sendSingleReminder: (feeId) => api.post(`/fees/${feeId}/send-reminder`),
  exportToCSV: (session, term) =>
    api.get(`/fees/export?session=${session}&term=${term}&format=csv`, {
      responseType: "blob",
    }),
  getFeeSummary: (session, term) =>
    api.get(`/fees/summary?session=${session}&term=${term}`),
};

/* ================================
   TIMETABLE API
================================ */
export const timetableAPI = {
  createEntry: (data) => api.post("/timetable", data),
  updateEntry: (id, data) => api.put(`/timetable/${id}`, data),
  getEntry: (id) => api.get(`/timetable/${id}`),
  deleteEntry: (id) => api.delete(`/timetable/${id}`),
  getClassTimetable: (classId, session, term) =>
    api.get(`/timetable/class/${classId}?session=${session}&term=${term}`),
  getTeacherTimetable: (teacherId, session, term) =>
    api.get(`/timetable/teacher/${teacherId}?session=${session}&term=${term}`),
  getSchoolTimetable: (session, term) =>
    api.get(`/timetable/school?session=${session}&term=${term}`),
  checkAvailability: (teacherId, day, startTime, endTime) =>
    api.get(
      `/timetable/check-availability?teacherId=${teacherId}&day=${day}&startTime=${startTime}&endTime=${endTime}`,
    ),
};

/* ================================
   PARENT API
================================ */
export const parentAPI = {
  createParent: (data) => api.post("/parents", data),
  updateParent: (id, data) => api.put(`/parents/${id}`, data),
  getParent: (id) => api.get(`/parents/${id}`),
  getParentByEmail: (email) => api.get(`/parents/email/${email}`),
  deleteParent: (id) => api.delete(`/parents/${id}`),
  getAllParents: () => api.get("/parents"),
  getWards: (parentId) => api.get(`/parents/${parentId}/wards`),
  linkStudent: (parentId, studentId) =>
    api.post(`/parents/${parentId}/link-student/${studentId}`),
  unlinkStudent: (parentId, studentId) =>
    api.delete(`/parents/${parentId}/unlink-student/${studentId}`),
  getParentDashboard: (parentId, session, term) =>
    api.get(`/parents/${parentId}/dashboard?session=${session}&term=${term}`),
};

/* ================================
   LIBRARY API
================================ */
export const libraryAPI = {
  createBook: (data) => api.post("/library/books", data),
  updateBook: (id, data) => api.put(`/library/books/${id}`, data),
  getBook: (id) => api.get(`/library/books/${id}`),
  deleteBook: (id) => api.delete(`/library/books/${id}`),
  getAllBooks: (params) => api.get("/library/books", { params }),
  searchBooks: (term) => api.get("/library/books/search", { params: { term } }),
  getBooksByCategory: (category) =>
    api.get(`/library/books/category/${category}`),
  borrowBook: (data) => api.post("/library/borrow", data),
  returnBook: (id) => api.post(`/library/return/${id}`),
  renewBook: (id) => api.post(`/library/renew/${id}`),
  reportLost: (id) => api.post(`/library/lost/${id}`),
  getBorrowingsByStudent: (studentId) =>
    api.get(`/library/borrowings/student/${studentId}`),
  getBorrowingsByTeacher: (teacherId) =>
    api.get(`/library/borrowings/teacher/${teacherId}`),
  getOverdueBorrowings: () => api.get("/library/borrowings/overdue"),
  getLibraryStatistics: () => api.get("/library/statistics"),
};

/* ================================
   TRANSPORT API
================================ */
export const transportAPI = {
  createRoute: (data) => api.post("/transport/routes", data),
  updateRoute: (id, data) => api.put(`/transport/routes/${id}`, data),
  getRoute: (id) => api.get(`/transport/routes/${id}`),
  deleteRoute: (id) => api.delete(`/transport/routes/${id}`),
  getAllRoutes: () => api.get("/transport/routes"),
  getActiveRoutes: () => api.get("/transport/routes/active"),
  assignStudentToRoute: (studentId, routeId, stopIndex) =>
    api.post(
      `/transport/assign?studentId=${studentId}&routeId=${routeId}&stopIndex=${stopIndex}`,
    ),
  removeStudentFromRoute: (studentId) =>
    api.delete(`/transport/remove/${studentId}`),
  getRouteStudents: (routeId) =>
    api.get(`/transport/routes/${routeId}/students`),
  updateBusLocation: (routeId, latitude, longitude) =>
    api.post(
      `/transport/update-location/${routeId}?lat=${latitude}&lng=${longitude}`,
    ),
  getBusLocation: (routeId) => api.get(`/transport/location/${routeId}`),
  getTransportStatistics: () => api.get("/transport/statistics"),
};

/* ================================
   USER API
================================ */
export const userAPI = {
  getAllUsers: () => api.get("/users"),
  getPaginatedUsers: (page = 0, size = 10, sortBy = "id", sortDir = "asc") =>
    api.get("/users/paginated", { params: { page, size, sortBy, sortDir } }),
  getUserById: (id) => api.get(`/users/${id}`),
  getCurrentUser: () => api.get("/users/me"),
  createUser: (data) => api.post("/users", data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  updateCurrentUser: (data) => api.put("/users/me", data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  deleteCurrentUser: () => api.delete("/users/me"),
  toggleUserStatus: (id, active) =>
    api.patch(`/users/${id}/toggle-status?active=${active}`),
  searchUsers: (term) => api.get("/users/search", { params: { term } }),
  getUsersByRole: (role) => api.get(`/users/role/${role}`),
  getUserStatistics: () => api.get("/users/statistics"),
  register: (data) => api.post("/users/register", data),
  login: (credentials) => api.post("/users/login", credentials),
};

/* ================================
   DEFAULT EXPORT (api instance)
================================ */
export default api;

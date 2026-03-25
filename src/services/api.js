import axios from "axios";
import { toast } from "react-toastify";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:8443/api";

/* ================================
   AXIOS INSTANCE
================================ */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

/* ================================
   REQUEST INTERCEPTOR
================================ */
api.interceptors.request.use(
  (config) => {
    console.log(
      `Making ${config.method?.toUpperCase()} request to: ${config.url}`,
    );
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
    const status = error.response?.status;

    if (
      status === 401 &&
      !originalRequest?._retry &&
      !String(originalRequest?.url || "").includes("/auth/login") &&
      !String(originalRequest?.url || "").includes("/auth/refresh-token")
    ) {
      originalRequest._retry = true;

      try {
        await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          {
            withCredentials: true,
          },
        );

        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
      }

      localStorage.removeItem("user");
      toast.error("Session expired. Please login again.");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (status === 403) {
      toast.error("You don't have permission to access this resource");
      return Promise.reject(error);
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred";

    toast.error(message);
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
export const setAuthToken = (_accessToken, _refreshToken, user) => {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

export const clearAuthToken = () => {
  localStorage.removeItem("user");
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/* ================================
   AUTH API
================================ */
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  logout: () => api.post("/auth/logout"),
  refreshToken: () => api.post("/auth/refresh-token", {}),
  getCurrentUser: () => api.get("/auth/me"),
  changePassword: (data) => api.post("/auth/change-password", data),
  forgotPassword: (emailData) => api.post("/auth/forgot-password", emailData),
  resetPassword: (token, newPassword) =>
    api.post("/auth/reset-password", { token, newPassword }),
  verifyEmail: (token) => api.post("/auth/verify-email", { token }),
};

/* ================================
   STUDENT API
================================ */
export const studentAPI = {
  getAllStudents: () => api.get("/students"),
  getMyProfile: () => api.get("/students/me"),

  getPaginatedStudents: (page = 0, size = 10, sortBy = "id", sortDir = "asc") =>
    api.get("/students/paginated", {
      params: { page, size, sortBy, sortDir },
    }),

  getStudentById: (id) => api.get(`/students/${id}`),

  getStudentByAdmissionNumber: (admissionNumber) =>
    api.get(`/students/admission/${encodeURIComponent(admissionNumber)}`),

  createStudent: (data) => sendData("post", "/students", data),

  updateStudent: (id, data) => sendData("put", `/students/${id}`, data),

  deleteStudent: (id) => api.delete(`/students/${id}`),

  deleteStudentByAdmissionNumber: (admissionNumber) =>
    api.delete(`/students/admission/${encodeURIComponent(admissionNumber)}`),

  searchStudents: (term) => api.get("/students/search", { params: { term } }),

  getStudentsByClass: (className) =>
    api.get(`/students/class/${encodeURIComponent(className)}`),

  getStudentsByClassAndArm: (className, arm) =>
    api.get(
      `/students/class/${encodeURIComponent(className)}/arm/${encodeURIComponent(arm)}`,
    ),

  getStudentsByState: (state) =>
    api.get(`/students/state/${encodeURIComponent(state)}`),

  getStudentsByLGA: (lga) =>
    api.get(`/students/lga/${encodeURIComponent(lga)}`),

  getActiveStudents: () => api.get("/students/active"),

  getStudentsByStatus: (status) =>
    api.get(`/students/status/${encodeURIComponent(status)}`),

  getStatistics: () => api.get("/students/statistics"),

  bulkRegisterStudents: (students) => api.post("/students/bulk", students),

  bulkUpdateClass: (studentIds, newClass) =>
    api.patch("/students/bulk/class", studentIds, {
      params: { newClass },
    }),

  generateAdmissionNumber: () => api.get("/students/generate-admission"),

  checkAdmissionNumber: (admissionNumber) =>
    api.get(`/students/check-admission/${encodeURIComponent(admissionNumber)}`),

  getPromotionPreview: () => api.get("/students/promote/preview"),

  promoteAllStudents: () => api.post("/students/promote/all"),

  promoteClass: (className, arm = null) =>
    api.post(`/students/promote/class/${encodeURIComponent(className)}`, null, {
      params: arm ? { arm } : {},
    }),

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
  inviteTeacher: (data) => api.post("/teachers/invite", data),
  verifyInvitationToken: (token) =>
    api.get("/teachers/verify-invitation", { params: { token } }),
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
  getTeachersByDepartment: (department) =>
    api.get(`/teachers/department/${department}`),

  addSubject: (id, subject) =>
    api.post(`/teachers/${id}/subjects`, null, { params: { subject } }),

  removeSubject: (id, subject) =>
    api.delete(`/teachers/${id}/subjects`, { params: { subject } }),

  addQualification: (id, qualification) =>
    api.post(`/teachers/${id}/qualifications`, null, {
      params: { qualification },
    }),

  updateEmploymentStatus: (id, status) =>
    api.patch(`/teachers/${id}/status`, null, { params: { status } }),

  getTeacherStatistics: () => api.get("/teachers/statistics"),
  generateTeacherId: () => api.get("/teachers/generate-id"),
  checkEmailExists: (email) =>
    api.get("/teachers/check-email", { params: { email } }),
  checkTeacherIdExists: (teacherId) =>
    api.get("/teachers/check-teacher-id", { params: { teacherId } }),
  exportToPDF: () => api.get("/teachers/export/pdf", { responseType: "blob" }),
  exportToExcel: () =>
    api.get("/teachers/export/excel", { responseType: "blob" }),

  getMyTeacherProfile: () => api.get("/teachers/me"),
  getMyClasses: () => api.get("/teachers/me/classes"),
  getMySubjectAssignments: () => api.get("/teachers/me/subject-assignments"),
  getMyClassStudents: (classId) =>
    api.get(`/teachers/me/classes/${classId}/students`),
  getMyClassResults: (classId, session, term) =>
    api.get(`/teachers/me/classes/${classId}/results`, {
      params: { session, term },
    }),
  getMyClassAttendance: (classId, date, session, term) =>
    api.get(`/teachers/me/classes/${classId}/attendance`, {
      params: { date, session, term },
    }),
  markMyClassAttendance: (classId, payload) =>
    api.post(`/teachers/me/classes/${classId}/attendance`, payload),
};

/* ================================
   SUBJECT API
================================ */
export const subjectAPI = {
  getAllSubjects: () => api.get("/subjects"),
  getActiveSubjects: () => api.get("/subjects/active"),
  getSubjectById: (id) => api.get(`/subjects/${id}`),
  createSubject: (data) => api.post("/subjects", data),
  updateSubject: (id, data) => api.put(`/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/subjects/${id}`),
  toggleStatus: (id, active) =>
    api.patch(`/subjects/${id}/status`, null, {
      params: { active },
    }),

  assignSubjectToClass: (data) => api.post("/subjects/class-assignments", data),

  getSubjectsForClass: (className, classArm) =>
    api.get("/subjects/class-assignments", {
      params: { className, classArm },
    }),

  removeSubjectFromClass: (className, classArm, subjectId) =>
    api.delete("/subjects/class-assignments", {
      params: { className, classArm, subjectId },
    }),

  assignSubjectToTeacher: (data) =>
    api.post("/subjects/teacher-assignments", data),
  getTeacherSubjects: (teacherId) =>
    api.get(`/subjects/teacher-assignments/${teacherId}`),
  removeTeacherSubject: (id) =>
    api.delete(`/subjects/teacher-assignments/${id}`),
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
    api.post(`/classes/${classId}/subjects`, null, {
      params: { subject },
    }),
  removeSubject: (classId, subject) =>
    api.delete(`/classes/${classId}/subjects`, {
      params: { subject },
    }),
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
  addOrUpdateResultDTO: (resultData) =>
    api.post(`/results/student/${resultData.studentId}`, resultData),

  addOrUpdateResult: (studentId, subject, session, term, scores) =>
    api.post(`/results/student/${studentId}`, {
      studentId,
      subject,
      session,
      term,
      resumptionTest: scores?.resumptionTest ?? 0,
      assignments: scores?.assignments ?? 0,
      project: scores?.project ?? 0,
      midtermTest: scores?.midtermTest ?? 0,
      secondTest: scores?.secondTest ?? 0,
      examination: scores?.examination ?? 0,
    }),

  getStudentResults: (studentId, session, term) =>
    api.get(`/results/student/${studentId}`, {
      params: { session, term },
    }),

  getTermResult: (studentId, session, term) =>
    api.get(`/results/student/${studentId}/term`, {
      params: { session, term },
    }),

  getAnnualResult: (studentId, session) =>
    api.get(`/results/student/${studentId}/annual`, {
      params: { session },
    }),

  getClassRankings: (className, session, term, arm) =>
    api.get(`/results/rankings/class/${encodeURIComponent(className)}`, {
      params: {
        session,
        term,
        ...(arm ? { arm } : {}),
      },
    }),

  getArmRankings: (className, arm, session, term) =>
    api.get(
      `/results/rankings/class/${encodeURIComponent(className)}/arm/${encodeURIComponent(arm)}`,
      {
        params: { session, term },
      },
    ),

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

  getMyTermResult: (session, term) =>
    api.get("/results/me/term", {
      params: { session, term },
    }),

  getMyAnnualResult: (session) =>
    api.get("/results/me/annual", {
      params: { session },
    }),
};

export const emailQueueAPI = {
  getAll: () => api.get("/email-queue"),
  getStats: () => api.get("/email-queue/stats"),
  getByStatus: (status) => api.get(`/email-queue/status/${status}`),
  getByAnnouncement: (announcementId) =>
    api.get(`/email-queue/announcement/${announcementId}`),
  retryEmail: (queueId) => api.post(`/email-queue/${queueId}/retry`),
  processNow: () => api.post("/email-queue/process"),
};

/* ================================
   ATTENDANCE API
================================ */
export const attendanceAPI = {
  markAttendance: (studentId, date, session, term, status, remarks = "") =>
    api.post(`/attendance/student/${studentId}`, null, {
      params: { date, session, term, status, remarks },
    }),

  markBulkAttendance: (studentIds, date, session, term, status) =>
    api.post(`/attendance/bulk`, studentIds, {
      params: { date, session, term, status },
    }),

  getStudentAttendance: (studentId, date, session, term) =>
    api.get(`/attendance/student/${studentId}`, {
      params: { date, session, term },
    }),

  getStudentTermAttendance: (studentId, session, term) =>
    api.get(`/attendance/student/${studentId}/term`, {
      params: { session, term },
    }),

  getStudentTermSummary: (studentId, session, term) =>
    api.get(`/attendance/student/${studentId}/summary`, {
      params: { session, term },
    }),

  getMyAttendance: (session, term) =>
    api.get(`/attendance/me/term`, {
      params: { session, term },
    }),

  getMyAttendanceSummary: (session, term) =>
    api.get(`/attendance/me/summary`, {
      params: { session, term },
    }),

  getClassAttendance: (className, arm, date, session, term) =>
    api.get(
      `/attendance/class/${encodeURIComponent(className)}/arm/${encodeURIComponent(arm)}`,
      {
        params: { date, session, term },
      },
    ),

  getClassTermStatistics: (className, arm, session, term) =>
    api.get(
      `/attendance/statistics/class/${encodeURIComponent(className)}/arm/${encodeURIComponent(arm)}`,
      {
        params: { session, term },
      },
    ),

  getSchoolAttendanceStatistics: (session, term) =>
    api.get(`/attendance/statistics/school`, {
      params: { session, term },
    }),
};

/* ================================
   SESSION RESULT API
================================ */
export const sessionResultAPI = {
  calculateSessionResult: (studentId, session) =>
    api.post(`/session-results/calculate/student/${studentId}`, null, {
      params: { session },
    }),

  calculateAllSessionResults: (session) =>
    api.post("/session-results/calculate/all", null, {
      params: { session },
    }),

  calculateClassArmSessionResults: (className, arm, session) =>
    api.post(
      `/session-results/calculate/class/${encodeURIComponent(className)}/arm/${encodeURIComponent(arm)}`,
      null,
      {
        params: { session },
      },
    ),

  getSessionResult: (studentId, session) =>
    api.get(`/session-results/student/${studentId}`, {
      params: { session },
    }),

  getClassSessionResults: (className, session, arm) =>
    api.get(`/session-results/class/${className}`, {
      params: {
        session,
        ...(arm ? { arm } : {}),
      },
    }),

  getArmSessionResults: (className, arm, session) =>
    api.get(`/session-results/class/${className}/arm/${arm}`, {
      params: { session },
    }),

  getSchoolRankings: (session) =>
    api.get("/session-results/rankings/school", {
      params: { session },
    }),

  getClassRankings: (className, session, arm) =>
    api.get(`/session-results/rankings/class/${className}`, {
      params: {
        session,
        ...(arm ? { arm } : {}),
      },
    }),

  getArmRankings: (className, arm, session) =>
    api.get(`/session-results/rankings/class/${className}/arm/${arm}`, {
      params: { session },
    }),

  generateSessionReport: (studentId, session) =>
    api.get(`/session-results/report/${studentId}`, {
      params: { session },
    }),

  getSessionStatistics: (session) =>
    api.get("/session-results/statistics", {
      params: { session },
    }),

  promoteStudents: (session) =>
    api.post("/session-results/promote", null, {
      params: { session },
    }),

  getGraduationList: (session) =>
    api.get("/session-results/graduation-list", {
      params: { session },
    }),
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
    api.get("/announcements/calendar", { params: { session } }),
  createResumption: (session, date, term) =>
    api.post("/announcements/resumption", null, {
      params: { session, date, term },
    }),
  createMidtermBreak: (session, start, end) =>
    api.post("/announcements/midterm-break", null, {
      params: { session, start, end },
    }),
  createResultRelease: (session, term, date) =>
    api.post("/announcements/result-release", null, {
      params: { session, term, date },
    }),
  createFeeAnnouncement: (description, amount, dueDate, audience) =>
    api.post("/announcements/fee", null, {
      params: { description, amount, dueDate, audience },
    }),
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
    api.get(`/fees/student/${studentId}`, {
      params: { session, term },
    }),

  getStudentAllFees: (studentId) => api.get(`/fees/student/${studentId}/all`),

  getStudentPaymentHistory: (studentId, session) =>
    api.get(`/fees/student/${studentId}/payments`, {
      params: session ? { session } : {},
    }),

  hasOutstandingFees: (studentId, session, term) =>
    api.get(`/fees/student/${studentId}/has-outstanding`, {
      params: { session, term },
    }),

  getTotalOutstanding: (studentId, session, term) =>
    api.get(`/fees/student/${studentId}/outstanding/total`, {
      params: { session, term },
    }),

  getOutstandingByType: (studentId, session, term) =>
    api.get(`/fees/student/${studentId}/outstanding/by-type`, {
      params: { session, term },
    }),

  getMyFees: (session, term) =>
    api.get("/fees/me", {
      params: { session, term },
    }),

  getMyPaymentHistory: (session) =>
    api.get("/fees/me/payments", {
      params: session ? { session } : {},
    }),

  recordPayment: (feeId, amount, paymentMethod, reference, notes) =>
    api.post(`/fees/${feeId}/payment`, null, {
      params: {
        amount,
        paymentMethod,
        ...(reference ? { reference } : {}),
        ...(notes ? { notes } : {}),
      },
    }),

  recordPartialPayment: (feeId, amount, paymentMethod, reference) =>
    api.post(`/fees/${feeId}/partial-payment`, null, {
      params: {
        amount,
        paymentMethod,
        ...(reference ? { reference } : {}),
      },
    }),

  getOverdueFees: () => api.get("/fees/overdue"),
  getUpcomingFees: (days = 7) =>
    api.get("/fees/upcoming", { params: { days } }),

  getFeeStatistics: (session, term) =>
    api.get("/fees/statistics", {
      params: { session, term },
    }),

  getDefaultingStudents: (session, term) =>
    api.get("/fees/defaulters", {
      params: { session, term },
    }),

  sendFeeReminders: (session, term, daysBeforeDue = 7) =>
    api.post("/fees/reminders/send", null, {
      params: { session, term, daysBeforeDue },
    }),

  sendOverdueReminders: () => api.post("/fees/reminders/overdue"),

  generateFeeReport: (session, term) =>
    api.get("/fees/report", {
      params: { session, term },
    }),

  getFeePaymentHistory: (feeId) => api.get(`/fees/${feeId}/payments`),

  sendSingleReminder: (feeId) => api.post(`/fees/${feeId}/send-reminder`),

  getDashboardData: (session, term) =>
    api.get("/fees/dashboard", {
      params: { session, term },
    }),
};

/* ================================
   TIMETABLE API
================================ */
export const timetableAPI = {
  createTimetableEntry: (data) => api.post("/timetable", data),
  updateTimetableEntry: (id, data) => api.put(`/timetable/${id}`, data),
  getTimetableEntry: (id) => api.get(`/timetable/${id}`),
  deleteTimetableEntry: (id) => api.delete(`/timetable/${id}`),

  getClassTimetable: (classId, session, term) =>
    api.get(`/timetable/class/${classId}`, {
      params: { session, term },
    }),

  getTeacherTimetable: (teacherId, session, term) =>
    api.get(`/timetable/teacher/${teacherId}`, {
      params: { session, term },
    }),

  getSchoolTimetable: (session, term) =>
    api.get("/timetable/school", {
      params: { session, term },
    }),

  getMyTimetable: (session, term) =>
    api.get("/timetable/me", {
      params: { session, term },
    }),

  getMyStudentTimetable: (session, term) =>
    api.get("/timetable/student/me", {
      params: { session, term },
    }),

  getWardTimetable: (studentId, session, term) =>
    api.get(`/timetable/parent/ward/${studentId}`, {
      params: { session, term },
    }),

  checkAvailability: ({ teacherId, day, session, term, startTime, endTime }) =>
    api.get("/timetable/check-availability", {
      params: { teacherId, day, session, term, startTime, endTime },
    }),
};

/* ================================
   PARENT API
================================ */
export const parentAPI = {
  createParent: (data) => api.post("/parents", data),
  updateParent: (id, data) => api.put(`/parents/${id}`, data),
  getParent: (id) => api.get(`/parents/${id}`),
  getParentByEmail: (email) =>
    api.get("/parents/by-email", { params: { email } }),
  deleteParent: (id) => api.delete(`/parents/${id}`),
  getAllParents: () => api.get("/parents"),

  getWards: (parentId) => api.get(`/parents/${parentId}/wards`),
  linkStudent: (parentId, studentId) =>
    api.post(`/parents/${parentId}/wards/${studentId}`),
  unlinkStudent: (parentId, studentId) =>
    api.delete(`/parents/${parentId}/wards/${studentId}`),
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

  getAllBorrowings: () => api.get("/library/borrowings"),
  getBorrowingsByStudent: (studentId) =>
    api.get(`/library/borrowings/student/${studentId}`),
  getBorrowingsByTeacher: (teacherId) =>
    api.get(`/library/borrowings/teacher/${teacherId}`),
  getOverdueBorrowings: () => api.get("/library/borrowings/overdue"),
  getLibraryStatistics: () => api.get("/library/statistics"),
};

/* ================================
   SESSION API
================================ */
export const sessionAPI = {
  createSession: (data) => api.post("/sessions", data),
  updateSession: (id, data) => api.put(`/sessions/${id}`, data),
  deleteSession: (id) => api.delete(`/sessions/${id}`),
  getAllSessions: () => api.get("/sessions"),

  getActiveSession: async () => {
    try {
      return await api.get("/sessions/active");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404 || status === 204) {
        return { data: null };
      }
      throw err;
    }
  },

  activateSession: (id) => api.put(`/sessions/${id}/activate`),
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
    api.post("/transport/assign", null, {
      params: { studentId, routeId, stopIndex },
    }),
  removeStudentFromRoute: (studentId) =>
    api.delete(`/transport/remove/${studentId}`),
  getRouteStudents: (routeId) =>
    api.get(`/transport/routes/${routeId}/students`),
  updateBusLocation: (routeId, latitude, longitude) =>
    api.post(`/transport/update-location/${routeId}`, null, {
      params: { lat: latitude, lng: longitude },
    }),
  getBusLocation: (routeId) => api.get(`/transport/location/${routeId}`),
  getTransportStatistics: () => api.get("/transport/statistics"),
  getStudentAssignedRoute: (studentId) =>
    api.get(`/transport/student/${studentId}`),
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
    api.patch(`/users/${id}/toggle-status`, null, {
      params: { active },
    }),
  searchUsers: (term) => api.get("/users/search", { params: { term } }),
  getUsersByRole: (role) => api.get(`/users/role/${role}`),
  getUserStatistics: () => api.get("/users/statistics"),
  register: (data) => api.post("/users/register", data),
  login: (credentials) => api.post("/users/login", credentials),
};

/* ================================
   ROLE-SCOPED PORTAL APIs
================================ */
export const teacherPortalAPI = {
  getDashboard: () => api.get("/teacher/dashboard"),
  getMyClasses: () => api.get("/teachers/me/classes"),
  getMyStudents: (classId) =>
    api.get(`/teachers/me/classes/${classId}/students`),
  getMyClassAttendance: (classId, date, session, term) =>
    api.get(`/teachers/me/classes/${classId}/attendance`, {
      params: { date, session, term },
    }),
  getWardTimetable: (studentId, session, term) =>
    api.get("/parents/me/timetable", {
      params: { studentId, session, term },
    }),
  markMyClassAttendance: (classId, payload) =>
    api.post(`/teachers/me/classes/${classId}/attendance`, payload),
  getMyClassResults: (classId, session, term) =>
    api.get(`/teachers/me/classes/${classId}/results`, {
      params: { session, term },
    }),
};

export const studentPortalAPI = {
  getDashboard: () => api.get("/student/dashboard"),
  getMyProfile: () => api.get("/auth/me"),

  getMyTermResult: (session, term) =>
    api.get("/results/me/term", { params: { session, term } }),
  getMySessionResult: (session) =>
    api.get("/results/me/annual", { params: { session } }),

  getMyAttendance: (session, term) =>
    api.get("/attendance/me/term", { params: { session, term } }),

  getMyAttendanceSummary: (session, term) =>
    api.get("/attendance/me/summary", { params: { session, term } }),

  getMyFees: (session, term) =>
    api.get("/fees/me", { params: { session, term } }),

  getMyPaymentHistory: (session) =>
    api.get("/fees/me/payments", {
      params: session ? { session } : {},
    }),

  getMyTimetable: (session, term) =>
    api.get("/student/timetable", { params: { session, term } }),

  getMyTransport: () => api.get("/student/transport"),
};

export const parentPortalAPI = {
  getDashboard: () => api.get("/parents/me/dashboard"),
  getMyProfile: () => api.get("/parents/me"),
  getMyWards: () => api.get("/parents/me/wards"),
  getWardTimetable: (studentId, session, term) =>
    api.get("/parents/me/timetable", {
      params: { studentId, session, term },
    }),
  getWardTermResult: (studentId, session, term) =>
    api.get(`/parents/me/wards/${studentId}/results/term`, {
      params: { session, term },
    }),

  getWardSessionResult: (studentId, session) =>
    api.get(`/parents/me/wards/${studentId}/results/session`, {
      params: { session },
    }),

  getWardAttendance: (studentId, session, term) =>
    api.get(`/parents/me/wards/${studentId}/attendance`, {
      params: { session, term },
    }),

  getWardAttendanceList: (studentId, session, term) =>
    api.get(`/parents/me/wards/${studentId}/attendance`, {
      params: { session, term },
    }),

  getWardFees: (studentId, session, term) =>
    api.get(`/parents/me/wards/${studentId}/fees`, {
      params: { session, term },
    }),

  getWardPaymentHistory: (studentId, session) =>
    api.get(`/parents/me/wards/${studentId}/fees/payments`, {
      params: session ? { session } : {},
    }),
};

export const eventAPI = {
  getAllEvents: () => api.get("/events"),
  getUpcomingEvents: () => api.get("/events/upcoming"),
  getEventById: (id) => api.get(`/events/${id}`),
  getEventsByDateRange: (startDate, endDate) =>
    api.get(`/events/date-range?startDate=${startDate}&endDate=${endDate}`),
  createEvent: (eventData) => api.post("/events", eventData),
  updateEvent: (id, eventData) => api.put(`/events/${id}`, eventData),
  deleteEvent: (id) => api.delete(`/events/${id}`),
};

export default api;

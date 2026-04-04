import axios from "axios";
import { toast } from "react-toastify";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:8443/api";

/* ================================
   TOKEN STORAGE
================================ */
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

const getStoredAccessToken = () => {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
};

const getStoredRefreshToken = () => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};

const setStoredAccessToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  } catch {
    // ignore storage issues
  }
};

const setStoredRefreshToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch {
    // ignore storage issues
  }
};

const setStoredUser = (user) => {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // ignore storage issues
  }
};

/* ================================
   AXIOS INSTANCE
================================ */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];
let hasRedirectedToLogin = false;

const processQueue = (error = null, newToken = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(newToken);
    }
  });
  failedQueue = [];
};

const clearClientSession = () => {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("token");
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.clear();
  } catch {
    // ignore storage issues
  }
};

const getCurrentPath = () => {
  if (typeof window === "undefined") return "";
  return window.location.pathname || "";
};

const isLoginLikePath = () => {
  const path = getCurrentPath();
  return (
    path === "/login" ||
    path === "/register" ||
    path === "/forgot-password" ||
    path === "/reset-password"
  );
};

const redirectToLoginOnce = (
  message = "Session expired. Please login again.",
) => {
  clearClientSession();

  if (isLoginLikePath()) {
    if (!hasRedirectedToLogin) {
      hasRedirectedToLogin = true;
      toast.error(message);
    }
    return;
  }

  if (!hasRedirectedToLogin) {
    hasRedirectedToLogin = true;
    toast.error(message);

    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    }, 300);
  }
};

const isAuthRoute = (url = "") => {
  const value = String(url || "");
  return (
    value.includes("/auth/login") ||
    value.includes("/auth/register") ||
    value.includes("/auth/logout") ||
    value.includes("/auth/refresh-token") ||
    value.includes("/users/login") ||
    value.includes("/users/register")
  );
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "An unexpected error occurred";

/* ================================
   REQUEST INTERCEPTOR
================================ */
api.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken();
    const requestUrl = String(config.url || "");

    if (
      token &&
      !requestUrl.includes("/auth/login") &&
      !requestUrl.includes("/auth/register") &&
      !requestUrl.includes("/auth/refresh-token") &&
      !requestUrl.includes("/users/login") &&
      !requestUrl.includes("/users/register")
    ) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        `Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`,
      );
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/* ================================
   RESPONSE INTERCEPTOR
================================ */
api.interceptors.response.use(
  (response) => {
    if (response?.config?.url && isAuthRoute(response.config.url)) {
      hasRedirectedToLogin = false;
    }

    const newAccessToken = response?.data?.accessToken;
    const newRefreshToken = response?.data?.refreshToken;
    const user = response?.data?.user;

    if (newAccessToken) {
      setStoredAccessToken(newAccessToken);
    }

    if (newRefreshToken) {
      setStoredRefreshToken(newRefreshToken);
    }

    if (user) {
      setStoredUser(user);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const message = getErrorMessage(error);
    const lowerMessage = String(message).toLowerCase();
    const requestUrl = String(originalRequest.url || "");

    const refreshTokenInvalid =
      lowerMessage.includes("invalid refresh token") ||
      lowerMessage.includes("refresh token expired") ||
      lowerMessage.includes("expired refresh token") ||
      lowerMessage.includes("no refresh token");

    const isRefreshRequest =
      requestUrl.includes("/auth/refresh-token") ||
      requestUrl.includes("/users/refresh-token");

    const isLoginRequest =
      requestUrl.includes("/auth/login") || requestUrl.includes("/users/login");

    const isRegisterRequest =
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/users/register");

    if (isLoginRequest || isRegisterRequest) {
      return Promise.reject(error);
    }

    if (isRefreshRequest) {
      redirectToLoginOnce("Your session has expired. Please login again.");
      return Promise.reject(error);
    }

    if (
      (status === 401 || status === 403) &&
      !originalRequest._retry &&
      !isAuthRoute(requestUrl)
    ) {
      if (refreshTokenInvalid) {
        redirectToLoginOnce("Your session has expired. Please login again.");
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              if (token) {
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getStoredRefreshToken();

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const refreshResponse = await api.post("/auth/refresh-token", {
          refreshToken,
        });

        const newAccessToken = refreshResponse?.data?.accessToken;
        const newRefreshToken = refreshResponse?.data?.refreshToken;
        const refreshedUser = refreshResponse?.data?.user;

        if (!newAccessToken) {
          throw new Error("No access token returned during refresh");
        }

        setStoredAccessToken(newAccessToken);

        if (newRefreshToken) {
          setStoredRefreshToken(newRefreshToken);
        }

        if (refreshedUser) {
          setStoredUser(refreshedUser);
        }

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        isRefreshing = false;
        processQueue(null, newAccessToken);

        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        redirectToLoginOnce("Your session has expired. Please login again.");
        return Promise.reject(refreshError);
      }
    }

    if (refreshTokenInvalid) {
      redirectToLoginOnce("Your session has expired. Please login again.");
      return Promise.reject(error);
    }

    if (status === 403) {
      if (!isLoginLikePath()) {
        toast.error("You don't have permission to access this resource");
      }
      return Promise.reject(error);
    }

    if (!hasRedirectedToLogin && !isLoginLikePath()) {
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

export { api, sendData };
export default api;

/* ================================
   SUPPORT API
================================ */
export const supportAPI = {
  createTicket: (data) => api.post("/support/tickets", data),
  getMyTickets: () => api.get("/support/tickets/my"),
  getAllTickets: () => api.get("/support/tickets"),
  getTicketDetails: (ticketId) => api.get(`/support/tickets/${ticketId}`),
  sendMessage: (ticketId, data) =>
    api.post(`/support/tickets/${ticketId}/messages`, data),
  closeTicket: (ticketId) => api.patch(`/support/tickets/${ticketId}/close`),
  reopenTicket: (ticketId) => api.patch(`/support/tickets/${ticketId}/reopen`),
};

/* ================================
   AUTH HELPERS
================================ */
export const setAuthToken = (accessToken, refreshToken, user) => {
  setStoredAccessToken(accessToken);
  setStoredRefreshToken(refreshToken);
  setStoredUser(user);
  hasRedirectedToLogin = false;
};

export const clearAuthToken = () => {
  clearClientSession();
  hasRedirectedToLogin = false;
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
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
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response;
  },

  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearClientSession();
      hasRedirectedToLogin = false;
    }
  },

  refreshToken: () => {
    const refreshToken = getStoredRefreshToken();
    return api.post("/auth/refresh-token", { refreshToken });
  },

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

  searchStudents: (term) => api.get("/students/search", { params: { term } }),

  getStudentsByClassId: (classId) => api.get(`/students/class/id/${classId}`),

  getStatistics: () => api.get("/students/statistics"),
};

export const attendanceAPI = {
  markAttendance: (studentId, date, session, term, status, remarks = "") =>
    api.post(`/attendance/student/${studentId}`, null, {
      params: { date, session, term, status, remarks },
    }),
  getSchoolDailyStatistics: (date, session, term) =>
    api.get(`/attendance/school/daily-statistics`, {
      params: { date, session, term },
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

  getStudentSessionSummary: (studentId, session) =>
    api.get(`/attendance/student/${studentId}/session`, {
      params: { session },
    }),

  getMyAttendance: (session, term) =>
    api.get(`/attendance/me/term`, {
      params: { session, term },
    }),

  getMyAttendanceSummary: (session, term) =>
    api.get(`/attendance/me/summary`, {
      params: { session, term },
    }),

  getClassAttendanceByClassId: (classId, date, session, term) =>
    api.get(`/attendance/class/${classId}`, {
      params: { date, session, term },
    }),

  getClassAttendance: (classId, date, session, term) =>
    api.get(`/attendance/class/${classId}`, {
      params: { date, session, term },
    }),

  getClassTermStatisticsByClassId: (classId, session, term) =>
    api.get(`/attendance/statistics/class/${classId}`, {
      params: { session, term },
    }),

  getSchoolAttendanceStatistics: (session, term) =>
    api.get(`/attendance/statistics/school`, {
      params: { session, term },
    }),

  initializeSchoolDays: (dates, session, term) =>
    api.post(`/attendance/initialize-days`, dates, {
      params: { session, term },
    }),

  calculateAllTermSummaries: (session, term) =>
    api.post(`/attendance/calculate-all`, null, {
      params: { session, term },
    }),
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

  createTeacher: (data) => sendData("post", "/teachers", data),
  updateTeacher: (id, data) => sendData("put", `/teachers/${id}`, data),

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
   RESULT API
================================ */
export const resultAPI = {
  getStudentResults: (studentId, session, term) =>
    api.get(`/results/student/${studentId}`, {
      params: { session, term },
    }),

  getTermResult: (studentId, session, term) =>
    api.get(`/results/student/${studentId}/term`, {
      params: { session, term },
    }),

  getMyTermResult: (session, term) =>
    api.get("/results/me/term", {
      params: { session, term },
    }),

  getAnnualResult: (studentId, session) =>
    api.get(`/results/student/${studentId}/annual`, {
      params: { session },
    }),

  addOrUpdateResultDTO: (payload) =>
    api.post(`/results/student/${payload.studentId}`, payload),

  updateTermAssessment: (studentId, session, term, payload) =>
    api.put(`/results/student/${studentId}/term/assessment`, payload, {
      params: { session, term },
    }),

  signAsClassTeacher: (studentId, session, term) =>
    api.patch(`/results/student/${studentId}/term/sign/class-teacher`, null, {
      params: { session, term },
    }),

  signAsAdmin: (studentId, session, term) =>
    api.patch(`/results/student/${studentId}/term/sign/admin`, null, {
      params: { session, term },
    }),

  setTermPrintable: (studentId, session, term, payload) =>
    api.patch(`/results/student/${studentId}/term/printable`, payload, {
      params: { session, term },
    }),

  setTermPrintableStatus: (
    studentId,
    session,
    term,
    printable,
    printLockMessage = null,
  ) =>
    api.patch(
      `/results/student/${studentId}/term/printable`,
      {
        printable,
        printLockMessage,
      },
      {
        params: { session, term },
      },
    ),

  getSchoolRankings: (session, term) =>
    api.get("/results/rankings/school", {
      params: { session, term },
    }),

  getClassRankings: (classId, session, term) =>
    api.get(`/results/rankings/class/${classId}`, {
      params: { session, term },
    }),

  getArmRankings: (classId, arm, session, term) =>
    api.get(`/results/rankings/class/${classId}`, {
      params: { session, term, arm },
    }),
};

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

  setSessionPrintableStatus: (
    studentId,
    session,
    printable,
    printLockMessage,
  ) =>
    api.patch(
      `/session-results/student/${studentId}/printable`,
      {
        printable,
        printLockMessage,
      },
      {
        params: { session },
      },
    ),
};

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

/* compatibility alias expected by EventManagement/Home */
export const eventAPI = {
  getAllEvents: () => api.get("/events"),
  getEvent: (id) => api.get(`/events/${id}`),
  createEvent: (data) => api.post("/events", data),
  updateEvent: (id, data) => api.put(`/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/events/${id}`),

  getUpcomingEvents: () => api.get("/events/upcoming"),

  getEventsByDateRange: (startDate, endDate) =>
    api.get("/events/date-range", {
      params: { startDate, endDate },
    }),
};

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

  downloadFeeReportPdf: (session, term) =>
    api.get("/fees/report/pdf", {
      params: { session, term },
      responseType: "blob",
    }),

  downloadFeeReportExcel: (session, term) =>
    api.get("/fees/report/excel", {
      params: { session, term },
      responseType: "blob",
    }),

  downloadReceipt: (feeId) =>
    api.get(`/fees/${feeId}/receipt`, {
      responseType: "blob",
    }),
};

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

/* compatibility alias expected by many components */
export const parentPortalAPI = {
  // ===== CORE =====
  getMyProfile: () => api.get("/parents/me"),

  getMyWards: () => api.get("/parents/me/wards"),

  // ===== ATTENDANCE =====
  getWardAttendance: (studentId, session, term) =>
    api.get(`/attendance/student/${studentId}/summary`, {
      params: { session, term },
    }),

  // ===== RESULTS =====
  getWardSessionResult: (studentId, session) =>
    api.get(`/session-results/student/${studentId}`, {
      params: { session },
    }),

  getWardTermResult: (studentId, session, term) =>
    api.get(`/results/student/${studentId}/term`, {
      params: { session, term },
    }),

  // ===== FEES =====
  getWardFees: (studentId, session, term) =>
    api.get(`/fees/student/${studentId}`, {
      params: { session, term },
    }),

  // ===== TIMETABLE =====
  getWardTimetable: (studentId) => api.get(`/timetable/student/${studentId}`),
};

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
  uploadSignature: (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post("/users/upload-signature", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  refreshMe: () => api.get("/users/me"),
  searchUsers: (term) => api.get("/users/search", { params: { term } }),
  getUsersByRole: (role) => api.get(`/users/role/${role}`),
  getUserStatistics: () => api.get("/users/statistics"),
  register: (data) => api.post("/users/register", data),
  login: (credentials) => api.post("/users/login", credentials),
};

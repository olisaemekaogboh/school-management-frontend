// services/attendanceService.js
import { attendanceAPI } from "./api";

class AttendanceService {
  // Mark attendance for a single student
  async markAttendance(studentId, date, session, term, status, remarks = "") {
    try {
      const response = await attendanceAPI.markAttendance(
        studentId,
        date,
        session,
        term,
        status,
        remarks,
      );
      return response.data;
    } catch (error) {
      console.error("Error marking attendance:", error);
      throw error;
    }
  }

  // Mark bulk attendance for multiple students
  async markBulkAttendance(studentIds, date, session, term, status) {
    try {
      const response = await attendanceAPI.markBulkAttendance(
        studentIds,
        date,
        session,
        term,
        status,
      );
      return response.data;
    } catch (error) {
      console.error("Error marking bulk attendance:", error);
      throw error;
    }
  }

  // Get student attendance for a specific date
  async getStudentAttendance(studentId, date, session, term) {
    try {
      const response = await attendanceAPI.getStudentAttendance(
        studentId,
        date,
        session,
        term,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching student attendance:", error);
      throw error;
    }
  }

  // Get student's term attendance
  async getStudentTermAttendance(studentId, session, term) {
    try {
      const response = await attendanceAPI.getStudentTermAttendance(
        studentId,
        session,
        term,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching student term attendance:", error);
      throw error;
    }
  }

  // Get student's term summary
  async getStudentTermSummary(studentId, session, term) {
    try {
      const response = await attendanceAPI.getStudentTermSummary(
        studentId,
        session,
        term,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching student term summary:", error);
      throw error;
    }
  }

  // Get student's session summary
  async getStudentSessionSummary(studentId, session) {
    try {
      const response = await attendanceAPI.getStudentSessionSummary(
        studentId,
        session,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching student session summary:", error);
      throw error;
    }
  }

  // Get current user's attendance (for students)
  async getMyAttendance(session, term) {
    try {
      const response = await attendanceAPI.getMyAttendance(session, term);
      return response.data;
    } catch (error) {
      console.error("Error fetching my attendance:", error);
      throw error;
    }
  }

  // Get current user's attendance summary
  async getMyAttendanceSummary(session, term) {
    try {
      const response = await attendanceAPI.getMyAttendanceSummary(
        session,
        term,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching my attendance summary:", error);
      throw error;
    }
  }

  // Get class attendance with arm
  async getClassAttendance(className, arm, date, session, term) {
    try {
      const response = await attendanceAPI.getClassAttendanceWithArm(
        className,
        arm,
        date,
        session,
        term,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching class attendance:", error);
      throw error;
    }
  }

  // Get class term statistics
  async getClassStatistics(className, arm, session, term) {
    try {
      const response = await attendanceAPI.getClassTermStatistics(
        className,
        arm,
        session,
        term,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching class statistics:", error);
      throw error;
    }
  }

  // Get school attendance statistics
  async getSchoolStatistics(session, term) {
    try {
      const response = await attendanceAPI.getSchoolAttendanceStatistics(
        session,
        term,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching school statistics:", error);
      throw error;
    }
  }

  // Debug attendance
  async debugAttendance(className, date, session, term, arm = null) {
    try {
      const response = await attendanceAPI.debugAttendance(
        className,
        date,
        session,
        term,
        arm,
      );
      return response.data;
    } catch (error) {
      console.error("Error debugging attendance:", error);
      throw error;
    }
  }
}

export default new AttendanceService();

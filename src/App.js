// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Layout Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Auth Components
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Profile from "./components/Profile";
import Settings from "./components/Settings";

// Dashboard Components
import Dashboard from "./components/Dashboard";
import StudentDashboard from "./components/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import ParentDashboard from "./components/ParentDashboard";

// User Management
import UserManagement from "./components/UserManagement";

// Student Management
import StudentManagement from "./components/StudentManagement";
import StudentForm from "./components/StudentForm";
import StudentDetails from "./components/StudentDetails";
import StudentPromotion from "./components/StudentPromotion";

// Teacher Management
import TeacherManagement from "./components/TeacherManagement";
import TeacherForm from "./components/TeacherForm";
import TeacherDetails from "./components/TeacherDetails";

// Class Management
import ClassManagement from "./components/ClassManagement";
import ClassDetails from "./components/ClassDetails";
import Timetable from "./components/Timetable";
import SubjectManagement from "./components/SubjectManagement";

// Academic Management
import ResultManagement from "./components/ResultManagement";
import SessionResult from "./components/SessionResult";
import AttendanceManagement from "./components/AttendanceManagement";

// Fee Management
import FeeManagement from "./components/FeeManagement";
import FeePayments from "./components/FeePayments";
import FeeDefaulters from "./components/FeeDefaulters";

// Announcement Management
import AnnouncementManager from "./components/AnnouncementManager";
import AnnouncementForm from "./components/AnnouncementForm";
import AnnouncementDetails from "./components/AnnouncementDetails";

// Library Management
import LibraryManagement from "./components/LibraryManagement";
import BookManagement from "./components/BookManagement";
import BorrowingManagement from "./components/BorrowingManagement";

// Transport Management
import TransportManagement from "./components/TransportManagement";
import RouteManagement from "./components/RouteManagement";
import BusTracking from "./components/BusTracking";

// ===== PARENT MANAGEMENT IMPORTS =====
import ParentManagement from "./components/parent/ParentManagement";
import ParentRegistration from "./components/parent/ParentRegistration";
import ParentDetails from "./components/parent/ParentDetails";
import ParentEmailVerification from "./components/parent/ParentEmailVerification";
// =====================================

// Parent Portal
import ParentPortal from "./components/ParentPortal";
import ParentProfile from "./components/ParentProfile";

// Reports
import Reports from "./components/Reports";
import ReportGenerator from "./components/ReportGenerator";

// Search
import Search from "./components/Search";

// Error Components
import PageNotFound from "./components/PageNotFound";
import Unauthorized from "./components/Unauthorized";

// Protected Route Component
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Context
import { AuthProvider } from "./contexts/AuthContext";

// ===== PARENT CONTEXT IMPORT =====
import { ParentProvider } from "./contexts/ParentContext";
// ================================

import "./App.css";
import TeacherRegistrationCompletion from "./components/TeacherRegistrationCompletion";

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Wrap with ParentProvider to use parent hooks */}
        <ParentProvider>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <div className="content-wrapper">
                <Routes>
                  {/* ========== PUBLIC ROUTES ========== */}
                  <Route path="/login" element={<Login />} />

                  <Route
                    path="/complete-teacher-registration"
                    element={<TeacherRegistrationCompletion />}
                  />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  {/* FIXED: Handle both token formats for password reset */}
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route
                    path="/reset-password/:token"
                    element={<ResetPassword />}
                  />

                  {/* Public Parent Email Verification */}
                  <Route
                    path="/verify-parent"
                    element={<ParentEmailVerification />}
                  />

                  {/* ========== PROTECTED ROUTES ========== */}

                  {/* Dashboard */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Role-Specific Dashboards */}
                  <Route
                    path="/student-dashboard"
                    element={
                      <ProtectedRoute requiredRole="STUDENT">
                        <StudentDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teacher-dashboard"
                    element={
                      <ProtectedRoute requiredRole="TEACHER">
                        <TeacherDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/parent-dashboard"
                    element={
                      <ProtectedRoute requiredRole="PARENT">
                        <ParentDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* ===== USER MANAGEMENT ===== */}
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <UserManagement />
                      </ProtectedRoute>
                    }
                  />

                  {/* ===== PARENT MANAGEMENT ROUTES ===== */}
                  <Route
                    path="/parents"
                    element={
                      <ProtectedRoute requiredRole={["ADMIN", "TEACHER"]}>
                        <ParentManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/parents/register"
                    element={
                      <ProtectedRoute requiredRole={["ADMIN", "TEACHER"]}>
                        <ParentRegistration />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/parents/edit/:id"
                    element={
                      <ProtectedRoute requiredRole={["ADMIN", "TEACHER"]}>
                        <ParentRegistration />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/parents/:id"
                    element={
                      <ProtectedRoute
                        requiredRole={["ADMIN", "TEACHER", "PARENT"]}
                      >
                        <ParentDetails />
                      </ProtectedRoute>
                    }
                  />

                  {/* ===== STUDENT MANAGEMENT ===== */}
                  <Route
                    path="/students"
                    element={
                      <ProtectedRoute>
                        <StudentManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/students/new"
                    element={
                      <ProtectedRoute>
                        <StudentForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/students/edit/:id"
                    element={
                      <ProtectedRoute>
                        <StudentForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/students/view/:id"
                    element={
                      <ProtectedRoute>
                        <StudentDetails />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/students/promotion"
                    element={
                      <ProtectedRoute>
                        <StudentPromotion />
                      </ProtectedRoute>
                    }
                  />

                  {/* ===== TEACHER MANAGEMENT ===== */}
                  <Route
                    path="/teachers"
                    element={
                      <ProtectedRoute requiredRole={["ADMIN", "TEACHER"]}>
                        <TeacherManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teachers/new"
                    element={
                      <ProtectedRoute requiredRole={["ADMIN"]}>
                        <TeacherForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teachers/edit/:id"
                    element={
                      <ProtectedRoute requiredRole={["ADMIN"]}>
                        <TeacherForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teachers/view/:id"
                    element={
                      <ProtectedRoute requiredRole={["ADMIN", "TEACHER"]}>
                        <TeacherDetails />
                      </ProtectedRoute>
                    }
                  />

                  {/* ===== CLASS MANAGEMENT ===== */}
                  <Route
                    path="/classes"
                    element={
                      <ProtectedRoute>
                        <ClassManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/classes/:id"
                    element={
                      <ProtectedRoute>
                        <ClassDetails />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/timetable"
                    element={
                      <ProtectedRoute>
                        <Timetable />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/subjects"
                    element={
                      <ProtectedRoute>
                        <SubjectManagement />
                      </ProtectedRoute>
                    }
                  />

                  {/* ===== ACADEMIC MANAGEMENT ===== */}
                  <Route
                    path="/results"
                    element={
                      <ProtectedRoute>
                        <ResultManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/session-results"
                    element={
                      <ProtectedRoute>
                        <SessionResult />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/attendance"
                    element={
                      <ProtectedRoute>
                        <AttendanceManagement />
                      </ProtectedRoute>
                    }
                  />

                  {/* ===== FEE MANAGEMENT ===== */}
                  <Route
                    path="/fees"
                    element={
                      <ProtectedRoute>
                        <FeeManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/fees/payments"
                    element={
                      <ProtectedRoute>
                        <FeePayments />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/fees/defaulters"
                    element={
                      <ProtectedRoute>
                        <FeeDefaulters />
                      </ProtectedRoute>
                    }
                  />

                  {/* ===== ANNOUNCEMENT MANAGEMENT ===== */}
                  <Route
                    path="/announcements"
                    element={
                      <ProtectedRoute>
                        <AnnouncementManager />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/announcements/new"
                    element={
                      <ProtectedRoute>
                        <AnnouncementForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/announcements/edit/:id"
                    element={
                      <ProtectedRoute>
                        <AnnouncementForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/announcements/:id"
                    element={
                      <ProtectedRoute>
                        <AnnouncementDetails />
                      </ProtectedRoute>
                    }
                  />

                  {/* ===== LIBRARY MANAGEMENT ===== */}
                  <Route
                    path="/library"
                    element={
                      <ProtectedRoute>
                        <LibraryManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/library/books"
                    element={
                      <ProtectedRoute>
                        <BookManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/library/borrowings"
                    element={
                      <ProtectedRoute>
                        <BorrowingManagement />
                      </ProtectedRoute>
                    }
                  />

                  {/* ===== TRANSPORT MANAGEMENT ===== */}
                  <Route
                    path="/transport"
                    element={
                      <ProtectedRoute>
                        <TransportManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/transport/routes"
                    element={
                      <ProtectedRoute>
                        <RouteManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/transport/tracking"
                    element={
                      <ProtectedRoute>
                        <BusTracking />
                      </ProtectedRoute>
                    }
                  />

                  {/* ===== PARENT PORTAL ===== */}
                  <Route
                    path="/parent"
                    element={
                      <ProtectedRoute>
                        <ParentPortal />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/parent/profile"
                    element={
                      <ProtectedRoute>
                        <ParentProfile />
                      </ProtectedRoute>
                    }
                  />

                  {/* ===== USER PROFILE ===== */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />

                  {/* ===== REPORTS ===== */}
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute>
                        <Reports />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports/generate"
                    element={
                      <ProtectedRoute>
                        <ReportGenerator />
                      </ProtectedRoute>
                    }
                  />

                  {/* ===== SEARCH ===== */}
                  <Route
                    path="/search"
                    element={
                      <ProtectedRoute>
                        <Search />
                      </ProtectedRoute>
                    }
                  />

                  {/* ===== ERROR ROUTES ===== */}
                  <Route path="/401" element={<Unauthorized />} />
                  <Route path="/404" element={<PageNotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </div>
            </main>
            <Footer />
            <ToastContainer position="top-right" autoClose={3000} />
          </div>
        </ParentProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

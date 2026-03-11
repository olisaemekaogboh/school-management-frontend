import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import TeacherRegistrationCompletion from "./components/TeacherRegistrationCompletion";

import ParentEmailVerification from "./components/parent/ParentEmailVerification";
import VerifyStudent from "./components/VerifyStudent";

import Profile from "./components/Profile";
import Settings from "./components/Settings";
import PageNotFound from "./components/PageNotFound";
import Unauthorized from "./components/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";

import { AuthProvider } from "./contexts/AuthContext";
import { ParentProvider } from "./contexts/ParentContext";

import Dashboard from "./components/Dashboard";
import StudentDashboard from "./components/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import ParentDashboard from "./components/ParentDashboard";

import UserManagement from "./components/UserManagement";
import StudentManagement from "./components/StudentManagement";
import StudentForm from "./components/StudentForm";
import StudentDetails from "./components/StudentDetails";
import StudentPromotion from "./components/StudentPromotion";
import TeacherManagement from "./components/TeacherManagement";
import TeacherForm from "./components/TeacherForm";
import TeacherDetails from "./components/TeacherDetails";

import ClassManagement from "./components/ClassManagement";
import ClassManager from "./components/ClassManager";
import ClassDetails from "./components/ClassDetails";
import ClassView from "./components/ClassView";

import Timetable from "./components/Timetable";
import SubjectManagement from "./components/SubjectManagement";
import ResultManagement from "./components/ResultManagement";
import SessionResult from "./components/SessionResult";
import AttendanceManager from "./components/AttendanceManager";
import ResultSheet from "./components/ResultSheet";
import FeeManagement from "./components/FeeManagement";
import FeePayments from "./components/FeePayments";
import FeeDefaulters from "./components/FeeDefaulters";
import AnnouncementManager from "./components/AnnouncementManager";
import AnnouncementForm from "./components/AnnouncementForm";
import AnnouncementDetails from "./components/AnnouncementDetails";
import LibraryManagement from "./components/LibraryManagement";
import BookManagement from "./components/BookManagement";
import BorrowingManagement from "./components/BorrowingManagement";
import TransportManagement from "./components/TransportManagement";
import RouteManagement from "./components/RouteManagement";
import BusTracking from "./components/BusTracking";
import ParentManagement from "./components/parent/ParentManagement";
import ParentRegistration from "./components/parent/ParentRegistration";
import ParentDetails from "./components/parent/ParentDetails";
import Reports from "./components/Reports";
import ReportGenerator from "./components/ReportGenerator";
import Search from "./components/Search";
import SessionManagement from "./components/SessionManagement";

import ParentPortal from "./components/ParentPortal";
import ParentProfile from "./components/ParentProfile";

import "./App.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <ParentProvider>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <div className="content-wrapper">
                <Routes>
                  {/* PUBLIC */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route
                    path="/reset-password/:token"
                    element={<ResetPassword />}
                  />
                  <Route
                    path="/complete-teacher-registration"
                    element={<TeacherRegistrationCompletion />}
                  />
                  <Route
                    path="/verify-parent"
                    element={<ParentEmailVerification />}
                  />
                  <Route path="/verify-student" element={<VerifyStudent />} />

                  {/* ROOT */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* ADMIN */}
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <UserManagement />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/students"
                    element={
                      <ProtectedRoute requiredRole={["ADMIN", "TEACHER"]}>
                        <StudentManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/students/new"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <StudentForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/students/edit/:id"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <StudentForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/students/view/:id"
                    element={
                      <ProtectedRoute requiredRole={["ADMIN", "TEACHER"]}>
                        <StudentDetails />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/students/promotion"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <StudentPromotion />
                      </ProtectedRoute>
                    }
                  />

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
                      <ProtectedRoute requiredRole="ADMIN">
                        <TeacherForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teachers/edit/:id"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
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
                      <ProtectedRoute requiredRole={["ADMIN", "TEACHER"]}>
                        <ParentDetails />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/classes"
                    element={
                      <ProtectedRoute requiredRole={["ADMIN", "TEACHER"]}>
                        <ClassManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/classes/manage"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <ClassManager />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/classes/:id"
                    element={
                      <ProtectedRoute requiredRole={["ADMIN", "TEACHER"]}>
                        <ClassDetails />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/classes/view/:className"
                    element={
                      <ProtectedRoute requiredRole={["ADMIN", "TEACHER"]}>
                        <ClassView />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/subjects"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <SubjectManagement />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/sessions"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <SessionManagement />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/fees"
                    element={
                      <ProtectedRoute
                        requiredRole={["ADMIN", "STUDENT", "PARENT"]}
                      >
                        <FeeManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/fees/payments"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <FeePayments />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/fees/defaulters"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <FeeDefaulters />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/library"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <LibraryManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/library/books"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <BookManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/library/borrowings"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <BorrowingManagement />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/transport"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <TransportManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/transport/routes"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <RouteManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/transport/tracking"
                    element={
                      <ProtectedRoute
                        requiredRole={["ADMIN", "PARENT", "STUDENT"]}
                      >
                        <BusTracking />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/announcements"
                    element={
                      <ProtectedRoute
                        requiredRole={["ADMIN", "TEACHER", "PARENT", "STUDENT"]}
                      >
                        <AnnouncementManager />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/announcements/new"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <AnnouncementForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/announcements/edit/:id"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <AnnouncementForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/announcements/:id"
                    element={
                      <ProtectedRoute
                        requiredRole={["ADMIN", "TEACHER", "PARENT", "STUDENT"]}
                      >
                        <AnnouncementDetails />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <Reports />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports/generate"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <ReportGenerator />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/search"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <Search />
                      </ProtectedRoute>
                    }
                  />

                  {/* TEACHER */}
                  <Route
                    path="/teacher-dashboard"
                    element={
                      <ProtectedRoute requiredRole="TEACHER">
                        <TeacherDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/attendance"
                    element={
                      <ProtectedRoute requiredRole={["ADMIN", "TEACHER"]}>
                        <AttendanceManager />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/results"
                    element={
                      <ProtectedRoute
                        requiredRole={["ADMIN", "TEACHER", "STUDENT", "PARENT"]}
                      >
                        <ResultManagement />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/session-results"
                    element={
                      <ProtectedRoute requiredRole={["ADMIN", "TEACHER"]}>
                        <SessionResult />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/results/:studentId"
                    element={
                      <ProtectedRoute
                        requiredRole={["ADMIN", "TEACHER", "STUDENT", "PARENT"]}
                      >
                        <ResultSheet />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/timetable"
                    element={
                      <ProtectedRoute
                        requiredRole={["ADMIN", "TEACHER", "STUDENT", "PARENT"]}
                      >
                        <Timetable />
                      </ProtectedRoute>
                    }
                  />

                  {/* STUDENT */}
                  <Route
                    path="/student-dashboard"
                    element={
                      <ProtectedRoute requiredRole="STUDENT">
                        <StudentDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* PARENT */}
                  <Route
                    path="/parent-dashboard"
                    element={
                      <ProtectedRoute requiredRole="PARENT">
                        <ParentDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/parent"
                    element={
                      <ProtectedRoute requiredRole="PARENT">
                        <ParentPortal />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/parent/profile"
                    element={
                      <ProtectedRoute requiredRole="PARENT">
                        <ParentProfile />
                      </ProtectedRoute>
                    }
                  />

                  {/* SHARED */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute
                        requiredRole={["ADMIN", "TEACHER", "STUDENT", "PARENT"]}
                      >
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute
                        requiredRole={["ADMIN", "TEACHER", "STUDENT", "PARENT"]}
                      >
                        <Settings />
                      </ProtectedRoute>
                    }
                  />

                  {/* ERRORS */}
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

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { authAPI, setAuthToken, clearAuthToken } from "../services/api";
import { toast } from "react-toastify";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const pickFirst = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return null;
};

const normalizeUser = (rawUser) => {
  if (!rawUser) return null;

  const studentProfile =
    rawUser.student ||
    rawUser.studentProfile ||
    (rawUser.role === "STUDENT" ? rawUser : null);

  const teacherProfile =
    rawUser.teacher ||
    rawUser.teacherProfile ||
    (rawUser.role === "TEACHER" ? rawUser : null);

  const parentProfile =
    rawUser.parent ||
    rawUser.parentProfile ||
    (rawUser.role === "PARENT" ? rawUser : null);

  return {
    ...rawUser,

    role: rawUser.role || null,

    student: rawUser.student || rawUser.studentProfile || null,
    teacher: rawUser.teacher || rawUser.teacherProfile || null,
    parent: rawUser.parent || rawUser.parentProfile || null,

    studentId: pickFirst(
      rawUser.studentId,
      rawUser.student?.id,
      rawUser.studentProfile?.id,
    ),
    parentId: pickFirst(
      rawUser.parentId,
      rawUser.parent?.id,
      rawUser.parentProfile?.id,
    ),
    teacherId: pickFirst(
      rawUser.teacherId,
      rawUser.teacher?.id,
      rawUser.teacherProfile?.id,
    ),

    firstName: pickFirst(
      rawUser.firstName,
      studentProfile?.firstName,
      teacherProfile?.firstName,
      parentProfile?.firstName,
    ),
    lastName: pickFirst(
      rawUser.lastName,
      studentProfile?.lastName,
      teacherProfile?.lastName,
      parentProfile?.lastName,
    ),
    middleName: pickFirst(
      rawUser.middleName,
      studentProfile?.middleName,
      teacherProfile?.middleName,
      parentProfile?.middleName,
    ),
    fullName: pickFirst(
      rawUser.fullName,
      studentProfile?.fullName,
      teacherProfile?.fullName,
      parentProfile?.fullName,
      [
        pickFirst(
          rawUser.firstName,
          studentProfile?.firstName,
          teacherProfile?.firstName,
          parentProfile?.firstName,
        ),
        pickFirst(
          rawUser.middleName,
          studentProfile?.middleName,
          teacherProfile?.middleName,
          parentProfile?.middleName,
        ),
        pickFirst(
          rawUser.lastName,
          studentProfile?.lastName,
          teacherProfile?.lastName,
          parentProfile?.lastName,
        ),
      ]
        .filter(Boolean)
        .join(" "),
    ),

    admissionNumber: pickFirst(
      rawUser.admissionNumber,
      studentProfile?.admissionNumber,
      studentProfile?.admissionNo,
    ),
    studentClass: pickFirst(
      rawUser.studentClass,
      studentProfile?.studentClass,
      studentProfile?.className,
    ),
    classArm: pickFirst(
      rawUser.classArm,
      studentProfile?.classArm,
      studentProfile?.arm,
    ),
    status: pickFirst(
      rawUser.status,
      studentProfile?.status,
      teacherProfile?.status,
      parentProfile?.status,
      "ACTIVE",
    ),
    profilePictureUrl: pickFirst(
      rawUser.profilePictureUrl,
      studentProfile?.profilePictureUrl,
      teacherProfile?.profilePictureUrl,
      parentProfile?.profilePictureUrl,
    ),
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.getCurrentUser();
        const normalizedUser = normalizeUser(response.data);

        setUser(normalizedUser);
        localStorage.setItem("user", JSON.stringify(normalizedUser));
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to load user:", error);

        try {
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            const refreshResponse = await authAPI.refreshToken({
              refreshToken,
            });

            if (refreshResponse.data.accessToken) {
              setAuthToken(
                refreshResponse.data.accessToken,
                refreshResponse.data.refreshToken,
                refreshResponse.data.user,
              );

              const userResponse = await authAPI.getCurrentUser();
              const normalizedUser = normalizeUser(userResponse.data);

              setUser(normalizedUser);
              localStorage.setItem("user", JSON.stringify(normalizedUser));
              setIsAuthenticated(true);
            } else {
              clearAuthToken();
            }
          } else {
            clearAuthToken();
          }
        } catch (refreshError) {
          console.error("Refresh failed:", refreshError);
          clearAuthToken();
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (usernameOrEmail, password) => {
    try {
      const response = await authAPI.login({ usernameOrEmail, password });
      const { accessToken, refreshToken, user: rawUser } = response.data;

      const normalizedUser = normalizeUser(rawUser);

      setAuthToken(accessToken, refreshToken, normalizedUser);
      setUser(normalizedUser);
      setIsAuthenticated(true);

      toast.success("Login successful!");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed");
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { accessToken, refreshToken, user: rawUser } = response.data;

      const normalizedUser = normalizeUser(rawUser);

      setAuthToken(accessToken, refreshToken, normalizedUser);
      setUser(normalizedUser);
      setIsAuthenticated(true);

      toast.success(
        "Registration successful! Welcome to Faith Foundation School.",
      );
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.response?.data?.message || "Registration failed");
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthToken();
      setUser(null);
      setIsAuthenticated(false);
      toast.info("Logged out successfully");
    }
  };

  const updateUser = (updatedUser) => {
    const normalizedUser = normalizeUser(updatedUser);
    setUser(normalizedUser);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      updateUser,
      isAdmin: user?.role === "ADMIN",
      isTeacher: user?.role === "TEACHER",
      isParent: user?.role === "PARENT",
      isStudent: user?.role === "STUDENT",
    }),
    [user, loading, isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

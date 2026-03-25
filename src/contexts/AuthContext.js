import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
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

const normalizeRoleValue = (roleValue) => {
  if (!roleValue) return null;
  return String(roleValue)
    .replace(/^ROLE_/, "")
    .toUpperCase();
};

const normalizeUser = (rawUser) => {
  if (!rawUser) return null;

  const resolvedRole = normalizeRoleValue(
    pickFirst(
      rawUser.role,
      rawUser.user?.role,
      rawUser.userRole,
      rawUser.type,
      Array.isArray(rawUser.authorities) && rawUser.authorities.length > 0
        ? rawUser.authorities[0]?.authority
        : null,
      Array.isArray(rawUser.roles) && rawUser.roles.length > 0
        ? rawUser.roles[0]
        : null,
    ),
  );

  const studentProfile =
    rawUser.student ||
    rawUser.studentProfile ||
    (resolvedRole === "STUDENT" ? rawUser : null);

  const teacherProfile =
    rawUser.teacher ||
    rawUser.teacherProfile ||
    (resolvedRole === "TEACHER" ? rawUser : null);

  const parentProfile =
    rawUser.parent ||
    rawUser.parentProfile ||
    (resolvedRole === "PARENT" ? rawUser : null);

  const firstName = pickFirst(
    rawUser.firstName,
    studentProfile?.firstName,
    teacherProfile?.firstName,
    parentProfile?.firstName,
  );

  const middleName = pickFirst(
    rawUser.middleName,
    studentProfile?.middleName,
    teacherProfile?.middleName,
    parentProfile?.middleName,
  );

  const lastName = pickFirst(
    rawUser.lastName,
    studentProfile?.lastName,
    teacherProfile?.lastName,
    parentProfile?.lastName,
  );

  return {
    ...rawUser,
    role: resolvedRole,
    student: rawUser.student || rawUser.studentProfile || null,
    teacher: rawUser.teacher || rawUser.teacherProfile || null,
    parent: rawUser.parent || rawUser.parentProfile || null,

    studentId: pickFirst(
      rawUser.studentId,
      rawUser.student?.id,
      rawUser.studentProfile?.id,
    ),
    teacherId: pickFirst(
      rawUser.teacherId,
      rawUser.teacher?.id,
      rawUser.teacherProfile?.id,
    ),
    parentId: pickFirst(
      rawUser.parentId,
      rawUser.parent?.id,
      rawUser.parentProfile?.id,
    ),

    firstName,
    middleName,
    lastName,
    fullName: pickFirst(
      rawUser.fullName,
      [firstName, middleName, lastName].filter(Boolean).join(" "),
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
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? normalizeUser(JSON.parse(storedUser)) : null;
    } catch (error) {
      console.error("Failed to parse stored user:", error);
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      try {
        const response = await authAPI.getCurrentUser();
        const normalizedUser = normalizeUser(response.data);

        if (!isMounted) return;

        setUser(normalizedUser);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(normalizedUser));
      } catch (error) {
        console.error("Failed to load current user:", error);

        try {
          const refreshResponse = await authAPI.refreshToken();
          const normalizedRefreshUser = normalizeUser(
            refreshResponse.data?.user,
          );

          if (!isMounted) return;

          if (normalizedRefreshUser) {
            setUser(normalizedRefreshUser);
            setIsAuthenticated(true);
            localStorage.setItem("user", JSON.stringify(normalizedRefreshUser));
          } else {
            const meResponse = await authAPI.getCurrentUser();
            const meUser = normalizeUser(meResponse.data);
            setUser(meUser);
            setIsAuthenticated(true);
            localStorage.setItem("user", JSON.stringify(meUser));
          }
        } catch (refreshError) {
          console.error("Refresh token failed:", refreshError);

          if (!isMounted) return;

          clearAuthToken();
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (usernameOrEmail, password) => {
    try {
      const response = await authAPI.login({ usernameOrEmail, password });
      const normalizedUser = normalizeUser(response.data?.user);

      setAuthToken(null, null, normalizedUser);
      setUser(normalizedUser);
      setIsAuthenticated(true);

      toast.success("Login successful!");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error?.response?.data?.message || "Login failed");
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const normalizedUser = normalizeUser(response.data?.user);

      setAuthToken(null, null, normalizedUser);
      setUser(normalizedUser);
      setIsAuthenticated(true);

      toast.success(
        "Registration successful! Welcome to Faith Foundation School.",
      );
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error?.response?.data?.message || "Registration failed");
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

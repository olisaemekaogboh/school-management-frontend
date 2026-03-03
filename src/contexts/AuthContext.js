// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import {
  authAPI,
  setAuthToken,
  getCurrentUser,
  clearAuthToken,
} from "../services/api";
import { toast } from "react-toastify";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const loadUser = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Get current user from token
        const response = await authAPI.getCurrentUser();
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to load user:", error);
        // Token might be expired, try to refresh
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
              );
              // Retry getting user
              const userResponse = await authAPI.getCurrentUser();
              setUser(userResponse.data);
              setIsAuthenticated(true);
            }
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
      const { accessToken, refreshToken, user } = response.data;

      setAuthToken(accessToken, refreshToken, user);
      setUser(user);
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
      const { accessToken, refreshToken, user } = response.data;

      setAuthToken(accessToken, refreshToken, user);
      setUser(user);
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
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

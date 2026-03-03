// src/services/parentService.js
import api from "./api"; // Import the configured axios instance with interceptors

const parentService = {
  // Create parent
  createParent: async (parentData) => {
    try {
      const response = await api.post("/parents", parentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all parents
  getAllParents: async () => {
    try {
      const response = await api.get("/parents");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get parents with pagination
  getParentsPaginated: async (
    page = 0,
    size = 10,
    sortBy = "id",
    sortDir = "asc",
  ) => {
    try {
      const response = await api.get("/parents/paginated", {
        params: { page, size, sortBy, sortDir },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get parent by ID
  getParentById: async (id) => {
    try {
      const response = await api.get(`/parents/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get parent by email - FIXED: Now uses api instance
  getParentByEmail: async (email) => {
    try {
      const response = await api.get("/parents/by-email", {
        params: { email },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Verify parent email - uses public endpoint
  verifyParentEmail: async (email) => {
    try {
      const response = await api.get("/public/verify-parent/email", {
        params: { email },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          success: false,
          message: `Parent not found with email: ${email}`,
          email: email,
        };
      }
      throw error.response?.data || error.message;
    }
  },

  // Update parent
  updateParent: async (id, parentData) => {
    try {
      const response = await api.put(`/parents/${id}`, parentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete parent
  deleteParent: async (id) => {
    try {
      const response = await api.delete(`/parents/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search parents
  searchParents: async (query) => {
    try {
      const response = await api.get("/parents/search", {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add ward to parent
  addWardToParent: async (parentId, studentId) => {
    try {
      const response = await api.post(
        `/parents/${parentId}/wards/${studentId}`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Remove ward from parent
  removeWardFromParent: async (parentId, studentId) => {
    try {
      const response = await api.delete(
        `/parents/${parentId}/wards/${studentId}`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get parents with no wards
  getParentsWithNoWards: async () => {
    try {
      const response = await api.get("/parents/no-wards");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Bulk create parents
  createMultipleParents: async (parents) => {
    try {
      const response = await api.post("/parents/bulk", parents);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get parent statistics
  getParentStats: async () => {
    try {
      const response = await api.get("/parents/stats");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default parentService;

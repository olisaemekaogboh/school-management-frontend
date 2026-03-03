// src/contexts/ParentContext.js
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import parentService from "../services/ParentService";

const ParentContext = createContext();

const initialState = {
  parents: [],
  selectedParent: null,
  loading: false,
  error: null,
  totalParents: 0,
  stats: null,
  searchResults: [],
  pagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },
};

const parentReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload, error: null };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "SET_PARENTS":
      return { ...state, parents: action.payload, loading: false };
    case "SET_SELECTED_PARENT":
      return { ...state, selectedParent: action.payload, loading: false };
    case "ADD_PARENT":
      return {
        ...state,
        parents: [action.payload, ...state.parents],
        loading: false,
      };
    case "UPDATE_PARENT":
      return {
        ...state,
        parents: state.parents.map((p) =>
          p.id === action.payload.id ? action.payload : p,
        ),
        selectedParent: action.payload,
        loading: false,
      };
    case "DELETE_PARENT":
      return {
        ...state,
        parents: state.parents.filter((p) => p.id !== action.payload),
        loading: false,
      };
    case "SET_STATS":
      return { ...state, stats: action.payload, loading: false };
    case "SET_SEARCH_RESULTS":
      return { ...state, searchResults: action.payload, loading: false };
    case "SET_PAGINATION":
      return {
        ...state,
        parents: action.payload.content,
        pagination: {
          page: action.payload.number,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        },
        loading: false,
      };
    default:
      return state;
  }
};

export const ParentProvider = ({ children }) => {
  const [state, dispatch] = useReducer(parentReducer, initialState);

  const fetchAllParents = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const data = await parentService.getAllParents();
      dispatch({ type: "SET_PARENTS", payload: data });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);

  const fetchParentsPaginated = useCallback(
    async (page = 0, size = 10, sortBy = "id", sortDir = "asc") => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const data = await parentService.getParentsPaginated(
          page,
          size,
          sortBy,
          sortDir,
        );
        dispatch({ type: "SET_PAGINATION", payload: data });
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: error.message });
      }
    },
    [],
  );

  const fetchParentById = useCallback(async (id) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const data = await parentService.getParentById(id);
      dispatch({ type: "SET_SELECTED_PARENT", payload: data });
      return data;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  }, []);

  const verifyEmail = useCallback(async (email) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const result = await parentService.verifyParentEmail(email);
      dispatch({ type: "SET_LOADING", payload: false });
      return result;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  }, []);

  const createParent = useCallback(async (parentData) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const data = await parentService.createParent(parentData);
      dispatch({ type: "ADD_PARENT", payload: data });
      return data;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  }, []);

  const updateParent = useCallback(async (id, parentData) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const data = await parentService.updateParent(id, parentData);
      dispatch({ type: "UPDATE_PARENT", payload: data });
      return data;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  }, []);

  const deleteParent = useCallback(async (id) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      await parentService.deleteParent(id);
      dispatch({ type: "DELETE_PARENT", payload: id });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  }, []);

  const searchParents = useCallback(async (query) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const results = await parentService.searchParents(query);
      dispatch({ type: "SET_SEARCH_RESULTS", payload: results });
      return results;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  }, []);

  const fetchStats = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const stats = await parentService.getParentStats();
      dispatch({ type: "SET_STATS", payload: stats });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);

  const value = {
    ...state,
    fetchAllParents,
    fetchParentsPaginated,
    fetchParentById,
    verifyEmail,
    createParent,
    updateParent,
    deleteParent,
    searchParents,
    fetchStats,
  };

  return (
    <ParentContext.Provider value={value}>{children}</ParentContext.Provider>
  );
};

export const useParent = () => {
  const context = useContext(ParentContext);
  if (!context) {
    throw new Error("useParent must be used within a ParentProvider");
  }
  return context;
};

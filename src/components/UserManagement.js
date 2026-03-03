// src/components/UserManagement.js
import React, { useState, useEffect } from "react";
import { userAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaFilter,
  FaSync,
  FaUserGraduate,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaArrowLeft,
  FaArrowRight,
  FaUserShield,
  FaUserTie,
  FaUser,
  FaUserCircle,
  FaLock,
  FaUnlock,
} from "react-icons/fa";
import moment from "moment";
import "./UserManagement.css";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
    role: "PARENT",
    profilePictureUrl: "",
  });

  const [formErrors, setFormErrors] = useState({});

  const roles = ["ADMIN", "TEACHER", "PARENT", "STUDENT"];

  useEffect(() => {
    fetchUsers();
    fetchStatistics();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterRole, filterStatus, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getAllUsers();
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await userAPI.getUserStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName?.toLowerCase().includes(term) ||
          u.lastName?.toLowerCase().includes(term) ||
          u.username?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.phoneNumber?.includes(term),
      );
    }

    if (filterRole !== "all") {
      filtered = filtered.filter((u) => u.role === filterRole);
    }

    if (filterStatus !== "all") {
      const isActive = filterStatus === "active";
      filtered = filtered.filter((u) => u.active === isActive);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      phoneNumber: "",
      role: "PARENT",
      profilePictureUrl: "",
    });
    setFormErrors({});
    setEditingUser(null);
  };

  const validateForm = () => {
    const errors = {};

    // Username validation
    if (!formData.username) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters long";
    } else if (formData.username.length > 20) {
      errors.username = "Username must be less than 20 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username =
        "Username can only contain letters, numbers, and underscore";
    }

    // Email validation
    if (!formData.email) {
      errors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = "Please enter a valid email address";
      }
    }

    // Password validation
    if (!editingUser && !formData.password) {
      errors.password = "Password is required for new users";
    } else if (formData.password && formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    // Name validation
    if (!formData.firstName) {
      errors.firstName = "First name is required";
    }
    if (!formData.lastName) {
      errors.lastName = "Last name is required";
    }

    // Phone validation (optional but if provided, validate format)
    if (formData.phoneNumber) {
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        errors.phoneNumber = "Please enter a valid phone number";
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Run validation
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Show first error as toast
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }

    setLoading(true);

    try {
      if (editingUser) {
        await userAPI.updateUser(editingUser.id, formData);
        toast.success("User updated successfully");
      } else {
        await userAPI.createUser(formData);
        toast.success("User created successfully");
      }

      resetForm();
      setShowForm(false);
      fetchUsers();
      fetchStatistics();
    } catch (error) {
      console.error("Error saving user:", error);

      // Handle specific error messages from backend
      const errorMessage = error.response?.data?.message;
      if (errorMessage?.includes("Username already exists")) {
        toast.error("Username already taken. Please choose another.");
        setFormErrors({ username: "Username already taken" });
      } else if (errorMessage?.includes("Email already exists")) {
        toast.error("Email already registered. Please use another email.");
        setFormErrors({ email: "Email already registered" });
      } else if (errorMessage?.includes("Validation failed")) {
        // Handle validation errors from backend
        const validationErrors = error.response?.data?.errors;
        if (validationErrors) {
          Object.keys(validationErrors).forEach((field) => {
            toast.error(validationErrors[field]);
            setFormErrors((prev) => ({
              ...prev,
              [field]: validationErrors[field],
            }));
          });
        } else {
          toast.error(errorMessage || "Failed to save user");
        }
      } else {
        toast.error(errorMessage || "Failed to save user");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setLoading(true);

    try {
      await userAPI.deleteUser(userToDelete.id);
      toast.success("User deleted successfully");
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers();
      fetchStatistics();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await userAPI.toggleUserStatus(userId, !currentStatus);
      toast.success(
        `User ${!currentStatus ? "activated" : "deactivated"} successfully`,
      );
      fetchUsers();
      fetchStatistics();
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update user status",
      );
    }
  };

  const handleView = (user) => {
    setViewingUser(user);
    setShowViewModal(true);
  };

  const handleEdit = (user) => {
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
      email: user.email || "",
      password: "",
      phoneNumber: user.phoneNumber || "",
      role: user.role || "PARENT",
      profilePictureUrl: user.profilePictureUrl || "",
    });
    setFormErrors({});
    setEditingUser(user);
    setShowForm(true);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "ADMIN":
        return <FaUserShield className="text-danger" />;
      case "TEACHER":
        return <FaUserTie className="text-primary" />;
      case "PARENT":
        return <FaUsers className="text-success" />;
      case "STUDENT":
        return <FaUserGraduate className="text-warning" />;
      default:
        return <FaUser />;
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      ADMIN: "badge-danger",
      TEACHER: "badge-primary",
      PARENT: "badge-success",
      STUDENT: "badge-warning",
    };
    return badges[role] || "badge-secondary";
  };

  const paginatedUsers = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  return (
    <div className="user-management">
      {/* Header */}
      <div className="header-section">
        <div className="header-top">
          <h1>
            <FaUsers /> User Management
          </h1>
          <div className="header-actions">
            <button
              className="btn-refresh"
              onClick={fetchUsers}
              title="Refresh"
            >
              <FaSync />
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="stats-grid">
            <div className="stat-card primary">
              <FaUsers />
              <div>
                <h3>{statistics.totalUsers || 0}</h3>
                <p>Total Users</p>
              </div>
            </div>
            <div className="stat-card success">
              <FaCheckCircle />
              <div>
                <h3>{statistics.activeUsers || 0}</h3>
                <p>Active Users</p>
              </div>
            </div>
            <div className="stat-card warning">
              <FaExclamationTriangle />
              <div>
                <h3>{statistics.inactiveUsers || 0}</h3>
                <p>Inactive</p>
              </div>
            </div>
            <div className="stat-card info">
              <FaUserShield />
              <div>
                <h3>{Object.keys(statistics.roleCount || {}).length}</h3>
                <p>Roles</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Filter Toggle */}
      <button
        className="mobile-filter-toggle"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
      >
        <FaFilter /> {showMobileFilters ? "Hide Filters" : "Show Filters"}
      </button>

      {/* Filters */}
      <div className={`filters-section ${showMobileFilters ? "show" : ""}`}>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Search</label>
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Search by name, username, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="filter-group">
            <label>&nbsp;</label>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <FaPlus /> Add User
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-section">
        {loading ? (
          <div className="loading-spinner">
            <FaSpinner className="spin" />
            <p>Loading users...</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="user-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers().map((user) => (
                    <React.Fragment key={user.id}>
                      <tr>
                        <td>
                          <button
                            className="btn-expand"
                            onClick={() =>
                              setExpandedRows((prev) =>
                                prev.includes(user.id)
                                  ? prev.filter((id) => id !== user.id)
                                  : [...prev, user.id],
                              )
                            }
                          >
                            {expandedRows.includes(user.id) ? (
                              <FaChevronUp />
                            ) : (
                              <FaChevronDown />
                            )}
                          </button>
                        </td>
                        <td>
                          <strong>{user.username}</strong>
                        </td>
                        <td>
                          <div className="user-name">
                            {getRoleIcon(user.role)}
                            <span>
                              {user.firstName} {user.lastName}
                            </span>
                          </div>
                        </td>
                        <td>
                          <a href={`mailto:${user.email}`}>
                            <FaEnvelope /> {user.email}
                          </a>
                        </td>
                        <td>
                          <span className={`badge ${getRoleBadge(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${user.active ? "badge-success" : "badge-danger"}`}
                          >
                            {user.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          {user.createdAt
                            ? moment(user.createdAt).format("DD/MM/YYYY")
                            : "-"}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-view"
                              onClick={() => handleView(user)}
                              title="View"
                            >
                              <FaEye />
                            </button>
                            <button
                              className="btn-edit"
                              onClick={() => handleEdit(user)}
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className={`btn-${user.active ? "warning" : "success"}`}
                              onClick={() =>
                                handleToggleStatus(user.id, user.active)
                              }
                              title={user.active ? "Deactivate" : "Activate"}
                            >
                              {user.active ? <FaTimes /> : <FaCheckCircle />}
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => {
                                setUserToDelete(user);
                                setShowDeleteModal(true);
                              }}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows.includes(user.id) && (
                        <tr className="expanded-row">
                          <td colSpan="8">
                            <div className="expanded-content">
                              <div className="detail-grid">
                                <div>
                                  <h4>Personal Information</h4>
                                  <p>
                                    <strong>Full Name:</strong> {user.firstName}{" "}
                                    {user.lastName}
                                  </p>
                                  <p>
                                    <strong>Username:</strong> {user.username}
                                  </p>
                                  <p>
                                    <strong>Email:</strong> {user.email}
                                  </p>
                                  <p>
                                    <strong>Phone:</strong>{" "}
                                    {user.phoneNumber || "-"}
                                  </p>
                                </div>
                                <div>
                                  <h4>Account Details</h4>
                                  <p>
                                    <strong>Role:</strong> {user.role}
                                  </p>
                                  <p>
                                    <strong>Status:</strong>{" "}
                                    {user.active ? "Active" : "Inactive"}
                                  </p>
                                  <p>
                                    <strong>Email Verified:</strong>{" "}
                                    {user.emailVerified ? "Yes" : "No"}
                                  </p>
                                  <p>
                                    <strong>Last Login:</strong>{" "}
                                    {user.lastLogin
                                      ? moment(user.lastLogin).format(
                                          "DD/MM/YYYY HH:mm",
                                        )
                                      : "Never"}
                                  </p>
                                </div>
                                <div>
                                  <h4>Linked Accounts</h4>
                                  <p>
                                    <strong>Teacher ID:</strong>{" "}
                                    {user.teacherId || "Not linked"}
                                  </p>
                                  <p>
                                    <strong>Student ID:</strong>{" "}
                                    {user.studentId || "Not linked"}
                                  </p>
                                  <p>
                                    <strong>Parent ID:</strong>{" "}
                                    {user.parentId || "Not linked"}
                                  </p>
                                </div>
                                <div>
                                  <h4>Timestamps</h4>
                                  <p>
                                    <strong>Created:</strong>{" "}
                                    {user.createdAt
                                      ? moment(user.createdAt).format(
                                          "DD/MM/YYYY HH:mm",
                                        )
                                      : "-"}
                                  </p>
                                  <p>
                                    <strong>Updated:</strong>{" "}
                                    {user.updatedAt
                                      ? moment(user.updatedAt).format(
                                          "DD/MM/YYYY HH:mm",
                                        )
                                      : "-"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="8" className="empty-state">
                        <FaUsers size={50} />
                        <h3>No Users Found</h3>
                        <p>Click "Add User" to create your first user.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <FaArrowLeft />
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <FaArrowRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {showForm && (
        <div
          className="modal-overlay"
          onClick={() => {
            resetForm();
            setShowForm(false);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingUser ? <FaEdit /> : <FaPlus />}
                {editingUser ? " Edit User" : " Add New User"}
              </h2>
              <button
                className="modal-close"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={formErrors.firstName ? "error" : ""}
                      required
                    />
                    {formErrors.firstName && (
                      <small className="error-text">
                        {formErrors.firstName}
                      </small>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={formErrors.lastName ? "error" : ""}
                      required
                    />
                    {formErrors.lastName && (
                      <small className="error-text">
                        {formErrors.lastName}
                      </small>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={formErrors.username ? "error" : ""}
                      required
                      minLength="3"
                      maxLength="20"
                      pattern="[a-zA-Z0-9_]+"
                    />
                    {formErrors.username ? (
                      <small className="error-text">
                        {formErrors.username}
                      </small>
                    ) : (
                      <small className="hint-text">
                        3-20 characters (letters, numbers, underscore only)
                      </small>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={formErrors.email ? "error" : ""}
                      required
                      placeholder="user@example.com"
                    />
                    {formErrors.email ? (
                      <small className="error-text">{formErrors.email}</small>
                    ) : (
                      <small className="hint-text">
                        Use a unique email address
                      </small>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Password {!editingUser && "*"}</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={formErrors.password ? "error" : ""}
                      required={!editingUser}
                      minLength="6"
                      placeholder={
                        editingUser
                          ? "Leave blank to keep current"
                          : "Enter password (min 6 characters)"
                      }
                    />
                    {formErrors.password && (
                      <small className="error-text">
                        {formErrors.password}
                      </small>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className={formErrors.phoneNumber ? "error" : ""}
                      placeholder="+2348012345678"
                    />
                    {formErrors.phoneNumber && (
                      <small className="error-text">
                        {formErrors.phoneNumber}
                      </small>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <FaSpinner className="spin" />
                    ) : editingUser ? (
                      "Update User"
                    ) : (
                      "Create User"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && viewingUser && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FaEye /> User Details
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowViewModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="user-profile">
                <div className="profile-header">
                  <div className="profile-icon">
                    <FaUserCircle size={60} />
                  </div>
                  <div className="profile-title">
                    <h2>
                      {viewingUser.firstName} {viewingUser.lastName}
                    </h2>
                    <p className="username">@{viewingUser.username}</p>
                    <span className={`badge ${getRoleBadge(viewingUser.role)}`}>
                      {viewingUser.role}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Account Information</h3>
                  <div className="detail-grid">
                    <div>
                      <label>Email:</label> <span>{viewingUser.email}</span>
                    </div>
                    <div>
                      <label>Phone:</label>{" "}
                      <span>{viewingUser.phoneNumber || "-"}</span>
                    </div>
                    <div>
                      <label>Status:</label>
                      <span
                        className={`status-badge ${viewingUser.active ? "badge-success" : "badge-danger"}`}
                      >
                        {viewingUser.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div>
                      <label>Email Verified:</label>{" "}
                      <span>{viewingUser.emailVerified ? "Yes" : "No"}</span>
                    </div>
                    <div>
                      <label>Last Login:</label>{" "}
                      <span>
                        {viewingUser.lastLogin
                          ? moment(viewingUser.lastLogin).format(
                              "DD/MM/YYYY HH:mm",
                            )
                          : "Never"}
                      </span>
                    </div>
                    <div>
                      <label>Created:</label>{" "}
                      <span>
                        {viewingUser.createdAt
                          ? moment(viewingUser.createdAt).format(
                              "DD/MM/YYYY HH:mm",
                            )
                          : "-"}
                      </span>
                    </div>
                    <div>
                      <label>Updated:</label>{" "}
                      <span>
                        {viewingUser.updatedAt
                          ? moment(viewingUser.updatedAt).format(
                              "DD/MM/YYYY HH:mm",
                            )
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Linked Accounts</h3>
                  <div className="detail-grid">
                    <div>
                      <label>Teacher ID:</label>{" "}
                      <span>{viewingUser.teacherId || "Not linked"}</span>
                    </div>
                    <div>
                      <label>Student ID:</label>{" "}
                      <span>{viewingUser.studentId || "Not linked"}</span>
                    </div>
                    <div>
                      <label>Parent ID:</label>{" "}
                      <span>{viewingUser.parentId || "Not linked"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(viewingUser);
                }}
              >
                <FaEdit /> Edit User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="modal-content small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header danger">
              <h2>
                <FaExclamationTriangle /> Delete User
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <p>
                Are you sure you want to delete user{" "}
                <strong>
                  {userToDelete.firstName} {userToDelete.lastName}
                </strong>
                ?
              </p>
              <p className="text-danger">This action cannot be undone.</p>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? <FaSpinner className="spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;

// src/components/parent/ParentRegistration.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import parentService from "../../services/ParentService";

const ParentRegistration = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    phoneNumber: "",
    alternatePhone: "",
    address: "",
    occupation: "",
    companyName: "",
    officeAddress: "",
    relationship: "FATHER",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  });

  useEffect(() => {
    if (id) {
      fetchParent();
    }
  }, [id]);

  const fetchParent = async () => {
    try {
      setLoading(true);
      const data = await parentService.getParentById(id);
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        middleName: data.middleName || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        alternatePhone: data.alternatePhone || "",
        address: data.address || "",
        occupation: data.occupation || "",
        companyName: data.companyName || "",
        officeAddress: data.officeAddress || "",
        relationship: data.relationship || "FATHER",
        emergencyContactName: data.emergencyContactName || "",
        emergencyContactPhone: data.emergencyContactPhone || "",
        emergencyContactRelationship: data.emergencyContactRelationship || "",
      });
    } catch (error) {
      toast.error(
        "Error fetching parent: " + (error.message || "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        await parentService.updateParent(id, formData);
        toast.success("Parent updated successfully!");
      } else {
        await parentService.createParent(formData);
        toast.success("Parent registered successfully!");
      }
      navigate("/parents");
    } catch (error) {
      toast.error("Error: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col">
          <h2>
            <i className="bi bi-person-plus-fill me-2"></i>
            {id ? "Edit Parent" : "Register New Parent"}
          </h2>
        </div>
      </div>

      <div className="card shadow">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <h5 className="border-bottom pb-2 mb-3">Personal Information</h5>
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">
                  First Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  Last Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Middle Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  Phone Number <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  className="form-control"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Alternate Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Address</label>
                <textarea
                  className="form-control"
                  name="address"
                  rows="2"
                  value={formData.address}
                  onChange={handleChange}
                ></textarea>
              </div>
              <div className="col-md-6">
                <label className="form-label">
                  Relationship <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                  required
                >
                  <option value="FATHER">Father</option>
                  <option value="MOTHER">Mother</option>
                  <option value="GUARDIAN">Guardian</option>
                </select>
              </div>
            </div>

            {/* Occupation Information */}
            <h5 className="border-bottom pb-2 mb-3 mt-4">
              Occupation Information
            </h5>
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">Occupation</label>
                <input
                  type="text"
                  className="form-control"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Office Address</label>
                <input
                  type="text"
                  className="form-control"
                  name="officeAddress"
                  value={formData.officeAddress}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <h5 className="border-bottom pb-2 mb-3 mt-4">Emergency Contact</h5>
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">Contact Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Relationship</label>
                <input
                  type="text"
                  className="form-control"
                  name="emergencyContactRelationship"
                  value={formData.emergencyContactRelationship}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Form Buttons */}
            <div className="row mt-4">
              <div className="col-12">
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  onClick={() => navigate("/parents")}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {id ? "Updating..." : "Registering..."}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      {id ? "Update Parent" : "Register Parent"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ParentRegistration;

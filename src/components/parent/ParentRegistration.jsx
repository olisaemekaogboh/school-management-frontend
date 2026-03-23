// src/components/parent/ParentRegistration.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { toast } from "react-toastify";
import parentService from "../../services/ParentService";
import {
  FaUserPlus,
  FaUserEdit,
  FaSave,
  FaTimes,
  FaSpinner,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBriefcase,
  FaBuilding,
  FaUserFriends,
  FaExclamationTriangle,
} from "react-icons/fa";

const ParentRegistration = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();
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
        t?.parentRegistration?.fetchError ||
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
        toast.success(
          t?.parentRegistration?.updateSuccess ||
            "Parent updated successfully!",
        );
      } else {
        await parentService.createParent(formData);
        toast.success(
          t?.parentRegistration?.registerSuccess ||
            "Parent registered successfully!",
        );
      }
      navigate("/parents");
    } catch (error) {
      toast.error(
        t?.parentRegistration?.error ||
          "Error: " + (error.message || "Unknown error"),
      );
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
        <FaSpinner className="spin" size={40} />
        <p className="ms-3">{t?.common?.loading || "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col">
          <h2>
            {id ? (
              <FaUserEdit className="me-2" />
            ) : (
              <FaUserPlus className="me-2" />
            )}
            {id
              ? t?.parentRegistration?.editParent || "Edit Parent"
              : t?.parentRegistration?.registerNewParent ||
                "Register New Parent"}
          </h2>
        </div>
      </div>

      <div className="card shadow">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <h5 className="border-bottom pb-2 mb-3">
              <FaUser className="me-2" />
              {t?.parentRegistration?.personalInfo || "Personal Information"}
            </h5>
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">
                  {t?.parentRegistration?.firstName || "First Name"}{" "}
                  <span className="text-danger">*</span>
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
                  {t?.parentRegistration?.lastName || "Last Name"}{" "}
                  <span className="text-danger">*</span>
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
                <label className="form-label">
                  {t?.parentRegistration?.middleName || "Middle Name"}
                </label>
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
                  {t?.common?.email || "Email"}{" "}
                  <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaEnvelope />
                  </span>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  {t?.common?.phone || "Phone Number"}{" "}
                  <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaPhone />
                  </span>
                  <input
                    type="tel"
                    className="form-control"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  {t?.parentRegistration?.alternatePhone || "Alternate Phone"}
                </label>
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
                <label className="form-label">
                  {t?.parentRegistration?.address || "Address"}
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaMapMarkerAlt />
                  </span>
                  <textarea
                    className="form-control"
                    name="address"
                    rows="2"
                    value={formData.address}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label">
                  {t?.parentRegistration?.relationship || "Relationship"}{" "}
                  <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                  required
                >
                  <option value="FATHER">
                    {t?.parentRegistration?.father || "Father"}
                  </option>
                  <option value="MOTHER">
                    {t?.parentRegistration?.mother || "Mother"}
                  </option>
                  <option value="GUARDIAN">
                    {t?.parentRegistration?.guardian || "Guardian"}
                  </option>
                </select>
              </div>
            </div>

            {/* Occupation Information */}
            <h5 className="border-bottom pb-2 mb-3 mt-4">
              <FaBriefcase className="me-2" />
              {t?.parentRegistration?.occupationInfo ||
                "Occupation Information"}
            </h5>
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">
                  {t?.parentRegistration?.occupation || "Occupation"}
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  {t?.parentRegistration?.companyName || "Company Name"}
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaBuilding />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  {t?.parentRegistration?.officeAddress || "Office Address"}
                </label>
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
            <h5 className="border-bottom pb-2 mb-3 mt-4">
              <FaExclamationTriangle className="me-2" />
              {t?.parentRegistration?.emergencyContact || "Emergency Contact"}
            </h5>
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">
                  {t?.parentRegistration?.contactName || "Contact Name"}
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  {t?.parentRegistration?.contactPhone || "Contact Phone"}
                </label>
                <input
                  type="tel"
                  className="form-control"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  {t?.parentRegistration?.relationship || "Relationship"}
                </label>
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
                  <FaTimes className="me-2" />
                  {t?.common?.cancel || "Cancel"}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="spin me-2" />
                      {id
                        ? t?.common?.updating || "Updating..."
                        : t?.common?.registering || "Registering..."}
                    </>
                  ) : (
                    <>
                      <FaSave className="me-2" />
                      {id
                        ? t?.common?.update || "Update Parent"
                        : t?.common?.register || "Register Parent"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ParentRegistration;

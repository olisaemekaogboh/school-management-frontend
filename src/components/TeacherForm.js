// src/components/TeacherForm.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { teacherAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBook,
  FaGraduationCap,
  FaIdCard,
  FaMapMarkerAlt,
  FaBriefcase,
  FaCalendarAlt,
  FaVenusMars,
  FaUserTie,
  FaSpinner,
  FaArrowLeft,
  FaSave,
  FaEnvelopeOpenText,
  FaCheckCircle,
  FaTimes,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import "./TeacherForm.css";

function TeacherForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [invitationMethod, setInvitationMethod] = useState("direct"); // "direct" or "invite"
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [qualifications, setQualifications] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    phoneNumber: "",
    alternatePhone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    country: "Nigeria",
    qualification: "",
    yearsOfExperience: "",
    employeeId: "",
    department: "",
    designation: "",
    dateOfJoining: "",
    employmentType: "FULL_TIME",
    specialization: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    profilePicture: null,
  });

  const [formErrors, setFormErrors] = useState({});

  const employmentTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "VISITING"];
  const genders = ["Male", "Female", "Other"];
  const departments = [
    "Science",
    "Arts",
    "Commercial",
    "Technical",
    "Primary",
    "Nursery",
  ];

  useEffect(() => {
    if (id) {
      fetchTeacher(id);
    }
  }, [id]);

  const fetchTeacher = async (teacherId) => {
    setLoading(true);
    try {
      const response = await teacherAPI.getTeacher(teacherId);
      const teacher = response.data;

      setFormData({
        firstName: teacher.firstName || "",
        lastName: teacher.lastName || "",
        middleName: teacher.middleName || "",
        email: teacher.email || "",
        phoneNumber: teacher.phoneNumber || "",
        alternatePhone: teacher.alternatePhone || "",
        dateOfBirth: teacher.dateOfBirth
          ? teacher.dateOfBirth.split("T")[0]
          : "",
        gender: teacher.gender || "",
        address: teacher.address || "",
        city: teacher.city || "",
        state: teacher.state || "",
        country: teacher.country || "Nigeria",
        qualification: teacher.qualification || "",
        yearsOfExperience: teacher.yearsOfExperience || "",
        employeeId: teacher.employeeId || "",
        department: teacher.department || "",
        designation: teacher.designation || "",
        dateOfJoining: teacher.dateOfJoining
          ? teacher.dateOfJoining.split("T")[0]
          : "",
        employmentType: teacher.employmentType || "FULL_TIME",
        specialization: teacher.specialization || "",
        emergencyContactName: teacher.emergencyContactName || "",
        emergencyContactPhone: teacher.emergencyContactPhone || "",
        emergencyContactRelationship:
          teacher.emergencyContactRelationship || "",
      });

      setSubjects(teacher.subjects || []);
      setQualifications(teacher.qualifications || []);
    } catch (error) {
      console.error("Error fetching teacher:", error);
      toast.error("Failed to load teacher data");
      navigate("/teachers");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  const handleAddSubject = () => {
    setSubjects([...subjects, ""]);
  };

  const handleSubjectChange = (index, value) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[index] = value;
    setSubjects(updatedSubjects);
  };

  const handleRemoveSubject = (index) => {
    const updatedSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(updatedSubjects);
  };

  const handleAddQualification = () => {
    setQualifications([...qualifications, ""]);
  };

  const handleQualificationChange = (index, value) => {
    const updatedQualifications = [...qualifications];
    updatedQualifications[index] = value;
    setQualifications(updatedQualifications);
  };

  const handleRemoveQualification = (index) => {
    const updatedQualifications = qualifications.filter((_, i) => i !== index);
    setQualifications(updatedQualifications);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName) errors.firstName = "First name is required";
    if (!formData.lastName) errors.lastName = "Last name is required";
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }
    if (!formData.phoneNumber) errors.phoneNumber = "Phone number is required";
    if (!formData.gender) errors.gender = "Gender is required";
    if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    if (!formData.qualification)
      errors.qualification = "Qualification is required";
    if (!formData.employeeId) errors.employeeId = "Employee ID is required";
    if (!formData.department) errors.department = "Department is required";
    if (!formData.designation) errors.designation = "Designation is required";
    if (!formData.dateOfJoining)
      errors.dateOfJoining = "Date of joining is required";
    if (!formData.emergencyContactName)
      errors.emergencyContactName = "Emergency contact name is required";
    if (!formData.emergencyContactPhone)
      errors.emergencyContactPhone = "Emergency contact phone is required";

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();

      // Append basic info
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== "") {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append subjects and qualifications as JSON
      formDataToSend.append(
        "subjects",
        JSON.stringify(subjects.filter((s) => s.trim() !== "")),
      );
      formDataToSend.append(
        "qualifications",
        JSON.stringify(qualifications.filter((q) => q.trim() !== "")),
      );

      if (id) {
        await teacherAPI.updateTeacher(id, formDataToSend);
        toast.success("Teacher updated successfully!");
      } else {
        await teacherAPI.createTeacher(formDataToSend);
        toast.success("Teacher created successfully!");
      }

      navigate("/teachers");
    } catch (error) {
      console.error("Error saving teacher:", error);
      toast.error(error.response?.data?.message || "Failed to save teacher");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteTeacher = async (e) => {
    e.preventDefault();

    if (!inviteEmail) {
      toast.error("Please enter teacher's email");
      return;
    }

    if (!formData.firstName || !formData.lastName) {
      toast.error("Please enter teacher's name first");
      return;
    }

    setSubmitting(true);

    try {
      const inviteData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: inviteEmail,
        phoneNumber: formData.phoneNumber,
      };

      await teacherAPI.inviteTeacher(inviteData);
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteSent(true);

      setTimeout(() => {
        navigate("/teachers");
      }, 2000);
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error(error.response?.data?.message || "Failed to send invitation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spin" />
        <p>Loading teacher data...</p>
      </div>
    );
  }

  if (inviteSent) {
    return (
      <div className="success-container">
        <FaCheckCircle className="success-icon" />
        <h2>Invitation Sent!</h2>
        <p>An invitation email has been sent to {inviteEmail}</p>
        <p>
          The teacher will complete their registration by setting a password.
        </p>
        <button className="btn-primary" onClick={() => navigate("/teachers")}>
          Return to Teachers
        </button>
      </div>
    );
  }

  return (
    <div className="teacher-form-container">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate("/teachers")}>
          <FaArrowLeft /> Back to Teachers
        </button>
        <h1>{id ? "Edit Teacher" : "Add New Teacher"}</h1>
      </div>

      <div className="form-card">
        {!id && (
          <div className="invitation-method">
            <h3>Registration Method</h3>
            <div className="method-options">
              <label
                className={`method-option ${invitationMethod === "direct" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="invitationMethod"
                  value="direct"
                  checked={invitationMethod === "direct"}
                  onChange={(e) => setInvitationMethod(e.target.value)}
                />
                <FaSave />
                <span>Create account now</span>
                <small>Set password and create account immediately</small>
              </label>

              <label
                className={`method-option ${invitationMethod === "invite" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="invitationMethod"
                  value="invite"
                  checked={invitationMethod === "invite"}
                  onChange={(e) => setInvitationMethod(e.target.value)}
                />
                <FaEnvelopeOpenText />
                <span>Send invitation</span>
                <small>Teacher will set password via email</small>
              </label>
            </div>
          </div>
        )}

        <form
          onSubmit={
            invitationMethod === "invite" && !id
              ? handleInviteTeacher
              : handleSubmit
          }
        >
          <div className="form-section">
            <h3>
              <FaUserTie /> Personal Information
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label>
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={formErrors.firstName ? "error" : ""}
                />
                {formErrors.firstName && (
                  <small className="error-text">{formErrors.firstName}</small>
                )}
              </div>

              <div className="form-group">
                <label>Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={formErrors.lastName ? "error" : ""}
                />
                {formErrors.lastName && (
                  <small className="error-text">{formErrors.lastName}</small>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={formErrors.email ? "error" : ""}
                  readOnly={invitationMethod === "invite" && !id}
                />
                {formErrors.email && (
                  <small className="error-text">{formErrors.email}</small>
                )}
              </div>

              <div className="form-group">
                <label>
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className={formErrors.phoneNumber ? "error" : ""}
                />
                {formErrors.phoneNumber && (
                  <small className="error-text">{formErrors.phoneNumber}</small>
                )}
              </div>

              <div className="form-group">
                <label>Alternate Phone</label>
                <input
                  type="tel"
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Date of Birth <span className="required">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className={formErrors.dateOfBirth ? "error" : ""}
                />
                {formErrors.dateOfBirth && (
                  <small className="error-text">{formErrors.dateOfBirth}</small>
                )}
              </div>

              <div className="form-group">
                <label>
                  Gender <span className="required">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={formErrors.gender ? "error" : ""}
                >
                  <option value="">Select Gender</option>
                  {genders.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                {formErrors.gender && (
                  <small className="error-text">{formErrors.gender}</small>
                )}
              </div>

              <div className="form-group">
                <label>Profile Picture</label>
                <input
                  type="file"
                  name="profilePicture"
                  onChange={handleInputChange}
                  accept="image/*"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>
              <FaMapMarkerAlt /> Address
            </h3>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>
              <FaBriefcase /> Professional Information
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Employee ID <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  className={formErrors.employeeId ? "error" : ""}
                />
                {formErrors.employeeId && (
                  <small className="error-text">{formErrors.employeeId}</small>
                )}
              </div>

              <div className="form-group">
                <label>
                  Department <span className="required">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={formErrors.department ? "error" : ""}
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {formErrors.department && (
                  <small className="error-text">{formErrors.department}</small>
                )}
              </div>

              <div className="form-group">
                <label>
                  Designation <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className={formErrors.designation ? "error" : ""}
                />
                {formErrors.designation && (
                  <small className="error-text">{formErrors.designation}</small>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Qualification <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                  className={formErrors.qualification ? "error" : ""}
                  placeholder="e.g., B.Sc, M.Ed, etc."
                />
                {formErrors.qualification && (
                  <small className="error-text">
                    {formErrors.qualification}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  placeholder="e.g., Mathematics, Physics"
                />
              </div>

              <div className="form-group">
                <label>Years of Experience</label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Date of Joining <span className="required">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfJoining"
                  value={formData.dateOfJoining}
                  onChange={handleInputChange}
                  className={formErrors.dateOfJoining ? "error" : ""}
                />
                {formErrors.dateOfJoining && (
                  <small className="error-text">
                    {formErrors.dateOfJoining}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Employment Type</label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleInputChange}
                >
                  {employmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>
              <FaBook /> Subjects Taught
            </h3>

            {subjects.map((subject, index) => (
              <div key={index} className="array-item">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => handleSubjectChange(index, e.target.value)}
                  placeholder="Subject name"
                />
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => handleRemoveSubject(index)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}

            <button
              type="button"
              className="btn-add"
              onClick={handleAddSubject}
            >
              <FaPlus /> Add Subject
            </button>
          </div>

          <div className="form-section">
            <h3>
              <FaGraduationCap /> Additional Qualifications
            </h3>

            {qualifications.map((qual, index) => (
              <div key={index} className="array-item">
                <input
                  type="text"
                  value={qual}
                  onChange={(e) =>
                    handleQualificationChange(index, e.target.value)
                  }
                  placeholder="Qualification"
                />
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => handleRemoveQualification(index)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}

            <button
              type="button"
              className="btn-add"
              onClick={handleAddQualification}
            >
              <FaPlus /> Add Qualification
            </button>
          </div>

          <div className="form-section">
            <h3>
              <FaPhone /> Emergency Contact
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Contact Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                  className={formErrors.emergencyContactName ? "error" : ""}
                />
                {formErrors.emergencyContactName && (
                  <small className="error-text">
                    {formErrors.emergencyContactName}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>
                  Contact Phone <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleInputChange}
                  className={formErrors.emergencyContactPhone ? "error" : ""}
                />
                {formErrors.emergencyContactPhone && (
                  <small className="error-text">
                    {formErrors.emergencyContactPhone}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Relationship</label>
                <input
                  type="text"
                  name="emergencyContactRelationship"
                  value={formData.emergencyContactRelationship}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {invitationMethod === "invite" && !id && (
            <div className="invite-section">
              <h3>Send Invitation</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    Teacher's Email <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teacher@example.com"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/teachers")}
            >
              <FaTimes /> Cancel
            </button>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <FaSpinner className="spin" /> Processing...
                </>
              ) : (
                <>
                  {invitationMethod === "invite" && !id ? (
                    <FaEnvelopeOpenText />
                  ) : (
                    <FaSave />
                  )}
                  {invitationMethod === "invite" && !id
                    ? "Send Invitation"
                    : id
                      ? "Update Teacher"
                      : "Create Teacher"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TeacherForm;

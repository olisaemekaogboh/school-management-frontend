import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { teacherAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  NIGERIAN_STATES,
  LGA_BY_STATE,
  NATIONALITIES,
  RELIGIONS,
} from "../utils/constants";
import {
  FaUser,
  FaBook,
  FaGraduationCap,
  FaSpinner,
  FaArrowLeft,
  FaSave,
  FaEnvelopeOpenText,
  FaCheckCircle,
  FaTimes,
  FaPlus,
  FaTrash,
  FaUpload,
  FaExclamationTriangle,
  FaUserTie,
  FaMapMarkerAlt,
  FaBriefcase,
} from "react-icons/fa";
import "./TeacherForm.css";

function TeacherForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [invitationMethod, setInvitationMethod] = useState("direct");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState("");
  const [uploadError, setUploadError] = useState("");

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
    yearsOfExperience: 0,
    employeeId: "",
    department: "",
    designation: "",
    dateOfJoining: "",
    employmentType: "FULL_TIME",
    specialization: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    maritalStatus: "",
    numberOfChildren: 0,
    stateOfOrigin: "",
    localGovernmentArea: "",
    nationality: "Nigerian",
    religion: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    pensionId: "",
    taxId: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
    nextOfKinRelationship: "",
    nextOfKinAddress: "",
    biography: "",
  });

  const [formErrors, setFormErrors] = useState({});

  const employmentTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "VISITING"];
  const genders = ["MALE", "FEMALE", "OTHER"];
  const departments = [
    "SCIENCE",
    "ARTS",
    "COMMERCIAL",
    "TECHNICAL",
    "PRIMARY",
    "NURSERY",
  ];
  const maritalStatuses = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"];

  const subjectOptions = [
    "Mathematics",
    "English",
    "Biology",
    "Chemistry",
    "Physics",
    "Economics",
    "Government",
    "Literature",
    "History",
    "Geography",
    "Agricultural Science",
    "Further Mathematics",
    "Computer Science",
    "Civic Education",
    "CRS",
    "Islamic Studies",
    "Yoruba",
    "Igbo",
    "Hausa",
    "French",
    "Physical Education",
    "Basic Science",
    "Basic Technology",
    "Business Studies",
    "Home Economics",
    "Music",
    "Fine Arts",
  ];

  const stateLGAs = useMemo(() => {
    return formData.state ? LGA_BY_STATE[formData.state] || [] : [];
  }, [formData.state]);

  const originLGAs = useMemo(() => {
    return formData.stateOfOrigin
      ? LGA_BY_STATE[formData.stateOfOrigin] || []
      : [];
  }, [formData.stateOfOrigin]);

  const buildProfileImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("https://") || url.startsWith("http://")) return url;

    const base =
      process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, "") ||
      "http://localhost:8080";

    return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
  };

  useEffect(() => {
    if (id) {
      fetchTeacher(id);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (
      formData.localGovernmentArea &&
      formData.stateOfOrigin &&
      !originLGAs.includes(formData.localGovernmentArea)
    ) {
      setFormData((prev) => ({
        ...prev,
        localGovernmentArea: "",
      }));
    }
  }, [formData.stateOfOrigin, formData.localGovernmentArea, originLGAs]);

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
        yearsOfExperience: teacher.yearsOfExperience || 0,
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
        maritalStatus: teacher.maritalStatus || "",
        numberOfChildren: teacher.numberOfChildren || 0,
        stateOfOrigin: teacher.stateOfOrigin || "",
        localGovernmentArea: teacher.localGovernmentArea || "",
        nationality: teacher.nationality || "Nigerian",
        religion: teacher.religion || "",
        bankName: teacher.bankName || "",
        accountNumber: teacher.accountNumber || "",
        accountName: teacher.accountName || "",
        pensionId: teacher.pensionId || "",
        taxId: teacher.taxId || "",
        nextOfKinName: teacher.nextOfKinName || "",
        nextOfKinPhone: teacher.nextOfKinPhone || "",
        nextOfKinRelationship: teacher.nextOfKinRelationship || "",
        nextOfKinAddress: teacher.nextOfKinAddress || "",
        biography: teacher.biography || "",
      });

      setSubjects(teacher.subjects || []);
      setQualifications(teacher.additionalQualifications || []);

      if (teacher.profilePictureUrl) {
        setProfilePicturePreview(
          buildProfileImageUrl(teacher.profilePictureUrl),
        );
      } else {
        setProfilePicturePreview("");
      }
    } catch (error) {
      console.error("Error fetching teacher:", error);
      toast.error(t?.teacherForm?.loadFailed || "Failed to load teacher data");
      navigate("/teachers");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const nextValue = type === "number" ? parseInt(value, 10) || 0 : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: nextValue };
      if (name === "stateOfOrigin") {
        updated.localGovernmentArea = "";
      }
      return updated;
    });

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setUploadError("");

    if (file) {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError(
          t?.teacherForm?.fileTooLarge || "File size exceeds 5MB limit",
        );
        toast.error(
          t?.teacherForm?.fileTooLarge || "File size exceeds 5MB limit",
        );
        e.target.value = null;
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        setUploadError(
          t?.teacherForm?.invalidFileType ||
            "Only JPG, PNG, and GIF images are allowed",
        );
        toast.error(
          t?.teacherForm?.invalidFileType ||
            "Only JPG, PNG, and GIF images are allowed",
        );
        e.target.value = null;
        return;
      }

      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicturePreview(reader.result);
      reader.readAsDataURL(file);
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
    setSubjects(subjects.filter((_, i) => i !== index));
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
    setQualifications(qualifications.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName?.trim())
      errors.firstName =
        t?.teacherForm?.firstNameRequired || "First name is required";
    if (!formData.lastName?.trim())
      errors.lastName =
        t?.teacherForm?.lastNameRequired || "Last name is required";
    if (!formData.email?.trim()) {
      errors.email = t?.teacherForm?.emailRequired || "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t?.teacherForm?.emailInvalid || "Email is invalid";
    }
    if (!formData.phoneNumber?.trim())
      errors.phoneNumber =
        t?.teacherForm?.phoneRequired || "Phone number is required";
    if (!formData.gender)
      errors.gender = t?.teacherForm?.genderRequired || "Gender is required";
    if (!formData.employeeId?.trim())
      errors.employeeId =
        t?.teacherForm?.employeeIdRequired || "Employee ID is required";
    if (!formData.department)
      errors.department =
        t?.teacherForm?.departmentRequired || "Department is required";
    if (!formData.designation?.trim())
      errors.designation =
        t?.teacherForm?.designationRequired || "Designation is required";
    if (!formData.dateOfJoining)
      errors.dateOfJoining =
        t?.teacherForm?.dateOfJoiningRequired || "Date of joining is required";
    if (!formData.emergencyContactName?.trim())
      errors.emergencyContactName =
        t?.teacherForm?.emergencyContactNameRequired ||
        "Emergency contact name is required";
    if (!formData.emergencyContactPhone?.trim())
      errors.emergencyContactPhone =
        t?.teacherForm?.emergencyContactPhoneRequired ||
        "Emergency contact phone is required";

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(
        t?.teacherForm?.fillRequiredFields ||
          "Please fill in all required fields",
      );
      return;
    }

    setSubmitting(true);

    try {
      const teacherData = {
        ...formData,
        subjects: subjects.filter((s) => s && s.trim() !== ""),
        additionalQualifications: qualifications.filter(
          (q) => q && q.trim() !== "",
        ),
        yearsOfExperience: Number(formData.yearsOfExperience) || 0,
        numberOfChildren: Number(formData.numberOfChildren) || 0,
      };

      Object.keys(teacherData).forEach((key) => {
        if (
          teacherData[key] === "" ||
          teacherData[key] === null ||
          teacherData[key] === undefined
        ) {
          delete teacherData[key];
        }
      });

      const formDataToSend = new FormData();
      formDataToSend.append("teacher", JSON.stringify(teacherData));

      if (profilePicture) {
        formDataToSend.append("profilePicture", profilePicture);
      }

      if (id) {
        await teacherAPI.updateTeacher(id, formDataToSend);
        toast.success(
          t?.teacherForm?.updateSuccess || "Teacher updated successfully!",
        );
      } else {
        await teacherAPI.createTeacher(formDataToSend);
        toast.success(
          t?.teacherForm?.createSuccess || "Teacher created successfully!",
        );
      }

      navigate("/teachers");
    } catch (error) {
      console.error("Error saving teacher:", error);
      toast.error(
        error.response?.data?.message ||
          t?.teacherForm?.saveFailed ||
          "Failed to save teacher",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteTeacher = async (e) => {
    e.preventDefault();

    if (!inviteEmail) {
      toast.error(
        t?.teacherForm?.enterTeacherEmail || "Please enter teacher's email",
      );
      return;
    }

    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      toast.error(
        t?.teacherForm?.enterTeacherName || "Please enter teacher's name first",
      );
      return;
    }

    setSubmitting(true);

    try {
      const inviteData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: inviteEmail.trim(),
        phoneNumber: formData.phoneNumber?.trim() || "",
      };

      await teacherAPI.inviteTeacher(inviteData);
      toast.success(
        t?.teacherForm?.invitationSent || `Invitation sent to ${inviteEmail}`,
      );
      setInviteSent(true);

      setTimeout(() => {
        navigate("/teachers");
      }, 2000);
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error(
        error.response?.data?.message ||
          t?.teacherForm?.invitationFailed ||
          "Failed to send invitation",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`loading-container ${darkMode ? "dark-mode" : ""}`}>
        <FaSpinner className="spin" />
        <p>{t?.common?.loading || "Loading teacher data..."}</p>
      </div>
    );
  }

  if (inviteSent) {
    return (
      <div className={`success-container ${darkMode ? "dark-mode" : ""}`}>
        <FaCheckCircle className="success-icon" />
        <h2>{t?.teacherForm?.invitationSentTitle || "Invitation Sent!"}</h2>
        <p>
          {t?.teacherForm?.invitationSentMessage ||
            "An invitation email has been sent to"}{" "}
          {inviteEmail}
        </p>
        <p>
          {t?.teacherForm?.teacherWillComplete ||
            "The teacher will complete their registration by setting a password."}
        </p>
        <button className="btn-primary" onClick={() => navigate("/teachers")}>
          {t?.teacherForm?.returnToTeachers || "Return to Teachers"}
        </button>
      </div>
    );
  }

  return (
    <div className={`teacher-form-container ${darkMode ? "dark-mode" : ""}`}>
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate("/teachers")}>
          <FaArrowLeft /> {t?.common?.back || "Back to Teachers"}
        </button>
        <h1>
          {id
            ? (t?.common?.edit || "Edit") +
              " " +
              (t?.teacherForm?.teacher || "Teacher")
            : (t?.common?.add || "Add") +
              " " +
              (t?.teacherForm?.newTeacher || "New Teacher")}
        </h1>
      </div>

      <div className="form-card">
        {!id && (
          <div className="invitation-method">
            <h3>
              {t?.teacherForm?.registrationMethod || "Registration Method"}
            </h3>
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
                <span>
                  {t?.teacherForm?.createAccountNow || "Create account now"}
                </span>
                <small>
                  {t?.teacherForm?.setPasswordNow ||
                    "Set password and create account immediately"}
                </small>
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
                <span>
                  {t?.teacherForm?.sendInvitation || "Send invitation"}
                </span>
                <small>
                  {t?.teacherForm?.teacherSetsPassword ||
                    "Teacher will set password via email"}
                </small>
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
            <h3>{t?.teacherForm?.profilePicture || "Profile Picture"}</h3>
            <div className="profile-upload">
              <div className="profile-preview">
                {profilePicturePreview ? (
                  <img src={profilePicturePreview} alt="Profile Preview" />
                ) : (
                  <div className="profile-placeholder">
                    <FaUser size={40} />
                  </div>
                )}
              </div>
              <div className="profile-upload-controls">
                <label htmlFor="profilePicture" className="btn-upload">
                  <FaUpload /> {t?.teacherForm?.uploadPhoto || "Upload Photo"}
                </label>
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                {uploadError && (
                  <small className="error-text">
                    <FaExclamationTriangle /> {uploadError}
                  </small>
                )}
                <small>
                  {t?.teacherForm?.maxSize || "Max size: 5MB (JPG, PNG, GIF)"}
                </small>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>
              <FaUserTie />{" "}
              {t?.teacherForm?.personalInformation || "Personal Information"}
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label>
                  {t?.teacherForm?.firstName || "First Name"}{" "}
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={formErrors.firstName ? "error" : ""}
                  placeholder={t?.teacherForm?.firstName || "First Name"}
                />
                {formErrors.firstName && (
                  <small className="error-text">{formErrors.firstName}</small>
                )}
              </div>

              <div className="form-group">
                <label>{t?.teacherForm?.middleName || "Middle Name"}</label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                  placeholder={t?.teacherForm?.middleName || "Middle Name"}
                />
              </div>

              <div className="form-group">
                <label>
                  {t?.teacherForm?.lastName || "Last Name"}{" "}
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={formErrors.lastName ? "error" : ""}
                  placeholder={t?.teacherForm?.lastName || "Last Name"}
                />
                {formErrors.lastName && (
                  <small className="error-text">{formErrors.lastName}</small>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  {t?.common?.email || "Email"}{" "}
                  <span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={formErrors.email ? "error" : ""}
                  placeholder="teacher@school.com"
                  readOnly={invitationMethod === "invite" && !id}
                />
                {formErrors.email && (
                  <small className="error-text">{formErrors.email}</small>
                )}
              </div>

              <div className="form-group">
                <label>
                  {t?.common?.phone || "Phone Number"}{" "}
                  <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className={formErrors.phoneNumber ? "error" : ""}
                  placeholder="08012345678"
                />
                {formErrors.phoneNumber && (
                  <small className="error-text">{formErrors.phoneNumber}</small>
                )}
              </div>

              <div className="form-group">
                <label>
                  {t?.teacherForm?.alternatePhone || "Alternate Phone"}
                </label>
                <input
                  type="tel"
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleInputChange}
                  placeholder="08012345678"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t?.teacherForm?.dateOfBirth || "Date of Birth"}</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>
                  {t?.teacherForm?.gender || "Gender"}{" "}
                  <span className="required">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={formErrors.gender ? "error" : ""}
                >
                  <option value="">
                    {t?.common?.select || "Select Gender"}
                  </option>
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
                <label>
                  {t?.teacherForm?.maritalStatus || "Marital Status"}
                </label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleInputChange}
                >
                  <option value="">{t?.common?.select || "Select"}</option>
                  {maritalStatuses.map((ms) => (
                    <option key={ms} value={ms}>
                      {ms}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  {t?.teacherForm?.numberOfChildren || "Number of Children"}
                </label>
                <input
                  type="number"
                  name="numberOfChildren"
                  value={formData.numberOfChildren}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>{t?.teacherForm?.religion || "Religion"}</label>
                <select
                  name="religion"
                  value={formData.religion}
                  onChange={handleInputChange}
                >
                  <option value="">
                    {t?.common?.select || "Select Religion"}
                  </option>
                  {RELIGIONS.map((religion) => (
                    <option key={religion} value={religion}>
                      {religion}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{t?.teacherForm?.nationality || "Nationality"}</label>
                <select
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                >
                  {NATIONALITIES.map((nationality) => (
                    <option key={nationality} value={nationality}>
                      {nationality}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  {t?.teacherForm?.stateOfOrigin || "State of Origin"}
                </label>
                <select
                  name="stateOfOrigin"
                  value={formData.stateOfOrigin}
                  onChange={handleInputChange}
                >
                  <option value="">
                    {t?.common?.select || "Select State"}
                  </option>
                  {NIGERIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  {t?.teacherForm?.localGovernmentArea ||
                    "Local Government Area"}
                </label>
                <select
                  name="localGovernmentArea"
                  value={formData.localGovernmentArea}
                  onChange={handleInputChange}
                  disabled={!formData.stateOfOrigin}
                >
                  <option value="">{t?.common?.select || "Select LGA"}</option>
                  {originLGAs.map((lga) => (
                    <option key={lga} value={lga}>
                      {lga}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>
              <FaMapMarkerAlt /> {t?.teacherForm?.address || "Address"}
            </h3>

            <div className="form-group full-width">
              <label>{t?.teacherForm?.address || "Address"}</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="2"
                placeholder="Street address"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t?.teacherForm?.city || "City"}</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                />
              </div>

              <div className="form-group">
                <label>{t?.teacherForm?.state || "State/Province"}</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                >
                  <option value="">
                    {t?.common?.select || "Select State"}
                  </option>
                  {NIGERIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{t?.teacherForm?.country || "Country"}</label>
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
              <FaBriefcase />{" "}
              {t?.teacherForm?.employmentDetails || "Employment Details"}
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label>
                  {t?.teacherForm?.employeeId || "Employee ID"}{" "}
                  <span className="required">*</span>
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
                  {t?.teacherForm?.department || "Department"}{" "}
                  <span className="required">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={formErrors.department ? "error" : ""}
                >
                  <option value="">{t?.common?.select || "Select"}</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
                {formErrors.department && (
                  <small className="error-text">{formErrors.department}</small>
                )}
              </div>

              <div className="form-group">
                <label>
                  {t?.teacherForm?.designation || "Designation"}{" "}
                  <span className="required">*</span>
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
                  {t?.teacherForm?.dateOfJoining || "Date of Joining"}{" "}
                  <span className="required">*</span>
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
                <label>
                  {t?.teacherForm?.employmentType || "Employment Type"}
                </label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleInputChange}
                >
                  {employmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  {t?.teacherForm?.yearsOfExperience || "Years of Experience"}
                </label>
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
                  {t?.teacherForm?.qualification || "Qualification"}
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>
                  {t?.teacherForm?.specialization || "Specialization"}
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>
              <FaBook /> {t?.teacherForm?.subjects || "Subjects"}
            </h3>

            {subjects.map((subject, index) => (
              <div className="form-row" key={`subject-${index}`}>
                <div className="form-group">
                  <select
                    value={subject}
                    onChange={(e) => handleSubjectChange(index, e.target.value)}
                  >
                    <option value="">
                      {t?.common?.select || "Select Subject"}
                    </option>
                    {subjectOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn-icon danger"
                  onClick={() => handleRemoveSubject(index)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}

            <button
              type="button"
              className="btn-secondary"
              onClick={handleAddSubject}
            >
              <FaPlus /> {t?.teacherForm?.addSubject || "Add Subject"}
            </button>
          </div>

          <div className="form-section">
            <h3>
              <FaGraduationCap />{" "}
              {t?.teacherForm?.additionalQualifications ||
                "Additional Qualifications"}
            </h3>

            {qualifications.map((qualification, index) => (
              <div className="form-row" key={`qualification-${index}`}>
                <div className="form-group">
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) =>
                      handleQualificationChange(index, e.target.value)
                    }
                    placeholder={
                      t?.teacherForm?.qualification || "Qualification"
                    }
                  />
                </div>
                <button
                  type="button"
                  className="btn-icon danger"
                  onClick={() => handleRemoveQualification(index)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}

            <button
              type="button"
              className="btn-secondary"
              onClick={handleAddQualification}
            >
              <FaPlus />{" "}
              {t?.teacherForm?.addQualification || "Add Qualification"}
            </button>
          </div>

          <div className="form-section">
            <h3>{t?.teacherForm?.emergencyContact || "Emergency Contact"}</h3>

            <div className="form-row">
              <div className="form-group">
                <label>
                  {t?.teacherForm?.emergencyContactName ||
                    "Emergency Contact Name"}{" "}
                  <span className="required">*</span>
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
                  {t?.teacherForm?.emergencyContactPhone ||
                    "Emergency Contact Phone"}{" "}
                  <span className="required">*</span>
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
                <label>
                  {t?.teacherForm?.emergencyContactRelationship ||
                    "Relationship"}
                </label>
                <input
                  type="text"
                  name="emergencyContactRelationship"
                  value={formData.emergencyContactRelationship}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>{t?.teacherForm?.bankDetails || "Bank Details"}</h3>

            <div className="form-row">
              <div className="form-group">
                <label>{t?.teacherForm?.bankName || "Bank Name"}</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="Bank Name"
                />
              </div>

              <div className="form-group">
                <label>
                  {t?.teacherForm?.accountNumber || "Account Number"}
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Account Number"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t?.teacherForm?.accountName || "Account Name"}</label>
                <input
                  type="text"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleInputChange}
                  placeholder="Account Name"
                />
              </div>

              <div className="form-group">
                <label>{t?.teacherForm?.pensionId || "Pension ID"}</label>
                <input
                  type="text"
                  name="pensionId"
                  value={formData.pensionId}
                  onChange={handleInputChange}
                  placeholder="Pension ID"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>{t?.teacherForm?.taxId || "Tax ID"}</label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleInputChange}
                placeholder="Tax ID"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>{t?.teacherForm?.nextOfKin || "Next of Kin"}</h3>

            <div className="form-row">
              <div className="form-group">
                <label>{t?.teacherForm?.name || "Name"}</label>
                <input
                  type="text"
                  name="nextOfKinName"
                  value={formData.nextOfKinName}
                  onChange={handleInputChange}
                  placeholder="Next of Kin Name"
                />
              </div>

              <div className="form-group">
                <label>{t?.common?.phone || "Phone"}</label>
                <input
                  type="tel"
                  name="nextOfKinPhone"
                  value={formData.nextOfKinPhone}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t?.teacherForm?.relationship || "Relationship"}</label>
                <input
                  type="text"
                  name="nextOfKinRelationship"
                  value={formData.nextOfKinRelationship}
                  onChange={handleInputChange}
                  placeholder="e.g. Brother, Sister"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>{t?.teacherForm?.address || "Address"}</label>
              <textarea
                name="nextOfKinAddress"
                value={formData.nextOfKinAddress}
                onChange={handleInputChange}
                rows="2"
                placeholder="Address"
              />
            </div>
          </div>

          {invitationMethod === "invite" && !id && (
            <div className="invite-section">
              <h3>{t?.teacherForm?.sendInvitation || "Send Invitation"}</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    {t?.teacherForm?.teacherEmail || "Teacher's Email"}{" "}
                    <span className="required">*</span>
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
              <FaTimes /> {t?.common?.cancel || "Cancel"}
            </button>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <FaSpinner className="spin" />{" "}
                  {t?.common?.processing || "Processing..."}
                </>
              ) : (
                <>
                  {invitationMethod === "invite" && !id ? (
                    <FaEnvelopeOpenText />
                  ) : (
                    <FaSave />
                  )}
                  {invitationMethod === "invite" && !id
                    ? t?.teacherForm?.sendInvitation || "Send Invitation"
                    : id
                      ? t?.common?.update || "Update"
                      : t?.common?.create || "Create"}
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

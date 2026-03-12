// src/components/StudentForm.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { studentAPI } from "../services/api";
import {
  NIGERIAN_STATES,
  STUDENT_CLASSES,
  CLASS_ARMS,
  GENDERS,
  STUDENT_STATUSES,
  RELIGIONS,
  NATIONALITIES,
  LGA_BY_STATE,
} from "../utils/constants";
import { toast } from "react-toastify";
import {
  FaUpload,
  FaCamera,
  FaTrash,
  FaSave,
  FaArrowLeft,
} from "react-icons/fa";
import moment from "moment";

function StudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    gender: "",
    dateOfBirth: "",
    religion: "",
    nationality: "Nigerian",

    studentClass: "",
    classArm: "",
    status: "ACTIVE",
    previousSchool: "",

    parentName: "",
    parentPhone: "",
    parentEmail: "",

    address: "",
    localGovtArea: "",
    stateOfOrigin: "",

    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",

    excludeFromPromotion: false,
    promotionHoldReason: "",

    profilePicture: null,
    profilePictureUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const [availableLGAs, setAvailableLGAs] = useState([]);
  const [generatedAdmissionNo, setGeneratedAdmissionNo] = useState("");
  const [profilePreview, setProfilePreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      fetchStudent();
    } else {
      generateAdmissionNumber();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (formData.stateOfOrigin) {
      setAvailableLGAs(LGA_BY_STATE[formData.stateOfOrigin] || []);

      if (
        formData.localGovtArea &&
        !LGA_BY_STATE[formData.stateOfOrigin]?.includes(formData.localGovtArea)
      ) {
        setFormData((prev) => ({ ...prev, localGovtArea: "" }));
      }
    } else {
      setAvailableLGAs([]);
    }
  }, [formData.stateOfOrigin, formData.localGovtArea]);

  const buildProfileImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url}`;
  };

  const normalizeClassValue = (value) => {
    if (!value) return "";
    return String(value).trim().replace(/\s+/g, " ");
  };

  const normalizeArmValue = (value) => {
    if (!value) return "";
    return String(value).trim().toUpperCase();
  };

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const response = await studentAPI.getStudentById(id);
      const student = response.data;

      const formattedDate = student.dateOfBirth
        ? moment(student.dateOfBirth).format("YYYY-MM-DD")
        : "";

      setFormData({
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        middleName: student.middleName || "",
        gender: student.gender || "",
        dateOfBirth: formattedDate,
        religion: student.religion || "",
        nationality: student.nationality || "Nigerian",
        studentClass: normalizeClassValue(student.studentClass || ""),
        classArm: normalizeArmValue(student.classArm || ""),
        status: student.status || "ACTIVE",
        previousSchool: student.previousSchool || "",
        parentName: student.parentName || "",
        parentPhone: student.parentPhone || "",
        parentEmail: student.parentEmail || "",
        address: student.address || "",
        localGovtArea: student.localGovtArea || "",
        stateOfOrigin: student.stateOfOrigin || "",
        emergencyContactName: student.emergencyContactName || "",
        emergencyContactPhone: student.emergencyContactPhone || "",
        emergencyContactRelationship:
          student.emergencyContactRelationship || "",
        excludeFromPromotion: student.excludeFromPromotion || false,
        promotionHoldReason: student.promotionHoldReason || "",
        profilePicture: null,
        profilePictureUrl: student.profilePictureUrl || "",
      });

      if (student.profilePictureUrl) {
        setProfilePreview(buildProfileImageUrl(student.profilePictureUrl));
      } else {
        setProfilePreview("");
      }
    } catch (error) {
      console.error("Error fetching student:", error);
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  const generateAdmissionNumber = async () => {
    try {
      const response = await studentAPI.generateAdmissionNumber();
      setGeneratedAdmissionNo(response.data.admissionNumber);
    } catch (error) {
      console.error("Error generating admission number:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let nextValue = type === "checkbox" ? checked : value;

    if (name === "studentClass") {
      nextValue = normalizeClassValue(nextValue);
    }

    if (name === "classArm") {
      nextValue = normalizeArmValue(nextValue);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg"];

    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, GIF)");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      profilePicture: file,
    }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePreview(reader.result);
    };
    reader.readAsDataURL(file);

    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleRemoveImage = () => {
    setProfilePreview("");
    setFormData((prev) => ({
      ...prev,
      profilePicture: null,
      profilePictureUrl: "",
    }));
    setUploadProgress(0);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName?.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName?.trim())
      newErrors.lastName = "Last name is required";
    if (!formData.studentClass) newErrors.studentClass = "Class is required";
    if (!formData.classArm) newErrors.classArm = "Class arm is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.dateOfBirth)
      newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.parentName?.trim())
      newErrors.parentName = "Parent name is required";
    if (!formData.parentPhone?.trim())
      newErrors.parentPhone = "Parent phone is required";
    if (!formData.address?.trim()) newErrors.address = "Address is required";
    if (!formData.localGovtArea)
      newErrors.localGovtArea = "Local Government Area is required";
    if (!formData.stateOfOrigin)
      newErrors.stateOfOrigin = "State of Origin is required";

    if (formData.parentPhone && !/^\d{11}$/.test(formData.parentPhone)) {
      newErrors.parentPhone = "Phone number must be 11 digits";
    }

    if (
      formData.emergencyContactPhone &&
      !/^\d{11}$/.test(formData.emergencyContactPhone)
    ) {
      newErrors.emergencyContactPhone = "Emergency phone must be 11 digits";
    }

    if (
      formData.parentEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)
    ) {
      newErrors.parentEmail = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setLoading(true);

    try {
      const studentData = {
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        middleName: formData.middleName?.trim() || "",
        religion: formData.religion?.trim() || "",
        nationality: formData.nationality?.trim() || "Nigerian",
        studentClass: normalizeClassValue(formData.studentClass),
        classArm: normalizeArmValue(formData.classArm),
        previousSchool: formData.previousSchool?.trim() || "",
        parentName: formData.parentName.trim(),
        parentPhone: formData.parentPhone.trim(),
        parentEmail: formData.parentEmail?.trim() || "",
        address: formData.address.trim(),
        localGovtArea: formData.localGovtArea?.trim() || "",
        stateOfOrigin: formData.stateOfOrigin?.trim() || "",
        emergencyContactName: formData.emergencyContactName?.trim() || "",
        emergencyContactPhone: formData.emergencyContactPhone?.trim() || "",
        emergencyContactRelationship:
          formData.emergencyContactRelationship?.trim() || "",
        promotionHoldReason: formData.excludeFromPromotion
          ? formData.promotionHoldReason?.trim() || ""
          : "",
      };

      delete studentData.profilePicture;
      delete studentData.profilePictureUrl;

      let response;

      if (formData.profilePicture instanceof File) {
        const formDataToSend = new FormData();
        formDataToSend.append("student", JSON.stringify(studentData));
        formDataToSend.append("profilePicture", formData.profilePicture);

        response = isEditMode
          ? await studentAPI.updateStudent(id, formDataToSend)
          : await studentAPI.createStudent(formDataToSend);
      } else {
        response = isEditMode
          ? await studentAPI.updateStudent(id, studentData)
          : await studentAPI.createStudent(studentData);
      }

      if (response.data?.profilePictureUrl) {
        const imageUrl = buildProfileImageUrl(response.data.profilePictureUrl);
        setProfilePreview(imageUrl);
        setFormData((prev) => ({
          ...prev,
          profilePictureUrl: response.data.profilePictureUrl,
        }));
      }

      toast.success(
        isEditMode
          ? "Student updated successfully"
          : "Student registered successfully",
      );

      navigate(isEditMode ? `/students/view/${id}` : "/students");
    } catch (error) {
      console.error("Error saving student:", error);

      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((err) => `${err.field}: ${err.defaultMessage}`)
          .join(", ");
        toast.error(errorMessages);
      } else {
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Failed to save student",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="spinner-container">
        <div className="spinner-border spinner-border-nigerian" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          {isEditMode ? "Edit Student" : "Register New Student"}
        </h2>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate("/students")}
        >
          <FaArrowLeft className="me-2" /> Back to List
        </button>
      </div>

      {!isEditMode && generatedAdmissionNo && (
        <div className="alert alert-info">
          <strong>Generated Admission Number:</strong> {generatedAdmissionNo}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <FaCamera className="me-2" /> Student Photograph
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3 text-center">
                    <div className="mb-3">
                      {profilePreview ? (
                        <div className="position-relative d-inline-block">
                          <img
                            src={profilePreview}
                            alt="Profile Preview"
                            style={{
                              width: "180px",
                              height: "180px",
                              objectFit: "cover",
                              borderRadius: "50%",
                              border: "4px solid #008753",
                              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm position-absolute"
                            style={{
                              top: "10px",
                              right: "10px",
                              borderRadius: "50%",
                              width: "32px",
                              height: "32px",
                            }}
                            onClick={handleRemoveImage}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="d-flex justify-content-center align-items-center bg-light mx-auto"
                          style={{
                            width: "180px",
                            height: "180px",
                            borderRadius: "50%",
                            border: "2px dashed #008753",
                            cursor: "pointer",
                            transition: "all 0.3s",
                          }}
                          onClick={() =>
                            document
                              .getElementById("profilePictureInput")
                              .click()
                          }
                        >
                          <div className="text-center">
                            <FaCamera size={40} color="#008753" />
                            <p className="mt-2 text-muted small">
                              Click to upload
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {formData.profilePicture && (
                      <div className="text-success small mb-2">
                        ✓{" "}
                        {(formData.profilePicture.size / (1024 * 1024)).toFixed(
                          2,
                        )}
                        MB / 5MB
                      </div>
                    )}

                    <input
                      type="file"
                      id="profilePictureInput"
                      className="d-none"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleFileChange}
                    />

                    {!profilePreview && (
                      <button
                        type="button"
                        className="btn btn-outline-nigerian btn-sm"
                        onClick={() =>
                          document.getElementById("profilePictureInput").click()
                        }
                      >
                        <FaUpload className="me-2" />
                        Choose Photo
                      </button>
                    )}

                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div
                        className="progress mt-3"
                        style={{
                          height: "5px",
                          width: "180px",
                          margin: "0 auto",
                        }}
                      >
                        <div
                          className="progress-bar bg-success"
                          role="progressbar"
                          style={{ width: `${uploadProgress}%` }}
                          aria-valuenow={uploadProgress}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        />
                      </div>
                    )}
                  </div>

                  <div className="col-md-9">
                    <div className="alert alert-info">
                      <h6 className="mb-2">Photo Requirements:</h6>
                      <ul className="mb-0 small">
                        <li>
                          Maximum file size: <strong>5MB</strong>
                        </li>
                        <li>
                          Accepted formats: <strong>JPEG, PNG, GIF</strong>
                        </li>
                        <li>
                          Recommended:{" "}
                          <strong>Passport photograph (200x200 pixels)</strong>
                        </li>
                        <li>
                          The photo will appear on student's profile, result
                          sheets, and ID card
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">Personal Information</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">
                  First Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                />
                {errors.firstName && (
                  <div className="invalid-feedback">{errors.firstName}</div>
                )}
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Last Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                />
                {errors.lastName && (
                  <div className="invalid-feedback">{errors.lastName}</div>
                )}
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Middle Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Gender <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.gender ? "is-invalid" : ""}`}
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  {GENDERS.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
                {errors.gender && (
                  <div className="invalid-feedback">{errors.gender}</div>
                )}
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Date of Birth <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className={`form-control ${errors.dateOfBirth ? "is-invalid" : ""}`}
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  max={moment().format("YYYY-MM-DD")}
                />
                {errors.dateOfBirth && (
                  <div className="invalid-feedback">{errors.dateOfBirth}</div>
                )}
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Religion</label>
                <select
                  className="form-select"
                  name="religion"
                  value={formData.religion}
                  onChange={handleChange}
                >
                  <option value="">Select Religion</option>
                  {RELIGIONS.map((religion) => (
                    <option key={religion} value={religion}>
                      {religion}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Nationality</label>
                <select
                  className="form-select"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                >
                  {NATIONALITIES.map((nationality) => (
                    <option key={nationality} value={nationality}>
                      {nationality}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">Academic Information</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Class <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.studentClass ? "is-invalid" : ""}`}
                  name="studentClass"
                  value={formData.studentClass}
                  onChange={handleChange}
                >
                  <option value="">Select Class</option>
                  {STUDENT_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
                {errors.studentClass && (
                  <div className="invalid-feedback">{errors.studentClass}</div>
                )}
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Class Arm <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.classArm ? "is-invalid" : ""}`}
                  name="classArm"
                  value={formData.classArm}
                  onChange={handleChange}
                >
                  <option value="">Select Arm</option>
                  {CLASS_ARMS.map((arm) => (
                    <option key={arm} value={arm}>
                      {arm}
                    </option>
                  ))}
                </select>
                {errors.classArm && (
                  <div className="invalid-feedback">{errors.classArm}</div>
                )}
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  {STUDENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Previous School Attended</label>
                <input
                  type="text"
                  className="form-control"
                  name="previousSchool"
                  value={formData.previousSchool}
                  onChange={handleChange}
                  placeholder="Enter previous school name"
                />
                <small className="text-muted">
                  Leave blank if this is their first school
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">Parent/Guardian Information</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  Parent/Guardian Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.parentName ? "is-invalid" : ""}`}
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                />
                {errors.parentName && (
                  <div className="invalid-feedback">{errors.parentName}</div>
                )}
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label">
                  Phone Number <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  className={`form-control ${errors.parentPhone ? "is-invalid" : ""}`}
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleChange}
                  placeholder="08012345678"
                  maxLength="11"
                />
                {errors.parentPhone && (
                  <div className="invalid-feedback">{errors.parentPhone}</div>
                )}
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className={`form-control ${errors.parentEmail ? "is-invalid" : ""}`}
                  name="parentEmail"
                  value={formData.parentEmail}
                  onChange={handleChange}
                  placeholder="parent@example.com"
                />
                {errors.parentEmail && (
                  <div className="invalid-feedback">{errors.parentEmail}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">Address Information</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  Address <span className="text-danger">*</span>
                </label>
                <textarea
                  className={`form-control ${errors.address ? "is-invalid" : ""}`}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="2"
                />
                {errors.address && (
                  <div className="invalid-feedback">{errors.address}</div>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">
                  State of Origin <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.stateOfOrigin ? "is-invalid" : ""}`}
                  name="stateOfOrigin"
                  value={formData.stateOfOrigin}
                  onChange={handleChange}
                >
                  <option value="">Select State</option>
                  {NIGERIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {errors.stateOfOrigin && (
                  <div className="invalid-feedback">{errors.stateOfOrigin}</div>
                )}
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Local Government Area <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.localGovtArea ? "is-invalid" : ""}`}
                  name="localGovtArea"
                  value={formData.localGovtArea}
                  onChange={handleChange}
                  disabled={!formData.stateOfOrigin}
                >
                  <option value="">Select LGA</option>
                  {availableLGAs.map((lga) => (
                    <option key={lga} value={lga}>
                      {lga}
                    </option>
                  ))}
                </select>
                {errors.localGovtArea && (
                  <div className="invalid-feedback">{errors.localGovtArea}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">Emergency Contact</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Emergency Contact Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Emergency Contact Phone</label>
                <input
                  type="tel"
                  className={`form-control ${errors.emergencyContactPhone ? "is-invalid" : ""}`}
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  placeholder="08012345678"
                  maxLength="11"
                />
                {errors.emergencyContactPhone && (
                  <div className="invalid-feedback">
                    {errors.emergencyContactPhone}
                  </div>
                )}
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Relationship</label>
                <select
                  className="form-select"
                  name="emergencyContactRelationship"
                  value={formData.emergencyContactRelationship}
                  onChange={handleChange}
                >
                  <option value="">Select Relationship</option>
                  <option value="Parent">Parent</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Relative">Relative</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header bg-warning">
            <h5 className="mb-0">Promotion Settings</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    name="excludeFromPromotion"
                    id="excludeFromPromotion"
                    checked={formData.excludeFromPromotion}
                    onChange={handleChange}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="excludeFromPromotion"
                  >
                    Exclude from automatic promotion
                  </label>
                </div>
              </div>

              {formData.excludeFromPromotion && (
                <div className="col-md-8 mb-3">
                  <label className="form-label">Reason for exclusion</label>
                  <input
                    type="text"
                    className="form-control"
                    name="promotionHoldReason"
                    value={formData.promotionHoldReason}
                    onChange={handleChange}
                    placeholder="Enter reason for holding student back"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="d-flex gap-2 mt-4">
          <button type="submit" className="btn btn-nigerian" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Saving...
              </>
            ) : (
              <>
                <FaSave className="me-2" />
                {isEditMode ? "Update Student" : "Register Student"}
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/students")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default StudentForm;

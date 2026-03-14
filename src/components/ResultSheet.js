import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { studentAPI, resultAPI, parentPortalAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  FaPrint,
  FaDownload,
  FaArrowLeft,
  FaUserCircle,
  FaSpinner,
} from "react-icons/fa";
import moment from "moment";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useAuth } from "../contexts/AuthContext";
import "./ResultSheet.css";

function ResultSheet() {
  const { studentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isStudent, isParent } = useAuth();

  const query = new URLSearchParams(location.search);
  const session = query.get("session") || "";
  const term = query.get("term") || "";

  const [resultData, setResultData] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(false);
  const [resultLoading, setResultLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const componentRef = useRef(null);

  const safeNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const safeFixed = (value, digits = 2) => {
    return safeNumber(value, 0).toFixed(digits);
  };

  const getFirstDefined = (...values) => {
    for (const value of values) {
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return null;
  };

  const buildName = (...parts) =>
    parts
      .filter(
        (part) =>
          part !== undefined && part !== null && `${part}`.trim() !== "",
      )
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

  const normalizeStudent = (rawStudent, rawResultData) => {
    const studentInfo = rawResultData?.studentInfo || {};
    const source = rawStudent || {};

    const firstName = getFirstDefined(
      source.firstName,
      studentInfo.firstName,
      user?.firstName,
    );

    const middleName = getFirstDefined(
      source.middleName,
      studentInfo.middleName,
      user?.middleName,
    );

    const lastName = getFirstDefined(
      source.lastName,
      studentInfo.lastName,
      user?.lastName,
    );

    const fullName =
      getFirstDefined(source.fullName, source.name, studentInfo.name) ||
      buildName(firstName, middleName, lastName);

    return {
      id: getFirstDefined(source.id, studentId),
      firstName,
      middleName,
      lastName,
      fullName,
      admissionNumber: getFirstDefined(
        source.admissionNumber,
        source.admissionNo,
        studentInfo.admissionNumber,
        user?.admissionNumber,
      ),
      studentClass: getFirstDefined(
        source.studentClass,
        source.className,
        studentInfo.class,
        user?.studentClass,
      ),
      classArm: getFirstDefined(
        source.classArm,
        source.arm,
        studentInfo.arm,
        user?.classArm,
      ),
      parentName: getFirstDefined(source.parentName, source.guardianName),
      parentPhone: getFirstDefined(
        source.parentPhone,
        source.guardianPhone,
        source.parentContact,
      ),
      address: getFirstDefined(source.address, source.homeAddress),
      dateOfBirth: getFirstDefined(source.dateOfBirth, source.dob),
      profilePictureUrl: getFirstDefined(
        source.profilePictureUrl,
        studentInfo.profilePictureUrl,
        source.profileImageUrl,
      ),
    };
  };

  const normalizeSubjects = (rawResultData) => {
    const rawSubjects =
      rawResultData?.subjects ||
      rawResultData?.results ||
      rawResultData?.resultItems ||
      [];

    if (!Array.isArray(rawSubjects)) return [];

    return rawSubjects.map((subject, index) => ({
      id: getFirstDefined(subject.id, index),
      subject: getFirstDefined(
        subject.subject,
        subject.subjectName,
        subject.name,
        "-",
      ),
      resumptionTest: safeNumber(
        getFirstDefined(
          subject.resumptionTest,
          subject.resumption,
          subject.resitTest,
        ),
      ),
      assignments: safeNumber(
        getFirstDefined(
          subject.assignments,
          subject.assignment,
          subject.assgn,
          subject.assg,
        ),
      ),
      secondTest: safeNumber(
        getFirstDefined(subject.secondTest, subject.second, subject.test2),
      ),
      midtermTest: safeNumber(
        getFirstDefined(subject.midtermTest, subject.midterm, subject.mid),
      ),
      project: safeNumber(
        getFirstDefined(subject.project, subject.proj, subject.projects),
      ),
      continuousAssessment: safeNumber(
        getFirstDefined(
          subject.continuousAssessment,
          subject.ca,
          subject.caTotal,
        ),
      ),
      examination: safeNumber(
        getFirstDefined(subject.examination, subject.exam, subject.examScore),
      ),
      total: safeNumber(
        getFirstDefined(subject.total, subject.totalScore, subject.score),
      ),
      grade: getFirstDefined(subject.grade, "-"),
      remarks: getFirstDefined(subject.remarks, subject.remark, "-"),
      raw: subject,
    }));
  };

  const normalizeSummary = (rawResultData) => {
    const summary = rawResultData?.summary || {};
    return {
      totalScore: safeNumber(summary.totalScore),
      average: safeNumber(summary.average),
      positionInClass: getFirstDefined(
        summary.positionInClass,
        summary.classPosition,
        "N/A",
      ),
      positionInArm: getFirstDefined(
        summary.positionInArm,
        summary.armPosition,
        "N/A",
      ),
      totalSchoolDays: safeNumber(summary.totalSchoolDays),
      daysPresent: safeNumber(summary.daysPresent),
      daysAbsent: safeNumber(summary.daysAbsent),
      attendancePercentage: safeNumber(summary.attendancePercentage),
    };
  };

  const normalizedSubjects = useMemo(
    () => normalizeSubjects(resultData),
    [resultData],
  );

  const normalizedSummary = useMemo(
    () => normalizeSummary(resultData),
    [resultData],
  );

  const getStudentName = () => {
    return (
      resultData?.studentInfo?.name ||
      student?.fullName ||
      buildName(student?.firstName, student?.middleName, student?.lastName) ||
      buildName(user?.firstName, user?.middleName, user?.lastName) ||
      "Student"
    );
  };

  useEffect(() => {
    if (session && term) {
      fetchResultData();
    } else {
      setError("Missing required parameters");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, session, term]);

  const fetchStudentRecord = async (rawResult) => {
    const resultStudentInfo = rawResult?.studentInfo || {};
    let fetchedStudent = null;

    if (isStudent && studentAPI.getMyProfile) {
      try {
        const response = await studentAPI.getMyProfile();
        fetchedStudent = response?.data || null;
      } catch (error) {
        console.warn("Failed to fetch current student profile:", error);
      }
    }

    if (!fetchedStudent && studentId) {
      try {
        const response = await studentAPI.getStudentById(studentId);
        fetchedStudent = response?.data || null;
      } catch (error) {
        console.warn("Failed to fetch student by id:", error);
      }
    }

    if (!fetchedStudent && isStudent) {
      fetchedStudent = {
        id: user?.studentId || user?.id,
        firstName: user?.firstName,
        middleName: user?.middleName,
        lastName: user?.lastName,
        fullName: buildName(user?.firstName, user?.middleName, user?.lastName),
        admissionNumber: user?.admissionNumber,
        studentClass: user?.studentClass,
        classArm: user?.classArm,
      };
    }

    if (!fetchedStudent && Object.keys(resultStudentInfo).length > 0) {
      fetchedStudent = {
        id: studentId,
        fullName: resultStudentInfo.name,
        admissionNumber: resultStudentInfo.admissionNumber,
        studentClass: resultStudentInfo.class,
        classArm: resultStudentInfo.arm,
        profilePictureUrl: resultStudentInfo.profilePictureUrl,
      };
    }

    return normalizeStudent(fetchedStudent, rawResult);
  };

  const fetchResultRecord = async () => {
    if (isStudent) {
      const response = await resultAPI.getMyTermResult(session, term);
      return response?.data || null;
    }

    if (isParent) {
      if (!studentId) {
        throw new Error("Missing ward id");
      }
      const response = await parentPortalAPI.getWardTermResult(
        studentId,
        session,
        term,
      );
      return response?.data || null;
    }

    if (!studentId) {
      throw new Error("Missing student id");
    }

    const response = await resultAPI.getTermResult(studentId, session, term);
    return response?.data || null;
  };

  const fetchResultData = async () => {
    setLoading(true);
    setStudentLoading(true);
    setResultLoading(true);
    setError(null);
    setImageError(false);

    try {
      const rawResult = await fetchResultRecord();
      setResultData(rawResult);
      setResultLoading(false);

      const fetchedStudent = await fetchStudentRecord(rawResult);
      setStudent(fetchedStudent);
      setStudentLoading(false);
    } catch (error) {
      console.error("Error fetching result sheet:", error);

      if (error.response?.status === 404) {
        setError("No result found for this student in the selected term");
      } else if (error.response?.status === 403) {
        setError("You are not allowed to view this result");
      } else {
        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load result sheet",
        );
      }
    } finally {
      setResultLoading(false);
      setStudentLoading(false);
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date ? moment(date).format("DD/MM/YYYY") : "N/A";
  };

  const getGradeBadgeClass = (grade) => {
    const gradeMap = {
      A: "bg-success",
      B: "bg-primary",
      C: "bg-info",
      D: "bg-warning",
      E: "bg-secondary",
      F: "bg-danger",
    };
    return gradeMap[grade] || "bg-secondary";
  };

  const buildFileName = () => {
    const cleanName = getStudentName().replace(/\s+/g, "_");
    const cleanSession = String(session || "").replace(/[\/\\]/g, "_");
    return `${cleanName}_${term}_${cleanSession}`;
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: buildFileName(),
    onAfterPrint: () => toast.success("Result sheet printed successfully"),
  });

  const handleDownloadPDF = async () => {
    if (!componentRef.current) {
      toast.error("Result sheet not ready");
      return;
    }

    setDownloading(true);
    try {
      const element = componentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        allowTaint: true,
        useCORS: true,
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${buildFileName()}.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const studentPhotoUrl = useMemo(() => {
    const rawUrl =
      resultData?.studentInfo?.profilePictureUrl || student?.profilePictureUrl;

    if (!rawUrl) return null;
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      return rawUrl;
    }
    return `http://localhost:8080${rawUrl}`;
  }, [resultData, student]);

  const totalSchoolDays = normalizedSummary.totalSchoolDays;
  const daysPresent = normalizedSummary.daysPresent;
  const daysAbsent = normalizedSummary.daysAbsent;
  const attendancePercentage = normalizedSummary.attendancePercentage;

  const getCaColumnOrder = () => {
    return [
      {
        key: "resumptionTest",
        label: "RES",
        possibleKeys: ["resumptionTest", "resumption", "resit", "resitTest"],
      },
      {
        key: "assignments",
        label: "ASSGN",
        possibleKeys: [
          "assignments",
          "assignment",
          "assgn",
          "assg",
          "homework",
          "hw",
        ],
      },
      {
        key: "secondTest",
        label: "2ND",
        possibleKeys: ["secondTest", "second", "test2", "2ndTest"],
      },
      {
        key: "midtermTest",
        label: "MID",
        possibleKeys: ["midtermTest", "midterm", "mid", "midTest"],
      },
      {
        key: "project",
        label: "PROJ",
        possibleKeys: ["project", "proj", "projects"],
      },
    ];
  };

  const getExistingCaColumns = () => {
    if (!normalizedSubjects.length) return [];
    const firstSubject = normalizedSubjects[0];

    return getCaColumnOrder()
      .filter((col) =>
        col.possibleKeys.some((key) => typeof firstSubject[key] === "number"),
      )
      .map((col) => {
        const actualKey = col.possibleKeys.find(
          (key) => typeof firstSubject[key] === "number",
        );
        return {
          ...col,
          actualKey: actualKey || col.key,
        };
      });
  };

  const existingCaColumns = getExistingCaColumns();

  const calculateCATotal = (subject) => {
    if (safeNumber(subject.continuousAssessment) > 0) {
      return safeNumber(subject.continuousAssessment);
    }

    return existingCaColumns.reduce((total, col) => {
      return total + safeNumber(subject[col.actualKey]);
    }, 0);
  };

  if (loading || resultLoading || studentLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="text-center">
          <FaSpinner className="spinner mb-3" size={40} />
          <h5>Loading result sheet...</h5>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Error Loading Result</h4>
          <p>{error}</p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate("/results")}
          >
            <FaArrowLeft className="me-2" /> Back to Results
          </button>
        </div>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          <h4>No Result Found</h4>
          <p>
            No result found for this student in {term} term, {session} session.
          </p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate("/results")}
          >
            <FaArrowLeft className="me-2" /> Back to Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="result-sheet-wrapper">
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft className="me-2" /> Back
        </button>

        <div>
          <button
            className="btn btn-outline-success me-2"
            onClick={handlePrint}
            disabled={downloading}
          >
            <FaPrint className="me-2" /> Print
          </button>

          <button
            className="btn btn-outline-primary"
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <FaSpinner className="spinner me-2" /> Generating...
              </>
            ) : (
              <>
                <FaDownload className="me-2" /> Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      <div className="result-sheet-container" ref={componentRef}>
        <div className="result-sheet-content">
          <div className="school-header">
            <div className="school-name">
              FAITH FOUNDATION INTERNATIONAL SCHOOL
            </div>
            <div className="school-address">
              12 Bishop Shanahan, Fegge Onitsha, Anambra
            </div>
            <div className="school-contact">
              Tel: +234 903 017 5230 | Email: info@faithfoundation.edu.ng
            </div>
          </div>

          <div className="result-title">
            {term} TERM RESULT SHEET - {session} SESSION
          </div>

          <div className="student-info-section">
            <table className="student-info-table">
              <tbody>
                <tr>
                  <td className="label">Student Name:</td>
                  <td className="value">{getStudentName()}</td>
                  <td className="label">Admission No:</td>
                  <td className="value">
                    {resultData?.studentInfo?.admissionNumber ||
                      student?.admissionNumber ||
                      "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="label">Class:</td>
                  <td className="value">
                    {resultData?.studentInfo?.class ||
                      student?.studentClass ||
                      "N/A"}{" "}
                    {resultData?.studentInfo?.arm || student?.classArm || ""}
                  </td>
                  <td className="label">Date of Birth:</td>
                  <td className="value">{formatDate(student?.dateOfBirth)}</td>
                </tr>
                <tr>
                  <td className="label">Parent/Guardian:</td>
                  <td className="value">{student?.parentName || "N/A"}</td>
                  <td className="label">Parent Phone:</td>
                  <td className="value">{student?.parentPhone || "N/A"}</td>
                </tr>
                <tr>
                  <td className="label">Address:</td>
                  <td className="value" colSpan="3">
                    {student?.address || "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="student-photo">
              {studentPhotoUrl && !imageError ? (
                <img
                  src={studentPhotoUrl}
                  alt={getStudentName()}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="photo-placeholder">
                  <FaUserCircle />
                </div>
              )}
            </div>
          </div>

          <div className="results-table-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  <th rowSpan="2" className="sn">
                    S/N
                  </th>
                  <th rowSpan="2" className="subject">
                    SUBJECT
                  </th>
                  <th colSpan={existingCaColumns.length} className="ca-section">
                    CONTINUOUS ASSESSMENT (CA)
                  </th>
                  <th rowSpan="2" className="ca-total">
                    CA
                    <br />
                    TOTAL
                  </th>
                  <th rowSpan="2" className="exam">
                    EXAM
                    <br />
                    (60)
                  </th>
                  <th rowSpan="2" className="total">
                    TOTAL
                    <br />
                    (100)
                  </th>
                  <th rowSpan="2" className="grade">
                    GRADE
                  </th>
                  <th rowSpan="2" className="remark">
                    REMARK
                  </th>
                </tr>
                <tr className="ca-headers">
                  {existingCaColumns.map((col) => (
                    <th key={col.key} className="ca-header">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {normalizedSubjects.map((subject, index) => {
                  const caTotal = calculateCATotal(subject);

                  return (
                    <tr key={subject.id}>
                      <td className="sn">{index + 1}</td>
                      <td className="subject">{subject.subject}</td>
                      {existingCaColumns.map((col) => (
                        <td key={col.key} className="ca-score">
                          {safeNumber(subject[col.actualKey])}
                        </td>
                      ))}
                      <td className="ca-total-score">{caTotal}</td>
                      <td className="exam-score">
                        {safeNumber(subject.examination)}
                      </td>
                      <td className="total-score">
                        {safeNumber(subject.total)}
                      </td>
                      <td className="grade">
                        <span
                          className={`grade-badge ${getGradeBadgeClass(subject.grade)}`}
                        >
                          {subject.grade || "-"}
                        </span>
                      </td>
                      <td className="remark">{subject.remarks || "-"}</td>
                    </tr>
                  );
                })}

                {normalizedSubjects.length === 0 && (
                  <tr>
                    <td
                      colSpan={8 + existingCaColumns.length}
                      className="text-center"
                    >
                      No subjects found for this result.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="summary-row">
            <div className="summary-item">
              <span className="summary-label">Total Score:</span>
              <span className="summary-value">
                {normalizedSummary.totalScore}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Average:</span>
              <span className="summary-value">
                {safeFixed(normalizedSummary.average)}%
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Class Position:</span>
              <span className="summary-value">
                {normalizedSummary.positionInClass}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Arm Position:</span>
              <span className="summary-value">
                {normalizedSummary.positionInArm}
              </span>
            </div>
          </div>

          <div className="attendance-section">
            <div className="attendance-header">ATTENDANCE SUMMARY</div>
            <div className="attendance-grid">
              <div className="attendance-item">
                <span className="attendance-label">Total Days:</span>
                <span className="attendance-value">{totalSchoolDays}</span>
              </div>
              <div className="attendance-item present">
                <span className="attendance-label">Present:</span>
                <span className="attendance-value">{daysPresent}</span>
              </div>
              <div className="attendance-item absent">
                <span className="attendance-label">Absent:</span>
                <span className="attendance-value">{daysAbsent}</span>
              </div>
              <div className="attendance-item">
                <span className="attendance-label">Percentage:</span>
                <span className="attendance-value">
                  {attendancePercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="signatures-section">
            <div className="signature-item">
              <div className="signature-line"></div>
              <div className="signature-label">Class Teacher's Signature</div>
            </div>
            <div className="signature-item">
              <div className="signature-line"></div>
              <div className="signature-label">Principal's Signature</div>
            </div>
            <div className="signature-item">
              <div className="signature-line"></div>
              <div className="signature-label">Parent's Signature</div>
            </div>
          </div>

          <div className="result-footer">
            <div className="footer-note">
              This is a computer-generated result. Valid without signature.
            </div>
            <div className="footer-date">
              Generated on: {moment().format("DD/MM/YYYY h:mm A")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultSheet;

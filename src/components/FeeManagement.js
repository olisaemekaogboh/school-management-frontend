import React, { useState, useEffect, useCallback, useMemo } from "react";
import { studentAPI, feeAPI, parentPortalAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { toast } from "react-toastify";
import {
  FiDollarSign,
  FiPlus,
  FiBell,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiUsers,
  FiFilter,
  FiClock,
  FiPhone,
  FiSearch,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiEye,
  FiArrowLeft,
  FiArrowRight,
  FiUser,
  FiTrendingUp,
  FiCalendar,
  FiPieChart,
  FiCreditCard,
  FiEdit2,
  FiDownload,
  FiMail,
  FiBookOpen,
  FiUserCheck,
  FiMapPin,
} from "react-icons/fi";
import {
  BsWallet2,
  BsFileEarmarkExcel,
  BsFileEarmarkPdf,
} from "react-icons/bs";
import { MdOutlinePayments, MdOutlinePendingActions } from "react-icons/md";
import { RiUserStarLine, RiUserLocationLine } from "react-icons/ri";
import {
  FaUserCircle,
  FaSchool,
  FaIdCard,
  FaGraduationCap,
  FaPhoneAlt,
} from "react-icons/fa";
import moment from "moment";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import useActiveSession from "../hooks/useActiveSession";
import "./FeeManagement.css";

function FeeManagement() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const isAdmin = user?.role === "ADMIN";
  const isStudent = user?.role === "STUDENT";
  const isParent = user?.role === "PARENT";
  const isTeacher = user?.role === "TEACHER";

  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [allStudentsFeeStatus, setAllStudentsFeeStatus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedFeeType, setSelectedFeeType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("fees");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const {
    session,
    setSession,
    term,
    setTerm,
    loadingSession,
    availableSessions,
    refreshActiveSession,
  } = useActiveSession("FIRST");

  const [bulkPaymentData, setBulkPaymentData] = useState({
    amount: "",
    paymentMethod: "CASH",
    reference: "",
    notes: "",
    selectedStudents: [],
    selectAll: false,
  });

  const terms = ["FIRST", "SECOND", "THIRD", "ANNUAL"];
  const feeTypes = [
    "TUITION",
    "BOARDING",
    "DEVELOPMENT",
    "EXAM",
    "SPORTS",
    "LIBRARY",
    "ICT",
    "PTA",
    "UNIFORM",
    "TRANSPORT",
    "OTHER",
  ];

  const [formData, setFormData] = useState({
    studentId: "",
    session: "",
    term: "FIRST",
    feeType: "TUITION",
    description: "",
    amount: "",
    dueDate: moment().add(30, "days").format("YYYY-MM-DD"),
    notes: "",
  });

  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentMethod: "CASH",
    reference: "",
    notes: "",
  });

  // Helper function to normalize image URLs (from ParentDashboard)
  const normalizeImageUrl = useCallback((url) => {
    if (!url) return "";

    const trimmed = String(url).trim();
    if (!trimmed) return "";

    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("data:")
    ) {
      return trimmed;
    }

    const apiBase =
      process.env.REACT_APP_API_BASE_URL || "https://localhost:8443/api";
    const origin = apiBase.replace(/\/api\/?$/, "");

    if (trimmed.startsWith("/")) {
      return `${origin}${trimmed}`;
    }

    return `${origin}/${trimmed}`;
  }, []);

  // Helper function to get student profile picture
  const getStudentProfilePicture = useCallback(
    (student) => {
      if (!student) return "";

      const pictureUrl =
        student?.profilePictureUrl ||
        student?.profilePicture ||
        student?.avatar ||
        student?.photo ||
        student?.studentProfilePictureUrl ||
        "";

      return normalizeImageUrl(pictureUrl);
    },
    [normalizeImageUrl],
  );

  // Helper function to get student full name
  const getStudentFullName = useCallback((student) => {
    if (!student) return "Unknown Student";

    return (
      student?.fullName ||
      student?.studentName ||
      `${student?.firstName || ""} ${student?.lastName || ""}`
        .replace(/\s+/g, " ")
        .trim() ||
      "Unknown Student"
    );
  }, []);

  // Helper function to get student class name
  const getStudentClassName = useCallback((student) => {
    if (!student) return "N/A";

    const className =
      student?.studentClass ||
      student?.className ||
      student?.class ||
      student?.schoolClass?.className ||
      "";

    const arm =
      student?.classArm || student?.arm || student?.schoolClass?.arm || "";

    const combined = `${className} ${arm}`.replace(/\s+/g, " ").trim();
    return combined || "N/A";
  }, []);

  // Helper function to get student admission number
  const getStudentAdmissionNumber = useCallback((student) => {
    return (
      student?.admissionNumber ||
      student?.admissionNo ||
      student?.regNo ||
      "N/A"
    );
  }, []);

  // Helper function to get student parent name
  const getStudentParentName = useCallback((student) => {
    return (
      student?.parentName ||
      student?.parent?.name ||
      student?.guardianName ||
      ""
    );
  }, []);

  // Helper function to get student parent phone
  const getStudentParentPhone = useCallback((student) => {
    return (
      student?.parentPhone ||
      student?.parent?.phone ||
      student?.guardianPhone ||
      ""
    );
  }, []);

  // Helper function to get student parent email
  const getStudentParentEmail = useCallback((student) => {
    return student?.parentEmail || student?.parent?.email || "";
  }, []);

  // Helper function to get student address
  const getStudentAddress = useCallback((student) => {
    return student?.address || student?.homeAddress || "";
  }, []);

  // Helper function to get emergency contact
  const getEmergencyContact = useCallback((student) => {
    return {
      name: student?.emergencyContactName || "",
      phone: student?.emergencyContactPhone || "",
      relationship: student?.emergencyContactRelationship || "",
    };
  }, []);

  const getStudentName = getStudentFullName;

  const canManageFees = isAdmin;
  const canViewAdminTabs = isAdmin;
  const canRecordPayment = isAdmin;
  const canSendReminders = isAdmin;
  const canUseBulkPayment = isAdmin;

  useEffect(() => {
    loadScopedStudents();
  }, [user]);

  useEffect(() => {
    if (session && !formData.session) {
      setFormData((prev) => ({ ...prev, session }));
    }
  }, [session, formData.session]);

  useEffect(() => {
    if (term && formData.term !== term) {
      setFormData((prev) => ({ ...prev, term }));
    }
  }, [term, formData.term]);

  useEffect(() => {
    if (!session || !term) return;

    if (selectedStudent || isStudent) {
      fetchStudentFees();
    }

    if (isAdmin) {
      fetchFeeStatistics();
      fetchDefaulters();
    }
  }, [session, term, selectedStudent, isAdmin, isStudent]);

  useEffect(() => {
    if (!session || !term || !isAdmin) return;

    if (activeTab === "all-students") {
      fetchAllStudentsFeeStatus();
    }
  }, [session, term, activeTab, isAdmin]);

  const loadScopedStudents = async () => {
    try {
      setLoading(true);

      if (isTeacher) {
        setStudents([]);
        setSelectedStudent(null);
        return;
      }

      if (isAdmin) {
        const response = await studentAPI.getAllStudents();
        const data = Array.isArray(response.data) ? response.data : [];
        setStudents(data);
        return;
      }

      if (isStudent) {
        const response = await studentAPI.getMyProfile();
        const me = response?.data || null;
        const oneStudent = me ? [me] : [];
        setStudents(oneStudent);
        setSelectedStudent(me);
        setFormData((prev) => ({ ...prev, studentId: me?.id || "" }));
        return;
      }

      if (isParent) {
        const response = await parentPortalAPI.getMyWards();
        const wards = Array.isArray(response.data) ? response.data : [];
        setStudents(wards);

        if (wards.length === 1) {
          setSelectedStudent(wards[0]);
          setFormData((prev) => ({ ...prev, studentId: wards[0]?.id || "" }));
        }
        return;
      }

      setStudents([]);
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error loading scoped students:", error);
      toast.error(
        t?.feeManagement?.loadFailed || "Failed to load student records",
      );
      setStudents([]);
      setSelectedStudent(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentFees = async () => {
    if (!session || !term) return;

    if (isStudent) {
      setLoading(true);
      try {
        const response = await feeAPI.getMyFees(session, term);
        setFees(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching my fees:", error);
        toast.error(t?.feeManagement?.loadFailed || "Failed to load your fees");
        setFees([]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!selectedStudent) return;

    setLoading(true);
    try {
      let response;

      if (isParent) {
        response = await parentPortalAPI.getWardFees(
          selectedStudent.id,
          session,
          term,
        );
      } else if (isAdmin) {
        response = await feeAPI.getStudentFees(
          selectedStudent.id,
          session,
          term,
        );
      } else {
        setFees([]);
        return;
      }

      setFees(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching fees:", error);
      toast.error(t?.feeManagement?.loadFailed || "Failed to load fees");
      setFees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeStatistics = async () => {
    if (!isAdmin || !session || !term) return;

    try {
      const response = await feeAPI.getFeeStatistics(session, term);
      setStatistics(response.data || null);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setStatistics(null);
    }
  };

  const fetchDefaulters = async () => {
    if (!isAdmin || !session || !term) return;

    try {
      const response = await feeAPI.getDefaultingStudents(session, term);
      setDefaulters(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching defaulters:", error);
      setDefaulters([]);
    }
  };

  const fetchAllStudentsFeeStatus = async () => {
    if (!isAdmin || !session || !term) return;

    setLoading(true);
    try {
      const studentsResponse = await studentAPI.getAllStudents();
      const allStudents = Array.isArray(studentsResponse.data)
        ? studentsResponse.data
        : [];

      const studentsWithStatus = await Promise.all(
        allStudents.map(async (student) => {
          try {
            const feesResponse = await feeAPI.getStudentFees(
              student.id,
              session,
              term,
            );
            const studentFees = Array.isArray(feesResponse.data)
              ? feesResponse.data
              : [];

            const totalFees = studentFees.reduce(
              (sum, f) => sum + (Number(f.amount) || 0),
              0,
            );
            const totalPaid = studentFees.reduce(
              (sum, f) => sum + (Number(f.paidAmount) || 0),
              0,
            );
            const balance = totalFees - totalPaid;

            let status = "NO_FEES";
            let statusClass = "status-secondary";
            let statusIcon = <FiXCircle />;

            if (studentFees.length > 0) {
              const hasOverdue = studentFees.some(
                (f) => f.status === "OVERDUE",
              );
              const hasPending = studentFees.some(
                (f) => f.status === "PENDING",
              );
              const hasPartial = studentFees.some(
                (f) => f.status === "PARTIAL",
              );
              const allPaid = studentFees.every((f) => f.status === "PAID");

              if (hasOverdue) {
                status = "OVERDUE";
                statusClass = "status-danger";
                statusIcon = <FiAlertTriangle />;
              } else if (hasPending || hasPartial) {
                status = "OUTSTANDING";
                statusClass = "status-warning";
                statusIcon = <FiClock />;
              } else if (allPaid) {
                status = "PAID";
                statusClass = "status-success";
                statusIcon = <FiCheckCircle />;
              }
            }

            return {
              ...student,
              totalFees,
              totalPaid,
              balance,
              status,
              statusClass,
              statusIcon,
              feeCount: studentFees.length,
              fees: studentFees,
            };
          } catch (error) {
            return {
              ...student,
              totalFees: 0,
              totalPaid: 0,
              balance: 0,
              status: "ERROR",
              statusClass: "status-secondary",
              statusIcon: <FiXCircle />,
              feeCount: 0,
              fees: [],
            };
          }
        }),
      );

      setAllStudentsFeeStatus(studentsWithStatus);
    } catch (error) {
      console.error("Error fetching all students fee status:", error);
      toast.error(
        t?.feeManagement?.loadFailed || "Failed to load all students",
      );
      setAllStudentsFeeStatus([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = useCallback(() => {
    if (!statistics) {
      return {
        totalCollected: 0,
        totalOutstanding: 0,
        totalExpected: 0,
        paidCount: 0,
        pendingCount: 0,
        partialCount: 0,
        overdueCount: 0,
        totalStudents: 0,
        collectionRate: 0,
        studentsWithOutstanding: 0,
      };
    }

    const totalCollected = Number(statistics.totalCollected) || 0;
    const totalOutstanding = Number(statistics.totalOutstanding) || 0;
    const totalExpected = Number(statistics.totalExpected) || 0;
    const paidCount = Number(statistics.paidCount) || 0;
    const pendingCount = Number(statistics.pendingCount) || 0;
    const partialCount = Number(statistics.partialCount) || 0;
    const overdueCount = Number(statistics.overdueCount) || 0;
    const totalStudents = Number(statistics.totalStudents) || 0;

    const collectionRate =
      totalExpected > 0
        ? ((totalCollected / totalExpected) * 100).toFixed(1)
        : 0;

    const studentsWithOutstanding = pendingCount + partialCount + overdueCount;

    return {
      totalCollected,
      totalOutstanding,
      totalExpected,
      paidCount,
      pendingCount,
      partialCount,
      overdueCount,
      totalStudents,
      collectionRate,
      studentsWithOutstanding,
    };
  }, [statistics]);

  const calculateOverdueAmount = useCallback(() => {
    if (!fees || fees.length === 0) return 0;
    return fees
      .filter((fee) => fee.status === "OVERDUE")
      .reduce((sum, fee) => sum + (Number(fee.balance) || 0), 0);
  }, [fees]);

  const stats = calculateStats();
  const overdueAmount = calculateOverdueAmount();

  const quickStats = useMemo(() => {
    const totalStudents = allStudentsFeeStatus.length;
    const paid = allStudentsFeeStatus.filter((s) => s.status === "PAID").length;
    const outstanding = allStudentsFeeStatus.filter(
      (s) => s.status === "OUTSTANDING",
    ).length;
    const overdue = allStudentsFeeStatus.filter(
      (s) => s.status === "OVERDUE",
    ).length;
    const noFees = allStudentsFeeStatus.filter(
      (s) => s.status === "NO_FEES",
    ).length;
    return { totalStudents, paid, outstanding, overdue, noFees };
  }, [allStudentsFeeStatus]);

  const filteredStudents = useMemo(() => {
    if (!studentSearchTerm.trim()) return allStudentsFeeStatus;

    const searchLower = studentSearchTerm.toLowerCase().trim();
    return allStudentsFeeStatus.filter((student) => {
      const fullName = getStudentFullName(student).toLowerCase();
      const firstName = student.firstName?.toLowerCase() || "";
      const lastName = student.lastName?.toLowerCase() || "";
      const admission = getStudentAdmissionNumber(student).toLowerCase();
      const studentClass = getStudentClassName(student).toLowerCase();
      const parentName = getStudentParentName(student).toLowerCase();
      const parentPhone = getStudentParentPhone(student).toLowerCase();

      return (
        fullName.includes(searchLower) ||
        firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        admission.includes(searchLower) ||
        studentClass.includes(searchLower) ||
        parentName.includes(searchLower) ||
        parentPhone.includes(searchLower)
      );
    });
  }, [
    allStudentsFeeStatus,
    studentSearchTerm,
    getStudentFullName,
    getStudentAdmissionNumber,
    getStudentClassName,
    getStudentParentName,
    getStudentParentPhone,
  ]);

  const getFilteredFees = () => {
    return fees.filter((fee) => {
      const matchesSearch =
        searchTerm === "" ||
        fee.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.feeType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || fee.status === filterStatus;
      const matchesFeeType =
        selectedFeeType === "all" || fee.feeType === selectedFeeType;

      return matchesSearch && matchesStatus && matchesFeeType;
    });
  };

  const paginatedFees = () => {
    const filtered = getFilteredFees();
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filtered.slice(indexOfFirstItem, indexOfLastItem);
  };

  const totalPages = Math.ceil(getFilteredFees().length / itemsPerPage);

  const toggleRowExpansion = (feeId) => {
    setExpandedRows((prev) =>
      prev.includes(feeId)
        ? prev.filter((id) => id !== feeId)
        : [...prev, feeId],
    );
  };

  const handleSelectAllStudents = () => {
    if (bulkPaymentData.selectAll) {
      setBulkPaymentData((prev) => ({
        ...prev,
        selectedStudents: [],
        selectAll: false,
      }));
    } else {
      setBulkPaymentData((prev) => ({
        ...prev,
        selectedStudents: filteredStudents
          .filter((s) => (Number(s.balance) || 0) > 0)
          .map((s) => s.id),
        selectAll: true,
      }));
    }
  };

  const handleSelectStudent = (studentId) => {
    const updatedSelected = bulkPaymentData.selectedStudents.includes(studentId)
      ? bulkPaymentData.selectedStudents.filter((id) => id !== studentId)
      : [...bulkPaymentData.selectedStudents, studentId];

    setBulkPaymentData((prev) => ({
      ...prev,
      selectedStudents: updatedSelected,
      selectAll:
        updatedSelected.length ===
        filteredStudents.filter((s) => (Number(s.balance) || 0) > 0).length,
    }));
  };

  const calculateTotalSelectedAmount = () => {
    return filteredStudents
      .filter((s) => bulkPaymentData.selectedStudents.includes(s.id))
      .reduce((sum, student) => sum + (Number(student.balance) || 0), 0);
  };

  const handleBulkPaymentSubmit = async () => {
    if (!isAdmin) {
      toast.error(
        t?.feeManagement?.accessRestricted ||
          "Only admin can process bulk payments",
      );
      return;
    }

    if (bulkPaymentData.selectedStudents.length === 0) {
      toast.error(
        t?.feeManagement?.selectStudentFirst ||
          "Please select at least one student",
      );
      return;
    }

    if (!bulkPaymentData.amount || Number(bulkPaymentData.amount) <= 0) {
      toast.error(
        t?.feeManagement?.paymentAmountRequired ||
          "Please enter a valid amount",
      );
      return;
    }

    setLoading(true);
    try {
      const selectedStudentsData = filteredStudents.filter((s) =>
        bulkPaymentData.selectedStudents.includes(s.id),
      );

      let successCount = 0;
      let failedCount = 0;

      for (const student of selectedStudentsData) {
        try {
          const feesResponse = await feeAPI.getStudentFees(
            student.id,
            session,
            term,
          );
          const unpaidFees = (feesResponse.data || []).filter(
            (f) => f.status !== "PAID",
          );

          let remainingAmount =
            Number(bulkPaymentData.amount) / selectedStudentsData.length;

          for (const fee of unpaidFees) {
            if (remainingAmount <= 0) break;

            const paymentAmount = Math.min(
              remainingAmount,
              Number(fee.balance) || 0,
            );

            if (paymentAmount > 0) {
              await feeAPI.recordPayment(
                fee.id,
                paymentAmount,
                bulkPaymentData.paymentMethod,
                bulkPaymentData.reference || `BULK-${Date.now()}`,
                bulkPaymentData.notes,
              );
              remainingAmount -= paymentAmount;
            }
          }
          successCount++;
        } catch (error) {
          console.error(
            `Failed to process payment for student ${student.id}:`,
            error,
          );
          failedCount++;
        }
      }

      toast.success(
        t?.feeManagement?.bulkPaymentComplete ||
          `Bulk payment completed: ${successCount} successful, ${failedCount} failed`,
      );

      setShowBulkPaymentModal(false);
      setBulkPaymentData({
        amount: "",
        paymentMethod: "CASH",
        reference: "",
        notes: "",
        selectedStudents: [],
        selectAll: false,
      });

      await fetchAllStudentsFeeStatus();
      await fetchFeeStatistics();
      await fetchDefaulters();
      if (selectedStudent || isStudent) await fetchStudentFees();
    } catch (error) {
      console.error("Error processing bulk payment:", error);
      toast.error(
        t?.feeManagement?.bulkPaymentFailed || "Failed to process bulk payment",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = () => {
    try {
      let data = [];
      let filename = `fee_report_${session}_${term}`;

      if (activeTab === "fees") {
        data = fees.map((fee) => ({
          Student:
            fee.studentName ||
            getStudentFullName(selectedStudent) ||
            getStudentFullName(students[0]),
          Admission:
            fee.admissionNumber ||
            getStudentAdmissionNumber(selectedStudent) ||
            "",
          Class: getStudentClassName(selectedStudent) || "",
          FeeType: fee.feeType,
          Description: fee.description || "",
          Amount: fee.amount || 0,
          Paid: fee.paidAmount || 0,
          Balance: fee.balance || 0,
          DueDate: fee.dueDate ? moment(fee.dueDate).format("DD/MM/YYYY") : "",
          Status: fee.status || "",
        }));
      } else if (activeTab === "all-students" && isAdmin) {
        data = filteredStudents.map((student) => ({
          Student: getStudentFullName(student),
          Admission: getStudentAdmissionNumber(student),
          Class: getStudentClassName(student),
          Parent: getStudentParentName(student) || "-",
          Phone: getStudentParentPhone(student) || "-",
          TotalFees: student.totalFees || 0,
          Paid: student.totalPaid || 0,
          Balance: student.balance || 0,
          Status: student.status || "NO_FEES",
        }));
        filename += "_all_students";
      } else if (activeTab === "defaulters" && isAdmin) {
        data = defaulters.map((def) => ({
          Student: def.studentName || "",
          Admission: def.admissionNumber || "",
          Class: `${def.studentClass || ""} ${def.classArm || ""}`.trim(),
          Parent: def.parentName || "",
          Phone: def.parentPhone || "",
          Outstanding: def.outstandingBalance || 0,
          Status: def.overdueFees > 0 ? "OVERDUE" : "PENDING",
        }));
        filename += "_defaulters";
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Fee Report");
      XLSX.writeFile(wb, `${filename}.xlsx`);
      toast.success(t?.feeManagement?.exportSuccess || "Exported successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error(
        t?.feeManagement?.exportFailed || "Failed to export to Excel",
      );
    }
  };

  const handleExportToPDF = () => {
    try {
      const doc = new jsPDF();
      let title = "";
      let tableData = [];
      let tableHeaders = [];

      if (activeTab === "fees") {
        const exportStudent = selectedStudent || students[0];
        title = `Fee Report - ${getStudentFullName(exportStudent)}`;
        tableHeaders = [
          [
            "Fee Type",
            "Description",
            "Amount",
            "Paid",
            "Balance",
            "Due Date",
            "Status",
          ],
        ];
        tableData = fees.map((fee) => [
          fee.feeType || "",
          fee.description || "-",
          `₦${(fee.amount || 0).toLocaleString()}`,
          `₦${(fee.paidAmount || 0).toLocaleString()}`,
          `₦${(fee.balance || 0).toLocaleString()}`,
          fee.dueDate ? moment(fee.dueDate).format("DD/MM/YYYY") : "",
          fee.status || "",
        ]);
      } else if (activeTab === "all-students" && isAdmin) {
        title = "All Students Fee Status";
        tableHeaders = [
          [
            "Student",
            "Admission",
            "Class",
            "Total",
            "Paid",
            "Balance",
            "Status",
          ],
        ];
        tableData = filteredStudents.map((student) => [
          getStudentFullName(student),
          getStudentAdmissionNumber(student),
          getStudentClassName(student),
          `₦${(student.totalFees || 0).toLocaleString()}`,
          `₦${(student.totalPaid || 0).toLocaleString()}`,
          `₦${(student.balance || 0).toLocaleString()}`,
          student.status || "NO_FEES",
        ]);
      } else if (activeTab === "defaulters" && isAdmin) {
        title = "Fee Defaulters Report";
        tableHeaders = [
          [
            "Student",
            "Admission",
            "Class",
            "Parent",
            "Phone",
            "Outstanding",
            "Status",
          ],
        ];
        tableData = defaulters.map((def) => [
          def.studentName || "",
          def.admissionNumber || "",
          `${def.studentClass || ""} ${def.classArm || ""}`.trim(),
          def.parentName || "",
          def.parentPhone || "",
          `₦${(def.outstandingBalance || 0).toLocaleString()}`,
          def.overdueFees > 0 ? "OVERDUE" : "PENDING",
        ]);
      }

      doc.setFontSize(16);
      doc.text(title, 14, 15);
      doc.setFontSize(10);
      doc.text(`Session: ${session} | Term: ${term}`, 14, 22);
      doc.text(`Generated: ${moment().format("DD/MM/YYYY HH:mm")}`, 14, 28);

      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 51, 102] },
      });

      doc.save(`${activeTab}_report_${session}_${term}.pdf`);
      toast.success(
        t?.feeManagement?.exportSuccess || "PDF exported successfully",
      );
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast.error(t?.feeManagement?.exportFailed || "Failed to export to PDF");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      toast.error(
        t?.feeManagement?.accessRestricted ||
          "Only admin can create or edit fees",
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        session: formData.session || session,
        term: formData.term || term,
        studentId: formData.studentId || selectedStudent?.id || "",
      };

      if (editingFee) {
        await feeAPI.updateFee(editingFee.id, payload);
        toast.success(
          t?.feeManagement?.feeUpdated || "Fee updated successfully",
        );
      } else {
        await feeAPI.createFee(payload);
        toast.success(
          t?.feeManagement?.feeCreated || "Fee created successfully",
        );
      }

      setShowForm(false);
      setEditingFee(null);
      resetForm();

      if (selectedStudent) await fetchStudentFees();
      await fetchFeeStatistics();
      await fetchDefaulters();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          t?.feeManagement?.saveFailed ||
          "Failed to save fee",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();

    if (!isAdmin || !selectedFee) {
      toast.error(
        t?.feeManagement?.accessRestricted || "Only admin can record payment",
      );
      return;
    }

    setLoading(true);
    try {
      await feeAPI.recordPayment(
        selectedFee.id,
        paymentData.amount,
        paymentData.paymentMethod,
        paymentData.reference,
        paymentData.notes,
      );

      toast.success(
        t?.feeManagement?.paymentRecorded || "Payment recorded successfully",
      );
      setShowPaymentModal(false);
      setSelectedFee(null);
      setPaymentData({
        amount: "",
        paymentMethod: "CASH",
        reference: "",
        notes: "",
      });

      if (selectedStudent || isStudent) {
        await fetchStudentFees();
      }
      await fetchFeeStatistics();
      await fetchDefaulters();
      await fetchAllStudentsFeeStatus();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          t?.feeManagement?.paymentFailed ||
          "Failed to record payment",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = async () => {
    if (!isAdmin) {
      toast.error(
        t?.feeManagement?.accessRestricted || "Only admin can send reminders",
      );
      return;
    }

    if (
      !window.confirm(
        t?.feeManagement?.sendRemindersConfirm ||
          "Send fee reminders to all defaulting students?",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await feeAPI.sendOverdueReminders();
      toast.success(
        t?.feeManagement?.remindersSent || "Reminders sent successfully",
      );
    } catch (error) {
      toast.error(
        t?.feeManagement?.remindersFailed || "Failed to send reminders",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendIndividualReminder = async (student) => {
    if (!isAdmin) {
      toast.error(
        t?.feeManagement?.accessRestricted || "Only admin can send reminders",
      );
      return;
    }

    if (
      !window.confirm(
        `${t?.feeManagement?.sendReminderConfirm || "Send fee reminder to"} ${
          getStudentParentName(student) || getStudentFullName(student)
        }?`,
      )
    ) {
      return;
    }

    toast.success(
      t?.feeManagement?.remindersSent || "Reminder action triggered",
    );
  };

  const getStatusBadge = (status) => {
    const statusLabels = {
      PAID: t?.feeManagement?.statuses?.PAID || "Paid",
      PARTIAL: t?.feeManagement?.statuses?.PARTIAL || "Partial",
      PENDING: t?.feeManagement?.statuses?.PENDING || "Pending",
      OVERDUE: t?.feeManagement?.statuses?.OVERDUE || "Overdue",
      WAIVED: t?.feeManagement?.statuses?.WAIVED || "Waived",
      NO_FEES: t?.feeManagement?.statuses?.NO_FEES || "No Fees",
      OUTSTANDING: t?.feeManagement?.statuses?.OUTSTANDING || "Outstanding",
    };

    const badges = {
      PAID: {
        class: "badge-paid",
        icon: <FiCheckCircle />,
        label: statusLabels.PAID,
      },
      PARTIAL: {
        class: "badge-partial",
        icon: <FiClock />,
        label: statusLabels.PARTIAL,
      },
      PENDING: {
        class: "badge-pending",
        icon: <FiClock />,
        label: statusLabels.PENDING,
      },
      OVERDUE: {
        class: "badge-overdue",
        icon: <FiAlertTriangle />,
        label: statusLabels.OVERDUE,
      },
      WAIVED: {
        class: "badge-waived",
        icon: <FiXCircle />,
        label: statusLabels.WAIVED,
      },
      OUTSTANDING: {
        class: "badge-pending",
        icon: <FiClock />,
        label: statusLabels.OUTSTANDING,
      },
      NO_FEES: {
        class: "badge-waived",
        icon: <FiXCircle />,
        label: statusLabels.NO_FEES,
      },
    };

    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`status-badge ${badge.class}`}>
        {badge.icon} {badge.label}
      </span>
    );
  };

  const resetForm = () => {
    setFormData({
      studentId: selectedStudent?.id || "",
      session: session || "",
      term: term || "FIRST",
      feeType: "TUITION",
      description: "",
      amount: "",
      dueDate: moment().add(30, "days").format("YYYY-MM-DD"),
      notes: "",
    });
  };

  if (loadingSession) {
    return (
      <div className={`fee-management ${darkMode ? "dark-mode" : ""}`}>
        <div className="fee-content-wrapper">
          <div className="loading-spinner">
            <FiLoader className="spin" />
            <p>{t?.common?.loading || "Loading active session..."}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isTeacher) {
    return (
      <div className={`fee-management ${darkMode ? "dark-mode" : ""}`}>
        <div className="fee-content-wrapper">
          <div className="access-denied-card">
            <FiXCircle size={48} className="access-icon" />
            <h3>{t?.feeManagement?.accessRestricted || "Access Restricted"}</h3>
            <p>
              {t?.feeManagement?.teacherAccessMessage ||
                "Teachers are not allowed to access fee management."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const feeOwner = selectedStudent || students[0] || null;
  const isScopedUser = isStudent || isParent;

  return (
    <div className={`fee-management ${darkMode ? "dark-mode" : ""}`}>
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="fee-content-wrapper">
        <div className="header-section glass-effect">
          <div className="header-top">
            <div className="header-title">
              <div className="title-badge">
                <FiDollarSign className="title-icon" />
                <h1>{t?.feeManagement?.title || "Fee Management"}</h1>
              </div>
              <p className="header-subtitle">
                {isAdmin
                  ? t?.feeManagement?.manageAllPayments ||
                    "Manage and track all fee payments"
                  : isStudent
                    ? t?.feeManagement?.viewFees || "View your fee records"
                    : t?.feeManagement?.viewWardFees ||
                      "View your ward's fee records"}
              </p>
              <div className="session-info">
                <span className="session-badge">
                  <FiCalendar /> {session || "No active session"}
                </span>
                <span className="term-badge">
                  <FiClock /> {term || "N/A"}
                </span>
              </div>
            </div>

            <div className="header-actions">
              <button
                className="btn-refresh"
                onClick={() => {
                  refreshActiveSession();
                  if (isAdmin) {
                    fetchFeeStatistics();
                    fetchDefaulters();
                    if (activeTab === "all-students")
                      fetchAllStudentsFeeStatus();
                  }
                  if (selectedStudent || isStudent) fetchStudentFees();
                }}
              >
                <FiRefreshCw className={loading ? "spin" : ""} />
                <span>{t?.common?.refresh || "Refresh"}</span>
              </button>

              <div className="export-dropdown">
                <button
                  className="btn-export"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                >
                  <FiDownload /> Export
                </button>
                {showExportMenu && (
                  <div className="export-menu">
                    <button onClick={handleExportToExcel}>
                      <BsFileEarmarkExcel /> Excel
                    </button>
                    <button onClick={handleExportToPDF}>
                      <BsFileEarmarkPdf /> PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isAdmin && stats && (
            <div className="stats-grid">
              <div
                className={`stat-card ${hoveredCard === "collected" ? "hovered" : ""}`}
                onMouseEnter={() => setHoveredCard("collected")}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="stat-icon collected">
                  <FiTrendingUp />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Collected</span>
                  <span className="stat-value">
                    ₦{stats.totalCollected.toLocaleString()}
                  </span>
                  <span className="stat-trend">
                    <FiUsers /> {stats.paidCount} students
                  </span>
                </div>
              </div>

              <div
                className={`stat-card ${hoveredCard === "outstanding" ? "hovered" : ""}`}
                onMouseEnter={() => setHoveredCard("outstanding")}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="stat-icon outstanding">
                  <MdOutlinePendingActions />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Outstanding</span>
                  <span className="stat-value">
                    ₦{stats.totalOutstanding.toLocaleString()}
                  </span>
                  <span className="stat-trend">
                    <FiUsers /> {stats.studentsWithOutstanding} students
                  </span>
                </div>
              </div>

              <div
                className={`stat-card ${hoveredCard === "overdue" ? "hovered" : ""}`}
                onMouseEnter={() => setHoveredCard("overdue")}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="stat-icon overdue">
                  <FiAlertTriangle />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Overdue</span>
                  <span className="stat-value">
                    ₦{overdueAmount.toLocaleString()}
                  </span>
                  <span className="stat-trend">
                    <FiUsers /> {stats.overdueCount} students
                  </span>
                </div>
              </div>

              <div
                className={`stat-card ${hoveredCard === "rate" ? "hovered" : ""}`}
                onMouseEnter={() => setHoveredCard("rate")}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="stat-icon rate">
                  <FiPieChart />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Collection Rate</span>
                  <span className="stat-value">{stats.collectionRate}%</span>
                  <div className="progress-bar">
                    <div style={{ width: `${stats.collectionRate}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          className="mobile-filter-toggle glass-effect"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <FiFilter /> {showMobileFilters ? "Hide Filters" : "Show Filters"}
        </button>

        <div
          className={`filters-section glass-effect ${
            showMobileFilters ? "show" : ""
          }`}
        >
          <div className="filters-grid">
            <div className="filter-group">
              <label>
                <FiCalendar /> Session
              </label>
              <select
                value={session || ""}
                onChange={(e) => setSession(e.target.value)}
              >
                {availableSessions.length > 0 ? (
                  availableSessions.map((s) => (
                    <option key={s.id || s.session} value={s.session}>
                      {s.session}
                    </option>
                  ))
                ) : (
                  <option value="">No session available</option>
                )}
              </select>
            </div>

            <div className="filter-group">
              <label>
                <FiClock /> Term
              </label>
              <select
                value={term || ""}
                onChange={(e) => setTerm(e.target.value)}
              >
                {terms.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {(isAdmin || isParent) && (
              <div className="filter-group">
                <label>
                  <FiUser /> {isParent ? "Ward" : "Student"}
                </label>
                <select
                  value={selectedStudent?.id || ""}
                  onChange={(e) => {
                    const student = students.find(
                      (s) => s.id === parseInt(e.target.value, 10),
                    );
                    setSelectedStudent(student || null);
                    setFormData((prev) => ({
                      ...prev,
                      studentId: student?.id || "",
                      session: session || prev.session,
                      term: term || prev.term,
                    }));
                    setCurrentPage(1);
                  }}
                >
                  <option value="">
                    {isParent ? "Select Ward" : "Select Student"}
                  </option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {getStudentFullName(s)} - {getStudentAdmissionNumber(s)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {canManageFees && (
              <div className="filter-group">
                <label>&nbsp;</label>
                <button
                  className="btn-primary"
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                  disabled={!selectedStudent}
                >
                  <FiPlus /> Add Fee
                </button>
              </div>
            )}
          </div>

          <div className="quick-actions">
            {canSendReminders && (
              <button
                className="btn-warning"
                onClick={handleSendReminders}
                disabled={loading}
              >
                <FiBell /> Send Reminders
              </button>
            )}

            {canUseBulkPayment && (
              <button
                className="btn-success"
                onClick={() => setShowBulkPaymentModal(true)}
              >
                <BsWallet2 /> Bulk Payment
              </button>
            )}
          </div>

          <div className="search-filter">
            <div className="search-box">
              <FiSearch />
              <input
                type="text"
                placeholder="Search by fee type or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
            </select>

            <select
              value={selectedFeeType}
              onChange={(e) => setSelectedFeeType(e.target.value)}
            >
              <option value="all">All Fee Types</option>
              {feeTypes.map((type) => (
                <option key={type} value={type}>
                  {t?.feeManagement?.feeTypes?.[type] || type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="tab-navigation glass-effect">
          <button
            className={`tab-btn ${activeTab === "fees" ? "active" : ""}`}
            onClick={() => setActiveTab("fees")}
          >
            <FiDollarSign />{" "}
            {isStudent ? "My Fees" : isParent ? "Ward Fees" : "Student Fees"}
          </button>

          {canViewAdminTabs && (
            <>
              <button
                className={`tab-btn ${activeTab === "all-students" ? "active" : ""}`}
                onClick={() => setActiveTab("all-students")}
              >
                <FiUsers /> All Students
              </button>
              <button
                className={`tab-btn ${activeTab === "defaulters" ? "active" : ""}`}
                onClick={() => setActiveTab("defaulters")}
              >
                <FiAlertTriangle /> Defaulters{" "}
                <span className="badge">{defaulters.length}</span>
              </button>
            </>
          )}
        </div>

        {activeTab === "fees" && (
          <div className="fees-tab glass-effect">
            {feeOwner ? (
              <>
                {/* Enhanced Student Info Card with all details */}
                <div className="student-info-card enhanced">
                  <div className="student-header">
                    <div className="student-avatar-large">
                      {getStudentProfilePicture(feeOwner) ? (
                        <img
                          src={getStudentProfilePicture(feeOwner)}
                          alt={getStudentFullName(feeOwner)}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback =
                              e.currentTarget.parentElement?.querySelector(
                                ".avatar-fallback-icon",
                              );
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="avatar-fallback-icon"
                        style={{
                          display: getStudentProfilePicture(feeOwner)
                            ? "none"
                            : "flex",
                        }}
                      >
                        <FaUserCircle />
                      </div>
                    </div>

                    <div className="student-info-main">
                      <h2 className="student-name">
                        {getStudentFullName(feeOwner)}
                      </h2>
                      <div className="student-badges">
                        <span className="badge-class">
                          <FaSchool /> {getStudentClassName(feeOwner)}
                        </span>
                        <span className="badge-admission">
                          <FaIdCard /> {getStudentAdmissionNumber(feeOwner)}
                        </span>
                      </div>
                      <div className="student-contact-info">
                        {getStudentParentPhone(feeOwner) && (
                          <a
                            href={`tel:${getStudentParentPhone(feeOwner)}`}
                            className="contact-link"
                          >
                            <FaPhoneAlt /> {getStudentParentPhone(feeOwner)}
                          </a>
                        )}
                        {getStudentParentEmail(feeOwner) && (
                          <a
                            href={`mailto:${getStudentParentEmail(feeOwner)}`}
                            className="contact-link"
                          >
                            <FiMail /> {getStudentParentEmail(feeOwner)}
                          </a>
                        )}
                        {getStudentAddress(feeOwner) && (
                          <span className="contact-link">
                            <FiMapPin /> {getStudentAddress(feeOwner)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="student-stats-grid">
                    <div className="stat-detail-card">
                      <div className="stat-icon-sm success">
                        <FiTrendingUp />
                      </div>
                      <div className="stat-detail-content">
                        <span className="stat-label-sm">Total Fees</span>
                        <span className="stat-value-lg">
                          ₦
                          {fees
                            .reduce(
                              (sum, f) => sum + (Number(f.amount) || 0),
                              0,
                            )
                            .toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="stat-detail-card">
                      <div className="stat-icon-sm success">
                        <FiCheckCircle />
                      </div>
                      <div className="stat-detail-content">
                        <span className="stat-label-sm">Amount Paid</span>
                        <span className="stat-value-lg text-success">
                          ₦
                          {fees
                            .reduce(
                              (sum, f) => sum + (Number(f.paidAmount) || 0),
                              0,
                            )
                            .toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="stat-detail-card">
                      <div className="stat-icon-sm danger">
                        <FiAlertTriangle />
                      </div>
                      <div className="stat-detail-content">
                        <span className="stat-label-sm">
                          Outstanding Balance
                        </span>
                        <span className="stat-value-lg text-danger">
                          ₦
                          {fees
                            .reduce(
                              (sum, f) => sum + (Number(f.balance) || 0),
                              0,
                            )
                            .toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="stat-detail-card">
                      <div className="stat-icon-sm info">
                        <FiClock />
                      </div>
                      <div className="stat-detail-content">
                        <span className="stat-label-sm">Payment Status</span>
                        <span className="stat-value-lg">
                          {fees.filter((f) => f.status === "PAID").length} /{" "}
                          {fees.length} Paid
                        </span>
                      </div>
                    </div>
                  </div>

                  {getStudentParentName(feeOwner) && (
                    <div className="parent-info-banner">
                      <RiUserLocationLine className="parent-icon" />
                      <div className="parent-info-text">
                        <strong>Parent/Guardian:</strong>{" "}
                        {getStudentParentName(feeOwner)}
                        {getStudentParentPhone(feeOwner) && (
                          <a
                            href={`tel:${getStudentParentPhone(feeOwner)}`}
                            className="parent-phone"
                          >
                            <FaPhoneAlt /> {getStudentParentPhone(feeOwner)}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {(() => {
                    const emergency = getEmergencyContact(feeOwner);
                    if (emergency.name) {
                      return (
                        <div className="emergency-info">
                          <FiAlertTriangle className="emergency-icon" />
                          <span>
                            <strong>Emergency Contact:</strong> {emergency.name}
                            {emergency.phone && (
                              <a href={`tel:${emergency.phone}`}>
                                ({emergency.phone})
                              </a>
                            )}
                            {emergency.relationship &&
                              ` - ${emergency.relationship}`}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {loading ? (
                  <div className="loading-spinner">
                    <FiLoader className="spin" />
                    <p>Loading fees...</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="fee-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th>Fee Type</th>
                            <th>Description</th>
                            <th className="text-right">Amount</th>
                            <th className="text-right">Paid</th>
                            <th className="text-right">Balance</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedFees().map((fee) => (
                            <React.Fragment key={fee.id}>
                              <tr className="fee-row">
                                <td>
                                  <button
                                    className="btn-expand"
                                    onClick={() => toggleRowExpansion(fee.id)}
                                  >
                                    {expandedRows.includes(fee.id) ? (
                                      <FiChevronUp />
                                    ) : (
                                      <FiChevronDown />
                                    )}
                                  </button>
                                </td>
                                <td>
                                  <strong>
                                    {t?.feeManagement?.feeTypes?.[
                                      fee.feeType
                                    ] || fee.feeType}
                                  </strong>
                                </td>
                                <td>{fee.description || "-"}</td>
                                <td className="text-right">
                                  ₦{(fee.amount || 0).toLocaleString()}
                                </td>
                                <td className="text-right text-success">
                                  ₦{(fee.paidAmount || 0).toLocaleString()}
                                </td>
                                <td
                                  className={`text-right ${
                                    (fee.balance || 0) > 0
                                      ? "text-danger"
                                      : "text-success"
                                  }`}
                                >
                                  ₦{(fee.balance || 0).toLocaleString()}
                                </td>
                                <td
                                  className={
                                    moment(fee.dueDate).isBefore(moment()) &&
                                    fee.status !== "PAID"
                                      ? "text-danger"
                                      : ""
                                  }
                                >
                                  {moment(fee.dueDate).format("DD/MM/YYYY")}
                                </td>
                                <td>{getStatusBadge(fee.status)}</td>
                                <td>
                                  <div className="action-buttons">
                                    {canRecordPayment &&
                                      fee.status !== "PAID" && (
                                        <button
                                          className="btn-pay"
                                          onClick={() => {
                                            setSelectedFee(fee);
                                            setPaymentData({
                                              amount: fee.balance,
                                              paymentMethod: "CASH",
                                              reference: "",
                                              notes: "",
                                            });
                                            setShowPaymentModal(true);
                                          }}
                                          title="Record Payment"
                                        >
                                          <MdOutlinePayments />
                                        </button>
                                      )}

                                    <button
                                      className="btn-view"
                                      onClick={() => toggleRowExpansion(fee.id)}
                                      title="View Details"
                                    >
                                      <FiEye />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {expandedRows.includes(fee.id) && (
                                <tr className="expanded-row">
                                  <td colSpan="9">
                                    <div className="expanded-content">
                                      <div className="detail-grid">
                                        <div>
                                          <h4>Payment History</h4>
                                          <p>
                                            <strong>Paid:</strong> ₦
                                            {(
                                              fee.paidAmount || 0
                                            ).toLocaleString()}
                                          </p>
                                          <p>
                                            <strong>Date:</strong>{" "}
                                            {fee.paidDate
                                              ? moment(fee.paidDate).format(
                                                  "DD/MM/YYYY",
                                                )
                                              : "Not paid"}
                                          </p>
                                          <p>
                                            <strong>Method:</strong>{" "}
                                            {fee.paymentMethod
                                              ? t?.feeManagement
                                                  ?.paymentMethods?.[
                                                  fee.paymentMethod
                                                ] || fee.paymentMethod
                                              : "-"}
                                          </p>
                                        </div>

                                        <div>
                                          <h4>Reminders</h4>
                                          <p>
                                            <strong>Count:</strong>{" "}
                                            {fee.reminderCount || 0}
                                          </p>
                                          <p>
                                            <strong>Last:</strong>{" "}
                                            {fee.lastReminderSent
                                              ? moment(
                                                  fee.lastReminderSent,
                                                ).format("DD/MM/YYYY")
                                              : "Never"}
                                          </p>
                                        </div>

                                        <div>
                                          <h4>Notes</h4>
                                          <p>{fee.notes || "No notes"}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}

                          {paginatedFees().length === 0 && (
                            <tr>
                              <td colSpan="9" className="empty-state">
                                <FiDollarSign size={40} />
                                <p>No fees found</p>
                                {canManageFees && (
                                  <button
                                    className="btn-primary"
                                    onClick={() => {
                                      resetForm();
                                      setShowForm(true);
                                    }}
                                  >
                                    <FiPlus /> Add First Fee
                                  </button>
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="pagination">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <FiArrowLeft />
                        </button>
                        <span>
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages),
                            )
                          }
                          disabled={currentPage === totalPages}
                        >
                          <FiArrowRight />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="select-student-prompt">
                <FiUsers size={50} />
                <h3>{isParent ? "Select a Ward" : "Select a Student"}</h3>
                <p>
                  {isScopedUser
                    ? "No student record available for this account"
                    : "Choose a student from the dropdown above to view their fees"}
                </p>
              </div>
            )}
          </div>
        )}

        {isAdmin && activeTab === "all-students" && (
          <div className="all-students-tab glass-effect">
            <div className="quick-stats-grid">
              <div className="quick-stat-card total">
                <div className="stat-icon">
                  <FiUsers />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Total Students</span>
                  <span className="stat-number">
                    {quickStats.totalStudents}
                  </span>
                </div>
              </div>

              <div className="quick-stat-card paid">
                <div className="stat-icon">
                  <FiCheckCircle />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Fully Paid</span>
                  <span className="stat-number">{quickStats.paid}</span>
                </div>
              </div>

              <div className="quick-stat-card outstanding">
                <div className="stat-icon">
                  <FiClock />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Outstanding</span>
                  <span className="stat-number">{quickStats.outstanding}</span>
                </div>
              </div>

              <div className="quick-stat-card overdue">
                <div className="stat-icon">
                  <FiAlertTriangle />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Overdue</span>
                  <span className="stat-number">{quickStats.overdue}</span>
                </div>
              </div>

              <div className="quick-stat-card no-fees">
                <div className="stat-icon">
                  <FiXCircle />
                </div>
                <div className="stat-info">
                  <span className="stat-label">No Fees</span>
                  <span className="stat-number">{quickStats.noFees}</span>
                </div>
              </div>
            </div>

            <div className="all-students-search">
              <div className="search-box large">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search students by name, admission number or class..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="student-search-input"
                />
                {studentSearchTerm && (
                  <button
                    className="clear-search"
                    onClick={() => setStudentSearchTerm("")}
                  >
                    <FiX />
                  </button>
                )}
              </div>
              <div className="search-results-count">
                Found {filteredStudents.length} of {allStudentsFeeStatus.length}{" "}
                students
              </div>
            </div>

            {loading ? (
              <div className="loading-spinner">
                <FiLoader className="spin" />
                <p>Loading all students...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="all-students-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Admission</th>
                      <th>Class</th>
                      <th>Parent</th>
                      <th>Phone</th>
                      <th className="text-right">Total (₦)</th>
                      <th className="text-right">Paid (₦)</th>
                      <th className="text-right">Balance (₦)</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student, index) => (
                        <tr
                          key={student.id}
                          className={`status-row ${student.statusClass}`}
                        >
                          <td>{index + 1}</td>
                          <td>
                            <div className="student-name-cell">
                              <strong>{getStudentName(student)}</strong>
                              <br />
                              <small>
                                {student.firstName} {student.lastName}
                              </small>
                            </div>
                          </td>
                          <td>{student.admissionNumber}</td>
                          <td>
                            {student.studentClass} {student.classArm}
                          </td>
                          <td>{student.parentName || "-"}</td>
                          <td>
                            {student.parentPhone ? (
                              <a
                                href={`tel:${student.parentPhone}`}
                                className="phone-link"
                              >
                                <FiPhone /> {student.parentPhone}
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="text-right amount">
                            {student.totalFees > 0
                              ? `₦${student.totalFees.toLocaleString()}`
                              : "-"}
                          </td>
                          <td className="text-right text-success amount">
                            {student.totalPaid > 0
                              ? `₦${student.totalPaid.toLocaleString()}`
                              : "-"}
                          </td>
                          <td
                            className={`text-right amount ${
                              student.balance > 0
                                ? "text-danger"
                                : "text-success"
                            }`}
                          >
                            {student.balance > 0
                              ? `₦${student.balance.toLocaleString()}`
                              : student.totalFees > 0
                                ? "₦0"
                                : "-"}
                          </td>
                          <td>{getStatusBadge(student.status)}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn-view"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setActiveTab("fees");
                                }}
                                title="View Fees"
                              >
                                <FiEye />
                              </button>
                              {student.status !== "PAID" &&
                                student.status !== "NO_FEES" && (
                                  <button
                                    className="btn-remind"
                                    onClick={() =>
                                      handleSendIndividualReminder(student)
                                    }
                                    title="Send Reminder"
                                    disabled={!student.parentPhone}
                                  >
                                    <FiBell />
                                  </button>
                                )}
                              {student.parentPhone && (
                                <a
                                  href={`tel:${student.parentPhone}`}
                                  className="btn-call"
                                  title="Call Parent"
                                >
                                  <FiPhone />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="empty-state">
                          <FiSearch size={50} className="mb-3 text-muted" />
                          <h4>No students found</h4>
                          <p className="text-muted">
                            No students match your search criteria
                          </p>
                          <button
                            className="btn-primary mt-3"
                            onClick={() => setStudentSearchTerm("")}
                          >
                            <FiX /> Clear Search
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {isAdmin && activeTab === "defaulters" && (
          <div className="defaulters-tab glass-effect">
            <div className="defaulter-summary">
              <div className="summary-card total">
                <div className="summary-icon">
                  <FiUsers />
                </div>
                <div className="summary-content">
                  <span>Total Owing</span>
                  <strong>{defaulters.length}</strong>
                </div>
              </div>

              <div className="summary-card amount">
                <div className="summary-icon">
                  <FiDollarSign />
                </div>
                <div className="summary-content">
                  <span>Total Amount</span>
                  <strong>
                    ₦
                    {defaulters
                      .reduce(
                        (sum, d) => sum + (Number(d.outstandingBalance) || 0),
                        0,
                      )
                      .toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="summary-card overdue">
                <div className="summary-icon">
                  <FiAlertTriangle />
                </div>
                <div className="summary-content">
                  <span>Overdue Students</span>
                  <strong>
                    {defaulters.filter((d) => d.overdueFees > 0).length}
                  </strong>
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="defaulter-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Admission</th>
                    <th>Class</th>
                    <th>Parent</th>
                    <th>Phone</th>
                    <th className="text-right">Outstanding</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {defaulters.map((def, index) => (
                    <tr
                      key={index}
                      className={
                        def.overdueFees > 0 ? "overdue-row" : "pending-row"
                      }
                    >
                      <td>
                        <strong>{def.studentName}</strong>
                      </td>
                      <td>{def.admissionNumber}</td>
                      <td>
                        {def.studentClass} {def.classArm}
                      </td>
                      <td>{def.parentName}</td>
                      <td>
                        <a href={`tel:${def.parentPhone}`}>
                          <FiPhone /> {def.parentPhone}
                        </a>
                      </td>
                      <td className="text-right text-danger">
                        ₦{(def.outstandingBalance || 0).toLocaleString()}
                      </td>
                      <td>
                        {def.overdueFees > 0 ? (
                          <span className="badge-overdue-small">
                            <FiAlertTriangle /> Overdue
                          </span>
                        ) : (
                          <span className="badge-pending-small">
                            <FiClock /> Pending
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn-remind"
                          onClick={() => handleSendIndividualReminder(def)}
                          title="Send Reminder"
                        >
                          <FiBell />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {defaulters.length === 0 && (
                    <tr>
                      <td colSpan="8" className="empty-state">
                        <FiCheckCircle size={40} className="text-success" />
                        <p>No defaulters found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isAdmin && showBulkPaymentModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowBulkPaymentModal(false)}
          >
            <div
              className="modal-content glass-effect large"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header success">
                <h3>
                  <BsWallet2 /> Bulk Payment
                </h3>
                <button
                  className="modal-close"
                  onClick={() => setShowBulkPaymentModal(false)}
                >
                  <FiX />
                </button>
              </div>

              <div className="modal-body">
                <div className="bulk-payment-summary">
                  <div className="summary-stats">
                    <div>
                      <span>Selected Students</span>
                      <strong>{bulkPaymentData.selectedStudents.length}</strong>
                    </div>
                    <div>
                      <span>Total Balance</span>
                      <strong>
                        ₦{calculateTotalSelectedAmount().toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="student-selection-table">
                  <table className="selection-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={bulkPaymentData.selectAll}
                            onChange={handleSelectAllStudents}
                          />
                        </th>
                        <th>Student</th>
                        <th>Admission</th>
                        <th>Class</th>
                        <th className="text-right">Balance (₦)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={bulkPaymentData.selectedStudents.includes(
                                student.id,
                              )}
                              onChange={() => handleSelectStudent(student.id)}
                              disabled={student.balance <= 0}
                            />
                          </td>
                          <td>{getStudentName(student)}</td>
                          <td>{student.admissionNumber}</td>
                          <td>
                            {student.studentClass} {student.classArm}
                          </td>
                          <td className="text-right">
                            ₦{(student.balance || 0).toLocaleString()}
                          </td>
                          <td>{getStatusBadge(student.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleBulkPaymentSubmit();
                  }}
                >
                  <div className="form-row">
                    <div className="form-group">
                      <label>Payment Amount (₦)</label>
                      <input
                        type="number"
                        value={bulkPaymentData.amount}
                        onChange={(e) =>
                          setBulkPaymentData((prev) => ({
                            ...prev,
                            amount: e.target.value,
                          }))
                        }
                        max={calculateTotalSelectedAmount()}
                        min="1"
                        step="0.01"
                        required
                      />
                      <small className="text-muted">
                        Max: ₦{calculateTotalSelectedAmount().toLocaleString()}
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Payment Method</label>
                      <select
                        value={bulkPaymentData.paymentMethod}
                        onChange={(e) =>
                          setBulkPaymentData((prev) => ({
                            ...prev,
                            paymentMethod: e.target.value,
                          }))
                        }
                      >
                        <option value="CASH">Cash</option>
                        <option value="TRANSFER">Bank Transfer</option>
                        <option value="POS">POS</option>
                        <option value="ONLINE">Online</option>
                        <option value="CHEQUE">Cheque</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Reference</label>
                      <input
                        type="text"
                        value={bulkPaymentData.reference}
                        onChange={(e) =>
                          setBulkPaymentData((prev) => ({
                            ...prev,
                            reference: e.target.value,
                          }))
                        }
                        placeholder="Reference / transaction ID"
                      />
                    </div>

                    <div className="form-group">
                      <label>Notes</label>
                      <input
                        type="text"
                        value={bulkPaymentData.notes}
                        onChange={(e) =>
                          setBulkPaymentData((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        placeholder="Optional notes"
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowBulkPaymentModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-success"
                      disabled={loading}
                    >
                      {loading ? <FiLoader className="spin" /> : <BsWallet2 />}
                      <span>Process Bulk Payment</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowForm(false);
              resetForm();
              setEditingFee(null);
            }}
          >
            <div
              className="modal-content glass-effect"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>
                  <FiEdit2 /> {editingFee ? "Edit Fee" : "Create Fee"}
                </h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                    setEditingFee(null);
                  }}
                >
                  <FiX />
                </button>
              </div>

              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Student</label>
                      <select
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Student</option>
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>
                            {getStudentName(s)} - {s.admissionNumber}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Fee Type</label>
                      <select
                        name="feeType"
                        value={formData.feeType}
                        onChange={handleInputChange}
                        required
                      >
                        {feeTypes.map((type) => (
                          <option key={type} value={type}>
                            {t?.feeManagement?.feeTypes?.[type] || type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Session</label>
                      <input
                        type="text"
                        name="session"
                        value={formData.session}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Term</label>
                      <select
                        name="term"
                        value={formData.term}
                        onChange={handleInputChange}
                        required
                      >
                        {terms.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Description</label>
                      <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Amount (₦)</label>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        min="1"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Due Date</label>
                      <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Notes</label>
                      <input
                        type="text"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                        setEditingFee(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                    >
                      {loading ? <FiLoader className="spin" /> : null}
                      <span>{editingFee ? "Update" : "Create"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {isAdmin && showPaymentModal && selectedFee && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowPaymentModal(false);
              setSelectedFee(null);
            }}
          >
            <div
              className="modal-content glass-effect"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header success">
                <h3>
                  <FiCreditCard /> Record Payment
                </h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedFee(null);
                  }}
                >
                  <FiX />
                </button>
              </div>

              <div className="modal-body">
                <div className="payment-summary">
                  <p>
                    <strong>Student:</strong> {getStudentName(selectedStudent)}
                  </p>
                  <p>
                    <strong>Fee Type:</strong>{" "}
                    {t?.feeManagement?.feeTypes?.[selectedFee.feeType] ||
                      selectedFee.feeType}
                  </p>
                  <p>
                    <strong>Total Amount:</strong> ₦
                    {(selectedFee.amount || 0).toLocaleString()}
                  </p>
                  <p>
                    <strong>Balance Due:</strong>{" "}
                    <span className="text-danger">
                      ₦{(selectedFee.balance || 0).toLocaleString()}
                    </span>
                  </p>
                </div>

                <form onSubmit={handleRecordPayment}>
                  <div className="form-group">
                    <label>Payment Amount (₦)</label>
                    <input
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) =>
                        setPaymentData((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      max={selectedFee.balance}
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Payment Method</label>
                    <select
                      value={paymentData.paymentMethod}
                      onChange={(e) =>
                        setPaymentData((prev) => ({
                          ...prev,
                          paymentMethod: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="CASH">Cash</option>
                      <option value="TRANSFER">Bank Transfer</option>
                      <option value="POS">POS</option>
                      <option value="ONLINE">Online</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Reference</label>
                    <input
                      type="text"
                      value={paymentData.reference}
                      onChange={(e) =>
                        setPaymentData((prev) => ({
                          ...prev,
                          reference: e.target.value,
                        }))
                      }
                      placeholder="Reference / receipt number"
                    />
                  </div>

                  <div className="form-group">
                    <label>Notes</label>
                    <input
                      type="text"
                      value={paymentData.notes}
                      onChange={(e) =>
                        setPaymentData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setShowPaymentModal(false);
                        setSelectedFee(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-success"
                      disabled={loading}
                    >
                      {loading ? (
                        <FiLoader className="spin" />
                      ) : (
                        <MdOutlinePayments />
                      )}
                      <span>Record Payment</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FeeManagement;

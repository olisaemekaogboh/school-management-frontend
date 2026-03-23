// src/components/FeeManagement.js
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
} from "react-icons/fi";
import {
  BsWallet2,
  BsFileEarmarkExcel,
  BsFileEarmarkPdf,
} from "react-icons/bs";
import { MdOutlinePayments, MdOutlinePendingActions } from "react-icons/md";
import { RiUserStarLine } from "react-icons/ri";
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

  const getStudentName = (student) => {
    return (
      student?.fullName ||
      `${student?.firstName || ""} ${student?.lastName || ""}`.trim() ||
      t?.feeManagement?.unknownStudent ||
      "Unknown Student"
    );
  };

  const canManageFees = isAdmin;
  const canViewAdminTabs = isAdmin;
  const canRecordPayment = isAdmin;
  const canSendReminders = isAdmin;
  const canUseBulkPayment = isAdmin;
  const canExportAllData = isAdmin;

  useEffect(() => {
    loadScopedStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (session && !formData.session) {
      setFormData((prev) => ({
        ...prev,
        session,
      }));
    }
  }, [session, formData.session]);

  useEffect(() => {
    if (term && formData.term !== term) {
      setFormData((prev) => ({
        ...prev,
        term,
      }));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, term, selectedStudent, isAdmin, isStudent]);

  useEffect(() => {
    if (!session || !term || !isAdmin) return;

    if (activeTab === "all-students") {
      fetchAllStudentsFeeStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setFormData((prev) => ({
          ...prev,
          studentId: me?.id || "",
        }));
        return;
      }

      if (isParent) {
        const response = await parentPortalAPI.getMyWards();
        const wards = Array.isArray(response.data) ? response.data : [];
        setStudents(wards);

        if (wards.length === 1) {
          setSelectedStudent(wards[0]);
          setFormData((prev) => ({
            ...prev,
            studentId: wards[0]?.id || "",
          }));
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
        defaultersCount: 0,
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
    const defaultersCount = overdueCount;

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
      defaultersCount,
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
      const fullName = student.fullName?.toLowerCase() || "";
      const firstName = student.firstName?.toLowerCase() || "";
      const lastName = student.lastName?.toLowerCase() || "";
      const admission = student.admissionNumber?.toLowerCase() || "";
      const studentClass = student.studentClass?.toLowerCase() || "";
      const parentName = student.parentName?.toLowerCase() || "";
      const parentPhone = student.parentPhone?.toLowerCase() || "";

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
  }, [allStudentsFeeStatus, studentSearchTerm]);

  const handleSelectAllStudents = () => {
    if (bulkPaymentData.selectAll) {
      setBulkPaymentData({
        ...bulkPaymentData,
        selectedStudents: [],
        selectAll: false,
      });
    } else {
      setBulkPaymentData({
        ...bulkPaymentData,
        selectedStudents: filteredStudents
          .filter((s) => (Number(s.balance) || 0) > 0)
          .map((s) => s.id),
        selectAll: true,
      });
    }
  };

  const handleSelectStudent = (studentId) => {
    const updatedSelected = bulkPaymentData.selectedStudents.includes(studentId)
      ? bulkPaymentData.selectedStudents.filter((id) => id !== studentId)
      : [...bulkPaymentData.selectedStudents, studentId];

    setBulkPaymentData({
      ...bulkPaymentData,
      selectedStudents: updatedSelected,
      selectAll:
        updatedSelected.length ===
        filteredStudents.filter((s) => (Number(s.balance) || 0) > 0).length,
    });
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
          [t?.feeManagement?.studentName || "Student Name"]:
            fee.studentName ||
            getStudentName(selectedStudent) ||
            getStudentName(students[0]),
          [t?.feeManagement?.admissionNo || "Admission No"]:
            fee.admissionNumber || selectedStudent?.admissionNumber,
          [t?.feeManagement?.class || "Class"]:
            `${fee.studentClass || selectedStudent?.studentClass || ""} ${
              fee.classArm || selectedStudent?.classArm || ""
            }`.trim(),
          [t?.feeManagement?.feeType || "Fee Type"]: fee.feeType,
          [t?.feeManagement?.description || "Description"]:
            fee.description || "",
          [t?.feeManagement?.amount || "Amount (₦)"]: fee.amount || 0,
          [t?.feeManagement?.paid || "Paid (₦)"]: fee.paidAmount || 0,
          [t?.feeManagement?.balance || "Balance (₦)"]: fee.balance || 0,
          [t?.feeManagement?.dueDate || "Due Date"]: fee.dueDate
            ? moment(fee.dueDate).format("DD/MM/YYYY")
            : "",
          [t?.feeManagement?.status || "Status"]: fee.status || "",
          [t?.feeManagement?.paymentMethod || "Payment Method"]:
            fee.paymentMethod || "-",
          [t?.feeManagement?.paymentDate || "Payment Date"]: fee.paidDate
            ? moment(fee.paidDate).format("DD/MM/YYYY")
            : "-",
        }));

        const exportStudent = selectedStudent || students[0];
        if (exportStudent) {
          filename += `_${getStudentName(exportStudent).replace(/\s+/g, "_")}`;
        }
      } else if (activeTab === "all-students" && isAdmin) {
        data = filteredStudents.map((student) => ({
          [t?.feeManagement?.studentName || "Student Name"]:
            getStudentName(student),
          [t?.feeManagement?.admissionNo || "Admission No"]:
            student.admissionNumber || "",
          [t?.feeManagement?.class || "Class"]:
            `${student.studentClass || ""} ${student.classArm || ""}`.trim(),
          [t?.feeManagement?.parentName || "Parent Name"]:
            student.parentName || "-",
          [t?.feeManagement?.parentPhone || "Parent Phone"]:
            student.parentPhone || "-",
          [t?.feeManagement?.totalFees || "Total Fees (₦)"]:
            student.totalFees || 0,
          [t?.feeManagement?.paid || "Paid (₦)"]: student.totalPaid || 0,
          [t?.feeManagement?.balance || "Balance (₦)"]: student.balance || 0,
          [t?.feeManagement?.status || "Status"]: student.status || "NO_FEES",
          [t?.feeManagement?.feeCount || "Fee Count"]: student.feeCount || 0,
        }));
        filename += "_all_students";
      } else if (activeTab === "defaulters" && isAdmin) {
        data = defaulters.map((def) => ({
          [t?.feeManagement?.studentName || "Student Name"]:
            def.studentName || "",
          [t?.feeManagement?.admissionNo || "Admission No"]:
            def.admissionNumber || "",
          [t?.feeManagement?.class || "Class"]:
            `${def.studentClass || ""} ${def.classArm || ""}`.trim(),
          [t?.feeManagement?.parentName || "Parent Name"]: def.parentName || "",
          [t?.feeManagement?.parentPhone || "Parent Phone"]:
            def.parentPhone || "",
          [t?.feeManagement?.outstanding || "Outstanding Balance (₦)"]:
            def.outstandingBalance || 0,
          [t?.feeManagement?.overdue || "Overdue Fees"]: def.overdueFees || 0,
          [t?.feeManagement?.status || "Status"]:
            def.overdueFees > 0 ? "OVERDUE" : "PENDING",
        }));
        filename += "_defaulters";
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Fee Report");
      XLSX.writeFile(wb, `${filename}.xlsx`);

      toast.success(
        t?.feeManagement?.exportSuccess || "Exported successfully!",
      );
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
        title = `${t?.feeManagement?.feeReport || "Fee Report"} - ${getStudentName(exportStudent)}`;
        tableHeaders = [
          [
            t?.feeManagement?.feeType || "Fee Type",
            t?.feeManagement?.description || "Description",
            `${t?.feeManagement?.amount || "Amount"} (₦)`,
            `${t?.feeManagement?.paid || "Paid"} (₦)`,
            `${t?.feeManagement?.balance || "Balance"} (₦)`,
            t?.feeManagement?.dueDate || "Due Date",
            t?.feeManagement?.status || "Status",
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
        title =
          t?.feeManagement?.allStudentsFeeStatus || "All Students Fee Status";
        tableHeaders = [
          [
            t?.feeManagement?.student || "Student",
            t?.feeManagement?.admissionNo || "Admission",
            t?.feeManagement?.class || "Class",
            `${t?.feeManagement?.totalFees || "Total"} (₦)`,
            `${t?.feeManagement?.paid || "Paid"} (₦)`,
            `${t?.feeManagement?.balance || "Balance"} (₦)`,
            t?.feeManagement?.status || "Status",
          ],
        ];
        tableData = filteredStudents.map((student) => [
          getStudentName(student),
          student.admissionNumber || "",
          `${student.studentClass || ""} ${student.classArm || ""}`.trim(),
          `₦${(student.totalFees || 0).toLocaleString()}`,
          `₦${(student.totalPaid || 0).toLocaleString()}`,
          `₦${(student.balance || 0).toLocaleString()}`,
          student.status || "NO_FEES",
        ]);
      } else if (activeTab === "defaulters" && isAdmin) {
        title = t?.feeManagement?.defaultersReport || "Fee Defaulters Report";
        tableHeaders = [
          [
            t?.feeManagement?.student || "Student",
            t?.feeManagement?.admissionNo || "Admission",
            t?.feeManagement?.class || "Class",
            t?.feeManagement?.parent || "Parent",
            t?.feeManagement?.phone || "Phone",
            `${t?.feeManagement?.outstanding || "Outstanding"} (₦)`,
            t?.feeManagement?.status || "Status",
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
      doc.text(
        `${t?.feeManagement?.session || "Session"}: ${session} | ${t?.feeManagement?.termLabel || "Term"}: ${term}`,
        14,
        22,
      );
      doc.text(
        `${t?.feeManagement?.generated || "Generated"}: ${moment().format("DD/MM/YYYY HH:mm")}`,
        14,
        28,
      );

      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 51, 102] },
      });

      doc.save(`${activeTab}_report_${session}_${term}.pdf`);
      toast.success(
        t?.feeManagement?.exportSuccess || "PDF exported successfully!",
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

      if (selectedStudent) {
        await fetchStudentFees();
      }
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
        `${t?.feeManagement?.sendReminderConfirm || "Send SMS reminder to"} ${student.parentName || getStudentName(student)}?`,
      )
    ) {
      return;
    }

    try {
      toast.success(
        t?.feeManagement?.remindersSent || "Reminder sent successfully",
      );
    } catch (error) {
      toast.error(
        t?.feeManagement?.remindersFailed || "Failed to send reminder",
      );
    }
  };

  const getStatusBadge = (status) => {
    const statusLabels = {
      PAID: t?.feeManagement?.statuses?.PAID || "Paid",
      PARTIAL: t?.feeManagement?.statuses?.PARTIAL || "Partial",
      PENDING: t?.feeManagement?.statuses?.PENDING || "Pending",
      OVERDUE: t?.feeManagement?.statuses?.OVERDUE || "Overdue",
      WAIVED: t?.feeManagement?.statuses?.WAIVED || "Waived",
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
    };

    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`status-badge ${badge.class}`}>
        {badge.icon} {badge.label}
      </span>
    );
  };

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
      <div className="fee-management">
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
      <div className="fee-management">
        <div className="fee-content-wrapper">
          <div className="glass-effect p-4 text-center">
            <FiXCircle size={42} className="mb-3 text-danger" />
            <h3>{t?.feeManagement?.accessRestricted || "Access Restricted"}</h3>
            <p className="mb-0">
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
    <div className="fee-management">
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="fee-content-wrapper">
        <div className="header-section glass-effect">
          <div className="header-top">
            <div className="header-title">
              <h1>
                <FiDollarSign className="title-icon" />
                {t?.feeManagement?.title || "Fee Management"}
              </h1>
              <p className="header-subtitle">
                {isAdmin
                  ? t?.feeManagement?.manageAllPayments ||
                    "Manage and track all fee payments"
                  : isStudent
                    ? t?.feeManagement?.viewFees || "View your fee records"
                    : t?.feeManagement?.viewWardFees ||
                      "View your ward's fee records"}
              </p>
              <p className="header-subtitle">
                {t?.feeManagement?.activeSession || "Active Session"}:{" "}
                <strong>
                  {session ||
                    t?.feeManagement?.noActiveSession ||
                    "No active session"}
                </strong>{" "}
                | {t?.feeManagement?.termLabel || "Term"}:{" "}
                <strong>{term || "N/A"}</strong>
              </p>
            </div>
            <button
              className="btn-refresh"
              onClick={() => {
                refreshActiveSession();
                if (isAdmin) {
                  fetchFeeStatistics();
                  fetchDefaulters();
                  if (activeTab === "all-students") fetchAllStudentsFeeStatus();
                }
                if (selectedStudent || isStudent) fetchStudentFees();
              }}
            >
              <FiRefreshCw className={loading ? "spin" : ""} />
              <span>{t?.common?.refresh || "Refresh"}</span>
            </button>
          </div>

          {isAdmin && stats && (
            <div className="stats-grid">
              <div
                className={`stat-card glass-effect ${
                  hoveredCard === "collected" ? "hovered" : ""
                }`}
                onMouseEnter={() => setHoveredCard("collected")}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="stat-icon collected">
                  <FiTrendingUp />
                </div>
                <div className="stat-content">
                  <span className="stat-label">
                    {t?.feeManagement?.totalCollected || "Total Collected"}
                  </span>
                  <span className="stat-value">
                    ₦{stats.totalCollected?.toLocaleString()}
                  </span>
                  <span className="stat-trend">
                    <FiUsers /> {stats.paidCount}{" "}
                    {t?.feeManagement?.students || "students"}
                  </span>
                </div>
              </div>

              <div
                className={`stat-card glass-effect ${
                  hoveredCard === "outstanding" ? "hovered" : ""
                }`}
                onMouseEnter={() => setHoveredCard("outstanding")}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="stat-icon outstanding">
                  <MdOutlinePendingActions />
                </div>
                <div className="stat-content">
                  <span className="stat-label">
                    {t?.feeManagement?.outstanding || "Outstanding"}
                  </span>
                  <span className="stat-value">
                    ₦{stats.totalOutstanding?.toLocaleString()}
                  </span>
                  <span className="stat-trend">
                    <FiUsers /> {stats.studentsWithOutstanding}{" "}
                    {t?.feeManagement?.students || "students"}
                  </span>
                </div>
              </div>

              <div
                className={`stat-card glass-effect ${
                  hoveredCard === "overdue" ? "hovered" : ""
                }`}
                onMouseEnter={() => setHoveredCard("overdue")}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="stat-icon overdue">
                  <FiAlertTriangle />
                </div>
                <div className="stat-content">
                  <span className="stat-label">
                    {t?.feeManagement?.overdue || "Overdue"}
                  </span>
                  <span className="stat-value">
                    ₦{overdueAmount?.toLocaleString()}
                  </span>
                  <span className="stat-trend">
                    <FiUsers /> {stats.overdueCount}{" "}
                    {t?.feeManagement?.students || "students"}
                  </span>
                </div>
              </div>

              <div
                className={`stat-card glass-effect ${
                  hoveredCard === "rate" ? "hovered" : ""
                }`}
                onMouseEnter={() => setHoveredCard("rate")}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="stat-icon rate">
                  <FiPieChart />
                </div>
                <div className="stat-content">
                  <span className="stat-label">
                    {t?.feeManagement?.collectionRate || "Collection Rate"}
                  </span>
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
          <FiFilter />{" "}
          {showMobileFilters
            ? t?.common?.hideFilters || "Hide Filters"
            : t?.common?.showFilters || "Show Filters"}
        </button>

        <div
          className={`filters-section glass-effect ${
            showMobileFilters ? "show" : ""
          }`}
        >
          <div className="filters-grid">
            <div className="filter-group">
              <label>
                <FiCalendar /> {t?.feeManagement?.session || "Session"}
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
                  <option value="">
                    {t?.feeManagement?.noSession || "No session available"}
                  </option>
                )}
              </select>
            </div>

            <div className="filter-group">
              <label>
                <FiClock /> {t?.feeManagement?.termLabel || "Term"}
              </label>
              <select
                value={term || ""}
                onChange={(e) => setTerm(e.target.value)}
              >
                {terms.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {(isAdmin || isParent) && (
              <div className="filter-group">
                <label>
                  <FiUser />{" "}
                  {isParent
                    ? t?.feeManagement?.selectWard || "Ward"
                    : t?.feeManagement?.selectStudent || "Student"}
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
                    {isParent
                      ? t?.feeManagement?.selectWard || "Select Ward"
                      : t?.feeManagement?.selectStudent || "Select Student"}
                  </option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {getStudentName(s)} - {s.admissionNumber}
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
                  <FiPlus /> {t?.feeManagement?.addFee || "Add Fee"}
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
                <FiBell /> {t?.feeManagement?.sendReminders || "Send Reminders"}
              </button>
            )}

            {canUseBulkPayment && (
              <button
                className="btn-success"
                onClick={() => setShowBulkPaymentModal(true)}
              >
                <BsWallet2 /> {t?.feeManagement?.bulkPayment || "Bulk Payment"}
              </button>
            )}

            <button className="btn-excel" onClick={handleExportToExcel}>
              <BsFileEarmarkExcel /> {t?.feeManagement?.excel || "Excel"}
            </button>
            <button className="btn-pdf" onClick={handleExportToPDF}>
              <BsFileEarmarkPdf /> {t?.feeManagement?.pdf || "PDF"}
            </button>
          </div>

          <div className="search-filter">
            <div className="search-box">
              <FiSearch />
              <input
                type="text"
                placeholder={
                  t?.feeManagement?.searchByFeeType ||
                  "Search by fee type or description..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">
                {t?.feeManagement?.allStatus || "All Status"}
              </option>
              <option value="PAID">
                {t?.feeManagement?.statuses?.PAID || "Paid"}
              </option>
              <option value="PARTIAL">
                {t?.feeManagement?.statuses?.PARTIAL || "Partial"}
              </option>
              <option value="PENDING">
                {t?.feeManagement?.statuses?.PENDING || "Pending"}
              </option>
              <option value="OVERDUE">
                {t?.feeManagement?.statuses?.OVERDUE || "Overdue"}
              </option>
            </select>

            <select
              value={selectedFeeType}
              onChange={(e) => setSelectedFeeType(e.target.value)}
            >
              <option value="all">
                {t?.feeManagement?.allFeeTypes || "All Fee Types"}
              </option>
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
            {isStudent
              ? t?.feeManagement?.myFees || "My Fees"
              : isParent
                ? t?.feeManagement?.wardFees || "Ward Fees"
                : t?.feeManagement?.studentFees || "Student Fees"}
          </button>

          {canViewAdminTabs && (
            <>
              <button
                className={`tab-btn ${
                  activeTab === "all-students" ? "active" : ""
                }`}
                onClick={() => setActiveTab("all-students")}
              >
                <FiUsers /> {t?.feeManagement?.allStudents || "All Students"}
              </button>
              <button
                className={`tab-btn ${
                  activeTab === "defaulters" ? "active" : ""
                }`}
                onClick={() => setActiveTab("defaulters")}
              >
                <FiAlertTriangle />{" "}
                {t?.feeManagement?.defaulters || "Defaulters"}{" "}
                <span className="badge">{defaulters.length}</span>
              </button>
            </>
          )}
        </div>

        {activeTab === "fees" && (
          <div className="fees-tab glass-effect">
            {feeOwner ? (
              <>
                <div className="student-info-card">
                  <div className="student-avatar">
                    <RiUserStarLine />
                  </div>
                  <div className="student-details">
                    <h3>{getStudentName(feeOwner)}</h3>
                    <p>
                      <FiUser /> {feeOwner.admissionNumber}
                    </p>
                    <p>
                      <FiUsers /> {feeOwner.studentClass} {feeOwner.classArm}
                    </p>
                  </div>
                  <div className="student-stats">
                    <div>
                      <span>{t?.feeManagement?.totalFees || "Total Fees"}</span>
                      <strong>
                        ₦
                        {fees
                          .reduce((sum, f) => sum + (Number(f.amount) || 0), 0)
                          .toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span>{t?.feeManagement?.paid || "Paid"}</span>
                      <strong className="text-success">
                        ₦
                        {fees
                          .reduce(
                            (sum, f) => sum + (Number(f.paidAmount) || 0),
                            0,
                          )
                          .toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span>{t?.feeManagement?.balance || "Balance"}</span>
                      <strong className="text-danger">
                        ₦
                        {fees
                          .reduce((sum, f) => sum + (Number(f.balance) || 0), 0)
                          .toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="loading-spinner">
                    <FiLoader className="spin" />
                    <p>{t?.common?.loading || "Loading fees..."}</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="fee-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th>{t?.feeManagement?.feeType || "Fee Type"}</th>
                            <th>
                              {t?.feeManagement?.description || "Description"}
                            </th>
                            <th className="text-right">
                              {t?.feeManagement?.amount || "Amount"}
                            </th>
                            <th className="text-right">
                              {t?.feeManagement?.paid || "Paid"}
                            </th>
                            <th className="text-right">
                              {t?.feeManagement?.balance || "Balance"}
                            </th>
                            <th>{t?.feeManagement?.dueDate || "Due Date"}</th>
                            <th>{t?.feeManagement?.status || "Status"}</th>
                            <th>{t?.feeManagement?.actions || "Actions"}</th>
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
                                          title={
                                            t?.feeManagement?.recordPayment ||
                                            "Record Payment"
                                          }
                                        >
                                          <MdOutlinePayments />
                                        </button>
                                      )}

                                    <button
                                      className="btn-view"
                                      onClick={() => toggleRowExpansion(fee.id)}
                                      title={
                                        t?.feeManagement?.viewDetails ||
                                        "View Details"
                                      }
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
                                          <h4>
                                            {t?.feeManagement?.paymentHistory ||
                                              "Payment History"}
                                          </h4>
                                          <p>
                                            <strong>
                                              {t?.feeManagement?.paid || "Paid"}
                                              :
                                            </strong>{" "}
                                            ₦
                                            {(
                                              fee.paidAmount || 0
                                            ).toLocaleString()}
                                          </p>
                                          <p>
                                            <strong>
                                              {t?.feeManagement?.paymentDate ||
                                                "Date"}
                                              :
                                            </strong>{" "}
                                            {fee.paidDate
                                              ? moment(fee.paidDate).format(
                                                  "DD/MM/YYYY",
                                                )
                                              : t?.feeManagement?.notPaid ||
                                                "Not paid"}
                                          </p>
                                          <p>
                                            <strong>
                                              {t?.feeManagement
                                                ?.paymentMethod || "Method"}
                                              :
                                            </strong>{" "}
                                            {fee.paymentMethod
                                              ? t?.feeManagement
                                                  ?.paymentMethods?.[
                                                  fee.paymentMethod
                                                ] || fee.paymentMethod
                                              : "-"}
                                          </p>
                                        </div>
                                        <div>
                                          <h4>
                                            {t?.feeManagement?.reminders ||
                                              "Reminders"}
                                          </h4>
                                          <p>
                                            <strong>
                                              {t?.feeManagement?.count ||
                                                "Count"}
                                              :
                                            </strong>{" "}
                                            {fee.reminderCount || 0}
                                          </p>
                                          <p>
                                            <strong>
                                              {t?.feeManagement?.last || "Last"}
                                              :
                                            </strong>{" "}
                                            {fee.lastReminderSent
                                              ? moment(
                                                  fee.lastReminderSent,
                                                ).format("DD/MM/YYYY")
                                              : t?.feeManagement?.never ||
                                                "Never"}
                                          </p>
                                        </div>
                                        <div>
                                          <h4>
                                            {t?.feeManagement?.notes || "Notes"}
                                          </h4>
                                          <p>
                                            {fee.notes ||
                                              t?.feeManagement?.noNotes ||
                                              "No notes"}
                                          </p>
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
                                <p>
                                  {t?.feeManagement?.noFeesFound ||
                                    "No fees found"}
                                </p>
                                {canManageFees && (
                                  <button
                                    className="btn-primary"
                                    onClick={() => setShowForm(true)}
                                  >
                                    <FiPlus />{" "}
                                    {t?.feeManagement?.addFirstFee ||
                                      "Add First Fee"}
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
                          {t?.feeManagement?.page || "Page"} {currentPage}{" "}
                          {t?.feeManagement?.of || "of"} {totalPages}
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
                <h3>
                  {isParent
                    ? t?.feeManagement?.selectWard || "Select a Ward"
                    : t?.feeManagement?.selectStudent || "Select a Student"}
                </h3>
                <p>
                  {isScopedUser
                    ? t?.feeManagement?.noStudentRecord ||
                      "No student record available for this account"
                    : t?.feeManagement?.selectStudentFirst ||
                      "Choose a student from the dropdown above to view their fees"}
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
                  <span className="stat-label">
                    {t?.feeManagement?.totalStudents || "Total Students"}
                  </span>
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
                  <span className="stat-label">
                    {t?.feeManagement?.fullyPaid || "Fully Paid"}
                  </span>
                  <span className="stat-number">{quickStats.paid}</span>
                </div>
              </div>
              <div className="quick-stat-card outstanding">
                <div className="stat-icon">
                  <FiClock />
                </div>
                <div className="stat-info">
                  <span className="stat-label">
                    {t?.feeManagement?.outstanding || "Outstanding"}
                  </span>
                  <span className="stat-number">{quickStats.outstanding}</span>
                </div>
              </div>
              <div className="quick-stat-card overdue">
                <div className="stat-icon">
                  <FiAlertTriangle />
                </div>
                <div className="stat-info">
                  <span className="stat-label">
                    {t?.feeManagement?.overdue || "Overdue"}
                  </span>
                  <span className="stat-number">{quickStats.overdue}</span>
                </div>
              </div>
              <div className="quick-stat-card no-fees">
                <div className="stat-icon">
                  <FiXCircle />
                </div>
                <div className="stat-info">
                  <span className="stat-label">
                    {t?.feeManagement?.noFees || "No Fees"}
                  </span>
                  <span className="stat-number">{quickStats.noFees}</span>
                </div>
              </div>
            </div>

            <div className="status-legend">
              <span>
                <FiCheckCircle className="text-success" />{" "}
                {t?.feeManagement?.statuses?.PAID || "Paid"}
              </span>
              <span>
                <FiClock className="text-warning" />{" "}
                {t?.feeManagement?.outstanding || "Outstanding"}
              </span>
              <span>
                <FiAlertTriangle className="text-danger" />{" "}
                {t?.feeManagement?.overdue || "Overdue"}
              </span>
              <span>
                <FiXCircle className="text-secondary" />{" "}
                {t?.feeManagement?.noFees || "No Fees"}
              </span>
            </div>

            <div className="all-students-search">
              <div className="search-box large">
                <FiSearch />
                <input
                  type="text"
                  placeholder={
                    t?.feeManagement?.searchStudents ||
                    "Search students by name, admission number or class..."
                  }
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
                {t?.feeManagement?.foundStudents || "Found"}{" "}
                {filteredStudents.length} {t?.feeManagement?.of || "of"}{" "}
                {allStudentsFeeStatus.length}{" "}
                {t?.feeManagement?.students || "students"}
              </div>
            </div>

            {loading ? (
              <div className="loading-spinner">
                <FiLoader className="spin" />
                <p>{t?.common?.loading || "Loading all students..."}</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="all-students-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t?.feeManagement?.student || "Student"}</th>
                      <th>{t?.feeManagement?.admissionNo || "Admission"}</th>
                      <th>{t?.feeManagement?.class || "Class"}</th>
                      <th>{t?.feeManagement?.parent || "Parent"}</th>
                      <th>{t?.feeManagement?.phone || "Phone"}</th>
                      <th className="text-right">
                        {t?.feeManagement?.totalFees || "Total (₦)"}
                      </th>
                      <th className="text-right">
                        {t?.feeManagement?.paid || "Paid (₦)"}
                      </th>
                      <th className="text-right">
                        {t?.feeManagement?.balance || "Balance (₦)"}
                      </th>
                      <th>{t?.feeManagement?.status || "Status"}</th>
                      <th>{t?.feeManagement?.actions || "Actions"}</th>
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
                          <td>
                            <span
                              className={`status-badge ${student.statusClass}`}
                            >
                              {student.statusIcon}{" "}
                              {t?.feeManagement?.statuses?.[student.status] ||
                                student.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn-view"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setActiveTab("fees");
                                }}
                                title={
                                  t?.feeManagement?.viewFees || "View Fees"
                                }
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
                                    title={
                                      t?.feeManagement?.sendReminder ||
                                      "Send Reminder"
                                    }
                                    disabled={!student.parentPhone}
                                  >
                                    <FiBell />
                                  </button>
                                )}
                              {student.parentPhone && (
                                <a
                                  href={`tel:${student.parentPhone}`}
                                  className="btn-call"
                                  title={
                                    t?.feeManagement?.callParent ||
                                    "Call Parent"
                                  }
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
                          <h4>
                            {t?.feeManagement?.noStudentsMatch ||
                              "No students found"}
                          </h4>
                          <p className="text-muted">
                            {t?.feeManagement?.noStudentsMatch ||
                              "No students match your search criteria"}
                          </p>
                          <button
                            className="btn-primary mt-3"
                            onClick={() => setStudentSearchTerm("")}
                          >
                            <FiX />{" "}
                            {t?.feeManagement?.clearSearch || "Clear Search"}
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
                  <span>{t?.feeManagement?.totalOwing || "Total Owing"}</span>
                  <strong>{defaulters.length}</strong>
                </div>
              </div>
              <div className="summary-card amount">
                <div className="summary-icon">
                  <FiDollarSign />
                </div>
                <div className="summary-content">
                  <span>{t?.feeManagement?.totalAmount || "Total Amount"}</span>
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
                  <span>
                    {t?.feeManagement?.overdueStudents || "Overdue Students"}
                  </span>
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
                    <th>{t?.feeManagement?.student || "Student"}</th>
                    <th>{t?.feeManagement?.admissionNo || "Admission"}</th>
                    <th>{t?.feeManagement?.class || "Class"}</th>
                    <th>{t?.feeManagement?.parent || "Parent"}</th>
                    <th>{t?.feeManagement?.phone || "Phone"}</th>
                    <th className="text-right">
                      {t?.feeManagement?.outstanding || "Outstanding"}
                    </th>
                    <th>{t?.feeManagement?.status || "Status"}</th>
                    <th>{t?.feeManagement?.action || "Action"}</th>
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
                            <FiAlertTriangle />{" "}
                            {t?.feeManagement?.overdue || "Overdue"}
                          </span>
                        ) : (
                          <span className="badge-pending-small">
                            <FiClock /> {t?.feeManagement?.pending || "Pending"}
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn-remind"
                          onClick={() => handleSendIndividualReminder(def)}
                          title={
                            t?.feeManagement?.sendReminder || "Send Reminder"
                          }
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
                        <p>
                          {t?.feeManagement?.noDefaulters ||
                            "No defaulters found"}
                        </p>
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
                  <BsWallet2 />{" "}
                  {t?.feeManagement?.bulkPayment || "Bulk Payment"}
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
                      <span>
                        {t?.feeManagement?.selectedStudents ||
                          "Selected Students"}
                      </span>
                      <strong>{bulkPaymentData.selectedStudents.length}</strong>
                    </div>
                    <div>
                      <span>
                        {t?.feeManagement?.totalBalance || "Total Balance"}
                      </span>
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
                        <th>{t?.feeManagement?.student || "Student"}</th>
                        <th>{t?.feeManagement?.admissionNo || "Admission"}</th>
                        <th>{t?.feeManagement?.class || "Class"}</th>
                        <th className="text-right">
                          {t?.feeManagement?.balance || "Balance (₦)"}
                        </th>
                        <th>{t?.feeManagement?.status || "Status"}</th>
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
                          <td>
                            <span
                              className={`status-badge ${student.statusClass}`}
                            >
                              {student.statusIcon}{" "}
                              {t?.feeManagement?.statuses?.[student.status] ||
                                student.status}
                            </span>
                          </td>
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
                      <label>
                        {t?.feeManagement?.paymentAmount ||
                          "Payment Amount (₦)"}
                      </label>
                      <input
                        type="number"
                        value={bulkPaymentData.amount}
                        onChange={(e) =>
                          setBulkPaymentData({
                            ...bulkPaymentData,
                            amount: e.target.value,
                          })
                        }
                        max={calculateTotalSelectedAmount()}
                        min="1"
                        step="0.01"
                        required
                      />
                      <small className="text-muted">
                        {t?.feeManagement?.maxAmount || "Max"}: ₦
                        {calculateTotalSelectedAmount().toLocaleString()}
                      </small>
                    </div>

                    <div className="form-group">
                      <label>
                        {t?.feeManagement?.paymentMethod || "Payment Method"}
                      </label>
                      <select
                        value={bulkPaymentData.paymentMethod}
                        onChange={(e) =>
                          setBulkPaymentData({
                            ...bulkPaymentData,
                            paymentMethod: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="CASH">
                          {t?.feeManagement?.paymentMethods?.CASH || "Cash"}
                        </option>
                        <option value="TRANSFER">
                          {t?.feeManagement?.paymentMethods?.TRANSFER ||
                            "Bank Transfer"}
                        </option>
                        <option value="POS">
                          {t?.feeManagement?.paymentMethods?.POS || "POS"}
                        </option>
                        <option value="CHEQUE">
                          {t?.feeManagement?.paymentMethods?.CHEQUE || "Cheque"}
                        </option>
                        <option value="ONLINE">
                          {t?.feeManagement?.paymentMethods?.ONLINE ||
                            "Online Payment"}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      {t?.feeManagement?.reference || "Reference (Optional)"}
                    </label>
                    <input
                      type="text"
                      value={bulkPaymentData.reference}
                      onChange={(e) =>
                        setBulkPaymentData({
                          ...bulkPaymentData,
                          reference: e.target.value,
                        })
                      }
                      placeholder={
                        t?.feeManagement?.bulkPaymentReference ||
                        "Bulk Payment Reference"
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>{t?.feeManagement?.notes || "Notes"}</label>
                    <textarea
                      value={bulkPaymentData.notes}
                      onChange={(e) =>
                        setBulkPaymentData({
                          ...bulkPaymentData,
                          notes: e.target.value,
                        })
                      }
                      rows="2"
                      placeholder={
                        t?.feeManagement?.notesOptional ||
                        "Additional notes for bulk payment"
                      }
                    />
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowBulkPaymentModal(false)}
                    >
                      {t?.feeManagement?.cancel || "Cancel"}
                    </button>
                    <button
                      type="submit"
                      className="btn-success"
                      disabled={
                        loading || bulkPaymentData.selectedStudents.length === 0
                      }
                    >
                      {loading ? (
                        <FiLoader className="spin" />
                      ) : (
                        t?.feeManagement?.processBulkPayment ||
                        "Process Bulk Payment"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {isAdmin && showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div
              className="modal-content glass-effect"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>
                  {editingFee ? <FiEdit2 /> : <FiPlus />}{" "}
                  {editingFee
                    ? t?.feeManagement?.editFee || "Edit Fee"
                    : t?.feeManagement?.addNewFee || "Add New Fee"}
                </h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowForm(false);
                    setEditingFee(null);
                    resetForm();
                  }}
                >
                  <FiX />
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>{t?.feeManagement?.student || "Student"}</label>
                    <input
                      type="text"
                      value={getStudentName(selectedStudent)}
                      disabled
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t?.feeManagement?.session || "Session"}</label>
                      <select
                        name="session"
                        value={formData.session}
                        onChange={handleInputChange}
                        required
                      >
                        {availableSessions.length > 0 ? (
                          availableSessions.map((s) => (
                            <option key={s.id || s.session} value={s.session}>
                              {s.session}
                            </option>
                          ))
                        ) : (
                          <option value="">
                            {t?.feeManagement?.noSession ||
                              "No session available"}
                          </option>
                        )}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>{t?.feeManagement?.termLabel || "Term"}</label>
                      <select
                        name="term"
                        value={formData.term}
                        onChange={handleInputChange}
                        required
                      >
                        {terms.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        {t?.feeManagement?.feeTypeLabel || "Fee Type"}
                      </label>
                      <select
                        name="feeType"
                        value={formData.feeType}
                        onChange={handleInputChange}
                        required
                      >
                        {feeTypes.map((ft) => (
                          <option key={ft} value={ft}>
                            {t?.feeManagement?.feeTypes?.[ft] || ft}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>
                        {t?.feeManagement?.amountLabel || "Amount (₦)"}
                      </label>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        required
                        min="1"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      {t?.feeManagement?.descriptionLabel || "Description"}
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder={t?.feeManagement?.optional || "Optional"}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        {t?.feeManagement?.dueDateLabel || "Due Date"}
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t?.feeManagement?.notesLabel || "Notes"}</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder={
                        t?.feeManagement?.notesOptional || "Additional notes"
                      }
                    />
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setShowForm(false);
                        setEditingFee(null);
                        resetForm();
                      }}
                    >
                      {t?.feeManagement?.cancel || "Cancel"}
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <FiLoader className="spin" />
                      ) : editingFee ? (
                        t?.feeManagement?.update || "Update"
                      ) : (
                        t?.feeManagement?.create || "Create"
                      )}
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
            onClick={() => setShowPaymentModal(false)}
          >
            <div
              className="modal-content glass-effect"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header success">
                <h3>
                  <FiCreditCard />{" "}
                  {t?.feeManagement?.recordPayment || "Record Payment"}
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
                    <strong>{t?.feeManagement?.student || "Student"}:</strong>{" "}
                    {getStudentName(selectedStudent)}
                  </p>
                  <p>
                    <strong>
                      {t?.feeManagement?.feeTypeLabel || "Fee Type"}:
                    </strong>{" "}
                    {t?.feeManagement?.feeTypes?.[selectedFee.feeType] ||
                      selectedFee.feeType}
                  </p>
                  <p>
                    <strong>
                      {t?.feeManagement?.totalAmount || "Total Amount"}:
                    </strong>{" "}
                    ₦{(selectedFee.amount || 0).toLocaleString()}
                  </p>
                  <p>
                    <strong>
                      {t?.feeManagement?.balance || "Balance Due"}:
                    </strong>{" "}
                    <span className="text-danger">
                      ₦{(selectedFee.balance || 0).toLocaleString()}
                    </span>
                  </p>
                </div>

                <form onSubmit={handleRecordPayment}>
                  <div className="form-group">
                    <label>
                      {t?.feeManagement?.paymentAmount || "Payment Amount (₦)"}
                    </label>
                    <input
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          amount: e.target.value,
                        })
                      }
                      max={selectedFee.balance}
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      {t?.feeManagement?.paymentMethod || "Payment Method"}
                    </label>
                    <select
                      value={paymentData.paymentMethod}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          paymentMethod: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="CASH">
                        {t?.feeManagement?.paymentMethods?.CASH || "Cash"}
                      </option>
                      <option value="TRANSFER">
                        {t?.feeManagement?.paymentMethods?.TRANSFER ||
                          "Bank Transfer"}
                      </option>
                      <option value="POS">
                        {t?.feeManagement?.paymentMethods?.POS || "POS"}
                      </option>
                      <option value="CHEQUE">
                        {t?.feeManagement?.paymentMethods?.CHEQUE || "Cheque"}
                      </option>
                      <option value="ONLINE">
                        {t?.feeManagement?.paymentMethods?.ONLINE ||
                          "Online Payment"}
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t?.feeManagement?.reference || "Reference"}</label>
                    <input
                      type="text"
                      value={paymentData.reference}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          reference: e.target.value,
                        })
                      }
                      placeholder={
                        t?.feeManagement?.transactionId || "Transaction ID"
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
                      {t?.feeManagement?.cancel || "Cancel"}
                    </button>
                    <button
                      type="submit"
                      className="btn-success"
                      disabled={loading}
                    >
                      {loading ? (
                        <FiLoader className="spin" />
                      ) : (
                        t?.feeManagement?.recordPayment || "Record Payment"
                      )}
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

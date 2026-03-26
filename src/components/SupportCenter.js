import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supportAPI } from "../services/api";
import { createSupportSocket } from "../services/supportSocket";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { toast } from "react-toastify";
import {
  FaComments,
  FaPaperPlane,
  FaPlus,
  FaSyncAlt,
  FaLock,
  FaLockOpen,
  FaCircle,
  FaInbox,
} from "react-icons/fa";
import "./SupportCenter.css";

const initialTicketForm = {
  subject: "",
  category: "",
  message: "",
};

function SupportCenter() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { darkMode } = useDarkMode();

  const isAdmin = user?.role === "ADMIN";
  const supportT = useMemo(() => t?.support || {}, [t]);

  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [ticketForm, setTicketForm] = useState(initialTicketForm);
  const [messageText, setMessageText] = useState("");

  const socketRef = useRef(null);
  const ticketSubscriptionRef = useRef(null);
  const userQueueSubscriptionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const fetchTickets = useCallback(
    async (keepSelection = true) => {
      setLoadingList(true);
      try {
        const response = isAdmin
          ? await supportAPI.getAllTickets()
          : await supportAPI.getMyTickets();

        const data = Array.isArray(response.data) ? response.data : [];
        setTickets(data);

        if (keepSelection && selectedTicketId) {
          const exists = data.some((ticket) => ticket.id === selectedTicketId);
          if (!exists) {
            setSelectedTicketId(data[0]?.id || null);
          }
        } else if (!selectedTicketId && data.length > 0) {
          setSelectedTicketId(data[0].id);
        }
      } catch (error) {
        console.error(error);
        toast.error(
          supportT.loadTicketsFailed || "Failed to load support tickets",
        );
      } finally {
        setLoadingList(false);
      }
    },
    [isAdmin, selectedTicketId, supportT.loadTicketsFailed],
  );

  const fetchTicketDetails = useCallback(
    async (ticketId) => {
      if (!ticketId) {
        setSelectedTicket(null);
        return;
      }

      setLoadingTicket(true);
      try {
        const response = await supportAPI.getTicketDetails(ticketId);
        setSelectedTicket(response.data);
      } catch (error) {
        console.error(error);
        toast.error(
          supportT.loadConversationFailed || "Failed to load ticket details",
        );
      } finally {
        setLoadingTicket(false);
      }
    },
    [supportT.loadConversationFailed],
  );

  const handleRealtimeMessage = useCallback(
    (payload) => {
      if (!payload?.ticketId) return;

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === payload.ticketId
            ? {
                ...ticket,
                status: payload.ticketStatus || ticket.status,
                lastMessageAt: payload.createdAt || ticket.lastMessageAt,
              }
            : ticket,
        ),
      );

      if (selectedTicketId === payload.ticketId) {
        setSelectedTicket((prev) => {
          if (!prev) return prev;

          const alreadyExists = (prev.messages || []).some(
            (m) => m.id === payload.messageId,
          );

          if (alreadyExists) {
            return {
              ...prev,
              status: payload.ticketStatus || prev.status,
            };
          }

          return {
            ...prev,
            status: payload.ticketStatus || prev.status,
            messages: [
              ...(prev.messages || []),
              {
                id: payload.messageId,
                senderName: payload.senderName,
                senderRole: payload.senderRole,
                fromAdmin: payload.fromAdmin,
                message: payload.message,
                createdAt: payload.createdAt,
              },
            ],
          };
        });
      }
    },
    [selectedTicketId],
  );

  useEffect(() => {
    fetchTickets(false);
  }, [fetchTickets]);

  useEffect(() => {
    fetchTicketDetails(selectedTicketId);
  }, [selectedTicketId, fetchTicketDetails]);

  useEffect(() => {
    const socket = createSupportSocket({
      onConnected: () => {
        setSocketConnected(true);
        userQueueSubscriptionRef.current = socket.subscribeToUserQueue();

        if (selectedTicketId) {
          ticketSubscriptionRef.current =
            socket.subscribeToTicket(selectedTicketId);
        }
      },
      onMessage: handleRealtimeMessage,
      onError: (msg) => {
        setSocketConnected(false);
        console.error(msg);
      },
    });

    socketRef.current = socket;

    return () => {
      ticketSubscriptionRef.current?.unsubscribe?.();
      userQueueSubscriptionRef.current?.unsubscribe?.();
      socket.disconnect();
      setSocketConnected(false);
    };
  }, [handleRealtimeMessage, selectedTicketId]);

  useEffect(() => {
    if (!socketRef.current?.client?.connected) return;

    ticketSubscriptionRef.current?.unsubscribe?.();
    if (selectedTicketId) {
      ticketSubscriptionRef.current =
        socketRef.current.subscribeToTicket(selectedTicketId);
    }
  }, [selectedTicketId]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTickets(true);
      if (selectedTicketId) {
        fetchTicketDetails(selectedTicketId);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedTicketId, fetchTickets, fetchTicketDetails]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket]);

  const ticketListTitle = useMemo(
    () =>
      isAdmin
        ? supportT.allSupportTickets || "All Support Tickets"
        : supportT.mySupportTickets || "My Support Tickets",
    [isAdmin, supportT.allSupportTickets, supportT.mySupportTickets],
  );

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setSubmittingTicket(true);

    try {
      const response = await supportAPI.createTicket(ticketForm);
      toast.success(
        supportT.ticketCreatedSuccess || "Ticket created successfully",
      );
      setTicketForm(initialTicketForm);
      await fetchTickets(false);
      setSelectedTicketId(response.data.id);
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          supportT.createTicketFailed ||
          "Failed to create support ticket",
      );
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!selectedTicketId || !messageText.trim()) return;

    const outgoingMessage = messageText.trim();
    setSendingMessage(true);

    try {
      if (socketRef.current?.client?.connected) {
        socketRef.current.send(selectedTicketId, outgoingMessage);
        setMessageText("");
      } else {
        await supportAPI.sendMessage(selectedTicketId, {
          message: outgoingMessage,
        });
        setMessageText("");
        await fetchTicketDetails(selectedTicketId);
        await fetchTickets(true);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          supportT.sendMessageFailed ||
          "Failed to send message",
      );
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicketId) return;

    try {
      const response = await supportAPI.closeTicket(selectedTicketId);
      setSelectedTicket(response.data);
      await fetchTickets(true);
      toast.success(supportT.ticketClosed || "Ticket closed");
    } catch (error) {
      console.error(error);
      toast.error(supportT.closeTicketFailed || "Failed to close ticket");
    }
  };

  const handleReopenTicket = async () => {
    if (!selectedTicketId) return;

    try {
      const response = await supportAPI.reopenTicket(selectedTicketId);
      setSelectedTicket(response.data);
      await fetchTickets(true);
      toast.success(supportT.ticketReopened || "Ticket reopened");
    } catch (error) {
      console.error(error);
      toast.error(supportT.reopenTicketFailed || "Failed to reopen ticket");
    }
  };

  const handleMessageKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className={`support-page ${darkMode ? "dark-mode" : ""}`}>
      <div className="support-bg-decoration">
        <div className="support-circle support-circle-1"></div>
        <div className="support-circle support-circle-2"></div>
        <div className="support-circle support-circle-3"></div>
      </div>

      <div className="support-center">
        <div className="support-header-card">
          <div className="support-header-left">
            <div className="support-icon-wrap">
              <FaComments />
            </div>
            <div>
              <h2>{supportT.title || "Support Center"}</h2>
              <p>
                {supportT.subtitle ||
                  "Ask questions and get help from the administrator"}
              </p>
            </div>
          </div>

          <div className="support-header-right">
            <span
              className={`socket-status ${socketConnected ? "live" : "offline"}`}
            >
              <FaCircle />
              {socketConnected
                ? supportT.live || "Live"
                : supportT.offline || "Offline"}
            </span>

            <button
              className="support-action-button secondary"
              onClick={() => fetchTickets(true)}
            >
              <FaSyncAlt />
              <span>{supportT.refresh || "Refresh"}</span>
            </button>
          </div>
        </div>

        <div className="support-layout">
          <div className="support-sidebar">
            {!isAdmin && (
              <form
                className="support-create-form"
                onSubmit={handleCreateTicket}
              >
                <h3>
                  <FaPlus /> {supportT.askQuestion || "Ask a Question"}
                </h3>

                <input
                  type="text"
                  placeholder={supportT.subject || "Subject"}
                  value={ticketForm.subject}
                  onChange={(e) =>
                    setTicketForm((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  required
                />

                <input
                  type="text"
                  placeholder={
                    supportT.categoryOptional || "Category (optional)"
                  }
                  value={ticketForm.category}
                  onChange={(e) =>
                    setTicketForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                />

                <textarea
                  rows="4"
                  placeholder={supportT.typeQuestion || "Type your question..."}
                  value={ticketForm.message}
                  onChange={(e) =>
                    setTicketForm((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  required
                />

                <button
                  className="support-action-button primary full-width"
                  type="submit"
                  disabled={submittingTicket}
                >
                  <FaPlus />
                  <span>
                    {submittingTicket
                      ? supportT.submitting || "Submitting..."
                      : supportT.createTicket || "Create Ticket"}
                  </span>
                </button>
              </form>
            )}

            <div className="support-ticket-list">
              <div className="ticket-list-header">{ticketListTitle}</div>

              {loadingList ? (
                <div className="empty-state">
                  {supportT.loadingTickets || "Loading tickets..."}
                </div>
              ) : tickets.length === 0 ? (
                <div className="empty-state">
                  <FaInbox className="empty-icon" />
                  <span>{supportT.noTickets || "No tickets yet"}</span>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    className={`ticket-list-item ${
                      selectedTicketId === ticket.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedTicketId(ticket.id)}
                  >
                    <div className="ticket-list-top">
                      <strong>{ticket.ticketNumber}</strong>
                      <span
                        className={`status-badge status-${ticket.status?.toLowerCase()}`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <div className="ticket-subject">{ticket.subject}</div>

                    <div className="ticket-meta">
                      {isAdmin ? (
                        <span>
                          {ticket.createdByName} ({ticket.createdByRole})
                        </span>
                      ) : (
                        <span>{ticket.lastMessageAt || ticket.createdAt}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="support-main">
            {!selectedTicketId ? (
              <div className="empty-chat">
                {supportT.selectTicket || "Select a ticket to view messages"}
              </div>
            ) : loadingTicket ? (
              <div className="empty-chat">
                {supportT.loadingConversation || "Loading conversation..."}
              </div>
            ) : !selectedTicket ? (
              <div className="empty-chat">
                {supportT.ticketNotFound || "Ticket not found"}
              </div>
            ) : (
              <>
                <div className="chat-header">
                  <div>
                    <h3>{selectedTicket.subject}</h3>
                    <p>
                      {selectedTicket.ticketNumber} • {selectedTicket.status}
                      {isAdmin && selectedTicket.createdByName ? (
                        <>
                          {" "}
                          • {selectedTicket.createdByName} (
                          {selectedTicket.createdByRole})
                        </>
                      ) : null}
                    </p>
                  </div>

                  <div className="chat-actions">
                    {selectedTicket.status !== "CLOSED" ? (
                      <button
                        className="support-action-button warning"
                        onClick={handleCloseTicket}
                      >
                        <FaLock />
                        <span>{supportT.close || "Close"}</span>
                      </button>
                    ) : (
                      <button
                        className="support-action-button success"
                        onClick={handleReopenTicket}
                      >
                        <FaLockOpen />
                        <span>{supportT.reopen || "Reopen"}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="chat-messages">
                  {(selectedTicket.messages || []).map((msg) => (
                    <div
                      key={msg.id}
                      className={`chat-bubble ${msg.fromAdmin ? "admin" : "user"}`}
                    >
                      <div className="bubble-meta">
                        <strong>{msg.senderName}</strong> • {msg.senderRole}
                      </div>
                      <div className="bubble-text">{msg.message}</div>
                      <div className="bubble-time">
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleString()
                          : ""}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef}></div>
                </div>

                <form className="chat-input-area" onSubmit={handleSendMessage}>
                  <textarea
                    rows="3"
                    placeholder={
                      socketConnected
                        ? supportT.typeReplyLive || "Type your reply... (live)"
                        : supportT.typeReply || "Type your reply..."
                    }
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleMessageKeyDown}
                    disabled={selectedTicket.status === "CLOSED" && !isAdmin}
                  />

                  <button
                    className="support-send-button"
                    type="submit"
                    disabled={
                      sendingMessage ||
                      !messageText.trim() ||
                      (selectedTicket.status === "CLOSED" && !isAdmin)
                    }
                  >
                    <FaPaperPlane />
                    <span>
                      {sendingMessage
                        ? supportT.sending || "Sending..."
                        : supportT.send || "Send"}
                    </span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupportCenter;

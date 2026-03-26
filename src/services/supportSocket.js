import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:8443/api";

function getWsBaseUrl() {
  return API_BASE_URL.replace(/\/api$/, "");
}

export function createSupportSocket({ onConnected, onMessage, onError }) {
  const token = localStorage.getItem("accessToken") || "";

  const client = new Client({
    webSocketFactory: () =>
      new SockJS(
        `${getWsBaseUrl()}/ws-support${token ? `?token=${encodeURIComponent(token)}` : ""}`,
      ),
    reconnectDelay: 5000,
    debug: () => {},
    onConnect: () => {
      if (onConnected) onConnected(client);
    },
    onStompError: (frame) => {
      if (onError) {
        onError(frame.headers["message"] || "WebSocket broker error");
      }
    },
    onWebSocketError: () => {
      if (onError) {
        onError("WebSocket connection error");
      }
    },
  });

  client.activate();

  return {
    client,
    subscribeToTicket(ticketId) {
      if (!ticketId) return null;

      const subscription = client.subscribe(
        `/topic/support/${ticketId}`,
        (msg) => {
          const body = JSON.parse(msg.body);
          if (onMessage) onMessage(body);
        },
      );

      return subscription;
    },
    subscribeToUserQueue() {
      const subscription = client.subscribe(`/user/queue/support`, (msg) => {
        const body = JSON.parse(msg.body);
        if (onMessage) onMessage(body);
      });

      return subscription;
    },
    send(ticketId, message) {
      client.publish({
        destination: "/app/support.send",
        body: JSON.stringify({ ticketId, message }),
      });
    },
    disconnect() {
      client.deactivate();
    },
  };
}

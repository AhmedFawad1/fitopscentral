import { setEngineStatus, setSendMessage, setToast } from "@/store/profileSlice";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useSelector } from "react-redux";

export function useWhatsappManager({
  user,
  whatsappService,
  confirm,
  dispatch,
}) {
  const sendMsg = useSelector((s) => s.profile.sendMessage);
  const enabled = !!user && user.tier >= 8;

  const wsRef = useRef(null);
  const connectingRef = useRef(false);
  const prevSnapshotRef = useRef(null);

  // 🔥 SINGLE SOURCE OF TRUTH (frontend)
  const [session, setSession] = useState(null);

  // UI helpers
  const [qr, setQr] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  /* -------------------------------------------------
   * WebSocket Connection
   * ------------------------------------------------- */
  const connectWS = () => {
    if (wsRef.current) return;

    const connect = () => {
      const ws = new WebSocket("ws://localhost:8810");

      ws.onopen = () => {
        wsRef.current = ws;
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          // 🔥 AUTHORITATIVE STATE
          case "SESSION_SNAPSHOT": {
            setSession(msg);

            // QR handling
            if (msg.qrAvailable && !qr) {
              // QR comes separately as `qr` event
            }
            if (!msg.qrAvailable) {
              setQr(null);
            }

            // -------- transition-based UX ----------
            const prev = prevSnapshotRef.current;

            if (prev) {
              if (prev.internetUp && !msg.internetUp) {
                dispatch(setToast({
                  type: "error",
                  message: "Internet lost. Messages will be queued 📦",
                }));
                dispatch(setEngineStatus("Internet Disconnected 🌑"));
              }

              if (!prev.ready && msg.ready) {
                dispatch(setEngineStatus("WhatsApp Connected 🟢"));
              }

              if (!prev.reconnecting && msg.reconnecting) {
                dispatch(setEngineStatus("Reconnecting WhatsApp… ♻️"));
              }
            }

            prevSnapshotRef.current = msg;
            break;
          }

          // 🔹 Legacy QR payload
          case "qr": {
            const dataURL = await QRCode.toDataURL(msg.qr);
            setQr(dataURL);
            break;
          }

          // 🔹 Message lifecycle (events, NOT truth)
          case "sent":
            dispatch(setToast({ type: "success", message: "Message sent ✅" }));
            break;

          case "send_failed":
            dispatch(setToast({ type: "error", message: "Message failed ❌" }));
            break;

          default:
            break;
        }
      };

      ws.onerror = () => ws.close();

      ws.onclose = () => {
        wsRef.current = null;
        setTimeout(connect, 1000);
      };
    };

    connect();
  };

  /* -------------------------------------------------
   * Engine Startup
   * ------------------------------------------------- */
  useEffect(() => {
    if (!enabled || connectingRef.current) return;

    connectingRef.current = true;

    whatsappService
      .startEngine()
      .then(() => setTimeout(connectWS, 800))
      .catch(() => {
        connectingRef.current = false;
      });
  }, [enabled]);

  useEffect(() => {
    if (sendMsg) {
      // Handle send message action from the store
      // For example, you can call sendMessage here
      sendMessage(sendMsg.number, sendMsg.text);

      // Clear the sendMessage action in the store after handling
      dispatch(setSendMessage(null));
    }
  }, [sendMsg]);
  /* -------------------------------------------------
   * Actions
   * ------------------------------------------------- */
  const sendMessage = async (number, text) => {
    if (!wsRef.current) return;

    setSendingMessage(true);
    try {
      wsRef.current.send(
        JSON.stringify({
          type: "send",
          number,
          text,
        })
      );
    } finally {
      setSendingMessage(false);
    }
  };

  /* -------------------------------------------------
   * Derived UI State (NO GUESSING)
   * ------------------------------------------------- */
  const uiState = (() => {
    if (!enabled) return "disabled";
    if (!session) return "INITIALIZING";

    switch (session.enginePhase) {
      case "NEED_QR":
        return "AUTH_REQUIRED";
      case "READY":
        return "READY";
      case "RECONNECTING":
        return "RECONNECTING";
      case "ERROR":
        return "ERROR";
      default:
        return "INITIALIZING";
    }
  })();

  return {
    // 🔥 expose session, not guesses
    session,
    state: uiState,

    qr,
    ready: session?.ready === true,
    obj: session, // temporary compatibility

    sendMessage,
    sendingMessage,

    selectedMessage,
    setSelectedMessage,
  };
}


export function normalizePK(contact) {
  if (!contact) return null;

  // 1. Remove all non-digit characters except leading +
  contact = contact.toString().trim();
  contact = contact.replace(/\s+/g, "");         // remove spaces
  contact = contact.replace(/[()-]/g, "");       // remove formatting symbols

  // 2. Convert +92 → 92
  if (contact.startsWith("+")) {
    contact = contact.slice(1);
  }

  // 3. Convert 0092 → 92
  if (contact.startsWith("0092")) {
    contact = contact.replace(/^0092/, "92");
  }

  // 4. Convert 92xxxxxxxxxx → keep as is
  if (contact.startsWith("92")) {
    return contact;
  }

  // 5. Convert 03xxxxxxxxx → remove leading 0 then prepend 92
  if (contact.startsWith("0")) {
    contact = contact.replace(/^0+/, ""); // remove all leading zeros
    return "92" + contact;
  }

  // 6. Convert 3xxxxxxxxx → prepend 92
  if (/^[1-9]\d{8,10}$/.test(contact)) {
    return "92" + contact;
  }

  // 7. Anything else is invalid
  return null;
}

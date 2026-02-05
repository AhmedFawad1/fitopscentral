'use client';

import { X } from "lucide-react";
import React, { useEffect } from "react";

const StatusBadge = ({ color, label }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
    {label}
  </span>
);

export default function WhatsappUI({
  state,
  session,
  qr,
  sendMessage,
  history = [],
  loadingHistory,
  historyError,
  selectedMessage,
  setSelectedMessage,
  sendingMessage,
  resendMessage,
}) {
  useEffect(() => {
    console.log("WHATSAPP_UI_STATE", state, session);
  }, [state, session]);

  /* ------------------ DISABLED ------------------ */
  if (state === "disabled") {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-5 space-y-2">
        <StatusBadge color="bg-yellow-100 text-yellow-800" label="Plan Restricted" />
        <h3 className="text-sm font-semibold text-yellow-900">
          WhatsApp Automation Disabled
        </h3>
        <p className="text-sm text-yellow-800">
          Your current subscription does not include WhatsApp automation.
        </p>
      </div>
    );
  }

  /* ------------------ INITIALIZING ------------------ */
  if (state === "INITIALIZING") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <StatusBadge color="bg-gray-100 text-gray-700" label="Initializing" />
        <h3 className="text-sm font-semibold text-gray-900">
          Preparing WhatsApp Session
        </h3>
        <p className="text-sm text-gray-600">
          Starting secure WhatsApp Web session…
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="animate-pulse h-2 w-2 rounded-full bg-gray-400" />
          Waiting for readiness…
        </div>
      </div>
    );
  }

  /* ------------------ QR REQUIRED ------------------ */
  if (state === "AUTH_REQUIRED") {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <StatusBadge color="bg-blue-100 text-blue-800" label="Action Required" />
          <h3 className="text-base font-semibold text-blue-900">
            Link WhatsApp Account
          </h3>
          <p className="text-sm text-blue-800">
            Scan the QR code using WhatsApp mobile.
          </p>

          <ol className="text-sm text-blue-800 list-decimal ml-4 space-y-1">
            <li>Open WhatsApp</li>
            <li>Settings → Linked Devices</li>
            <li>Link a device</li>
            <li>Scan QR</li>
          </ol>

          <p className="text-xs text-blue-700">
            One-time step unless session is cleared.
          </p>
        </div>

        {qr && (
          <div className="flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow border">
              <img src={qr} alt="WhatsApp QR" className="w-64 h-64" />
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ------------------ READY / CONNECTED ------------------ */
  if (state === "READY" && session) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 space-y-4">
        <WhatsappOverlay
          selectedMessage={selectedMessage}
          setSelectedMessage={setSelectedMessage}
          resendMessage={resendMessage}
          sendingMessage={sendingMessage}
        />

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <StatusBadge color="bg-green-100 text-green-800" label="Connected" />
            <h3 className="text-base font-semibold text-green-900">
              WhatsApp Connected
            </h3>
            <p className="text-sm text-green-800">
              Messages are being delivered.
            </p>
            <div className="text-sm text-green-700">
              {`Queue: ${session.queueSize} | Internet: ${
                session.internetUp ? "✅" : "❌"
              } | Ready: ${session.ready ? "✅" : "❌"}`}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Live
          </div>
        </div>

        <button
          onClick={() => sendMessage("+923328266209", "Test message")}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md"
        >
          Send Test Message
        </button>

        {/* HISTORY (unchanged) */}
        {loadingHistory && (
          <div className="mt-6 text-sm text-gray-500 animate-pulse">
            Loading history…
          </div>
        )}

        {historyError && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            Failed to load history
          </div>
        )}

        {history.length > 0 && (
          <HistoryTable history={history} setSelectedMessage={setSelectedMessage} />
        )}
      </div>
    );
  }

  /* ------------------ RECONNECTING ------------------ */
  if (state === "RECONNECTING") {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-5 space-y-2">
        <StatusBadge color="bg-yellow-100 text-yellow-800" label="Reconnecting" />
        <h3 className="text-sm font-semibold text-yellow-900">
          WhatsApp reconnecting…
        </h3>
        <p className="text-sm text-yellow-800">
          Messages will resume automatically.
        </p>
      </div>
    );
  }

  /* ------------------ ERROR / FALLBACK ------------------ */
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5 space-y-2">
      <StatusBadge color="bg-red-100 text-red-800" label="Unavailable" />
      <h3 className="text-sm font-semibold text-red-900">
        WhatsApp unavailable
      </h3>
      <p className="text-sm text-red-800">
        {session?.lastError || "Please reinitialize the session."}
      </p>
    </div>
  );
}

/* ------------------ SUPPORT COMPONENTS ------------------ */

function HistoryTable({ history, setSelectedMessage }) {
  return (
    <div className="mt-6 bg-white border rounded-xl overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left">Recipient</th>
            <th className="px-4 py-2 text-left">Message</th>
            <th className="px-4 py-2 text-center">Status</th>
            <th className="px-4 py-2 text-center">Attempts</th>
            <th className="px-4 py-2 text-left">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {history.map((row) => (
            <tr
              key={row.id}
              className={row.status !== "SENT" ? "cursor-pointer hover:bg-gray-50" : ""}
              onClick={() => row.status !== "SENT" && setSelectedMessage(row)}
            >
              <td className="px-4 py-2 font-medium">{row.to_number}</td>
              <td className="px-4 py-2 truncate max-w-[300px]">{row.body}</td>
              <td className="px-4 py-2 text-center">
                <StatusPill status={row.status} />
              </td>
              <td className="px-4 py-2 text-center">{row.attempts}</td>
              <td className="px-4 py-2 text-xs">
                {new Date(row.created_at_local).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    SENT: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    QUEUED: "bg-yellow-100 text-yellow-800",
    SENDING: "bg-blue-100 text-blue-800",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${map[status] || ""}`}>
      {status}
    </span>
  );
}

function WhatsappOverlay({
  selectedMessage,
  setSelectedMessage,
  resendMessage,
  sendingMessage,
}) {
  if (!selectedMessage) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
        <X className="absolute top-4 right-4 cursor-pointer" onClick={() => setSelectedMessage(null)} />
        <h2 className="text-lg font-semibold mb-4">Retry Message</h2>
        <p className="text-sm mb-4 whitespace-pre-wrap">{selectedMessage.body}</p>
        <button
          onClick={() => resendMessage(selectedMessage)}
          disabled={sendingMessage}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          {sendingMessage ? "Sending…" : "Retry"}
        </button>
      </div>
    </div>
  );
}

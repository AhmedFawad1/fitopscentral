'use client'
import { X } from "lucide-react";
import React, { useEffect } from "react";

const StatusBadge = ({ color, label }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color}`}
  >
    {label}
  </span>
);

export default function WhatsappUI({ 
    state,
    qr, 
    sendMessage, 
    fetchHistory,
    history,
    loadingHistory,
    historyError, 
    user,
    selectedMessage,
    setSelectedMessage,
    sendingMessage,
    resendMessage ,
    ready,
    obj
  }) {
  useEffect(() => {
    console.log("WHATSAPP_STATE_CHANGED", state);
  }, [state]);

  /* ------------------ disabled ------------------ */
  if (state === "disabled") {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-5 space-y-2">
        <StatusBadge color="bg-yellow-100 text-yellow-800" label="Plan Restricted" />
        <h3 className="text-sm font-semibold text-yellow-900">
          WhatsApp Automation Disabled
        </h3>
        <p className="text-sm text-yellow-800">
          Your current subscription does not include WhatsApp automation.
          Upgrade your plan to enable message delivery, retries, and analytics.
        </p>
      </div>
    );
  }

  /* ------------------ initializing ------------------ */
  if (
    state === "INITIALIZING" ||
    state === "MISSING" ||
    state === "idle"
  ) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <StatusBadge color="bg-gray-100 text-gray-700" label="Initializing" />
        <h3 className="text-sm font-semibold text-gray-900">
          Preparing WhatsApp Session
        </h3>
        <p className="text-sm text-gray-600">
          We are starting a secure WhatsApp Web session in the background.
          This usually takes a few seconds.
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="animate-pulse h-2 w-2 rounded-full bg-gray-400" />
          Waiting for client readiness…
        </div>
      </div>
    );
  }

  /* ------------------ QR required ------------------ */
  if (state === "AUTH_REQUIRED") {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <StatusBadge color="bg-blue-100 text-blue-800" label="Action Required" />
          <h3 className="text-base font-semibold text-blue-900">
            Link WhatsApp Account
          </h3>
          <p className="text-sm text-blue-800">
            Scan the QR code using your WhatsApp mobile app to securely
            link this number.
          </p>

          <ol className="text-sm text-blue-800 list-decimal ml-4 space-y-1">
            <li>Open WhatsApp on your phone</li>
            <li>Go to <b>Settings → Linked Devices</b></li>
            <li>Tap <b>Link a device</b></li>
            <li>Scan the QR code</li>
          </ol>

          <p className="text-xs text-blue-700">
            This is a one-time step unless you log out or clear sessions.
          </p>
        </div>

        {qr && (
          <div className="flex flex-col items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow border">
              <img
                src={qr}
                alt="WhatsApp QR"
                className="w-64 h-64"
              />
            </div>
            <p className="mt-2 text-xs text-blue-700">
              QR expires automatically — refresh if needed
            </p>
          </div>
        )}
      </div>
    );
  }

  /* ------------------ connected ------------------ */
  if (ready) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 space-y-4">
          <WhatsappOverlay
            selectedMessage={selectedMessage}
            setSelectedMessage={setSelectedMessage}
            resendMessage={resendMessage}
          />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <StatusBadge color="bg-green-100 text-green-800" label="Connected" />
            <h3 className="text-base font-semibold text-green-900">
              WhatsApp Connected
            </h3>
            <p className="text-sm text-green-800">
              Messages can now be queued and delivered via WhatsApp.
            </p>
            <div className="text-sm text-green-700">
               {`Queued ${obj.queueSize} | Internet: ${obj.internetUp ? '✅' : '❌'} | WhatsApp Ready: ${obj.ready ? '✅' : '❌'}`}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Live session active
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() =>
              sendMessage("+923328266209", "Test message")
            }
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md shadow-sm"
          >
            Send Test Message
          </button>      
        </div>
        {loadingHistory && (
            <div className="mt-6 text-sm text-gray-500 animate-pulse">
              Loading message history…
            </div>
          )}

          {historyError && (
            <div className="mt-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              Failed to load message history: {historyError}
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">
                  Message Delivery History
                </h3>
                <span className="text-xs text-gray-500">
                  Last {history.length} messages
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 border-b">
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
                      <tr key={row.id} className={` border-gray-300 ${row.status !== 'SENT' ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}`}
                        onClick={() => {
                          if(row.status === 'SENT') return; // no retries for sent messages
                          setSelectedMessage(row);
                        }}
                      >
                        <td className="px-4 py-2 font-medium text-gray-800">
                          {row.to_number}
                        </td>

                        <td className="px-4 py-2 max-w-[320px] truncate text-gray-700">
                          {row.body}
                        </td>

                        <td className="px-4 py-2 text-center">
                          <StatusPill status={row.status} />
                        </td>

                        <td className="px-4 py-2 text-center text-gray-600">
                          {row.attempts}
                        </td>

                        <td className="px-4 py-2 text-xs text-gray-500">
                          {new Date(row.created_at_local).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>
    );
  }

  /* ------------------ fallback ------------------ */
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5 space-y-2">
      <StatusBadge color="bg-red-100 text-red-800" label="Unavailable" />
      <h3 className="text-sm font-semibold text-red-900">
        {state}
      </h3>
      <p className="text-sm text-red-800">
        The WhatsApp service is currently unreachable or has crashed.
        Please refresh the page or re-initialize the session.
      </p>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    SENT: "bg-green-100 text-green-800 border-green-300",
    FAILED: "bg-red-100 text-red-800 border-red-300",
    QUEUED: "bg-yellow-100 text-yellow-800 border-yellow-300",
    SENDING: "bg-blue-100 text-blue-800 border-blue-300"
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
        map[status] || "bg-gray-100 text-gray-700 border-gray-300"
      }`}
    >
      {status}
    </span>
  );
}

export function WhatsappOverlay({
  selectedMessage,
  setSelectedMessage,
  resendMessage,
  sendingMessage
}){
  return (
    <div className={`fixed ${selectedMessage ? "" : "hidden"} inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center z-50`}>
      <div className="bg-white relative p-6 rounded-lg shadow-lg max-w-md w-full">
        <X className="h-6 w-6 text-gray-600 cursor-pointer absolute top-4 right-4"
          onClick={() => setSelectedMessage(null)}
        />
        <h2 className="text-lg font-semibold mb-4">Retry Message</h2>
        <div className="grid grid-cols-2">
            <LabelDisplay label="To" value={selectedMessage?.to_number} />
            <LabelDisplay label="Status" value={selectedMessage?.status} />
            <LabelDisplay label="Attempts" value={selectedMessage?.attempts} />
            <LabelDisplay label="Created At" value={new Date(selectedMessage?.created_at_local).toLocaleString()} />
            <LabelDisplay label="Failure Code" value={selectedMessage?.failure_code || 'N/A'} />
            <LabelDisplay label="Failure Message" value={selectedMessage?.failure_message || 'N/A'} />
        </div>
        <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-1">Message Body</h3>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedMessage?.body}</p>
        </div>
        <div className="">
            <button
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${sendingMessage ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={async() => {
                    if(!selectedMessage) return;
                    await resendMessage(selectedMessage);
                    //setSelectedMessage(null);

                }}
            >
                {sendingMessage ? 'Sending...' : 'Retry Sending Message'}
            </button>
          </div>
      </div>
    </div>
  )
}

export function LabelDisplay({ label, value }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold text-gray-700">{label}</h3>
      <p className="mt-1 text-sm text-gray-900">{value}</p>
    </div>
  );
}
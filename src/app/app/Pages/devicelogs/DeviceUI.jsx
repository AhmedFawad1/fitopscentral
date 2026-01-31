import React from 'react'
import { motion } from 'framer-motion'
export default function DeviceUI({
    logs,
    status,
    connectDevice
}) {
  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.8 } }}
        exit={{ opacity: 0 }}
        className='flex flex-col py-5 overflow-auto px-10 lg:px-5 bg-(--page-bg)'>
      <div className="p-6 space-y-6">

        {/* HEADER */}
        <motion.div 
            className="text-center py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <h1 className="text-3xl font-bold">Device Manager</h1>
            <p className="text-gray-500">Real-time attendance & device control</p>
        </motion.div>

        {/* STATUS CARD */}
        <motion.div
            className="bg-[var(--background)] shadow rounded-xl p-5 border"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
        >
            <div className="flex items-center justify-between">
            <div>
                <h2 className="text-xl font-semibold">Device Status</h2>
                <p className="text-gray-400 text-sm">
                {status === "connected"
                    ? "Connected to device"
                    : status === "connecting"
                    ? "Connecting…"
                    : "Disconnected"}
                </p>
            </div>

            <div
                className={`h-4 w-4 rounded-full ${
                status === "connected"
                    ? "bg-green-500"
                    : status === "connecting"
                    ? "bg-yellow-400"
                    : "bg-red-500"
                }`}
            ></div>
            
            </div>

            {/* <button
            onClick={connectDevice}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
            Connect Device
            </button> */}
        </motion.div>
        <motion.div
            className="bg-black text-green-400 p-4 rounded-xl shadow-lg font-mono text-sm h-64 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {logs.map((log, i) => (
            <div key={i}>{log}</div>
            ))}
        </motion.div>
        </div>
    </motion.div>
  )
}

'use client'
import Logo from "@/app/site-components/Logo"
import { motion } from "framer-motion"

export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white z-50">
      {/* Animated Icon */}
      <motion.div
        className="flex items-center justify-center w-24 h-24 rounded-full border-4 border-[var(--primary-color,#22d3ee)] shadow-[0_0_30px_#22d3ee40]"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
          boxShadow: [
            "0 0 20px #22d3ee50",
            "0 0 40px #22d3ee80",
            "0 0 20px #22d3ee50",
          ],
        }}
        transition={{
          repeat: Infinity,
          duration: 2.5,
          ease: "easeInOut",
        }}
      >
        <motion.span
          className="text-4xl font-bold tracking-wider"
          animate={{
            opacity: [1, 0.5, 1],
            color: ["#22d3ee", "#67e8f9", "#22d3ee"],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut",
          }}
        >
          <Logo size={48} color="var(--primary-color,#22d3ee)" />
        </motion.span>
      </motion.div>

      {/* Subtext */}
      <motion.p
        className="mt-6 text-gray-300 text-sm tracking-widest uppercase"
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
        }}
      >
        Loading your dashboard...
      </motion.p>
    </div>
  )
}

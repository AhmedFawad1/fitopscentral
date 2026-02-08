'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, PlayCircle } from 'lucide-react'

export default function VideoDemoModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-6 py-3 
                   rounded-full border border-[var(--border)] 
                   text-foreground font-medium
                   hover:bg-muted/10 transition"
      >
        <PlayCircle size={20} />
        Watch 60s Demo
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="relative w-full max-w-4xl rounded-3xl bg-background 
                         border border-[var(--border)] shadow-xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 z-10 
                           p-2 rounded-full bg-background/80 
                           hover:bg-muted/20 transition"
              >
                <X size={20} />
              </button>

              {/* Video */}
              <div className="relative w-full aspect-video bg-black">
                {/* OPTION 1: YouTube / Loom */}
                <iframe
                  src="https://www.youtube.com/embed/VIDEO_ID?autoplay=1"
                  title="FitOpsCentral Demo"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />

                {/* OPTION 2: Self-hosted MP4 (comment iframe above) */}
                {/*
                <video
                  src="/demo/fitops-demo.mp4"
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                />
                */}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

"use client";

import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSuccessModal } from "@/store/authSlice";
import { motion, AnimatePresence } from "framer-motion";

export default function SuccessModal() {
    const dispatch = useDispatch();
    const validation = useSelector((state) => state.auth.validation);
    const successModal = useSelector((state) => state.auth.successModal);

    useEffect(() => {
        let timer;
        if (successModal?.visible) {
            timer = setTimeout(() => {
                dispatch(setSuccessModal({ ...successModal, visible: false }));
            }, 2000);
        }
        return () => clearTimeout(timer);
    }, [successModal, dispatch]);


    return (
        <AnimatePresence>
            {validation && successModal?.visible && (
                <motion.div
                    className="fixed inset-0 flex items-center justify-center z-50 
                               backdrop-blur-md bg-black/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    <motion.div
                        className="relative w-[92%] max-w-sm rounded-2xl p-6 
                                   shadow-xl bg-[var(--background)] border border-white/40 
                                   backdrop-blur-xl text-center"
                        initial={{ opacity: 0, scale: 0.85, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 20 }}
                        transition={{ type: "spring", stiffness: 140, damping: 14 }}
                    >
                        {/* ICON */}
                        <div className="flex justify-center mb-4">
                            <div className="h-14 w-14 rounded-full bg-green-500/20 
                                            flex items-center justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="green"
                                    className="w-8 h-8"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4.5 12.75l6 6 9-13.5"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* MESSAGE */}
                        <p className="text-lg font-semibold">
                            {successModal.message}
                        </p>

                        {/* AUTO CLOSE INFO */}
                        {/* <p className="text-xs mt-3 opacity-70">
                            Closing automatically…
                        </p> */}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

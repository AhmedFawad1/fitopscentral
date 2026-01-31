import React, { useState } from 'react'
import WhatsappUI from './WhatsappUI'
import { useSelector } from 'react-redux';
import { useCheckInternet } from '@/hooks/useCheckInternet';
import { useWhatsappManager } from './useWhatsappManager';
import { useDispatch } from 'react-redux';
import { whatsappService } from './whatsappService';
import { useConfirm } from '@/hooks/useConfirm';
import { motion } from 'framer-motion';
export default function WhatsappContainer({
  show
}) {
    const user = useSelector(s => s.auth.user);
    const RoleBook = user.role_manager || {};
    const branches = user.all_branches_json || [];
    const dispatch = useDispatch();
    const { confirm } = useConfirm();
    const logic = useWhatsappManager({
        user,
        whatsappService: whatsappService,
        confirm,
        dispatch
    });
  return (
    show && 
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.8 } }}
        exit={{ opacity: 0 }} 
        className="h-screen p-8 overflow-y-auto">
        <WhatsappUI {...logic} />
    </motion.div>
  )
}

'use client'
import React, { use, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useConfirm } from '@/hooks/useConfirm';
import { setLocalUpdate, setSuccessModal } from '@/store/authSlice';

import { useAdmissionManager } from './useAdmissionManager';
import { whatsappService } from '../whatsapp/whatsappService';
import { admissionService } from './admissionService';
import { genUUID } from '../uuid';
import AdmissionsUI from './AdmissionsUI';


export default function AdmissionsContainer() {
  const user = useSelector(s => s.auth.user);
  const RoleBook = user.role_manager || {};
  const branches = user.all_branches_json || [];
  const [showOverlay, setShowOverlay] = useState(false);
  const dispatch = useDispatch();
  const { confirm } = useConfirm();

  const logic = useAdmissionManager({
    user,
    confirm,
    admissionService,
    uuid: genUUID,
    dispatch,
    setLocalUpdate,
    whatsappService,
    setSuccessModal
  });

  return (
    <AdmissionsUI
      {...logic}
      branches={branches}
      user={user}
      showOverlay={showOverlay}
      setShowOverlay={setShowOverlay}
      singleBranch={user.max_branches === 1}
      permissions={RoleBook[user.role?.toLowerCase()] || {}}
    />
  );
}

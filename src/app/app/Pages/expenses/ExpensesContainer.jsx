'use client'
import React, { use, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useConfirm } from '@/hooks/useConfirm';
import { setLocalUpdate, setSuccessModal } from '@/store/authSlice';

import { useExpenseManager } from './useExpenseManager';
import { expenseService } from './expenseService';
import { genUUID } from '../uuid';
import ExpensesUI from './ExpensesUI';

export default function ExpensesContainer() {
  const user = useSelector(s => s.auth.user);
  const RoleBook = user.role_manager || {};
  const branches = user.all_branches_json || [];
  const [showOverlay, setShowOverlay] = useState(false);
  const dispatch = useDispatch();
  const { confirm } = useConfirm();

  const logic = useExpenseManager({
    user,
    confirm,
    expenseService,
    uuid: genUUID,
    dispatch,
    setLocalUpdate,
    setSuccessModal,
    setShowOverlay
  });

  return (
    <ExpensesUI
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

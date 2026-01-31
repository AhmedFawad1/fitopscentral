'use client'
import React, { use, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useConfirm } from '@/hooks/useConfirm';
import { setLocalUpdate, setSuccessModal } from '@/store/authSlice';
import { genUUID } from '../uuid';
import CustomersUI from './CustomersUI';
import { useCustomerManager } from './useCustomerManager';
import { customerService } from './customerService';
import ReceiptContainer from '../Receipts/ReceiptContainer';

export default function CustomersContainer({
    setSelectedCustomer,
    setSelectedTab
}) {
  const user = useSelector(s => s.auth.user);
  const RoleBook = user.role_manager || {};
  const branches = user.all_branches_json || [];
  const selectedFilter = useSelector((state) => state.auth.selectedFilter);
  const [showOverlay, setShowOverlay] = useState(false);
  const dispatch = useDispatch();
  const { confirm } = useConfirm();

  const logic = useCustomerManager({
    user,
    selectedFilter,
    setSelectedTab,
    permissions: RoleBook[user.role?.toLowerCase()] || {},
    branch_id: user.branch_id,
    singleBranch: user.max_branches === 1,
    confirm,
    customerService,
    uuid: genUUID,
    dispatch,
    setLocalUpdate,
    setSuccessModal
  });
  
  return (
    <>
      
      <CustomersUI
        {...logic}
        setSelectedTab={setSelectedTab}
        branches={branches}
        user={user}
        setSelectedCustomer={setSelectedCustomer}
        showOverlay={showOverlay}
        setShowOverlay={setShowOverlay}
        singleBranch={user.max_branches === 1}
        permissions={RoleBook[user.role?.toLowerCase()] || {}}
      />
    </>
  );
}

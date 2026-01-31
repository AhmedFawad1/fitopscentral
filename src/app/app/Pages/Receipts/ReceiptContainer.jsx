'use client'
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useConfirm } from '@/hooks/useConfirm';
import { setLocalUpdate, setSuccessModal } from '@/store/authSlice';
const { useReceiptManager } = require('./useReceiptManager');
const { receiptService } = require('./receiptService');
const {resourceServices } = require('../../resourceServices');
import { genUUID } from '../uuid';
import ReceiptUI from './ReceiptUI';

export default function ReceiptContainer({
    selectedTab,
    setSelectedTab,
    selectedCustomer,
    setSelectedCustomer
}) {
  const user = useSelector(s => s.auth.user);
  const RoleBook = user.role_manager || {};
  const branches = user.all_branches_json || [];
  const dispatch = useDispatch();
  const { confirm } = useConfirm();
  const logic = useReceiptManager({   
    user,
    customer: selectedCustomer,
    selectedTab,
    setSelectedTab,
    setSelectedCustomer,
    confirm,
    receiptService,
    resourceServices,
    uuid: genUUID,
    dispatch,
    setLocalUpdate,
    setSuccessModal
  });  
  return (
    <ReceiptUI
        {...logic}
        customer={selectedCustomer}
        branches={branches}
        singleBranch={user.max_branches === 1}
        permissions={RoleBook[user.role?.toLowerCase()] || {}}
        onClose={()=>{
            setSelectedCustomer(null)
        }}
    />
  );
}
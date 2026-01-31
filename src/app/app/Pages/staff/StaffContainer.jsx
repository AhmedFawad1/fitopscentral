'use client'
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useConfirm } from '@/hooks/useConfirm';
import { setLocalUpdate, setSuccessModal } from '@/store/authSlice';

import { useStaffManager } from './useStaffManager';
import { staffService } from './staffService';
import { genUUID } from '../uuid';
import StaffUI from './StaffUI';


export default function StaffContainer() {
    const user = useSelector(s => s.auth.user);
    const RoleBook = user.role_manager || {};
    const branches = user.all_branches_json || [];
    const dispatch = useDispatch();
    const { confirm } = useConfirm();

    const logic = useStaffManager({
        user,
        confirm,
        staffService,
        uuid: genUUID,
        dispatch,
        setLocalUpdate,
        setSuccessModal
    });
  return (
    <StaffUI
        {...logic}
        branches={branches}
        singleBranch={user.max_branches === 1}
        permissions={RoleBook[user.role?.toLowerCase()] || {}}
    />
  )
}

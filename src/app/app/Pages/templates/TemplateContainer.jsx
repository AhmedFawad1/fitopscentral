'use client'
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useConfirm } from '@/hooks/useConfirm';
import { setLocalUpdate, setSuccessModal } from '@/store/authSlice';

import { useTemplateManager } from './useTemplateManager';
import { templateService } from './templateService';
import { genUUID } from '../uuid';
import TemplateUI from './TemplateUI';


export default function TemplateContainer() {
    const user = useSelector(s => s.auth.user);
    const RoleBook = user.role_manager || {};
    const branches = user.all_branches_json || [];
    const dispatch = useDispatch();
    const { confirm } = useConfirm();

    const logic = useTemplateManager({
        user,
        confirm,
        templateService,
        uuid: genUUID,
        dispatch,
        setLocalUpdate,
        setSuccessModal
    });
  return (
    <TemplateUI
        {...logic}
        branches={branches}
        singleBranch={user.max_branches === 1}
        permissions={RoleBook[user.role?.toLowerCase()] || {}}
    />
  )
}

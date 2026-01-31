'use client'
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useConfirm } from '@/hooks/useConfirm';
import { setLocalUpdate, setSuccessModal } from '@/store/authSlice';

import PackageFormView from './PackageFormView';
import { usePackageManager } from './usePackageManager';
import { packageService } from './packageService';
import { genUUID } from '../uuid';

export default function PackagesContainer() {
  const user = useSelector(s => s.auth.user);
  const RoleBook = user.role_manager || {};
  const branches = user.all_branches_json || [];
  const dispatch = useDispatch();
  const { confirm } = useConfirm();

  const logic = usePackageManager({
    user,
    confirm,
    packageService,
    uuid: genUUID,
    dispatch,
    setLocalUpdate,
    setSuccessModal
  });

  return (
    <PackageFormView
      {...logic}
      branches={branches}
      singleBranch={user.max_branches === 1}
      permissions={RoleBook[user.role?.toLowerCase()] || {}}
    />
  );
}

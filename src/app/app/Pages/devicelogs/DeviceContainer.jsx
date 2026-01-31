'use client'
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useConfirm } from '@/hooks/useConfirm';
import { setLocalUpdate, setSuccessModal } from '@/store/authSlice';
import DeviceUI from './DeviceUI';


export default function DeviceContainer() {
  const user = useSelector(s => s.auth.user);
  const logs = useSelector(s => s.profile.eventLogs);
  const status = useSelector(s => s.profile.deviceStatus);
  const RoleBook = user.role_manager || {};
  const branches = user.all_branches_json || [];
  const dispatch = useDispatch();
  const { confirm } = useConfirm();

  return (
    <DeviceUI
      logs={logs}
      status={status}
    />
  );
}

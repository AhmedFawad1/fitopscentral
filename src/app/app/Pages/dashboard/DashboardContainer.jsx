'use client'
import React, { use, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useConfirm } from '@/hooks/useConfirm';
import { setLocalUpdate, setSuccessModal } from '@/store/authSlice';

import { genUUID } from '../uuid';
import DashboardUI from './DashboardUI';
import { useDashboardManager } from './useDashboardManager';


export default function DashboardContainer() {
    const user = useSelector((state) => state.auth.user);
    const gymId = useSelector((state) => state.auth.user?.gym_id);
    const branchId = useSelector((state) => state.auth.user?.branch_id);
    const role = useSelector((state) => state.auth.user?.role_manager[state.auth.user?.role] || {});
    const login = useDashboardManager({
        user,
        gymId,
        branchId,
        role
    })
    return(
        <DashboardUI 
            {...login}
            user={user}
        />
    )
}
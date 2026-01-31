'use client'
import React, { use, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useConfirm } from '@/hooks/useConfirm';
import { setLocalUpdate, setSuccessModal } from '@/store/authSlice';

import { genUUID } from '../uuid';
import SalesUI from './SalesUI';
import { useSalesManager } from './useSalesManager';



export default function SalesContainer() {
    const user = useSelector((state) => state.auth.user);
    const branches = useSelector((state) => state.auth.user.all_branches_json || []);
    const gymId = useSelector((state) => state.auth.user?.gym_id);
    const branchId = useSelector((state) => state.auth.user?.branch_id);
    const permissions = useSelector((state) => state.auth.user?.role_manager[state.auth.user?.role] || {});
    const login = useSalesManager({
        user,
        branches,
        gymId,
        branchId,
        permissions,
        singleBranch: user.max_branches === 1
    });

    return(
        <SalesUI 
            {...login}
        />
    )
}
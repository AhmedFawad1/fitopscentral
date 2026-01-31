'use client'
import React, { use, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useConfirm } from '@/hooks/useConfirm';
import { setLocalUpdate, setSuccessModal } from '@/store/authSlice';

import { genUUID } from '../uuid';
import UserUI  from './UserUI';
import { useUserManager } from './useUserManager';
import { userService } from './userService';
import { useCheckInternet } from '@/hooks/useCheckInternet';
import { useRuntime } from '@/hooks/useRuntime';

export default function UserContainer() {
    const user = useSelector(s => s.auth.user);
    const RoleBook = user.role_manager || {};
    const branches = user.all_branches_json || [];
    const [showBranchOverlay, setShowBranchOverlay] = useState(false);
    const dispatch = useDispatch();
    const { confirm } = useConfirm();
    const  connected  = useCheckInternet();
    const { isTauri, isWeb } = useRuntime();
    const logic = useUserManager({
        user,
        branches,
        confirm,
        userService,
        useUserManager,
        setShowBranchOverlay,
        uuid: genUUID,
        dispatch,
        setLocalUpdate,
        setSuccessModal
    });
    if(isTauri && !connected){
        return (<div className="p-4 bg-yellow-100 text-yellow-800 rounded">
            <h2 className="text-lg font-semibold mb-2">No Internet Connection</h2>
            <p>Please connect to the internet to manage users.</p>
        </div>
    );
    }
  return (
    <UserUI
        {...logic}
        user={user}
        branches={branches}
        singleBranch={user.max_branches === 1}
        permissions={RoleBook[user.role?.toLowerCase()] || {}}
        showBranchOverlay={showBranchOverlay}
        setShowBranchOverlay={setShowBranchOverlay}
    />
  )
}

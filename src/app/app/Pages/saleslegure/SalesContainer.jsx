'use client'
import React, { use, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useConfirm } from '@/hooks/useConfirm';
import { setLocalUpdate, setSuccessModal } from '@/store/authSlice';

import { genUUID } from '../uuid';
import SalesUI from './SalesUI';
import { useSalesManager } from './useSalesManager';
import { resourceServices } from '../../resourceServices';



export default function SalesContainer({
    setAttendanceCard
}) {
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
            onSelectCustomer={async (customer)=>{
               let data = await resourceServices.getProfile(gymId, branchId, customer.serial_number);
               
               if(typeof data.membership_history === 'string'){
                    data.membership_history = JSON.parse(data.membership_history);
               }
               setAttendanceCard({
                   ...data,
                   type: 'member'
               })
            }}
        />
    )
}
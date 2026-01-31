'use client'
import { useEffect, useState } from 'react';
import { useRuntime } from '@/hooks/useRuntime';
import { useDispatch, useSelector } from 'react-redux';
import { genUUID } from '../uuid';
import { useDashboardRealtime } from './useDashboardRealtime';
import { checkRestriction } from './DashboardUI';
import { setSelectedFilter, setSelectedTab, setUser } from '@/store/authSlice';
import { setShowBroadcastMessage, setShowProgress } from '@/store/profileSlice';
import { dashboardService } from './dashboardService';

export function useDashboardManager({
  user,
  gymId,
  branchId,
  role
}) {
    const dispatch = useDispatch();
    const { isTauri, isWeb, isReady } = useRuntime();
    const [showCredsOverlay, setShowCredsOverlay] = useState(false);
    const [stats, setStats] = useState({}) 
    const [formValues, setFormValues] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const { dashboard, loading } = useDashboardRealtime({
        permissions: role,
        gymId,
        branchId,
        role,
        isReady,
        isWeb
    });

    const onFieldChange = (field, value) => {
        if(field === 'showCredsOverlay') {
            setShowCredsOverlay(value);
        }else{
            setFormValues(prev => ({
                ...prev,
                [field]: value
            }));
        }
    }
    const switchUser = async()=>{
        const result = await dashboardService.loginUser(formValues.email, formValues.password);
        console.log("Switch user result:", result);
        if (!result.ok) {
            console.log("Login error:", result.error);
            setErrors(prev => ({...prev, email: result.error}));
            //
            return;
        }

        dispatch(setUser({ ...user, role: result.user.role }));
        setShowCredsOverlay(false);
    }
    const handleClick = (filter) => {
        if(checkRestriction(filter,user) && filter === 'Show Progress'){
              setShowCredsOverlay(true)
              return
        }

         switch(filter){
            case 'Expenses':
              dispatch(setSelectedTab('expenses'));
              break;
            case 'Show Progress':
              // do nothing
              dispatch(setShowProgress(true));
              break;
            case 'Broadcast Message':
              dispatch(setShowBroadcastMessage(true));
              break;
            default:
              dispatch(setSelectedTab('customers'));
              dispatch(setSelectedFilter(filter.toLowerCase()));
              break;
          }
    }

    useEffect(() => {
        if(dashboard){
            const newStats = calculateDegrees(dashboard.admissions_month, dashboard.renewals_month);
            setStats({
                ...newStats,
                admissionsCurrentMonth: dashboard.admissions_month,
                renewalsCurrentMonth: dashboard.renewals_month
            });
        }
    }, [dashboard]);
    return {
        dashboard,
        loading,
        stats,
        showCredsOverlay,
        onFieldChange,
        handleClick,
        errors,
        formValues,
        isWeb,
        switchUser
    }
}
const calculateDegrees = (admissions, renewals) => {
    const total = admissions + renewals;
    if (total === 0) {
      return { deg1: 0, deg2: 360 };
    }
    const deg1 = (admissions / total) * 360;
    const deg2 = 360 - deg1;
    return { deg1, deg2 };
}
  
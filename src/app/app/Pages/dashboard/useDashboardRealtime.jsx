'use client'
import { useEffect, useState } from 'react'
import { dashboardService } from './dashboardService'
export function useDashboardRealtime({
  permissions,
  gymId,
  branchId,
  role,
  isReady,
  isWeb
}) {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (!gymId || !isReady) return;

    const fetchData = async () => {
      setLoading(true)
      try {
          const data = isWeb
            ? await dashboardService.fetchSupabaseDashboard(gymId, branchId, permissions)
            : await dashboardService.fetchTauriDashboard(gymId, branchId, permissions);
          setDashboard(data || null);
      } catch (error) {
        console.error('❌ Error fetching dashboard:', error);
      } finally {
        setLoading(false)
      }
    };

    fetchData();
  }, [gymId, branchId, isReady, isWeb, role, permissions]);

  return { dashboard, loading };
}

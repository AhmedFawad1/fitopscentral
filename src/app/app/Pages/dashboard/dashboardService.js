import { supabase } from '@/app/lib/createClient';
import { invoke } from '@tauri-apps/api/core';
import { parse } from 'node:path';

export const dashboardService = {
    fetchSupabaseDashboard: async (gymId, branchId, permissions) => {
        let query = supabase
          .from('kpi_members')
          .select('*')
          .eq('gym_id', gymId);
        if (branchId && permissions.canManageBranches) {
          query = query.eq('branch_id', branchId);
        }
        const { data, error } = await query;
        if (error) {
          throw error;
        }
        return data[0] || null;
    },
    fetchTauriDashboard: async (gymId, branchId, permissions) => {
        try {
            const payload = { gymId };
            if (branchId && permissions.canManageBranches) {
                payload.branchId = branchId;
            }
            const result = await invoke('run_sqlite_query', {query: `select * from gym_dashboard_view where gym_id = '${gymId}' and ${branchId? `branch_id ='${branchId}'` : 'branch_id IS NULL'}`});
            return result[0] || null;
        } catch (error) {
            throw error;
        }
    },
    fetchSalesYearlySummary: async (gymId) => {
        const res = await supabase.from('yearly_txn_summary_gym').select('*').order('year', { ascending: false })
        .eq('gym_id', gymId);
        const { data, error } = res;
        console.log("Fetched yearly summary:", data, error)
        ;
        if (error) {
          throw error;
        }
        return data || [];
    },
    fetchSalesYearlySummarySqllite: async (gymId) => {
        try {
            const result = await invoke('run_sqlite_query', {query: `select * from yearly_txn_summary_gym_local where gym_id = '${gymId}' order by year desc`});
            console.log("Fetched yearly summary from sqlite:", result);
            return result || [];
        } catch (error) {
            throw error;
        }
    },
    loginUser: async (email, password) => {
        try {
            // 1️⃣ Sign in
            const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
            });

            if (error) {
            return { ok: false, error: error.message };
            }

            if (!data?.user) {
            return { ok: false, error: "Authentication failed" };
            }

            // 2️⃣ Fetch user role
            const { data: userData, error: userError } = await supabase
            .from("users")
            .select("role")
            .eq("auth_user_id", data.user.id)
            .single();

            if (userError) {
            return { ok: false, error: userError.message };
            }

            // 3️⃣ Success
            return {
            ok: true,
            user: {
                id: data.user.id,
                role: userData.role,
            },
            };

        } catch (err) {
            return {
            ok: false,
            error: err.message || "Unexpected error",
            };
        }
    }

}
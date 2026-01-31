import { supabase } from '@/app/lib/createClient';
import { invoke } from '@tauri-apps/api/core';
import { parse } from 'node:path';

export const salesService = {
    fetchData: async(gym_id, branch_id) => {

        let query = supabase.from('packages').select('*').eq('deleted', false).eq('gym_id', gym_id); 
        if(branch_id && branch_id.trim() !== ''){
            query.eq('branch_id',branch_id)
        }
        let {data: packages, error} = await query.order('name', { ascending: true });  
        if(error){
            console.error("Error fetching packages: ", error);
            return [];
        }
        let queryTrainers = supabase.from('staff').select('*').eq('staff_type', 'trainer').eq('deleted', false).eq('gym_id', gym_id);
        if(branch_id && branch_id.trim() !== ''){
            queryTrainers.eq('branch_id',branch_id)
        }
        let {data: trainers, error: trainerError} = await queryTrainers.order('name', { ascending: true });
        if(trainerError){
            console.error("Error fetching trainers: ", trainerError);
            return [];
        }
        return { packages, trainers };
    },
    fetchDataSQLite: async(gym_id, branch_id) => {
        let packages = await invoke('run_sqlite_query', { query: `SELECT * FROM packages_local WHERE deleted = 0 AND gym_id = '${gym_id}' AND branch_id = '${branch_id}' ORDER BY name ASC` });
        let trainers = await invoke('run_sqlite_query', { query: `SELECT * FROM staff_local WHERE staff_type = 'trainer' AND deleted = 0 AND gym_id = '${gym_id}' AND branch_id = '${branch_id}' ORDER BY name ASC` });
        let serial_number_result = await invoke('run_sqlite_query', { query: `SELECT MAX(serial_number) as max_serial FROM (SELECT serial_number FROM staff_local WHERE deleted = 0 AND gym_id = '${gym_id}' AND branch_id = '${branch_id}' UNION ALL SELECT serial_number FROM members_local WHERE deleted = 0 AND gym_id = '${gym_id}' AND branch_id = '${branch_id}')` });
        let serial_number = 1;
        return { packages, trainers, serial_number: serial_number_result[0]?.max_serial ? serial_number_result[0].max_serial + 1 : serial_number };
    },
    searchSupabase: async(formValues, gym_id, branch_id, singleBranch, permissions)=>{
        let query = supabase
            .from('transactions_view')
            .select('*')
            .eq('gym_id', gym_id)
            .gte('txn_date', formValues.txn_date || '1970-01-01')
            .lte('txn_date', formValues.due_date || '2100-12-31');
            console.log(formValues.package_id)
            if (formValues.package_id) {
            query = query.eq('package_id', formValues.package_id);
            }
            if (formValues.trainer_id) {
            query = query.eq('trainer_id', formValues.trainer_id);
            }
            if(singleBranch){
            query = query.eq('branch_id', branch_id);
            }else if(permissions.canManageBranches){
            if (formValues.branch_id) {
                query = query.eq('branch_id', formValues.branch_id);
            }
            }else{
            query = query.eq('branch_id', branch_id);
            }
            if (formValues.selectedType) {
            const type = formValues.selectedType.toLowerCase();
            if (type === 'admission' || type === 'renewal' || type === 'payment' || type === 'refund' || type === 'outstanding balance') {
                query = query.eq('txn_type', type);
            } else if (payment_methods.map(pm => pm.toLowerCase()).includes(type)) {
                query = query.eq('payment_method', type);
            }
        }
        const { data, error } = await query;
        if(error){
            console.log("Error searching transactions: ", error);
            return [];
        }
        return data;
    },
    searchSqlite: async(formValues, gym_id, branch_id)=>{
        let query = `SELECT * FROM txn_view_local WHERE gym_id = '${gym_id}'
            ${formValues.txn_date ? ` AND date(txn_date) >= '${formValues.txn_date}'` : ''}
            ${formValues.start_date ? ` AND date(start_date) >= '${formValues.start_date}'` : ''}
            ${formValues.due_date ? ` AND date(txn_date) <= '${formValues.due_date}'` : ''}
            ${formValues.selectedType && (formValues.selectedType === 'admission' || formValues.selectedType === 'renewal' || formValues.selectedType === 'refund' || formValues.selectedType === 'payment') ? ` AND LOWER(txn_type) = '${formValues.selectedType.toLowerCase()}'` : 
            formValues.selectedType && (formValues.selectedType === 'outstanding balance') ? ` AND balance > 0` :
            formValues.selectedType && (payment_methods.map(pm => pm.toLowerCase()).includes(formValues.selectedType.toLowerCase())) ? ` AND LOWER(payment_method) = '${formValues.selectedType.toLowerCase()}'` : ''
            }
            ${formValues.package_id ? ` AND package_id = '${formValues.package_id}'` : ''}
            ${formValues.trainer_id ? ` AND trainer_id = '${formValues.trainer_id}'` : ''}
            ${formValues.branch_id ? ` AND branch_id = '${formValues.branch_id}'` : ''}
            ORDER BY date(txn_date) DESC;
        `;
        let data = await invoke('run_sqlite_query', {
            query: query
        });
        return data;
    }
}
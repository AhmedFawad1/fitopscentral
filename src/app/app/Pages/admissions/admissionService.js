import { supabase } from '@/app/lib/createClient';
import { invoke } from '@tauri-apps/api/core';
import { parse } from 'node:path';

export const admissionService = {
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
        let {data: templates, error: templateError} = await supabase.from('templates').select('*').eq('type', 'whatsapp').eq('deleted', false).eq('gym_id', gym_id).order('name', { ascending: true });
        let serial_number = await admissionService.fetchNextSerialNumber(gym_id, branch_id);
        return { packages, trainers, templates, serial_number };
    },
    fetchNextSerialNumber: async (gymId, branchId) => {
        const [{ data: staffData }, { data: memberData }] = await Promise.all([
        supabase
            .from('staff')
            .select('serial_number')
            .eq('gym_id', gymId)
            .eq('deleted', false)
            .order('serial_number', { ascending: false })
            .eq('branch_id', branchId)
            .limit(1)
            .maybeSingle(),

        supabase
            .from('members')
            .select('serial_number')
            .eq('gym_id', gymId)
            .eq('deleted', false)
            .order('serial_number', { ascending: false })
            .eq('branch_id', branchId)
            .limit(1)
            .maybeSingle()
        ]);

        const staffSerial = staffData?.serial_number;
        const memberSerial = memberData?.serial_number;

        let nextSerial;

        if (staffSerial == null && memberSerial == null) {
        nextSerial = 1;
        } else if (staffSerial == null) {
        nextSerial = memberSerial;
        } else if (memberSerial == null) {
        nextSerial = staffSerial;
        } else {
        nextSerial = Math.max(staffSerial, memberSerial);
        }
        return nextSerial + 1;
    },
    fetchDataSQLite: async(gym_id, branch_id) => {
        let packages = await invoke('run_sqlite_query', { query: `SELECT * FROM packages_local WHERE deleted = 0 AND gym_id = '${gym_id}' AND branch_id = '${branch_id}' ORDER BY name ASC` });
        let trainers = await invoke('run_sqlite_query', { query: `SELECT * FROM staff_local WHERE staff_type = 'trainer' AND deleted = 0 AND gym_id = '${gym_id}' AND branch_id = '${branch_id}' ORDER BY name ASC` });
        let templates = await invoke('run_sqlite_query', { query: `SELECT * FROM templates_local WHERE type = 'whatsapp' AND deleted = 0 AND gym_id = '${gym_id}' ORDER BY name ASC` });
        let serial_number_result = await invoke('run_sqlite_query', { query: `SELECT MAX(serial_number) as max_serial FROM (SELECT serial_number FROM staff_local WHERE deleted = 0 AND gym_id = '${gym_id}' AND branch_id = '${branch_id}' UNION ALL SELECT serial_number FROM members_local WHERE deleted = 0 AND gym_id = '${gym_id}' AND branch_id = '${branch_id}')` });
        let serial_number = 1;
        return { packages, trainers, templates, serial_number: serial_number_result[0]?.max_serial ? serial_number_result[0].max_serial + 1 : serial_number };
    },
    save: async (payload) => {
        delete payload.balance;
        const { data: member_data, error } = await supabase
            .from('members')
            .insert([{
                id: payload.id,
                serial_number: payload.serial_number,
                gym_id: payload.gym_id,
                branch_id: payload.branch_id,
                name: payload.name,
                dob: payload.dob,
                gender: payload.gender,
                contact: payload.contact,
                father_name: payload.father_name,
                address: payload.address,
                admission_date: payload.admission_date,
                updated_at: payload.updated_at
            }])
            .select()
            .single();
        if (error) {
            console.log("Error saving admission: ", error);
            return { error };
        }
        const {data: membership_data, error:membership_error} = await supabase
            .from('memberships')
            .insert([{
                id: payload.membership_id,
                gym_id: payload.gym_id,
                branch_id: payload.branch_id,
                member_id: payload.id,
                package_id: payload.package_id,
                trainer_id: payload.trainer_id,
                trainer_assigned_on: payload.trainer_assigned_on,
                trainer_expiry: payload.trainer_expiry,
                receipt_date: payload.receipt_date,
                start_date: payload.start_date,
                due_date: payload.due_date,
                cancellation_date: payload.cancellation_date,
                total_amount: payload.total_amount,
                amount_paid: payload.amount_paid,
                discount: payload.discount,
                updated_at: payload.updated_at
            }])
            .select()
            .single();
        if(membership_error){
            await supabase.from('members').delete().eq('id', payload.id);
            console.log("Error saving membership: ", membership_error);
            return { membership_error };
        }
        const { data: transaction_data, error: transaction_error } = await supabase
            .from('transactions')
            .insert([{
                id: payload.transaction_id,
                gym_id: payload.gym_id,
                branch_id: payload.branch_id,
                member_id: payload.id,
                membership_id: payload.membership_id,
                amount: payload.amount_paid,
                payment_method: payload.payment_methods,
                txn_date: payload.txn_date_today ? new Date().toISOString().split('T')[0] : payload.receipt_date,
                updated_at: payload.updated_at,
                txn_type: 'admission'
            }])
            .select()
            .single();
        return {  member_data, membership_data, membership_error};
    },
    saveSQLite: async (payload) => {
        let data = {
            member: {
                id: payload.id,
                serial_number: payload.serial_number,
                gym_id: payload.gym_id,
                branch_id: payload.branch_id,
                name: payload.name,
                dob: payload.dob,
                admission_date: payload.admission_date,
                gender: payload.gender,
                contact: payload.contact,
                father_name: payload.father_name,
                address: payload.address,
                updated_at: payload.updated_at,
                is_dirty: true,
                status: 'active',
                photo_url: payload.photo_url || ''
            },
            membership: {
                id: payload.membership_id,
                gym_id: payload.gym_id,
                branch_id: payload.branch_id,
                member_id: payload.id,
                package_id: payload.package_id,
                trainer_id: payload.trainer_id,
                trainer_assigned_on: payload.trainer_assigned_on,
                trainer_expiry: payload.trainer_expiry,
                receipt_date: payload.receipt_date,
                start_date: payload.start_date,
                due_date: payload.due_date,
                cancellation_date: payload.cancellation_date,
                total_amount: payload.total_amount,
                amount_paid: parseFloat(payload.amount_paid),
                discount: payload.discount,
                updated_at: payload.updated_at,
                is_dirty: true,
                balance: payload.balance,
                admission_fee: payload.admission_fee || false,
                package_fee: payload.package_fee || false,
                status: 'completed'
            },
            transaction: {
                id: payload.transaction_id,
                gym_id: payload.gym_id,
                branch_id: payload.branch_id,
                member_id: payload.id,
                membership_id: payload.membership_id,
                amount: parseFloat(payload.amount_paid),
                payment_method: payload.payment_methods,
                txn_date: payload.txn_date_today ? new Date().toISOString().split('T')[0] : payload.receipt_date,
                updated_at: payload.updated_at,
                txn_type: 'admission',
                is_dirty: true,
                status: 'completed'
            }
        };
        let result = await invoke('insert_full_admission', { payload: {... data } }).catch(err => {
            return { error: err };
        });
        return { ...result  };
    }
}
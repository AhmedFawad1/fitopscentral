import { supabase } from '@/app/lib/createClient';
import { invoke } from '@tauri-apps/api/core';

export const receiptService = {
    fetchReceipts: async (userId) => {
        const { data: receipts, error: receiptsError } = await supabase
        .from('receipts_view')
        .select(`*`)
        .eq('member_id', userId)
        .order('receipt_date', { ascending: false });
        if (receiptsError) {
            throw receiptsError;
        }else {
            return receipts;
        }
    },
    fetchReceiptSQL: async (customerID) => {
        const result = await invoke('run_sqlite_query', { query: `SELECT * FROM receipts_view_local WHERE member_id='${customerID}';` });
        return result;
    },
    updateCustomer: async (payload, gymID) => {
        payload.updated_at = new Date().toISOString();
        const { data, error } = await supabase
        .from('members')
        .update(payload)
        .eq('gym_id', gymID)
        .eq('id', payload.id);
        if (error) {
            return { error };
        }
        return { data };
    },
    updateCustomerSQLite: async (payload, gymID) => {
        const query = `UPDATE members_local SET 
            name='${payload.name}',
            BLOCKED='${payload.BLOCKED}',
            contact='${payload.contact}',
            father_name='${payload.father_name}',
            address='${payload.address}',
            dob='${payload.dob}',
            email='${payload.email}',
            admission_date='${payload.admission_date}',
            updated_at='${new Date().toISOString()}',
            photo_url='${payload.photo_url || ''}',
            is_dirty=1
            WHERE id='${payload.id}' AND gym_id='${gymID}';`;
        const result = await invoke('run_sqlite_query', { query });
        return result;
    },
     addBiometricTemp: async (payload, gymID) => {
        const query = `UPDATE members_local SET 
            biometric_data = '${payload.biometric_data}'
            WHERE id='${payload.id}' AND gym_id='${gymID}';`;
        const result = await invoke('run_sqlite_query', { query });
        return result;
    },
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
        let queryTemplates = supabase.from('templates').select('*').eq('deleted', false).eq('gym_id', gym_id);
        if(branch_id && branch_id.trim() !== ''){
            queryTemplates.eq('branch_id',branch_id)
        }
        let {data: templates, error: templatesError} = await queryTemplates.order('name', { ascending: true });
        if(templatesError){
            console.error("Error fetching templates: ", templatesError);
            return [];
        }
        return { packages, trainers, templates };
    },
    fetchDataSQLite: async(gym_id, branch_id) => {
        let packages = await invoke('run_sqlite_query', { query: `SELECT * FROM packages_local WHERE deleted = 0 AND gym_id = '${gym_id}' AND branch_id = '${branch_id}' ORDER BY name ASC` });
        let trainers = await invoke('run_sqlite_query', { query: `SELECT * FROM staff_local WHERE staff_type = 'trainer' AND deleted = 0 AND gym_id = '${gym_id}' AND branch_id = '${branch_id}' ORDER BY name ASC` });
        let templates = await invoke('run_sqlite_query', { query: `SELECT * FROM templates_local WHERE deleted = 0 AND gym_id = '${gym_id}' AND branch_id = '${branch_id}' ORDER BY name ASC` });
        return { packages, trainers, templates };
    },
    addTransaction: async (payload) => {
        delete payload.membership.balance;
        const { data: transaction_data, error } = await supabase
            .from('transactions')
            .insert([payload.transaction])
            .select()
            .single();
        if (error) {
            console.log("Error adding transaction: ", error);
            return { error };
        }
        const { data: receipt_data, error: receiptError } = await supabase
            .from('memberships')
            .update(payload.membership)
            .eq('id', payload.membership.id)
            .select()
            .single();
        if (receiptError) {
            console.log("Error updating receipt: ", receiptError);
            return { error: receiptError };
        }
        return { data: transaction_data };
    },
    addTransactionSQLite: async (payload) => {
        const transactionQuery = `INSERT INTO transactions_local (id, membership_id, gym_id, branch_id, member_id, amount, txn_type, payment_method, txn_date, updated_at, is_dirty) VALUES (
            '${payload.transaction.id}','${payload.transaction.membership_id}','${payload.transaction.gym_id}','${payload.transaction.branch_id}','${payload.transaction.member_id}',${payload.transaction.amount},'${payload.transaction.txn_type}','${payload.transaction.payment_method}','${payload.transaction.txn_date}','${payload.transaction.updated_at}', 1);`;
        const receiptQuery = `UPDATE memberships_local SET 
            amount_paid=${payload.membership.amount_paid},
            balance=${payload.membership.balance},
            updated_at='${new Date().toISOString()}',
            is_dirty=1,
            status='${payload.membership.status || 'active'}'
            WHERE id='${payload.membership.id}' AND gym_id='${payload.membership.gym_id}';`;
        const transactionResult = await invoke('run_sqlite_query', { query: transactionQuery });
        if (transactionResult.error) {
            console.log("Error adding transaction in SQLite: ", transactionResult.error);
            return { error: transactionResult.error };
        }
        const receiptResult = await invoke('run_sqlite_query', { query: receiptQuery });
        if (receiptResult.error) {
            console.log("Error updating receipt in SQLite: ", receiptResult.error);
            return { error: receiptResult.error };
        }
        return { data: transactionResult };
    },
    deleteTransaction: async (transactionId, membershipPayload, gym_id) => {
        const { data: transaction_data, error } = await supabase
            .from('transactions')
            .update({ deleted: true })
            .eq('id', transactionId)
            .eq('gym_id', gym_id)
            .select()
            .single();
        if (error) {
            console.log("Error deleting transaction: ", error);
            return { error };
        }
        const { data: receipt_data, error: receiptError } = await supabase
            .from('memberships')
            .update({
                'amount_paid': membershipPayload.amount_paid,
                'updated_at': new Date().toISOString()
            })
            .eq('id', membershipPayload.id)
            .eq('gym_id', gym_id)
            .select()
            .single();
        if (receiptError) {
            console.log("Error updating receipt after deleting transaction: ", receiptError);
            return { error: receiptError };
        }
        return { data: transaction_data };
    },
    deleteTransactionSQLite: async (transactionId, membershipPayload, gym_id) => {
        const transactionQuery = `UPDATE transactions_local SET deleted = 1, is_dirty = 1 WHERE id='${transactionId}' AND gym_id='${gym_id}';`;
        const receiptQuery = `UPDATE memberships_local SET 
            amount_paid=${membershipPayload.amount_paid},
            balance=${membershipPayload.balance},
            updated_at='${new Date().toISOString()}',
            is_dirty=1
            WHERE id='${membershipPayload.id}' AND gym_id='${gym_id}';`;
        console.log('Delete Transaction Query:', transactionQuery);
        console.log('Update Receipt Query:', receiptQuery);
        const transactionResult = await invoke('run_sqlite_query', { query: transactionQuery });
        if (transactionResult.error) {
            console.log("Error deleting transaction in SQLite: ", transactionResult.error);
            return { error: transactionResult.error };
        }
        const receiptResult = await invoke('run_sqlite_query', { query: receiptQuery });
        if (receiptResult.error) {
            console.log("Error updating receipt in SQLite after deleting transaction: ", receiptResult.error);
            return { error: receiptResult.error };
        }
        return { data: transactionResult };
    },
    addMembership: async (payload) => {
        delete payload.membership.balance;
        const { data: membership_data, error } = await supabase
            .from('memberships')
            .insert([payload.membership])
            .select()
            .single();
        if (error) {
            console.log("Error adding membership: ", error);
            return { error };
        }
        const { data: transaction_data, error: transactionError } = await supabase
            .from('transactions')
            .insert([payload.transaction])
            .select()
            .single();
        if (transactionError) {
            console.log("Error adding transaction for membership: ", transactionError);
            return { error: transactionError };
        }
        return { data: membership_data };
    },
    addMembershipSQLite: async (payload) => {
        const membershipQuery = `INSERT INTO memberships_local (id, gym_id, branch_id, member_id, package_id, trainer_id,total_amount, start_date, due_date, amount_paid, balance, status, created_at, updated_at, is_dirty, receipt_date,cancellation_date, trainer_assigned_on, trainer_expiry, status) VALUES (
            '${payload.membership.id}','${payload.membership.gym_id}','${payload.membership.branch_id}','${payload.membership.member_id}','${payload.membership.package_id}','${payload.membership.trainer_id}','${payload.membership.total_amount}','${payload.membership.start_date}','${payload.membership.due_date}',${payload.membership.amount_paid},${payload.membership.balance},'${payload.membership.status}','${payload.membership.created_at}','${payload.membership.updated_at}', 1, '${payload.membership.receipt_date}', '${payload.membership.cancellation_date}', '${payload.membership.trainer_assigned_on}', '${payload.membership.trainer_expiry}','completed');`;
        const transactionQuery = `INSERT INTO transactions_local (id, membership_id, gym_id, branch_id, member_id, amount, txn_type, payment_method, txn_date, updated_at, is_dirty) VALUES (
            '${payload.transaction.id}','${payload.transaction.membership_id}','${payload.transaction.gym_id}','${payload.transaction.branch_id}','${payload.transaction.member_id}',${payload.transaction.amount},'${payload.transaction.txn_type}','${payload.transaction.payment_method}','${payload.transaction.txn_date}','${payload.transaction.updated_at}', 1);`;
        const membershipResult = await invoke('run_sqlite_query', { query: membershipQuery });
        if (membershipResult.error) {
            console.log("Error adding membership in SQLite: ", membershipResult.error);
            return { error: membershipResult.error };
        }
        const transactionResult = await invoke('run_sqlite_query', { query: transactionQuery });
        if (transactionResult.error) {
            console.log("Error adding transaction for membership in SQLite: ", transactionResult.error);
            return { error: transactionResult.error };
        }
        return { data: membershipResult };
    },
    deleteMembership: async (membershipId, gym_id) => {
        const { data: membership_data, error } = await supabase
            .from('memberships')
            .update({ deleted: true })
            .eq('id', membershipId)
            .eq('gym_id', gym_id)
            .select()
            .single();
        if (error) {
            console.log("Error deleting membership: ", error);
            return { error };
        }
        const { data: transaction_data, error: transactionError } = await supabase
            .from('transactions')
            .update({ deleted: true })
            .eq('membership_id', membershipId)
            .eq('gym_id', gym_id);
        if (transactionError) {
            console.log("Error deleting transactions for membership: ", transactionError);
            return { error: transactionError };
        }
        return { data: membership_data };
    },
    deleteMembershipSQLite: async (membershipId, gym_id) => {
        const membershipQuery = `UPDATE memberships_local SET deleted = 1, is_dirty = 1 WHERE id='${membershipId}' AND gym_id='${gym_id}';`;
        const transactionQuery = `UPDATE transactions_local SET deleted = 1, is_dirty = 1 WHERE membership_id='${membershipId}' AND gym_id='${gym_id}';`;
        const membershipResult = await invoke('run_sqlite_query', { query: membershipQuery });
        console.log('Delete Membership Query:', membershipQuery);
        console.log('Delete Transactions Query:', transactionQuery);

        if (membershipResult.error) {
            console.log("Error deleting membership in SQLite: ", membershipResult.error);
            return { error: membershipResult.error };
        }
        const transactionResult = await invoke('run_sqlite_query', { query: transactionQuery });
        if (transactionResult.error) {
            console.log("Error deleting transactions for membership in SQLite: ", transactionResult.error);
            return { error: transactionResult.error };
        }
        return { data: membershipResult };
    },
    deleteCustomer: async (memberId, gym_id) => {
        const { data: member_data, error } = await supabase
            .from('members')
            .update({ deleted: true })
            .eq('id', memberId)
            .eq('gym_id', gym_id)
            .select()
            .single();
        if (error) {
            console.log("Error deleting member profile: ", error);
            return { error };
        }
        const { data: membership_data, error: membershipError } = await supabase
            .from('memberships')
            .update({ deleted: true })
            .eq('member_id', memberId)
            .eq('gym_id', gym_id);
        if (membershipError) {
            console.log("Error deleting memberships for member: ", membershipError);
            return { error: membershipError };
        }
        const { data: transaction_data, error: transactionError } = await supabase
            .from('transactions')
            .update({ deleted: true })
            .eq('member_id', memberId)
            .eq('gym_id', gym_id);
        if (transactionError) {
            console.log("Error deleting transactions for member: ", transactionError);
            return { error: transactionError };
        }
        return { data: member_data };
    },
    deleteCustomerSQLite: async (memberId, gym_id) => {
        const memberQuery = `UPDATE members_local SET deleted = 1, is_dirty = 1 WHERE id='${memberId}' AND gym_id='${gym_id}';`;
        const membershipQuery = `UPDATE memberships_local SET deleted = 1, is_dirty = 1 WHERE member_id='${memberId}' AND gym_id='${gym_id}';`;
        const transactionQuery = `UPDATE transactions_local SET deleted = 1, is_dirty = 1 WHERE member_id='${memberId}' AND gym_id='${gym_id}';`;
        const memberResult = await invoke('run_sqlite_query', { query: memberQuery });
        console.log('Delete Member Query:', memberQuery);
        console.log('Delete Memberships Query:', membershipQuery);
        console.log('Delete Transactions Query:', transactionQuery);
        if (memberResult.error) {
            console.log("Error deleting member profile in SQLite: ", memberResult.error);
            return { error: memberResult.error };
        }
        const membershipResult = await invoke('run_sqlite_query', { query: membershipQuery });
        if (membershipResult.error) {
            console.log("Error deleting memberships for member in SQLite: ", membershipResult.error);
            return { error: membershipResult.error };
        }
        const transactionResult = await invoke('run_sqlite_query', { query: transactionQuery });
        if (transactionResult.error) {
            console.log("Error deleting transactions for member in SQLite: ", transactionResult.error);
            return { error: transactionResult.error };
        }
        return { data: memberResult };
    },
    renewTrainerAssignment: async (membershipId, trainerPayload, gym_id) => {
        delete trainerPayload.balance;
        const { data: membership_data, error } = await supabase
            .from('memberships')
            .update(trainerPayload)
            .eq('id', membershipId)
            .eq('gym_id', gym_id)
            .select()
            .single();
        if (error) {
            console.log("Error renewing trainer assignment: ", error);
            return { error };
        }
        return { data: membership_data };
    },
    renewTrainerAssignmentSQLite: async (membershipId, trainerPayload, gym_id) => {
        const trainerQuery = `UPDATE memberships_local SET 
            trainer_id='${trainerPayload.trainer_id}',
            trainer_assigned_on='${trainerPayload.trainer_assigned_on}',
            trainer_expiry='${trainerPayload.trainer_expiry}',
            total_amount=${trainerPayload.total_amount},
            balance=${trainerPayload.balance},
            updated_at='${new Date().toISOString()}',
            is_dirty=1
            WHERE id='${membershipId}' AND gym_id='${gym_id}';`;
        // console.log('Renew Trainer Assignment Query:', trainerQuery);
        // return
        const trainerResult = await invoke('run_sqlite_query', { query: trainerQuery });
        if (trainerResult.error) {
            console.log("Error renewing trainer assignment in SQLite: ", trainerResult.error);
            return { error: trainerResult.error };
        }
        return { data: trainerResult };
    }
};
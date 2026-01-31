import { supabase } from '@/app/lib/createClient';
import { invoke } from '@tauri-apps/api/core';
import { parse } from 'node:path';

export const expenseService = {
  fetch: async (gymId, branchId, startDate, endDate) => {
    let query = supabase
        .from('expenses')
        .select('*')
        .eq('deleted', false);
    if(branchId && branchId.trim() !== ''){
        query = query.eq('branch_id', branchId);
    }
    if(startDate){
        query = query.gte('txn_date', startDate);
    }
    if(endDate){
        query = query.lte('txn_date', endDate);
    }
    let {data, error} = await query.order('txn_date', { ascending: false });  
    console.log(data)
    return data || [];
  },
  fetchSQLite: async (gymId, branchId, startDate, endDate) => {
    // Placeholder for SQLite fetch implementation
    return await invoke('run_sqlite_query', {
      query: `SELECT * FROM expenses_local WHERE gym_id = '${gymId}' AND branch_id = '${branchId}' AND deleted = 0 ORDER BY name`,
    });
  },
  save: async pkg => {
    return supabase
      .from('expenses')
      .upsert(pkg);
  },
  saveSQLite: async pkg => {
    // Placeholder for SQLite save implementation
    return await invoke('upsert_expense_local', {
      expense: {
        id: pkg.id,
        gym_id: pkg.gym_id,
        branch_id: pkg.branch_id,
        name: pkg.name,
        amount: pkg.amount,
        txn_date: pkg.txn_date,
        payment_method: pkg.payment_method,
        notes: pkg.notes,
        deleted: pkg.deleted || false,
        is_dirty: true,
        category: pkg.category || '',
        description: pkg.description || '',
        is_recurring: pkg.is_recurring || false,
      }
    });
  },
  softDelete: async (id, gymId) => {
    return supabase
      .from('expenses')
      .update({ deleted: true })
      .eq('id', id)
      .eq('gym_id', gymId);
  },
  softDeleteSQLite: async (id, gymId) => {
    // Placeholder for SQLite soft delete implementation
    return await invoke('delete_record_by_name', {
      tableName: 'expenses_local',
      columnName: 'id',
      value: id
    });
  }
};

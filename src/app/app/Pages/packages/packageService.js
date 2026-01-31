import { supabase } from '@/app/lib/createClient';
import { invoke } from '@tauri-apps/api/core';
import { parse } from 'node:path';

export const packageService = {
  fetch: async (gymId, branchId) => {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('gym_id', gymId)
      .eq('branch_id', branchId)
      .eq('deleted', false)
      .order('name');
      
    return data || [];
  },
  fetchSQLite: async (gymId, branchId) => {
    // Placeholder for SQLite fetch implementation
    return await invoke('run_sqlite_query', {
      query: `SELECT * FROM packages_local WHERE gym_id = '${gymId}' AND branch_id = '${branchId}' AND deleted = 0 ORDER BY name`,
    });
  },
  save: async pkg => {
    return supabase
      .from('packages')
      .upsert(pkg);
  },
  saveSQLite: async pkg => {
    // Placeholder for SQLite save implementation
    return await invoke('upsert_package', {
      package: {
        id: pkg.id,
        gym_id: pkg.gym_id,
        branch_id: pkg.branch_id,
        name: pkg.name,
        price: parseFloat(pkg.price || 0),
        admission_fee: parseFloat(pkg.admission_fee || 0),
        duration: parseInt(pkg.duration || 0),
        duration_type: pkg.duration_type,
        cancellation: parseInt(pkg.cancellation || 0),
        updated_at: pkg.updated_at,
        deleted: 0, 
        is_dirty: 1
      }
    });
  },
  softDelete: async (id, gymId) => {
    return supabase
      .from('packages')
      .update({ deleted: true })
      .eq('id', id)
      .eq('gym_id', gymId);
  },
  softDeleteSQLite: async (id, gymId) => {
    // Placeholder for SQLite soft delete implementation
    return await invoke('delete_record_by_name', {
      tableName: 'packages_local',
      columnName: 'id',
      value: id
    });
  }
};

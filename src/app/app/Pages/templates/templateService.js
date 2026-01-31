import { supabase } from '@/app/lib/createClient';
import { invoke } from '@tauri-apps/api/core';

export const templateService = {
  fetch: async (gymId, branchId) => {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('gym_id', gymId)
      .eq('branch_id', branchId)
      .eq('deleted', false)
      .order('name');
      
    return data || [];
  },
  fetchSqlite: async (gymId, branchId) => {
    // Placeholder for SQLite fetch implementation
    return await invoke('run_sqlite_query', {
      query: `SELECT * FROM templates_local WHERE gym_id = '${gymId}' AND branch_id = '${branchId}' AND deleted = 0 ORDER BY name`,
    });
  },
  save: async template => {
    return supabase
      .from('templates')
      .upsert(template);
  },
  saveSqlite: async template => {
    // Placeholder for SQLite save implementation
    return await invoke('upsert_template_local', {
      template: {
        ...template,
        deleted: false,
        is_dirty: true
      }
    });
  },
  
  softDelete: async (id, gymId) => {
    return supabase
      .from('templates')
      .update({ deleted: true })
      .eq('id', id)
      .eq('gym_id', gymId);
  },
  softDeleteSqlite: async (id, gymId) => {
    // Placeholder for SQLite soft delete implementation
    return await invoke('delete_record_by_name', {
      tableName: 'templates_local',
      columnName: 'id',
      value: id
    });
  }
};


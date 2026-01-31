import { supabase } from '@/app/lib/createClient';
import { invoke } from '@tauri-apps/api/core';

export const staffService = {
  fetch: async (gymId, branchId) => {
    const { data, error } = await supabase
      .from('staff')
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
      query: `SELECT * FROM staff_local WHERE gym_id = '${gymId}' AND branch_id = '${branchId}' AND deleted = 0 ORDER BY name`,
    });
  },
  save: async staff => {
    return supabase
      .from('staff')
      .upsert(staff);
  },
  saveSQLite: async staff => {
    // Placeholder for SQLite save implementation
    return await invoke('upsert_staff', {
      staff: {
        ...staff,
        deleted: false,
        is_dirty: true
      }
    });
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
  fetchNextSerialNumberSQLite: async (gymId, branchId) => {
    // Placeholder for SQLite fetch implementation
    const staffResult = await invoke('run_sqlite_query', {
      query: `SELECT serial_number FROM staff_local WHERE gym_id = '${gymId}' AND branch_id = '${branchId}' AND deleted = 0 ORDER BY serial_number DESC LIMIT 1`,
    });
    const memberResult = await invoke('run_sqlite_query', {
      query: `SELECT serial_number FROM members_local WHERE gym_id = '${gymId}' AND branch_id = '${branchId}' AND deleted = 0 ORDER BY serial_number DESC LIMIT 1`,
    });
    const staffSerial = staffResult.length > 0 ? staffResult[0].serial_number : null;
    const memberSerial = memberResult.length > 0 ? memberResult[0].serial_number : null;
    let nextSerial;

    if (staffSerial == null && memberSerial == null) {
      return 1;
    }
    else if (staffSerial == null) {
      nextSerial = memberSerial;
    }
    else if (memberSerial == null) {
      nextSerial = staffSerial;
    }
    else {
      nextSerial = Math.max(staffSerial, memberSerial);
    }
    return nextSerial + 1;
  },
  softDelete: async (id, gymId) => {
    return supabase
      .from('staff')
      .update({ deleted: true })
      .eq('id', id)
      .eq('gym_id', gymId);
  },
  softDeleteSQLite: async (id, gymId) => {
    // Placeholder for SQLite soft delete implementation
    return await invoke('delete_record_by_name', {
      tableName: 'staff_local',
      columnName: 'id',
      value: id
    });
  }
};

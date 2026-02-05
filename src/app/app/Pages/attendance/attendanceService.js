import { invoke } from '@tauri-apps/api/core';

export async function runAttendanceQuery(query) {
  return invoke("run_sqlite_query", { query });
}

export function buildMemberAttendanceQuery({
  gym_id,
  branch_id,
  selectedDate,
  searchQuery,
  isGymID
}) {
  return `
    SELECT * FROM attendance_view_local
    WHERE gym_id='${gym_id}'
    ${branch_id ? `AND branch_id='${branch_id}'` : ""}
    ${selectedDate ? `AND date='${selectedDate}'` : ""}
    ${
      searchQuery && !isGymID
        ? `AND (
            LOWER(name) LIKE LOWER('%${searchQuery}%')
            OR LOWER(contact) LIKE LOWER('%${searchQuery}%')
            OR LOWER(member_code) LIKE LOWER('%${searchQuery}%')
            OR LOWER(package_name) LIKE LOWER('%${searchQuery}%')
            OR LOWER(trainer_name) LIKE LOWER('%${searchQuery}%')
            OR serial_number LIKE '%${searchQuery}%'
          )`
        : ""
    }
    ${isGymID ? `AND serial_number='${searchQuery}'` : ""}
    ORDER BY COALESCE(updated_at, check_out_time, check_in_time) DESC;
  `;
}

export function buildStaffAttendanceQuery({
  gym_id,
  branch_id,
  selectedDate,
  searchQuery
}) {
  return `
    SELECT * FROM staff_attendance_view_local
    WHERE gym_id='${gym_id}'
    ${branch_id ? `AND branch_id='${branch_id}'` : ""}
    ${selectedDate ? `AND date='${selectedDate}'` : ""}
    ${
      searchQuery
        ? `AND (
            LOWER(name) LIKE LOWER('%${searchQuery}%')
            OR serial_number LIKE '%${searchQuery}%'
          )`
        : ""
    }
    ORDER BY COALESCE(updated_at, check_out_time, check_in_time) DESC;
  `;
}

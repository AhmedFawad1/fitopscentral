import { supabase } from "@/app/lib/createClient";
import { invoke } from "@tauri-apps/api/core";

export const resourceServices = {
    fetchDataSQLite: async(gym_id, branch_id) => {
        let packages = await invoke('run_sqlite_query', { query: `SELECT * FROM packages_local WHERE deleted = 0 AND gym_id = '${gym_id}' AND branch_id = '${branch_id}' ORDER BY name ASC` });
        let trainers = await invoke('run_sqlite_query', { query: `SELECT * FROM staff_local WHERE staff_type = 'trainer' AND deleted = 0 AND gym_id = '${gym_id}' AND branch_id = '${branch_id}' ORDER BY name ASC` });
        let templates = await invoke('run_sqlite_query', { query: `SELECT * FROM templates_local WHERE type = 'whatsapp' AND deleted = 0 AND gym_id = '${gym_id}' ORDER BY name ASC` });
        let serial_number_result = await invoke('run_sqlite_query', { query: `SELECT MAX(serial_number) as max_serial FROM (SELECT serial_number FROM staff_local WHERE deleted = 0 AND gym_id = '${gym_id}' AND branch_id = '${branch_id}' UNION ALL SELECT serial_number FROM members_local WHERE deleted = 0 AND gym_id = '${gym_id}' AND branch_id = '${branch_id}')` });
        let serial_number = 1;
        return { packages, trainers, templates, serial_number: serial_number_result[0]?.max_serial ? serial_number_result[0].max_serial + 1 : serial_number };
    },
    getConfig: async ()=>{
        let data = invoke("load_config")
        return data;
    },
    openExternalLink: async (url)=>{
        await invoke("open_browser", { url });
    },
    restartZKService: async (ip, port) => {
        try {
            await invoke("kill_process_by_name_sysinfo", { name: 'ZKBridge.exe' })
            await invoke("zk_start_service")
            await invoke("zk_connect", { ip, port })
            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: error
            };
        }
    },
    startService: async(appName, ip, port ) =>{
        switch(appName){
            case 'ZKBridge.exe':
                try {
                    await invoke("zk_start_service")
                    await invoke("zk_connect", { ip, port })
                    return {
                        success: true
                    };
                }
                catch (error) {
                    return {
                        success: false,
                        error: error
                    };
                }
            case "SecuGenDemo.exe":
                try {
                    await invoke("fp_start_service", { mode: 0 })
                    return {
                        success: true
                    };
                }
                catch (error) {
                    return {
                        success: false,
                        error: error
                    };
                }
            default:
                return {
                    success: false,
                    error: "Unknown App"
                };
        }
    },
    restartSecugenService: async (mode = 0) => {
        try {   
             await invoke("kill_process_by_name_sysinfo", { name: "SecuGenDemo.exe" })
             await invoke("fp_start_service", { mode: mode })
             return {
                success: true
             };
        } catch (error) {
            return {
                success: false,
                error: error
            };   
        }
    },
    pingDevice: async(ip, port) =>{
        try {
            await invoke("zk_ping_device", { ip, port });
            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: error
            };
        }
    },
    getProfile: async(gymId, branchId, id)=>{
          let query = `SELECT * FROM member_view_local WHERE gym_id='${gymId}' ${!branchId ? '' : `AND branch_id='${branchId}'`} and serial_number='${id}' AND deleted IS NOT TRUE;`;
          console.log("Executing Query:", query);
          let data = await invoke('run_sqlite_query', { query: query });
          if(data && data.length > 0){
             let customer = data[0];
             customer.type = 'member';
             return customer;
          }
          if(!data || data.length === 0){
            query =`SELECT * FROM staff_local WHERE gym_id='${gymId}' ${!branchId ? '' : `AND branch_id='${branchId}'`} and serial_number='${id}' AND deleted IS NOT TRUE;`;
            data = await invoke('run_sqlite_query', { query: query });
            if(data && data.length > 0){
                let staff = data[0];
                staff.type = 'staff';
                return staff;
            }
          }
            return null;
    },
    playSound: async(status)=>{
        if(status === 'balance_due'){
            status = 'Inactive'
        }
        invoke("play_sound", { status: status });
    },
    openGate: async(useArduino, status)=>{
         if(!useArduino || status !== 'Active') return;
         invoke("send_to_arduino")
         .then((res)=>{
            console.log("Gate opened via Arduino:", res);
        })
        .catch((err)=>{
            console.log("Failed to open gate via Arduino:", err);
        });
    },
    markAttendance: async(gymId, branchId, serial_number, status)=>{
        if (!serial_number) return;
        invoke("upsert_attendance", {
            gymId: gymId,
            branchId: branchId ===''? null : branchId,
            serialNumber: serial_number.toString(),
            date: new Date().toISOString().split('T')[0],
            time: new Date().toISOString(),
            status: status
        });
    },
    markStaffAttendance: async(gymId, branchId, id)=>{
        if (!id) return;
        invoke("upsert_staff_attendance", {
            id: id,
            gymId: gymId,
            branchId: branchId ===''? null : branchId,
            date: new Date().toISOString().split('T')[0],
            checkInTime: `${formatTimestamp().split(' ')[1]}`,
            checkOutTime: `${formatTimestamp().split(' ')[1]}`,
            staffId: id
        });
    }
}

function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    date.getFullYear() + '-' +
    pad(date.getMonth() + 1) + '-' +
    pad(date.getDate()) + ' ' +
    pad(date.getHours()) + ':' +
    pad(date.getMinutes()) + ':' +
    pad(date.getSeconds())
  );
}
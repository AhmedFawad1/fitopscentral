import { supabase } from "@/app/lib/createClient";
import { invoke } from "@tauri-apps/api/core";

async function addColumnIfMissing(table, column, definition) {
  const columns = await invoke('run_sqlite_query', {
    query: `PRAGMA table_info(${table});`
  });

  const exists = columns.some(c => c.name === column);

  if (!exists) {
    console.log(`➕ Adding column ${column} to ${table}`);
    await invoke('run_sqlite_query', {
      query: `ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`
    });
  } else {
    //console.log(`⏭️ Column ${column} already exists on ${table}`);
  }
}

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
            console.log(data)
            if(data && data.length > 0){
                let staff = data[0];
                staff.type = 'staff';
                 let payroll = await invoke('run_sqlite_query', { query: `SELECT * FROM payroll_view_local WHERE gym_id='${gymId}' ${!branchId ? '' : `AND branch_id='${branchId}'`} and staff_id='${staff.id}';` });
                 staff = { ...staff, ...payroll[0] };
                 staff['status'] = staff['status'] === '' ? 'active' : staff['status'];
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
         console.log("Invoking Arduino to open gate...");
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
    },
    
    alterChanges: async (migrationSQL, version) => {
        // 1️⃣ Ensure migrations table exists
        await addColumnIfMissing(
        'MEMBERSHIPS_LOCAL',
        'created_at',
        "DATETIME DEFAULT (datetime('now'))"
        );

        await addColumnIfMissing(
        'MEMBERSHIPS_LOCAL',
        'trainer_start',
        'DATE'
        );

        await invoke('run_sqlite_query', {
            query: `
            CREATE TABLE IF NOT EXISTS migrations_version (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                version INTEGER NOT NULL
            );
            `
        });

        // 2️⃣ Read last applied version
        const result = await invoke('run_sqlite_query', {
            query: `SELECT version FROM migrations_version WHERE id = 1;`
        });

        const lastVersion =  result?.[0]?.version || 0;
        // 3️⃣ Skip if migration already applied
        if (lastVersion >= version) {
            //console.log(`🟡 Migration skipped (current: ${lastVersion}, incoming: ${version})`);
            return;
        }

        //console.log(`🚀 Running migration v${version}...`);
        // 4️⃣ Run migration SQL (single fixed string)
        let migrate = migrationSQL.forEach(element => {
            try{
                invoke('run_sqlite_query', { query: element });
            }catch(err){
                console.log(`Error executing migration step: ${element}`, err);
            }
        });
        // 5️⃣ Update version table (UPSERT style)
        await invoke('run_sqlite_query', {
            query: `
            INSERT INTO migrations_version (id, version)
            VALUES (1, ${version})
            ON CONFLICT(id) DO UPDATE SET version = ${version};
            `
        });

        //console.log(`✅ Migration v${version} applied successfully`);
    },
    fetchStatus: async(gymId, branchId) =>{
        let data = await invoke('run_sqlite_query',{
            query: `select current_status,serial_number from member_view_local where gym_id='${gymId}' ${!branchId ? '' : `AND branch_id='${branchId}'`} and current_status IS NOT NULL AND deleted IS NOT TRUE;`
        })
        let staff = await invoke('run_sqlite_query',{
            query: `select status, serial_number from staff_local where gym_id='${gymId}' ${!branchId ? '' : `AND branch_id='${branchId}'`} and status IS NOT NULL AND deleted IS NOT TRUE;`
        });   
        data = data.concat(staff);
        //console.log("Fetched Status Data:", data);
        return data;
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
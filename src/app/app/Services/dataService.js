import { supabase } from '@/app/lib/createClient';
import { invoke } from '@tauri-apps/api/core';
import { parse } from 'node:path';
import { packageService } from '../Pages/packages/packageService';
import { expenseService } from '../Pages/expenses/expenseService';
import { templateService } from '../Pages/templates/templateService';
import { checkInternetConnection } from '../sessionServices';



export const dataService = {
   syncFromSupabase: async (user)=>{
        let connected = await checkInternetConnection()
        if(!connected) return;
        await checkGyms(user)
        for (const tableName of TABLE_SYNC_ORDER) {
            let query = `SELECT last_synced_at from sync_log where table_name='${tableName}';`;
            const data = await invoke("run_sqlite_query", { query });
            if(!data || data.length===0){
                const timenow = new Date().toISOString();
                query = `INSERT INTO sync_log (table_name, last_synced_at) VALUES ('${tableName}', '${timenow}');`;
                await invoke("run_sqlite_query", { query });
            }else{
                const lastSyncedAt = data[0].last_synced_at || '1970-01-01T00:00:00Z';
                let { data: supaData, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq('gym_id', user.gym_id)
                    .eq('branch_id', user.branch_id)
                    .gt('updated_at', lastSyncedAt)
                    .limit(1000);
                if (error) {
                    console.error(`Error fetching ${tableName} from Supabase:`, error);
                    continue;
                }
                supaData.forEach(async (record) => {
                    try {
                        await updateData({
                            tableName,
                            record
                        });
                        console.log(`✅ Synced ${tableName} ← ${record.id}`);
                    } catch (err) {
                        console.error(`❌ Failed to sync ${tableName} record ${record.id}`, err);
                    }
                });
                const timenow = new Date().toISOString();
                query = `UPDATE sync_log SET last_synced_at='${timenow}' WHERE table_name='${tableName}';`;
                await invoke("run_sqlite_query", { query });
            }
        }
   } ,
   syncToSupabase: async (user)=>{
      for (const tableName of TABLE_SYNC_ORDER) {
            //console.log(`Starting sync for table: ${tableName}`);
            try{
            await synchroniser(tableName, user);
            //console.log(`✅ Successfully synced table: ${tableName}`);
            }catch(err){
            console.error(`❌ Error syncing table: ${tableName}`, err);
            break;
            }
     }
   },
}

const TABLE_SYNC_ORDER = [
  'packages',
  'staff',
  'expenses',
  'templates',
  'members',
  'memberships',
  'transactions',
];

async function checkGyms(user){
   let query = `SELECT * from gyms_local where id='${user.gym_id}';`;
   let data = await invoke("run_sqlite_query", { query });
   if(data.length === 0){
      // fetch from supabase
      let { data: gymData, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('id', user.gym_id)
        .limit(1)
        .single();
      if(error){
         console.error("Error fetching gym data:", error);
         return;
      }
      // insert into local
      let insertQuery = `INSERT INTO gyms_local (id, name,owner_user_id, contact, email, updated_at) VALUES (
         '${gymData.id}',
         '${gymData.name}',
         '${gymData.owner_user_id || ''}',
         '${gymData.contact || ''}',
         '${gymData.email || ''}',
         '${gymData.updated_at}'
      );`;
      await invoke("run_sqlite_query", { query: insertQuery });
      // get
   }
   // check branches
    query = `SELECT * from branches_local where id='${user.branch_id}';`;
    data = await invoke("run_sqlite_query", { query });
    if(data.length === 0){
      // fetch from supabase
      let { data: branchData, error } = await supabase
        .from('branches')
        .select('*')
        .eq('id', user.branch_id)
        .limit(1)
        .single();
      if(error){
         console.error("Error fetching branch data:", error);
         return;
      }
      // insert into local
      let insertQuery = `INSERT INTO branches_local (id, gym_id, name,code, address, updated_at) VALUES (
         '${branchData.id}',
         '${branchData.gym_id}',
          '${branchData.name}',
          '${branchData.code || ''}',
          '${branchData.address || ''}',
         '${branchData.updated_at}'
      );`;
      await invoke("run_sqlite_query", { query: insertQuery });
   }
   // check users
   query = `SELECT * from users_local where user_id='${user.user_id}';`;
   data = await invoke("run_sqlite_query", { query });
    if(data.length === 0){
      // fetch from supabase
      let { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .limit(1)
        .single();
      if(error){
          console.error("Error fetching user data:", error);
          return;
      }
      // insert into local
      let insertQuery = `INSERT INTO users_local (id, user_id, gym_id, branch_id, email, name, role, updated_at) VALUES (
         '${userData.id}',
         '${userData.id}',
         '${userData.gym_id}',
          '${userData.branch_id}',
          '${userData.email}',
          '${userData.name || ''}',
          '${userData.role}',
          '${userData.updated_at}'
      );`;
      await invoke("run_sqlite_query", { query: insertQuery });
   }
}
async function synchroniser(tableName, user) {
  const query = `
    SELECT *
    FROM ${tableName}_local
    WHERE gym_id='${user.gym_id}'
      AND (is_dirty=true OR is_dirty=1);
  `;

  const data = await invoke("run_sqlite_query", { query });
  if (!data || data.length === 0) return;

  console.log(`🔄 Syncing ${data.length} records to ${tableName}...`);

  const successfullySyncedIds = [];

  for (const record of data) {
    try {
      const r = { ...record };

      // ─────────────────────────────────
      // 🧼 common cleanup
      // ─────────────────────────────────
      delete r.is_dirty;
      delete r.synced_at;
      delete r.comment;
      delete r.created_at;
      delete r.biometric_data;

      if (!r.updated_at) delete r.updated_at;

      // ─────────────────────────────────
      // 🧠 table-specific logic
      // ─────────────────────────────────
      switch (tableName) {
        case 'memberships':
          delete r.balance;
          break;

        case 'staff':
          if (!r.join_date) delete r.join_date;
          if (!r.user_id) delete r.user_id;
          break;

        case 'expenses':
          r.updated_by = user.user_id;
          break;

        case 'members':
            r.BLOCKED = !!r.BLOCKED;

            // 🔥 normalize "null" strings
            normalizeNulls(r);

            // never send base64 blobs
            delete r.photo_url;

            // hard validation
            if (!r.gym_id || !r.name || r.serial_number == null) {
                console.error(`❌ Invalid member payload`, r);
                continue;
            }
            break;

      }

      // ─────────────────────────────────
      // 🚀 isolated upsert
      // ─────────────────────────────────
      if (tableName === 'members') {
        console.log("🧪 Upserting member:", r);
      }
      if(r.updated_by == null){
        delete r.updated_by;
      }
      if (r.trainer_id === "null") {
        r.trainer_id = null;
      }

      const { error } = await supabase
        .from(tableName)
        .upsert(r, { onConflict: 'id' });

      if (error) {
        throw error;
      }

      successfullySyncedIds.push(r.id);
      console.log(`✅ Synced ${tableName} → ${r.id}`);

    } catch (err) {
      console.log(record)
      console.log(
        `❌ Failed to sync ${tableName} record ${record}`,
        {
          code: err.code,
          message: err.message,
          details: err.details
        }
      );

      // FK recovery logic
      switch (err.details) {
        case 'Key is not present in table "members".':
          await invoke("mark_records_as_unsynced", {
            tableName: `members_local`,
            id: `'${record.member_id}'`
          });
          break;

        case 'Key is not present in table "staff".':
          await invoke("mark_records_as_unsynced", {
            tableName: `staff_local`,
            id: `'${record.staff_id}'`
          });
          break;

        case 'Key is not present in table "packages".':
          await invoke("mark_records_as_unsynced", {
            tableName: `packages_local`,
            id: `'${record.package_id}'`
          });
          break;

        case 'Key is not present in table "memberships".':
          await invoke("mark_records_as_unsynced", {
            tableName: `memberships_local`,
            id: `'${record.membership_id}'`
          });
          break;

        default:
          // leave dirty → retry later
          break;
      }

      // keep going — but no lies ✨
    }
  }

  // ─────────────────────────────────
  // 🏁 mark ONLY successful ones
  // ─────────────────────────────────
  if (successfullySyncedIds.length > 0) {
    const ids = successfullySyncedIds.map(id => `'${id}'`).join(',');

    await invoke("mark_records_as_synced", {
      tableName: `${tableName}_local`,
      id: ids
    });

    console.log(
      `🟢 Marked ${successfullySyncedIds.length} ${tableName} records as synced`
    );
  }
}

function normalizeNulls(obj) {
  for (const key in obj) {
    if (obj[key] === "null" || obj[key] === "") {
      obj[key] = null;
    }
  }
}
async function updateData({
    tableName,
    record
}) {
    switch (tableName) {
        case 'packages':
            return await packageService.saveSQLite(record);
        case 'staff':
            return await invoke('upsert_staff', {
                staff: {
                    ...record,
                    deleted: record.deleted || false,
                    is_dirty: false
                }
            });
        case 'expenses':
            return await expenseService.saveSQLite(record);
        case 'templates':
            return await templateService.saveSqlite(record);
        case 'members':
            // insert or update member_local
            let memberExists = await invoke('run_sqlite_query', { query: `SELECT id FROM members_local WHERE id='${record.id}';` });
            if (memberExists && memberExists.length > 0) {
                // update
                let query = `UPDATE members_local SET 
                    name='${record.name}',
                    BLOCKED=${record.BLOCKED === true ? 1 : 0},
                    contact='${record.contact}',
                    father_name='${record.father_name|| ''}',
                    address='${record.address || ''}',
                    dob='${record.dob|| ''}',
                    email='${record.email || ''}',
                    admission_date='${record.admission_date}',
                    updated_at='${new Date().toISOString()}',
                    photo_url='${record.photo_url || ''}',
                    gender='${record.gender || ''}'
                    WHERE id='${record.id}' AND gym_id='${record.gym_id}';`;
                return await invoke('run_sqlite_query', { query });
            } else {
                // insert
                let query = `INSERT INTO members_local (id, serial_number, gym_id, branch_id, name, BLOCKED, contact, father_name, address, dob, email, admission_date, updated_at, is_dirty, gender) VALUES (
                    '${record.id}',
                    ${record.serial_number},
                    '${record.gym_id}',
                    '${record.branch_id}',
                    '${record.name}',
                    '${record.BLOCKED ? 1 : 0}',
                    '${record.contact || ''}',
                    '${record.father_name || ''}',
                    '${record.address || ''}',
                    '${record.dob || ''}',
                    '${record.email || ''}',
                    '${record.admission_date || ''}',
                    '${record.updated_at || new Date().toISOString()}',
                    0,
                    '${record.gender || ''}'
                );`;
                return await invoke('run_sqlite_query', { query });
            }
        case 'memberships':
            // insert or update member_local
            let membershipExists = await invoke('run_sqlite_query', { query: `SELECT id FROM memberships_local WHERE id='${record.id}';` });
            if (membershipExists && membershipExists.length > 0) {
                // update
                let query = `UPDATE memberships_local SET 
                    amount_paid=${record.amount_paid},
                    discount=${record.discount},
                    start_date='${record.start_date}',
                    due_date='${record.due_date}',
                    cancellation_date='${record.cancellation_date}',
                    updated_at='${new Date().toISOString()}',
                    balance=${record.balance},
                    package_id='${record.package_id}',
                    trainer_id='${record.trainer_id}',
                    status='${record.status || 'active'}'
                    WHERE id='${record.id}' AND gym_id='${record.gym_id}';`;
                return await invoke('run_sqlite_query', { query });
            } else {
                // insert
                let query = `INSERT INTO memberships_local (id, gym_id, branch_id, member_id, package_id, trainer_id, receipt_date, start_date, due_date, cancellation_date, total_amount, amount_paid, discount, updated_at, is_dirty, status) VALUES (
                    '${record.id}',
                    '${record.gym_id}',
                    '${record.branch_id}',
                    '${record.member_id}',
                    '${record.package_id}',
                    '${record.trainer_id}',
                    '${record.receipt_date || ''}',
                    '${record.start_date || ''}',
                    '${record.due_date || ''}',
                    '${record.cancellation_date || ''}',
                    ${record.total_amount || 0},
                    ${record.amount_paid || 0},
                    ${record.discount || 0},
                    '${record.updated_at || new Date().toISOString()}',
                    0,
                    '${record.status || 'active'}'
                );`;
                return await invoke('run_sqlite_query', { query });
            }
        case 'transactions':
            let transactionExists = await invoke('run_sqlite_query', { query: `SELECT id FROM transactions_local WHERE id='${record.id}';` });
            if (transactionExists && transactionExists.length > 0) {
                // update
                let query = `UPDATE transactions_local SET 
                    amount=${record.amount},
                    payment_method='${record.payment_mode}',
                    txn_date='${record.txn_date}',
                    txn_type='${record.txn_type}',
                    membership_id='${record.membership_id}',
                    member_id='${record.member_id}',
                    updated_at='${new Date().toISOString()}',
                    status='${record.status || 'completed'}'
                    WHERE id='${record.id}' AND gym_id='${record.gym_id}';`;
                return await invoke('run_sqlite_query', { query });
            }else{
                // insert
                let query = `INSERT INTO transactions_local (id, gym_id, branch_id, membership_id, member_id, amount, payment_method, txn_date, txn_type, updated_at, is_dirty, status) VALUES (
                    '${record.id}',
                    '${record.gym_id}',
                    '${record.branch_id}',
                    '${record.membership_id}',
                    '${record.member_id}',
                    ${record.amount},
                    '${record.payment_method}',
                    '${record.txn_date}',
                    '${record.txn_type}',
                    '${record.updated_at || new Date().toISOString()}',
                    0,
                    '${record.status || 'completed'}'
                );`;
                return await invoke('run_sqlite_query', { query });
            }
                  
    }

};
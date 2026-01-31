import { supabase } from '@/app/lib/createClient';
import { invoke } from '@tauri-apps/api/core';
import { parse } from 'node:path';

  const now = new Date();
  // 🔥 CALENDAR-SAFE DATE STRINGS (NO TIMEZONE ISSUES)
  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split('T')[0];

  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(todayDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const dayAfterTomorrowDate = new Date(todayDate);
  dayAfterTomorrowDate.setDate(todayDate.getDate() + 2);
  const dayAfterTomorrowStr = dayAfterTomorrowDate.toISOString().split('T')[0];

  const startOfMonthStr = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString().split('T')[0];

  const startOfNextMonthStr = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  ).toISOString().split('T')[0];

export const customerService = {
    fetchSupabase: async(
        gymId,
        branchId,
        selectedFilter = 'total members',
        limit = 10,
        prevItems = []
    ) => {
        let query;
        /* -----------------------------
            BASE QUERY PER FILTER
        ------------------------------*/
        switch (selectedFilter) {
            case null:
            case 'total members':
            query = supabase
                .from('member_view')
                .select('*')
                .eq('gym_id', gymId)
                ;
            break;

            case 'active members':
            query = supabase
                .from('member_view')
                .select('*')
                .eq('gym_id', gymId)
                .gt('due_date', todayStr)
                ;
            break;

            case 'inactive members':
            query = supabase
                .from('member_view')
                .select('*')
                .eq('gym_id', gymId)
                .lte('due_date', todayStr)
                .or(`cancellation_date.is.null,cancellation_date.gt.${todayStr}`)
                ;
            break;

            case 'cancelled members':
            query = supabase
                .from('member_view')
                .select('*')
                .eq('gym_id', gymId)
                .lt('cancellation_date', todayStr)
                ;
            break;

            case 'birthdays':
            query = supabase
                .from('members_birthday_today')
                .select('*')
                .eq('gym_id', gymId);
            break;

            case 'admissions':
            query = supabase
                .from('member_view')
                .select('*')
                .eq('gym_id', gymId)
                .eq('txn_type', 'admission')
                .gte('receipt_date', startOfMonthStr)
                .lt('receipt_date', startOfNextMonthStr)
                ;
            break;

            case 'renewals':
            query = supabase
                .from('member_view')
                .select('*')
                .eq('gym_id', gymId)
                .eq('txn_type', 'renewal')
                .gte('receipt_date', startOfMonthStr)
                .lt('receipt_date', startOfNextMonthStr)
                ;
            break;

            case 'collections today':
            query = supabase
                .from('member_view')
                .select('*')
                .eq('gym_id', gymId)
                .eq('receipt_date', todayStr)
                ;
            break;

            case 'due dates':
            query = supabase
                .from('member_view')
                .select('*')
                .eq('gym_id', gymId)
                .gte('due_date', todayStr)
                .lt('due_date', dayAfterTomorrowStr)
                ;
            break;

            case 'cancellations dates':
            query = supabase
                .from('member_view')
                .select('*')
                .eq('gym_id', gymId)
                .gte('cancellation_date', todayStr)
                .lt('cancellation_date', dayAfterTomorrowStr)
                ;
            break;

            case 'refunds':
            query = supabase
                .from('refunds_view')
                .select('*')
                .eq('gym_id', gymId)
                .gte('receipt_date', startOfMonthStr)
                .lte('receipt_date', startOfNextMonthStr)
                ;
            break;

            default:
            query = supabase
                .from('member_view')
                .select('*')
                .eq('gym_id', gymId)
                ;
            break;
        }

        /* -----------------------------
            CURSOR PAGINATION
        ------------------------------*/
        if(branchId){
            query = query.eq('branch_id', branchId).order('serial_number', { ascending: true })
        }else{
            query = query.order('serial_number', { ascending: true }).order('branch_id', { ascending: true })
        }
        if (prevItems.length > 0 && prevItems[prevItems.length - 1]?.serial_number != null) {
            const lastSerial = prevItems[prevItems.length - 1].serial_number;
            query = query.gt('serial_number', lastSerial);
        }

        query = query.limit(limit);

        const { data, error } = await query;

        return {
            data: data || [],
            error
        };
    },
    searchSingleSupabase: async(gymId, memberId) => {
        let query = supabase
        .from('member_view')
        .select('*')
        .eq('gym_id', gymId)
        .eq('id', memberId)
        .eq('deleted', false)
        .limit(1);
        const { data, error } = await query;
        return {
            data: data || [],
            error
        };
    },
    searchSupabase: async(gymId, branchId, orConditions, limit) => {
        let query = supabase
        .from('member_view')
        .select('*')
        .eq('gym_id', gymId)
        .or(orConditions)
        .limit(limit)
        if(branchId){
            query = query.order('branch_id', { ascending: true })
        }
        const { data, error } = await query;

        return {
            data: data || [],
            error
        };
    },
    fetchTauri: async(gymId, branchId, selectedFilter='total members', limit=20, offset=0)=>{
        let data = [];
        let error = null;
        let query = '';
        switch (selectedFilter){
                case 'total members':
                    query = `SELECT * FROM member_view_local WHERE gym_id='${gymId}' ${branchId ? `AND branch_id='${branchId}'` : ''} AND deleted IS NOT TRUE ORDER BY serial_number ASC LIMIT ${limit} OFFSET ${offset};`;
                    break;
                case 'active members':
                    query = `SELECT * FROM member_view_local WHERE gym_id='${gymId}' ${branchId ? `AND branch_id='${branchId}'` : ''} AND current_status='Active' and (blocked=0 or blocked IS NULL) AND deleted IS NOT TRUE ORDER BY serial_number ASC LIMIT ${limit} OFFSET ${offset};`;
                    break;
                case 'inactive members':
                    query = `SELECT * FROM member_view_local WHERE gym_id='${gymId}' ${branchId ? `AND branch_id='${branchId}'` : ''} AND current_status='Inactive' and (blocked=0 or blocked IS NULL) AND deleted IS NOT TRUE ORDER BY serial_number ASC LIMIT ${limit} OFFSET ${offset};`;
                    break;
                case 'cancelled members':
                    query = `SELECT * FROM member_view_local WHERE gym_id='${gymId}' ${branchId ? `AND branch_id='${branchId}'` : ''} AND current_status='Cancelled' and (blocked=0 or blocked IS NULL) AND deleted IS NOT TRUE ORDER BY serial_number ASC LIMIT ${limit} OFFSET ${offset};`;
                    break;
                case 'birthdays':
                    const today = new Date();
                    const month = today.getMonth() + 1;
                    const day = today.getDate();
                    query = `SELECT * FROM member_view_local WHERE gym_id='${gymId}' ${branchId ? `AND branch_id='${branchId}'` : ''} AND strftime('%m', dob)='${month.toString().padStart(2, '0')}' AND strftime('%d', dob)='${day.toString().padStart(2, '0')}' AND deleted IS NOT TRUE ORDER BY serial_number ASC LIMIT ${limit} OFFSET ${offset};`;
                    break;
                case 'admissions':  
                    query = `SELECT * FROM member_view_local WHERE gym_id='${gymId}' ${branchId ? `AND branch_id='${branchId}'` : ''} AND strftime('%Y-%m', last_transaction_date)=strftime('%Y-%m', 'now') AND first_transaction_type='admission' AND deleted IS NOT TRUE ORDER BY serial_number ASC LIMIT ${limit} OFFSET ${offset};`;
                    break;
                case 'renewals':
                    query = `SELECT * FROM member_view_local WHERE gym_id='${gymId}' ${branchId ? `AND branch_id='${branchId}'` : ''} AND strftime('%Y-%m', last_transaction_date)=strftime('%Y-%m', 'now') AND first_transaction_type='renewal' AND deleted IS NOT TRUE ORDER BY serial_number ASC LIMIT ${limit} OFFSET ${offset};`;
                    break;
                case 'total collections':
                    query = `SELECT * FROM member_view_local WHERE gym_id='${gymId}' ${branchId ? `AND branch_id='${branchId}'` : ''} AND strftime('%Y-%m', last_transaction_date)=strftime('%Y-%m', 'now') AND deleted IS NOT TRUE ORDER BY serial_number ASC LIMIT ${limit} OFFSET ${offset};`;
                    break;
                case 'balance':
                    query = `SELECT * FROM member_view_local WHERE gym_id='${gymId}' ${branchId ? `AND branch_id='${branchId}'` : ''} AND strftime('%Y-%m', last_transaction_date)=strftime('%Y-%m', 'now') AND balance > 0 AND deleted IS NOT TRUE ORDER BY serial_number ASC LIMIT ${limit} OFFSET ${offset};`;
                    break;
                case 'admissions today':
                    query = `SELECT * FROM member_view_local WHERE gym_id='${gymId}' AND date(last_transaction_date)=date('now','localtime') AND first_transaction_type='admission' AND deleted IS NOT TRUE ORDER BY serial_number ASC LIMIT ${limit} OFFSET ${offset};`;
                    break;
                case 'renewals today':
                    query = `SELECT * FROM member_view_local WHERE gym_id='${gymId}' AND date(receipt_date)=date('now','localtime') AND first_transaction_type='renewal' AND deleted IS NOT TRUE ORDER BY serial_number ASC LIMIT ${limit} OFFSET ${offset};`;
                    break;
                case 'collections today':
                    query = `SELECT * FROM member_view_local WHERE gym_id='${gymId}' ${branchId ? `AND branch_id='${branchId}'` : ''} AND last_transaction_date='${new Date().toISOString().split('T')[0]}' AND deleted IS NOT TRUE ORDER BY serial_number ASC LIMIT ${limit} OFFSET ${offset};`;
                    
                    break;
                case 'due dates':
                    query = `SELECT * FROM member_view_local WHERE gym_id='${gymId}' ${branchId ? `AND branch_id='${branchId}'` : ''} and (blocked=0 or blocked IS NULL) AND (date(due_date)=date('now','localtime') OR date(due_date)=date('now','localtime', '+1 day')) AND deleted IS NOT TRUE ORDER BY serial_number ASC LIMIT ${limit} OFFSET ${offset};`;
                    break;
                case 'cancellations dates':
                    query = `SELECT * FROM member_view_local WHERE gym_id='${gymId}' ${branchId ? `AND branch_id='${branchId}'` : ''} and (blocked=0 or blocked IS NULL) AND (date(cancellation_date)=date('now','localtime') OR date(cancellation_date)=date('now','localtime', '+1 day')) AND deleted IS NOT TRUE ORDER BY serial_number ASC LIMIT ${limit} OFFSET ${offset};`;
                    break;
                default:
                    query = `SELECT * FROM member_view_local WHERE gym_id='${gymId}' ${branchId ? `AND branch_id='${branchId}'` : ''}  AND deleted IS NOT TRUE ORDER BY serial_number ASC LIMIT ${limit} OFFSET ${offset};`;
                    break;
            }
            //console.log('Executing query:', query);
        console.log('Executing query:', query);
        data = await invoke('run_sqlite_query', { query: query });
        console.log('Query result:', data);
        return { data: data.data || data, error };
    },
    searchTauri: async (search, gym_id, branch_id, offset) => {
        search = search?.trim();
        if (!search) return [];

        const limit = 100;
        const tokens = search.toLowerCase().split(/\s+/).filter(Boolean);

        const queries = tokens.map(async (token) => {
            const q = `
            SELECT *
            FROM member_view_local
            WHERE gym_id='${gym_id}'
            ${branch_id ? `AND branch_id='${branch_id}'` : ''}
            AND deleted IS NOT TRUE
            AND (
                LOWER(name) LIKE LOWER('%${token}%')
                OR LOWER(father_name) LIKE LOWER('%${token}%')
                OR REPLACE(REPLACE(contact, ' ', ''), '-', '') 
                    LIKE '%' || REPLACE(REPLACE('${token}', ' ', ''), '-', '') || '%'
                OR LOWER(member_code) LIKE LOWER('%${token}%')
                OR LOWER(address) LIKE LOWER('%${token}%')
                OR LOWER(package_name) LIKE LOWER('%${token}%')
                OR LOWER(trainer_name) LIKE LOWER('%${token}%')
                OR due_date LIKE '%${token}%'
                OR serial_number LIKE '%${token}%'
                OR cancellation_date LIKE '%${token}%'
            )
            ORDER BY serial_number ASC
            LIMIT ${limit}
            OFFSET ${offset};
            `;

            const res = await invoke('run_sqlite_query', { query: q })
            .catch(() => null);

            const rows = normalizeSqliteResult(res);

            console.log('Token:', token, 'Rows:', rows.length);

            return rows;
        });

        const results = await Promise.all(queries);

        console.log('Search results from all tokens:', results);

        return results.flat();
        },
    searchSingleTauri: async(gym_id, memberId) => {
        if(!memberId) return null;
        const query = `SELECT * FROM member_view_local WHERE gym_id='${gym_id}' AND id='${memberId}' AND deleted IS NOT TRUE LIMIT 1;`;
        const res = await invoke('run_sqlite_query', { query: query })
        .catch(() => null);
        const rows = normalizeSqliteResult(res);
        return rows;
    }
}
const normalizeSqliteResult = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.rows)) return res.rows;
  if (Array.isArray(res.data?.rows)) return res.data.rows;
  return [];
};

const checkDate = (dateString) => {
    let parts = dateString.split('-');
    if(parts.length !== 3) return dateString;
    else{
        dateString = `${parts[2]}-${parts[1]}-${parts[0]}`;
        return dateString;
    }
}
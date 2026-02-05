import { useEffect, useRef, useState } from 'react';
import {
  buildMemberAttendanceQuery,
  buildStaffAttendanceQuery,
  runAttendanceQuery
} from './attendanceService';
import { useSelector } from 'react-redux';
import { resourceServices } from '../../resourceServices';
import { invoke } from '@tauri-apps/api/core';

const headers = [
  "ID",
  "Name",
    "Status",
    "Package",
    "Pkg Expiry",
    "Trainer",
    "Tr Expiry",
    "Tr Status",
    "Balance",
    "Date",
    "In Time",
    "Out Time"
]
const headersStaff = [
  "Staff ID",
  "Name",
  "Status",
  "Date",
  "Calculated Salary",
  "Total Commission",
  "Total Hours Worked",
  "Check-In Time",
  "Check-Out Time",
]

export function useAttendanceManager(user, attendanceID, setSelectedCustomer) {
  const balanceColorIsYellow = useSelector((state) => state.profile.tauriConfig.balanceColorIsYellow);
  const [membersDetails, setMembersDetails] = useState(null);

  const [attendanceData, setAttendanceData] = useState(null);
  const [unfilteredData, setUnfilteredData] = useState(null);

  const [attendanceType, setAttendanceType] = useState('Members');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [subFilter, setSubFilter] = useState('All');

  const debounceRef = useRef(null);
  const abortRef = useRef(false);

  const handleClick = async(attendanceID)=>{
        let data = await resourceServices.getProfile(user.gym_id, user.branch_id, attendanceID);
        data['membership_history'] = JSON.parse(data.membership_history);
        setSelectedCustomer(data);
    }
  /* -------------------- SEARCH DEBOUNCE -------------------- */
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  /* -------------------- MAIN FETCH -------------------- */
  useEffect(() => {
    abortRef.current = false;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (!user?.gym_id) return;

      const isGymID =
        searchQuery &&
        !isNaN(searchQuery) &&
        searchQuery.toString().length < 6;

      const query =
        attendanceType === 'Members'
          ? buildMemberAttendanceQuery({
              gym_id: user.gym_id,
              branch_id: user.branch_id,
              selectedDate,
              searchQuery,
              isGymID
            })
          : buildStaffAttendanceQuery({
              gym_id: user.gym_id,
              branch_id: user.branch_id,
              selectedDate,
              searchQuery
            });

      try {
        const rows = await runAttendanceQuery(query);
        if (!abortRef.current) {
          setAttendanceData(rows || []);
          setUnfilteredData(rows || []);
        }
      } catch (err) {
        console.error('Attendance error:', err);
      }
    }, 250);

    return () => {
      abortRef.current = true;
    };
  }, [attendanceID, selectedDate, searchQuery, attendanceType]);

  /* -------------------- SUB FILTER -------------------- */
  useEffect(() => {
    if (!unfilteredData) return;

    let filtered = [...unfilteredData];

    if (subFilter === 'Active') {
      filtered = filtered.filter(e => e.current_status === 'Active');
    } else if (subFilter === 'Inactive') {
      filtered = filtered.filter(e => e.current_status === 'Inactive');
    } else if (subFilter === 'Balance Due') {
      filtered = filtered.filter(e => e.balance && e.balance !== '0/-');
    }

    setAttendanceData(filtered);
  }, [subFilter, unfilteredData]);

  useEffect(()=>{
      // count active, inactive, balance due
      //console.log(attendanceData)
      if(!attendanceData){
        setMembersDetails(null);
        return;
      }
      const details = {
        total: attendanceData.length,
        active: attendanceData.filter(e => e.current_status === 'Active').length,
        inactive: attendanceData.filter(e => e.current_status === 'Inactive').length,
        balanceDue: attendanceData.filter(e => e.balance && e.balance !== '0/-').length,
        male: attendanceData.filter(e => e.gender === 'male').length,
        female: attendanceData.filter(e => e.gender === 'female').length,
      }
      setMembersDetails(details);
    },[attendanceData])
  
  useEffect(()=>{
       const fetchAttendanceForToday = async()=>{
          let todayDate = new Date().toISOString().split('T')[0];
          let query = `
              SELECT * FROM attendance_view_local 
              WHERE gym_id='${user.gym_id}'
              ${user.branch_id ? `AND branch_id='${user.branch_id}'` : ""}
              AND date='${todayDate}'
              ORDER BY COALESCE(updated_at, check_out_time, check_in_time) DESC;
          `;
          try {
              const rows = await invoke("run_sqlite_query", { query });
              if (rows && rows.length > 0) {
                  setAttendanceData(rows);
              } else {
                  setAttendanceData([]);
              }
          } catch (err) {
              console.log("Attendance load error:", err);
          }
       };
       const interval = setInterval(() => {
        // only if no filter is applied
        if (!searchQuery || searchQuery.trim() === "") {
          fetchAttendanceForToday();
        }
      }, 1000);

      // cleanup = no memory leaks, we are responsible adults 💅
      return () => clearInterval(interval);
    }, [searchQuery, selectedDate]);
  return {
    membersDetails,
    attendanceData,
    attendanceType,
    selectedDate,
    searchInput,
    subFilter,

    setAttendanceType,
    setSelectedDate,
    setAttendanceData,
    setMembersDetails,

    setSearchInput,
    setSubFilter,
    handleClick, 

    headers,
    headersStaff,
    balanceColorIsYellow
  };
}

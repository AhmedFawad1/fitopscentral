'use client'
import { invoke } from '@tauri-apps/api/core';
import React, {useState, useEffect, useRef} from 'react'
import { useDispatch, useSelector } from 'react-redux';
//import { setAttendanceID, setSelectedStaff, setUpsertAttendance } from '../../../store/profileSlice';
import { resourceServices } from '../../resourceServices';
import { broom, BrushCleaning } from 'lucide-react';
import InputField from '../../AppComponents/subcomponents/InputField';
import { setAttendanceID, setSelectedStaff, setUpsertAttendance } from '@/store/profileSlice';
import { ProfilePicture } from '../customers/CustomersUI';
import { formatDate } from '../expenses/ExpensesUI';
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
export default function Attendance({
    setSelectedCustomer
}) {
    const balanceColorIsYellow = useSelector((state) => state.profile.tauriConfig.balanceColorIsYellow);
    const user = useSelector((state) => state.auth.user);
    const [membersDetails, setMembersDetails] = useState(null);
    const attendanceID = useSelector((state) => state.profile.attendanceID);
    const [attendanceData, setAttendanceData] = useState(null);
    const [attendanceType, setAttendanceType] = useState('Members');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchInput, setSearchInput] = useState("");   // fast UI
    const [searchQuery, setSearchQuery] = useState("");   // slow DB trigger

    const [unfilteredAttendanceData, setUnfilteredAttendanceData] = useState(null); 
    const [subFilter, setSubFilter] = useState('All');
    const dispatch = useDispatch();
    const debounceRef = useRef(null);
    const abortRef = useRef(false);
    const handleClick = async(attendanceID)=>{
        let data = await resourceServices.getProfile(user.gym_id, user.branch_id, attendanceID);
        data['membership_history'] = JSON.parse(data.membership_history);
        setSelectedCustomer(data);
    }
    useEffect(() => {
        abortRef.current = false;

        // cancel previous debounce
        if (debounceRef.current) clearTimeout(debounceRef.current);

        // 1) Debounce 250ms for smoother typing
        debounceRef.current = setTimeout(() => {

            // 2) Offload work to idle time (non-blocking)
            const run = window.requestIdleCallback
                ? window.requestIdleCallback
                : (cb) => setTimeout(cb, 1);

            run(async () => {
                if (abortRef.current) return;

                // early exit
                if (!selectedDate && (!searchQuery || searchQuery.trim() === "")) {
                    setAttendanceData([]);
                    return;
                }
                let isgymID = searchQuery && searchQuery.trim() !== "" && !isNaN(searchQuery) && searchQuery.toString().length < 6 ? true : false;
                
                let query;

                if (attendanceType === "Members") {
                    query = `
                        SELECT * FROM attendance_view_local 
                        WHERE gym_id='${user.gym_id}'
                        ${user.branch_id ? `AND branch_id='${user.branch_id}'` : ""}
                        ${
                            searchQuery && !isgymID
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
                        ${
                            isgymID
                                ? `AND serial_number='${searchQuery}'`
                                : ""
                        }
                        ${selectedDate ? `AND date='${selectedDate}'` : ""}
                        ${
                            searchQuery && !selectedDate
                                ? `ORDER BY date DESC ${attendanceType === "Staff"?"LIMIT 40":""} ;`
                                : "ORDER BY COALESCE(updated_at, check_out_time, check_in_time) DESC;"
                        }
                    `;
                } else {
                    query = `
                      SELECT *
                      FROM staff_attendance_view_local
                      WHERE gym_id='${user.gym_id}'
                      ${user.branch_id ? `AND branch_id='${user.branch_id}'` : ""}
                      ${selectedDate ? `AND date='${selectedDate}'` : ""}
                      ${searchQuery && `AND (
                          LOWER(name) LIKE LOWER('%${searchQuery}%')
                          OR serial_number LIKE '%${searchQuery}%'
                      )`}
                      ORDER BY
                          ${searchQuery && !selectedDate? 'date':'COALESCE(updated_at, check_out_time, check_in_time)'} DESC;
                  `;
                }

                try {
                    const rows = await invoke("run_sqlite_query", { query });

                    if (abortRef.current) return;

                    if (rows && rows.length > 0) {
                        setAttendanceData(rows);
                        setUnfilteredAttendanceData(rows);
                    } else {
                        setAttendanceData([]);
                    }

                } catch (err) {
                    if (!abortRef.current) console.error("Attendance load error:", err);
                }
            });

        }, 250); // ← debounce

        return () => {
            abortRef.current = true;
        };

    }, [attendanceID, selectedDate, searchQuery, attendanceType]);
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
      // apply sub filter on attendance data
      if(!unfilteredAttendanceData) return;
      let filteredData = [...unfilteredAttendanceData];
      if(subFilter === 'Active'){
        filteredData = unfilteredAttendanceData.filter(e => e.current_status === 'Active');
      }else if(subFilter === 'Inactive'){
        filteredData = unfilteredAttendanceData.filter(e => e.current_status === 'Inactive');
      }else if(subFilter === 'Balance Due'){
        filteredData = unfilteredAttendanceData.filter(e => e.balance && e.balance !== '0/-');
      }else if(subFilter === 'Male'){
        filteredData = unfilteredAttendanceData.filter(e => e.gender === 'male');
      }else if(subFilter === 'Female'){
        filteredData = unfilteredAttendanceData.filter(e => e.gender === 'female');
      }else if(subFilter === 'Package Expiry' && selectedDate){
        const today = new Date(selectedDate);
        filteredData = unfilteredAttendanceData.filter(e => {
          if(!e.due_date) return false;
          const dueDate = new Date(e.due_date);
          const timeDiff = dueDate - today;
          const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          return daysDiff === 0; // expiring today
        });
      }else if(subFilter === 'Trainer Expiry' && selectedDate){
        const today = new Date(selectedDate);
        filteredData = unfilteredAttendanceData.filter(e => {
          if(!e.trainer_expiry) return false;
          const trDueDate = new Date(e.trainer_expiry);
          const timeDiff = trDueDate - today;
          const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          return daysDiff === 0; // expiring today
        }
        );
      }
      setAttendanceData(filteredData);
    },[subFilter,unfilteredAttendanceData])
    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearchQuery(searchInput.trim());
        }, 300); // delay only DB query, not typing

        return () => clearTimeout(timeout);
    }, [searchInput]);

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
                  setUnfilteredAttendanceData(rows);
              } else {
                  setAttendanceData([]);
              }
          } catch (err) {
              console.log("Attendance load error:", err);
          }
       };
       const interval = setInterval(() => {
        // only if no filter is applied
        console.log(selectedDate, searchQuery);

        if (!searchQuery || searchQuery.trim() === "") {
          fetchAttendanceForToday();
        }
      }, 1000);

      // cleanup = no memory leaks, we are responsible adults 💅
      return () => clearInterval(interval);
    }, [searchQuery, selectedDate]);
  return (
    <div className='flex flex-col py-5 gap-4 overflow-auto px-10 lg:px-5 bg-(--page-bg)]'>
        <h1 className='text-2xl w-full font-semibold text-center mb-2'>Attendance Portal</h1> 
        <div className={`grid ${attendanceData && attendanceData.length > 0 && attendanceType === 'Members' ? 'grid-cols-3' : (user?.role === 'receptionist' ? 'grid-cols-2' : 'grid-cols-3')} gap-2`}>
          {
            user.payroll_management && user?.role !=='receptionist' && (
              <InputField
                  label='Select Attendance Type'
                  type='ddm'
                  value={attendanceType}
                  ddmValues={['Members','Staff'].map((type) => ({ label: type, value: type }))}
                  onChange={(e) => setAttendanceType(e.target.value)}
              />
            )
          }
        <InputField
            label="Select Date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
        /> 
        <InputField
            label="Search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by Name, ID, Trainer"
        />

        {
          attendanceType === 'Members' && attendanceData?.length > 0 && (
            <InputField
              label='Sub Filter'
              type='ddm'
              value={subFilter}
              ddmValues={['All', 'Active', 'Inactive','Package Expiry','Trainer Expiry', 'Balance Due', 'Male', 'Female'].map((filter) => ({ label: filter, value: filter }))}
              onChange={(e) => setSubFilter(e.target.value)}
            />
          )
        }
        
        </div>
          {
            membersDetails && (
              <div className="p-2 bg-[var(--color-card)] rounded-md flex flex-wrap gap-4 text-sm text-[var(--color-text-muted)]">
                <div>Total Members: <span className="font-semibold text-[var(--color-text)]">{membersDetails.total || 0}</span></div>
                <div>Active: <span className="font-semibold text-green-500">{membersDetails.active || 0}</span></div>
                <div>Inactive: <span className={`font-semibold ${balanceColorIsYellow ? 'text-red-500' : 'text-yellow-500'}`}>{membersDetails.inactive || 0}</span></div>
                <div>Balance Due: <span className={`font-semibold ${balanceColorIsYellow ? 'text-yellow-500' : 'text-red-500'}`}>{membersDetails.balanceDue || 0}</span></div>
                <div>Male: <span className="font-semibold text-[var(--color-text)]">{membersDetails.male || 0}</span></div>
                <div>Female: <span className="font-semibold text-[var(--color-text)]">{membersDetails.female || 0}</span></div>
                <button onClick={() => {
                    setSearchQuery('');
                    setSelectedDate('');
                    setSubFilter('All');
                    setAttendanceType('Members');
                    setAttendanceData(null);
                  }}
                  >
                    <BrushCleaning className='h-4 w-5 text-[var(--color-text)]' />
                  </button>
              </div>
            )
          }
        
        <div className="relative border mt-2 border-gray-200 rounded-md overflow-x-hidden overflow-y-auto max-h-110">
            <table className="min-w-full text-sm table-fixed border-collapse">
              <thead className="bg-[var(--color-primary)] text-center text-white sticky top-0 z-10">
                  <tr>
                    {attendanceType === 'Members' ? headers.map((header, index) => (
                      <th key={index} className="px-4 py-2 text-center text-[10pt]">{header}</th>
                    )) : headersStaff.map((header, index) => (
                      <th key={index} className="px-4 py-2 text-center text-[10pt]">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-[var(--color-card)] divide-y divide-gray-200">
                  {attendanceType === 'Members' && attendanceData?.map((e, i) => (
                    e.name &&
                    <tr className='cursor-pointer text-center' key={i}
                      onClick={() => {
                        handleClick(e.serial_number);
                      }}
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-[10pt] ">{e.serial_number}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[12pt]">
                        <div className="flex items-center gap-2">
                          <ProfilePicture
                            height={8}
                            width={8}
                            gender={e.gender}
                            ProfilePictureLink={e.photo_url}
                          />
                          <span className="leading-none">{e.name}</span>
                        </div>
                      </td>
                      <td className={`whitespace-nowrap text-[10pt] text-center ${e.current_status === 'Active' ? 'bg-green-500' : e.current_status === 'Inactive' && balanceColorIsYellow ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>{e.current_status ? e.current_status : ''}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[10pt] ">{e.package_name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[10pt] ">{e.due_date ? formatDate(e.due_date) : 'N/A'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[10pt] ">{e.trainer_name ? e.trainer_name : 'N/A'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[10pt] ">{e.trainer_expiry ? formatDate(e.trainer_expiry) : 'N/A'}</td>
                      <td className={`px-4 py-2 whitespace-nowrap text-[10pt] font-bold ${e.trainer_status === 'active' ? 'text-green-500' : e.trainer_status === 'inactive' ? 'text-red-500' : 'text-amber-500'    }`}>{makeFirstLetterUppercase(e.trainer_status)}</td>
                      <td className={`text-center whitespace-nowrap text-[10pt] ${e.balance===0 ? '' : balanceColorIsYellow ? 'bg-amber-500 text-white' : 'bg-red-400'}`}>{e.balance ? e.balance : '0/-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[10pt] ">{e.date ? formatDate(e.date) : ''}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[10pt] ">{e.check_in_time ? toLocalTime(e.check_in_time)?.split(',')[1] : ''}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[10pt] ">{e.check_out_time ? toLocalTime(e.check_out_time)?.split(',')[1] : ''}</td>
                    </tr>
                  ))}
                  {attendanceType === 'Staff' && attendanceData?.map((e, i) => (
                    e.name.length > 0 &&
                    <tr className='cursor-pointer text-center' key={i}
                      onClick={() => {
                        handleClick(e.serial_number);
                      }}
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-[10pt] ">{e.serial_number}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[10pt] ">{e.name}</td>
                      <td className={`whitespace-nowrap text-[10pt] text-center ${e.status === 'active' ? 'bg-green-500' : e.status === 'inactive' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>{e.status ? makeFirstLetterUppercase(e.status) : ''}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[10pt] ">{e.date ? formatDate(e.date) : ''}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[10pt] ">{e.calculated_salary ? calculateSalary(e.hourly_rate, calculateHoursWorked(e.check_in_time, e.check_out_time)).toFixed(2) : '0/-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[10pt] ">{e.total_commission ? e.total_commission : '0/-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[10pt] ">{e.total_hours_worked ? calculateHoursWorked(e.check_in_time, e.check_out_time).toFixed(2) +' hrs' : '0 hrs'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[10pt] ">{e.check_in_time ? fixTimeStamp(e.check_in_time) : ''}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[10pt] ">{e.check_out_time ? fixTimeStamp(e.check_out_time) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {attendanceData && attendanceData.length === 0 && <p className="text-[var(--color-text-muted)]">No attendance data available</p>}
        </div>
        
    </div>
  )
}
function calculateHoursWorked(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;

  const toSeconds = (timeStr) => {
    const [time, meridian] = timeStr.trim().split(' ');
    let [hours, minutes, seconds] = time.split(':').map(Number);

    if (meridian === 'PM' && hours !== 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    return hours * 3600 + minutes * 60 + seconds;
  };

  const inSeconds = toSeconds(checkIn);
  const outSeconds = toSeconds(checkOut);

  // Guard against invalid or negative durations
  if (outSeconds <= inSeconds) return 0;

  const diffInSeconds = outSeconds - inSeconds;

  // Convert to decimal hours (2 decimal precision)
  return Number((diffInSeconds / 3600).toFixed(2));
}
function calculateSalary(hourlyRate, hoursWorked) {
  if (!hourlyRate || !hoursWorked) return 0;
  return hourlyRate * hoursWorked;
}

function toLocalTime(isoString) {
  return new Date(isoString).toLocaleString();
}
export function makeFirstLetterUppercase(str) {
  if (!str || str === 'not assigned') return 'N/A';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function fixTimeStamp(string){
   // add am/pm if not present
   if(!string) return '';
   // example  09:10:00
   let hour = parseInt(string.split(':')[0]);
   let minutes = string.split(':')[1];
   let seconds = string.split(':')[2];
   let ampm = hour >= 12 ? 'PM' : 'AM';
   hour = hour % 12;
   hour = hour ? hour : 12;
    return `${hour}:${minutes}:${seconds} ${ampm}`;
}
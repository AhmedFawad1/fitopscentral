import { BrushCleaning } from 'lucide-react';
import InputField from '../../AppComponents/subcomponents/InputField';
import { ProfilePicture } from '../customers/CustomersUI';
import { formatDate } from '../expenses/ExpensesUI';

const statusColors = {
    Active: 'bg-green-500/20 text-green-600 dark:text-green-400',
    Cancelled: 'bg-red-500/20 text-red-600 dark:text-red-400',
    Inactive: 'bg-yellow-600/20 font-semibold',
  }
  
export default function AttendanceUI({
  attendanceData,
  attendanceType,
  selectedDate,
  searchInput,
  subFilter,
  setAttendanceType,
  setSelectedDate,
  setSearchInput,
  setSubFilter,
  user,
  headers,
  headersStaff,
  balanceColorIsYellow,
  handleClick,
  setAttendanceData,
  membersDetails,
}) {
  return (
    <div className="flex flex-col p-5 gap-4">
      <h1 className="text-2xl font-semibold text-center">
        Attendance Portal
      </h1>

      <div className="grid grid-cols-3 gap-2">
        {user?.payroll_management && (
          <InputField
            label="Attendance Type"
            type="ddm"
            value={attendanceType}
            ddmValues={['Members', 'Staff'].map(v => ({
              label: v,
              value: v
            }))}
            onChange={e => setAttendanceType(e.target.value)}
          />
        )}

        <InputField
          label="Date"
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />

        <InputField
          label="Search"
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />

        {attendanceType === 'Members' && attendanceData?.length > 0 && (
          <InputField
            label="Sub Filter"
            type="ddm"
            value={subFilter}
            ddmValues={[
              'All',
              'Active',
              'Inactive',
              'Balance Due'
            ].map(v => ({ label: v, value: v }))}
            onChange={e => setSubFilter(e.target.value)}
          />
        )}
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
                setSearchInput('');
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
      {/* Table stays here — logic already removed 💅 */}
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
  );
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
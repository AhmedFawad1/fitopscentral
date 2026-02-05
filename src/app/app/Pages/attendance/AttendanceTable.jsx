import { ProfilePicture } from '../customers/CustomersUI';
import { formatDate } from '../expenses/ExpensesUI';

const MEMBER_HEADERS = [
  "ID", "Name", "Status", "Package", "Pkg Expiry",
  "Trainer", "Tr Expiry", "Tr Status",
  "Balance", "Date", "In", "Out"
];

const STAFF_HEADERS = [
  "Staff ID", "Name", "Status", "Date",
  "Salary", "Commission", "Hours", "In", "Out"
];

export default function AttendanceTable({
  attendanceType,
  attendanceData,
  onRowClick,
  balanceColorIsYellow
}) {
  if (!attendanceData) return null;

  return (
    <div className="relative border rounded-md max-h-110 overflow-auto">
      <table className="min-w-full text-sm table-fixed border-collapse">
        <thead className="sticky top-0 bg-[var(--color-primary)] text-white">
          <tr>
            {(attendanceType === 'Members'
              ? MEMBER_HEADERS
              : STAFF_HEADERS
            ).map(h => (
              <th key={h} className="px-2 py-2 text-[10pt] text-center">
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="bg-[var(--color-card)] divide-y">
          {attendanceType === 'Members' &&
            attendanceData.map((e, i) => (
              <tr
                key={i}
                onClick={() => onRowClick(e.serial_number)}
                className="cursor-pointer text-center hover:bg-gray-50"
              >
                <td>{e.serial_number}</td>

                <td className="flex items-center gap-2 justify-center">
                  <ProfilePicture
                    height={7}
                    width={7}
                    gender={e.gender}
                    ProfilePictureLink={e.photo_url}
                  />
                  {e.name}
                </td>

                <td
                  className={`text-white ${
                    e.current_status === 'Active'
                      ? 'bg-green-500'
                      : balanceColorIsYellow
                      ? 'bg-red-500'
                      : 'bg-amber-500'
                  }`}
                >
                  {e.current_status}
                </td>

                <td>{e.package_name}</td>
                <td>{e.due_date ? formatDate(e.due_date) : '—'}</td>
                <td>{e.trainer_name || '—'}</td>
                <td>{e.trainer_expiry ? formatDate(e.trainer_expiry) : '—'}</td>
                <td className="font-semibold">
                  {e.trainer_status || 'N/A'}
                </td>

                <td
                  className={`font-bold ${
                    e.balance && e.balance !== '0/-'
                      ? balanceColorIsYellow
                        ? 'bg-amber-500 text-white'
                        : 'bg-red-400 text-white'
                      : ''
                  }`}
                >
                  {e.balance || '0/-'}
                </td>

                <td>{formatDate(e.date)}</td>
                <td>{e.check_in_time || ''}</td>
                <td>{e.check_out_time || ''}</td>
              </tr>
            ))}

          {attendanceType === 'Staff' &&
            attendanceData.map((e, i) => (
              <tr key={i} className="text-center">
                <td>{e.serial_number}</td>
                <td>{e.name}</td>
                <td className={e.status === 'active' ? 'text-green-500' : 'text-red-500'}>
                  {e.status}
                </td>
                <td>{formatDate(e.date)}</td>
                <td>{e.calculated_salary || '0/-'}</td>
                <td>{e.total_commission || '0/-'}</td>
                <td>{e.total_hours_worked || '0 hrs'}</td>
                <td>{e.check_in_time}</td>
                <td>{e.check_out_time}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {attendanceData.length === 0 && (
        <p className="p-4 text-center text-muted">
          No attendance data 💔
        </p>
      )}
    </div>
  );
}

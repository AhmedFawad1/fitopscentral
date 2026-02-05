import React from 'react'
import { motion } from 'framer-motion';
import { ProfilePicture } from '../customers/CustomersUI';
import { genUUID } from '../uuid';
import { formatDate } from '../expenses/ExpensesUI';
import { setShowCustomer } from '@/store/profileSlice';
import { makeFirstLetterUppercase } from '@/app/lib/functions';

const statusColors = {
    Active: 'bg-green-500/20 text-green-600 dark:text-green-400',
    Cancelled: 'bg-red-500/20 text-red-600 dark:text-red-400',
    Inactive: 'bg-yellow-600/20 font-semibold',
  }

export default function AttendanceUI(
    {
        attendanceCard,
        setAttendanceCard,
        showEnlargedPhoto,
        setShowEnlargedPhoto,
        setSelectedCustomer,
        setSelectedTab
    }
) {
  return (
     attendanceCard && attendanceCard.type === 'member'?
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
        <motion.div 
            className="bg-[var(--background)] justify-between flex flex-col p-4 overflow-y-auto relative md:p-5 rounded-lg shadow-lg h-auto md:w-5xl md:h-[540px] w-screen"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <button
                onClick={() => {
                    setAttendanceCard(null)
                    setSelectedCustomer(null);
                }}
                className="absolute items-center justify-center flex bg-red-600 h-5 w-5 top-4 right-4 p-1 rounded-full text-white transition"
            >
                x
            </button>
            <div className="flex items-center gap-5 border-b border-white/10 pb-4">
                <div
                    onClick={()=>{ setShowEnlargedPhoto(true); }}
                >
                    <ProfilePicture
                        gender={attendanceCard?.gender}
                        ProfilePictureLink={attendanceCard?.photo_url}
                        width='30'
                        height='30'
                    />
                    {
                        showEnlargedPhoto &&
                        <EnlargedPhoto 
                            photoUrl={attendanceCard?.photo_url} 
                            onClose={() => {
                                setTimeout(() => setShowEnlargedPhoto(false), 0);
                            }}

                        />
                    }
                </div>
                <div>
                    <h2 className="text-2xl font-semibold text-[var(--color-primary)]">
                        {attendanceCard?.name || 'Unknown'}
                    </h2>
                    <div
                        className={`inline-flex mb-4 items-center gap-2 px-3 py-1 mt-2 rounded-full text-sm font-medium ${statusColors[attendanceCard?.current_status] || 'bg-gray-500/20 text-gray-500'}`}
                    >
                        <span
                        className={`h-2 w-2 rounded-full ${
                            attendanceCard?.current_status === 'Active'
                            ? 'bg-green-400'
                            : attendanceCard?.current_status === 'Cancelled'
                            ? 'bg-red-400'
                            : 'bg-yellow-400'
                        }`}
                        />
                        {attendanceCard?.current_status}
                    </div>
                </div>
            </div>  
            <div className='px-10'>
                <Info label="Admission Date" value={formatDate(attendanceCard?.admission_date)} />
                {
                    attendanceCard && attendanceCard?.membership_history &&
                    <div className="my-2">
                        <h3 className="text-lg font-semibold gap-2 text-[var(--color-primary)]">Membership History</h3>
                        <div className="max-h-48 overflow-y-auto">
                            <table className="w-full table-auto border-collapse">
                                <thead>
                                    <tr>
                                        <th className="border-b border-white/10 px-4 py-2 text-left text-sm">Package Name</th>
                                        <th className="border-b border-white/10 px-4 py-2 text-left text-sm">Receipt Date</th>
                                        <th className="border-b border-white/10 px-4 py-2 text-left text-sm">Start Date</th>
                                        <th className="border-b border-white/10 px-4 py-2 text-left text-sm">End Date</th>
                                        <th className="border-b border-white/10 px-4 py-2 text-left text-sm">Amount Paid</th>
                                        <th className="border-b border-white/10 px-4 py-2 text-left text-sm">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceCard?.membership_history.map((membership) => (
                                        <tr className='text-[11pt]' key={genUUID()}>
                                            <td className="border-b border-white/10 px-4 py-2">{membership.package_name}</td>
                                            <td className="border-b border-white/10 px-4 py-2">{formatDate(membership.receipt_date)}</td>
                                            <td className="border-b border-white/10 px-4 py-2">{formatDate(membership.start_date)}</td>
                                            <td className="border-b border-white/10 px-4 py-2">{formatDate(membership.due_date)}</td>
                                            <td className="border-b border-white/10 px-4 py-2">{formatNumber(membership.amount_paid)}</td>
                                            <td className="border-b border-white/10 px-4 text-red-600 font-bold py-2">{formatNumber(membership.balance)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                }
            </div>
            <div className="mt-6 text-right">
                <button
                    onClick={() => {
                            setSelectedCustomer({... attendanceCard });
                            setSelectedTab('Profile');
                            setAttendanceCard(null);
                        }
                    }
                    
                    className="mr-4 px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-700 text-white rounded-xl shadow"
                    >
                    View Profile
                </button>
                <button
                    onClick={() => {
                        setAttendanceCard(null);
                        setSelectedCustomer(null);
                    }}
                    className="px-4 py-2 text-sm font-medium !bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow"
                    >
                    Close
                </button>
            </div>
        </motion.div>
    </div> : 
    attendanceCard && attendanceCard.type === 'staff' ?
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
        <motion.div 
            className="bg-[var(--background)] justify-between flex flex-col p-4 overflow-y-auto relative md:p-5 rounded-lg shadow-lg h-auto md:w-5xl md:h-[540px] w-screen"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <button
                onClick={() => setAttendanceCard(null)}
                className="absolute items-center justify-center flex bg-red-600 h-5 w-5 top-4 right-4 p-1 rounded-full text-white transition"
            >
                x
            </button>
            <div className="flex items-center gap-5 border-b border-white/10 pb-4">
                <div
                    onClick={()=>{setShowEnlargedPhoto(true)}}
                >
                    {
                        showEnlargedPhoto &&
                        <EnlargedPhoto 
                            photoUrl={profile?.photo_url} 
                            onClose={() => {
                                setTimeout(() => setShowEnlargedPhoto(false), 0);
                            }}

                        />
                    }
                </div>
                <div>
                    <h2 className="text-2xl font-semibold text-[var(--color-primary)]">
                        {attendanceCard?.name || 'Unknown'}
                    </h2>
                    <div
                        className={`inline-flex mb-4 items-center gap-2 px-3 py-1 mt-2 rounded-full text-sm font-medium ${statusColors[attendanceCard?.current_status] || 'bg-gray-500/20 text-gray-500'}`}
                    >
                        <span
                        className={`h-2 w-2 rounded-full ${
                            attendanceCard?.status === 'active'
                            ? 'bg-green-400'
                            : attendanceCard?.status === 'cancelled'
                            ? 'bg-red-400'
                            : 'bg-yellow-400'
                        }`}
                        />
                        {makeFirstLetterUppercase(attendanceCard?.status)}
                    </div>
                </div>
            </div>  
            <div className='px-10'>
                <div className='grid grid-cols-2 gap-5'>
                    <div>
                        <InfoRow label="Staff ID" value={attendanceCard?.serial_number} />
                        <InfoRow label="Staff Type" value={makeFirstLetterUppercase(attendanceCard?.staff_type)} />
                        <InfoRow label="Salary Type" value={makeFirstLetterUppercase(attendanceCard?.salary_type)} />
                        <InfoRow label="Date of Joining" value={attendanceCard.joining_date ?formatDate(attendanceCard.joining_date): '-'} />
                        <InfoRow label="Contact Number" value={attendanceCard?.contact || ""} />
                    </div>
                    <div>
                        <InfoRow label={`Hours Worked (${getCurrentMonthString()})`} value={attendanceCard?.total_hours_worked.toFixed(2) + " hrs" || '0 hrs'} />
                        <InfoRow label="Payable" value={formatNumber(attendanceCard?.calculated_salary.toFixed(2))} />
                    </div>
                </div>
            </div>
            <div className="mt-6 text-right">
                
                <button
                    onClick={() => setAttendanceCard(null)}
                    className="px-4 py-2 text-sm font-medium !bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow"
                    >
                    Close
                </button>
            </div>
        </motion.div>
    </div>:
    null   
  )
}

function getCurrentMonthString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    let  months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[now.getMonth()].slice(0,3)}-${year}`;
}

function EnlargedPhoto({ photoUrl, onClose }) {
    return (
      <div className="fixed  inset-0 bg-black/70 flex items-center justify-center z-40" onClick={onClose}>
        <img src={photoUrl} alt="Enlarged Profile" className="max-w-full max-h-full rounded-lg shadow-lg" />
      </div>
    )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-primary)] font-bold uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 font-medium truncate">{value ?? '—'}</p>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className='flex items-center gap-2'>
      <p className="text-xs text-[var(--color-primary)] font-bold uppercase tracking-wide">{label}:</p>
      <p className="mt-0.5 font-medium truncate">{value ?? '—'}</p>
    </div>
  )
}

function formatNumber(num) {
    if (num === null || num === undefined) return "0/-";
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+"/-" || "0/-";
}
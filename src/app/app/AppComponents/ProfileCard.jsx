'use client'

import { motion } from 'framer-motion';

import { useState } from 'react';
import { formatTime } from '@/app/lib/functions';
import { ProfilePicture } from '../Pages/customers/CustomersUI';
const statusColors = {
    Active: 'bg-green-500/20 text-green-600 dark:text-green-400',
    Cancelled: 'bg-red-500/20 text-red-600 dark:text-red-400',
    Inactive: 'bg-yellow-600/20 font-semibold',
  }

export default function ProfileCard({selectedMember, onClose}) {
    const [showEnlargedPhoto, setShowEnlargedPhoto] = useState(false);
  return (
        selectedMember &&
        (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
                <motion.div 
                    className="bg-[var(--background)] justify-between flex flex-col p-4 overflow-y-auto relative md:p-8 rounded-lg shadow-lg h-auto md:w-5xl md:h-[540px] w-screen"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <button
                        onClick={() => onClose}
                        className="absolute items-center justify-center flex bg-red-600 h-5 w-5 top-4 right-4 p-1 rounded-full text-white transition"
                    >
                        x
                    </button>
                    <div className="flex items-center gap-5 border-b border-white/10 pb-4">
                        <div
                            onClick={()=>{setShowEnlargedPhoto(true)}}
                        >
                            <ProfilePicture
                                gender={selectedMember.gender}
                                selectedMemberPictureLink={selectedMember.photo_url}
                                width='30'
                                height='30'
                            />
                            {
                                showEnlargedPhoto &&
                                <EnlargedPhoto 
                                    photoUrl={selectedMember.photo_url} 
                                    onClose={() => {
                                        setTimeout(() => setShowEnlargedPhoto(false), 0);
                                    }}

                                />
                            }
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-[var(--color-primary)]">
                                {selectedMember.name || 'Unknown'}
                            </h2>
                            <div
                                className={`inline-flex mb-4 items-center gap-2 px-3 py-1 mt-2 rounded-full text-sm font-medium ${statusColors[selectedMember.membership_status] || 'bg-gray-500/20 text-gray-500'}`}
                            >
                                <span
                                className={`h-2 w-2 rounded-full ${
                                    selectedMember.membership_status === 'Active'
                                    ? 'bg-green-400'
                                    : selectedMember.membership_status === 'Cancelled'
                                    ? 'bg-red-400'
                                    : 'bg-yellow-400'
                                }`}
                                />
                                {selectedMember.membership_status}
                            </div>
                        </div>
                    </div>  
                    <div className='px-10'>
                        {/* Body Info */}
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-5 text-sm">
                            
                            <div className='w-full col-span-4'>
                                <Info label="Contact" value={selectedMember.contact} />
                            </div>
                            <Info label="Package" value={selectedMember.package_name} />
                            <div>
                                {
                                    selectedMember.trainer_name?
                                    <>
                                        <p className="text-xs text-[var(--color-primary)] uppercase tracking-wide">{"Trainer"}</p>
                                        <div className='flex gap-2'>
                                            <p className="mt-0.5  truncate">{selectedMember.trainer_name ?? '—'}</p>
                                            <p className={`mt-0.5 truncate ${selectedMember.trainer_status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{`(${selectedMember.trainer_status})`}</p>
                                        </div>
                                    </>: <div></div>
                                }
                            </div>
                            <div></div>
                            <div></div>
                            <Info label="Receipt Date" value={formatTime(selectedMember.receipt_date)} />
                            <Info label="Admission Date" value={formatTime(selectedMember.admission_date)} />
                            <Info label="Due Date" value={formatTime(selectedMember.due_date)} />
                            <Info label="Cancellation Date" value={formatTime(selectedMember.cancellation_date)} />
                            <Info label="Total Amount" value={selectedMember.total_amount} />
                            <Info label="Amount Paid" value={selectedMember.amount_paid} />
                            <div>
                                <p className="text-xs text-[var(--color-primary)] uppercase tracking-wide">{"Balance"}</p>
                                <p className="mt-0.5  truncate font-bold text-red-600">{selectedMember.balance ?? '—'}</p>
                            </div>
                            <Info label="Discount" value={selectedMember.discount} />
                        </div>
                    </div>
                    <div className="mt-6 text-right">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium !bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow"
                            >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        )
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
// show enlarged photo on click
function EnlargedPhoto({ photoUrl, onClose }) {
    return (
      <div className="fixed  inset-0 bg-black/70 flex items-center justify-center z-40" onClick={onClose}>
        <img src={photoUrl} alt="Enlarged selectedMember" className="max-w-full max-h-full rounded-lg shadow-lg" />
      </div>
    )
}
function isBirthDayToday(dob) {
    if (!dob) return false;
    const today = new Date();
    const birthDate = new Date(dob);
    return today.getDate() === birthDate.getDate() && today.getMonth() === birthDate.getMonth() && process.env.NEXT_PUBLIC_PLAYBIRTHDAYSOUND === 'true';
}
function isBalanceDue(balance, last_txn_date) {
    if (balance <= 0) return false;
    const today = new Date();
    const lastTxnDate = new Date(last_txn_date);
    const diffTime = Math.abs(today - lastTxnDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > (process.env.NEXT_PUBLIC_BALANCELOCK ? parseInt(process.env.NEXT_PUBLIC_BALANCELOCK) : 3);
}
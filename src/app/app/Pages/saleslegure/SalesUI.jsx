import React from 'react'
import ProfileCard from '../../AppComponents/ProfileCard';
import InputField from '../../AppComponents/subcomponents/InputField';
import { makeFirstLetterUppercase, payment_methods } from '@/app/lib/functions';
import { Expand, X } from 'lucide-react';
import { formatDate } from '../expenses/ExpensesUI';
import { AnimatePresence, motion } from 'framer-motion';
export default function SalesUI({
  packages,
  trainers,
  branches,
  singleBranch,
  permissions,
  formValues,
  errors,
  onFieldChange,
  selectedMember,
  handleSearch,
  searchFilter,
  financialSummary,
  showDetails,
  modifiedView
}) {
  const props = {
    searchFilter, 
    onFieldChange, 
    financialSummary, 
    showDetails, 
    modifiedView, 
    formValues
  }
  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.8 } }}
        exit={{ opacity: 0 }}
        className='flex flex-col py-5 overflow-y-auto overflow-x-hidden px-10 lg:px-5 bg-(--page-bg)'>
        <ProfileCard selectedMember={selectedMember} onClose={() => {
          onFieldChange('selectedMember', null);
        }} />
        <h1 className='text-2xl w-full font-semibold text-center mb-10'>Sales Legure</h1>  
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2'>
           <InputField
              label= "Start Date"
              type= "date"
              name= "txn_date"
              value= {formValues.txn_date || ''}
              onChange= {(e) => onFieldChange('txn_date', e.target.value)}
              error= {errors.txn_date || ''}
            />
            <InputField
              label= "End Date"
              type= "date"
              name= "due_date"
              value= {formValues.due_date || ''}
              onChange= {(e) => onFieldChange('due_date', e.target.value)}
              error= {errors.due_date || ''}
            />
            <InputField
              label= "Receipt/Payment Type"
              type= "ddm"
              name= "receipt_type"
              value= {formValues.selectedType || ''}
              onChange= {(e) => onFieldChange('selectedType', e.target.value)}
              error= {errors.selectedType || ''}
              ddmValues= {[
                'All',
                'Admission',
                'Renewal',
                'Payment',
                'Refund',
                'OutStanding Balance',
                ...payment_methods
              ].map(typ => ({ label: typ, value: typ.toLowerCase() }))}
              />
            <InputField
              label= "Package"
              type= "ddm"
              name= "package_id"
              value= {formValues.package_id || ''}
              onChange= {(e) => onFieldChange('package_id', e.target.value)}
              error= {errors.package_id || ''}
              ddmValues= {[
                { label: 'All Packages', value: '' },
                ...packages?.map(pkg => ({ label: pkg.name, value: pkg.id }))
              ]}
              />
            <InputField 
                label= "Trainer"
                type="ddm"
                name="trainer_id"
                value={formValues.trainer_id||''}
                onChange={(e) => onFieldChange('trainer_id', e.target.value)}
                error={errors.trainer_id ||''}
                ddmValues={[
                  { label: 'All Trainers', value: '' },
                  ...trainers?.map(trainer => ({ label: trainer.name, value: trainer.id }))
                ]}
              />
            <InputField 
                label= "Branch"
                type="ddm"
                name="branch_id"
                value={formValues.branch_id||''}
                onChange={(e) => onFieldChange('branch_id', e.target.value)}
                error={errors.branch_id ||''}
                ddmValues={
                  [{ label: 'All Branches', value: '' },
                  ...branches?.map(branch => ({ label: branch.name, value: branch.id }))]
                }
              />
        </div>
        <div className='grid grid-cols-1 py-5 md:grid-cols-2 lg:grid-cols-4 gap-2'>
              <button
                className='py-1 px-2 bg-amber-400'
                onClick={() => {
                  onFieldChange('formValues', {});
                  onFieldChange('errors', {});
                  onFieldChange('searchFilter', []);
                }}
              >
                 Clear Form
              </button>
              <button
                className='py-1 px-2 bg-[var(--color-primary)] text-white'
                onClick={handleSearch}
              >
                Search
              </button>
              {
                searchFilter.length > 0 && (
                  <button
                    className=''
                    onClick={() => {
                      onFieldChange('modifiedView', true);
                    }}
                  >
                    <Expand size={18} />
                  </button>
                )
              }
        </div>
        {
          <AnimatePresence mode="sync">
          {modifiedView ? (
            <motion.div
              key="modified"
              className="fixed inset-0 z-50 flex flex-col px-4 bg-[var(--background)] overflow-x-hidden"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <TableView {...props} />
            </motion.div>
          ) : (
            <motion.div
              key="normal"
              initial={{ opacity: 0, scale: 1.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className='overflow-x-hidden'
            >
              <TableView {...props} />
            </motion.div>
          )}
        </AnimatePresence>
        }
    </motion.div>
  )
}
function TableView({
  searchFilter,
  onFieldChange,
  financialSummary,
  showDetails,
  modifiedView,
  formValues
}) {
  return (
    <>
      <div className={`${!modifiedView ? 'hidden' : ''} flex relative w-full justify-center py-4 space-x-4 items-center`}>
          <h2 className="text-2xl font-semibold">Sales Ledger</h2>
          <span className='font-bold mt-1'>{`From ${formatDate(formValues.txn_date)} ${formValues.due_date ? `to ${formatDate(formValues.due_date)}` : ''}`}</span>
          <span className='font-bold mt-1 cursor-pointer'>{!formValues.selectedType? 'All':makeFirstLetterUppercase(formValues.selectedType)}</span>
      </div>
      <motion.div
        initial={false}
        animate={{ height: searchFilter.length > 0 ? "auto" : 0 }}
        style={{ overflow: "hidden" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
          <div
            
            className= {`flex max-h-[250px] overflow-y-auto border ${searchFilter.length !==0 ?'border-slate-400':'border-transparent'}` }
            >
              <table className='w-full table-auto border-collapse border border-slate-400'>
                  <thead className='sticky top-0 left-0 z-20'>
                      <tr className='bg-[var(--color-primary)] text-sm text-white'>
                          <th className='border border-slate-300 px-2 py-1'>GymId</th>
                          <th className='border border-slate-300 px-2 py-1'>Name</th>
                          <th className='border border-slate-300 px-2 py-1'>Txn Type</th>
                          <th className='border border-slate-300 px-2 py-1'>Txn Date</th>
                          <th className='border border-slate-300 px-2 py-1'>Admission</th>
                          <th className='border border-slate-300 px-2 py-1'>Due Date</th>
                          <th className='border border-slate-300 px-2 py-1'>Package</th>
                          {/* <th className='border border-slate-300 px-2 py-1'>Trainer</th> */}
                          <th className='border border-slate-300 px-2 py-1'>Payable</th>
                          <th className='border border-slate-300 px-2 py-1'>Total Paid</th>
                          <th className='border border-slate-300 px-2 py-1'>Txn Amount</th>
                          <th className='border border-slate-300 px-2 py-1'>Balance</th>
                      </tr>
                  </thead>
                  <tbody>
                      {searchFilter.length === 0 ? (
                          <tr>
                              <td colSpan="13" className='text-center border'>No records found.</td>
                          </tr>
                      ) : (
                          searchFilter.map((record, index) => (
                              <tr className='even:bg-[var(--color-primary)]/70 text-[11pt] cursor-pointer' key={index}
                                  onClick={() => {
                                      // dispatch(setUpsertAttendance(false));
                                      // dispatch(setAttendanceID(record.serial_number));
                                      onFieldChange('upsertAttendance', false);
                                      onFieldChange('attendanceID', record.serial_number);
                                    }}
                              >
                                  <td className='border border-slate-300 px-2 py-1'>{record.serial_number}</td>
                                  <td className='border border-slate-300 px-2 py-1'>{record.name}</td>
                                  <td className='border border-slate-300 px-2 py-1'>{makeFirstLetterUppercase(record.txn_type)}</td>
                                  <td className='border border-slate-300 px-2 py-1'>{formatDate(record.txn_date)}</td>
                                  <td className='border border-slate-300 px-2 py-1'>{formatDate(record.admission_date)}</td>
                                  <td className='border border-slate-300 px-2 py-1'>{formatDate(record.due_date)}</td>
                                  <td className='border border-slate-300 px-2 py-1'>{record.package_name}</td>
                                  {/* <td className='border border-slate-300 px-2 py-1'>{record.trainer_name}</td> */}
                                  <td className='border border-slate-300 px-2 py-1'>{record.total_payable_after_discount}/-</td>
                                  <td className='border border-slate-300 px-2 py-1'>{record.total_paid}/-</td>
                                  <td className={`border border-slate-300 ${record.txn_type === 'refund' ? 'text-red-700 font-semibold' : ''} px-2 py-1`}>{record.txn_type === 'refund' ? '-' : ''}{record.amount}/-</td>
                                  <td className='border border-slate-300 px-2 py-1'>{record.balance === null ? '' : `${record.balance}/-`}</td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            exit={{opacity: 0.4}}
            className="mt-5 p-3 border border-slate-300 rounded-lg w-full max-w-md">
            {/* Header with toggle */}
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => {
                onFieldChange('showDetails', !showDetails);
              }}
            >
                <h2 className="text-lg font-semibold mb-2">
                    Financial Summary <span>({searchFilter.length})</span>
                </h2>
                <span className="text-sm text-blue-600">
                  {showDetails ? "Hide ▲" : "Show ▼"}
                </span>
            </div>
            {/* Always-visible items */}
            <p className="flex justify-between">
              Gross Collection: 
              <span className="font-bold">
                {formatNumber(financialSummary.totalAmount.toFixed(2))}/-
              </span>
            </p>
            {financialSummary.refund > 0 && (
              <p className="flex justify-between">
                Refunds:
                <span className="font-bold">
                  {formatNumber(financialSummary.refund?.toFixed(2))}/-
                </span>
              </p>
            )}
            <p className="flex border-dashed border-b my-1"></p>
            <p className="flex justify-between">
              Net Collection: 
              <span className="font-bold">
                {formatNumber(
                  (financialSummary.totalAmount - financialSummary.refund).toFixed(2)
                )}/-
              </span>
            </p>
            {/* Expandable section */}
            {showDetails && (
              <>
                <p className="flex justify-between mt-2">
                  Cash:
                  <span className="font-bold">
                    {formatNumber(financialSummary.cash?.toFixed(2) || 0)}/-
                  </span>
                </p>

                <p className="flex justify-between">
                  Online:
                  <span className="font-bold">
                    {formatNumber(financialSummary.online?.toFixed(2) || 0)}/-
                  </span>
                </p>

                <p className="flex justify-between">
                  Balance:
                  <span className="font-bold">
                    {formatNumber(financialSummary.totalBalance.toFixed(2))}/-
                  </span>
                </p>
              </>
            )}
          </motion.div>
      </motion.div>
      <button
        className={`${!modifiedView ? 'hidden' : ''} absolute top-4 right-4 h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center`}
        onClick={() => onFieldChange('modifiedView', false)}
      >
        <X size={14} />
      </button>
    </>
  )
}
const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

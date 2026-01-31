'use client'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Expand, Eye, EyeIcon, X } from 'lucide-react';
import { setAttendanceID, setUpsertAttendance } from '@/store/profileSlice';
import ProfileCard from '../AppComponents/ProfileCard';
import InputField from '../AppComponents/subcomponents/InputField';
import { formatDate } from './Expenses';
import { makeFirstLetterUppercase, payment_methods } from '@/app/lib/functions';
import { supabase } from '@/app/lib/createClient';
export default function SalesLegure() {
    const gym_id = useSelector(state => state.auth.user.gym_id);
    const branches = useSelector((state) => state.auth.user?.all_branches_json) || [];
    const branch_id = useSelector(state => state.auth.user.branch_id);
    const user = useSelector(state => state.auth.user);
    const RoleBook = useSelector((state) => state.auth.user?.role_manager || {});
    const role = useSelector(state => state.auth.user.role);
    const singleBranch = user?.max_branches === 1;
    const [form, setForm] = useState({})
    const [errors, setErrors] = useState({})
    const [searchFilter, setSearchFilter] = useState([])
    const [packages, setPackages] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [modifiedView, setModifiedView] = useState(false);
    const dispatch = useDispatch();
    const [financialSummary, setFinancialSummary] = useState({
        totalAmount: 0,
        totalBalance: 0
    });
    const [showDetails, setShowDetails] = useState(false);
;
    const handleSearch = async()=>{
          let query = supabase
            .from('transactions_view')
            .select('*')
            .eq('gym_id', gym_id)
            .gte('txn_date', form.txn_date || '1970-01-01')
            .lte('txn_date', form.due_date || '2100-12-31');
          console.log(form.package_id)
          if (form.package_id) {
            query = query.eq('package_id', form.package_id);
          }
          if (form.trainer_id) {
            query = query.eq('trainer_id', form.trainer_id);
          }
          if(singleBranch){
            query = query.eq('branch_id', branch_id);
          }else if(RoleBook[user.role].canManageBranches){
            if (form.branch_id) {
              query = query.eq('branch_id', form.branch_id);
            }
          }else{
            query = query.eq('branch_id', branch_id);
          }
          if (form.selectedType) {
            const type = form.selectedType.toLowerCase();
            if (type === 'admission' || type === 'renewal' || type === 'payment' || type === 'refund' || type === 'outstanding balance') {
              query = query.eq('txn_type', type);
            } else if (payment_methods.map(pm => pm.toLowerCase()).includes(type)) {
              query = query.eq('payment_method', type);
            }
          }
          const { data, error } = await query;
          console.log({data, error});
         setSearchFilter(data || []);
          // calculate financial summary
          let totalAmount = 0;
          let totalBalance = 0;
          let cash = 0;
          let online = 0;
          let refund = 0;
          (data || []).forEach(record => {
            totalAmount += parseFloat(record.amount) || 0;
            totalBalance += parseFloat(record.accurate_balance) || 0;
            if(record.txn_type.toLowerCase() === 'refund'){
              refund += parseFloat(record.amount) || 0;
            }
            if(payment_methods.map(pm => pm.toLowerCase()).includes(record.payment_method?.toLowerCase())){
              online += parseFloat(record.amount) || 0;
            }
            else{
              cash += parseFloat(record.amount) || 0;
            }
          });
          setFinancialSummary({
            totalAmount,
            totalBalance,
            cash,
            online,
            refund
          });
    }
    const fetchData = async()=>{
        let query = supabase
          .from('packages')
          .select('*')
          .eq('gym_id', gym_id)
          .eq('deleted', false)
        if(form.branch_id && form.branch_id.trim() !== ''){
          query = query.eq('branch_id', form.branch_id);
        }
        const { data, error } = await query;
        setPackages(data || []);

        query = supabase
        .from('staff')
        .select('*')
        .eq('gym_id', gym_id)
        .eq('deleted', false)
        .eq('staff_type', 'trainer');
        if(form.branch_id && form.branch_id.trim() !== ''){
          query = query.eq('branch_id', form.branch_id);
        }
        const { data: staffData, error: staffError } = await query;
        // update trainers in redux
        setTrainers(staffData || []);
    }
    useEffect(()=>{
        fetchData();
    },[form.branch_id])
    useEffect(()=>{
      // escape button event listener to close profile card
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setSearchFilter([]);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      }
    },[])
  return (
    <div className='flex flex-col py-5 overflow-auto px-10 lg:px-5 bg-(--page-bg)'>
        <ProfileCard selectedMember={selectedMember} onClose={() => setSelectedMember(null)} />
        <h1 className='text-2xl w-full font-semibold text-center mb-10'>Sales Legure</h1>  
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2'>
           <InputField
              label= "Start Date"
              type= "date"
              name= "txn_date"
              value= {form.txn_date || ''}
              onChange= {(e) => setForm({...form, txn_date: e.target.value})}
              error= {errors.txn_date || ''}
            />
            <InputField
              label= "End Date"
              type= "date"
              name= "due_date"
              value= {form.due_date || ''}
              onChange= {(e) => setForm({...form, due_date: e.target.value})}
              error= {errors.due_date || ''}
            />
            <InputField
              label= "Receipt/Payment Type"
              type= "ddm"
              name= "receipt_type"
              value= {form.selectedType || ''}
              onChange= {(e) => setForm({...form, selectedType: e.target.value})}
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
              value= {form.package_id || ''}
              onChange= {(e) => setForm({...form, package_id: e.target.value})}
              error= {errors.package_id || ''}
              ddmValues= {[
                { label: 'All Packages', value: '' },
                ...packages.map(pkg => ({ label: pkg.name, value: pkg.id }))
              ]}
              />
            <InputField 
                label= "Trainer"
                type="ddm"
                name="trainer_id"
                value={form.trainer_id||''}
                onChange={(e) => setForm({...form, trainer_id: e.target.value})}
                error={errors.trainer_id ||''}
                ddmValues={[
                  { label: 'All Trainers', value: '' },
                  ...trainers.map(trainer => ({ label: trainer.name, value: trainer.id }))
                ]}
              />
            <InputField 
                label= "Branch"
                type="ddm"
                name="branch_id"
                value={form.branch_id||''}
                onChange={(e) => setForm({...form, branch_id: e.target.value})}
                error={errors.branch_id ||''}
                ddmValues={
                  [{ label: 'All Branches', value: '' },
                  ...branches.map(branch => ({ label: branch.name, value: branch.id }))]
                }
              />
        </div>
        <div className='grid grid-cols-1 py-5 md:grid-cols-2 lg:grid-cols-4 gap-2'>
              <button
                className='py-1 px-2 bg-amber-400'
                onClick={() => {
                  setForm({});
                  setSearchFilter([]);
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
                    onClick={() => setModifiedView(true)}
                  >
                    <Expand size={18} />
                  </button>
                )
              }
        </div>
        <div className='flex max-h-[250px] overflow-y-auto border border-slate-400'>
          <table className='w-full table-auto border-collapse border border-slate-400'>
              <thead className='sticky top-0 left-0 z-20'>
                  <tr className='bg-[var(--color-primary)] text-white'>
                      <th className='border border-slate-300 px-2 py-1'>GymId</th>
                      <th className='border border-slate-300 px-2 py-1'>Name</th>
                      <th className='border border-slate-300 px-2 py-1'>Txn Type</th>
                      <th className='border border-slate-300 px-2 py-1'>Txn Date</th>
                      <th className='border border-slate-300 px-2 py-1'>Admission</th>
                      <th className='border border-slate-300 px-2 py-1'>Due Date</th>
                      <th className='border border-slate-300 px-2 py-1'>Package</th>
                      <th className='border border-slate-300 px-2 py-1'>Trainer</th>
                      <th className='border border-slate-300 px-2 py-1'>Payable</th>
                      <th className='border border-slate-300 px-2 py-1'>Paid</th>
                      <th className='border border-slate-300 px-2 py-1'>Balance</th>
                  </tr>
              </thead>
              <tbody>
                  {searchFilter.length === 0 ? (
                      <tr>
                          <td colSpan="11" className='text-center border'>No records found.</td>
                      </tr>
                  ) : (
                      searchFilter.map((record, index) => (
                          <tr className='even:bg-[var(--color-primary)]/70 cursor-pointer' key={index}
                               onClick={() => {
                                                      dispatch(setUpsertAttendance(false));
                                                      dispatch(setAttendanceID(record.serial_number));
                                                    }}
                          >
                              <td className='border border-slate-300 px-2 py-1'>{record.serial_number}</td>
                              <td className='border border-slate-300 px-2 py-1'>{record.name}</td>
                              <td className='border border-slate-300 px-2 py-1'>{makeFirstLetterUppercase(record.txn_type)}</td>
                              <td className='border border-slate-300 px-2 py-1'>{formatDate(record.txn_date)}</td>
                              <td className='border border-slate-300 px-2 py-1'>{formatDate(record.admission_date)}</td>
                              <td className='border border-slate-300 px-2 py-1'>{formatDate(record.due_date)}</td>
                              <td className='border border-slate-300 px-2 py-1'>{record.package_name}</td>
                              <td className='border border-slate-300 px-2 py-1'>{record.trainer_name}</td>
                              <td className='border border-slate-300 px-2 py-1'>{record.total_payable_after_discount}</td>
                              <td className='border border-slate-300 px-2 py-1'>{record.amount}</td>
                              <td className='border border-slate-300 px-2 py-1'>{record.is_last_transaction? record.accurate_balance : ''}</td>
                          </tr>
                      ))
                  )}
              </tbody>
          </table>
        </div>
        
        {searchFilter.length > 0 && (
        <div className="mt-5 p-3 border border-slate-300 rounded-lg w-full max-w-md">

            {/* Header with toggle */}
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setShowDetails(!showDetails)}
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

            </div>
          )}

              {
                modifiedView && (
                  <motion.div 
                    className="fixed inset-0 bg-[var(--background)] z-50 flex justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Modal */}
                    <div className="relative flex flex-col text-center bg-[var(--background)] py-2 rounded-lg shadow-lg w-[95vw] overflow-auto">
                      
                      <div className='flex relative w-full justify-center py-4 space-x-4 items-center'>
                        <h2 className="text-2xl font-semibold">Sales Ledger</h2>
                        <span className='font-bold mt-1'>{`From ${formatDate(form.txn_date)} ${form.due_date ? `to ${formatDate(form.due_date)}` : ''}`}</span>
                        <span className='font-bold mt-1 cursor-pointer'>{!form.selectedType? 'All':makeFirstLetterUppercase(form.selectedType)}</span>
                      </div>

                      {/* Table Container */}
                      <div className="w-full max-h-[400px] border border-slate-300 overflow-y-auto overflow-x-auto rounded">
                        <table className="w-full min-w-max border-collapse">
                          <thead className="sticky top-0 z-20">
                            <tr className="bg-[var(--color-primary)] text-white">
                              <th className="border px-2 py-1">GymId</th>
                              <th className="border px-2 py-1">Name</th>
                              <th className="border px-2 py-1">Txn Type</th>
                              <th className="border px-2 py-1">Txn Date</th>
                              <th className='border border-slate-300 px-2 py-1'>Payment Method</th>
                              <th className="border px-2 py-1">Admission</th>
                              <th className="border px-2 py-1">Due Date</th>
                              <th className="border px-2 py-1">Package</th>
                              <th className="border px-2 py-1">Trainer</th>
                              <th className='border px-2 py-1'>Payable</th>
                              <th className="border px-2 py-1">Paid</th>
                              <th className="border px-2 py-1">Balance</th>
                            </tr>
                          </thead>

                          <tbody>
                            {searchFilter.length === 0 ? (
                              <tr>
                                <td colSpan="11" className="text-center border px-2 py-1">
                                  No records found.
                                </td>
                              </tr>
                            ) : (
                              searchFilter.map((record, index) => (
                                <tr
                                  key={index}
                                  className="even:bg-[var(--color-primary)]/20 cursor-pointer"
                                  onClick={() => setSelectedMember(record)}
                                >
                                  <td className="px-2 py-1">{record.serial_number}</td>
                                  <td className="px-2 py-1">{record.name}</td>
                                  <td className="px-2 py-1">{makeFirstLetterUppercase(record.txn_type)}</td>
                                  <td className="px-2 py-1">{formatDate(record.txn_date)}</td>
                                  <td className="px-2 py-1">{makeFirstLetterUppercase(record.payment_method)}</td>
                                  <td className="px-2 py-1">{formatDate(record.admission_date)}</td>
                                  <td className="px-2 py-1">{formatDate(record.due_date)}</td>
                                  <td className="px-2 py-1">{record.package_name}</td>
                                  <td className="px-2 py-1">{record.trainer_name}</td>
                                  <td className="px-2 py-1">{record.total_payable_after_discount}</td>
                                  <td className="px-2 py-1">{record.amount}</td>
                                  <td className='px-2 py-1'>{record.is_last_transaction? record.accurate_balance : ''}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Financial Summary */}
                      {searchFilter.length > 0 && (
                          <div className="mt-5 p-3 border border-slate-300 rounded-lg w-full max-w-md">

                              {/* Header with toggle */}
                              <div 
                                className="flex justify-between items-center cursor-pointer"
                                onClick={() => setShowDetails(!showDetails)}
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

                              </div>
                            )}

                      {/* Close Button */}
                      <button
                        className="absolute top-4 left-4 h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center"
                        onClick={() => setModifiedView(false)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>

                )
              }
          </div>
        )
}

const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
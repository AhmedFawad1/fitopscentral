'use client'
import React from "react";
import InputField from "../../AppComponents/subcomponents/InputField";
import CheckBox from "../../AppComponents/subcomponents/CheckBox";
import { motion } from "framer-motion";
import { payment_methods } from "@/app/lib/functions";

export default function ExpensesUI({
  user,
  formValues,
  errors,
  expenses,
  branches,
  permissions,
  singleBranch,
  onFieldChange,
  onExpenseSelect,
  onSubmit,
  onSearch,
  onDelete,
  showOverlay,
  setShowOverlay
}) {
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  return (
    <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, transition: { duration: 0.8 } }}
    exit={{ opacity: 0 }}
    className='h-screen p-8 overflow-y-auto'>
        <h1 className='text-2xl font-bold mb-4 text-center'>Expenses Management</h1>
        <div className='grid md:grid-cols-3 gap-5 p-5'>
            <InputField
                label= 'Start Date'
                type='date'
                value={formValues.startDate}
                onChange={(e) => onFieldChange('startDate', e.target.value)}
                error={errors.startDate}
            />
            <InputField
                label= 'End Date'   
                type='date'
                value={formValues.endDate}
                onChange={(e) => onFieldChange('endDate', e.target.value)}
            />
            {
                !singleBranch && permissions?.canManageBranches &&
                <InputField
                    label='Branch'
                    type='ddm'
                    value={formValues.branch_id || ''}
                    ddmValues={
                        [    {label: 'Select Branch', value: ''},
                            ...branches.map(branch=>({label: branch.name, value: branch.id}))
                        ]}
                    onChange={(e) => onFieldChange('branch_id', e.target.value)}
                    error={errors.branch}
                    placeholder='Select Branch'
                />
            }
        </div>
        <div className='flex space-x-5 px-8'>
            <button className='bg-green-400 px-3 py-1 rounded-md'
                    onClick={()=>{
                        setShowOverlay(true)
                        onFieldChange('clearForm', '');
                    }}
            >
                + Add Expense
            </button>
              <button className='bg-[var(--logo-primary)] text-white px-3 py-1 rounded-md'
                onClick={async()=>{
                    onSearch();
                }}
              >
                Search
            </button>
            {
                <button className='bg-gray-500 text-white px-3 py-1 rounded-md'
                    onClick={async()=>{
                        onFieldChange('clearForm', '');
                    }}
                >
                    Clear Filters
                </button>
            }
        </div>
        <div className='my-5'>
          {
              safeExpenses.length > 0 ? (
                  <table className='w-full max-h-400 table-auto border-collapse border border-slate-400'>
                      <thead className='sticky top-0  bg-[var(--logo-primary)] overflow-hidden'>
                          <tr>
                              {user.branch_id ? null : <th className='border border-slate-300 px-2 py-1'>Branch</th>}
                              <th className='border border-slate-300 px-2 py-1'>Name</th>
                              <th className='border border-slate-300 px-2 py-1'>Category</th>
                              <th className='border border-slate-300 px-2 py-1'>Amount</th>
                              <th className='border border-slate-300 px-2 py-1'>Payment Mode</th>
                              <th className='border border-slate-300 px-2 py-1'>Date</th> 
                          </tr>
                      </thead>
                      <tbody>
                          {safeExpenses.map((expense) => (
                              <tr key={expense.id} className='cursor-pointer'
                                  onClick={()=>{
                                      console.log("Expense clicked: ", expense);
                                      onExpenseSelect({target: {value: expense.id}});
                                      setShowOverlay(true);
                                  }}
                              >
                                  {user.branch_id ? null : <td className='border border-slate-300 px-2 py-1'>{branches.find(b => b.id === expense.branch_id)?.name || 'N/A'}</td>}
                                  <td className='border border-slate-300 px-2 py-1'>{expense.name}</td>
                                  <td className='border border-slate-300 px-2 py-1'>{expense.category}</td>
                                  <td className='border border-slate-300 px-2 py-1'>{expense.amount}</td>
                                  <td className='border border-slate-300 px-2 py-1'>{expense.payment_method}</td>   
                                  <td className='border border-slate-300 px-2 py-1'>{formatDate(expense.txn_date)}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              ) : (
                  <p>No expenses found for the selected date range.</p>
              )
          }
          {   expenses.length >= 0 &&
            <div className='text-center mt-4'>
                <span className='font-bold'>Total Expenses: </span>
                  <span className='text-red-600 font-bold'>
                      {
                        getTotalExpenses(expenses)
                      }
                  </span>
              </div>
          }
        </div>
        {showOverlay && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <motion.div 
                    className="bg-[var(--background)] flex gap-3 flex-col justify-between md:overflow-y-hidden p-4 overflow-y-auto relative w-screen md:w-1/2 h-auto rounded-md"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <h1 className='font-bold text-xl my-5 text-center'>{`${formValues.id ? 'Edit' : 'Add'} Expenses`}</h1>
                     {
                        permissions?.canManageBranches && !singleBranch &&
                        <InputField
                            label= 'Select Branch'
                            type='ddm'
                            ddmValues={
                                [   {label: 'Select Branch', value: ''},
                                    ...branches?.map((branch) => ({ label: branch.name, value: branch.id }))
                                ]
                            }
                            value={formValues.branch_id}
                            onChange={(e) => onFieldChange('branch_id', e.target.value)}
                            error={errors.branch_id}
                        />
                    }
                    <div className='grid grid-cols-2 gap-2'>
                        <InputField
                            label='Expense Name'
                            type='text'
                            value={formValues.name || ''}
                            onChange={(e) => onFieldChange('name', e.target.value)}
                            error={errors.name}
                        />
                        <InputField
                            label='Expense Category'
                            type='ddm'
                            value={formValues.category}
                            ddmValues={
                                [   { label: 'Maintenance', value: 'maintenance' },
                                    {label: 'Travel', value: 'travel'},
                                    {label: 'Food', value: 'food'},
                                    {label: 'Office Supplies', value: 'office_supplies'},
                                    {label: 'Entertainment', value: 'entertainment'},
                                    {label: 'Utilities', value: 'utilities'},
                                    {label: 'Other', value: 'other'},
                                ]
                            }
                            onChange={(e) => onFieldChange('category', e.target.value)}
                            error={errors.category}
                        />
                        <InputField
                            label='Payment Method'
                            type='ddm'
                            value={formValues.payment_method}
                            ddmValues={
                                payment_methods.map((method) => ({ label: method, value: method.toLowerCase() }))
                            }
                            onChange={(e) => onFieldChange('payment_method', e.target.value)}
                            error={errors.payment_method}
                        />
                        <InputField
                            label= 'Paid To'
                            type='text'
                            value={formValues.paid_to || ''}
                            onChange={(e) => onFieldChange('paid_to', e.target.value)}
                            error={errors.paid_to}
                        />
                        <InputField
                            label='Amount'
                            type='text'
                            value={formValues.amount || ''}
                            onChange={(e) => {
                                //filter to allow only numbers and decimal point
                                const value = e.target.value;
                                if (/^\d*\.?\d*$/.test(value)) {
                                    onFieldChange('amount', value);
                                }
                            }}
                            error={errors.amount}
                        />
                        <InputField
                            label='Date'
                            type='date'
                            value={formValues.txn_date}
                            onChange={(e) => onFieldChange('txn_date', e.target.value)}
                            error={errors.txn_date}
                        />
                        <div className='flex mt-4 ml-3 items-center'>
                            <CheckBox
                                label='Is Recurring Expense'
                                checked={formValues.is_recurring || false}
                                onChange={(e) => onFieldChange('is_recurring', e.target.checked)}
                            />
                        </div>
                        {
                            // rectifyBoolean(formValues.is_recurring) &&
                            // <div>
                            //     <InputField 
                            //         label='Recurrence Interval (in days)'
                            //         type='text'
                            //         value={formValues.recurrence_interval || ''}
                            //         onChange={(e) => onFieldChange('recurrence_interval', e.target.value)}
                            //         error={errors.recurrence_interval}
                            //     />
                            // </div>
                        }
                    </div>
                    
                        <InputField 
                            label='Description'
                            type='textarea'
                            value={formValues.description}
                            onChange={(e) => onFieldChange('description', e.target.value)}
                        />
                    
                    <div className='flex space-x-5 mt-4'>
                        {
                            formValues.id &&
                            <button
                                className='bg-red-500 px-3 py-1 rounded-md'
                                onClick={async()=>{ onDelete(); }}
                            >
                                Delete Expense
                            </button>
                        }
                            
                        <button
                            className='bg-green-400 px-3 py-1 rounded-md'
                            onClick={async() => { onSubmit(); }}
                        >
                            Save Expense
                        </button>
                    </div>
                    <button
                        className="absolute bg-red-500 w-6 h-6 text-xs rounded-full top-4 right-4"
                        onClick={() => setShowOverlay(false)}
                    >
                        &#10005;
                    </button>
                </motion.div>
            </div>)
        }
    </motion.div>
  );
}
export const formatDate = (date)=>{
    // expect date in dd-Nov-yyyy
    // test date first
    if(!date) return '';
    let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let d = new Date(date);
    let day = String(d.getDate()).padStart(2, '0');
    let month = months[d.getMonth()];
    let year = d.getFullYear();
    return `${day}-${month}-${year}`;
}
export const getTotalExpenses = (expenses)=>{
    let total = 0;
    expenses.forEach(expense=>{
        total += parseFloat(expense.amount) || 0;
    }
    );
    return `${total.toFixed(2)}/-`;
}
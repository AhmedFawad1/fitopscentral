'use client';
import React, { useEffect } from 'react'
import InputField from '../../AppComponents/subcomponents/InputField';
import ContactInput from '../../AppComponents/subcomponents/ContactInput';
import { motion } from 'framer-motion';
export default function StaffUI({
  formValues,
  errors,
  staff,
  branches,
  permissions,
  singleBranch,
  onFieldChange,
  onStaffSelect,
  onSubmit,
  onDelete
}) {
  useEffect(() => {
    console.log(staff)
  }, [staff])
  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.8 } }}
        exit={{ opacity: 0 }}
        className='h-screen p-8 overflow-y-auto'>
        <h1 className='text-2xl font-bold mb-2 text-center'>Staff Management</h1>
        <div className='my-2'>
        {
            permissions?.canManageBranches &&!singleBranch &&
            <InputField
                label='Branch'
                type='ddm'
                value={formValues.branch_id || ''}
                ddmValues={branches.map(branch=>({label: branch.name, value: branch.id}))}
                onChange={(e) => {
                    onFieldChange('branch_id', e.target.value);
                }}
                error={errors.branch}
                placeholder='Select Branch'
            />
        }
        </div>
        <InputField
                label='Staff Members'
                type='ddm'
                ddmValues={[
                    { label: 'Select Staff Member', value: '' },
                    ...staff?.map(stf => ({ label: stf.name, value: stf.id }))
                ]}
                value={formValues.selectedStaff || ''}
                onChange={(e) => {
                    onFieldChange('selectedStaff', e.target.value);
                }}
                placeholder='Select Staff Member'
                customClass='mb-0'
                error={errors.selectedStaff}
            />

        <h1 className='text-xl font-semibold mt-3'>Staff Details</h1>
        
        <div className='mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                <InputField
                    label='ID'
                      type='text'
                    value={formValues.serial_number || 1 }
                    onChange={(e) => onFieldChange('serial_number', e.target.value)}
                    error={errors.serial_number}
                    placeholder='Staff ID'
                />
                <InputField
                    label='Name'
                    type='text'
                    value={formValues.name || ''}
                    onChange={(e) => onFieldChange('name', e.target.value)}
                    error={errors.name}
                    placeholder='Staff Name'
                />
                <InputField
                    label='nic#'
                    type='text'
                    value={formValues.nic || ''}
                    onChange={(e) => onFieldChange('nic', e.target.value)}
                    error={errors.nic}
                    placeholder='nic#'
                />
                <ContactInput
                    label='Contact'
                    type='contact'
                    value={formValues.contact?.replace('+92', '') || ''}
                    onChange={(e) => onFieldChange('contact', e.target.value)}
                    error={errors.contact}
                    placeholder='Staff Contact'
                />
                <InputField
                    label='Email'
                    type='email'
                    value={formValues.email || ''}
                    onChange={(e) => onFieldChange('email', e.target.value)}
                    error={errors.email}
                    placeholder='Staff Email'
                />
                <InputField
                    label='Address'
                    type='text'
                    value={formValues.address || ''}
                    onChange={(e) => onFieldChange('address', e.target.value)}
                    error={errors.address}
                    placeholder='Staff Address'
                />
        </div>   
        <h1 className='text-xl font-semibold mt-4 mb-2'>Job Details</h1>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
                <InputField
                    label='Staff Type'
                    type='ddm'
                    ddmValues={[
                        { label: 'Trainer', value: 'trainer' },
                        { label: 'Receptionist', value: 'receptionist' },
                        { label: 'Manager', value: 'manager' },
                        { label: 'Cleaner', value: 'cleaner' }
                    ]}
                    value={formValues.staff_type || ''}
                    onChange={(e) => onFieldChange('staff_type', e.target.value)}
                    error={errors.type}
                    placeholder='Select Staff Type'
                />
                <InputField
                    label='Salary Type'
                    type='ddm'
                    ddmValues={[
                        { label: 'Select an Option', value: '' },
                        { label: 'Hourly', value: 'hourly' },
                        { label: 'Fixed (Monthly)', value: 'fixed' }
                    ]}
                    value={formValues.salary_type || ''}
                    onChange={(e) => onFieldChange('salary_type', e.target.value)}
                    error={errors.salary_type}
                    placeholder='Select Salary Type'
                />
                {
                formValues.salary_type === 'fixed'?
                <InputField
                    label='Salary'
                    type='Number'
                    value={formValues.base_salary || ''}
                    onChange={(e) => onFieldChange('base_salary', e.target.value)}
                    error={errors.base_salary}
                    placeholder='Enter Salary'
                />:
                <InputField
                    label='Hourly Rate'
                    type='Number'
                    value={formValues.hourly_rate || ''}
                    onChange={(e) => onFieldChange('hourly_rate', e.target.value)}
                    error={errors.hourly_rate}
                    placeholder='Enter Hourly Rate'
                />
                }
                <InputField
                    label='Work Start Time'
                    type='time'
                    value={formValues.work_start_time || ''}
                    onChange={(e) => onFieldChange('work_start_time', e.target.value)}
                    error={errors.work_start_time}
                />
                <InputField
                    label='Work End Time'
                    type='time'
                    value={formValues.work_end_time || ''}
                    onChange={(e) => onFieldChange('work_end_time', e.target.value)}
                    error={errors.work_end_time}
                />
                {
                  formValues.staff_type === 'trainer' && (
                    <>
                    <InputField
                        label='Commission Percentage'
                        type='text'
                        value={formValues.commission_percent || ''}
                        onChange={(e) => onFieldChange('commission_percent', e.target.value)}
                        error={errors.commission_percent}
                    />
                    <InputField
                        label='Trainer Fee'
                        type='Number'
                        value={formValues.fee || ''}
                        onChange={(e) => onFieldChange('fee', e.target.value)}
                        error={errors.fee}
                    />
                    </>)
                }
        </div>
        <button className='px-4 py-2 bg-red-600 text-white rounded-md mr-4'
            onClick={async ()=>{
                // Handle staff deletion logic here
                onDelete();
            }}
        >
            Delete 
        </button>
        {
           (formValues.selectedStaff || Object.keys(errors).length > 0) &&
           <button name="clear selection" className="px-4 py-2 bg-gray-600 text-white mr-4" onClick={() => onFieldChange('selectedStaff', null)}
              type="button"
                aria-label="Clear Selection"
            >
              Clear Selection
            </button>
        }
        <button className='px-4 py-2 bg-blue-600 text-white rounded-md'
            aria-label='submit staff'
            onClick={async ()=>{
                onSubmit();
            }}
        >
            {formValues.selectedStaff ? 'Update Staff' : 'Add Staff'}
        </button>
    </motion.div>
  )
}

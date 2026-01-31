'use client';
import React, { useEffect } from 'react'
import InputField from '../../AppComponents/subcomponents/InputField';
import ContactInput from '../../AppComponents/subcomponents/ContactInput';
import { motion } from 'framer-motion';

export default function UserUI({
  formValues,
  errors,
  user,
  users,
  branches,
  permissions,
  singleBranch,
  onFieldChange,
  onUserSelect,
  onSubmit,
  onDelete,
  onAddBranch,
  onDeleteBranch,
  showBranchOverlay,
  setShowBranchOverlay
}) {

  return (
    <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.8 } }}
            exit={{ opacity: 0 }}
            className='h-screen p-8 overflow-y-auto'>
        <h1 className='text-2xl font-bold mb-4 text-center'>Users Management</h1>
        <InputField
            label='Select User'
            type='ddm'
            value={formValues.selectedUser}
            ddmValues={
                [{ label: 'Select User', value: '' },
                ...users?.map((user) => ({ label: user.email, value: user.id }))
                ]
            }
            placeholder='Select Users'
            onChange={(e) => {
                const selectedUser = users.find(u => u.id === e.target.value);
                onFieldChange('selectedUser', selectedUser ? selectedUser.id : null);
            }}
        />
        <div  className='grid md:grid-cols-2 gap-3 my-3'>
            <InputField
                label='Full Name'
                type='text'
                value={formValues.full_name}
                placeholder='Full Name'
                onChange={(e) => onFieldChange('full_name', e.target.value)}
                error={errors.name}
            />
            <InputField
                label='Email'
                type='text'
                value={formValues.email}
                placeholder='Email'
                onChange={(e) => onFieldChange('email', e.target.value)}
                error={errors.email}
                disabled={formValues.id ? true : false}
            />
            <InputField
                label='Password'
                type='text'
                value={formValues.password}
                placeholder='Password'
                onChange={(e) => onFieldChange('password', e.target.value)}
                error={errors.password}
            />
            <InputField
                label='User Role'
                type='ddm'
                value={formValues.role}
                ddmValues={
                    user?.role === 'owner'?
                    [
                        {label: 'Owner', value: 'owner'},
                        {label: 'Gym Manager', value: 'gym manager'},
                        {label: 'Branch Manager', value: 'branch manager'},
                        {label: 'Receptionist', value: 'receptionist'},
                    ]:
                    user?.role === 'gym manager' ?
                    [
                        {label: 'Receptionist', value: 'receptionist'},
                    ] :
                    []
                }
                onChange={(e) => onFieldChange('role', e.target.value)}
                error={errors.role}
            />
            <div className='flex w-full gap-3 items-center'>
                <InputField
                    label='Select Branch'
                    type='ddm'
                    value={formValues.branch_id}
                    placeholder='Select Branch'
                    customClass='w-full'
                    ddmValues={
                        [
                            { label: 'Select Branch', value: '' },
                            ...user.all_branches_json?.map((branch) => ({ label: branch.name, value: branch.id }))
                        ]
                    }
                    onChange={(e) => {
                        onFieldChange('branch_id', e.target.value)
                    }}
                    error={errors.selectedBranch}
                />
                <button
                    className='mt-4 h-6 w-6 rounded-full text-white bg-green-500 transition duration-300'
                    onClick={()=>{
                        setShowBranchOverlay(true);
                    }}
                >
                    +
                </button>
            </div>
        </div>
        {
           (formValues.selectedUser || Object.keys(errors).length > 0) &&
           <button name="clear selection" className="px-4 py-2 bg-gray-600 text-white mr-4" onClick={() => onFieldChange('selectedUser', null)}
              type="button"
                aria-label="Clear Selection"
            >
              Clear Selection
            </button>
        }
        {
              formValues.selectedUser &&
              user.id !== formValues.selectedUser &&
              user.role === 'owner' &&
              <button className='px-4 py-2 bg-red-600 text-white rounded-md mr-4'
                    onClick={async ()=>{
                        // Handle staff deletion logic here
                        onDelete();
                    }}
                >
                    Delete 
                </button>
        }
        {showBranchOverlay && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <motion.div 
                    className="bg-[var(--background)] flex gap-3 flex-col justify-between md:overflow-y-hidden p-4 overflow-y-auto relative w-screen md:w-1/2 h-auto rounded-md"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <h2 className='text-xl font-bold mb-4'>Add / Edit Branch</h2>
                    <InputField
                        label='Select Branch'
                        type='ddm'
                        value={formValues.selectedBranch}
                        ddmValues={
                            [   { label: 'Select Branch', value: '' },
                                ...branches?.map((branch) => ({ label: branch.name, value: branch.id }))
                            ]
                        }
                        error={errors.selectedBranch || ''}
                        placeholder='Select Branch'
                        onChange={(e) => {
                            const selectedBranch = branches?.find(b => b.id === e.target.value);
                            if(!selectedBranch){
                                setFormData({});
                                return;
                            };
                            onFieldChange('selectedBranch', selectedBranch.id);
                        }}
                    />
                    <div className='grid md:grid-cols-2 gap-3 my-3'>
                        <InputField
                            label='Branch Code'
                            type='text'
                            value={formValues.code}
                            placeholder='Branch Code'
                            onChange={(e) => onFieldChange('code', e.target.value)}
                            error={errors.code || ''}
                        />
                        <InputField
                            label='Branch Name'
                            type='text'
                            value={formValues.name}
                            placeholder='Branch Name'
                            onChange={(e) => onFieldChange('name', e.target.value)}
                            error={errors.name || ''}
                        />
                        <InputField
                            label='Branch Address'
                            type='text'
                            value={formValues.address}
                            placeholder='Branch Address'
                            onChange={(e) => onFieldChange('address', e.target.value)}
                            error={errors.address || ''}
                        />
                    </div>
                    <button
                        className="absolute text-white bg-red-500 w-6 h-6 text-xs rounded-full top-4 right-4"
                        onClick={() => setShowBranchOverlay(false)}
                    >
                        &#10005;
                    </button>
                    <div className='flex justify-end mt-4'>
                        {
                            formValues.id && branches.length > 1 && (
                                <button
                                    className='bg-red-500 text-white px-4 py-2 rounded-md mr-4'
                                    onClick={() => {
                                        // Handle delete branch
                                        onDeleteBranch()
                                    }}>
                                    Delete Branch
                                </button>
                            )
                        }
                        <button
                            className='bg-blue-500 text-white px-4 py-2 rounded-md mr-4'
                            onClick={async() => {
                                onAddBranch();
                            }}
                        >
                            {formValues.id ? 'Update Branch' : 'Add Branch'}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
        <button className='px-4 py-2 bg-blue-600 text-white rounded-md'
            aria-label='submit user'
            onClick={async ()=>{
                onSubmit();
            }}
        >
            {formValues.selectedUser ? 'Update User' : 'Add User'}
        </button>
    </motion.div>
  )
}

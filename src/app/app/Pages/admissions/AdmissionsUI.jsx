import React from 'react'
import InputField from '../../AppComponents/subcomponents/InputField';
import { payment_methods } from '@/app/lib/functions';
import { PictureUpload } from '../../AppComponents/subcomponents/PictureUpload';
import ContactInput from '../../AppComponents/subcomponents/ContactInput';
import CheckBox from '../../AppComponents/subcomponents/CheckBox';
import { Minus, Plus } from 'lucide-react';
import { GenderToggle } from '../Receipts/ReceiptUI';
import { motion } from 'framer-motion';
export default function AdmissionsUI({
    user,
    packages,
    trainers,
    formValues,
    errors,
    expenses,
    branches,
    permissions,
    singleBranch,
    onFieldChange,
    onPackageSelect,
    onTrainerSelect,
    onSubmit,
    isTauri
}
) {
  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.8 } }}
        exit={{ opacity: 0 }}
        className='flex flex-col py-5 overflow-auto px-10 lg:px-5 bg-(--page-bg)'>
            <h1 className='text-2xl w-full font-semibold text-center mb-10'>New Admission</h1>  
            
            <Section title='Personal Information' className='flex flex-col space-y-6'>
                
                <div className='mx-40 lg:mx-80'>
                    <PictureUpload
                        gender={formValues.gender}
                        imageUrl={formValues.photo_url || ''}
                        onImageChange={(url) => {
                            console.log(url)
                            onFieldChange('photo_url',url)
                        }}
                        isTauri={isTauri}
                    />
                    
                    <GenderToggle
                        value={formValues.gender}
                        onChange={(value) => onFieldChange('gender', value)}
                        small={true}
                    />
                </div>
                {
                    !singleBranch && permissions?.canManageBranches &&
                     <div className='grid lg:px-20 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        <InputField
                            label='Branch'
                            type='ddm'
                            value={formValues.branch_id || ''}
                            ddmValues={branches.map(branch=>({label: branch.name, value: branch.id}))}
                            onChange={(e) => {
                                onFieldChange('branch_id', e.target.value)
                                setLocalUpdate(true);
                            }}
                            error={errors.branch}
                            placeholder='Select Branch'
                        />
                     </div>
                    }
                <div className={`grid lg:px-20 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${!singleBranch && permissions?.canManageBranches?'':'mt-4'}`}>
                    <InputField 
                        label="Name"
                        value={formValues.name}
                        onChange={(e)=>onFieldChange('name', e.target.value)}
                        error={errors.name}
                        placeholder='Enter Full Name'
                    />
                    <InputField 
                        label="Father's Name"
                        value={formValues.father_name}
                        onChange={(e)=>onFieldChange('father_name', e.target.value)}
                        error={errors.father_name}
                        placeholder="Enter Father's Name"
                    />
                    <ContactInput
                        label="Contact"
                        type='contact'
                        value={formValues.contact}
                        onChange={(e)=>onFieldChange('contact', e.target.value)}
                        error={errors.contact}
                        placeholder="Enter Contact Number"
                        errors={errors}
                        //setError={setErrors}
                    />
                    <InputField 
                        label="Date of Birth"
                        type='date'
                        value={formValues.dob}
                        onChange={(e)=>onFieldChange('dob', e.target.value)}
                        error={errors.dob}
                        placeholder="Enter Date of Birth"
                    />
                    <InputField 
                        label="Address"
                        value={formValues.address}
                        onChange={(e)=>onFieldChange('address', e.target.value)}
                        error={errors.address}
                        placeholder="Enter Address"
                    />
                    <InputField
                        label="Email"
                        value={formValues.email}
                        onChange={(e)=>onFieldChange('email', e.target.value)}
                        error={errors.email}
                        placeholder="Enter Email"
                    />
                </div>
            </Section>
            <Section title='Membership Information' className='flex flex-col space-y-6'>
                <div className='grid grid-cols-1 lg:px-10 md:grid-cols-2 gap-5'>
                    <InputField 
                        label="Gym Id"
                        value={formValues.serial_number || ''}
                        onChange={(e)=>onFieldChange('serial_number', e.target.value)}
                        error={errors.serial_number}
                        placeholder="Enter Gym Id"
                    />
                    <div></div>
                    <InputField 
                        label="Receipt Date"
                        type='date'
                        value={formValues.receipt_date}
                        onChange={(e)=>onFieldChange('receipt_date', e.target.value)}
                        error={errors.receipt_date}
                        placeholder="Select Receipt Date"
                    />
                    <InputField 
                            label="Admission Date"
                            type='date'
                            value={formValues.admission_date}
                            onChange={(e)=>onFieldChange('admission_date', e.target.value)}
                            error={errors.admission_date}
                            placeholder="Select Admission Date"
                        />
                    <InputField 
                        label="Package"
                        type='ddm'
                        value={formValues.package}
                        onChange={(e)=>{
                            onFieldChange('package', e.target.value);
                        }}
                        error={errors.package}
                        placeholder="Select Package"
                        ddmValues={[
                            { label: 'Select Package', value: '' },
                            ...packages?.map(pkg => ({
                                label: pkg.name,
                                value: pkg.name
                            }))]
                        }
                    />
                    <div className={`grid ${formValues.trainer_id ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                        <InputField 
                            label="Trainer"
                            type='ddm'
                            value={formValues.trainer_id}
                            onChange={(e)=>{
                               onFieldChange('trainer_id', e.target.value);
                            }}
                            error={errors.trainer}
                            placeholder="Select Trainer"
                            ddmValues={
                                [   { label: 'Select Trainer', value: '' },
                                    ...trainers.map(trn => ({
                                    label: trn.name,
                                    value: trn.id
                                }))]
                            }
                        />
                        {
                            formValues.trainer_id &&
                            <InputField
                                label="Trainer Fee"
                                type='text'
                                value={formValues.trainer_fee}
                                onChange={(e)=>{
                                    // integer only
                                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                                    e.target.value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                    onFieldChange('trainer_fee', e.target.value);
                                }}
                                error={errors.trainer_fee}
                                placeholder="Enter Trainer Fee"
                            />
                        }
                    </div>
                </div>
                <div className={`grid gap-5 border-t border-t-gray-300 py-4 lg:px-10  grid-cols-1 md:grid-cols-2 lg:grid-cols-${formValues.cancellation_date || formValues.trainer_id ? '3' : '2'}`}>
                    <InputField 
                        label="Membership Start Date"
                        type='date'
                        value={formValues.start_date}
                        onChange={(e)=>onFieldChange('start_date', e.target.value)}
                        error={errors.start_date}
                        placeholder="Select Membership Start Date"
                    />
                    <InputField 
                        label="Membership Due Date"
                        type='date'
                        value={formValues.due_date}
                        onChange={(e)=>onFieldChange('due_date', e.target.value)}
                        error={errors.due_date}
                        placeholder="Select Membership Due Date"
                        disabled={permissions.canChangeDueDates? false : true}
                    />
                    {
                        formValues.cancellation_date &&
                        <InputField 
                            label="Cancellation Date"
                            type='date'
                            value={formValues.cancellation_date}
                            onChange={(e)=>onFieldChange('cancellation_date', e.target.value)}
                            error={errors.cancellation_date}
                            placeholder="Select Cancellation Date"
                            disabled={permissions.canChangeDueDates? false : true}
                        />
                    }
                    {
                        formValues.trainer_id &&
                        <InputField  
                            label="Trainer Start Date"
                            type='date'
                            value={formValues.trainer_assigned_on}
                            onChange={(e)=>onFieldChange('trainer_assigned_on', e.target.value)}
                            error={errors.trainer_assigned_on}
                            placeholder="Select Trainer Date"
                        />
                    }
                </div>
                <div className='flex space-x-60 lg:px-10'>
                    <CheckBox
                        label='Admission Fee'
                        name='admission_fee'
                        checked={formValues.admission_fee || false}
                        onChange={(e)=>onFieldChange('admission_fee', e.target.value)}
                        customClass='my-4 justify-center'
                    />
                    <CheckBox
                        label='Package Fee'
                        name='package_fee'
                        checked={formValues.package_fee || false}
                        onChange={(e)=>{
                            onFieldChange('package_fee', e.target.value)
                        }}
                        customClass='my-4 justify-center'
                    />
                    <CheckBox
                        label='Transaction Date'
                        name='txn_date_today'
                        checked={formValues.txn_date_today || false}
                        onChange={(e)=>onFieldChange('txn_date_today', e.target.value)}
                        customClass='my-4 justify-center'
                        disabled={permissions.canChangeDueDates? false : true}
                    />
                </div>
                <div className='grid gap-4 border-t border-t-gray-300 py-4 lg:px-10 grid-cols-1 md:grid-cols-2'>
                    
                    <InputField
                        label="Membership Amount"
                        type='Number'
                        value={formValues.total_amount}
                        onChange={(e)=>onFieldChange('total_amount', e.target.value)}
                        error={errors.total_amount}
                        placeholder="Enter Membership Amount"
                    />
                    <InputField
                        label="Amount Paid"
                        type='Number'
                        value={formValues.amount_paid}
                        onChange={(e)=>{
                            onFieldChange('amount_paid', e.target.value)
                        }}
                        error={errors.amount_paid}
                        placeholder="Enter Amount Paid"
                    />
                    <InputField
                        label="Discount"
                        type='Number'
                        value={formValues.discount}
                        onChange={(e)=>{
                            onFieldChange('discount', e.target.value)
                        }}
                        error={errors.discount}
                        placeholder="Enter Discount"
                    />
                    <InputField
                        label="Balance"
                        type='Number'
                        value={formValues.balance}
                        onChange={(e)=>onFieldChange('balance', e.target.value)}
                        error={errors.balance}
                        placeholder="Enter Balance"
                        disabled={permissions.canEditAmount? false : true}
                    />
                    <InputField
                        label="Payment Method"
                        value={formValues.payment_method}
                        type='ddm'
                        ddmValues={
                            payment_methods.map(method => ({
                                label: method.charAt(0).toUpperCase() + method.slice(1),
                                value: method.toLowerCase()
                            }))
                        }
                        onChange={(e)=>onFieldChange('payment_method', e.target.value)}
                        error={errors.payment_method}
                        placeholder="Select Payment Method"
                    />
                </div>
            </Section>
            <div className='flex gap-1'>
                <button
                className='bg-gray-400 text-white px-6 py-2 rounded-md w-50 ml-3 self-center my-6'
                onClick={async()=>{
                    onFieldChange('clearForm', '');
                }}
                >
                    Clear Form
                </button>
                <button
                className='bg-(--color-primary) text-white px-6 py-2 rounded-md w-32 self-center my-6'
                onClick={async()=>{onSubmit()}}
                >
                    Submit
                </button>
            </div>
        </motion.div>
  )
}
export function Section({ title = '', children, defaultOpen = false, className = '' }) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  return (
    <div className="w-full mb-4 border border-(--color-border) rounded-lg bg-(--color-card)">
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-(--color-primary)">{isOpen ? <Minus /> : <Plus />}</span>
      </div>
      {isOpen && (
        <div className={`p-4 border-t border-(--color-border) ${className}`}>
          {children}
        </div>
      )}
    </div>
  )
}
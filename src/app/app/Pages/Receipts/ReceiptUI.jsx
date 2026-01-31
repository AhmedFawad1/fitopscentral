'use client';
import React, { useEffect } from 'react'
import InputField from '../../AppComponents/subcomponents/InputField';
import ContactInput from '../../AppComponents/subcomponents/ContactInput';
import { motion } from 'framer-motion';
import { Trash2Icon, X } from 'lucide-react';
import { PictureUpload } from '../../AppComponents/subcomponents/PictureUpload';
import { formatDate, makeFirstLetterUppercase, payment_methods } from '@/app/lib/functions';
import CheckBox from '../../AppComponents/subcomponents/CheckBox';
import { trainerExpiry } from '../admissions/useAdmissionManager';
import BiometricContainer from '../biometric/BiometricContainer';


export default function ReceiptUI({
    addPaymentModal,
    trainerAssignment,
    customer,
    packages,
    trainers,
    user,
    permissions,
    errors,
    fetching,
    onClose,
    selectedTab,
    tabs,
    handleTabChange,
    onFieldChange,
    formValues,
    receipts,
    onSubmitProfile,
    onAddTransaction,
    onDeleteTransaction,
    onFullRefund,
    onAddMembership,
    onDeleteMembership,
    onDeleteProfile,
    onRenewTrainerAssignment,
    onSendMessage,
    templates,
    isTauri,
    allowEscape,
    setAllowEscape
}) {
  if(fetching){
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
                <motion.div 
                    className="bg-[var(--background)] flex flex-col justify-between items-center  p-4 overflow-y-auto relative md:p-8 rounded-lg shadow-lg md:w-5xl w-screen"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                > 
                    <div className="flex flex-col gap-4 h-[450px] items-center justify-center">
                        <div className="h-20 w-20 animate-spin rounded-full border-4 border-gray-300 border-t-[var(--color-primary)]"></div>
                        Loading...
                    </div>
                </motion.div>
            </div>
        )
    }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
        <motion.div 
            className="bg-[var(--background)] overflow-y-hidden flex flex-col  p-4 relative md:p-8 rounded-lg shadow-lg h-screen md:w-5xl md:h-[540px] w-screen"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
        <button
            className={`absolute top-4 right-4 text-gray-500 hover:text-gray-700 ${allowEscape ? '' : '!cursor-not-allowed opacity-50'}`}
            onClick={onClose}
            disabled={allowEscape ? false : true}
        >
            <X size={24} />
        </button>
        <Tabs
            tabs={tabs}
            selectedTab={selectedTab}
            onSelectTab={handleTabChange}
            disabled={allowEscape ? false : true}
        />
        {
            trainerAssignment?
            <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-40'>
                <div className="bg-white relative p-6 rounded-lg shadow-lg w-96">
                    <h2 className="text-lg font-semibold mb-4">Trainer Assignment</h2>
                    <X className="absolute top-4 right-4 cursor-pointer" onClick={() => {
                        onFieldChange('trainerAssignment', false)
                        onFieldChange('new_trainer', null)
                    }} />
                    <div className="flex flex-col gap-4">
                        <InputField 
                            label="Select Trainer"
                            type="ddm"
                            ddmValues={trainers.map(trn=>({label: trn.name, value: trn.id}))}
                            value={formValues.new_trainer?.trainer_id || ''}
                            onChange={(e)=>{
                                const selectedTrainer = trainers.find(trn => trn.id === e.target.value);
                                onFieldChange('new_trainer', {
                                    start_date: formValues.trainer_start || new Date().toISOString().split('T')[0],
                                    trainer_id: e.target.value,
                                    fee: selectedTrainer?.fee || 0,
                                    end_date: trainerExpiry(formValues.trainer_start || new Date().toISOString().split('T')[0])
                                })
                            }}
                            error={errors.trainer_id}
                        />
                        <InputField
                            label="Trainer Start Date"
                            type="date"
                            value={formValues.new_trainer?.start_date || ''}
                            onChange={(e)=>{
                                onFieldChange('new_trainer', {
                                    start_date: e.target.value,
                                    trainer_id: formValues.new_trainer?.trainer_id || '',
                                    end_date: trainerExpiry(e.target.value)
                                })
                            }}
                            error={errors.trainer_start}
                        />
                        <InputField
                            label="Fee"
                            type="text"
                            value={formValues.new_trainer?.fee || ''}
                            onChange={(e)=>{
                                onFieldChange('new_trainer', {
                                    start_date: formValues.new_trainer?.start_date || '',
                                    trainer_id: formValues.new_trainer?.trainer_id || '',
                                    end_date: formValues.new_trainer?.end_date || '',
                                    fee: e.target.value
                                })
                            }}
                            error={errors.trainer_fee}
                        />
                        { formValues.receipt?.status !== 'cancelled' &&
                        <button
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                onClick={async() => {
                                //validation 
                                    onRenewTrainerAssignment();
                                }}
                            >
                                Assign Trainer
                        </button>
                        }
                        </div>
                </div>
            </div>:null
        }
        {
            selectedTab === 'Profile'?
            <div className='flex flex-col place-items-end gap-10 my-10'>
                <div className='grid md:grid-cols-2 gap-4 p-4'>
                    <div className='mx-20'>
                        <PictureUpload
                            gender={formValues.gender}
                            imageUrl={formValues.photo_url || customer.photo_url || ''}
                            onImageChange={(url) => onFieldChange('photo_url', url)}
                            isTauri={isTauri}
                        />
                        <GenderToggle
                            value={formValues.gender}
                            onChange={(value) => onFieldChange('gender', value)}
                            small={true}
                        />
                        <ToggleButton
                            label='Blocked List'
                            checked={formValues.BLOCKED || customer.BLOCKED || false}
                            onChange={(e)=>{
                                onFieldChange('BLOCKED', e.target.checked)
                            }}
                            disabled={true}
                            customClass='justify-center py-4'
                        />
                    </div>
                    <div className='grid md:grid-cols-2 gap-3'>
                        <InputField
                            label='Name'
                            type='text'
                            value={formValues.name || customer.name || ''}
                            onChange={(e)=>{
                                onFieldChange('name', e.target.value)
                            }}
                            error={errors.name}
                        />
                        <InputField
                            label='Admission Date'
                            type='date'
                            value={formValues.admission_date || customer.admission_date || ''}
                            onChange={(e)=>{
                                onFieldChange('admission_date', e.target.value)
                            }}
                            error={errors.admission_date}
                        />
                        <ContactInput
                            label='Contact'
                            type='text'
                            value={formValues.contact?.replace('+92', '') || customer.contact?.replace('+92', '') || ''}
                            onChange={(e)=>{
                                onFieldChange('contact', e.target.value)
                            }}
                            error={errors.contact}
                            errors={errors}
                        />
                        <InputField
                            label='Father Name'
                            type='text'
                            value={formValues.father_name || customer.father_name || ''}
                            onChange={(e)=>{
                                onFieldChange('father_name', e.target.value)
                            }}
                        />
                        <InputField
                            label='Birthdate'
                            type='date'
                            value={formValues.dob || customer.dob || ''}
                            onChange={(e)=>{
                                onFieldChange('dob', e.target.value)
                            }}
                        />
                        <InputField
                            label='Address'
                            type='text'
                            value={formValues.address || customer.address || ''}
                            onChange={(e)=>{
                                onFieldChange('address', e.target.value)
                            }}
                        />
                        <InputField
                            label='Email'
                            type='email'
                            value={formValues.email || customer.email || ''}
                            onChange={(e)=>{
                                onFieldChange('email', e.target.value)
                            }}
                        />
                    </div>
                </div>
                <div>
                    <button
                        className="mx-4 max-w-100 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        onClick={async() => {
                            onDeleteProfile();
                        }}
                        >
                        Delete Profile
                    </button>
                    <button
                        className="mx-4 max-w-100 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        onClick={async() => {
                            onSubmitProfile();
                        }}
                        >
                        Save Changes
                    </button>
                </div>
            </div>:
            selectedTab === 'Add Receipts' ?
            <div className='p-4 grid md:grid-cols-2'>
                <div className='grid gap-3 my-5 auto-rows-min md:grid-cols-2 md:border-r md:border-gray-300 px-5'>
                        {
                            selectedTab === 'Edit Membership' ?
                            <div>
                                <InputField
                                    label='Select Receipt'
                                    type='ddm'
                                    ddmValues={receipts.map(receipt => ({ label: `${formatDate(receipt.receipt_date)} ${receipt.amount_paid}`, value: receipt.receipt_date }))}
                                    value={formValues.selectedReceipt || ''}
                                    onChange={(e) => onFieldChange('selectedReceipt', e.target.value)}
                                    error={errors.selectedReceipt}
                                />
                            </div>
                            : null
                        }
                        <InputField
                            label='Receipt Date'
                            type='date'
                            value={formValues.receipt_date || ''}
                            onChange={(e) => onFieldChange('receipt_date', e.target.value)}
                            error={errors.receipt_date}
                        />
                        <InputField
                                label='Receipt Type'
                                type='ddm'
                                ddmValues={
                                    selectedTab === 'Edit Membership' ?
                                    [{ label: 'Admission', value: 'admission' }, 
                                    { label: 'Renewal', value: 'renewal' },
                                    { label: 'Refund', value: 'Refund' },
                                    { label: 'Payment', value: 'payment'}
                                        ] :
                                    [
                                    { label: 'Select Type', value: '' },
                                    { label: 'Admission', value: 'admission' }, 
                                    { label: 'Renewal', value: 'renewal' }]
                                }
                                value={formValues.txn_type || ''}
                                onChange={(e) => {
                                    onFieldChange('txn_type', e.target.value)
                                }}
                                error={errors.txn_type}
                            />
                        <InputField
                            label='Select Package'
                            type='ddm'
                            ddmValues={[
                                { label: 'Select Package', value: '' },
                                ...packages?.map(pkg => ({
                                    label: pkg.name,
                                    value: pkg.id
                                }))]
                            }
                            value={formValues.package || ''}
                            onChange={(e) => {
                                onFieldChange('package', e.target.value);
                                
                            }}
                            error={errors.package}
                        />
                        <InputField
                            label='Select Trainer'
                            type='ddm'
                            ddmValues={
                                [   { label: 'Select Trainer', value: '' },
                                    ...trainers?.map(trn => ({
                                    label: trn.name,
                                    value: trn.id
                                }))]
                            }
                            value={formValues.trainer_id || ''}
                            onChange={(e) => {
                                onFieldChange('trainer_id', e.target.value);
                            }}
                            error={errors.trainer_id}
                        />
                        
                        <InputField
                            label='Payment Method'
                            type='ddm'
                            ddmValues={
                                payment_methods.map(method => ({
                                    label: method.charAt(0).toUpperCase() + method.slice(1),
                                    value: method.toLowerCase()
                                }))
                            }
                            value={formValues.payment_method || ''}
                            onChange={(e) => onFieldChange('payment_method', e.target.value)}
                            error={errors.payment_method}
                        />
                        <InputField
                            label='Trainer Start'
                            type='date'
                            value={formValues.trainer_assigned_on || ''}
                            onChange={(e) => {
                                let trainer_expiry = trainerExpiry(e.target.value);
                                onFieldChange('trainer_assigned_on', e.target.value);
                                onFieldChange('trainer_expiry', trainer_expiry);
                            }}
                            error={errors.trainer_assigned_on}
                        />
                        {
                                formValues.trainer_id ?
                                <InputField
                                    label='Trainer Fee'
                                    type='number'
                                    value={formValues.trainer_fee}
                                    onChange={(e) => {
                                        //donot allow string input;
                                        const fee = parseInt(e.target.value);
                                        onFieldChange('trainer_fee', isNaN(fee) ? 0 : fee);
                                        
                                    }}
                                    error={errors.trainer_fee}
                                />:
                                <></>
                            }
                        <CheckBox
                            label='Transaction Date'
                            name='txn_date_today'
                            checked={formValues.txn_date_today || false}
                            onChange={(e)=>onFieldChange('txn_date_today', e.target.value)}
                            customClass='my-4 justify-center'
                            error={errors.txn_date_today}
                            disabled={permissions?.canChangeDueDates? false : true}
                        />
                </div>
                <div className='grid md:grid-cols-2 gap-3 p-5'>
                            
                        <div className='col-span-full'>
                            <InputField
                                label='Start Date'
                                type='date'
                                value={formValues.start_date || ''}
                                onChange={(e) => {
                                    onFieldChange('start_date', e.target.value)
                                }}
                                error={errors.start_date}
                            />
                        </div>
                        <InputField
                            label='Due Date'
                            type='date'
                            value={formValues.due_date || ''}
                            onChange={(e) => {
                                onFieldChange('due_date', e.target.value)
                            }}
                            error={errors.due_date}
                            disabled={permissions.canChangeDueDates? false : true}
                        />
                        <InputField
                                label='Cancellation Date'
                                type='date'
                                value={formValues.cancellation_date || ''}
                                onChange={(e) => onFieldChange('cancellation_date', e.target.value)}
                                error={errors.cancellation_date}
                                disabled={permissions.canChangeDueDates? false : true}
                            />
                    
                    <InputField
                        label='Total Amount'
                        type='Number'
                        value={formValues.total_amount || '0'}
                        onChange={(e) => onFieldChange('total_amount', e.target.value)}
                        disabled={permissions.canEditAmount? false : true}
                        error={errors.total_amount}
                    />
                    <InputField
                        label='Amount Paid'
                        type='Number'
                        value={formValues.amount_paid || '0'}
                        onChange={(e) => {
                            onFieldChange('amount_paid', e.target.value);
                        }}
                        error={errors.amount_paid}
                        
                    />
                    <InputField
                        label='Discount'
                        type='Number'
                        value={formValues.discount || '0'}
                        onChange={(e) => 
                            onFieldChange('discount', e.target.value)
                        }
                        error={errors.discount}
                    />
                    <InputField
                        label='Balance'
                        type='Number'
                        value={formValues.balance || '0'}
                        onChange={(e) => onFieldChange('balance', e.target.value)}
                        error={errors.balance}
                        disabled={permissions.canEditAmount? false : true}
                    />
                </div>
                <button
                    className="mx-5 mb-5 mt-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    onClick={async()=>{
                        await onAddMembership();
                    }}
                >
                    Add Membership
                </button>
            </div>:
            selectedTab === 'Edit Membership'?
            <div className="flex flex-col relative w-full my-6 gap-6">
                {/* Receipt Selector */}
                <div className="max-w-md flex ">
                    <InputField
                        label="Select Receipt"
                        type="ddm"
                        ddmValues={receipts.map((receipt) => ({
                            label: `${formatDate(receipt.receipt_date)} - ${
                            packages.find(pkg => pkg.id === receipt.package_id)?.name || 'No Package'
                            }`,
                            value: receipt.membership_id
                        }))}
                        value={formValues.selected_receipt || ''}
                        onChange={(e) => {
                            onFieldChange('selected_receipt', e.target.value);
                        }}
                        error={errors.selected_receipt}
                        outerClass='min-w-80'
                    />
                    {
                        formValues.selected_receipt && permissions.canDeleteReceipts ?
                        <Trash2Icon
                                size={18} color="red"
                                onClick={() => {
                                    onDeleteMembership();
                                }}
                                className='absolute top-7 left-82 cursor-pointer'
                            />:null
                    }
                </div>

                {/* Details Section */}
                {
                    formValues.selected_receipt ?
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

                        {/* Membership Card */}
                        <div className="rounded-xl border max-h-[320px] overflow-y-auto border-gray-200 p-5 bg-white shadow-sm">
                            <div className='relative flex justify-between items-center'>
                                <h2 className="font-semibold text-lg mb-4 text-gray-800">
                                    Payment Details
                                </h2>
                                { user?.role === 'owner' &&
                                <Trash2Icon style={{ float: 'right', cursor: 'pointer' }} size={16} color="red" 
                                    onClick={async()=>{
                                        
                                    }}
                                />
                                }
                            </div>

                            {formValues.receipt && (
                                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                                    <LabelCase label="Start Date" value={formatDate(formValues.receipt.start_date)} />
                                    <LabelCase label="Expiry Date" value={formatDate(formValues.receipt.due_date)} />

                                    <LabelCase
                                        label="Package"
                                        value={packages.find(pkg => pkg.id === formValues.receipt.package_id)?.name || 'No Package'}
                                    />
                                    <div />
                                    <LabelCase label="Total Amount" value={`${formValues.receipt.total_amount || 0}/-`} />
                                    <LabelCase
                                        label="Paid"
                                        value={`${formValues.receipt.amount_paid || 0}/-`}
                                        textColor="text-green-600"
                                    />

                                    <LabelCase label="Discount" value={`${formValues.receipt.discount || 0}/-`} />
                                    <LabelCase
                                        label="Due Amount"
                                        value={`${formValues.receipt.balance || 0}/-`}
                                        textColor="text-red-600"
                                    />
                                    <div className='flex flex-col col-span-2'>
                                        {
                                            !formValues.receipt?.trainer_expiry || new Date(formValues.receipt.trainer_expiry) < new Date() ? 
                                            <div className='flex'>
                                                {
                                                    !formValues.receipt?.trainer_expiry ?
                                                    <LabelCase label="Trainer" value={trainers.find(trn => trn.id === formValues.receipt.trainer_id)?.name || 'No Trainer'} />:
                                                    <LabelCase label="Trainer Expired" value={formatDate(formValues.receipt.trainer_expiry)} textColor="text-red-600" />
                                                }
                                                {   formValues.receipt?.status !== 'cancelled' &&
                                                    <button
                                                        className="ml-auto text-xs px-3 py-1 rounded-md border border-blue-300 
                                                                text-blue-600 hover:bg-blue-50"
                                                        onClick={
                                                            ()=>{
                                                                onFieldChange('trainerAssignment', true);
                                                            }
                                                        }
                                                    >
                                                        {formValues.receipt?.trainer_expiry ? 'Renew Trainer' : 'Assign Trainer'}
                                                    </button>
                                                }
                                            </div>
                                            :
                                            <div className='grid grid-cols-2'>
                                                <LabelCase label="Trainer" value={trainers.find(trn => trn.id === formValues.receipt.trainer_id)?.name || 'No Trainer'} />
                                                <div className='flex'>
                                                    <LabelCase label="Trainer Expiry" value={formatDate(formValues.receipt.trainer_expiry)} />
                                                    {
                                                        user?.role === 'owner' ?
                                                        <Pencil
                                                            className="ml-2 text-gray-500 hover:text-gray-700 cursor-pointer"
                                                            size={12}
                                                            onClick={
                                                                ()=>{
                                                                    setTrainerAssignment(true);
                                                                    setForm({ ...form, new_trainer: {
                                                                        start_date: formValues.receipt.trainer_start || new Date().toISOString().split('T')[0],
                                                                        trainer_id: formValues.receipt.trainer_id,
                                                                        end_date: formValues.receipt.trainer_expiry
                                                                    } })
                                                                }}
                                                        /> : null
                                                    }
                                                </div>
                                            </div>
                                        }
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Transaction Card */}
                        <div className="rounded-xl border  max-h-[320px] overflow-y-auto border-gray-200 p-5 bg-white shadow-sm">
                            <h2 className="font-semibold text-lg mb-4 text-gray-800">
                                Transaction Details
                            </h2>

                            {formValues.receipt?.transaction_history?.length > 0 ? (
                                <div className="flex max-h-[160px] overflow-y-auto flex-col gap-3">
                                {formValues.receipt.transaction_history.map((txn, index) => (
                                    <div
                                    key={index}
                                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                                    >
                                        {/* Left: Info */}
                                        <div className="flex flex-col text-sm text-gray-700">
                                            <span className="font-medium">
                                            {formatDate(txn.txn_date)}
                                            </span>
                                            <span className="text-gray-500">
                                            {makeFirstLetterUppercase(txn.payment_method) || 'Cash'}
                                            </span>
                                        </div>

                                        {/* Middle: Amount */}
                                        <div className="text-right">
                                            <div className={`font-semibold ${txn.txn_type === 'refund' ? 'text-red-600' : 'text-green-600'} text-base`}>
                                            {txn.txn_type !== 'refund' ? '+' : '-'}{txn.amount}/-
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        {
                                            permissions.canDeleteReceipts && formValues.receipt.status !== 'cancelled' ?
                                            <div className="flex gap-2">
                                                <button
                                                    className="text-xs px-3 py-1 rounded-md border border-red-300 
                                                                text-red-600 hover:bg-red-50"
                                                    onClick={async() =>{
                                                        onDeleteTransaction(index);
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div> : null
                                        }
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-400 italic">
                                No transactions found for this membership.
                                </div>
                            )}
                            {formValues.receipt.status === 'cancelled' ?
                            <div className="flex justify-end mt-4">
                                <button
                                    className="px-4 py-2 !cursor-not-allowed bg-red-600 text-white rounded-md"
                                    disabled={true}
                                >
                                    Cancelled
                                </button>
                            </div>
                            :
                            <button
                                className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                onClick={()=>{
                                    onFieldChange('addPaymentModal', true);
                                    onFieldChange('new_payment', {
                                        txn_date: new Date().toISOString().split('T')[0],
                                        amount: '',
                                        txn_type: 'payment',
                                        payment_method: 'Cash'
                                    });
                                }}
                            >
                                Add Transaction
                            </button>}
                        </div>
                    </div>: 
                    <div className="text-sm text-gray-400 italic">
                        Please select a receipt to view details.
                    </div>
                }
            </div>:
            selectedTab === 'Send Message' ?
            <div className='my-10 flex flex-col gap-4 px-4'>
                <ContactInput
                    label='Contact'
                    type='contact'
                    value={formValues.contact?.replace('+92', '') || customer.contact?.replace('+92', '') || ''}
                    onChange={(e)=>{
                        onFieldChange('contact', e.target.value)
                    }}
                    error={errors.contact}
                />
                <InputField 
                    label='Select Receipt'
                    type='ddm'
                    ddmValues={receipts.map(receipt => ({
                        label: `${formatDate(receipt.receipt_date)} - ${packages.find(pkg => pkg.id === receipt.package_id)?.name || 'No Package'}`,
                        value: receipt.membership_id
                    }))}
                    value={formValues.selected_receipt || ''}
                    onChange={(e)=>{
                        onFieldChange('selected_receipt', e.target.value);
                    }}
                    error={errors.selected_receipt}
                />
                <InputField
                    label='Select Template'
                    type='ddm'
                    ddmValues={templates.map(template => template.type === 'whatsapp'  && ({
                        label: template.name,
                        value: template.id
                    }))}
                    value={formValues.message_template || ''}
                    onChange={(e)=>{
                        onFieldChange('message_template', e.target.value);
                    }}
                    error={errors.message_template}
                />
                <div className='flex justify-end mt-4'>
                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        onClick={async() => {
                            await onSendMessage();
                        }}
                    >
                        Send Message
                    </button>
                </div>
            </div>:
            null
        }
        {
            addPaymentModal?
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-40'>
                    <div className="bg-white relative p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-lg font-semibold mb-4">Add Transaction</h2>
                        <X className="absolute top-4 right-4 cursor-pointer" onClick={() => {
                            onFieldChange('addPaymentModal', false);
                            onFieldChange('new_payment', null);
                        }} />
                        <div className="flex flex-col gap-4">
                            <InputField
                                label='Transaction Date'
                                type='date'
                                value={formValues.new_payment?.txn_date || new Date().toISOString().split('T')[0]}
                                onChange={(e)=>{
                                    onFieldChange('new_payment', {
                                        ...formValues.new_payment,
                                        txn_date: e.target.value
                                    })
                                }}
                                error={errors.txn_date}
                            />
                            <InputField
                                label='Amount'
                                type='text'
                                value={formValues.new_payment?.amount || '0'}
                                onChange={(e)=>{
                                    // numbers only
                                    if (isNaN(e.target.value)) return

                                    onFieldChange('new_payment', {
                                        ...formValues.new_payment,
                                        amount: e.target.value
                                    })
                                }}
                                error={errors.amount}
                            />
                            <InputField 
                                label='Type'
                                type='ddm'
                                ddmValues={[
                                    { label: 'Payment', value: 'payment' },
                                    { label: 'Partial Refund', value: 'partial refund' },
                                    { label: 'Full Refund', value: 'full refund' },
                                ]}
                                value={formValues.new_payment?.txn_type || 'payment'}
                                onChange={(e)=>{
                                    onFieldChange('new_payment', {
                                        ...formValues.new_payment,
                                        txn_type: e.target.value
                                    })
                                    if(e.target.value === 'full refund'){
                                        onFieldChange('new_payment', {
                                            ...formValues.new_payment,
                                            amount: formValues.receipt.amount_paid || '0',
                                            txn_type: e.target.value
                                        })
                                    }
                                }}
                                error={errors.txn_type}
                            />
                            <InputField 
                                label='Payment Method'
                                type='ddm'
                                ddmValues={[
                                    { label: 'Cash', value: 'Cash' },
                                    { label: 'Card', value: 'Card' },
                                    { label: 'Online', value: 'Online' },
                                ]}
                                value={formValues.new_payment?.payment_method || 'Cash'}
                                onChange={(e)=>{
                                    onFieldChange('new_payment', {
                                        ...formValues.new_payment,
                                        payment_method: e.target.value
                                    })
                                }}
                            />
                        </div>
                        {   
                            <div className="flex justify-end mt-4">
                                <button
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                    onClick={async() => {
                                        //validation
                                        let isFullRefund = formValues.new_payment?.txn_type === 'full refund';
                                        if(isFullRefund){
                                            await onFullRefund();
                                        }else{
                                            await onAddTransaction();
                                        }
                                    }}
                                >
                                    Add Transaction
                                </button>
                            </div>
                        }
                    </div>
                </div>:null 
        }
        {
            selectedTab === 'Biometric Registration'
            && <BiometricContainer 
                    customer={customer}
                    formValues={formValues}
                    onFieldChange={onFieldChange}
                    setAllowEscape={setAllowEscape}
                /> 
        }
        </motion.div>
    </div>
  )
}
export function Tabs({ tabs, selectedTab, onSelectTab, disabled = false }) {
  return (
    <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
            tab === null ? null :
            <button
                key={tab}
                className={`px-4 py-2 -mb-px font-medium text-xs md:text-sm ${
                    selectedTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                } ${disabled && !(selectedTab === tab) ? '!cursor-not-allowed bg-red opacity-50' : ''}`}
                onClick={() => {
                    if(!disabled){
                        onSelectTab(tab)
                    }
                }}
            >
                {tab}
            </button>
        ))}
    </div>
  )
}
export function GenderToggle({ value, onChange, small = false }) {
    return (
        <div className={`flex border my-3 border-gray-300 rounded-lg overflow-hidden w-full ${small ? 'h-8' : 'h-12'}`}>
            <button
                className={`flex-1 py-2 text-sm ${value === 'male' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                onClick={() => onChange('male')}
            >
                Male
            </button>
            <button
                className={`flex-1 py-2 text-sm ${value === 'female' ? 'bg-pink-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                onClick={() => onChange('female')}
            >
                Female
            </button>
        </div>
    );
}
export function ToggleButton({ label, name, checked, onChange, customClass = '', error = '' }) {
    return (
        <div className={`flex items-center ${customClass}`}>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    name={name}
                    checked={checked}
                    onChange={onChange}
                />
                <span className="ml-2">{label}</span>
            </label>
            {error && <span className="text-red-500 ml-2">{error}</span>}
        </div>
    );
}
function LabelCase({label, value, textColor = 'text-gray-700'}) {
    return (
        <div className='flex flex-col'>
            <span className='font-bold text-xs'>{label}</span>
            <span className={`text-sm ${textColor}`}>{value}</span>
        </div>
    )
}
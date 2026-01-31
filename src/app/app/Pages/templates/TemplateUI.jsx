'use client';
import React, { useEffect } from 'react'
import InputField from '../../AppComponents/subcomponents/InputField';
import ContactInput from '../../AppComponents/subcomponents/ContactInput';
import EmojiTagInput from '../../AppComponents/subcomponents/EmojiTagInput';
import { motion } from 'framer-motion';
export default function TemplateUI({
  formValues,
  errors,
  templates,
  branches,
  permissions,
  singleBranch,
  onFieldChange,
  onTemplateSelect,
  onSubmit,
  onDelete
}) {

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.8 } }}
        exit={{ opacity: 0 }} 
        className='h-screen p-8 overflow-y-auto'>
        <h1 className='text-2xl font-bold mb-4 text-center'>Templates Management</h1>
        <div className='grid grid-cols-2 mt-20 my-3 flex-col gap-2'>
            {
                permissions?.canManageBranches && !singleBranch &&
                <InputField
                    label= 'Select Branch'
                    type='ddm'
                    ddmValues={
                        [   {label: 'Select Branch', value: ''},
                            ...branches.map((branch) => ({ label: branch.name, value: branch.id }))
                        ]
                    }
                    value={formValues.branch_id}
                    onChange={(e) => {
                        onFieldChange('branch_id', e.target.value);
                    }}
                    error={errors.branch_id}
                />
            }
            <InputField
                label='Select Template'
                type='ddm'
                ddmValues={templates.map((template) => ({ label: template.name, value: template.id }))}
                value={formValues.selectedTemplate}
                onChange={(val) => {
                    onTemplateSelect(val);
                }}
                error={errors.selectedTemplate}
            />
            <InputField
                label='Template Name'
                type='text'
                value={formValues.name}
                placeholder='Template Name'
                onChange={(e) => onFieldChange('name', e.target.value)}
                error={errors.name}
                disabled={formValues.type==='receipt'}
            />
            <InputField
                label= 'Template Type'
                type='ddm'
                ddmValues={
                    [
                        {label: 'WhatsApp', value: 'whatsapp'},
                        {label: 'Receipt', value: 'receipt'},
                    ]
                }
                value={formValues.type}
                onChange={(e) => onFieldChange('type', e.target.value)}
                error={errors.type}
            />
            
        </div>
        <EmojiTagInput
            label='Template Content'
            value={formValues.content || ''}
            onChange={(val) => onFieldChange('content', val)}
        />
        <button className='px-4 py-2 bg-red-600 text-white rounded-md mr-4'
            onClick={async ()=>{
                // Handle staff deletion logic here
                onDelete();
            }}
        >
            Delete 
        </button>
        {
           (formValues.selectedTemplate || Object.keys(errors).length > 0) &&
           <button name="clear selection" className="px-4 py-2 bg-gray-600 text-white mr-4" onClick={() => onFieldChange('selectedTemplate', null)}
              type="button"
                aria-label="Clear Selection"
            >
              Clear Selection
            </button>
        }
        <button className='px-4 py-2 bg-blue-600 text-white rounded-md'
            aria-label='submit template'
            onClick={async ()=>{
                onSubmit();
            }}
        >
            {formValues.selectedStaff ? 'Update Template' : 'Add Template'}
        </button>
    </motion.div>
  )
}

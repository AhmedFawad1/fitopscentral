'use client'
import React from "react";
import InputField from "../../AppComponents/subcomponents/InputField";
import { motion } from "framer-motion";
export default function PackageFormView({
  formValues,
  errors,
  packages,
  branches,
  permissions,
  singleBranch,
  onFieldChange,
  onPackageSelect,
  onSubmit,
  onDelete
}) {
  const safePackages = Array.isArray(packages) ? packages : [];

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.8 } }}
        exit={{ opacity: 0 }} 
        className="h-screen p-8 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Packages</h1>

      {!singleBranch && permissions.canManageBranches && (
        <InputField
          
          label="Branch"
          type="ddm"
          value={formValues.branch_id || ''}
          ddmValues={branches.map(b => ({ label: b.name, value: b.id }))}
          onChange={e => onFieldChange('branch_id', e.target.value)}
          error={errors.branch}
        />
      )}

      <InputField
        label="Packages"
        type="ddm"
        value={formValues.selectedPackage || ''}
        ddmValues={[
          { label: 'Select Package', value: '' },
          ...safePackages.map(p => ({ label: p.name, value: p.id }))
        ]}
        onChange={onPackageSelect}
        error={errors.selectedPackage}
        outerClass="my-4"
      />

      <InputField
        label="Package Name"
        type="text"
        placeholder="Package Name"
        value={formValues.name || ''}
        onChange={e => onFieldChange('name', e.target.value)}
        error={errors.name}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
        <InputField
          label="Package Type"
          type="ddm"
          ddmValues={[
            { label: 'Months', value: 'months' },
            { label: 'Days', value: 'days' }
          ]}
          value={formValues.duration_type || ''}
          onChange={e => onFieldChange('duration_type', e.target.value)}
          error={errors.type}
        />

        <InputField
          label="Package Fee"
          type="Number"
          value={formValues.price || ''}
          placeholder="Package Fee"
          onChange={e => onFieldChange('price', e.target.value)}
          error={errors.price}
        />

        <InputField
          label="Admission Fee"
          type="Number"
          value={formValues.admission_fee || ''}
          onChange={e => onFieldChange('admission_fee', e.target.value)}
          error={errors.admission_fee}
          placeholder="Admission Fee"
        />

        <InputField
          label="Duration"
          type="Number"
          value={formValues.duration || ''}
          placeholder="Duration"
          onChange={e => onFieldChange('duration', e.target.value)}
          error={errors.duration}
        />

        <InputField
          label="Cancellation Duration"
          type="Number"
          value={formValues.cancellation || ''}
          placeholder="Cancellation Duration"
          onChange={e => onFieldChange('cancellation', e.target.value)}
          error={errors.cancellation}
        />
      </div>
      {
        (formValues.id || Object.keys(errors).length > 0) &&
        <button name="clear selection" className="px-4 py-2 bg-gray-600 text-white mr-4" onClick={() => onFieldChange('id', null)}
           type="button"
            aria-label="Clear Selection"
        >
          Clear Selection
        </button>
      }
      <button aria-label="Delete Package" className="px-4 py-2 bg-red-600 text-white mr-4" onClick={onDelete}>
        Delete
      </button>

      <button className="px-4 py-2 bg-blue-600 text-white" onClick={onSubmit}
        aria-label="Submit Package"
      >
        {formValues.id ? 'Update Package' : 'Add Package'}
      </button>
    </motion.div>
  );
}

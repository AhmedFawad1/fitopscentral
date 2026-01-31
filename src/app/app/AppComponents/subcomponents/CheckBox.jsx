import { Check } from 'lucide-react'
import React from 'react'

export default function CheckBox({
    label = '',
    name = '',
    checked = false,
    onChange = () => {},
    customClass = '',
    disabled = false
}) {
  return (
    <div className={`flex items-center gap-2 ${customClass} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => {
            if(!disabled){
                onChange({ target: { name, value: !checked } })
            }
        }}
    >
      <Check
        className={`w-5  h-5 border-2 rounded-sm  transition-colors duration-200 ${checked ? 'bg-(--color-primary) border-(--color-primary) text-white' : 'bg-(--color-card) border-(--color-border) text-(--color-card)'}`}
        disabled={disabled}
      />
      {label && <label htmlFor={name} className="text-sm">{label}</label>}
    </div>
  )
}

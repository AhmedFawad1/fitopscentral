'use client'
import { Calendar, ChevronDown, ChevronDownCircle, EyeIcon, EyeOffIcon } from 'lucide-react';
import React, { useEffect } from 'react'
import DatePicker from './DatePicker';
import { formatDate } from '@/app/lib/functions';

export default function InputField({
  label = '',
  name = '',
  type = 'text',
  value = '',
  placeholder = '',
  error = '',
  svg = null,
  onChange = () => {},
  rows = 3,
  customClass = '',
  autoComplete = '',
  ddmValues = [],
  lucideIcon = null,
  ddmClass = '',
  readOnly = false,
  small = true,
  rounded = false,
  disabled = false,
  selectionMode = 'single',
  noSvg = false,
  outerClass = ''
}) {
  const inputBaseClasses =
    `w-full ${disabled ? 'cursor-not-allowed' : ''} ${rounded ? 'rounded-lg' : 'rounded-none'} ${small ? 'text-sm py-[7px]' : 'text-base py-2 '} border border-[var(--color-border)] px-3 !bg-(--color-card) text-[11pt] text-[var(--color-text)] transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]`
  const [filteredDdmValues, setFilteredDdmValues] = React.useState(null);
  const errorClasses = error ? 'border-[var(--color-error)] ring-[var(--color-error)]' : ''
  const [showPassword, setShowPassword] = React.useState(false);
  const [isDdmOpen, setIsDdmOpen] = React.useState(false);
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  // decide input element
  const inputElement =
    type === 'textarea' ? (
      <textarea
        id={name}
        name={name}
        rows={rows}
        className={`${inputBaseClasses} ${errorClasses} ${customClass}`}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        autoComplete={autoComplete || 'off'}
        readOnly={readOnly}
      />
    ) :
    (
      <div className='w-full flex items-center'>
      {type === 'contact'?
        <div className='flex absolute ml-3 items-center gap-2 justify-center'>
        <img
          src="https://flagcdn.com/16x12/pk.png"
          srcSet="https://flagcdn.com/32x24/pk.png 2x, https://flagcdn.com/48x36/pk.png 3x"
          alt="Pakistan Flag"
        />
        <span className="text-[11pt] text-(--color-text)">+92</span>
        </div>
        :null
      }
      {lucideIcon}
      <input
        aria-label={label}
        id={name}
        name={name}
        type={type === 'password' && showPassword ? 'text' : type === 'Number'? 'text': type}
        className={`${inputBaseClasses} ${errorClasses} ${customClass} ${type === 'contact' ? '!pl-[60px]' : ''}`}
        value={value || ''}
        placeholder={placeholder}
          disabled={disabled}
        onChange={(e)=>{
          if(type === 'Number'){
            // allow only numbers
            const regex = /^[0-9]*$/
            if(e.target.value === '' || regex.test(e.target.value)){
              onChange(e)
            }
          }else{
            onChange(e)
          }
        }
          
        }
        autoComplete={autoComplete || 'off'}
        readOnly={readOnly}
      />
      </div>
    )
  // click outside to close ddm
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.ddm-container') && !event.target.closest('.ddm-button')) {
        setIsDdmOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    }
  }, []);
  useEffect(()=>{
    if(filteredDdmValues === null 
      || filteredDdmValues.length !== ddmValues.length
      || (filteredDdmValues.length === ddmValues.length && filteredDdmValues.some((v, i) => v.label !== ddmValues[i].label))
    ){
      setFilteredDdmValues(ddmValues);
    }
  },[ddmValues])
  return (
    <div className={`flex flex-col relative gap-1 ${outerClass}`}>
      {
        showDatePicker && 
        <DatePicker value={value} onChange={(date) => {
            onChange({ target: { name, value: 
              selectionMode === 'range' ? {
                  start: date.start.toISOString().split('T')[0],
                  end: date.end.toISOString().split('T')[0]
                } :
                date.toISOString().split('T')[0] 
            }})
            setShowDatePicker(false)
          }} 
          selectionMode={selectionMode}
        />
      }
      {label && (
        <label htmlFor={label} className="text-xs font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}
      {
        type === 'ddm'?
        <div className="cursor-pointer relative flex">
          <button
            aria-label={label}
            name={label.toLowerCase()}
            className={`${inputBaseClasses} ${errorClasses} ${customClass} ddm-button flex justify-between text-left`}
            type="button"
            onClick={() => {
              setIsDdmOpen(!isDdmOpen && !readOnly)
            }}
          >
            {
              ddmValues.find(ddm => ddm.value === value)?.label || placeholder || 'Select an option'
            }
            <ChevronDown className="ml-2 h-5 w-5 text-(--color-primary)" />
          </button>
          <div className={`absolute ${ddmClass} z-50 top-10 mt-1 w-full bg-(--color-card) border border-(--color-border) rounded-lg shadow-lg max-h-40 overflow-y-auto ${isDdmOpen ? 'block' : 'hidden'}`}>
            {
              ddmValues.length >= 5 &&
              <div className="p-2 border-b border-(--color-border)">
                <input
                  aria-labelledby={`${label}-label`}
                  name={`${label.toLowerCase()}`}
                  type="text"
                  className="w-full top-0 px-2 py-1 ddm-button border border-(--color-border) rounded-lg focus:outline-none focus:ring-1 focus:ring-(--color-primary)"
                  placeholder="Search..."
                  onChange={(e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    const filteredValues = ddmValues.filter(ddm => ddm.label.toLowerCase().includes(searchTerm.toLowerCase()));
                    // Update ddmValues to show only filtered values
                    // Note: In a real implementation, you might want to manage ddmValues in state
                    setFilteredDdmValues(filteredValues);
                  }}
                />
              </div>
            }
            {
              filteredDdmValues?.map((ddm, index) => (
                <div key={index} className={`cursor-pointer text-sm p-2 hover:bg-(--color-primary-hover) hover:text-white ${value === ddm.value ? 'bg-(--color-primary) text-white' : ''}`} onClick={() => {
                  onChange({ target: { name, value: ddm.value } })
                  setIsDdmOpen(false)
                }}>
                  {ddm.label}
                </div>
              ))
            }
          </div>
        </div>:
        type === 'date'?
        <div className={`${inputBaseClasses} ${disabled ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'} flex items-center ${errorClasses} ${customClass}`}
          onClick={() => !disabled && setShowDatePicker(true)}
        >
            {value? formatDate(value) : '--/---/----'}
            { !noSvg &&
              <Calendar className="absolute right-3 h-5 w-5 text-(--color-primary)" />
            }
        </div>
        :<div className="cursor-pointer relative flex items-center">
          {svg && (
            type === 'password'?
            <span className="absolute cursor-pointer right-3 h-5 w-5 flex items-center text-(--color-primary)" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeIcon /> : <EyeOffIcon />}
            </span>:
            <div 
              className="absolute cursor-pointer right-3 flex items-center pointer-events-none text-(--color-primary)">
              {svg}
            </div>
          )}

          {React.cloneElement(inputElement, {
            className: `${inputElement.props.className}`
          })}
        </div>
      }
      {error && <p className="text-xs text-(--color-error) mt-1">{error}</p>}
    </div>
  )
}

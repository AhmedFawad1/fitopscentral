'use client';

import React, { useEffect, useRef, useState } from 'react';
import countries from '@/app/lib/data/countries';
import { ChevronDown } from 'lucide-react';

export function isInvalidPhoneNumber(number) {
    if(!number) return false;
    for (let country of countries) {
        if (number.startsWith(country.dial)) {
            const localNumber = number.slice(country.dial.length);
            if (localNumber.length >= country.min && localNumber.length <= country.max) {
                return false; // valid number
            } else {
                return true; // invalid number
            }
        }
    }
    return true; // invalid if no country code matches
}
export default function ContactInput({
  label = 'Phone Number',
  name = 'phone',
  value = '',
  error = '',
  onChange = () => {},
  disabled = false,
  outerClass = '',
  setError = () => {},
  errors = {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState(
    countries.find(c => c.iso === 'PK')
  );
  const [number, setNumber] = useState('');

  /* ✅ INIT FROM VALUE (EDIT MODE FIX) */
  let firstRender = useRef(true);
  useEffect(() => {
    // if (!firstRender.current) return;
    // firstRender.current = false;
    // if (!value) return;
    const match = countries.find(c => value.startsWith(c.dial));
    if (match) {
      setCountry(match);
      setNumber(value.replace(match.dial, ''));
    }else if(!match && value){
        setNumber(`${value}`);
    }else{
        setNumber('');
    }
  }, [value]);
  useEffect(()=>{
    console.log('Error in ContactInput:', error);
  },[error])
  /* ✅ EMIT ONLY WHEN VALID */
  useEffect(() => {
    if (!number) {
      onChange({ target: { name, value: value || '' } });
      return;
    }

    onChange({
      target: {
        name,
        value: `${country.dial}${number}`,
      },
    });
  }, [country, number]);

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dial.includes(search)
  );
  

  return (
    <div className={`flex flex-col gap-1 relative ${outerClass}`}>
      {label && (
        <label htmlFor={label} className="text-xs font-medium text-(--color-text)">
          {label}
        </label>
      )}

      <div className="flex relative">
        {/* 🌍 COUNTRY */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 border
            ${error ? 'border-(--color-error)' : 'border-(--color-border)'}
            bg-(--color-card) text-sm rounded-l-lg`}
        >
          <span className="text-lg">{country.flag}</span>
          <span>{country.dial}</span>
          <ChevronDown size={16} />
        </button>

        {/* 📞 NUMBER */}
        <input
          aria-label={label}
          aria-labelledby={`${label}-label`}
          type="text"
          inputMode="numeric"
          value={number}
          disabled={disabled}
          placeholder="Enter phone number"
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '');
            setNumber(v);

            if (v && (v.length < country.min || v.length > country.max)) {
              setError({
                ...errors,
                contact: `Invalid number for ${country.name}`,
              });
            } else {
              setError({
                ...errors,
                contact: null,
              });
            }
          }}
          className={`w-full px-3 py-[7px] text-[11pt]
            border border-l-0 bg-(--color-card)
            ${error ? 'border-(--color-error)' : 'border-(--color-border)'}
            rounded-r-lg focus:outline-none`}
        />
      </div>

      {/* ❌ ERROR */}
      {error && (
        <p className="text-xs text-(--color-error)">
          {error}
        </p>
      )}

      {/* 🌍 DROPDOWN */}
      {isOpen && (
        <div className="absolute z-50 top-[68px] w-full bg-(--color-card)
                        border border-(--color-border)
                        rounded-lg shadow-lg max-h-52 overflow-y-auto">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search country or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1 border rounded-lg text-sm"
            />
          </div>

          {filteredCountries.map((c) => (
            <div
              key={c.iso}
              onClick={() => {
                setCountry(c);
                setIsOpen(false);
                setSearch('');
              }}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer
                         hover:bg-(--color-primary-hover) hover:text-white"
            >
              <span className="text-lg">{c.flag}</span>
              <span className="flex-1 text-sm">{c.name}</span>
              <span className="text-sm">{c.dial}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

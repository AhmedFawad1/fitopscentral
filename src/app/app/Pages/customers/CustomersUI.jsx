import React from 'react'
import { motion } from 'framer-motion';
import { SearchIcon, X } from 'lucide-react';
import ParseSvgIcon from '@/app/site-components/ParseSvgIcon';
import { type } from 'node:os';

export default function CustomersUI({
        customers,
        setSelectedTab,
        showSearchModal,
        setShowSearchModal,
        searchRef,
        searchTerm,
        searchLoading,
        searchFilter,
        isLoading,
        sectionRef,
        user,
        branches,
        permissions,
        singleBranch,
        onFieldChange,
        reset,
        setItems,
        setSelectedCustomer
    }
) {
  return (
   <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1, transition: { duration: 0.8 } }}
           exit={{ opacity: 0 }} 
           className='h-screen w-full overflow-y-hidden'>
        {/* {selectedUser && <Receipts customer={selectedUser} selected={selectedUser.type} onClose={() => setSelectedUser(null)} />} */}
        <div className="flex w-full gap-4 justify-center items-center py-5 gradient-primary dropshadow-below">
            <h1 className="text-white font-bold text-2xl cursor-default">Customers</h1>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search w-5 h-5 text-white cursor-pointer transform transition-transform duration-300 hover:scale-115" aria-hidden="true"
                onClick={() => setShowSearchModal(true)}
            >
                <path d="m21 21-4.34-4.34"></path>
                <circle cx="11" cy="11" r="8"></circle>
            </svg>
        </div>
        { !isLoading ?
        <div ref={sectionRef} className="h-[450px] dropshadow-inner justify-center overflow-auto flex pb-10"
            style={{
                // inner box shadow
                boxShadow: 'inset 0px -10px 10px -10px #0000004a, inset 0px 10px 10px -10px #0000004a',
            }}
            >
                { customers.length === 0 ?
                <div className='flex flex-col items-center justify-center h-full'>
                    <p className='text-lg'>No customers found</p>
                </div> :
                <div className='flex flex-col w-full max-h-10 px-10 space-y-2 p-5'>
                    {
                    customers.map((customer,idx) => (
                        <div key={`cust-${customer.id}-${idx}`} className={`border ${idx===customer.length? 'mb-20':''} rounded-2xl relative flex flex-col border-(--sidebar-border) w-full`}>
                            <div className='flex w-full'>
                                <div className={` text-white rounded-t-2xl py-1 w-full ${customer.current_status === 'Active' ? 'bg-green-900' : customer.current_status === 'Inactive' ? 'bg-amber-300 !text-black' :customer.current_status === 'Refunded'?'bg-orange-500': 'bg-red-700'} items-center justify-center flex`}>
                                    <label className='absolute left-4'>{customer.member_code}</label>
                                    {
                                        <div className='flex items-center space-x-4'>
                                            <p className='text-xl font-semibold'>{customer.name}</p>
                                            {
                                                customer.father_name &&
                                                <span> {customer.gender === 'male' ? 's/o' : 'd/o'} {customer.father_name}</span>
                                            }
                                        </div>
                                    }
                                    <span className='absolute text-lg left-4 font-bold'>#{customer.serial_number}</span>
                                </div>
                            </div>
                            <div className='grid py-4 grid-cols-3'>
                                    <div className='items-center justify-center text-center flex flex-col'>
                                        <div className='space-y-2'>  
                                            <div className='flex items-center justify-center mb-3'>
                                                <ProfilePicture
                                                    gender={customer.gender}
                                                    ProfilePictureLink={customer.photo_url}
                                                />
                                            </div>
                                            <div className='flex gap-2 mt-1'>
                                                <ParseSvgIcon
                                                    className='h-5 w-5'
                                                    parseFill={true}
                                                    fill={`var(--color-text)`}
                                                    svg={`<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M16.5562 12.9062L16.1007 13.359C16.1007 13.359 15.0181 14.4355 12.0631 11.4972C9.10812 8.55901 10.1907 7.48257 10.1907 7.48257L10.4775 7.19738C11.1841 6.49484 11.2507 5.36691 10.6342 4.54348L9.37326 2.85908C8.61028 1.83992 7.13596 1.70529 6.26145 2.57483L4.69185 4.13552C4.25823 4.56668 3.96765 5.12559 4.00289 5.74561C4.09304 7.33182 4.81071 10.7447 8.81536 14.7266C13.0621 18.9492 17.0468 19.117 18.6763 18.9651C19.1917 18.9171 19.6399 18.6546 20.0011 18.2954L21.4217 16.883C22.3806 15.9295 22.1102 14.2949 20.8833 13.628L18.9728 12.5894C18.1672 12.1515 17.1858 12.2801 16.5562 12.9062Z" fill="#1C274C"></path> </g></svg>`}
                                                />
                                                {customer.contact}
                                            </div>
                                            <div className='flex gap-2'>
                                                <ParseSvgIcon
                                                    className='h-6 w-6'
                                                    stroke={`var(--svg-light-fill)`}
                                                    parseFill={false}
                                                    svg={`<svg viewBox="0 0 24 24" fill="red" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 21C15.5 17.4 19 14.1764 19 10.2C19 6.22355 15.866 3 12 3C8.13401 3 5 6.22355 5 10.2C5 14.1764 8.5 17.4 12 21Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M12 12C13.1046 12 14 11.1046 14 10C14 8.89543 13.1046 8 12 8C10.8954 8 10 8.89543 10 10C10 11.1046 10.8954 12 12 12Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`}
                                                />
                                                <div className='overflow-hidden text-ellipsis whitespace-nowrap'>
                                                    {reduceString(customer.address, 12)}
                                                </div>
                                            </div>
                                            <span className={`text-white px-5 py-1 rounded-full ${customer.current_status === 'Active'?'bg-green-900':customer.current_status === 'Inactive'?'bg-yellow-300 !text-black':customer.current_status === 'Refunded'?'bg-orange-500':'bg-red-700'}`}>{customer.current_status}</span>
                                        </div>
                                    </div>
                                    <div className='items-center justify-center flex'>
                                                <div className='flex flex-col'>
                                                    {
                                                        ['Admission Date', 'Due Date', 'Amount Paid', 'Balance'].map((info, index) => (
                                                            <span key={index} className='text-right font-semibold'>
                                                                {info}
                                                            </span>
                                                        ))
                                                    }
                                                </div>
                                                <div className='flex flex-col'>
                                                    {
                                                        [customer.admission_date, customer.due_date, customer.amount_paid, customer.overall_balance].map((info, index) => (
                                                            <span key={index} className='text-left ml-2'>{customer.current_status==='Refunded'? 'Refunded': formatTransactionOrDate(info)}</span>
                                                        ))
                                                    }
                                                </div>
                                    </div>
                                    <div className='items-center flex'>
                                                <div className='flex flex-col'>
                                                    {
                                                        ['Receipt Date', 'Cancellation Date', 'Package', 'Trainer'].map((info, index) => (
                                                            <span key={index} className='text-right font-semibold'>
                                                                {info}
                                                            </span>
                                                        ))
                                                    }
                                                </div>
                                                <div className='flex flex-col'>
                                                    {
                                                        [customer.receipt_date, customer.cancellation_date, customer.package_name, customer.trainer_name].map((info, index) => (
                                                            <div key={index} className='flex'>
                                                            <span key={index} className='text-left ml-2'>{customer.current_status==='Refunded'? 'Refunded': formatTransactionOrDate(info)}</span>
                                                            {index === 3 && customer.trainer_name && <span className={`ml-2 font-bold ${customer.trainer_status === 'active'?'text-green-700':'text-red-500'}`}>{`(${customer.trainer_status})`}</span> }
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                    </div>
                            </div>
                            <div className='flex my-3 justify-center'>
                                <button
                                    onClick={() => {
                                           setSelectedTab('Profile');
                                           setSelectedCustomer({
                                               ...customer
                                           })
                                    }}
                                >
                                    <ParseSvgIcon
                                        className='h-6 w-6 hover:w-7 hover:h-7 transition-all duration-200'
                                        parseFill={true}
                                        fill={`var(--color-text)`}
                                        svg={`<svg fill="none" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M16 15.503A5.041 5.041 0 1 0 16 5.42a5.041 5.041 0 0 0 0 10.083zm0 2.215c-6.703 0-11 3.699-11 5.5v3.363h22v-3.363c0-2.178-4.068-5.5-11-5.5z"></path></g></svg>`}
                                    />
                                </button>
                                <button
                                    onClick={() => {
                                            setSelectedTab('Send Message');
                                            setSelectedCustomer({
                                               ...customer
                                           })
                                    }}
                                >
                                    <ParseSvgIcon
                                        className='h-5 w-5 ml-3  hover:w-7 hover:h-7 transition-all duration-200'
                                        parseFill={true}
                                        fill={`var(--color-text)`}
                                        svg={`<svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M11.42 9.49c-.19-.09-1.1-.54-1.27-.61s-.29-.09-.42.1-.48.6-.59.73-.21.14-.4 0a5.13 5.13 0 0 1-1.49-.92 5.25 5.25 0 0 1-1-1.29c-.11-.18 0-.28.08-.38s.18-.21.28-.32a1.39 1.39 0 0 0 .18-.31.38.38 0 0 0 0-.33c0-.09-.42-1-.58-1.37s-.3-.32-.41-.32h-.4a.72.72 0 0 0-.5.23 2.1 2.1 0 0 0-.65 1.55A3.59 3.59 0 0 0 5 8.2 8.32 8.32 0 0 0 8.19 11c.44.19.78.3 1.05.39a2.53 2.53 0 0 0 1.17.07 1.93 1.93 0 0 0 1.26-.88 1.67 1.67 0 0 0 .11-.88c-.05-.07-.17-.12-.36-.21z"></path><path d="M13.29 2.68A7.36 7.36 0 0 0 8 .5a7.44 7.44 0 0 0-6.41 11.15l-1 3.85 3.94-1a7.4 7.4 0 0 0 3.55.9H8a7.44 7.44 0 0 0 5.29-12.72zM8 14.12a6.12 6.12 0 0 1-3.15-.87l-.22-.13-2.34.61.62-2.28-.14-.23a6.18 6.18 0 0 1 9.6-7.65 6.12 6.12 0 0 1 1.81 4.37A6.19 6.19 0 0 1 8 14.12z"></path></g></svg>`}
                                    />
                                </button>
                                <button
                                    onClick={() => {
                                                setSelectedTab('Add Receipts'); 
                                                setSelectedCustomer({
                                                    ...customer
                                                })
                                            }
                                        }
                                >
                                    <ParseSvgIcon
                                        className='h-5 w-5 ml-3 hover:w-7 hover:h-7 transition-all duration-200'
                                        svg={`<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M9 9H15M9 12H15M9 15H15M5 3V21L8 19L10 21L12 19L14 21L16 19L19 21V3L16 5L14 3L12 5L10 3L8 5L5 3Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`}
                                    />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>}
        </div>:
        <div className="flex flex-col gap-4 h-[450px] items-center justify-center">
            <div className="h-20 w-20 animate-spin rounded-full border-4 border-gray-300 border-t-[var(--color-primary)]"></div>
            Loading...
        </div>
        }
        <div className={`fixed ${showSearchModal ? '' : 'hidden'} inset-0 bg-black/50 flex items-center justify-center z-30`}>
            <motion.div 
                className="bg-[var(--background)] flex flex-col relative  shadow-lg h-screen md:w-2xl md:h-[540px] w-screen"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                <div className='flex sticky bg-[var(--background)] top-0 left-0 w-full z-40'>
                    <input
                        id='searchTerm'
                        ref={searchRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                        onFieldChange('searchTerm', e.target.value);
                        }}
                        placeholder="Search customers..."
                        className="w-full outline-none p-2 border border-gray-300"
                    />
                    {
                        searchTerm &&
                        <button className='rounded-full h-4 w-4 absolute justify-center items-center right-20 top-3 flex bg-gray-300' onClick={() =>{
                            onFieldChange('searchTerm', '');
                            searchRef.current.focus();
                        }}>
                            <X className="h-4 w-4  text-white" />
                        </button>
                    }
                    <button className='p-2 bg-[var(--color-primary)]'
                        onClick={()=>{
                            reset();
                            setItems(searchFilter);   // or expose a setter from the hook
                            onFieldChange('searchTerm', searchTerm);
                        }}
                    >
                        <SearchIcon className="h-4 w-4 text-white" />
                    </button>
                    <button className='p-2 bg-red-600' onClick={() => { 
                            // setShowSearchModal(false); 
                            // setSearchTerm(''); 
                            // setSearchFilter([]); 
                            onFieldChange('searchTerm', '');
                            onFieldChange('searchFilter', []);
                            onFieldChange('showSearchModal', false);
                            
                        }}
                    >
                        <X className="h-4 w-4 text-white" />
                    </button>
                </div>
                {
                    searchLoading &&
                    <div className="flex flex-col gap-4 h-full items-center justify-center">
                        <div className="h-20 w-20 animate-spin rounded-full border-4 border-gray-300 border-t-[var(--color-primary)]"></div>
                        Searching...
                    </div>
                }
                {
                    searchFilter.length > 0 && searchTerm && !searchLoading &&
                    <div className='overflow-y-auto'>
                        <table className="min-w-full text-sm border-collapse table-fixed">
                            <tbody className="bg-[var(--color-card)] divide-y divide-gray-200">
                            {
                                searchFilter.map((customer) => (
                                    <tr
                                        key={`search-cust-${customer.id}`}
                                        className={`cursor-pointer text-[12pt] hover:bg-[var(--color-primary-hover)]`}
                                        onClick={()=>{
                                            reset();
                                            setItems([customer]);   // or expose a setter from the hook

                                            setShowSearchModal(false);
                                        }}
                                    >
                                        <td className="p-2 text-left">#{customer.serial_number}</td>
                                        <td className="p-2 flex items-center text-left">
                                            <ProfilePicture gender={customer.gender} ProfilePictureLink={customer.profile_picture} width='8' height='8' />
                                            <span className="ml-2">{`${customer.name}`}</span>
                                        </td>
                                        <td className="p-2 text-left">{customer.father_name}</td>
                                        <td className="p-2 text-left">{customer.contact}</td>
                                    </tr>
                                ))
                            }
                            </tbody>
                        </table>
                    </div>
                }
                
            </motion.div>
        </div>
    </motion.div>
  )
}

export const ProfilePicture = ({ gender, ProfilePictureLink, width='24', height='24' }) => {
    return (
        <img
            src={
                ProfilePictureLink
                    ? ProfilePictureLink
                    : gender === 'male' || gender === "'Male'::text" || gender === 'MALE' || gender === 'Male'
                        ? '/images/male-avatar.jpg'
                        : '/images/female-avatar.jpg'
            }
            alt="Profile Picture"
            className={`rounded-full object-cover w-${width} h-${height}`}
        />
    );
}

const reduceString = (str, maxLength) => {
    if (!str) return '';
    if (str.length <= maxLength) {
        return str;
    }
    return str.slice(0, maxLength) + '...';
}
const checkDate = (dateString) => {
    let parts = dateString.split('-');
    if(parts.length !== 3) return dateString;
    else{
        dateString = `${parts[2]}-${parts[1]}-${parts[0]}`;
        return dateString;
    }
}
export function formatTransactionOrDate (item){
    if(!item) return 'N/A'
    const isInteger = Number.isInteger(item);
    if(typeof item === 'string' && isInteger) return item;
    if(isInteger) return item + '/-';
    const isDate = !isNaN(Date.parse(item));
    // DATE FORMAT IS 30, MAY, 2023
    return isDate ? new Date(item).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : item;
}
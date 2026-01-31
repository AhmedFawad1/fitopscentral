'use client'
import { ArrowBigLeft, Menu, X } from 'lucide-react'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useDispatch, useSelector } from 'react-redux'
import { setLocalUpdate, setSelectedFilter, setSelectedTab } from '@/store/authSlice'
import Logo from '@/app/site-components/Logo'
import { supabase } from '@/app/lib/createClient'
import { navItems } from '@/app/lib/functions'
import ParseSvgIcon from '@/app/site-components/ParseSvgIcon'

export default function Sidebar({open , setOpen, setIsSigningOut, pageView, setPageView, onSignout}) {
  const router = useRouter();
  const selected = useSelector((state) => state.auth.selectedTab);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [items, setItems] = React.useState(navItems);
  const appConfig = useSelector((state) => state.profile.tauriConfig);
  useEffect(()=>{
     if(selected !== 'customers'){
        dispatch(setSelectedFilter('total members'));
     }else if(selected === 'expenses'){
        console.log('selected expenses')
        setPageView(prev => {
          let contains = pageView.some(p => p.key === 'expenses');
          if(contains) return prev;
          return [
            ...prev,
            {
              key: 'expenses',
              tab: 'expenses'
            }
          ];
        });
     }
     else{
        let contains = pageView.some(p => p.key === 'customers');
        if(contains) return;
        setPageView(prev => {
          // Case 1: only one page → REPLACE it
          if (prev.length === 1) {
            return [
              {
                key: 'customers',
                tab: 'Customers'
              }
            ];
          }else{
            // Case 2: multiple pages → ADD a new one
            return [
              ...prev,
              {
                key: 'customers',
                tab: 'Customers'
              }
            ];
          }
        });
     }
     
     dispatch(setLocalUpdate(false))
  }, [selected]);
  useEffect(()=>{
    // Filter nav items based on user role
    if(!user || !appConfig) return;
    const filteredItems = {...navItems};
    let roleManager = user?.role_manager;
    if(!roleManager) return
    roleManager = roleManager[user.role]
    //alert(!roleManager.canAddUsers)
    if(!appConfig?.biometricapp){
        delete filteredItems['Attendance'];
        delete filteredItems['Device Logs'];
    }
    if(!roleManager.canAddUsers){
       delete filteredItems['Users'];
    }
    if(!roleManager.canViewReports){
        delete filteredItems['Sales Legure'];
    }
    if(!roleManager.canManageExpenses){
        delete filteredItems['Expenses'];
    }
    if(!roleManager.canManagePackages){
        delete filteredItems['Packages'];
    }
    if(!roleManager.canManageStaff){
        delete filteredItems['Staff Management'];
    }
    if(!roleManager.canManageTemplates){
        delete filteredItems['Templates'];
    }
    setItems(filteredItems);
  }, [user, appConfig]);
  
  return (
    <div
      className={`
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${open ? 'lg:w-60 w-full' : 'lg:w-16'}
        group
        bg-(--sidebar-bg)
        border-r border-(--sidebar-border)
        fixed lg:static top-0 left-0 h-screen 
        transition-all duration-300 flex flex-col
      `}
    >
      {/* Header */}
      <div
        className={`flex items-center ${
          open ? 'justify-around' : 'justify-center'
        } py-4 border-b border-(--color-border)`}
      >
        <div className={`flex gap-2 justify-center ${open && 'items-center'}`}>
          {open && <Logo width={30} height={30} usePrimary={true} />}
          <span className={`font-bold text-white ${!open && 'hidden'}`}>
            Fitopscentral
          </span>
        </div>
        <button
          aria-label="Toggle Sidebar"
          onClick={() => setOpen(!open)}
          className="text-white hidden lg:block p-2 focus:outline-none"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <button
          onClick={() => setOpen(!open)}
          className="text-white absolute left-5 block lg:hidden p-2 focus:outline-none"
        >
          { open ? <ArrowBigLeft size={20} /> : null}
        </button>
      </div>
        <div className='flex flex-col justify-center'>
          {
            Object.entries(items).map(([key, item], index) => (
              <div key={index} className={`flex transition-color duration-300 ${selected === item.state ? 'bg-(--sidebar-hover-bg)' : ''} items-center gap-3 p-3 hover:bg-(--sidebar-hover-bg) cursor-pointer`}
                onClick={async () => {
                    if (key === 'Signout') {
                      onSignout();
                      return;
                    }

                    setPageView(prev => {
                      // Case 1: only one page → REPLACE it
                      if (prev.length === 1) {
                        return [
                          {
                            key: item.state,
                            tab: item.label ?? item.title ?? item.state
                          }
                        ];
                      }

                      // Case 2: multiple pages → ADD if missing
                      if (prev.some(p => p.key === item.state)) {
                        return prev;
                      }

                      return [
                        ...prev,
                        {
                          key: item.state,
                          tab: item.label ?? item.title ?? item.state
                        }
                      ];
                    });

                    dispatch(setSelectedTab(item.state));
                    setOpen(false);
                  }}

                onContextMenu={(e) => {
                    e.preventDefault();

                    setPageView(prev => {
                      if (prev.some(p => p.key === item.state)) return prev;

                      return [
                        ...prev,
                        {
                          key: item.state,
                          tab: item.label ?? item.title ?? item.state
                        }
                      ];
                    });

                    dispatch(setSelectedTab(item.state));
                  }}

              >
                <div className='relative justify-center w-full lg:justify-start flex gap-4 max-h-5 left-2'>
                  <div>{item.largeIcon?
                    <ParseSvgIcon
                      svg={item.largeIcon}
                      parseFill={true}
                      fill={`var(--svg-light-fill)`}
                      className='h-6 w-6'
                    />
                  : item.smallIcon}</div>
                  <span className={`text-white text-nowrap ${open ? 'opacity-100' : 'lg:opacity-0'} transition-opacity duration-400`}>{key}</span>
                </div>
              </div>
            ))
          }
        </div>
    </div>
  )
}

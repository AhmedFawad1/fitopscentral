
'use client'
import React, { useEffect, useState } from 'react'
import Sidebar from './AppComponents/Sidebar'
import { ConfirmProvider } from '@/hooks/useConfirm';
import Loading from './AppComponents/Loading';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '@/store/authSlice';
import LicenseErrorScreen from './AppComponents/LicenseErrorScreen';
import SuccessModal from './AppComponents/SuccessModal';
import ChartsPage from './AppComponents/Charts';
import PackagesContainer from './Pages/packages/PackagesContainer';
import StaffContainer from './Pages/staff/StaffContainer';
import TemplateContainer from './Pages/templates/TemplateContainer';
import UserContainer from './Pages/users/UserContainer';
import ExpensesContainer from './Pages/expenses/ExpensesContainer';
import AdmissionsContainer from './Pages/admissions/AdmissionsContainer';
import CustomersContainer from './Pages/customers/CustomersContainer';
import DashboardContainer from './Pages/dashboard/DashboardContainer';
import SalesContainer from './Pages/saleslegure/SalesContainer';
import WhatsappContainer from './Pages/whatsapp/WhatsappContainer';
import { useWhatsappManager } from './Pages/whatsapp/useWhatsappManager';
import WhatsappUI from './Pages/whatsapp/WhatsappUI';
import { whatsappService } from './Pages/whatsapp/whatsappService';
import { resourceServices } from './resourceServices';
import { useResourcesManager } from './useResourcesManager';
import DeviceContainer from './Pages/devicelogs/DeviceContainer';
import AttendanceUI from './Pages/devicelogs/AttendanceUI';
import ReceiptContainer from './Pages/Receipts/ReceiptContainer';
import useDataManager from './Services/useDataManager';
import { useSessionManager } from './useSessionManager';
import LoginUI from './LoginUI';
import { sessionServices } from './sessionServices';
export default function PageContent() {
  const dispatch = useDispatch();
  const {
    user,
    loading,
    licenseError,
    checkingSession,
    email,
    setEmail,
    password,
    setPassword,
    signingIn,
    error,
    handleLogin,
    onSignout,
    isSigningOut
  } = useSessionManager()
  const [pageView, setPageView] = useState([
      { key: 'dashboard', tab: 'Dashboard' }
    ]);
  const dataManager = useDataManager({ user: user?.gym_id ? user : null });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedTab, setSelectedTab] = useState('Profile');
  const selected = useSelector((state) => state.auth.selectedTab);
  const showProgress = useSelector((state) => state.profile.showProgress);
  const showBroadcastMessage = useSelector((state) => state.profile.showBroadcastMessage);
  const [open, setOpen] = useState(false);
  // const logic = useWhatsappManager({ user, whatsappService });
  const resourcesManager = useResourcesManager({ dispatch, user, resourceServices });
  
  useEffect(()=>{
    setPageView([{
      key: selected.toLowerCase(),
      tab: selected.charAt(0).toUpperCase() + selected.slice(1)
    }])
  },[selected])
  
  return checkingSession?
  (<Loading />):
  !user?
  (<LoginUI 
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      signingIn={signingIn}
      error={error}
      handleLogin={handleLogin}
  />):
  isSigningOut?
  (
        <div className="h-screen w-screen flex flex-col items-center justify-center gap-4">
                <div className="h-20 w-20 animate-spin rounded-full border-4 border-gray-300 border-t-[var(--color-primary)]" />
                <span className="font-bold">Signing you out. Please wait...</span>
        </div>
  ):
  licenseError?
  (
    <LicenseErrorScreen
          message={licenseError}
          onRetry={async ()=>{
            // Retry logic: clear user and re-bootstrap
            dispatch(setUser(null));
            window.location.reload();
          }}
        />
  ):
  (
    <ConfirmProvider>
      <SuccessModal />
      <AttendanceUI setSelectedTab={setSelectedTab} setSelectedCustomer={setSelectedCustomer} attendanceCard={resourcesManager.attendanceCard} setAttendanceCard={resourcesManager.setAttendanceCard} />
      {
        showProgress &&
        <ChartsPage />
      }
      {
        selectedCustomer &&
        <ReceiptContainer
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      }
      {
        <div className="flex w-screen h-screen overflow-hidden">
          <Sidebar 
            setPageView={setPageView} 
            setOpen={setOpen} 
            pageView={pageView} 
            open={open} 
            isSigningOut={isSigningOut}
            onSignout={onSignout}
            />
            <div className="h-full w-full min-w-0 overflow-y-auto overflow-x-hidden">
              {
                pageView[0]?.key === 'dashboard' ?
                <DashboardContainer /> :
                pageView[0]?.key === 'customers' ?
                <CustomersContainer 
                  setSelectedCustomer={setSelectedCustomer}
                  setSelectedTab={setSelectedTab}
                  config={resourcesManager.config}
                /> :
                pageView[0]?.key === 'new-admission' ?
                <AdmissionsContainer /> :
                pageView[0]?.key === 'packages' ?
                <PackagesContainer /> :
                pageView[0]?.key === 'staff-management' ?
                <StaffContainer /> :
                pageView[0]?.key === 'expenses' ?
                <ExpensesContainer /> :
                pageView[0]?.key === 'templates' ?
                <TemplateContainer /> :
                pageView[0]?.key === 'users-management' ?
                <UserContainer /> :
                pageView[0]?.key === 'sales-legure' ?
                <SalesContainer /> :
                pageView[0]?.key === 'device-logs' ?
                <DeviceContainer /> :
                null
              }
              
              <WhatsappContainer show={pageView[0]?.key === 'whatsapp-automation'} />
            </div>
        </div>
      }
    </ConfirmProvider>
  )
}

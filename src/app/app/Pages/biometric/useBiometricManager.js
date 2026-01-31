'use client'
import { setSuccessModal } from '@/store/authSlice';
import { useEffect, useState } from 'react'

export function useBiometricManager({
    dispatch,
    customer,
    biometricService,
    realDeviceEvents,
    biometricTemplate,
    setAllowEscape,
    receiptService
}) {
  const [message, setMessage] = useState('')
  const [registring, setRegistring] = useState(false)
  const [config, setConfig] = useState(null);
  const isZkDevice = config?.biometricapp?.toLowerCase().includes('zk');
  const isSecugenDevice = config?.biometricapp?.toLowerCase().includes('secugen');
  
  const startRegistration = () => {
     setRegistring(true);
     setMessage('Registration started. Please follow the instructions on the biometric device.')
     //console.log(config)
     if (isZkDevice) {
        // Start ZK device registration logic
        biometricService.zkRegisterUser(customer.serial_number, customer.name);
     }else{
         biometricService.secugenRestartService(1); // Ensure SecuGen service is running
     }
     setAllowEscape(false);
  }

  const cancelRegistration = () => {
    setRegistring(false);
    if(isZkDevice){
        biometricService.zkStopEnroll();
    }else{
        biometricService.secugenRestartService(0); // Stop SecuGen enrollment
    }
    setMessage('Registration cancelled.')
    setAllowEscape(true);
  }

  const saveRegistration = () => {
      // Implement saving biometric data logic here
      let template = biometricTemplate.Template;
      receiptService.addBiometricTemp({ biometric_data: template, id: customer.id }, customer.gym_id);
      dispatch(setSuccessModal({
        message: 'Biometric data saved successfully.',
        visible: true
      }))
  }

  const deleteRegistration = () => {
      if(isZkDevice){
        biometricService.zkDeleteUser(customer.serial_number);
        //setMessage('✅ User deleted from device.')
      }
  }

  const parseLogs = ()=>{
    let latest = realDeviceEvents[0];
    console.log("Latest Device Event:", latest);
    if(latest?.type === 'error'){
       switch(latest.data?.message){
          case 'StartEnroll failed':
              setMessage('❌ User already registered on device.');
              setAllowEscape(true);
              setRegistring(false);
              break;
          case 'DeleteUser failed':
              setMessage('❌ User not found on device.');
              break;
          default:
              setMessage(`❌ Error: ${latest.data?.message}`);
              break;
        }
        setRegistring(false);
    }else if(latest?.type === 'delete_user'){
        if(latest.data?.success){
            setMessage('✅ User deleted from device.');
        }else{
            setMessage('❌ Failed to delete user from device.');
        }
    }else if(latest?.type === 'enroll_start'){
        setMessage('👆 Please provide your biometric input on the device.');
    }else if(latest?.type === 'enroll_done'){
        if(latest.data?.result === 0){
            setMessage('✅ Registration successful!');
        }else{
            setMessage('❌ Registration Timeout. Please try again.');
        }
        setRegistring(false);
        setAllowEscape(true);
    }
  }
  
  useEffect(() => {
    // Load configuration on mount
    async function fetchConfig() {
      const cfg = await biometricService.getConfig();
      setConfig(cfg);
    }
    fetchConfig();
  }, []);

  useEffect(() => {
    parseLogs();
  }, [realDeviceEvents]);
  return {
    message,
    registring,
    setRegistring,
    setMessage,
    startRegistration,
    cancelRegistration,
    deleteRegistration,
    saveRegistration 
  }
}

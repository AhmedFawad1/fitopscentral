import React, { useEffect } from 'react'
import BiometricUI from './BiometricUI'
import { useBiometricManager } from './useBiometricManager';
import { useDispatch, useSelector } from 'react-redux';
import { biometricService } from './biometricService';
import { receiptService } from '../Receipts/receiptService';
export default function BiometricContainer({
    customer,
    formValues,
    onFieldChange,
    setAllowEscape
}) {
  
    const realDeviceEvents = useSelector(s => s.profile.realDeviceEvents);
    const dispatch = useDispatch();
    const biometricTemplate = useSelector(s => s.profile.biometricTemplate);
    const app = useSelector(s => s.profile.tauriConfig?.biometricapp);
    const logic = useBiometricManager({
      customer,
      biometricService,
      receiptService,
      dispatch,
      realDeviceEvents,
      biometricTemplate,
      setAllowEscape,
    });
  return (
    <BiometricUI 
        {...logic} 
        biometricTemplate={biometricTemplate}
        app={app}
    />
  )
}

import { useRuntime } from "@/hooks/useRuntime";
import { addAttendanceLog, addEventLog, setAttendanceID, setBiometricTemplate, setDeviceStatus, setRealDeviceEvents, setTauriConfig, setUpsertAttendance } from "@/store/profileSlice";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { mig } from "../lib/migrations";
export function useResourcesManager({
    dispatch,
    user,
    resourceServices
}) {
  // Placeholder for resource management logic
  const [memberStatus, setMemberStatus] = useState(null);
  const logs = useSelector((state) => state.profile.eventLogs);
  const mode = useSelector((state) => state.profile.mode);
  const [packages, setPackages] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const { isTauri, isWeb, isReady } = useRuntime();
  const [showEnlargedPhoto, setShowEnlargedPhoto] = useState(false);
  const [customerIn, setCustomerIn] = useState(null);
  const gymId = user?.gym_id;
  const branchId = user?.branch_id;
  const [config, setConfig] = useState(null);
  const App = config?.biometricapp;
  const Ip = config?.ip;
  const Port = config?.port;
  const initializedRef = useRef(false);
  const lastUpdateRef = useRef(Date.now());
  const fpUnlistenRef = useRef(null); 
  const secugenListenerAttachedRef = useRef(false);

  const [attendanceCard, setAttendanceCard] = useState(null);

  function pushLog(msg) {
     const next = [...logs, `[${new Date().toLocaleTimeString()}] ${msg}`];
     dispatch(addEventLog(next.slice(-20)));
  }

  function handleDeviceEvent(evt) {
    
    if (!evt) return;
    lastUpdateRef.current = Date.now();
    //console.log("Device Event Received:", evt);
    // attendance logs
    if(App ==='ZKBridge.exe'){
      //console.log("Handling ZK Event:", evt.type);
      if (evt.type === "attendance") {
        ////console.log("Attendance event:", evt.data);
        
        handleAttendanceEvent(evt.data.enroll);
        pushLog(`Scan Record: UserID ${evt.data.enroll}, Time ${evt.data.ts}`);
        return
      }
      if (evt.type === 'devicetime'){
        if(evt.data?.message === 'Device failed to return time'){
            restartService();
            return
        }
        dispatch(setDeviceStatus("connected"));
        pushLog(`Device Time: ${evt.data.d}:${evt.data.m}:${evt.data.y}  ${evt.data.h}:${evt.data.m}:${evt.data.s}`);
        return
      }
      // connection success
      if (evt.type === "connect" && evt.data?.success) {
        dispatch(setDeviceStatus("connected"));
        pushLog("Device connected.");
      }
      
      // any device-time or stderr logs
      if(evt.type !== "devicetime"){
        pushLog(JSON.stringify(evt));
      }
    }else {
       switch(evt.type) {
          case "status":
            pushLog(`Device Message: ${evt.data}`);
            dispatch(setDeviceStatus("connected"));
            break;
          case "finger_match":
            if(evt.data?.IsMatch){
                handleAttendanceEvent(evt.data?.BestUserId.toString());
                pushLog(`✅ Fingerprint matched: UserID ${evt.data?.BestUserId}`);
            }else{
                invoke("play_sound", { status: "Denied" }).catch((err) => {
                  console.error("Sound Error: " + err);
                });
            }
            break;
          case "finger_base64":
            dispatch(setBiometricTemplate({
              ...evt.data
            }))
            break;
          case "stderr":
            pushLog(`Device Error: ${evt.data}`);
            break;
          default:
            //console.log("Unhandled Secugen Event:", evt);
            break;
        }
    }
  }

  async function fetchMemberStatus(){
     let data = await resourceServices.fetchStatus(gymId, branchId);

     let dataObj = data.reduce((acc, curr) => {
        acc[curr.serial_number] = curr.current_status || curr.status;
        return acc;
     }, {});
     setMemberStatus(dataObj);
  }
  async function restartService() {
        if(!App) return;
        if(App ==='ZKBridge.exe') {
            try {
                await resourceServices.restartZKService(Ip, Port);
                //console.log("ZK Service restarted and connected");
            } catch (error) {
                //console.log("Error restarting ZK Service:", error);
            }
        }else{
             try {   
                 await resourceServices.restartSecugenService(mode);
                 //console.log("Secugen Service restarted");
             } catch (error) {
                 //console.log("Error restarting Secugen Service:", error);
             }
        }
  }

  async function initSecugenListener() {
    if (secugenListenerAttachedRef.current) {
      //console.log("SecuGen listener already attached — skipping");
      return;
    }

    secugenListenerAttachedRef.current = true;

    pushLog("Waiting for FP backend readiness…");

    await Promise.race([
      new Promise((resolve) => listen("fp_ready", () => resolve())),
      new Promise((resolve) => setTimeout(resolve, 800)),
    ]);

    pushLog("⏳ Shell stream ready — attaching listener…");

    fpUnlistenRef.current = await listen("fp_event", (event) => {
      handleDeviceEvent(event.payload);
    });

    pushLog("🎉 FP listener attached successfully");
  }

  async function ConnectApp() {
      if(!App ) return
      let appExists = await invoke("is_app_running", { appName: App });
      if(!appExists){
        let result = await resourceServices.startService(App, Ip, Port);
       
        if(result.success){
            pushLog(`${App} started successfully.`);
        }      

        let unlisten = null;

        // Listen to device events
        try {
            if(App ==='ZKBridge.exe'){
                listen("zk_event", (event) => {
                  handleDeviceEvent(event.payload);
                  dispatch(setRealDeviceEvents(event.payload));
              }).then((fn) => (unlisten = fn));
            }else{
              //console.log("Initializing Secugen Listener...");
               await initSecugenListener();
            }
        } catch (error) {
          //console.log("Failed to listen to zk_event:", error);
        }

        return () => {
          if (unlisten) unlisten();
        };
      }else{
        if(App ==='ZKBridge.exe'){
          let ping = await resourceServices.pingDevice(Ip, Port);
          if(ping.success){
              pushLog("ZK Device ping successful");
          }else{
              restartService();
              return;
          }
            
          let unlisten = null;

          // Listen to device events
          try {
            listen("zk_event", (event) => {
              handleDeviceEvent(event.payload);
              dispatch(setRealDeviceEvents(event.payload));
            }).then((fn) => (unlisten = fn));
          } catch (error) {
            //console.log("Failed to listen to zk_event:", error);
          }

          return () => {
            if (unlisten) unlisten();
          };
        }else{
            await initSecugenListener();
        }
      }
  }

  async function handleAttendanceEvent(id) {
      ////console.log("Handling Attendance for ID:", id);
      
      resourceServices.openGate(config.useArduino, memberStatus ? memberStatus[parseInt(id)] : 'Active');
      let data = await resourceServices.getProfile(gymId, branchId, id);
    
      ////console.log("Fetched Profile Data:", data);
      if(data){
         if(data.type === 'member'){
            data.membership_history = typeof data.membership_history === 'string' ? JSON.parse(data.membership_history) : data.membership_history;  
            let balanceDue = isBalanceDue(data.balance, data.last_transaction_date, config);
            if(balanceDue && data.current_status === 'Active'){
               data.current_status = 'balance_due';
            }
            resourceServices.playSound(data.current_status);
            resourceServices.markAttendance(gymId, branchId, data.serial_number, data.current_status);
         }else{
            if(data.is_active){
                resourceServices.playSound('Active');
                resourceServices.openGate(config.useArduino, 'Active');
                resourceServices.markStaffAttendance(gymId, branchId, data.id);
            }
         }
         console.log("Attendance Data:", data);
         
         setAttendanceCard(data);
      }
  }
  
  useEffect(() => {
    async function fetchConfig() {
        let resp = await resourceServices.getConfig(gymId, branchId)
        setConfig(resp);
        dispatch(setTauriConfig(resp));
        let { packages, trainers, templates } = await resourceServices.fetchDataSQLite(gymId, branchId);
        setPackages(packages);
        setTrainers(trainers);
        setTemplates(templates);
        await resourceServices.alterChanges(mig.migrate, mig.version)
    }
    if(!user || isWeb ) return;
    fetchConfig();
    fetchMemberStatus()
  },[user]);

  useEffect(() => {
    if(!isReady || !isTauri || !user) return;
    if (config && !initializedRef.current) {
        initializedRef.current = true;
        ConnectApp();
    }
  }, [config, isReady, user]);

  useEffect(() => {
    if (config?.biometricapp !== 'SecuGenDemo.exe' || !isReady || !isTauri || !user) return;
    
    initSecugenListener();

    const timer = setInterval(() => {
      const now = Date.now();
      if (now - lastUpdateRef.current > 60000) {
        dispatch(setDeviceStatus("disconnected"));
      }
    }, 30000);

    return () => {
      clearInterval(timer);

      if (fpUnlistenRef.current) {
        fpUnlistenRef.current();
        fpUnlistenRef.current = null;
      }

      secugenListenerAttachedRef.current = false;
    };
  }, [config?.biometricapp, isReady, user]);

  return {
    gymId,
    branchId,
    config,
    logs,
    packages,
    trainers,
    templates,
    attendanceCard,
    setAttendanceCard,
    showEnlargedPhoto,
    setShowEnlargedPhoto,
    customerIn,
    setCustomerIn,
    ConnectApp
  };
} 

function isBalanceDue(balance, last_txn_date, app) {
    if (balance <= 0) return false;
    const today = new Date();
    const lastTxnDate = new Date(last_txn_date);
    const diffTime = Math.abs(today - lastTxnDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > (app.balanceLock ? parseInt(app.balanceLock) : 3);
}
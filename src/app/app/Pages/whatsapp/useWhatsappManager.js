
import { setSuccessModal } from "@/store/authSlice";
import { setEngineStatus, setToast } from "@/store/profileSlice";
import { useEffect, useRef, useState } from "react";
import QRCode from 'qrcode';
export function useWhatsappManager({ 
  user, 
  whatsappService, 
  confirm,
  dispatch
}) {
  const [state, setState] = useState("idle"); // backend state
  const [qr, setQr] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [obj, setObj] = useState(null);
  const [ready, setReady] = useState(false);
  const pollRef = useRef(null);
  const connectingRef = useRef(false);
  const wsRef = useRef(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const enabled = !!user && user.tier >= 8;
  const gymId = user?.gym_id;
  const branchId = user?.branch_id;
  /* ------------------ fetch history ------------------ */
  const [sendingMessage, setSendingMessage] = useState(true);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);


  const fetchHistory = async () => {
    
  }
  /* ------------------ send message ------------------ */
  const sendMessage = async (number, text) => {
    if (!gymId) return;
    if (!branchId) return [];
    setSendingMessage(true);
    try {
      wsRef.current.send(
          JSON.stringify({
            type: 'send',
            number: number,
            text: text,
          })
        );
    } catch (err) {
      console.error("SEND_MESSAGE_ERROR", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const resendMessage = async (message) => {
    if (!gymId) return;
    if (!branchId) return [];
    setSendingMessage(true);
    try {
      // let resp =await whatsappService.apiFetch(
      //   `/messages/${gymId}/${branchId}/${message.id}/retry`,
      //   {
      //     method: "POST"
      //   }
      // );
        console.log("RESEND_MESSAGE_RESPONSE", resp);
        
    }
    catch (err) {
      // console.log(confirm)
       await confirm(
         `An error occurred while retrying the message: ${err}`,
         'Retry Message',
        'Error',
        false,
        'OK'
       )
    } finally {
      setSendingMessage(false);
    }
  };

  const connectWS = () => {
    if (wsRef.current) return;

    const connect = () => {
      const ws = new WebSocket('ws://localhost:8810');

      ws.onopen = () => {
        wsRef.current = ws;
        setState('CONNECTED');
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if(msg.ready === true || msg.ready === false){
            setReady(msg.ready);
        }
        if(msg.queueSize !== undefined){
            setObj(msg);
        }
        switch (msg.type) {
          case 'qr': {
            const dataURL = await QRCode.toDataURL(msg.qr);
            setState('AUTH_REQUIRED');
            setQr(dataURL);
            break;
          }
          case 'ready':
            setQr(null);
            setState('READY');
            break;

          case 'internet':
              if (!msg.up) {
                dispatch(setToast({
                  type: 'error',
                  message: 'Internet connection lost. Messages will be queued 📦'
                }));
                console.log(msg)
                dispatch(setEngineStatus('Internet Disconnected 🌑'));
              } else {
                dispatch(setToast({
                  type: 'success',
                  message: 'Internet restored. Sending queued messages 🚀'
                }));
                dispatch(setEngineStatus('Internet Connected 🌐'));

                // auto-clear success toast after a bit
                setTimeout(() => dispatch(clearToast()), 3000);
              }
          break;


          case 'health':
            if(msg.phase === 'NEED_QR'){
               setState('AUTH_REQUIRED');
            } else if(msg.phase === 'READY'){
               setState('READY');
            }else if(msg.phase === 'CONNECTED'){
                setState('CONNECTED');
            }
            if(!msg.internetUp){
              dispatch(setToast({
                type: 'error',
                message: 'Internet connection lost. Messages will be queued 📦'
              }));
              dispatch(setEngineStatus('Internet Disconnected 🌑'));
            }else if(!msg.ready){
               dispatch(setToast({
                type: 'error',
                message: 'WhatsApp is not ready. Messages will not be sent'
              }));
              dispatch(setEngineStatus('WhatsApp Not Ready ❌'));
            }else if(msg.ready && msg.internetUp){
              // dispatch(setToast({
              //   type: 'success',
              //   message: 'WhatsApp is ready and internet is up. Messages will be sent 🚀'
              // }));
            }
            break;

          case 'queued':
            setState('Message queued 📦');
            break;

          case 'sent':
            setState('Message sent ✅');
            break;

          case 'send_retry':
            setState(`Retrying message (${msg.attempts})…`);
            break;

          case 'send_failed':
            setState('Message failed ❌');
            break;

          // ----------------------------
          // ENGINE / RESTART LIFECYCLE
          // ----------------------------
          case 'reconnecting':
            dispatch(setEngineStatus('Reconnecting WhatsApp… ♻️'));
            dispatch(setToast({
              type: 'warning',
              message: 'WhatsApp reconnecting… ♻️'
            }));
            break;

          case 'status':
            if (msg.message === 'engine_restart') {
              dispatch(setEngineStatus('Restarting WhatsApp Engine 🔄'));
              dispatch(setToast({
                type: 'warning',
                message: 'Engine restarting to recover 🛠️'
              }));
            }
            break;

          // ----------------------------
          // 🧠 ENGINE METRICS (NEW)
          // ----------------------------
          case 'engine_metrics': {
            const {
              restartsTotal,
              lastRestartAt,
              restartReasons,
              lastSuccessfulSendAt
            } = msg;

            // Optional: store in redux if you have a slice
            // dispatch(setEngineMetrics(msg));

            // 🚨 Detect instability
            if (restartsTotal >= 3) {
              dispatch(setToast({
                type: 'warning',
                message: `Engine restarted ${restartsTotal} times ⚠️ Possible instability`
              }));
            }

            // 🟢 Reassurance UX
            if (lastSuccessfulSendAt) {
              dispatch(setEngineStatus('Engine healthy 🟢 Messages flowing'));
            }
            break;
          }

          // ----------------------------
          // SHUTDOWN
          // ----------------------------
          case 'shutdown':
            dispatch(setEngineStatus('Engine stopped 🧯'));
            dispatch(setToast({
              type: 'error',
              message: 'WhatsApp Engine stopped 🧯'
            }));

          case 'shutdown':
            dispatch(setEngineStatus('Engine stopped 🧯'));
            break;

          default:
            break;
        }
      };

      ws.onerror = () => ws.close();

      ws.onclose = () => {
        wsRef.current = null;
        setTimeout(connect, 1000);
      };
    };

    connect();
  };
  /* ------------------ session lifecycle ------------------ */

  useEffect(() => {
    if (!enabled || connectingRef.current) return;

    connectingRef.current = true;
    setState('INITIALIZING');
    try{
      whatsappService.startEngine().then(() => setTimeout(connectWS, 800)).catch((err) => {
        console.error(err);
        connectingRef.current = false;
        setState('FAILURE');
      });
    }catch(err){
      console.log(err);
       setState('FAILURE');
    }
  }, [enabled]);

  /* ------------------ derived flags ------------------ */
  return {
    state, // raw backend state
    qr,
    isConnected: state === "CONNECTED" || state === "READY",
    isAwaitingQr: state === "AUTH_REQUIRED",
    isInitializing: state === "INITIALIZING",
    disabled: !enabled,
    sendMessage,
    fetchHistory,
    history,
    loadingHistory,
    historyError,
    selectedMessage,
    setSelectedMessage,
    sendingMessage,
    resendMessage,
    ready,
    obj
  };
}

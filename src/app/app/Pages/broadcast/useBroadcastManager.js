'use client';

import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { invoke } from '@tauri-apps/api/core';

import {
  buildAudienceQuery,
  buildCustomFilterQuery,
  replaceTags,
} from './broadcastService';
import { setSendMessage } from '@/store/profileSlice';
import { useDashboardRealtime } from '../dashboard/useDashboardRealtime';
import { useRuntime } from '@/hooks/useRuntime';
import { validatePhoneNumber } from '@/app/lib/data/countries';

export function useBroadcastManager({ onClose }) {
  const dispatch = useDispatch();
  const { gym_id, branch_id, role } = useSelector((s) => s.auth.user || {});
  const { isReady, isWeb } = useRuntime();
  const { dashboard, loading } = useDashboardRealtime({
        permissions: role,
        gymId : gym_id,
        branchId: branch_id,
        role,
        isReady,
        isWeb
    });

  const user = useSelector((s) => s.auth.user);
  const gymid = user?.gym_id;
  const testmode = useSelector((s) => s.profile?.testmode);

  const [templates, setTemplates] = useState([]);

  const stopRef = useRef(false);

  const [step, setStep] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [filter, setFilter] = useState(null);
  const [delay, setDelay] = useState(15000);
  const [trashList, setTrashList] = useState([]);
  const [totalAudience, setTotalAudience] = useState(0);

  const onHandleChange = (field, value) => {
    switch (field) {
        case 'step':
            setStep(value);
            break;
        case 'isMinimized':
            setIsMinimized(value);
            break;
        case 'selectedAudience':
            setSelectedAudience(value);
            break;
        case 'selectedTemplate':
            setSelectedTemplate(value);
            break;
        case 'customMessage':
            setCustomMessage(value);
            break;
        case 'filter':
            setFilter(value);
            break;
        case 'delay':
            setDelay(value);
            break;
        case 'stopRef':
            stopRef.current = value;
            break;
        case 'changeStatus':
            setFilteredMembers(prev =>
                prev.map(m =>
                    m.serial_number === member.serial_number
                    ? { ...m, STATUS: value }
                    : m
                )
            );
            break;
        default:
            console.warn(`Unhandled field: ${field}`);
            break;
    }
  }

  const sendMessages = async () => {
    if (isSending || filteredMembers.length === 0) return;
    let template = templates.find(t => t.id === selectedTemplate);
    
    setIsSending(true);
    stopRef.current = false;  // reset stop flag
    // Snapshot list, prevents mutation during removal
    const queue = [...filteredMembers];
    

    for (let idx = 0; idx < queue.length; idx++) {
        let errorMessage = null;

        // STOP CHECK
        if (stopRef.current) break;

        const member = queue[idx];
      
        // mark sending
        setFilteredMembers(prev =>
          prev.map(m =>
            m.serial_number === member.serial_number
              ? { ...m, STATUS: "sending" }
              : m
          )
        );

        // process
        if (!member.BLOCKED && member.contact?.length > 5) {
          let contact = validatePhoneNumber(member.contact) || '';
          //return
          try {
            let message = template ? replaceTags(template.content, member) : customMessage;
            dispatch(setSendMessage({ number: testmode ? "923328266209" : contact, text: message }));
            await new Promise((res) => setTimeout(res, delay));
          } catch (err) {
            errorMessage = err?.message || String(err);
            console.error("WhatsApp error:", errorMessage);
          }
        }

        if (stopRef.current) break;

        // SUCCESS
        if (!errorMessage) {
          setFilteredMembers(prev =>
            prev
              .map(m =>
                m.serial_number === member.serial_number
                  ? { ...m, STATUS: "sent" }
                  : m
              )
              .filter(m => m.serial_number !== member.serial_number)
          );

          setTrashList(prev => [...prev, { ...member, STATUS: "sent" }]);
        }

        // FAILURE → Keep in list + show real error
        else {
          setFilteredMembers(prev =>
            prev.map(m =>
              m.serial_number === member.serial_number
                ? { ...m, STATUS: `Error: ${errorMessage}` }
                : m
            )
          );

          // Do NOT move to trash
        }
    }
    setStep(3);

    setIsSending(false);
  };
  const onGetValue = (field) => {
    switch (field) {
        case 'step':
            return step;
        case 'isMinimized':
            return isMinimized;
        case 'selectedAudience':
            return selectedAudience;
        case 'selectedTemplate':
            return selectedTemplate;
        case 'customMessage':
            return customMessage;
        case 'filter':
            return filter;
        case 'delay':
            return delay;
        case 'user':
            return user;
        case 'gymid':
            return gymid;
        case 'isSending':
            return isSending;
        case 'filteredMembers':
            return filteredMembers;
        case 'dashboardData':
            return dashboard;
        case 'templates':
            return templates;
        case 'stopRef':
            return stopRef.current;
        case 'trashList':
            return trashList;
        default:
            console.warn(`Unhandled field: ${field}`);
            return null;
    }
    }
  /* ---------------- TOTAL AUDIENCE ---------------- */
  useEffect(() => {
    // console.log(dashboard)
    // return
    let total = 0;
    selectedAudience.forEach((a) => {
      total +=
        dashboard[a.replace(/\s|\./g, '_').toLowerCase()] || 0;
    });
    setTotalAudience(total);
  }, [selectedAudience, dashboard]);

  /* ---------------- AUDIENCE FILTER ---------------- */
  useEffect(() => {
    const query = buildAudienceQuery(selectedAudience, gymid);
    if (!query) return setFilteredMembers([]);

    invoke('run_sqlite_query', { query })
      .then(setFilteredMembers)
      .catch(console.error);
  }, [selectedAudience, dashboard]);

  /* ---------------- CUSTOM FILTER ---------------- */
  useEffect(() => {
    if (!filter?.type) return;

    const query = buildCustomFilterQuery(filter, gymid);
 
    if (!query) return;

    invoke('run_sqlite_query', { query })
      .then(setFilteredMembers)
      .catch(console.error);
  }, [filter]);

  useEffect(() => {
    const fetchTemplates = async () => {
        const gym_id = user?.gym_id;
        const branch_id = user?.branch_id;
        if (!gym_id) return;
        const query = `
            select * from templates_local
            where gym_id='${gym_id}'
            and (branch_id='${branch_id}' or branch_id is null)
            and deleted = 0
            and type='whatsapp';
        `;
        const templatesData = await invoke('run_sqlite_query', { query });
        console.log('📄 Templates fetched:', templatesData);
        setTemplates(templatesData);
    }
    fetchTemplates();
  },[user])
  return {
    onGetValue,
    onHandleChange,
    onClose,
    sendMessages,
  };
}

import { Check, LandPlot, MessageCircle, Minus, Rocket, UserCircleIcon, Users, X } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import InputField from '../../AppComponents/subcomponents/InputField';
import { parseDate } from './broadcastService';
import { ProfilePicture } from '../customers/CustomersUI';

export default function BroadcastUI({
  onGetValue,
  onHandleChange,
  onClose,
  sendMessages
}) {
  return !onGetValue('isMinimized') ? (
    <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999999]"
        onClick={onClose}
      >
      <div
        className="relative bg-[var(--background)] 0 p-4 rounded-lg shadow-lg w-[900px] h-140"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="absolute top-2 right-2 text-white rounded-full p-1 bg-gray-800/80 hover:bg-gray-700 transition flex items-center justify-center"
          onClick={onClose}
        >
          <X size={14} />
        </button>
        <button
          className="absolute top-2 right-10 text-white rounded-full p-1 bg-gray-800/80 hover:bg-gray-700 transition"
          onClick={() => onHandleChange('isMinimized', true)}
        >
          <Minus size={14} />
        </button>

        {
          onGetValue('user').tier > 6 ? (
            <div className="flex flex-col h-full justify-between">
                <StepHeader step={onGetValue('step')} />
                {onGetValue('step') === 0 &&  onGetValue('dashboardData') ? (
                  <AudienceSelector
                    dashboardData={onGetValue('dashboardData')}
                    selectedAudience={onGetValue('selectedAudience')}
                    setSelectedAudience={(value) => onHandleChange('selectedAudience', value)}
                    filter={onGetValue('filter')}
                    setFilter={(value) => onHandleChange('filter', value)}
                    onGetValue={onGetValue}
                    onHandleChange={onHandleChange}
                  /> 
                ):
                onGetValue('step') === 1 ? (
                <TemplateSelector
                  onGetValue={onGetValue}
                  onHandleChange={onHandleChange}
                  />) : 
                onGetValue('step') === 2 ? (
                  <SendMessage
                    onGetValue={onGetValue}
                    onHandleChange={onHandleChange}
                    sendMessages={sendMessages}
                  />) :
                 onGetValue('step') === 3 ?<DoneScreen /> :
                  <span>{onGetValue('step')}</span>
              }
              
              <div className="my-6 flex w-full justify-between gap-3">
                  <button
                    className="w-1/4 bg-gray-700 text-white py-2 rounded hover:bg-gray-600 transition"
                    onClick={() => onHandleChange('step', Math.max(0, onGetValue('step') - 1))}
                  >
                    Back
                  </button>

                  <button
                    className={`w-1/4 bg-green-500 text-white py-2 rounded hover:bg-green-600 transition ${
                      (onGetValue('step') === 0 && ( onGetValue('selectedAudience').length === 0 && onGetValue('filteredMembers').length === 0)) ||
                      (onGetValue('step') === 1 && onGetValue('selectedTemplate') === null)
                        ? "opacity-50 cursor-not-allowed":
                      (onGetValue('step') === 2 )? "hidden"
                        : ""
                    }`}
                    onClick={() => {
                      if (onGetValue('step') === 0 && (onGetValue('selectedAudience').length === 0 && onGetValue('filteredMembers').length === 0)) return;
                      if (onGetValue('step') === 1 && onGetValue('selectedTemplate') === null) return;
                      if (onGetValue('step') === 2 && onGetValue('isSending')) return;
                      if (onGetValue('step') === 2){
                        onHandleChange('isSending', !onGetValue('isSending'))
                      }
                      if(onGetValue('step') === 3){
                        onClose();
                        
                      }
                      onHandleChange('step', Math.min(3, onGetValue('step') + 1));
                    }}
                  >
                    {onGetValue('step') === 3 ? "Finish" : onGetValue('step') === 2 ? "Send" : "Next"}
                  </button>
              </div>
            </div>
          ):(
            <div className="p-6">
              <h1 className="text-xl font-bold">Broadcast Message</h1>
              <p className="mt-4 text-red-600">Upgrade your plan to access Broadcast Message features.</p>
            </div>
          )
        }
        
      </div>
    </div>
  ) : (
    <div className="fixed bottom-6 right-6 z-[999999] bg-gray-900 text-white rounded-xl shadow-xl p-4 w-80">
        
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">📤 Broadcasting</span>
          <button
            className="text-sm text-green-400 hover:underline"
            onClick={() => onHandleChange('isMinimized', false)}
          >
            Open
          </button>
        </div>

        <div className="text-sm text-gray-300">
          Status:{" "}
          {onGetValue('isSending') ? (
            <span className="text-yellow-400">Sending...</span>
          ) : (
            <span className="text-green-400">Idle</span>
          )}
        </div>

        <div className="text-sm mt-1">
          Remaining: <b>{onGetValue('filteredMembers').length}</b>
        </div>

        {onGetValue('isSending') && (
          <button
            className="mt-3 w-full bg-red-600 hover:bg-red-500 py-1 rounded text-sm"
            onClick={() => {
              onHandleChange('stopRef', true);
            }}
          >
            Stop Sending
          </button>
        )}
     </div>
  );
}

function StepHeader({ step }) {
  const steps = [
    { label: "Select Audience", icon: <Users size={20} /> },
    { label: "Select Template", icon: <MessageCircle size={20} /> },
    { label: "Send Message", icon: <Rocket size={20} /> },
    { label: "Done", icon: <LandPlot size={20} /> },
  ];

  return (
    <div className="grid grid-cols-4 py-5 px-10">
      {steps.map((item, index) => {
        const active = step >= index;
        return (
          <div 
            key={index} 
            className={`flex flex-col items-center gap-2 ${active ? "text-green-400" : "text-slate-600"}`}
          >
            <span
              className={`h-10 w-10 flex justify-center items-center rounded-full 
                ${active ? "bg-green-400 text-white" : ""}`}
            >
              {item.icon}
            </span>
            <span className="text-sm">{item.label}</span>
            
          </div>
        );
      })}
    </div>
  );
}

function AudienceSelector({ dashboardData, selectedAudience, setSelectedAudience, filter, setFilter, onGetValue, onHandleChange }) {
  const items = [
    { label: "Active", value: dashboardData.active_members, class: "text-green-400" },
    { label: "Inactive", value: dashboardData.inactive_members, class: "text-yellow-400" },
    { label: "Cancelled", value: dashboardData.cancelled_members, class: "text-red-400" },
    { label: "Birthdays", value: dashboardData.birthdays_today, class: "text-blue-400" },
    { label: "Due Today", value: dashboardData.due_today, class: "text-purple-400" },
    { label: "Due Tomorrow", value: dashboardData.due_tomorrow, class: "text-pink-400" },
    { label: "Canc. Today", value: dashboardData.cancelled_today, class: "text-red-400" },
    { label: "Canc. Tomorrow", value: dashboardData.cancelled_tomorrow, class: "text-red-400" },
  ];
  const [selected, setSelected] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [selectedRange, setSelectedRange] = useState('');
  const toggle = (label) => {
    if (onGetValue('selectedAudience').includes(label)) {
      onHandleChange('selectedAudience', onGetValue('selectedAudience').filter((a) => a !== label));
    } else {
      onHandleChange('selectedAudience', [...onGetValue('selectedAudience'), label]);
    }
  };
  useEffect(()=>{
    let filterObj = {};
    if(selectedFilter){
      filterObj.type = selectedFilter;
    }
    if(selectedRange){
      filterObj.range = selectedRange;
    }
    setFilter(filterObj);
  },[selectedFilter,selectedRange])
  return (
    <div className='flex flex-col border border-gray-200'>
      <div className='flex px-10 py-5'>
        <span className={`cursor-pointer transition-colors duration-300 ${selected === 0 ? "bg-blue-500 text-white" : ""} hover:bg-blue-500 hover:text-white border border-gray-300 px-2 py-1`} onClick={()=>{setSelected(0)}}>Filters</span>
        <span className={`cursor-pointer transition-colors duration-300 ${selected === 1 ? "bg-blue-500 text-white" : ""} hover:bg-blue-500 hover:text-white border border-gray-300 px-2 py-1`} onClick={()=>{setSelected(1)}}>Custom Audience</span>
      </div>
      {
        selected === 0 ?
        <div className="grid grid-cols-3 mb-5 gap-2 px-20">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex px-2 py-2 gap-2 items-center border border-gray-400 bg-[var(--background)] rounded hover:bg-gray-700 transition-all duration-300 cursor-pointer"
              onClick={() => toggle(item.label)}
            >
              <span className={`block text-lg ${item.class}`}>{item.label}</span>
              <UserCircleIcon size={20} className={item.class} />
              <span className="text-sm text-gray-400">({item.value})</span>
              
              <Check
                size={16}
                className={`ml-auto ${
                  onGetValue('selectedAudience').includes(item.label)
                    ? "text-green-400"
                    : ""
                }`}
              />
            </div>
          ))}
        </div>:
        <div className="flex flex-col space-y-5 px-20 mb-5">
          <InputField
            label='Select Filter'
            type='ddm'
            ddmValues={[
              "Active",
              "Inactive",
              "Cancelled",
              "Birthdays",
              "Due Date",
              "Cancellation Date",
              "Balance Due",
            ].map(item=>({label:item,value:item}))}
            value={selectedFilter || ''}
            onChange={(e) => {setSelectedFilter(e.target.value)}}
          />
          <InputField
            label="Select Range"
            type='date'
            name='range'
            value={selectedRange?`${ parseDate(selectedRange.start) || ''} to ${parseDate(selectedRange.end) || ''}`:'--/--/----'}
            selectionMode='range'
            onChange={(target) => {
              setSelectedRange(target.target.value);
            }}
          />
        </div>
      }
    </div>
  );
}

function TemplateSelector({ onGetValue, onHandleChange }) {
  return (
    <div className="flex relative justify-center">
      <div className="flex flex-col gap-2">
        <InputField
          label="Select Message Template"
          type='ddm'
          ddmValues={[...onGetValue('templates').map(template=>({label:template.name,value:template.id})), {label: "Custom Template", value: 'Custom Template'}]}
          value={ onGetValue('selectedTemplate') || ''}
          onChange={(e) => onHandleChange('selectedTemplate', e.target.value)}
        />
        {
          onGetValue('selectedTemplate') && onGetValue('selectedTemplate') === 'Custom Template' &&
          <textarea
            className="w-96 h-40 p-2 border border-gray-300 rounded outline-none resize-none"
            placeholder="Enter your custom message template here..."
            onChange={(e) => {
              // Create a temporary custom template object
              onHandleChange('customMessage', e.target.value);
            }}
          ></textarea>
        }
        <span className="text-gray-500">
          Filtered Members {onGetValue('filteredMembers').length > 0 ? `(${onGetValue('filteredMembers').length})` : ""}
        </span>
      </div>
    </div>
  );
}

function SendMessage({ 
  onGetValue,
  onHandleChange,
  sendMessages
}) {

  return (
    <div className="px-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">

        <h2 className="text-lg font-semibold">Sending Messages</h2>

        {/* Delay Input */}
        <div className="flex items-center gap-2 ">
          <span className="text-sm">Delay:</span>
          <input
            type="number"
            min="100"
            className=" border border-gray-300 rounded p-1 w-24 outline-none"
            value={onGetValue('delay') / 1000}
            onChange={(e) => onHandleChange('delay', parseInt(e.target.value * 1000) || 0)}
            disabled={onGetValue('isSending')}
          />
        </div>

        {/* Reload */}
        {/* <button
          className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-500 text-white"
          onClick={() => {
            const restored = onGetValue('trashList').map(m => ({
              ...m,
              STATUS: null 
            }));
            onHandleChange('filteredMembers', restored);
            onHandleChange('trashList', []);
          }}
          disabled={onGetValue('isSending')}
        >
          Reload Members
        </button> */}

        {/* Start / Stop Button */}
        <button
          className={`absolute bottom-10 right-10 px-4 py-2 rounded text-white 
            ${onGetValue('isSending') ? "bg-red-600 hover:bg-red-500" : "bg-green-600 hover:bg-green-500"}
          `}
          onClick={() => {
            if(onGetValue('filteredMembers').length === 0){
                onHandleChange('step', 3);
                return;
            };
            if (onGetValue('isSending')) {
              console.log("STOP BUTTON CLICKED");
              onHandleChange('stopRef', true);
            } else {
              sendMessages();
            }
          }}
        >
          {onGetValue('isSending') ? "Stop" : onGetValue('filteredMembers').length === 0 ? "Finished" : "Start Sending"}
        </button>

      </div>

      {/* List */}
      <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-4 space-y-2 ">
        {onGetValue('filteredMembers').length === 0 && (
          <div className="text-center  py-10 text-lg">
            No Pending Messages ✔️
          </div>  
        )}

        {onGetValue('filteredMembers').map((member) => (
          <div
            key={member.serial_number}
            className="grid grid-cols-8 items-center px-3 py-2 rounded  border border-gray-700"
          >
            <span className="">#{member.serial_number}</span>

            <span
              className={`${
                member.current_status === "Active"
                  ? "text-green-400"
                  : member.current_status === "Inactive"
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {member.current_status}
            </span>

            <div className="flex gap-2 items-center col-span-2 text-blue-400">
              <ProfilePicture gender={member.gender} ProfilePictureLink={member.profile_picture} width='8' height='8' />
              {member.name}
            </div>

            {/* Contact input */}
            <input
              type="text"
              className="outline-none rounded p-1  w-full col-span-2"
              value={member.contact || ""}
              onChange={(e) => {
                const newValue = e.target.value;
                onHandleChange('filteredMembers',
                  onGetValue('filteredMembers').map(m =>
                    m.serial_number === member.serial_number
                      ? { ...m, contact: newValue }
                      : m
                  )
                );
              }}
              disabled={onGetValue('isSending')}
            />

            <div className="text-center w-20">
              {member.STATUS === "sending" && (
                <span className="text-yellow-400 animate-pulse">Sending...</span>
              )}
              {!member.STATUS && (
                <span className="text-gray-600">Pending</span>
              )}
              {member.STATUS && member.STATUS.startsWith("Error") && (
                <span className="text-red-400">{member.STATUS.replaceAll("Error: ", "")}</span>
              )}
              {member.STATUS === "sent" && (
                <span className="text-green-400">Sent ✔️</span>
              )}
            </div>
              
              <span className="text-green-400 cursor-pointer"
                onClick={()=>{
                    let selectedMember = member || false ;
                    selectedMember.BLOCKED = !member.BLOCKED;
                    onHandleChange('filteredMembers',
                      onGetValue('filteredMembers').map(m => m.serial_number === selectedMember.serial_number ? selectedMember : m )
                    );
                }}
              >{member.BLOCKED?"❌":"✔️"}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

function DoneScreen() {
  return (
    <div className="text-center text-green-400 text-xl font-semibold">
      Done! 🎉
    </div>
  );
}
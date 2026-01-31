// profileSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { show } from '@tauri-apps/api/app';

const initialState = {
    deviceStatus: null,
    attendanceLogs: [],
    eventLogs: [],
    attendanceID: null,
    upsertAttendance: true,
    showProgress: false,
    tauriConfig: null,
    biometricTemplate: null,
    mode: 0,
    qrImage: null,
    engineStatus: 'Disconnected',
    sendMessage: null,
    testmode: false,
    selectedStaff: null,
    toast: null, // { type: 'error' | 'success', message: string }
    showBroadcastMessage: false,
    showCustomer: null,
    realDeviceEvents: [],
};
const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        // Define reducers if needed in the future
        setDeviceStatus(state, action) {
            state.deviceStatus = action.payload;
        },
        addAttendanceLog(state, action) {
            state.attendanceLogs.unshift(action.payload);
            if (state.attendanceLogs.length > 200) {
                state.attendanceLogs.pop();
            }
        },
        addEventLog(state, action) {
            state.eventLogs.unshift(action.payload);
            if (state.eventLogs.length > 200) {
                state.eventLogs.pop();
            }
        },
        setAttendanceID(state, action) {
            state.attendanceID = action.payload;
        },
        setUpsertAttendance(state, action) {
            state.upsertAttendance = action.payload;
        },
        setShowProgress(state, action) {
            state.showProgress = action.payload;
        },
        setTauriConfig(state, action) {
            state.tauriConfig = action.payload;
        },
        setBiometricTemplate(state, action) {
            state.biometricTemplate = action.payload;
        },
        setMode(state, action) {
            state.mode = action.payload;
        },
        setQrImage(state, action) {
            state.qrImage = action.payload;
        },
        setEngineStatus(state, action) {
            state.engineStatus = action.payload;
        },
        setSendMessage(state, action) {
            state.sendMessage = action.payload;
        },
        setSelectedStaff(state, action) {
            state.selectedStaff = action.payload;
        },
        setToast: (state, action) => {
        state.toast = action.payload;
        },
        clearToast: (state) => {
        state.toast = null;
        },
        setMode: (state, action) => {
        state.mode = action.payload;
        },
        setTestMode: (state, action) => {
        state.testmode = action.payload;
        },
        setShowBroadcastMessage: (state, action) => {
        state.showBroadcastMessage = action.payload;
        },
        setShowCustomer: (state, action) => {
            state.showCustomer = action.payload;
        },
        setRealDeviceEvents: (state, action) => {
            console.log("Adding real device events to store...", action.payload);

            state.realDeviceEvents = [
                action.payload,
                ...state.realDeviceEvents
            ].slice(0, 100);
        }


    },
});

export const { setDeviceStatus, addAttendanceLog, addEventLog, setAttendanceID, setUpsertAttendance, setShowProgress, setTauriConfig, setBiometricTemplate, setMode, setTestMode, setEngineStatus, setQrImage, setSendMessage, setSelectedStaff, setToast, clearToast, setShowBroadcastMessage, setShowCustomer, setRealDeviceEvents } = profileSlice.actions;
export default profileSlice.reducer;

'use client';
import React from 'react';
import { useSelector } from 'react-redux';
import AttendanceUI from './AttendanceUI';
import { useAttendanceManager } from './useAttendanceManager';

export default function AttendanceContainer({ setSelectedCustomer }) {
  const user = useSelector(state => state.auth.user);
  const attendanceID = useSelector(state => state.profile.attendanceID);

  const attendance = useAttendanceManager(user, attendanceID, setSelectedCustomer);

  return (
    <AttendanceUI
      {...attendance}
      user={user}
      setSelectedCustomer={setSelectedCustomer}
    />
  );
}

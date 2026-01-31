'use client'
import { useRuntime } from '@/hooks/useRuntime';
import React, { useEffect, useState } from 'react'
import { dataService } from './dataService';
export default function useDataManager({ user }) {
  const { isTauri, isWeb, isReady } = useRuntime();

  useEffect(() => {
    if (!user || !isReady || !isTauri) return;

    const syncData = async () => {
        try {
        await dataService.syncToSupabase(user);
        } catch (err) {
        console.error("Data sync error:", err);
        }
    };
    const localSyncData = async () => {
        try {
             await dataService.syncFromSupabase(user);
        } catch (err) {
        console.error("Data sync error:", err);
        }
    }
    // 🔥 run immediately
    syncData();
    localSyncData();
    // ⏱ then every 5 minutes
    const intervalId = setInterval(syncData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
    }, [user, isReady, isTauri]);

  return (
    {
        
    }
  )
}


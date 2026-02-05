'use client';

import React from 'react';
import { useBroadcastManager } from './useBroadcastManager';
import BroadcastUI from './BroadcastUI';

export default function BroadcastContainer({ onClose, sendMessage }) {
  
  const manager = useBroadcastManager({ onClose, sendMessage });
  
  return <BroadcastUI {...manager} />;
}

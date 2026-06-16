import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

let sharedSocket = null;
let listenerCount = 0;

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const handlersRef = useRef({});

  useEffect(() => {
    listenerCount++;

    if (!sharedSocket) {
      sharedSocket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
    }

    const socket = sharedSocket;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onAny = (event, data) => {
      setLastEvent({ event, data, timestamp: Date.now() });
      if (handlersRef.current[event]) {
        handlersRef.current[event].forEach(fn => fn(data));
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.onAny(onAny);

    if (socket.connected) setIsConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.offAny(onAny);
      listenerCount--;
      if (listenerCount === 0) {
        socket.disconnect();
        sharedSocket = null;
      }
    };
  }, []);

  const on = useCallback((event, handler) => {
    if (!handlersRef.current[event]) {
      handlersRef.current[event] = [];
    }
    handlersRef.current[event].push(handler);
    return () => {
      handlersRef.current[event] = handlersRef.current[event].filter(h => h !== handler);
    };
  }, []);

  return { isConnected, lastEvent, on };
}

export default useWebSocket;

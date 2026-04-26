import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socketInstance = null;

function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socketInstance;
}

export function useSocket(userId) {
  const socket = useRef(getSocket());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = socket.current;

    s.connect();

    s.on('connect', () => {
      setConnected(true);
      if (userId) {
        s.emit('join', { user_id: userId });
      }
    });

    s.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      // Don't disconnect on unmount — keep alive for the session
    };
  }, [userId]);

  const on = useCallback((event, handler) => {
    socket.current.on(event, handler);
    return () => socket.current.off(event, handler);
  }, []);

  const emit = useCallback((event, data) => {
    socket.current.emit(event, data);
  }, []);

  return { socket: socket.current, connected, on, emit };
}

import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

let socket = null;

const getToken = () => {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken')
  );
};

export const getSocket = () => {
  if (!socket) {
    const token = getToken();

    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
  }

  return socket;
};

export const connectSocket = () => {
  const token = getToken();
  const s = getSocket();

  // update token if changed after login
  s.auth = { token };

  if (!s.connected) {
    s.connect();
  }

  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default getSocket;
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [systemAlert, setSystemAlert] = useState(null);

  useEffect(() => {
    if (user) {
      const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:3000");
      
      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
        newSocket.emit("join", user.id);
      });

      newSocket.on("SYSTEM_ALERT", (data) => {
        setSystemAlert(data);
        // Clear alert after 10 seconds
        setTimeout(() => setSystemAlert(null), 10000);
      });

      setSocket(newSocket);

      return () => {
        newSocket.off("SYSTEM_ALERT");
        newSocket.close();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, systemAlert }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

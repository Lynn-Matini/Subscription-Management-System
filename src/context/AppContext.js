// frontend/src/context/AppContext.js
import React, { createContext, useState } from 'react';

const AppContext = createContext();

const AVAX_CHAIN_ID = 'a86a';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x25e5faa3a1c76d60fb9fdcd601368eacffc86d41';

// Validate contract address is available
if (!CONTRACT_ADDRESS) {
  console.error('Contract address not found. Make sure CONTRACT_ADDRESS is set in your .env file.');
}

export const AppProvider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const addNotification = (message) => {
    setNotifications((prevNotifications) => [...prevNotifications, message]);
    setTimeout(() => {
      setNotifications((prevNotifications) => prevNotifications.slice(1));
    }, 5000);
  };

  const value = {
    web3,
    setWeb3,
    account,
    setAccount,
    contract,
    setContract,
    notifications,
    addNotification,
    darkMode,
    setDarkMode,
    isLoading,
    setIsLoading,
    AVAX_CHAIN_ID,
    CONTRACT_ADDRESS,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;

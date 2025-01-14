// frontend/src/context/AppContext.js
import React, { createContext, useState, useEffect } from 'react';
import Web3 from 'web3';
import SubscriptionManagerABI from '../SubscriptionManagerABI.json';

const AppContext = createContext();

const CONTRACT_ADDRESS = '0xe7fd732b53d5570bacff7daea392a9caddb8b9f4';
const AVAX_CHAIN_ID = '0xa86a';

export const AppProvider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        try {
          // Check if connected to correct network
          if (window.ethereum.networkVersion !== AVAX_CHAIN_ID) {
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: AVAX_CHAIN_ID }],
              });
            } catch (switchError) {
              if (switchError.code === 4902) {
                try {
                  await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                      {
                        chainId: AVAX_CHAIN_ID,
                        chainName: 'Avalanche Mainnet C-Chain',
                        nativeCurrency: {
                          name: 'Avalanche',
                          symbol: 'AVAX',
                          decimals: 18,
                        },
                        rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
                        blockExplorerUrls: ['https://snowtrace.io/'],
                      },
                    ],
                  });
                } catch (addError) {
                  console.error("Couldn't add Avalanche network:", addError);
                  addNotification(
                    "Couldn't add Avalanche network. Please add it manually in MetaMask."
                  );
                  return;
                }
              } else {
                console.error(
                  "Couldn't switch to Avalanche network:",
                  switchError
                );
                addNotification(
                  "Couldn't switch to Avalanche network. Please switch manually in MetaMask."
                );
                return;
              }
            }
          }

          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);

          const contractInstance = new web3Instance.eth.Contract(
            SubscriptionManagerABI,
            CONTRACT_ADDRESS
          );
          setContract(contractInstance);

          window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0]);
          });
          window.ethereum.on('chainChanged', (_chainId) => {
            window.location.reload();
          });
        } catch (error) {
          console.error('Error connecting to MetaMask:', error);
          addNotification('Error connecting to MetaMask.');
        }
      } else {
        console.error('MetaMask is not installed!');
        addNotification('Please install MetaMask!');
      }
    };

    initWeb3();
  }, []);

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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;

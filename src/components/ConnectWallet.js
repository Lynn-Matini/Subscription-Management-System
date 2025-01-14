import React, { useContext, useState } from 'react';
import AppContext from '../context/AppContext';
import Web3 from 'web3';
import SubscriptionManagerABI from '../SubscriptionManagerABI.json';

function ConnectWallet() {
  const {
    setWeb3,
    setAccount,
    setContract,
    addNotification,
    isLoading,
    setIsLoading,
    AVAX_CHAIN_ID,
    CONTRACT_ADDRESS,
  } = useContext(AppContext);
  const [connecting, setConnecting] = useState(false);

  const connectWallet = async () => {
    setConnecting(true);
    setIsLoading(true);
    try {
      if (!window.ethereum) {
        addNotification('Please install Core Wallet or MetaMask.');
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Check if we're on the right network (Fuji C-Chain testnet)
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xa869') { // Fuji testnet chain ID
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xa869' }],
          });
        } catch (switchError) {
          addNotification('Please switch to Fuji C-Chain testnet');
          return;
        }
      }

      const web3Instance = new Web3(window.ethereum);
      const contractInstance = new web3Instance.eth.Contract(
        SubscriptionManagerABI,
        CONTRACT_ADDRESS
      );

      setWeb3(web3Instance);
      setContract(contractInstance);
      setAccount(accounts[0]);
      addNotification('Wallet connected successfully!');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      addNotification('Error connecting wallet.');
    } finally {
      setConnecting(false);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={connectWallet} disabled={connecting || isLoading}>
        {connecting
          ? 'Connecting...'
          : isLoading
          ? 'Loading...'
          : 'Connect Wallet'}
      </button>
    </div>
  );
}

export default ConnectWallet;

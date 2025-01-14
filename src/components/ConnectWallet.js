import React, { useContext } from 'react';
import AppContext from '../context/AppContext';
import { saveUserToFirestore } from '../firebase/userService';
import { FaWallet, FaSignOutAlt } from 'react-icons/fa';

function ConnectWallet() {
  const { setAccount, account, setSelectedService, setSelectedPlan } = useContext(AppContext);

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        const userAccount = accounts[0];
        setAccount(userAccount);
        
        // Save user to Firestore when they connect
        await saveUserToFirestore(userAccount);
      } else {
        alert('Please install MetaMask or another Web3 wallet');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSelectedService(null); // Reset selected service
    setSelectedPlan(null); // Reset selected plan
  };

  return (
    <button 
      onClick={account ? disconnectWallet : connectWallet} 
      className={`connect-wallet-button ${account ? 'connected' : ''}`}
    >
      {account ? (
        <>
          <FaSignOutAlt className="wallet-icon" />
          Disconnect
        </>
      ) : (
        <>
          <FaWallet className="wallet-icon" />
          Connect Wallet
        </>
      )}
    </button>
  );
}

export default ConnectWallet;

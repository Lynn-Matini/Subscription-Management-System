import React, { useContext, useState } from 'react';
import AppContext from '../context/AppContext';
import Web3 from 'web3';

function ConnectWallet() {
  const {
    setWeb3,
    setAccount,
    setContract,
    addNotification,
    isLoading,
    setIsLoading,
  } = useContext(AppContext);
  const [connecting, setConnecting] = useState(false);
  const { AVAX_CHAIN_ID, SubscriptionManagerABI, CONTRACT_ADDRESS } =
    useContext(AppContext);

  const connectWallet = async () => {
    setConnecting(true);
    setIsLoading(true);
    try {
      if (typeof window.avalanche !== 'undefined') {
        // Check for Core Wallet
        const provider = window.avalanche;
        const web3Instance = new Web3(provider);

        // Check if connected to correct network
        const chainId = await web3Instance.eth.getChainId();
        if (chainId.toString(16) !== AVAX_CHAIN_ID) {
          try {
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: AVAX_CHAIN_ID }],
            });
          } catch (switchError) {
            if (switchError.code === 4902) {
              try {
                await provider.request({
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
                  "Couldn't add Avalanche network. Please add it manually in Core Wallet."
                );
                setConnecting(false);
                setIsLoading(false);
                return;
              }
            } else {
              console.error(
                "Couldn't switch to Avalanche network:",
                switchError
              );
              addNotification(
                "Couldn't switch to Avalanche network. Please switch manually in Core Wallet."
              );
              setConnecting(false);
              setIsLoading(false);
              return;
            }
          }
        }

        try {
          const accounts = await provider.request({
            method: 'eth_requestAccounts',
          });
          setWeb3(web3Instance);
          setAccount(accounts[0]);
          const contractInstance = new web3Instance.eth.Contract(
            SubscriptionManagerABI,
            CONTRACT_ADDRESS
          );
          setContract(contractInstance);
        } catch (error) {
          console.error('Error getting accounts', error);
        }
      } else {
        addNotification('Core Wallet is not installed!');
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      addNotification('Error connecting to wallet.');
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

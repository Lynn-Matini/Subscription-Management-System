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
        const provider = window.avalanche;
        const web3Instance = new Web3(provider);

        // First request account access
        try {
          const accounts = await provider.request({
            method: 'eth_requestAccounts',
          });
          
          // Only proceed with chain switch if we have account access
          if (accounts && accounts.length > 0) {
            const chainId = await web3Instance.eth.getChainId();
            if (chainId.toString(16) !== AVAX_CHAIN_ID) {
              try {
                await provider.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: AVAX_CHAIN_ID }],
                });
              } catch (switchError) {
                // Handle chain switch error
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
                      "Please add Avalanche network manually in your wallet."
                    );
                    return;
                  }
                } else if (switchError.code === 4001) {
                  addNotification('User rejected network switch.');
                  return;
                } else {
                  console.error("Couldn't switch to Avalanche network:", switchError);
                  addNotification(
                    'Please switch to Avalanche network manually in your wallet.'
                  );
                  return;
                }
              }
            }

            // Set up web3 instance and contract
            setWeb3(web3Instance);
            setAccount(accounts[0]);
            const contractInstance = new web3Instance.eth.Contract(
              SubscriptionManagerABI,
              CONTRACT_ADDRESS
            );
            setContract(contractInstance);
          }
        } catch (accountError) {
          if (accountError.code === 4001) {
            addNotification('Please connect your wallet to continue.');
          } else {
            console.error('Error connecting wallet:', accountError);
            addNotification('Error connecting wallet. Please try again.');
          }
          return;
        }
      } else {
        addNotification('Please install Core Wallet to continue.');
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

import React, { useState, useEffect, useContext, useCallback } from 'react';
import AppContext from '../context/AppContext';
import { getUserSubscriptions } from '../firebase/userService';
import CountdownTimer from './CountdownTimer';
import Web3 from 'web3';

function SubscriptionsList() {
  const { contract, account, addNotification, isLoading, setIsLoading, web3, darkMode } = useContext(AppContext);
  const [subscriptions, setSubscriptions] = useState([]);
  const [networkId, setNetworkId] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const fetchBlockchainSubscriptions = async () => {
    try {
      const subscriptionCount = await contract.methods.subscriptionCount().call();
      console.log('Total subscriptions:', subscriptionCount);
      
      const subscriptions = [];
      for (let i = 1; i <= subscriptionCount; i++) {
        try {
          const subscription = await contract.methods.getSubscription(i).call();
          if (subscription.subscriber.toLowerCase() === account.toLowerCase()) {
            subscriptions.push({
              id: i,
              ...subscription
            });
          }
        } catch (error) {
          console.warn(`Skipping subscription ${i}:`, error.message);
          continue;
        }
      }
      return subscriptions;
    } catch (error) {
      console.error('Error in fetchBlockchainSubscriptions:', error);
      throw error;
    }
  };

  const checkNetwork = useCallback(async () => {
    if (!web3) return;
    try {
      const currentNetwork = await web3.eth.getChainId();
      if (networkId && currentNetwork !== networkId) {
        addNotification('Network changed. Please switch back to Fuji C-Chain testnet.');
        setSubscriptions([]);
      }
      setNetworkId(currentNetwork);
    } catch (error) {
      console.error('Error checking network:', error);
    }
  }, [web3, networkId, addNotification]);

  const fetchSubscriptions = useCallback(async (force = false) => {
    if (!contract || !account) return;
    
    const now = Date.now();
    if (!force && now - lastFetchTime < 5000) {
      return;
    }
    
    setIsLoading(true);
    try {
      await checkNetwork();
      
      let blockchainSubs = [];
      let firestoreSubs = [];

      try {
        blockchainSubs = await fetchBlockchainSubscriptions();
      } catch (blockchainError) {
        console.error('Error fetching blockchain subscriptions:', blockchainError);
        addNotification('Error fetching blockchain data. Please try again.');
      }

      try {
        firestoreSubs = await getUserSubscriptions(account);
      } catch (firestoreError) {
        console.error('Error fetching Firestore subscriptions:', firestoreError);
        addNotification('Error fetching subscription details.');
      }
      
      // Merge and format subscriptions
      const mergedSubs = blockchainSubs.map(sub => {
        const firestoreSub = firestoreSubs.find(fs => fs.subscriptionId === sub.id);
        return {
          ...sub,
          serviceName: firestoreSub?.serviceName || 'Unknown Service',
          planName: firestoreSub?.planName || 'Unknown Plan',
        };
      });

      setSubscriptions(mergedSubs);
      setLastFetchTime(now);
    } catch (error) {
      console.error('Error in fetchSubscriptions:', error);
      if (error.message.includes('contract not deployed')) {
        addNotification('Please switch to Fuji C-Chain testnet');
      } else {
        addNotification('Error fetching subscriptions. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [contract, account, addNotification, setIsLoading, checkNetwork, lastFetchTime]);

  const handleCancel = async (subscriptionId) => {
    setIsLoading(true);
    try {
      await contract.methods.cancelSubscription(subscriptionId).send({ from: account });
      addNotification('Subscription cancelled successfully!');
      setTimeout(() => fetchSubscriptions(true), 2000);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      addNotification('Error cancelling subscription.');
    } finally {
      setIsLoading(false);
    }
  };

  const processPayment = async (subscriptionId, price) => {
    setIsLoading(true);
    try {
      await checkNetwork();
      await contract.methods
        .processPayment(subscriptionId)
        .send({ from: account, value: price });
      addNotification('Payment processed successfully!');
      
      // Wait a bit for the blockchain to update
      setTimeout(() => {
        fetchSubscriptions();
      }, 2000);
      
    } catch (error) {
      console.error('Error processing payment:', error);
      if (error.message.includes('wrong network')) {
        addNotification('Please switch to Fuji C-Chain testnet');
      } else {
        addNotification('Error processing payment.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        checkNetwork();
        fetchSubscriptions(true);
      });
    }

    const handleSubscriptionCreated = () => {
      setTimeout(() => fetchSubscriptions(true), 2000);
    };
    
    window.addEventListener('subscriptionCreated', handleSubscriptionCreated);
    
    return () => {
      window.removeEventListener('subscriptionCreated', handleSubscriptionCreated);
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, [fetchSubscriptions, checkNetwork]);

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours`;
    const days = Math.floor(hours / 24);
    return `${days} days`;
  };

  return (
    <div className="subscriptions-container">
      <div className="subscriptions-header">
        <h3>Your Subscriptions</h3>
        <button onClick={() => fetchSubscriptions(true)} className="refresh-button">
          Refresh
        </button>
      </div>
      
      {isLoading ? (
        <p>Loading subscriptions...</p>
      ) : subscriptions.length === 0 ? (
        <div className="empty-state">
          <p>No subscriptions found.</p>
          <p>Create a new subscription to get started!</p>
        </div>
      ) : (
        <div className="subscriptions-grid">
          {subscriptions.map((sub) => (
            <div key={sub.id} className={`subscription-card ${darkMode ? 'dark' : ''}`}>
              <h4>Subscription #{sub.id}</h4>
              <div className="subscription-details">
                <p>Service: {sub.serviceName}</p>
                <p>Plan: {sub.planName}</p>
                <p>Price: {sub.price} AVAX</p>
                <p>Status: {sub.isActive ? 'Active' : 'Inactive'}</p>
                {sub.isActive && !sub.isCancelled && (
                  <div className="time-remaining">
                    <h5>Time Remaining:</h5>
                    <CountdownTimer timeRemaining={sub.timeRemaining} />
                  </div>
                )}
              </div>
              {!sub.isCancelled && (
                <div className="card-actions">
                  {!sub.isActive && (
                    <button 
                      onClick={() => processPayment(sub.id, sub.price)}
                      disabled={isLoading}
                      className="process-payment-button"
                    >
                      Process Payment
                    </button>
                  )}
                  <button 
                    onClick={() => handleCancel(sub.id)}
                    disabled={isLoading}
                    className="cancel-button"
                  >
                    Cancel Subscription
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SubscriptionsList;
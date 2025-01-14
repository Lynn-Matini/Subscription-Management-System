import React, { useState, useEffect, useContext, useCallback } from 'react';
import AppContext from '../context/AppContext';

function SubscriptionsList() {
  const { contract, account, addNotification, isLoading, setIsLoading, web3, darkMode } = useContext(AppContext);
  const [subscriptions, setSubscriptions] = useState([]);
  const [networkId, setNetworkId] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);

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
      const count = await contract.methods.subscriptionCount().call();
      
      if (count === '0' || Number(count) === 0) {
        setSubscriptions([]);
        setLastFetchTime(now);
        setIsLoading(false);
        return;
      }

      // Batch fetch subscriptions
      const promises = [];
      for (let i = 1; i <= count; i++) {
        promises.push(contract.methods.subscriptions(i).call());
      }
      
      const results = await Promise.all(promises);
      const userSubs = results
        .map((sub, index) => ({
          ...sub,
          id: index + 1,
        }))
        .filter(sub => 
          sub.subscriber.toLowerCase() === account.toLowerCase() && // Only current user's subs
          Number(sub.startTime) > 0 && // Only started subscriptions
          Number(sub.startTime) > (Date.now()/1000 - 30*24*60*60) // Only last 30 days
        );

      // Batch fetch statuses
      const statusPromises = userSubs.map(sub => 
        contract.methods.getSubscriptionStatus(sub.id).call()
          .catch(() => ({
            isActive: false,
            isCancelled: false,
            isExpired: false,
            timeRemaining: 0
          }))
      );
      
      const statuses = await Promise.all(statusPromises);
      
      // Filter out inactive subscriptions
      const formattedSubs = userSubs
        .map((sub, i) => ({
          id: sub.id,
          price: Number(sub.price),
          duration: Number(sub.duration),
          startTime: Number(sub.startTime),
          subscriber: sub.subscriber,
          ...statuses[i]
        }))
        .filter(sub => 
          !sub.isExpired && 
          !sub.isCancelled && 
          sub.isActive && 
          Number(sub.timeRemaining) > 0
        ); // Only show active, non-expired, non-cancelled subs with remaining time

      setSubscriptions(formattedSubs);
      setLastFetchTime(now);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      addNotification(error.message.includes('contract not deployed') 
        ? 'Contract not deployed on this network. Please switch to Fuji C-Chain testnet.'
        : 'Error fetching subscriptions.');
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
    <div className="subscriptions-list">
      <div className="list-header">
        <h3>Your Subscriptions</h3>
        <button onClick={() => fetchSubscriptions(true)} disabled={isLoading}>
          Refresh List
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
              <p>Price: {sub.price} wei</p>
              <p>Duration: {formatDuration(sub.duration)}</p>
              <p>Start Time: {new Date(sub.startTime * 1000).toLocaleString()}</p>
              <p>Status: {sub.isActive ? 'Active' : 'Inactive'}</p>
              <p>Cancelled: {sub.isCancelled ? 'Yes' : 'No'}</p>
              <p>Expired: {sub.isExpired ? 'Yes' : 'No'}</p>
              <p>Time Remaining: {formatDuration(sub.timeRemaining)}</p>
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
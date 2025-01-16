import React, { useState, useEffect, useContext, useCallback } from 'react';
import AppContext from '../context/AppContext';
import { getUserSubscriptions, updateSubscriptionAutoRenew, deleteSubscription } from '../firebase/userService';
import CountdownTimer from './CountdownTimer';
import Web3 from 'web3';
import { FaTrash } from 'react-icons/fa';

function SubscriptionsList({ selectedService }) {
  const {
    contract,
    account,
    addNotification,
    isLoading,
    setIsLoading,
    web3,
    darkMode,
  } = useContext(AppContext);
  const [subscriptions, setSubscriptions] = useState([]);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const fetchSubscriptions = useCallback(
    async (force = false) => {
      if (!account || !selectedService) return;

      const now = Date.now();
      if (!force && now - lastFetchTime < 5000) {
        return;
      }

      setIsLoading(true);
      try {
        // Fetch subscriptions for specific service
        const firestoreSubs = await getUserSubscriptions(account, selectedService.id);
        
        // Format the subscriptions
        const formattedSubs = firestoreSubs.map(sub => ({
          ...sub,
          price: (typeof window !== 'undefined' && window.BigInt) 
            ? window.BigInt(sub.price || 0).toString() 
            : sub.price || '0',
          duration: parseInt(sub.duration || 0),
          startTime: parseInt(sub.startTime || 0),
          subscriptionId: sub.subscriptionId || '0',
          isActive: sub.status === 'active',
          timeRemaining: calculateTimeRemaining(
            parseInt(sub.startTime || 0),
            parseInt(sub.duration || 0)
          ),
          autoRenew: sub.autoRenew || false
        }));

        console.log(`Formatted subscriptions for ${selectedService.name}:`, formattedSubs);
        setSubscriptions(formattedSubs);
        setLastFetchTime(now);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        addNotification('Error fetching subscriptions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [account, addNotification, setIsLoading, lastFetchTime, selectedService]
  );

  // Add this helper function
  const calculateTimeRemaining = (startTime, duration) => {
    if (!startTime || !duration) return 0;
    const endTime = startTime + duration;
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, endTime - now);
  };

  // Format the price to display properly
  const formatPrice = (price) => {
    try {
      return web3 ? web3.utils.fromWei(price.toString(), 'ether') : '0';
    } catch (error) {
      console.error('Error formatting price:', error);
      return '0';
    }
  };

  // Add back the payment processing function
  const processPayment = async (subscriptionId, price) => {
    setIsLoading(true);
    try {
      await contract.methods
        .processPayment(subscriptionId)
        .send({ from: account, value: price });
      addNotification('Payment processed successfully!');
      setTimeout(() => fetchSubscriptions(true), 2000);
    } catch (error) {
      console.error('Error processing payment:', error);
      addNotification('Error processing payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add back the cancel function
  const handleCancel = async (subscriptionId) => {
    setIsLoading(true);
    try {
      await contract.methods
        .cancelSubscription(subscriptionId)
        .send({ from: account });
      addNotification('Subscription cancelled successfully!');
      setTimeout(() => fetchSubscriptions(true), 2000);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      addNotification('Error cancelling subscription.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to handle auto-renew toggle
  const handleAutoRenewToggle = async (subscriptionId, newValue) => {
    setIsLoading(true);
    try {
      await updateSubscriptionAutoRenew(account, subscriptionId, newValue);
      addNotification(`Auto-renew ${newValue ? 'enabled' : 'disabled'}`);
      fetchSubscriptions(true);
    } catch (error) {
      console.error('Error updating auto-renew:', error);
      addNotification('Error updating auto-renew setting');
    } finally {
      setIsLoading(false);
    }
  };

  // Add delete handler
  const handleDelete = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteSubscription(subscriptionId);
      addNotification('Subscription deleted successfully');
      fetchSubscriptions(true);
    } catch (error) {
      console.error('Error deleting subscription:', error);
      addNotification('Error deleting subscription');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();

    const handleSubscriptionCreated = () => {
      setTimeout(() => fetchSubscriptions(true), 2000);
    };

    window.addEventListener('subscriptionCreated', handleSubscriptionCreated);

    return () => {
      window.removeEventListener('subscriptionCreated', handleSubscriptionCreated);
    };
  }, [fetchSubscriptions, selectedService]);

  return (
    <div className="subscriptions-container">
      <div className="subscriptions-header">
        <h3>{selectedService.name} Subscriptions</h3>
        <button onClick={() => fetchSubscriptions(true)} className="refresh-button">
          Refresh
        </button>
      </div>

      {isLoading ? (
        <p>Loading subscriptions...</p>
      ) : subscriptions.length === 0 ? (
        <div className="empty-state">
          <p>No subscriptions found for {selectedService.name}.</p>
          <p>Create a new subscription to get started!</p>
        </div>
      ) : (
        <div className="subscriptions-grid">
          {subscriptions.map((sub) => (
            <div key={sub.id} className={`subscription-card ${darkMode ? 'dark-mode' : ''}`}>
              <div className="subscription-header">
                <div className="header-content">
                  <h4>{sub.serviceName || 'Unknown Service'}</h4>
                  <span className="plan-badge">{sub.planName || 'Unknown Plan'}</span>
                </div>
                {!sub.isActive && (
                  <button
                    onClick={() => handleDelete(sub.subscriptionId)}
                    className="delete-button"
                    disabled={isLoading}
                    title="Delete Subscription"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
              
              <div className="subscription-content">
                <div className="subscription-info">
                  <div className="info-item">
                    <span className="label">ID:</span>
                    <span className="value">#{sub.subscriptionId}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Price:</span>
                    <span className="value">{formatPrice(sub.price)} AVAX</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Status:</span>
                    <span className={`status-badge ${sub.isActive ? 'active' : 'inactive'}`}>
                      {sub.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Auto-Renew:</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={sub.autoRenew}
                        onChange={() => handleAutoRenewToggle(sub.id, !sub.autoRenew)}
                        disabled={isLoading}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                {sub.timeRemaining > 0 && (
                  <div className="countdown-container">
                    <h5>Time Remaining</h5>
                    <CountdownTimer timeRemaining={sub.timeRemaining} />
                  </div>
                )}

                <div className="card-actions">
                  {!sub.isActive && (
                    <button
                      onClick={() => processPayment(sub.subscriptionId, sub.price)}
                      disabled={isLoading}
                      className="action-button payment-button"
                    >
                      <span className="payment-amount">{formatPrice(sub.price)} AVAX</span>
                      <span>Pay Now</span>
                    </button>
                  )}
                  {sub.isActive && (
                    <button
                      onClick={() => handleCancel(sub.subscriptionId)}
                      disabled={isLoading}
                      className="action-button cancel-button"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SubscriptionsList;

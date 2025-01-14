// frontend/src/components/SubscriptionDetails.js
import React, { useState, useContext } from 'react';
import AppContext from '../context/AppContext';

function SubscriptionDetails() {
  const { contract, account, addNotification, isLoading, setIsLoading } = useContext(AppContext);
  const [subscriptionId, setSubscriptionId] = useState('');
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  const getSubscriptionDetails = async () => {
    setIsLoading(true);
    try {
      // Get basic subscription details
      const details = await contract.methods.getSubscription(subscriptionId).call();
      setSubscriptionDetails(details);

      // Get subscription status
      const status = await contract.methods.getSubscriptionStatus(subscriptionId).call();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      addNotification('Error fetching subscription details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await contract.methods.cancelSubscription(subscriptionId).send({ from: account });
      addNotification('Subscription cancelled successfully!');
      getSubscriptionDetails(); // Refresh details
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      addNotification('Error cancelling subscription.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeRemaining = (timeInSeconds) => {
    const days = Math.floor(timeInSeconds / (24 * 60 * 60));
    const hours = Math.floor((timeInSeconds % (24 * 60 * 60)) / (60 * 60));
    return `${days} days, ${hours} hours`;
  };

  return (
    <div className="subscription-details">
      <h3>Subscription Details</h3>
      <div className="input-group">
        <input
          type="number"
          placeholder="Subscription ID"
          value={subscriptionId}
          onChange={(e) => setSubscriptionId(e.target.value)}
        />
        <button onClick={getSubscriptionDetails} disabled={isLoading}>
          Get Details
        </button>
      </div>

      {subscriptionDetails && (
        <div className="details-container">
          <p>Price: {subscriptionDetails.price} wei</p>
          <p>Duration: {subscriptionDetails.duration} seconds</p>
          <p>Start Time: {new Date(subscriptionDetails.startTime * 1000).toLocaleString()}</p>
          <p>Subscriber: {subscriptionDetails.subscriber}</p>
          
          {subscriptionStatus && (
            <>
              <p>Status: {subscriptionStatus.isActive ? 'Active' : 'Inactive'}</p>
              <p>Cancelled: {subscriptionStatus.isCancelled ? 'Yes' : 'No'}</p>
              <p>Expired: {subscriptionStatus.isExpired ? 'Yes' : 'No'}</p>
              <p>Time Remaining: {formatTimeRemaining(subscriptionStatus.timeRemaining)}</p>
              
              {!subscriptionStatus.isCancelled && 
                subscriptionDetails.subscriber.toLowerCase() === account.toLowerCase() && (
                  <button 
                    onClick={handleCancel}
                    disabled={isLoading || subscriptionStatus.isCancelled}
                    className="cancel-button"
                  >
                    Cancel Subscription
                  </button>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SubscriptionDetails;

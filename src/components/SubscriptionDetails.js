// frontend/src/components/SubscriptionDetails.js
import React, { useState, useContext } from 'react';
import AppContext from '../context/AppContext';

function SubscriptionDetails() {
  const { contract, addNotification, isLoading, setIsLoading } =
    useContext(AppContext);
  const [subscriptionId, setSubscriptionId] = useState('');
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);

  const getSubscriptionDetails = async () => {
    setIsLoading(true);
    try {
      const details = await contract.methods
        .getSubscription(subscriptionId)
        .call();
      setSubscriptionDetails(details);
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      addNotification('Error fetching subscription details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <input
        type="number"
        placeholder="Subscription ID"
        value={subscriptionId}
        onChange={(e) => setSubscriptionId(e.target.value)}
      />
      <button onClick={getSubscriptionDetails} disabled={isLoading}>
        Get Subscription Details
      </button>
      {subscriptionDetails && (
        <div>
          <p>Price: {subscriptionDetails.price}</p>
          <p>Duration: {subscriptionDetails.duration}</p>
          <p>Start Time: {subscriptionDetails.startTime}</p>
          <p>Subscriber: {subscriptionDetails.subscriber}</p>
        </div>
      )}
    </div>
  );
}

export default SubscriptionDetails;

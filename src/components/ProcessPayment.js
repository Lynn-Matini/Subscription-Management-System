// frontend/src/components/ProcessPayment.js
import React, { useState, useContext } from 'react';
import AppContext from '../context/AppContext';

function ProcessPayment() {
  const { contract, account, addNotification, setIsLoading } =
    useContext(AppContext);
  const [subscriptionId, setSubscriptionId] = useState('');

  const processPayment = async () => {
    setIsLoading(true);
    try {
      const sub = await contract.methods.getSubscription(subscriptionId).call();
      await contract.methods
        .processPayment(subscriptionId)
        .send({ from: account, value: sub.price });
      addNotification('Payment processed successfully!');
      setSubscriptionId('');
    } catch (error) {
      console.error('Error processing payment:', error);
      addNotification('Error processing payment.');
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
      <button onClick={processPayment}>Process Payment</button>
    </div>
  );
}

export default ProcessPayment;

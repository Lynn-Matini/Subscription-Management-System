// frontend/src/components/CreateSubscription.js
import React, { useState } from 'react';

function CreateSubscription({ contract, account, addNotification }) {
  const [subscriptionPrice, setSubscriptionPrice] = useState('');
  const [subscriptionDuration, setSubscriptionDuration] = useState('');

  const createSubscription = async () => {
    try {
      await contract.methods
        .createSubscription(subscriptionPrice, subscriptionDuration)
        .send({ from: account });
      addNotification('Subscription created successfully!');
      setSubscriptionPrice('');
      setSubscriptionDuration('');
    } catch (error) {
      console.error('Error creating subscription:', error);
      addNotification('Error creating subscription.');
    }
  };

  return (
    <div>
      <input
        type="number"
        placeholder="Subscription Price (wei)"
        value={subscriptionPrice}
        onChange={(e) => setSubscriptionPrice(e.target.value)}
      />
      <input
        type="number"
        placeholder="Subscription Duration (seconds)"
        value={subscriptionDuration}
        onChange={(e) => setSubscriptionDuration(e.target.value)}
      />
      <button onClick={createSubscription}>Create Subscription</button>
    </div>
  );
}

export default CreateSubscription;

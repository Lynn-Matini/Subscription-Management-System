import React, { useState, useContext } from 'react';
import AppContext from '../context/AppContext';

function CreateSubscription() {
  const { contract, account, addNotification, setIsLoading } = useContext(AppContext);
  const [subscriptionPrice, setSubscriptionPrice] = useState('');
  const [subscriptionDuration, setSubscriptionDuration] = useState('');
  const [selectedService, setSelectedService] = useState(null);

  const createSubscription = async () => {
    if (!subscriptionPrice || !subscriptionDuration) {
      addNotification('Please enter both price and duration');
      return;
    }

    setIsLoading(true);
    try {
      await contract.methods
        .createSubscription(subscriptionPrice, subscriptionDuration)
        .send({ from: account });
      
      addNotification(`Subscription created successfully for ${selectedService.name}!`);
      
      // Clear the form
      setSubscriptionPrice('');
      setSubscriptionDuration('');
      
      // Trigger a custom event to notify SubscriptionsList to refresh
      window.dispatchEvent(new CustomEvent('subscriptionCreated'));
      
    } catch (error) {
      console.error('Error creating subscription:', error);
      addNotification('Error creating subscription.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-subscription">
      <h3>Create New Subscription</h3>
      <div className="input-group">
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
    </div>
  );
}

export default CreateSubscription;
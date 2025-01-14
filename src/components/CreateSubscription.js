import React, { useState, useContext } from 'react';
import AppContext from '../context/AppContext';
import { saveUserSubscription } from '../firebase/userService';
import { FaArrowLeft } from 'react-icons/fa';

function CreateSubscription({ selectedService, selectedPlan, onBack }) {
  const { contract, account, addNotification, setIsLoading } = useContext(AppContext);
  const [subscriptionPrice, setSubscriptionPrice] = useState(selectedPlan?.price || '');
  const [subscriptionDuration, setSubscriptionDuration] = useState(selectedPlan?.duration || '');

  const createSubscription = async () => {
    if (!subscriptionPrice || !subscriptionDuration) {
      addNotification('Please enter both price and duration');
      return;
    }

    setIsLoading(true);
    try {
      const result = await contract.methods
        .createSubscription(subscriptionPrice, subscriptionDuration)
        .send({ from: account });
      
      // Get the subscription ID from the event
      const subscriptionId = result.events.SubscriptionCreated.returnValues.subscriptionId;
      
      // Get the subscription details
      const subscription = await contract.methods.getSubscription(subscriptionId).call();
      
      // Save subscription to Firestore
      await saveUserSubscription(account, {
        id: subscriptionId,
        ...subscription
      }, selectedService, selectedPlan);
      
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
      <div className="subscription-header">
        <h3>Create New Subscription for {selectedService.name}</h3>
        <button 
          onClick={onBack} 
          className="back-to-plans-button"
          aria-label="Back to plans"
        >
          <FaArrowLeft /> Back to Plans
        </button>
      </div>
      <p className="selected-plan">Selected Plan: {selectedPlan.name}</p>
      <div className="input-group">
        <input
          type="number"
          placeholder="Price (in wei)"
          value={subscriptionPrice}
          onChange={(e) => setSubscriptionPrice(e.target.value)}
        />
        <input
          type="number"
          placeholder="Duration (in seconds)"
          value={subscriptionDuration}
          onChange={(e) => setSubscriptionDuration(e.target.value)}
        />
        <button onClick={createSubscription}>Create Subscription</button>
      </div>
    </div>
  );
}

export default CreateSubscription;
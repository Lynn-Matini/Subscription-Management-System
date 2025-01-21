import React, { useState, useContext, useEffect } from 'react';
import AppContext from '../context/AppContext';
import { saveUserSubscription, getUserSubscriptions } from '../firebase/userService';
import { FaClock, FaCoins } from 'react-icons/fa';
import Web3 from 'web3';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

function CreateSubscription({ selectedService, selectedPlan, onBack }) {
  const { 
    account, 
    addNotification, 
    setIsLoading,
    isLoading,
    darkMode, 
    web3 
  } = useContext(AppContext);
  const [subscriptionPrice, setSubscriptionPrice] = useState('');
  const [subscriptionDuration, setSubscriptionDuration] = useState('');

  useEffect(() => {
    if (selectedPlan) {
      // Convert price to Wei (multiply by 10^18)
      const priceInWei = Web3.utils.toWei(selectedPlan.price, 'ether');
      setSubscriptionPrice(priceInWei);
      // Convert days to seconds
      setSubscriptionDuration(selectedPlan.duration * 24 * 60 * 60);
    }
  }, [selectedPlan]);

  const checkBalance = async () => {
    if (!web3 || !account) {
      addNotification('Please connect your wallet first');
      return;
    }

    try {
      const balance = await web3.eth.getBalance(account);
      const balanceInAvax = Web3.utils.fromWei(balance, 'ether');
      console.log(`Current balance: ${balanceInAvax} AVAX`);
      addNotification(`Current balance: ${balanceInAvax} AVAX`);
      return balanceInAvax;
    } catch (error) {
      console.error('Error checking balance:', error);
      addNotification('Error checking balance');
    }
  };

  const checkExistingSubscription = async () => {
    try {
      const q = query(
        collection(db, 'userSubscriptions'),
        where('userId', '==', account.toLowerCase()),
        where('serviceId', '==', selectedService.id),
        where('status', 'in', ['active', 'pending']),
        where('isCancelled', '==', false)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking existing subscription:', error);
      return false;
    }
  };

  const createSubscription = async () => {
    if (!account) {
      addNotification('Please connect your wallet first');
      return;
    }

    // Check for existing active subscription
    const hasExistingSubscription = await checkExistingSubscription();
    if (hasExistingSubscription) {
      addNotification('You already have an active subscription for this service');
      return;
    }

    setIsLoading(true);
    try {
      // Get current local date and time
      const localStartTime = new Date();
      const startTimeInSeconds = Math.floor(localStartTime.getTime() / 1000);
      const durationInSeconds = subscriptionDuration;
      const endTimeInSeconds = startTimeInSeconds + durationInSeconds;

      // Create subscription document in Firestore
      const subscriptionData = {
        userId: account.toLowerCase(),
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        planName: selectedPlan.name,
        price: subscriptionPrice,
        duration: durationInSeconds,
        startTime: startTimeInSeconds,
        endTime: endTimeInSeconds,
        status: 'inactive', // Initially inactive until payment
        autoRenew: true, // Set default to true for test service
        isCancelled: false,
        createdAt: localStartTime.toISOString(),
        updatedAt: localStartTime.toISOString(),
        lastRenewalTime: startTimeInSeconds
      };

      // Save to Firestore
      await addDoc(collection(db, 'userSubscriptions'), subscriptionData);
      
      addNotification('Subscription created! Please process payment to activate.');
      
      // Dispatch event to refresh subscriptions list
      window.dispatchEvent(new CustomEvent('subscriptionCreated'));
    } catch (error) {
      console.error('Error creating subscription:', error);
      addNotification('Error creating subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const getSubscriptionIdFromEvent = (result) => {
    try {
      // Look for the SubscriptionCreated event in the transaction logs
      const event = result.events.SubscriptionCreated;
      if (event && event.returnValues) {
        // Return the subscriptionId from the event
        return event.returnValues.subscriptionId;
      }
      // If event is not found in the expected format, try to find it in raw logs
      const logs = result.logs;
      if (logs && logs.length > 0) {
        // Look for the event in raw logs (useful if event name matching fails)
        const relevantLog = logs.find(
          (log) =>
            log.topics &&
            log.topics[0] &&
            log.topics[0].toLowerCase().includes('subscription')
        );
        if (relevantLog && relevantLog.topics.length > 1) {
          // Parse the subscription ID from the raw log data
          return web3.utils.hexToNumber(relevantLog.topics[1]);
        }
      }
      console.error(
        'Could not find SubscriptionCreated event in transaction logs'
      );
      return null;
    } catch (error) {
      console.error('Error extracting subscription ID from event:', error);
      return null;
    }
  };

  return (
    <div className={`create-subscription-container ${darkMode ? 'dark' : ''}`}>
      <div className="subscription-header">
        <h2>Confirm Your Subscription</h2>
      </div>

      <div className="subscription-creation-card">
        <div className="service-info">
          <h3>{selectedService.name}</h3>
          <span className="plan-name">{selectedPlan.name} Plan</span>
        </div>

        <div className="subscription-details">
          <div className="detail-item">
            <FaCoins className="detail-icon" />
            <div className="detail-content">
              <span className="detail-label">Price</span>
              <span className="detail-value">{selectedPlan.price} AVAX</span>
            </div>
          </div>

          <div className="detail-item">
            <FaClock className="detail-icon" />
            <div className="detail-content">
              <span className="detail-label">Duration</span>
              <span className="detail-value">{selectedPlan.duration} days</span>
            </div>
          </div>
        </div>

        <div className="features-list">
          <h4>Plan Features:</h4>
          <ul>
            {selectedPlan.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>

        <button
          onClick={createSubscription}
          className="create-button"
          disabled={isLoading}
        >
          Confirm Subscription
        </button>
      </div>
    </div>
  );
}

export default CreateSubscription;

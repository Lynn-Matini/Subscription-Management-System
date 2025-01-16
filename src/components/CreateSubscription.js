import React, { useState, useContext, useEffect } from 'react';
import AppContext from '../context/AppContext';
import { saveUserSubscription } from '../firebase/userService';
import { FaArrowLeft, FaClock, FaCoins } from 'react-icons/fa';
import Web3 from 'web3';

function CreateSubscription({ selectedService, selectedPlan }) {
  const { contract, account, addNotification, setIsLoading, darkMode, web3 } =
    useContext(AppContext);
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

  const createSubscription = async () => {
    if (!contract || !account) {
      addNotification('Please connect your wallet first');
      return;
    }

    const balance = await checkBalance();
    if (!balance) return;

    setIsLoading(true);
    try {
      console.log('Contract Address:', contract._address);
      console.log('Account:', account);
      console.log('Price in Wei:', subscriptionPrice);
      console.log(
        'Price in AVAX:',
        Web3.utils.fromWei(subscriptionPrice, 'ether')
      );
      console.log('Duration in seconds:', subscriptionDuration);

      // Get contract balance
      const contractBalance = await web3.eth.getBalance(contract._address);
      console.log(
        'Contract balance:',
        Web3.utils.fromWei(contractBalance, 'ether'),
        'AVAX'
      );

      let gasEstimate;
      try {
        gasEstimate = await contract.methods
          .createSubscription(subscriptionPrice, subscriptionDuration)
          .estimateGas({
            from: account,
          });
        console.log('Gas estimate successful:', gasEstimate);
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        throw gasError;
      }

      const gasLimit = Math.floor(Number(gasEstimate) * 1.3);

      const result = await contract.methods
        .createSubscription(subscriptionPrice, subscriptionDuration)
        .send({
          from: account,
          gasLimit: gasLimit,
        });

      console.log('Transaction result:', result);

      // Wait for a few blocks to ensure the subscription is created
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const subscriptionId = getSubscriptionIdFromEvent(result);

      if (subscriptionId !== null) {
        console.log('Created subscription ID:', subscriptionId);

        try {
          // Wrap the getSubscription call in a try-catch block
          let subscription;
          try {
            subscription = await contract.methods
              .getSubscription(subscriptionId)
              .call();
          } catch (error) {
            console.error('Error in getSubscription call:', error);
            // Create a minimal subscription object if the call fails
            subscription = {
              price: subscriptionPrice,
              duration: subscriptionDuration,
              startTime: Math.floor(Date.now() / 1000),
              subscriber: account,
              isActive: true,
              isCancelled: false,
            };
          }

          console.log('Fetched subscription:', subscription);

          // Format the subscription data before saving
          const formattedSubscription = {
            id: subscriptionId,
            price: subscription.price.toString(),
            duration: subscription.duration.toString(),
            startTime: subscription.startTime.toString(),
            subscriber: subscription.subscriber,
            isActive: subscription.isActive,
            isCancelled: subscription.isCancelled,
          };

          await saveUserSubscription(
            account,
            formattedSubscription,
            selectedService,
            selectedPlan
          );

          addNotification(
            `Subscription created successfully for ${selectedService.name}!`
          );
          window.dispatchEvent(new CustomEvent('subscriptionCreated'));
        } catch (fetchError) {
          console.error('Error handling subscription details:', fetchError);
          addNotification(
            'Subscription created, but details could not be saved properly.'
          );
        }
      } else {
        console.error('Could not get subscription ID from event.');
        addNotification('Subscription creation failed. Could not retrieve ID.');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      let errorMessage = 'Error creating subscription. Please try again.';

      if (error.message.includes('User denied transaction signature')) {
        errorMessage = 'Transaction was cancelled';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient AVAX balance';
      } else if (error.message.includes('execution reverted')) {
        try {
          const revertReason = error.data.message.substring(
            error.data.message.indexOf('reverted: ') + 'reverted: '.length
          );
          errorMessage = `Transaction reverted: ${revertReason}`;
        } catch (e) {
          errorMessage = 'Transaction reverted. Please check your input.';
        }
      } else if (error.message.includes('Internal JSON-RPC error.')) {
        errorMessage = 'Network error. Please try again later.';
      }

      addNotification(errorMessage);
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
          disabled={!contract}
        >
          Confirm Subscription
        </button>
      </div>
    </div>
  );
}

export default CreateSubscription;

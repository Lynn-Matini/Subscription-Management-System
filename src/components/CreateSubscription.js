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
      // Estimate gas with more details
      try {
        gasEstimate = await contract.methods
          .createSubscription(subscriptionPrice, subscriptionDuration)
          .estimateGas({
            from: account,
          });
        console.log('Gas estimate successful:', gasEstimate);
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        // Try to get more error details
        try {
          await contract.methods
            .createSubscription(subscriptionPrice, subscriptionDuration)
            .call({ from: account });
        } catch (callError) {
          console.error('Call simulation failed:', callError);
        }
        throw gasError;
      }

      // Convert BigInt to number and add 30% buffer to gas estimate
      const gasLimit = Math.floor(Number(gasEstimate) * 1.3);

      console.log('Creating subscription with params:', {
        price: subscriptionPrice,
        duration: subscriptionDuration,
        from: account,
        gasLimit,
      });

      // Send transaction
      const result = await contract.methods
        .createSubscription(subscriptionPrice, subscriptionDuration)
        .send({
          from: account,
          gas: gasLimit,
        });

      console.log('Transaction result:', result);

      // Get subscription ID from transaction logs
      const subscriptionCreatedEvent = result.events.SubscriptionCreated;
      console.log('Event data:', subscriptionCreatedEvent); // Debug log

      if (!subscriptionCreatedEvent) {
        console.error('Events from transaction:', result.events);
        throw new Error('SubscriptionCreated event not found in transaction');
      }

      // Replace the current subscription ID extraction with this
      const subscriptionId = Web3.utils.hexToNumber(
        subscriptionCreatedEvent.raw.data.slice(0, 66)
      );
      console.log('Created subscription ID:', subscriptionId);

      if (!subscriptionId) {
        // Custom serializer to handle BigInt values
        const customStringify = (obj) => {
          return JSON.stringify(
            obj,
            (key, value) => {
              if (typeof value === 'bigint') {
                return value.toString();
              }
              return value;
            },
            2
          );
        };

        console.error(
          'Full event data:',
          customStringify(subscriptionCreatedEvent)
        );
        throw new Error('Invalid subscription ID returned from transaction');
      }

      // Convert subscription ID to string if it's a BigInt
      const subscriptionIdString = subscriptionId.toString();

      // Get the subscription details from the contract
      try {
        const subscription = await contract.methods
          .getSubscription(subscriptionIdString)
          .call();
        console.log('Raw subscription data:', subscription);

        await saveUserSubscription(
          account,
          {
            id: subscriptionIdString,
            price: subscription[0], // price is first return value
            duration: subscription[1], // duration is second return value
            startTime: subscription[2], // startTime is third return value
            subscriber: subscription[3], // subscriber is fourth return value
            isActive: subscription[4], // isActive is fifth return value
            isCancelled: subscription[5], // isCancelled is sixth return value
          },
          selectedService,
          selectedPlan
        );

        addNotification(
          `Subscription created successfully for ${selectedService.name}!`
        );
        window.dispatchEvent(new CustomEvent('subscriptionCreated'));
      } catch (error) {
        console.error('Error fetching subscription details:', error);
        throw new Error('Failed to fetch subscription details after creation');
      }

      console.log('Full transaction result:', JSON.stringify(result, null, 2));
      console.log('Events:', result.events);
    } catch (error) {
      console.error('Error creating subscription:', error);
      if (error.message.includes('User denied')) {
        addNotification('Transaction was cancelled');
      } else if (error.message.includes('insufficient funds')) {
        addNotification('Insufficient AVAX balance');
      } else if (error.message.includes('execution reverted')) {
        addNotification(
          'Transaction failed. Please check your balance and try again.'
        );
      } else {
        addNotification('Error creating subscription. Please try again.');
      }
    } finally {
      setIsLoading(false);
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

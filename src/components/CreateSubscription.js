import React, { useState, useContext, useEffect } from 'react';
import AppContext from '../context/AppContext';
import { saveUserSubscription } from '../firebase/userService';
import { FaClock, FaCoins } from 'react-icons/fa';
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

  const getSubscriptionIdFromEvent = (result) => {
    const subscriptionCreatedEvent = result.events.SubscriptionCreated;
    if (subscriptionCreatedEvent) {
      if (
        subscriptionCreatedEvent.topics &&
        subscriptionCreatedEvent.topics.length > 1
      ) {
        const subscriptionIdHex = subscriptionCreatedEvent.topics[1];
        try {
          const subscriptionId = web3.utils.hexToNumber(subscriptionIdHex);
          console.log('Extracted subscriptionId (hex):', subscriptionIdHex);
          console.log('Extracted subscriptionId (decimal):', subscriptionId);
          return subscriptionId;
        } catch (error) {
          console.error('Error decoding subscriptionId:', error);
          return null;
        }
      } else {
        console.error('Topics array is missing or has insufficient length.');
        return null;
      }
    } else {
      console.error(
        'SubscriptionCreated event not found in transaction receipt',
        result
      );
      return null;
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

      try {
        const result = await contract.methods
          .createSubscription(subscriptionPrice, subscriptionDuration)
          .send({
            from: account,
            gasLimit: gasLimit,
          });

        console.log('Transaction result:', result);

        const subscriptionId = getSubscriptionIdFromEvent(result);

        if (subscriptionId !== null) {
          console.log('Created subscription ID:', subscriptionId);

          try {
            const subscription = await contract.methods
              .getSubscription(subscriptionId)
              .call();
            console.log('Fetched subscription:', subscription);

            await saveUserSubscription(
              account,
              { id: subscriptionId, ...subscription },
              selectedService,
              selectedPlan
            );

            addNotification(
              `Subscription created successfully for ${selectedService.name}!`
            );
            window.dispatchEvent(new CustomEvent('subscriptionCreated'));
          } catch (fetchError) {
            console.error('Error fetching subscription details:', fetchError);
            addNotification(
              'Subscription created, but details could not be retrieved.'
            );
          }
        } else {
          console.error('Could not get subscription ID from event.');
          addNotification(
            'Subscription creation failed. Could not retrieve ID.'
          );
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

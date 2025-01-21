import { useEffect, useContext } from 'react';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import AppContext from '../context/AppContext';
import { parseEther, formatEther } from 'ethers';

function SubscriptionMonitor() {
  const { account, contract, addNotification, web3 } = useContext(AppContext);

  const checkAndProcessRenewals = async () => {
    if (!account || !contract || !web3) return;

    try {
      const q = query(
        collection(db, 'userSubscriptions'),
        where('userId', '==', account.toLowerCase()),
        where('autoRenew', '==', true),
        where('status', '==', 'active'),
        where('isCancelled', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const now = Math.floor(Date.now() / 1000);

      for (const doc of querySnapshot.docs) {
        const subscription = doc.data();
        
        // Check if subscription is near expiration (within 30 seconds)
        if (subscription.endTime - now <= 30 && subscription.endTime > now) {
          let totalRequired;
          try {
            // Check wallet balance first
            const balance = await web3.eth.getBalance(account);
            const requiredAmount = parseEther(subscription.price.toString());
            const gasEstimate = await contract.subscribe.estimateGas(
              subscription.duration,
              { 
                value: requiredAmount,
                from: account
              }
            );
            const gasPrice = await web3.eth.getGasPrice();
            totalRequired = requiredAmount + (gasEstimate * gasPrice);
            
            console.log('Balance check:', {
              balance: formatEther(balance),
              required: formatEther(requiredAmount),
              gasEstimate: gasEstimate.toString(),
              gasPrice: formatEther(gasPrice),
              totalRequired: formatEther(totalRequired)
            });
            
            if (balance < totalRequired) {
              throw new Error('Insufficient balance for renewal');
            }

            // Create the transaction
            const tx = await contract.subscribe(
              subscription.duration,
              { 
                value: requiredAmount,
                from: account,
                gasLimit: Math.ceil(gasEstimate * 1.2) // Add 20% buffer
              }
            );

            await tx.wait();

            // Update subscription in Firestore after successful payment
            const newEndTime = now + subscription.duration;
            await updateDoc(doc.ref, {
              startTime: now,
              endTime: newEndTime,
              updatedAt: new Date().toISOString(),
              lastRenewalTime: now,
              transactionHash: tx.hash,
              status: 'active'
            });

            addNotification('Subscription auto-renewed successfully!');
          } catch (error) {
            console.error('Auto-renewal failed:', error);
            
            let errorMessage = 'Auto-renewal failed. ';
            if (error.message.includes('Insufficient balance')) {
              errorMessage += `Insufficient wallet balance for renewal. Required: ${formatEther(totalRequired)} ETH`;
            } else if (error.code === 4001) {
              errorMessage += 'Transaction was rejected.';
            } else {
              errorMessage += 'Please check your wallet balance and approve the transaction.';
            }
            
            addNotification(errorMessage);
            
            // Disable auto-renew on failure
            await updateDoc(doc.ref, {
              autoRenew: false,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking renewals:', error);
    }
  };

  useEffect(() => {
    if (!contract || !web3) return;
    
    // Check every 15 seconds
    const interval = setInterval(checkAndProcessRenewals, 15000);
    return () => clearInterval(interval);
  }, [account, contract, web3]);

  return null;
}

export default SubscriptionMonitor; 
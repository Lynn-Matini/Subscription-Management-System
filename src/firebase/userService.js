import { doc, setDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from './config';

// Create or update user in Firestore when they connect wallet
export const saveUserToFirestore = async (walletAddress) => {
  try {
    const userRef = doc(db, 'users', walletAddress.toLowerCase());
    await setDoc(userRef, {
      walletAddress: walletAddress.toLowerCase(),
      lastConnected: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

// Save a new subscription for a user
export const saveUserSubscription = async (walletAddress, subscription, service, plan) => {
  try {
    console.log('Starting to save subscription to Firestore...');
    console.log('Subscription data:', { walletAddress, subscription, service, plan });
    
    const userSubscriptionsRef = collection(db, 'userSubscriptions');
    console.log('Collection reference created for userSubscriptions');
    
    // Add retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        const docRef = await addDoc(userSubscriptionsRef, {
          userId: walletAddress.toLowerCase(),
          subscriptionId: subscription.id,
          serviceId: service.id,
          planId: plan.id,
          serviceName: service.name,
          planName: plan.name,
          price: subscription.price,
          duration: subscription.duration,
          startTime: subscription.startTime,
          createdAt: new Date().toISOString(),
          status: 'active'
        });
        console.log('Subscription saved successfully to Firestore with ID:', docRef.id);
        break;
      } catch (error) {
        console.error('Error in save attempt:', error);
        retries--;
        if (retries === 0) throw error;
        console.log(`Retrying... ${retries} attempts left`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error('Error saving subscription to Firestore:', error);
    throw error;
  }
};

// Get user's subscriptions
export const getUserSubscriptions = async (walletAddress) => {
  try {
    console.log('Fetching subscriptions for wallet:', walletAddress);
    const q = query(
      collection(db, 'userSubscriptions'), 
      where('userId', '==', walletAddress.toLowerCase())
    );
    const querySnapshot = await getDocs(q);
    const subscriptions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('Found subscriptions:', subscriptions);
    return subscriptions;
  } catch (error) {
    console.error('Error fetching user subscriptions from Firestore:', error);
    throw error;
  }
}; 
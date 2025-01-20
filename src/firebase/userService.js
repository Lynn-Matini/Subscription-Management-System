import { doc, setDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, getDb } from './config';

// Create or update user in Firestore when they connect wallet
export const saveUserToFirestore = async (walletAddress) => {
  try {
    if (!walletAddress) {
      console.error('Invalid wallet address');
      return;
    }

    const sanitizedAddress = walletAddress.toLowerCase().trim();
    const database = getDb(); // Use the new getter function
    
    console.log('Attempting to save user:', sanitizedAddress);
    
    const userRef = doc(database, 'users', sanitizedAddress);
    await setDoc(userRef, {
      walletAddress: sanitizedAddress,
      lastConnected: new Date().toISOString(),
    }, { merge: true });
    
    console.log('User saved successfully');
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

// Save a new subscription for a user
export const saveUserSubscription = async (walletAddress, subscription, service, plan) => {
  try {
    console.log('Starting to save subscription to Firestore...');
    
    // Convert BigInt values to strings before saving
    const formattedSubscription = {
      userId: walletAddress.toLowerCase(),
      subscriptionId: subscription.id.toString(),
      serviceId: service.id,
      planId: plan.id,
      serviceName: service.name,
      planName: plan.name,
      price: subscription.price.toString(),
      duration: subscription.duration.toString(),
      startTime: subscription.startTime.toString(),
      createdAt: new Date().toISOString(),
      status: 'inactive',
      autoRenew: false,
      // Add these fields to make subscriptions service-specific
      specificService: service.id,
      specificPlan: plan.id
    };

    console.log('Formatted subscription data:', formattedSubscription);
    
    // Check if subscription already exists
    const existingSubscription = await checkExistingSubscription(
      walletAddress,
      subscription.id.toString(),
      service.id
    );

    if (existingSubscription) {
      console.log('Subscription already exists, skipping save');
      return;
    }
    
    const userSubscriptionsRef = collection(db, 'userSubscriptions');
    const docRef = await addDoc(userSubscriptionsRef, formattedSubscription);
    console.log('Subscription saved successfully to Firestore with ID:', docRef.id);
    
  } catch (error) {
    console.error('Error saving subscription to Firestore:', error);
    throw error;
  }
};

// Add this new function to check for existing subscriptions
const checkExistingSubscription = async (walletAddress, subscriptionId, serviceId) => {
  const q = query(
    collection(db, 'userSubscriptions'),
    where('userId', '==', walletAddress.toLowerCase()),
    where('subscriptionId', '==', subscriptionId),
    where('specificService', '==', serviceId)
  );
  
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

// Get user's subscriptions
export const getUserSubscriptions = async (walletAddress, serviceId = null) => {
  try {
    console.log('Fetching subscriptions for wallet:', walletAddress);
    let q;
    
    if (serviceId) {
      // If serviceId is provided, filter by both user and service
      q = query(
        collection(db, 'userSubscriptions'),
        where('userId', '==', walletAddress.toLowerCase()),
        where('specificService', '==', serviceId)
      );
    } else {
      // If no serviceId, just filter by user
      q = query(
        collection(db, 'userSubscriptions'),
        where('userId', '==', walletAddress.toLowerCase())
      );
    }
    
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

// Add this function to update auto-renew setting
export const updateSubscriptionAutoRenew = async (walletAddress, subscriptionId, autoRenew) => {
  try {
    const q = query(
      collection(db, 'userSubscriptions'),
      where('userId', '==', walletAddress.toLowerCase()),
      where('subscriptionId', '==', subscriptionId)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, { autoRenew });
    }
  } catch (error) {
    console.error('Error updating auto-renew:', error);
    throw error;
  }
};

// Add delete subscription function
export const deleteSubscription = async (subscriptionId) => {
  try {
    const q = query(
      collection(db, 'userSubscriptions'),
      where('subscriptionId', '==', subscriptionId)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await deleteDoc(docRef);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting subscription:', error);
    throw error;
  }
}; 
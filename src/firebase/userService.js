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
    const userSubscriptionsRef = collection(db, 'userSubscriptions');
    await addDoc(userSubscriptionsRef, {
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
  } catch (error) {
    console.error('Error saving subscription:', error);
    throw error;
  }
};

// Get user's subscriptions
export const getUserSubscriptions = async (walletAddress) => {
  try {
    const q = query(
      collection(db, 'userSubscriptions'), 
      where('userId', '==', walletAddress.toLowerCase())
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    throw error;
  }
}; 
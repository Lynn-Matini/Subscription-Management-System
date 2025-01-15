import { collection, getDocs, deleteDoc, writeBatch, doc, query, where } from 'firebase/firestore';
import { db } from './config';

const subscriptionPlans = [
  // Nation Media Plans
  {
    serviceId: 1,
    name: "Monthly",
    price: "0.01",
    duration: 30,
    features: [
      "Daily news access",
      "E-paper access",
      "Breaking news alerts",
      "Basic article commenting"
    ]
  },
  {
    serviceId: 1,
    name: "6 Months",
    price: "0.05",
    duration: 180,
    features: [
      "All Monthly features",
      "Premium articles",
      "Archive access",
      "Ad-free experience",
      "15% discount"
    ]
  },
  {
    serviceId: 1,
    name: "Yearly",
    price: "0.08",
    duration: 365,
    features: [
      "All 6 Months features",
      "Exclusive content",
      "Priority customer support",
      "Multiple device access",
      "25% discount",
      "Magazine subscription included"
    ]
  },

  // Showmax Kenya Plans
  {
    serviceId: 2,
    name: "Monthly",
    price: "0.015",
    duration: 30,
    features: [
      "HD streaming",
      "Watch on 1 device",
      "Download shows",
      "No ads"
    ]
  },
  {
    serviceId: 2,
    name: "6 Months",
    price: "0.025",
    duration: 180,
    features: [
      "Full HD streaming",
      "Watch on 2 devices",
      "Download shows",
      "No ads",
      "15% discount",
      "Offline viewing"
    ]
  },
  {
    serviceId: 2,
    name: "Yearly",
    price: "0.045",
    duration: 365,
    features: [
      "4K Ultra HD",
      "Watch on 4 devices",
      "Download shows",
      "No ads",
      "Offline viewing",
      "25% discount",
      "Early access to new releases"
    ]
  },

  // DSTV Plans
  {
    serviceId: 3,
    name: "Monthly",
    price: "0.02",
    duration: 30,
    features: [
      "Basic channels",
      "SD quality",
      "1 device",
      "Basic support"
    ]
  },
  {
    serviceId: 3,
    name: "6 Months",
    price: "0.035",
    duration: 180,
    features: [
      "All channels",
      "HD quality",
      "2 devices",
      "Premium support",
      "Recording feature",
      "15% discount"
    ]
  },
  {
    serviceId: 3,
    name: "Yearly",
    price: "0.06",
    duration: 365,
    features: [
      "All 6 Months features",
      "4K quality",
      "4 devices",
      "Priority support",
      "Unlimited recording",
      "25% discount",
      "Sports channels"
    ]
  },

  // Mdundo Plans
  {
    serviceId: 4,
    name: "Monthly",
    price: "0.008",
    duration: 30,
    features: [
      "Ad-free music",
      "Basic quality",
      "Offline mode",
      "Basic playlists"
    ]
  },
  {
    serviceId: 4,
    name: "6 Months",
    price: "0.03",
    duration: 180,
    features: [
      "High quality audio",
      "Custom playlists",
      "Lyrics access",
      "Premium support",
      "15% discount"
    ]
  },
  {
    serviceId: 4,
    name: "Yearly",
    price: "0.05",
    duration: 365,
    features: [
      "All 6 Months features",
      "Highest quality audio",
      "Unlimited downloads",
      "Priority support",
      "25% discount",
      "Early access to new releases"
    ]
  },

  // Elimu Library Plans
  {
    serviceId: 5,
    name: "Monthly",
    price: "0.012",
    duration: 30,
    features: [
      "Basic access",
      "Download PDFs",
      "Basic search",
      "Community support"
    ]
  },
  {
    serviceId: 5,
    name: "6 Months",
    price: "0.04",
    duration: 180,
    features: [
      "Full access",
      "Advanced search",
      "Citation tools",
      "Premium support",
      "15% discount"
    ]
  },
  {
    serviceId: 5,
    name: "Yearly",
    price: "0.07",
    duration: 365,
    features: [
      "All 6 Months features",
      "Research tools",
      "API access",
      "Priority support",
      "25% discount",
      "Exclusive webinars"
    ]
  }
];

// Function to clear existing plans
const clearExistingPlans = async () => {
  try {
    const plansRef = collection(db, 'subscriptionPlans');
    const existingPlans = await getDocs(plansRef);
    
    // Delete all existing plans
    const deletePromises = existingPlans.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
    console.log('Cleared existing plans');
  } catch (error) {
    console.error('Error clearing plans:', error);
    throw error;
  }
};

// Function to seed subscription plans
export const seedSubscriptionPlans = async () => {
  try {
    // Always clear existing plans first
    await clearExistingPlans();

    // Verify we have exactly 15 plans (3 plans for each of 5 services)
    if (subscriptionPlans.length !== 15) {
      throw new Error(`Expected 15 subscription plans, but found ${subscriptionPlans.length}`);
    }

    // Add metadata to each plan
    const plansToSeed = subscriptionPlans.map(plan => ({
      ...plan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // Use batch write for atomic operation
    const plansRef = collection(db, 'subscriptionPlans');
    const batch = writeBatch(db);

    // Add each plan with a unique document ID
    plansToSeed.forEach(plan => {
      // Create a unique document ID based on service and plan name
      const uniqueId = `service${plan.serviceId}_${plan.name.toLowerCase().replace(/\s+/g, '_')}`;
      const docRef = doc(plansRef, uniqueId);
      batch.set(docRef, plan);
    });

    // Commit the batch
    await batch.commit();
    console.log(`Successfully seeded ${plansToSeed.length} subscription plans`);

    // Verify the number of plans in Firestore
    const verificationSnapshot = await getDocs(plansRef);
    const actualCount = verificationSnapshot.size;
    console.log(`Verification: ${actualCount} plans in database`);
    
    if (actualCount !== 15) {
      console.error(`Warning: Expected 15 plans, but found ${actualCount} in database`);
    }

  } catch (error) {
    console.error('Error seeding subscription plans:', error);
    throw error;
  }
};

// Function to get plans for a specific service
export const getServicePlans = async (serviceId) => {
  try {
    const plansRef = collection(db, 'subscriptionPlans');
    const q = query(plansRef, where('serviceId', '==', serviceId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching service plans:', error);
    throw error;
  }
}; 
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './config';

const subscriptionPlans = [
  // Nation Media Plans
  {
    serviceId: 1,
    name: "Monthly",
    price: "10",
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
    name: "Half Year",
    price: "50",
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
    name: "Annual",
    price: "90",
    duration: 365,
    features: [
      "All Half Year features",
      "Exclusive content",
      "Priority customer support",
      "Multiple device access",
      "25% discount",
      "Magazine subscription included"
    ]
  },

  // Netflix-like Streaming Plans
  {
    serviceId: 2,
    name: "Basic",
    price: "15",
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
    name: "Standard",
    price: "75",
    duration: 180,
    features: [
      "Full HD streaming",
      "Watch on 2 devices",
      "Download shows",
      "No ads",
      "Offline viewing",
      "15% discount"
    ]
  },
  {
    serviceId: 2,
    name: "Premium",
    price: "140",
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

  // Developer Platform Plans
  {
    serviceId: 3,
    name: "Basic",
    price: "20",
    duration: 30,
    features: [
      "Basic API access",
      "100 requests/day",
      "Community support",
      "Basic documentation"
    ]
  },
  {
    serviceId: 3,
    name: "Pro",
    price: "100",
    duration: 180,
    features: [
      "Advanced API access",
      "1000 requests/day",
      "Priority support",
      "Advanced documentation",
      "Custom integrations",
      "15% discount"
    ]
  },
  {
    serviceId: 3,
    name: "Enterprise",
    price: "180",
    duration: 365,
    features: [
      "Unlimited API access",
      "Unlimited requests",
      "24/7 dedicated support",
      "Full documentation",
      "Custom solutions",
      "25% discount",
      "Dedicated account manager"
    ]
  },

  // Music Streaming Plans
  {
    serviceId: 4,
    name: "Basic",
    price: "8",
    duration: 30,
    features: [
      "Ad-supported streaming",
      "Basic audio quality",
      "Mobile listening",
      "Create playlists"
    ]
  },
  {
    serviceId: 4,
    name: "Premium",
    price: "40",
    duration: 180,
    features: [
      "Ad-free streaming",
      "High quality audio",
      "Offline mode",
      "Multi-device support",
      "Lyrics access",
      "15% discount"
    ]
  },
  {
    serviceId: 4,
    name: "Family",
    price: "70",
    duration: 365,
    features: [
      "Up to 6 accounts",
      "Highest quality audio",
      "Offline mode",
      "Multi-device support",
      "Lyrics access",
      "25% discount",
      "Parental controls"
    ]
  },

  // Online Learning Plans
  {
    serviceId: 5,
    name: "Basic",
    price: "25",
    duration: 30,
    features: [
      "Access to basic courses",
      "Course completion certificates",
      "Mobile learning",
      "Basic assessments"
    ]
  },
  {
    serviceId: 5,
    name: "Professional",
    price: "120",
    duration: 180,
    features: [
      "Access to all courses",
      "Professional certificates",
      "Mentor support",
      "Practice exercises",
      "Project reviews",
      "15% discount"
    ]
  },
  {
    serviceId: 5,
    name: "Master",
    price: "200",
    duration: 365,
    features: [
      "All Professional features",
      "Specialized certifications",
      "1-on-1 mentoring",
      "Career guidance",
      "Job placement support",
      "25% discount",
      "Industry networking events"
    ]
  }
];

// Function to seed subscription plans
export const seedSubscriptionPlans = async () => {
  try {
    // Check if plans already exist
    const plansRef = collection(db, 'subscriptionPlans');
    const existingPlans = await getDocs(plansRef);
    
    if (!existingPlans.empty) {
      console.log('Plans already exist in the database');
      return;
    }

    // Add all plans
    const addPromises = subscriptionPlans.map(plan => addDoc(plansRef, plan));
    await Promise.all(addPromises);
    
    console.log('Successfully seeded subscription plans');
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
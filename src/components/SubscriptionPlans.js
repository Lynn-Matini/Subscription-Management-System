import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

function SubscriptionPlans({ selectedService, onSelectPlan }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      if (!selectedService?.id) return;
      
      try {
        setLoading(true);
        const plansRef = collection(db, 'subscriptionPlans');
        const q = query(plansRef, where('serviceId', '==', selectedService.id));
        const querySnapshot = await getDocs(q);
        
        // Create a Map to ensure uniqueness based on serviceId and name combination
        const uniquePlansMap = new Map();
        
        querySnapshot.docs.forEach(doc => {
          const plan = { id: doc.id, ...doc.data() };
          const key = `${plan.serviceId}-${plan.name}`;
          
          // Only store the first occurrence of each plan
          if (!uniquePlansMap.has(key)) {
            uniquePlansMap.set(key, plan);
          }
        });

        // Convert Map values to array and sort
        const sortedPlans = Array.from(uniquePlansMap.values()).sort((a, b) => {
          const order = {
            "Monthly": 1,
            "6 Months": 2,
            "Yearly": 3
          };
          return order[a.name] - order[b.name];
        });

        console.log(`Fetched ${sortedPlans.length} unique plans for service ${selectedService.name}`);
        setPlans(sortedPlans);
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [selectedService]);

  if (loading) {
    return <div className="loading">Loading plans...</div>;
  }

  return (
    <div className="subscription-plans">
      <h3>Choose a Subscription Plan for {selectedService.name}</h3>
      <div className="plans-grid">
        {plans.map((plan) => (
          <div 
            key={`${plan.serviceId}-${plan.name}-${plan.id}`}
            className="plan-card"
            onClick={() => onSelectPlan(plan)}
          >
            <h4>{plan.name}</h4>
            <div className="plan-price">
              <span className="amount">{plan.price}</span>
              <span className="currency">AVAX</span>
            </div>
            <div className="plan-duration">{plan.duration} days</div>
            <ul className="plan-features">
              {plan.features.map((feature, index) => (
                <li key={`${plan.id}-feature-${index}`}>{feature}</li>
              ))}
            </ul>
            <button className="select-plan-button">
              Select Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SubscriptionPlans; 
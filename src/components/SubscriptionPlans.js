import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

function SubscriptionPlans({ selectedService, onSelectPlan }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansRef = collection(db, 'subscriptionPlans');
        const q = query(plansRef, where('serviceId', '==', selectedService.id));
        const querySnapshot = await getDocs(q);
        
        const plansList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPlans(plansList);
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedService) {
      fetchPlans();
    }
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
            key={plan.id} 
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
                <li key={index}>{feature}</li>
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
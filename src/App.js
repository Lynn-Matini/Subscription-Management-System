// frontend/src/App.js
import React, { useContext, useState } from 'react';
import './App.css';
import AppContext from './context/AppContext';
import CreateSubscription from './components/CreateSubscription';
import ProcessPayment from './components/ProcessPayment';
import SubscriptionDetails from './components/SubscriptionDetails';
import SubscriptionsList from './components/SubscriptionsList';
import Notifications from './components/Notifications';
import ConnectWallet from './components/ConnectWallet';
import ServiceIcons from './components/ServiceIcons';
import { FaMoon, FaSun } from 'react-icons/fa';

function App() {
  const { account, darkMode, setDarkMode, notifications } = useContext(AppContext);
  const [selectedService, setSelectedService] = useState(null);

  return (
    <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
      <div className="top-bar">
        <div className="logo">
          <h1>Subscription Manager</h1>
        </div>
        <div className="controls">
          <button 
            className="icon-button"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <ConnectWallet />
        </div>
      </div>

      <main className="main-content">
        {!account ? (
          <div className="welcome-screen">
            <h2>Welcome to Subscription Manager</h2>
            <p>Connect your wallet to manage subscriptions</p>
            <ServiceIcons onServiceSelect={setSelectedService} />
          </div>
        ) : (
          <div>
            <p className="account-info">Connected: {account}</p>
            {selectedService ? (
              <>
                <CreateSubscription selectedService={selectedService} />
                <SubscriptionsList />
                <ProcessPayment />
                <SubscriptionDetails />
              </>
            ) : (
              <ServiceIcons onServiceSelect={setSelectedService} />
            )}
          </div>
        )}
        <Notifications notifications={notifications} />
      </main>
    </div>
  );
}

export default App;

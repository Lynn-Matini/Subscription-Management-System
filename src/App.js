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
import { FaMoon, FaSun, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';

function App() {
  const { account, darkMode, setDarkMode, notifications } = useContext(AppContext);
  const [selectedService, setSelectedService] = useState(null);
  const [showFullAddress, setShowFullAddress] = useState(false);

  const handleBack = () => {
    setSelectedService(null);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return showFullAddress ? address : `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
      <div className="top-bar">
        {account && selectedService && (
          <button 
            className="icon-button back-button"
            onClick={handleBack}
            aria-label="Back to services"
          >
            <FaArrowLeft />
          </button>
        )}
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
            <div className="account-info-container">
              <p className="account-info">
                Connected: {formatAddress(account)}
                <button
                  className="icon-button address-toggle"
                  onClick={() => setShowFullAddress(!showFullAddress)}
                  aria-label="Toggle address visibility"
                >
                  {showFullAddress ? <FaEyeSlash /> : <FaEye />}
                </button>
              </p>
            </div>
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

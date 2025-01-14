// frontend/src/App.js
import React, { useContext } from 'react';
import './App.css';
// import avax from './avax.svg';
import AppContext from './context/AppContext';
import CreateSubscription from './components/CreateSubscription';
import ProcessPayment from './components/ProcessPayment';
import SubscriptionDetails from './components/SubscriptionDetails';
import Notifications from './components/Notifications';
import ConnectWallet from './components/ConnectWallet';

function App() {
  const { account, darkMode, setDarkMode } = useContext(AppContext);

  return (
    <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
      <button onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
      <header className="App-header">
        {/* <img src={avax} className="App-logo" alt="logo" /> */}
        <h1>Subscription Manager</h1>
        {!account ? (
          <ConnectWallet />
        ) : (
          <div>
            <p>Connected Account: {account}</p>
            <CreateSubscription />
            <ProcessPayment />
            <SubscriptionDetails />
            <Notifications />
          </div>
        )}
      </header>
    </div>
  );
}

export default App;

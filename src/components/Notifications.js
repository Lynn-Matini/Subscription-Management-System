// frontend/src/components/Notifications.js
import React from 'react';

function Notifications({ notifications = [] }) {
  return (
    <div className="notifications">
      {notifications?.map((notification, index) => (
        <div key={index} className="notification">
          {notification}
        </div>
      ))}
    </div>
  );
}

export default Notifications;

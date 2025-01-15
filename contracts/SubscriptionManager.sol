// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SubscriptionManager {
    struct Subscription {
        uint256 price;
        uint256 duration;
        uint256 startTime;
        address subscriber;
        bool isActive;
        bool isCancelled;
    }

    mapping(uint256 => Subscription) public subscriptions;
    uint256 public subscriptionCount = 0;

    event SubscriptionCreated(uint256 subscriptionId, address subscriber, uint256 price, uint256 duration);
    event PaymentProcessed(uint256 subscriptionId);
    event SubscriptionCancelled(uint256 subscriptionId);

    function createSubscription(uint256 _price, uint256 _duration) public {
        require(_price > 0, "Price must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        
        subscriptionCount++;
        subscriptions[subscriptionCount] = Subscription({
            price: _price,
            duration: _duration,
            startTime: block.timestamp,
            subscriber: msg.sender,
            isActive: true,
            isCancelled: false
        });

        emit SubscriptionCreated(subscriptionCount, msg.sender, _price, _duration);
    }

    function getSubscription(uint256 _subscriptionId) public view returns (
        uint256 price,
        uint256 duration,
        uint256 startTime,
        address subscriber,
        bool isActive,
        bool isCancelled
    ) {
        Subscription storage sub = subscriptions[_subscriptionId];
        return (
            sub.price,
            sub.duration,
            sub.startTime,
            sub.subscriber,
            sub.isActive,
            sub.isCancelled
        );
    }

    function processPayment(uint256 _subscriptionId) public payable {
        Subscription storage sub = subscriptions[_subscriptionId];
        require(msg.value == sub.price, "Incorrect payment amount");
        require(!sub.isCancelled, "Subscription is cancelled");
        
        if (block.timestamp >= sub.startTime + sub.duration) {
            sub.startTime = block.timestamp;
        } else {
            sub.startTime = sub.startTime + sub.duration;
        }
        
        sub.isActive = true;
        emit PaymentProcessed(_subscriptionId);
    }

    function cancelSubscription(uint256 _subscriptionId) public {
        Subscription storage sub = subscriptions[_subscriptionId];
        require(msg.sender == sub.subscriber, "Not subscription owner");
        require(!sub.isCancelled, "Already cancelled");
        
        sub.isCancelled = true;
        sub.isActive = false;
        emit SubscriptionCancelled(_subscriptionId);
    }
}
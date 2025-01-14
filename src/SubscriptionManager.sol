// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SubscriptionManager {
    //Custom data type that holds these for each subscription
    struct Subscription {
        uint256 price;
        uint256 duration; // in seconds
        uint256 startTime;
        address subscriber;
    }

    //Mapping that stores subscriptions
    //public keyword automatically generates a getter function for the mapping
    mapping(uint256 => Subscription) public subscriptions;
    uint256 public subscriptionCount = 0;

    event SubscriptionCreated(uint256 subscriptionId, address subscriber, uint256 price, uint256 duration);
    event PaymentProcessed(uint256 subscriptionId);

    function createSubscription(uint256 _price, uint256 _duration) public {
        subscriptionCount++;
        subscriptions[subscriptionCount] = Subscription(_price, _duration, block.timestamp, msg.sender);
        emit SubscriptionCreated(subscriptionCount, msg.sender, _price, _duration);
    }

    //payable keyword indicates that the function can receive Ether
    function processPayment(uint256 _subscriptionId) public payable {
        require(msg.value == subscriptions[_subscriptionId].price, "Incorrect payment amount.");
        emit PaymentProcessed(_subscriptionId);
    }

    //view keyword indicates that the function doesn't modify contract's state
    //returns (Subscription memory) means that function returns a copy of the Subscription struct in memory
    function getSubscription(uint256 _subscriptionId) public view returns (Subscription memory) {
        return subscriptions[_subscriptionId];
    }
}
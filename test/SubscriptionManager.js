const { time } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('SubscriptionManager', function () {
  let subscriptionManager;
  let subscriber;
  const PRICE = ethers.parseEther('0.01'); // 0.01 ETH
  const DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

  beforeEach(async function () {
    [subscriber] = await ethers.getSigners();

    const SubscriptionManager = await ethers.getContractFactory(
      'SubscriptionManager'
    );
    subscriptionManager = await SubscriptionManager.deploy();
  });

  describe('Subscription Creation', function () {
    it('Should create a subscription with correct parameters', async function () {
      await subscriptionManager
        .connect(subscriber)
        .createSubscription(PRICE, DURATION);

      const subscription = await subscriptionManager.getSubscription(1);
      expect(subscription.price).to.equal(PRICE);
      expect(subscription.duration).to.equal(DURATION);
      expect(subscription.subscriber).to.equal(subscriber.address);
      expect(subscription.isActive).to.equal(true);
      expect(subscription.isCancelled).to.equal(false);
    });

    it('Should fail if price is zero', async function () {
      await expect(
        subscriptionManager.createSubscription(0, DURATION)
      ).to.be.revertedWith('Price must be greater than 0');
    });

    it('Should fail if duration is zero', async function () {
      await expect(
        subscriptionManager.createSubscription(PRICE, 0)
      ).to.be.revertedWith('Duration must be greater than 0');
    });

    it('Should emit SubscriptionCreated event', async function () {
      await expect(
        subscriptionManager
          .connect(subscriber)
          .createSubscription(PRICE, DURATION)
      )
        .to.emit(subscriptionManager, 'SubscriptionCreated')
        .withArgs(1, subscriber.address, PRICE, DURATION);
    });
  });

  describe('Payment Processing', function () {
    beforeEach(async function () {
      await subscriptionManager
        .connect(subscriber)
        .createSubscription(PRICE, DURATION);
    });

    it('Should process payment correctly', async function () {
      await expect(
        subscriptionManager.connect(subscriber).processPayment(1, {
          value: PRICE,
        })
      )
        .to.emit(subscriptionManager, 'PaymentProcessed')
        .withArgs(1);

      const subscription = await subscriptionManager.getSubscription(1);
      expect(subscription.isActive).to.equal(true);
    });

    it('Should fail if payment amount is incorrect', async function () {
      await expect(
        subscriptionManager.connect(subscriber).processPayment(1, {
          value: ethers.parseEther('0.005'),
        })
      ).to.be.revertedWith('Incorrect payment amount');
    });

    it('Should fail if subscription is cancelled', async function () {
      await subscriptionManager.connect(subscriber).cancelSubscription(1);

      await expect(
        subscriptionManager.connect(subscriber).processPayment(1, {
          value: PRICE,
        })
      ).to.be.revertedWith('Subscription is cancelled');
    });

    it('Should update startTime correctly for renewal', async function () {
      // Process initial payment
      await subscriptionManager.connect(subscriber).processPayment(1, {
        value: PRICE,
      });

      const initialSubscription = await subscriptionManager.getSubscription(1);
      const initialStartTime = initialSubscription.startTime;

      // Fast forward past duration
      await time.increase(DURATION + 1);

      // Process renewal payment
      await subscriptionManager.connect(subscriber).processPayment(1, {
        value: PRICE,
      });

      const renewedSubscription = await subscriptionManager.getSubscription(1);
      expect(renewedSubscription.startTime).to.be.gt(initialStartTime);
    });
  });

  describe('Subscription Management', function () {
    beforeEach(async function () {
      await subscriptionManager
        .connect(subscriber)
        .createSubscription(PRICE, DURATION);
    });

    it('Should return correct subscription details', async function () {
      const subscription = await subscriptionManager.getSubscription(1);
      expect(subscription.price).to.equal(PRICE);
      expect(subscription.duration).to.equal(DURATION);
      expect(subscription.subscriber).to.equal(subscriber.address);
    });

    it('Should track subscription count correctly', async function () {
      expect(await subscriptionManager.subscriptionCount()).to.equal(1);

      await subscriptionManager
        .connect(subscriber)
        .createSubscription(PRICE, DURATION);
      expect(await subscriptionManager.subscriptionCount()).to.equal(2);
    });
  });
});

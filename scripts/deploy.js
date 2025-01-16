import ethers from 'hardhat';

async function main() {
  const SubscriptionManager = await ethers.getContractFactory(
    'SubscriptionManager'
  );
  const subscriptionManager = await SubscriptionManager.deploy();
  await subscriptionManager.deployed();

  console.log('SubscriptionManager deployed to:', subscriptionManager.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

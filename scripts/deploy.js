// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require('hardhat');

async function main() {
  try {
    console.log('Starting deployment...');

    // Get the contract factory
    const SubscriptionManager = await hre.ethers.getContractFactory(
      'SubscriptionManager'
    );

    // Deploy the contract
    console.log('Deploying SubscriptionManager...');
    const subscriptionManager = await SubscriptionManager.deploy();

    // Wait for deployment to complete
    await subscriptionManager.waitForDeployment();

    // Get the deployed contract address
    const contractAddress = await subscriptionManager.getAddress();

    console.log('SubscriptionManager deployed successfully!');
    console.log('Contract address:', contractAddress);

    // Verify contract on block explorer (optional)
    if (process.env.ETHERSCAN_API_KEY) {
      console.log('Waiting for block confirmations...');
      await subscriptionManager.deployTransaction.wait(6); // Wait for 6 block confirmations

      console.log('Verifying contract...');
      await hre.run('verify:verify', {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log('Contract verified successfully!');
    }

    // Save the contract address to a file or environment variable
    // This will be useful for your frontend
    require('fs').writeFileSync(
      '.env',
      `REACT_APP_CONTRACT_ADDRESS=${contractAddress}\n`,
      { flag: 'a' }
    );
  } catch (error) {
    console.error('Error during deployment:', error);
    process.exitCode = 1;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

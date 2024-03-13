const { ethers, network, run } = require("hardhat")
const {
    VERIFICATION_BLOCK_CONFIRMATIONS,
    developmentChains,
} = require("../../helper-hardhat-config")

async function deployFundFlow() {
    const fundflowFactory = await ethers.getContractFactory("FundFlow");
    const fundflow = await fundflowFactory.deploy("0x2A6C106ae13B558BB9E2Ec64Bd2f1f7BEFF3A5E0");

    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS
    await fundflow.deployTransaction.wait(waitBlockConfirmations)

    console.log(`FundFlow Project deployed to ${fundflow.address} on ${network.name}`)

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await run("verify:verify", {
            address: fundflow.address
        })
    }
}

module.exports = {
    deployFundFlow,
}
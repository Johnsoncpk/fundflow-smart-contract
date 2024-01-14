const { ethers, network, run } = require("hardhat")
const {
    VERIFICATION_BLOCK_CONFIRMATIONS,
    developmentChains,
} = require("../../helper-hardhat-config")

async function deployFundFlowProject() {
    const fundFlowProjectFactory = await ethers.getContractFactory("FundFlowProject")
    const fundFlowProject = await fundFlowProjectFactory.deploy()

    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS
    await fundFlowProject.deployTransaction.wait(waitBlockConfirmations)

    console.log(`FundFlow Project deployed to ${fundFlowProject.address} on ${network.name}`)

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await run("verify:verify", {
            address: fundFlowProject.address
        })
    }
}

module.exports = {
    deployFundFlowProject,
}
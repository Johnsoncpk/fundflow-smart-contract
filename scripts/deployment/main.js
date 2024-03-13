// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { network, run } = require("hardhat")

// const { deployApiConsumer } = require("./deployApiConsumer")
// const { deployAutomationCounter } = require("./deployAutomationCounter")
// const { deployPriceConsumerV3 } = require("./deployPriceConsumerV3")
// const { deployRandomNumberConsumer } = require("./deployRandomNumberConsumer")
// const {
//     deployRandomNumberDirectFundingConsumer,
// } = require("./deployRandomNumberDirectFundingConsumer")
const { deployFundFlow } = require("./deployFundFlow")


async function main() {
    await run("compile")
    const chainId = network.config.chainId
    await deployFundFlow(chainId)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})

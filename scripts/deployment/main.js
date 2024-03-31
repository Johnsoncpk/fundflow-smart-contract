const { network, run } = require("hardhat")

const {
    developmentChains,
} = require("../../helper-hardhat-config")
const { deployFundFlow } = require("./deployFundFlow")


async function main() {
    await run("compile")
    const chainId = network.config.chainId
    await deployFundFlow(chainId)
    return;
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})

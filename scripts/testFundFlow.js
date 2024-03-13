const { network, ethers } = require("hardhat")
const contract = require("../build/artifacts/contracts/FundFlow.sol/FundFlow.json");
require("dotenv").config()

async function main() {
    const API_URL = 'https://eth-sepolia.g.alchemy.com/v2/CKGbNdyJkWsJTXC1daqDB-bsBXMkPsN4';
    const PRIVATE_KEY = "3684de193714f38e565f91cb7b1bcac44a2d4c640ff69e93c7b6f4d9e504f8e5";
    const CONTRACT_ADDRESS = "0xF6F5aBC9e153E96cd47F00725FE9E11565Fc44fb";
    
    const alchemyProvider = new ethers.providers.JsonRpcProvider(API_URL);

    console.log(12);
    // Signer
    const signer = new ethers.Wallet(PRIVATE_KEY, alchemyProvider);
    console.log(15);
    // Contract
    const fundflow = new ethers.Contract(CONTRACT_ADDRESS, contract.abi, signer);
    console.log(18);
    
    await fundflow.createProject(
        "Test1",
        "ipfs://test1",
        [
            {
                "id": 0,
                "amountSentToCreator": 0,
                "collectedFund": 0,
                "fundingGoal": ethers.utils.parseUnits("0.001", "ether"),
                "endAt": Math.floor(Date.now() + 10000/ 1000),
            },
            {
                "id": 0,
                "amountSentToCreator": 0,
                "collectedFund": 0,
                "fundingGoal": ethers.utils.parseUnits("0.001", "ether"),
                "endAt": Math.floor(Date.now() + 15000 / 1000),
            },
            {
                "id": 0,
                "amountSentToCreator": 0,
                "collectedFund": 0,
                "fundingGoal": ethers.utils.parseUnits("0.001", "ether"),
                "endAt": Math.floor(Date.now() + 20000 / 1000),
            },
        ],
        ethers.utils.parseUnits("0.003", "ether")
    )
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})

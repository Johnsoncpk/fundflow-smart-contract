require("dotenv").config()
const { ethers, run } = require("hardhat")

async function POST(projectData) {
    try {

        const ipfsData = new FormData();
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
        ipfsData.append('file', blob, `${data.name}.${new Date().toJSON()}.json`)

        const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.PINATA_JWT}`,
            },
            body: ipfsData,
        });

        const rese = await res.json();
        response.status(200).json({ ipfsHash: rese.IpfsHash })
    } catch (e) {
        console.log(e);
        response.status(500).json(
            { error: "Internal Server Error" },
        );
    }
}



async function initFundflow() {
    const [deployer, user, secondUser] = await ethers.getSigners()

    const fundflowFactory = await ethers.getContractFactory("FundFlow")
    const fundflow = await fundflowFactory.connect(deployer).deploy({
        value: ethers.utils.parseEther("500")
    })
    await fundflow.deployed();
    console.log(`FundFlow Project deployed to ${fundflow.address} on ${network.name}`)

    const today = new Date();
    const thisMonth = today.getTime()
    today.setMonth(today.getMonth() - 1)
    const lastMonth = today.getTime()
    today.setMonth(today.getMonth() - 1)
    const lastTwoMonth = today.getTime()
    today.setMonth(today.getMonth() + 3)
    const nextMonth = today.getTime()
    today.setMonth(today.getMonth() + 1)
    const nextTwoMonth = today.getTime()
    today.setMonth(today.getMonth() + 1)
    const nextThreeMonth = today.getTime()

    await fundflow.connect(user).createProject(
        "Kibu: Children's Headphones you can Build, Repair, Recycle",
        "ipfs://QmTibCz9MTbfNn23TDsJbZQhhQBsbtBudbZnJ6kBPZoW3W",
        [
            {
                "id": 0,
                "amountSentToCreator": 0,
                "collectedFund": 0,
                "fundingGoal": ethers.utils.parseUnits("5", "ether"),
                "endAt": Math.floor(nextMonth / 1000),
            },
            {
                "id": 0,
                "amountSentToCreator": 0,
                "collectedFund": 0,
                "fundingGoal": ethers.utils.parseUnits("5", "ether"),
                "endAt": Math.floor(nextTwoMonth / 1000),
            },
            {
                "id": 0,
                "amountSentToCreator": 0,
                "collectedFund": 0,
                "fundingGoal": ethers.utils.parseUnits("5", "ether"),
                "endAt": Math.floor(nextThreeMonth / 1000),
            },
        ],
        ethers.utils.parseUnits("15", "ether")
    )
    await fundflow.connect(secondUser).fundProject(0, {from: secondUser.address, value: ethers.utils.parseUnits("8.76", "ether")});

    await fundflow.connect(user).createProject(
        "The Captain's Logbook: 5E High Seas Adventure & Shipbuilding",
        "ipfs://QmRdCeudZBnnhpwCYSZTmmUvcApS6Q1o35d6wjr6GyrmN3",
        [
            {
                "id": 0,
                "amountSentToCreator": 0,
                "collectedFund": ethers.utils.parseUnits("26", "ether"),
                "fundingGoal": ethers.utils.parseUnits("20", "ether"),
                "endAt": Math.floor(lastTwoMonth / 1000),
            },
            {
                "id": 0,
                "amountSentToCreator": 0,
                "collectedFund": ethers.utils.parseUnits("22", "ether"),
                "fundingGoal": ethers.utils.parseUnits("20", "ether"),
                "endAt": Math.floor(lastMonth / 1000),
            },
            {
                "id": 0,
                "amountSentToCreator": 0,
                "collectedFund": ethers.utils.parseUnits("0", "ether"),
                "fundingGoal": ethers.utils.parseUnits("20", "ether"),
                "endAt": Math.floor(thisMonth / 1000 + 5),
            },
            {
                "id": 0,
                "amountSentToCreator": 0,
                "collectedFund": ethers.utils.parseUnits("0", "ether"),
                "fundingGoal": ethers.utils.parseUnits("20", "ether"),
                "endAt": Math.floor(nextMonth / 1000),
            },
        ],
        ethers.utils.parseUnits("100", "ether")
    )
    
    await fundflow.connect(user).updateProjectStatus(1);
    await fundflow.connect(user).updateProjectStatus(1);
    await fundflow.connect(deployer).fundProject(1, {from: deployer.address, value: ethers.utils.parseUnits("36", "ether")});

    await fundflow.connect(user).createProject(
        "The Modular Table by Wyrmwood",
        "ipfs://QmR3BbgJzHdX5WiUaDYHC7FJqNj3GMzNUxM33kHRmU1qCq",
        [
            {
                "id": 0,
                "amountSentToCreator": ethers.utils.parseUnits("0", "ether"),
                "collectedFund": ethers.utils.parseUnits("11.3", "ether"),
                "fundingGoal": ethers.utils.parseUnits("10", "ether"),
                "endAt": Math.floor(lastTwoMonth / 1000),
            },
            {
                "id": 0,
                "amountSentToCreator": ethers.utils.parseUnits("0", "ether"),
                "collectedFund": ethers.utils.parseUnits("12.6", "ether"),
                "fundingGoal": ethers.utils.parseUnits("10", "ether"),
                "endAt": Math.floor(lastMonth / 1000),
            },
            {
                "id": 0,
                "amountSentToCreator": ethers.utils.parseUnits("0", "ether"),
                "collectedFund": ethers.utils.parseUnits("15.6", "ether"),
                "fundingGoal": ethers.utils.parseUnits("10", "ether"),
                "endAt": Math.floor(thisMonth / 1000),
            },
        ],
        ethers.utils.parseUnits("30", "ether")
    )
    await fundflow.connect(user).updateProjectStatus(2);
    await fundflow.connect(user).updateProjectStatus(2);

    console.log(await fundflow.getProjects())
}

async function main() {
    await run("compile")
    await initFundflow()
    return;
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
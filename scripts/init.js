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
    const [deployer, user] = await ethers.getSigners()

    const fundflowFactory = await ethers.getContractFactory("FundFlow")
    const fundflow = await fundflowFactory.connect(deployer).deploy()

    console.log(`FundFlow Project deployed to ${fundflow.address} on ${network.name}`)
    // {
    //     name = "",
    //     description= "",
    //     category= string,
    //     totalFundingGoal= number,
    //     totalRound= number,
    //     rounds= ProjectRound,
    //     editorState= string,
    // }


    // for (let index = 0; index < 20; index++) {
    //     const element = array[index];

    // }

    const today = new Date();
    today.setMonth(today.getMonth()+1)
    const date = today.getTime()
    today.setMonth(today.getMonth()+1)
    const date2 = today.getTime()
    today.setMonth(today.getMonth()+1)
    const date3 = today.getTime()
    await fundflow.connect(user).createProject(
        "Edie Carey & Sarah Sample: A NEW ALBUM of Comforting Songs",
        "ipfs://Qmdj7umjkkpbSujuVEvDKqBHiAbGQi5hDvEuyHXn6gjar9",
        [
            {
                "id": 0,
                "amountSentToCreator": 0,
                "collectedFund": 0,
                "fundingGoal": ethers.utils.parseUnits("5", "ether"),
                "endAt": Math.floor(date / 1000),
            },
            {
                "id": 0,
                "amountSentToCreator": 0,
                "collectedFund": 0,
                "fundingGoal": ethers.utils.parseUnits("5", "ether"),
                "endAt": Math.floor(date2 / 1000),
            },
            {
                "id": 0,
                "amountSentToCreator": 0,
                "collectedFund": 0,
                "fundingGoal": ethers.utils.parseUnits("5", "ether"),
                "endAt": Math.floor(date3 / 1000),
            },
        ],
        ethers.utils.parseUnits("15", "ether")
    )

    console.log(await fundflow.getProjects());
    console.log(await fundflow.getRounds(0));

    // await fundflow.connect(user).createProject(
    //     "Test2",
    //     "ipfs://QmbaKEPZhTNFvChD5HcKuqUposmxJFiLybFBzeVLmonV6t",
    //     [
    //         {
    //             "id": 0,
    //             "amountSentToCreator": 0,
    //             "collectedFund": 0,
    //             "fundingGoal": ethers.utils.parseUnits("25", "ether"),
    //             "endAt": Math.floor(Date.now() / 1000) - 1,
    //         },
    //         {
    //             "id": 0,
    //             "amountSentToCreator": 0,
    //             "collectedFund": 0,
    //             "fundingGoal": ethers.utils.parseUnits("25", "ether"),
    //             "endAt": Math.floor(Date.now() / 1000) + 5,
    //         },
    //         {
    //             "id": 0,
    //             "amountSentToCreator": 0,
    //             "collectedFund": 0,
    //             "fundingGoal": ethers.utils.parseUnits("25", "ether"),
    //             "endAt": Math.floor(Date.now() / 1000) + 10,
    //         },
    //     ],
    //     ethers.utils.parseUnits("75", "ether")
    // )
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
const { network, ethers } = require("hardhat")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { developmentChains } = require("../../helper-hardhat-config")
const { numToBytes32 } = require("../../helper-functions")
const { assert, expect } = require("chai")
const { BigNumber } = require("ethers");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe.only("Fundflow Unit Tests", async function () {
        //set log level to ignore non errors
        ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

        async function deployFundFlowContractFixture() {
            const [deployer] = await ethers.getSigners()

            const fundflowFactory = await ethers.getContractFactory("FundFlow")
            const fundflow = await fundflowFactory.connect(deployer).deploy()

            await fundflow.createProject(
                "Test1", 
                "ipfs://test1", 
                [
                    {
                        "id": 0,
                        "amountSentToCreator": 0,
                        "collectedFund": 0,
                        "fundingGoal": 50,
                        "endAt": 1702254874,
                    },
                    {
                        "id": 0,
                        "amountSentToCreator": 0,
                        "collectedFund": 0,
                        "fundingGoal": 50,
                        "endAt": 1702454874,
                    },
                ],
                100
            )

            return { fundflow }
        }

        describe("get project", async function () {
            describe("success", async function () {
                it("Should successfully retreive the first projects", async function () {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture)
                    const projectId = await fundflow.getProjectCount() - 1;
                    const project = await fundflow.projects(projectId);
                    expect(project).is.not.null.and.undefined;
                    expect(await fundflow.projectRounds).is.not.null.and.undefined;
                })
            })
        })
    })


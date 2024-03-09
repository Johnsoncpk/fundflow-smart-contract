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
                it("should successfully retreive the first projects", async function () {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture);
                    const projectId = await fundflow.getProjectCount() - 1;
                    const project = await fundflow.projects(projectId);
                    expect(project).is.not.null.and.undefined;
                    expect(await fundflow.projectRounds).is.not.null.and.undefined;
                })

                it('should get the correct project count', async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture);

                    const projectCount = await fundflow.getProjectCount();
                    // Replace 0 with the expected number of projects
                    expect(projectCount).equal('1');
                });
            
                it('should get a project by id', async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture);
                    const projectId = 0; // replace with actual project id
                    const project = await fundflow.getProject(projectId);
                    // Add assertions to check the project's properties
                    // For example, if the project's name is 'Test', you can do:
                    expect(project.name).to.equal('Test1');
                });
            
                it('should get rounds of a project', async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture)
                    const projectId = 0; // replace with actual project id
                    const rounds = await fundflow.getRounds(projectId);
                    // Add assertions to check the rounds' properties
                    // For example, if the project has 2 rounds, you can do:
                    expect(rounds.length).to.equal(2);
                });
            })
        })
    })


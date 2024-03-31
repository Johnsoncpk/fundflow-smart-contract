const { network, ethers } = require("hardhat")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { developmentChains } = require("../../helper-hardhat-config")
const { numToBytes32 } = require("../../helper-functions")
const { assert, expect } = require("chai")
const { time } = require("@nomicfoundation/hardhat-network-helpers");

async function createProject(fundflow, isRoundEnded = false) {
    const firstRoundEndAt = isRoundEnded ? -1 : 1;
    const today = new Date();
    today.setMonth(today.getMonth() + firstRoundEndAt)
    const date = today.getTime()
    today.setMonth(today.getMonth() + 1)
    const date2 = today.getTime()
    today.setMonth(today.getMonth() + 1)
    const date3 = today.getTime()

    await fundflow.createProject(
        "Test1",
        "ipfs://test1",
        [
            {
                "id": 0,
                "amountSentToCreator": 0,
                "collectedFund": 0,
                "fundingGoal": ethers.utils.parseUnits("25", "ether"),
                "endAt": Math.floor(date / 1000),
            },
            {
                "id": 0,
                "amountSentToCreator": 0,
                "collectedFund": 0,
                "fundingGoal": ethers.utils.parseUnits("25", "ether"),
                "endAt": Math.floor(date2 / 1000),
            },
            {
                "id": 0,
                "amountSentToCreator": 0,
                "collectedFund": 0,
                "fundingGoal": ethers.utils.parseUnits("25", "ether"),
                "endAt": Math.floor(date3 / 1000),
            },
        ],
        ethers.utils.parseUnits("75", "ether")
    )
}

!developmentChains.includes(network.name)
    ? describe.skip
    : describe.only("Fundflow Unit Tests", async function () {
        //set log level to ignore non errors
        ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

        async function deployFundFlowContractFixture() {
            const [deployer] = await ethers.getSigners()

            const fundflowFactory = await ethers.getContractFactory("FundFlow")
            const fundflow = await fundflowFactory.connect(deployer).deploy()


            await createProject(fundflow);

            return { fundflow }
        }

        describe("get project", async function () {
            describe("success", async function () {

                it("should successfully retreive the first projects", async function () {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture);
                    const projectId = await fundflow.getProjectCount() - 1;
                    const project = await fundflow.getProject(projectId);
                    expect(project).is.not.null.and.undefined;
                    expect(await fundflow.projectRounds).is.not.null.and.undefined;
                });

                it("should successfully retreive all projects", async function () {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture);
                    const projects = await fundflow.getProjects();
                    expect(projects.length).is.equals(1);
                    expect(await fundflow.projectRounds).is.not.null.and.undefined;
                });

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
                    expect(project.name).to.equal('Test1');
                });

                it('should get rounds of a project', async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture)
                    const projectId = 0;
                    const rounds = await fundflow.getRounds(projectId);
                    expect(rounds.length).to.equal(3);
                });
            })

            describe("failed", async function () {
                it('should get error with get project by a empty project id', async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture)
                    const projectId = 20;
                    await expect(fundflow.getProject(projectId)).to.be.revertedWithCustomError(fundflow, "IndexOutOfBounds");
                });

                it('should get error with get rounds by a empty project id', async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture)
                    const projectId = 20;
                    await expect(fundflow.getRounds(projectId))
                        .to.be.revertedWithCustomError(fundflow, "IndexOutOfBounds");
                });
            })
        }),

            describe("create project", async function () {
                describe("success", async function () {
                    it("should create a project", async () => {
                        const { fundflow } = await loadFixture(deployFundFlowContractFixture);
                        const projectName = "My Project";
                        const projectUrl = "https://example.com";
                        const totalFundingGoal = 1000;
                        const rounds = [
                            { "id": 0, "amountSentToCreator": 0, "collectedFund": 0, fundingGoal: 600, endAt: Math.floor(Date.now() / 1000) + 3600 }, // 1 hour from now
                            { "id": 0, "amountSentToCreator": 0, "collectedFund": 0, fundingGoal: 400, endAt: Math.floor(Date.now() / 1000) + 3600 }, // 1 hour from now
                            // Add more rounds if needed
                        ];

                        let result = await fundflow.createProject(projectName, projectUrl, rounds, totalFundingGoal);
                        result = await fundflow.getProject(1);
                        // Assert project creation
                        expect(result.name).to.equal(projectName);
                        expect(result.url).to.equal(projectUrl);
                        expect(result.totalFundingGoal).equal(totalFundingGoal.toString());
                        // Add more assertions for other properties

                        // Check if project count increased
                        const projectCount = await fundflow.getProjectCount();
                        expect(projectCount).equal("2");

                        // check if the round no and id generate correctly
                        const resultRounds = await fundflow.getRounds(1);

                        expect(resultRounds[0].id).equal("3");
                        expect(resultRounds[1].id).equal("4");
                    })
                })
            })

        describe("fund project", async function () {
            describe("success", async function () {
                it("should fund a project with correct amount", async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture)

                    const [deployer, funder] = await ethers.getSigners();
                    const projectId = 0; // Replace with the actual project ID
                    const fundAmount = ethers.utils.parseUnits("1", "ether");
                    await fundflow.connect(funder).fundProject(projectId, { from: funder.address, value: fundAmount });
                    // Assert that the round's collected fund increased
                    const rounds = await fundflow.getRounds(projectId);
                    for (let index = 0; index < rounds.length; index++) {
                        const round = rounds[index];
                        expect(round.collectedFund).equal(fundAmount.div(rounds.length).toString());
                        // Check backer contributions
                        const contribution = await fundflow.roundBackerContributions(round.id, funder.address);
                        expect(contribution).equal(fundAmount.div(rounds.length).toString());
                        expect(await fundflow.getBackers(round.id)).include(funder.address);
                    }
                });
                it("should fund a project more than once with correct amount", async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture)

                    const [deployer, funder] = await ethers.getSigners();
                    const projectId = 0; // Replace with the actual project ID
                    const fundAmount = ethers.utils.parseUnits("1", "ether");
                    await fundflow.connect(funder).fundProject(projectId, { from: funder.address, value: fundAmount });
                    await fundflow.connect(funder).fundProject(projectId, { from: funder.address, value: fundAmount });
                    // Assert that the round's collected fund increased
                    const rounds = await fundflow.getRounds(projectId);
                    for (let index = 0; index < rounds.length; index++) {
                        const round = rounds[index];
                        expect(round.collectedFund).equal(fundAmount.mul(2).div(rounds.length).toString());
                        // Check backer contributions
                        const contribution = await fundflow.roundBackerContributions(round.id, funder.address);
                        expect(contribution).equal(fundAmount.mul(2).div(rounds.length).toString());
                        expect(await fundflow.getBackers(round.id)).include(funder.address);
                    }
                });
            })
            describe("failed", async function () {
                it("should failed when the funding round is end", async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture)

                    const [deployer, funder] = await ethers.getSigners();
                    const projectId = 1; // Replace with the actual project ID

                    await fundflow.createProject(
                        "Test2",
                        "ipfs://test2",
                        [
                            {
                                "id": 0,
                                "amountSentToCreator": 0,
                                "collectedFund": 0,
                                "fundingGoal": ethers.utils.parseUnits("0.25", "ether"),
                                "endAt": Math.floor(Date.now() / 1000),
                            }
                        ],
                        ethers.utils.parseUnits("0.25", "ether")
                    )

                    const fundAmount = ethers.utils.parseUnits("0.25", "ether");

                    fundflow.connect(funder).fundProject(projectId, { from: funder.address, value: fundAmount })

                    await time.increase(2594000);

                    await fundflow.updateProjectStatus(projectId);

                    await expect(fundflow.connect(funder).fundProject(projectId, { from: funder.address, value: fundAmount }))
                        .to.be.revertedWithCustomError(fundflow, "FundingPeriodEnded");

                    // Assert that the round's collected fund increased
                });
                it("should failed with invalid amount of funding", async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture)

                    const [deployer, funder] = await ethers.getSigners();
                    const projectId = 0; // Replace with the actual project ID
                    const fundAmount = ethers.utils.parseUnits("0", "ether");
                    await expect(fundflow.connect(funder).fundProject(projectId, { from: funder.address, value: fundAmount }))
                        .to.be.revertedWithCustomError(fundflow, "InsufficientAmount");

                    // Assert that the round's collected fund increased
                });
            })
        })

        describe("update project status", async function () {
            describe("success", async function () {
                it("should update project round to next round", async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture);
                    const [deployer, funder] = await ethers.getSigners();
                    const projectId = 0; // Replace with the actual project ID
                    // Set up a round with collected funds and funding goal
                    const fundAmount = ethers.utils.parseUnits("75", "ether");
                    await fundflow.connect(funder).fundProject(projectId, { from: funder.address, value: fundAmount });

                    await time.increase(2594000);

                    await expect(fundflow.updateProjectStatus(projectId))
                        .to.changeEtherBalance(deployer, ethers.utils.parseUnits("75", "ether").div(3).mul(99).div(100));

                    // Assert that the project status is updated correctly
                    const project = await fundflow.getProject(projectId);
                    expect(project.status).to.equal(0); // Adjust based on your logic
                    expect(project.currentRound).to.equal(1);
                })
                it("should update project to complete", async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture)
                    const [deployer, funder] = await ethers.getSigners();
                    const projectId = 1;

                    await fundflow.createProject(
                        "Test2",
                        "ipfs://test2",
                        [
                            {
                                "id": 0,
                                "amountSentToCreator": 0,
                                "collectedFund": 0,
                                "fundingGoal": 25,
                                "endAt": Math.floor(Date.now() / 1000),
                            },
                            {
                                "id": 0,
                                "amountSentToCreator": 0,
                                "collectedFund": 0,
                                "fundingGoal": 25,
                                "endAt": Math.floor(Date.now() / 1000),
                            }
                        ],
                        50
                    )
                    const fundAmount = ethers.utils.parseUnits("50", "ether");
                    await fundflow.connect(funder).fundProject(projectId, { from: funder.address, value: fundAmount });

                    await time.increase(2594000);

                    await fundflow.updateProjectStatus(projectId);

                    await fundflow.updateProjectStatus(projectId);

                    const project = await fundflow.getProject(projectId);
                    expect(project.status).to.equal(1);
                    expect(project.currentRound).to.equal(1);
                })
                it("should update project to failed", async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture)
                    const projectId = 0;
                    await time.increase(2594000);
                    await fundflow.updateProjectStatus(projectId);
                    const project = await fundflow.getProject(projectId);
                    expect(project.status).to.equal(2);
                    expect(project.currentRound).to.equal(0);
                })
                it("should return correct fund to funder if the round is failed", async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture)
                    const projectId = 0;
                    const [_, funder] = await ethers.getSigners();
                    const fundAmount = ethers.utils.parseUnits("9", "ether");
                    await fundflow.connect(funder).fundProject(projectId, { from: funder.address, value: fundAmount });
                    await time.increase(2594000);
                    await expect(fundflow.updateProjectStatus(projectId))
                        .to.changeEtherBalance(funder, ethers.utils.parseUnits("9", "ether"));
                })
            })
            describe("failed", async function () {
                it("should failed since round not finished yet", async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture);
                    const [deployer, funder] = await ethers.getSigners();
                    const projectId = 1;

                    await fundflow.createProject(
                        "Test2",
                        "ipfs://test2",
                        [
                            {
                                "id": 0,
                                "amountSentToCreator": 0,
                                "collectedFund": 0,
                                "fundingGoal": 25,
                                "endAt": Math.floor(Date.now() + 3 / 1000),
                            }
                        ],
                        25
                    )
                    const fundAmount = ethers.utils.parseUnits("0.75", "ether");
                    await fundflow.connect(funder).fundProject(projectId, { from: funder.address, value: fundAmount });

                    await expect(fundflow.updateProjectStatus(projectId))
                        .to.be.revertedWithCustomError(fundflow, "RoundNotFinished");
                })

                it("should failed since the fund has been collected", async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture);
                    const [deployer, funder] = await ethers.getSigners();
                    const projectId = 0;

                    const fundAmount = ethers.utils.parseUnits("25", "ether");
                    await fundflow.connect(funder).fundProject(projectId, { from: funder.address, value: fundAmount });

                    await time.increase(2594000);

                    await fundflow.updateProjectStatus(projectId);

                    await expect(fundflow.updateProjectStatus(projectId))
                        .to.be.revertedWithCustomError(fundflow, "ProjectCompleted");
                })
            })
        })

        describe("quite project", async function () {
            describe("success", async function () {
                it("should return remaining fund to backer correctly", async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture);
                    const [_, funder, secondFunder] = await ethers.getSigners();
                    const projectId = 0;

                    await fundflow.connect(secondFunder).fundProject(projectId, { from: secondFunder.address, value: ethers.utils.parseUnits("5", "ether") });
                    await fundflow.connect(funder).fundProject(projectId, { from: funder.address, value: ethers.utils.parseUnits("5", "ether") });

                    let rounds = await fundflow.getRounds(projectId);
                    rounds.forEach(async (round) => {
                        expect(round.collectedFund).to.be.bignumber.equal(ethers.utils.parseUnits("5", "ether"));
                        // Check funder contributions
                        const contribution = await fundflow.roundBackerContributions(round.id, funder.address);
                        expect(contribution).equal(ethers.utils.parseUnits("5", "ether") / 3);
                    });

                    await time.increase(2594000);

                    await expect(fundflow.connect(funder).quitProject(projectId))
                        .to.changeEtherBalance(funder, ethers.utils.parseUnits("5", "ether").div(3).mul(2));

                    rounds = await fundflow.getRounds(projectId);
                    rounds.forEach(async (round) => {
                        expect(round.collectedFund).to.be.bignumber.equal("0");
                        // Check funder contributions
                        const contribution = await fundflow.roundBackerContributions(round.id, funder.address);
                        expect(contribution).equal("0");
                    });
                })

                it("should return 0 fund when user didn't contribute any fund", async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture);
                    const [deployer, funder] = await ethers.getSigners();
                    const projectId = 0;

                    await fundflow.connect(funder).quitProject(projectId, { from: funder.address });
                    // Assert that the round's collected fund decreased
                    const rounds = await fundflow.getRounds(projectId);

                    rounds.forEach(async (round) => {
                        expect(round.collectedFund).to.be.bignumber.equal("0");
                        // Check funder contributions
                        const contribution = await fundflow.roundBackerContributions(round.id, funder.address);
                        expect(contribution).equal("0");
                    });
                })

                it("should remove funder record in rounds", async () => {
                    const { fundflow } = await loadFixture(deployFundFlowContractFixture);
                    const [deployer, funder] = await ethers.getSigners();
                    const projectId = 0;

                    await fundflow.connect(funder).quitProject(projectId, { from: funder.address });
                    // Assert that the round's collected fund decreased
                    const rounds = await fundflow.getRounds(projectId);

                    rounds.forEach(async (round) => {
                        expect(await fundflow.getBackers(round.id)).is.not.contain(funder.address);
                    });
                })
            })
        })
    })


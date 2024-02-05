const { network, ethers } = require("hardhat")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { numToBytes32 } = require("../../helper-functions")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("API Consumer Unit Tests", async function () {
        //set log level to ignore non errors
        ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

        // We define a fixture to reuse the same setup in every test.
        // We use loadFixture to run this setup once, snapshot that state,
        // and reset Hardhat Network to that snapshot in every test.
        async function deployAPIConsumerFixture() {
            const [deployer] = await ethers.getSigners()

            const chainId = network.config.chainId

            const linkTokenFactory = await ethers.getContractFactory("LinkToken")
            const linkToken = await linkTokenFactory.connect(deployer).deploy()

            const mockOracleFactory = await ethers.getContractFactory("MockOracle")
            const mockOracle = await mockOracleFactory.connect(deployer).deploy(linkToken.address)

            const jobId = ethers.utils.toUtf8Bytes(networkConfig[chainId]["jobId"])
            const fee = networkConfig[chainId]["fee"]

            const apiConsumerFactory = await ethers.getContractFactory("APIConsumer")
            const apiConsumer = await apiConsumerFactory
                .connect(deployer)
                .deploy(mockOracle.address, jobId, fee, linkToken.address)

            const fundAmount = networkConfig[chainId]["fundAmount"] || "1000000000000000000"
            await linkToken.connect(deployer).transfer(apiConsumer.address, fundAmount)

            return { apiConsumer, mockOracle }
        }

        describe("#requestVolumeData", async function () {
            describe("success", async function () {
                it("Should successfully make an API request", async function () {
                    const { apiConsumer } = await loadFixture(deployAPIConsumerFixture)
                    const transaction = await apiConsumer.requestVolumeData()
                    const transactionReceipt = await transaction.wait(1)
                    const requestId = transactionReceipt.events[0].topics[1]
                    expect(requestId).to.not.be.null
                })

                it("Should successfully make an API request and get a result", async function () {
                    const { apiConsumer, mockOracle } = await loadFixture(
                        deployAPIConsumerFixture
                    )
                    const transaction = await apiConsumer.requestVolumeData()
                    const transactionReceipt = await transaction.wait(1)
                    const requestId = transactionReceipt.events[0].topics[1]
                    const callbackValue = 777
                    await mockOracle.fulfillOracleRequest(requestId, numToBytes32(callbackValue))
                    const volume = await apiConsumer.volume()
                    assert.equal(volume.toString(), callbackValue.toString())
                })

                it("Our event should successfully fire event on callback", async function () {
                    const { apiConsumer, mockOracle } = await loadFixture(
                        deployAPIConsumerFixture
                    )
                    const callbackValue = 777
                    // we setup a promise so we can wait for our callback from the `once` function
                    await new Promise(async (resolve, reject) => {
                        // setup listener for our event
                        apiConsumer.once("DataFullfilled", async () => {
                            console.log("DataFullfilled event fired!")
                            const volume = await apiConsumer.volume()
                            // assert throws an error if it fails, so we need to wrap
                            // it in a try/catch so that the promise returns event
                            // if it fails.
                            try {
                                assert.equal(volume.toString(), callbackValue.toString())
                                resolve()
                            } catch (e) {
                                reject(e)
                            }
                        })
                        const transaction = await apiConsumer.requestVolumeData()
                        const transactionReceipt = await transaction.wait(1)
                        const requestId = transactionReceipt.events[0].topics[1]
                        await mockOracle.fulfillOracleRequest(
                            requestId,
                            numToBytes32(callbackValue)
                        )
                    })
                })
            })
        })
    })


const { network } = require("hardhat")
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Automation Counter Unit Tests", async function () {
        // We define a fixture to reuse the same setup in every test.
        // We use loadFixture to run this setup once, snapshot that state,
        // and reset Hardhat Network to that snapshot in every test.
        async function deployAutomationCounterFixture() {
            const [deployer] = await ethers.getSigners()

            const chainId = network.config.chainId
            const automationUpdateInterval =
                networkConfig[chainId]["automationUpdateInterval"] || "30"

            const counterFactory = await ethers.getContractFactory("AutomationCounter")
            const counter = await counterFactory
                .connect(deployer)
                .deploy(automationUpdateInterval)

            return { counter }
        }

        describe("#checkUpkeep", async function () {
            describe("success", async function () {
                it("should be able to call checkUpkeep", async function () {
                    const { counter } = await loadFixture(deployAutomationCounterFixture)
                    const checkData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(""))
                    const { upkeepNeeded } = await counter.callStatic.checkUpkeep(checkData)
                    assert.equal(upkeepNeeded, false)
                })
            })
        })

        describe("#performUpkeep", async function () {
            describe("success", async function () {
                it("should be able to call performUpkeep after time passes", async function () {
                    const { counter } = await loadFixture(deployAutomationCounterFixture)
                    const startingCount = await counter.counter()
                    const checkData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(""))
                    const interval = await counter.interval()
                    await time.increase(interval.toNumber() + 1)
                    await counter.performUpkeep(checkData)
                    assert.equal(startingCount + 1, (await counter.counter()).toNumber())
                })
            })

            describe("failure", async function () {
                it("should not be able to call perform upkeep without the time passed interval", async function () {
                    const { counter } = await loadFixture(deployAutomationCounterFixture)
                    const checkData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(""))
                    await expect(counter.performUpkeep(checkData)).to.be.revertedWith(
                        "Time interval not met"
                    )
                })
            })
        })
    })

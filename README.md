# Smart Contract Repository Setup

This repository contains smart contracts in FundFlow developed using Hardhat.js and managed with Yarn.

## Prerequisites

Before you can set up this repository, make sure you have the following installed:

- [Node.js](https://nodejs.org) (version 18 or higher)
- [Yarn](https://yarnpkg.com)

## Installation

1. Clone this repository to your local machine:

    ```shell
    git clone https://github.com/Johnsoncpk/fundflow-smart-contract
    ```

2. Navigate to the project directory:

    ```shell
    cd fundflow-smart-contract
    ```

3. Install the project dependencies using Yarn:

    ```shell
    yarn install
    ```

## Configuration (Optional)

1. Edit the `.env.example` file in the root directory of the project and rename it to '.env'.

2. Add the necessary environment variables to the `.env` file. For example:

    ```plaintext
    ETHERSCAN_API_KEY=your-etherscan-api-key
    PRIVATE_KEY=your-private-key
    ```

## Usage

1. To run a local node, run the following command:

    ```plaintext
    yarn hardhat node
    ```

2. To deploy the smart contract with demo data

    ```plaintext
    yarn hardhat run scripts/init.js --network localhost
    ```
3. Done! You can check the [FundFlow Frontend Repository](https://github.com/Johnsoncpk/FundFlow.Frontend) Frontend Integration.

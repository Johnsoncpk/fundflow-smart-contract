// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

contract FundFlowBacker is ERC1155 {
    Counters.Counter private _tokenIds;

    constructor(string memory ipfsBaseURI) ERC1155(ipfsBaseURI) {}
}

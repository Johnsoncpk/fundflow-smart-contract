// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract FundFlowProject is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _projectIds;

    constructor() ERC721("FundFlowProject", "FFP") {}

    function createProject(
        address recipient,
        string memory tokenURI
    ) external returns (uint256) {
        _projectIds.increment();
        uint256 newProjectId = _projectIds.current();
        _mint(recipient, newProjectId);
        _setTokenURI(newProjectId, tokenURI);
        return newProjectId;
    }
}

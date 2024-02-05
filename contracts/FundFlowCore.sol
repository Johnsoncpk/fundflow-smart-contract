// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

contract FundFlowProject is ERC721 {
    event ProjectCreated(
        uint256 indexed id,
        string name,
        string url,
        uint256 goal,
        uint256 deadline,
        address payable creator
    );

    event ProjectFunded(
        uint256 indexed id,
        uint256 current,
        address payable funder
    );

    using Counters for Counters.Counter;
    Counters.Counter private _projectIds;

    constructor() ERC721("FundFlowProject", "FFP") {}

    mapping(uint256 => Project) public projects;

    function createProject(
        string memory _name,
        string memory _description,
        string memory _image,
        string memory _url,
        uint256 _goal,
        uint256 _deadline
    ) public {
        _projectIds.increment();
        uint256 id = _projectIds.current();

        projects[id] = Project(
            _name,
            _description,
            _image,
            _url,
            _goal,
            0,
            _deadline,
            payable(msg.sender),
            new address payable[](0)
        );

        emit ProjectCreated(
            id,
            _name,
            _description,
            _image,
            _url,
            _goal,
            _deadline,
            payable(msg.sender)
        );
    }

    function fundProject(uint256 _id) public payable {
        Project storage project = projects[_id];
        require(
            project.deadline > block.timestamp,
            "Project deadline has passed"
        );
        require(
            project.current < project.goal,
            "Project has already reached its goal"
        );
        require(msg.value > 0, "Must send some ether");
        project.current += msg.value;
        project.funders.push(payable(msg.sender));

        emit ProjectFunded(_id, project.current, payable(msg.sender));
    }

    function withdrawFunds(uint256 _id) public {
        Project storage project = projects[_id];
        require(
            project.current >= project.goal,
            "Project has not reached its goal"
        );
        require(
            project.creator == msg.sender,
            "Only the creator can withdraw funds"
        );
        payable(msg.sender).transfer(project.current);
    }
}

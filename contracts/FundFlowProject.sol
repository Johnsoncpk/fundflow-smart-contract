// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import { ERC721, ERC721URIStorage } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";

enum Status {
    Draft,
    Active,
    PendingUpdate,
    ProgressUpdated,
    PendingReviewing,
    Completed
}

struct Round {
    uint256 portion;
    uint256 endAt;
}

struct Project {
    string name;
    string url;
    uint256 goalAmount;
    uint256 totalRound;
    uint256 currentAmount;
    uint256 currentRound;
    uint256 remainPoolWeight;
    address payable creator;
    Round[] rounds;
    Status status;
}

error FundingRoundEnded();
error InsufficientAmount();
error PermissionDenied();
error NotBakingThisProject();

contract FundFlowProject is ERC721URIStorage{
    
    event ProjectCreated(Project project);

    event ProjectFunded(
        uint256 indexed id,
        uint256 amount,
        address payable funder
    );

    event ProjectStatusUpdated(uint256 id, Status status);

    event ProjectQuited(uint256 id, uint256 amount, address payable quiter);

    using Counters for Counters.Counter;
    Counters.Counter private _projectIds;

    mapping(uint256 => Project) public projects;
    mapping(uint256 => mapping(address => uint256)) public projectBackers;

    constructor() ERC721("FundFlowProject", "FFP") {}

    function addRound(uint256 _id, Round[] calldata _rounds) internal {
        for (uint256 i = 0; i < _rounds.length; i++) {
            projects[_id].rounds.push(Round(_rounds[i].portion, _rounds[i].endAt));
        }   
    }

    function createProject(
        string memory _name,
        string memory _url,
        Round[] calldata _rounds,
        uint256 _goalAmount,
        uint256 _totalRound
    ) public returns (Project memory) {
        _projectIds.increment();
        uint256 id = _projectIds.current();

        projects[id] = Project(
            _name,
            _url,
            _goalAmount,
            _totalRound,
            0,
            0,
            1,
            payable(msg.sender),
            new Round[](0),
            Status.Draft
        );
        
        addRound(id, _rounds);
        // new address payable[](0),

        _mint(msg.sender, id);
        _setTokenURI(id, _url);

        //emit ProjectCreated(projects[id]);
        return projects[id];
    }
 
    function fundProject(uint256 _id) public payable {
        Project storage project = projects[_id];
        if(project.status != Status.Active){
            revert FundingRoundEnded();
        }
        
        if(msg.value <= 0){
            revert InsufficientAmount();
        }

        project.currentAmount += msg.value;
        projectBackers[_id][msg.sender] = msg.value;

        emit ProjectFunded(_id, msg.value, payable(msg.sender));
    }

    function updateProjectStatus(uint256 _id, Status _status) public {
        Project storage project = projects[_id];

        if(project.creator != msg.sender){
            revert PermissionDenied();
        }

        if(project.status == _status){
            return;
        }

        project.status = Status.Active;

        emit ProjectStatusUpdated(_id, _status);
    }

    function quitBackingProject(uint256 _id) public payable{
        Project storage project = projects[_id];
        uint256 amount = projectBackers[_id][msg.sender];

        if(amount == 0){
            revert NotBakingThisProject();
        }

        payable(msg.sender).transfer(amount * project.remainPoolWeight);

        delete projectBackers[_id][msg.sender];

        emit ProjectQuited(_id, amount * project.remainPoolWeight, payable(msg.sender));
    }
}

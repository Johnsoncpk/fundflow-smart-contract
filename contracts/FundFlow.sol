// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;
pragma experimental ABIEncoderV2;

import { ERC721, ERC721URIStorage } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

using Counters for Counters.Counter;

enum Status {
    Active,
    Completed,
    Failed
}

struct Backer {
   address backerAddress;
   uint256 contribution;
}

struct Round {
    uint256 id;
    uint256 amountSentToCreator;
    uint256 collectedFund;
    uint256 fundingGoal;
    uint256 endAt;
}

struct Project {
    string name;
    string url;
    uint256 totalFundingGoal;
    uint256 totalRound;
    uint256 currentRound;
    address payable creator;
    Status status;
}

error FundingPeriodEnded();
error InsufficientAmount();
error PermissionDenied();
error NotBakingThisProject();
error IndexOutOfBounds();
error FundAlreadyCollected();
error RoundNotFinished();

contract FundFlow is ERC721URIStorage{
    event ProjectCreated(
        Project project
    );
    event ProjectFunded(
        uint256 indexed id,
        uint256 round,
        uint256 amount,
        address payable funder
    );
    event ProjectStatusUpdated(
        uint256 id,
        Status status);
    event ProjectQuited(
        uint256 id,
        address payable quiter);
    
    Project[] public projects;
    mapping(uint256 => Round[]) public projectRounds;
    
    Counters.Counter private roundId;
    // roundId -> address -> contribution
    mapping(uint256 =>mapping(address => uint256)) public roundBackerContributions;

    constructor() ERC721("FundFlow", "FFLO") {}

    function getProjectCount() public view returns (uint256) {
        return projects.length;
    }

    function getProject(uint256 _id) public view returns (Project memory) {
        if(_id > getProjectCount() - 1){
           revert IndexOutOfBounds();
        }
        return projects[_id];
    }

    function getRounds(uint256 _projectId) public view returns (Round[] memory){
        if(_projectId > getProjectCount() - 1){
           revert IndexOutOfBounds();
        }
        return projectRounds[_projectId];
    }

    function createProject(
        string memory _name,
        string memory _url,
        Round[] calldata _rounds,
        uint256 _totalFundingGoal
    ) public returns (Project memory) {
        uint256 projectId = getProjectCount();
        
        // should check if sum of portions == 100

        projects.push(Project(
            _name,
            _url,
            _totalFundingGoal,
            _rounds.length,
            0,
            payable(msg.sender),
            Status.Active
        ));

        createRounds(projectId, _rounds);

        _mint(msg.sender, projectId);
        _setTokenURI(projectId, _url);

        emit ProjectCreated(projects[projectId]);
        return projects[projectId];
    }

    function createRounds(uint256 _projectId, Round[] calldata _rounds) internal {
        for (uint256 i = 0; i < _rounds.length; i++) {
            projectRounds[_projectId].push(
                Round(roundId.current(), 0, 0, _rounds[i].fundingGoal, _rounds[i].endAt)
            );

            roundId.increment();

            // todo: create scheduled task for each round
        }
    }
 
    function fundProject(uint256 _projectId) public payable {
        Project memory project = projects[_projectId];
        
        if(project.status != Status.Active){
            revert FundingPeriodEnded();
        }
        
        if(msg.value <= 0){
            revert InsufficientAmount();
        }

        uint256 remainRound = getRounds(_projectId).length - project.currentRound;
        uint256 fundPerRound = msg.value / remainRound;

        for (uint256 i = project.currentRound; i < projectRounds[_projectId].length; i++) {
            Round storage round = projectRounds[_projectId][i];
            round.collectedFund += fundPerRound;
            roundBackerContributions[round.id][msg.sender] = fundPerRound;
        }

        emit ProjectFunded(_projectId, project.currentRound, msg.value, payable(msg.sender));
    }

    function updateProjectStatus(uint256 _projectId) public {
        Project storage project = projects[_projectId];
        Round storage currentRound =  projectRounds[_projectId][project.currentRound];
        Status status = project.status;

        if(currentRound.amountSentToCreator != 0){
           revert FundAlreadyCollected();
        }

        if(currentRound.endAt > block.timestamp){
            revert RoundNotFinished();
        }

        if(currentRound.collectedFund < currentRound.fundingGoal){
            project.status = Status.Failed;
            emit ProjectStatusUpdated(_projectId, status);
            return;
        }

        if(project.currentRound == project.totalRound - 1){
            status = Status.Completed;
        }
        else{
            project.currentRound++;
        }

        // distribute fund to project creator
        uint256 fundAfterPlatformFee = currentRound.collectedFund * 19 / 20;
        project.creator.transfer(fundAfterPlatformFee);
        currentRound.amountSentToCreator = fundAfterPlatformFee;
        project.status = status;
        emit ProjectStatusUpdated(_projectId, status);
    }

    function quitProject(uint256 _projectId) public payable{
        Project storage project = projects[_projectId];
        uint256 remainingFund = 0;
        for(uint256 i = project.currentRound; i < projectRounds[_projectId].length; i++){
            Round storage round = projectRounds[_projectId][i];

            if(round.endAt < block.timestamp){
                continue;
            }

            console.log(i);
            uint256 contributedFund = roundBackerContributions[round.id][msg.sender];
            round.collectedFund -= contributedFund;
            remainingFund += contributedFund;
            delete roundBackerContributions[round.id][msg.sender];
        }

        payable(msg.sender).transfer(remainingFund);
        emit ProjectQuited(_projectId, payable(msg.sender));
    }
}

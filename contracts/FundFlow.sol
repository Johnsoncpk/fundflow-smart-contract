// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;
pragma experimental ABIEncoderV2;

import {ERC721, ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
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
error ProjectCompleted();

contract FundFlow is ERC721URIStorage {
    event ProjectCreated(Project project);
    event ProjectFunded(
        uint256 indexed id,
        uint256 round,
        uint256 amount,
        address payable funder
    );
    event ProjectStatusUpdated(uint256 id, Status status);
    event ProjectQuited(uint256 id, address payable quiter);

    Counters.Counter private roundId;

    Project[] public projects;
    mapping(uint256 => Round[]) public projectRounds;
    // roundId -> address[]
    mapping(uint256 => address[]) public roundBackers;
    // roundId -> address -> contribution
    mapping(uint256 => mapping(address => uint256))
        public roundBackerContributions;

    constructor() ERC721("FundFlow", "FLOW") {}

    function getProjectCount() public view returns (uint256) {
        return projects.length;
    }

    function getProject(uint256 _id) public view returns (Project memory) {
        if (_id > getProjectCount() - 1) {
            revert IndexOutOfBounds();
        }
        return projects[_id];
    }

    function getProjects() public view returns (Project[] memory) {
        return projects;
    }

    function getRounds(
        uint256 _projectId
    ) public view returns (Round[] memory) {
        if (_projectId > getProjectCount() - 1) {
            revert IndexOutOfBounds();
        }
        return projectRounds[_projectId];
    }

    function getBackers(
        uint256 _roundId
    ) public view returns (address[] memory) {
        return roundBackers[_roundId];
    }

    function createProject(
        string memory _name,
        string memory _url,
        Round[] calldata _rounds,
        uint256 _totalFundingGoal
    ) public returns (Project memory) {
        uint256 projectId = getProjectCount();

        projects.push(
            Project(
                _name,
                _url,
                _totalFundingGoal,
                _rounds.length,
                0,
                payable(msg.sender),
                Status.Active
            )
        );

        createRounds(projectId, _rounds);

        _mint(msg.sender, projectId);
        _setTokenURI(projectId, _url);

        emit ProjectCreated(projects[projectId]);
        return projects[projectId];
    }

    function createRounds(
        uint256 _projectId,
        Round[] calldata _rounds
    ) internal {
        for (uint256 i = 0; i < _rounds.length; i++) {
            projectRounds[_projectId].push(
                Round(
                    roundId.current(),
                    0,
                    0,
                    _rounds[i].fundingGoal,
                    _rounds[i].endAt
                )
            );

            roundId.increment();

            // todo: create scheduled task for each round
        }
    }

    function fundProject(uint256 _projectId) public payable {
        Project memory project = projects[_projectId];
        Round memory currentRound = projectRounds[_projectId][
            project.currentRound
        ];

        if (currentRound.endAt < block.timestamp) {
            revert FundingPeriodEnded();
        }

        if (msg.value <= 0) {
            revert InsufficientAmount();
        }

        uint256 remainRound = getRounds(_projectId).length -
            project.currentRound;
        uint256 fundPerRound = msg.value / remainRound;

        for (
            uint256 i = project.currentRound;
            i < projectRounds[_projectId].length;
            i++
        ) {
            Round storage round = projectRounds[_projectId][i];
            round.collectedFund += fundPerRound;
            roundBackers[round.id].push(msg.sender);
            roundBackerContributions[round.id][msg.sender] += fundPerRound;
        }

        emit ProjectFunded(
            _projectId,
            project.currentRound,
            msg.value,
            payable(msg.sender)
        );
    }

    function returnFundToBacker(uint256 _projectId) internal {
        Project memory project = projects[_projectId];
        for (
            uint256 index = project.currentRound;
            index < project.totalRound;
            index++
        ) {
            Round storage round = projectRounds[_projectId][index];
            address[] memory backers = roundBackers[round.id];
            for (uint256 j = 0; j < backers.length; j++) {
                address backer = backers[j];
                uint256 contributedFund = roundBackerContributions[j][backer];
                round.collectedFund -= contributedFund;
                payable(backer).transfer(contributedFund);
            }
        }
    }

    function quitProject(uint256 _projectId) public payable {
        Project storage project = projects[_projectId];
        uint256 backerRemainingFund = 0;
        for (
            uint256 i = project.currentRound;
            i < projectRounds[_projectId].length;
            i++
        ) {
            Round storage round = projectRounds[_projectId][i];

            if (round.endAt < block.timestamp) {
                continue;
            }

            uint256 contributedFund = roundBackerContributions[round.id][
                msg.sender
            ];
            round.collectedFund -= contributedFund;
            backerRemainingFund += contributedFund;

            address[] storage backers = roundBackers[round.id];
            for (uint256 j = 0; j < backers.length; j++) {
                if (backers[j] != msg.sender) {
                    continue;
                }
                backers[j] = backers[backers.length - 1];
                backers.pop();
            }
            delete roundBackerContributions[round.id][msg.sender];
        }

        payable(msg.sender).transfer(backerRemainingFund);
        emit ProjectQuited(_projectId, payable(msg.sender));
    }

    function updateProjectStatus(uint256 _projectId) public {
        Project storage project = projects[_projectId];
        if (project.status != Status.Active) {
            revert ProjectCompleted();
        }

        Round storage currentRound = projectRounds[_projectId][
            project.currentRound
        ];

        if (currentRound.endAt > block.timestamp) {
            revert RoundNotFinished();
        }

        Status status = project.status;

        if (currentRound.collectedFund < currentRound.fundingGoal) {
            project.status = Status.Failed;
            returnFundToBacker(_projectId);
            emit ProjectStatusUpdated(_projectId, status);
            return;
        }

        if (project.currentRound == project.totalRound - 1) {
            status = Status.Completed;
        } else {
            project.currentRound++;
        }

        // distribute fund to project creator
        uint256 fundAfterPlatformFee = (currentRound.collectedFund * 99) / 100;
        project.creator.transfer(fundAfterPlatformFee);
        currentRound.amountSentToCreator = fundAfterPlatformFee;
        project.status = status;
        emit ProjectStatusUpdated(_projectId, status);
    }
}

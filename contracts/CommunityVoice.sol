// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CommunityVoice is Ownable {
    IERC20 public filmToken;
    
    struct Proposal {
        uint256 id;
        string title;
        string description;
        string ipfsHash; // For additional content
        uint256 startTime;
        uint256 endTime;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
        mapping(address => bool) hasVoted;
    }
    
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    
    event ProposalCreated(uint256 indexed id, string title, uint256 startTime, uint256 endTime);
    event Voted(uint256 indexed proposalId, address indexed voter, bool vote, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);
    
    constructor(address _filmToken) {
        filmToken = IERC20(_filmToken);
    }
    
    function createProposal(
        string memory _title,
        string memory _description,
        string memory _ipfsHash,
        uint256 _startTime,
        uint256 _endTime
    ) external onlyOwner {
        require(_startTime >= block.timestamp, "Start time must be in the future");
        require(_endTime > _startTime, "End time must be after start time");
        
        proposalCount++;
        Proposal storage proposal = proposals[proposalCount];
        proposal.id = proposalCount;
        proposal.title = _title;
        proposal.description = _description;
        proposal.ipfsHash = _ipfsHash;
        proposal.startTime = _startTime;
        proposal.endTime = _endTime;
        
        emit ProposalCreated(proposalCount, _title, _startTime, _endTime);
    }
    
    function vote(uint256 _proposalId, bool _support) external {
        Proposal storage proposal = proposals[_proposalId];
        
        require(block.timestamp >= proposal.startTime, "Voting has not started");
        require(block.timestamp <= proposal.endTime, "Voting has ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        uint256 weight = filmToken.balanceOf(msg.sender);
        require(weight > 0, "Must hold FILM tokens to vote");
        
        proposal.hasVoted[msg.sender] = true;
        
        if (_support) {
            proposal.yesVotes += weight;
        } else {
            proposal.noVotes += weight;
        }
        
        emit Voted(_proposalId, msg.sender, _support, weight);
    }
    
    function executeProposal(uint256 _proposalId) external onlyOwner {
        Proposal storage proposal = proposals[_proposalId];
        
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");
        
        proposal.executed = true;
        bool passed = proposal.yesVotes > proposal.noVotes;
        
        emit ProposalExecuted(_proposalId, passed);
    }
    
    function getProposalDetails(uint256 _proposalId) external view returns (
        string memory title,
        string memory description,
        string memory ipfsHash,
        uint256 startTime,
        uint256 endTime,
        uint256 yesVotes,
        uint256 noVotes,
        bool executed
    ) {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.title,
            proposal.description,
            proposal.ipfsHash,
            proposal.startTime,
            proposal.endTime,
            proposal.yesVotes,
            proposal.noVotes,
            proposal.executed
        );
    }
    
    function hasVoted(uint256 _proposalId, address _voter) external view returns (bool) {
        return proposals[_proposalId].hasVoted[_voter];
    }
}

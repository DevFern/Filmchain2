// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

/**
 * @title CommunityVoice
 * @dev Platform for community governance and voting on film projects
 */
contract CommunityVoice is 
    Initializable, 
    AccessControlUpgradeable, 
    ReentrancyGuardUpgradeable, 
    PausableUpgradeable, 
    UUPSUpgradeable 
{
    using CountersUpgradeable for CountersUpgradeable.Counter;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PROPOSAL_CREATOR_ROLE = keccak256("PROPOSAL_CREATOR_ROLE");
    
    IERC20Upgradeable public filmToken;
    
    CountersUpgradeable.Counter private _proposalIds;
    
    // Proposal types
    enum ProposalType {
        FilmFunding,
        FeatureRequest,
        PlatformChange,
        CommunityInitiative,
        Other
    }
    
    // Proposal status
    enum ProposalStatus {
        Active,
        Passed,
        Rejected,
        Executed,
        Canceled
    }
    
    // Vote type
    enum VoteType {
        For,
        Against,
        Abstain
    }
    
    struct Proposal {
        uint256 id;
        address creator;
        string title;
        string description;
        string ipfsHash;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalType proposalType;
        ProposalStatus status;
        uint256 quorum;
        uint256 threshold;
        uint256 createdAt;
        mapping(address => bool) hasVoted;
        mapping(address => VoteType) votes;
    }
    
    struct ProposalView {
        uint256 id;
        address creator;
        string title;
        string description;
        string ipfsHash;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalType proposalType;
        ProposalStatus status;
        uint256 quorum;
        uint256 threshold;
        uint256 createdAt;
    }
    
    struct Vote {
        address voter;
        uint256 proposalId;
        VoteType voteType;
        uint256 weight;
        uint256 timestamp;
    }
    
    // Mapping of proposal ID to proposal
    mapping(uint256 => Proposal) private proposals;
    
    // Mapping of address to votes cast
    mapping(address => Vote[]) private votesCast;
    
    // Default quorum (percentage of total supply needed to vote)
    uint256 public defaultQuorum;
    
    // Default threshold (percentage of votes needed to pass)
    uint256 public defaultThreshold;
    
    // Minimum token balance required to create a proposal
    uint256 public proposalThreshold;
    
    // Minimum token balance required to vote
    uint256 public voteThreshold;
    
    // Events
    event ProposalCreated(
        uint256 indexed id,
        address indexed creator,
        string title,
        ProposalType proposalType,
        uint256 startTime,
        uint256 endTime
    );
    
    event ProposalCanceled(uint256 indexed id);
    event ProposalExecuted(uint256 indexed id);
    event VoteCast(address indexed voter, uint256 indexed proposalId, VoteType voteType, uint256 weight);
    event QuorumChanged(uint256 oldQuorum, uint256 newQuorum);
    event ThresholdChanged(uint256 oldThreshold, uint256 newThreshold);
    event ProposalThresholdChanged(uint256 oldThreshold, uint256 newThreshold);
    event VoteThresholdChanged(uint256 oldThreshold, uint256 newThreshold);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initializes the contract
     * @param _filmToken Address of the FILM token contract
     */
    function initialize(
        address _filmToken,
        address admin
    ) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        _grantRole(PROPOSAL_CREATOR_ROLE, admin);
        
        filmToken = IERC20Upgradeable(_filmToken);
        
        defaultQuorum = 1000; // 10%
        defaultThreshold = 5000; // 50%
        proposalThreshold = 1000 * 10**18; // 1,000 FILM tokens
        voteThreshold = 100 * 10**18; // 100 FILM tokens
    }
    
    /**
     * @dev Creates a new proposal
     * @param _title Proposal title
     * @param _description Proposal description
     * @param _ipfsHash IPFS hash for additional data
     * @param _startTime Start time timestamp
     * @param _endTime End time timestamp
     * @param _proposalType Proposal type
     * @param _quorum Custom quorum (0 for default)
     * @param _threshold Custom threshold (0 for default)
     */
    function createProposal(
        string memory _title,
        string memory _description,
        string memory _ipfsHash,
        uint256 _startTime,
        uint256 _endTime,
        ProposalType _proposalType,
        uint256 _quorum,
        uint256 _threshold
    ) external whenNotPaused {
        require(hasRole(PROPOSAL_CREATOR_ROLE, msg.sender) || filmToken.balanceOf(msg.sender) >= proposalThreshold, "Insufficient tokens to create proposal");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_startTime >= block.timestamp, "Start time must be in the future");
        require(_endTime > _startTime, "End time must be after start time");
        
        _proposalIds.increment();
        uint256 newProposalId = _proposalIds.current();
        
        Proposal storage proposal = proposals[newProposalId];
        proposal.id = newProposalId;
        proposal.creator = msg.sender;
        proposal.title = _title;
        proposal.description = _description;
        proposal.ipfsHash = _ipfsHash;
        proposal.startTime = _startTime;
        proposal.endTime = _endTime;
        proposal.proposalType = _proposalType;
        proposal.status = ProposalStatus.Active;
        proposal.quorum = _quorum > 0 ? _quorum : defaultQuorum;
        proposal.threshold = _threshold > 0 ? _threshold : defaultThreshold;
        proposal.createdAt = block.timestamp;
        
        emit ProposalCreated(
            newProposalId,
            msg.sender,
            _title,
            _proposalType,
            _startTime,
            _endTime
        );
    }
    
    /**
     * @dev Casts a vote on a proposal
     * @param _proposalId Proposal ID
     * @param _voteType Vote type
     */
    function castVote(uint256 _proposalId, VoteType _voteType) external whenNotPaused {
        require(filmToken.balanceOf(msg.sender) >= voteThreshold, "Insufficient tokens to vote");
        
        Proposal storage proposal = proposals[_proposalId];
        
        require(proposal.id > 0, "Proposal does not exist");
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp >= proposal.startTime, "Voting has not started");
        require(block.timestamp <= proposal.endTime, "Voting has ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        // Calculate vote weight based on token balance
        uint256 weight = filmToken.balanceOf(msg.sender);
        
        // Record vote
        proposal.hasVoted[msg.sender] = true;
        proposal.votes[msg.sender] = _voteType;
        
        // Update vote counts
        if (_voteType == VoteType.For) {
            proposal.forVotes += weight;
        } else if (_voteType == VoteType.Against) {
            proposal.againstVotes += weight;
        } else {
            proposal.abstainVotes += weight;
        }
        
        // Record in voter's history
        votesCast[msg.sender].push(Vote({
            voter: msg.sender,
            proposalId: _proposalId,
            voteType: _voteType,
            weight: weight,
            timestamp: block.timestamp
        }));
        
        emit VoteCast(msg.sender, _proposalId, _voteType, weight);
        
        // Check if proposal can be automatically finalized
        _checkProposalStatus(_proposalId);
    }
    
    /**
     * @dev Cancels a proposal
     * @param _proposalId Proposal ID
     */
    function cancelProposal(uint256 _proposalId) external whenNotPaused {
        Proposal storage proposal = proposals[_proposalId];
        
        require(proposal.id > 0, "Proposal does not exist");
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(proposal.creator == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");
        
        proposal.status = ProposalStatus.Canceled;
        
        emit ProposalCanceled(_proposalId);
    }
    
    /**
     * @dev Executes a proposal
     * @param _proposalId Proposal ID
     */
    function executeProposal(uint256 _proposalId) external whenNotPaused {
        Proposal storage proposal = proposals[_proposalId];
        
        require(proposal.id > 0, "Proposal does not exist");
        require(proposal.status == ProposalStatus.Passed, "Proposal not passed");
        require(hasRole(ADMIN_ROLE, msg.sender), "Not authorized");
        
        proposal.status = ProposalStatus.Executed;
        
        emit ProposalExecuted(_proposalId);
    }
    
    /**
     * @dev Finalizes a proposal after voting period
     * @param _proposalId Proposal ID
     */
    function finalizeProposal(uint256 _proposalId) external whenNotPaused {
        require(_checkProposalStatus(_proposalId), "Proposal cannot be finalized yet");
    }
    
    /**
     * @dev Checks and updates proposal status
     * @param _proposalId Proposal ID
     * @return Whether the proposal status was updated
     */
    function _checkProposalStatus(uint256 _proposalId) internal returns (bool) {
        Proposal storage proposal = proposals[_proposalId];
        
        if (proposal.status != ProposalStatus.Active) {
            return false;
        }
        
        if (block.timestamp <= proposal.endTime) {
            // Voting still in progress
            return false;
        }
        
        // Calculate total votes
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        
        // Check quorum
        uint256 totalSupply = filmToken.totalSupply();
        if (totalVotes * 10000 < totalSupply * proposal.quorum) {
            proposal.status = ProposalStatus.Rejected;
            return true;
        }
        
        // Check threshold
        if (proposal.forVotes * 10000 >= totalVotes * proposal.threshold) {
            proposal.status = ProposalStatus.Passed;
        } else {
            proposal.status = ProposalStatus.Rejected;
        }
        
        return true;
    }
    
    /**
     * @dev Gets a proposal
     * @param _proposalId Proposal ID
     * @return Proposal data
     */
    function getProposal(uint256 _proposalId) external view returns (ProposalView memory) {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.id > 0, "Proposal does not exist");
        
        return ProposalView({
            id: proposal.id,
            creator: proposal.creator,
            title: proposal.title,
            description: proposal.description,
            ipfsHash: proposal.ipfsHash,
            startTime: proposal.startTime,
            endTime: proposal.endTime,
            forVotes: proposal.forVotes,
            againstVotes: proposal.againstVotes,
            abstainVotes: proposal.abstainVotes,
            proposalType: proposal.proposalType,
            status: proposal.status,
            quorum: proposal.quorum,
            threshold: proposal.threshold,
            createdAt: proposal.createdAt
        });
    }
    
    /**
     * @dev Gets all active proposals
     * @return Array of proposal IDs
     */
    function getActiveProposals() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // Count active proposals
        for (uint256 i = 1; i <= _proposalIds.current(); i++) {
            if (proposals[i].status == ProposalStatus.Active) {
                activeCount++;
            }
        }
        
        uint256[] memory activeProposals = new uint256[](activeCount);
        uint256 currentIndex = 0;
        
        // Populate array with active proposal IDs
        for (uint256 i = 1; i <= _proposalIds.current(); i++) {
            if (proposals[i].status == ProposalStatus.Active) {
                activeProposals[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return activeProposals;
    }
    
    /**
     * @dev Gets votes cast by a user
     * @param _voter Voter address
     * @return Array of votes
     */
    function getVotesCast(address _voter) external view returns (Vote[] memory) {
        return votesCast[_voter];
    }
    
    /**
     * @dev Gets a user's vote on a proposal
     * @param _proposalId Proposal ID
     * @param _voter Voter address
     * @return Vote type and whether the user has voted
     */
    function getUserVote(uint256 _proposalId, address _voter) external view returns (VoteType, bool) {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.id > 0, "Proposal does not exist");
        
        return (proposal.votes[_voter], proposal.hasVoted[_voter]);
    }
    
    /**
     * @dev Sets the default quorum
     * @param _quorum New quorum in basis points (100 = 1%)
     */
    function setDefaultQuorum(uint256 _quorum) external onlyRole(ADMIN_ROLE) {
        require(_quorum > 0 && _quorum <= 10000, "Invalid quorum value");
        
        uint256 oldQuorum = defaultQuorum;
        defaultQuorum = _quorum;
        
        emit QuorumChanged(oldQuorum, _quorum);
    }
    
    /**
     * @dev Sets the default threshold
     * @param _threshold New threshold in basis points (100 = 1%)
     */
    function setDefaultThreshold(uint256 _threshold) external onlyRole(ADMIN_ROLE) {
        require(_threshold > 0 && _threshold <= 10000, "Invalid threshold value");
        
        uint256 oldThreshold = defaultThreshold;
        defaultThreshold = _threshold;
        
        emit ThresholdChanged(oldThreshold, _threshold);
    }
    
    /**
     * @dev Sets the proposal threshold
     * @param _threshold New threshold in tokens
     */
    function setProposalThreshold(uint256 _threshold) external onlyRole(ADMIN_ROLE) {
        uint256 oldThreshold = proposalThreshold;
        proposalThreshold = _threshold;
        
        emit ProposalThresholdChanged(oldThreshold, _threshold);
    }
    
    /**
     * @dev Sets the vote threshold
     * @param _threshold New threshold in tokens
     */
    function setVoteThreshold(uint256 _threshold) external onlyRole(ADMIN_ROLE) {
        uint256 oldThreshold = voteThreshold;
        voteThreshold = _threshold;
        
        emit VoteThresholdChanged(oldThreshold, _threshold);
    }
    
    /**
     * @dev Grants the proposal creator role
     * @param _account Account to grant the role to
     */
    function grantProposalCreatorRole(address _account) external onlyRole(ADMIN_ROLE) {
        grantRole(PROPOSAL_CREATOR_ROLE, _account);
    }
    
    /**
     * @dev Revokes the proposal creator role
     * @param _account Account to revoke the role from
     */
    function revokeProposalCreatorRole(address _account) external onlyRole(ADMIN_ROLE) {
        revokeRole(PROPOSAL_CREATOR_ROLE, _account);
    }
    
    /**
     * @dev Pauses the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpauses the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Function that should revert when msg.sender is not authorized to upgrade the contract
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}

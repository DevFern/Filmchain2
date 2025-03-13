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
 * @title IndieFund
 * @dev Platform for crowdfunding film projects
 */
contract IndieFund is 
    Initializable, 
    AccessControlUpgradeable, 
    ReentrancyGuardUpgradeable, 
    PausableUpgradeable, 
    UUPSUpgradeable 
{
    using CountersUpgradeable for CountersUpgradeable.Counter;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    IERC20Upgradeable public filmToken;
    
    CountersUpgradeable.Counter private _projectIds;
    
    // Project status
    enum ProjectStatus {
        Pending,
        Active,
        Funded,
        Completed,
        Canceled,
        Failed
    }
    
    // Project verification status
    enum VerificationStatus {
        Unverified,
        Pending,
        Verified,
        Rejected
    }
    
    // Milestone status
    enum MilestoneStatus {
        Pending,
        Completed,
        Failed
    }
    
    struct Project {
        uint256 id;
        address creator;
        string title;
        string description;
        string ipfsHash;
        uint256 fundingGoal;
        uint256 minContribution;
        uint256 maxContribution;
        uint256 deadline;
        uint256 totalFunds;
        uint256 totalBackers;
        ProjectStatus status;
        VerificationStatus verificationStatus;
        uint256 createdAt;
        uint256 updatedAt;
        bool refundEnabled;
    }
    
    struct Milestone {
        uint256 id;
        uint256 projectId;
        string title;
        string description;
        uint256 fundingPercentage;
        uint256 deadline;
        MilestoneStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }
    
    struct Contribution {
        address backer;
        uint256 projectId;
        uint256 amount;
        uint256 timestamp;
        bool refunded;
    }
    
    struct Update {
        uint256 id;
        uint256 projectId;
        string title;
        string content;
        string ipfsHash;
        uint256 timestamp;
    }
    
    // Mapping of project ID to project
    mapping(uint256 => Project) public projects;
    
    // Mapping of project ID to milestones
    mapping(uint256 => Milestone[]) public projectMilestones;
    
    // Mapping of project ID to updates
    mapping(uint256 => Update[]) public projectUpdates;
    
    // Mapping of project ID to backer to contribution
    mapping(uint256 => mapping(address => Contribution)) public contributions;
    
    // Mapping of project ID to backer addresses
    mapping(uint256 => address[]) public projectBackers;
    
    // Mapping of backer to backed projects
    mapping(address => uint256[]) public backedProjects;
    
    // Mapping of creator to created projects
    mapping(address => uint256[]) public createdProjects;
    
    // Platform fee in basis points (100 = 1%)
    uint256 public platformFee;
    
    // Events
    event ProjectCreated(
        uint256 indexed id,
        address indexed creator,
        string title,
        uint256 fundingGoal,
        uint256 deadline
    );
    
    event ProjectUpdated(uint256 indexed id, ProjectStatus status);
    event ProjectVerified(uint256 indexed id, VerificationStatus status);
    event ContributionMade(uint256 indexed projectId, address indexed backer, uint256 amount);
    event RefundClaimed(uint256 indexed projectId, address indexed backer, uint256 amount);
    event FundsWithdrawn(uint256 indexed projectId, address indexed creator, uint256 amount);
    event MilestoneAdded(uint256 indexed projectId, uint256 indexed milestoneId, string title);
    event MilestoneCompleted(uint256 indexed projectId, uint256 indexed milestoneId);
    event UpdatePosted(uint256 indexed projectId, uint256 indexed updateId, string title);
    
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
        _grantRole(VERIFIER_ROLE, admin);
        
        filmToken = IERC20Upgradeable(_filmToken);
        
        platformFee = 250; // 2.5%
    }
    
    /**
     * @dev Creates a new project
     * @param _title Project title
     * @param _description Project description
     * @param _ipfsHash IPFS hash for additional data
     * @param _fundingGoal Funding goal in FILM tokens
     * @param _minContribution Minimum contribution in FILM tokens
     * @param _maxContribution Maximum contribution in FILM tokens (0 for no max)
     * @param _deadline Deadline timestamp
     * @param _milestones Array of milestone titles
     * @param _milestoneDescriptions Array of milestone descriptions
     * @param _milestoneFundingPercentages Array of milestone funding percentages
     * @param _milestoneDeadlines Array of milestone deadlines
     */
    function createProject(
        string memory _title,
        string memory _description,
        string memory _ipfsHash,
        uint256 _fundingGoal,
        uint256 _minContribution,
        uint256 _maxContribution,
        uint256 _deadline,
        string[] memory _milestones,
        string[] memory _milestoneDescriptions,
        uint256[] memory _milestoneFundingPercentages,
        uint256[] memory _milestoneDeadlines
    ) external whenNotPaused {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_fundingGoal > 0, "Funding goal must be greater than 0");
        require(_minContribution > 0, "Min contribution must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(_milestones.length == _milestoneDescriptions.length, "Milestone arrays length mismatch");
        require(_milestones.length == _milestoneFundingPercentages.length, "Milestone arrays length mismatch");
        require(_milestones.length == _milestoneDeadlines.length, "Milestone arrays length mismatch");
        
        // Check that milestone percentages add up to 100%
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < _milestoneFundingPercentages.length; i++) {
            totalPercentage += _milestoneFundingPercentages[i];
        }
        require(totalPercentage == 10000, "Milestone percentages must add up to 100%");
        
        _projectIds.increment();
        uint256 newProjectId = _projectIds.current();
        
        projects[newProjectId] = Project({
            id: newProjectId,
            creator: msg.sender,
            title: _title,
            description: _description,
            ipfsHash: _ipfsHash,
            fundingGoal: _fundingGoal,
            minContribution: _minContribution,
            maxContribution: _maxContribution > 0 ? _maxContribution : type(uint256).max,
            deadline: _deadline,
            totalFunds: 0,
            totalBackers: 0,
            status: ProjectStatus.Pending,
            verificationStatus: VerificationStatus.Pending,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            refundEnabled: false
        });
        
        // Add milestones
        for (uint256 i = 0; i < _milestones.length; i++) {
            projectMilestones[newProjectId].push(Milestone({
                id: i + 1,
                projectId: newProjectId,
                title: _milestones[i],
                description: _milestoneDescriptions[i],
                fundingPercentage: _milestoneFundingPercentages[i],
                deadline: _milestoneDeadlines[i],
                status: MilestoneStatus.Pending,
                createdAt: block.timestamp,
                completedAt: 0
            }));
            
            emit MilestoneAdded(newProjectId, i + 1, _milestones[i]);
        }
        
        createdProjects[msg.sender].push(newProjectId);
        
        emit ProjectCreated(
            newProjectId,
            msg.sender,
            _title,
            _fundingGoal,
            _deadline
        );
    }
    
    /**
     * @dev Verifies a project
     * @param _projectId Project ID
     * @param _status Verification status
     */
    function verifyProject(uint256 _projectId, VerificationStatus _status) external onlyRole(VERIFIER_ROLE) {
        Project storage project = projects[_projectId];
        
        require(project.id > 0, "Project does not exist");
        require(project.verificationStatus == VerificationStatus.Pending, "Project not pending verification");
        
       project.verificationStatus = _status;
        project.updatedAt = block.timestamp;
        
        if (_status == VerificationStatus.Verified) {
            project.status = ProjectStatus.Active;
        } else if (_status == VerificationStatus.Rejected) {
            project.status = ProjectStatus.Canceled;
        }
        
        emit ProjectVerified(_projectId, _status);
        emit ProjectUpdated(_projectId, project.status);
    }
    
    /**
     * @dev Contributes to a project
     * @param _projectId Project ID
     * @param _amount Amount in FILM tokens
     */
    function contribute(uint256 _projectId, uint256 _amount) external nonReentrant whenNotPaused {
        Project storage project = projects[_projectId];
        
        require(project.id > 0, "Project does not exist");
        require(project.status == ProjectStatus.Active, "Project not active");
        require(project.verificationStatus == VerificationStatus.Verified, "Project not verified");
        require(block.timestamp <= project.deadline, "Project deadline passed");
        require(_amount >= project.minContribution, "Amount below minimum contribution");
        require(_amount <= project.maxContribution, "Amount above maximum contribution");
        
        // Check if already contributed
        Contribution storage contribution = contributions[_projectId][msg.sender];
        
        if (contribution.amount > 0) {
            // Update existing contribution
            require(contribution.amount + _amount <= project.maxContribution, "Total contribution exceeds maximum");
            contribution.amount += _amount;
            contribution.timestamp = block.timestamp;
        } else {
            // New contribution
            contributions[_projectId][msg.sender] = Contribution({
                backer: msg.sender,
                projectId: _projectId,
                amount: _amount,
                timestamp: block.timestamp,
                refunded: false
            });
            
            projectBackers[_projectId].push(msg.sender);
            backedProjects[msg.sender].push(_projectId);
            project.totalBackers++;
        }
        
        // Transfer tokens from contributor to contract
        require(filmToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        
        project.totalFunds += _amount;
        project.updatedAt = block.timestamp;
        
        // Check if funding goal reached
        if (project.totalFunds >= project.fundingGoal) {
            project.status = ProjectStatus.Funded;
            emit ProjectUpdated(_projectId, project.status);
        }
        
        emit ContributionMade(_projectId, msg.sender, _amount);
    }
    
    /**
     * @dev Claims a refund for a failed project
     * @param _projectId Project ID
     */
    function claimRefund(uint256 _projectId) external nonReentrant whenNotPaused {
        Project storage project = projects[_projectId];
        
        require(project.id > 0, "Project does not exist");
        require(
            project.status == ProjectStatus.Failed || 
            project.status == ProjectStatus.Canceled || 
            project.refundEnabled, 
            "Refunds not available"
        );
        
        Contribution storage contribution = contributions[_projectId][msg.sender];
        
        require(contribution.amount > 0, "No contribution found");
        require(!contribution.refunded, "Already refunded");
        
        uint256 refundAmount = contribution.amount;
        contribution.refunded = true;
        
        // Transfer tokens back to contributor
        require(filmToken.transfer(msg.sender, refundAmount), "Transfer failed");
        
        emit RefundClaimed(_projectId, msg.sender, refundAmount);
    }
    
    /**
     * @dev Withdraws funds for a milestone
     * @param _projectId Project ID
     * @param _milestoneId Milestone ID
     */
    function withdrawMilestoneFunds(uint256 _projectId, uint256 _milestoneId) external nonReentrant whenNotPaused {
        Project storage project = projects[_projectId];
        
        require(project.id > 0, "Project does not exist");
        require(project.creator == msg.sender, "Not project creator");
        require(project.status == ProjectStatus.Funded || project.status == ProjectStatus.Completed, "Project not funded");
        
        require(_milestoneId > 0 && _milestoneId <= projectMilestones[_projectId].length, "Invalid milestone ID");
        
        Milestone storage milestone = projectMilestones[_projectId][_milestoneId - 1];
        
        require(milestone.status == MilestoneStatus.Completed, "Milestone not completed");
        
        // Calculate amount to withdraw
        uint256 amount = (project.totalFunds * milestone.fundingPercentage) / 10000;
        
        // Calculate platform fee
        uint256 fee = (amount * platformFee) / 10000;
        uint256 creatorAmount = amount - fee;
        
        // Transfer tokens to creator
        require(filmToken.transfer(project.creator, creatorAmount), "Transfer failed");
        
        emit FundsWithdrawn(_projectId, project.creator, creatorAmount);
    }
    
    /**
     * @dev Completes a milestone
     * @param _projectId Project ID
     * @param _milestoneId Milestone ID
     */
    function completeMilestone(uint256 _projectId, uint256 _milestoneId) external onlyRole(VERIFIER_ROLE) {
        Project storage project = projects[_projectId];
        
        require(project.id > 0, "Project does not exist");
        require(project.status == ProjectStatus.Funded || project.status == ProjectStatus.Completed, "Project not funded");
        
        require(_milestoneId > 0 && _milestoneId <= projectMilestones[_projectId].length, "Invalid milestone ID");
        
        Milestone storage milestone = projectMilestones[_projectId][_milestoneId - 1];
        
        require(milestone.status == MilestoneStatus.Pending, "Milestone not pending");
        
        milestone.status = MilestoneStatus.Completed;
        milestone.completedAt = block.timestamp;
        
        // Check if all milestones are completed
        bool allCompleted = true;
        for (uint256 i = 0; i < projectMilestones[_projectId].length; i++) {
            if (projectMilestones[_projectId][i].status != MilestoneStatus.Completed) {
                allCompleted = false;
                break;
            }
        }
        
        if (allCompleted) {
            project.status = ProjectStatus.Completed;
            project.updatedAt = block.timestamp;
            emit ProjectUpdated(_projectId, project.status);
        }
        
        emit MilestoneCompleted(_projectId, _milestoneId);
    }
    
    /**
     * @dev Fails a milestone
     * @param _projectId Project ID
     * @param _milestoneId Milestone ID
     */
    function failMilestone(uint256 _projectId, uint256 _milestoneId) external onlyRole(VERIFIER_ROLE) {
        Project storage project = projects[_projectId];
        
        require(project.id > 0, "Project does not exist");
        require(project.status == ProjectStatus.Funded, "Project not funded");
        
        require(_milestoneId > 0 && _milestoneId <= projectMilestones[_projectId].length, "Invalid milestone ID");
        
        Milestone storage milestone = projectMilestones[_projectId][_milestoneId - 1];
        
        require(milestone.status == MilestoneStatus.Pending, "Milestone not pending");
        
        milestone.status = MilestoneStatus.Failed;
        
        // Enable refunds for the project
        project.refundEnabled = true;
        project.status = ProjectStatus.Failed;
        project.updatedAt = block.timestamp;
        
        emit ProjectUpdated(_projectId, project.status);
    }
    
    /**
     * @dev Posts an update to a project
     * @param _projectId Project ID
     * @param _title Update title
     * @param _content Update content
     * @param _ipfsHash IPFS hash for additional data
     */
    function postUpdate(
        uint256 _projectId,
        string memory _title,
        string memory _content,
        string memory _ipfsHash
    ) external whenNotPaused {
        Project storage project = projects[_projectId];
        
        require(project.id > 0, "Project does not exist");
        require(project.creator == msg.sender, "Not project creator");
        require(bytes(_title).length > 0, "Title cannot be empty");
        
        uint256 updateId = projectUpdates[_projectId].length + 1;
        
        projectUpdates[_projectId].push(Update({
            id: updateId,
            projectId: _projectId,
            title: _title,
            content: _content,
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp
        }));
        
        emit UpdatePosted(_projectId, updateId, _title);
    }
    
    /**
     * @dev Cancels a project
     * @param _projectId Project ID
     */
    function cancelProject(uint256 _projectId) external whenNotPaused {
        Project storage project = projects[_projectId];
        
        require(project.id > 0, "Project does not exist");
        require(project.creator == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");
        require(project.status == ProjectStatus.Pending || project.status == ProjectStatus.Active, "Cannot cancel project");
        
        project.status = ProjectStatus.Canceled;
        project.updatedAt = block.timestamp;
        
        emit ProjectUpdated(_projectId, project.status);
    }
    
    /**
     * @dev Gets a project
     * @param _projectId Project ID
     * @return Project data
     */
    function getProject(uint256 _projectId) external view returns (
        uint256 id,
        address creator,
        string memory title,
        string memory description,
        string memory ipfsHash,
        uint256 fundingGoal,
        uint256 minContribution,
        uint256 maxContribution,
        uint256 deadline,
        uint256 totalFunds,
        uint256 totalBackers,
        ProjectStatus status,
        VerificationStatus verificationStatus,
        uint256 createdAt,
        uint256 updatedAt,
        bool refundEnabled
    ) {
        Project storage project = projects[_projectId];
        require(project.id > 0, "Project does not exist");
        
        return (
            project.id,
            project.creator,
            project.title,
            project.description,
            project.ipfsHash,
            project.fundingGoal,
            project.minContribution,
            project.maxContribution,
            project.deadline,
            project.totalFunds,
            project.totalBackers,
            project.status,
            project.verificationStatus,
            project.createdAt,
            project.updatedAt,
            project.refundEnabled
        );
    }
    
    /**
     * @dev Gets project milestones
     * @param _projectId Project ID
     * @return Array of milestones
     */
    function getProjectMilestones(uint256 _projectId) external view returns (Milestone[] memory) {
        require(projects[_projectId].id > 0, "Project does not exist");
        return projectMilestones[_projectId];
    }
    
    /**
     * @dev Gets project updates
     * @param _projectId Project ID
     * @return Array of updates
     */
    function getProjectUpdates(uint256 _projectId) external view returns (Update[] memory) {
        require(projects[_projectId].id > 0, "Project does not exist");
        return projectUpdates[_projectId];
    }
    
    /**
     * @dev Gets a user's contribution to a project
     * @param _projectId Project ID
     * @param _backer Backer address
     * @return Contribution data
     */
    function getContribution(uint256 _projectId, address _backer) external view returns (
        address backer,
        uint256 projectId,
        uint256 amount,
        uint256 timestamp,
        bool refunded
    ) {
        Contribution storage contribution = contributions[_projectId][_backer];
        
        return (
            contribution.backer,
            contribution.projectId,
            contribution.amount,
            contribution.timestamp,
            contribution.refunded
        );
    }
    
    /**
     * @dev Gets projects created by a user
     * @param _creator Creator address
     * @return Array of project IDs
     */
    function getCreatedProjects(address _creator) external view returns (uint256[] memory) {
        return createdProjects[_creator];
    }
    
    /**
     * @dev Gets projects backed by a user
     * @param _backer Backer address
     * @return Array of project IDs
     */
    function getBackedProjects(address _backer) external view returns (uint256[] memory) {
        return backedProjects[_backer];
    }
    
    /**
     * @dev Gets active projects
     * @return Array of project IDs
     */
    function getActiveProjects() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // Count active projects
        for (uint256 i = 1; i <= _projectIds.current(); i++) {
            if (projects[i].status == ProjectStatus.Active && projects[i].verificationStatus == VerificationStatus.Verified) {
                activeCount++;
            }
        }
        
        uint256[] memory activeProjects = new uint256[](activeCount);
        uint256 currentIndex = 0;
        
        // Populate array with active project IDs
        for (uint256 i = 1; i <= _projectIds.current(); i++) {
            if (projects[i].status == ProjectStatus.Active && projects[i].verificationStatus == VerificationStatus.Verified) {
                activeProjects[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return activeProjects;
    }
    
    /**
     * @dev Sets the platform fee
     * @param _fee Fee in basis points (100 = 1%)
     */
    function setPlatformFee(uint256 _fee) external onlyRole(ADMIN_ROLE) {
        require(_fee <= 1000, "Fee cannot exceed 10%");
        platformFee = _fee;
    }
    
    /**
     * @dev Withdraws platform fees
     */
    function withdrawFees() external onlyRole(ADMIN_ROLE) nonReentrant {
        uint256 balance = filmToken.balanceOf(address(this));
        
        // Calculate total funds in escrow
        uint256 escrowFunds = 0;
        for (uint256 i = 1; i <= _projectIds.current(); i++) {
            Project storage project = projects[i];
            if (project.status == ProjectStatus.Active || project.status == ProjectStatus.Funded) {
                escrowFunds += project.totalFunds;
            }
        }
        
        uint256 fees = balance - escrowFunds;
        require(fees > 0, "No fees to withdraw");
        
        require(filmToken.transfer(msg.sender, fees), "Transfer failed");
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

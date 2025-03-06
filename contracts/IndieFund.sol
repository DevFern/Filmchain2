// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract IndieFund is Ownable, ReentrancyGuard {
    IERC20 public filmToken;
    
    enum ProjectStatus { Pending, Active, Funded, Completed, Cancelled }
    enum MilestoneStatus { Pending, Approved, Rejected, Released }
    
    struct Milestone {
        string title;
        string description;
        uint256 amount;
        uint256 releaseDate;
        MilestoneStatus status;
    }
    
    struct Project {
        uint256 id;
        address creator;
        string title;
        string description;
        string ipfsHash;
        uint256 fundingGoal;
        uint256 minFundingGoal;
        uint256 raisedAmount;
        uint256 startDate;
        uint256 endDate;
        ProjectStatus status;
        Milestone[] milestones;
        mapping(address => uint256) contributions;
        uint256 contributorsCount;
    }
    
    uint256 public projectCount;
    mapping(uint256 => Project) public projects;
    
    event ProjectCreated(uint256 indexed id, address indexed creator, string title, uint256 fundingGoal);
    event ProjectFunded(uint256 indexed id, address indexed contributor, uint256 amount);
    event MilestoneAdded(uint256 indexed projectId, uint256 milestoneIndex, string title);
    event MilestoneApproved(uint256 indexed projectId, uint256 milestoneIndex);
    event MilestoneReleased(uint256 indexed projectId, uint256 milestoneIndex, uint256 amount);
    event ProjectCancelled(uint256 indexed id);
    event ProjectCompleted(uint256 indexed id);
    
    constructor(address _filmToken) {
        filmToken = IERC20(_filmToken);
    }
    
    function createProject(
        string memory _title,
        string memory _description,
        string memory _ipfsHash,
        uint256 _fundingGoal,
        uint256 _minFundingGoal,
        uint256 _startDate,
        uint256 _endDate
    ) external {
        require(_startDate >= block.timestamp, "Start date must be in the future");
        require(_endDate > _startDate, "End date must be after start date");
        require(_fundingGoal > 0, "Funding goal must be greater than 0");
        require(_minFundingGoal > 0 && _minFundingGoal <= _fundingGoal, "Invalid min funding goal");
        
        projectCount++;
        Project storage project = projects[projectCount];
        project.id = projectCount;
        project.creator = msg.sender;
        project.title = _title;
        project.description = _description;
        project.ipfsHash = _ipfsHash;
        project.fundingGoal = _fundingGoal;
        project.minFundingGoal = _minFundingGoal;
        project.startDate = _startDate;
        project.endDate = _endDate;
        project.status = ProjectStatus.Pending;
        
        emit ProjectCreated(projectCount, msg.sender, _title, _fundingGoal);
    }
    
    function approveProject(uint256 _projectId) external onlyOwner {
        Project storage project = projects[_projectId];
        require(project.status == ProjectStatus.Pending, "Project not in pending status");
        
        project.status = ProjectStatus.Active;
    }
    
    function addMilestone(
        uint256 _projectId,
        string memory _title,
        string memory _description,
        uint256 _amount,
        uint256 _releaseDate
    ) external {
        Project storage project = projects[_projectId];
        require(msg.sender == project.creator, "Only creator can add milestones");
        require(project.status == ProjectStatus.Pending || project.status == ProjectStatus.Active, "Project not in valid status");
        
        Milestone memory milestone = Milestone({
            title: _title,
            description: _description,
            amount: _amount,
            releaseDate: _releaseDate,
            status: MilestoneStatus.Pending
        });
        
        project.milestones.push(milestone);
        
        emit MilestoneAdded(_projectId, project.milestones.length - 1, _title);
    }
    
    function fundProject(uint256 _projectId, uint256 _amount) external nonReentrant {
        Project storage project = projects[_projectId];
        require(project.status == ProjectStatus.Active, "Project not active");
        require(block.timestamp >= project.startDate, "Funding not started");
        require(block.timestamp <= project.endDate, "Funding ended");
        
        if (project.contributions[msg.sender] == 0) {
            project.contributorsCount++;
        }
        
        project.contributions[msg.sender] += _amount;
        project.raisedAmount += _amount;
        
        require(filmToken.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");
        
        emit ProjectFunded(_projectId, msg.sender, _amount);
        
        if (project.raisedAmount >= project.fundingGoal) {
            project.status = ProjectStatus.Funded;
        }
    }
    
    function approveMilestone(uint256 _projectId, uint256 _milestoneIndex) external onlyOwner {
        Project storage project = projects[_projectId];
        require(project.status == ProjectStatus.Funded || project.status == ProjectStatus.Active, "Project not funded or active");
        require(_milestoneIndex < project.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = project.milestones[_milestoneIndex];function approveMilestone(uint256 _projectId, uint256 _milestoneIndex) external onlyOwner {
        Project storage project = projects[_projectId];
        require(project.status == ProjectStatus.Funded || project.status == ProjectStatus.Active, "Project not funded or active");
        require(_milestoneIndex < project.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = project.milestones[_milestoneIndex];
        require(milestone.status == MilestoneStatus.Pending, "Milestone not in pending status");
        
        milestone.status = MilestoneStatus.Approved;
        
        emit MilestoneApproved(_projectId, _milestoneIndex);
    }
    
    function releaseMilestone(uint256 _projectId, uint256 _milestoneIndex) external onlyOwner {
        Project storage project = projects[_projectId];
        require(project.status == ProjectStatus.Funded, "Project not funded");
        require(_milestoneIndex < project.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = project.milestones[_milestoneIndex];
        require(milestone.status == MilestoneStatus.Approved, "Milestone not approved");
        require(block.timestamp >= milestone.releaseDate, "Release date not reached");
        
        milestone.status = MilestoneStatus.Released;
        
        require(filmToken.transfer(project.creator, milestone.amount), "Token transfer failed");
        
        emit MilestoneReleased(_projectId, _milestoneIndex, milestone.amount);
        
        // Check if all milestones are released
        bool allReleased = true;
        for (uint i = 0; i < project.milestones.length; i++) {
            if (project.milestones[i].status != MilestoneStatus.Released) {
                allReleased = false;
                break;
            }
        }
        
        if (allReleased) {
            project.status = ProjectStatus.Completed;
            emit ProjectCompleted(project.id);
        }
    }
    
    function cancelProject(uint256 _projectId) external onlyOwner {
        Project storage project = projects[_projectId];
        require(project.status != ProjectStatus.Completed && project.status != ProjectStatus.Cancelled, "Project already completed or cancelled");
        
        project.status = ProjectStatus.Cancelled;
        
        emit ProjectCancelled(_projectId);
    }
    
    function refundContribution(uint256 _projectId) external nonReentrant {
        Project storage project = projects[_projectId];
        require(project.status == ProjectStatus.Cancelled || 
               (project.status == ProjectStatus.Active && block.timestamp > project.endDate && project.raisedAmount < project.minFundingGoal), 
               "Project not eligible for refund");
        
        uint256 contribution = project.contributions[msg.sender];
        require(contribution > 0, "No contribution to refund");
        
        project.contributions[msg.sender] = 0;
        project.raisedAmount -= contribution;
        
        require(filmToken.transfer(msg.sender, contribution), "Token transfer failed");
    }
    
    function getProjectMilestones(uint256 _projectId) external view returns (Milestone[] memory) {
        return projects[_projectId].milestones;
    }
    
    function getContribution(uint256 _projectId, address _contributor) external view returns (uint256) {
        return projects[_projectId].contributions[_contributor];
    }
}

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
 * @title HyreBlock
 * @dev Platform for film industry professionals to create profiles and job listings
 */
contract HyreBlock is 
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
    
    CountersUpgradeable.Counter private _jobIds;
    CountersUpgradeable.Counter private _contractIds;
    
    // Skill categories
    enum SkillCategory {
        Acting,
        Directing,
        Writing,
        Cinematography,
        Editing,
        Sound,
        Music,
        VFX,
        Production,
        Marketing,
        Distribution,
        Other
    }
    
    // Profile verification levels
    enum VerificationLevel {
        None,
        Basic,
        Professional,
        Expert,
        Studio
    }
    
    // Job status
    enum JobStatus {
        Open,
        InProgress,
        Completed,
        Cancelled,
        Disputed
    }
    
    // Contract status
    enum ContractStatus {
        Pending,
        Active,
        Completed,
        Cancelled,
        Disputed
    }
    
    struct Profile {
        address owner;
        string name;
        string bio;
        string skills;
        string ipfsHash; // For profile image and additional data
        VerificationLevel verificationLevel;
        uint256 createdAt;
        uint256 updatedAt;
        SkillCategory[] skillCategories;
        string location;
        string website;
        string socialMedia;
        uint256 rating; // Average rating (1-5) * 100
        uint256 ratingCount;
        bool isAvailable;
    }
    
    struct Job {
        uint256 id;
        address creator;
        string title;
        string description;
        string requirements;
        string ipfsHash;
        uint256 budget;
        JobStatus status;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 deadline;
        SkillCategory[] requiredSkills;
        string location;
        bool isRemote;
        address[] applicants;
        address hiredProfessional;
    }
    
    struct WorkContract {
        uint256 id;
        uint256 jobId;
        address employer;
        address professional;
        string title;
        string description;
        string deliverables;
        uint256 payment;
        uint256 startDate;
        uint256 endDate;
        ContractStatus status;
        uint256 createdAt;
        bool employerApproved;
        bool professionalApproved;
        uint256 escrowAmount;
        uint256 releaseAmount;
    }
    
    struct Review {
        address reviewer;
        address reviewee;
        uint256 rating; // 1-5
        string comment;
        uint256 timestamp;
        uint256 jobId;
    }
    
    // Mapping of address to profile
    mapping(address => Profile) public profiles;
    
    // Mapping of address to profile existence
    mapping(address => bool) public hasProfile;
    
    // Mapping of job ID to job
    mapping(uint256 => Job) public jobs;
    
    // Mapping of contract ID to work contract
    mapping(uint256 => WorkContract) public workContracts;
    
    // Mapping of address to reviews received
    mapping(address => Review[]) public receivedReviews;
    
    // Mapping of address to reviews given
    mapping(address => Review[]) public givenReviews;
    
    // Mapping of job ID to applicants
    mapping(uint256 => mapping(address => string)) public jobApplications;
    
    // Platform fee in basis points (100 = 1%)
    uint256 public platformFee;
    
    // Events
    event ProfileCreated(address indexed owner, string name, string ipfsHash);
    event ProfileUpdated(address indexed owner, string name, string ipfsHash);
    event ProfileVerified(address indexed owner, VerificationLevel level);
    event JobCreated(uint256 indexed id, address indexed creator, string title, uint256 budget);
    event JobUpdated(uint256 indexed id, string title, JobStatus status);
    event JobApplication(uint256 indexed jobId, address indexed applicant);
    event ProfessionalHired(uint256 indexed jobId, address indexed professional);
    event ContractCreated(uint256 indexed id, uint256 indexed jobId, address employer, address professional);
    event ContractSigned(uint256 indexed id, address signer);
    event ContractCompleted(uint256 indexed id);
    event ContractDisputed(uint256 indexed id, address disputer);
    event PaymentReleased(uint256 indexed contractId, uint256 amount);
    event ReviewSubmitted(address indexed reviewer, address indexed reviewee, uint256 rating);
    
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
     * @dev Creates a new profile
     * @param _name Profile name
     * @param _bio Profile bio
     * @param _skills Skills description
     * @param _ipfsHash IPFS hash for profile image and additional data
     * @param _skillCategories Array of skill categories
     * @param _location Location
     * @param _website Website
     * @param _socialMedia Social media links
     */
    function createProfile(
        string memory _name,
        string memory _bio,
        string memory _skills,
        string memory _ipfsHash,
        SkillCategory[] memory _skillCategories,
        string memory _location,
        string memory _website,
        string memory _socialMedia
    ) external whenNotPaused {
        require(!hasProfile[msg.sender], "Profile already exists");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        profiles[msg.sender] = Profile({
            owner: msg.sender,
            name: _name,
            bio: _bio,
            skills: _skills,
            ipfsHash: _ipfsHash,
            verificationLevel: VerificationLevel.None,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            skillCategories: _skillCategories,
            location: _location,
            website: _website,
            socialMedia: _socialMedia,
            rating: 0,
            ratingCount: 0,
            isAvailable: true
        });
        
        hasProfile[msg.sender] = true;
        
        emit ProfileCreated(msg.sender, _name, _ipfsHash);
    }
    
    /**
     * @dev Updates an existing profile
     * @param _name Profile name
     * @param _bio Profile bio
     * @param _skills Skills description
     * @param _ipfsHash IPFS hash for profile image and additional data
     * @param _skillCategories Array of skill categories
     * @param _location Location
     * @param _website Website
     * @param _socialMedia Social media links
     * @param _isAvailable Availability status
     */
    function updateProfile(
        string memory _name,
        string memory _bio,
        string memory _skills,
        string memory _ipfsHash,
        SkillCategory[] memory _skillCategories,
        string memory _location,
        string memory _website,
        string memory _socialMedia,
        bool _isAvailable
    ) external whenNotPaused {
        require(hasProfile[msg.sender], "Profile does not exist");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        Profile storage profile = profiles[msg.sender];
        
        profile.name = _name;
        profile.bio = _bio;
        profile.skills = _skills;
        profile.ipfsHash = _ipfsHash;
        profile.updatedAt = block.timestamp;
        profile.skillCategories = _skillCategories;
        profile.location = _location;
        profile.website = _website;
        profile.socialMedia = _socialMedia;
        profile.isAvailable = _isAvailable;
        
        emit ProfileUpdated(msg.sender, _name, _ipfsHash);
    }
    
    /**
     * @dev Verifies a profile
     * @param _profileOwner Address of the profile owner
     * @param _level Verification level
     */
    function verifyProfile(address _profileOwner, VerificationLevel _level) external onlyRole(VERIFIER_ROLE) {
        require(hasProfile[_profileOwner], "Profile does not exist");
        
        profiles[_profileOwner].verificationLevel = _level;
        
        emit ProfileVerified(_profileOwner, _level);
    }
    
    /**
     * @dev Creates a new job
     * @param _title Job title
     * @param _description Job description
     * @param _requirements Job requirements
     * @param _ipfsHash IPFS hash for additional data
     * @param _budget Budget in FILM tokens
     * @param _deadline Deadline timestamp
     * @param _requiredSkills Array of required skills
     * @param _location Job location
     * @param _isRemote Whether the job can be done remotely
     */
    function createJob(
        string memory _title,
        string memory _description,
        string memory _requirements,
        string memory _ipfsHash,
        uint256 _budget,
        uint256 _deadline,
        SkillCategory[] memory _requiredSkills,
        string memory _location,
        bool _isRemote
    ) external whenNotPaused {
        require(hasProfile[msg.sender], "Must have a profile to create a job");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_budget > 0, "Budget must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        
        _jobIds.increment();
        uint256 newJobId = _jobIds.current();
        
        address[] memory emptyArray = new address[](0);
        
        jobs[newJobId] = Job({
            id: newJobId,
            creator: msg.sender,
            title: _title,
            description: _description,
            requirements: _requirements,
            ipfsHash: _ipfsHash,
            budget: _budget,
            status: JobStatus.Open,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deadline: _deadline,
            requiredSkills: _requiredSkills,
            location: _location,
            isRemote: _isRemote,
            applicants: emptyArray,
            hiredProfessional: address(0)
        });
        
        emit JobCreated(newJobId, msg.sender, _title, _budget);
    }
    
    /**
     * @dev Updates a job
     * @param _jobId Job ID
     * @param _title Job title
     * @param _description Job description
     * @param _requirements Job requirements
     * @param _ipfsHash IPFS hash for additional data
     * @param _budget Budget in FILM tokens
     * @param _deadline Deadline timestamp
     * @param _requiredSkills Array of required skills
     * @param _location Job location
     * @param _isRemote Whether the job can be done remotely
     */
    function updateJob(
        uint256 _jobId,
        string memory _title,
        string memory _description,
        string memory _requirements,
        string memory _ipfsHash,
        uint256 _budget,
        uint256 _deadline,
        SkillCategory[] memory _requiredSkills,
        string memory _location,
        bool _isRemote
    ) external whenNotPaused {
        Job storage job = jobs[_jobId];
        
        require(job.creator == msg.sender, "Not job creator");
        require(job.status == JobStatus.Open, "Job not open");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_budget > 0, "Budget must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        
        job.title = _title;
        job.description = _description;
        job.requirements = _requirements;
        job.ipfsHash = _ipfsHash;
        job.budget = _budget;
        job.deadline = _deadline;
        job.requiredSkills = _requiredSkills;
        job.location = _location;
        job.isRemote = _isRemote;
        job.updatedAt = block.timestamp;
        
        emit JobUpdated(_jobId, _title, job.status);
    }
    
    /**
     * @dev Applies for a job
     * @param _jobId Job ID
     * @param _application Application text
     */
    function applyForJob(uint256 _jobId, string memory _application) external whenNotPaused {
        require(hasProfile[msg.sender], "Must have a profile to apply");
        
        Job storage job = jobs[_jobId];
        
        require(job.status == JobStatus.Open, "Job not open");
        require(job.creator != msg.sender, "Cannot apply to own job");
        require(block.timestamp <= job.deadline, "Job deadline passed");
        require(bytes(_application).length > 0, "Application cannot be empty");
        
        // Check if already applied
        for (uint256 i = 0; i < job.applicants.length; i++) {
            if (job.applicants[i] == msg.sender) {
                revert("Already applied to this job");
            }
        }
        
        // Add to applicants array
        job.applicants.push(msg.sender);
        
        // Store application text
        jobApplications[_jobId][msg.sender] = _application;
        
        emit JobApplication(_jobId, msg.sender);
    }
    
    /**
     * @dev Hires a professional for a job
     * @param _jobId Job ID
     * @param _professional Address of the professional
     */
    function hireProfessional(uint256 _jobId, address _professional) external whenNotPaused {
        Job storage job = jobs[_jobId];
        
        require(job.creator == msg.sender, "Not job creator");
        require(job.status == JobStatus.Open, "Job not open");
        require(hasProfile[_professional], "Professional does not have a profile");
        
        // Check if professional applied
        bool applied = false;
        for (uint256 i = 0; i < job.applicants.length; i++) {
            if (job.applicants[i] == _professional) {
                applied = true;
                break;
            }
        }
        require(applied, "Professional did not apply for this job");
        
        job.hiredProfessional = _professional;
        job.status = JobStatus.InProgress;
        job.updatedAt = block.timestamp;
        
        emit ProfessionalHired(_jobId, _professional);
        emit JobUpdated(_jobId, job.title, job.status);
    }
    
    /**
     * @dev Creates a work contract for a job
     * @param _jobId Job ID
     * @param _title Contract title
     * @param _description Contract description
     * @param _deliverables Deliverables description
     * @param _payment Payment amount in FILM tokens
     * @param _startDate Start date timestamp
     * @param _endDate End date timestamp
     */
    function createContract(
        uint256 _jobId,
        string memory _title,
        string memory _description,
        string memory _deliverables,
        uint256 _payment,
        uint256 _startDate,
        uint256 _endDate
    ) external nonReentrant whenNotPaused {
        Job storage job = jobs[_jobId];
        
        require(job.creator == msg.sender, "Not job creator");
        require(job.status == JobStatus.InProgress, "Job not in progress");
        require(job.hiredProfessional != address(0), "No professional hired");
        require(_payment > 0, "Payment must be greater than 0");
        require(_payment <= job.budget, "Payment exceeds job budget");
        require(_startDate >= block.timestamp, "Start date must be in the future");
        require(_endDate > _startDate, "End date must be after start date");
        
        _contractIds.increment();
        uint256 newContractId = _contractIds.current();
        
        workContracts[newContractId] = WorkContract({
            id: newContractId,
            jobId: _jobId,
            employer: msg.sender,
            professional: job.hiredProfessional,
            title: _title,
            description: _description,
            deliverables: _deliverables,
            payment: _payment,
            startDate: _startDate,
            endDate: _endDate,
            status: ContractStatus.Pending,
            createdAt: block.timestamp,
            employerApproved: true,
            professionalApproved: false,
            escrowAmount: 0,
            releaseAmount: 0
        });
        
        emit ContractCreated(newContractId, _jobId, msg.sender, job.hiredProfessional);
    }
    
    /**
     * @dev Signs a work contract
     * @param _contractId Contract ID
     */
    function signContract(uint256 _contractId) external whenNotPaused {
        WorkContract storage workContract = workContracts[_contractId];
        
        require(workContract.id > 0, "Contract does not exist");
        require(workContract.status == ContractStatus.Pending, "Contract not pending");
        require(msg.sender == workContract.professional, "Not the professional");
        require(!workContract.professionalApproved, "Already signed");
        
        workContract.professionalApproved = true;
        
        // If both parties have signed, activate the contract
        if (workContract.employerApproved && workContract.professionalApproved) {
            workContract.status = ContractStatus.Active;
            
            // Transfer payment to escrow
            require(filmToken.transferFrom(workContract.employer, address(this), workContract.payment), "Payment transfer failed");
            workContract.escrowAmount = workContract.payment;
        }
        
        emit ContractSigned(_contractId, msg.sender);
    }
    
    /**
     * @dev Completes a work contract
     * @param _contractId Contract ID
     */
    function completeContract(uint256 _contractId) external nonReentrant whenNotPaused {
        WorkContract storage workContract = workContracts[_contractId];
        
        require(workContract.id > 0, "Contract does not exist");
        require(workContract.status == ContractStatus.Active, "Contract not active");
        require(msg.sender == workContract.employer, "Not the employer");
        
        // Calculate platform fee
        uint256 fee = (workContract.payment * platformFee) / 10000;
        uint256 professionalAmount = workContract.payment - fee;
        
        // Transfer payment to professional
        require(filmToken.transfer(workContract.professional, professionalAmount), "Transfer to professional failed");
        
        workContract.status = ContractStatus.Completed;
        workContract.releaseAmount = professionalAmount;
        
        // Update job status
        Job storage job = jobs[workContract.jobId];
        job.status = JobStatus.Completed;
        job.updatedAt = block.timestamp;
        
        emit ContractCompleted(_contractId);
        emit PaymentReleased(_contractId, professionalAmount);
        emit JobUpdated(workContract.jobId, job.title, job.status);
    }
    
    /**
     * @dev Disputes a work contract
     * @param _contractId Contract ID
     */
    function disputeContract(uint256 _contractId) external whenNotPaused {
        WorkContract storage workContract = workContracts[_contractId];
        
        require(workContract.id > 0, "Contract does not exist");
        require(workContract.status == ContractStatus.Active, "Contract not active");
        require(msg.sender == workContract.employer || msg.sender == workContract.professional, "Not a party to the contract");
        
        workContract.status = ContractStatus.Disputed;
        
        // Update job status
        Job storage job = jobs[workContract.jobId];
        job.status = JobStatus.Disputed;
        job.updatedAt = block.timestamp;
        
        emit ContractDisputed(_contractId, msg.sender);
        emit JobUpdated(workContract.jobId, job.title, job.status);
    }
    
    /**
     * @dev Resolves a disputed contract
     * @param _contractId Contract ID
     * @param _employerAmount Amount to return to employer
     * @param _professionalAmount Amount to pay to professional
     */
    function resolveDispute(
        uint256 _contractId,
        uint256 _employerAmount,
        uint256 _professionalAmount
    ) external nonReentrant onlyRole(ADMIN_ROLE) {
        WorkContract storage workContract = workContracts[_contractId];
        
        require(workContract.id > 0, "Contract does not exist");
        require(workContract.status == ContractStatus.Disputed, "Contract not disputed");
        require(_employerAmount + _professionalAmount <= workContract.escrowAmount, "Amounts exceed escrow");
        
        // Transfer to employer
        if (_employerAmount > 0) {
            require(filmToken.transfer(workContract.employer, _employerAmount), "Transfer to employer failed");
        }
        
        // Transfer to professional
        if (_professionalAmount > 0) {
            require(filmToken.transfer(workContract.professional, _professionalAmount), "Transfer to professional failed");
        }
        
        workContract.status = ContractStatus.Completed;
        workContract.releaseAmount = _professionalAmount;
        
        // Update job status
        Job storage job = jobs[workContract.jobId];
        job.status = JobStatus.Completed;
        job.updatedAt = block.timestamp;
        
        emit ContractCompleted(_contractId);
        emit PaymentReleased(_contractId, _professionalAmount);
        emit JobUpdated(workContract.jobId, job.title, job.status);
    }
    
    /**
     * @dev Submits a review
     * @param _reviewee Address of the person being reviewed
     * @param _rating Rating (1-5)
     * @param _comment Review comment
     * @param _jobId Job ID
     */
    function submitReview(
        address _reviewee,
        uint256 _rating,
        string memory _comment,
        uint256 _jobId
    ) external whenNotPaused {
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5");
        require(hasProfile[_reviewee], "Reviewee does not have a profile");
        
        Job storage job = jobs[_jobId];
        
        // Verify that reviewer and reviewee worked together
        bool validReview = false;
        if (job.creator == msg.sender && job.hiredProfessional == _reviewee) {
            validReview = true; // Employer reviewing professional
        } else if (job.creator == _reviewee && job.hiredProfessional == msg.sender) {
            validReview = true; // Professional reviewing employer
        }
        
        require(validReview, "Not authorized to review");
        require(job.status == JobStatus.Completed, "Job not completed");
        
        // Create review
        Review memory review = Review({
            reviewer: msg.sender,
            reviewee: _reviewee,
            rating: _rating,
            comment: _comment,
            timestamp: block.timestamp,
            jobId: _jobId
        });
        
        // Add to reviews
        receivedReviews[_reviewee].push(review);
        givenReviews[msg.sender].push(review);
        
        // Update profile rating
        Profile storage profile = profiles[_reviewee];
        uint256 totalRating = profile.rating * profile.ratingCount;
        profile.ratingCount++;
        profile.rating = (totalRating + _rating * 100) / profile.ratingCount;
        
        emit ReviewSubmitted(msg.sender, _reviewee, _rating);
    }
    
    /**
     * @dev Gets open jobs
     * @return Array of jobs
     */
    function getOpenJobs() external view returns (Job[] memory) {
        uint256 openJobCount = 0;
        
        // Count open jobs
        for (uint256 i = 1; i <= _jobIds.current(); i++) {
            if (jobs[i].status == JobStatus.Open) {
                openJobCount++;
            }
        }
        
        Job[] memory openJobs = new Job[](openJobCount);
        uint256 currentIndex = 0;
        
        // Populate array with open jobs
        for (uint256 i = 1; i <= _jobIds.current(); i++) {
            if (jobs[i].status == JobStatus.Open) {
                openJobs[currentIndex] = jobs[i];
                currentIndex++;
            }
        }
        
        return openJobs;
    }
    
    /**
     * @dev Gets jobs by creator
     * @param _creator Creator address
     * @return Array of jobs
     */
    function getJobsByCreator(address _creator) external view returns (Job[] memory) {
        uint256 count = 0;
        
        // Count jobs by creator
        for (uint256 i = 1; i <= _jobIds.current(); i++) {
            if (jobs[i].creator == _creator) {
                count++;
            }
        }
        
        Job[] memory creatorJobs = new Job[](count);
        uint256 currentIndex = 0;
        
        // Populate array with jobs by creator
        for (uint256 i = 1; i <= _jobIds.current(); i++) {
            if (jobs[i].creator == _creator) {
                creatorJobs[currentIndex] = jobs[i];
                currentIndex++;
            }
        }
        
        return creatorJobs;
    }
    
    /**
     * @dev Gets jobs by professional
     * @param _professional Professional address
     * @return Array of jobs
     */
    function getJobsByProfessional(address _professional) external view returns (Job[] memory) {
        uint256 count = 0;
        
        // Count jobs by professional
        for (uint256 i = 1; i <= _jobIds.current(); i++) {
            if (jobs[i].hiredProfessional == _professional) {
                count++;
            }
        }
        
        Job[] memory professionalJobs = new Job[](count);
        uint256 currentIndex = 0;
        
        // Populate array with jobs by professional
        for (uint256 i = 1; i <= _jobIds.current(); i++) {
            if (jobs[i].hiredProfessional == _professional) {
                professionalJobs[currentIndex] = jobs[i];
                currentIndex++;
            }
        }
        
        return professionalJobs;
    }
    
    /**
     * @dev Gets contracts by employer
     * @param _employer Employer address
     * @return Array of contract IDs
     */
    function getContractsByEmployer(address _employer) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count contracts by employer
        for (uint256 i = 1; i <= _contractIds.current(); i++) {
            if (workContracts[i].employer == _employer) {
                count++;
            }
        }
        
        uint256[] memory contractIds = new uint256[](count);
        uint256 currentIndex = 0;
        
        // Populate array with contract IDs
        for (uint256 i = 1; i <= _contractIds.current(); i++) {
            if (workContracts[i].employer == _employer) {
                contractIds[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return contractIds;
    }
    
    /**
     * @dev Gets contracts by professional
     * @param _professional Professional address
     * @return Array of contract IDs
     */
    function getContractsByProfessional(address _professional) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count contracts by professional
        for (uint256 i = 1; i <= _contractIds.current(); i++) {
            if (workContracts[i].professional == _professional) {
                count++;
            }
        }
        
        uint256[] memory contractIds = new uint256[](count);
        uint256 currentIndex = 0;
        
        // Populate array with contract IDs
        for (uint256 i = 1; i <= _contractIds.current(); i++) {
            if (workContracts[i].professional == _professional) {
                contractIds[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return contractIds;
    }
    
    /**
     * @dev Gets a profile
     * @param _profileOwner Address of the profile owner
     * @return Profile data
     */
    function getProfile(address _profileOwner) external view returns (
        string memory name,
        string memory bio,
        string memory skills,
        string memory ipfsHash,
        VerificationLevel verificationLevel,
        uint256 createdAt,
        uint256 updatedAt,
        SkillCategory[] memory skillCategories,
        string memory location,
        string memory website,
        string memory socialMedia,
        uint256 rating,
        uint256 ratingCount,
        bool isAvailable
    ) {
        require(hasProfile[_profileOwner], "Profile does not exist");
        
        Profile storage profile = profiles[_profileOwner];
        
        return (
            profile.name,
            profile.bio,
            profile.skills,
            profile.ipfsHash,
            profile.verificationLevel,
            profile.createdAt,
            profile.updatedAt,
            profile.skillCategories,
            profile.location,
            profile.website,
            profile.socialMedia,
            profile.rating,
            profile.ratingCount,
            profile.isAvailable
        );
    }
    
/**
     * @dev Gets reviews received by a user
     * @param _user User address
     * @return Array of reviews
     */
    function getReceivedReviews(address _user) external view returns (Review[] memory) {
        return receivedReviews[_user];
    }
    
    /**
     * @dev Gets reviews given by a user
     * @param _user User address
     * @return Array of reviews
     */
    function getGivenReviews(address _user) external view returns (Review[] memory) {
        return givenReviews[_user];
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
        require(balance > 0, "No fees to withdraw");
        
        require(filmToken.transfer(msg.sender, balance), "Transfer failed");
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

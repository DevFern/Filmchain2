// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

contract HyreBlock is Ownable {
    struct Profile {
        address owner;
        string name;
        string bio;
        string skills;
        string ipfsHash; // For profile image and additional data
        bool isVerified;
        uint256 createdAt;
    }
    
    struct Job {
        uint256 id;
        address creator;
        string title;
        string description;
        string requirements;
        string ipfsHash;
        uint256 budget;
        bool isOpen;
        uint256 createdAt;
    }
    
    mapping(address => Profile) public profiles;
    mapping(address => bool) public hasProfile;
    
    uint256 public jobCount;
    mapping(uint256 => Job) public jobs;
    
    event ProfileCreated(address indexed owner, string name, string ipfsHash);
    event ProfileUpdated(address indexed owner, string name, string ipfsHash);
    event ProfileVerified(address indexed owner);
    event JobCreated(uint256 indexed id, address indexed creator, string title, uint256 budget);
    event JobClosed(uint256 indexed id);
    
    function createProfile(
        string memory _name,
        string memory _bio,
        string memory _skills,
        string memory _ipfsHash
    ) external {
        require(!hasProfile[msg.sender], "Profile already exists");
        
        profiles[msg.sender] = Profile({
            owner: msg.sender,
            name: _name,
            bio: _bio,
            skills: _skills,
            ipfsHash: _ipfsHash,
            isVerified: false,
            createdAt: block.timestamp
        });
        
        hasProfile[msg.sender] = true;
        
        emit ProfileCreated(msg.sender, _name, _ipfsHash);
    }
    
    function updateProfile(
        string memory _name,
        string memory _bio,
        string memory _skills,
        string memory _ipfsHash
    ) external {
        require(hasProfile[msg.sender], "Profile does not exist");
        
        Profile storage profile = profiles[msg.sender];
        profile.name = _name;
        profile.bio = _bio;
        profile.skills = _skills;
        profile.ipfsHash = _ipfsHash;
        
        emit ProfileUpdated(msg.sender, _name, _ipfsHash);
    }
    
    function verifyProfile(address _profileOwner) external onlyOwner {
        require(hasProfile[_profileOwner], "Profile does not exist");
        
        profiles[_profileOwner].isVerified = true;
        
        emit ProfileVerified(_profileOwner);
    }
    
    function createJob(
        string memory _title,
        string memory _description,
        string memory _requirements,
        string memory _ipfsHash,
        uint256 _budget
    ) external {
        require(hasProfile[msg.sender], "Must have a profile to create a job");
        
        jobCount++;
        
        jobs[jobCount] = Job({
            id: jobCount,
            creator: msg.sender,
            title: _title,
            description: _description,
            requirements: _requirements,
            ipfsHash: _ipfsHash,
            budget: _budget,
            isOpen: true,
            createdAt: block.timestamp
        });
        
        emit JobCreated(jobCount, msg.sender, _title, _budget);
    }
    
    function closeJob(uint256 _jobId) external {
        Job storage job = jobs[_jobId];
        require(job.creator == msg.sender || owner() == msg.sender, "Not authorized");
        require(job.isOpen, "Job already closed");
        
        job.isOpen = false;
        
        emit JobClosed(_jobId);
    }
    
    function getProfile(address _profileOwner) external view returns (
        string memory name,
        string memory bio,
        string memory skills,
        string memory ipfsHash,
        bool isVerified,
        uint256 createdAt
    ) {
        require(hasProfile[_profileOwner], "Profile does not exist");
        
        Profile memory profile = profiles[_profileOwner];
        
        return (
            profile.name,
            profile.bio,
            profile.skills,
            profile.ipfsHash,
            profile.isVerified,
            profile.createdAt
        );
    }
    
    function getOpenJobs() external view returns (Job[] memory) {
        uint256 openJobCount = 0;
        
        for (uint256 i = 1; i <= jobCount; i++) {
            if (jobs[i].isOpen) {
                openJobCount++;
            }
        }
        
        Job[] memory openJobs = new Job[](openJobCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i <= jobCount; i++) {
            if (jobs[i].isOpen) {
                openJobs[currentIndex] = jobs[i];
                currentIndex++;
            }
        }
        
        return openJobs;
    }
}

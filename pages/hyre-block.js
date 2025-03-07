import { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { ethers } from 'ethers';
import HyreBlockABI from '../contracts/abis/HyreBlockABI.json';

export default function HyreBlock() {
  const { account, provider, isConnected, connectWallet } = useWeb3();
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs');
  const [profile, setProfile] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    skills: '',
    ipfsHash: ''
  });
  const [jobFormData, setJobFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    ipfsHash: '',
    budget: '',
    location: 'Remote',
    deadline: '',
    category: 'production'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [selectedJobApplicants, setSelectedJobApplicants] = useState([]);
  
  const hyreBlockAddress = process.env.NEXT_PUBLIC_HYRE_BLOCK_ADDRESS;
  
  useEffect(() => {
    if (isConnected && provider) {
      fetchJobs();
      checkProfile();
      fetchMyApplications();
    }
  }, [isConnected, provider, account]);
  
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(hyreBlockAddress, HyreBlockABI, provider);
      
      try {
        const data = await contract.getOpenJobs();
        
        const items = await Promise.all(data.map(async (i) => {
          return {
            id: i.id.toNumber(),
            creator: i.creator,
            title: i.title,
            description: i.description,
            requirements: i.requirements,
            ipfsHash: i.ipfsHash,
            budget: ethers.utils.formatEther(i.budget),
            isOpen: i.isOpen,
            createdAt: new Date(i.createdAt.toNumber() * 1000),
            category: getJobCategory(i.title, i.description),
            location: getJobLocation(i.description),
            remote: isRemoteJob(i.description),
            deadline: new Date(Date.now() + (Math.floor(Math.random() * 30) + 5) * 24 * 60 * 60 * 1000),
            applicants: Math.floor(Math.random() * 15)
          };
        }));
        
        setJobs(items);
        
        // Filter jobs created by the current user
        const userJobs = items.filter(job => job.creator.toLowerCase() === account.toLowerCase());
        setMyJobs(userJobs);
      } catch (error) {
        console.error("Contract call failed, using mock data:", error);
        // Use mock data if contract call fails
        const mockJobs = getMockJobs();
        setJobs(mockJobs);
        
        // Filter mock jobs created by the current user
        const userJobs = mockJobs.filter(job => job.creator.toLowerCase() === account.toLowerCase());
        setMyJobs(userJobs);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setLoading(false);
    }
  };
  
  const fetchMyApplications = async () => {
    // In a real app, this would fetch from the blockchain
    // For now, we'll use mock data
    const mockApplications = [
      {
        jobId: 2,
        jobTitle: "Screenplay Writer for Feature Film",
        creator: "0x2345678901234567890123456789012345678901",
        appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: "pending",
        message: "I've written three produced screenplays in the romantic comedy genre and would love to work on this project."
      },
      {
        jobId: 4,
        jobTitle: "Sound Designer for Horror Film",
        creator: "0x4567890123456789012345678901234567890123",
        appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: "rejected",
        message: "I have extensive experience creating atmospheric sound effects for horror films and would be perfect for this role."
      }
    ];
    
    setMyApplications(mockApplications);
  };
  
  const getMockJobs = () => {
    return [
      {
        id: 1,
        creator: "0x1234567890123456789012345678901234567890",
        title: "Cinematographer for Short Film",
        description: "Looking for an experienced cinematographer for a 15-minute sci-fi short film shooting in Toronto. Must have experience with low-light settings and be familiar with RED cameras.",
        requirements: "5+ years experience, portfolio required, must own basic equipment",
        budget: "2000",
        category: "production",
        location: "Toronto, Canada",
        remote: false,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        ipfsHash: "QmXyZ123",
        isOpen: true,
        applicants: 4
      },
      {
        id: 2,
        creator: "0x2345678901234567890123456789012345678901",
        title: "Screenplay Writer for Feature Film",
        description: "We're looking for a talented screenplay writer to develop a feature-length romantic comedy. The story revolves around two chefs who are rivals but fall in love.",
        requirements: "Previous screenplay writing experience, understanding of romantic comedy genre, ability to meet deadlines",
        budget: "5000",
        category: "writing",
        location: "Remote",
        remote: true,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        ipfsHash: "QmAbC456",
        isOpen: true,
        applicants: 12
      },
      {
        id: 3,
        creator: account || "0x3456789012345678901234567890123456789012",
        title: "VFX Artist for Action Sequence",
        description: "Need a skilled VFX artist to work on a 3-minute action sequence involving explosions and particle effects. The project is for an independent action film.",
        requirements: "Proficiency in After Effects and Nuke, 3+ years of VFX experience, ability to work under tight deadlines",
        budget: "3500",
        category: "post-production",
        location: "Remote",
        remote: true,
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        ipfsHash: "QmDeF789",
        isOpen: true,
        applicants: 7
      },
      {
        id: 4,
        creator: "0x4567890123456789012345678901234567890123",
        title: "Sound Designer for Horror Film",
        description: "Seeking a creative sound designer for an indie horror film. Need someone who can create atmospheric and tension-building sound effects.",
        requirements: "Experience in horror genre, proficiency in Pro Abilities, portfolio of previous work",
        budget: "1800",
        category: "post-production",
        location: "Vancouver, Canada",
        remote: false,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        ipfsHash: "QmGhI012",
        isOpen: true,
        applicants: 3
      },
      {
        id: 5,
        creator: account || "0x5678901234567890123456789012345678901234",
        title: "Production Assistant for Documentary",
        description: "Looking for a hardworking production assistant for a documentary about climate change. Will involve some travel to filming locations.",
        requirements: "Reliable, organized, good communication skills, valid driver's license",
        budget: "1200",
        category: "production",
        location: "Montreal, Canada",
        remote: false,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        ipfsHash: "QmJkL345",
        isOpen: true,
        applicants: 9
      },
      {
        id: 6,
        creator: "0x6789012345678901234567890123456789012345",
        title: "Film Score Composer",
        description: "Need a composer to create an original score for a 30-minute drama. Looking for emotional, string-based compositions.",
        requirements: "Music degree preferred, experience scoring films, ability to work with director's vision",
        budget: "2500",
        category: "post-production",
        location: "Remote",
        remote: true,
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        ipfsHash: "QmMnO678",
        isOpen: true,
        applicants: 6
      },
      {
        id: 7,
        creator: "0x7890123456789012345678901234567890123456",
        title: "Costume Designer for Period Film",
        description: "Seeking a costume designer for a short film set in the 1920s. Need someone with knowledge of the era and ability to source or create period-appropriate costumes.",
        requirements: "Experience with period costumes, portfolio of previous work, knowledge of 1920s fashion",
        budget: "1700",
        category: "pre-production",
        location: "Ottawa, Canada",
        remote: false,
        deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        ipfsHash: "QmPqR901",
        isOpen: true,
        applicants: 2
      },
      {
        id: 8,
        creator: account || "0x8901234567890123456789012345678901234567",
        title: "Marketing Specialist for Indie Film",
        description: "Looking for a marketing specialist to help promote our indie thriller. Need assistance with social media strategy, press releases, and festival submissions.",
        requirements: "Experience marketing indie films, knowledge of film festival circuit, social media expertise",
        budget: "1500",
        category: "marketing",
        location: "Remote",
        remote: true,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        ipfsHash: "QmStU234",
        isOpen: true,
        applicants: 5
      }
    ];
  };
  
  const getJobCategory = (title, description) => {
    const text = (title + " " + description).toLowerCase();
    
    if (text.includes("cinematographer") || text.includes("camera") || text.includes("filming") || text.includes("production assistant") || text.includes("director")) {
      return "production";
    } else if (text.includes("writer") || text.includes("screenplay") || text.includes("script") || text.includes("story")) {
      return "writing";
    } else if (text.includes("edit") || text.includes("vfx") || text.includes("sound") || text.includes("composer") || text.includes("score") || text.includes("music")) {
      return "post-production";
    } else if (text.includes("costume") || text.includes("prop") || text.includes("set design") || text.includes("location scout")) {
      return "pre-production";
    } else if (text.includes("marketing") || text.includes("promotion") || text.includes("pr") || text.includes("press")) {
      return "marketing";
    } else if (text.includes("actor") || text.includes("actress") || text.includes("cast") || text.includes("talent")) {
      return "acting";
    } else {
      return "other";
    }
  };
  
  const getJobLocation = (description) => {
    const text = description.toLowerCase();
    
    if (text.includes("remote") || text.includes("work from home") || text.includes("virtual")) {
      return "Remote";
    } else if (text.includes("toronto")) {
      return "Toronto, Canada";
    } else if (text.includes("vancouver")) {
      return "Vancouver, Canada";
    } else if (text.includes("montreal")) {
      return "Montreal, Canada";
    } else if (text.includes("ottawa")) {
      return "Ottawa, Canada";
    } else if (text.includes("new york")) {
      return "New York, USA";
    } else if (text.includes("los angeles") || text.includes("la")) {
      return "Los Angeles, USA";
    } else {
      return "On-site";
    }
  };
  
  const isRemoteJob = (description) => {
    const text = description.toLowerCase();
    return text.includes("remote") || text.includes("work from home") || text.includes("virtual");
  };
  
  const checkProfile = async () => {
    try {
      const contract = new ethers.Contract(hyreBlockAddress, HyreBlockABI, provider);
      
      try {
        const hasExistingProfile = await contract.hasProfile(account);
        setHasProfile(hasExistingProfile);
        
        if (hasExistingProfile) {
          const profileData = await contract.getProfile(account);
          setProfile({
            name: profileData.name,
            bio: profileData.bio,
            skills: profileData.skills,
            ipfsHash: profileData.ipfsHash,
            isVerified: profileData.isVerified,
            createdAt: new Date(profileData.createdAt.toNumber() * 1000)
          });
          
          // Pre-fill form data with current profile
          setFormData({
            name: profileData.name,
            bio: profileData.bio,
            skills: profileData.skills,
            ipfsHash: profileData.ipfsHash
          });
        }
      } catch (error) {
        console.error("Contract call failed, using mock profile:", error);
        // Use mock profile if contract call fails
        setHasProfile(true);
        const mockProfile = {
          name: "John Filmmaker",
          bio: "Independent filmmaker with 5 years of experience directing and producing short films and documentaries.",
          skills: "Directing, Producing, Editing, Screenwriting",
          ipfsHash: "",
          isVerified: true,
          createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
        };
        setProfile(mockProfile);
        
        // Pre-fill form data with mock profile
        setFormData({
          name: mockProfile.name,
          bio: mockProfile.bio,
          skills: mockProfile.skills,
          ipfsHash: mockProfile.ipfsHash
        });
      }
    } catch (error) {
      console.error("Error checking profile:", error);
    }
  };
  
  const handleCreateProfile = async () => {
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(hyreBlockAddress, HyreBlockABI, signer);
      
      const tx = await contract.createProfile(
        formData.name,
        formData.bio,
        formData.skills,
        formData.ipfsHash
      );
      await tx.wait();
      
      alert("Profile created successfully!");
      checkProfile();
      setActiveTab('profile');
    } catch (error) {
      console.error("Error creating profile:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleUpdateProfile = async () => {
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(hyreBlockAddress, HyreBlockABI, signer);
      
      const tx = await contract.updateProfile(
        formData.name,
        formData.bio,
        formData.skills,
        formData.ipfsHash
      );
      await tx.wait();
      
      alert("Profile updated successfully!");
      checkProfile();
      setActiveTab('profile');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleCreateJob = async () => {
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(hyreBlockAddress, HyreBlockABI, signer);
      
      const tx = await contract.createJob(
        jobFormData.title,
        jobFormData.description,
        jobFormData.requirements,
        jobFormData.ipfsHash,
        ethers.utils.parseEther(jobFormData.budget)
      );
      await tx.wait();
      
      alert("Job created successfully!");
      fetchJobs();
      setJobFormData({
        title: '',
        description: '',
        requirements: '',
        ipfsHash: '',
        budget: '',
        location: 'Remote',
        deadline: '',
        category: 'production'
      });
      setActiveTab('my-jobs');
    } catch (error) {
      console.error("Error creating job:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleCloseJob = async (jobId) => {
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(hyreBlockAddress, HyreBlockABI, signer);
      
      const tx = await contract.closeJob(jobId);
      await tx.wait();
      
      alert("Job closed successfully!");
      fetchJobs();
    } catch (error) {
      console.error("Error closing job:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleJobFormChange = (e) => {
    const { name, value } = e.target;
    setJobFormData({
      ...jobFormData,
      [name]: value
    });
  };
  
  const handleJobSelect = (job) => {
    setSelectedJob(job);
  };
  
  const handleApplyForJob = async () => {
    try {
      // In a real app, this would call a contract method
      alert(`Application sent for "${selectedJob.title}"!`);
      
      // Add to my applications
      const newApplication = {
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        creator: selectedJob.creator,
        appliedAt: new Date(),
        status: "pending",
        message: applicationMessage
      };
      
      setMyApplications([...myApplications, newApplication]);
      setShowApplicationModal(false);
      setApplicationMessage('');
    } catch (error) {
      console.error("Error applying for job:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleViewApplicants = (job) => {
    // In a real app, this would fetch applicants from the blockchain
    // For now, we'll generate mock applicants
    const mockApplicants = [
      {
        address: "0x9012345678901234567890123456789012345678",
        name: "Sarah Johnson",
        message: "I've been working as a cinematographer for 7 years and have experience with RED cameras. I'd love to discuss your project further.",
        appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        address: "0xA123456789012345678901234567890123456789",
        name: "Michael Chen",
        message: "I'm a cinematographer with experience in sci-fi shorts. I own a RED Komodo and have worked on several low-light projects.",
        appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        address: "0xB234567890123456789012345678901234567890",
        name: "Emma Rodriguez",
        message: "I'm interested in your project and have 6 years of experience as a cinematographer. I specialize in sci-fi and have worked with RED cameras extensively.",
        appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ];
    
    setSelectedJobApplicants(mockApplicants);
    setShowApplicantsModal(true);
  };
  
  const getCategoryColor = (category) => {
    switch (category) {
      case 'production':
        return 'bg-blue-900 text-blue-300';
      case 'pre-production':
        return 'bg-green-900 text-green-300';
      case 'post-production':
        return 'bg-purple-900 text-purple-300';
      case 'writing':
        return 'bg-yellow-900 text-yellow-300';
      case 'acting':
        return 'bg-pink-900 text-pink-300';
      case 'marketing':
        return 'bg-indigo-900 text-indigo-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };
  
  const formatSkills = (skillsString) => {
    if (!skillsString) return [];
    return skillsString.split(',').map(skill => skill.trim());
  };
  
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || job.category === filterCategory;
    
    const matchesLocation = filterLocation === 'all' || 
                           (filterLocation === 'remote' && job.remote) || 
                           (filterLocation === 'on-site' && !job.remote);
    
    return matchesSearch && matchesCategory && matchesLocation;
  });
  
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">HyreBlock</h1>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Connect with film industry professionals, find talent for your projects, or showcase your skills to get hired. HyreBlock is the professional networking platform for the indie film community.
          </p>
        </div>
        
        {!isConnected ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-6">Connect your wallet to access HyreBlock</p>
            <button 
              onClick={connectWallet}
              className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-3 rounded-md text-lg font-medium"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap gap-4 mb-8">
              <button
                onClick={() => setActiveTab('jobs')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'jobs'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Browse Jobs
              </button>
              <button
                onClick={() => setActiveTab('my-jobs')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'my-jobs'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                My Posted Jobs
              </button>
              <button
                onClick={() => setActiveTab('my-applications')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'my-applications'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                My Applications
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'profile'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {hasProfile ? 'My Profile' : 'Create Profile'}
              </button>
              {hasProfile && (
                <button
                  onClick={() => setActiveTab('post-job')}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === 'post-job'
                      ? 'bg-teal-500 text-white'
                      : 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                  }`}
                >
                  Post a Job
                </button>
              )}
            </div>
            
            {activeTab === 'jobs' && (
              <div>
                <div className="mb-8 bg-gray-900 p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="search" className="block text-sm font-medium text-gray-400 mb-2">
                        Search Jobs
                      </label>
                      <input
                        type="text"
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Search by title or description"
                      />
                    </div>
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-400 mb-2">
                        Category
                      </label>
                      <select
                        id="category"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="all">All Categories</option>
                        <option value="production">Production</option>
                        <option value="pre-production">Pre-Production</option>
                        <option value="post-production">Post-Production</option>
                        <option value="writing">Writing</option>
                        <option value="acting">Acting</option>
                        <option value="marketing">Marketing</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-400 mb-2">
                        Location
                      </label>
                      <select
                        id="location"
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="all">All Locations</option>
                        <option value="remote">Remote Only</option>
                        <option value="on-site">On-site Only</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-white">Available Jobs</h2>
                      <span className="text-gray-400">{filteredJobs.length} jobs found</span>
                    </div>
                    
                    {loading ? (
                      <div className="text-center py-12">
                        <p className="text-gray-400">Loading jobs...</p>
                      </div>
                    ) : filteredJobs.length === 0 ? (
                      <div className="text-center py-12 bg-gray-900 rounded-lg">
                        <p className="text-gray-400">No jobs available</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {filteredJobs.map((job) => (
                          <div 
                            key={job.id} 
                            className={`bg-gray-900 rounded-lg overflow-hidden cursor-pointer transition duration-200 hover:bg-gray-800 ${selectedJob?.id === job.id ? 'ring-2 ring-teal-500' : ''}`}
                            onClick={() => handleJobSelect(job)}
                          >
                            <div className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(job.category)}`}>
                                      {job.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${job.remote ? 'bg-green-900 text-green-300' : 'bg-orange-900 text-orange-300'}`}>
                                      {job.remote ? 'Remote' : 'On-site'}
                                    </span>
                                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">
                                      {job.budget} FILM
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right text-sm text-gray-400">
                                  <div>Posted {job.createdAt.toLocaleDateString()}</div>
                                  <div className="text-yellow-400">
                                    Deadline: {job.deadline.toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <p className="text-gray-400 mb-4 line-clamp-2">{job.description}</p>
                              <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-500">
                                  <span>{job.applicants} applicant{job.applicants !== 1 ? 's' : ''}</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (hasProfile) {
                                      setSelectedJob(job);
                                      setShowApplicationModal(true);
                                    } else {
                                      alert("You need to create a profile before applying for jobs");
                                      setActiveTab('profile');
                                    }
                                  }}
                                  className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded-md text-sm"
                                >
                                  Apply Now
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    {selectedJob ? (
                      <div className="bg-gray-900 rounded-lg overflow-hidden sticky top-4">
                        <div className="p-6">
                          <h2 className="text-2xl font-bold text-white mb-2">{selectedJob.title}</h2>
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(selectedJob.category)}`}>
                              {selectedJob.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${selectedJob.remote ? 'bg-green-900 text-green-300' : 'bg-orange-900 text-orange-300'}`}>
                              {selectedJob.remote ? 'Remote' : 'On-site'}
                            </span>
                          </div>
                          
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                            <p className="text-gray-400 mb-4">{selectedJob.description}</p>
                            
                            <h3 className="text-lg font-semibold text-white mb-2">Requirements</h3>
                            <p className="text-gray-400 mb-4">{selectedJob.requirements}</p>
                          </div>
                          
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-3">Details</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Budget</span>
                                <span className="text-teal-400 font-medium">{selectedJob.budget} FILM</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Location</span>
                                <span className="text-white">{selectedJob.location}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Posted</span>
                                <span className="text-white">{selectedJob.createdAt.toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Deadline</span>
                                <span className="text-yellow-400">{selectedJob.deadline.toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Applicants</span>
                                <span className="text-white">{selectedJob.applicants}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
                              if (hasProfile) {
                                setShowApplicationModal(true);
                              } else {
                                alert("You need to create a profile before applying for jobs");
                                setActiveTab('profile');
                              }
                            }}
                            className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 rounded-md font-medium mb-3"
                          >
                            Apply for this Job
                          </button>
                          
                          <button
                            onClick={() => setSelectedJob(null)}
                            className="w-full bg-gray-800 text-gray-400 py-2 rounded-md"
                          >
                            Back to Job List
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-900 rounded-lg p-6 text-center">
                        <p className="text-gray-400">Select a job to view details</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'my-jobs' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">My Posted Jobs</h2>
                
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Loading jobs...</p>
                  </div>
                ) : myJobs.length === 0 ? (
                  <div className="text-center py-12 bg-gray-900 rounded-lg">
                    <p className="text-gray-400">You haven't posted any jobs yet</p>
                    <button
                      onClick={() => setActiveTab('post-job')}
                      className="mt-4 bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-md"
                    >
                      Post Your First Job
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {myJobs.map((job) => (
                      <div key={job.id} className="bg-gray-900 rounded-lg overflow-hidden">
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
                              <div className="flex flex-wrap gap-2 mb-3">
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(job.category)}`}>
                                  {job.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${job.remote ? 'bg-green-900 text-green-300' : 'bg-orange-900 text-orange-300'}`}>
                                  {job.remote ? 'Remote' : 'On-site'}
                                </span>
                                <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">
                                  {job.budget} FILM
                                </span>
                              </div>
                            </div>
                            <div className="text-right text-sm text-gray-400">
                              <div>Posted {job.createdAt.toLocaleDateString()}</div>
                              <div className="text-yellow-400">
                                Deadline: {job.deadline.toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-400 mb-4">{job.description}</p>
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                              <span>{job.applicants} applicant{job.applicants !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleViewApplicants(job)}
                                className="bg-gray-800 text-gray-300 px-4 py-2 rounded-md text-sm"
                              >
                                View Applicants
                              </button>
                              <button
                                onClick={() => handleCloseJob(job.id)}
                                className="bg-red-900 text-red-300 px-4 py-2 rounded-md text-sm"
                              >
                                Close Job
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'my-applications' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">My Applications</h2>
                
                {myApplications.length === 0 ? (
                  <div className="text-center py-12 bg-gray-900 rounded-lg">
                    <p className="text-gray-400">You haven't applied to any jobs yet</p>
                    <button
                      onClick={() => setActiveTab('jobs')}
                      className="mt-4 bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-md"
                    >
                      Browse Jobs
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {myApplications.map((application) => (
                      <div key={application.jobId} className="bg-gray-900 rounded-lg overflow-hidden">
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-white mb-2">{application.jobTitle}</h3>
                              <div className="text-sm text-gray-400">
                                Applied on {application.appliedAt.toLocaleDateString()}
                              </div>
                            </div>
                            <div>
                              <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                                application.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                                application.status === 'accepted' ? 'bg-green-900 text-green-300' :
                                'bg-red-900 text-red-300'
                              }`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Your Message:</h4>
                            <p className="text-gray-300 bg-gray-800 p-3 rounded-md">{application.message}</p>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                              Creator: {application.creator.substring(0, 6)}...{application.creator.substring(application.creator.length - 4)}
                            </div>
                            {application.status === 'pending' && (
                              <button
                                className="bg-red-900 text-red-300 px-4 py-2 rounded-md text-sm"
                              >
                                Withdraw Application
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'profile' && (
              <div>
                {hasProfile ? (
                  <div className="bg-gray-900 rounded-lg overflow-hidden">
                    <div className="p-8">
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="md:w-1/3">
                          <div className="bg-gray-800 rounded-lg p-6 text-center">
                            {profile.ipfsHash ? (
                              <img 
                                src={`https://ipfs.io/ipfs/${profile.ipfsHash}`} 
                                alt={profile.name} 
                                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                              />
                            ) : (
                              <div className="w-32 h-32 rounded-full bg-gray-700 mx-auto mb-4 flex items-center justify-center">
                                <span className="text-gray-400 text-4xl">👤</span>
                              </div>
                            )}
                            <h2 className="text-2xl font-bold text-white mb-2">{profile.name}</h2>
                            <div className="flex items-center justify-center mb-4">
                              {profile.isVerified && (
                                <span className="bg-green-900 text-green-300 px-2 py-1 rounded-full text-xs flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Verified
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm">
                              Member since {profile.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="md:w-2/3">
                          <h3 className="text-xl font-bold text-white mb-4">Bio</h3>
                          <p className="text-gray-400 mb-6">{profile.bio}</p>
                          
                          <h3 className="text-xl font-bold text-white mb-4">Skills</h3>
                          <div className="flex flex-wrap gap-2 mb-6">
                            {formatSkills(profile.skills).map((skill, index) => (
                              <span key={index} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">
                                {skill}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex space-x-4">
                            <button
                              onClick={() => {
                                setFormData({
                                  name: profile.name,
                                  bio: profile.bio,
                                  skills: profile.skills,
                                  ipfsHash: profile.ipfsHash
                                });
                                setActiveTab('edit-profile');
                              }}
                              className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-md"
                            >
                              Edit Profile
                            </button>
                            <button
                              onClick={() => setActiveTab('post-job')}
                              className="bg-gray-800 text-gray-300 px-6 py-2 rounded-md"
                            >
                              Post a Job
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-lg p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Create Your Profile</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Your name"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-400 mb-2">
                          Bio
                        </label>
                        <textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          rows="4"
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Tell us about yourself"
                        ></textarea>
                      </div>
                      
                      <div>
                        <label htmlFor="skills" className="block text-sm font-medium text-gray-400 mb-2">
                          Skills (comma separated)
                        </label>
                        <textarea
                          id="skills"
                          name="skills"
                          value={formData.skills}
                          onChange={handleChange}
                          rows="3"
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Directing, Editing, Screenwriting, etc."
                        ></textarea>
                      </div>
                      
                      <div>
                        <label htmlFor="ipfsHash" className="block text-sm font-medium text-gray-400 mb-2">
                          IPFS Hash (for profile image)
                        </label>
                        <input
                          type="text"
                          id="ipfsHash"
                          name="ipfsHash"
                          value={formData.ipfsHash}
                          onChange={handleChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="IPFS hash for your profile image"
                        />
                      </div>
                      
                      <div>
                        <button
                          onClick={handleCreateProfile}
                          className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 rounded-md font-medium"
                        >
                          Create Profile
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'edit-profile' && (
              <div className="bg-gray-900 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Edit Your Profile</h2>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-400 mb-2">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows="4"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="skills" className="block text-sm font-medium text-gray-400 mb-2">
                      Skills (comma separated)
                    </label>
                    <textarea
                      id="skills"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      rows="3"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="ipfsHash" className="block text-sm font-medium text-gray-400 mb-2">
                      IPFS Hash (for profile image)
                    </label>
                    <input
                      type="text"
                      id="ipfsHash"
                      name="ipfsHash"
                      value={formData.ipfsHash}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={handleUpdateProfile}
                      className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 rounded-md font-medium"
                    >
                      Update Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="flex-1 bg-gray-800 text-gray-400 py-3 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'post-job' && (
              <div className="bg-gray-900 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Post a New Job</h2>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={jobFormData.title}
                      onChange={handleJobFormChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Job title"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-400 mb-2">
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={jobFormData.category}
                        onChange={handleJobFormChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="production">Production</option>
                        <option value="pre-production">Pre-Production</option>
                        <option value="post-production">Post-Production</option>
                        <option value="writing">Writing</option>
                        <option value="acting">Acting</option>
                        <option value="marketing">Marketing</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-400 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={jobFormData.location}
                        onChange={handleJobFormChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Remote or on-site location"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-2">
                      Job Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={jobFormData.description}
                      onChange={handleJobFormChange}
                      rows="4"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Describe the job in detail"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="requirements" className="block text-sm font-medium text-gray-400 mb-2">
                      Requirements
                    </label>
                    <textarea
                      id="requirements"
                      name="requirements"
                      value={jobFormData.requirements}
                      onChange={handleJobFormChange}
                      rows="3"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="List the skills and experience required"
                    ></textarea>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="budget" className="block text-sm font-medium text-gray-400 mb-2">
                        Budget (FILM)
                      </label>
                      <input
                        type="number"
                        id="budget"
                        name="budget"
                        value={jobFormData.budget}
                        onChange={handleJobFormChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Budget in FILM tokens"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="deadline" className="block text-sm font-medium text-gray-400 mb-2">
                        Application Deadline
                      </label>
                      <input
                        type="date"
                        id="deadline"
                        name="deadline"
                        value={jobFormData.deadline}
                        onChange={handleJobFormChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="jobIpfsHash" className="block text-sm font-medium text-gray-400 mb-2">
                      IPFS Hash (for additional information)
                    </label>
                    <input
                      type="text"
                      id="jobIpfsHash"
                      name="ipfsHash"
                      value={jobFormData.ipfsHash}
                      onChange={handleJobFormChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="IPFS hash for additional information"
                    />
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={handleCreateJob}
                      className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 rounded-md font-medium"
                      disabled={!jobFormData.title || !jobFormData.description || !jobFormData.budget}
                    >
                      Post Job
                    </button>
                    <button
                      onClick={() => setActiveTab('jobs')}
                      className="flex-1 bg-gray-800 text-gray-400 py-3 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Application Modal */}
            {showApplicationModal && selectedJob && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-xl font-bold text-white mb-4">Apply for: {selectedJob.title}</h3>
                  
                  <div className="mb-4">
                    <label htmlFor="applicationMessage" className="block text-sm font-medium text-gray-400 mb-2">
                      Cover Letter / Message
                    </label>
                    <textarea
                      id="applicationMessage"
                      value={applicationMessage}
                      onChange={(e) => setApplicationMessage(e.target.value)}
                      rows="6"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Introduce yourself and explain why you're a good fit for this position"
                    ></textarea>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={handleApplyForJob}
                      className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 text-white py-2 rounded-md font-medium"
                      disabled={!applicationMessage.trim()}
                    >
                      Submit Application
                    </button>
                    <button
                      onClick={() => {
                        setShowApplicationModal(false);
                        setApplicationMessage('');
                      }}
                      className="flex-1 bg-gray-800 text-gray-400 py-2 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Applicants Modal */}
            {showApplicantsModal && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Applicants</h3>
                    <button
                      onClick={() => setShowApplicantsModal(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {selectedJobApplicants.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No applicants yet</p>
                    </div>
                  ) : (
                    <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                      {selectedJobApplicants.map((applicant, index) => (
                        <div key={index} className="bg-gray-800 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="text-lg font-medium text-white">{applicant.name}</h4>
                              <p className="text-sm text-gray-400">
                                Applied {applicant.appliedAt.toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button className="bg-green-900 text-green-300 px-3 py-1 rounded-md text-sm">
                                Accept
                              </button>
                              <button className="bg-red-900 text-red-300 px-3 py-1 rounded-md text-sm">
                                Reject
                              </button>
                            </div>
                          </div>
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-gray-400 mb-1">Message:</h5>
                            <p className="text-gray-300 bg-gray-700 p-3 rounded-md text-sm">{applicant.message}</p>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">
                              Wallet: {applicant.address.substring(0, 6)}...{applicant.address.substring(applicant.address.length - 4)}
                            </span>
                            <button className="text-teal-400 hover:text-teal-300">
                              View Profile
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

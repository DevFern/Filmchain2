import { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { ethers } from 'ethers';
import HyreBlockABI from '../contracts/abis/HyreBlockABI.json';

export default function HyreBlock() {
  const { account, provider, isConnected, connectWallet } = useWeb3();
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
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
    budget: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  
  const hyreBlockAddress = process.env.NEXT_PUBLIC_HYRE_BLOCK_ADDRESS;
  
  useEffect(() => {
    if (isConnected && provider) {
      fetchJobs();
      checkProfile();
    }
  }, [isConnected, provider]);
  
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(hyreBlockAddress, HyreBlockABI, provider);
      
      try {
        const data = await contract.getOpenJobs();
        
        const items = data.map(i => ({
          id: i.id.toNumber(),
          creator: i.creator,
          title: i.title,
          description: i.description,
          requirements: i.requirements,
          ipfsHash: i.ipfsHash,
          budget: ethers.utils.formatEther(i.budget),
          isOpen: i.isOpen,
          createdAt: new Date(i.createdAt.toNumber() * 1000),
          category: getJobCategory(i.title, i.description)
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
  
  const getMockJobs = () => {
    return [
      {
        id: 1,
        creator: account || "0x1234567890123456789012345678901234567890",
        title: "Cinematographer for Short Film",
        description: "Looking for an experienced cinematographer for a 15-minute drama short film shooting in Los Angeles.",
        requirements: "5+ years experience, own equipment preferred, portfolio required",
        ipfsHash: "QmXyZ123",
        budget: "2000",
        isOpen: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        category: "production"
      },
      {
        id: 2,
        creator: "0x2345678901234567890123456789012345678901",
        title: "Screenwriter for Feature Film",
        description: "Seeking a screenwriter to develop a feature-length sci-fi screenplay based on our treatment.",
        requirements: "Previous produced credits, experience in sci-fi genre, ability to meet deadlines",
        ipfsHash: "QmAbC456",
        budget: "5000",
        isOpen: true,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        category: "writing"
      },
      {
        id: 3,
        creator: "0x3456789012345678901234567890123456789012",
        title: "VFX Artist for Post-Production",
        description: "Need a VFX artist to create realistic space scenes for an indie sci-fi film.",
        requirements: "Proficiency in After Effects and Blender, portfolio of previous VFX work",
        ipfsHash: "QmDeF789",
        budget: "3500",
        isOpen: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        category: "post-production"
      },
      {
        id: 4,
        creator: "0x4567890123456789012345678901234567890123",
        title: "Sound Designer for Horror Film",
        description: "Looking for a creative sound designer to create atmospheric and scary sound effects for a horror feature.",
        requirements: "Experience in horror genre, own equipment, available for 4 weeks of post-production",
        ipfsHash: "QmGhI012",
        budget: "2800",
        isOpen: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        category: "post-production"
      },
      {
        id: 5,
        creator: "0x5678901234567890123456789012345678901234",
        title: "Production Assistant for Documentary",
        description: "Hiring a PA for a documentary shoot in New York. 3 weeks of work starting next month.",
        requirements: "Previous PA experience, driver's license, knowledge of NYC",
        ipfsHash: "QmJkL345",
        budget: "1500",
        isOpen: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        category: "production"
      }
    ];
  };
  
  const getJobCategory = (title, description) => {
    const text = (title + " " + description).toLowerCase();
    
    if (text.includes("director") || text.includes("cinematographer") || text.includes("camera") || text.includes("production") || text.includes("filming")) {
      return "production";
    } else if (text.includes("writer") || text.includes("script") || text.includes("screenplay")) {
      return "writing";
    } else if (text.includes("edit") || text.includes("vfx") || text.includes("sound") || text.includes("post")) {
      return "post-production";
    } else if (text.includes("market") || text.includes("pr") || text.includes("promotion")) {
      return "marketing";
    } else if (text.includes("act") || text.includes("cast") || text.includes("talent")) {
      return "acting";
    } else {
      return "other";
    }
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
        }
      } catch (error) {
        console.error("Contract call failed, using mock profile:", error);
        // Use mock profile if contract call fails
        setHasProfile(true);
        setProfile({
          name: "John Filmmaker",
          bio: "Independent filmmaker with 5 years of experience directing and producing short films and documentaries.",
          skills: "Directing, Producing, Editing, Screenwriting",
          ipfsHash: "",
          isVerified: true,
          createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
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
        formData.name || profile.name,
        formData.bio || profile.bio,
        formData.skills || profile.skills,
        formData.ipfsHash || profile.ipfsHash
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
        budget: ''
      });
      setActiveTab('jobs');
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
      setSelectedJob(null);
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
  
  const handleApplyForJob = () => {
    // In a real app, this would send an application to the job creator
    alert(`Application sent for "${selectedJob.title}"!`);
    setShowApplicationModal(false);
    setApplicationMessage('');
  };
  
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || job.category === filterCategory;
    
    return matchesSearch && matchesCategory;
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
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Post a Job
                </button>
              )}
            </div>
            
            {activeTab === 'jobs' && (
              <div>
                <div className="mb-8 bg-gray-900 p-6 rounded-lg">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
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
                        <option value="writing">Writing</option>
                        <option value="post-production">Post-Production</option>
                        <option value="marketing">Marketing</option>
                        <option value="acting">Acting</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-white">Open Positions</h2>
                      <span className="text-gray-400">{filteredJobs.length} jobs found</span>
                    </div>
                    
                    {loading ? (
                      <div className="text-center py-12">
                        <p className="text-gray-400">Loading jobs...</p>
                      </div>
                    ) : filteredJobs.length === 0 ? (
                      <div className="text-center py-12 bg-gray-900 rounded-lg">
                        <p className="text-gray-400">No open positions found</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {filteredJobs.map((job) => (
                          <div 
                            key={job.id} 
                            className={`bg-gray-900 rounded-lg p-6 cursor-pointer transition duration-200 ${selectedJob?.id === job.id ? 'border-2 border-teal-500' : ''}`}
                            onClick={() => handleJobSelect(job)}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-xl font-bold text-white">{job.title}</h3>
                                <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                                  job.category === 'production' ? 'bg-blue-900 text-blue-300' :
                                  job.category === 'writing' ? 'bg-purple-900 text-purple-300' :
                                  job.category === 'post-production' ? 'bg-green-900 text-green-300' :
                                  job.category === 'marketing' ? 'bg-yellow-900 text-yellow-300' :
                                  job.category === 'acting' ? 'bg-red-900 text-red-300' :
                                  'bg-gray-700 text-gray-300'
                                }`}>
                                  {job.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                              </div>
                              <span className="text-teal-400 font-medium">{job.budget} FILM</span>
                            </div>
                            
                            <p className="text-gray-400 mb-4 line-clamp-2">{job.description}</p>
                            
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>Posted by: {job.creator.substring(0, 6)}...{job.creator.substring(job.creator.length - 4)}</span>
                              <span>Posted: {job.createdAt.toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    {selectedJob ? (
                      <div className="bg-gray-900 rounded-lg p-6 sticky top-4">
                        <h2 className="text-2xl font-bold text-white mb-4">{selectedJob.title}</h2>
                        <div className="mb-6">
                          <span className="text-teal-400 font-medium text-lg">{selectedJob.budget} FILM</span>
                          <p className="text-gray-500 text-sm">Posted: {selectedJob.createdAt.toLocaleDateString()}</p>
                        </div>
                        
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                          <p className="text-gray-400">{selectedJob.description}</p>
                        </div>
                        
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-white mb-2">Requirements</h3>
                          <p className="text-gray-400">{selectedJob.requirements}</p>
                        </div>
                        
                        {selectedJob.ipfsHash && (
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-2">Additional Information</h3>
                            <a 
                              href={`https://ipfs.io/ipfs/${selectedJob.ipfsHash}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-teal-400 hover:underline"
                            >
                              View on IPFS
                            </a>
                          </div>
                        )}
                        
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-white mb-2">Contact</h3>
                          <p className="text-gray-400">Creator: {selectedJob.creator}</p>
                        </div>
                        
                        {selectedJob.creator.toLowerCase() === account.toLowerCase() ? (
                          <button
                            onClick={() => handleCloseJob(selectedJob.id)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md font-medium"
                          >
                            Close Job
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowApplicationModal(true)}
                            className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 rounded-md font-medium"
                          >
                            Apply for Job
                          </button>
                        )}
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
                      <div key={job.id} className="bg-gray-900 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-white">{job.title}</h3>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                              job.category === 'production' ? 'bg-blue-900 text-blue-300' :
                              job.category === 'writing' ? 'bg-purple-900 text-purple-300' :
                              job.category === 'post-production' ? 'bg-green-900 text-green-300' :
                              job.category === 'marketing' ? 'bg-yellow-900 text-yellow-300' :
                              job.category === 'acting' ? 'bg-red-900 text-red-300' :
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {job.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                          <span className="text-teal-400 font-medium">{job.budget} FILM</span>
                        </div>
                        
                        <p className="text-gray-400 mb-4">{job.description}</p>
                        
                        <div className="flex justify-between text-sm text-gray-500 mb-6">
                          <span>Posted: {job.createdAt.toLocaleDateString()}</span>
                          <span>Status: {job.isOpen ? 'Open' : 'Closed'}</span>
                        </div>
                        
                        {job.isOpen && (
                          <button
                            onClick={() => handleCloseJob(job.id)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md font-medium"
                          >
                            Close Job
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'profile' && (
              <div className="bg-gray-900 rounded-lg p-8">
                {hasProfile ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                      <div className="aspect-w-1 aspect-h-1 bg-gray-800 rounded-lg overflow-hidden mb-4">
                        {profile.ipfsHash ? (
                          <img 
                            src={`https://ipfs.io/ipfs/${profile.ipfsHash}`} 
                            alt={profile.name} 
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gray-800">
                            <span className="text-gray-500 text-4xl">👤</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-1">{profile.name}</h2>
                        {profile.isVerified && (
                          <div className="flex items-center justify-center mb-4">
                            <span className="bg-teal-900 text-teal-300 text-xs px-2 py-1 rounded-full flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                              </svg>
                              Verified
                            </span>
                          </div>
                        )}
                        <p className="text-gray-500 text-sm">Member since {profile.createdAt.toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Bio</h3>
                        <p className="text-gray-400">{profile.bio}</p>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.split(',').map((skill, index) => (
                            <span 
                              key={index} 
                              className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm"
                            >
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-8 flex space-x-4">
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
                ) : (
                  <div>
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
                      onClick={() => setShowApplicationModal(false)}
                      className="flex-1 bg-gray-800 text-gray-400 py-2 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

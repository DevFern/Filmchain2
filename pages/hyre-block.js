import { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { ethers } from 'ethers';
import HyreBlockABI from '../contracts/abis/HyreBlockABI.json';

export default function HyreBlock() {
  const { account, provider, isConnected, connectWallet } = useWeb3();
  const [jobs, setJobs] = useState([]);
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
        createdAt: new Date(i.createdAt.toNumber() * 1000)
      }));
      
      setJobs(items);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setLoading(false);
    }
  };
  
  const checkProfile = async () => {
    try {
      const contract = new ethers.Contract(hyreBlockAddress, HyreBlockABI, provider);
      
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
        formData.title,
        formData.description,
        formData.requirements,
        formData.ipfsHash,
        ethers.utils.parseEther(formData.budget)
      );
      await tx.wait();
      
      alert("Job created successfully!");
      fetchJobs();
      setFormData({
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
  
  const handleJobSelect = (job) => {
    setSelectedJob(job);
  };
  
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <h2 className="text-2xl font-bold text-white mb-6">Open Positions</h2>
                  
                  {loading ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400">Loading jobs...</p>
                    </div>
                  ) : jobs.length === 0 ? (
                    <div className="text-center py-12 bg-gray-900 rounded-lg">
                      <p className="text-gray-400">No open positions found</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {jobs.map((job) => (
                        <div 
                          key={job.id} 
                          className={`bg-gray-900 rounded-lg p-6 cursor-pointer transition duration-200 ${selectedJob?.id === job.id ? 'border-2 border-teal-500' : ''}`}
                          onClick={() => handleJobSelect(job)}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-white">{job.title}</h3>
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
                      
                      {selectedJob.creator.toLowerCase() === account.toLowerCase() && (
                        <button
                          onClick={() => handleCloseJob(selectedJob.id)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md font-medium"
                        >
                          Close Job
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
                        <p className="text-gray-400">{profile.skills}</p>
                      </div>
                      
                      <div className="mt-8">
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
                          Skills
                        </label>
                        <textarea
                          id="skills"
                          name="skills"
                          value={formData.skills}
                          onChange={handleChange}
                          rows="3"
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="List your skills and expertise"
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
                      Skills
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
                      value={formData.title}
                      onChange={handleChange}
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
                      value={formData.description}
                      onChange={handleChange}
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
                      value={formData.requirements}
                      onChange={handleChange}
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
                      value={formData.budget}
                      onChange={handleChange}
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
                      value={formData.ipfsHash}
                      onChange={handleChange}
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
          </div>
        )}
      </div>
    </div>
  );
}

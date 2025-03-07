import { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { ethers } from 'ethers';
import IndieFundABI from '../contracts/abis/IndieFundABI.json';
import FilmTokenABI from '../contracts/abis/FilmTokenABI.json';

export default function IndieFund() {
  const { account, provider, isConnected, connectWallet } = useWeb3();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [fundAmount, setFundAmount] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [tokenAllowance, setTokenAllowance] = useState('0');
  const [activeTab, setActiveTab] = useState('active');
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    ipfsHash: '',
    fundingGoal: '',
    minFundingGoal: '',
    startDate: '',
    endDate: ''
  });
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  
  const indieFundAddress = process.env.NEXT_PUBLIC_INDIE_FUND_ADDRESS;
  const filmTokenAddress = process.env.NEXT_PUBLIC_FILM_TOKEN_ADDRESS;
  
  useEffect(() => {
    if (isConnected && provider) {
      fetchProjects();
      fetchTokenBalance();
      fetchTokenAllowance();
    }
  }, [isConnected, provider]);
  
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(indieFundAddress, IndieFundABI, provider);
      
      const projectCount = await contract.projectCount();
      
      const projectArray = [];
      for (let i = 1; i <= projectCount; i++) {
        const project = await contract.projects(i);
        const milestones = await contract.getProjectMilestones(i);
        const contribution = await contract.getContribution(i, account);
        
        projectArray.push({
          id: project.id.toNumber(),
          creator: project.creator,
          title: project.title,
          description: project.description,
          ipfsHash: project.ipfsHash,
          fundingGoal: ethers.utils.formatEther(project.fundingGoal),
          minFundingGoal: ethers.utils.formatEther(project.minFundingGoal),
          raisedAmount: ethers.utils.formatEther(project.raisedAmount),
          startDate: new Date(project.startDate.toNumber() * 1000),
          endDate: new Date(project.endDate.toNumber() * 1000),
          status: project.status,
          milestones: milestones.map(m => ({
            title: m.title,
            description: m.description,
            amount: m.amount,
            releaseDate: m.releaseDate,
            status: m.status
          })),
          contribution: ethers.utils.formatEther(contribution)
        });
      }
      
      setProjects(projectArray);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching projects:", error);
      // Use mock data if there's an error
      setProjects(getMockProjects());
      setLoading(false);
    }
  };
  
  const fetchTokenBalance = async () => {
    try {
      const tokenContract = new ethers.Contract(filmTokenAddress, FilmTokenABI, provider);
      const balance = await tokenContract.balanceOf(account);
      setTokenBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error("Error fetching token balance:", error);
      setTokenBalance('1000'); // Mock balance
    }
  };
  
  const fetchTokenAllowance = async () => {
    try {
      const tokenContract = new ethers.Contract(filmTokenAddress, FilmTokenABI, provider);
      const allowance = await tokenContract.allowance(account, indieFundAddress);
      setTokenAllowance(ethers.utils.formatEther(allowance));
    } catch (error) {
      console.error("Error fetching token allowance:", error);
      setTokenAllowance('0');
    }
  };
  
  const handleApproveTokens = async () => {
    try {
      const signer = provider.getSigner();
      const tokenContract = new ethers.Contract(filmTokenAddress, FilmTokenABI, signer);
      
      const tx = await tokenContract.approve(
        indieFundAddress, 
        ethers.utils.parseEther('10000') // Approve a large amount
      );
      await tx.wait();
      
      alert("Tokens approved successfully!");
      fetchTokenAllowance();
    } catch (error) {
      console.error("Error approving tokens:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleFundProject = async () => {
    if (!selectedProject || !fundAmount) return;
    
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(indieFundAddress, IndieFundABI, signer);
      
      const tx = await contract.fundProject(
        selectedProject.id,
        ethers.utils.parseEther(fundAmount)
      );
      await tx.wait();
      
      alert("Project funded successfully!");
      setFundAmount('');
      fetchProjects();
      fetchTokenBalance();
    } catch (error) {
      console.error("Error funding project:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      connectWallet();
      return;
    }
    
    // Validate form
    if (!newProject.title || !newProject.description || !newProject.fundingGoal || 
        !newProject.minFundingGoal || !newProject.startDate || !newProject.endDate) {
      alert('Please fill in all required fields');
      return;
    }
    
    setIsCreatingProject(true);
    
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(indieFundAddress, IndieFundABI, signer);
      
      const startTimestamp = Math.floor(new Date(newProject.startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(newProject.endDate).getTime() / 1000);
      
      const tx = await contract.createProject(
        newProject.title,
        newProject.description,
        newProject.ipfsHash || '',
        ethers.utils.parseEther(newProject.fundingGoal),
        ethers.utils.parseEther(newProject.minFundingGoal),
        startTimestamp,
        endTimestamp
      );
      
      await tx.wait();
      
      alert('Project created successfully! It will be reviewed by the platform administrators.');
      
      // Reset form and refresh projects
      setNewProject({
        title: '',
        description: '',
        ipfsHash: '',
        fundingGoal: '',
        minFundingGoal: '',
        startDate: '',
        endDate: '',
      });
      setActiveTab('active');
      fetchProjects();
    } catch (error) {
      console.error("Error creating project:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsCreatingProject(false);
    }
  };
  
  const handleRefund = async (projectId) => {
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(indieFundAddress, IndieFundABI, signer);
      
      const tx = await contract.refundContribution(projectId);
      await tx.wait();
      
      alert("Refund processed successfully!");
      fetchProjects();
      fetchTokenBalance();
    } catch (error) {
      console.error("Error processing refund:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
  };
  
  const getStatusText = (status) => {
    const statusMap = {
      0: 'Pending',
      1: 'Active',
      2: 'Funded',
      3: 'Completed',
      4: 'Cancelled'
    };
    return statusMap[status] || 'Unknown';
  };
  
  const getMilestoneStatusText = (status) => {
    const statusMap = {
      0: 'Pending',
      1: 'Approved',
      2: 'Rejected',
      3: 'Released'
    };
    return statusMap[status] || 'Unknown';
  };
  
  const getMockProjects = () => {
    return [
      {
        id: 1,
        creator: "0x1234567890123456789012345678901234567890",
        title: "The Last Lighthouse",
        description: "A psychological thriller about a lighthouse keeper who discovers a mysterious artifact washed ashore that begins to alter his reality.",
        ipfsHash: "QmXyZ123",
        fundingGoal: "50000",
        minFundingGoal: "30000",
        raisedAmount: "32500",
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 1, // Active
        milestones: [
          {
            title: "Pre-production",
            description: "Script finalization, casting, location scouting",
            amount: ethers.utils.parseEther("10000"),
            releaseDate: Math.floor(Date.now()/1000) - 15 * 24 * 60 * 60,
            status: 3 // Released
          },
          {
            title: "Principal photography",
            description: "Main filming phase",
            amount: ethers.utils.parseEther("25000"),
            releaseDate: Math.floor(Date.now()/1000) + 45 * 24 * 60 * 60,
            status: 1 // Approved
          },
          {
            title: "Post-production",
            description: "Editing, sound design, visual effects",
            amount: ethers.utils.parseEther("15000"),
            releaseDate: Math.floor(Date.now()/1000) + 90 * 24 * 60 * 60,
            status: 0 // Pending
          }
        ],
        contribution: "100"
      },
      {
        id: 2,
        creator: "0x2345678901234567890123456789012345678901",
        title: "Echoes of Tomorrow",
        description: "A sci-fi drama exploring the ethical implications of memory transfer technology in a near-future society.",
        ipfsHash: "QmAbC456",
        fundingGoal: "75000",
        minFundingGoal: "50000",
        raisedAmount: "45000",
        startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        status: 1, // Active
        milestones: [
          {
            title: "Script development",
            description: "Finalize screenplay and storyboards",
            amount: ethers.utils.parseEther("15000"),
            releaseDate: Math.floor(Date.now()/1000) - 15 * 24 * 60 * 60,
            status: 3 // Released
          },
          {
            title: "Production",
            description: "Filming and production phase",
            amount: ethers.utils.parseEther("40000"),
            releaseDate: Math.floor(Date.now()/1000) + 60 * 24 * 60 * 60,
            status: 0 // Pending
          },
          {
            title: "Post-production",
            description: "Editing, VFX, and sound design",
            amount: ethers.utils.parseEther("20000"),
            releaseDate: Math.floor(Date.now()/1000) + 120 * 24 * 60 * 60,
            status: 0 // Pending
          }
        ],
        contribution: "0"
      },
      {
        id: 3,
        creator: "0x3456789012345678901234567890123456789012",
        title: "Whispers in the Dark",
        description: "A horror anthology exploring urban legends from different cultures around the world.",
        ipfsHash: "QmDeF789",
        fundingGoal: "40000",
        minFundingGoal: "25000",
        raisedAmount: "42000",
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        status: 2, // Funded
        milestones: [
          {
            title: "Pre-production",
            description: "Script development and casting",
            amount: ethers.utils.parseEther("10000"),
            releaseDate: Math.floor(Date.now()/1000) - 30 * 24 * 60 * 60,
            status: 3 // Released
          },
          {
            title: "Production",
            description: "Filming of all anthology segments",
            amount: ethers.utils.parseEther("20000"),
            releaseDate: Math.floor(Date.now()/1000) + 15 * 24 * 60 * 60,
            status: 1 // Approved
          },
          {
            title: "Post-production",
            description: "Editing and special effects",
            amount: ethers.utils.parseEther("10000"),
            releaseDate: Math.floor(Date.now()/1000) + 60 * 24 * 60 * 60,
            status: 0 // Pending
          }
        ],
        contribution: "500"
      }
    ];
  };
  
  const filteredProjects = projects.filter(project => {
    if (activeTab === 'active') {
      return project.status === 1; // Active
    } else if (activeTab === 'funded') {
      return project.status === 2 || project.status === 3; // Funded or Completed
    } else if (activeTab === 'contributed') {
      return parseFloat(project.contribution) > 0;
    }
    return true;
  });
  
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">IndieFund</h1>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Support indie filmmakers to raise funds necessary for the realization of their projects. Browse projects, contribute with FILM tokens, and be part of the next big indie film success.
          </p>
        </div>
        
        {!isConnected ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-6">Connect your wallet to view and fund projects</p>
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
                onClick={() => setActiveTab('active')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'active'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Active Projects
              </button>
              <button
                onClick={() => setActiveTab('funded')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'funded'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Funded Projects
              </button>
              <button
                onClick={() => setActiveTab('contributed')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'contributed'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                My Contributions
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'create'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Create Project
              </button>
            </div>
            
            {activeTab === 'create' ? (
              <div className="bg-gray-900 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Create a New Film Project</h2>
                
                <form onSubmit={handleCreateProject}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Project Title*
                      </label>
                      <input
                        type="text"
                        value={newProject.title}
                        onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        IPFS Hash (optional)
                      </label>
                      <input
                        type="text"
                        value={newProject.ipfsHash}
                        onChange={(e) => setNewProject({...newProject, ipfsHash: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Project Description*
                      </label>
                      <textarea
                        value={newProject.description}
                        onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                        rows={4}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Funding Goal (FILM)*
                      </label>
                      <input
                        type="number"
                        value={newProject.fundingGoal}
                        onChange={(e) => setNewProject({...newProject, fundingGoal: e.target.value})}
                        min="0"
                        step="0.01"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Minimum Funding Goal (FILM)*
                      </label>
                      <input
                        type="number"
                        value={newProject.minFundingGoal}
                        onChange={(e) => setNewProject({...newProject, minFundingGoal: e.target.value})}
                        min="0"
                        step="0.01"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Start Date*
                      </label>
                      <input
                        type="date"
                        value={newProject.startDate}
                        onChange={(e) => setNewProject({...newProject, startDate: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        End Date*
                      </label>
                      <input
                        type="date"
                        value={newProject.endDate}
                        onChange={(e) => setNewProject({...newProject, endDate: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isCreatingProject}
                      className={`px-6 py-3 rounded-md ${
                        isCreatingProject
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                      }`}
                    >
                      {isCreatingProject ? 'Creating Project...' : 'Create Project'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      {activeTab === 'active' ? 'Active Projects' : 
                       activeTab === 'funded' ? 'Funded Projects' : 
                       'My Contributions'}
                    </h2>
                    <div className="text-gray-400">
                      <span className="mr-2">Balance:</span>
                      <span className="text-teal-400">{parseFloat(tokenBalance).toFixed(2)} FILM</span>
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400">Loading projects...</p>
                    </div>
                  ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-12 bg-gray-900 rounded-lg">
                      <p className="text-gray-400">No projects found</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredProjects.map((project) => (
                        <div 
                          key={project.id} 
                          className={`bg-gray-900 rounded-lg p-6 cursor-pointer transition duration-200 ${selectedProject?.id === project.id ? 'border-2 border-teal-500' : ''}`}
                          onClick={() => handleProjectSelect(project)}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-white">{project.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              project.status === 1 ? 'bg-blue-900 text-blue-300' : 
                              project.status === 2 ? 'bg-green-900 text-green-300' : 
                              project.status === 3 ? 'bg-purple-900 text-purple-300' : 
                              project.status === 4 ? 'bg-red-900 text-red-300' : 
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {getStatusText(project.status)}
                            </span>
                          </div>
                          
                          <p className="text-gray-400 mb-4 line-clamp-2">{project.description}</p>
                          
                          <div className="flex justify-between text-sm text-gray-500 mb-4">
                            <span>By: {project.creator.substring(0, 6)}...{project.creator.substring(project.creator.length - 4)}</span>
                            <span>Ends: {project.endDate.toLocaleDateString()}</span>
                          </div>
                          
                          <div className="mb-4">
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-400">Raised: {parseFloat(project.raisedAmount).toFixed(2)} FILM</span>
                              <span className="text-gray-400">Goal: {parseFloat(project.fundingGoal).toFixed(2)} FILM</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                              <div 
                                className="bg-teal-500 h-2.5 rounded-full" 
                                style={{ width: `${Math.min(parseFloat(project.raisedAmount) / parseFloat(project.fundingGoal) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-500 text-right mt-1">
                              {(parseFloat(project.raisedAmount) / parseFloat(project.fundingGoal) * 100).toFixed(2)}%
                            </p>
                          </div>
                          
                          {parseFloat(project.contribution) > 0 && (
                            <div className="mb-4 p-2 bg-gray-800 rounded-md">
                              <p className="text-sm text-gray-400">
                                Your contribution: <span className="text-teal-400">{parseFloat(project.contribution).toFixed(2)} FILM</span>
                              </p>
                            </div>
                          )}
                          
                          {project.status === 1 && new Date() <= project.endDate && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProjectSelect(project);
                                document.getElementById('fund-form')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-2 rounded-md"
                            >
                              Fund This Project
                            </button>
                          )}
                          
                          {(project.status === 4 || (project.status === 1 && new Date() > project.endDate && parseFloat(project.raisedAmount) < parseFloat(project.minFundingGoal))) && 
                           parseFloat(project.contribution) > 0 && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRefund(project.id);
                              }}
                              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md mt-2"
                            >
                              Request Refund
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  {selectedProject ? (
                    <div className="bg-gray-900 rounded-lg p-6 sticky top-4">
                      <h2 className="text-2xl font-bold text-white mb-4">{selectedProject.title}</h2>
                      <p className="text-gray-400 mb-6">{selectedProject.description}</p>
                      
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Funding Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Funding Goal</p>
                            <p className="text-white">{parseFloat(selectedProject.fundingGoal).toFixed(2)} FILM</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Minimum Goal</p>
                            <p className="text-white">{parseFloat(selectedProject.minFundingGoal).toFixed(2)} FILM</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Raised Amount</p>
                            <p className="text-white">{parseFloat(selectedProject.raisedAmount).toFixed(2)} FILM</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Your Contribution</p>
                            <p className="text-white">{parseFloat(selectedProject.contribution).toFixed(2)} FILM</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Timeline</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Start Date</p>
                           <p className="text-white">{selectedProject.startDate.toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">End Date</p>
                            <p className="text-white">{selectedProject.endDate.toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      {selectedProject.milestones && selectedProject.milestones.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-white mb-2">Milestones</h3>
                          <div className="space-y-4">
                            {selectedProject.milestones.map((milestone, index) => (
                              <div key={index} className="bg-gray-800 p-3 rounded-md">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="text-white font-medium">{milestone.title}</h4>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    milestone.status === 0 ? 'bg-gray-700 text-gray-300' : 
                                    milestone.status === 1 ? 'bg-blue-900 text-blue-300' : 
                                    milestone.status === 2 ? 'bg-red-900 text-red-300' : 
                                    'bg-green-900 text-green-300'
                                  }`}>
                                    {getMilestoneStatusText(milestone.status)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-400 mb-2">{milestone.description}</p>
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>Amount: {ethers.utils.formatEther(milestone.amount)} FILM</span>
                                  <span>Release: {new Date(milestone.releaseDate * 1000).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedProject.status === 1 && new Date() <= selectedProject.endDate && (
                        <div id="fund-form" className="mt-6">
                          <h3 className="text-lg font-semibold text-white mb-4">Fund This Project</h3>
                          
                          {parseFloat(tokenAllowance) <= 0 ? (
                            <div>
                              <p className="text-gray-400 mb-4">
                                You need to approve FILM tokens before contributing to this project.
                              </p>
                              <button
                                onClick={handleApproveTokens}
                                className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-2 rounded-md"
                              >
                                Approve FILM Tokens
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="mb-4">
                                <label htmlFor="fundAmount" className="block text-sm font-medium text-gray-400 mb-2">
                                  Amount (FILM)
                                </label>
                                <input
                                  type="number"
                                  id="fundAmount"
                                  value={fundAmount}
                                  onChange={(e) => setFundAmount(e.target.value)}
                                  min="0"
                                  step="0.01"
                                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  placeholder="0.00"
                                />
                              </div>
                              
                              <button
                                onClick={handleFundProject}
                                disabled={!fundAmount || parseFloat(fundAmount) <= 0 || parseFloat(fundAmount) > parseFloat(tokenBalance)}
                                className={`w-full py-3 rounded-md font-medium ${
                                  !fundAmount || parseFloat(fundAmount) <= 0 || parseFloat(fundAmount) > parseFloat(tokenBalance)
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                                }`}
                              >
                                Fund Project
                              </button>
                              
                              {parseFloat(fundAmount) > parseFloat(tokenBalance) && (
                                <p className="text-red-500 text-sm mt-2">
                                  Insufficient balance. You have {parseFloat(tokenBalance).toFixed(2)} FILM.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-900 rounded-lg p-6 sticky top-4">
                      <div className="text-center py-8">
                        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <h3 className="text-lg font-medium text-white mb-2">Select a Project</h3>
                        <p className="text-gray-400">
                          Click on a project to view details and fund it with FILM tokens.
                        </p>
                      </div>
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

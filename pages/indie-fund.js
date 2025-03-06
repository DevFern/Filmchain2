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
          milestones: milestones,
          contribution: ethers.utils.formatEther(contribution)
        });
      }
      
      setProjects(projectArray);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching projects:", error);
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
    }
  };
  
  const fetchTokenAllowance = async () => {
    try {
      const tokenContract = new ethers.Contract(filmTokenAddress, FilmTokenABI, provider);
      const allowance = await tokenContract.allowance(account, indieFundAddress);
      setTokenAllowance(ethers.utils.formatEther(allowance));
    } catch (error) {
      console.error("Error fetching token allowance:", error);
    }
  };
  
  const handleApproveTokens = async () => {
    try {
      const signer = provider.getSigner();
      const tokenContract = new ethers.Contract(filmTokenAddress, FilmTokenABI, signer);
      
      const tx = await tokenContract.approve(
        indieFundAddress, 
        ethers.utils.parseEther('1000000') // Approve a large amount
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Active Projects</h2>
                <div className="text-gray-400">
                  <span className="mr-2">Balance:</span>
                  <span className="text-teal-400">{parseFloat(tokenBalance).toFixed(2)} FILM</span>
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12 bg-gray-900 rounded-lg">
                  <p className="text-gray-400">No projects found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {projects.map((project) => (
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
                            style={{ width: `${(parseFloat(project.raisedAmount) / parseFloat(project.fundingGoal) * 100)}%` }}
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
                            document.getElementById('fund-form').scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-2 rounded-md"
                        >
                          Fund This Project
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              {selectedProject ? (
                <div className="bg-gray-900 rounded-lg p-6">
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
                        <p className="text-sm text-gray-500">En<div></p>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="text-white">{selectedProject.endDate.toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Milestones</h3>
                    {selectedProject.milestones.length === 0 ? (
                      <p className="text-gray-400">No milestones defined yet</p>
                    ) : (
                      <div className="space-y-4">
                        {selectedProject.milestones.map((milestone, index) => (
                          <div key={index} className="bg-gray-800 p-4 rounded-md">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-white font-medium">{milestone.title}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                milestone.status === 1 ? 'bg-blue-900 text-blue-300' : 
                                milestone.status === 2 ? 'bg-red-900 text-red-300' : 
                                milestone.status === 3 ? 'bg-green-900 text-green-300' : 
                                'bg-gray-700 text-gray-300'
                              }`}>
                                {getMilestoneStatusText(milestone.status)}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm mb-2">{milestone.description}</p>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Amount: {ethers.utils.formatEther(milestone.amount)} FILM</span>
                              <span className="text-gray-500">Release: {new Date(milestone.releaseDate.toNumber() * 1000).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {selectedProject.ipfsHash && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Additional Information</h3>
                      <a 
                        href={`https://ipfs.io/ipfs/${selectedProject.ipfsHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:underline"
                      >
                        View on IPFS
                      </a>
                    </div>
                  )}
                  
                  {selectedProject.status === 1 && new Date() <= selectedProject.endDate && (
                    <div id="fund-form" className="mt-8 p-4 bg-gray-800 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-4">Fund This Project</h3>
                      
                      <div className="mb-4">
                        <label htmlFor="fundAmount" className="block text-sm font-medium text-gray-400 mb-2">
                          Amount (FILM)
                        </label>
                        <input
                          type="number"
                          id="fundAmount"
                          value={fundAmount}
                          onChange={(e) => setFundAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      
                      {parseFloat(tokenAllowance) < (fundAmount ? parseFloat(fundAmount) : 0) ? (
                        <button
                          onClick={handleApproveTokens}
                          className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-2 rounded-md"
                        >
                          Approve FILM Tokens
                        </button>
                      ) : (
                        <button
                          onClick={handleFundProject}
                          disabled={!fundAmount || parseFloat(fundAmount) <= 0 || parseFloat(fundAmount) > parseFloat(tokenBalance)}
                          className={`w-full py-2 rounded-md ${
                            !fundAmount || parseFloat(fundAmount) <= 0 || parseFloat(fundAmount) > parseFloat(tokenBalance)
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                          }`}
                        >
                          Fund Project
                        </button>
                      )}
                      
                      {parseFloat(fundAmount) > parseFloat(tokenBalance) && (
                        <p className="text-red-500 text-sm mt-2">
                          Insufficient balance. You have {parseFloat(tokenBalance).toFixed(2)} FILM.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-900 rounded-lg p-6 text-center">
                  <p className="text-gray-400">Select a project to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { ethers } from 'ethers';
import CommunityVoiceABI from '../contracts/abis/CommunityVoiceABI.json';
import FilmTokenABI from '../contracts/abis/FilmTokenABI.json';

export default function CommunityVoice() {
  const { account, provider, isConnected, connectWallet } = useWeb3();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingPower, setVotingPower] = useState('0');
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    ipfsHash: '',
    startDate: '',
    endDate: ''
  });
  
  const communityVoiceAddress = process.env.NEXT_PUBLIC_COMMUNITY_VOICE_ADDRESS;
  const filmTokenAddress = process.env.NEXT_PUBLIC_FILM_TOKEN_ADDRESS;
  
  useEffect(() => {
    if (isConnected && provider) {
      fetchProposals();
      fetchVotingPower();
    }
  }, [isConnected, provider]);
  
  const fetchProposals = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(communityVoiceAddress, CommunityVoiceABI, provider);
      const proposalCount = await contract.proposalCount();
      
      const proposalArray = [];
      for (let i = 1; i <= proposalCount; i++) {
        const details = await contract.getProposalDetails(i);
        const hasVoted = await contract.hasVoted(i, account);
        
        proposalArray.push({
          id: i,
          title: details.title,
          description: details.description,
          ipfsHash: details.ipfsHash,
          startTime: new Date(details.startTime.toNumber() * 1000),
          endTime: new Date(details.endTime.toNumber() * 1000),
          yesVotes: ethers.utils.formatEther(details.yesVotes),
          noVotes: ethers.utils.formatEther(details.noVotes),
          executed: details.executed,
          hasVoted: hasVoted,
          status: getProposalStatus(
            new Date(details.startTime.toNumber() * 1000),
            new Date(details.endTime.toNumber() * 1000),
            details.executed
          )
        });
      }
      
      setProposals(proposalArray);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      // Use mock data if there's an error
      setProposals(getMockProposals());
      setLoading(false);
    }
  };
  
  const fetchVotingPower = async () => {
    try {
      const tokenContract = new ethers.Contract(filmTokenAddress, FilmTokenABI, provider);
      const balance = await tokenContract.balanceOf(account);
      setVotingPower(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error("Error fetching voting power:", error);
      setVotingPower('1000'); // Mock voting power
    }
  };
  
  const handleVote = async (proposalId, support) => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(communityVoiceAddress, CommunityVoiceABI, signer);
      
      const tx = await contract.vote(proposalId, support);
      await tx.wait();
      
      alert(`Vote submitted successfully!`);
      fetchProposals();
    } catch (error) {
      console.error("Error voting:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleCreateProposal = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      connectWallet();
      return;
    }
    
    // Check if user is admin (for demo purposes)
    const isAdmin = account === "0x1234567890123456789012345678901234567890"; // Replace with actual admin check
    
    if (!isAdmin) {
      alert("Only administrators can create proposals");
      return;
    }
    
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(communityVoiceAddress, CommunityVoiceABI, signer);
      
      const startTimestamp = Math.floor(new Date(newProposal.startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(newProposal.endDate).getTime() / 1000);
      
      const tx = await contract.createProposal(
        newProposal.title,
        newProposal.description,
        newProposal.ipfsHash || '',
        startTimestamp,
        endTimestamp
      );
      
      await tx.wait();
      
      alert('Proposal created successfully!');
      setShowCreateModal(false);
      setNewProposal({
        title: '',
        description: '',
        ipfsHash: '',
        startDate: '',
        endDate: ''
      });
      fetchProposals();
    } catch (error) {
      console.error("Error creating proposal:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleProposalSelect = (proposal) => {
    setSelectedProposal(proposal);
  };
  
  const getProposalStatus = (startTime, endTime, executed) => {
    const now = new Date();
    
    if (executed) {
      return 'executed';
    } else if (now > endTime) {
      return 'ended';
    } else if (now < startTime) {
      return 'pending';
    } else {
      return 'active';
    }
  };
  
  const getMockProposals = () => {
    return [
      {
        id: 1,
        title: "Fund Indie Horror Film Festival",
        description: "Allocate 50,000 FILM tokens to sponsor an indie horror film festival that will showcase emerging talent in the genre.",
        ipfsHash: "QmXyZ123",
        startTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        yesVotes: "75000",
        noVotes: "25000",
        executed: false,
        hasVoted: false,
        status: 'active'
      },
      {
        id: 2,
        title: "Implement Staking Rewards for FILM Token",
        description: "Implement a staking mechanism that rewards FILM token holders with a 5% APY for locking their tokens for at least 3 months.",
        ipfsHash: "QmAbC456",
        startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        yesVotes: "120000",
        noVotes: "30000",
        executed: true,
        hasVoted: true,
        status: 'executed'
      },
      {
        id: 3,
        title: "Partner with Major Streaming Platform",
        description: "Approve negotiations with a major streaming platform to distribute FILM-funded projects, potentially increasing exposure and revenue.",
        ipfsHash: "QmDeF789",
        startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        yesVotes: "0",
        noVotes: "0",
        executed: false,
        hasVoted: false,
        status: 'pending'
      }
    ];
  };
  
  const filteredProposals = proposals.filter(proposal => {
    if (activeTab === 'active') {
      return proposal.status === 'active';
    } else if (activeTab === 'pending') {
      return proposal.status === 'pending';
    } else if (activeTab === 'ended') {
      return proposal.status === 'ended' || proposal.status === 'executed';
    }
    return true;
  });
  
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Community Voice</h1>
          <p className="text-gray-400 max-w-3xl mx-auto">
            FILM Chain enables community involvement in the development of motion pictures. Vote on proposals using your FILM tokens and help shape the future of indie filmmaking.
          </p>
        </div>
        
        {!isConnected ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-6">Connect your wallet to view and vote on proposals</p>
            <button 
              onClick={connectWallet}
              className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-3 rounded-md text-lg font-medium"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap justify-between items-center mb-8">
              <div className="flex flex-wrap gap-4 mb-4 md:mb-0">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === 'active'
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === 'pending'
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setActiveTab('ended')}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === 'ended'
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Ended
                </button>
              </div>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-md"
              >
                Create Proposal
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {activeTab === 'active' ? 'Active Proposals' : 
                     activeTab === 'pending' ? 'Pending Proposals' : 
                     'Ended Proposals'}
                  </h2>
                  <div className="text-gray-400">
                    <span className="mr-2">Voting Power:</span>
                    <span className="text-teal-400">{parseFloat(votingPower).toFixed(2)} FILM</span>
                  </div>
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Loading proposals...</p>
                  </div>
                ) : filteredProposals.length === 0 ? (
                  <div className="text-center py-12 bg-gray-900 rounded-lg">
                    <p className="text-gray-400">No proposals found</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredProposals.map((proposal) => (
                      <div 
                        key={proposal.id} 
                        className={`bg-gray-900 rounded-lg p-6 cursor-pointer transition duration-200 ${selectedProposal?.id === proposal.id ? 'border-2 border-teal-500' : ''}`}
                        onClick={() => handleProposalSelect(proposal)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-white">{proposal.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            proposal.status === 'active' ? 'bg-blue-900 text-blue-300' : 
                            proposal.status === 'pending' ? 'bg-yellow-900 text-yellow-300' : 
                            proposal.status === 'executed' ? 'bg-green-900 text-green-300' : 
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                          </span>
                        </div>
                        
                        <p className="text-gray-400 mb-4 line-clamp-2">{proposal.description}</p>
                        
                        <div className="flex justify-between text-sm text-gray-500 mb-4">
                          <span>Start: {proposal.startTime.toLocaleDateString()}</span>
                          <span>End: {proposal.endTime.toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex justify-between mb-2">
                          <span className="text-green-500">Yes: {parseFloat(proposal.yesVotes).toLocaleString()} FILM</span>
                          <span className="text-red-500">No: {parseFloat(proposal.noVotes).toLocaleString()} FILM</span>
                        </div>
                        
                        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
                          <div 
                            className="bg-teal-500 h-2.5 rounded-full" 
                            style={{ width: `${(parseFloat(proposal.yesVotes) / (parseFloat(proposal.yesVotes) + parseFloat(proposal.noVotes)) * 100) || 0}%` }}
                          ></div>
                        </div>
                        
                        {proposal.hasVoted ? (
                          <div className="text-center py-2 bg-gray-800 rounded-md">
                            <span className="text-gray-400">You have already voted</span>
                          </div>
                        ) : proposal.status !== 'active' ? (
                          <div className="text-center py-2 bg-gray-800 rounded-md">
                            <span className="text-gray-400">
                              {proposal.status === 'pending' ? 'Voting not started' : 'Voting ended'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex space-x-4">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVote(proposal.id, true);
                              }}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md"
                            >
                              Vote Yes
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVote(proposal.id, false);
                              }}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md"
                            >
                              Vote No
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                {selectedProposal ? (
                  <div className="bg-gray-900 rounded-lg p-6 sticky top-4">
                    <h2 className="text-2xl font-bold text-white mb-4">{selectedProposal.title}</h2>
                    <p className="text-gray-400 mb-6">{selectedProposal.description}</p>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Voting Period</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Start Date</p>
                          <p className="text-white">{selectedProposal.startTime.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">End Date</p>
                          <p className="text-white">{selectedProposal.endTime.toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Current Results</h3>
                      <div className="flex justify-between mb-2">
                        <span className="text-green-500">Yes: {parseFloat(selectedProposal.yesVotes).toLocaleString()} FILM</span>
                        <span className="text-red-500">No: {parseFloat(selectedProposal.noVotes).toLocaleString()} FILM</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                        <div 
                          className="bg-teal-500 h-2.5 rounded-full" 
                          style={{ width: `${(parseFloat(selectedProposal.yesVotes) / (parseFloat(selectedProposal.yesVotes) + parseFloat(selectedProposal.noVotes)) * 100) || 0}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-500 text-right">
                        {((parseFloat(selectedProposal.yesVotes) / (parseFloat(selectedProposal.yesVotes) + parseFloat(selectedProposal.noVotes)) * 100) || 0).toFixed(2)}% Yes
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Status</h3>
                      <p className="text-gray-400">
                        {selectedProposal.executed ? 'Executed' : 
                         selectedProposal.status === 'ended' ? 'Voting ended' : 
                         selectedProposal.status === 'pending' ? 'Voting not started' : 'Voting in progress'}
                      </p>
                    </div>
                    
                    {selectedProposal.ipfsHash && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Additional Information</h3>
                        <a 
                          href={`https://ipfs.io/ipfs/${selectedProposal.ipfsHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-teal-400 hover:underline"
                        >
                          View on IPFS
                        </a>
                      </div>
                    )}
                    
                    {selectedProposal.status === 'active' && !selectedProposal.hasVoted && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Cast Your Vote</h3>
                        <div className="flex space-x-4">
                          <button 
                            onClick={() => handleVote(selectedProposal.id, true)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-md font-medium"
                          >
                            Vote Yes
                          </button>
                          <button 
                            onClick={() => handleVote(selectedProposal.id, false)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-md font-medium"
                          >
                            Vote No
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-lg p-6 sticky top-4">
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-lg font-medium text-white mb-2">Select a Proposal</h3>
                      <p className="text-gray-400">
                        Click on a proposal to view details and cast your vote.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Create Proposal Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Create New Proposal</h2>
                    <button 
                      onClick={() => setShowCreateModal(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <form onSubmit={handleCreateProposal}>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Proposal Title*
                        </label>
                        <input
                          type="text"
                          value={newProposal.title}
                          onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Description*
                        </label>
                        <textarea
                          value={newProposal.description}
                          onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
                          rows={4}
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
                          value={newProposal.ipfsHash}
                          onChange={(e) => setNewProposal({...newProposal, ipfsHash: e.target.value})}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Start Date*
                          </label>
                          <input
                            type="date"
                            value={newProposal.startDate}
                            onChange={(e) => setNewProposal({...newProposal, startDate: e.target.value})}
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
                            value={newProposal.endDate}
                            onChange={(e) => setNewProposal({...newProposal, endDate: e.target.value})}
                            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-8">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="bg-gray-700 text-gray-300 px-4 py-2 rounded-md mr-4"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded-md"
                      >
                        Create Proposal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

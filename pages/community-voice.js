import { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { ethers } from 'ethers';
import CommunityVoiceABI from '../contracts/abis/CommunityVoiceABI.json';

export default function CommunityVoice() {
  const { account, provider, isConnected, connectWallet } = useWeb3();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    voteOption: true
  });
  const [selectedProposal, setSelectedProposal] = useState(null);
  
  const contractAddress = process.env.NEXT_PUBLIC_COMMUNITY_VOICE_ADDRESS;
  
  useEffect(() => {
    if (isConnected && provider) {
      fetchProposals();
    }
  }, [isConnected, provider]);
  
  const fetchProposals = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(contractAddress, CommunityVoiceABI, provider);
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
          hasVoted: hasVoted
        });
      }
      
      setProposals(proposalArray);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      setLoading(false);
    }
  };
  
  const handleVote = async (proposalId, support) => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CommunityVoiceABI, signer);
      
      const tx = await contract.vote(proposalId, support);
      await tx.wait();
      
      alert(`Vote submitted successfully!`);
      fetchProposals();
    } catch (error) {
      console.error("Error voting:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleProposalSelect = (proposal) => {
    setSelectedProposal(proposal);
  };
  
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-white mb-6">Active Proposals</h2>
              
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Loading proposals...</p>
                </div>
              ) : proposals.length === 0 ? (
                <div className="text-center py-12 bg-gray-900 rounded-lg">
                  <p className="text-gray-400">No proposals found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {proposals.map((proposal) => (
                    <div 
                      key={proposal.id} 
                      className={`bg-gray-900 rounded-lg p-6 cursor-pointer transition duration-200 ${selectedProposal?.id === proposal.id ? 'border-2 border-teal-500' : ''}`}
                      onClick={() => handleProposalSelect(proposal)}
                    >
                      <h3 className="text-xl font-bold text-white mb-2">{proposal.title}</h3>
                      <p className="text-gray-400 mb-4 line-clamp-2">{proposal.description}</p>
                      
                      <div className="flex justify-between text-sm text-gray-500 mb-4">
                        <span>Start: {proposal.startTime.toLocaleDateString()}</span>
                        <span>End: {proposal.endTime.toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex justify-between mb-2">
                        <span className="text-green-500">Yes: {proposal.yesVotes} FILM</span>
                        <span className="text-red-500">No: {proposal.noVotes} FILM</span>
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
                      ) : new Date() > proposal.endTime ? (
                        <div className="text-center py-2 bg-gray-800 rounded-md">
                          <span className="text-gray-400">Voting ended</span>
                        </div>
                      ) : new Date() < proposal.startTime ? (
                        <div className="text-center py-2 bg-gray-800 rounded-md">
                          <span className="text-gray-400">Voting not started</span>
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
              <h2 className="text-2xl font-bold text-white mb-6">Proposal Details</h2>
              
              {selectedProposal ? (
                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4">{selectedProposal.title}</h3>
                  <p className="text-gray-400 mb-6">{selectedProposal.description}</p>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-2">Voting Period</h4>
                    <div className="flex justify-between text-gray-400">
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p>{selectedProposal.startTime.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p>{selectedProposal.endTime.toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-2">Current Results</h4>
                    <div className="flex justify-between mb-2">
                      <span className="text-green-500">Yes: {selectedProposal.yesVotes} FILM</span>
                      <span className="text-red-500">No: {selectedProposal.noVotes} FILM</span>
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
                    <h4 className="text-lg font-semibold text-white mb-2">Status</h4>
                    <p className="text-gray-400">
                      {selectedProposal.executed ? 'Executed' : 
                       new Date() > selectedProposal.endTime ? 'Voting ended' : 
                       new Date() < selectedProposal.startTime ? 'Voting not started' : 'Voting in progress'}
                    </p>
                  </div>
                  
                  {selectedProposal.ipfsHash && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Additional Information</h4>
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
                </div>
              ) : (
                <div className="bg-gray-900 rounded-lg p-6 text-center">
                  <p className="text-gray-400">Select a proposal to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { ethers } from 'ethers';
import CommunityVoiceABI from '../contracts/abis/CommunityVoiceABI.json';
import FilmTokenABI from '../contracts/abis/FilmTokenABI.json';

export default function Governance() {
  const { account, provider, isConnected, connectWallet } = useWeb3();
  const [proposals, setProposals] = useState([]);
  const [userVotingPower, setUserVotingPower] = useState(0);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [voteType, setVoteType] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  
  const communityVoiceAddress = process.env.NEXT_PUBLIC_COMMUNITY_VOICE_ADDRESS;
  const filmTokenAddress = process.env.NEXT_PUBLIC_FILM_TOKEN_ADDRESS;
  
  useEffect(() => {
    if (isConnected && provider) {
      fetchProposals();
      fetchVotingPower();
    } else {
      // Mock data for demonstration when not connected
      setProposals(getMockProposals());
    }
  }, [isConnected, provider]);
  
  const getMockProposals = () => {
    return [
      {
        id: 1,
        title: "Increase funding allocation for documentary films",
        description: "This proposal aims to increase the funding allocation for documentary films from 10% to 15% of the total IndieFund budget to support more non-fiction storytelling.",
        ipfsHash: "QmT8JfnZ9ks2VXr5JKL9vJsVBQYDwMNECrx3n1W8VXR5JK",
        startTime: Math.floor(Date.now()/1000) - 3 * 24 * 60 * 60,
        endTime: Math.floor(Date.now()/1000) + 4 * 24 * 60 * 60,
        yesVotes: ethers.utils.parseEther("125000"),
        noVotes: ethers.utils.parseEther("75000"),
        executed: false,
        hasVoted: false
      },
      {
        id: 2,
        title: "Add support for animated film projects",
        description: "This proposal suggests adding a new category for animated film projects in the IndieFund platform with specialized milestone templates and funding parameters.",
        ipfsHash: "QmT8JfnZ9ks2VXr5JKL9vJsVBQYDwMNECrx3n1W8VXR5JL",
        startTime: Math.floor(Date.now()/1000) - 5 * 24 * 60 * 60,
        endTime: Math.floor(Date.now()/1000) + 2 * 24 * 60 * 60,
        yesVotes: ethers.utils.parseEther("200000"),
        noVotes: ethers.utils.parseEther("50000"),
        executed: false,
        hasVoted: false
      },
      {
        id: 3,
        title: "Reduce platform fee from 2.5% to 2%",
        description: "This proposal aims to reduce the platform fee charged on all transactions from 2.5% to 2% to make the platform more competitive and attractive to filmmakers.",
        ipfsHash: "QmT8JfnZ9ks2VXr5JKL9vJsVBQYDwMNECrx3n1W8VXR5JM",
        startTime: Math.floor(Date.now()/1000) - 15 * 24 * 60 * 60,
        endTime: Math.floor(Date.now()/1000) - 8 * 24 * 60 * 60,
        yesVotes: ethers.utils.parseEther("350000"),
        noVotes: ethers.utils.parseEther("150000"),
        executed: true,
        hasVoted: false
      },
      {
        id: 4,
        title: "Add multi-chain support for the platform",
        description: "This proposal suggests adding support for multiple blockchains to the FilmChain platform, starting with Polygon and Binance Smart Chain.",
        ipfsHash: "QmT8JfnZ9ks2VXr5JKL9vJsVBQYDwMNECrx3n1W8VXR5JN",
        startTime: Math.floor(Date.now()/1000) - 25 * 24 * 60 * 60,
        endTime: Math.floor(Date.now()/1000) - 18 * 24 * 60 * 60,
        yesVotes: ethers.utils.parseEther("120000"),
        noVotes: ethers.utils.parseEther("280000"),
        executed: true,
        hasVoted: false
      }
    ];
  };
  
  const fetchProposals = async () => {
    try {
      const contract = new ethers.Contract(communityVoiceAddress, CommunityVoiceABI, provider);
      const proposalCount = await contract.proposalCount();
      
      const proposalPromises = [];
      for (let i = 1; i <= proposalCount; i++) {
        proposalPromises.push(fetchProposalDetails(contract, i));
      }
      
      const fetchedProposals = await Promise.all(proposalPromises);
      setProposals(fetchedProposals);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      // Fallback to mock data
      setProposals(getMockProposals());
    }
  };
  
  const fetchProposalDetails = async (contract, id) => {
    try {
      const details = await contract.getProposalDetails(id);
      const hasVoted = await contract.hasVoted(id, account);
      
      return {
        id,
        title: details.title,
        description: details.description,
        ipfsHash: details.ipfsHash,
        startTime: details.startTime.toNumber(),
        endTime: details.endTime.toNumber(),
        yesVotes: details.yesVotes,
        noVotes: details.noVotes,
        executed: details.executed,
        hasVoted
      };
    } catch (error) {
      console.error(`Error fetching proposal ${id}:`, error);
      return null;
    }
  };
  
  const fetchVotingPower = async () => {
    try {
      const tokenContract = new ethers.Contract(filmTokenAddress, FilmTokenABI, provider);
      const balance = await tokenContract.balanceOf(account);
      setUserVotingPower(parseFloat(ethers.utils.formatEther(balance)));
    } catch (error) {
      console.error("Error fetching voting power:", error);
      setUserVotingPower(1000); // Mock value
    }
  };
  
  const handleVote = async () => {
    if (!selectedProposal || voteType === null) return;
    
    setIsVoting(true);
    
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(communityVoiceAddress, CommunityVoiceABI, signer);
      
      const tx = await contract.vote(selectedProposal.id, voteType === 1);
      await tx.wait();
      
      // Update the local state to reflect the vote
      const updatedProposals = proposals.map(p => {
        if (p.id === selectedProposal.id) {
          const votingPowerBN = ethers.utils.parseEther(userVotingPower.toString());
          return {
            ...p,
            hasVoted: true,
            yesVotes: voteType === 1 
              ? p.yesVotes.add(votingPowerBN) 
              : p.yesVotes,
            noVotes: voteType === 0 
              ? p.noVotes.add(votingPowerBN) 
              : p.noVotes
          };
        }
        return p;
      });
      
      setProposals(updatedProposals);
      setSelectedProposal(null);
      setVoteType(null);
      
      alert("Vote submitted successfully!");
    } catch (error) {
      console.error("Error voting:", error);
      alert("Error submitting vote. Please try again.");
    } finally {
      setIsVoting(false);
    }
  };
  
  const getProposalStatus = (proposal) => {
    const now = Math.floor(Date.now() / 1000);
    
    if (proposal.executed) {
      return proposal.yesVotes.gt(proposal.noVotes) ? "Passed" : "Rejected";
    }
    
    if (now < proposal.startTime) {
      return "Pending";
    }
    
    if (now > proposal.endTime) {
      return "Awaiting Execution";
    }
    
    return "Active";
  };
  
  const getStatusColor = (status) => {
    const colorMap = {
      "Pending": "bg-gray-900 text-gray-300",
      "Active": "bg-blue-900 text-blue-300",
      "Awaiting Execution": "bg-yellow-900 text-yellow-300",
      "Passed": "bg-green-900 text-green-300",
      "Rejected": "bg-red-900 text-red-300"
    };
    return colorMap[status] || "bg-gray-700 text-gray-300";
  };
  
  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const calculatePercentage = (votes, totalVotes) => {
    if (totalVotes.isZero()) return 0;
    return votes.mul(100).div(totalVotes).toNumber();
  };
  
  const filteredProposals = proposals.filter(p => {
    const now = Math.floor(Date.now() / 1000);
    const status = getProposalStatus(p);
    
    if (activeTab === 'active') {
      return status === "Active" || status === "Pending";
    } else {
      return status === "Passed" || status === "Rejected" || status === "Awaiting Execution";
    }
  });
  
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Community Governance</h1>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Shape the future of FilmChain by participating in governance decisions. Vote on proposals, suggest improvements, and help guide the platform's development.
          </p>
        </div>
        
        <div className="bg-gray-900 rounded-lg overflow-hidden mb-8">
          <div className="flex border-b border-gray-800">
            <button 
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'active' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('active')}
            >
              Active Proposals
            </button>
            <button 
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'past' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('past')}
            >
              Past Proposals
            </button>
          </div>
          
          <div className="p-6">
            {filteredProposals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No {activeTab} proposals found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredProposals.map(proposal => (
                  <div 
                    key={proposal.id} 
                    className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-750 transition"
                    onClick={() => setSelectedProposal(proposal)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-white">{proposal.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(getProposalStatus(proposal))}`}>
                        {getProposalStatus(proposal)}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 mb-4 line-clamp-2">{proposal.description}</p>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>Yes: {ethers.utils.formatEther(proposal.yesVotes).slice(0, 8)} FILM</span>
                        <span>No: {ethers.utils.formatEther(proposal.noVotes).slice(0, 8)} FILM</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        {!proposal.yesVotes.isZero() || !proposal.noVotes.isZero() ? (
                          <div 
                            className="bg-teal-500 h-2.5 rounded-full" 
                           style={{ width: `${calculatePercentage(proposal.yesVotes, proposal.yesVotes.add(proposal.noVotes))}%` }}
                          ></div>
                        ) : (
                          <div className="bg-gray-600 h-2.5 rounded-full w-0"></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Start: {formatTime(proposal.startTime)}</span>
                      <span>End: {formatTime(proposal.endTime)}</span>
                    </div>
                    
                    {proposal.hasVoted && (
                      <div className="mt-4 text-sm text-teal-400">
                        You have voted on this proposal
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {isConnected ? (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Your Voting Power</h2>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-gray-400 text-sm">FILM Balance</p>
                <p className="text-2xl font-bold text-white">{userVotingPower.toFixed(2)} FILM</p>
              </div>
              <div className="bg-teal-500 bg-opacity-20 p-2 rounded-full">
                <svg className="w-8 h-8 text-teal-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"></path>
                </svg>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Your voting power is proportional to your FILM token balance. The more tokens you hold, the greater your influence on governance decisions.
            </p>
            <a 
              href="https://app.uniswap.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-2 rounded-md text-center"
            >
              Get More FILM Tokens
            </a>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-6">Connect your wallet to vote on proposals</p>
            <button 
              onClick={connectWallet}
              className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-3 rounded-md text-lg font-medium"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>
      
      {/* Proposal Details Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black  flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold text-white">{selectedProposal.title}</h3>
                <button 
                  onClick={() => setSelectedProposal(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(getProposalStatus(selectedProposal))}`}>
                  {getProposalStatus(selectedProposal)}
                </span>
              </div>
              
              <div className="mb-6">
                <h4 className="text-lg font-medium text-white mb-2">Description</h4>
                <p className="text-gray-400">{selectedProposal.description}</p>
              </div>
              
              <div className="mb-6">
                <h4 className="text-lg font-medium text-white mb-2">Voting Period</h4>
                <div className="flex justify-between text-gray-400">
                  <span>Start: {formatTime(selectedProposal.startTime)}</span>
                  <span>End: {formatTime(selectedProposal.endTime)}</span>
               </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-lg font-medium text-white mb-2">Current Results</h4>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Yes: {ethers.utils.formatEther(selectedProposal.yesVotes).slice(0, 8)} FILM ({calculatePercentage(selectedProposal.yesVotes, selectedProposal.yesVotes.add(selectedProposal.noVotes))}%)</span>
                  <span>No: {ethers.utils.formatEther(selectedProposal.noVotes).slice(0, 8)} FILM ({calculatePercentage(selectedProposal.noVotes, selectedProposal.yesVotes.add(selectedProposal.noVotes))}%)</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
                  {!selectedProposal.yesVotes.isZero() || !selectedProposal.noVotes.isZero() ? (
                    <div 
                      className="bg-teal-500 h-4 rounded-full" 
                      style={{ width: `${calculatePercentage(selectedProposal.yesVotes, selectedProposal.yesVotes.add(selectedProposal.noVotes))}%` }}
                    ></div>
                  ) : (
                    <div className="bg-gray-600 h-4 rounded-full w-0"></div>
                  )}
                </div>
                <p className="text-sm text-gray-400">Total votes: {ethers.utils.formatEther(selectedProposal.yesVotes.add(selectedProposal.noVotes)).slice(0, 8)} FILM</p>
              </div>
              
              {isConnected && getProposalStatus(selectedProposal) === "Active" && !selectedProposal.hasVoted && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-white mb-4">Cast Your Vote</h4>
                  <div className="flex space-x-4 mb-4">
                    <button
                      onClick={() => setVoteType(1)}
                      className={`flex-1 py-3 rounded-md ${
                        voteType === 1 
                          ? 'bg-teal-500 text-white' 
                         : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      Vote Yes
                    </button>
                    <button
                      onClick={() => setVoteType(0)}
                      className={`flex-1 py-3 rounded-md ${
                        voteType === 0 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      Vote No
                    </button>
                  </div>
                  <button
                    onClick={handleVote}
                    disabled={voteType === null || isVoting}
                    className={`w-full py-3 rounded-md ${
                      voteType === null || isVoting
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                    }`}
                  >
                    {isVoting ? 'Submitting Vote...' : 'Submit Vote'}
                  </button>
                </div>
              )}
              
              {selectedProposal.hasVoted && (
                <div className="mb-6 p-4 bg-teal-900 bg-opacity-20 rounded-lg">
                  <p className="text-teal-400">You have already voted on this proposal.</p>
                </div>
              )}
              
              {selectedProposal.ipfsHash && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-white mb-2">Additional Resources</h4>
                  <a 
                   href={`https://ipfs.io/ipfs/${selectedProposal.ipfsHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-400 hover:text-teal-300"
                  >
                    View detailed proposal on IPFS
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

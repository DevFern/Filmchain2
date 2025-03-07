import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { ethers } from 'ethers';
import CommunityVoiceABI from '../contracts/abis/CommunityVoiceABI.json';
import FilmTokenABI from '../contracts/abis/FilmTokenABI.json';

export default function Governance() {
  const { account, provider, isConnected, connectWallet } = useWeb3();
  const [activeProposals, setActiveProposals] = useState([]);
  const [pastProposals, setPastProposals] = useState([]);
  const [userVotingPower, setUserVotingPower] = useState(0);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [voteType, setVoteType] = useState(null);
  
  const communityVoiceAddress = process.env.NEXT_PUBLIC_COMMUNITY_VOICE_ADDRESS;
  const filmTokenAddress = process.env.NEXT_PUBLIC_FILM_TOKEN_ADDRESS;
  
  useEffect(() => {
    if (isConnected && provider) {
      fetchProposals();
      fetchVotingPower();
    }
  }, [isConnected, provider]);
  
  // Mock data for demonstration
  const mockActiveProposals = [
    {
      id: 1,
      title: "Increase funding allocation for documentary films",
      description: "This proposal aims to increase the funding allocation for documentary films from 10% to 15% of the total IndieFund budget to support more non-fiction storytelling.",
      proposer: "0x1234...5678",
      startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      forVotes: ethers.utils.parseEther("125000"),
      againstVotes: ethers.utils.parseEther("75000"),
      status: 1, // Active
      hasVoted: false,
      voteType: null
    },
    {
      id: 2,
      title: "Add support for animated film projects",
      description: "This proposal suggests adding a new category for animated film projects in the IndieFund platform with specialized milestone templates and funding parameters.",
      proposer: "0x2345...6789",
      startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      forVotes: ethers.utils.parseEther("200000"),
      againstVotes: ethers.utils.parseEther("50000"),
      status: 1, // Active
      hasVoted: true,
      voteType: 1 // For
    }
  ];
  
  const mockPastProposals = [
    {
      id: 3,
      title: "Reduce platform fee from 2.5% to 2%",
      description: "This proposal aims to reduce the platform fee charged on all transactions from 2.5% to 2% to make the platform more competitive and attractive to filmmakers.",
      proposer: "0x3456...7890",
      startTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      forVotes: ethers.utils.parseEther("350000"),
      againstVotes: ethers.utils.parseEther("150000"),
      status: 3, // Executed
      hasVoted: true,
      voteType: 1 // For
    },
    {
      id: 4,
      title: "Add multi-chain support for the platform",
      description: "This proposal suggests adding support for multiple blockchains to the FilmChain platform, starting with Polygon and Binance Smart Chain.",
      proposer: "0x4567...8901",
      startTime: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      forVotes: ethers.utils.parseEther("120000"),
      againstVotes: ethers.utils.parseEther("280000"),
      status: 4, // Rejected
      hasVoted: false,
      voteType: null
    }
  ];
  
  const fetchProposals = async () => {
    // In a real implementation, you would fetch from the blockchain
    // For now, we'll use mock data
    setActiveProposals(mockActiveProposals);
    setPastProposals(mockPastProposals);
  };
  
  const fetchVotingPower = async () => {
    try {
      const tokenContract = new ethers.Contract(filmTokenAddress, FilmTokenABI, provider);
      const balance = await tokenContract.balanceOf(account);
      setUserVotingPower(parseFloat(ethers.utils.formatEther(balance)));
    } catch (error) {
      console.error("Error fetching voting power:", error);
    }
  };
  
  const handleVote = async () => {
    if (!selectedProposal || voteType === null) return;
    
    // In a real implementation, you would call the smart contract
    alert(`Vote ${voteType === 1 ? 'For' : 'Against'} proposal ${selectedProposal.id} submitted!`);
    
    // Update the local state to reflect the vote
    const updatedProposals = activeProposals.map(p => {
      if (p.id === selectedProposal.id) {
        return {
          ...p,
          hasVoted: true,
          voteType: voteType,
          forVotes: voteType === 1 
            ? ethers.BigNumber.from(p.forVotes).add(ethers.utils.parseEther("1000")) 
            : p.forVotes,
          againstVotes: voteType === 0 
            ? ethers.BigNumber.from(p.againstVotes).add(ethers.utils.parseEther("1000")) 
            : p.againstVotes
        };
      }
      return p;
    });
    
    setActiveProposals(updatedProposals);
    setSelectedProposal(null);
    setVoteType(null);
  };
  
  const getStatusText = (status) => {
    const statusMap = {
      0: 'Pending',
      1: 'Active',
      2: 'Succeeded',
      3: 'Executed',
      4: 'Rejected'
    };
    return statusMap[status] || 'Unknown';
  };
  
  const getStatusColor = (status) => {
    const colorMap = {
      0: 'bg-gray-900 text-gray-300',
      1: 'bg-blue-900 text-blue-300',
      2: 'bg-green-900 text-green-300',
      3: 'bg-purple-900 text-purple-300',
      4: 'bg-red-900 text-red-300'
    };
    return colorMap[status] || 'bg-gray-700 text-gray-300';
  };
  
  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  const calculatePercentage = (votes, totalVotes) => {
    if (totalVotes.eq(0)) return 0;
    return votes.mul(100).div(totalVotes).toNumber();
  };
  
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Community Governance</h1>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Shape the future of FilmChain by participating in governance decisions. Vote on proposals, suggest improvements, and help guide the platform's development.
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

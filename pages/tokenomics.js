import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { ethers } from 'ethers';
import FilmTokenABI from '../contracts/abis/FilmTokenABI.json';

export default function Tokenomics() {
  const { account, provider, isConnected, connectWallet } = useWeb3();
  const [tokenMetrics, setTokenMetrics] = useState({
    price: 2.45,
    marketCap: 24500000,
    circulatingSupply: 10000000,
    totalSupply: 100000000,
    stakingAPY: 12.5
  });
  const [userMetrics, setUserMetrics] = useState({
    balance: 0,
    staked: 0,
    rewards: 0
  });
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const filmTokenAddress = process.env.NEXT_PUBLIC_FILM_TOKEN_ADDRESS;
  
  useEffect(() => {
    if (isConnected && provider) {
      fetchUserBalance();
    }
  }, [isConnected, provider]);
  
  const fetchUserBalance = async () => {
    try {
      const tokenContract = new ethers.Contract(filmTokenAddress, FilmTokenABI, provider);
      const balance = await tokenContract.balanceOf(account);
      setUserMetrics({
        ...userMetrics,
        balance: parseFloat(ethers.utils.formatEther(balance))
      });
    } catch (error) {
      console.error("Error fetching token balance:", error);
    }
  };
  
  const handleStake = () => {
    alert("Staking feature coming soon!");
    setStakeAmount('');
  };
  
  const handleUnstake = () => {
    alert("Unstaking feature coming soon!");
    setUnstakeAmount('');
  };
  
  const handleClaimRewards = () => {
    alert("Rewards claiming feature coming soon!");
  };
  
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">FILM Token Economics</h1>
          <p className="text-gray-400 max-w-3xl mx-auto">
            The FILM token powers the entire FilmChain ecosystem, enabling funding, governance, and rewards for all participants.
          </p>
        </div>
        
        {!isConnected ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-6">Connect your wallet to view your token metrics and staking options</p>
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
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="flex border-b border-gray-800">
                  <button 
                    className={`px-4 py-3 text-sm font-medium ${activeTab === 'overview' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                  <button 
                    className={`px-4 py-3 text-sm font-medium ${activeTab === 'distribution' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
                    onClick={() => setActiveTab('distribution')}
                  >
                    Distribution
                  </button>
                  <button 
                    className={`px-4 py-3 text-sm font-medium ${activeTab === 'utility' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
                    onClick={() => setActiveTab('utility')}
                  >
                    Utility
                  </button>
                </div>
                
                <div className="p-6">
                  {activeTab === 'overview' && (
                    <div>
                      <h2 className="text-xl font-bold text-white mb-4">Token Metrics</h2>
                      <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <p className="text-gray-400 text-sm mb-1">Current Price</p>
                          <p className="text-2xl font-bold text-white">${tokenMetrics.price.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <p className="text-gray-400 text-sm mb-1">Market Cap</p>
                          <p className="text-2xl font-bold text-white">${(tokenMetrics.marketCap / 1000000).toFixed(1)}M</p>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <p className="text-gray-400 text-sm mb-1">Circulating Supply</p>
                          <p className="text-2xl font-bold text-white">{(tokenMetrics.circulatingSupply / 1000000).toFixed(1)}M</p>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <p className="text-gray-400 text-sm mb-1">Total Supply</p>
                          <p className="text-2xl font-bold text-white">{(tokenMetrics.totalSupply / 1000000).toFixed(1)}M</p>
                        </div>
                      </div>
                      
                      <h2 className="text-xl font-bold text-white mb-4">Token Performance</h2>
                      <div className="bg-gray-800 p-4 rounded-lg h-64 flex items-center justify-center">
                        <p className="text-gray-400">Price chart coming soon</p>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'distribution' && (
                    <div>
                      <h2 className="text-xl font-bold text-white mb-4">Token Distribution</h2>
                      <div className="bg-gray-800 p-4 rounded-lg mb-6 h-64 flex items-center justify-center">
                        <p className="text-gray-400">Distribution chart coming soon</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-teal-500 rounded-full mr-2"></div>
                            <span className="text-gray-300">Community & Ecosystem</span>
                          </div>
                          <span className="text-white font-medium">40%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-gray-300">Team & Advisors</span>
                          </div>
                          <span className="text-white font-medium">20%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                            <span className="text-gray-300">Treasury</span>
                          </div>
                          <span className="text-white font-medium">15%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-gray-300">Liquidity</span>
                          </div>
                          <span className="text-white font-medium">15%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                            <span className="text-gray-300">Private Sale</span>
                          </div>
                          <span className="text-white font-medium">10%</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'utility' && (
                    <div>
                      <h2 className="text-xl font-bold text-white mb-4">Token Utility</h2>
                      
                      <div className="space-y-6">
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-teal-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                            </svg>
                            <h3 className="text-lg font-medium text-white">Project Funding</h3>
                          </div>
                          <p className="text-gray-400">FILM tokens are used to fund indie film projects through the IndieFund platform, allowing token holders to support creators directly.</p>
                        </div>
                        
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-teal-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                            </svg>
                            <h3 className="text-lg font-medium text-white">Governance</h3>
                          </div>
                          <p className="text-gray-400">Token holders can vote on platform decisions, feature proposals, and funding allocations through the CommunityVoice governance system.</p>
                        </div>
                        
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-teal-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"></path>
                            </svg>
                            <h3 className="text-lg font-medium text-white">Staking Rewards</h3>
                          </div>
                          <p className="text-gray-400">Stake your FILM tokens to earn passive income and gain additional governance rights within the ecosystem.</p>
                        </div>
                        
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-teal-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"></path>
                            </svg>
                            <h3 className="text-lg font-medium text-white">Marketplace Transactions</h3>
                          </div>
                          <p className="text-gray-400">FILM tokens are used for all transactions in the NFT marketplace, including purchasing film collectibles and royalty distributions.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-gray-900 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-4">Your FILM Balance</h2>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-gray-400 text-sm">Available</p>
                    <p className="text-2xl font-bold text-white">{userMetrics.balance.toFixed(2)} FILM</p>
                  </div>
                  <div className="bg-teal-500 bg-opacity-20 p-2 rounded-full">
                    <svg className="w-8 h-8 text-teal-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                </div>
                <a 
                  href="https://app.uniswap.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-2 rounded-md text-center"
                >
                  Buy FILM Tokens
                </a>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Staking</h2>
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <p className="text-gray-400 text-sm">Staked Balance</p>
                    <p className="text-gray-400 text-sm">APY: {tokenMetrics.stakingAPY}%</p>
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">{userMetrics.staked.toFixed(2)} FILM</p>
                  <p className="text-sm text-gray-400">Rewards: {userMetrics.rewards.toFixed(4)} FILM</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="stakeAmount" className="block text-sm font-medium text-gray-400 mb-2">
                      Stake FILM
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        id="stakeAmount"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-l-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button
                        onClick={handleStake}
                        disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > userMetrics.balance}
                        className={`px-4 py-2 rounded-r-md ${
                          !stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > userMetrics.balance
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-teal-500 text-white'
                        }`}
                      >
                        Stake
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="unstakeAmount" className="block text-sm font-medium text-gray-400 mb-2">
                      Unstake FILM
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        id="unstakeAmount"
                        value={unstakeAmount}
                        onChange={(e) => setUnstakeAmount(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-l-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button
                        onClick={handleUnstake}
                        disabled={!unstakeAmount || parseFloat(unstakeAmount) <= 0 || parseFloat(unstakeAmount) > userMetrics.staked}
                        className={`px-4 py-2 rounded-r-md ${
                          !unstakeAmount || parseFloat(unstakeAmount) <= 0 || parseFloat(unstakeAmount) > userMetrics.staked
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-teal-500 text-white'
                        }`}
                      >
                        Unstake
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleClaimRewards}
                    disabled={userMetrics.rewards <= 0}
                    className={`w-full py-2 rounded-md ${
                      userMetrics.rewards <= 0
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                    }`}
                  >
                    Claim Rewards
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

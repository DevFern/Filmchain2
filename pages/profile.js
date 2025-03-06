import { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { ethers } from 'ethers';
import FilmTokenABI from '../contracts/abis/FilmTokenABI.json';
import HyreBlockABI from '../contracts/abis/HyreBlockABI.json';
import NFTMarketABI from '../contracts/abis/NFTMarketABI.json';
import FilmNFTABI from '../contracts/abis/FilmNFTABI.json';

export default function Profile() {
  const { account, provider, isConnected, connectWallet, chainId } = useWeb3();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    filmBalance: '0',
    nftCount: 0,
    transactions: 0
  });
  
  const filmTokenAddress = process.env.NEXT_PUBLIC_FILM_TOKEN_ADDRESS;
  const hyreBlockAddress = process.env.NEXT_PUBLIC_HYRE_BLOCK_ADDRESS;
  const nftMarketAddress = process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS;
  const filmNftAddress = process.env.NEXT_PUBLIC_FILM_NFT_ADDRESS;
  
  useEffect(() => {
    if (isConnected && provider) {
      fetchProfile();
      fetchNFTs();
      fetchStats();
    }
  }, [isConnected, provider, chainId]);
  
  const fetchProfile = async () => {
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
      console.error("Error fetching profile:", error);
    }
  };
  
  const fetchNFTs = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(nftMarketAddress, NFTMarketABI, provider);
      const nftContract = new ethers.Contract(filmNftAddress, FilmNFTABI, provider);
      
      const data = await contract.fetchMyNFTs();
      
      const items = await Promise.all(data.map(async (i) => {
        const tokenUri = await nftContract.tokenURI(i.tokenId);
        const meta = await fetch(tokenUri).then(res => res.json());
        
        return {
          tokenId: i.tokenId.toNumber(),
          seller: i.seller,
          price: ethers.utils.formatEther(i.price),
          image: meta.image,
          name: meta.name,
          description: meta.description,
          attributes: meta.attributes
        };
      }));
      
      setNfts(items);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      setLoading(false);
    }
  };
  
  const fetchStats = async () => {
    try {
      // Get FILM token balance
      const tokenContract = new ethers.Contract(filmTokenAddress, FilmTokenABI, provider);
      const balance = await tokenContract.balanceOf(account);
      
      // Get transaction count
      const txCount = await provider.getTransactionCount(account);
      
      setStats({
        filmBalance: ethers.utils.formatEther(balance),
        nftCount: nfts.length,
        transactions: txCount
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };
  
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Your Profile</h1>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Manage your profile, view your NFT collection, and track your activity on the FILM Chain platform.
          </p>
        </div>
        
        {!isConnected ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-6">Connect your wallet to view your profile</p>
            <button 
              onClick={connectWallet}
              className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-3 rounded-md text-lg font-medium"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-gray-900 rounded-lg p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-1">
                  <div className="aspect-w-1 aspect-h-1 bg-gray-800 rounded-lg overflow-hidden mb-4">
                    {hasProfile && profile?.ipfsHash ? (
                      <img 
                        src={`https://ipfs.io/ipfs/${profile.ipfsHash}`} 
                        alt={profile.name} 
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-800">
                        <span className="text-gray-500 text-6xl">👤</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-3">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {hasProfile ? profile?.name : 'Anonymous User'}
                      </h2>
                      <p className="text-gray-400">
                        {account.substring(0, 6)}...{account.substring(account.length - 4)}
                      </p>
                    </div>
                    
                    <div className="mt-4 md:mt-0">
                      <button
                        onClick={() => setActiveTab('edit-profile')}
                        className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded-md"
                      >
                        {hasProfile ? 'Edit Profile' : 'Create Profile'}
                      </button>
                    </div>
                  </div>
                  
                  {hasProfile && profile?.bio && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Bio</h3>
                      <p className="text-gray-400">{profile.bio}</p>
                    </div>
                  )}
                  
                  {hasProfile && profile?.skills && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Skills</h3>
                      <p className="text-gray-400">{profile.skills}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <div className="flex overflow-x-auto space-x-4 pb-4">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === 'overview'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('nfts')}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === 'nfts'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  NFTs
                </button>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === 'jobs'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Jobs
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === 'settings'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Settings
                </button>
              </div>
            </div>
            
            {activeTab === 'overview' && (
              <div className="bg-gray-900 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Account Overview</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                    {/* Activity content goes here */}
                    <div className="bg-gray-800 rounded-lg p-4">
                      {loading ? (
                        <p className="text-gray-400 text-center py-4">Loading activity...</p>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <div className="bg-blue-900 p-2 rounded-full mr-4">
                              <svg className="w-5 h-5 text-blue-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                              </svg>
                            </div>
                            <div>
                              <p className="text-white">Wallet Connected</p>
                              <p className="text-gray-400 text-sm">Connected to {chainId === 1 ? 'Ethereum' : chainId === 56 ? 'BSC' : chainId === 137 ? 'Polygon' : 'Unknown'} network</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'nfts' && (
              <div className="bg-gray-900 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Your NFT Collection</h2>
                
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Loading NFTs...</p>
                  </div>
                ) : nfts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">You don't own any NFTs yet</p>
                    <a 
                      href="/nft-market" 
                      className="mt-4 inline-block bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-md"
                    >
                      Browse NFT Market
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nfts.map((nft) => (
                      <div key={nft.tokenId} className="bg-gray-800 rounded-lg overflow-hidden">
                        <div className="aspect-w-1 aspect-h-1 bg-gray-700">
                          <img 
                            src={nft.image} 
                            alt={nft.name} 
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-white mb-1">{nft.name}</h3>
                          <p className="text-gray-400 text-sm mb-2">Token ID: {nft.tokenId}</p>
                          <a 
                            href={`/nft/${nft.tokenId}`} 
                            className="text-teal-400 text-sm hover:underline"
                          >
                            View Details
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'jobs' && (
              <div className="bg-gray-900 rounded-lg p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Your Jobs</h2>
                  <button
                    onClick={() => setActiveTab('post-job')}
                    className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded-md"
                  >
                    Post a Job
                  </button>
                </div>
                
                <div className="text-center py-12">
                  <p className="text-gray-400">You haven't posted any jobs yet</p>
                </div>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="bg-gray-900 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Wallet</h3>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-gray-400 text-sm">Connected Address</p>
                          <p className="text-white">{account}</p>
                        </div>
                        <button
                          onClick={connectWallet}
                          className="bg-gray-700 text-gray-300 px-3 py-1 rounded-md text-sm"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Notifications</h3>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-white">Email Notifications</span>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <input type="checkbox" name="toggle" id="toggle-1" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                          <label htmlFor="toggle-1" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-700 cursor-pointer"></label>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white">Push Notifications</span>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <input type="checkbox" name="toggle" id="toggle-2" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                          <label htmlFor="toggle-2" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-700 cursor-pointer"></label>
                        </div>
                      </div>
                    </div>
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

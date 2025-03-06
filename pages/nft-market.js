import { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { ethers } from 'ethers';
import NFTMarketABI from '../contracts/abis/NFTMarketABI.json';
import FilmNFTABI from '../contracts/abis/FilmNFTABI.json';
import FilmTokenABI from '../contracts/abis/FilmTokenABI.json';

export default function NFTMarket() {
  const { account, provider, isConnected, connectWallet } = useWeb3();
  const [nfts, setNfts] = useState([]);
  const [myNfts, setMyNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNft, setSelectedNft] = useState(null);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [tokenAllowance, setTokenAllowance] = useState('0');
  
  const nftMarketAddress = process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS;
  const filmNftAddress = process.env.NEXT_PUBLIC_FILM_NFT_ADDRESS;
  const filmTokenAddress = process.env.NEXT_PUBLIC_FILM_TOKEN_ADDRESS;
  
  useEffect(() => {
    if (isConnected && provider) {
      fetchNFTs();
      fetchMyNFTs();
      fetchTokenBalance();
      fetchTokenAllowance();
    }
  }, [isConnected, provider]);
  
  const fetchNFTs = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(nftMarketAddress, NFTMarketABI, provider);
      const nftContract = new ethers.Contract(filmNftAddress, FilmNFTABI, provider);
      
      const data = await contract.fetchMarketItems();
      
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
  
  const fetchMyNFTs = async () => {
    try {
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
      
      setMyNfts(items);
    } catch (error) {
      console.error("Error fetching my NFTs:", error);
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
      const allowance = await tokenContract.allowance(account, nftMarketAddress);
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
        nftMarketAddress, 
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
  
  const buyNft = async (nft) => {
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(nftMarketAddress, NFTMarketABI, signer);
      
      const price = ethers.utils.parseEther(nft.price);
      
      const tx = await contract.createMarketSale(nft.tokenId);
      await tx.wait();
      
      alert("NFT purchased successfully!");
      fetchNFTs();
      fetchMyNFTs();
      fetchTokenBalance();
    } catch (error) {
      console.error("Error buying NFT:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleNftSelect = (nft) => {
    setSelectedNft(nft);
  };
  
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">NFT Market</h1>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Discover and collect unique NFTs from indie filmmakers. Own a piece of film history, support creators, and build your digital art collection.
          </p>
        </div>
        
        {!isConnected ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-6">Connect your wallet to view and purchase NFTs</p>
            <button 
              onClick={connectWallet}
              className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-3 rounded-md text-lg font-medium"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === 'marketplace'
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Marketplace
                </button>
                <button
                  onClick={() => setActiveTab('my-nfts')}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === 'my-nfts'
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  My NFTs
                </button>
              </div>
              <div className="text-gray-400">
                <span className="mr-2">Balance:</span>
                <span className="text-teal-400">{parseFloat(tokenBalance).toFixed(2)} FILM</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Loading NFTs...</p>
                  </div>
                ) : activeTab === 'marketplace' ? (
                  nfts.length === 0 ? (
                    <div className="text-center py-12 bg-gray-900 rounded-lg">
                      <p className="text-gray-400">No NFTs found in marketplace</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {nfts.map((nft) => (
                        <div 
                          key={nft.tokenId} 
                          className={`bg-gray-900 rounded-lg overflow-hidden cursor-pointer transition duration-200 ${selectedNft?.tokenId === nft.tokenId ? 'ring-2 ring-teal-500' : ''}`}
                          onClick={() => handleNftSelect(nft)}
                        >
                          <div className="aspect-w-16 aspect-h-9 bg-gray-800">
                            <img 
                              src={nft.image} 
                              alt={nft.name} 
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="text-lg font-bold text-white mb-2">{nft.name}</h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{nft.description}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-teal-400 font-medium">{nft.price} FILM</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (parseFloat(tokenAllowance) < parseFloat(nft.price)) {
                                    handleApproveTokens();
                                  } else {
                                    buyNft(nft);
                                  }
                                }}
                                className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded-md text-sm"
                              >
                                {parseFloat(tokenAllowance) < parseFloat(nft.price) ? 'Approve' : 'Buy Now'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  myNfts.length === 0 ? (
                    <div className="text-center py-12 bg-gray-900 rounded-lg">
                      <p className="text-gray-400">You don't own any NFTs yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {myNfts.map((nft) => (
                        <div 
                          key={nft.tokenId} 
                          className={`bg-gray-900 rounded-lg overflow-hidden cursor-pointer transition duration-200 ${selectedNft?.tokenId === nft.tokenId ? 'ring-2 ring-teal-500' : ''}`}
                          onClick={() => handleNftSelect(nft)}
                        >
                          <div className="aspect-w-16 aspect-h-9 bg-gray-800">
                            <img 
                              src={nft.image} 
                              alt={nft.name} 
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="text-lg font-bold text-white mb-2">{nft.name}</h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{nft.description}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-teal-400 font-medium">Owned</span>
                              <span className="text-gray-400 text-sm">Token ID: {nft.tokenId}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
              
              <div>
                {selectedNft ? (
                  <div className="bg-gray-900 rounded-lg overflow-hidden sticky top-4">
                    <div className="aspect-w-16 aspect-h-9 bg-gray-800">
                      <img 
                        src={selectedNft.image} 
                        alt={selectedNft.name} 
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-white mb-2">{selectedNft.name}</h2>
                      <p className="text-gray-400 mb-6">{selectedNft.description}</p>
                      
                      {selectedNft.attributes && selectedNft.attributes.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-white mb-3">Attributes</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedNft.attributes.map((attr, index) => (
                              <div key={index} className="bg-gray-800 p-2 rounded-md">
                                <p className="text-gray-500 text-xs">{attr.trait_type}</p>
                                <p className="text-white text-sm font-medium">{attr.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Details</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Token ID</span>
                            <span className="text-white">{selectedNft.tokenId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Seller</span>
                            <span className="text-white">{selectedNft.seller.substring(0, 6)}...{selectedNft.seller.substring(selectedNft.seller.length - 4)}</span>
                          </div>
                          {activeTab === 'marketplace' && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Price</span>
                              <span className="text-teal-400 font-medium">{selectedNft.price} FILM</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {activeTab === 'marketplace' && (
                        <button
                          onClick={() => {
                            if (parseFloat(tokenAllowance) < parseFloat(selectedNft.price)) {
                              handleApproveTokens();
                            } else {
                              buyNft(selectedNft);
                            }
                          }}
                          className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 rounded-md font-medium"
                        >
                          {parseFloat(tokenAllowance) < parseFloat(selectedNft.price) ? 'Approve FILM Tokens' : 'Buy Now'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-lg p-6 text-center">
                    <p className="text-gray-400">Select an NFT to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

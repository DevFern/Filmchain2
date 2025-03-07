import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { ethers } from 'ethers';
import NFTMarketABI from '../contracts/abis/NFTMarketABI.json';
import FilmNFTABI from '../contracts/abis/FilmNFTABI.json';
import FilmTokenABI from '../contracts/abis/FilmTokenABI.json';

export default function NFTMarket() {
  const { account, provider, isConnected, connectWallet } = useWeb3();
  const [nfts, setNfts] = useState([]);
  const [userNfts, setUserNfts] = useState([]);
  const [activeTab, setActiveTab] = useState('explore');
  const [selectedNft, setSelectedNft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const nftMarketAddress = process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS;
  const filmNftAddress = process.env.NEXT_PUBLIC_FILM_NFT_ADDRESS;
  const filmTokenAddress = process.env.NEXT_PUBLIC_FILM_TOKEN_ADDRESS;
  
  useEffect(() => {
    fetchNFTs();
    
    if (isConnected) {
      fetchUserNFTs();
    }
  }, [isConnected]);
  
  const fetchNFTs = async () => {
    setIsLoading(true);
    
    try {
      if (provider && nftMarketAddress) {
        const marketContract = new ethers.Contract(nftMarketAddress, NFTMarketABI, provider);
        const nftContract = new ethers.Contract(filmNftAddress, FilmNFTABI, provider);
        
        const data = await marketContract.fetchMarketItems();
        
        const items = await Promise.all(data.map(async (i) => {
          const tokenUri = await nftContract.tokenURI(i.tokenId);
          const meta = await fetchMetadata(tokenUri);
          
          const price = i.price;
          const item = {
            price,
            tokenId: i.tokenId.toNumber(),
            seller: i.seller,
            sold: i.sold,
            name: meta.name,
            description: meta.description,
            image: meta.image,
            category: meta.category || 'Collectible',
            filmTitle: meta.filmTitle || 'Unknown',
            director: meta.director || 'Unknown',
            year: meta.year || 'Unknown',
            edition: meta.edition || '1 of 1'
          };
          return item;
        }));
        
        setNfts(items);
      } else {
        // Use mock data if provider or contract address is not available
        setNfts(getMockNFTs());
      }
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      setNfts(getMockNFTs());
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchUserNFTs = async () => {
    try {
      if (provider && nftMarketAddress && account) {
        const marketContract = new ethers.Contract(nftMarketAddress, NFTMarketABI, provider);
        const nftContract = new ethers.Contract(filmNftAddress, FilmNFTABI, provider);
        
        const data = await marketContract.fetchMyNFTs();
        
        const items = await Promise.all(data.map(async (i) => {
          const tokenUri = await nftContract.tokenURI(i.tokenId);
          const meta = await fetchMetadata(tokenUri);
          
          const price = i.price;
          const item = {
            price,
            tokenId: i.tokenId.toNumber(),
            seller: i.seller,
            sold: i.sold,
            name: meta.name,
            description: meta.description,
            image: meta.image,
            category: meta.category || 'Collectible',
            filmTitle: meta.filmTitle || 'Unknown',
            director: meta.director || 'Unknown',
            year: meta.year || 'Unknown',
            edition: meta.edition || '1 of 1'
          };
          return item;
        }));
        
        setUserNfts(items);
      } else {
        setUserNfts(getMockUserNFTs());
      }
    } catch (error) {
      console.error("Error fetching user NFTs:", error);
      setUserNfts(getMockUserNFTs());
    }
  };
  
  const fetchMetadata = async (uri) => {
    try {
      // In a real implementation, you would fetch the metadata from IPFS or another storage
      // For now, we'll return mock data
      return {
        name: "Film NFT",
        description: "A digital collectible from a classic film",
        image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26",
        category: "Collectible",
        filmTitle: "Classic Film",
        director: "Famous Director",
        year: 2023,
        edition: "1 of 10"
      };
    } catch (error) {
      console.error("Error fetching metadata:", error);
      return {
        name: "Unknown NFT",
        description: "Metadata could not be loaded",
        image: "https://via.placeholder.com/400",
        category: "Unknown",
        filmTitle: "Unknown",
        director: "Unknown",
        year: "Unknown",
        edition: "Unknown"
      };
    }
  };
  
  const getMockNFTs = () => {
    return [
      {
        tokenId: 1,
        name: "Sunset Boulevard - Director's Cut",
        description: "Exclusive digital collectible from the remastered version of the classic film noir.",
        image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        price: ethers.utils.parseEther("0.5"),
        seller: "0x1234567890123456789012345678901234567890",
        category: "Collectible",
        filmTitle: "Sunset Boulevard",
        director: "Billy Wilder",
        year: 1950,
        edition: "1 of 10",
        sold: false
      },
      {
        tokenId: 2,
        name: "Metropolis - Original Poster",
        description: "Digital recreation of the iconic poster from Fritz Lang's masterpiece.",
        image: "https://images.unsplash.com/photo-1626126525134-fbbc07afb32c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        price: ethers.utils.parseEther("0.75"),
        seller: "0x2345678901234567890123456789012345678901",
        category: "Artwork",
        filmTitle: "Metropolis",
        director: "Fritz Lang",
        year: 1927,
        edition: "1 of 5",
        sold: false
      },
      {
        tokenId: 3,
        name: "Citizen Kane - Behind the Scenes",
        description: "Rare behind-the-scenes footage from the making of Citizen Kane.",
        image: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        price: ethers.utils.parseEther("1.2"),
        seller: "0x3456789012345678901234567890123456789012",
        category: "Video",
        filmTitle: "Citizen Kane",
        director: "Orson Welles",
        year: 1941,
        edition: "1 of 3",
        sold: false
      },
      {
        tokenId: 4,
        name: "The Godfather - Screenplay Page",
        description: "Digital collectible featuring a page from the original screenplay with annotations.",
        image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        price: ethers.utils.parseEther("0.8"),
        seller: "0x4567890123456789012345678901234567890123",
        category: "Document",
        filmTitle: "The Godfather",
        director: "Francis Ford Coppola",
        year: 1972,
        edition: "1 of 7",
        sold: false
      },
      {
        tokenId: 5,
        name: "Pulp Fiction - Character Art",
        description: "Stylized digital art of the iconic characters from Tarantino's masterpiece.",
        image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        price: ethers.utils.parseEther("0.65"),
        seller: "0x5678901234567890123456789012345678901234",
        category: "Artwork",
        filmTitle: "Pulp Fiction",
        director: "Quentin Tarantino",
        year: 1994,
        edition: "1 of 15",
        sold: false
      },
      {
        tokenId: 6,
        name: "2001: A Space Odyssey - Concept Art",
        description: "Digital reproduction of original concept art from Kubrick's sci-fi masterpiece.",
        image: "https://images.unsplash.com/photo-1518331647614-7a1f04cd34cf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        price: ethers.utils.parseEther("1.5"),
        seller: "0x6789012345678901234567890123456789012345",
        category: "Artwork",
        filmTitle: "2001: A Space Odyssey",
        director: "Stanley Kubrick",
        year: 1968,
        edition: "1 of 5",
        sold: false
      }
    ];
  };
  
  const getMockUserNFTs = () => {
    return [
      {
        tokenId: 7,
        name: "Blade Runner - Limited Edition Scene",
        description: "Exclusive digital collectible featuring the iconic 'tears in rain' monologue.",
        image: "https://images.unsplash.com/photo-1605106702734-205df224ecce?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        price: ethers.utils.parseEther("1.8"),
        seller: "0x7890123456789012345678901234567890123456",
        category: "Video",
        filmTitle: "Blade Runner",
        director: "Ridley Scott",
        year: 1982,
        edition: "1 of 3",
        sold: true
      },
      {
        tokenId: 8,
        name: "The Shining - Room 237 Key",
        description: "Digital collectible of the infamous Room 237 key from The Shining.",
        image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        price: ethers.utils.parseEther("0.95"),
        seller: "0x8901234567890123456789012345678901234567",
        category: "Collectible",
        filmTitle: "The Shining",
        director: "Stanley Kubrick",
        year: 1980,
        edition: "1 of 10",
        sold: true
      }
    ];
  };
  
  const handlePurchase = async (nft) => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    
    setIsPurchasing(true);
    
    try {
      const signer = provider.getSigner();
      const marketContract = new ethers.Contract(nftMarketAddress, NFTMarketABI, signer);
      const tokenContract = new ethers.Contract(filmTokenAddress, FilmTokenABI, signer);
      
      // Approve the market contract to spend tokens
      const approveTx = await tokenContract.approve(nftMarketAddress, nft.price);
      await approveTx.wait();
      
      // Create the sale
      const tx = await marketContract.createMarketSale(nft.tokenId);
      await tx.wait();
      
      alert(`Successfully purchased ${nft.name}!`);
      
      // Refresh NFTs
      fetchNFTs();
      fetchUserNFTs();
      setSelectedNft(null);
    } catch (error) {
      console.error("Error purchasing NFT:", error);
      alert("Error purchasing NFT. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  };
  
  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  const filteredNFTs = activeTab === 'explore' 
    ? nfts.filter(nft => {
        const matchesSearch = searchTerm === '' || 
          nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          nft.filmTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          nft.director.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = filterCategory === 'all' || nft.category === filterCategory;
        
        return matchesSearch && matchesCategory;
      })
    : userNfts;
  
  const categories = ['all', 'Artwork', 'Collectible', 'Video', 'Document'];
  
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Film NFT Marketplace</h1>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Discover and collect unique digital assets from your favorite films. Own a piece of cinema history with blockchain-verified authenticity.
          </p>
        </div>
        
        <div className="bg-gray-900 rounded-lg overflow-hidden mb-8">
          <div className="flex border-b border-gray-800">
            <button 
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'explore' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('explore')}
            >
              Explore NFTs
            </button>
            <button 
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'collection' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => {
                if (!isConnected) {
                  connectWallet();
                } else {
                  setActiveTab('collection');
                }
              }}
            >
              My Collection
            </button>
          </div>
          
          {activeTab === 'explore' && (
            <div className="p-4 bg-gray-800">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by name, film, or director..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
          
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
                <p className="mt-4 text-gray-400">Loading NFTs...</p>
              </div>
            ) : filteredNFTs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">
                  {activeTab === 'explore' 
                    ? 'No NFTs found. Try adjusting your search or filters.' 
                    : 'You don\'t own any NFTs yet. Purchase some from the marketplace!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNFTs.map((nft) => (
                  <div 
                    key={nft.tokenId} 
                    className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedNft(nft)}
                  >
                    <div className="relative pb-2/3">
                      <img 
                        src={nft.image} 
                        alt={nft.name} 
                        className="absolute h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/400?text=Image+Not+Available";
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-white line-clamp-1">{nft.name}</h3>
                        <span className="bg-teal-900 text-teal-300 text-xs px-2 py-1 rounded">
                          {nft.category}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{nft.description}</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500">{nft.filmTitle} ({nft.year})</p>
                          <p className="text-xs text-gray-500">Dir: {nft.director}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-teal-400 font-medium">{ethers.utils.formatEther(nft.price)} FILM</p>
                          <p className="text-xs text-gray-500">{nft.edition}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {!isConnected && activeTab === 'explore' && (
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <p className="text-gray-400 mb-4">Connect your wallet to purchase NFTs and view your collection</p>
            <button 
              onClick={connectWallet}
              className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-3 rounded-md text-lg font-medium"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>
      
      {/* NFT Details Modal */}
      {selectedNft && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6">
                <div className="relative pb-full rounded-lg overflow-hidden">
                  <img 
                    src={selectedNft.image} 
                    alt={selectedNft.name} 
                    className="absolute h-full w-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/400?text=Image+Not+Available";
                    }}
                  />
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-white">{selectedNft.name}</h2>
                  <button 
                    onClick={() => setSelectedNft(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-center mb-4">
                  <span className="bg-teal-900 text-teal-300 text-xs px-2 py-1 rounded mr-2">
                    {selectedNft.category}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {selectedNft.edition}
                  </span>
                </div>
                
                <p className="text-gray-300 mb-6">{selectedNft.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">Film</p>
                    <p className="text-white">{selectedNft.filmTitle}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">Director</p>
                    <p className="text-white">{selectedNft.director}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">Year</p>
                    <p className="text-white">{selectedNft.year}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">Seller</p>
                    <p className="text-white">{formatAddress(selectedNft.seller)}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-400 text-sm mb-1">Price</p>
                  <p className="text-3xl font-bold text-white">{ethers.utils.formatEther(selectedNft.price)} FILM</p>
                </div>
                
                {activeTab === 'explore' && !selectedNft.sold ? (
                  <button
                    onClick={() => handlePurchase(selectedNft)}
                    disabled={isPurchasing}
                    className={`w-full py-3 rounded-md ${
                      isPurchasing
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                    }`}
                  >
                    {isPurchasing ? 'Processing Purchase...' : 'Purchase NFT'}
                  </button>
                ) : activeTab === 'collection' ? (
                  <div className="bg-teal-900 bg-opacity-20 p-4 rounded-lg">
                    <p className="text-teal-400">You own this NFT</p>
                  </div>
                ) : null}
                
                <div className="mt-6 text-xs text-gray-500">
                  <p>Token ID: {selectedNft.tokenId}</p>
                  <p className="mt-1">
                    <a 
                      href={`https://etherscan.io/token/${filmNftAddress}?a=${selectedNft.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-400 hover:text-teal-300"
                    >
                      View on Etherscan
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

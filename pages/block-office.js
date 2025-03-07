import { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { ethers } from 'ethers';
import BlockOfficeABI from '../contracts/abis/BlockOfficeABI.json';
import FilmTokenABI from '../contracts/abis/FilmTokenABI.json';

export default function BlockOffice() {
  const { account, provider, isConnected, connectWallet } = useWeb3();
  const [films, setFilms] = useState([]);
  const [myFilms, setMyFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [tokenAllowance, setTokenAllowance] = useState('0');
  const [activeTab, setActiveTab] = useState('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('all');
  const [showAddFilmModal, setShowAddFilmModal] = useState(false);
  const [showWatchModal, setShowWatchModal] = useState(false);
  const [filmFormData, setFilmFormData] = useState({
    title: '',
    description: '',
    ipfsHash: '',
    contentHash: '',
    price: '',
    genre: 'drama'
  });
  
  const blockOfficeAddress = process.env.NEXT_PUBLIC_BLOCK_OFFICE_ADDRESS;
  const filmTokenAddress = process.env.NEXT_PUBLIC_FILM_TOKEN_ADDRESS;
  
  useEffect(() => {
    if (isConnected && provider) {
      fetchFilms();
      checkSubscription();
      fetchTokenBalance();
      fetchTokenAllowance();
    }
  }, [isConnected, provider]);
  
  const fetchFilms = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(blockOfficeAddress, BlockOfficeABI, provider);
      
      try {
        const data = await contract.getListedFilms();
        
        const items = data.map(i => ({
          id: i.id.toNumber(),
          creator: i.creator,
          title: i.title,
          description: i.description,
          ipfsHash: i.ipfsHash,
          contentHash: i.contentHash,
          price: ethers.utils.formatEther(i.price),
          isListed: i.isListed,
          createdAt: new Date(i.createdAt.toNumber() * 1000),
          genre: getFilmGenre(i.title, i.description)
        }));
        
        setFilms(items);
        
        // Filter films created by the current user
        const userFilms = items.filter(film => film.creator.toLowerCase() === account.toLowerCase());
        setMyFilms(userFilms);
      } catch (error) {
        console.error("Contract call failed, using mock data:", error);
        // Use mock data if contract call fails
        const mockFilms = getMockFilms();
        setFilms(mockFilms);
        
        // Filter mock films created by the current user
        const userFilms = mockFilms.filter(film => film.creator.toLowerCase() === account.toLowerCase());
        setMyFilms(userFilms);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching films:", error);
      setLoading(false);
    }
  };
  
  const getMockFilms = () => {
    return [
      {
        id: 1,
        creator: account || "0x1234567890123456789012345678901234567890",
        title: "The Last Sunset",
        description: "A retired gunslinger is forced to pick up his weapons one last time when his family is threatened by a gang of outlaws.",
        ipfsHash: "QmXyZ123",
        contentHash: "QmContent123",
        price: "50",
        isListed: true,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        genre: "western"
      },
      {
        id: 2,
        creator: "0x2345678901234567890123456789012345678901",
        title: "Echoes of Tomorrow",
        description: "In a world where memories can be transferred between people, a detective must solve a murder by experiencing the victim's final moments.",
        ipfsHash: "QmAbC456",
        contentHash: "QmContent456",
        price: "75",
        isListed: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        genre: "sci-fi"
      },
      {
        id: 3,
        creator: "0x3456789012345678901234567890123456789012",
        title: "Whispers in the Dark",
        description: "A young woman inherits an old mansion only to discover it's haunted by spirits with unfinished business.",
        ipfsHash: "QmDeF789",
        contentHash: "QmContent789",
        price: "60",
        isListed: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        genre: "horror"
      },
      {
        id: 4,
        creator: "0x4567890123456789012345678901234567890123",
        title: "Love in Paris",
        description: "Two strangers meet by chance in Paris and spend a magical weekend together that changes their lives forever.",
        ipfsHash: "QmGhI012",
        contentHash: "QmContent012",
        price: "45",
        isListed: true,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        genre: "romance"
      },
      {
        id: 5,
        creator: "0x5678901234567890123456789012345678901234",
        title: "The Heist",
        description: "A team of skilled thieves attempt to pull off the biggest bank robbery in history, but not everything goes according to plan.",
        ipfsHash: "QmJkL345",
        contentHash: "QmContent345",
        price: "65",
        isListed: true,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        genre: "action"
      }
    ];
  };
  
  const getFilmGenre = (title, description) => {
    const text = (title + " " + description).toLowerCase();
    
    if (text.includes("murder") || text.includes("detective") || text.includes("crime") || text.includes("mystery")) {
      return "thriller";
    } else if (text.includes("alien") || text.includes("future") || text.includes("space") || text.includes("robot")) {
      return "sci-fi";
    } else if (text.includes("ghost") || text.includes("haunt") || text.includes("spirit") || text.includes("scary")) {
      return "horror";
    } else if (text.includes("love") || text.includes("romance") || text.includes("relationship")) {
      return "romance";
    } else if (text.includes("gun") || text.includes("fight") || text.includes("battle") || text.includes("war")) {
      return "action";
    } else if (text.includes("laugh") || text.includes("funny") || text.includes("comedy")) {
      return "comedy";
    } else if (text.includes("west") || text.includes("cowboy") || text.includes("outlaw")) {
      return "western";
    } else {
      return "drama";
    }
  };
  
  const checkSubscription = async () => {
    try {
      const contract = new ethers.Contract(blockOfficeAddress, BlockOfficeABI, provider);
      
      try {
        const hasActive = await contract.hasActiveSubscription(account);
        setHasSubscription(hasActive);
        
        if (hasActive) {
          const subscription = await contract.subscriptions(account);
          setSubscriptionDetails({
            startTime: new Date(subscription.startTime.toNumber() * 1000),
            endTime: new Date(subscription.endTime.toNumber() * 1000)
          });
        }
      } catch (error) {
        console.error("Contract call failed, using mock subscription:", error);
        // Use mock subscription if contract call fails
        setHasSubscription(true);
        setSubscriptionDetails({
          startTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        });
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };
  
  const fetchTokenBalance = async () => {
    try {
      const tokenContract = new ethers.Contract(filmTokenAddress, FilmTokenABI, provider);
      try {
        const balance = await tokenContract.balanceOf(account);
        setTokenBalance(ethers.utils.formatEther(balance));
      } catch (error) {
        console.error("Contract call failed, using mock balance:", error);
        // Use mock balance if contract call fails
        setTokenBalance("1000");
      }
    } catch (error) {
      console.error("Error fetching token balance:", error);
    }
  };
  
  const fetchTokenAllowance = async () => {
    try {
      const tokenContract = new ethers.Contract(filmTokenAddress, FilmTokenABI, provider);
      try {
        const allowance = await tokenContract.allowance(account, blockOfficeAddress);
        setTokenAllowance(ethers.utils.formatEther(allowance));
      } catch (error) {
        console.error("Contract call failed, using mock allowance:", error);
        // Use mock allowance if contract call fails
        setTokenAllowance("500");
      }
    } catch (error) {
      console.error("Error fetching token allowance:", error);
    }
  };
  
  const handleApproveTokens = async () => {
    try {
      const signer = provider.getSigner();
      const tokenContract = new ethers.Contract(filmTokenAddress, FilmTokenABI, signer);
      
      const tx = await tokenContract.approve(
        blockOfficeAddress, 
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
  
  const purchaseFilm = async (film) => {
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(blockOfficeAddress, BlockOfficeABI, signer);
      
      const tx = await contract.purchaseFilm(film.id);
      await tx.wait();
      
      alert("Film purchased successfully!");
      fetchTokenBalance();
      setShowWatchModal(true);
    } catch (error) {
      console.error("Error purchasing film:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const purchaseSubscription = async () => {
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(blockOfficeAddress, BlockOfficeABI, signer);
      
      const tx = await contract.purchaseSubscription();
      await tx.wait();
      
      alert("Subscription purchased successfully!");
      checkSubscription();
      fetchTokenBalance();
    } catch (error) {
      console.error("Error purchasing subscription:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const getFilmContent = async (film) => {
    try {
      const contract = new ethers.Contract(blockOfficeAddress, BlockOfficeABI, provider);
      
      const contentHash = await contract.getFilmContent(film.id);
      
      // In a real app, this would redirect to the content or play it
      setShowWatchModal(true);
    } catch (error) {
      console.error("Error getting film content:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleAddFilm = async () => {
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(blockOfficeAddress, BlockOfficeABI, signer);
      
      const tx = await contract.addFilm(
        filmFormData.title,
        filmFormData.description,
        filmFormData.ipfsHash,
        filmFormData.contentHash,
        ethers.utils.parseEther(filmFormData.price)
      );
      await tx.wait();
      
      alert("Film added successfully!");
      fetchFilms();
      setShowAddFilmModal(false);
      setFilmFormData({
        title: '',
        description: '',
        ipfsHash: '',
        contentHash: '',
        price: '',
        genre: 'drama'
      });
    } catch (error) {
      console.error("Error adding film:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleUpdateFilm = async (film, isListed) => {
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(blockOfficeAddress, BlockOfficeABI, signer);
      
      const tx = await contract.updateFilm(
        film.id,
        film.title,
        film.description,
        film.ipfsHash,
        ethers.utils.parseEther(film.price),
        isListed
      );
      await tx.wait();
      
      alert(`Film ${isListed ? 'listed' : 'unlisted'} successfully!`);
      fetchFilms();
    } catch (error) {
      console.error("Error updating film:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleFilmSelect = (film) => {
    setSelectedFilm(film);
  };
  
  const handleFilmFormChange = (e) => {
    const { name, value } = e.target;
    setFilmFormData({
      ...filmFormData,
      [name]: value
    });
  };
  
  const filteredFilms = films.filter(film => {
    const matchesSearch = film.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         film.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGenre = filterGenre === 'all' || film.genre === filterGenre;
    
    return matchesSearch && matchesGenre;
  });
  
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Block Office</h1>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Watch exclusive indie films supported by the FILM Chain community. Subscribe for unlimited access or purchase individual films.
          </p>
        </div>
        
        {!isConnected ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-6">Connect your wallet to access films</p>
            <button 
              onClick={connectWallet}
              className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-3 rounded-md text-lg font-medium"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-gray-900 rounded-lg p-6 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Subscription Status</h2>
                  {hasSubscription ? (
                    <div>
                      <p className="text-green-400 mb-1">Active Subscription</p>
                      <p className="text-gray-400">
                        Valid until: {subscriptionDetails?.endTime.toLocaleDateString()} 
                        ({Math.ceil((subscriptionDetails?.endTime - new Date()) / (1000 * 60 * 60 * 24))} days left)
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400">No active subscription</p>
                  )}
                </div>
                
                <div className="mt-4 md:mt-0">
                  <div className="text-gray-400 mb-2">
                    Balance: <span className="text-teal-400">{parseFloat(tokenBalance).toFixed(2)} FILM</span>
                  </div>
                  
                  {!hasSubscription && (
                    parseFloat(tokenAllowance) < 100 ? (
                      <button
                        onClick={handleApproveTokens}
                        className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-md"
                      >
                        Approve FILM Tokens
                      </button>
                    ) : (
                      <button
                        onClick={purchaseSubscription}
                        className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-md"
                      >
                        Subscribe Now
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mb-8">
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'browse'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Browse Films
              </button>
              <button
                onClick={() => setActiveTab('my-films')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'my-films'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                My Films
              </button>
              <button
                onClick={() => setShowAddFilmModal(true)}
                className="px-4 py-2 rounded-md bg-gradient-to-r from-teal-500 to-blue-500 text-white"
              >
                Add New Film
              </button>
            </div>
            
            {activeTab === 'browse' && (
              <div>
                <div className="mb-8 bg-gray-900 p-6 rounded-lg">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label htmlFor="search" className="block text-sm font-medium text-gray-400 mb-2">
                        Search Films
                      </label>
                      <input
                        type="text"
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Search by title or description"
                      />
                    </div>
                    <div>
                      <label htmlFor="genre" className="block text-sm font-medium text-gray-400 mb-2">
                        Genre
                      </label>
                      <select
                        id="genre"
                        value={filterGenre}
                        onChange={(e) => setFilterGenre(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="all">All Genres</option>
                        <option value="action">Action</option>
                        <option value="comedy">Comedy</option>
                        <option value="drama">Drama</option>
                        <option value="horror">Horror</option>
                        <option value="romance">Romance</option>
                        <option value="sci-fi">Sci-Fi</option>
                        <option value="thriller">Thriller</option>
                        <option value="western">Western</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-white">Featured Films</h2>
                      <span className="text-gray-400">{filteredFilms.length} films found</span>
                    </div>
                    
                    {loading ? (
                      <div className="text-center py-12">
                        <p className="text-gray-400">Loading films...</p>
                      </div>
                    ) : filteredFilms.length === 0 ? (
                      <div className="text-center py-12 bg-gray-900 rounded-lg">
                        <p className="text-gray-400">No films available</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {filteredFilms.map((film) => (
                          <div 
                            key={film.id} 
                            className={`bg-gray-900 rounded-lg overflow-hidden cursor-pointer transition duration-200 ${selectedFilm?.id === film.id ? 'ring-2 ring-teal-500' : ''}`}
                            onClick={() => handleFilmSelect(film)}
                          >
                            <div className="aspect-w-16 aspect-h-9 bg-gray-800">
                              {film.ipfsHash ? (
                                <img 
                                  src={`https://ipfs.io/ipfs/${film.ipfsHash}`} 
                                  alt={film.title} 
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full bg-gray-800">
                                  <span className="text-gray-500 text-4xl">🎬</span>
                                </div>
                              )}
                              <div className="absolute top-2 right-2">
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                  film.genre === 'action' ? 'bg-red-900 text-red-300' :
                                  film.genre === 'comedy' ? 'bg-yellow-900 text-yellow-300' :
                                  film.genre === 'drama' ? 'bg-blue-900 text-blue-300' :
                                  film.genre === 'horror' ? 'bg-purple-900 text-purple-300' :
                                  film.genre === 'romance' ? 'bg-pink-900 text-pink-300' :
                                  film.genre === 'sci-fi' ? 'bg-green-900 text-green-300' :
                                  film.genre === 'thriller' ? 'bg-indigo-900 text-indigo-300' :
                                  film.genre === 'western' ? 'bg-orange-900 text-orange-300' :
                                  'bg-gray-700 text-gray-300'
                                }`}>
                                  {film.genre.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                              </div>
                            </div>
                            <div className="p-4">
                              <h3 className="text-lg font-bold text-white mb-2">{film.title}</h3>
                              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{film.description}</p>
                              <div className="flex justify-between items-center">
                                <span className="text-teal-400 font-medium">{film.price} FILM</span>
                                {hasSubscription ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      getFilmContent(film);
                                    }}
                                    className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded-md text-sm"
                                  >
                                    Watch Now
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (parseFloat(tokenAllowance) < parseFloat(film.price)) {
                                        handleApproveTokens();
                                      } else {
                                        purchaseFilm(film);
                                      }
                                    }}
                                    className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded-md text-sm"
                                  >
                                    {parseFloat(tokenAllowance) < parseFloat(film.price) ? 'Approve' : 'Purchase'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    {selectedFilm ? (
                      <div className="bg-gray-900 rounded-lg overflow-hidden sticky top-4">
                        <div className="aspect-w-16 aspect-h-9 bg-gray-800">
                          {selectedFilm.ipfsHash ? (
                            <img 
                              src={`https://ipfs.io/ipfs/${selectedFilm.ipfsHash}`} 
                              alt={selectedFilm.title} 
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-gray-800">
                              <span className="text-gray-500 text-4xl">🎬</span>
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              selectedFilm.genre === 'action' ? 'bg-red-900 text-red-300' :
                              selectedFilm.genre === 'comedy' ? 'bg-yellow-900 text-yellow-300' :
                              selectedFilm.genre === 'drama' ? 'bg-blue-900 text-blue-300' :
                              selectedFilm.genre === 'horror' ? 'bg-purple-900 text-purple-300' :
                              selectedFilm.genre === 'romance' ? 'bg-pink-900 text-pink-300' :
                              selectedFilm.genre === 'sci-fi' ? 'bg-green-900 text-green-300' :
                              selectedFilm.genre === 'thriller' ? 'bg-indigo-900 text-indigo-300' :
                              selectedFilm.genre === 'western' ? 'bg-orange-900 text-orange-300' :
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {selectedFilm.genre.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        </div>
                        <div className="p-6">
                          <h2 className="text-2xl font-bold text-white mb-2">{selectedFilm.title}</h2>
                          <p className="text-gray-400 mb-6">{selectedFilm.description}</p>
                          
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-3">Details</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Creator</span>
                                <span className="text-white">{selectedFilm.creator.substring(0, 6)}...{selectedFilm.creator.substring(selectedFilm.creator.length - 4)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Added On</span>
                                <span className="text-white">{selectedFilm.createdAt.toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Price</span>
                                <span className="text-teal-400 font-medium">{selectedFilm.price} FILM</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Genre</span>
                                <span className="text-white capitalize">{selectedFilm.genre}</span>
                              </div>
                            </div>
                          </div>
                          
                          {hasSubscription ? (
                            <button
                              onClick={() => getFilmContent(selectedFilm)}
                              className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 rounded-md font-medium"
                            >
                              Watch Now
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (parseFloat(tokenAllowance) < parseFloat(selectedFilm.price)) {
                                  handleApproveTokens();
                                } else {
                                  purchaseFilm(selectedFilm);
                                }
                              }}
                              className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 rounded-md font-medium"
                            >
                              {parseFloat(tokenAllowance) < parseFloat(selectedFilm.price) ? 'Approve FILM Tokens' : 'Purchase Film'}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-900 rounded-lg p-6 text-center">
                        <p className="text-gray-400">Select a film to view details</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'my-films' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">My Films</h2>
                
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Loading films...</p>
                  </div>
                ) : myFilms.length === 0 ? (
                  <div className="text-center py-12 bg-gray-900 rounded-lg">
                    <p className="text-gray-400">You haven't added any films yet</p>
                    <button
                      onClick={() => setShowAddFilmModal(true)}
                      className="mt-4 bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-md"
                    >
                      Add Your First Film
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myFilms.map((film) => (
                      <div key={film.id} className="bg-gray-900 rounded-lg overflow-hidden">
                        <div className="aspect-w-16 aspect-h-9 bg-gray-800">
                          {film.ipfsHash ? (
                            <img 
                              src={`https://ipfs.io/ipfs/${film.ipfsHash}`} 
                              alt={film.title} 
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-gray-800">
                              <span className="text-gray-500 text-4xl">🎬</span>
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              film.genre === 'action' ? 'bg-red-900 text-red-300' :
                              film.genre === 'comedy' ? 'bg-yellow-900 text-yellow-300' :
                              film.genre === 'drama' ? 'bg-blue-900 text-blue-300' :
                              film.genre === 'horror' ? 'bg-purple-900 text-purple-300' :
                              film.genre === 'romance' ? 'bg-pink-900 text-pink-300' :
                              film.genre === 'sci-fi' ? 'bg-green-900 text-green-300' :
                              film.genre === 'thriller' ? 'bg-indigo-900 text-indigo-300' :
                              film.genre === 'western' ? 'bg-orange-900 text-orange-300' :
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {film.genre.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-bold text-white mb-2">{film.title}</h3>
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{film.description}</p>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-teal-400 font-medium">{film.price} FILM</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${film.isListed ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                              {film.isListed ? 'Listed' : 'Unlisted'}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUpdateFilm(film, !film.isListed)}
                              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-md text-sm"
                            >
                              {film.isListed ? 'Unlist' : 'List'}
                            </button>
                            <button
                              onClick={() => getFilmContent(film)}
                              className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 text-white py-2 rounded-md text-sm"
                            >
                              Preview
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Add Film Modal */}
            {showAddFilmModal && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-xl font-bold text-white mb-4">Add New Film</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={filmFormData.title}
                        onChange={handleFilmFormChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Film title"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-2">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={filmFormData.description}
                        onChange={handleFilmFormChange}
                        rows="4"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Film description"
                      ></textarea>
                    </div>
                    
                    <div>
                      <label htmlFor="ipfsHash" className="block text-sm font-medium text-gray-400 mb-2">
                        IPFS Hash (for poster)
                      </label>
                      <input
                        type="text"
                        id="ipfsHash"
                        name="ipfsHash"
                        value={filmFormData.ipfsHash}
                        onChange={handleFilmFormChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="IPFS hash for film poster"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="contentHash" className="block text-sm font-medium text-gray-400 mb-2">
                        Content Hash (for film content)
                      </label>
                      <input
                        type="text"
                        id="contentHash"
                        name="contentHash"
                        value={filmFormData.contentHash}
                        onChange={handleFilmFormChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="IPFS hash for film content"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-400 mb-2">
                        Price (FILM)
                      </label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={filmFormData.price}
                        onChange={handleFilmFormChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Price in FILM tokens"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="genre" className="block text-sm font-medium text-gray-400 mb-2">
                        Genre
                      </label>
                      <select
                        id="genre"
                        name="genre"
                        value={filmFormData.genre}
                        onChange={handleFilmFormChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="action">Action</option>
                        <option value="comedy">Comedy</option>
                        <option value="drama">Drama</option>
                        <option value="horror">Horror</option>
                        <option value="romance">Romance</option>
                        <option value="sci-fi">Sci-Fi</option>
                        <option value="thriller">Thriller</option>
                        <option value="western">Western</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={handleAddFilm}
                      className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 text-white py-2 rounded-md font-medium"
                      disabled={!filmFormData.title || !filmFormData.description || !filmFormData.contentHash || !filmFormData.price}
                    >
                      Add Film
                    </button>
                    <button
                      onClick={() => setShowAddFilmModal(false)}
                      className="flex-1 bg-gray-800 text-gray-400 py-2 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Watch Film Modal */}
            {showWatchModal && selectedFilm && (
              <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 rounded-lg overflow-hidden max-w-4xl w-full">
                  <div className="aspect-w-16 aspect-h-9 bg-black">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-white text-6xl mb-4">🎬</span>
                      <h3 className="text-xl font-bold text-white mb-2">{selectedFilm.title}</h3>
                      <p className="text-gray-400 text-center max-w-md mb-6">
                        In a real application, the film would play here using the content hash: 
                        <span className="text-teal-400 block mt-2">{selectedFilm.contentHash}</span>
                      </p>
                      <button
                        onClick={() => setShowWatchModal(false)}
                        className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-md"
                      >
                        Close Player
                      </button>
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

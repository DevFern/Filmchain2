import { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { ethers } from 'ethers';
import BlockOfficeABI from '../contracts/abis/BlockOfficeABI.json';
import FilmTokenABI from '../contracts/abis/FilmTokenABI.json';

export default function BlockOffice() {
  const { account, provider, isConnected, connectWallet } = useWeb3();
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [tokenAllowance, setTokenAllowance] = useState('0');
  
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
        createdAt: new Date(i.createdAt.toNumber() * 1000)
      }));
      
      setFilms(items);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching films:", error);
      setLoading(false);
    }
  };
  
  const checkSubscription = async () => {
    try {
      const contract = new ethers.Contract(blockOfficeAddress, BlockOfficeABI, provider);
      
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
      console.error("Error checking subscription:", error);
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
      const allowance = await tokenContract.allowance(account, blockOfficeAddress);
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
      alert(`Content hash: ${contentHash}`);
    } catch (error) {
      console.error("Error getting film content:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleFilmSelect = (film) => {
    setSelectedFilm(film);
  };
  
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
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-white mb-6">Featured Films</h2>
                
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Loading films...</p>
                  </div>
                ) : films.length === 0 ? (
                  <div className="text-center py-12 bg-gray-900 rounded-lg">
                    <p className="text-gray-400">No films available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {films.map((film) => (
                      <div 
                        key={film.id} 
                        className={`bg-gray-900 rounded-lg overflow-hidden cursor-pointer transition duration-200 ${selectedFilm?.id === film.id ? 'ring-2 ring-teal-500' : ''}`}
                        onClick={() => handleFilmSelect(film)}
                      >
                        <div className="aspect-w-16 aspect-h-9 bg-gray-800">
                          {film.ipfsHash && (
                            <img 
                              src={`https://ipfs.io/ipfs/${film.ipfsHash}`} 
                              alt={film.title} 
                              className="object-cover w-full h-full"
                            />
                          )}
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
                      {selectedFilm.ipfsHash && (
                        <img 
                          src={`https://ipfs.io/ipfs/${selectedFilm.ipfsHash}`} 
                          alt={selectedFilm.title} 
                          className="object-cover w-full h-full"
                        />
                      )}
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
      </div>
    </div>
  );
}

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

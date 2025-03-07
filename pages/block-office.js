import { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { ethers } from 'ethers';
import BlockOfficeABI from '../contracts/abis/BlockOfficeABI.json';
import FilmTokenABI from '../contracts/abis/FilmTokenABI.json';
import Image from 'next/image';

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
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [filmFormData, setFilmFormData] = useState({
    title: '',
    description: '',
    ipfsHash: '',
    contentHash: '',
    price: '',
    genre: 'drama',
    director: '',
    cast: '',
    duration: '',
    releaseYear: new Date().getFullYear()
  });
  
  const blockOfficeAddress = process.env.NEXT_PUBLIC_BLOCK_OFFICE_ADDRESS;
  const filmTokenAddress = process.env.NEXT_PUBLIC_FILM_TOKEN_ADDRESS;
  
  useEffect(() => {
    if (isConnected && provider) {
      fetchFilms();
      checkSubscription();
      fetchTokenBalance();
      fetchTokenAllowance();
    } else {
      // Load mock data even when not connected
      const mockFilms = getMockFilms();
      setFilms(mockFilms);
      setLoading(false);
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
          genre: getFilmGenre(i.title, i.description),
          director: getRandomDirector(),
          cast: getRandomCast(),
          duration: getRandomDuration(),
          releaseYear: 2023,
          rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3.0 and 5.0
          reviews: getRandomReviews(),
          watchCount: Math.floor(Math.random() * 1000),
          poster: getRandomPoster()
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
  
  const getRandomDirector = () => {
    const directors = [
      "Ava DuVernay", "Christopher Nolan", "Greta Gerwig", "Denis Villeneuve", 
      "Bong Joon-ho", "Chloé Zhao", "Jordan Peele", "Taika Waititi",
      "Sofia Coppola", "Ryan Coogler", "Wes Anderson", "Kathryn Bigelow"
    ];
    return directors[Math.floor(Math.random() * directors.length)];
  };
  
  const getRandomCast = () => {
    const actors = [
      "Florence Pugh", "Daniel Kaluuya", "Zendaya", "Timothée Chalamet", 
      "Lupita Nyong'o", "John David Washington", "Saoirse Ronan", "Steven Yeun",
      "Anya Taylor-Joy", "LaKeith Stanfield", "Awkwafina", "Dev Patel"
    ];
    
    // Get 2-4 random actors
    const numActors = Math.floor(Math.random() * 3) + 2;
    const cast = [];
    
    for (let i = 0; i < numActors; i++) {
      const actor = actors[Math.floor(Math.random() * actors.length)];
      if (!cast.includes(actor)) {
        cast.push(actor);
      }
    }
    
    return cast.join(", ");
  };
  
  const getRandomDuration = () => {
    // Generate a random duration between 75 and 150 minutes
    const minutes = Math.floor(Math.random() * 76) + 75;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };
  
  const getRandomReviews = () => {
    const reviewTexts = [
      "A masterpiece of modern cinema. The cinematography is breathtaking.",
      "Compelling storytelling with outstanding performances from the entire cast.",
      "An emotional journey that stays with you long after the credits roll.",
      "Innovative and thought-provoking. A fresh take on the genre.",
      "The director's vision shines through in every frame. Truly remarkable.",
      "A powerful film that challenges conventions and expectations.",
      "Visually stunning with a soundtrack that perfectly complements the narrative.",
      "Character development is exceptional, drawing you into their world completely.",
      "A bold artistic statement that pushes boundaries in all the right ways.",
      "Immersive storytelling at its finest. I was captivated from start to finish."
    ];
    
    const reviewers = [
      "FilmCritic2023", "CinemaLover", "IndieFilmBuff", "MovieEnthusiast", 
      "ScreenAnalyst", "FilmJourney", "CelluloidDreamer", "ReelReviewer",
      "CinephileExtraordinaire", "FrameByFrame"
    ];
    
    // Generate 0-3 random reviews
    const numReviews = Math.floor(Math.random() * 4);
    const reviews = [];
    
    for (let i = 0; i < numReviews; i++) {
      const reviewText = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
      const reviewer = reviewers[Math.floor(Math.random() * reviewers.length)];
      const rating = (Math.random() * 2 + 3).toFixed(1); // Random rating between 3.0 and 5.0
      
      reviews.push({
        text: reviewText,
        reviewer: reviewer,
        rating: rating,
        date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
      });
    }
    
    return reviews;
  };
  
  const getRandomPoster = () => {
    // These would be placeholder images in your public folder
    const posters = [
      "/images/film1.jpg",
      "/images/film2.jpg",
      "/images/film3.jpg",
      "/images/film4.jpg",
      "/images/film5.jpg",
      "/images/film6.jpg",
      "/images/film7.jpg",
      "/images/film8.jpg",
    ];
    
    return posters[Math.floor(Math.random() * posters.length)];
  };
  
  const getMockFilms = () => {
    return [
      {
        id: 1,
        creator: account || "0x1234567890123456789012345678901234567890",
        title: "The Last Sunset",
        description: "A retired gunslinger is forced to pick up his weapons one last time when his family is threatened by a gang of outlaws in this modern western set against the backdrop of a dying mining town.",
        ipfsHash: "QmXyZ123",
        contentHash: "QmContent123",
        price: "50",
        isListed: true,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        genre: "western",
        director: "Clint Eastwood",
        cast: "Timothy Olyphant, Hailee Steinfeld, Idris Elba",
        duration: "2h 12m",
        releaseYear: 2023,
        rating: "4.7",
        watchCount: 842,
        poster: "/images/film1.jpg",
        reviews: [
          {
            text: "A stunning revival of the western genre with modern sensibilities. The cinematography captures the harsh beauty of the landscape.",
            reviewer: "WesternFan",
            rating: "4.8",
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
          },
          {
            text: "Olyphant delivers a career-defining performance. The tension builds masterfully to an explosive finale.",
            reviewer: "CinematicVision",
            rating: "4.5",
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          }
        ]
      },
      {
        id: 2,
        creator: "0x2345678901234567890123456789012345678901",
        title: "Echoes of Tomorrow",
        description: "In a world where memories can be transferred between people, a detective must solve a murder by experiencing the victim's final moments. As she delves deeper into the case, she uncovers a conspiracy that threatens to destroy the fabric of society.",
        ipfsHash: "QmAbC456",
        contentHash: "QmContent456",
        price: "75",
        isListed: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        genre: "sci-fi",
        director: "Denis Villeneuve",
        cast: "Tessa Thompson, Oscar Isaac, Rinko Kikuchi",
        duration: "2h 28m",
        releaseYear: 2023,
        rating: "4.9",
        watchCount: 1247,
        poster: "/images/film2.jpg",
        reviews: [
          {
            text: "A mind-bending sci-fi masterpiece that asks profound questions about identity and consciousness.",
            reviewer: "FutureThinker",
            rating: "5.0",
            date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
          },
          {
            text: "Visually stunning with a complex narrative that rewards multiple viewings.",
            reviewer: "SciFiEnthusiast",
            rating: "4.7",
            date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)
          }
        ]
      },
      {
        id: 3,
        creator: "0x3456789012345678901234567890123456789012",
        title: "Whispers in the Dark",
        description: "A young woman inherits an old mansion only to discover it's haunted by spirits with unfinished business. As she unravels the house's dark history, she realizes her own connection to the supernatural events unfolding around her.",
        ipfsHash: "QmDeF789",
        contentHash: "QmContent789",
        price: "60",
        isListed: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        genre: "horror",
        director: "Ari Aster",
        cast: "Anya Taylor-Joy, Thomasin McKenzie, Willem Dafoe",
        duration: "1h 56m",
        releaseYear: 2023,
        rating: "4.5",
        watchCount: 936,
        poster: "/images/film3.jpg",
        reviews: [
          {
            text: "Genuinely terrifying with atmosphere that seeps into your bones. Taylor-Joy continues to prove herself as one of the best actors of her generation.",
            reviewer: "HorrorAficionado",
            rating: "4.6",
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          }
        ]
      },
      {
        id: 4,
        creator: "0x4567890123456789012345678901234567890123",
        title: "Love in Paris",
        description: "Two strangers meet by chance in Paris and spend a magical weekend together that changes their lives forever. Years later, fate brings them together again, but circumstances have changed dramatically for both of them.",
        ipfsHash: "QmGhI012",
        contentHash: "QmContent012",
        price: "45",
        isListed: true,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        genre: "romance",
        director: "Sofia Coppola",
        cast: "Timothée Chalamet, Zendaya",
        duration: "1h 48m",
        releaseYear: 2023,
        rating: "4.3",
        watchCount: 1532,
        poster: "/images/film4.jpg",
        reviews: [
          {
            text: "A beautifully shot love letter to Paris and the ephemeral nature of connection. The chemistry between the leads is palpable.",
            reviewer: "RomanticSoul",
            rating: "4.5",
            date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
          }
        ]
      },
      {
        id: 5,
        creator: "0x5678901234567890123456789012345678901234",
        title: "The Heist",
        description: "A team of skilled thieves attempt to pull off the biggest bank robbery in history, but not everything goes according to plan. Double-crosses, unexpected complications, and a determined detective threaten to unravel their perfect crime.",
        ipfsHash: "QmJkL345",
        contentHash: "QmContent345",
        price: "65",
        isListed: true,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        genre: "action",
        director: "Steve McQueen",
        cast: "Daniel Kaluuya, Lakeith Stanfield, Florence Pugh, Brian Tyree Henry",
        duration: "2h 8m",
        releaseYear: 2023,
        rating: "4.6",
        watchCount: 1105,
        poster: "/images/film5.jpg",
        reviews: [
          {
            text: "A tense, perfectly executed thriller with outstanding performances from the entire ensemble cast.",
            reviewer: "ActionJunkie",
            rating: "4.7",
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    ];
  };
  
  const getFilmGenre = (title, description) => {
    const text = (title + " " + description).toLowerCase();
    
    if (text.includes("murder") || text.includes("detective") || text.includes("crime") || text.includes("mystery")) {
      return "thriller";
    } else if (text.includes("alien") || text.includes("future") || text.includes("space") || text.includes("robot") || text.includes("sci-fi")) {
      return "sci-fi";
    } else if (text.includes("ghost") || text.includes("haunt") || text.includes("spirit") || text.includes("scary") || text.includes("horror")) {
      return "horror";
    } else if (text.includes("love") || text.includes("romance") || text.includes("relationship")) {
      return "romance";
    } else if (text.includes("gun") || text.includes("fight") || text.includes("battle") || text.includes("war") || text.includes("heist")) {
      return "action";
    } else if (text.includes("laugh") || text.includes("funny") || text.includes("comedy")) {
      return "comedy";
    } else if (text.includes("west") || text.includes("cowboy") || text.includes("outlaw")) {
      return "western";
    } else if (text.includes("documentary") || text.includes("true story")) {
      return "documentary";
    } else {
      return "drama";
    }
  };
  
  const handleSubmitReview = () => {
    if (!selectedFilm || !reviewText || reviewRating < 1) return;
    
    // In a real app, this would submit to the blockchain
    // For now, we'll just update the local state
    const newReview = {
      text: reviewText,
      reviewer: "You",
      rating: reviewRating.toString(),
      date: new Date()
    };
    
    const updatedFilms = films.map(film => {
      if (film.id === selectedFilm.id) {
        const updatedReviews = [...(film.reviews || []), newReview];
        const totalRating = updatedReviews.reduce((sum, review) => sum + parseFloat(review.rating), 0);
        const newRating = (totalRating / updatedReviews.length).toFixed(1);
        
        return {
          ...film,
          reviews: updatedReviews,
          rating: newRating
        };
      }
      return film;
    });
    
    setFilms(updatedFilms);
    setSelectedFilm({
      ...selectedFilm,
      reviews: [...(selectedFilm.reviews || []), newReview],
      rating: ((selectedFilm.reviews || []).reduce((sum, review) => sum + parseFloat(review.rating), parseFloat(reviewRating)) / 
              ((selectedFilm.reviews || []).length + 1)).toFixed(1)
    });
    
    setReviewText('');
    setReviewRating(5);
    setShowReviewModal(false);
    
    alert("Review submitted successfully!");
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
      // For demo purposes, just show the watch modal
      setShowWatchModal(true);
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
      // For demo purposes, set subscription to true
      setHasSubscription(true);
      setSubscriptionDetails({
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
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
      // For demo purposes, just show the watch modal
      setShowWatchModal(true);
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
            <p className="text-gray-400 mb-6">Connect your wallet to access all features</p>
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
                      <p className="text-gray-400 text-sm">
                        Valid until: {subscriptionDetails?.endTime.toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400">No active subscription</p>
                  )}
                </div>
                
                <div className="mt-4 md:mt-0">
                  <div className="flex items-center mb-2">
                    <span className="text-gray-400 mr-2">FILM Balance:</span>
                    <span className="text-teal-400 font-medium">{tokenBalance} FILM</span>
                  </div>
                  
                  {!hasSubscription && (
                    <button
                      onClick={purchaseSubscription}
                      className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-md"
                    >
                      Subscribe (100 FILM/month)
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex border-b border-gray-800 mb-8">
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === 'browse' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-400'
                }`}
                onClick={() => setActiveTab('browse')}
              >
                Browse Films
              </button>
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === 'my-films' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-400'
                }`}
                onClick={() => setActiveTab('my-films')}
              >
                My Films
              </button>
            </div>
            
            {activeTab === 'browse' && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                  <div className="w-full md:w-1/2 mb-4 md:mb-0">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search films..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <div className="absolute left-3 top-2.5 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-auto flex space-x-2">
                    <select
                      value={filterGenre}
                      onChange={(e) => setFilterGenre(e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="all">All Genres</option>
                      <option value="action">Action</option>
                      <option value="comedy">Comedy</option>
                      <option value="drama">Drama</option>
                      <option value="documentary">Documentary</option>
                      <option value="horror">Horror</option>
                      <option value="romance">Romance</option>
                      <option value="sci-fi">Sci-Fi</option>
                      <option value="thriller">Thriller</option>
                      <option value="western">Western</option>
                    </select>
                    
                    {isConnected && (
                      <button
                        onClick={() => setShowAddFilmModal(true)}
                        className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded-md whitespace-nowrap"
                      >Add Film
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {loading ? (
                    Array(8).fill().map((_, index) => (
                      <div key={index} className="bg-gray-900 rounded-lg overflow-hidden animate-pulse">
                        <div className="aspect-w-2 aspect-h-3 bg-gray-800"></div>
                        <div className="p-4">
                          <div className="h-6 bg-gray-800 rounded mb-3"></div>
                          <div className="h-4 bg-gray-800 rounded mb-2"></div>
                          <div className="h-4 bg-gray-800 rounded mb-2 w-3/4"></div>
                          <div className="h-8 bg-gray-800 rounded mt-4"></div>
                        </div>
                      </div>
                    ))
                  ) : filteredFilms.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-gray-900 rounded-lg">
                      <p className="text-gray-400">No films found matching your search</p>
                    </div>
                  ) : (
                    filteredFilms.map((film) => (
                      <div 
                        key={film.id} 
                        className="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                        onClick={() => handleFilmSelect(film)}
                      >
                        <div className="aspect-w-2 aspect-h-3 bg-gray-800 relative">
                          {film.poster ? (
                            <img 
                              src={film.poster} 
                              alt={film.title} 
                              className="object-cover w-full h-full"
                            />
                          ) : film.ipfsHash ? (
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
                              film.genre === 'documentary' ? 'bg-green-900 text-green-300' :
                              film.genre === 'horror' ? 'bg-purple-900 text-purple-300' :
                              film.genre === 'romance' ? 'bg-pink-900 text-pink-300' :
                              film.genre === 'sci-fi' ? 'bg-cyan-900 text-cyan-300' :
                              film.genre === 'thriller' ? 'bg-indigo-900 text-indigo-300' :
                              film.genre === 'western' ? 'bg-orange-900 text-orange-300' :
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {film.genre.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                            <div className="flex items-center">
                              <div className="flex items-center text-yellow-400 mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="ml-1 text-sm">{film.rating}</span>
                              </div>
                              <span className="text-xs text-gray-400">{film.duration}</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{film.title}</h3>
                          <p className="text-gray-500 text-sm mb-2">{film.director} • {film.releaseYear}</p>
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{film.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-teal-400 font-medium">{film.price} FILM</span>
                            {hasSubscription ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  getFilmContent(film);
                                }}
                                className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-1.5 rounded-md text-sm"
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
                                className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-1.5 rounded-md text-sm"
                              >
                                {parseFloat(tokenAllowance) < parseFloat(film.price) ? 'Approve' : 'Purchase'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {selectedFilm && (
                  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40 p-4">
                    <div className="bg-gray-900 rounded-lg overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="relative">
                        <div className="aspect-w-16 aspect-h-9 bg-gray-800">
                          {selectedFilm.poster ? (
                            <img 
                              src={selectedFilm.poster} 
                              alt={selectedFilm.title} 
                              className="object-cover w-full h-full"
                            />
                          ) : selectedFilm.ipfsHash ? (
                            <img 
                              src={`https://ipfs.io/ipfs/${selectedFilm.ipfsHash}`} 
                              alt={selectedFilm.title} 
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-gray-800">
                              <span className="text-gray-500 text-6xl">🎬</span>
                            </div>
                          )}
                          <div className="absolute top-4 right-4">
                            <button
                              onClick={() => setSelectedFilm(null)}
                              className="bg-gray-900 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-6">
                            <div className="flex items-center mb-2">
                              <span className={`inline-block px-2 py-1 text-xs rounded-full mr-2 ${
                                selectedFilm.genre === 'action' ? 'bg-red-900 text-red-300' :
                                selectedFilm.genre === 'comedy' ? 'bg-yellow-900 text-yellow-300' :
                                selectedFilm.genre === 'drama' ? 'bg-blue-900 text-blue-300' :
                                selectedFilm.genre === 'documentary' ? 'bg-green-900 text-green-300' :
                                selectedFilm.genre === 'horror' ? 'bg-purple-900 text-purple-300' :
                                selectedFilm.genre === 'romance' ? 'bg-pink-900 text-pink-300' :
                                selectedFilm.genre === 'sci-fi' ? 'bg-cyan-900 text-cyan-300' :
                                selectedFilm.genre === 'thriller' ? 'bg-indigo-900 text-indigo-300' :
                                selectedFilm.genre === 'western' ? 'bg-orange-900 text-orange-300' :
                                'bg-gray-700 text-gray-300'
                              }`}>
                                {selectedFilm.genre.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              <div className="flex items-center text-yellow-400 mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="ml-1 text-sm">{selectedFilm.rating}</span>
                              </div>
                              <span className="text-sm text-gray-400">{selectedFilm.duration}</span>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-1">{selectedFilm.title}</h2>
                            <p className="text-gray-400 mb-4">{selectedFilm.director} • {selectedFilm.releaseYear}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="mb-6">
                          <h3 className="text-xl font-bold text-white mb-2">Synopsis</h3>
                          <p className="text-gray-400">{selectedFilm.description}</p>
                        </div>
                        
                        <div className="mb-6">
                          <h3 className="text-xl font-bold text-white mb-2">Cast</h3>
                          <p className="text-gray-400">{selectedFilm.cast}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-gray-800 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-400 mb-1">Watch Count</h4>
                            <p className="text-white text-lg">{selectedFilm.watchCount}</p>
                          </div>
                          <div className="bg-gray-800 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-400 mb-1">Price</h4>
                            <p className="text-teal-400 text-lg font-medium">{selectedFilm.price} FILM</p>
                          </div>
                          <div className="bg-gray-800 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-400 mb-1">Added</h4>
                            <p className="text-white text-lg">{selectedFilm.createdAt.toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Reviews</h3>
                            <button
                              onClick={() => setShowReviewModal(true)}
                              className="text-teal-400 hover:text-teal-300 text-sm font-medium"
                            >
                              Write a Review
                            </button>
                          </div>
                          
                          {selectedFilm.reviews && selectedFilm.reviews.length > 0 ? (
                            <div className="space-y-4">
                              {selectedFilm.reviews.map((review, index) => (
                                <div key={index} className="bg-gray-800 rounded-lg p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <span className="text-white font-medium">{review.reviewer}</span>
                                      <div className="flex items-center mt-1">
                                        <div className="flex items-center text-yellow-400 mr-2">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                          <span className="ml-1 text-sm">{review.rating}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                          {review.date.toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-gray-400 text-sm">{review.text}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-gray-800 rounded-lg">
                              <p className="text-gray-400">No reviews yet. Be the first to review!</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-4">
                          {hasSubscription ? (
                            <button
                              onClick={() => getFilmContent(selectedFilm)}
                              className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 rounded-md font-medium"
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
                              className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 rounded-md font-medium"
                            >
                              {parseFloat(tokenAllowance) < parseFloat(selectedFilm.price) ? 'Approve FILM Tokens' : 'Purchase Film'}
                            </button>
                          )}
                          <button
                            onClick={() => setShowTrailerModal(true)}
                            className="flex-1 bg-gray-800 text-white py-3 rounded-md font-medium"
                          >
                            Watch Trailer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'my-films' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">My Films</h2>
                  <button
                    onClick={() => setShowAddFilmModal(true)}
                    className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded-md"
                  >
                    Add New Film
                  </button>
                </div>
                
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
                        <div className="aspect-w-16 aspect-h-9 bg-gray-800 relative">
                          {film.poster ? (
                            <img 
                              src={film.poster} 
                              alt={film.title} 
                              className="object-cover w-full h-full"
                            />
                          ) : film.ipfsHash ? (
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
                              film.genre === 'documentary' ? 'bg-green-900 text-green-300' :
                              film.genre === 'horror' ? 'bg-purple-900 text-purple-300' :
                              film.genre === 'romance' ? 'bg-pink-900 text-pink-300' :
                              film.genre === 'sci-fi' ? 'bg-cyan-900 text-cyan-300' :
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
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="director" className="block text-sm font-medium text-gray-400 mb-2">
                          Director
                        </label>
                        <input
                          type="text"
                          id="director"
                          name="director"
                          value={filmFormData.director}
                          onChange={handleFilmFormChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Director name"
                        />
                      </div>
                      <div>
                        <label htmlFor="releaseYear" className="block text-sm font-medium text-gray-400 mb-2">
                          Release Year
                        </label>
                        <input
                          type="number"
                          id="releaseYear"
                          name="releaseYear"
                          value={filmFormData.releaseYear}
                          onChange={handleFilmFormChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Release year"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="cast" className="block text-sm font-medium text-gray-400 mb-2">
                        Cast
                      </label>
                      <input
                        type="text"
                        id="cast"
                        name="cast"
                        value={filmFormData.cast}
                        onChange={handleFilmFormChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Main cast members"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="duration" className="block text-sm font-medium text-gray-400 mb-2">
                        Duration
                      </label>
                      <input
                        type="text"
                        id="duration"
                        name="duration"
                        value={filmFormData.duration}
                        onChange={handleFilmFormChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="e.g. 1h 45m"
                      />
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
                        <option value="documentary">Documentary</option>
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
                        <span className="text-teal-400 block mt-2">{selectedFilm.contentHash || "QmContentHash123"}</span>
                      </p>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setShowWatchModal(false)}
                          className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-md"
                        >
                          Close Player
                        </button>
                        <button
                          onClick={() => {
                            setShowWatchModal(false);
                            setShowReviewModal(true);
                          }}
                          className="bg-gray-800 text-white px-6 py-2 rounded-md"
                        >
                          Write Review
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Trailer Modal */}
            {showTrailerModal && selectedFilm && (
              <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 rounded-lg overflow-hidden max-w-4xl w-full">
                  <div className="aspect-w-16 aspect-h-9 bg-black">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-white text-6xl mb-4">📽️</span>
                      <h3 className="text-xl font-bold text-white mb-2">{selectedFilm.title} - Official Trailer</h3>
                      <p className="text-gray-400 text-center max-w-md mb-6">
                        In a real application, the trailer would play here.
                      </p>
                      <button
                        onClick={() => setShowTrailerModal(false)}
                        className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-md"
                      >
                        Close Trailer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Review Modal */}
            {showReviewModal && selectedFilm && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-xl font-bold text-white mb-4">Write a Review for "{selectedFilm.title}"</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Rating
                    </label>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`text-2xl ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-600'}`}
                        >
                          ★
                        </button>
                      ))}
                      <span className="ml-2 text-white">{reviewRating}/5</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="reviewText" className="block text-sm font-medium text-gray-400 mb-2">
                      Your Review
                    </label>
                    <textarea
                      id="reviewText"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows="5"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Share your thoughts about this film..."
                    ></textarea>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={handleSubmitReview}
                      className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 text-white py-2 rounded-md font-medium"
                      disabled={!reviewText.trim()}
                    >
                      Submit Review
                    </button>
                    <button
                      onClick={() => {
                        setShowReviewModal(false);
                        setReviewText('');
                        setReviewRating(5);
                      }}
                      className="flex-1 bg-gray-800 text-gray-400 py-2 rounded-md font-medium"
                    >
                      Cancel
                    </button>
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

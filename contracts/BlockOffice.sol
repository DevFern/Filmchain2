// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title BlockOffice
 * @dev Platform for film distribution and subscription services
 */
contract BlockOffice is 
    Initializable, 
    AccessControlUpgradeable, 
    ReentrancyGuardUpgradeable, 
    PausableUpgradeable, 
    UUPSUpgradeable 
{
    using CountersUpgradeable for CountersUpgradeable.Counter;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    
    IERC20Upgradeable public filmToken;
    AggregatorV3Interface public priceFeed;
    
    CountersUpgradeable.Counter private _filmIds;
    
    // Film categories
    enum Category { 
        Action, 
        Comedy, 
        Drama, 
        Documentary, 
        Horror, 
        Romance, 
        SciFi, 
        Thriller, 
        Western, 
        Animation, 
        Family, 
        Other 
    }
    
    // Film content rating
    enum ContentRating { 
        G, 
        PG, 
        PG13, 
        R, 
        NC17, 
        Unrated 
    }
    
    struct Film {
        uint256 id;
        address creator;
        string title;
        string description;
        string ipfsHash; // For poster and metadata
        string contentHash; // For actual film content
        uint256 price;
        bool isListed;
        uint256 createdAt;
        Category category;
        ContentRating contentRating;
        uint256 duration; // in seconds
        string[] tags;
        uint256 viewCount;
        uint256 totalRating; // Sum of all ratings
        uint256 ratingCount; // Number of ratings
    }
    
    struct Review {
        address reviewer;
        uint256 rating; // 1-5
        string comment;
        uint256 timestamp;
        uint256 helpfulVotes;
    }
    
    struct Subscription {
        address subscriber;
        uint256 startTime;
        uint256 endTime;
        SubscriptionTier tier;
    }
    
    enum SubscriptionTier { Basic, Premium, Ultimate }
    
    // Mapping of film ID to film data
    mapping(uint256 => Film) public films;
    
    // Mapping of film ID to reviews
    mapping(uint256 => Review[]) public filmReviews;
    
    // Mapping of user to purchased films
    mapping(address => mapping(uint256 => bool)) public userPurchases;
    
    // Mapping of user to subscription
    mapping(address => Subscription) public subscriptions;
    
    // Subscription prices for each tier
    mapping(SubscriptionTier => uint256) public subscriptionPrices;
    
    // Subscription durations for each tier (in seconds)
    mapping(SubscriptionTier => uint256) public subscriptionDurations;
    
    // Platform fee in basis points (100 = 1%)
    uint256 public platformFee;
    
    // Creator royalty in basis points (100 = 1%)
    uint256 public creatorRoyalty;
    
    // Events
    event FilmAdded(uint256 indexed id, address indexed creator, string title, Category category);
    event FilmUpdated(uint256 indexed id, string title, uint256 price);
    event FilmPurchased(uint256 indexed id, address indexed buyer, uint256 price);
    event FilmViewed(uint256 indexed id, address indexed viewer);
    event ReviewAdded(uint256 indexed filmId, address indexed reviewer, uint256 rating);
    event ReviewVoted(uint256 indexed filmId, uint256 reviewIndex, address voter, bool helpful);
    event SubscriptionPurchased(address indexed subscriber, SubscriptionTier tier, uint256 startTime, uint256 endTime);
    event PlatformFeeUpdated(uint256 newFee);
    event CreatorRoyaltyUpdated(uint256 newRoyalty);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initializes the contract
     * @param _filmToken Address of the FILM token contract
     * @param _priceFeed Address of the Chainlink price feed
     */
    function initialize(
        address _filmToken,
        address _priceFeed,
        address admin
    ) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        _grantRole(MODERATOR_ROLE, admin);
        
        filmToken = IERC20Upgradeable(_filmToken);
        priceFeed = AggregatorV3Interface(_priceFeed);
        
        // Set default subscription prices and durations
        subscriptionPrices[SubscriptionTier.Basic] = 10 * 10**18; // 10 FILM
        subscriptionPrices[SubscriptionTier.Premium] = 25 * 10**18; // 25 FILM
        subscriptionPrices[SubscriptionTier.Ultimate] = 50 * 10**18; // 50 FILM
        
        subscriptionDurations[SubscriptionTier.Basic] = 30 days;
        subscriptionDurations[SubscriptionTier.Premium] = 30 days;
        subscriptionDurations[SubscriptionTier.Ultimate] = 30 days;
        
        platformFee = 250; // 2.5%
        creatorRoyalty = 800; // 8%
    }
    
    /**
     * @dev Adds a new film to the platform
     * @param _title Film title
     * @param _description Film description
     * @param _ipfsHash IPFS hash for poster and metadata
     * @param _contentHash IPFS hash for film content
     * @param _price Price in FILM tokens
     * @param _category Film category
     * @param _contentRating Content rating
     * @param _duration Film duration in seconds
     * @param _tags Array of tags
     */
    function addFilm(
        string memory _title,
        string memory _description,
        string memory _ipfsHash,
        string memory _contentHash,
        uint256 _price,
        Category _category,
        ContentRating _contentRating,
        uint256 _duration,
        string[] memory _tags
    ) external whenNotPaused {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_contentHash).length > 0, "Content hash cannot be empty");
        require(_price > 0, "Price must be greater than 0");
        
        _filmIds.increment();
        uint256 newFilmId = _filmIds.current();
        
        films[newFilmId] = Film({
            id: newFilmId,
            creator: msg.sender,
            title: _title,
            description: _description,
            ipfsHash: _ipfsHash,
            contentHash: _contentHash,
            price: _price,
            isListed: true,
            createdAt: block.timestamp,
            category: _category,
            contentRating: _contentRating,
            duration: _duration,
            tags: _tags,
            viewCount: 0,
            totalRating: 0,
            ratingCount: 0
        });
        
        emit FilmAdded(newFilmId, msg.sender, _title, _category);
    }
    
    /**
     * @dev Updates an existing film
     * @param _filmId Film ID
     * @param _title Film title
     * @param _description Film description
     * @param _ipfsHash IPFS hash for poster and metadata
     * @param _price Price in FILM tokens
     * @param _isListed Whether the film is listed
     * @param _category Film category
     * @param _contentRating Content rating
     * @param _tags Array of tags
     */
    function updateFilm(
        uint256 _filmId,
        string memory _title,
        string memory _description,
        string memory _ipfsHash,
        uint256 _price,
        bool _isListed,
        Category _category,
        ContentRating _contentRating,
        string[] memory _tags
    ) external whenNotPaused {
        Film storage film = films[_filmId];
        require(film.creator == msg.sender || hasRole(ADMIN_ROLE, msg.sender) || hasRole(MODERATOR_ROLE, msg.sender), "Not authorized");
        require(film.id > 0, "Film does not exist");
        
        film.title = _title;
        film.description = _description;
        film.ipfsHash = _ipfsHash;
        film.price = _price;
        film.isListed = _isListed;
        film.category = _category;
        film.contentRating = _contentRating;
        film.tags = _tags;
        
        emit FilmUpdated(_filmId, _title, _price);
    }
    
    /**
     * @dev Purchases a film
     * @param _filmId Film ID
     */
    function purchaseFilm(uint256 _filmId) external nonReentrant whenNotPaused {
        Film storage film = films[_filmId];
        require(film.id > 0, "Film does not exist");
        require(film.isListed, "Film not available");
        require(!userPurchases[msg.sender][_filmId], "Film already purchased");
        
        uint256 price = film.price;
        
        // Calculate platform fee
        uint256 fee = (price * platformFee) / 10000;
        uint256 creatorAmount = price - fee;
        
        // Transfer tokens from buyer to contract
        require(filmToken.transferFrom(msg.sender, address(this), price), "Transfer failed");
        
        // Transfer tokens to creator
        require(filmToken.transfer(film.creator, creatorAmount), "Transfer to creator failed");
        
        // Mark film as purchased by user
        userPurchases[msg.sender][_filmId] = true;
        
        emit FilmPurchased(_filmId, msg.sender, price);
    }
    
    /**
     * @dev Purchases a subscription
     * @param _tier Subscription tier
     */
    function purchaseSubscription(SubscriptionTier _tier) external nonReentrant whenNotPaused {
        uint256 price = subscriptionPrices[_tier];
        uint256 duration = subscriptionDurations[_tier];
        
        require(price > 0, "Invalid subscription tier");
        require(filmToken.transferFrom(msg.sender, address(this), price), "Transfer failed");
        
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;
        
        // If user already has a subscription, extend it
        if (subscriptions[msg.sender].endTime > block.timestamp) {
            endTime = subscriptions[msg.sender].endTime + duration;
        }
        
        subscriptions[msg.sender] = Subscription({
            subscriber: msg.sender,
            startTime: startTime,
            endTime: endTime,
            tier: _tier
        });
        
        emit SubscriptionPurchased(msg.sender, _tier, startTime, endTime);
    }
    
    /**
     * @dev Records a film view and increments view count
     * @param _filmId Film ID
     */
    function recordView(uint256 _filmId) external whenNotPaused {
        Film storage film = films[_filmId];
        require(film.id > 0, "Film does not exist");
        require(canAccessFilm(_filmId, msg.sender), "Not authorized to view film");
        
        film.viewCount++;
        
        emit FilmViewed(_filmId, msg.sender);
    }
    
    /**
     * @dev Adds a review for a film
     * @param _filmId Film ID
     * @param _rating Rating (1-5)
     * @param _comment Review comment
     */
    function addReview(uint256 _filmId, uint256 _rating, string memory _comment) external whenNotPaused {
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5");
        require(canAccessFilm(_filmId, msg.sender), "Must purchase or subscribe to review");
        
        Film storage film = films[_filmId];
        require(film.id > 0, "Film does not exist");
        
        // Check if user has already reviewed this film
        for (uint256 i = 0; i < filmReviews[_filmId].length; i++) {
            if (filmReviews[_filmId][i].reviewer == msg.sender) {
                revert("Already reviewed this film");
            }
        }
        
        // Add review
        filmReviews[_filmId].push(Review({
            reviewer: msg.sender,
            rating: _rating,
            comment: _comment,
            timestamp: block.timestamp,
            helpfulVotes: 0
        }));
        
        // Update film rating
        film.totalRating += _rating;
        film.ratingCount++;
        
        emit ReviewAdded(_filmId, msg.sender, _rating);
    }
    
    /**
     * @dev Votes on a review's helpfulness
     * @param _filmId Film ID
     * @param _reviewIndex Index of the review
     * @param _helpful Whether the review was helpful
     */
    function voteReview(uint256 _filmId, uint256 _reviewIndex, bool _helpful) external whenNotPaused {
        require(_reviewIndex < filmReviews[_filmId].length, "Review does not exist");
        
        if (_helpful) {
            filmReviews[_filmId][_reviewIndex].helpfulVotes++;
        }
        
        emit ReviewVoted(_filmId, _reviewIndex, msg.sender, _helpful);
    }
    
    /**
     * @dev Checks if a user has an active subscription
     * @param _user User address
     * @return Whether the user has an active subscription
     */
    function hasActiveSubscription(address _user) public view returns (bool) {
        return subscriptions[_user].endTime > block.timestamp;
    }
    
    /**
     * @dev Gets the subscription tier of a user
     * @param _user User address
     * @return The subscription tier
     */
    function getSubscriptionTier(address _user) public view returns (SubscriptionTier) {
        if (!hasActiveSubscription(_user)) {
            revert("No active subscription");
        }
        return subscriptions[_user].tier;
    }
    
    /**
     * @dev Checks if a user can access a film
     * @param _filmId Film ID
     * @param _user User address
     * @return Whether the user can access the film
     */
    function canAccessFilm(uint256 _filmId, address _user) public view returns (bool) {
        Film storage film = films[_filmId];
        
        // Creator and admins can always access
        if (film.creator == _user || hasRole(ADMIN_ROLE, _user) || hasRole(MODERATOR_ROLE, _user)) {
            return true;
        }
        
        // Check if user has purchased the film
        if (userPurchases[_user][_filmId]) {
            return true;
        }
        
        // Check if user has an active subscription
        if (hasActiveSubscription(_user)) {
            SubscriptionTier tier = subscriptions[_user].tier;
            
            // Basic tier can access films older than 6 months
            if (tier == SubscriptionTier.Basic && (block.timestamp - film.createdAt) > 180 days) {
                return true;
            }
            
            // Premium tier can access all films except new releases (< 30 days)
            if (tier == SubscriptionTier.Premium && (block.timestamp - film.createdAt) > 30 days) {
                return true;
            }
            
            // Ultimate tier can access all films
            if (tier == SubscriptionTier.Ultimate) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Gets the content hash of a film
     * @param _filmId Film ID
     * @return The content hash
     */
    function getFilmContent(uint256 _filmId) external view returns (string memory) {
        Film storage film = films[_filmId];
        require(film.id > 0, "Film does not exist");
        
        // Check if user can access the film
        if (canAccessFilm(_filmId, msg.sender)) {
            return film.contentHash;
        }
        
        revert("Not authorized to view content");
    }
    
    /**
     * @dev Gets all listed films
     * @return Array of films
     */
    function getListedFilms() external view returns (Film[] memory) {
        uint256 listedCount = 0;
        
        // Count listed films
        for (uint256 i = 1; i <= _filmIds.current(); i++) {
            if (films[i].isListed) {
                listedCount++;
            }
        }
        
        Film[] memory listedFilms = new Film[](listedCount);
        uint256 currentIndex = 0;
        
        // Populate array with listed films
        for (uint256 i = 1; i <= _filmIds.current(); i++) {
            if (films[i].isListed) {
                listedFilms[currentIndex] = films[i];
                currentIndex++;
            }
        }
        
        return listedFilms;
    }
    
    /**
     * @dev Gets films by category
     * @param _category Film category
     * @return Array of films
     */
    function getFilmsByCategory(Category _category) external view returns (Film[] memory) {
        uint256 count = 0;
        
        // Count films in category
        for (uint256 i = 1; i <= _filmIds.current(); i++) {
            if (films[i].isListed && films[i].category == _category) {
                count++;
            }
        }
        
        Film[] memory categoryFilms = new Film[](count);
        uint256 currentIndex = 0;
        
        // Populate array with films in category
        for (uint256 i = 1; i <= _filmIds.current(); i++) {
            if (films[i].isListed && films[i].category == _category) {
                categoryFilms[currentIndex] = films[i];
                currentIndex++;
            }
        }
        
        return categoryFilms;
    }
    
    /**
     * @dev Gets films created by a user
     * @param _creator Creator address
     * @return Array of films
     */
    function getFilmsByCreator(address _creator) external view returns (Film[] memory) {
        uint256 count = 0;
        
        // Count films by creator
        for (uint256 i = 1; i <= _filmIds.current(); i++) {
            if (films[i].creator == _creator) {
                count++;
            }
        }
        
        Film[] memory creatorFilms = new Film[](count);
        uint256 currentIndex = 0;
        
        // Populate array with films by creator
        for (uint256 i = 1; i <= _filmIds.current(); i++) {
            if (films[i].creator == _creator) {
                creatorFilms[currentIndex] = films[i];
                currentIndex++;
            }
        }
return creatorFilms;
    }
    
    /**
     * @dev Gets reviews for a film
     * @param _filmId Film ID
     * @return Array of reviews
     */
    function getFilmReviews(uint256 _filmId) external view returns (Review[] memory) {
        return filmReviews[_filmId];
    }
    
    /**
     * @dev Gets the average rating for a film
     * @param _filmId Film ID
     * @return Average rating (0-5)
     */
    function getAverageRating(uint256 _filmId) external view returns (uint256) {
        Film storage film = films[_filmId];
        if (film.ratingCount == 0) {
            return 0;
        }
        return film.totalRating / film.ratingCount;
    }
    
    /**
     * @dev Sets the subscription price for a tier
     * @param _tier Subscription tier
     * @param _price Price in FILM tokens
     */
    function setSubscriptionPrice(SubscriptionTier _tier, uint256 _price) external onlyRole(ADMIN_ROLE) {
        subscriptionPrices[_tier] = _price;
    }
    
    /**
     * @dev Sets the subscription duration for a tier
     * @param _tier Subscription tier
     * @param _duration Duration in seconds
     */
    function setSubscriptionDuration(SubscriptionTier _tier, uint256 _duration) external onlyRole(ADMIN_ROLE) {
        subscriptionDurations[_tier] = _duration;
    }
    
    /**
     * @dev Sets the platform fee
     * @param _fee Fee in basis points (100 = 1%)
     */
    function setPlatformFee(uint256 _fee) external onlyRole(ADMIN_ROLE) {
        require(_fee <= 1000, "Fee cannot exceed 10%");
        platformFee = _fee;
        emit PlatformFeeUpdated(_fee);
    }
    
    /**
     * @dev Sets the creator royalty
     * @param _royalty Royalty in basis points (100 = 1%)
     */
    function setCreatorRoyalty(uint256 _royalty) external onlyRole(ADMIN_ROLE) {
        require(_royalty <= 2000, "Royalty cannot exceed 20%");
        creatorRoyalty = _royalty;
        emit CreatorRoyaltyUpdated(_royalty);
    }
    
    /**
     * @dev Withdraws platform fees
     */
    function withdrawFees() external onlyRole(ADMIN_ROLE) nonReentrant {
        uint256 balance = filmToken.balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");
        
        require(filmToken.transfer(msg.sender, balance), "Transfer failed");
    }
    
    /**
     * @dev Pauses the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpauses the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Function that should revert when msg.sender is not authorized to upgrade the contract
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
    
    /**
     * @dev Gets the latest price from the Chainlink price feed
     * @return The latest price
     */
    function getLatestPrice() public view returns (int) {
        (
            /* uint80 roundID */,
            int price,
            /* uint startedAt */,
            /* uint timeStamp */,
            /* uint80 answeredInRound */
        ) = priceFeed.latestRoundData();
        return price;
    }
}

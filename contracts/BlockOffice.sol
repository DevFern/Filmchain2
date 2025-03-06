// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BlockOffice is Ownable, ReentrancyGuard {
    IERC20 public filmToken;
    
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
    }
    
    struct Subscription {
        address subscriber;
        uint256 startTime;
        uint256 endTime;
    }
    
    uint256 public filmCount;
    mapping(uint256 => Film) public films;
    
    uint256 public subscriptionPrice;
    uint256 public subscriptionDuration = 30 days;
    mapping(address => Subscription) public subscriptions;
    
    uint256 public platformFee = 250; // 2.5% fee (in basis points)
    
    event FilmAdded(uint256 indexed id, address indexed creator, string title);
    event FilmUpdated(uint256 indexed id, string title, uint256 price);
    event FilmPurchased(uint256 indexed id, address indexed buyer, uint256 price);
    event SubscriptionPurchased(address indexed subscriber, uint256 startTime, uint256 endTime);
    
    constructor(address _filmToken, uint256 _subscriptionPrice) {
        filmToken = IERC20(_filmToken);
        subscriptionPrice = _subscriptionPrice;
    }
    
    function addFilm(
        string memory _title,
        string memory _description,
        string memory _ipfsHash,
        string memory _contentHash,
        uint256 _price
    ) external {
        filmCount++;
        
        films[filmCount] = Film({
            id: filmCount,
            creator: msg.sender,
            title: _title,
            description: _description,
            ipfsHash: _ipfsHash,
            contentHash: _contentHash,
            price: _price,
            isListed: true,
            createdAt: block.timestamp
        });
        
        emit FilmAdded(filmCount, msg.sender, _title);
    }
    
    function updateFilm(
        uint256 _filmId,
        string memory _title,
        string memory _description,
        string memory _ipfsHash,
        uint256 _price,
        bool _isListed
    ) external {
        Film storage film = films[_filmId];
        require(film.creator == msg.sender || owner() == msg.sender, "Not authorized");
        
        film.title = _title;
        film.description = _description;
        film.ipfsHash = _ipfsHash;
        film.price = _price;
        film.isListed = _isListed;
        
        emit FilmUpdated(_filmId, _title, _price);
    }
    
    function purchaseFilm(uint256 _filmId) external nonReentrant {
        Film storage film = films[_filmId];
        require(film.isListed, "Film not available");
        
        uint256 price = film.price;
        
        // Calculate platform fee
        uint256 fee = (price * platformFee) / 10000;
        uint256 creatorAmount = price - fee;
        
        // Transfer tokens from buyer to contract
        require(filmToken.transferFrom(msg.sender, address(this), price), "Transfer failed");
        
        // Transfer tokens to creator
        require(filmToken.transfer(film.creator, creatorAmount), "Transfer to creator failed");
        
        emit FilmPurchased(_filmId, msg.sender, price);
    }
    
    function purchaseSubscription() external nonReentrant {
        require(filmToken.transferFrom(msg.sender, address(this), subscriptionPrice), "Transfer failed");
        
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + subscriptionDuration;
        
        // If user already has a subscription, extend it
        if (subscriptions[msg.sender].endTime > block.timestamp) {
            endTime = subscriptions[msg.sender].endTime + subscriptionDuration;
        }
        
        subscriptions[msg.sender] = Subscription({
            subscriber: msg.sender,
            startTime: startTime,
            endTime: endTime
        });
        
        emit SubscriptionPurchased(msg.sender, startTime, endTime);
    }
    
    function hasActiveSubscription(address _user) public view returns (bool) {
        return subscriptions[_user].endTime > block.timestamp;
    }
    
    function getFilmContent(uint256 _filmId) external view returns (string memory) {
        Film storage film = films[_filmId];
        
        // Check if user has purchased the film or has an active subscription
        if (film.creator == msg.sender || owner() == msg.sender || hasActiveSubscription(msg.sender)) {
            return film.contentHash;
        }
        
        revert("Not authorized to view content");
    }
    
    function setSubscriptionPrice(uint256 _price) external onlyOwner {
        subscriptionPrice = _price;
    }
    
    function setSubscriptionDuration(uint256 _duration) external onlyOwner {
        subscriptionDuration = _duration;
    }
    
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee cannot exceed 10%");
        platformFee = _fee;
    }
    
    function withdrawFees() external onlyOwner {
        uint256 balance = filmToken.balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");
        
        require(filmToken.transfer(owner(), balance), "Transfer failed");
    }
    
    function getListedFilms() external view returns (Film[] memory) {
        uint256 listedCount = 0;
        
        for (uint256 i = 1; i <= filmCount; i++) {
            if (films[i].isListed) {
                listedCount++;
            }
        }
        
        Film[] memory listedFilms = new Film[](listedCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i <= filmCount; i++) {
            if (films[i].isListed) {
                listedFilms[currentIndex] = films[i];
                currentIndex++;
            }
        }
        
        return listedFilms;
    }
}

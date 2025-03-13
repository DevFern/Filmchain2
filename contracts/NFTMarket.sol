// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

/**
 * @title FilmNFT
 * @dev ERC721 token for film-related NFTs with royalty support
 */
contract FilmNFT is 
    Initializable, 
    ERC721URIStorageUpgradeable, 
    ERC721RoyaltyUpgradeable, 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    UUPSUpgradeable 
{
    using CountersUpgradeable for CountersUpgradeable.Counter;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    CountersUpgradeable.Counter private _tokenIds;
    
    // NFT metadata
    struct NFTMetadata {
        string name;
        string description;
        string filmReference; // Reference to a film in BlockOffice
        string nftType; // e.g., "Poster", "Collectible", "Ticket", "Memorabilia"
        uint256 createdAt;
    }
    
    // Mapping from token ID to metadata
    mapping(uint256 => NFTMetadata) public tokenMetadata;
    
    // Events
    event NFTMinted(uint256 indexed tokenId, address indexed recipient, string tokenURI);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initializes the contract
     */
    function initialize(address admin) public initializer {
        __ERC721_init("FilmChain NFT", "FILMNFT");
        __ERC721URIStorage_init();
        __ERC721Royalty_init();
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }
    
    /**
     * @dev Mints a new NFT
     * @param recipient Address of the recipient
     * @param tokenURI URI for the token metadata
     * @param name NFT name
     * @param description NFT description
     * @param filmReference Reference to a film
     * @param nftType Type of NFT
     * @param royaltyFee Royalty fee in basis points (100 = 1%)
     * @return The new token ID
     */
    function mintNFT(
        address recipient,
        string memory tokenURI,
        string memory name,
        string memory description,
        string memory filmReference,
        string memory nftType,
        uint96 royaltyFee
    ) public onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(royaltyFee <= 1000, "Royalty fee cannot exceed 10%");
        
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);
        
        // Set royalty information
        _setTokenRoyalty(newItemId, recipient, royaltyFee);
        
        // Store metadata
        tokenMetadata[newItemId] = NFTMetadata({
            name: name,
            description: description,
            filmReference: filmReference,
            nftType: nftType,
            createdAt: block.timestamp
        });
        
        emit NFTMinted(newItemId, recipient, tokenURI);
        
        return newItemId;
    }
    
    /**
     * @dev Batch mints multiple NFTs
     * @param recipients Array of recipient addresses
     * @param tokenURIs Array of token URIs
     * @param names Array of NFT names
     * @param descriptions Array of NFT descriptions
     * @param filmReferences Array of film references
     * @param nftTypes Array of NFT types
     * @param royaltyFees Array of royalty fees
     * @return Array of new token IDs
     */
    function batchMintNFT(
        address[] memory recipients,
        string[] memory tokenURIs,
        string[] memory names,
        string[] memory descriptions,
        string[] memory filmReferences,
        string[] memory nftTypes,
        uint96[] memory royaltyFees
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256[] memory) {
        require(
            recipients.length == tokenURIs.length &&
            recipients.length == names.length &&
            recipients.length == descriptions.length &&
            recipients.length == filmReferences.length &&
            recipients.length == nftTypes.length &&
            recipients.length == royaltyFees.length,
            "Array lengths must match"
        );
        
        uint256[] memory newItemIds = new uint256[](recipients.length);
        
        for (uint256 i = 0; i < recipients.length; i++) {
            newItemIds[i] = mintNFT(
                recipients[i],
                tokenURIs[i],
                names[i],
                descriptions[i],
                filmReferences[i],
                nftTypes[i],
                royaltyFees[i]
            );
        }
        
        return newItemIds;
    }
    
    /**
     * @dev Burns a token
     * @param tokenId ID of the token to burn
     */
    function burn(uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not approved to burn");
        _burn(tokenId);
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
     * @dev Hook that is called before any token transfer
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    /**
     * @dev Override for ERC721URIStorage and ERC721Royalty
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorageUpgradeable, ERC721RoyaltyUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Override for ERC721URIStorage and ERC721Royalty
     */
    function _burn(uint256 tokenId) internal override(ERC721URIStorageUpgradeable, ERC721RoyaltyUpgradeable) {
        super._burn(tokenId);
    }
}

/**
 * @title NFTMarket
 * @dev Marketplace for trading FilmNFT tokens
 */
contract NFTMarket is 
    Initializable, 
    AccessControlUpgradeable, 
    ReentrancyGuardUpgradeable, 
    PausableUpgradeable, 
    UUPSUpgradeable 
{
    using CountersUpgradeable for CountersUpgradeable.Counter;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    
    IERC20Upgradeable public filmToken;
    FilmNFT public nftContract;
    
    CountersUpgradeable.Counter private _itemIds;
    CountersUpgradeable.Counter private _itemsSold;
    
    enum ListingType { FixedPrice, Auction }
    
    struct MarketItem {
        uint256 itemId;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        ListingType listingType;
        uint256 startTime;
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;
        bool sold;
    }
    
    // Mapping from item ID to market item
    mapping(uint256 => MarketItem) private idToMarketItem;
    
    // Mapping from token ID to item ID
    mapping(uint256 => uint256) private tokenIdToItemId;
    
    // Mapping from item ID to bidders and their bids
    mapping(uint256 => mapping(address => uint256)) private itemBids;
    
    // Platform fee in basis points (100 = 1%)
    uint256 public platformFee;
    
    // Events
    event MarketItemCreated(
        uint256 indexed itemId,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        ListingType listingType,
        uint256 startTime,
        uint256 endTime
    );
    
    event MarketItemSold(
        uint256 indexed itemId,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price
    );
    
    event AuctionBid(
        uint256 indexed itemId,
        uint256 indexed tokenId,
        address bidder,
        uint256 bid
    );
    
    event AuctionEnded(
        uint256 indexed itemId,
        uint256 indexed tokenId,
        address winner,
        uint256 amount
    );
    
    event PlatformFeeUpdated(uint256 newFee);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initializes the contract
     * @param _filmToken Address of the FILM token contract
     * @param _nftContract Address of the FilmNFT contract
     */
    function initialize(
        address _filmToken,
        address _nftContract,
        address admin
    ) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        
        filmToken = IERC20Upgradeable(_filmToken);
        nftContract = FilmNFT(_nftContract);
        
        platformFee = 250; // 2.5%
    }
    
    /**
     * @dev Creates a fixed price market item
     * @param tokenId Token ID of the NFT
     * @param price Price in FILM tokens
     */
    function createMarketItem(uint256 tokenId, uint256 price) external nonReentrant whenNotPaused {
        require(price > 0, "Price must be greater than 0");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Only item owner can create market item");
        
        _itemIds.increment();
        uint256 itemId = _itemIds.current();
        
        idToMarketItem[itemId] = MarketItem({
            itemId: itemId,
            tokenId: tokenId,
            seller: payable(msg.sender),
            owner: payable(address(0)),
            price: price,
            listingType: ListingType.FixedPrice,
            startTime: block.timestamp,
            endTime: 0,
            highestBidder: address(0),
            highestBid: 0,
            sold: false
        });
        
        tokenIdToItemId[tokenId] = itemId;
        
        nftContract.transferFrom(msg.sender, address(this), tokenId);
        
        emit MarketItemCreated(
            itemId,
            tokenId,
            msg.sender,
            address(0),
            price,
            ListingType.FixedPrice,
            block.timestamp,
            0
        );
    }
    
    /**
     * @dev Creates an auction market item
     * @param tokenId Token ID of the NFT
     * @param startingPrice Starting price in FILM tokens
     * @param duration Duration of the auction in seconds
     */
    function createAuction(
        uint256 tokenId,
        uint256 startingPrice,
        uint256 duration
    ) external nonReentrant whenNotPaused {
        require(startingPrice > 0, "Starting price must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Only item owner can create auction");
        
        _itemIds.increment();
        uint256 itemId = _itemIds.current();
        
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;
        
        idToMarketItem[itemId] = MarketItem({
            itemId: itemId,
            tokenId: tokenId,
            seller: payable(msg.sender),
            owner: payable(address(0)),
            price: startingPrice,
            listingType: ListingType.Auction,
            startTime: startTime,
            endTime: endTime,
            highestBidder: address(0),
            highestBid: 0,
            sold: false
        });
        
        tokenIdToItemId[tokenId] = itemId;
        
        nftContract.transferFrom(msg.sender, address(this), tokenId);
        
        emit MarketItemCreated(
            itemId,
            tokenId,
            msg.sender,
            address(0),
            startingPrice,
            ListingType.Auction,
            startTime,
            endTime
        );
    }
    
    /**
     * @dev Places a bid on an auction
     * @param itemId Item ID
     * @param bid Bid amount in FILM tokens
     */
    function placeBid(uint256 itemId, uint256 bid) external nonReentrant whenNotPaused {
        MarketItem storage item = idToMarketItem[itemId];
        
        require(item.listingType == ListingType.Auction, "Item is not an auction");
        require(block.timestamp >= item.startTime, "Auction has not started");
        require(block.timestamp <= item.endTime, "Auction has ended");
        require(!item.sold, "Item already sold");
        require(bid > item.highestBid, "Bid must be higher than current highest bid");
        require(bid >= item.price, "Bid must be at least the starting price");
        
        // If there was a previous bid, refund it
        if (item.highestBidder != address(0)) {
            require(filmToken.transfer(item.highestBidder, item.highestBid), "Refund failed");
        }
        
        // Transfer tokens from bidder to contract
        require(filmToken.transferFrom(msg.sender, address(this), bid), "Transfer failed");
        
        // Update highest bid
        item.highestBidder = msg.sender;
        item.highestBid = bid;
        itemBids[itemId][msg.sender] = bid;
        
        emit AuctionBid(itemId, item.tokenId, msg.sender, bid);
    }
    
    /**
     * @dev Ends an auction
     * @param itemId Item ID
     */
    function endAuction(uint256 itemId) external nonReentrant whenNotPaused {
        MarketItem storage item = idToMarketItem[itemId];
        
        require(item.listingType == ListingType.Auction, "Item is not an auction");
        require(block.timestamp > item.endTime, "Auction has not ended");
        require(!item.sold, "Auction already finalized");
        
        item.sold = true;
        
        if (item.highestBidder != address(0)) {
            // Calculate platform fee and royalties
            uint256 price = item.highestBid;
            uint256 fee = (price * platformFee) / 10000;
            
            // Get royalty information
            (address royaltyReceiver, uint256 royaltyAmount) = nftContract.royaltyInfo(item.tokenId, price);
            
            // Calculate seller amount
            uint256 sellerAmount = price - fee - royaltyAmount;
            
            // Transfer NFT to highest bidder
            nftContract.transferFrom(address(this), item.highestBidder, item.tokenId);
            item.owner = payable(item.highestBidder);
            
            // Transfer tokens to seller
            require(filmToken.transfer(item.seller, sellerAmount), "Transfer to seller failed");
            
            // Transfer royalties
            if (royaltyAmount > 0) {
                require(filmToken.transfer(royaltyReceiver, royaltyAmount), "Royalty transfer failed");
            }
            
            _itemsSold.increment();
            
            emit MarketItemSold(
                itemId,
                item.tokenId,
                item.seller,
                item.highestBidder,
                price
            );
            
            emit AuctionEnded(
                itemId,
                item.tokenId,
                item.highestBidder,
                price
            );
        } else {
            // No bids, return NFT to seller
            nftContract.transferFrom(address(this), item.seller, item.tokenId);
            item.owner = payable(item.seller);
            
            emit AuctionEnded(
                itemId,
                item.tokenId,
                item.seller,
                0
            );
        }
    }
    
    /**
     * @dev Purchases a fixed price market item
     * @param itemId Item ID
     */
    function createMarketSale(uint256 itemId) external nonReentrant whenNotPaused {
        MarketItem storage item = idToMarketItem[itemId];
        
        require(item.listingType == ListingType.FixedPrice, "Item is not fixed price");
        require(!item.sold, "Item already sold");
        
        uint256 price = item.price;
        uint256 tokenId = item.tokenId;
        
        // Calculate platform fee and royalties
        uint256 fee = (price * platformFee) / 10000;
        
        // Get royalty information
        (address royaltyReceiver, uint256 royaltyAmount) = nftContract.royaltyInfo(tokenId, price);
        
        // Calculate seller amount
        uint256 sellerAmount = price - fee - royaltyAmount;
        
        // Transfer tokens from buyer to contract
        require(filmToken.transferFrom(msg.sender, address(this), price), "Transfer failed");
        
        // Transfer tokens to seller
        require(filmToken.transfer(item.seller, sellerAmount), "Transfer to seller failed");
        
        // Transfer royalties
        if (royaltyAmount > 0) {
            require(filmToken.transfer(royaltyReceiver, royaltyAmount), "Royalty transfer failed");
        }
        
        // Transfer NFT to buyer
        nftContract.transferFrom(address(this), msg.sender, tokenId);
        
        item.owner = payable(msg.sender);
        item.sold = true;
        _itemsSold.increment();
        
        emit MarketItemSold(
            itemId,
            tokenId,
            item.seller,
            msg.sender,
            price
        );
    }
    
    /**
     * @dev Cancels a market item listing
     * @param itemId Item ID
     */
    function cancelMarketItem(uint256 itemId) external nonReentrant whenNotPaused {
        MarketItem storage item = idToMarketItem[itemId];
        
        require(item.seller == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");
        require(!item.sold, "Item already sold");
        
        if (item.listingType == ListingType.Auction && item.highestBidder != address(0)) {
            // Refund highest bidder
            require(filmToken.transfer(item.highestBidder, item.highestBid), "Refund failed");
        }
        
        // Return NFT to seller
        nftContract.transferFrom(address(this), item.seller, item.tokenId);
        
        item.owner = payable(item.seller);
        item.sold = true;
    }
    
    /**
     * @dev Fetches all unsold market items
     * @return Array of market items
     */
    function fetchMarketItems() external view returns (MarketItem[] memory) {
        uint256 itemCount = _itemIds.current();
        uint256 unsoldItemCount = itemCount - _itemsSold.current();
        
        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i <= itemCount; i++) {
            if (!idToMarketItem[i].sold) {
                items[currentIndex] = idToMarketItem[i];
                currentIndex++;
            }
        }
        
        return items;
    }
    
    /**
     * @dev Fetches market items owned by the caller
     * @return Array of market items
     */
    function fetchMyNFTs() external view returns (MarketItem[] memory) {
        uint256 totalItemCount = _itemIds.current();
        uint256 itemCount = 0;
        
        // Count items owned by caller
        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (idToMarketItem[i].owner == msg.sender) {
                itemCount++;
            }
        }
        
        MarketItem[] memory items = new MarketItem[](itemCount);
        uint256 currentIndex = 0;
        
        // Populate array with items owned by caller
        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (idToMarketItem[i].owner == msg.sender) {
                items[currentIndex] = idToMarketItem[i];
                currentIndex++;
            }
        }
        
        return items;
    }
    
    /**
     * @dev Fetches market items created by the caller
     * @return Array of market items
     */
    function fetchItemsCreated() external view returns (MarketItem[] memory) {
        uint256 totalItemCount = _itemIds.current();
        uint256 itemCount = 0;
        
        // Count items created by caller
        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (idToMarketItem[i].seller == msg.sender) {
                itemCount++;
            }
        }
        
        MarketItem[] memory items = new MarketItem[](itemCount);
        uint256 currentIndex = 0;
        
        // Populate array with items created by caller
        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (idToMarketItem[i].seller == msg.sender) {
                items[currentIndex] = idToMarketItem[i];
                currentIndex++;
            }
        }
        
        return items;
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
}

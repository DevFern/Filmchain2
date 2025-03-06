// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FilmNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;
    
    constructor() ERC721("FilmChain NFT", "FILMNFT") {}
    
    function mintNFT(address recipient, string memory tokenURI) public onlyOwner returns (uint256) {
        _tokenIds++;
        
        uint256 newItemId = _tokenIds;
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);
        
        return newItemId;
    }
}

contract NFTMarket is ReentrancyGuard, Ownable {
    IERC20 public filmToken;
    FilmNFT public nftContract;
    
    struct MarketItem {
        uint256 tokenId;
        address payable seller;
        uint256 price;
        bool sold;
    }
    
    mapping(uint256 => MarketItem) private idToMarketItem;
    uint256 private _itemsSold;
    uint256 private _itemCount;
    
    uint256 public platformFee = 250; // 2.5% fee (in basis points)
    
    event MarketItemCreated(
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );
    
    event MarketItemSold(
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price
    );
    
    constructor(address _filmToken, address _nftContract) {
        filmToken = IERC20(_filmToken);
        nftContract = FilmNFT(_nftContract);
    }
    
    function createMarketItem(uint256 tokenId, uint256 price) public nonReentrant {
        require(price > 0, "Price must be at least 1 wei");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Only item owner can create market item");
        
        _itemCount++;
        
        idToMarketItem[tokenId] = MarketItem(
            tokenId,
            payable(msg.sender),
            price,
            false
        );
        
        nftContract.transferFrom(msg.sender, address(this), tokenId);
        
        emit MarketItemCreated(tokenId, msg.sender, price);
    }
    
    function createMarketSale(uint256 tokenId) public nonReentrant {
        MarketItem storage item = idToMarketItem[tokenId];
        uint256 price = item.price;
        address seller = item.seller;
        
        require(!item.sold, "Item already sold");
        
        // Calculate platform fee
        uint256 fee = (price * platformFee) / 10000;
        uint256 sellerAmount = price - fee;
        
        // Transfer tokens from buyer to contract
        require(filmToken.transferFrom(msg.sender, address(this), price), "Transfer failed");
        
        // Transfer tokens to seller
        require(filmToken.transfer(seller, sellerAmount), "Transfer to seller failed");
        
        // Transfer NFT to buyer
        nftContract.transferFrom(address(this), msg.sender, tokenId);
        
        item.sold = true;
        _itemsSold++;
        
        emit MarketItemSold(tokenId, seller, msg.sender, price);
    }
    
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint256 unsoldItemCount = _itemCount - _itemsSold;
        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i <= _itemCount; i++) {
            if (!idToMarketItem[i].sold) {
                items[currentIndex] = idToMarketItem[i];
                currentIndex++;
            }
        }
        
        return items;
    }
    
    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        uint256 totalItemCount = _itemCount;
        uint256 itemCount = 0;
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (nftContract.ownerOf(i) == msg.sender) {
                itemCount++;
            }
        }
        
        MarketItem[] memory items = new MarketItem[](itemCount);
        
        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (nftContract.ownerOf(i) == msg.sender) {
                items[currentIndex] = idToMarketItem[i];
                currentIndex++;
            }
        }
        
        return items;
    }
    
    function withdrawFees() public onlyOwner {
        uint256 balance = filmToken.balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");
        
        require(filmToken.transfer(owner(), balance), "Transfer failed");
    }
    
    function setPlatformFee(uint256 _fee) public onlyOwner {
        require(_fee <= 1000, "Fee cannot exceed 10%");
        platformFee = _fee;
    }
}

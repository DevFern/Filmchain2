// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FilmToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 10_000_000_042 * 10**18;
    
    constructor() ERC20("FILM Chain", "FILM") {
        // Mint initial supply to deployer
        _mint(msg.sender, MAX_SUPPLY);
    }
    
    // Additional functions for token utility within the ecosystem
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}

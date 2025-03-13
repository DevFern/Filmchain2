// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title FilmToken
 * @dev ERC20 token for the FilmChain ecosystem with governance, vesting, and burning capabilities
 */
contract FilmToken is 
    Initializable, 
    ERC20Upgradeable, 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    UUPSUpgradeable 
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    uint256 public constant MAX_SUPPLY = 10_000_000_042 * 10**18;
    uint256 public totalBurned;
    
    // Vesting schedule structure
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 duration;
        uint256 cliff;
        bool revocable;
        bool revoked;
    }
    
    // Mapping of address to vesting schedules
    mapping(address => VestingSchedule[]) public vestingSchedules;
    
    // Events
    event TokensBurned(address indexed burner, uint256 amount);
    event VestingScheduleCreated(address indexed beneficiary, uint256 amount, uint256 startTime, uint256 duration);
    event VestingScheduleRevoked(address indexed beneficiary, uint256 scheduleIndex);
    event TokensReleased(address indexed beneficiary, uint256 amount);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initializes the contract with initial supply and roles
     */
    function initialize(address admin) public initializer {
        __ERC20_init("FILM Chain", "FILM");
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
        
        // Mint initial supply to admin
        _mint(admin, MAX_SUPPLY);
    }
    
    /**
     * @dev Creates a new vesting schedule for a beneficiary
     * @param beneficiary Address of the beneficiary
     * @param amount Total amount of tokens to be vested
     * @param startTime Start time of the vesting period
     * @param duration Duration of the vesting period in seconds
     * @param cliff Cliff period in seconds
     * @param revocable Whether the vesting is revocable or not
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 startTime,
        uint256 duration,
        uint256 cliff,
        bool revocable
    ) external onlyRole(ADMIN_ROLE) {
        require(beneficiary != address(0), "Beneficiary cannot be zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(startTime >= block.timestamp, "Start time must be in the future");
        
        VestingSchedule memory schedule = VestingSchedule({
            totalAmount: amount,
            releasedAmount: 0,
            startTime: startTime,
            duration: duration,
            cliff: cliff,
            revocable: revocable,
            revoked: false
        });
        
        vestingSchedules[beneficiary].push(schedule);
        
        // Transfer tokens to this contract
        _transfer(msg.sender, address(this), amount);
        
        emit VestingScheduleCreated(beneficiary, amount, startTime, duration);
    }
    
    /**
     * @dev Releases vested tokens for a beneficiary
     * @param scheduleIndex Index of the vesting schedule
     */
    function releaseVestedTokens(uint256 scheduleIndex) external {
        VestingSchedule storage schedule = vestingSchedules[msg.sender][scheduleIndex];
        require(!schedule.revoked, "Vesting schedule revoked");
        
        uint256 releasable = _computeReleasableAmount(schedule);
        require(releasable > 0, "No tokens are due for release");
        
        schedule.releasedAmount += releasable;
        
        _transfer(address(this), msg.sender, releasable);
        
        emit TokensReleased(msg.sender, releasable);
    }
    
    /**
     * @dev Revokes a vesting schedule
     * @param beneficiary Address of the beneficiary
     * @param scheduleIndex Index of the vesting schedule
     */
    function revokeVestingSchedule(address beneficiary, uint256 scheduleIndex) external onlyRole(ADMIN_ROLE) {
        VestingSchedule storage schedule = vestingSchedules[beneficiary][scheduleIndex];
        require(schedule.revocable, "Schedule is not revocable");
        require(!schedule.revoked, "Schedule already revoked");
        
        uint256 releasable = _computeReleasableAmount(schedule);
        
        // Release vested tokens
        if (releasable > 0) {
            schedule.releasedAmount += releasable;
            _transfer(address(this), beneficiary, releasable);
        }
        
        // Return unvested tokens to admin
        uint256 unreleased = schedule.totalAmount - schedule.releasedAmount;
        if (unreleased > 0) {
            _transfer(address(this), msg.sender, unreleased);
        }
        
        schedule.revoked = true;
        
        emit VestingScheduleRevoked(beneficiary, scheduleIndex);
    }
    
    /**
     * @dev Burns tokens from the caller's balance
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) public whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        
        _burn(msg.sender, amount);
        totalBurned += amount;
        
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @dev Burns tokens from a specified account (requires BURNER_ROLE)
     * @param account Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address account, uint256 amount) public whenNotPaused onlyRole(BURNER_ROLE) {
        require(amount > 0, "Amount must be greater than 0");
        
        _burn(account, amount);
        totalBurned += amount;
        
        emit TokensBurned(account, amount);
    }
    
    /**
     * @dev Mints new tokens (requires MINTER_ROLE)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public whenNotPaused onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
    
    /**
     * @dev Pauses all token transfers
     */
    function pause() public onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpauses all token transfers
     */
    function unpause() public onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Hook that is called before any transfer of tokens
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Computes the releasable amount for a vesting schedule
     * @param schedule The vesting schedule
     * @return The releasable amount
     */
    function _computeReleasableAmount(VestingSchedule memory schedule) internal view returns (uint256) {
        if (block.timestamp < schedule.startTime + schedule.cliff) {
            return 0;
        }
        
        if (block.timestamp >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount - schedule.releasedAmount;
        }
        
        uint256 timeFromStart = block.timestamp - schedule.startTime;
        uint256 vestedAmount = (schedule.totalAmount * timeFromStart) / schedule.duration;
        
        return vestedAmount - schedule.releasedAmount;
    }
    
    /**
     * @dev Function that should revert when msg.sender is not authorized to upgrade the contract
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
    
    /**
     * @dev Returns the number of vesting schedules for a beneficiary
     * @param beneficiary Address of the beneficiary
     * @return The number of vesting schedules
     */
    function getVestingSchedulesCount(address beneficiary) external view returns (uint256) {
        return vestingSchedules[beneficiary].length;
    }
    
    /**
     * @dev Returns the vested amount for a beneficiary's schedule
     * @param beneficiary Address of the beneficiary
     * @param scheduleIndex Index of the vesting schedule
     * @return The vested amount
     */
    function getVestedAmount(address beneficiary, uint256 scheduleIndex) external view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary][scheduleIndex];
        
        if (schedule.revoked) {
            return schedule.releasedAmount;
        }
        
        if (block.timestamp < schedule.startTime + schedule.cliff) {
            return 0;
        }
        
        if (block.timestamp >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount;
        }
        
        uint256 timeFromStart = block.timestamp - schedule.startTime;
        return (schedule.totalAmount * timeFromStart) / schedule.duration;
    }
}

//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IVault.sol";

contract Vault is Ownable, ReentrancyGuard, Pausable, IVault {
    using SafeERC20 for IERC20;

    string public assetName;
    address public asset;
    address public admin;
    address public operator;
    uint256 public depositLimit = 1e10;
    uint256 public withdrawLimit = 1e10;
    uint256 public withdrawTimeGap = 24 * 3600;

    struct AddrInfo {
        uint256 recentDeposit;
        uint256 totalDeposit;
        uint256 withdrawable;
        uint256 lastWithdrawTime;
    }

    mapping(address => AddrInfo) private _addrInfo;
    mapping(address => bool) private _pauser;

    event Deposit(address indexed from, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event TransferAsset(address indexed to, uint256 amount);

    constructor(string memory _assetName, address _asset, address _admin) {
        assetName = _assetName;
        asset = _asset;
        admin = _admin;
    }

    modifier onlyAdmin() {
        require(_msgSender() == admin, "Admin only");
        _;
    }

    modifier onlyOperator() {
        require(_msgSender() == operator, "Operator only");
        _;
    }

    function changeAdmin(address _admin) external onlyAdmin {
        admin = _admin;
    }
    
    function setOperator(address _operator) external onlyAdmin {
        operator = _operator;
    }

    function setDepositLimit(uint256 limit) external onlyAdmin {
        depositLimit = limit;
    }

    function setWithdrawLimit(uint256 limit) external onlyAdmin {
        withdrawLimit = limit;
    }

    function setWithdrawTimeGap(uint256 gap) external onlyAdmin {
        withdrawTimeGap = gap;
    }

    function getAddrInfo(address addr) external view returns (uint256, uint256, uint256, uint256) {
        AddrInfo memory info = _addrInfo[addr];
        return (info.recentDeposit, info.totalDeposit, info.withdrawable, info.lastWithdrawTime);
    }

    function addPauser(address pauser, bool enabled) external onlyAdmin {
        _pauser[pauser] = enabled;
    }

    function setPause(bool val) external {
        require(_pauser[_msgSender()], "Pauser only");
        if (val) {
            _pause();
        } else {
            _unpause();
        }
    }

    function deposit(uint256 amount, address onBehalfOf) external nonReentrant whenNotPaused {
        require(amount > 0, "No 0");
        require(amount <= depositLimit, "Exceeds deposit limit");
        require(onBehalfOf != address(0), "Unvalid onBehalfOf");
        // require(IERC20(asset).balanceOf(_msgSender()) >= amount, "No enough token");
        // require(IERC20(asset).approve(address(this), amount));
        emit Deposit(onBehalfOf, amount);
        IERC20(asset).safeTransferFrom(_msgSender(), address(this), amount);
        _addrInfo[onBehalfOf].recentDeposit = amount;
        _addrInfo[onBehalfOf].totalDeposit += amount;
    }

    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "No 0");
        require(amount <= _addrInfo[_msgSender()].withdrawable, "Exceeds withrawable");
        uint256 time = block.timestamp;
        require(time >= _addrInfo[_msgSender()].lastWithdrawTime + withdrawTimeGap, "Not within withdraw time gap");
        emit Withdraw(_msgSender(), amount);
        _addrInfo[_msgSender()].withdrawable -= amount;
        _addrInfo[_msgSender()].lastWithdrawTime = time;
        IERC20(asset).safeTransfer(_msgSender(), amount);
    }

    function setWithdrawable(address to, uint256 amount) external nonReentrant whenNotPaused onlyOperator {
        require(amount <= _addrInfo[to].totalDeposit, "Exceeds total deposit");
        require(amount <= withdrawLimit, "Exceeds withdraw limit");
        _addrInfo[to].withdrawable = amount;
    }

    /**
     * @dev Transfer USDI
     */
    function transferAsset(address to, uint256 amount) external onlyAdmin {
        // require(amount <= IERC20(asset).balanceOf(address(this)), "No enough balance");
        emit TransferAsset(to, amount);
        IERC20(asset).safeTransfer(to, amount);
    }
}

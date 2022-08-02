//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract Exchange is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    address public usdt;
    address public sdgi;
    address public admin;
    uint256 public exchangeFee = 100;   // 100 means 1%
    mapping(address => bool) private _pauser;
    AggregatorV3Interface internal priceFeed;

    event ExchangeUSDT2SDGI(address indexed from, uint256 usdt, uint256 sdgi);
    event ExchangeSDGI2USDT(address indexed from, uint256 sdgi, uint256 usdt, uint256 fee);

    constructor(address _usdt, address _sdgi, address _admin, address oracle) {
        usdt = _usdt;
        sdgi = _sdgi;
        admin = _admin;
        priceFeed = AggregatorV3Interface(oracle);
    }

    modifier onlyAdmin() {
        require(_msgSender() == admin, "Admin only");
        _;
    }

    function changeAdmin(address _admin) external onlyAdmin {
        admin = _admin;
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

    function withdraw(address to, address asset, uint256 amount) external onlyAdmin {
        require(amount > 0, "No 0");
        require(asset == usdt || asset == sdgi, "Wrong asset");
        // require(amount <= IERC20(asset).balanceOf(address(this)), "No enough balance");
        IERC20(asset).safeTransfer(to, amount);
    }

    function usdt2sdgi(uint256 amount) external nonReentrant whenNotPaused returns (uint256) {
        if (amount > 0) {
            require(amount <= IERC20(usdt).balanceOf(_msgSender()), "No enough balance");
            (, int256 price, , ,) = priceFeed.latestRoundData();
            uint256 sdgiOut = amount * (10 ** uint256(priceFeed.decimals())) / uint256(price);
            // require(sdgiOut <= IERC20(sdgi).balanceOf(address(this)), "Exchange has no enough balance");
            // require(IERC20(usdt).approve(address(this), amount));
            emit ExchangeUSDT2SDGI(_msgSender(), amount, sdgiOut);
            IERC20(usdt).safeTransferFrom(_msgSender(), address(this), amount);
            IERC20(sdgi).safeTransfer(_msgSender(), sdgiOut);
            return sdgiOut;
        } else {
            return 0;
        }
    }

    function sdgi2usdt(uint256 amount) external nonReentrant whenNotPaused returns (uint256) {
        if (amount > 0) {
            require(amount <= IERC20(sdgi).balanceOf(_msgSender()), "No enough balance");
            (, int256 price, , ,) = priceFeed.latestRoundData();
            uint256 usdtOut = amount * uint256(price) / (10 ** uint256(priceFeed.decimals()));
            uint256 fee = usdtOut * exchangeFee / 1e4;
            // require((usdtOut - fee) <= IERC20(usdt).balanceOf(address(this)), "Exchange has no enough balance");
            // require(IERC20(sdgi).approve(address(this), amount));
            emit ExchangeSDGI2USDT(_msgSender(), amount, usdtOut - fee, fee);
            IERC20(sdgi).safeTransferFrom(_msgSender(), address(this), amount);
            IERC20(usdt).safeTransfer(_msgSender(), usdtOut - fee);
            return usdtOut - fee;
        } else {
            return 0;
        }
    }
}
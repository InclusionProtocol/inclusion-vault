//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IExchange.sol";
import "./IVault.sol";

contract SwapAndDeposit is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public usdt;
    address public sdgi;
    address public exchange;
    address public vault;

    constructor(address _usdt, address _sdgi, address _exchange, address _vault) {
        usdt = _usdt;
        sdgi = _sdgi;
        exchange = _exchange;
        vault = _vault;
    }

    function authorizeExchangeNVault() external onlyOwner {
        IERC20(usdt).approve(exchange, type(uint256).max);
        IERC20(sdgi).approve(vault, type(uint256).max);
    }

    function swapNDeposit(uint256 amount) external nonReentrant {
        IERC20(usdt).safeTransferFrom(_msgSender(), address(this), amount);
        uint256 sdgiOut = IExchange(exchange).usdt2sdgi(amount);
        IVault(vault).deposit(sdgiOut, _msgSender());
    }
}
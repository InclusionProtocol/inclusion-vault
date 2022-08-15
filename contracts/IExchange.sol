//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IExchange {
    function usdt2sdgi(uint256 amount) external returns (uint256);

    function sdgi2usdt(uint256 amount) external returns (uint256);
}
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IVault {
    function deposit(uint256 amount, address onBehalfOf) external;

    function withdraw(uint256 amount) external;
}
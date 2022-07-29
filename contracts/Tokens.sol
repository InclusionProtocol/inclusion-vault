//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract USDT is ERC20 {
    constructor(uint256 initialSupply) public ERC20("USD Tether", "USDT") {
        _mint(_msgSender(), initialSupply);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}

contract SDGI is ERC20 {
    constructor(uint256 initialSupply) public ERC20("SDG Inclusion", "SDGI") {
        _mint(_msgSender(), initialSupply);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}

contract SDG2USD is AggregatorV3Interface {
    function latestRoundData() external view virtual override returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        answer = 72000000;
    }

    function decimals() external view virtual override returns (uint8) {
        return 8;
    }

    function description() external view virtual override returns (string memory) {
        return "mock oracle";
    }

    function version() external view virtual override returns (uint256) {
        return 1;
    }

    function getRoundData(uint80 _roundId) external view virtual override returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
    }
}
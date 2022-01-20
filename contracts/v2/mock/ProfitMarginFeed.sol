// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.11;

contract ProfitMarginFeed {
    int256 answerToReturn;

    constructor(int256 _answer) {
        answerToReturn = _answer;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (92233720368547762337, answerToReturn, 1629740123, 1629740123, 92233720368547762337);
    }
}

// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MarsToken is ERC20 {

    constructor() ERC20("MarsToken", "MARS") {
        // _mint(msg.sender, 100000000e18);
    }

    //only for testing
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
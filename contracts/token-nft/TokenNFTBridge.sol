// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "hardhat/console.sol";

contract TokenNFTBridge {
    IERC20 public immutable token;
    IERC721 public immutable nft;
    uint public immutable price;

    constructor(address tokenAddr, address nftAddr, uint _price) {
        token = IERC20(tokenAddr);
        nft = IERC721(nftAddr);
        price = _price;
    }

    function tokenToNFTs(uint[] calldata tokenIds) public {
        token.transferFrom(msg.sender, address(this), tokenIds.length * price);

        for (uint i = 0; i < tokenIds.length; i++) {
            uint tokenId = tokenIds[i];
            nft.transferFrom(address(this), msg.sender, tokenId);
        }
    }

    function NFTsToToken(uint[] calldata tokenIds) public {
        for (uint i = 0; i < tokenIds.length; i++) {
            uint tokenId = tokenIds[i];
            nft.transferFrom(msg.sender, address(this), tokenId);
        }

        token.transfer(msg.sender, tokenIds.length * price);
    }
}
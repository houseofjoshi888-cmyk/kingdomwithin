// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MalkutaEngine is ERC721, Ownable {
    struct TokenProvenance {
        string protocolVersion;
        string mappingDigest;
        bytes32 contentHash; // IPFS/Arweave Hash
    }

    mapping(uint256 => TokenProvenance) public provenance;

    event MandalaMinted(uint256 indexed tokenId, bytes32 contentHash, string protocolVersion);

    constructor() ERC721("MalkutaMandala", "MKT") Ownable(msg.sender) {}

    function mint(
        address to,
        uint256 tokenId,
        bytes32 _contentHash,
        string memory _version,
        string memory _digest
    ) external {
        _safeMint(to, tokenId);
        provenance[tokenId] = TokenProvenance(_version, _digest, _contentHash);
        emit MandalaMinted(tokenId, _contentHash, _version);
    }
}

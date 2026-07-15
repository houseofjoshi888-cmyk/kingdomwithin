// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MalkutaEngine is ERC721, AccessControl {
    using Strings for uint256;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Epoch {
        uint256 mintPrice;
        bool isActive;
        string name;
    }

    // Provenance Tracking: Maps Token ID to its metadata hash
    struct Provenance {
        bytes32 contentHash; // IPFS URI hash
        string protocolVersion;
        uint256 epochId;
        uint256 timestamp;
    }

    uint256 public currentEpochId;
    mapping(uint256 => Epoch) public epochs;
    mapping(uint256 => Provenance) public tokenProvenance;

    event MandalaMinted(uint256 indexed tokenId, uint256 indexed epochId, bytes32 contentHash);

    constructor() ERC721("MalkutaMandala", "MKT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        // Initialize Genesis Epoch
        epochs[0] = Epoch(0.01 ether, true, "Genesis");
        currentEpochId = 0;
    }

    // MINT: The primary interaction point for the "Freedom Engine"
    function mint(uint256 tokenId, bytes32 _contentHash, string memory _version) external payable {
        require(epochs[currentEpochId].isActive, "Current epoch is closed.");
        require(msg.value >= epochs[currentEpochId].mintPrice, "Insufficient payment for minting.");
        require(_ownerOf(tokenId) == address(0), "Token ID already exists.");

        _safeMint(msg.sender, tokenId);

        tokenProvenance[tokenId] = Provenance({
            contentHash: _contentHash,
            protocolVersion: _version,
            epochId: currentEpochId,
            timestamp: block.timestamp
        });

        emit MandalaMinted(tokenId, currentEpochId, _contentHash);
    }

    // ADMIN: Update epoch settings
    function setEpoch(uint256 _id, uint256 _price, bool _active, string memory _name) external onlyRole(ADMIN_ROLE) {
        epochs[_id] = Epoch(_price, _active, _name);
        currentEpochId = _id;
    }

    // ADMIN: Withdraw accumulated funds
    function withdraw() external onlyRole(ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }

    // Necessary override for AccessControl
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

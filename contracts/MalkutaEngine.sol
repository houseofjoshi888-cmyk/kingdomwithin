// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MalkutaEngine is ERC721URIStorage, AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    address payable public constant HOUSE_WALLET = payable(0x6736d2eA9807297F0e56967361B9410854B86a5f);

    struct Epoch {
        uint256 mintPrice;
        bool isActive;
        string name;
    }

    struct Provenance {
        bytes32 contentHash;
        string protocolVersion;
        string metadataURI;
        uint256 epochId;
        uint256 timestamp;
    }

    uint256 public currentEpochId;
    uint256 private _totalMinted;
    mapping(uint256 => Epoch) public epochs;
    mapping(uint256 => Provenance) public tokenProvenance;

    event MandalaMinted(
        uint256 indexed tokenId,
        uint256 indexed epochId,
        address indexed recipient,
        address operator,
        bytes32 contentHash,
        string protocolVersion,
        string metadataURI,
        uint256 price
    );
    event EpochConfigured(uint256 indexed epochId, uint256 mintPrice, bool isActive, string name);
    event ProceedsWithdrawn(address indexed recipient, uint256 amount);

    constructor() ERC721("MalkutaMandala", "MKT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        epochs[0] = Epoch(0.01 ether, true, "Genesis");
        emit EpochConfigured(0, 0.01 ether, true, "Genesis");
    }

    function mint(
        uint256 tokenId,
        bytes32 contentHash,
        string calldata protocolVersion,
        string calldata metadataURI
    ) external payable nonReentrant {
        Epoch memory epoch = epochs[currentEpochId];
        require(epoch.isActive, "Current epoch is closed.");
        require(msg.value == epoch.mintPrice, "Incorrect mint payment.");
        _mintMandala(msg.sender, tokenId, contentHash, protocolVersion, metadataURI, msg.value);
    }

    function airdrop(
        address recipient,
        uint256 tokenId,
        bytes32 contentHash,
        string calldata protocolVersion,
        string calldata metadataURI
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        _mintMandala(recipient, tokenId, contentHash, protocolVersion, metadataURI, 0);
    }

    function _mintMandala(
        address recipient,
        uint256 tokenId,
        bytes32 contentHash,
        string calldata protocolVersion,
        string calldata metadataURI,
        uint256 price
    ) internal {
        require(recipient != address(0), "Invalid recipient.");
        require(tokenId == uint256(keccak256(abi.encodePacked(recipient, contentHash))), "Invalid token ID.");
        require(_ownerOf(tokenId) == address(0), "Token ID already exists.");
        require(contentHash != bytes32(0), "Content hash required.");
        require(bytes(protocolVersion).length != 0, "Protocol version required.");
        require(bytes(metadataURI).length != 0, "Metadata URI required.");

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);
        _totalMinted++;

        tokenProvenance[tokenId] = Provenance({
            contentHash: contentHash,
            protocolVersion: protocolVersion,
            metadataURI: metadataURI,
            epochId: currentEpochId,
            timestamp: block.timestamp
        });

        emit MandalaMinted(
            tokenId,
            currentEpochId,
            recipient,
            msg.sender,
            contentHash,
            protocolVersion,
            metadataURI,
            price
        );
    }

    function setEpoch(uint256 id, uint256 price, bool active, string calldata name) external onlyRole(ADMIN_ROLE) {
        require(bytes(name).length != 0, "Epoch name required.");
        epochs[id] = Epoch(price, active, name);
        currentEpochId = id;
        emit EpochConfigured(id, price, active, name);
    }

    function withdraw() external onlyRole(ADMIN_ROLE) nonReentrant {
        uint256 amount = address(this).balance;
        require(amount != 0, "No proceeds.");
        (bool success, ) = HOUSE_WALLET.call{value: amount}("");
        require(success, "Withdrawal failed.");
        emit ProceedsWithdrawn(HOUSE_WALLET, amount);
    }

    function totalSupply() external view returns (uint256) {
        return _totalMinted;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

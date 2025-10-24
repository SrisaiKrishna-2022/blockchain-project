// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract CampusCredits {
    address public admin;
    mapping(address => uint256) public balanceOf;

    event CreditsMinted(address indexed to, uint256 amount, string reason, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor(address _admin) {
        admin = _admin;
    }

    // Admin mints credits to a student's wallet address
    function mintCredits(address to, uint256 amount, string calldata reason) external onlyAdmin {
        require(to != address(0), "Invalid address");
        require(amount > 0, "Amount must be > 0");
        balanceOf[to] += amount;
        emit CreditsMinted(to, amount, reason, block.timestamp);
    }
}

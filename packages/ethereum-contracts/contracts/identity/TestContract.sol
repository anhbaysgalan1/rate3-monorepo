pragma solidity 0.4.24;

import "./lib/ERC165Query.sol";
import "./ERC/ERC735.sol";


/**
 * @title TestContract
 * @author Mircea Pasoi
 * @dev Contract used in unit tests
 */
contract TestContract {
    // Implements ERC165
    using ERC165Query for address;

    // Events
    event IdentityCalled(bytes data);

    // Counts calls by msg.sender
    mapping (address => uint) public numCalls;

    /**
     * @dev Increments the number of calls from sender
     */
    function callMe() external {
        numCalls[msg.sender] += 1;
    }

    /**
     * @dev Expects to be called by an ERC735 contract and it will emit the label
     *  of the first LABEL claim in that contract
     */
    function whoCalling() external {
        // ERC735
        require(msg.sender.doesContractImplementInterface(0xb6b4ee6d));
        // Get first claim
        ERC735 id = ERC735(msg.sender);
        bytes32[] memory claimIds = id.getClaimIdsByTopic(0);
        bytes memory data;
        (, , , , data, ) = id.getClaim(claimIds[5]);
        emit IdentityCalled(data);
    }
}

pragma solidity 0.4.24;

import "./ownership/KeyManageable.sol";


/**
 * @title KeyGetters
 * @author Wu Di
 * @notice Implement getter functions from ERC725 spec
 * @dev Key data is stored using KeyStore library
 * Inspired by Mircea Pasoi's implementation at https://github.com/mirceapasoi/erc725-735
 */
contract KeyGetters is KeyManageable {
    /**
     * @dev Find the key data, if held by the identity
     * @param _key Key bytes to find
     * @return `(purposes, keyType, key)` tuple if the key exists
     */
    function getKey(bytes32 _key)
        public
        view
        returns(uint256[] purposes, uint256 keyType, bytes32 key)
    {
        KeyStore.Key memory k = executions.allKeys.keyData[_key];
        purposes = k.purposes.values;
        keyType = k.keyType;
        key = k.key;
    }

    /**
     * @dev Find if a key has is present and has the given purpose
     * @param _key Key bytes to find
     * @param purpose Purpose to find
     * @return Boolean indicating whether the key exists or not
     */
    function keyHasPurpose(bytes32 _key, uint256 purpose)
        public
        view
        returns(bool exists)
    {
        return executions.allKeys.find(_key, purpose);
    }

    /**
     * @dev Find all the keys held by this identity for a given purpose
     * @param _purpose Purpose to find
     * @return Array with key bytes for that purpose (empty if none)
     */
    function getKeysByPurpose(uint256 _purpose)
        public
        view
        returns(bytes32[] keys)
    {
        return executions.allKeys.keysByPurpose[_purpose].values;
    }
}
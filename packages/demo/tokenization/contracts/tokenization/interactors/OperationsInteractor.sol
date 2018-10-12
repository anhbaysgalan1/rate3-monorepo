pragma solidity ^0.4.24;

import "../../lib/math/SafeMath.sol";
import "./BaseAdminInteractor.sol";

contract OperationsInteractor is BaseAdminInteractor {
  /* solium-disable security/no-block-members */

  using SafeMath for uint256;

  struct MintRequestOperation {
    address by;
    uint256 value;
    uint256 requestTimestamp;
    address approvedBy;
    bool approved;
    uint256 approvalTimestamp;
    uint256 finalizeTimestamp;
  }

  struct BurnRequestOperation {
    address by;
    uint256 value;
    uint256 requestTimestamp;

    // Demo will not include approval for burning.

    // address approvedBy;
    // bool approved;
    // uint256 approvalTimestamp;
    // uint256 finalizeTimestamp;
  }

  uint256 public operationDelay;

  mapping (address => MintRequestOperation[]) public mintRequestOperations;
  mapping (address => BurnRequestOperation[]) public burnRequestOperations;

  modifier onlyAdminOrOwner() {
    require(msg.sender == admin || msg.sender == owner, "Only allowed for Admin or Owner");
    _;
  }

  event MintOperationRequested(address indexed by, uint256 value, uint256 requestTimestamp, uint256 index);
  event BurnOperationRequested(address indexed by, uint256 value, uint256 requestTimestamp, uint256 index);

  event MintOperationApproved(
    address indexed by,
    address indexed approvedBy,
    uint256 approvalTimestamp,
    uint256 finalizeTimestamp,
    uint256 index
  );
  // event BurnOperationApproved(
  //   address indexed by,
  //   address indexed approvedBy,
  //   uint256 approvalTimestamp,
  //   uint256 finalizeTimestamp,
  //   uint256 index
  // );

  event MintOperationFinalized(address indexed by, address indexed finalizedBy, uint256 finalizedTimestamp, uint256 index);
  // event BurnOperationFinalized(address indexed by, address indexed finalizedBy, uint256 finalizedTimestamp, uint256 index);

  event MintOperationRevoked(address indexed by, address indexed revokedBy, uint256 revokedTimestamp, uint256 index);
  // event BurnOperationRevoked(address indexed by, address indexed revokedBy, uint256 revokedTimestamp, uint256 index);

  constructor(
    TokenizeTemplateToken _token
  )
    public
    BaseAdminInteractor(_token)
  {
    operationDelay = 30 seconds;
  }

  function requestMint(uint256 _value) public {
    uint256 requestTimestamp = block.timestamp;
    MintRequestOperation memory mintRequestOperation = MintRequestOperation(msg.sender, _value, requestTimestamp, address(0), false, 0, 0);

    emit MintOperationRequested(msg.sender, _value, requestTimestamp, mintRequestOperations[msg.sender].length);
    mintRequestOperations[msg.sender].push(mintRequestOperation);
  }

  function approveMint(address _requestor, uint256 _index) public onlyAdminOrOwner {
    MintRequestOperation storage mintRequestOperation = mintRequestOperations[_requestor][_index];

    require(!mintRequestOperation.approved, "MintRequestOperation is already approved");

    uint256 finalizeTimestamp = block.timestamp;
    if (msg.sender != owner) {
      finalizeTimestamp = finalizeTimestamp.add(operationDelay);
    }

    mintRequestOperation.approvedBy = msg.sender;
    mintRequestOperation.approved = true;
    mintRequestOperation.approvalTimestamp = block.timestamp;
    mintRequestOperation.finalizeTimestamp = finalizeTimestamp;

    emit MintOperationApproved(_requestor, msg.sender, block.timestamp, finalizeTimestamp, _index);
  }

  function finalizeMint(address _requestor, uint256 _index) public onlyAdminOrOwner {
    MintRequestOperation memory mintRequestOperation = mintRequestOperations[_requestor][_index];
    require(mintRequestOperation.approved, "Request is not approved");
    require(mintRequestOperation.finalizeTimestamp <= block.timestamp, "Action is still timelocked");
    address mintAddress = mintRequestOperation.by;
    uint256 value = mintRequestOperation.value;
    delete mintRequestOperations[_requestor][_index];
    token.mint(mintAddress, value);

    emit MintOperationFinalized(_requestor, msg.sender, block.timestamp, _index);
  }

  function revokeMint(address _requestor, uint256 _index) public onlyAdminOrOwner {
    delete mintRequestOperations[_requestor][_index];
    emit MintOperationRevoked(_requestor, msg.sender, block.timestamp, _index);
  }

  function requestBurn(uint256 _value) public {
    uint256 requestTimestamp = block.timestamp;
    // BurnRequestOperation memory burnRequestOperation = BurnRequestOperation(msg.sender, _value, requestTimestamp, address(0), false, 0, 0);
    BurnRequestOperation memory burnRequestOperation = BurnRequestOperation(msg.sender, _value, requestTimestamp);

    emit BurnOperationRequested(msg.sender, _value, requestTimestamp, burnRequestOperations[msg.sender].length);
    burnRequestOperations[msg.sender].push(burnRequestOperation);
    address burnAddress = burnRequestOperation.by;
    uint256 value = burnRequestOperation.value;
    token.burn(burnAddress, value);
  }

  // function approveBurn(address _requestor, uint256 _index) public onlyAdminOrOwner {
  //   BurnRequestOperation storage burnRequestOperation = burnRequestOperations[_requestor][_index];

  //   require(!burnRequestOperation.approved, "BurnRequestOperation is already approved");

  //   uint256 finalizeTimestamp = block.timestamp;
  //   if (msg.sender != owner) {
  //     finalizeTimestamp = finalizeTimestamp.add(operationDelay);
  //   }

  //   burnRequestOperation.approvedBy = msg.sender;
  //   burnRequestOperation.approved = true;
  //   burnRequestOperation.approvalTimestamp = block.timestamp;
  //   burnRequestOperation.finalizeTimestamp = finalizeTimestamp;

  //   emit BurnOperationApproved(_requestor, msg.sender, block.timestamp, finalizeTimestamp, _index);
  // }

  // function finalizeBurn(address _requestor, uint256 _index) public onlyAdminOrOwner {
  //   BurnRequestOperation memory burnRequestOperation = burnRequestOperations[_requestor][_index];
  //   require(burnRequestOperation.finalizeTimestamp <= block.timestamp, "Action is still timelocked");
  //   address burnAddress = burnRequestOperation.by;
  //   uint256 value = burnRequestOperation.value;
  //   delete burnRequestOperations[_requestor][_index];
  //   token.burn(burnAddress, value);

  //   emit BurnOperationFinalized(_requestor, msg.sender, block.timestamp, _index);
  // }

  // function revokeBurn(address _requestor, uint256 _index) public onlyAdminOrOwner {
  //   delete burnRequestOperations[_requestor][_index];
  //   emit BurnOperationRevoked(_requestor, msg.sender, block.timestamp, _index);
  // }
}

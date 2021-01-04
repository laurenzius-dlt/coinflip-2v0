import "./provableAPI.sol";
/* provable
*/
import "./Ownable.sol";
pragma solidity 0.5.12;
/* non provable
contract Coinflip is Ownable {
*/
/* provable
*/
contract Coinflip is Ownable, usingProvable {

  uint256 constant NUM_RANDOM_BYTES_REQUESTED = 1;
  uint256 constant POSSIBILITIES = 2;
  uint256 constant QUERY_EXECUTION_DELAY = 0;
  uint256 constant GASLIMIT_FOR_CALLBACK = 2000000;
  uint constant GAMBLING_FEE = 50000000000000000;

  uint public eventnumber;
  uint public totalContractBalance;
  uint public totalPlayerBalance;

  struct Draw {
    address payable player;
    uint bet;
    bool headWins;
    bool isActive;
    bool hasWon;
    uint256 number;
    bytes32 qid;
  }

  mapping (address => uint) private balances;
  mapping (bytes32 => Draw) private draws;

  event logNewProvableQuery(uint eventnr, string description, bytes32 queryId, address addr, uint bet, bool headWins);
  event logProvableQueryAnswered(uint eventnr, address payable player, uint bet, bool headWins, bool isActive, bool hasWon, uint256 number, bytes32 qid, bytes proof);
  event logMyBalanceChanged(uint eventnr, address payable player, uint balance, uint incr, uint decr, string context);
  event coinFlippedAndLost(uint eventnr, address payable player, bytes32 queryId, uint loss);
  event coinFlippedAndWon(uint eventnr, address payable player, bytes32 queryId, uint profit);

  /*
  modifier mincosts(uint cost){
      require(msg.value >= cost, "Not enough Ether!");
      _;
  }
  */
  modifier mincosts(){
      require(GAMBLING_FEE >= cost, "Not enough Ether to pay the gambling fee!");
      _;
  }

  /* non provable
  constructor () public {
  */
  /* provable
  */
  constructor () public payable {
    provable_setProof(proofType_Ledger);
    /* provable
    */
  }

  function eventnr() private returns(uint){
    eventnumber++;
    return eventnumber;
  }

  function flip(bool betOnHeads) public payable mincosts(){
    // the second oracle call requires at least 4000000 wei = 0.004 ether
    // require(GAMBLING_FEE<msg.value,'REQUIRE: flip(): must be more than the gambling fee, which is 0.01 ether');
    myDeposit();
    uint myBet = msg.value - GAMBLING_FEE;
    startDraw(msg.sender, myBet, betOnHeads);
  }

  function startDraw(address payable _player, uint _bet, bool _headwins) private{
    // require(msg.value >= _bet, "REQUIRED: startDraw(): msg.value >= _bet,");
    // require(msg.sender == _player, "REQUIRED: startDraw(): msg.sender == _player");
    uint provableRandomDSQueryPrice = provable_getPrice("random", GASLIMIT_FOR_CALLBACK);
    /* provable
    */

    /* no provable
    uint provableRandomDSQueryPrice = 0;
    */
    require(provableRandomDSQueryPrice < GAMBLING_FEE, "REQUIRED: startDraw(): provableRandomDSQueryPrice < GAMBLING_FEE");
    totalContractBalance += GAMBLING_FEE;
    totalContractBalance -= provableRandomDSQueryPrice;
    require(balances[msg.sender] >= GAMBLING_FEE, "REQUIRED: startDraw(): balances[msg.sender] >= GAMBLING_FEE");
    balances[msg.sender] -= GAMBLING_FEE;
    totalPlayerBalance -= GAMBLING_FEE;

    /* provable
    */
    bytes32 queryId = provable_newRandomDSQuery(
      QUERY_EXECUTION_DELAY,
      NUM_RANDOM_BYTES_REQUESTED,
      GASLIMIT_FOR_CALLBACK
    );

    /* no provable
    bytes32 queryId = testRandom(false);
    */

    if(0x0000000000000000000000000000000000000000 == draws[queryId].player) {
      Draw memory newDraw;
      newDraw.player = _player;
      newDraw.bet = _bet;
      newDraw.headWins = _headwins;
      newDraw.isActive = false;
      newDraw.hasWon = false;
      newDraw.number = 0;
      newDraw.qid = queryId;
      draws[queryId] = newDraw;
    }
    require(false == draws[queryId].isActive, "REQUIRED: startDraw(): draws[queryId].isActive");
    draws[queryId].player = _player;
    draws[queryId].bet = _bet;
    draws[queryId].headWins = _headwins;
    draws[queryId].isActive = true;
    draws[queryId].hasWon = false;
    draws[queryId].number = 0;
    draws[queryId].qid = queryId;
    emit logNewProvableQuery(
        eventnr(),
        "Provable query has been sent...",
        draws[queryId].qid,
        draws[queryId].player,
        draws[queryId].bet,
        draws[queryId].headWins
    );
    /* no provable
    testRandom(true);
    */
  }

  function __callback(bytes32 _queryId, string memory _result, bytes memory _proof) public {
    require(msg.sender == provable_cbAddress());
    /* provable
    */
    assert(POSSIBILITIES <= NUM_RANDOM_BYTES_REQUESTED * 256);
    uint256 randomNumber = uint256(keccak256(abi.encodePacked(_result))) % POSSIBILITIES;

    Draw memory currentDraw = draws[_queryId];
    if(currentDraw.isActive) {
      draws[_queryId].isActive=false;
      bool won = hasWon(randomNumber, currentDraw.headWins);
      currentDraw.number=randomNumber;
      draws[_queryId].number=randomNumber;
      currentDraw.hasWon=won;
      draws[_queryId].hasWon=won;
      emit logProvableQueryAnswered(eventnr(),currentDraw.player,currentDraw.bet,currentDraw.headWins,currentDraw.isActive,currentDraw.hasWon,currentDraw.number,_queryId,_proof);
      currentDraw.isActive=false;
      uint bet = currentDraw.bet;
      uint profit = 0;
      uint chargeback = 0;
      if(won) {
        profit = (totalContractBalance < bet ? totalContractBalance : bet);
        totalContractBalance -= profit;
        chargeback = bet + profit;
        playerBalanceIncrease(currentDraw.player,profit);
        playerWithdraw(currentDraw.player,chargeback); // send back chargeback
        emit coinFlippedAndWon(eventnr(),currentDraw.player,_queryId,profit);
      } else {
        playerBalanceDecrease(currentDraw.player,bet);
        playerWithdrawAll(currentDraw.player); // there should be no balance to withdraw, but just in case ...
        emit coinFlippedAndLost(eventnr(),currentDraw.player,_queryId,bet);
      }
      delete(draws[_queryId]);
    }
  }

  function hasWon(uint256 randomNumber, bool zeroWins) private pure returns(bool) {
    bool isZero = (0 == randomNumber % 2);
    return (zeroWins == isZero);
  }

  function testRandom(bool call) private returns (bytes32) {
    bytes32 queryId = bytes32(keccak256("test"));
    if(call) {
      __callback(queryId, "0", bytes("test"));
    }
    return queryId;
  }

  function myBalance() public view returns(uint) {
    return balances[msg.sender];
  }

  function myDeposit() public payable{
    uint deposit = msg.value;
    balances[msg.sender] += deposit;
    totalPlayerBalance += deposit;
    emit logMyBalanceChanged(eventnr(),msg.sender,balances[msg.sender],deposit,0,"deposit");
  }

  function myWithdraw(uint amount) public payable returns(uint) {
    uint currentBalance = myBalance();
    uint toTransfer = (currentBalance < amount)?currentBalance:amount;
    require(balances[msg.sender]==currentBalance, "REQUIRED: myWithdraw(): balances[msg.sender] != myBalance()");
    balances[msg.sender] -= toTransfer;
    totalPlayerBalance -= toTransfer;
    require(balances[msg.sender]>=0,"REQUIRED: myWithdraw(): balances[msg.sender]>=0");
    msg.sender.transfer(toTransfer);
    emit logMyBalanceChanged(eventnr(),msg.sender,balances[msg.sender],0,toTransfer,"withdraw");
    return toTransfer;
  }

  function myWithdrawAll() public returns(uint) {
    return myWithdraw(myBalance());
  }

  function playerBalanceIncrease(address payable player, uint amount) private returns(uint) {
    require(amount >= 0,"REQUIRED: playerBalanceIncrease(): amount >= 0");
    uint toTransfer = (totalContractBalance < amount)?totalContractBalance:amount;
    balances[player] += toTransfer;
    totalPlayerBalance += toTransfer;
    totalContractBalance -= toTransfer;
    require(totalContractBalance>=0,"REQUIRED: playerBalanceIncrease(): totalContractBalance>=0");
    emit logMyBalanceChanged(eventnr(),player,balances[player],toTransfer,0,"increase");
    return toTransfer;
  }

  function playerBalanceDecrease(address payable player, uint amount) private returns(uint) {
    require(amount >= 0,"REQUIRED: playerBalanceDecrease(): amount >= 0");
    uint currentBalance = balances[player];
    uint toTransfer = (currentBalance < amount)?currentBalance:amount;
    balances[player] -= toTransfer;
    require(balances[player]>=0,"REQUIRED: playerBalanceDecrease(): balances[player]>=0");
    totalPlayerBalance -= toTransfer;
    require(totalPlayerBalance>=0,"REQUIRED: playerBalanceDecrease(): totalPlayerBalance>=0");
    totalContractBalance += toTransfer;
    emit logMyBalanceChanged(eventnr(),player,balances[player],0,toTransfer,"decrease");
    return toTransfer;
  }

  function playerWithdraw(address payable player, uint amount) private returns(uint) {
    uint currentBalance = balances[player];
    uint toTransfer = (currentBalance < amount)?currentBalance:amount;
    assert(balances[player]==currentBalance);
    balances[player] -= toTransfer;
    totalPlayerBalance -= toTransfer;
    assert(balances[player]>=0);
    player.transfer(toTransfer);
    return toTransfer;
  }

  function playerWithdrawAll(address payable player) private returns(uint) {
      return playerWithdraw(player, balances[player]);
  }

  function bankDeposit() public onlyOwner payable mincosts(1 wei) {
      totalContractBalance += msg.value;
  }

  function bankWithdraw(uint amount) public onlyOwner payable returns(uint a) {
      require(amount >= 1,"REQUIRED: bankWithdraw(): amount >= 1");
      require(amount <= totalContractBalance,"REQUIRED: bankWithdraw(): amount <= totalContractBalance");
      require(totalContractBalance >= 1,"REQUIRED: totalContractBalance >= 1");
      uint toTransfer = amount;
      totalContractBalance -= amount;
      msg.sender.transfer(toTransfer);
      return toTransfer;
  }

  function bankWithdrawAll() public onlyOwner returns(uint) {
      return bankWithdraw(totalContractBalance);
  }

  function withdrawAll() public onlyOwner returns(uint) {
      uint toTransfer = totalContractBalance;
      totalContractBalance = 0;
      msg.sender.transfer(toTransfer);
      return toTransfer;
  }

  function fee() public pure returns(uint) {
    return GAMBLING_FEE;
  }

  function testUint() public pure returns (uint rr) {
      return (1234);
  }

  function testInt() public pure returns (int rr) {
      return (2345);
  }

  function testString() public pure returns (string memory rr) {
      return ("3456");
  }

  function testBool() public pure returns (bool rr) {
      return (false);
  }
}

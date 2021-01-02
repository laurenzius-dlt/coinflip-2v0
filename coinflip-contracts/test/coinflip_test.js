// people_test.js
var BN = web3.utils.BN;
const Coinflip = artifacts.require("Coinflip");
const truffleAssert = require("truffle-assertions");
const gamblingFee = new BN('40000000000000000');

contract("Coinflip", async function(accounts){
  let instance, cost, owner, contractAddress, accountAddress;
  before(async function(){
    // instance = await Coinflip.new();
    instance = await Coinflip.deployed(); // same old instance
    spend = Number(web3.utils.toWei("1", "gwei"));
    owner = await instance.owner();
    contractAddress = instance.address;
    accountAddress = accounts[1];
  });
  it("testUint() works", async function(){
    let ret = (await instance.testUint.call()).toNumber();
    // console.log("testUint(): " + ret);
    assert(ret === 1234.0, `Problem: testUint() -> ${ret} !`);
  })

  it("testInt() works", async function(){
    let ret = (await instance.testInt.call()).toNumber();
    // console.log("testInt(): " + ret);
    assert(ret === 2345.0, `Problem: testInt() -> ${ret} !`);
  })

  it("testString() works", async function(){
    let ret = await instance.testString.call();
    // console.log("testString(): " + ret);
    assert(ret === "3456", `Problem: testString() -> ${ret} !`);
  })

  it("testBool() works", async function(){
    let ret = await instance.testBool.call();
    // console.log("testBool(): " + ret);
    assert(ret === false, `Problem: testBool() -> ${ret} !`);
  })

  it("Contract has enough deposit", async function(){
    // deposit during migration:
    /*
    instance.bankDeposit(
      {value: 40300020001000, from: accounts[0]}
    ).then(function(receipt){
      console.log("deposit(): SUCCSESS!");
      instance.totalContractBalance()
        .then(function(r){
            console.log("Current balance: " + r);
        }).catch(function(err){
          console.log("balance(): FAILED! (" + err + ")");
      });
    }).catch(function(err){
      console.log("deposit(): FAILED! (" + err + ")");
    });
    */
    let enoughContractBalance = 40300020001000;
    let totalContractBalance = await instance.totalContractBalance();
    console.log("Current contract balance: " + totalContractBalance);
    assert(totalContractBalance >=  enoughContractBalance, `Problem: Contract deposit ${totalContractBalance} is not enough, should be ${enoughContractBalance}  !`);
  })
  it("Players have no deposit yet", async function(){
    let totalPlayerBalance = (await instance.totalPlayerBalance()).toNumber();
    console.log("Current total players' balance: " + totalPlayerBalance);
    assert(totalPlayerBalance === 0.0, `Problem: Player deposit ${totalPlayerBalance} is not 0!`);
  })
  it("The call of myDeposit() should be possible with 1 gwei", async function(){
    await truffleAssert.passes(
      instance.myDeposit({from: accountAddress, value: Number(web3.utils.toWei("1", "gwei"))}),
      truffleAssert.ErrorType.REVERT,
      null,
      "ASSERT: Contract did revert!"
    );
  })
  it("Players have enough deposit", async function(){
    let enoughPlayerBalance = 1.0;
    let totalPlayerBalance = (await instance.totalPlayerBalance()).toNumber();
    console.log("Current total players' balance: " + totalPlayerBalance);
    assert(totalPlayerBalance >=  enoughPlayerBalance, `Problem: Player deposit ${totalPlayerBalance} is not enough, should be ${enoughPlayerBalance}  !`);
  })
  it("The call of myDeposit() should be possible with 2 gwei", async function(){
    await truffleAssert.passes(
      instance.myDeposit({from: accountAddress, value: Number(web3.utils.toWei("2", "gwei"))}),
      truffleAssert.ErrorType.REVERT,
      null,
      "ASSERT: Contract did revert!"
    );
  })
  it("Players have enough deposit", async function(){
    let enoughPlayerBalance = 1.0;
    let totalPlayerBalance = (await instance.totalPlayerBalance()).toNumber();
    console.log("Current total players' balance: " + totalPlayerBalance);
    assert(totalPlayerBalance >=  enoughPlayerBalance, `Problem: Player deposit ${totalPlayerBalance} is not enough, should be ${enoughPlayerBalance}  !`);
  })
  it("The call of myBalance() should return a valid balance", async function(){
    let enoughPersonalBalance = 0;
    let personalBalanceBN = await instance.myBalance.call({from: accountAddress});
    let personalBalance = personalBalanceBN.toNumber();
    console.log("My current personal balance: " + personalBalance);
    assert(personalBalance >=  enoughPersonalBalance, `Problem: Personal balance ${personalBalance} is not enough, should be ${enoughPersonalBalance}  !`);
  })
  it("The call of myWithdraw() should be possible with 3 gwei", async function(){
    await truffleAssert.passes(
      instance.myWithdraw(Number(web3.utils.toWei("3", "gwei")), {from: accountAddress}),
      truffleAssert.ErrorType.REVERT,
      null,
      "ASSERT: Contract did revert!"
    );
  })
  it("The call of myBalance() should return a zero balance", async function(){
    let enoughPersonalBalance = 0;
    let personalBalanceBN = await instance.myBalance.call({from: accountAddress});
    let personalBalance = personalBalanceBN.toNumber();
    console.log("My current personal balance: " + personalBalance);
    assert(personalBalance === 0.0, `Problem: Personal balance ${personalBalance} should be zero!`);
  })
  it("Players have no deposit anymore", async function(){
    let totalPlayerBalance = (await instance.totalPlayerBalance()).toNumber();
    console.log("Current total players' balance: " + totalPlayerBalance);
    assert(totalPlayerBalance === 0.0, `Problem: Player deposit ${totalPlayerBalance} is not 0!`);
  })
  it("Event number should be above 2", async function(){
    let enoughPlayerBalance = 2.0;
    let totalPlayerBalance = (await instance.eventnumber()).toNumber();
    console.log("Current event number: " + totalPlayerBalance);
    assert(totalPlayerBalance >  enoughPlayerBalance, `Problem: Player deposit ${totalPlayerBalance} is not enough, should be ${enoughPlayerBalance}  !`);
  })
  it("The call of bankWithdraw() from owner address should be possible when not exceeding available balance", async function(){
    let totalContractBalanceBeforeBN = new BN((await instance.totalContractBalance()).toString());
    // console.log("totalContractBalanceBeforeBN: " + totalContractBalanceBeforeBN);
    await instance.bankWithdraw(
      web3.utils.toWei("300000000000", "wei").toString(),
      {from: owner, value: web3.utils.toWei("0", "wei").toString()}
    );
    let totalContractBalanceAfterBN = new BN((await instance.totalContractBalance()).toString());
    // console.log("totalContractBalanceAfterBN: " + totalContractBalanceAfterBN);
    let totalContractWithdrawAmountBN = totalContractBalanceBeforeBN.sub(totalContractBalanceAfterBN);
    console.log("Current withdraw amount: " + totalContractWithdrawAmountBN);
    assert(totalContractWithdrawAmountBN > 0.0, `Problem: Personal balance ${totalContractWithdrawAmountBN} should be above zero!`);
  })
  it("The call of bankWithdraw() from owner address should NOT! be possible when exceeding available balance", async function(){
    let totalContractBalanceBeforeBN = new BN((await instance.totalContractBalance()).toString());
    console.log("totalContractBalanceBefore: " + totalContractBalanceBeforeBN);
    await truffleAssert.fails(
      instance.bankWithdraw(
          web3.utils.toWei("9176004704003002020", "wei"),
          {from: owner, value: Number(web3.utils.toWei("0", "wei"))}
      ),
      truffleAssert.ErrorType.REVERT,
      null,
      "ASSERT: Contract did NOT revert!"
    );
  })
  it("The call of bankWithdraw() from NON-owner address should NOT! be possible when exceeding available balance", async function(){
    let totalContractBalanceBeforeBN = new BN((await instance.totalContractBalance()).toString());
    console.log("totalContractBalanceBefore: " + totalContractBalanceBeforeBN);
    await truffleAssert.fails(
      instance.bankWithdraw(
          Number(web3.utils.toWei("10000000001000", "wei")),
          {from: accountAddress, value: Number(web3.utils.toWei("0", "wei"))}
      ),
      truffleAssert.ErrorType.REVERT,
      null,
      "ASSERT: Contract did NOT revert!"
    );
  })
  it("The call of bankWithdraw() from NON-owner address should NOT! be possible when exceeding available balance", async function(){
    let catchedRevertCase = false;
    await truffleAssert.passes(
      instance.bankWithdraw(
        Number(web3.utils.toWei("10000000000000", "wei")),
        {from: accountAddress, value: Number(web3.utils.toWei("1", "wei"))}
      ).then(function(receipt){
        console.log("Unexpected OK!!");
      }).catch(function(err){
        console.log("Expected REVERT in bankWithdraw(): ()" + err + ")");
        catchedRevertCase = true;
      }),
      truffleAssert.ErrorType.REVERT,
      null,
      "ASSERT: Contract did revert!"
    );
    assert(catchedRevertCase, `Problem: When non-owner does bankWithdraw() the revert error could not be catched properly !`);
  })


  it("Contract has enough deposit", async function(){
    let enoughContractBalance = 1;
    let totalContractBalanceBN = new BN((await instance.totalContractBalance()).toString());
    console.log("Current contract balance: " + totalContractBalanceBN);
    assert(totalContractBalanceBN >=  enoughContractBalance, `Problem: Contract deposit ${totalContractBalanceBN} is not enough, should be ${enoughContractBalance}  !`);
  })

  it("The call of bankWithdrawAll() from owner address should return a non-zero balance", async function(){
    let totalContractBalanceBeforeBN = new BN((await instance.totalContractBalance()).toString());
    // console.log("totalContractBalanceBeforeBN: " + totalContractBalanceBeforeBN);
    await instance.bankWithdrawAll(
      {from: owner, value: Number(web3.utils.toWei("0", "wei"))}
    );
    let totalContractBalanceAfterBN = new BN((await instance.totalContractBalance()).toString());
    // console.log("totalContractBalanceAfterBN: " + totalContractBalanceAfterBN);
    let totalContractWithdrawAmountBN = totalContractBalanceBeforeBN.sub(totalContractBalanceAfterBN);
    console.log("Current withdraw amount: " + totalContractWithdrawAmountBN);
    assert(totalContractWithdrawAmountBN.gt(new BN("0")), `Problem: Personal balance ${totalContractWithdrawAmountBN} should be above zero!`);
  })

  it("Contract has zero deposit", async function(){
    let totalContractBalanceBN = new BN((await instance.totalContractBalance()).toString());
    console.log("Current contract balance: " + totalContractBalanceBN);
    assert(totalContractBalanceBN.isZero(), `Problem: Contract deposit ${totalContractBalanceBN} is not zero!`);
  })
  it("The call of bankDeposit() from owner address should lead to a non-zero balance", async function(){
    let totalContractBalanceBeforeBN = new BN((await instance.totalContractBalance()).toString());
    // console.log("totalContractBalanceBeforeBN: " + totalContractBalanceBeforeBN);
    await instance.bankDeposit(
      {value: 10100010001000, from: accounts[0]}
    );
    let totalContractBalanceAfterBN = new BN((await instance.totalContractBalance()).toString());
    // console.log("totalContractBalanceAfterBN: " + totalContractBalanceAfterBN);
    let totalContractDepositAmountBN = totalContractBalanceAfterBN.sub(totalContractBalanceBeforeBN);
    console.log("Current deposit amount: " + totalContractDepositAmountBN);
    assert(totalContractDepositAmountBN.gt(new BN("0")), `Problem: Contract balance deposit ${totalContractDepositAmountBN} should be above zero!`);
  })
  it("The call of myBalance() should return a valid balance", async function(){
    let enoughPersonalBalance = 0;
    let personalBalanceBN = await instance.myBalance.call({from: accountAddress});
    let personalBalance = personalBalanceBN.toNumber();
    console.log("My current personal balance: " + personalBalance);
    assert(personalBalance ===  enoughPersonalBalance, `Problem: Personal balance ${personalBalance} is not enough, should be ${enoughPersonalBalance}  !`);
  })
  it("The call of flip() should be possible", async function(){
    let catchedFailed = false;
    let catchedSuccessCase = false;
    await instance.flip(false, {from: accountAddress, value: Number(web3.utils.toWei("0.05", "ether"))})
      .then(function(receipt){
        console.log("flip(): SUCCSESS!");
        catchedSuccessCase = true;
      }).catch(function(err){
        console.log("flip(): FAILED! (" + err + ")");
        catchedFailed = true;
      });
      assert(!catchedFailed, `Problem: Error event catched for method flip()!`);
      assert(catchedSuccessCase, `Problem: So success event catched for method flip()!`);
  })
  it("The call of myBalance() should return a valid balance", async function(){
    let enoughPersonalBalance = 0;
    let personalBalanceBN = await instance.myBalance.call({from: accountAddress});
    console.log("My current personal balance: " + personalBalanceBN);
    assert(personalBalanceBN.gte(new BN(""+enoughPersonalBalance)), `Problem: Personal balance ${personalBalanceBN} is not enough, should be ${enoughPersonalBalance}  !`);
  })
  it("The call of flip() should be possible", async function(){
    let catchedFailed = false;
    let catchedSuccessCase = false;
    await instance.flip(false, {from: accountAddress, value: Number(web3.utils.toWei("0.05", "ether"))})
      .then(function(receipt){
        console.log("flip(): SUCCSESS!");
        catchedSuccessCase = true;
      }).catch(function(err){
        console.log("flip(): FAILED! (" + err + ")");
        catchedFailed = true;
      });
      assert(!catchedFailed, `Problem: Error event catched for method flip()!`);
      assert(catchedSuccessCase, `Problem: So success event catched for method flip()!`);
  })
  it("The call of myBalance() should return a valid balance", async function(){
    let enoughPersonalBalance = 0;
    let personalBalanceBN = await instance.myBalance.call({from: accountAddress});
    console.log("My current personal balance: " + personalBalanceBN);
    assert(personalBalanceBN.gte(new BN(""+enoughPersonalBalance)), `Problem: Personal balance ${personalBalanceBN} is not enough, should be ${enoughPersonalBalance}  !`);
  })
  it(`The gamblingFee from the contract should be ${gamblingFee}`, async function(){
    let gamblingFeeFromContract = new BN((await instance.fee()).toString());
    console.log("gamblingFeeFromContract: " + gamblingFeeFromContract);
    assert(gamblingFeeFromContract.eq(gamblingFee), `Problem: The gamblingFee from the contract is ${gamblingFeeFromContract} but should be ${gamblingFee} !`);
  })
  it("The call of flip() should be possible with 1 gwei plus gambling fee", async function(){
    let gamblingFeeFromContract = new BN((await instance.fee()).toString());
    let valueToInvest = gamblingFeeFromContract.add(new BN(""+web3.utils.toWei("1", "gwei")));
    console.log("valueToInvest: " + valueToInvest);
    await truffleAssert.passes(
      instance.flip(true, {from: accountAddress, value: valueToInvest}),
      truffleAssert.ErrorType.REVERT,
      null,
      "ASSERT: Contract did revert!"
    );
  })
  it("The call of flip() should be possible with 1 wei plus gambling fee", async function(){
    let gamblingFeeFromContract = new BN((await instance.fee()).toString());
    let valueToInvest = gamblingFeeFromContract.add(new BN("1"));
    console.log("valueToInvest: " + valueToInvest);
    await truffleAssert.passes(
      instance.flip(true, {from: accountAddress, value: valueToInvest}),
      truffleAssert.ErrorType.REVERT,
      null,
      "ASSERT: Contract did revert!"
    );
  })
  it("The call of flip() should NOT be possible with 0 wei plus gambling fee", async function(){
    let gamblingFeeFromContract = new BN((await instance.fee()).toString());
    let valueToInvest = gamblingFeeFromContract.add(new BN("0"));
    console.log("valueToInvest: " + valueToInvest);
    await truffleAssert.fails(
      instance.flip(true, {from: accountAddress, value: valueToInvest}),
      truffleAssert.ErrorType.REVERT,
      null,
      "ASSERT: Contract did revert!"
    );
  })
  it("The call of flip() should be possible with 0.05 ether", async function(){
    await truffleAssert.passes(
      instance.flip(true, {from: accountAddress, value: Number(web3.utils.toWei("0.05", "ether"))}),
      truffleAssert.ErrorType.REVERT,
      null,
      "ASSERT: Contract did revert!"
    );
  })
  it("The call of flip() should NOT be possible with 0.01 ether", async function(){
    await truffleAssert.fails(
      instance.flip(true, {from: accountAddress, value: Number(web3.utils.toWei("0.01", "ether"))}),
      truffleAssert.ErrorType.REVERT,
      null,
      "ASSERT: Contract did revert!"
    );
  })
  it("The call of flip() should NOT be possible with 0 wei", async function(){
    await truffleAssert.fails(
      instance.flip(true, {from: accountAddress, value: 0}),
      truffleAssert.ErrorType.REVERT,
      null,
      "ASSERT: Contract did not revert in cas of zero spend!"
    );
  })
  it("Contract has enough deposit", async function(){
    let enoughContractBalance = 1;
    let totalContractBalance = await instance.totalContractBalance();
    console.log("Current contract balance: " + totalContractBalance);
    assert(totalContractBalance >=  enoughContractBalance, `Problem: Contract deposit ${totalContractBalance} is not enough, should be ${enoughContractBalance}  !`);
  })
  it("The call of flip() should change the contract blance", async function(){
    let flipShouldWin = true;
    let flipHasWon = false;
    let headsShouldWin = !flipShouldWin; // that is only be a valid assignment for testing without a real oracle!
    let gamblingFeeFromContract = new BN((await instance.fee()).toString());
    let bet = new BN(""+web3.utils.toWei("1", "gwei"));
    let valueToInvest = gamblingFeeFromContract.add(bet);
    let expectedPayout = bet.mul(new BN("2"));
    console.log("valueToInvest: " + valueToInvest);
    let totalContractBalanceBeforeBN = new BN((await instance.totalContractBalance()).toString());
    console.log("totalContractBalanceBeforeBN: " + totalContractBalanceBeforeBN);
    await truffleAssert.passes(
      instance.flip(headsShouldWin, {from: accountAddress, value: valueToInvest}),
      truffleAssert.ErrorType.REVERT,
      null,
      "ASSERT: Contract did revert!"
    );
    let totalContractBalanceAfterBN = new BN((await instance.totalContractBalance()).toString());
    console.log("totalContractBalanceAfterBN: " + totalContractBalanceAfterBN);
    /*
    if(totalContractBalanceAfterBN.gt(totalContractBalanceBeforeBN.add(gamblingFeeFromContract))) {
      flipHasWon = false;
      let totalContractIncreaseAmountBN = totalContractBalanceAfterBN.sub(gamblingFeeFromContract).sub(totalContractBalanceBeforeBN);
      console.log("Current contract balance has increased: " + totalContractIncreaseAmountBN);
      assert(totalContractIncreaseAmountBN.eq(bet), `Problem: Contract balance increase (${totalContractIncreaseAmountBN}) should be equal to the bet (${bet}) after flip() !`);
    }
    if(totalContractBalanceBeforeBN.gt(totalContractBalanceAfterBN.sub(gamblingFeeFromContract))) {
      flipHasWon = true;
      let totalContractDecreaseAmountBN = totalContractBalanceBeforeBN.add(gamblingFeeFromContract).sub(totalContractBalanceAfterBN);
      console.log("Current contract balance has decreased: " + totalContractDecreaseAmountBN);
      assert(totalContractDecreaseAmountBN.eq(expectedPayout), `Problem: Contract balance decrease (${totalContractDecreaseAmountBN}) should be equal to the expected payout (${expectedPayout}) after flip() !`);
    }
    */
    assert(totalContractBalanceAfterBN.gt(totalContractBalanceBeforeBN), `Problem: Contract balance before (${totalContractBalanceBeforeBN}) should be less than after (${totalContractBalanceAfterBN}) !`);
    // assert(flipHasWon === flipShouldWin, "Problem: flip() should "+(flipShouldWin?"":"not ")+"win but it did "+(flipHasWon?"":"not ")+"win!");
    let personalBalanceBN = await instance.myBalance.call({from: accountAddress});
    console.log("My current personal balance: " + personalBalanceBN);
    assert(personalBalanceBN.isZero(), `Problem: The personal balance should be 0 after flip() because there should be an instant settlement !`);
  })
  it("The call of flip() should increase the contract blance by ( fee + 1x bet ) when flip() has lost", async function(){
    let flipShouldWin = false;
    let flipHasWon = true;
    let headsShouldWin = !flipShouldWin; // that is only be a valid assignment for testing without a real oracle!
    let gamblingFeeFromContract = new BN((await instance.fee()).toString());
    let bet = new BN(""+web3.utils.toWei("1", "gwei"));
    let valueToInvest = gamblingFeeFromContract.add(bet);
    let expectedPayout = bet.mul(new BN("2"));
    console.log("valueToInvest: " + valueToInvest);
    let totalContractBalanceBeforeBN = new BN((await instance.totalContractBalance()).toString());
    console.log("totalContractBalanceBeforeBN: " + totalContractBalanceBeforeBN);
    await truffleAssert.passes(
      instance.flip(headsShouldWin, {from: accountAddress, value: valueToInvest}),
      truffleAssert.ErrorType.REVERT,
      null,
      "ASSERT: Contract did revert!"
    );
    let totalContractBalanceAfterBN = new BN((await instance.totalContractBalance()).toString());
    console.log("totalContractBalanceAfterBN: " + totalContractBalanceAfterBN);
    if(totalContractBalanceAfterBN.gt(totalContractBalanceBeforeBN.add(gamblingFeeFromContract))) {
      flipHasWon = false;
      let totalContractIncreaseAmountBN = totalContractBalanceAfterBN.sub(gamblingFeeFromContract).sub(totalContractBalanceBeforeBN);
      console.log("Current contract balance has increased: " + totalContractIncreaseAmountBN);
      assert(totalContractIncreaseAmountBN.eq(bet), `Problem: Contract balance increase (${totalContractIncreaseAmountBN}) should be equal to the bet (${bet}) after flip() !`);
    }
    if(totalContractBalanceBeforeBN.gt(totalContractBalanceAfterBN.sub(gamblingFeeFromContract))) {
      flipHasWon = true;
      let totalContractDecreaseAmountBN = totalContractBalanceBeforeBN.add(gamblingFeeFromContract).sub(totalContractBalanceAfterBN);
      console.log("Current contract balance has decreased: " + totalContractDecreaseAmountBN);
      assert(totalContractDecreaseAmountBN.eq(expectedPayout), `Problem: Contract balance decrease (${totalContractDecreaseAmountBN}) should be equal to the expected payout (${expectedPayout}) after flip() !`);
    }
    assert(totalContractBalanceAfterBN.gt(totalContractBalanceBeforeBN), `Problem: Contract balance before (${totalContractBalanceBeforeBN}) should be less than after (${totalContractBalanceAfterBN}) !`);
    assert(flipHasWon === flipShouldWin, "Problem: flip() should "+(flipShouldWin?"":"not ")+"win but it did "+(flipHasWon?"":"not ")+"win!");
    let personalBalanceBN = await instance.myBalance.call({from: accountAddress});
    console.log("My current personal balance: " + personalBalanceBN);
    assert(personalBalanceBN.isZero(), `Problem: The personal balance should be 0 after flip() because there should be an instant settlement !`);
  })
  it("The call of flip() should decrease the contract blance by ( fee + 2x bet ) when flip() has won", async function(){
    let flipShouldWin = true;
    let flipHasWon = false;
    let headsShouldWin = !flipShouldWin; // that is only be a valid assignment for testing without a real oracle!
    let gamblingFeeFromContract = new BN((await instance.fee()).toString());
    let bet = new BN(""+web3.utils.toWei("1", "gwei"));
    let valueToInvest = gamblingFeeFromContract.add(bet);
    let expectedPayout = bet.mul(new BN("2"));
    console.log("valueToInvest: " + valueToInvest);
    let totalContractBalanceBeforeBN = new BN((await instance.totalContractBalance()).toString());
    console.log("totalContractBalanceBeforeBN: " + totalContractBalanceBeforeBN);
    await truffleAssert.passes(
      instance.flip(headsShouldWin, {from: accountAddress, value: valueToInvest}),
      truffleAssert.ErrorType.REVERT,
      null,
      "ASSERT: Contract did revert!"
    );
    let totalContractBalanceAfterBN = new BN((await instance.totalContractBalance()).toString());
    console.log("totalContractBalanceAfterBN: " + totalContractBalanceAfterBN);
    if(totalContractBalanceAfterBN.gt(totalContractBalanceBeforeBN.add(gamblingFeeFromContract))) {
      flipHasWon = false;
      let totalContractIncreaseAmountBN = totalContractBalanceAfterBN.sub(gamblingFeeFromContract).sub(totalContractBalanceBeforeBN);
      console.log("Current contract balance has increased: " + totalContractIncreaseAmountBN);
      assert(totalContractIncreaseAmountBN.eq(bet), `Problem: Contract balance increase (${totalContractIncreaseAmountBN}) should be equal to the bet (${bet}) after flip() !`);
    }
    if(totalContractBalanceBeforeBN.gt(totalContractBalanceAfterBN.sub(gamblingFeeFromContract))) {
      flipHasWon = true;
      let totalContractDecreaseAmountBN = totalContractBalanceBeforeBN.add(gamblingFeeFromContract).sub(totalContractBalanceAfterBN);
      console.log("Current contract balance has decreased: " + totalContractDecreaseAmountBN);
      assert(totalContractDecreaseAmountBN.eq(expectedPayout), `Problem: Contract balance decrease (${totalContractDecreaseAmountBN}) should be equal to the expected payout (${expectedPayout}) after flip() !`);
    }
    assert(totalContractBalanceAfterBN.gt(totalContractBalanceBeforeBN), `Problem: Contract balance before (${totalContractBalanceBeforeBN}) should be less than after (${totalContractBalanceAfterBN}) !`);
    assert(flipHasWon === flipShouldWin, "Problem: flip() should "+(flipShouldWin?"":"not ")+"win but it did "+(flipHasWon?"":"not ")+"win!");
    let personalBalanceBN = await instance.myBalance.call({from: accountAddress});
    console.log("My current personal balance: " + personalBalanceBN);
    assert(personalBalanceBN.isZero(), `Problem: The personal balance should be 0 after flip() because there should be an instant settlement !`);
  })
});

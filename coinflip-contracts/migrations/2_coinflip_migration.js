const Coinflip = artifacts.require("Coinflip");

// HOWTO MIGRATE
// A) PREREQUISITES
// Project folder exists?
//   mkdir truffel_hello_world_test
//   cd truffel_hello_world_test
// Project initialized?
//   truffle init
// truffle-config.js amended?
//    version: "0.5.12",    // Fetch exact version from solc-bin (default: truffle's version)
// Ganache started?
//    Programs \ Ganache
// Ganache knows you project?
//    CONTRACTS
//    Settings Icon
//    ADD PROJECT
//    Open file truffle-config.js
// Contracts deployed?
//    truffle migrate
//    CONTRACTS
//    (see contracts market with DEPLOYED)
// B) MIGRATE
//    truffle console
//    truffle(ganache)> migrate --reset
//    truffle(ganache)> let instance = await Helloworld.deployed() // first time
//    truffle(ganache)> instance = await Helloworld.deployed() // next times
//    truffle(ganache)> instance.setMessage('Hi!')
//    truffle(ganache)> instance.getMessage()
// C) POST ACTIONS
//    truffle(ganache)> Ctrl + D


module.exports = function(deployer, network, accounts){
  deployer.deploy(Coinflip)
  .then(function(instance){
      instance.bankDeposit({value: 176005004003002001, from: accounts[0]})
      .then(function(receipt){
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
  }).catch(function(err){
    console.log("DEPLOY(): FAILED!");
  });
};

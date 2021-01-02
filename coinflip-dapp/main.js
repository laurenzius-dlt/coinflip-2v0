var web3 = new Web3(Web3.givenProvider);
var BN = web3.utils.BN;
var contractInstance;
var flipCoinButtonIsActive = true; // is false while spinning
var headShouldBeUp = true; // true if you bet on ethereum
var randomizeOnClientSideWhoShouldBeUp = false; // enable for testing
var aksForConfirmationBeforeChangingWhoShouldBeUp = false; // false -> not confirm box
var aksForConfirmationBeforeStartingTransaction = true; // false -> not confirm box
var lastTransactionHash = "";
var lastQueryId = "";
var selectedAddress = "";
var eventsReceived = [];
var lastBlockNumber = "latest";
var gamblingFee = new BN('40000000000000000');

$(document).ready(function() {
    window.ethereum.enable().then(function(accounts){ // metamask will popup and ask for connecting an account
        let address="0x1B01f50e8fE14eCC7F96D55a6bbe2d84BAfe8358"; // taken from migrate result
        selectedAddress = accounts[0];
        contractInstance = new web3.eth.Contract(abi, address, {from: accounts[0]});
        console.log("contact instance:");
        console.log(contractInstance);
        console.log("contact address: "+address);
        console.log("selected address: "+selectedAddress);
        console.log(prettyprint("estimated fee: ",gamblingFee,false));
        updateFee();
        console.log(prettyprint("real fee: ",gamblingFee,false));
        web3.eth.getBlockNumber().then((bnr) => {
          setLastBlockNumber(bnr,"AccountConnected")
          contractInstance.events.logNewProvableQuery({fromBlock: lastBlockNumber, toBlock: 'latest', filter: { addr: selectedAddress}},
          function (err, result) {
            if (err) { return error(err); }
            if(handleEvent(result, "logNewProvableQuery", result.returnValues.eventnr, result.returnValues.queryId)){
              if(!isLastQueryId(result.returnValues.queryId,"logNewProvableQuery") ) {
                setQueryId(result.returnValues.queryId,"logNewProvableQuery");
              }
            }
          });
          contractInstance.events.logProvableQueryAnswered({fromBlock: lastBlockNumber, toBlock: 'latest', filter: { player: selectedAddress}},
          function (err, result) {
            if (err) { return error(err); }
            if(handleEvent(result, "logProvableQueryAnswered", result.returnValues.eventnr, result.returnValues.qid)) {
              if(!isLastQueryId(result.returnValues.qid,"logProvableQueryAnswered") ) {
                setQueryId(result.returnValues.qid,"logProvableQueryAnswered");
              }
            }
          });
          contractInstance.events.logMyBalanceChanged({fromBlock: lastBlockNumber, toBlock: 'latest', filter: { player: selectedAddress}},
          function (err, result) {
            if (err) { return error(err); }
            if(handleEvent(result, "logMyBalanceChanged", result.returnValues.eventnr, "")){
              updatePlayerBalance(result.returnValues.balance);
            }
          });
          contractInstance.events.coinFlippedAndLost({fromBlock: lastBlockNumber, toBlock: 'latest'},
          function (err, result) {
            if (err) { return error(err); }
            let res = purify(result.returnValues);
            if(handleEvent(result, "coinFlippedAndLost", result.returnValues.eventnr, result.returnValues.queryId)) {
              if(!isLastQueryId(result.returnValues.queryId,"coinFlippedAndLost") ) {
                setQueryId(result.returnValues.queryId,"coinFlippedAndLost");
              }
              let coinname = coinNameOf(!headShouldBeUp);
              console.log(`event 'lost' received, because coin shows '${coinname}'`);
              setTimeout(function(){
                lost(result.returnValues.loss, coinname);
              },3000);
            }
          });
          contractInstance.events.coinFlippedAndWon({fromBlock: lastBlockNumber, toBlock: 'latest'},
          function (err, result) {
            if (err) { return error(err); }
            if(handleEvent(result, "coinFlippedAndWon", result.returnValues.eventnr, result.returnValues.queryId)) {
              if(!isLastQueryId(result.returnValues.queryId,"coinFlippedAndWon") ) {
                setQueryId(result.returnValues.queryId,"coinFlippedAndWon");
              }
              let coinname = coinNameOf(headShouldBeUp);
              console.log(`event 'won' received, because coin shows '${coinname}'`);
              setTimeout(function(){
                won(result.returnValues.profit, coinname);
              },3000);
            }
          });
          updatePlayerBalance(0);
          viewBalance();
        });
    });
    updateWhoShouldWin();
    $("#who_should_win").click(toggleWhoShouldWin);
    $("#flip_coin_button").click(flipCoin);
    $("#get_balance_button").click(viewBalance);
    $("#bet_ether").change(updateWei);
    $("#bet_gwei").change(updateWei);
    $("#bet_wei").on("change",updateWei);
});
function handleEvent(result, eventname, eventnr, eventQueryId) {
  if(!eventsReceived[eventnr]) {
    eventsReceived[eventnr]=true;
    let res = purify(result.returnValues);
    console_log(res,"event "+eventname);
    return true;
  } else {
    console.log(`received event #${result.returnValues.eventnr} again`)
  }
  return false;
}
function isLastQueryId(qid,eventname) {
  if(lastQueryId === qid) {
    console.log("queryId  '"+qid+"' from "+eventname+" matches '"+lastQueryId+"'.");
    return true;
  }
  console.log("WARNING: queryId  '"+qid+"' from "+eventname+" does not match '"+lastQueryId+"'.");
  return false;
}
function setQueryId(qid,eventname) {
  if(lastQueryId !== qid) {
    console.log("queryId changed by "+eventname+" from '"+lastQueryId+"' to '"+qid+"'.");
    lastQueryId = qid;
    return true;
  }
  return false;
}
function setLastBlockNumber(bnr,contextname) {
  if(lastBlockNumber !== bnr) {
    console.log("lastBlockNumber changed by "+contextname+" from '"+lastBlockNumber+"' to '"+bnr+"'.");
    lastBlockNumber = bnr;
    return true;
  }
  return false;
}
function coinNameOf(isHeads) {
  return (isHeads ? "ethereum" : "bitcoin");
}
function coinSideOf(isHeads) {
  return (isHeads ? "heads" : "tails");
}
function coinStateOf(isHeads) {
  return coinNameOf(isHeads)+' ('+coinNameOf(isHeads)+')';
}
function toggleWhoShouldWin() {
  let confirmed = true;
  if(flipCoinButtonIsActive && aksForConfirmationBeforeChangingWhoShouldBeUp) {
    let newStateName = coinStateOf(!headShouldBeUp);
    if(!confirm(newStateName+' should be up, ok?')) {
      confirmed = false;
    }
  }
  if(flipCoinButtonIsActive) {
    if(confirmed) {
      headShouldBeUp = !headShouldBeUp;
      updateWhoShouldWin();
    }
  }
}
function updateWhoShouldWin() {
  $("#who_should_win").attr("class","row "+(headShouldBeUp?"headswin":"tailswin"));
}
function now() {
  return (new Date()).toISOString();
}
function console_log(item, context) {
  console.log(now()+(item['eventnr']?` >> event #${item['eventnr']}`:"")+(context?` >> ${context}`:"")+" logs:");
  console.log(item);
}
function purify(o) {
  if("object" === typeof o) {
    let t = {};
    for(let e of Object.keys(o)) {
      if(Number.isNaN(Number.parseInt(e))){
        t[e]=o[e];
      };
    };
    return t;
  }
  return o;
}

function prettyprint(name, value, align) {
  let width = 34;
  let a = [];
  let wstr = value.toString();
  let rest = wstr;
  let sign = rest.startsWith("-") ? -1 : 1;
  rest = rest.substr( (sign<0 ? 1 : 0) , rest.length)
  while(rest.length > 0) {
      if(rest.length<=9) {
        a.push(rest);
        break;
      } else {
        let v = rest.substr(rest.length-9,rest.length);
        a.push(v);
        rest = rest.substr(0, rest.length-9);
      }
  }
  let w = sign*Number(a[0]||'0');
  let g = sign*Number(a[1]||'0');
  let e = sign*Number(a[2]||'0');
  let s = ` ${sign*e} ether + ${sign*g} gwei + ${sign*w} wei`;
  let mixedString = `${e}`.padStart(align?10:0) + " ether "+(sign<0?'-':'+')+`${sign*g}`.padStart(align?10:0) + " gwei "+(sign<0?'-':'+')+ `${sign*w}`.padStart(align?10:0) + " wei ";
  let printLine = name.padEnd(align?width:0)+" "+mixedString.padStart(align?10:0)+"\r\n";
  // console.log(printLine);
  return printLine;
}

function updateWei() {
  let oneEther = Number(web3.utils.toWei("1", "ether"));
  let oneGwei = Number(web3.utils.toWei("1", "gwei"));
  let e = web3.utils.toWei(""+($("#bet_ether").val()||"0"), "ether");
  let g = web3.utils.toWei(""+($("#bet_gwei").val()||"0"), "gwei");
  let w = web3.utils.toWei(""+($("#bet_wei").val()||"0"), "wei");
  let betInWei = web3.utils.toBN(
    web3.utils.toBN(w.toString())
  ).add(
    web3.utils.toBN(g.toString())
  ).add(
    web3.utils.toBN(e.toString())
  ).toString();
  let betInWeiText = prettyprint("=", betInWei, false);
  $("#bet").val(betInWei);
  $("#bet_readable").val(`${betInWeiText}`);
}

function start() {
  console.log("start spinning coin ...");
  $("#coin").attr("class","coin rotation");
  $("#flip_result").attr("class","alert alert-primary").text("still flipping, please wait ...");
  enableFlipCoinButton(false);
}

function lost(loss, coinname) {
  console.log("stopped spinning coin");
  console.log(`coin showed '${coinname}': player lost ${loss} wei`);
  $("#coin").attr("class","coin "+coinname);
  $("#flip_result").attr("class","alert alert-danger").text(prettyprint("you lost ",loss));
  enableFlipCoinButton(true);
  viewBalance();
}

function won(profit, coinname) {
  console.log("stopped spinning coin");
  console.log(`coin showed '${coinname}': player won ${profit} wei`);
  $("#coin").attr("class","coin "+coinname);
  $("#flip_result").attr("class","alert alert-success").text(prettyprint("you won ",profit));
  enableFlipCoinButton(true);
  viewBalance();
}

function enableFlipCoinButton(enable) {
  if(enable) {
    $("#flip_coin_button").attr("class","btn btn-secondary btn-lg btn-block");
    flipCoinButtonIsActive = true;
  } else {
    $("#flip_coin_button").attr("class","btn btn-outline-secondary btn-lg btn-block");
    flipCoinButtonIsActive = false;
  }
}

function flipCoin(){
  if(flipCoinButtonIsActive) {
    console.log("button FLIP pressed");
    updateWei();
    var bet = ""+$("#bet").val();
    if(bet && Number(bet) && Number(bet)>0) {
      if(randomizeOnClientSideWhoShouldBeUp) {
        headShouldBeUp=(0 === Math.floor((Math.random() * 2)));
        updateWhoShouldWin();
      }
      let confirmed = true;
      let totalCost = gamblingFee.add(new BN(bet.toString()));
      if(aksForConfirmationBeforeStartingTransaction) {
        let newStateName = coinStateOf(headShouldBeUp);
        let text = "You want to bet\r\n";
        text += prettyprint(`${bet} wei = `,bet,false);
        text += `on ${newStateName}\r\n`;
        text += "with fee of\r\n";
        text += prettyprint(`${gamblingFee} wei = `,gamblingFee,false);
        text += "and total cost of\r\n";
        text += prettyprint(`${totalCost} wei = `,totalCost,false);
        text += "\r\n";
        text += "OK?";
        if(!confirm(text)) {
          confirmed = false;
        }
      }
      if(confirmed) {
        var betReadable = ""+$("#bet_readable").val();
        let trxConfirmText = "please confirm the transaction for ";
        // trxConfirmText += ` your bet of ${bet} wei `;
        //trxConfirmText += betReadable;
        // trxConfirmText += " and ";
        trxConfirmText += " the total cost of ";
        trxConfirmText += prettyprint(`${totalCost.toString()} wei = `,totalCost,false);
        $("#flip_result").attr("class","alert alert-warning").text(trxConfirmText);
        enableFlipCoinButton(false);
        console.log("calling payable contract method flip() to open metamask for signing transaction");
        contractInstance.methods
          .flip(headShouldBeUp)
          .send({value: web3.utils.toWei(totalCost, "wei")})
          .on('transactionHash', function(hash){
            lastTransactionHash=hash;
            console.log("trx created: "+hash);
            updateTransactionLink(hash);
            start();
          })
          .on('confirmation', function(confirmationNumber, receipt){
            if(confirmationNr==0){
              console.log(`trx confirmed: ${lastTransactionHash}`);
            }
          })
          .on('receipt', function(receipt){
            console.log(`trx processed: ${receipt['transactionHash']}`);
          })
          .catch(function(error){
            if(error["code"]===4001) {
              $("#flip_result").attr("class","alert alert-danger").text(`you refused to sign the transaction`);
              enableFlipCoinButton(true);
            } else {
              console_log(error,"flip().catch()");
              $("#flip_result").attr("class","alert alert-danger").text(`your transaction has failed`);
              enableFlipCoinButton(true);
            }
          })
      }
    } else {
      console.log(`bet ${bet} is less than 1 wei`);
      $("#flip_result").attr("class","alert alert-danger").text(`your bet ${bet} must be at least 1 wei`);
    }
  } else {
    $("#flip_result").attr("class","alert alert-danger").text(`you already pressed 'FLIP', so please confirm the transaction for your bet`);
  }
}

function updateFee(){
    contractInstance.methods.fee().call().then(function(res){
      if(res) {
        if(gamblingFee.toString()===res.toString()) {
          console.log(prettyprint("the gambling fee is",res,false));
        } else {
          console.log(prettyprint("the gambling fee was",gamblingFee,false));
          console.log(prettyprint("the gambling fee has changed to",res,false));
          gamblingFee=new BN(res.toString());
        }
      }
    }).catch(function(error){
      console.log(error);
    });
}

function updateTransactionLink(hash){
  console.log("https://dashboard.tenderly.co/tx/ropsten/"+hash);
  $( "#links > a" ).remove();
  $("#links").append(`<a target="_blank" href="https://dashboard.tenderly.co/tx/ropsten/${hash}">${hash}</a>`);
}

function updatePlayerBalance(bal){
    console.log(prettyprint("your balance on changed to",bal,false));
    $("#player_balance_output").attr("class","d-block alert alert-secondary").text(prettyprint("your balance on contract has changed to",bal,false));
    contractInstance.methods.myBalance().call().then(function(res){
      if(res) {
        if(bal!==res) {
          console.log(prettyprint("your balance was",bal,false));
          console.log(prettyprint("your balance is",res,false));
        }
        $("#player_balance_output").attr("class","d-block alert alert-secondary").text(prettyprint("your balance on contract is",res,false));
      }
    });
}

function viewBalance(){
  contractInstance.methods.totalPlayerBalance().call().then(function(res){
    if(res) {
      console.log(prettyprint("all player own",res,false));
    }
  });
  contractInstance.methods.totalContractBalance().call().then(function(res){
    if(res) {
      console.log(prettyprint("the contract owns",res,false));
      $("#balance_output").attr("class","d-block alert alert-secondary").text(prettyprint("the contract owns",res,false));
    }
  });
}

// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'
import $ from 'jquery'

// Import our contract artifacts and turn them into usable abstractions.
import metacoin_artifacts from '../../build/contracts/MetaCoin.json'
import caselogger_artifacts from '../../build/contracts/CaseLogger.json'

// MetaCoin is our usable abstraction, which we'll use through the code below.
var MetaCoin = contract(metacoin_artifacts);
var CaseLogger = contract(caselogger_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;
var case_status = ["CREATED", "PENDING", "RESOLVED"]
var officers;
var personCases;

var server_url = "http://localhost:3001/";

window.App = {
  start: function() {
    var self = this;

    // Bootstrap the MetaCoin abstraction for Use.
    MetaCoin.setProvider(web3.currentProvider);
    CaseLogger.setProvider(web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];

      document.getElementById("affirm").style.display = "none";
      document.getElementById("close").style.display = "none";
      document.getElementById("addofficer").style.display = "none";
      document.getElementById("addperson").style.display = "none";


     // self.refreshOfficerList();
     // self.refreshCaseList();
     self.dispBlock();
      self.setWatcher();

      

      
    });
  },

  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  getAdminId: function() {
    var self = this;
    var meta;
    CaseLogger.deployed().then(function(instance){
      meta = instance;
      console.log(meta.isAdmin({from : account}), account);
    })
  },


  addPerson: function(){
    var self = this;
    var meta;
    CaseLogger.deployed().then(function(instance){
      meta = instance;
      var address = document.getElementById("personaddr").value;
      var name = document.getElementById("personname").value;
      meta.addPerson(address, name, {from : web3.eth.accounts[0]}).then(function(data){
        if(data.hasOwnProperty('tx')){
          
                    $.ajax({
                      type: "POST",
                      url: server_url + "savePerson",
                      data: {name: name, address: address},
                      error: (err)=> {if(err.status == 200){console.log(err); $("#status").text("New Person Added Successfully!");}},
                      dataType: 'json'
                    });
                  }
      });
    });
  },

  getPerson: function(){
    var self = this;
    var meta;
    CaseLogger.deployed().then(function(instance){
      meta = instance;
      console.log(meta.getPerson(1));
    });
  },

  setWatcher: function(){
    var meta;
    CaseLogger.deployed().then(function(instance){
      meta = instance;
      //console.log(meta.allEvents());
      meta.NewCase().watch(function(err, response){ //{}, {fromBlock: 0, toBlock: 'latest'}
        console.log(response, err);
      });
    });
  },

  refreshBalance: function() {
    var self = this;

    var meta;
    MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.getBalance.call(account, {from: account});
    }).then(function(value) {
      var balance_element = document.getElementById("balance");
      balance_element.innerHTML = value.valueOf();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getting balance; see log.");
    });
  },


  addOfficer: function(){
    var self = this;
    var name = document.getElementById("officername").value;
    var supervisors = document.getElementById("supervisor");
    var supervisor = supervisors.options[supervisors.selectedIndex].value;
    var officeraddr = document.getElementById("officeraddr").value;
    if(supervisor == 'none'){
      supervisor = 0;
    }
    var meta;
    CaseLogger.deployed().then(function(instance){
      meta = instance;
      meta.addOfficer(officeraddr, name, supervisor, {from: web3.eth.accounts[0]}).then(function(data){
        console.log(data);

        if(data.hasOwnProperty('tx')){
          $.ajax({
            type: "POST",
            url: server_url + "saveOfficer",
            data: {officername: name, supervisor: supervisor, address: officeraddr},
            error: (err)=> {if(err.status == 200){self.refreshOfficerList(); $("#status").text("New Officer Added Successfully!");}},
            dataType: 'json'
          });
        }
      });
    });
  },


  refreshOfficerList: function(){
    $('#supervisor').find('option').remove().end().append('<option value="none">None</option>');
    $('#against').find('option').remove();//.end().append('<option value="none">None</option>');
    $.get(server_url + 'getOfficers', function(data){
      officers = data.details;
      data.details.map(function(d){
        $('#supervisor').append($("<option></option>").attr("value",d.id).text(d.name)); 
        $('#against').append($("<option></option>").attr("value",d.id).text(d.name));
      })
    });

  },


  caseIdChange: function(){
    var changedval = $('#caseid').val();
    var newval = $('#caseid option:selected').text();
    if(changedval == "none"){
      $("#descspan").text('');
      $("#statspan").text('');
      $("#agnst").text('');
      $("#logdate").text('');
    }else{
      var meta;
      CaseLogger.deployed().then(function(instance){
        meta = instance;
        meta.getCase(changedval).then(function(d){
          console.log(officers);
          $("#descspan").text(d[3]);
          $("#statspan").text(case_status[d[1]]);
          $("#agnst").text(officers[d[0].c[0]-1].name);
          $("#logdate").text(new Date(d[5].c[0]));
          if(newval.indexOf('*') > -1){
            $("#sendaffirm").show();
          }else{
            $("#sendaffirm").hide();
          }
        });
      });
    }
  },


  closeCaseIdChange: function(){
    var changedval = $('#closingcaseid').val();
    if(changedval == "none"){
      $("#cdescspan").text('');
      $("#cstatspan").text('');
      $("#cagnst").text('');
      $("#clogdate").text('');
    }else{
      var meta;
      CaseLogger.deployed().then(function(instance){
        meta = instance;
        meta.getCase(changedval).then(function(d){
          $("#cdescspan").text(d[3]);
          $("#cstatspan").text(case_status[d[1]]);
          $("#cagnst").text(officers[d[0].c[0]-1].name);
          $("#clogdate").text(new Date(d[5].c[0]));
          $("#armation").text(d[6].c[0]);
        });
      });
    }
  },


  affirmCase: function(){
    var selectedval = $('#caseid').val();
    var meta;
    if(selectedval != 'none'){
    CaseLogger.deployed().then(function(instance){
      meta = instance;
      meta.affirmCase(selectedval, {from: web3.eth.accounts[0]}).then(function(d){
        console.log(d);
        if(d.hasOwnProperty("tx")){
          $.ajax({
            type: "POST",
            url: server_url + "affirmPost",
            data: {addr: web3.eth.accounts[0], caseId: selectedval},
            error: (err)=> {if(err.status == 200){$("#sendaffirm").hide(); $("#status").text("Case Affirmed Successfully!")}},
            dataType: 'json'
          });
        }
      });
    });
  }
  },

  closeCase: function(){
    var selectedval = $('#closingcaseid').val();
    var desc = document.getElementById("cdesc").value;
    var meta;
    if (selectedval != 'none'){
      CaseLogger.deployed().then(function(instance){
        meta = instance;
        meta.resolveCase(selectedval, desc, {from: web3.eth.accounts[0]}).then(function(d){
          console.log(d);
        });
      });
    }
  },

  refreshAffirmCaseList: function(){
    $('#caseid').find('option').remove().end().append('<option value="none">None</option>');
    $('#closingcaseid').find('option').remove().end().append('<option value="none">None</option>');

    $.get(server_url + "getCaseForPerson?addr=" + web3.eth.accounts[0], function(d){ 
      console.log(server_url + "getCaseForPerson?addr=" + web3.eth.accounts[0]);
      var casedata = d.caseConfirmed;
      $.get(server_url + "getCaseCount", function(data){
        data = parseInt(data.count);
        for(var f = 0; f < data; f++){
          $('#caseid').append($("<option></option>").attr("value",f+1).text(casedata.indexOf("" + (f+1))?(f+1)+ '*': (f+1))); 
          //$('#closingcaseid').append($("<option></option>").attr("value",f+1).text(f+1)); 
        }
      });
    });

  },


  refreshCloseCaseList: function(){
    $('#closingcaseid').find('option').remove().end().append('<option value="none">None</option>');
    $.get(server_url + "getCaseForOfficer?addr=" + web3.eth.accounts[0], function(d){ 
      console.log(d.cases);
      var casedata = d.cases;
        var data = casedata.length;
        for(var f = 0; f < data; f++){
          //$('#closingcaseid').append($("<option></option>").attr("value",f+1).text(casedata.indexOf(f+1)?(f+1)+ '*': (f+1))); 
          $('#closingcaseid').append($("<option></option>").attr("value",casedata[f]).text(casedata[f])); 
        }
    })
  },

  dispBlock : function (blockid){
    var self = this;
    $.get(server_url + "isPerson?addr=" + web3.eth.accounts[0], function(data){
      console.log("isPerson", data);
      if(data.isperson){
        $("#logbtn").show();
        $("#affirmbtn").show();
        self.refreshAffirmCaseList();
        self.refreshOfficerList();
        //document.getElementById("log").style.display = "block";
      }else{
        $.get(server_url + "isOfficer?addr=" + web3.eth.accounts[0], function(data){
          console.log("isOfficer", data);
          if(data.isofficer){
            $("#closebtn").show();
           // document.getElementById("close").style.display = "block";
            document.getElementById("log").style.display = "none";
            self.refreshCloseCaseList();
          }else{
            $("#btnholder button").show();
            //document.getElementById("log").style.display = "block";
          }
        });
      }
    });


    var opts = ["none", "none", "none", "none", "none"];
    if(blockid == "log"){
      opts = ["block", "none", "none", "none", "none"];
    }else if(blockid == "affirm"){
      opts = ["none", "block", "none", "none", "none"];
    }else if(blockid == "close"){
      opts = ["none", "none", "block", "none", "none"];
    }else if(blockid == "addofficer"){
      opts = ["none", "none", "none", "block", "none"];
    }else if(blockid == "addperson"){
      opts = ["none", "none", "none", "none", "block"];
    }
  
    document.getElementById("log").style.display = opts[0];
    document.getElementById("affirm").style.display = opts[1];
    document.getElementById("close").style.display = opts[2];
    document.getElementById("addofficer").style.display = opts[3];
    document.getElementById("addperson").style.display = opts[4];
    $("#status").text("");
  },


  logCase: function(){
    var self = this;
    var againsts = document.getElementById("against");
    var against = againsts.options[againsts.selectedIndex].value;
    var desc = document.getElementById("desc").value;
    var date = (new Date).getTime();
    var meta;
    CaseLogger.deployed().then(function(instance){
      meta = instance;
      meta.logCase(against, desc, date, {from: web3.eth.accounts[0]}).then(function(res){
        if(res.hasOwnProperty("tx")){
          $.ajax({
            type: "POST",
            url: server_url + "saveCase",
            data: {against: against, desc: desc, loggingDate: date},
            error: (err)=> {if(err.status == 200){self.refreshAffirmCaseList(); $("#status").text("New Case Added Successfully!")}},
            dataType: 'json'
          });
        }
      });
    });
  },

  sendCoin: function() {
    var self = this;

    var amount = parseInt(document.getElementById("amount").value);
    var receiver = document.getElementById("receiver").value;

    this.setStatus("Initiating transaction... (please wait)");

    var meta;
    MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.sendCoin(receiver, amount, {from: account});
    }).then(function() {
      self.setStatus("Transaction complete!");
      self.refreshBalance();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending coin; see log.");
    });
  }
};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
  }
 

  App.start();
});

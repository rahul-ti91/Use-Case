pragma solidity ^0.4.4;

contract CaseLogger {

    struct Case {
        uint caseId;
	    address loggedby;
        uint affirmations;
	    uint against;
	    Status status;
        string desc;
	    uint pendingwith;
        string comments;
        uint loggingDate;
    }

    struct Officer {
        uint id;
        string name;
        address supervisor;
        uint[] assignedCases;
    }

    struct Person {
        uint id;
        bytes32 name;
        uint[] caseConfirmed;
    }

    address private admin;
    function CaseLogger() {
        admin = msg.sender;
    }
    
    uint private minAffirmators = 2;
    uint public caseIdSeq = 1;
    uint public officerIdSeq = 1;
    uint public personIdSeq = 1;
    enum Status {CREATED, PENDING, RESOLVED}


    //try changeing mapping from address to uint

    //mapping(address => Case) private cases;
    //mapping(uint => address) private casebyid;
    mapping(address => Officer) private officers;
    mapping(uint => address) private officerbyid;
    mapping(address => Person) public persons;
    mapping(uint => address) public personbyid;
   // mapping(uint => address) private assignedcases;
    

    mapping(uint => Case) private cases;

    event NewCase(uint caseId);

    function isCaseAvailable(uint caseID) private constant returns(bool isIndeed) {
    if (caseID > caseIdSeq) {return false;}
    return true;
    }

    modifier onlyAdmin {
        require(admin == msg.sender);
        _;
    }


    function isAdmin() public constant returns(address) {
        return msg.sender;// == admin;
    }

    // check if it works 
    function isPerson(address personAddress) private constant returns(bool isIndeed) {
        return persons[personAddress].id > 0;
    }

    function isOfficer(address officerAddress) private constant returns(bool isIndeed) {
        return officers[officerAddress].id > 0;
    }


    function logCase(uint against, string desc, uint date) public returns(uint) {
        require(isPerson(msg.sender));
        cases[caseIdSeq].caseId = caseIdSeq;
        cases[caseIdSeq].loggedby = msg.sender;
        cases[caseIdSeq].status = Status.CREATED;
        cases[caseIdSeq].affirmations = 0;
        cases[caseIdSeq].against = against;
        cases[caseIdSeq].desc = desc;
        cases[caseIdSeq].loggingDate = date;
        //cases[caseIdSeq].pendingwith = officers[against].supervisor;
        //if is person
       // persons[msg.sender].ownedCases.push(cases[caseAddress]);
        NewCase(caseIdSeq);
        caseIdSeq++;
        return(caseIdSeq);
    }


    // think how person will seperate responded cases with new cases

    function affirmCase(uint caseId) public returns(uint) {
        //check if user affirming case have that case
        require(isCaseAvailable(caseId));
        require(isPerson(msg.sender));
        require(cases[caseId].loggedby != msg.sender);
        uint affirmations = cases[caseId].affirmations;
        persons[msg.sender].caseConfirmed.push(caseId);
        cases[caseId].affirmations = affirmations+1;
        if (cases[caseId].affirmations == minAffirmators) {
            escalateCase(caseId);
        }
        return(caseId);
    }

    function escalateCase(uint caseId) private {
        require(isCaseAvailable(caseId));
        uint supervisor;
        if (cases[caseId].status == Status.CREATED) {
            cases[caseId].status = Status.PENDING;
            supervisor = officers[officers[officerbyid[cases[caseId].against]].supervisor].id;
        }else{
            supervisor = officers[officers[officerbyid[cases[caseId].pendingwith]].supervisor].id;
        }
        
        if (supervisor == 0) {
            cases[caseId].comments = "Already in topmost hierarchy. Reminder Sent to Supervisor\n";
        }else {
        cases[caseId].pendingwith = supervisor;
        officers[officerbyid[supervisor]].assignedCases.push(caseId);        
        }
    }

    function closeCase(uint caseId, string comments) private returns(bool) {
        require(isCaseAvailable(caseId));
        if (cases[caseId].status == Status.RESOLVED) {return true;} 
        cases[caseId].status = Status.RESOLVED;
        cases[caseId].comments = comments;
        return true;
    }

    function getCase(uint caseId) public constant returns(uint, Status, uint, string, string, uint, uint) {
       require(isCaseAvailable(caseId));
       if (cases[caseId].status == Status.CREATED) {
           return(cases[caseId].against, cases[caseId].status, 0, cases[caseId].desc, cases[caseId].comments, cases[caseId].loggingDate, cases[caseId].affirmations);
       }else {
           return(cases[caseId].against, cases[caseId].status, cases[caseId].pendingwith, cases[caseId].desc, cases[caseId].comments, cases[caseId].loggingDate, cases[caseId].affirmations);
       }
      
    }


    function addOfficer(address officerAddress, string name, uint supervisor) onlyAdmin public returns(uint) {
        require(!isOfficer(officerAddress));
        officers[officerAddress].id = officerIdSeq;
        officers[officerAddress].name = name;
        officers[officerAddress].supervisor = officerbyid[supervisor];
        officerbyid[officerIdSeq] = officerAddress;
        officerIdSeq++;
        return(officerIdSeq);
    }

    
 //   function getCasesOfOfficer(uint officerId) public constant returns(Case[]) {
        // add isofficer check
 //       return officers[officerbyid[officerId]].assignedCases;
 //   }

    function resolveCase(uint caseId, string comments) public {
        // check isofficer and if officer is incharge of that case
        require(isCaseAvailable(caseId));
        require(isOfficer(msg.sender));
        require(officerbyid[cases[caseId].pendingwith] == msg.sender);
        closeCase(caseId, comments);
        //segrigate closed cases at front end
    }

    function addPerson(address personAddress, bytes32 name) onlyAdmin public returns(uint) {
        require(!isPerson(personAddress));
        persons[personAddress].id = personIdSeq;
        persons[personAddress].name = name;
        personbyid[personIdSeq] = personAddress;
        personIdSeq++;
        return(personIdSeq);
    }


    function getPerson(uint personId) public constant returns(address) {
        return personbyid[personId];
    }


    function getOfficerCount() public constant returns(uint) {
        return officerIdSeq;
    }


    // remove it after testing
    //function isAdmin() public constant returns(bool) {
    //    return admin == msg.sender;
    //}

}
# UseCase

When any person is met with the case of bribery, he/she can log the case against that officer and person with whom same incident has happened or who have eye witnessed that bribery incident can affirm the incident/allegation, minimum set criteria of affirmation is met then case will be escalated to the supervisor of the officer, if no action is taken on the case then it'll automatically be ezcalated to the supervisor of the officer with whom the action is pending.


In the Dapp, there are five functionalities depending on the role of the user it'll be visible to them


## Avaiable functionalities are:
1) Logging Case : visible to person role
2) Affirming Case : visible to person role
3) Close Case: visible to officer role
4) Add Officer: visible to admin
5) Add Person: visble to admin


## Architecture

* Dapp is using etherium blockchain.
* To replicate the network, testrpc is used.
* To scaffold the project, compiling and migrating the contract to network truffle is used.

Also to maintain the state and to prevent frequent long queries node server is used which stores the model data saved on blockchain and remain updated on each transaction.





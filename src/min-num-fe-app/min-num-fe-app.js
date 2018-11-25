import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/iron-ajax/iron-request.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-item';
import '@polymer/iron-collapse/iron-collapse.js';

import '@polymer/paper-fab/paper-fab.js';
import '@polymer/paper-card/paper-card.js';

import '@polymer/app-layout/app-layout.js';

import '@polymer/paper-dialog/paper-dialog.js';


/**
 * @customElement
 * @polymer
 */
class MinNumFeApp extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
        app-header {
          color: #fff;
          background-color: #42cbf4;
          
        }
        paper-fab {
          position: fixed;
          right: 24px;
          bottom: 24px;
          --paper-fab-background: #42cbf4;
          --paper-fab-keyboard-focus-background: #DF4448;
        }
        .content {
          display: block;
          position: relative;
          max-width: 1000px;
          margin: 5px auto;
        }
        .card-container {
          display: inline-block;
          width: 33.33%;
          color: black;
          text-decoration: none;
        }
        paper-card {
          display: block;
          margin: 5px;
        }
        paper-card h2 {
          margin: 4px;
          font-weight: normal;
        }
        paper-card p {
          margin: 4px;
          color: #999;
        }
        
        @media (max-width: 960px) {
          .content {
            max-width: 800px;
          }
          .card-container {
            width: 50%;
          }
        }

        @media (max-width: 719px) {
          app-toolbar {
            height: 60px;
          }
          [main-title] {
            top: -60px;
            background-size: 90px;
          }
          .content {
            max-width: 400px;
          }
          .card-container {
            width: 100%;
          }
        }
      </style>
      <iron-request id="getContract"></iron-request>

        <app-header-layout>
          <app-header condenses fixed shadow slot="header">
            <app-toolbar>
              <div main-title spacer>Minimum Number Betting</div>
              <div id="user">Current user: [[currentUserAccount]]</div>
            </app-toolbar>
          </app-header>
          <div class="content">
            <template is="dom-repeat" items=[[sessions]] as="session">
              <paper-card>
              <div class="card-content">
                <iron-icon icon="[[getSessionStatus(session)]]" slot="item-icon"></iron-icon>
                  <span><b>Owner: [[session.owner]]</b></span> <span>Bet of this session: [[transformToEther(session.value)]] ETH</span>
                  <span>Winner: [[session.winner]]</span>
                  <iron-collapse opened="{{session.selected || 1}}">
                    <h3>Bets</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Player</th>
                          <th>Bet</th>
                        </tr>
                      </thead>
                      <tbody>
                      <template is="dom-repeat" items=[[session.bets]] as="bet">
                        <tr>
                          <td>[[bet.player]]</td>
                          <td>[[showBet(bet.bet)]]</td>
                        </tr>
                      </template>
                      </tbody>
                    </table>
                  </iron-collapse>
                  <div>
                    <paper-input label="Your bet" value={{session.newBet}} required  auto-validate pattern="[0-9]*" error-message="Numbers only" invalid="{{session.invalidBet}}"></paper-input>
                    <paper-button raised on-click="submitBet" session-id="[[session.id]]" bet="[[session.newBet]]" value="[[session.value]]" disabled="[[disableBet(session.invalidBet, session.newBet.length)]]">Bet</paper-button>
                    <paper-button raised on-click="closeSession" session-id="[[session.id]]" disabled="[[disableCloseSession(session.isOpen,session.owner)]]">Close session</paper-button>
                    <paper-button raised on-click="withdraw" session-id="[[session.id]]" disabled="[[disableWithdraw(session.hasBeenPaid, session.winner)]]">Withdraw</paper-button>
                  </div>
              </div>
              </paper-card>
            </template>
          </div>
        </app-header-layout>
        <paper-dialog id="newSession" modal on-iron-overlay-closed="createSession" on-iron-overlay-opened="cleanupNewSessionDialog" value="[[sessionValue]]">
          <h2>Create new session</h2>
          <p>Specify here how much you would like each player to bet in this session</p>
          <paper-input id="betInput" autofocus required auto-validate pattern="[0-9]*" label="Bet in Wei" value="{{sessionValue}}" invalid={{invalidBet}}></paper-input>
          <paper-input disabled label="Bet in ether" value="[[transformToEther(sessionValue)]]"></paper-input>
          <div class="buttons">
            <paper-button dialog-dismiss>Cancel</paper-button>
            <paper-button dialog-confirm disabled=[[invalidBet]] >Create session</paper-button>
          </div>
        </paper-dialog>
        <paper-fab icon="add" on-tap="openNewSessionDialog"></paper-fab>
        
    `;
  }
  static get properties() {
    return {
      sessions: {
        type: Array
      },
      web3Provider: {
        type: Object,
        value: null
      },
      contracts: {
        type: Object,
        value: {}
      },
      bettingInstance: {
        type: Object,
        value: {}
      },
      currentUserAccount: {
        type: String
      }
    };
  }
  constructor() {
    super();
    this.init();
  }
  async init() {
    await this.initWeb3();
    await this.initContract();
    this.currentUserAccount = web3.eth.accounts[0];
    this.sessions = await this.initSessionList();
    //this.addEventListener(this.bettingInstance.NewBet,this.updateBet);
    this.bettingInstance.NewBet({sessionId:-1,playerId:-1},this.updateBet.bind(this));
  }
  async initWeb3() {
    // Modern dapp browsers...
    if (window.ethereum) {
      this.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      this.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      this.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(this.web3Provider);
  }
  async initContract() {
    var contractData = await this.$.getContract.send({ url: "/build/contracts/MinNumBet.json", handleAs: "json" });
    // Get the necessary contract artifact file and instantiate it with truffle-contract
    var MinNumBetArtifact = contractData.response;
    this.contracts.MinNumBet = TruffleContract(MinNumBetArtifact);

    // Set the provider for our contract
    this.contracts.MinNumBet.setProvider(this.web3Provider);

    // Set up the instance of the contract
    this.bettingInstance = await this.contracts.MinNumBet.deployed();
  }
  async initSessionList() {
    var sessionsLengthBigNumber = await this.bettingInstance.getSessionsLength();
    var sessionsLength = sessionsLengthBigNumber.toNumber();
    var sessions = [];
    for (var i = 0; i < sessionsLength; i++) {
      var sessionData = await this.getSessionData(i);
      sessions.push(sessionData);
    }
    return sessions;
  }
  async getSessionData(sessionId) {
    var sessionData = await this.bettingInstance.sessions(sessionId);
    var playersLengthBigInt = await this.bettingInstance.getNumberOfPlayers(sessionId);
    var playersLength = playersLengthBigInt.toNumber();
    var bets = [];
    for (var i = 0; i < playersLength; i++) {
      var playerData = await this.bettingInstance.getPlayerData(sessionId, i);
      bets.push({ player: playerData[0], bet: playerData[1].toNumber() });
    }
    return {
      id: sessionId,
      isOpen: sessionData[0],
      owner: sessionData[1],
      winner: sessionData[2],
      value: sessionData[3].toNumber(),
      hasBeenPaid: sessionData[4],
      bets: bets
    }
  }
  getSessionStatus(session) {
    return session.isOpen ? "check" : session.hasBeenPaid ? "euro-symbol" : "block";
  }
  isThereWinner(session) {
    return session.winner !== '0x0000000000000000000000000000000000000000';
  }
  showBet(betAmmount) {
    return betAmmount < 0 ? "*****" : betAmmount;
  }
  disableBet(isBetInvalid, betInputLength) {
    if (isBetInvalid === undefined) return true;
    return isBetInvalid || betInputLength < 1;
  }
  disableCloseSession(isOpen, owner) {
    return !isOpen || owner !== web3.eth.accounts[0];
  }
  disableWithdraw(hasBeenPaid, winner) {
    return hasBeenPaid || winner !== web3.eth.accounts[0];

  }
  async updateBet(error, event) {
    if (!error) {
      var sessionId = event.args.sessionId.toNumber();
      var playerId = event.args.playerId.toNumber();
      if (sessionId > -1 && playerId > -1) {
        var playerData = await this.bettingInstance.getPlayerData(sessionId, playerId);
        this.sessions[sessionId].bets.push({ player: playerData[0], bet: playerData[1].toNumber() });
      }
    }
  }
  async submitBet(event) {
    var sessionId = event.currentTarget.sessionId;
    var bet = event.currentTarget.bet;
    var value = event.currentTarget.value;
    console.log(`Bet: ${bet}, SessionId: ${sessionId}, Value in ether: ${value}`);
    try {
      await this.bettingInstance.placeBet(sessionId, bet, { value: value });
    }
    catch (error) {
      console.log("Somthing went wrong: " + error);
    }
  }

  async createSession(event) {
    var value = event.currentTarget.value;
    event.currentTarget.value = "";
    if (event.detail.confirmed && value > 0) {
      try {
        await this.bettingInstance.createNewSession(value);
      }
      catch (error) {
        console.log("Somthing went wrong: " + error);
      }
    }
  }

  openNewSessionDialog() {
    this.$.newSession.open();
  }

  cleanupNewSessionDialog(){
    this.$.betInput.value="";
  }

  transformToEther(betInWei){
    return web3.fromWei(betInWei,'ether');
  }

  async closeSession(event) {
    var sessionId = event.currentTarget.sessionId;
    console.log(`Closing session with id '${sessionId}'.`);
    try {
      await this.bettingInstance.closeSession(sessionId);
    }
    catch (error) {
      console.log("Somthing went wrong: " + error);
    }
  }

  async withdraw(event) {
    var sessionId = event.currentTarget.sessionId;
    console.log(`Withdrawing winnings form session with id '${sessionId}'.`);
    try {
      await this.bettingInstance.withdraw(sessionId);
    }
    catch (error) {
      console.log("Somthing went wrong: " + error);
    }
  }
}

window.customElements.define('min-num-fe-app', MinNumFeApp);

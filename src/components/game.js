import React from 'react';

import '../index.css';
import Board from './board.js';
import FallenSoldierBlock from './fallen-soldier-block.js';
import initialiseChessBoard from '../helpers/board-initialiser.js';
import King from '../pieces/king';
import pieceReviver from '../pieces/reviver';

const COLORS = ['white', 'black'];

export default class Game extends React.Component {
  state = {
    squares: initialiseChessBoard(),
    whiteFallenSoldiers: [],
    blackFallenSoldiers: [],
    player: 0,
    sourceSelection: -1,
    status: '',
    turn: 0,
    check: false,
    member: {},
  };

  constructor(){
    super();
    this.roomName = `observable-${window.location.pathname}`;
    this.member = {};
    this.drone = new window.Scaledrone("dJEZ1K9ffgeALzCw", {
      data: this.member,
    });
    this.drone.on('open', (error) => {
      console.log("OPENED");
      if (error) {
        return console.error(error);
      }
      this.member.id = this.drone.clientId;
    });
    const room = this.drone.subscribe(this.roomName);
    room.on('data', ({squares, ...data}, member) => {
      if(member.id !== this.member.id) {
        console.log("SQUARES", squares);
        const squareObjs = squares.map(pieceReviver);
        
        this.setState({
          squares: squareObjs,
          ...data
        });
      }
    });
    room.on('member_join', (member) => {
      console.log("MEMBER JOINED", member.id);
      this.setState({status: 'Your opponent joined the game!'});
      this.member.player = 0

      this.publish(this.state);
    });
    room.on('members', (members) => {
      console.log("MEMBERS", members);
      this.member.player = members.length - 1;
    });
    room.on('member_leave', (member) => {
      console.log('left member', member.id);
      this.setState({status: 'Your opponent left the game'});
    });
  }

  publish = ({status, member, ...message}) => {
    console.log("OUTGOING", message.squares);
    this.drone.publish({
      room: this.roomName,
      message,
    });
  }
 
  handleClick(i){
    console.log("YOU ARE", this.member.player);
    const squares = this.state.squares.slice();
    
    if (this.state.turn !== this.member.player) {
      this.setState({status: "It's not your turn"});
      return;
    }

    if(this.state.sourceSelection === -1){
      if(!squares[i] || squares[i].player !== this.state.player){
        this.setState({status: "Wrong selection. Choose player " + this.state.player + " pieces."});
        if (squares[i]) {
          squares[i].style = {...squares[i].style, backgroundColor: ""};
        }
      }
      else{
        squares[i].style = {...squares[i].style, backgroundColor: "RGB(111,143,114)"}; // Emerald from http://omgchess.blogspot.com/2015/09/chess-board-color-schemes.html
        this.setState({
          status: "Choose destination for the selected piece",
          sourceSelection: i
        });
      }
    }

    else if(this.state.sourceSelection > -1){
      squares[this.state.sourceSelection].style = {...squares[this.state.sourceSelection].style, backgroundColor: ""};
      if(squares[i] && squares[i].player === this.state.player){
        this.setState({
          status: "Wrong selection. Choose valid source and destination again.",
          sourceSelection: -1,
        });
      }
      else{
        
        const squares = this.state.squares.slice();
        const whiteFallenSoldiers = this.state.whiteFallenSoldiers.slice();
        const blackFallenSoldiers = this.state.blackFallenSoldiers.slice();
        const isDestEnemyOccupied = squares[i]? true : false; 
        const isMovePossible = squares[this.state.sourceSelection].isMovePossible(this.state.sourceSelection, i, isDestEnemyOccupied);
        const srcToDestPath = squares[this.state.sourceSelection].getSrcToDestPath(this.state.sourceSelection, i);
        const isMoveLegal = this.isMoveLegal(srcToDestPath);

        if(isMovePossible && isMoveLegal){
          if(squares[i] !== null){
            if(squares[i].player === 0){
              whiteFallenSoldiers.push(squares[i]);
            }
            else{
              blackFallenSoldiers.push(squares[i]);
            }
          }
          squares[i] = squares[this.state.sourceSelection];
          squares[this.state.sourceSelection] = null;
          let player = 1 - this.state.player;
          let turn = 1 - this.state.turn;

          // check if this player is under check
          if (this.isCheck(this.state.player, squares)) {
            this.setState({
              status: "Invalid move - your king would be under check!",
              sourceSelection: -1,
            });
            return;
          }

          let check = this.isCheck(player, squares)
          let nextState = {
            sourceSelection: -1,
            squares: squares,
            whiteFallenSoldiers: whiteFallenSoldiers,
            blackFallenSoldiers: blackFallenSoldiers,
            player: player,
            status: check ? "Check!" : '',
            turn: turn,
            check: check,
          };
          this.setState(nextState);
          this.publish(nextState);
        }
        else{
          this.setState({
            status: "Wrong selection. Choose valid source and destination again.",
            sourceSelection: -1,
          });
        }
      }
    }

  }

  /**
   * Check all path indices are null. For one steps move of pawn/others or jumping moves of knight array is empty, so  move is legal.
   * @param  {[type]}  srcToDestPath [array of board indices comprising path between src and dest ]
   * @return {Boolean}               
   */
  isMoveLegal(srcToDestPath, squares = null){
    console.log("srcToDestPath", srcToDestPath);
    for(let i = 0; i < srcToDestPath.length; i++){
      if((squares || this.state.squares)[srcToDestPath[i]] !== null){
        console.log("i", this.state.squares, srcToDestPath[i]);
        return false;
      }
    }
    return true;
  }

  isCheck(player, squares) {
    console.log(squares);
    let playerKing;
    let pieces = [];
    for (let i = 0; i < squares.length; i++) {
      if (!squares[i]) continue;
      if (squares[i].player === player && squares[i] instanceof King) {
        playerKing = i;
      } else if (squares[i].player !== player) {
        pieces.push(i);
      }
    }
    for (let i = 0; i < pieces.length; i++) {
      let position = pieces[i];
      if (
        squares[position].isMovePossible(position, playerKing, true) &&
        this.isMoveLegal(squares[position].getSrcToDestPath(position, playerKing), squares)
      ) {
        console.log("CHECK from ", position, squares[position]);
        return true;
      }
    }
    return false;
  }

  render() {

    return (
      <div>
        <div className="game">
          <div className="game-board">
            <Board 
            squares = {this.state.squares}
            onClick = {(i) => this.handleClick(i)}
            />
          </div>
          <div className="game-info">
            <h3>Turn</h3>
            <div id="player-turn-box" style={{backgroundColor: COLORS[this.state.turn]}}>
  
            </div>
            <div className="game-status">{this.state.status}</div>

            <div className="fallen-soldier-block">
              
              {<FallenSoldierBlock
              whiteFallenSoldiers = {this.state.whiteFallenSoldiers}
              blackFallenSoldiers = {this.state.blackFallenSoldiers}
              />
            }
            </div>
            
          </div>
        </div>
      </div>

     
      );
  }
}

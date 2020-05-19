import React from 'react';
import classNames from 'classnames';

import '../index.css';
import Board from './board.js';
import FallenSoldierBlock from './fallen-soldier-block.js';
import initialiseChessBoard from '../helpers/board-initialiser.js';
import King from '../pieces/king';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import pieceReviver from '../pieces/reviver';
import Video from './video';

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
    this.whiteVideo = React.createRef();
    this.blackVideo = React.createRef();
  }

  componentDidMount() {
    this.setupMessageReceiver()
  }

  componentDidUpdate() {
    this.setupMessageReceiver()
  }

  setupMessageReceiver = () => {
    if (!this.props.dataChannel) return;
    this.props.dataChannel.onmessage = (event) => {
      const {squares, ...data} = JSON.parse(event.data);
      const squareObjs = squares.map(pieceReviver);
      this.setState({
        squares: squareObjs,
        status: '',
        ...data
      })
    };
  }

  publish = ({status, member, ...message}) => {
    console.log("OUTGOING", message.squares);
    // this.drone.publish({
    //   room: this.roomName,
    //   message,
    // });
    this.props.dataChannel.send(JSON.stringify(message));
  }
 
  handleClick(i){
    console.log("YOU ARE", this.props.player);
    const squares = this.state.squares.slice();
    
    if (this.props.connectionStatus !== 'connected') {
      this.setState({status: "Please wait for opponent"});
      return;
    }

    if (this.state.turn !== this.props.player) {
      this.setState({status: "It's not your turn"});
      return;
    }

    if(this.state.sourceSelection === -1){
      if(!squares[i] || squares[i].player !== this.state.player){
        this.setState({status: `Wrong selection - choose your piece.`});
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
        const isDestEnemyOccupied = !!squares[i]; 
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
          const player = 1 - this.state.player;
          const turn = 1 - this.state.turn;

          // check if this player is under check
          if (this.isCheck(this.state.player, squares)) {
            this.setState({
              status: "Invalid move - your king would be under check!",
              sourceSelection: -1,
            });
            return;
          }

          const check = this.isCheck(player, squares)
          const nextState = {
            sourceSelection: -1,
            squares,
            whiteFallenSoldiers,
            blackFallenSoldiers,
            player,
            status: check ? "Check!" : '',
            turn,
            check,
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
    const pieces = [];
    for (let i = 0; i < squares.length; i++) {
      if (!squares[i]) continue;
      if (squares[i].player === player && squares[i] instanceof King) {
        playerKing = i;
      } else if (squares[i].player !== player) {
        pieces.push(i);
      }
    }
    for (let i = 0; i < pieces.length; i++) {
      const position = pieces[i];
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
    const { player, localStream, remoteStream, connectionStatus } = this.props;
    const { squares, status, whiteFallenSoldiers, blackFallenSoldiers, turn } = this.state;
    const connected = connectionStatus === 'connected';
    const whiteStream = player === 0 ? localStream : remoteStream;
    const blackStream = player === 1 ? localStream : remoteStream;
    return (
      <div>
        <div className="game">
          <div className="game-board">
            <Board 
              squares = {squares}
              onClick = {(i) => this.handleClick(i)}
            />
          </div>
          <div className="game-info">
            <div className="video-container">
              <Video className={classNames({selected: turn === 0})} autoPlay muted={player === 0} stream={whiteStream} />
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg" alt="white" />
              {player === 1 && (
                <div className={classNames('connection-status', { connected })} >
                  <FontAwesomeIcon icon={faCircle} color={connected ? 'limegreen' : 'red'}/>
                  <i> {!connected && connectionStatus}</i>
                </div>
                )
              }
            </div>
            <div className="video-container">
              <Video className={classNames({selected: turn === 1})} autoPlay muted={player === 1} stream={blackStream} />
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg" alt="black" />
              {player === 0 && (
                <div className={classNames('connection-status', { connected })} >
                  <FontAwesomeIcon icon={faCircle} color={connected ? 'limegreen' : 'red'}/>
                  <i> {!connected && connectionStatus}</i>
                </div>
                )
              }
            </div>
            {/* <h3>Turn</h3>
            <div id="player-turn-box" style={{backgroundColor: COLORS[this.state.turn]}} /> */}
            <div className="game-status">{status}</div>

            <div className="fallen-soldier-block">
              
              <FallenSoldierBlock
                whiteFallenSoldiers = {whiteFallenSoldiers}
                blackFallenSoldiers = {blackFallenSoldiers}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}


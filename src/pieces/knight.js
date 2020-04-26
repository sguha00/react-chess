import Piece from './piece.js';

export default class Knight extends Piece {
  constructor(player){
    super(player, (player === 0? "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg" : "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg"));
  }

  isMovePossible(src, dest){
    let rowDiff = Math.abs(Math.floor(src / 8) - Math.floor(dest / 8));
    let colDiff = Math.abs(src % 8 - dest % 8);

    return rowDiff + colDiff === 3 && Math.abs(rowDiff - colDiff) === 1
  }

  /**
   * always returns empty array because of jumping
   * @return {[]}
   */
  getSrcToDestPath(){
    return [];
  }
}

import Piece from './piece.js';
import Bishop from './bishop.js';
import Rook from './rook.js';

export default class Queen extends Piece {
  constructor(player){
    super('Queen', player, (player === 0? "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg" : "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg"));
  }

  isMovePossible(src, dest){
    let b = new Bishop(this.player);
    let r = new Rook(this.player);
    return b.isMovePossible(src, dest) || r.isMovePossible(src, dest);
  }

  /**
   * get path between src and dest (src and dest exclusive)
   * @param  {num} src  
   * @param  {num} dest 
   * @return {[array]}      
   */
  getSrcToDestPath(src, dest){
    let path = [], pathStart, pathEnd, incrementBy;
    if(src > dest){
      pathStart = dest;
      pathEnd = src;
    }
    else{
      pathStart = src;
      pathEnd = dest;
    }
    if(Math.abs(src - dest) % 8 === 0){
      incrementBy = 8;
      pathStart += 8;
    }
    else if(Math.abs(src - dest) % 9 === 0){
      incrementBy = 9;
      pathStart += 9;
    }
    else if(Math.abs(src - dest) % 7 === 0){
      incrementBy = 7;
      pathStart += 7;
    }
    else{
      incrementBy = 1;
      pathStart += 1;
    }

    for(let i = pathStart; i < pathEnd; i+=incrementBy){
      path.push(i);
    }
    return path;
  }
}

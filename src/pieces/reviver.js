import King from './king';
import Rook from './rook';
import Knight from './knight';
import Bishop from './bishop';
import Pawn from './pawn';
import Queen from './queen';

const PIECE_CLASSES = {King, Rook, Knight, Bishop, Pawn, Queen};

export default function reviver(value) {
  debugger
  return value ? new PIECE_CLASSES[value.type](value.player) : null;
}

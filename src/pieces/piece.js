export default class Piece {
  constructor(type, player, iconUrl) {
    this.player = player;
    this.style = { backgroundImage: `url('${iconUrl}')` };
    this.type = type;
  }

  toJSON() {
    return {
      player: this.player,
      style: this.style,
      type: this.type,
    }
  }
}

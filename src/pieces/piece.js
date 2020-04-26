export default class Piece {
  constructor(player, iconUrl) {
    this.player = player;
    this.style = { backgroundImage: `url('${iconUrl}')` }
  }

  toJSON() {
    return {
      player: this.player,
      style: this.style,
      _class: this.constructor.name,
    }
  }
}

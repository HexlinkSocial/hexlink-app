import { CoordPair } from "h3-js";

export class HexCell {
  id: string;
  boundaries: CoordPair[];
  centre: CoordPair;

  constructor(id: string, boundaries: CoordPair[], centre: CoordPair) {
    this.id = id;
    this.boundaries = boundaries;
    this.centre = centre;
  }
}
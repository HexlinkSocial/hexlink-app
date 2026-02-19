import { CoordPair } from "h3-js";

export class HexCell {
  id: string;
  boundaries: CoordPair[];
  centre: CoordPair;
  isActive: boolean;
  communitiesCount: number;

  constructor(
    id: string,
    boundaries: CoordPair[],
    centre: CoordPair,
    isActive: boolean = false,
    communitiesCount: number = 0,
  ) {
    this.id = id;
    this.boundaries = boundaries;
    this.centre = centre;
    this.isActive = isActive;
    this.communitiesCount = communitiesCount;
  }
}

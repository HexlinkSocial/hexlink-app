import { H3Index } from "h3-js";

export class CommunityCount {
  cellId: H3Index;
  communityCount: number;

  constructor(cellId: H3Index, communityCount: number) {
    this.cellId = cellId;
    this.communityCount = communityCount;
  }
}

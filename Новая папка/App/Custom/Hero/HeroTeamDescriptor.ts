import { EnemyTeamDescriptor } from "Custom/Enemy/EnemyTeamDescriptor";
import { TeamDescriptor } from "../TeamDescriptor";

export class HeroTeamDescriptor extends TeamDescriptor {
  constructor() {
    super("HeroTeamDescriptor");
  }

  public override isAggressive(otherTeamDescriptor: TeamDescriptor): boolean {
    return otherTeamDescriptor instanceof EnemyTeamDescriptor;
  }
}

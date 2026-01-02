import { EnemyTeamDescriptor } from "Custom/Enemy/EnemyTeamDescriptor";
import { TeamDescriptor } from "../TeamDescriptor";

export class TurretHeroTeamDescriptor extends TeamDescriptor {
  constructor() {
    super("TurretHeroTeamDescriptor");
  }

  public override isAggressive(otherTeamDescriptor: TeamDescriptor): boolean {
    return otherTeamDescriptor instanceof EnemyTeamDescriptor;
  }
}

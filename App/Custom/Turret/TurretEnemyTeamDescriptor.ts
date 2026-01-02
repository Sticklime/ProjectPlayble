import { HeroTeamDescriptor } from "Custom/Hero/HeroTeamDescriptor";
import { TeamDescriptor } from "../TeamDescriptor";

export class TurretEnemyTeamDescriptor extends TeamDescriptor {
  constructor() {
    super("TurretEnemyTeamDescriptor");
  }

  public override isAggressive(otherTeamDescriptor: TeamDescriptor): boolean {
    return otherTeamDescriptor instanceof HeroTeamDescriptor;
  }
}

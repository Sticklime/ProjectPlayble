import { HeroTeamDescriptor } from "Custom/Hero/HeroTeamDescriptor";
import { TeamDescriptor } from "../TeamDescriptor";

export class EnemyTeamDescriptor extends TeamDescriptor {
  constructor() {
    super("EnemyTeamDescriptor");
  }

  public override isAggressive(otherTeamDescriptor: TeamDescriptor): boolean {
    return otherTeamDescriptor instanceof HeroTeamDescriptor;
  }
}

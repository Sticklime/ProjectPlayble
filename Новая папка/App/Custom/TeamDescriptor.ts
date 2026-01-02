export abstract class TeamDescriptor {
  constructor(public readonly tag: string) {}
  public abstract isAggressive(otherTeamDescriptor: TeamDescriptor): boolean;
}

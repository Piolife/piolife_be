import * as FlakeId from 'flake-idgen';
import * as intformat from 'biguint-format';

export class SnowflakeIdGenerator {
  private flakeIdGen: any;

  constructor() {
    this.flakeIdGen = new FlakeId();
  }

  generate(): string {
    return intformat(this.flakeIdGen.next(), 'dec');
  }
}
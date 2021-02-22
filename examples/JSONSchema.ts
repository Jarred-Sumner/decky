import { auto, field, type } from "./JSONSchema.decorator";

@type("Person")
export class Person {
  @field("ID", "user id number")
  id: number;

  @auto
  username: string;

  @field("number")
  signUpTimestamp: number;

  get signedUpAgo() {
    return Date.now() - this.signUpTimestamp;
  }
}

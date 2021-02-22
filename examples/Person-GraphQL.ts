import { auto, field, required, type } from "./GraphQLSchema.decorator";

@type("Person")
export class Person {
  // This is a comment! It should be removed.
  @required
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

import { auto, field, required, type } from "./GraphQLSchema.decorator";

@type("Person")
export class Person {
  @required
  @field("ID", "user id number")
  id: number;

  @auto
  username: string;

  @field("number")
  signUpTimestamp: number;
}

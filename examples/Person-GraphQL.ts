import { auto, field, type } from "./GraphQLSchema.decorator";

@type("Person")
export class Person {
  @field("ID", "user id number")
  id: number;

  @auto
  username: string;

  @field("number")
  signUpTimestamp: number;
}

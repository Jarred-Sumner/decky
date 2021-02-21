import { auto, field, schema } from "./JSONSchema.decorator";

@schema("Person")
export class Person {
  @field("number", "user id number")
  id: number;

  @auto
  username: string;

  @field("number")
  signUpTimestamp: number;
}

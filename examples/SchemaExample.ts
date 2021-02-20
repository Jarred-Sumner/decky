import { prop, schema } from "./SchemaExample.decorator";

@schema("Person")
export class Person {
  @prop
  id: number;

  @prop("string")
  username: string;

  @prop("string")
  firstName: string;

  @prop("string")
  lastName: string;

  @prop("number")
  signUpTimestamp: number;
}

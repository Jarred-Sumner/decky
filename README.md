# decky

This enables you to use experimental decorators with zero runtime cost and without increasing your bundle size.

For example, this lets you write JSON schemas inline:

```ts
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
```

At build-time, it outputs this schema to a file:

```ts
{
  "Person": {
    "signUpTimestamp": {
      "type": "number"
    },
    "username": {
      "type": "string"
    },
    "id": {
      "type": "number"
    }
  }
}
```

But, to the bundler, the there are no decorators:

```ts
export class Person {
  id: number;
  username: string;
  signUpTimestamp: number;
}
```

That `JSONSchema.decorator` file looks like this:

https://github.com/Jarred-Sumner/decky/blob/cb85d5a10c7cb9330d2acce3dd78049c3dc65970/examples/JSONSchema.decorator.ts#L18-77

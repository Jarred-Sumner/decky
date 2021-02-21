# decky

Use experimental decorators with zero runtime cost and without increasing your bundle size.

## Installation

`decky` is an esbuild plugin.

```bash
npm install decky
```

In your esbuild configuration:

```ts
const { load } = require("decky");

{
  // ...rest of your esbuild config
  plugins: [await load()];
}
```

## Usage

The [`JSONSchema.decorator`](./examples/JSONSchema.decorator.ts) example lets you write JSON schemas inline:

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

To the bundler, there are no decorators. Zero-runtime.

```ts
export class Person {
  id: number;
  username: string;
  signUpTimestamp: number;
}
```

What if we wanted GraphQL instead of JSON Schema? Well, if the interface is the same but you had a `GraphQLSchema.decorator`:

```patch
+import { auto, field, schema } from "./GraphQLSchema.decorator";
-import { auto, field, schema } from "./JSONSchema.decorator";

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

You'd get this:

```

```

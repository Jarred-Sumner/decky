# decky

Use experimental decorators with zero runtime cost and without increasing your bundle size.

## Installation

`decky` is an esbuild plugin.

```bash
npm install decky
```

In your esbuild configuration:

```ts
const { build } = require("esbuild");
const { load } = require("decky");

build({
  // ...rest of your esbuild config
  plugins: [await load()];
})
```

## Usage

The [`GraphQLSchema.decorator`](./examples/GraphQLSchema.decorator.ts) example lets you write GraphQL types inline with zero runtime overhead:

```ts
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
```

At build-time, it outputs the GraphQL schema to a file:

```graphql
type Person {
  signUpTimestamp: number
  username: string
  # user id number
  id: ID
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

What if we wanted GraphQL instead of JSON Schema? Well, if the interface is the same but you had a [`JSONSchema.decorator`](./examples/JSONSchema.decorator):

```patch
+import { auto, field, type } from "./GraphQLSchema.decorator";
-import { auto, field, type } from "./JSONSchema.decorator";

@type("Person")
export class Person {
// ...rest of file

```

You'd get this instead:

```json
{
  "Person": {
    "signUpTimestamp": {
      "type": "number"
    },
    "username": {
      "type": "string"
    },
    "id": {
      "type": "number",
      "description": "user id number"
    }
  }
}
```

### Writing decorators

Decorators are run at build-time. This uses a handcrafted bespoke not-JavaScript AST. The syntax looks like decorators enough to fool TypeScript's type checker, but under the hood, its entirely different.

Most importantly, decky strives for full compatible with TypeScript, Prettier, and the rest of the JavaScript ecosystem. Decorator imports are removed during tree-shaking, leaving no trace.

By default, files that write new decorators need to end in any of these extensions:

- `.decorator.ts`
- `.decky.ts`
- `.dec.ts`

And it needs to export `decorators` which is an object where the `key` is the function name and the value is the decorator function (`property`, `propertyVoid` or `klass`).

#### Property Decorator:

With no arguments:

```ts
import { propertyVoid } from "decky";

// void means the decorator accepts no arguments from the code calling it
export const debugOnly = propertyVoid(() => {
  if (!process.env.DEBUG) {
    return "";
  }
});

export const decorators = { debugOnly };
```

You use it like this:

```ts
import { debugOnly } from "./debugOnly.decorator";

export class Task {
  @debugOnly
  shouldLog = true;
}
```

What we return in `property` or `propertyVoid` replaces from the `@` to the next two lines. If we don't return anything or return `undefined`, it just deletes the line containing the @ symbol.

You can use decky to edit code at build-time or for generating metadata for code.

#### Class Decorator:

TODO example

```

```

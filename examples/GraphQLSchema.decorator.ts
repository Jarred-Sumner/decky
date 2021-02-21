import fs from "fs";
import { klass, property, propertyVoid } from "../index";

type SchemaType = "number" | "string" | "boolean";

type SchemaMap = {
  [key: string]: {
    type: SchemaType;
    description?: string;
  };
};

const schemaFileMap: { [key: string]: SchemaMap } = {};

type PropType = [SchemaType, string];
type OptionalPropType = Partial<PropType>;

export const field = property<OptionalPropType>(
  ({
    key,
    type,
    args: [schemaType, description] = [],
    metadata: { filePath },
  }) => {
    if (!schemaFileMap[filePath]) {
      schemaFileMap[filePath] = {};
    }
    const schema = schemaFileMap[filePath];

    schema[key] = {
      type: schemaType || (type as SchemaType),
    };

    if (description?.trim().length) {
      schema[key].description = description?.trim();
    }
  }
);

export const auto = propertyVoid(({ key, type, metadata: { filePath } }) => {
  if (!schemaFileMap[filePath]) {
    schemaFileMap[filePath] = {};
  }
  const schema = schemaFileMap[filePath];

  if (type !== "number" && type !== "string" && type !== "boolean") {
    throw `Invalid or missing type definition at ${type}`;
  }

  schema[key] = {
    type: type as SchemaType,
  };
});

export const schema = klass<[string] | undefined>(
  async ({ args: [object], metadata: { filePath } }) => {
    if (!schemaFileMap[filePath]) {
      return;
    }

    const schemaFile = filePath.replace(".ts", ".json");
    await fs.promises.writeFile(
      schemaFile,
      JSON.stringify(
        {
          [object]: schemaFileMap[filePath],
        },
        null,
        2
      ),
      {
        encoding: "utf-8",
      }
    );
    console.log("Saved GraphQL schema to", schemaFile);
  }
);

export const decorators = { auto, field, schema };

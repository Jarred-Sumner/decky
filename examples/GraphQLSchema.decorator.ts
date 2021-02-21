import fs from "fs";
import { klass, property, propertyVoid } from "../index";

type SchemaType = "number" | "string" | "boolean" | "ID";

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

export const type = klass<[string] | undefined>(
  async ({ args: [object], metadata: { filePath } }) => {
    if (!schemaFileMap[filePath]) {
      return;
    }

    const schemaFile = filePath.replace(".ts", ".graphql");
    const map = schemaFileMap[filePath];
    const stringifyField = (key: string) => {
      const { type, description } = map[key];

      let content: string = `  ${key}: ${type}`;
      if (description) {
        content = `  # ${description}\n` + content;
      }

      return content;
    };
    await fs.promises.writeFile(
      schemaFile,
      `
type ${object} {
${Object.keys(map).map(stringifyField).join("\n")}
}
      `,
      {
        encoding: "utf-8",
      }
    );
    console.log("Saved GraphQL schema to", schemaFile);
  }
);

export const decorators = { auto, field, type };

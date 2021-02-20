import fs from "fs";
import { klass, property } from "../index";

type SchemaType = "number" | "string" | "boolean";

type SchemaMap = {
  [key: string]: {
    type: SchemaType;
  };
};

const schemaFileMap: { [key: string]: SchemaMap } = {};

export const prop = property<[SchemaType] | undefined>(
  ({ key, type, args: [schemaType], metadata: { filePath } }) => {
    if (!schemaFileMap[filePath]) {
      schemaFileMap[filePath] = {};
    }
    const schema = schemaFileMap[filePath];

    schema[key] = {
      type: schemaType || (type as SchemaType),
    };
  }
);

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
    console.log("Saved JSON schema to", schemaFile);
  }
);

export const decorators = { prop, schema };

import { propertyVoid } from "../index";

export const debugOnly = propertyVoid(() => {
  return "";
});

export const decorators = { debugOnly };

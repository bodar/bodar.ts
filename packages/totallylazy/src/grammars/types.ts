export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = null | boolean | string | number | JsonArray | JsonObject;


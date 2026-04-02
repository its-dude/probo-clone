
export function orderMapToObject(map: Map<any, any>): Record<string, any> {
  const obj: Record<string, any> = {};

  for (const [key, value] of map.entries()) {
    const stringKey = String(key);

    if (value instanceof Map) {
      obj[stringKey] = orderMapToObject(value);

    } else if (typeof value === "object" && value !== null) {
      const nestedObj: Record<string, any> = {};

      for (const k in value) {
        const val = value[k];

        if (val instanceof Map) {
          nestedObj[k] = orderMapToObject(val);
        } else {
          nestedObj[k] = val;
        }
      }

      obj[stringKey] = nestedObj;

    } else {
      obj[stringKey] = value;
    }
  }

  return obj;
}
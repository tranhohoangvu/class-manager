export function getParam(val: string | string[] | undefined, defaultVal = ''): string {
  if (Array.isArray(val)) return val[0] || defaultVal;
  return val || defaultVal;
}

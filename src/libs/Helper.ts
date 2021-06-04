export function getJsObjectType(name: string) {
  if (['string', 'number', 'boolean', 'date', 'float', 'array', 'object'].includes(name.toLowerCase())) {
    switch (name.toLowerCase()) {
      case 'string':
        return String;
      case 'number':
        return Number;
      case 'boolean':
        return Boolean;
      case 'date':
        return Date;
      case 'float':
        return Number;
      case 'array':
        return Array;
      case 'object':
        return Object;
    }
  }
  return null;
}

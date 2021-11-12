export namespace json {
  function safeGetValueFromPropertyOnObject(obj: any, property: string): any {
    try {
      return obj[property];
    }
    catch (error) {
      return error;
    }
  }

  function ensureProperties(data: any): any {
    const seen: Set<any> = new Set();

    function visit(child: any): any {
      if (child === null || typeof child !== 'object') {
        return child;
      }

      if (seen.has(child)) {
        return '[Circular]';
      }

      seen.add(child);

      if (typeof child.toJSON === 'function') {
        try {
          return visit(child.toJSON());
        }
        catch (error) {
          return visit(error);
        }
      }

      if (Array.isArray(child)) {
        return child.map(visit);
      }

      if (child instanceof Error) {
        const stack = child.stack;
        return {
          errorType: child.constructor.name,
          message: child.message,
          stack: stack.split('\n')
        };
      }

      return Object.getOwnPropertyNames(child).reduce((result: any, key: string) => {
        result[key] = visit(safeGetValueFromPropertyOnObject(child, key));
        return result;
      }, {});
    }

    return visit(data);
  }

  export function purify(data: any): any {
    return ensureProperties(data);
  }

  export function replacer(key: string, value: any): any {
    if (key === '') {
      return purify(value);
    }
    return value;
  }

  export function stringify(data: any, format: boolean): string {
    if (format) {
      return JSON.stringify(data, replacer, 2);
    }

    return JSON.stringify(data);
  }

  export function safeStringify(data: any, format: boolean): string {
    const cleaned: any = purify(data);
    return stringify(cleaned, format);
  }
}

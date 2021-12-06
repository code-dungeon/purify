export namespace json {
  export interface PrintableError {
    errorType: string;
    message: string;
    stack?: Array<string>;
  }

  function safeGetValueFromPropertyOnObject(obj: any, property: string): any {
    try {
      return obj[property];
    }
    catch (error) {
      return error;
    }
  }

  function ensureProperties(data: any, addStackToError: boolean): any {
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
        const error: PrintableError = {
          errorType: child.constructor.name,
          message: child.message
        };

        if (addStackToError) {
          const stack = child.stack;
          error.stack = stack.split('\n');
        }

        return error;
      }

      return Object.getOwnPropertyNames(child).reduce((result: any, key: string) => {
        result[key] = visit(safeGetValueFromPropertyOnObject(child, key));
        return result;
      }, {});
    }

    return visit(data);
  }

  export function purify(data: any, addStackToError: boolean = true): any {
    return ensureProperties(data, addStackToError);
  }

  export interface Replacer {
    (key: string, value: any): any;
  }

  export function getReplacer(addStackToError: boolean): Replacer {
    return function replacer(key: string, value: any): any {
      if (key === '') {
        return purify(value, addStackToError);
      }
      return value;
    };
  }

  export function stringify(data: any, format: boolean, addStackToError: boolean = true): string {
    const replacer: Replacer = getReplacer(addStackToError);
    let result: string;
    if (format) {
      result = JSON.stringify(data, replacer, 2);
    } else {
      result = JSON.stringify(data, replacer);
    }

    return result;
  }
}

export class NarrativeCompiler {
  /**
   * Compiles a string template by replacing variable placeholders with actual data.
   * Example template: "{source.name} ngưng tụ {tags.intent}, {action.name} chém ra. Linh lực xé rách {env.name}!"
   */
  static compile(template: string, data: Record<string, any>): string {
    let result = template;
    
    // Match anything inside {} e.g., {source.name}, {amount}
    const placeholders = template.match(/\{([\w.]+)\}/g);
    
    if (placeholders) {
      placeholders.forEach(placeholder => {
        // Strip the {} brackets to get the path
        const path = placeholder.replace(/\{|\}/g, '');
        const value = this.getValueFromPath(data, path);
        
        // Only replace if we found a value
        if (value !== undefined && value !== null) {
          result = result.replace(placeholder, value.toString());
        } else {
          result = result.replace(placeholder, `[Unknown: ${path}]`);
        }
      });
    }

    return result;
  }

  /**
   * Helper to safely traverse nested objects using a dot-notation string path.
   * e.g., getValueFromPath({ source: { name: 'Mo Xie' } }, 'source.name') -> 'Mo Xie'
   */
  private static getValueFromPath(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => {
      return acc && acc[part] !== undefined ? acc[part] : undefined;
    }, obj);
  }
}
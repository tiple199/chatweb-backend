export class Logger {
  private static instance: Logger;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public info(message: string, ...optionalParams: any[]) {
    console.log(`[INFO] ${new Date().toISOString()}:`, message, ...optionalParams);
  }

  public error(message: string, ...optionalParams: any[]) {
    console.error(`[ERROR] ${new Date().toISOString()}:`, message, ...optionalParams);
  }

  public warn(message: string, ...optionalParams: any[]) {
    console.warn(`[WARN] ${new Date().toISOString()}:`, message, ...optionalParams);
  }
}

export const logger = Logger.getInstance();

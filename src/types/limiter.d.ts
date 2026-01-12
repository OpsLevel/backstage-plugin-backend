declare module 'limiter' {
  export class RateLimiter {
    constructor(options: { tokensPerInterval: number; interval: string | number });
    removeTokens(count: number): Promise<number>;
    tryRemoveTokens(count: number): boolean;
    getTokensRemaining(): number;
  }
}

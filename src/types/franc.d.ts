declare module "franc" {
  interface FrancOptions {
    minLength?: number;
    only?: string[];
    ignore?: string[];
    whitelist?: string[];
    blacklist?: string[];
  }

  interface Franc {
    (value?: string, options?: FrancOptions): string;
    all(value?: string, options?: FrancOptions): Array<[string, number]>;
  }

  const franc: Franc;
  export default franc;
}

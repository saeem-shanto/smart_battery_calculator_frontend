declare module 'react' {
  export function useId(): string;
}
declare module 'react/jsx-runtime' {
  export const jsx: (...args: any[]) => any;
  export const jsxs: (...args: any[]) => any;
  export const Fragment: any;
}
declare namespace JSX {
  interface IntrinsicElements { [elemName: string]: any; }
}

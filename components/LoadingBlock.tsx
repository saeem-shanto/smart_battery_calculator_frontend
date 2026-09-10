export function LoadingBlock({ text = "Loading..." }: { text?: string }) {
  return <div className="loading-block">{text}</div>;
}

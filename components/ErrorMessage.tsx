export function ErrorMessage({ message }: Readonly<{ message: string }>) {
  return <div className="error-note" role="alert">{message}</div>;
}
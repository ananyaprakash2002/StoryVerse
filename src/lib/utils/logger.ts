export const isDev = import.meta.env.DEV;
export function error(...args: any[]) {
  if (isDev) console.error(...args);
}
export default { error };

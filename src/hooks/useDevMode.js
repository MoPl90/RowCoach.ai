export function useDevMode() {
  return location.search.includes('dev');
}

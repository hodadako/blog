export function getAutoScrollDistance(speed: number, elapsedMilliseconds: number): number {
  if (!Number.isFinite(speed) || speed < 1 || speed > 10 || !Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds <= 0) return 0;
  return speed * 5 * elapsedMilliseconds / 1000;
}

export function isScrollKey(key: string): boolean {
  return ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(key);
}

import { flushSync } from "react-dom";

/**
 * Shows a stimulus and starts the reaction-time clock at the frame that
 * paints it.
 *
 * Tasks used to call setState and then stamp `performance.now()` in the same
 * callback. That starts the clock before React has rendered the stimulus or
 * the browser has painted it, so every RT carried a frame or more of render
 * latency. Here the state change is committed synchronously, the clock starts
 * provisionally, and is then moved to the timestamp of the animation frame
 * that paints the committed DOM. `Math.max` keeps the clock from moving
 * backwards if that frame had already begun before the commit.
 */
export function presentStimulus(commit: () => void, clock: { current: number }): void {
  flushSync(commit);
  clock.current = performance.now();
  requestAnimationFrame((frameTime) => {
    clock.current = Math.max(clock.current, frameTime);
  });
}

import { useEffect, useRef } from "react";

type FrameCallback = (deltaMs: number) => void;

export const useAnimationFrame = (callback: FrameCallback) => {
  const cbRef = useRef<FrameCallback>(callback);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  cbRef.current = callback;

  useEffect(() => {
    const loop = (time: number) => {
      if (lastTimeRef.current == null) {
        lastTimeRef.current = time;
      }
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;
      cbRef.current(delta);
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
      }
      lastTimeRef.current = null;
    };
  }, []);
};

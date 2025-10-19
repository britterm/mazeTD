import { useEffect, useRef } from "react";
export const useAnimationFrame = (callback) => {
    const cbRef = useRef(callback);
    const frameRef = useRef(null);
    const lastTimeRef = useRef(null);
    cbRef.current = callback;
    useEffect(() => {
        const loop = (time) => {
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

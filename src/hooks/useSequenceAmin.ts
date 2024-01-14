import { useEffect, useMemo, useState } from 'react';
import { SpriteModule } from '../types';

export interface UseSequenceAminOptions {
  frameRate?: number;

  frames: SpriteModule[] | __WebpackModuleApi.RequireContext;
  /**
   * Number of times to repeat the animation
   * Negative value means infinity.
   * @default 0
   */
  repeat?: number;
  /**
   * The index of frames should start to repeat
   * @default 0
   */
  repeatAt?: number;

  /**
   * Should start sequences
   * @default true
   */
  play?: boolean;
}

export function useSequenceAmin({
  frames: framesOptions,
  frameRate = 20,
  repeat = -1,
  repeatAt = 0,
  play = true
}: UseSequenceAminOptions) {
  const [{ frame, completed }, setState] = useState({ frame: 0, completed: false, repeat });

  // Although frames will not be changed in most of the times,
  // Do not using `useState` instead of `useMemo`. It do not work on some extreme case
  const { frames, setFrame } = useMemo(() => {
    const frames = Array.isArray(framesOptions)
      ? framesOptions
      : framesOptions.keys().map(request => framesOptions<SpriteModule>(request));

    const setFrame = (frame: number) => setState(s => ({ ...s, frame }));

    return { frames, setFrame };
  }, [framesOptions]);

  const source = frames[frame];

  // reset on props changed
  useEffect(() => setState(s => ({ frame: s.frame, completed: false, repeat })), [repeat]);

  useEffect(() => {
    if (!play) return;
    const update = () => {
      setState(s => {
        const lastFrame = s.frame === frames.length - 1;
        const repeat = lastFrame && s.repeat > 0 ? s.repeat - 1 : s.repeat;
        const completed = lastFrame && repeat === 0;
        const frame = completed ? s.frame : lastFrame ? repeatAt : (s.frame + 1) % frames.length;
        return { ...s, repeat, frame, completed };
      });
    };

    const timeout = setTimeout(update, 1000 / frameRate);
    return () => clearTimeout(timeout);
  }, [play, frame, repeat, frames.length, frameRate, repeatAt]);

  return { source, frame, completed, repeat, setFrame };
}

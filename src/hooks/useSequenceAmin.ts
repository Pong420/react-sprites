import { useEffect, useMemo, useState } from 'react';
import { SpriteModule } from '../types';

export interface UseSequenceAminOptions {
  frameRate?: number;

  frames: SpriteModule[] | __WebpackModuleApi.RequireContext;

  /**
   * play the seuqnces how many times
   * `0` or `false` means not to update the frame and stop immediately
   * `Negative number` or `true` means updating the frame infinitely.
   * `Positive number` means play the number of times
   * @default true
   */
  play?: number | boolean;

  /**
   * player sequence in reverse directory
   * @default false
   */
  reverse?: boolean;

  /**
   * The index of frames should start to repeat
   * @default 0
   */
  repeatAt?: number;
}

const play2Remain = (play: number | boolean): number =>
  play === false ? 0 : play === true || play < 0 ? Infinity : play;

export function useSequenceAmin({
  frames: framesOptions,
  frameRate = 30,
  play = true,
  reverse = false,
  repeatAt = 0
}: UseSequenceAminOptions) {
  const [{ frame, remain }, setState] = useState({
    frame: 0,
    remain: play2Remain(play)
  });

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

  // reset on reverse changed, remain should also change
  useEffect(() => setState(s => ({ ...s, remain: play2Remain(play) })), [play, reverse]);

  useEffect(() => {
    if (remain <= 0) return;

    const update = () => {
      setState(s => {
        const [nextFrame, lastFrame] = reverse
          ? [s.frame - 1, s.frame === 0]
          : [s.frame + 1, s.frame === frames.length - 1];

        const _remain = lastFrame && remain > 0 ? remain - 1 : s.remain;
        const completed = lastFrame && _remain === 0;
        const frame = completed ? s.frame : lastFrame ? repeatAt : nextFrame % frames.length;
        return { ...s, frame, remain: _remain };
      });
    };

    const timeout = setTimeout(update, 1000 / frameRate);
    return () => clearTimeout(timeout);
  }, [frame, frames.length, frameRate, reverse, repeatAt, remain]);

  return {
    source,
    frame,
    remain,
    setFrame,
    setFrameState: setState,
    completed: remain === 0
  };
}

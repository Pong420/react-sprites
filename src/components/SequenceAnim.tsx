import { useEffect, useMemo, useState } from 'react';
import { SpriteModule } from '../types';
import { ImageCanvas, ImageCanvasProps } from './ImageCanvas';

export interface SequenceAnimProps extends Omit<ImageCanvasProps, 'source'> {
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
   * Callback on frames changed
   */
  onFrame?: (frame: number) => void;
  /**
   * Callback on frames completed, won't be called if the repeat is negative (infinity)
   */
  onCompleted?: () => void;
  /**
   * Should start sequences
   * @default true
   */
  play?: boolean;
  /**
   * if repeat is unedfined or negative, this prop won't work
   * @default false
   */
  hideOnCompleted?: boolean;
}

export function SequenceAnim({
  frames: framesOptions,
  frameRate = 20,
  repeat = -1,
  repeatAt = 0,
  onFrame,
  onCompleted,
  play = true,
  hideOnCompleted = false,
  ...props
}: SequenceAnimProps) {
  const [{ frame, completed }, setState] = useState({ frame: 0, completed: false, repeat });

  // Although frames will not be changed in most of the times,
  // Do not using `useState` instead of `useMemo`. It do not work on some extreme case
  const frames = useMemo(() => {
    const frames = Array.isArray(framesOptions)
      ? framesOptions
      : framesOptions.keys().map(request => framesOptions<SpriteModule>(request));
    return frames;
  }, [framesOptions]);

  const source = frames[frame];

  // reset on props changed
  useEffect(() => setState(s => ({ frame: s.frame, completed: false, repeat })), [repeat]);

  useEffect(() => {
    onFrame?.(frame);
  }, [frame, onFrame]);

  useEffect(() => {
    completed && onCompleted?.();
  }, [completed, onCompleted]);

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

  if (!source || (completed && hideOnCompleted)) {
    return null;
  }

  return <ImageCanvas {...props} source={source} />;
}

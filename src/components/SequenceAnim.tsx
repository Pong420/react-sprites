import { useEffect } from 'react';
import { ImageCanvas, ImageCanvasProps } from './ImageCanvas';
import { UseSequenceAminOptions, useSequenceAmin } from '../hooks/useSequenceAmin';

export interface SequenceAnimProps extends Omit<ImageCanvasProps, 'source'>, UseSequenceAminOptions {
  /**
   * Callback on frames changed
   */
  onFrame?: (frame: number) => void;
  /**
   * Callback on frames completed, won't be called if the play is (infinity)
   */
  onCompleted?: () => void;
  /**
   * if repeat is unedfined or negative, this prop won't work
   * @default false
   */
  hideOnCompleted?: boolean;
}

export function SequenceAnim({
  frames,
  frameRate,
  repeatAt,
  onFrame,
  onCompleted,
  play = true,
  hideOnCompleted = false,
  ...props
}: SequenceAnimProps) {
  const { source, frame, completed } = useSequenceAmin({ frames, frameRate, play, repeatAt });

  useEffect(() => {
    onFrame?.(frame);
  }, [frame, onFrame]);

  useEffect(() => {
    completed && onCompleted?.();
  }, [completed, onCompleted]);

  if (!source || (completed && hideOnCompleted)) {
    return null;
  }

  /**
   * If any issue on canvas, try ImageNode
   */
  return <ImageCanvas {...props} source={source} />;
}

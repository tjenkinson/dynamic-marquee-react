import { PropsWithChildren, useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Marquee as MarqueeLib } from 'dynamic-marquee';
import { createContainer } from './create-container';

export function WatchSize({
  marqueeInstance,
  onChange,
  children,
}: PropsWithChildren<{
  marqueeInstance: MarqueeLib;
  onChange: (size: number) => void;
}>) {
  const [$container] = useState(createContainer());
  const currentOnChange = useRef(onChange);
  currentOnChange.current = onChange;

  useLayoutEffect(() => {
    if (!$container) return;

    const { getSize, onSizeChange, stopWatching } =
      marqueeInstance.watchItemSize($container);

    const send = () => currentOnChange.current(getSize());

    onSizeChange(() => send());

    send();

    return () => stopWatching();
  }, [$container, marqueeInstance]);

  return createPortal(children, $container);
}

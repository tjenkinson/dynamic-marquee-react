import { Marquee as MarqueeLib } from 'dynamic-marquee';
import React, {
  ReactNode,
  Children,
  PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { createContainer } from './create-container';
import { IdGenerator } from './id-generator';
import { WatchSize } from './watch-size';

export type MarqueeOpts = {
  /* pixels/s */
  rate?: number;
  /**
   * Switch the direction to up/down instead of left/right.
   * If this is enabled make sure your container has a height set.
   */
  upDown?: boolean;
  /* Start with the marquee full of items. */
  startOnScreen?: boolean;
};

export function Marquee({
  children,
  ...marqueeOpts
}: PropsWithChildren<MarqueeOpts>) {
  const filteredChildren = Children.toArray(children);
  if (filteredChildren.length === 0) return <div />;

  return (
    <MarqueeInternal {...marqueeOpts} filteredChildren={filteredChildren} />
  );
}

type Placeholder = {
  $placeholder: HTMLDivElement;
  key: string;
  childIndex: number;
  inDom: boolean;
  appended: boolean;
};

const MarqueeInternal = React.memo(
  ({
    filteredChildren,
    rate,
    upDown,
    startOnScreen,
  }: MarqueeOpts & { filteredChildren: ReactNode[] }) => {
    const [rateInitial] = useState(rate);
    const [startOnScreenInitial] = useState(startOnScreen);
    const [upDownInitial] = useState(upDown);
    const [idGenerator] = useState(IdGenerator());
    const [, setRenderTrigger] = useState<object | null>(null);
    const [$container, setContainer] = useState<HTMLDivElement | null>(null);
    const placeholders = useRef<Placeholder[]>([]);
    const nextChildIndex = useRef(0);
    const [marqueeInstance, setMarqueeInstance] = useState<MarqueeLib | null>(
      null
    );
    const nextItemTouching = useRef(false);
    const itemSizes = useRef<number[]>([]);
    const childrenCount = useRef(filteredChildren.length);
    childrenCount.current = filteredChildren.length;

    // Input items have changed. If there are fewer than before trim the item
    // sizes array.
    if (itemSizes.current.length > filteredChildren.length) {
      itemSizes.current = itemSizes.current.slice(0, filteredChildren.length);
    }

    useEffect(() => {
      if (!$container) return;

      // Create the marquee instance.
      const marquee = new MarqueeLib($container, {
        upDown: upDownInitial,
        startOnScreen: startOnScreenInitial,
        rate: rateInitial,
      });
      setMarqueeInstance(marquee);

      return () => marquee.clear();
    }, [
      $container,
      rateInitial,
      setMarqueeInstance,
      startOnScreenInitial,
      upDownInitial,
    ]);

    useEffect(() => {
      if (!marqueeInstance) return;

      const createPlaceholders = (sizeToFill: number) => {
        // we may have some placeholders queued, and if that's the case
        // subtract their sizes.
        placeholders.current
          .filter(({ appended }) => !appended)
          .forEach(
            ({ childIndex }) => (sizeToFill -= itemSizes.current[childIndex])
          );

        let zeroIncreaseCounter = 0;
        // Figure out how many items we need to fill the available space, and create
        // that many placeholders. The next render will put the placeholders in the dom.
        while (
          sizeToFill > 0 &&
          // If all sizes end up being 0 prevent an infinite loop.
          zeroIncreaseCounter < itemSizes.current.length
        ) {
          const childIndex = nextChildIndex.current;
          const childSize = itemSizes.current[childIndex];
          if (childSize === 0) {
            zeroIncreaseCounter++;
          } else {
            zeroIncreaseCounter = 0;
          }
          sizeToFill -= childSize;

          const $placeholder = createContainer();

          placeholders.current.push({
            $placeholder,
            key: idGenerator.generate(),
            childIndex,
            inDom: false,
            appended: false,
          });

          nextChildIndex.current =
            (nextChildIndex.current + 1) % childrenCount.current;
        }

        // Trigger a render.
        setRenderTrigger({});
      };

      marqueeInstance.onItemRequired(({ touching }) => {
        nextItemTouching.current = !!touching;
        createPlaceholders(marqueeInstance.getGapSize());
      });

      marqueeInstance.onItemRemoved(($el) => {
        // Remove the placeholder for the item that has just been removed from the marquee.
        placeholders.current = placeholders.current.filter(
          ({ $placeholder, key }) => {
            if ($el === $placeholder) {
              idGenerator.release(key);
              return false;
            }
            return true;
          }
        );
      });

      // Create the placeholder for the first item.
      // May actually be more than one item if the items are smaller than the buffer size.
      createPlaceholders(marqueeInstance.getGapSize());
    }, [idGenerator, marqueeInstance]);

    useEffect(() => {
      if (!marqueeInstance || rate === undefined) return;
      // The rate has changed, update it.
      marqueeInstance.setRate(rate);
    }, [marqueeInstance, rate]);

    useEffect(() => {
      if (!marqueeInstance) return;

      // We have just rendered, and the marquee is waiting for the next item.
      // This is in a loop because there may be room for more than one item.
      while (marqueeInstance.isWaitingForItem()) {
        const toAppend = placeholders.current.find(
          ({ inDom, appended }) => inDom && !appended
        );
        if (!toAppend) {
          // Ran out of placeholders that are in the DOM. More should have been
          // created but are not in the dom yet until the next render.
          // This may happen if the container or item sizes changed between when
          // we calculated how many new placeholders we needed and now.
          return;
        }

        toAppend.appended = true;

        // Note that this may synchronously call the `onItemRequired` callback,
        // which may result in more placeholders being created if needed.
        marqueeInstance.appendItem(toAppend.$placeholder, {
          snapToNeighbour: nextItemTouching.current,
        });
      }
    });

    return (
      <React.Fragment>
        <div
          ref={setContainer}
          style={{ all: 'unset', display: 'block', height: '100%' }}
        />
        {/* Create the portals, putting the new placeholders in the dom (if there are any) */}
        {placeholders.current.map((placeholder) => {
          const { $placeholder, key, childIndex } = placeholder;
          placeholder.inDom = true;
          const child = filteredChildren[childIndex];
          return child ? createPortal(child, $placeholder, key) : null;
        })}

        {marqueeInstance
          ? filteredChildren.map((child, i) => (
              <WatchSize
                key={i}
                marqueeInstance={marqueeInstance}
                onChange={(size) => {
                  itemSizes.current[i] = size;
                }}
              >
                {child}
              </WatchSize>
            ))
          : null}
      </React.Fragment>
    );
  }
);

MarqueeInternal.displayName = 'MarqueeInternal';

import { Marquee as MarqueeLib } from 'dynamic-marquee';
import React, {
  ReactNode,
  Children,
  PropsWithChildren,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

// TODO update doc comments

export type MarqueeOpts = {
  rate?: number;
  upDown?: boolean;
  startOnScreen?: boolean;
};

function createContainer() {
  const $el = document.createElement('div');
  $el.style.all = 'unset';
  $el.style.display = 'block';
  return $el;
}

function IdGenerator() {
  const ids = new Set();
  return {
    generate() {
      const base = `${performance.now()}`;
      let id = base;
      for (let i = 0; ids.has(id); i++) {
        id = `${base}:${i}`;
      }
      ids.add(id);
      return id;
    },
    release(id: string) {
      ids.delete(id);
    },
  };
}

function WatchSize({
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

    const {
      getSize,
      onSizeChange,
      stopWatching,
    } = marqueeInstance.watchItemSize($container);

    const send = () => currentOnChange.current(getSize());

    onSizeChange(() => send());

    send();

    return () => stopWatching();
  }, [$container, marqueeInstance]);

  return createPortal(children, $container);
}

export function Marquee({
  children,
  ...marqueeOpts
}: PropsWithChildren<MarqueeOpts>) {
  const filteredChildren = Children.toArray(children);
  if (filteredChildren.length === 0) {
    return <div />;
  }
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

// TODO take opts individually and make sure upDown works
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

    useLayoutEffect(() => {
      if (itemSizes.current.length > filteredChildren.length) {
        itemSizes.current = itemSizes.current.slice(0, filteredChildren.length);
      }
    }, [filteredChildren.length]);

    useEffect(() => {
      if (!$container) return;

      // (1) create the marquee instance
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
        placeholders.current
          .filter(({ appended }) => !appended)
          .forEach(
            ({ childIndex }) => (sizeToFill -= itemSizes.current[childIndex])
          );

        let zeroIncreaseCounter = 0;
        while (
          sizeToFill > 0 &&
          // if all sizes end up being 0 prevent an infinite loop
          zeroIncreaseCounter < itemSizes.current.length
        ) {
          // (3) create a placeholder but don't put it in the dom yet
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

        setRenderTrigger({});
      };

      marqueeInstance.onItemRequired(({ touching }) => {
        // todo can to fill actually be 0?
        // (6) there is space for a new item, so create the placeholder for it
        nextItemTouching.current = !!touching;
        createPlaceholders(marqueeInstance.getGapSize());
      });

      marqueeInstance.onItemRemoved(($el) => {
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

      // (2) create the first placeholder for the first item
      createPlaceholders(marqueeInstance.getGapSize());
    }, [idGenerator, marqueeInstance]);

    useEffect(() => {
      if (!marqueeInstance || rate === undefined) return;
      marqueeInstance.setRate(rate);
    }, [marqueeInstance, rate]);

    useEffect(() => {
      if (!marqueeInstance) return;

      while (marqueeInstance.isWaitingForItem()) {
        const toAppend = placeholders.current.find(
          ({ inDom, appended }) => inDom && !appended
        );
        if (!toAppend) {
          // TODO comment that we misjudged size or initial render
          return;
        }

        // TODO comment on mutation
        toAppend.appended = true;

        // (5) at this point we should have rendered and the element will be
        // in the dom in the portal with content in, so append it to the marquee
        console.log('append placeholder');
        marqueeInstance.appendItem(toAppend.$placeholder, {
          // TODO not that onItemRequired may be called here and update this ref
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
        {/* (4) create the portal, putting the new placeholders in the dom (if there are any) */}
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

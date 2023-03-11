import * as React from 'react';
import { Marquee } from 'dynamic-marquee-react';

import './style.css';

export default function App() {
  const [counter, setCounter] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => setCounter((a) => a + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div id="marquee">
      <Marquee rate={-100}>
        <div>Counter: {counter}</div>
        <div>&nbsp;&bull;&nbsp;</div>
      </Marquee>
    </div>
  );
}

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
    <div style={{ height: '100px' }}>
      <Marquee rate={counter < 4 ? -20 : 20} startOnScreen>
        {/* <React.Fragment> */}
        <div>.</div>
        <div>Item 1 ({counter})&nbsp;</div>
        {/* <div ref={logRef}>Item 1 ({counter})&nbsp;</div> */}
        {/* {counter % 2 === 0 ? <div>NEW&nbsp;</div> : null} */}
        {/* <div>{counter % 2 === 0 ? 'NEW' : 'N'}&nbsp;</div> */}
        {/* <div>Item 2&nbsp;</div> */}
        {/* <div>Item 3&nbsp;</div> */}
        {/* </React.Fragment> */}
      </Marquee>
    </div>
  );
}

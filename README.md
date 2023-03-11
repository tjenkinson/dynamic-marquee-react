# Dynamic Marquee React

A `<Marquee />` component for React.

Uses "[dynamic-marquee](https://github.com/tjenkinson/dynamic-marquee)" under the hood.

Features:

- You can change the rate on the fly.
- Direction can either be up/down or right/left.
- Width/height of items and container is allowed to change.

# Demo

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/tjenkinson/dynamic-marquee-react/tree/main/demo?title=Dynamic%20Marquee%20React%20Demo&file=src%2Fmain.ts)

View the code in "[demo](./demo)".

# Installation

```
npm install --save dynamic-marquee-react
```

# Usage

```jsx
import React from 'react';
import { Marquee } from 'dynamic-marquee-react';

export default function MyMarquee() {
  return (
    <Marquee>
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
    </Marquee>
  );
}
```

There are also the following props:

- `rate`: pixels/s. _Default: `-25`_
- `upDown`: Switch the direction to up/down instead of left/right. If this is enabled make sure your container has a height set. _Default: `false`_
- `startOnScreen`: Start with the marquee full of items. _Default: `false`_

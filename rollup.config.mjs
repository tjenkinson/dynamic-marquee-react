import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import fs from 'fs';

const packageJson = JSON.parse(
  fs.readFileSync('./package.json', { encoding: 'utf-8' })
);

export default {
  input: 'src/marquee.tsx',
  plugins: [resolve({ browser: true }), typescript()],
  external: Object.keys(packageJson.peerDependencies),
  onwarn: (e) => {
    throw new Error(e);
  },
  output: [
    {
      name: 'dynamicMarqueeReact',
      file: 'dist/dynamic-marquee-react.js',
      format: 'umd',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
    },
    {
      file: 'dist/dynamic-marquee-react.mjs',
      format: 'es',
    },
  ],
};

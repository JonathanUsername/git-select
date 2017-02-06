import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/main.js',
  plugins: [ babel() ],
  format: 'cjs',
  banner: '#!/usr/bin/env node',
  dest: './bin/git-select'
};

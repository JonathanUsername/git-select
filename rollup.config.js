import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/main.js',
  plugins: [ babel() ],
  format: 'cjs',
  dest: './bin/git-select'
};

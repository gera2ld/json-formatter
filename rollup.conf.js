const path = require('path');
const { getRollupPlugins, defaultOptions } = require('@gera2ld/plaid');
const userscript = require('rollup-plugin-userscript');
const pkg = require('./package.json');

const DIST = 'dist';
const FILENAME = 'json-formatter';

const bundleOptions = {
  extend: true,
  esModule: false,
};
defaultOptions.tailwindcss.darkMode = 'class';
const postcssOptions = {
  ...require('@gera2ld/plaid/config/postcssrc'),
  inject: false,
  minimize: true,
};
const rollupConfig = [
  {
    input: {
      input: 'src/index.js',
      plugins: [
        {
          async transform(code, id) {
            // process CSS from importHttp
            if (/^\0.*?\.css$/.test(id)) {
              const { css } = await require('postcss')([require('cssnano')]).process(code, { from: 'src/style.css' });
              return `export default ${JSON.stringify(css)}`;
            }
          },
        },
        ...getRollupPlugins({
          browser: true,
          postcss: postcssOptions,
          importHttp: true,
        }),
        userscript(
          path.resolve('src/meta.js'),
          meta => meta
            .replace('process.env.VERSION', pkg.version)
            .replace('process.env.AUTHOR', pkg.author),
        ),
      ],
    },
    output: {
      format: 'iife',
      file: `${DIST}/${FILENAME}.user.js`,
      ...bundleOptions,
    },
  },
];

rollupConfig.forEach((item) => {
  item.output = {
    indent: false,
    // If set to false, circular dependencies and live bindings for external imports won't work
    externalLiveBindings: false,
    ...item.output,
  };
});

module.exports = rollupConfig.map(({ input, output }) => ({
  ...input,
  output,
}));

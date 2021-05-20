module.exports = {
    // mount: {
    //     src: "/dist",
    //     public: "/"
    // },
    mount: {

        public: "/",

        src: "/dist",

      },
    alias: {
        '@': './src/',
        '@fonts': './src/fonts/',
        '@style': './src/style/',
        '@models': './src/models/',
        '@shaders': './src/shaders/',
        '@sounds': './src/sounds/',
        '@textures': './src/images/textures/',
        '@js': './src/js/',
        '@tools': './src/js/Tools/',
        '@world': './src/js/World/',
        '@store': './src/js/Store/',
        '@lib': './src/js/Lib/',
    },
    plugins: [
        '@snowpack/plugin-typescript',
        'snowpack-plugin-stylus',
        '@canarise/snowpack-eslint-plugin',
        ["snowpack-plugin-raw-file-loader", {
          exts: [".frag", ".vert", ".glsl", ".template"]
        }],
        ["@snowpack/plugin-optimize", { /* see options below */ }],
        ["@snowpack/plugin-dotenv"],
        "snowpack-plugin-relative-css-urls",
        // [
        //     "@marlonmarcello/snowpack-plugin-pug",
        //     {
        //       "data": {
        //         "meta": {
        //           "title": "My website"
        //         }
        //       }
        //     }
        //   ],

    ],
    packageOptions: {
      polyfillNode: true,
      rollup: {
        plugins: [require('rollup-plugin-node-polyfills')({fs: true, assert: true })],
      },
    },
    buildOptions: {
      htmlFragments: true
    }
};
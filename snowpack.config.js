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
        '@textures': './src/textures/',
        '@js': './src/js/',
        '@tools': './src/js/Tools/',
        '@world': './src/js/World/',
    },
    plugins: [
        '@snowpack/plugin-typescript',
        'snowpack-plugin-stylus',
        '@canarise/snowpack-eslint-plugin',
        ["snowpack-plugin-raw-file-loader", {
          exts: [".frag", ".vert", ".glsl"]
        }],
        ["@snowpack/plugin-optimize", { /* see options below */ }],
        [
            "@marlonmarcello/snowpack-plugin-pug",
            {
              "data": {
                "meta": {
                  "title": "My website"
                }
              }
            }
          ],
          
    ],
    packageOptions: {
      polyfillNode: true,
      rollup: {
        plugins: [require('rollup-plugin-node-polyfills')({fs: true })],
      },
    }
};
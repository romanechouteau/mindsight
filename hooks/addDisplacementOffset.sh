cd '/Users/aymericclint/School/Mindsight2/mindsight/node_modules/three/package.json'
sed 's/transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vUv ).x * displacementScale + displacementBias );/transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vUv * * offsetRepeat.zw + offsetRepeat.xy ).x * displacementScale + displacementBias );/'
npm i
npm run build 
rm -rf ./node_modules
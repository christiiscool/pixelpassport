import { build } from 'esbuild';
await build({entryPoints:['src/dashboard.jsx'],bundle:true,minify:true,format:'iife',target:['es2020'],outfile:'dist/dashboard-react.js',define:{'process.env.NODE_ENV':'"production"'}});
console.log('Built React dashboard components');

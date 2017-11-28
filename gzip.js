const zlib = require("zlib");
const gzip = zlib.createGzip();
const fs = require("fs");
const inp = fs.createReadStream("lib/yalla.min.js");
const out = fs.createWriteStream("lib/yalla.min.js.gzip");

inp.pipe(gzip).pipe(out);
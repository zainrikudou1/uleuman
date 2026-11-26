(function (global) {
  'use strict';

  /* Pure-JS ISO/IEC 18004 QR Code Generator (Byte Mode, ECC Level M, Versions 1-10) */
  var EXP = new Array(512);
  var LOG = new Array(256);
  (function initGF() {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();

  function gfMul(a, b) {
    return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]];
  }

  function rsGenPoly(ecLen) {
    var poly = [1];
    for (var i = 0; i < ecLen; i++) {
      var next = new Array(poly.length + 1).fill(0);
      var factor = EXP[i];
      for (var j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], factor);
      }
      poly = next;
    }
    return poly;
  }

  function rsEncode(data, ecLen) {
    var gen = rsGenPoly(ecLen);
    var res = data.slice().concat(new Array(ecLen).fill(0));
    for (var i = 0; i < data.length; i++) {
      var coef = res[i];
      if (coef !== 0) {
        for (var j = 0; j < gen.length; j++) {
          res[i + j] ^= gfMul(gen[j], coef);
        }
      }
    }
    return res.slice(data.length);
  }

  /* Version specs for ECC Level M: [totalCodewords, ecPerBlock, blocksGroup1, dataPerBlock1, blocksGroup2, dataPerBlock2, alignCoords] */
  var VERSION_M = {
    1:  [26,  10, 1, 16, 0, 0, []],
    2:  [44,  16, 1, 28, 0, 0, [6, 18]],
    3:  [70,  26, 1, 44, 0, 0, [6, 22]],
    4:  [100, 18, 2, 32, 0, 0, [6, 26]],
    5:  [134, 24, 2, 43, 0, 0, [6, 30]],
    6:  [172, 16, 4, 27, 0, 0, [6, 34]],
    7:  [196, 18, 4, 31, 0, 0, [6, 22, 38]],
    8:  [242, 22, 2, 38, 2, 39, [6, 24, 42]],
    9:  [292, 22, 3, 36, 2, 37, [6, 26, 46]],
    10: [346, 26, 4, 43, 1, 44, [6, 28, 50]]
  };

  /* Format info strings for ECC M (00) + mask 0..7, pre-masked with 0x5412 */
  var FORMAT_M = [
    0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0
  ];

  /* Version info for v7..v10 */
  var VERSION_BITS = {
    7: 0x07c94, 8: 0x085bc, 9: 0x09a99, 10: 0x0a4d3
  };

  function toUtf8Bytes(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      else bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
    return bytes;
  }

  function buildDataCodewords(bytes, version) {
    var spec = VERSION_M[version];
    var dataCap = spec[2] * spec[3] + spec[4] * spec[5];
    var bits = [];
    function pushBits(val, len) {
      for (var i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
    }
    pushBits(0x4, 4); /* Byte mode */
    pushBits(bytes.length, version >= 10 ? 16 : 8);
    for (var i = 0; i < bytes.length; i++) pushBits(bytes[i], 8);
    var totalBits = dataCap * 8;
    var termLen = Math.min(4, totalBits - bits.length);
    pushBits(0, termLen);
    while (bits.length % 8 !== 0) bits.push(0);
    var padBytes = [0xec, 0x11];
    var pIdx = 0;
    while (bits.length < totalBits) {
      pushBits(padBytes[pIdx % 2], 8);
      pIdx++;
    }
    var codewords = [];
    for (var b = 0; b < bits.length; b += 8) {
      var v = 0;
      for (var k = 0; k < 8; k++) v = (v << 1) | bits[b + k];
      codewords.push(v);
    }
    return codewords;
  }

  function interleaveAndECC(codewords, version) {
    var spec = VERSION_M[version];
    var ecLen = spec[1], g1 = spec[2], d1 = spec[3], g2 = spec[4], d2 = spec[5];
    var dataBlocks = [], ecBlocks = [], offset = 0;
    for (var i = 0; i < g1; i++) {
      var blk1 = codewords.slice(offset, offset + d1);
      offset += d1;
      dataBlocks.push(blk1);
      ecBlocks.push(rsEncode(blk1, ecLen));
    }
    for (var j = 0; j < g2; j++) {
      var blk2 = codewords.slice(offset, offset + d2);
      offset += d2;
      dataBlocks.push(blk2);
      ecBlocks.push(rsEncode(blk2, ecLen));
    }
    var result = [];
    var maxData = Math.max(d1, d2);
    for (var col = 0; col < maxData; col++) {
      for (var r = 0; r < dataBlocks.length; r++) {
        if (col < dataBlocks[r].length) result.push(dataBlocks[r][col]);
      }
    }
    for (var ecol = 0; ecol < ecLen; ecol++) {
      for (var er = 0; er < ecBlocks.length; er++) {
        result.push(ecBlocks[er][ecol]);
      }
    }
    return result;
  }

  function createMatrix(version) {
    var size = version * 4 + 17;
    var mat = Array.from({ length: size }, function () { return new Array(size).fill(null); });
    var isFunc = Array.from({ length: size }, function () { return new Array(size).fill(false); });

    function setMod(r, c, val) {
      mat[r][c] = val ? 1 : 0;
      isFunc[r][c] = true;
    }

    function drawFinder(r0, c0) {
      for (var r = -1; r <= 7; r++) {
        for (var c = -1; c <= 7; c++) {
          var rr = r0 + r, cc = c0 + c;
          if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
          var inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
          var inBorder = r === 0 || r === 6 || c === 0 || c === 6;
          var inCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          setMod(rr, cc, inOuter && (inBorder || inCenter));
        }
      }
    }

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    for (var i = 8; i < size - 8; i++) {
      setMod(6, i, i % 2 === 0);
      setMod(i, 6, i % 2 === 0);
    }

    setMod(size - 8, 8, true);

    var align = VERSION_M[version][6];
    for (var ai = 0; ai < align.length; ai++) {
      for (var aj = 0; aj < align.length; aj++) {
        var ar = align[ai], ac = align[aj];
        if ((ar === 6 && ac === 6) || (ar === 6 && ac === size - 7) || (ar === size - 7 && ac === 6)) continue;
        for (var dr = -2; dr <= 2; dr++) {
          for (var dc = -2; dc <= 2; dc++) {
            setMod(ar + dr, ac + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
          }
        }
      }
    }

    /* Reserve format info */
    for (var f = 0; f < 9; f++) {
      if (f !== 6) {
        isFunc[8][f] = true;
        isFunc[f][8] = true;
      }
    }
    for (var f2 = 0; f2 < 8; f2++) {
      isFunc[8][size - 1 - f2] = true;
      if (f2 < 7) isFunc[size - 1 - f2][8] = true;
    }

    if (version >= 7) {
      var vBits = VERSION_BITS[version];
      for (var vb = 0; vb < 18; vb++) {
        var bit = ((vBits >> vb) & 1) === 1;
        var vr = Math.floor(vb / 3);
        var vc = size - 11 + (vb % 3);
        setMod(vr, vc, bit);
        setMod(vc, vr, bit);
      }
    }

    return { mat: mat, isFunc: isFunc, size: size };
  }

  function placeData(mat, isFunc, size, allBytes) {
    var bitIdx = 0;
    var totalBits = allBytes.length * 8;
    var dir = -1;
    for (var col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (var rowStep = 0; rowStep < size; rowStep++) {
        var r = dir === -1 ? size - 1 - rowStep : rowStep;
        for (var dx = 0; dx < 2; dx++) {
          var c = col - dx;
          if (!isFunc[r][c]) {
            var bit = 0;
            if (bitIdx < totalBits) {
              bit = (allBytes[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1;
              bitIdx++;
            }
            mat[r][c] = bit;
          }
        }
      }
      dir *= -1;
    }
  }

  function applyMask(baseMat, isFunc, size, maskId) {
    var m = baseMat.map(function (row) { return row.slice(); });
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (isFunc[r][c]) continue;
        var inv = false;
        if (maskId === 0) inv = (r + c) % 2 === 0;
        else if (maskId === 1) inv = r % 2 === 0;
        else if (maskId === 2) inv = c % 3 === 0;
        else if (maskId === 3) inv = (r + c) % 3 === 0;
        else if (maskId === 4) inv = (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
        else if (maskId === 5) inv = ((r * c) % 2) + ((r * c) % 3) === 0;
        else if (maskId === 6) inv = (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
        else if (maskId === 7) inv = (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
        if (inv) m[r][c] ^= 1;
      }
    }
    var fmt = FORMAT_M[maskId];
    for (var i = 0; i <= 5; i++) m[8][i] = (fmt >> (14 - i)) & 1;
    m[8][7] = (fmt >> 8) & 1;
    m[8][8] = (fmt >> 7) & 1;
    m[7][8] = (fmt >> 6) & 1;
    for (var j = 0; j < 6; j++) m[5 - j][8] = (fmt >> j) & 1;
    for (var k = 0; k < 8; k++) m[8][size - 1 - k] = (fmt >> k) & 1;
    for (var l = 0; l < 7; l++) m[size - 1 - l][8] = (fmt >> (14 - l)) & 1;
    return m;
  }

  function penaltyScore(m, size) {
    var score = 0;
    for (var r = 0; r < size; r++) {
      var run = 1;
      for (var c = 1; c < size; c++) {
        if (m[r][c] === m[r][c - 1]) {
          run++;
          if (run === 5) score += 3;
          else if (run > 5) score += 1;
        } else run = 1;
      }
    }
    for (var c2 = 0; c2 < size; c2++) {
      var run2 = 1;
      for (var r2 = 1; r2 < size; r2++) {
        if (m[r2][c2] === m[r2 - 1][c2]) {
          run2++;
          if (run2 === 5) score += 3;
          else if (run2 > 5) score += 1;
        } else run2 = 1;
      }
    }
    for (var r3 = 0; r3 < size - 1; r3++) {
      for (var c3 = 0; c3 < size - 1; c3++) {
        var v = m[r3][c3];
        if (v === m[r3][c3 + 1] && v === m[r3 + 1][c3] && v === m[r3 + 1][c3 + 1]) score += 3;
      }
    }
    return score;
  }

  function generateMatrix(text) {
    var bytes = toUtf8Bytes(String(text || ''));
    var version = 1;
    for (var v = 1; v <= 10; v++) {
      var spec = VERSION_M[v];
      var cap = spec[2] * spec[3] + spec[4] * spec[5];
      var headerBytes = v >= 10 ? 3 : 2;
      if (bytes.length + headerBytes <= cap) {
        version = v;
        break;
      }
    }
    var codewords = buildDataCodewords(bytes, version);
    var allBytes = interleaveAndECC(codewords, version);
    var grid = createMatrix(version);
    placeData(grid.mat, grid.isFunc, grid.size, allBytes);

    var bestMask = 0, bestScore = Infinity, bestMat = null;
    for (var mask = 0; mask < 8; mask++) {
      var candidate = applyMask(grid.mat, grid.isFunc, grid.size, mask);
      var sc = penaltyScore(candidate, grid.size);
      if (sc < bestScore) {
        bestScore = sc;
        bestMask = mask;
        bestMat = candidate;
      }
    }
    return { matrix: bestMat, size: grid.size, version: version, mask: bestMask };
  }

  function toSVG(text, opts) {
    opts = opts || {};
    var fg = opts.fg || '#38352F';
    var bg = opts.bg || '#F8F4EA';
    var quiet = typeof opts.quiet === 'number' ? opts.quiet : 2;
    var res = generateMatrix(text);
    var total = res.size + quiet * 2;
    var paths = [];
    for (var r = 0; r < res.size; r++) {
      for (var c = 0; c < res.size; c++) {
        if (res.matrix[r][c] === 1) {
          paths.push('M' + (c + quiet) + ',' + (r + quiet) + 'h1v1h-1z');
        }
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges" role="img" aria-label="QR Code Lokasi Google Maps">' +
      '<rect width="' + total + '" height="' + total + '" fill="' + bg + '"/>' +
      '<path d="' + paths.join('') + '" fill="' + fg + '"/>' +
      '</svg>';
  }

  var api = { generateMatrix: generateMatrix, toSVG: toSVG };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.IvoryQR = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);

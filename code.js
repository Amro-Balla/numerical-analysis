// ========================
// HELPERS
// ========================
const fmt = (x) => Number(x).toFixed(3);
const $ = (id) => document.getElementById(id);
const val = (id) => parseFloat($(id).value);
const str = (id) => $(id).value;

function parseF(expr) {
  if (!expr) return null;
  expr = expr
    .toLowerCase()
    .replace(/\^/g, "**")
    .replace(/sqrt/g, "Math.sqrt")
    .replace(/sin/g, "Math.sin")
    .replace(/cos/g, "Math.cos");
  return (x) => {
    try {
      return eval(expr);
    } catch {
      return NaN;
    }
  };
}

function showOutput() {
  const c = $("output-card");
  if (c) c.classList.remove("hidden");
  const w = $("waiting");
  if (w) w.style.display = "none";
}
function setResult(html) {
  $("result").innerHTML = html;
  showOutput();
}
function rootRow(cols, root) {
  return `<tr style="background:rgba(0,240,255,0.12);font-weight:bold">
    <td colspan="${cols}" style="text-align:center;padding:10px;color:#00f0ff;font-size:15px;">Root ≈ ${root.toFixed(6)}</td></tr>`;
}

// ========================
// MATRIX HELPERS
// ========================
function readMatrix() {
  const ids = ["a11", "a12", "a13", "a21", "a22", "a23", "a31", "a32", "a33"];
  const A = [ids.slice(0, 3), ids.slice(3, 6), ids.slice(6, 9)].map((r) =>
    r.map((id) => parseFloat($(id).value)),
  );
  const b = [val("b1"), val("b2"), val("b3")];
  if (!A.flat().every((v) => !isNaN(v)) || b.some(isNaN)) {
    alert("Invalid matrix input");
    return null;
  }
  return { A, b };
}
function matrixHTML(A, b, title) {
  let h = `<div class="step"><h3>${title}</h3><table>`;
  for (let i = 0; i < 3; i++)
    h +=
      "<tr>" +
      A[i].map((v) => `<td>${fmt(v)}</td>`).join("") +
      `<td>|</td><td>${fmt(b[i])}</td></tr>`;
  return h + "</table></div>";
}
function matrixOnlyHTML(M, title) {
  let h = `<div class="step"><h3>${title}</h3><table>`;
  for (let i = 0; i < 3; i++)
    h += "<tr>" + M[i].map((v) => `<td>${fmt(v)}</td>`).join("") + "</tr>";
  return h + "</table></div>";
}
function det3(m) {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}

// ========================
// GRAPH
// ========================
function drawGraph(fExpr, root, xl, xu) {
  const canvas = $("graph");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width,
    H = canvas.height,
    pad = 50;
  ctx.clearRect(0, 0, W, H);
  const f = parseF(fExpr);

  let xMin = Math.floor(xl !== undefined ? xl : root - 4) - 1;
  let xMax = Math.ceil(xu !== undefined ? xu : root + 4) + 1;

  // Y range from bracket only
  const bxMin = xl !== undefined ? xl : root - 1;
  const bxMax = xu !== undefined ? xu : root + 1;
  const yVals = [];
  for (let x = bxMin; x <= bxMax; x += 0.05) {
    const y = f(x);
    if (isFinite(y)) yVals.push(y);
  }
  if (root !== undefined && isFinite(f(root))) yVals.push(f(root), 0);
  yVals.sort((a, b) => a - b);
  const lo = yVals[0] ?? -1,
    hi = yVals[yVals.length - 1] ?? 1,
    span = hi - lo;
  let yMin = lo - span * 0.15,
    yMax = hi + span * 0.15;
  if (yMax - yMin < 2) {
    yMin -= 1;
    yMax += 1;
  }

  const toX = (x) => pad + ((x - xMin) / (xMax - xMin)) * (W - 2 * pad);
  const toY = (y) => H - pad - ((y - yMin) / (yMax - yMin)) * (H - 2 * pad);

  function niceTick(range) {
    const r = range / 6,
      mag = Math.pow(10, Math.floor(Math.log10(r))),
      n = r / mag;
    return Math.max(
      n < 1.5 ? mag : n < 3.5 ? 2 * mag : n < 7.5 ? 5 * mag : 10 * mag,
      1,
    );
  }
  const xStep = niceTick(xMax - xMin),
    yStep = niceTick(yMax - yMin);
  const xStart = Math.ceil(xMin / xStep) * xStep,
    yStart = Math.ceil(yMin / yStep) * yStep;
  const tick = (v, s) => Math.round((v + s) * 1e10) / 1e10;

  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = "#ffffff15";
  ctx.lineWidth = 1;
  for (let x = xStart; x <= xMax + xStep * 0.01; x = tick(x, xStep)) {
    ctx.beginPath();
    ctx.moveTo(toX(x), pad);
    ctx.lineTo(toX(x), H - pad);
    ctx.stroke();
  }
  for (let y = yStart; y <= yMax + yStep * 0.01; y = tick(y, yStep)) {
    ctx.beginPath();
    ctx.moveTo(pad, toY(y));
    ctx.lineTo(W - pad, toY(y));
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = "#ffffff50";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (yMin <= 0 && yMax >= 0) {
    ctx.moveTo(pad, toY(0));
    ctx.lineTo(W - pad, toY(0));
  }
  if (xMin <= 0 && xMax >= 0) {
    ctx.moveTo(toX(0), pad);
    ctx.lineTo(toX(0), H - pad);
  }
  ctx.stroke();

  // Tick labels
  ctx.fillStyle = "#aaaaaa";
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  for (let x = xStart; x <= xMax + xStep * 0.01; x = tick(x, xStep))
    ctx.fillText(parseFloat(x.toFixed(1)), toX(x), H - pad + 15);
  ctx.textAlign = "right";
  for (let y = yStart; y <= yMax + yStep * 0.01; y = tick(y, yStep))
    ctx.fillText(parseFloat(y.toFixed(1)), pad - 5, toY(y) + 4);

  // Curve
  ctx.strokeStyle = "#00d4ff";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  let started = false;
  for (let x = xMin; x <= xMax; x += (xMax - xMin) / 500) {
    const y = f(x);
    if (!isFinite(y)) {
      started = false;
      continue;
    }
    started
      ? ctx.lineTo(toX(x), toY(y))
      : (ctx.moveTo(toX(x), toY(y)), (started = true));
  }
  ctx.stroke();

  // Root markers
  if (root !== undefined && isFinite(root)) {
    const rx = toX(root),
      ry = toY(0);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#ff6b6b80";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx, toY(f(root)));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ff6b6b";
    ctx.beginPath();
    ctx.arc(rx, ry, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffff00";
    ctx.beginPath();
    ctx.arc(rx, toY(f(root)), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff6b6b";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`root ≈ ${root.toFixed(4)}`, rx + 8, ry - 8);
  }
  ctx.fillStyle = "#00d4ff";
  ctx.font = "13px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`f(x) = ${fExpr}`, pad + 5, pad - 10);
}

function drawGraphFixedPoint(gExpr, root) {
  const canvas = $("graph");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width,
    H = canvas.height,
    pad = 50;
  ctx.clearRect(0, 0, W, H);
  const g = parseF(gExpr);
  let xMin = Math.floor(root - 4),
    xMax = Math.ceil(root + 4);
  const yVals = [];
  for (let x = xMin; x <= xMax; x += 0.05) {
    const y = g(x);
    if (isFinite(y)) yVals.push(y, x);
  }
  yVals.sort((a, b) => a - b);
  const lo = yVals[0] ?? -1,
    hi = yVals[yVals.length - 1] ?? 1,
    m = Math.max((hi - lo) * 0.15, 1);
  let yMin = lo - m,
    yMax = hi + m;
  if (yMax - yMin < 2) {
    yMin -= 1;
    yMax += 1;
  }
  const toX = (x) => pad + ((x - xMin) / (xMax - xMin)) * (W - 2 * pad);
  const toY = (y) => H - pad - ((y - yMin) / (yMax - yMin)) * (H - 2 * pad);
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#ffffff15";
  ctx.lineWidth = 1;
  for (let x = Math.ceil(xMin); x <= xMax; x++) {
    ctx.beginPath();
    ctx.moveTo(toX(x), pad);
    ctx.lineTo(toX(x), H - pad);
    ctx.stroke();
  }
  for (let y = Math.ceil(yMin); y <= yMax; y++) {
    ctx.beginPath();
    ctx.moveTo(pad, toY(y));
    ctx.lineTo(W - pad, toY(y));
    ctx.stroke();
  }
  ctx.strokeStyle = "#ffffff50";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (yMin <= 0 && yMax >= 0) {
    ctx.moveTo(pad, toY(0));
    ctx.lineTo(W - pad, toY(0));
  }
  if (xMin <= 0 && xMax >= 0) {
    ctx.moveTo(toX(0), pad);
    ctx.lineTo(toX(0), H - pad);
  }
  ctx.stroke();
  ctx.strokeStyle = "#ffffff30";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(toX(xMin), toY(xMin));
  ctx.lineTo(toX(xMax), toY(xMax));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#aaaaaa";
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  for (let x = Math.ceil(xMin); x <= xMax; x++)
    ctx.fillText(x, toX(x), H - pad + 15);
  ctx.textAlign = "right";
  for (let y = Math.ceil(yMin); y <= yMax; y++)
    ctx.fillText(y, pad - 5, toY(y) + 4);
  ctx.strokeStyle = "#00d4ff";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  let started = false;
  for (let x = xMin; x <= xMax; x += 0.01) {
    const y = g(x);
    if (!isFinite(y)) {
      started = false;
      continue;
    }
    started
      ? ctx.lineTo(toX(x), toY(y))
      : (ctx.moveTo(toX(x), toY(y)), (started = true));
  }
  ctx.stroke();
  if (isFinite(root)) {
    ctx.fillStyle = "#ff6b6b";
    ctx.beginPath();
    ctx.arc(toX(root), toY(root), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`root ≈ ${root.toFixed(4)}`, toX(root) + 10, toY(root) - 8);
  }
  ctx.fillStyle = "#00d4ff";
  ctx.font = "13px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`g(x) = ${gExpr}`, pad + 5, pad - 10);
}

// ========================
// BISECTION
// ========================
function solveBisection() {
  const fx = str("fx"),
    xl0 = val("xl"),
    xu0 = val("xu"),
    err = val("error");
  if (!fx || isNaN(xl0) || isNaN(xu0) || isNaN(err))
    return alert("Invalid Inputs");
  const f = parseF(fx);
  let xl = xl0,
    xu = xu0,
    fxl = f(xl),
    fxu = f(xu);
  if (isNaN(fxl) || isNaN(fxu) || fxl * fxu >= 0)
    return alert("f(Xl) and f(Xu) must have opposite signs");
  let xr,
    oldxr = 0,
    ea = 100,
    iter = 0,
    rows = "";
  while (ea > err && iter < 100) {
    fxl = f(xl);
    fxu = f(xu);
    xr = (xl + xu) / 2;
    const fxr = f(xr);
    ea = iter === 0 ? 100 : Math.abs((xr - oldxr) / xr) * 100;
    rows += `<tr><td>${iter}</td><td>${fmt(xl)}</td><td>${fmt(fxl)}</td><td>${fmt(xu)}</td><td>${fmt(fxu)}</td><td>${fmt(xr)}</td><td>${fmt(fxr)}</td><td>${iter === 0 ? "---" : fmt(ea)}</td></tr>`;
    fxl * fxr < 0 ? ((xu = xr), (fxu = fxr)) : ((xl = xr), (fxl = fxr));
    oldxr = xr;
    iter++;
  }
  rows += rootRow(8, xr);
  setResult(rows);
  drawGraph(fx, xr, xl0, xu0);
}

// ========================
// FALSE POSITION 
// ========================
function solveFalsePosition() {
  const fx = str("fx"),
    xl0 = val("xl"),
    xu0 = val("xu"),
    err = val("error");
  if (!fx || isNaN(xl0) || isNaN(xu0) || isNaN(err))
    return alert("Invalid Inputs");
  const f = parseF(fx);
  let xl = xl0,
    xu = xu0,
    fxl = f(xl),
    fxu = f(xu);
  if (isNaN(fxl) || isNaN(fxu) || fxl * fxu >= 0)
    return alert("f(Xl) and f(Xu) must have opposite signs");
  let xr,
    oldxr = 0,
    ea = 100,
    iter = 0,
    rows = "";
  while (ea > err && iter < 100) {
    fxl = f(xl);
    fxu = f(xu);
    xr = xu - (fxu * (xl - xu)) / (fxl - fxu);
    const fxr = f(xr);
    ea = iter === 0 ? 100 : Math.abs((xr - oldxr) / xr) * 100;
    rows += `<tr><td>${iter}</td><td>${fmt(xl)}</td><td>${fmt(fxl)}</td><td>${fmt(xu)}</td><td>${fmt(fxu)}</td><td>${fmt(xr)}</td><td>${fmt(fxr)}</td><td>${iter === 0 ? "---" : fmt(ea)}</td></tr>`;
    fxl * fxr < 0 ? ((xu = xr), (fxu = fxr)) : ((xl = xr), (fxl = fxr));
    oldxr = xr;
    iter++;
  }
  rows += rootRow(8, xr);
  setResult(rows);
  drawGraph(fx, xr, xl0, xu0);
}

// ========================
// FIXED POINT
// ========================
function solveFixedPoint() {
  const gx = str("gx"),
    x0 = val("x0"),
    err = val("error");

  if (!gx || isNaN(x0) || isNaN(err)) return alert("Invalid Inputs");

  const g = parseF(gx);

  let xi = x0;
  let iter = 0;
  let rows = "";

  // FIRST ROW (x0, x1, no error)
  let xi1 = g(xi);
  if (!isFinite(xi1)) {
    alert("g(x) diverged — check function or X₀");
    return;
  }

  rows += `<tr>
    <td>${iter}</td>
    <td>${fmt(xi)}</td>
    <td>${fmt(xi1)}</td>
    <td>---</td>
  </tr>`;

  iter++;

  while (iter < 100) {
    const xi2 = g(xi1);

    if (!isFinite(xi2)) {
      alert("g(x) diverged — check function or X₀");
      return;
    }

    // error uses previous pair (xi1 and xi)
    const ea = Math.abs((xi1 - xi) / xi1) * 100;

    rows += `<tr>
      <td>${iter}</td>
      <td>${fmt(xi1)}</td>
      <td>${fmt(xi2)}</td>
      <td>${fmt(ea)}</td>
    </tr>`;

    if (ea < err) {
      xi1 = xi2;
      break;
    }

    xi = xi1;
    xi1 = xi2;
    iter++;
  }

  rows += rootRow(4, xi1);
  setResult(rows);
  drawGraphFixedPoint(gx, xi1);
}
// ========================
// NEWTON-RAPHSON
// ========================
function solveNewton() {
  const fx = str("fx"),
    err = val("error");
  let x0 = val("x0");
  if (!fx || isNaN(x0) || isNaN(err)) return alert("Invalid Inputs");
  const f = parseF(fx),
    df = parseF(math.derivative(fx, "x").toString());
  let rows = `<tr><td>0</td><td>${fmt(x0)}</td><td>${fmt(f(x0))}</td><td>${fmt(df(x0))}</td><td>---</td></tr>`;
  let iter = 0;
  while (iter < 100) {
    const f0 = f(x0),
      df0 = df(x0);
    if (!df0 || !isFinite(df0)) {
      alert("Derivative = 0 or invalid");
      return;
    }
    const x1 = x0 - f0 / df0;
    if (!isFinite(x1)) {
      alert("Divergence detected");
      return;
    }
    const ea = Math.abs((x1 - x0) / x1) * 100;
    rows += `<tr><td>${iter + 1}</td><td>${fmt(x1)}</td><td>${fmt(f(x1))}</td><td>${fmt(df(x1))}</td><td>${fmt(ea)}</td></tr>`;
    x0 = x1;
    iter++;
    if (ea < err) break;
  }
  rows += rootRow(5, x0);
  setResult(rows);
  drawGraph(fx, x0, x0 - 3, x0 + 3);
}

// ========================
// SECANT
// ========================
function solveSecant() {
  const fx = str("fx"),
    err = val("error");
  let xp = val("x0"),
    xc = val("x1");
  if (!fx || isNaN(xp) || isNaN(xc) || isNaN(err))
    return alert("Invalid Inputs");
  const f = parseF(fx);
  let rows = `<tr><td>0</td><td>${fmt(xp)}</td><td>${fmt(f(xp))}</td><td>${fmt(xc)}</td><td>${fmt(f(xc))}</td><td>---</td></tr>`;
  let iter = 0;
  while (iter < 100) {
    const fp = f(xp),
      fc = f(xc);
    if (fc === fp) {
      alert("Division by zero — f(Xi) = f(Xi-1)");
      return;
    }
    const xn = xc - (fc * (xp - xc)) / (fp - fc);
    const ea = Math.abs((xn - xc) / xn) * 100;
    iter++;
    rows += `<tr><td>${iter}</td><td>${fmt(xc)}</td><td>${fmt(fc)}</td><td>${fmt(xn)}</td><td>${fmt(f(xn))}</td><td>${fmt(ea)}</td></tr>`;
    xp = xc;
    xc = xn;
    if (ea < err) break;
  }
  rows += rootRow(6, xc);
  setResult(rows);
  drawGraph(fx, xc, xp - 1, xc + 1);
}

// ========================
// GAUSS ELIMINATION
// ========================
function solveGauss() {
  const data = readMatrix();
  if (!data) return;
  let { A, b } = data;
  let out = matrixHTML(A, b, "Initial Matrix");
  for (let p = 0; p < 2; p++) {
    let ops = "";
    for (let r = p + 1; r < 3; r++) {
      const m = A[r][p] / A[p][p];
      ops += `<p>m${r + 1}${p + 1} = ${fmt(A[r][p])} / ${fmt(A[p][p])} = ${fmt(m)}</p>`;
      for (let k = 0; k < 3; k++) A[r][k] -= m * A[p][k];
      b[r] -= m * b[p];
    }
    out +=
      `<div class="step">${ops}</div>` +
      matrixHTML(A, b, `After Step ${p + 1}`);
  }
  const x3 = b[2] / A[2][2],
    x2 = (b[1] - A[1][2] * x3) / A[1][1],
    x1 = (b[0] - A[0][1] * x2 - A[0][2] * x3) / A[0][0];
  out += `<div class="step"><h3>Back Substitution</h3>
    <p>x₃ = ${fmt(b[2])} / ${fmt(A[2][2])} = ${fmt(x3)}</p>
    <p>x₂ = (${fmt(b[1])} − ${fmt(A[1][2])}×${fmt(x3)}) / ${fmt(A[1][1])} = ${fmt(x2)}</p>
    <p>x₁ = (${fmt(b[0])} − ${fmt(A[0][1])}×${fmt(x2)} − ${fmt(A[0][2])}×${fmt(x3)}) / ${fmt(A[0][0])} = ${fmt(x1)}</p></div>`;
  out += `<div class="step final"><h2>Final Answer</h2><p>x₁=${fmt(x1)}</p><p>x₂=${fmt(x2)}</p><p>x₃=${fmt(x3)}</p></div>`;
  setResult(out);
}

// ========================
// GAUSS-JORDAN
// ========================
function solveGaussJordan() {
  const data = readMatrix();
  if (!data) return;
  let { A, b } = data;
  let out = matrixHTML(A, b, "Initial Matrix");
  const elim = (pivot, targets, label) => {
    let ops = "";
    for (const r of targets) {
      const m = A[r][pivot] / A[pivot][pivot];
      ops += `<p>R${r + 1} − ${fmt(m)}×R${pivot + 1} → R${r + 1}</p>`;
      for (let k = 0; k < 3; k++) A[r][k] -= m * A[pivot][k];
      b[r] -= m * b[pivot];
    }
    out += `<div class="step">${ops}</div>` + matrixHTML(A, b, label);
  };
  elim(0, [1, 2], "After Forward Step 1");
  elim(1, [2], "After Forward Step 2");
  elim(2, [0, 1], "After Backward Step 1");
  elim(1, [0], "After Backward Step 2");
  out += `<div class="step"><p>Normalize each row by its diagonal</p></div>`;
  for (let i = 0; i < 3; i++) {
    b[i] /= A[i][i];
    A[i][i] = 1;
  }
  out += matrixHTML(A, b, "Identity Matrix");
  out += `<div class="step final"><h2>Final Answer</h2><p>x₁=${fmt(b[0])}</p><p>x₂=${fmt(b[1])}</p><p>x₃=${fmt(b[2])}</p></div>`;
  setResult(out);
}

// ========================
// LU DECOMPOSITION
// ========================
function solveLU() {
  const data = readMatrix();
  if (!data) return;
  const { A, b } = data;
  const L = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    U = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
  [U[0][0], U[0][1], U[0][2]] = A[0];
  L[1][0] = A[1][0] / U[0][0];
  L[2][0] = A[2][0] / U[0][0];
  U[1][1] = A[1][1] - L[1][0] * U[0][1];
  U[1][2] = A[1][2] - L[1][0] * U[0][2];
  L[2][1] = (A[2][1] - L[2][0] * U[0][1]) / U[1][1];
  U[2][2] = A[2][2] - L[2][0] * U[0][2] - L[2][1] * U[1][2];
  let out =
    matrixHTML(A, b, "Initial Matrix A") +
    matrixOnlyHTML(L, "L Matrix") +
    matrixOnlyHTML(U, "U Matrix");
  const Y = [
    b[0],
    b[1] - L[1][0] * b[0],
    b[2] - L[2][0] * b[0] - L[2][1] * (b[1] - L[1][0] * b[0]),
  ];
  out += `<div class="step"><h3>Forward Sub: LY = b</h3>
    <p>y₁ = ${fmt(Y[0])}</p>
    <p>y₂ = ${fmt(b[1])} − ${fmt(L[1][0])}×${fmt(Y[0])} = ${fmt(Y[1])}</p>
    <p>y₃ = ... = ${fmt(Y[2])}</p></div>`;
  const X = [0, 0, Y[2] / U[2][2]];
  X[1] = (Y[1] - U[1][2] * X[2]) / U[1][1];
  X[0] = (Y[0] - U[0][1] * X[1] - U[0][2] * X[2]) / U[0][0];
  out += `<div class="step"><h3>Back Sub: UX = Y</h3>
    <p>x₃ = ${fmt(Y[2])} / ${fmt(U[2][2])} = ${fmt(X[2])}</p>
    <p>x₂ = (${fmt(Y[1])} − ${fmt(U[1][2])}×${fmt(X[2])}) / ${fmt(U[1][1])} = ${fmt(X[1])}</p>
    <p>x₁ = (${fmt(Y[0])} − ${fmt(U[0][1])}×${fmt(X[1])} − ${fmt(U[0][2])}×${fmt(X[2])}) / ${fmt(U[0][0])} = ${fmt(X[0])}</p></div>`;
  out += `<div class="step final"><h2>Final Answer</h2><p>x₁=${fmt(X[0])}</p><p>x₂=${fmt(X[1])}</p><p>x₃=${fmt(X[2])}</p></div>`;
  setResult(out);
}

// ========================
// CRAMER'S RULE
// ========================
function solveCramer() {
  const data = readMatrix();
  if (!data) return;
  const { A, b } = data;
  const D = det3(A);
  let out = matrixHTML(A, b, "Initial Matrix A");
  out += `<div class="step"><p>D = ${fmt(D)}</p></div>`;
  if (D === 0)
    return setResult(
      `<div class="step"><p>D = 0 → No unique solution.</p></div>`,
    );
  const subs = (col) =>
    A.map((row, i) => row.map((v, j) => (j === col ? b[i] : v)));
  const mats = [subs(0), subs(1), subs(2)],
    dets = mats.map(det3);
  mats.forEach((M, i) => {
    out += matrixHTML(M, b, `D${i + 1} (replace col ${i + 1} with b)`);
    out += `<div class="step"><p>D${i + 1} = ${fmt(dets[i])}</p></div>`;
  });
  const [x1, x2, x3] = dets.map((d) => d / D);
  out += `<div class="step"><h3>Solution</h3>
    <p>x₁ = ${fmt(dets[0])} / ${fmt(D)} = ${fmt(x1)}</p>
    <p>x₂ = ${fmt(dets[1])} / ${fmt(D)} = ${fmt(x2)}</p>
    <p>x₃ = ${fmt(dets[2])} / ${fmt(D)} = ${fmt(x3)}</p></div>`;
  out += `<div class="step final"><h2>Final Answer</h2><p>x₁=${fmt(x1)}</p><p>x₂=${fmt(x2)}</p><p>x₃=${fmt(x3)}</p></div>`;
  setResult(out);
}

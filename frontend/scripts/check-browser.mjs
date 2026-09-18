import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFile, mkdtemp, writeFile, access } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { setTimeout as delay } from "node:timers/promises";

const dist = path.resolve("dist");
const artifacts = await mkdtemp(path.join(os.tmpdir(), "medpro-ui-check-"));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp" };
const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const candidate = path.resolve(dist, "." + decodeURIComponent(url.pathname));
  if (candidate !== dist && !candidate.startsWith(dist + path.sep)) { res.writeHead(403).end(); return; }
  let file = candidate;
  try {
    if (!path.extname(file)) file = path.join(dist, "index.html");
    const content = await readFile(file);
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" }).end(content);
  } catch { res.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = "http://127.0.0.1:" + server.address().port;
const chromePath = process.env.CHROME_PATH || path.join(process.env.PROGRAMFILES || "C:/Program Files", "Google/Chrome/Application/chrome.exe");
await access(chromePath);
const profile = path.join(artifacts, "profile");
const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", "--user-data-dir=" + profile, "about:blank"], { windowsHide: true, stdio: "ignore" });
let socket;
let sequence = 0;
const pending = new Map();
const errors = [];
const submissions = [];
async function waitFor(fn, label, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try { if (await fn()) return; } catch { /* Wait for browser/route initialization. */ }
    await delay(80);
  }
  throw new Error("Timed out: " + label);
}
function send(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error("CDP timeout: " + method)); }, 12000);
    pending.set(id, { resolve: (value) => { clearTimeout(timer); resolve(value); }, reject: (error) => { clearTimeout(timer); reject(error); } });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text + ": " + response.exceptionDetails.exception?.description);
  return response.result.value;
}
async function navigate(route) {
  await send("Page.navigate", { url: origin + route });
  await waitFor(() => evaluate("document.readyState === 'complete' && !!document.querySelector('#main-content h1, #main-content h2')"), route);
  await delay(100);
}
async function click(selector) {
  assert.ok(await evaluate("!!document.querySelector(" + JSON.stringify(selector) + ")"), "Missing " + selector);
  await evaluate("document.querySelector(" + JSON.stringify(selector) + ").click()");
  await delay(50);
}
async function fill(selector, value) {
  await evaluate("(() => { const el = document.querySelector(" + JSON.stringify(selector) + "); if (!el) throw new Error('Missing field'); const prototype = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(el, " + JSON.stringify(value) + "); el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); })()");
  await delay(30);
}
async function screenshot(name) {
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(path.join(artifacts, name + ".png"), Buffer.from(shot.data, "base64"));
}
async function noOverflow() {
  assert.ok(await evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "Horizontal overflow at " + await evaluate("location.pathname"));
}
try {
  let port;
  await waitFor(async () => { port = Number((await readFile(path.join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]); return port > 0; }, "Chrome startup");
  const target = await (await fetch("http://127.0.0.1:" + port + "/json/new?" + encodeURIComponent(origin), { method: "PUT" })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      if (request) { pending.delete(message.id); if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result); }
    } else if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails);
    else if (message.method === "Network.requestWillBeSent" && !["GET", "HEAD"].includes(message.params.request.method)) submissions.push(message.params.request.url);
  });
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate("/");
  assert.equal(await evaluate("document.querySelectorAll('.service-grid .service-card').length"), 16);
  const pharmacy = await evaluate("(() => {const a=document.querySelector('a.service-card[target=\"_blank\"]');return {href:a.href,rel:a.rel};})()");
  assert.equal(pharmacy.href, "https://www.nhathuocankhang.com/");
  assert.ok(pharmacy.rel.includes("noopener"));
  assert.ok(await evaluate("!!document.querySelector('.account-avatar')"));
  await screenshot("desktop-home");
  await navigate("/dich-vu-y-te");
  await screenshot("desktop-services");
  const groups = await evaluate("Array.from(document.querySelectorAll('.catalog-groups a')).filter(a=>!a.target).map(a=>new URL(a.href).pathname)");
  assert.equal(groups.length, 15);
  for (const route of groups) {
    await navigate(route);
    assert.equal(await evaluate("document.querySelectorAll('.offering-card').length"), 4, route);
    await noOverflow();
    await click(".offering-card");
    await waitFor(() => evaluate("!!document.querySelector('.service-detail-heading')"), "detail");
    await click(".booking-summary .button");
    await waitFor(() => evaluate("!!document.querySelector('.flow-panel form')"), "booking");
    const providerValue = await evaluate("document.querySelector('select[required]').options[1].value");
    await fill("select[required]", providerValue);
    const requiredTextFields = await evaluate("Array.from(document.querySelectorAll('.flow-panel input[required], .flow-panel textarea[required]')).map((el,i)=>({index:i,type:el.type,tag:el.tagName}))");
    for (const field of requiredTextFields) {
      const selector = ".flow-panel " + (field.tag === "TEXTAREA" ? "textarea[required]" : field.type === "text" ? "input[required]:not([type])" : "input[required][type=\"" + field.type + "\"]");
      if (field.type === "checkbox") await click(selector);
      else await fill(selector, field.type === "number" ? "25" : "Demo Company / 12 Hoa Mai");
    }
    await click(".flow-panel button[type=submit]");
    await waitFor(() => evaluate("!!document.querySelector('.slot-fieldset')"), "schedule");
    const date = await evaluate("document.querySelector('.flow-panel input[type=date]').min");
    await fill(".flow-panel input[type=date]", date);
    await click(".time-grid button:not([disabled])");
    await click(".flow-panel button[type=submit]");
    await waitFor(() => evaluate("!!document.querySelector('.flow-panel input[type=tel]')"), "person");
    if (await evaluate("!!document.querySelector('.flow-panel textarea[required]')")) await fill(".flow-panel textarea[required]", "Demo consultation needs");
    await click(".flow-panel button[type=submit]");
    await waitFor(() => evaluate("!!document.querySelector('.flow-panel .service-summary')"), "review");
    await click(".flow-panel button[type=submit]");
    await waitFor(() => evaluate("!!document.querySelector('.flow-confirmation')"), "confirmation");
    if (route.includes("tu-van-kham-benh-tu-xa")) {
      await click(".demo-video-room .button");
      assert.equal(await evaluate("document.querySelectorAll('.video-controls button').length"), 3);
      await click(".video-controls .end-call");
    }
    if (route.includes("dat-lich-tiem-chung")) await screenshot("desktop-booking-result");
    console.log("PASS browser flow: " + route);
  }
  await navigate("/dich-vu-y-te/dat-lich-xet-nghiem");
  await fill('input[type="search"]', "chuyen hoa");
  assert.equal(await evaluate("document.querySelectorAll('.offering-card').length"), 1);
  await fill('input[type="search"]', "zzzzzzzzzz");
  assert.ok(await evaluate("!!document.querySelector('.empty-state')"));
  await click(".empty-state button");
  assert.equal(await evaluate("document.querySelectorAll('.offering-card').length"), 4);
  await navigate("/dich-vu-y-te/missing/chi-tiet/missing");
  assert.ok(await evaluate("document.querySelector('.empty-state').textContent.includes('Không tìm thấy')"));
  await navigate("/dich-vu-y-te/dat-lich-xet-nghiem/dat-lich/test-1");
  await fill("select[required]", "an-tam");
  await fill(".flow-panel select:not([required])", "home");
  await fill(".flow-panel textarea", "123 Demo address");
  await click(".flow-panel button[type=submit]");
  await fill(".flow-panel input[type=date]", await evaluate("document.querySelector('.flow-panel input[type=date]').min"));
  await click(".time-grid button:not([disabled])");
  await click(".flow-actions button[type=button]");
  assert.equal(await evaluate("document.querySelector('.flow-panel textarea').value"), "123 Demo address");
  await fill("select[required]", "binh-an");
  await click(".flow-panel button[type=submit]");
  assert.equal(await evaluate("document.querySelector('.flow-panel input[type=date]').value"), "");
  assert.equal(await evaluate("document.querySelectorAll('.time-grid button[aria-pressed=true]').length"), 0);
  await navigate("/dich-vu-y-te/dat-lich-xet-nghiem/dat-lich/test-1");
  assert.equal(await evaluate("document.querySelector('select[required]').value"), "");
  await navigate("/dang-ky");
  await fill('input[name="name"]', "Demo User");
  await fill('input[name="phone"]', "0901234567");
  await fill('input[name="password"]', "demo1234");
  await fill('input[name="confirmPassword"]', "different");
  await click('input[type="checkbox"]');
  await click(".auth-panel button[type=submit]");
  assert.ok(await evaluate("!!document.querySelector('[role=alert]')"));
  await fill('input[name="confirmPassword"]', "demo1234");
  await click(".auth-panel button[type=submit]");
  assert.ok(await evaluate("!!document.querySelector('.auth-panel [role=status]')"));
  await navigate("/dang-nhap");
  await fill('input[name="phone"]', "0901234567");
  await fill('input[name="password"]', "demo1234");
  await click(".password-field button");
  assert.equal(await evaluate("document.querySelector('[name=password]').type"), "text");
  await click(".auth-panel button[type=submit]");
  assert.ok(await evaluate("!!document.querySelector('.auth-panel [role=status]')"));
  await screenshot("desktop-login");
  for (const width of [768, 390, 320]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    for (const route of ["/", "/dich-vu-y-te", "/dich-vu-y-te/dat-lich-xet-nghiem", "/dang-ky", "/dich-vu-y-te/y-te-tai-nha/dat-lich/home-1"]) {
      await navigate(route);
      await noOverflow();
    }
    await screenshot("booking-width-" + width);
  }
  assert.equal(errors.length, 0, JSON.stringify(errors));
  assert.equal(submissions.length, 0, "Unexpected non-GET network requests");
  console.log("PASS: 15 complete flows, 16 cards, auth forms, search, empty/invalid routes, 4 viewport sizes, no runtime errors or submissions.");
  console.log("Screenshots: " + artifacts);
} finally {
  socket?.close();
  chrome.kill();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}

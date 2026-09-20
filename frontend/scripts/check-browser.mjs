import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, mkdtemp, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';

const dist = path.resolve('dist');
const artifacts = await mkdtemp(path.join(os.tmpdir(), 'antam-ui-check-'));
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const candidate = path.resolve(dist, '.' + decodeURIComponent(url.pathname));
  if (candidate !== dist && !candidate.startsWith(dist + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  let file = candidate;
  try {
    if (!path.extname(file)) file = path.join(dist, 'index.html');
    const content = await readFile(file);
    res
      .writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' })
      .end(content);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const chromePath =
  process.env.CHROME_PATH ||
  path.join(process.env.PROGRAMFILES || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe');
await access(chromePath);
const profile = path.join(artifacts, 'profile');
const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=0',
    '--user-data-dir=' + profile,
    'about:blank',
  ],
  { windowsHide: true, stdio: 'ignore' },
);
let socket;
let sequence = 0;
const pending = new Map();
const errors = [];
const submissions = [];
async function waitFor(fn, label, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      if (await fn()) return;
    } catch {
      /* Wait for browser/route initialization. */
    }
    await delay(80);
  }
  throw new Error('Timed out: ' + label);
}
function send(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error('CDP timeout: ' + method));
    }, 12000);
    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (response.exceptionDetails)
    throw new Error(
      response.exceptionDetails.text + ': ' + response.exceptionDetails.exception?.description,
    );
  return response.result.value;
}
async function navigate(route) {
  await send('Page.navigate', { url: origin + route });
  await waitFor(
    () =>
      evaluate("document.readyState === 'complete' && !!document.querySelector('h1, h2, .empty')"),
    route,
  );
  await delay(100);
}
async function click(selector) {
  assert.ok(
    await evaluate('!!document.querySelector(' + JSON.stringify(selector) + ')'),
    'Missing ' + selector,
  );
  await evaluate('document.querySelector(' + JSON.stringify(selector) + ').click()');
  await delay(50);
}
async function pointerClick(selector) {
  const point = await evaluate(
    '(() => { const el=document.querySelector(' +
      JSON.stringify(selector) +
      '); el.scrollIntoView({block:"center"}); const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()',
  );
  const mobile = await evaluate('innerWidth < 768');
  if (mobile) {
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    await send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ ...point, radiusX: 2, radiusY: 2, force: 1, id: 0 }],
    });
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      ...point,
      button: 'left',
      clickCount: 1,
    });
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      ...point,
      button: 'left',
      clickCount: 1,
    });
  }
  await delay(100);
}
async function fill(selector, value) {
  await evaluate(
    '(() => { const el = document.querySelector(' +
      JSON.stringify(selector) +
      "); if (!el) throw new Error('Missing field'); const prototype = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(el, " +
      JSON.stringify(value) +
      "); el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); })()",
  );
  await delay(30);
}
async function screenshot(name) {
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  await writeFile(path.join(artifacts, name + '.png'), Buffer.from(shot.data, 'base64'));
}
async function noOverflow() {
  assert.ok(
    await evaluate('document.documentElement.scrollWidth <= window.innerWidth'),
    'Horizontal overflow at ' + (await evaluate('location.pathname')),
  );
}
try {
  let port;
  await waitFor(async () => {
    port = Number(
      (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0],
    );
    return port > 0;
  }, 'Chrome startup');
  const target = await (
    await fetch('http://127.0.0.1:' + port + '/json/new?' + encodeURIComponent(origin), {
      method: 'PUT',
    })
  ).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      if (request) {
        pending.delete(message.id);
        if (message.error) request.reject(new Error(message.error.message));
        else request.resolve(message.result);
      }
    } else if (message.method === 'Runtime.exceptionThrown')
      errors.push(message.params.exceptionDetails);
    else if (
      message.method === 'Network.requestWillBeSent' &&
      !['GET', 'HEAD'].includes(message.params.request.method)
    )
      submissions.push(message.params.request.url);
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  async function field(label, value) {
    if (label === 'Cơ sở' && (await evaluate("!!document.querySelector('.branch-picker')"))) {
      await click('input[name="branchId"][value="' + value + '"]');
      return;
    }
    const index = await evaluate(
      `Array.from((document.querySelector('dialog') || document).querySelectorAll('label.field')).findIndex(el => el.querySelector('span')?.textContent === ${JSON.stringify(label)})`,
    );
    assert.ok(index >= 0, 'Missing field ' + label);
    await evaluate(
      `(document.querySelector('dialog') || document).querySelectorAll('label.field')[${index}].setAttribute('data-test-field','active')`,
    );
    await fill(
      '[data-test-field="active"] input, [data-test-field="active"] select, [data-test-field="active"] textarea',
      value,
    );
    await evaluate(
      `document.querySelector('[data-test-field="active"]')?.removeAttribute('data-test-field')`,
    );
  }
  async function textButton(text, root = 'document') {
    const found = await evaluate(
      `(() => { const b = Array.from(${root}.querySelectorAll('button, a')).find(b => b.textContent.trim() === ${JSON.stringify(text)}); if (!b) return false; b.click(); return true; })()`,
    );
    assert.ok(found, 'Missing button ' + text);
    await delay(100);
  }
  async function login(role, id) {
    await navigate('/dang-nhap');
    await field('Vai trò', role);
    await field('Tài khoản demo', id);
    await click('form button[type=submit]');
    await waitFor(() => evaluate(`location.pathname !== '/dang-nhap'`), 'login ' + role);
  }
  async function rowAction(id, text) {
    const row = `Array.from(document.querySelectorAll('[data-appointment-id]')).find(r => r.textContent.includes(${JSON.stringify(id)}))`;
    await textButton(text, row);
  }
  const stored = (expression) =>
    evaluate(
      `(() => { const db = JSON.parse(localStorage.getItem('antam-data-v1')); return ${expression}; })()`,
    );
  await navigate('/');
  assert.equal(await evaluate("document.querySelectorAll('.branch-card').length"), 4);
  await waitFor(
    () => evaluate("document.querySelector('.hero-photo').naturalWidth > 0"),
    'local hero image',
  );
  await screenshot('desktop-home');
  await click('.branch-card .card-image-link');
  assert.equal(await evaluate('location.pathname'), '/co-so/trung-tam');
  await click('.booking-promo .button');
  assert.equal(
    await evaluate("document.querySelector('input[name=branchId]:checked').value"),
    'b1',
  );
  await navigate('/bac-si/bac-si-1');
  assert.ok(await evaluate("!!document.querySelector('.rating strong')"));
  assert.ok(await evaluate("document.body.textContent.includes('năm làm việc')"));
  assert.ok(await evaluate('!!document.querySelector(\'a[href^="tel:"]\')'));
  await navigate('/');
  await fill('#care-search', 'tim mach');
  assert.ok(await evaluate("document.querySelectorAll('.search-results a').length>0"));
  await navigate('/co-so');
  await field('Tìm kiếm', 'thu duc');
  assert.equal(await evaluate("document.querySelectorAll('.branch-card').length"), 1);
  await field('Tìm kiếm', 'khongtontai');
  assert.ok(await evaluate("!!document.querySelector('.empty')"));
  await navigate('/dat-lich?packageId=pkg1');
  await field('Cơ sở', 'b1');
  assert.equal(
    await evaluate(
      "Array.from(document.querySelectorAll('select')).find(s=>s.value==='pkg1')?.value",
    ),
    'pkg1',
  );
  await field('Bác sĩ', 'dr1');
  await field('Cơ sở', 'b2');
  assert.ok(
    await evaluate(
      "!Array.from(document.querySelectorAll('select')).some(s=>s.value==='pkg1'||s.value==='dr1')",
    ),
  );
  await navigate('/dat-lich?doctorId=dr1');
  assert.equal(
    await evaluate("document.querySelector('input[name=branchId]:checked').value"),
    'b1',
  );
  await click('form button[type=submit]');
  const date = await evaluate(
    "(() => {const d=new Date();d.setDate(d.getDate()+7);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')})()",
  );
  await field('Ngày khám', date);
  await click('.time-grid button:not([disabled])');
  await click('form button[type=submit]');
  await field('Họ tên', 'Nguyễn Hoàng An');
  await field('Số điện thoại', '0920000000');
  await click('form button[type=submit]');
  await click('a[href^="/dang-nhap?next="]');
  await field('Vai trò', 'patient');
  await field('Tài khoản demo', 'p1');
  await click('form button[type=submit]');
  await waitFor(() => evaluate("location.pathname === '/dat-lich'"), 'return with booking draft');
  assert.equal(
    await evaluate("document.querySelector('input[name=branchId]:checked').value"),
    'b1',
  );
  await click('form button[type=submit]');
  assert.equal(await evaluate("document.querySelector('input[type=date]').value"), date);
  await click('form button[type=submit]');
  await click('form button[type=submit]');
  await click('form button[type=submit]');
  await waitFor(() => evaluate("!!document.querySelector('.confirmation')"), 'booking success');
  const appointment = await stored('db.appointments.at(-1).id');
  assert.equal(await stored('db.appointments.at(-1).patientId'), 'p1');
  await screenshot('booking-confirmation');
  await navigate('/lich-hen');
  assert.ok(await evaluate(`document.body.textContent.includes(${JSON.stringify(appointment)})`));
  await navigate('/tai-khoan');
  await field('Địa chỉ', 'Địa chỉ thử nghiệm');
  await textButton('Lưu thay đổi');
  await navigate('/tai-khoan');
  assert.equal(
    await evaluate("document.querySelector('[name=address]').value"),
    'Địa chỉ thử nghiệm',
  );
  await navigate('/quan-tri');
  assert.ok(await evaluate("document.body.textContent.includes('không có quyền')"));

  await login('doctor', 'u-dr1');
  await textButton('Tất cả lịch');
  await field('Tìm bệnh nhân / mã lịch', appointment);
  await rowAction(appointment, 'Từ chối');
  await click('dialog form .button');
  assert.ok(await evaluate("!document.querySelector('dialog textarea').checkValidity()"));
  await field('Lý do', 'Không phù hợp lịch làm việc');
  await click('dialog form .button');
  assert.equal(
    await stored(`db.appointments.find(a=>a.id===${JSON.stringify(appointment)}).status`),
    'rejected',
  );
  await field('Tìm bệnh nhân / mã lịch', 'AT-DEMO-EXAM');
  await rowAction('AT-DEMO-EXAM', 'Ghi kết quả');
  await field('Triệu chứng', 'Khám định kỳ');
  await click('.back-link');
  assert.ok(await evaluate("document.querySelector('dialog').textContent.includes('chưa lưu')"));
  await textButton('Tiếp tục chỉnh sửa');
  assert.ok(await evaluate("location.pathname.includes('/kham/')"));
  await textButton('Lưu nháp');
  assert.ok(await stored("db.records.some(r=>r.appointmentId==='AT-DEMO-EXAM'&&!r.finalized)"));
  await screenshot('doctor-examination');
  await field('Chẩn đoán', 'Kết quả demo');
  await field('Ghi chú / hướng dẫn', 'Theo dõi sức khỏe');
  await textButton('Hoàn tất buổi khám');
  assert.equal(await stored("db.appointments.find(a=>a.id==='AT-DEMO-EXAM').status"), 'completed');
  await navigate('/bac-si-lam-viec/ho-so');
  await screenshot('doctor-records');
  await navigate('/bac-si-lam-viec/ho-so?patientId=p2');
  assert.ok(!(await evaluate('document.body.textContent')).includes('An Tâm · Thủ Đức'));

  await login('branchAdmin', 'admin1');
  await navigate('/quan-tri/lich-hen');
  await field('Tìm bệnh nhân / mã lịch', 'AT-DEMO-EXAM');
  await rowAction('AT-DEMO-EXAM', 'Thu 200.000 ₫');
  await click('dialog form .button');
  assert.equal(await stored("db.payments.filter(p=>p.appointmentId==='AT-DEMO-EXAM').length"), 1);
  await navigate('/quan-tri/admin');
  assert.ok(await evaluate("document.body.textContent.includes('không có quyền')"));
  await navigate('/quan-tri/co-so');
  assert.equal(await evaluate('document.querySelectorAll("tbody tr").length'), 1);
  await navigate('/quan-tri/kho-thuoc');
  assert.ok(await evaluate("document.body.textContent.includes('Không tìm thấy')"));
  await login('superAdmin', 'root');
  await navigate('/quan-tri');
  for (const label of ['Lịch hẹn & bệnh nhân', 'Bác sĩ & khoa', 'Tài chính'])
    await textButton(label);
  assert.ok(
    !(await evaluate(
      "Array.from(document.querySelectorAll('button,a')).some(e => /CSV|Restock|Kho thuốc/.test(e.textContent))",
    )),
  );
  await screenshot('desktop-dashboard');
  await navigate('/quan-tri/khoa-phong');
  await textButton('+ Thêm mới');
  await field('Tên', 'Khoa kiểm thử');
  await field('Chuyên khoa', 'sp1');
  await textButton('Lưu dữ liệu');
  assert.ok(await stored("db.departments.some(d=>d.name==='Khoa kiểm thử')"));

  // A second real tab writes browser storage; the first tab must receive the storage event.
  await navigate('/co-so/trung-tam');
  const second = await (
    await fetch('http://127.0.0.1:' + port + '/json/new?' + encodeURIComponent(origin), {
      method: 'PUT',
    })
  ).json();
  const secondSocket = new WebSocket(second.webSocketDebuggerUrl);
  await new Promise((resolve) => secondSocket.addEventListener('open', resolve, { once: true }));
  await delay(500);
  secondSocket.send(
    JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        expression:
          "const db=JSON.parse(localStorage.getItem('antam-data-v1'));db.branches[0].hours='Đồng bộ tab';localStorage.setItem('antam-data-v1',JSON.stringify(db));",
      },
    }),
  );
  await waitFor(
    () => evaluate("document.body.textContent.includes('Đồng bộ tab')"),
    'live storage event',
  );
  assert.ok(await evaluate("document.body.textContent.includes('Đồng bộ tab')"));
  secondSocket.close();
  await fetch('http://127.0.0.1:' + port + '/json/close/' + second.id);

  for (const width of [1440, 1024, 768, 390, 360]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    for (const route of [
      '/',
      '/co-so',
      '/bac-si',
      '/dat-lich',
      '/dang-nhap',
      '/quan-tri',
      '/quan-tri/co-so',
      '/quan-tri/lich-hen',
      '/co-so/trung-tam',
      '/bac-si/bac-si-1',
    ]) {
      await navigate(route);
      await noOverflow();
    }
    await navigate('/');
    await screenshot('home-' + width);
    await navigate('/quan-tri');
    await screenshot('dashboard-' + width);
    await navigate('/dat-lich?branchId=b1');
    await pointerClick('.branch-option:nth-child(2) img');
    assert.equal(
      await evaluate("document.querySelector('input[name=branchId]:checked').value"),
      'b2',
    );
    await noOverflow();
    await screenshot('booking-picker-' + width);
    await evaluate("document.querySelector('input[name=branchId][value=b1]').focus()");
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'ArrowRight',
      code: 'ArrowRight',
      windowsVirtualKeyCode: 39,
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'ArrowRight',
      code: 'ArrowRight',
      windowsVirtualKeyCode: 39,
    });
    assert.equal(
      await evaluate("document.querySelector('input[name=branchId]:checked').value"),
      'b2',
    );
    await navigate('/quan-tri');
    if (width === 360) {
      await click('.workspace-top .mobile-toggle');
      assert.ok(await evaluate("document.querySelector('.sidebar').classList.contains('open')"));
      await click('.sidebar-backdrop');
    }
  }
  await login('superAdmin', 'root');
  await navigate('/quan-tri/he-thong');
  await textButton('Khôi phục dữ liệu');
  await textButton('Xác nhận khôi phục');
  // Real patient/doctor pages at every viewport, including record details and editor.
  for (const width of [1440, 1024, 768, 390, 360]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    await login('patient', 'p1');
    for (const route of ['/lich-hen', '/ho-so-kham', '/ho-so-kham/rec-AT-1000']) {
      await navigate(route);
      await noOverflow();
      await screenshot('patient-' + width + '-' + route.split('/').at(-1));
      if (width < 768 && route === '/lich-hen') {
        assert.equal(
          await evaluate(
            "getComputedStyle(document.querySelector('.collapsible-filters')).display",
          ),
          'none',
        );
        await pointerClick('.filter-toggle');
        assert.equal(
          await evaluate("document.querySelector('.filter-toggle').getAttribute('aria-expanded')"),
          'true',
        );
        await field('Tìm lịch khám', 'AT-DEMO-PENDING');
        assert.equal(await evaluate("document.querySelectorAll('.appointment-card').length"), 1);
      }
    }
    await navigate('/ho-so-kham/rec-AT-1003');
    assert.ok(await evaluate("document.body.textContent.includes('không có quyền')"));
    await login('doctor', 'u-dr1');
    for (const route of [
      '/bac-si-lam-viec',
      '/bac-si-lam-viec/ho-so',
      '/bac-si-lam-viec/ho-so/rec-AT-1000',
      '/bac-si-lam-viec/kham/AT-DEMO-EXAM',
    ]) {
      await navigate(route);
      await noOverflow();
      await screenshot('doctor-' + width + '-' + route.split('/').at(-1));
    }
  }
  // Migrate a persisted v1 snapshot without replacing its clinical data.
  await evaluate(
    "(() => { const d=JSON.parse(localStorage.getItem('antam-data-v1')); d.version=1; d.medicines=[]; d.lots=[]; d.transactions=[]; d.restocks=[]; d.users.find(u=>u.id==='p1').address='Migration kept'; localStorage.setItem('antam-data-v1',JSON.stringify(d)); })()",
  );
  await navigate('/');
  assert.equal(await stored('db.version'), 2);
  assert.equal(await stored("db.users.find(u=>u.id==='p1').address"), 'Migration kept');
  assert.ok(await stored("!('medicines' in db) && !('restocks' in db)"));
  await navigate('/dat-lich?doctorId=missing');
  assert.ok(await evaluate("!!document.querySelector('.alert.error')"));
  await login('superAdmin', 'root');
  await navigate('/removed-service');
  assert.ok(await evaluate("document.body.textContent.includes('Không tìm thấy')"));
  await navigate('/quan-tri/he-thong');
  await textButton('Khôi phục dữ liệu');
  await textButton('Xác nhận khôi phục');
  assert.ok(!(await stored("db.departments.some(d=>d.name==='Khoa kiểm thử')")));
  await navigate('/dang-nhap');
  await textButton('Tạo hồ sơ bệnh nhân');
  await field('Họ và tên', 'Bệnh nhân đăng ký mới');
  await field('Số điện thoại', '0991234567');
  await click('form button[type=submit]');
  assert.equal(await evaluate('location.pathname'), '/lich-hen');
  assert.ok(await stored("db.users.some(u=>u.phone==='0991234567'&&u.role==='patient')"));
  await evaluate("localStorage.setItem('antam-data-v1', '{broken')");
  await navigate('/');
  assert.ok(await evaluate("document.body.textContent.includes('Không đọc được dữ liệu')"));
  await login('superAdmin', 'root');
  await navigate('/quan-tri/he-thong');
  await textButton('Khôi phục dữ liệu');
  await textButton('Xác nhận khôi phục');
  assert.equal(await stored('db.version'), 2);
  assert.equal(errors.length, 0, JSON.stringify(errors));
  assert.equal(submissions.length, 0, 'Unexpected non-GET network requests');
  console.log(
    'PASS: 4 roles, booking/login persistence, clinical records, payment, branch scope, reports, migration, storage, reset, registration, routes and 5 viewport sizes.',
  );
  console.log('Screenshots: ' + artifacts);
} catch (error) {
  try {
    await screenshot('failure');
  } catch {
    /* Preserve the original failure. */
  }
  console.error('Artifacts:', artifacts);
  throw error;
} finally {
  socket?.close();
  chrome.kill();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}

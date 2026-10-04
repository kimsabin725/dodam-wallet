// dist-single/ 의 HTML·CSS·JS를 하나의 파일로 합친다.
// 결과물은 서버 없이 더블클릭으로 열린다.
import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'dist-single';
const OUT = join(DIR, 'dodam-wallet.html');

const html = readFileSync(join(DIR, 'index.html'), 'utf8');
const js = readFileSync(join(DIR, 'app.js'), 'utf8');
const css = existsSync(join(DIR, 'app.css')) ? readFileSync(join(DIR, 'app.css'), 'utf8') : '';

// HTML 파서는 <script> 안에서 세 시퀀스에 반응한다. 셋 다 막아야 한다.
//   <!--    → script data escaped 상태로 진입
//   <script → (escaped 상태에서) double escaped 상태로 진입 — 이 상태에서는 </script> 가 태그를 닫지 못한다
//   </script → 태그 조기 종료
// React 번들에는 Suspense 마커 "<!--$-->" 와 "<script" 문자열이 모두 들어 있어서
// </script 하나만 막으면 진짜 닫는 태그가 먹히고 뒤의 <body>·#root 가 통째로 사라진다(= 빈 화면).
// JS 문자열에서 \! \s 는 백슬래시가 사라지므로 값은 그대로다.
const safeJs = js
  .replaceAll('<!--', '<\\!--')
  .replaceAll('</script', '<\\/script')
  .replaceAll('<script', '<\\script');

// 치환값은 반드시 함수로 넘긴다.
// 문자열로 넘기면 번들 안의 `$&` `$1` 같은 시퀀스가 치환 패턴으로 해석되어
// 방금 지운 <script> 태그가 되살아난다 (실제로 겪은 버그).
// 스크립트는 반드시 </body> 직전에 둔다.
// vite는 <head>에 script 태그를 넣는데, 인라인 스크립트에는 defer가 먹지 않는다.
// head에서 즉시 실행되면 <body>의 #root가 아직 없어서 createRoot가 죽는다
// (React error #299: Target container is not a DOM element) → 빈 화면.
let out = html
  .replace(/<script[^>]*src="[^"]*app\.js"[^>]*><\/script>/, '')
  .replace(/<link[^>]*href="[^"]*app\.css"[^>]*>/, () => `<style>\n${css}\n</style>`)
  .replace('</body>', () => `<script>\n${safeJs}\n</script>\n</body>`);

// 남은 외부 참조가 있으면 더블클릭 실행이 깨진다 — 조용히 넘어가지 않는다
const leftovers = [...out.matchAll(/(?:src|href)="(?!data:|#)([^"]+)"/g)].map((m) => m[1]);
if (leftovers.length) {
  console.error('❌ 인라인되지 않은 외부 참조가 남았습니다:', leftovers);
  process.exit(1);
}

// 인라인된 스크립트 본문에 파서를 깨우는 시퀀스가 남아 있으면 빈 화면이 된다
const body = out.slice(out.indexOf('<script>') + 8, out.indexOf('</script>'));
for (const bad of ['<!--', '</script', '<script']) {
  if (body.includes(bad)) {
    console.error(`❌ 인라인 스크립트에 이스케이프되지 않은 ${bad} 가 남았습니다 — 열면 빈 화면이 됩니다`);
    process.exit(1);
  }
}
// #root 가 스크립트보다 먼저 나와야 한다 — 아니면 createRoot 가 null 을 받는다
const rootAt = out.search(/<div[^>]*id="root"/);
if (rootAt < 0) {
  console.error('❌ #root 가 사라졌습니다 — 파서가 태그를 삼켰습니다');
  process.exit(1);
}
if (rootAt > out.indexOf('<script>')) {
  console.error('❌ 스크립트가 #root 보다 먼저 실행됩니다 — 열면 빈 화면이 됩니다 (React #299)');
  process.exit(1);
}

writeFileSync(OUT, out);
for (const f of ['index.html', 'app.js', 'app.css']) {
  try { rmSync(join(DIR, f)); } catch { /* 없으면 그만 */ }
}

const kb = (Buffer.byteLength(out) / 1024).toFixed(0);
console.log(`✅ ${OUT}  (${kb} KB · 외부 의존 0 · 더블클릭으로 실행)`);

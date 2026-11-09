const langBtns = document.querySelectorAll('[data-set-lang]');
for (const btn of langBtns) {
  btn.addEventListener('click', () => {
    const mode = btn.getAttribute('data-set-lang');
    document.body.setAttribute('data-guide-lang', mode);
    for (const b of langBtns) {
      const active = b === btn;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', active);
    }
  });
}

for (const btn of document.querySelectorAll('.guide-copy-btn')) {
  btn.addEventListener('click', async () => {
    const code = btn.closest('.guide-code-block')?.querySelector('code')?.textContent ?? '';
    const original = btn.textContent;
    try {
      await navigator.clipboard.writeText(code);
      btn.textContent = '已複製 ✓ / Copied';
    } catch {
      btn.textContent = '複製失敗';
    }
    setTimeout(() => { btn.textContent = original; }, 1400);
  });
}

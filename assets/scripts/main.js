/* ---------- Nav scroll state ---------- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ---------- Mobile menu ---------- */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
  document.body.style.overflow = burger.classList.contains('open') ? 'hidden' : '';
});
mobileMenu.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    burger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  })
);

/* ---------- Scroll reveal ---------- */
const reveals = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
reveals.forEach(el => revealObs.observe(el));

/* ---------- Smooth scroll ---------- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ---------- Code block copy button ---------- */
document.querySelectorAll('.code-lang').forEach(el => {
  el.addEventListener('click', () => {
    const codeBlock = el.closest('.code-block');
    const code = codeBlock.querySelector('pre code');
    if (!code) return;
    const text = code.textContent || code.innerText;
    navigator.clipboard.writeText(text).then(() => {
      const original = el.textContent;
      el.textContent = '已复制';
      el.classList.add('copied');
      setTimeout(() => {
        el.textContent = original;
        el.classList.remove('copied');
      }, 800);
    }).catch(() => {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      const original = el.textContent;
      el.textContent = '已复制';
      el.classList.add('copied');
      setTimeout(() => { el.textContent = original; el.classList.remove('copied'); }, 800);
    });
  });
});

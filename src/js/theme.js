// Day work / night work — one palette read forwards or in reverse.

const KEY = 'oa-theme';

export function initTheme() {
  const btn = document.getElementById('theme-toggle');
  const label = btn.querySelector('.theme-toggle__label');

  const apply = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    label.textContent = theme === 'dark' ? 'NIGHT WORK' : 'DAY WORK';
    btn.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Switch to day mode' : 'Switch to night mode'
    );
    window.dispatchEvent(new CustomEvent('oa:themechange', { detail: { theme } }));
  };

  apply(document.documentElement.getAttribute('data-theme') || 'dark');

  const led = btn.querySelector('.led');
  let smoothTimer;

  btn.addEventListener('click', () => {
    const next =
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, next); } catch (e) { /* private mode */ }

    // Blink the LED and let every color ease between the two palette readings.
    document.documentElement.classList.add('theme-smooth');
    led.classList.remove('blink');
    void led.getBoundingClientRect(); // restart the flicker animation
    led.classList.add('blink');
    clearTimeout(smoothTimer);
    smoothTimer = setTimeout(() => {
      document.documentElement.classList.remove('theme-smooth');
      led.classList.remove('blink');
    }, 900);

    apply(next);
  });
}

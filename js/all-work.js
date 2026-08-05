(function () {
  const buttons = Array.from(document.querySelectorAll('[data-filter]'));
  const cards = Array.from(document.querySelectorAll('.project-card'));
  const resultCount = document.querySelector('[data-result-count]');

  function applyFilter(filter) {
    let visible = 0;

    cards.forEach(function (card) {
      const categories = (card.dataset.category || '').split(' ');
      const matches = filter === 'all' || categories.includes(filter);
      card.hidden = !matches;
      if (matches) visible += 1;
    });

    buttons.forEach(function (button) {
      const active = button.dataset.filter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    if (resultCount) resultCount.textContent = String(visible);
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      applyFilter(button.dataset.filter);
    });
  });
})();

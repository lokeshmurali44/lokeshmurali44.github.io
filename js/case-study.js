(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = [...document.querySelectorAll('[data-reveal]')];

  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const progressBar = document.querySelector('.reading-progress span');
  const navLinks = [...document.querySelectorAll('.case-nav a')];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  let frameRequested = false;

  const updateScrollUI = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    if (progressBar) progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;

    const activationLine = window.scrollY + window.innerHeight * 0.34;
    let activeSection = sections[0];
    sections.forEach((section) => {
      if (section.offsetTop <= activationLine) activeSection = section;
    });

    navLinks.forEach((link) => {
      const active = activeSection && link.hash === `#${activeSection.id}`;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });

    frameRequested = false;
  };

  const requestScrollUpdate = () => {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(updateScrollUI);
  };

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);
  updateScrollUI();

  const lightbox = document.querySelector('.lightbox');
  const lightboxImage = lightbox?.querySelector('img');
  const lightboxCaption = lightbox?.querySelector('figcaption');
  const closeButton = lightbox?.querySelector('.lightbox__close');
  let activeTrigger = null;

  document.querySelectorAll('[data-lightbox]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      if (!lightbox || !lightboxImage || !lightboxCaption) return;
      const sourceImage = trigger.querySelector('img');
      activeTrigger = trigger;
      lightboxImage.src = trigger.dataset.lightbox;
      lightboxImage.alt = sourceImage?.alt || 'Expanded Normax Capital interface';
      lightboxCaption.textContent = trigger.dataset.caption || '';
      lightbox.showModal();
      closeButton?.focus();
    });
  });

  closeButton?.addEventListener('click', () => lightbox.close());
  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox?.addEventListener('close', () => {
    lightboxImage?.removeAttribute('src');
    activeTrigger?.focus();
  });
})();

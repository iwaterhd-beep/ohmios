/**
 * OHMIOS ENERGÍA — Projects Module
 * Portfolio filters and modal
 */

import { setMediaContainer } from './media-utils.js';

export function initProjects() {
  initFilters();
  initModal();
}

function initFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('[data-category]');

  if (filterButtons.length === 0) return;

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      filterButtons.forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');

      projectCards.forEach((card) => {
        const category = card.dataset.category;
        const show = filter === 'all' || category === filter;

        if (show) {
          card.classList.remove('is-hidden');
          card.style.display = '';

          if (typeof gsap !== 'undefined') {
            gsap.fromTo(card,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
            );
          }
        } else if (typeof gsap !== 'undefined') {
          gsap.to(card, {
            opacity: 0,
            y: -10,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
              card.classList.add('is-hidden');
              card.style.display = 'none';
            },
          });
        } else {
          card.classList.add('is-hidden');
          card.style.display = 'none';
        }
      });
    });
  });
}

function initModal() {
  const modal = document.getElementById('projectModal');
  const projectItems = document.querySelectorAll('.project-item[data-project-title]');

  if (!modal || projectItems.length === 0) return;

  const modalMedia = document.getElementById('modalMedia');
  const modalTitle = document.getElementById('modalTitle');
  const modalCategory = document.getElementById('modalCategory');
  const modalStatus = document.getElementById('modalStatus');
  const modalLocation = document.getElementById('modalLocation');
  const modalDesc = document.getElementById('modalDesc');
  const modalClient = document.getElementById('modalClient');
  const modalYear = document.getElementById('modalYear');
  const modalArea = document.getElementById('modalArea');

  function openModal(item) {
    modalTitle.textContent = item.dataset.projectTitle;
    modalCategory.textContent = item.dataset.projectCategory;
    modalLocation.textContent = item.dataset.projectLocation;
    modalDesc.textContent = item.dataset.projectDesc;
    modalClient.textContent = item.dataset.projectClient;
    modalYear.textContent = item.dataset.projectYear;
    modalArea.textContent = item.dataset.projectArea;
    if (modalMedia) {
      setMediaContainer(modalMedia, item.dataset.projectImage, item.dataset.projectTitle);
    }

    const status = item.dataset.projectStatus;
    modalStatus.textContent = status;
    modalStatus.className = 'project-item__status';
    modalStatus.classList.add(
      status === 'En curso' ? 'project-item__status--progress' : 'project-item__status--done'
    );

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  projectItems.forEach((item) => {
    item.addEventListener('click', () => openModal(item));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(item);
      }
    });
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
  });

  modal.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
}

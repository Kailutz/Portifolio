const defaults = {
  intro: 'Aqui registro os projetos, aprendizados e desafios da minha trajetória na faculdade.',
  github: 'https://github.com/',
  aboutTitle: 'Um estudante curioso,\nsempre em movimento.',
  aboutText: 'Este espaço é meu diário de construção. Cada projeto representa uma nova habilidade, uma ideia explorada ou um problema que aprendi a resolver.',
  email: 'seuemail@exemplo.com',
  projects: [
    { title: 'Calculadora Python', description: 'Uma calculadora de terminal para colocar em prática condicionais, funções e tratamento de entradas.', tags: ['Python', 'Lógica'], link: '#', color: '#9e78f7' },
    { title: 'Lista de tarefas', description: 'Organização de tarefas com uma interface leve e foco em uma boa experiência de uso.', tags: ['HTML', 'CSS', 'JavaScript'], link: '#', color: '#d9f34b' },
    { title: 'Em breve', description: 'O próximo capítulo da minha jornada na programação está sendo construído agora.', tags: ['Em aprendizado'], link: '#', color: '#c05de5' }
  ]
};

let data = structuredClone(defaults);
let authenticated = false;
const $ = (selector) => document.querySelector(selector);

// Fecha as janelas pelo botão “X”. Como os botões ficam dentro de formulários,
// impedimos o envio antes de fechar o dialog correspondente.
document.querySelectorAll('.dialog .close').forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault();
    button.closest('dialog')?.close();
  });
});

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
}

// Converte o formato do banco (linhas separadas: about_title, about_text...)
// para o formato que o resto do código já usa (aboutTitle, aboutText...).
function fromRow(row) {
  return {
    intro: row.intro,
    github: row.github,
    aboutTitle: row.about_title,
    aboutText: row.about_text,
    email: row.email,
    projects: row.projects || []
  };
}

async function loadData() {
  const { data: rows, error } = await supabaseClient.from('portfolio').select('*').eq('id', 1).single();
  if (error || !rows) { console.error('Não foi possível carregar os dados do Supabase, usando exemplo padrão.', error); data = structuredClone(defaults); return; }
  data = fromRow(rows);
}

async function saveData() {
  const { error } = await supabaseClient.from('portfolio').update({
    intro: data.intro,
    github: data.github,
    about_title: data.aboutTitle,
    about_text: data.aboutText,
    email: data.email,
    projects: data.projects
  }).eq('id', 1);
  if (error) { alert('Não foi possível salvar. Verifique se você está logado.'); console.error(error); return false; }
  return true;
}

// Anima um número subindo de 0 até o valor final (contador nas estatísticas).
function animateNumber(el, target) {
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = target; return; }
  const start = performance.now();
  const duration = 900;
  function tick(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  }
  requestAnimationFrame(tick);
}

function render() {
  $('#intro').textContent = data.intro;
  $('#aboutTitle').innerHTML = escapeHTML(data.aboutTitle).replace(/\n/g, '<br>');
  $('#aboutText').textContent = data.aboutText;
  $('#githubHero').href = data.github || 'https://github.com/';
  $('#emailLink').href = `mailto:${data.email}`;
  $('#emailLink').textContent = data.email === defaults.email ? 'Vamos conversar ↗︎' : `${data.email} ↗︎`;
  const technologies = new Set(data.projects.flatMap(project => project.tags));
  animateNumber($('#projectCount'), data.projects.length);
  animateNumber($('#techCount'), technologies.size);
  $('#projectLabel').textContent = `${String(data.projects.length).padStart(2, '0')} projetos`;
  $('#projectGrid').innerHTML = data.projects.map((project, index) => {
    const link = project.link && project.link !== '#' ? project.link : '#projetos';
    return `<a class="project-card" href="${escapeHTML(link)}" ${link !== '#projetos' ? 'target="_blank" rel="noreferrer"' : ''} style="background:${escapeHTML(project.color)}"><div class="card-top"><span class="number">${String(index + 1).padStart(2, '0')} / PROJETO</span><span class="arrow">↗︎</span></div><div><h3>${escapeHTML(project.title)}</h3><p>${escapeHTML(project.description)}</p><div class="tags">${project.tags.map(tag => `<span>${escapeHTML(tag)}</span>`).join('')}</div></div></a>`;
  }).join('');
  setupKineticTitles();
  setupScrollAnimations();
}

function addProjectEditor(project = { title: '', description: '', tags: [], link: '', color: '#c8ed58' }) {
  const card = $('#projectTemplate').content.firstElementChild.cloneNode(true);
  for (const field of card.querySelectorAll('[data-field]')) field.value = field.dataset.field === 'tags' ? project.tags.join(', ') : project[field.dataset.field] || '';
  card.querySelector('.remove-project').addEventListener('click', () => card.remove());
  $('#projectEditor').append(card);
}

function openAdmin() {
  const form = $('#settingsForm');
  ['intro','github','aboutTitle','aboutText','email'].forEach(key => form.elements[key].value = data[key]);
  $('#projectEditor').innerHTML = '';
  data.projects.forEach(addProjectEditor);
  $('#adminDialog').showModal();
}

$('#adminButton').addEventListener('click', async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  authenticated = !!session;
  authenticated ? openAdmin() : $('#loginDialog').showModal();
});

$('#loginForm').addEventListener('submit', async event => {
  event.preventDefault();
  const email = $('#emailInput').value.trim();
  const password = $('#passwordInput').value;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) { $('#loginError').textContent = 'Email ou senha incorretos.'; return; }
  authenticated = true;
  $('#emailInput').value = '';
  $('#passwordInput').value = '';
  $('#loginError').textContent = '';
  $('#loginDialog').close();
  openAdmin();
});

$('#addProject').addEventListener('click', () => addProjectEditor());

$('#settingsForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const newData = {
    intro: form.elements.intro.value.trim(), github: form.elements.github.value.trim(), aboutTitle: form.elements.aboutTitle.value.trim(), aboutText: form.elements.aboutText.value.trim(), email: form.elements.email.value.trim(),
    projects: [...$('#projectEditor').querySelectorAll('.project-editor-card')].map(card => ({
      title: card.querySelector('[data-field="title"]').value.trim(), description: card.querySelector('[data-field="description"]').value.trim(), tags: card.querySelector('[data-field="tags"]').value.split(',').map(tag => tag.trim()).filter(Boolean), link: card.querySelector('[data-field="link"]').value.trim(), color: card.querySelector('[data-field="color"]').value
    })).filter(project => project.title && project.description)
  };
  data = newData;
  const saveButton = form.querySelector('.save-row .button-primary');
  saveButton.textContent = 'Salvando...';
  saveButton.disabled = true;
  const ok = await saveData();
  saveButton.textContent = 'Salvar alterações';
  saveButton.disabled = false;
  if (!ok) return;
  render();
  $('#adminDialog').close();
});

$('#logoutButton').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  authenticated = false;
  $('#adminDialog').close();
});

$('#resetButton').addEventListener('click', async () => {
  if (!confirm('Restaurar o conteúdo de exemplo? Isso substitui o que está publicado para todo mundo.')) return;
  data = structuredClone(defaults);
  await saveData();
  render();
  const form = $('#settingsForm');
  ['intro','github','aboutTitle','aboutText','email'].forEach(key => form.elements[key].value = data[key]);
  $('#projectEditor').innerHTML = ''; data.projects.forEach(addProjectEditor);
});

let scrollObserver;
let titleObserver;

function setupKineticTitles() {
  const titles = [...document.querySelectorAll('.section-heading h2, .about h2, .lab-heading h2')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  titles.forEach(title => {
    if (!title.querySelector('.title-line')) {
      const lines = title.innerHTML.split(/<br\s*\/?\s*>/i);
      title.innerHTML = lines.map(line => `<span class="title-line"><span>${line}</span></span>`).join('');
      title.classList.add('kinetic-title');
    }

    if (reducedMotion || !('IntersectionObserver' in window)) {
      title.classList.add('title-visible');
      return;
    }

    if (!titleObserver) {
      titleObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('title-visible');
          titleObserver.unobserve(entry.target);
        });
      }, { threshold: .28, rootMargin: '0px 0px -8%' });
    }

    titleObserver.observe(title);
  });
}

function setupScrollAnimations() {
  // O rodapé fica sempre visível, sem animação — como ele é o último elemento
  // da página, o efeito de revelar "perto do centro" podia nunca disparar.
  const targets = [...document.querySelectorAll('.section-heading, .project-card, .about')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  targets.forEach((element, index) => {
    if (element.dataset.scrollAnimation) return;
    element.dataset.scrollAnimation = 'true';
    element.classList.add('scroll-reveal');
    const delay = element.classList.contains('project-card') ? (index % 3) * 130 : 0;
    element.style.setProperty('--reveal-delay', `${delay}ms`);
  });

  if (reducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach(element => element.classList.add('is-visible'));
    return;
  }

  if (!scrollObserver) {
    // Em telas grandes, espera o elemento chegar mais perto do centro antes
    // de revelar — assim o efeito fica visível também no computador, em vez
    // de disparar tudo de uma vez já no carregamento da página.
    const isWideScreen = window.matchMedia('(min-width: 900px)').matches;
    const rootMargin = isWideScreen ? '0px 0px -12%' : '0px 0px -45px';
    scrollObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        scrollObserver.unobserve(entry.target);
      });
    }, { threshold: .14, rootMargin });
  }
  targets.forEach(element => {
    if (!element.classList.contains('is-visible')) scrollObserver.observe(element);
  });
}

const scrollProgress = $('#scrollProgress');
function updateScrollProgress() {
  const availableScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = availableScroll > 0 ? window.scrollY / availableScroll : 0;
  scrollProgress.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', updateScrollProgress);

// Entrada cinematográfica e faixa contínua, criadas pelo JavaScript para manter o HTML intacto.
const introWipe = document.createElement('div');
introWipe.className = 'intro-wipe';
introWipe.setAttribute('aria-hidden', 'true');
introWipe.innerHTML = '<span>KP/</span>';
document.body.prepend(introWipe);
requestAnimationFrame(() => introWipe.classList.add('play'));
introWipe.addEventListener('animationend', () => introWipe.remove());

const marquee = document.createElement('div');
marquee.className = 'marquee';
marquee.setAttribute('aria-hidden', 'true');
const marqueeText = 'PROJETOS • APRENDIZADO • CÓDIGO • CRIATIVIDADE • ';
marquee.innerHTML = `<div class="marquee-track"><span>${marqueeText.repeat(4)}</span><span>${marqueeText.repeat(4)}</span></div>`;
$('#projetos').before(marquee);

// Luz ambiente discreta que atravessa as seções e acompanha a navegação.
const ambientGlow = document.createElement('div');
ambientGlow.className = 'ambient-glow';
ambientGlow.setAttribute('aria-hidden', 'true');
document.body.append(ambientGlow);

// O menu mostra em qual parte do portfólio a pessoa está.
const sectionLinks = [...document.querySelectorAll('.topbar nav a[href^="#"]')];
const sectionTargets = sectionLinks
  .map(link => ({ link, section: document.querySelector(link.getAttribute('href')) }))
  .filter(item => item.section);

function updateActiveNavigation() {
  document.querySelector('.topbar')?.classList.toggle('is-scrolled', window.scrollY > 40);
  const marker = window.scrollY + window.innerHeight * .38;
  let active = null;
  sectionTargets.forEach(item => {
    if (item.section.offsetTop <= marker) active = item;
  });
  sectionLinks.forEach(link => {
    const selected = active?.link === link;
    link.classList.toggle('is-active', selected);
    if (selected) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

window.addEventListener('scroll', updateActiveNavigation, { passive: true });
window.addEventListener('resize', updateActiveNavigation, { passive: true });
updateActiveNavigation();

// Cursor editorial e movimento sutil de profundidade para dispositivos com mouse.
if (window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const cursor = document.createElement('div');
  cursor.className = 'cursor-orbit';
  document.body.append(cursor);
  let cursorX = 0, cursorY = 0, currentX = 0, currentY = 0;
  document.addEventListener('pointermove', event => {
    cursorX = event.clientX;
    cursorY = event.clientY;
    cursor.style.opacity = '1';
    cursor.classList.toggle('active', !!event.target.closest('a, button, .project-card'));
    document.documentElement.style.setProperty('--ambient-x', `${event.clientX}px`);
    document.documentElement.style.setProperty('--ambient-y', `${event.clientY}px`);
  }, { passive: true });
  function moveCursor() {
    currentX += (cursorX - currentX) * .16;
    currentY += (cursorY - currentY) * .16;
    cursor.style.transform = `translate3d(${currentX - cursor.offsetWidth / 2}px, ${currentY - cursor.offsetHeight / 2}px, 0)`;
    requestAnimationFrame(moveCursor);
  }
  moveCursor();

  const heroTitle = $('.hero h1');
  document.addEventListener('pointermove', event => {
    if (window.scrollY > window.innerHeight) return;
    const x = (event.clientX / window.innerWidth - .5) * 12;
    const y = (event.clientY / window.innerHeight - .5) * 8;
    heroTitle.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, { passive: true });
}

// Pequeno efeito de velocidade no título durante a rolagem.
const heroTitle = $('.hero h1');
function updateHeroMotion() {
  const amount = Math.min(window.scrollY, window.innerHeight);
  heroTitle.style.opacity = String(Math.max(.16, 1 - amount / window.innerHeight));
  if (!window.matchMedia('(pointer: fine)').matches) heroTitle.style.transform = `translateY(${amount * .12}px)`;
}
window.addEventListener('scroll', updateHeroMotion, { passive: true });

// Notebook 3D: tilt pelo mouse no desktop e perspectiva guiada pelo scroll no mobile.
const codeLab = $('#laboratorio');
const laptopTilt = $('#laptopTilt');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileLaptop = window.matchMedia('(max-width: 760px), (pointer: coarse)');

if (codeLab && laptopTilt) {
  codeLab.classList.add('terminal-ready');

  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const terminalObserver = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      codeLab.classList.add('terminal-run');
      terminalObserver.disconnect();
    }, { threshold: .32 });
    terminalObserver.observe(codeLab);
  } else {
    codeLab.classList.add('terminal-run');
  }

  let laptopFrame = 0;
  function setLaptopTransform(rx, ry, lift = 0) {
    cancelAnimationFrame(laptopFrame);
    laptopFrame = requestAnimationFrame(() => {
      laptopTilt.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      laptopTilt.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      laptopTilt.style.setProperty('--lift', `${lift.toFixed(1)}px`);
    });
  }

  function updateLaptopFromScroll() {
    if (!mobileLaptop.matches || reduceMotion.matches) return;
    const bounds = codeLab.getBoundingClientRect();
    const range = window.innerHeight + bounds.height;
    const progress = Math.min(1, Math.max(0, (window.innerHeight - bounds.top) / range));
    setLaptopTransform(0 + progress * 1.5, 6 + (progress - .5) * 3, (progress - .5) * -12);
  }

  codeLab.addEventListener('pointermove', event => {
    if (mobileLaptop.matches || reduceMotion.matches) return;
    const bounds = codeLab.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    setLaptopTransform(.5 - y * 2, 9 + x * 4);
  }, { passive: true });

  codeLab.addEventListener('pointerleave', () => {
    if (!mobileLaptop.matches && !reduceMotion.matches) setLaptopTransform(.5, 9);
  });

  window.addEventListener('scroll', updateLaptopFromScroll, { passive: true });
  window.addEventListener('resize', updateLaptopFromScroll, { passive: true });
  updateLaptopFromScroll();
}

// Movimento 3D leve nos cartões e botões "magnéticos" — só no computador,
// sem interferir em telas touch.
if (window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.addEventListener('pointermove', event => {
    const card = event.target.closest('.project-card');
    if (!card) return;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    card.style.setProperty('--spot-x', `${(x + .5) * 100}%`);
    card.style.setProperty('--spot-y', `${(y + .5) * 100}%`);
    card.style.transform = `perspective(800px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg) translateY(-7px)`;
  });
  document.addEventListener('pointerout', event => {
    const card = event.target.closest('.project-card');
    if (card && !card.contains(event.relatedTarget)) card.style.transform = '';
  });

  document.querySelectorAll('.button').forEach(button => {
    button.addEventListener('pointermove', event => {
      const bounds = button.getBoundingClientRect();
      const x = (event.clientX - bounds.left - bounds.width / 2) * .25;
      const y = (event.clientY - bounds.top - bounds.height / 2) * .3;
      button.style.transform = `translate(${x}px, ${y - 4}px)`;
    });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });
}

// Em telas touch, os cartões respiram levemente conforme passam pelo centro.
const mobileCardMotion = window.matchMedia('(max-width: 760px), (pointer: coarse)');
let mobileCardFrame = 0;
function updateMobileCards() {
  if (!mobileCardMotion.matches || reduceMotion.matches) return;
  cancelAnimationFrame(mobileCardFrame);
  mobileCardFrame = requestAnimationFrame(() => {
    document.querySelectorAll('.project-card.is-visible').forEach(card => {
      const bounds = card.getBoundingClientRect();
      const distance = (bounds.top + bounds.height / 2 - window.innerHeight / 2) / window.innerHeight;
      const clamped = Math.max(-1, Math.min(1, distance));
      card.style.setProperty('--card-drift', `${clamped * -8}px`);
      card.style.setProperty('--card-scale', `${1 - Math.abs(clamped) * .018}`);
    });
    const pageProgress = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    document.documentElement.style.setProperty('--ambient-x', `${38 + pageProgress * 25}vw`);
    document.documentElement.style.setProperty('--ambient-y', `${42 + Math.sin(pageProgress * Math.PI) * 18}vh`);
  });
}
window.addEventListener('scroll', updateMobileCards, { passive: true });
window.addEventListener('resize', updateMobileCards, { passive: true });

// Carrega os dados do banco antes de mostrar a página.
(async () => {
  await loadData();
  render();
  updateScrollProgress();
  updateActiveNavigation();
  updateMobileCards();
})();

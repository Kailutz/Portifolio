const defaults = {
  intro: 'Aqui registro os projetos, aprendizados e desafios da minha trajetória na faculdade.',
  github: 'https://github.com/',
  linkedin: '',
  instagram: '',
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
  const storedProjects = Array.isArray(row.projects) ? row.projects : [];
  let storedSocials = {};
  const projects = [];

  storedProjects.forEach(project => {
    if (!project || typeof project !== 'object') return;
    if (project._portfolioSocials) storedSocials = { ...storedSocials, ...project._portfolioSocials };
    if (project.__portfolioMetadata) return;
    const { _portfolioSocials, ...cleanProject } = project;
    projects.push(cleanProject);
  });

  return {
    intro: row.intro || defaults.intro,
    github: row.github || defaults.github,
    linkedin: row.linkedin || storedSocials.linkedin || defaults.linkedin,
    instagram: row.instagram || storedSocials.instagram || defaults.instagram,
    aboutTitle: row.about_title || defaults.aboutTitle,
    aboutText: row.about_text || defaults.aboutText,
    email: row.email || defaults.email,
    projects
  };
}

async function loadData() {
  const { data: rows, error } = await supabaseClient.from('portfolio').select('*').eq('id', 1).single();
  if (error || !rows) { console.error('Não foi possível carregar os dados do Supabase, usando exemplo padrão.', error); data = structuredClone(defaults); return; }
  data = fromRow(rows);
}

async function saveData() {
  const socialData = { linkedin: data.linkedin || '', instagram: data.instagram || '' };
  const projectsForStorage = data.projects.length
    ? data.projects.map((project, index) => index === 0 ? { ...project, _portfolioSocials: socialData } : project)
    : [{ __portfolioMetadata: true, _portfolioSocials: socialData }];

  const { error } = await supabaseClient.from('portfolio').update({
    intro: data.intro,
    github: data.github,
    about_title: data.aboutTitle,
    about_text: data.aboutText,
    email: data.email,
    projects: projectsForStorage
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
  const emailLink = $('#emailLink');
  if (emailLink) {
    emailLink.href = `mailto:${data.email}`;
    if (!emailLink.dataset.fixedLabel) emailLink.textContent = data.email === defaults.email ? 'Vamos conversar' : data.email;
  }
  const copyEmailButton = $('#copyEmailButton');
  if (copyEmailButton) copyEmailButton.dataset.email = data.email;
  const contactGithub = $('#contactGithub');
  if (contactGithub) contactGithub.href = data.github || 'https://github.com/';
  const setSocialLink = (selector, value) => {
    const link = $(selector);
    if (!link) return;
    link.hidden = !value;
    if (value) link.href = value;
  };
  setSocialLink('#contactLinkedin', data.linkedin);
  setSocialLink('#contactInstagram', data.instagram);
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
  ['intro','github','linkedin','instagram','aboutTitle','aboutText','email'].forEach(key => form.elements[key].value = data[key] || '');
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
    intro: form.elements.intro.value.trim(), github: form.elements.github.value.trim(), linkedin: form.elements.linkedin.value.trim(), instagram: form.elements.instagram.value.trim(), aboutTitle: form.elements.aboutTitle.value.trim(), aboutText: form.elements.aboutText.value.trim(), email: form.elements.email.value.trim(),
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
  ['intro','github','linkedin','instagram','aboutTitle','aboutText','email'].forEach(key => form.elements[key].value = data[key] || '');
  $('#projectEditor').innerHTML = ''; data.projects.forEach(addProjectEditor);
});

let scrollObserver;
let titleObserver;

function setupKineticTitles() {
  const titles = [...document.querySelectorAll('.section-heading h2, .about h2, .lab-heading h2, .tech-universe-heading h2')];
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
          entry.target.classList.toggle('title-visible', entry.isIntersecting);
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
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
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

// Cursor editorial para dispositivos com mouse.
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
const laptopStage = $('#laptopStage');
const laptopTilt = $('#laptopTilt');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileLaptop = window.matchMedia('(max-width: 760px), (pointer: coarse)');

if (codeLab && laptopStage && laptopTilt) {
  codeLab.classList.add('terminal-ready');

  let laptopFrame = 0;
  let laptopVisible = !('IntersectionObserver' in window);
  const laptopCurrent = { rx: 1, ry: 10, lift: 0, lightX: 50, lightY: 32 };
  const laptopTarget = { ...laptopCurrent };

  function renderLaptopTransform() {
    laptopFrame = 0;
    let moving = false;

    Object.keys(laptopCurrent).forEach(key => {
      const distance = laptopTarget[key] - laptopCurrent[key];
      laptopCurrent[key] += distance * (key.startsWith('light') ? .16 : .11);
      if (Math.abs(distance) > (key.startsWith('light') ? .08 : .015)) moving = true;
    });

    laptopTilt.style.setProperty('--rx', `${laptopCurrent.rx.toFixed(2)}deg`);
    laptopTilt.style.setProperty('--ry', `${laptopCurrent.ry.toFixed(2)}deg`);
    laptopTilt.style.setProperty('--lift', `${laptopCurrent.lift.toFixed(1)}px`);
    laptopTilt.style.setProperty('--light-x', `${laptopCurrent.lightX.toFixed(1)}%`);
    laptopTilt.style.setProperty('--light-y', `${laptopCurrent.lightY.toFixed(1)}%`);

    if (moving && laptopVisible) laptopFrame = requestAnimationFrame(renderLaptopTransform);
  }

  function requestLaptopTransform() {
    if (!laptopFrame && laptopVisible && !reduceMotion.matches) {
      laptopFrame = requestAnimationFrame(renderLaptopTransform);
    }
  }

  function setLaptopTransform(rx, ry, lift = 0, lightX = 50, lightY = 32) {
    Object.assign(laptopTarget, { rx, ry, lift, lightX, lightY });
    requestLaptopTransform();
  }

  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const terminalObserver = new IntersectionObserver(([entry]) => {
      laptopVisible = entry.isIntersecting;
      codeLab.classList.toggle('terminal-run', laptopVisible);
      if (laptopVisible) requestLaptopTransform();
      else {
        cancelAnimationFrame(laptopFrame);
        laptopFrame = 0;
      }
    }, { threshold: .24 });
    terminalObserver.observe(laptopStage);
  } else {
    laptopVisible = true;
    codeLab.classList.add('terminal-run');
  }

  function updateLaptopFromScroll() {
    if (codeLab.classList.contains('webgl-ready') || !mobileLaptop.matches || reduceMotion.matches) return;
    const bounds = codeLab.getBoundingClientRect();
    const range = window.innerHeight + bounds.height;
    const progress = Math.min(1, Math.max(0, (window.innerHeight - bounds.top) / range));
    setLaptopTransform(
      1 + progress * 2,
      6 + (progress - .5) * 7,
      (progress - .5) * -12,
      38 + progress * 24,
      28 + progress * 12
    );
  }

  laptopStage.addEventListener('pointermove', event => {
    if (codeLab.classList.contains('webgl-ready') || mobileLaptop.matches || reduceMotion.matches) return;
    const bounds = laptopStage.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    setLaptopTransform(1 - y * 7, 10 + x * 14, y * -4, 50 + x * 70, 32 + y * 55);
  }, { passive: true });

  laptopStage.addEventListener('pointerleave', () => {
    if (!codeLab.classList.contains('webgl-ready') && !mobileLaptop.matches && !reduceMotion.matches) {
      setLaptopTransform(1, 10, 0, 50, 32);
    }
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

// Sequência de telas presa à viewport: o scroll troca o código, não a posição.
const codeStory = $('#codeStory');
const codeScenes = codeStory ? [...codeStory.querySelectorAll('.code-scene')] : [];
const codeStoryDots = codeStory ? [...codeStory.querySelectorAll('.code-story-dots i')] : [];
const codeStoryCurrent = $('#codeStoryCurrent');
let codeStoryFrame = 0;

function updateCodeStory() {
  if (!codeStory || !codeScenes.length || reduceMotion.matches) return;
  cancelAnimationFrame(codeStoryFrame);
  codeStoryFrame = requestAnimationFrame(() => {
    const bounds = codeStory.getBoundingClientRect();
    const range = Math.max(1, codeStory.offsetHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -bounds.top / range));
    const position = progress * (codeScenes.length - 1);
    const activeIndex = Math.round(position);
    const compact = window.matchMedia('(max-width: 760px)').matches;

    codeStory.style.setProperty('--story-progress', progress.toFixed(3));
    codeStory.style.setProperty('--story-x', `${24 + progress * 45}%`);
    codeScenes.forEach((scene, index) => {
      const relative = index - position;
      const distance = Math.abs(relative);
      const opacity = Math.max(0, 1 - distance);
      const x = relative * (compact ? 34 : 92);
      const y = relative * (compact ? 28 : 48);
      const scale = Math.max(.86, 1 - distance * .075);
      scene.style.opacity = opacity.toFixed(3);
      scene.style.zIndex = String(10 - Math.round(distance * 2));
      scene.style.transform = `translate3d(${x}px, ${y}px, ${-distance * 100}px) rotateY(${-relative * 5}deg) rotateZ(${relative * 1.2}deg) scale(${scale})`;
      scene.setAttribute('aria-hidden', String(index !== activeIndex));
    });

    codeStoryDots.forEach((dot, index) => dot.classList.toggle('is-active', index === activeIndex));
    if (codeStoryCurrent) codeStoryCurrent.textContent = String(activeIndex + 1).padStart(2, '0');
  });
}

window.addEventListener('scroll', updateCodeStory, { passive: true });
window.addEventListener('resize', updateCodeStory, { passive: true });

// Universo de tecnologias: conexões, partículas e detalhes interativos.
const techUniverse = $('#universo');
const techSpace = $('#techSpace');
const techCanvas = $('#techCanvas');
const techCore = $('#techCore');
const techNodes = techSpace ? [...techSpace.querySelectorAll('.tech-node')] : [];
const techInfoNumber = $('#techInfoNumber');
const techInfoName = $('#techInfoName');
const techInfoCopy = $('#techInfoCopy');
let techContext = techCanvas?.getContext('2d');
let techParticles = [];
let techUniverseFrame = 0;
let techUniverseVisible = false;

function selectTechnology(node) {
  const index = techNodes.indexOf(node);
  techNodes.forEach(item => item.classList.toggle('is-active', item === node));
  if (techInfoNumber) techInfoNumber.textContent = String(index + 1).padStart(2, '0');
  if (techInfoName) techInfoName.textContent = node.dataset.name || '';
  if (techInfoCopy) techInfoCopy.textContent = node.dataset.copy || '';
}

techNodes.forEach(node => {
  node.addEventListener('pointerenter', () => selectTechnology(node));
  node.addEventListener('focus', () => selectTechnology(node));
  node.addEventListener('click', () => selectTechnology(node));
});

function resizeTechCanvas() {
  if (!techCanvas || !techSpace || !techContext) return;
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  const width = techSpace.clientWidth;
  const height = techSpace.clientHeight;
  techCanvas.width = Math.round(width * ratio);
  techCanvas.height = Math.round(height * ratio);
  techCanvas.style.width = `${width}px`;
  techCanvas.style.height = `${height}px`;
  techContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (!techParticles.length) {
    techParticles = Array.from({ length: width < 700 ? 28 : 48 }, (_, index) => ({
      x: (index * 47 % 101) / 101,
      y: (index * 73 % 97) / 97,
      speed: .000035 + (index % 5) * .000012,
      size: .7 + (index % 4) * .38,
      tone: index % 3
    }));
  }
}

function drawTechUniverse(time = 0) {
  if (!techContext || !techCanvas || !techSpace || !techCore) return;
  const width = techSpace.clientWidth;
  const height = techSpace.clientHeight;
  techContext.clearRect(0, 0, width, height);

  techParticles.forEach(particle => {
    if (!reduceMotion.matches) particle.y = (particle.y + particle.speed * 16) % 1;
    const colors = ['#c7ff00', '#8b6dff', '#ff668f'];
    techContext.globalAlpha = .22;
    techContext.fillStyle = colors[particle.tone];
    techContext.beginPath();
    techContext.arc(particle.x * width, particle.y * height, particle.size, 0, Math.PI * 2);
    techContext.fill();
  });

  const centerX = techCore.offsetLeft;
  const centerY = techCore.offsetTop;
  techNodes.forEach((node, index) => {
    const nodeX = node.offsetLeft;
    const nodeY = node.offsetTop;
    const active = node.classList.contains('is-active');
    const gradient = techContext.createLinearGradient(centerX, centerY, nodeX, nodeY);
    gradient.addColorStop(0, active ? '#c7ff0090' : '#c7ff0038');
    gradient.addColorStop(1, active ? '#c7ff00d0' : '#ffffff22');
    techContext.globalAlpha = 1;
    techContext.strokeStyle = gradient;
    techContext.lineWidth = active ? 1.5 : .75;
    techContext.setLineDash(active ? [7, 7] : [3, 9]);
    techContext.lineDashOffset = -time * (active ? .018 : .008);
    techContext.beginPath();
    techContext.moveTo(centerX, centerY);
    techContext.lineTo(nodeX, nodeY);
    techContext.stroke();

    const travel = ((time / 1900) + index / techNodes.length) % 1;
    const pulseX = centerX + (nodeX - centerX) * travel;
    const pulseY = centerY + (nodeY - centerY) * travel;
    techContext.setLineDash([]);
    techContext.fillStyle = active ? '#c7ff00' : '#f5f4ed';
    techContext.shadowColor = active ? '#c7ff00' : '#8b6dff';
    techContext.shadowBlur = active ? 13 : 7;
    techContext.beginPath();
    techContext.arc(pulseX, pulseY, active ? 2.8 : 1.6, 0, Math.PI * 2);
    techContext.fill();
    techContext.shadowBlur = 0;
  });

  techContext.globalAlpha = 1;
  techContext.setLineDash([]);
}

function runTechUniverse(time = 0) {
  if (!techUniverseVisible) return;
  drawTechUniverse(time);
  if (!reduceMotion.matches) techUniverseFrame = requestAnimationFrame(runTechUniverse);
}

if (techUniverse && techSpace) {
  resizeTechCanvas();
  const universeObserver = new IntersectionObserver(entries => {
    techUniverseVisible = entries[0].isIntersecting;
    cancelAnimationFrame(techUniverseFrame);
    if (techUniverseVisible) techUniverseFrame = requestAnimationFrame(runTechUniverse);
  }, { threshold: .06 });
  universeObserver.observe(techUniverse);

  techUniverse.addEventListener('pointermove', event => {
    if (mobileLaptop.matches || reduceMotion.matches) return;
    const bounds = techUniverse.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    techSpace.style.setProperty('--space-rx', `${-y * 2.8}deg`);
    techSpace.style.setProperty('--space-ry', `${x * 4}deg`);
  }, { passive: true });
  techUniverse.addEventListener('pointerleave', () => {
    techSpace.style.setProperty('--space-rx', '0deg');
    techSpace.style.setProperty('--space-ry', '0deg');
  });
}

function updateTechUniverseFromScroll() {
  if (!techUniverse || !techSpace || !mobileLaptop.matches || reduceMotion.matches) return;
  const bounds = techUniverse.getBoundingClientRect();
  const progress = Math.min(1, Math.max(0, (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height)));
  techSpace.style.setProperty('--space-rx', `${(progress - .5) * 2.2}deg`);
  techSpace.style.setProperty('--space-ry', `${(progress - .5) * -3}deg`);
  techSpace.style.setProperty('--space-lift', `${(progress - .5) * -12}px`);
}

window.addEventListener('scroll', updateTechUniverseFromScroll, { passive: true });
window.addEventListener('resize', () => {
  resizeTechCanvas();
  updateTechUniverseFromScroll();
  if (techUniverseVisible) drawTechUniverse(performance.now());
}, { passive: true });

// Viagem horizontal: a rolagem vertical atravessa os marcos da trajetória.
const cosmicJourney = $('#rota');
const journeyTrack = $('#journeyTrack');
const journeyPanels = journeyTrack ? [...journeyTrack.querySelectorAll('.journey-panel')] : [];
const journeyProgressFill = $('#journeyProgressFill');
const journeyStage = $('#journeyStage');
const journeyVelocity = $('#journeyVelocity');
const journeyDistance = $('#journeyDistance');
let journeyFrame = 0;

function updateCosmicJourney() {
  if (!cosmicJourney || !journeyTrack || !journeyPanels.length || reduceMotion.matches) return;
  cancelAnimationFrame(journeyFrame);
  journeyFrame = requestAnimationFrame(() => {
    const bounds = cosmicJourney.getBoundingClientRect();
    const range = Math.max(1, cosmicJourney.offsetHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -bounds.top / range));
    const travel = Math.max(0, journeyTrack.scrollWidth - window.innerWidth);
    const activeIndex = Math.min(journeyPanels.length - 1, Math.round(progress * (journeyPanels.length - 1)));
    const velocity = .12 + Math.sin(progress * Math.PI) * .78;

    journeyTrack.style.transform = `translate3d(${-travel * progress}px,0,0)`;
    cosmicJourney.style.setProperty('--journey-progress', progress.toFixed(3));
    const starTravel = -progress * Math.max(520, window.innerWidth * .72);
    cosmicJourney.style.setProperty('--star-shift', `${starTravel}px`);
    cosmicJourney.style.setProperty('--star-shift-slow', `${starTravel * .45}px`);
    cosmicJourney.style.setProperty('--star-shift-deep', `${starTravel * .2}px`);
    cosmicJourney.style.setProperty('--journey-velocity', velocity.toFixed(3));
    cosmicJourney.style.setProperty('--craft-y', `${Math.sin(progress * Math.PI * 7) * 9}px`);
    cosmicJourney.style.setProperty('--craft-tilt', `${-4 + Math.sin(progress * Math.PI * 5) * 4}deg`);

    journeyPanels.forEach((panel, index) => panel.classList.toggle('is-active', index === activeIndex));
    if (journeyProgressFill) journeyProgressFill.style.transform = `scaleX(${progress})`;
    if (journeyStage) journeyStage.textContent = String(activeIndex + 1).padStart(2, '0');
    if (journeyVelocity) journeyVelocity.textContent = String(Math.round(velocity * 780)).padStart(3, '0');
    if (journeyDistance) journeyDistance.textContent = `${String(Math.round(progress * 100)).padStart(3, '0')}%`;
  });
}

window.addEventListener('scroll', updateCosmicJourney, { passive: true });
window.addEventListener('resize', updateCosmicJourney, { passive: true });

// Encerramento cinematográfico: cor e tipografia respondem ao scroll.
const cinematicContact = $('#contato');
let cinematicContactFrame = 0;

function clampContact(value) {
  return Math.min(1, Math.max(0, value));
}

function mixContactColor(start, end, progress) {
  return start.map((value, index) => Math.round(value + (end[index] - value) * progress)).join(',');
}

function updateCinematicContact() {
  if (!cinematicContact || reduceMotion.matches) return;
  cancelAnimationFrame(cinematicContactFrame);
  cinematicContactFrame = requestAnimationFrame(() => {
    const bounds = cinematicContact.getBoundingClientRect();
    const range = Math.max(1, cinematicContact.offsetHeight - window.innerHeight);
    const progress = clampContact(-bounds.top / range);
    const colorProgress = clampContact(progress / .78);
    const reveal = clampContact((progress - .06) / .48);
    const easedReveal = 1 - Math.pow(1 - reveal, 3);
    const titleOpacity = clampContact((progress - .03) / .2);
    const actionsOpacity = clampContact((progress - .48) / .24);
    const pagesIn = clampContact((progress - .28) / .18);
    const pagesOpacity = pagesIn;
    const pagesX = (1 - pagesIn) * -34;

    cinematicContact.style.setProperty('--contact-bg', mixContactColor([13, 17, 12], [199, 255, 0], colorProgress));
    cinematicContact.style.setProperty('--contact-ink', mixContactColor([245, 244, 237], [32, 37, 27], colorProgress));
    cinematicContact.style.setProperty('--contact-left', `${(1 - easedReveal) * -34}vw`);
    cinematicContact.style.setProperty('--contact-right', `${(1 - easedReveal) * 34}vw`);
    cinematicContact.style.setProperty('--contact-y-one', `${(1 - easedReveal) * 80}px`);
    cinematicContact.style.setProperty('--contact-y-two', `${(1 - easedReveal) * 110}px`);
    cinematicContact.style.setProperty('--contact-title-opacity', titleOpacity.toFixed(3));
    cinematicContact.style.setProperty('--contact-actions-opacity', actionsOpacity.toFixed(3));
    cinematicContact.style.setProperty('--contact-actions-y', `${(1 - actionsOpacity) * 28}px`);
    cinematicContact.style.setProperty('--contact-pages-opacity', pagesOpacity.toFixed(3));
    cinematicContact.style.setProperty('--contact-pages-x', `${pagesX.toFixed(2)}px`);
  });
}

window.addEventListener('scroll', updateCinematicContact, { passive: true });
window.addEventListener('resize', updateCinematicContact, { passive: true });

const copyEmailButton = $('#copyEmailButton');
const copyEmailStatus = $('#copyEmailStatus');
let copyEmailTimer = 0;

async function copyPortfolioEmail() {
  const email = copyEmailButton?.dataset.email || data.email;
  try {
    await navigator.clipboard.writeText(email);
  } catch {
    const helper = document.createElement('textarea');
    helper.value = email;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.append(helper);
    helper.select();
    document.execCommand('copy');
    helper.remove();
  }

  if (!copyEmailStatus || !copyEmailButton) return;
  clearTimeout(copyEmailTimer);
  copyEmailStatus.classList.add('is-visible');
  copyEmailButton.textContent = 'COPIADO ✓';
  copyEmailTimer = setTimeout(() => {
    copyEmailStatus.classList.remove('is-visible');
    copyEmailButton.textContent = 'COPIAR E-MAIL';
  }, 2400);
}

copyEmailButton?.addEventListener('click', copyPortfolioEmail);

// Auto tour: rolagem constante que cede o controle assim que a pessoa interage.
const autoScrollButton = $('#autoScrollButton');
const autoScrollIcon = $('#autoScrollIcon');
const autoScrollLabel = $('#autoScrollLabel');
const autoScrollNotice = $('#autoScrollNotice');
let autoScrollActive = false;
let autoScrollFrame = 0;
let autoScrollLastTime = 0;
let autoScrollPosition = 0;
let autoScrollNoticeTimer = 0;
let autoScrollKeyboardStopAt = -Infinity;

function showAutoScrollNotice(message, duration = 2200) {
  if (!autoScrollNotice) return;
  clearTimeout(autoScrollNoticeTimer);
  autoScrollNotice.textContent = message;
  autoScrollNotice.classList.toggle('is-visible', Boolean(message));
  if (!message) return;
  autoScrollNoticeTimer = setTimeout(() => {
    autoScrollNotice.classList.remove('is-visible');
  }, duration);
}

function updateAutoScrollButton() {
  if (!autoScrollButton || !autoScrollIcon || !autoScrollLabel) return;
  autoScrollButton.classList.toggle('is-active', autoScrollActive);
  autoScrollButton.setAttribute('aria-pressed', String(autoScrollActive));
  autoScrollButton.setAttribute(
    'aria-label',
    autoScrollActive ? 'Parar rolagem automática' : 'Ativar rolagem automática'
  );
  autoScrollButton.title = autoScrollActive
    ? 'Parar — também funciona com a roda do mouse ou qualquer tecla'
    : 'Ativar rolagem automática';
  autoScrollIcon.textContent = autoScrollActive ? '■' : '▶';
  autoScrollLabel.textContent = autoScrollActive ? 'Parar tour' : 'Auto tour';
}

function stopAutoScroll(reason = 'manual') {
  if (!autoScrollActive) return;
  autoScrollActive = false;
  cancelAnimationFrame(autoScrollFrame);
  autoScrollFrame = 0;
  autoScrollLastTime = 0;
  document.documentElement.classList.remove('is-auto-scrolling');
  updateAutoScrollButton();

  if (reason === 'finished') showAutoScrollNotice('FIM DO AUTO TOUR', 1800);
  else if (reason !== 'hidden') showAutoScrollNotice('AUTO TOUR PAUSADO', 1400);
}

function runAutoScroll(timestamp) {
  if (!autoScrollActive) return;
  if (Math.abs(window.scrollY - autoScrollPosition) > 4) {
    stopAutoScroll('manual-scroll');
    return;
  }
  if (!autoScrollLastTime) autoScrollLastTime = timestamp;
  const elapsed = Math.min(timestamp - autoScrollLastTime, 64);
  autoScrollLastTime = timestamp;
  const speed = window.matchMedia('(max-width: 760px)').matches ? 375 : 450;
  const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  autoScrollPosition = Math.min(maximum, autoScrollPosition + speed * elapsed / 1000);
  window.scrollTo(0, autoScrollPosition);

  if (autoScrollPosition >= maximum - 1) {
    stopAutoScroll('finished');
    return;
  }
  autoScrollFrame = requestAnimationFrame(runAutoScroll);
}

function startAutoScroll() {
  if (autoScrollActive) return;
  const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  if (!maximum) return;

  document.documentElement.classList.add('is-auto-scrolling');
  if (window.scrollY >= maximum - 2) window.scrollTo(0, 0);
  autoScrollPosition = window.scrollY;
  autoScrollActive = true;
  autoScrollLastTime = 0;
  updateAutoScrollButton();
  showAutoScrollNotice('RODA DO MOUSE OU QUALQUER TECLA PARA PARAR', 4200);
  autoScrollFrame = requestAnimationFrame(runAutoScroll);
}

autoScrollButton?.addEventListener('click', () => {
  if (performance.now() - autoScrollKeyboardStopAt < 260) return;
  if (autoScrollActive) stopAutoScroll('button');
  else startAutoScroll();
});

window.addEventListener('wheel', () => stopAutoScroll('wheel'), {
  passive: true,
  capture: true
});
window.addEventListener('touchstart', () => stopAutoScroll('touch'), {
  passive: true,
  capture: true
});
document.addEventListener('keydown', () => {
  if (!autoScrollActive) return;
  autoScrollKeyboardStopAt = performance.now();
  stopAutoScroll('keyboard');
}, { capture: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopAutoScroll('hidden');
});
updateAutoScrollButton();

// Carrega os dados do banco antes de mostrar a página.
(async () => {
  await loadData();
  render();
  updateScrollProgress();
  updateActiveNavigation();
  updateMobileCards();
  updateCodeStory();
  updateTechUniverseFromScroll();
  updateCosmicJourney();
  updateCinematicContact();
})();

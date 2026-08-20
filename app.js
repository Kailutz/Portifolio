const STORAGE_KEY = 'portfolio-academico-v1';

const defaults = {
  intro: 'Aqui registro os projetos, aprendizados e desafios da minha trajetória na faculdade.',
  github: 'https://github.com/',
  aboutTitle: 'Um estudante curioso,\nsempre em movimento.',
  aboutText: 'Este espaço é meu diário de construção. Cada projeto representa uma nova habilidade, uma ideia explorada ou um problema que aprendi a resolver.',
  email: 'seuemail@exemplo.com',
  projects: [
    { title: 'Calculadora Python', description: 'Uma calculadora de terminal para colocar em prática condicionais, funções e tratamento de entradas.', tags: ['Python', 'Lógica'], link: '#', color: '#9e78f7' },
    { title: 'Lista de tarefas', description: 'Organização de tarefas com uma interface leve e foco em uma boa experiência de uso.', tags: ['HTML', 'CSS', 'JavaScript'], link: '#', color: '#d9f34b' },
    { title: 'Em breve', description: 'O próximo capítulo da minha jornada na programação está sendo construída agora.', tags: ['Em aprendizado'], link: '#', color: '#c05de5' }
  ]
};

let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(defaults);
let authenticated = false;
const $ = (selector) => document.querySelector(selector);

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
}

function render() {
  $('#intro').textContent = data.intro;
  $('#aboutTitle').innerHTML = escapeHTML(data.aboutTitle).replace(/\n/g, '<br>');
  $('#aboutText').textContent = data.aboutText;
  $('#githubHero').href = data.github || 'https://github.com/';
  $('#emailLink').href = `mailto:${data.email}`;
  $('#emailLink').textContent = data.email === defaults.email ? 'Vamos conversar ↗' : `${data.email} ↗`;
  const technologies = new Set(data.projects.flatMap(project => project.tags));
  $('#projectCount').textContent = data.projects.length;
  $('#techCount').textContent = technologies.size;
  $('#projectLabel').textContent = `${String(data.projects.length).padStart(2, '0')} projetos`;
  $('#projectGrid').innerHTML = data.projects.map((project, index) => {
    const link = project.link && project.link !== '#' ? project.link : '#projetos';
    return `<a class="project-card" href="${escapeHTML(link)}" ${link !== '#projetos' ? 'target="_blank" rel="noreferrer"' : ''} style="background:${escapeHTML(project.color)}"><div class="card-top"><span class="number">${String(index + 1).padStart(2, '0')} / PROJETO</span><span class="arrow">↗</span></div><div><h3>${escapeHTML(project.title)}</h3><p>${escapeHTML(project.description)}</p><div class="tags">${project.tags.map(tag => `<span>${escapeHTML(tag)}</span>`).join('')}</div></div></a>`;
  }).join('');
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

// Ao carregar a página, verifica se já existe uma sessão válida no Supabase
// (assim você não precisa logar toda vez que recarrega a página, dentro da validade da sessão).
supabaseClient.auth.getSession().then(({ data: { session } }) => {
  authenticated = !!session;
});

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
$('#settingsForm').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  data = {
    intro: form.elements.intro.value.trim(), github: form.elements.github.value.trim(), aboutTitle: form.elements.aboutTitle.value.trim(), aboutText: form.elements.aboutText.value.trim(), email: form.elements.email.value.trim(),
    projects: [...$('#projectEditor').querySelectorAll('.project-editor-card')].map(card => ({
      title: card.querySelector('[data-field="title"]').value.trim(), description: card.querySelector('[data-field="description"]').value.trim(), tags: card.querySelector('[data-field="tags"]').value.split(',').map(tag => tag.trim()).filter(Boolean), link: card.querySelector('[data-field="link"]').value.trim(), color: card.querySelector('[data-field="color"]').value
    })).filter(project => project.title && project.description)
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); render(); $('#adminDialog').close();
});

$('#logoutButton').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  authenticated = false;
  $('#adminDialog').close();
});

$('#resetButton').addEventListener('click', () => {
  if (!confirm('Restaurar o conteúdo de exemplo?')) return;
  data = structuredClone(defaults); localStorage.removeItem(STORAGE_KEY); render();
  const form = $('#settingsForm');
  ['intro','github','aboutTitle','aboutText','email'].forEach(key => form.elements[key].value = data[key]);
  $('#projectEditor').innerHTML = ''; data.projects.forEach(addProjectEditor);
});

let scrollObserver;
function setupScrollAnimations() {
  const targets = [...document.querySelectorAll('.section-heading, .project-card, .about, .footer')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  targets.forEach((element, index) => {
    if (element.dataset.scrollAnimation) return;
    element.dataset.scrollAnimation = 'true';
    element.classList.add('scroll-reveal');
    const delay = element.classList.contains('project-card') ? (index % 3) * 110 : 0;
    element.style.setProperty('--reveal-delay', `${delay}ms`);
  });

  if (reducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach(element => element.classList.add('is-visible'));
    return;
  }

  if (!scrollObserver) {
    scrollObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        scrollObserver.unobserve(entry.target);
      });
    }, { threshold: .14, rootMargin: '0px 0px -45px' });
  }
  targets.forEach(element => {
    if (!element.classList.contains('is-visible')) scrollObserver.observe(element);
  });
}

render();

const scrollProgress = $('#scrollProgress');
function updateScrollProgress() {
  const availableScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = availableScroll > 0 ? window.scrollY / availableScroll : 0;
  scrollProgress.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', updateScrollProgress);
updateScrollProgress();

// Movimento 3D leve nos cartões, sem interferir em telas touch.
if (window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.addEventListener('pointermove', event => {
    const card = event.target.closest('.project-card');
    if (!card) return;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    card.style.transform = `perspective(800px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg) translateY(-7px)`;
  });
  document.addEventListener('pointerout', event => {
    const card = event.target.closest('.project-card');
    if (card && !card.contains(event.relatedTarget)) card.style.transform = '';
  });
}

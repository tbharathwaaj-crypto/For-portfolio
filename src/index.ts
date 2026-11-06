type FormData = {
  institution: string; kind: string; country: string; learners: string;
  name: string; email: string; role: string; password: string;
  goals: string[]; system: string; term: string; workspace: string;
};

const defaults: FormData = { institution: '', kind: '', country: '', learners: '', name: '', email: '', role: '', password: '', goals: [], system: '', term: '', workspace: '' };
let data: FormData = { ...defaults };
let step = 0;

const app = document.querySelector<HTMLDivElement>('#pawse-app')!;
app.innerHTML = `<main class="site-shell">
  <header class="topbar"><a class="brand" href="#" aria-label="Ednara home"><span class="brand-mark"><svg viewBox="0 0 36 36" aria-hidden="true"><path d="M18 3.5 32 11v14L18 32.5 4 25V11z" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="m12 18 4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>ednara<span class="brand-dot">.</span></span></a><div class="topbar-right"><button class="notification-button" type="button" aria-label="Notifications" title="Notifications"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span class="notification-dot"></span></button><span>Already have an account?</span><a href="#login" class="login-link">Sign in</a><span class="secure"><span class="lock">⌑</span> Secure setup</span></div></header>
  <div class="page-grid"><aside class="story-panel"><div class="story-top"><span class="eyebrow"><span class="eyebrow-dot"></span> YOUR CAMPUS, CONNECTED</span><h1>Make room for<br><em>what’s next.</em></h1><p class="story-copy">A calmer way to bring your learning community together. Your LMS starts here.</p>
    <div class="quote-card"><div class="quote-stars">★★★★★</div><p>“We went from scattered tools to one place our whole community loves.”</p><div class="quote-person"><span class="avatar">AM</span><span><strong>Alex Morgan</strong><small>Academic Director, Northfield</small></span><span class="quote-mark">”</span></div></div></div>
    <div class="story-bottom"><div class="trust-avatars"><span>J</span><span>M</span><span>A</span><b>+</b></div><span>Join 1,200+ learning communities</span><div class="leaf-art" aria-hidden="true">✳</div></div></aside>
  <section class="form-panel"><div class="form-wrap"><div class="form-heading"><div class="step-kicker" id="step-kicker"></div><h2 id="form-title"></h2><p id="form-subtitle"></p></div><div class="progress" aria-label="Setup progress"><div class="progress-fill" id="progress-fill"></div></div><div class="step-labels"><span id="step-label-1">Your institution</span><span id="step-label-2">Your account</span><span id="step-label-3">Your setup</span></div><form id="onboarding-form" novalidate><div id="step-content"></div><div class="form-error" id="form-error" role="alert"></div><div class="form-actions" id="form-actions"></div></form><p class="privacy-note"><span>♧</span> Your information is encrypted and kept private.</p></div></section></div>
  <footer class="site-footer"><span>© 2025 Ednara Learning, Inc.</span><span><a href="#privacy">Privacy</a><a href="#terms">Terms</a><a href="#help">Need help?</a></span></footer>
</main>`;

const notificationButton = document.querySelector<HTMLButtonElement>('.notification-button')!;
const notificationNotice = document.createElement('div');
notificationNotice.className = 'notification-popover';
notificationNotice.setAttribute('role', 'status');
notificationNotice.hidden = true;
notificationNotice.innerHTML = '<strong>You’re all caught up</strong><span>Workspace updates will show up here after setup.</span>';
notificationButton.parentElement!.append(notificationNotice);
notificationButton.addEventListener('click', () => {
  const isOpen = notificationButton.getAttribute('aria-expanded') === 'true';
  notificationButton.setAttribute('aria-expanded', String(!isOpen));
  notificationNotice.hidden = isOpen;
});

const title = document.querySelector('#form-title')!;
const subtitle = document.querySelector('#form-subtitle')!;
const kicker = document.querySelector('#step-kicker')!;
const content = document.querySelector<HTMLDivElement>('#step-content')!;
const actions = document.querySelector<HTMLDivElement>('#form-actions')!;
const errorBox = document.querySelector<HTMLDivElement>('#form-error')!;

const options = (name: string, list: string[], value: string, icon = '✦') => `<div class="choice-grid">${list.map((x) => `<button type="button" class="choice ${value === x ? 'selected' : ''}" data-choice="${name}" data-value="${x}"><span class="choice-icon">${icon}</span><span>${x}</span>${value === x ? '<span class="checkmark">✓</span>' : ''}</button>`).join('')}</div>`;
const input = (label: string, key: keyof FormData, placeholder: string, type = 'text', required = true) => `<label class="field"><span>${label}${required ? '<i>*</i>' : '<small>Optional</small>'}</span><input name="${key}" type="${type}" placeholder="${placeholder}" value="${String(data[key])}" ${required ? 'required' : ''} autocomplete="${key === 'email' ? 'email' : key === 'password' ? 'new-password' : 'off'}"></label>`;

function render() {
  errorBox.textContent = '';
  document.querySelector('#progress-fill')!.setAttribute('style', `width:${[0, 38, 72, 100][step]}%`);
  [1, 2, 3].forEach((n) => {
    const el = document.querySelector(`#step-label-${n}`)!;
    el.classList.toggle('active', n === step + 1);
    el.classList.toggle('done', n < step + 1);
  });
  if (step === 0) {
    kicker.textContent = 'STEP 01 · INSTITUTION'; title.textContent = 'Tell us about your institution'; subtitle.textContent = 'Let’s start with the basics. You can update these details anytime.';
    content.innerHTML = `${input('Institution name', 'institution', 'e.g. Northfield Academy')}<div class="field"><span>Institution type<i>*</i></span>${options('kind', ['School', 'College', 'University', 'Training centre'], data.kind, '▧')}</div><div class="field-row">${input('Country or region', 'country', 'Choose your country')}<label class="field"><span>Number of learners<i>*</i></span><select name="learners" required><option value="">Select a range</option>${['Under 250', '250–1,000', '1,000–5,000', '5,000+'].map((x) => `<option ${data.learners === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div><div class="help-tip"><span>✦</span><span>This helps us tailor your workspace to your community.</span></div>`;
  } else if (step === 1) {
    kicker.textContent = 'STEP 02 · YOUR ACCOUNT'; title.textContent = 'Create your administrator account'; subtitle.textContent = 'You’ll be the first admin for your institution’s workspace.';
    content.innerHTML = `${input('Your full name', 'name', 'e.g. Jordan Lee')} ${input('Work email', 'email', 'you@yourinstitution.edu', 'email')}<div class="field"><span>Your role<i>*</i></span>${options('role', ['Administrator', 'Teacher', 'IT / Technology', 'Other'], data.role, '♙')}</div>${input('Create a password', 'password', 'At least 8 characters', 'password')}<div class="help-tip"><span>✦</span><span>Use your institution email so colleagues can find your workspace.</span></div>`;
  } else {
    kicker.textContent = 'STEP 03 · YOUR SETUP'; title.textContent = 'Shape your learning space'; subtitle.textContent = 'A few quick details help us make Ednara feel like yours.';
    content.innerHTML = `<div class="field"><span>What would you like to do first?<small>Select all that apply</small></span><div class="goal-grid">${['Organize courses', 'Manage student records', 'Create assessments', 'Connect with families'].map((x, i) => `<button type="button" class="goal ${data.goals.includes(x) ? 'selected' : ''}" data-goal="${x}"><span>${['▤', '♧', '✎', '♡'][i]}</span>${x}<b>${data.goals.includes(x) ? '✓' : '+'}</b></button>`).join('')}</div></div><div class="field-row">${input('Current learning system', 'system', 'e.g. Google Classroom', 'text', false)}<label class="field"><span>Next academic term<small>Optional</small></span><select name="term"><option value="">Choose a term</option>${['Fall 2025', 'Spring 2026', 'Summer 2026', 'Other'].map((x) => `<option ${data.term === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div><div class="field"><span>Workspace address<i>*</i></span><div class="url-input"><input name="workspace" value="${data.workspace}" placeholder="northfield" required><span>.ednara.com</span></div><small class="field-hint">Your team will use this address to sign in.</small></div><label class="terms-check"><input type="checkbox" name="terms" required><span>I agree to Ednara’s <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.</span></label>`;
  }
  actions.innerHTML = `${step > 0 ? '<button class="back-button" type="button" id="back">← <span>Back</span></button>' : '<span></span>'}<button class="primary-button" type="submit">${step === 2 ? 'Create my workspace' : 'Continue'} <span>→</span></button>`;
  document.querySelector<HTMLButtonElement>('#back')?.addEventListener('click', () => { collect(); step--; render(); });
}

function collect() {
  const form = document.querySelector<HTMLFormElement>('#onboarding-form')!;
  new FormData(form).forEach((v, k) => { if (k in data && k !== 'terms') (data as any)[k] = String(v); });
}

content.addEventListener('click', (e) => {
  const target = (e.target as HTMLElement).closest<HTMLElement>('[data-choice], [data-goal]');
  if (!target) return;
  collect();
  if (target.dataset.choice) { (data as any)[target.dataset.choice] = target.dataset.value; render(); }
  if (target.dataset.goal) { data.goals = data.goals.includes(target.dataset.goal) ? data.goals.filter((x) => x !== target.dataset.goal) : [...data.goals, target.dataset.goal]; render(); }
});

document.querySelector<HTMLFormElement>('#onboarding-form')!.addEventListener('submit', (e) => {
  e.preventDefault(); collect();
  const form = e.currentTarget as HTMLFormElement;
  if (step === 0 && (!data.institution.trim() || !data.kind || !data.country.trim() || !data.learners)) { errorBox.textContent = 'Please complete each required field to continue.'; return; }
  if (step === 1 && (!data.name.trim() || !/^\S+@\S+\.\S+$/.test(data.email) || !data.role || data.password.length < 8)) { errorBox.textContent = data.password.length > 0 && data.password.length < 8 ? 'Your password needs at least 8 characters.' : 'Please check your details and complete each required field.'; return; }
  if (step === 2 && (!data.workspace.trim() || !/^[a-z0-9-]+$/i.test(data.workspace) || !(form.elements.namedItem('terms') as HTMLInputElement).checked)) { errorBox.textContent = 'Choose a workspace address using letters, numbers, or hyphens, and accept the terms to continue.'; return; }
  if (step < 2) { step++; render(); return; }
  app.innerHTML = `<main class="success-page"><div class="success-card"><div class="success-icon">✓</div><span class="eyebrow"><span class="eyebrow-dot"></span> YOU’RE ALL SET</span><h1>Welcome to Ednara,<br><em>${data.institution}.</em></h1><p>Your workspace is ready for your learning community. We’ve sent a confirmation to <strong>${data.email}</strong>.</p><div class="workspace-preview"><span>YOUR WORKSPACE</span><strong>${data.workspace}.ednara.com</strong></div><button class="primary-button" onclick="window.location.reload()">Go to my workspace <span>→</span></button><small>You can invite colleagues and import your student list from your admin dashboard.</small></div></main>`;
});

render();

import { FastifyInstance } from 'fastify';

export async function registerAdminDashboardRoute(app: FastifyInstance): Promise<void> {
  app.get('/admin', async (_request, reply) => {
    reply.type('text/html; charset=utf-8');
    return ADMIN_DASHBOARD_HTML;
  });
}

const ADMIN_DASHBOARD_HTML = String.raw`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Aolda Admin</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f7f8fa;
      --panel: #ffffff;
      --line: #d9dee7;
      --text: #1d2433;
      --muted: #697386;
      --accent: #0f766e;
      --danger: #b42318;
      --focus: #2563eb;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
    }
    header {
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      border-bottom: 1px solid var(--line);
      background: var(--panel);
      position: sticky;
      top: 0;
      z-index: 2;
    }
    h1 { font-size: 18px; margin: 0; }
    h2 { font-size: 16px; margin: 0 0 12px; }
    main {
      display: grid;
      grid-template-columns: 220px minmax(0, 1fr);
      min-height: calc(100vh - 56px);
    }
    nav {
      border-right: 1px solid var(--line);
      background: #eef2f7;
      padding: 16px;
    }
    nav button, .toolbar button, .row button, form button {
      min-height: 34px;
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--text);
      border-radius: 6px;
      padding: 0 10px;
      cursor: pointer;
    }
    nav button {
      width: 100%;
      display: block;
      text-align: left;
      margin-bottom: 8px;
    }
    nav button.active {
      border-color: var(--accent);
      color: var(--accent);
      font-weight: 700;
    }
    section { padding: 18px 20px; }
    .hidden { display: none !important; }
    .toolbar {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .grid {
      display: grid;
      grid-template-columns: minmax(280px, 420px) minmax(0, 1fr);
      gap: 16px;
      align-items: start;
    }
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      min-height: 120px;
    }
    .panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 12px;
      border-bottom: 1px solid var(--line);
    }
    .list { max-height: calc(100vh - 170px); overflow: auto; }
    .row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      align-items: center;
    }
    .row:last-child { border-bottom: 0; }
    .title { font-weight: 700; overflow-wrap: anywhere; }
    .meta { color: var(--muted); font-size: 12px; margin-top: 2px; overflow-wrap: anywhere; }
    .detail { padding: 12px; }
    label { display: block; color: var(--muted); font-size: 12px; margin: 12px 0 4px; }
    input, textarea, select {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 6px;
      min-height: 34px;
      padding: 7px 9px;
      font: inherit;
      background: #fff;
    }
    textarea { min-height: 92px; resize: vertical; }
    input[type="checkbox"] { width: 18px; min-height: 18px; vertical-align: middle; }
    .inline {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
    }
    .danger { color: var(--danger); }
    .muted { color: var(--muted); }
    .status {
      min-height: 20px;
      color: var(--muted);
      font-size: 12px;
      margin-left: auto;
    }
    .login {
      max-width: 360px;
      margin: 12vh auto;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 18px;
    }
    @media (max-width: 820px) {
      main { grid-template-columns: 1fr; }
      nav { border-right: 0; border-bottom: 1px solid var(--line); }
      .grid { grid-template-columns: 1fr; }
      .list { max-height: none; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Aolda Admin</h1>
    <div class="toolbar">
      <span id="session" class="muted"></span>
      <button id="logout" class="hidden">Logout</button>
    </div>
  </header>

  <div id="loginView" class="login">
    <h2>Login</h2>
    <form id="loginForm">
      <label>Email</label>
      <input id="email" autocomplete="username" value="admin" />
      <label>Password</label>
      <input id="password" type="password" autocomplete="current-password" value="admin" />
      <div class="toolbar" style="margin-top:14px">
        <button type="submit">Login</button>
        <span id="loginStatus" class="status"></span>
      </div>
    </form>
  </div>

  <main id="appView" class="hidden">
    <nav>
      <button data-tab="sync" class="active">Sync</button>
      <button data-tab="crews">Crews</button>
      <button data-tab="projects">Projects</button>
      <button data-tab="blogs">Blogs</button>
    </nav>
    <section>
      <div id="sync" class="tab">
        <div class="panel">
          <div class="panel-head">
            <h2>Sync</h2>
            <button id="syncNow">Run</button>
          </div>
          <pre id="syncOutput" class="detail muted"></pre>
        </div>
      </div>
      <div id="crews" class="tab hidden">
        <div class="toolbar">
          <button id="refreshCrews">Refresh</button>
          <span id="crewStatus" class="status"></span>
        </div>
        <div class="grid">
          <div class="panel"><div class="list" id="crewList"></div></div>
          <div class="panel"><div class="detail" id="crewDetail"></div></div>
        </div>
      </div>
      <div id="projects" class="tab hidden">
        <div class="toolbar">
          <button id="refreshProjects">Refresh</button>
          <span id="projectStatus" class="status"></span>
        </div>
        <div class="grid">
          <div class="panel"><div class="list" id="projectList"></div></div>
          <div class="panel"><div class="detail" id="projectDetail"></div></div>
        </div>
      </div>
      <div id="blogs" class="tab hidden">
        <div class="toolbar">
          <button id="refreshBlogs">Refresh</button>
          <span id="blogStatus" class="status"></span>
        </div>
        <div class="panel"><div class="list" id="blogList"></div></div>
      </div>
    </section>
  </main>

  <script>
    const state = { token: localStorage.getItem('adminToken') || '', crews: [], projects: [], blogs: [] };
    const $ = (id) => document.getElementById(id);

    function setStatus(id, value, danger = false) {
      const el = $(id);
      el.textContent = value || '';
      el.className = danger ? 'status danger' : 'status';
    }
    function authHeaders() {
      return { authorization: 'Bearer ' + state.token, 'content-type': 'application/json' };
    }
    async function api(path, options = {}) {
      const res = await fetch(path, { ...options, headers: { ...authHeaders(), ...(options.headers || {}) } });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(data?.message || res.statusText);
      return data;
    }
    function showApp(user) {
      $('loginView').classList.add('hidden');
      $('appView').classList.remove('hidden');
      $('logout').classList.remove('hidden');
      $('session').textContent = user?.email || '';
    }
    function showLogin() {
      $('loginView').classList.remove('hidden');
      $('appView').classList.add('hidden');
      $('logout').classList.add('hidden');
      $('session').textContent = '';
    }
    async function boot() {
      if (!state.token) return showLogin();
      try {
        const me = await api('/admin/me');
        showApp(me.user);
      } catch {
        localStorage.removeItem('adminToken');
        state.token = '';
        showLogin();
      }
    }
    $('loginForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('loginStatus', '...');
      try {
        const result = await fetch('/admin/login', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: $('email').value, password: $('password').value }),
        }).then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || res.statusText);
          return data;
        });
        state.token = result.token;
        localStorage.setItem('adminToken', state.token);
        setStatus('loginStatus', '');
        showApp(result.user);
      } catch (error) {
        setStatus('loginStatus', error.message, true);
      }
    });
    $('logout').addEventListener('click', () => {
      localStorage.removeItem('adminToken');
      state.token = '';
      showLogin();
    });
    document.querySelectorAll('nav button').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('nav button').forEach((item) => item.classList.remove('active'));
        document.querySelectorAll('.tab').forEach((item) => item.classList.add('hidden'));
        button.classList.add('active');
        $(button.dataset.tab).classList.remove('hidden');
      });
    });
    $('syncNow').addEventListener('click', async () => {
      $('syncOutput').textContent = '...';
      try {
        $('syncOutput').textContent = JSON.stringify(await api('/admin/sync/notion', { method: 'POST' }), null, 2);
      } catch (error) {
        $('syncOutput').textContent = error.message;
      }
    });
    async function loadCrews() {
      setStatus('crewStatus', '...');
      try {
        state.crews = (await api('/admin/crews')).data;
        $('crewList').innerHTML = state.crews.map((crew) => rowHtml(crew.id, crew.name, crew.adminProfile?.isVisible ? 'public' : 'private')).join('');
        $('crewList').querySelectorAll('button').forEach((button) => button.addEventListener('click', () => showCrew(button.dataset.id)));
        setStatus('crewStatus', state.crews.length + ' rows');
      } catch (error) { setStatus('crewStatus', error.message, true); }
    }
    async function showCrew(id) {
      const crew = (await api('/admin/crews/' + id)).data;
      if (state.projects.length === 0) await loadProjects();
      if (state.blogs.length === 0) await loadBlogs();
      const termTeams = crew.termTeamOverrides.length > 0 ? crew.termTeamOverrides : crew.termTeamSources;
      const visibleProjectIds = new Set(crew.projectVisibilities.filter((item) => item.isVisible).map((item) => item.projectSourceId));
      const visibleBlogIds = new Set(crew.blogVisibilities.filter((item) => item.isVisible).map((item) => item.blogPostSourceId));
      $('crewDetail').innerHTML = '<h2>' + esc(crew.name) + '</h2>'
        + '<label><input id="crewVisible" type="checkbox" ' + (crew.adminProfile?.isVisible ? 'checked' : '') + '> Visible</label>'
        + '<label>Description</label><textarea id="crewDescription" placeholder="' + esc(crew.notionDescription || '') + '">' + esc(crew.adminProfile?.description || '') + '</textarea>'
        + '<div class="toolbar"><button id="saveCrew">Save profile</button></div>'
        + '<h2>Term teams</h2><div id="crewTermTeams">' + termTeams.map(termTeamRowHtml).join('') + '</div>'
        + '<div class="toolbar"><button id="addCrewTerm">Add term</button><button id="saveCrewTerms">Save terms</button></div>'
        + '<h2>Projects</h2><div id="crewProjects">' + checkboxListHtml('crewProject', state.projects, visibleProjectIds, (item) => item.titleKo) + '</div>'
        + '<div class="toolbar"><button id="saveCrewProjects">Save projects</button></div>'
        + '<h2>Blogs</h2><div id="crewBlogs">' + checkboxListHtml('crewBlog', state.blogs, visibleBlogIds, (item) => item.title) + '</div>'
        + '<div class="toolbar"><button id="saveCrewBlogs">Save blogs</button></div>';
      $('saveCrew').onclick = async () => {
        await api('/admin/crews/' + id, { method: 'PATCH', body: JSON.stringify({ isVisible: $('crewVisible').checked, description: $('crewDescription').value }) });
        await loadCrews();
      };
      $('addCrewTerm').onclick = () => {
        $('crewTermTeams').insertAdjacentHTML('beforeend', termTeamRowHtml({ generation: '', activityTerm: '', teamName: '' }));
      };
      $('saveCrewTerms').onclick = async () => {
        await api('/admin/crews/' + id + '/term-teams', {
          method: 'PUT',
          body: JSON.stringify({ items: collectCrewTermTeams() }),
        });
        await showCrew(id);
      };
      $('saveCrewProjects').onclick = async () => {
        await api('/admin/crews/' + id + '/projects', {
          method: 'PUT',
          body: JSON.stringify({ projects: collectCheckedItems('crewProject', 'projectSourceId') }),
        });
        await showCrew(id);
      };
      $('saveCrewBlogs').onclick = async () => {
        await api('/admin/crews/' + id + '/blogs', {
          method: 'PUT',
          body: JSON.stringify({ blogs: collectCheckedItems('crewBlog', 'blogPostSourceId') }),
        });
        await showCrew(id);
      };
    }
    async function loadProjects() {
      setStatus('projectStatus', '...');
      try {
        state.projects = (await api('/admin/projects')).data;
        $('projectList').innerHTML = state.projects.map((project) => rowHtml(project.id, project.titleKo, project.adminProfile?.isVisible ? 'public' : 'private')).join('');
        $('projectList').querySelectorAll('button').forEach((button) => button.addEventListener('click', () => showProject(button.dataset.id)));
        setStatus('projectStatus', state.projects.length + ' rows');
      } catch (error) { setStatus('projectStatus', error.message, true); }
    }
    async function showProject(id) {
      const project = (await api('/admin/projects/' + id)).data;
      if (state.crews.length === 0) await loadCrews();
      if (state.blogs.length === 0) await loadBlogs();
      const participantIds = new Set(project.participantOverrides.filter((item) => item.isVisible).map((item) => item.crewSourceId));
      const featuredBlogIds = new Set(project.featuredBlogs.map((item) => item.blogPostSourceId));
      const periods = project.periodOverrides.length > 0 ? project.periodOverrides : [{ label: '', startedAt: project.startedAt || '', endedAt: project.endedAt || '' }];
      $('projectDetail').innerHTML = '<h2>' + esc(project.titleKo) + '</h2>'
        + '<label><input id="projectVisible" type="checkbox" ' + (project.adminProfile?.isVisible ? 'checked' : '') + '> Visible</label>'
        + '<label>Korean title</label><input id="projectKo" placeholder="' + esc(project.titleKo || '') + '" value="' + esc(project.adminProfile?.titleKoOverride || '') + '">'
        + '<label>English title</label><input id="projectEn" placeholder="' + esc(project.titleEn || '') + '" value="' + esc(project.adminProfile?.titleEnOverride || '') + '">'
        + '<label>Brief title</label><input id="projectBrief" placeholder="' + esc(project.titleBrief || '') + '" value="' + esc(project.adminProfile?.titleBriefOverride || '') + '">'
        + '<label>Description</label><textarea id="projectDescription">' + esc(project.adminProfile?.description || '') + '</textarea>'
        + '<div class="toolbar"><button id="saveProject">Save profile</button></div>'
        + '<h2>Periods</h2><div id="projectPeriods">' + periods.map(periodRowHtml).join('') + '</div>'
        + '<div class="toolbar"><button id="addProjectPeriod">Add period</button><button id="saveProjectPeriods">Save periods</button></div>'
        + '<h2>Participants</h2><div id="projectParticipants">' + checkboxListHtml('projectParticipant', state.crews, participantIds, (item) => item.name) + '</div>'
        + '<div class="toolbar"><button id="saveProjectParticipants">Save participants</button></div>'
        + '<h2>Featured blogs</h2><div id="projectBlogs">' + checkboxListHtml('projectBlog', state.blogs, featuredBlogIds, (item) => item.title) + '</div>'
        + '<div class="toolbar"><button id="saveProjectBlogs">Save featured blogs</button></div>';
      $('saveProject').onclick = async () => {
        await api('/admin/projects/' + id, { method: 'PATCH', body: JSON.stringify({
          isVisible: $('projectVisible').checked,
          titleKoOverride: emptyToNull($('projectKo').value),
          titleEnOverride: emptyToNull($('projectEn').value),
          titleBriefOverride: emptyToNull($('projectBrief').value),
          description: $('projectDescription').value
        }) });
        await loadProjects();
      };
      $('addProjectPeriod').onclick = () => {
        $('projectPeriods').insertAdjacentHTML('beforeend', periodRowHtml({ label: '', startedAt: '', endedAt: '' }));
      };
      $('saveProjectPeriods').onclick = async () => {
        await api('/admin/projects/' + id + '/periods', {
          method: 'PUT',
          body: JSON.stringify({ periods: collectProjectPeriods() }),
        });
        await showProject(id);
      };
      $('saveProjectParticipants').onclick = async () => {
        await api('/admin/projects/' + id + '/participants', {
          method: 'PUT',
          body: JSON.stringify({ participants: collectCheckedItems('projectParticipant', 'crewSourceId') }),
        });
        await showProject(id);
      };
      $('saveProjectBlogs').onclick = async () => {
        await api('/admin/projects/' + id + '/featured-blogs', {
          method: 'PUT',
          body: JSON.stringify({ blogs: collectCheckedItems('projectBlog', 'blogPostSourceId').map(({ blogPostSourceId }, index) => ({ blogPostSourceId, sortOrder: index })) }),
        });
        await showProject(id);
      };
    }
    async function loadBlogs() {
      setStatus('blogStatus', '...');
      try {
        state.blogs = (await api('/admin/blogs')).data;
        $('blogList').innerHTML = state.blogs.map((blog) => rowHtml(blog.id, blog.title, blog.projectName || '')).join('');
        setStatus('blogStatus', state.blogs.length + ' rows');
      } catch (error) { setStatus('blogStatus', error.message, true); }
    }
    function rowHtml(id, title, meta) {
      return '<div class="row"><div><div class="title">' + esc(title || '') + '</div><div class="meta">' + esc(meta || '') + '</div></div><button data-id="' + esc(id) + '">Open</button></div>';
    }
    function checkboxListHtml(name, items, selectedIds, labeler) {
      if (!items.length) return '<div class="meta">No rows</div>';
      return items.map((item, index) =>
        '<label class="inline"><input type="checkbox" name="' + esc(name) + '" data-id="' + esc(item.id) + '" data-order="' + index + '" ' + (selectedIds.has(item.id) ? 'checked' : '') + '> ' + esc(labeler(item) || item.id) + '</label>'
      ).join('');
    }
    function termTeamRowHtml(item) {
      return '<div class="toolbar term-row">'
        + '<input data-field="generation" inputmode="numeric" placeholder="Generation" value="' + esc(item.generation ?? '') + '">'
        + '<input data-field="activityTerm" placeholder="Activity term" value="' + esc(item.activityTerm || '') + '">'
        + '<input data-field="teamName" placeholder="Team" value="' + esc(item.teamName || '') + '">'
        + '</div>';
    }
    function periodRowHtml(item) {
      return '<div class="toolbar period-row">'
        + '<input data-field="label" placeholder="Label" value="' + esc(item.label || '') + '">'
        + '<input data-field="startedAt" placeholder="Started at" value="' + esc(item.startedAt || '') + '">'
        + '<input data-field="endedAt" placeholder="Ended at" value="' + esc(item.endedAt || '') + '">'
        + '</div>';
    }
    function collectCrewTermTeams() {
      return Array.from(document.querySelectorAll('.term-row')).map((row) => ({
        generation: Number(row.querySelector('[data-field="generation"]').value),
        activityTerm: row.querySelector('[data-field="activityTerm"]').value.trim(),
        teamName: row.querySelector('[data-field="teamName"]').value.trim(),
      })).filter((item) => Number.isInteger(item.generation) && item.activityTerm && item.teamName);
    }
    function collectProjectPeriods() {
      return Array.from(document.querySelectorAll('.period-row')).map((row, index) => ({
        label: emptyToNull(row.querySelector('[data-field="label"]').value),
        startedAt: row.querySelector('[data-field="startedAt"]').value.trim(),
        endedAt: emptyToNull(row.querySelector('[data-field="endedAt"]').value),
        sortOrder: index,
      })).filter((item) => item.startedAt);
    }
    function collectCheckedItems(name, idField) {
      return Array.from(document.querySelectorAll('input[name="' + name + '"]')).map((input, index) => ({
        [idField]: input.dataset.id,
        isVisible: input.checked,
        sortOrder: index,
      }));
    }
    function esc(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    }
    function emptyToNull(value) { return value.trim() ? value : null; }
    $('refreshCrews').onclick = loadCrews;
    $('refreshProjects').onclick = loadProjects;
    $('refreshBlogs').onclick = loadBlogs;
    boot();
  </script>
</body>
</html>`;

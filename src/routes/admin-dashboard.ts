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
  <title>Aolda 관리자 콘솔</title>
  <style>
    :root {
      color-scheme: light;
      --background: #f8fafc;
      --foreground: #0f172a;
      --card: #ffffff;
      --card-foreground: #0f172a;
      --muted: #f1f5f9;
      --muted-foreground: #64748b;
      --border: #e2e8f0;
      --input: #cbd5e1;
      --primary: #0f172a;
      --primary-foreground: #ffffff;
      --secondary: #f8fafc;
      --accent: #ecfeff;
      --accent-foreground: #0e7490;
      --destructive: #dc2626;
      --ring: #38bdf8;
      --radius: 18px;
      --shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--background);
      color: var(--foreground);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      letter-spacing: 0;
    }
    button, input, textarea, select { font: inherit; }
    button {
      min-height: 38px;
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 0 14px;
      background: var(--card);
      color: var(--foreground);
      cursor: pointer;
      font-weight: 650;
    }
    button:hover { background: var(--muted); }
    button.primary {
      background: var(--primary);
      border-color: var(--primary);
      color: var(--primary-foreground);
    }
    button.ghost {
      background: transparent;
      border-color: transparent;
      color: var(--muted-foreground);
    }
    button:focus, input:focus, textarea:focus {
      outline: 2px solid var(--ring);
      outline-offset: 2px;
    }
    header {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      border-bottom: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.86);
      backdrop-filter: blur(14px);
      position: sticky;
      top: 0;
      z-index: 2;
    }
    h1, h2, h3 { margin: 0; color: var(--card-foreground); }
    h1 { font-size: 19px; font-weight: 800; }
    h2 { font-size: 18px; font-weight: 800; }
    h3 { font-size: 15px; font-weight: 800; }
    main {
      display: grid;
      grid-template-columns: 250px minmax(0, 1fr);
      min-height: calc(100vh - 64px);
    }
    nav {
      border-right: 1px solid var(--border);
      padding: 18px;
      background: #ffffff;
    }
    nav button {
      width: 100%;
      justify-content: flex-start;
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      border-radius: 14px;
      padding: 0 14px;
      color: var(--muted-foreground);
    }
    nav button.active {
      background: var(--primary);
      border-color: var(--primary);
      color: var(--primary-foreground);
    }
    section { padding: 22px; }
    label {
      display: block;
      margin: 14px 0 6px;
      color: var(--muted-foreground);
      font-size: 12px;
      font-weight: 700;
    }
    input, textarea, select {
      width: 100%;
      min-height: 38px;
      border: 1px solid var(--input);
      border-radius: 14px;
      background: #ffffff;
      color: var(--foreground);
      padding: 8px 12px;
    }
    textarea { min-height: 112px; resize: vertical; }
    input[type="checkbox"] {
      width: 18px;
      min-height: 18px;
      accent-color: var(--primary);
      flex: 0 0 auto;
    }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
      font-size: 13px;
    }
    .hidden { display: none !important; }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }
    .page-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 18px;
    }
    .page-subtitle {
      margin-top: 5px;
      color: var(--muted-foreground);
      font-size: 13px;
    }
    .grid {
      display: grid;
      grid-template-columns: minmax(300px, 430px) minmax(0, 1fr);
      gap: 18px;
      align-items: start;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      min-height: 120px;
      overflow: hidden;
    }
    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 16px;
      border-bottom: 1px solid var(--border);
    }
    .content { padding: 16px; }
    .list { max-height: calc(100vh - 190px); overflow: auto; }
    .row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
    }
    .row.selectable {
      grid-template-columns: 22px minmax(0, 1fr) auto;
    }
    .row:last-child { border-bottom: 0; }
    .title { font-weight: 750; overflow-wrap: anywhere; }
    .meta {
      margin-top: 4px;
      color: var(--muted-foreground);
      font-size: 12px;
      overflow-wrap: anywhere;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      border-radius: 999px;
      padding: 0 10px;
      background: var(--muted);
      color: var(--muted-foreground);
      font-size: 12px;
      font-weight: 750;
      white-space: nowrap;
    }
    .badge.public { background: #dcfce7; color: #166534; }
    .badge.private { background: #fee2e2; color: #991b1b; }
    .badge.readonly { background: var(--accent); color: var(--accent-foreground); }
    .inline {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-top: 10px;
      color: var(--foreground);
      font-size: 13px;
    }
    .check-list {
      display: grid;
      gap: 8px;
      margin-top: 8px;
    }
    .check-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: 16px;
      background: var(--secondary);
    }
    .blog-group {
      border: 1px solid var(--border);
      border-radius: 16px;
      background: var(--secondary);
      margin-top: 10px;
      overflow: hidden;
    }
    .blog-group summary {
      cursor: pointer;
      padding: 12px 14px;
      font-weight: 800;
      color: var(--foreground);
    }
    .blog-group .check-list {
      padding: 0 12px 12px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 88px minmax(180px, 1fr) minmax(160px, 1fr);
      gap: 10px;
      margin-bottom: 10px;
      align-items: center;
    }
    .term-card {
      display: grid;
      grid-template-columns: 90px minmax(0, 1fr) 130px;
      gap: 12px;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
    }
    .term-card:last-child { border-bottom: 0; }
    .status {
      min-height: 20px;
      color: var(--muted-foreground);
      font-size: 12px;
      margin-left: auto;
    }
    .danger { color: var(--destructive); }
    .muted { color: var(--muted-foreground); }
    .login {
      max-width: 400px;
      margin: 12vh auto;
      padding: 22px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 24px;
      box-shadow: var(--shadow);
    }
    @media (max-width: 880px) {
      main { grid-template-columns: 1fr; }
      nav {
        border-right: 0;
        border-bottom: 1px solid var(--border);
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      nav button { margin-bottom: 0; }
      .grid { grid-template-columns: 1fr; }
      .list { max-height: none; }
      .page-head { display: block; }
      .form-row { grid-template-columns: 1fr; }
      .term-card { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Aolda 관리자 콘솔</h1>
    <div class="toolbar">
      <span id="session" class="muted"></span>
      <button id="logout" class="ghost hidden">로그아웃</button>
    </div>
  </header>

  <div id="loginView" class="login">
    <h2>관리자 로그인</h2>
    <form id="loginForm">
      <label>이메일</label>
      <input id="email" autocomplete="username" value="admin" />
      <label>비밀번호</label>
      <input id="password" type="password" autocomplete="current-password" value="admin" />
      <div class="toolbar" style="margin-top:16px">
        <button type="submit" class="primary">로그인</button>
        <span id="loginStatus" class="status"></span>
      </div>
    </form>
  </div>

  <main id="appView" class="hidden">
    <nav>
      <button data-tab="sync" data-loader="loadSync" class="active">동기화</button>
      <button data-tab="activityTerms" data-loader="loadActivityTerms">활동기수</button>
      <button data-tab="crews" data-loader="loadCrews">크루 관리</button>
      <button data-tab="projects" data-loader="loadProjects">프로젝트 관리</button>
      <button data-tab="cloudProducts" data-loader="loadCloudProducts">제품 관리</button>
      <button data-tab="blogs" data-loader="loadBlogs">블로그 관리</button>
    </nav>
    <section>
      <div id="sync" class="tab">
        <div class="page-head">
          <div>
            <h2>동기화</h2>
            <div class="page-subtitle">Notion 원천 데이터를 관리자 콘솔 DB로 수동 동기화합니다.</div>
          </div>
          <button id="syncNow" class="primary">실행</button>
        </div>
        <div class="card"><pre id="syncOutput" class="content muted"></pre></div>
      </div>

      <div id="activityTerms" class="tab hidden">
        <div class="page-head">
          <div>
            <h2>활동기수</h2>
            <div class="page-subtitle">Notion에서 수집된 작성기수와 기수 매핑값입니다.</div>
          </div>
          <div class="toolbar">
            <span class="badge readonly">읽기 전용</span>
            <button id="refreshActivityTerms">새로고침</button>
          </div>
        </div>
        <div class="card">
          <div class="card-head">
            <h3>전체 활동기수</h3>
            <span id="activityTermStatus" class="status"></span>
          </div>
          <div id="activityTermList" class="list"></div>
        </div>
      </div>

      <div id="crews" class="tab hidden">
        <div class="page-head">
          <div>
            <h2>크루 관리</h2>
            <div class="page-subtitle">공개 프로필, 기수별 팀, 프로젝트와 블로그 공개 여부를 관리합니다.</div>
          </div>
          <div class="toolbar">
            <div id="crewBulkToolbar" class="toolbar hidden" style="margin:0">
              <span id="crewBulkStatus" class="badge"></span>
              <button id="bulkShowCrews">선택대상 일괄공개</button>
              <button id="bulkHideCrews">선택대상 일괄비공개</button>
            </div>
            <input id="crewSearch" style="width:260px" placeholder="크루명, 참여 프로젝트명 검색" />
            <button id="refreshCrews">새로고침</button>
          </div>
        </div>
        <div class="grid">
          <div class="card">
            <div class="card-head">
              <div class="toolbar" style="margin:0">
                <input id="crewBulkAll" type="checkbox" title="전체 선택" />
                <h3>크루 목록</h3>
              </div>
              <span id="crewStatus" class="status"></span>
            </div>
            <div class="list" id="crewList"></div>
          </div>
          <div class="card"><div class="content" id="crewDetail"></div></div>
        </div>
      </div>

      <div id="projects" class="tab hidden">
        <div class="page-head">
          <div>
            <h2>프로젝트 관리</h2>
            <div class="page-subtitle">프로젝트 공개 정보, 진행기간, 참여자와 대표 블로그를 관리합니다.</div>
          </div>
          <div class="toolbar">
            <div id="projectBulkToolbar" class="toolbar hidden" style="margin:0">
              <span id="projectBulkStatus" class="badge"></span>
              <button id="bulkShowProjects">선택대상 일괄공개</button>
              <button id="bulkHideProjects">선택대상 일괄비공개</button>
            </div>
            <input id="projectSearch" style="width:260px" placeholder="프로젝트명, 크루명 검색" />
            <button id="refreshProjects">새로고침</button>
          </div>
        </div>
        <div class="grid">
          <div class="card">
            <div class="card-head">
              <div class="toolbar" style="margin:0">
                <input id="projectBulkAll" type="checkbox" title="전체 선택" />
                <h3>프로젝트 목록</h3>
              </div>
              <span id="projectStatus" class="status"></span>
            </div>
            <div class="list" id="projectList"></div>
          </div>
          <div class="card"><div class="content" id="projectDetail"></div></div>
        </div>
      </div>

      <div id="blogs" class="tab hidden">
        <div class="page-head">
          <div>
            <h2>블로그 관리</h2>
            <div class="page-subtitle">Notion에서 수집된 블로그 원천 목록입니다.</div>
          </div>
          <div class="toolbar">
            <input id="blogSearch" style="width:280px" placeholder="블로그 제목, 프로젝트명, 크루명 검색" />
            <button id="refreshBlogs">새로고침</button>
          </div>
        </div>
        <div class="grid">
          <div class="card">
            <div class="card-head">
              <h3>블로그 목록</h3>
              <span id="blogStatus" class="status"></span>
            </div>
            <div class="list" id="blogList"></div>
          </div>
          <div class="card"><div class="content" id="blogDetail"></div></div>
        </div>
      </div>

      <div id="cloudProducts" class="tab hidden">
        <div class="page-head">
          <div>
            <h2>제품 관리</h2>
            <div class="page-subtitle">클라우드 제품 공개 정보와 연결 프로젝트, 참여자, 관련 서비스를 관리합니다.</div>
          </div>
          <div class="toolbar">
            <div id="cloudProductBulkToolbar" class="toolbar hidden" style="margin:0">
              <span id="cloudProductBulkStatus" class="badge"></span>
              <button id="bulkShowCloudProducts">선택대상 일괄공개</button>
              <button id="bulkHideCloudProducts">선택대상 일괄비공개</button>
            </div>
            <input id="cloudProductSearch" style="width:280px" placeholder="제품명, 카테고리, 프로젝트명 검색" />
            <button id="newCloudProduct" class="primary">제품 등록</button>
            <button id="refreshCloudProducts">새로고침</button>
          </div>
        </div>
        <div class="grid">
          <div class="card">
            <div class="card-head">
              <div class="toolbar" style="margin:0">
                <input id="cloudProductBulkAll" type="checkbox" title="전체 선택" />
                <h3>제품 목록</h3>
              </div>
              <span id="cloudProductStatus" class="status"></span>
            </div>
            <div class="list" id="cloudProductList"></div>
          </div>
          <div class="card"><div class="content" id="cloudProductDetail"></div></div>
        </div>
      </div>
    </section>
  </main>

  <script>
    const state = {
      token: localStorage.getItem('adminToken') || '',
      activityTerms: [],
      crews: [],
      projects: [],
      cloudProducts: [],
      blogs: [],
    };
    const $ = (id) => document.getElementById(id);

    function setStatus(id, value, danger = false) {
      const el = $(id);
      el.textContent = value || '';
      el.className = danger ? 'status danger' : 'status';
    }
    function authHeaders() {
      return { authorization: 'Bearer ' + state.token };
    }
    async function api(path, options = {}) {
      const headers = { ...authHeaders(), ...(options.headers || {}) };
      if (options.body && !headers['content-type']) {
        headers['content-type'] = 'application/json';
      }
      const res = await fetch(path, { ...options, headers });
      const text = await res.text();
      const contentType = res.headers.get('content-type') || '';
      let data = null;
      if (text && contentType.includes('application/json')) {
        data = JSON.parse(text);
      } else if (text) {
        data = { message: text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300) };
      }
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
      button.addEventListener('click', async () => {
        document.querySelectorAll('nav button').forEach((item) => item.classList.remove('active'));
        document.querySelectorAll('.tab').forEach((item) => item.classList.add('hidden'));
        button.classList.add('active');
        $(button.dataset.tab).classList.remove('hidden');
        if (button.dataset.loader && window[button.dataset.loader]) {
          await window[button.dataset.loader]();
        }
      });
    });

    async function loadSync() {}
    $('syncNow').addEventListener('click', async () => {
      $('syncOutput').textContent = '동기화 중입니다...';
      try {
        const result = await api('/admin/sync/notion', { method: 'POST' });
        $('syncOutput').textContent = JSON.stringify(result, null, 2);
        await Promise.all([loadActivityTerms(), loadCrews(), loadProjects(), loadCloudProducts(), loadBlogs()]);
      } catch (error) {
        $('syncOutput').textContent = error.message;
      }
    });

    async function loadActivityTerms() {
      setStatus('activityTermStatus', '불러오는 중...');
      try {
        state.activityTerms = (await api('/admin/activity-terms')).data;
        $('activityTermList').innerHTML = state.activityTerms.length
          ? state.activityTerms.map(activityTermRowHtml).join('')
          : emptyHtml('동기화된 활동기수가 없습니다.');
        setStatus('activityTermStatus', state.activityTerms.length + '개');
      } catch (error) {
        setStatus('activityTermStatus', error.message, true);
      }
    }

    async function loadCrews() {
      setStatus('crewStatus', '불러오는 중...');
      try {
        state.crews = (await api('/admin/crews')).data;
        await ensureProjectsData();
        renderCrewList();
      } catch (error) {
        setStatus('crewStatus', error.message, true);
      }
    }
    function renderCrewList() {
      const crews = state.crews.filter(matchesCrewSearch);
      $('crewList').innerHTML = crews.length
        ? crews.map((crew) => selectableRowHtml('crewBulk', crew.id, crew.name, crewMeta(crew), visibilityBadge(crew.adminProfile?.isVisible))).join('')
        : emptyHtml(state.crews.length ? '검색 결과가 없습니다.' : '동기화된 크루가 없습니다.');
      $('crewList').querySelectorAll('button').forEach((button) => button.addEventListener('click', () => showCrew(button.dataset.id)));
      bindBulkSelection('crewBulk', 'crewBulkToolbar', 'crewBulkStatus');
      setStatus('crewStatus', crews.length + '명');
    }

    async function showCrew(id) {
      const crew = (await api('/admin/crews/' + id)).data;
      if (state.projects.length === 0) await loadProjects();
      if (state.blogs.length === 0) await loadBlogs();
      const termTeams = crew.termTeamOverrides.length > 0 ? crew.termTeamOverrides : crew.termTeamSources;
      const visibleBlogIds = new Set(crew.blogVisibilities.filter((item) => item.isVisible).map((item) => item.blogPostSourceId));
      const candidateProjects = state.projects.filter((project) => isCrewProjectCandidate(project, crew.id));
      const explicitProjectVisibilities = new Map(crew.projectVisibilities.map((item) => [item.projectSourceId, item.isVisible]));
      $('crewDetail').innerHTML = '<h2>' + esc(crew.name) + '</h2>'
        + '<label class="inline"><input id="crewVisible" type="checkbox" ' + (crew.adminProfile?.isVisible ? 'checked' : '') + '> 공개 프로필 사용</label>'
        + '<label>소개글</label><textarea id="crewDescription" placeholder="' + esc(crew.notionDescription || '') + '">' + esc(crew.adminProfile?.description || '') + '</textarea>'
        + '<div class="toolbar"><button id="saveCrew" class="primary">프로필 저장</button></div>'
        + '<h3>기수별 팀</h3><div class="meta">각 행은 Notion crewbook의 작성기수 기준입니다. 저장 시 Notion 팀 값도 함께 갱신됩니다.</div>'
        + '<div id="crewTermTeams" style="margin-top:12px">' + (termTeams.length ? termTeams.map(termTeamRowHtml).join('') : emptyHtml('기수별 팀 정보가 없습니다.')) + '</div>'
        + '<div class="toolbar"><button id="addCrewTerm">기수 추가</button><button id="saveCrewTerms" class="primary">기수별 팀 저장</button></div>'
        + '<h3>참여 프로젝트 공개</h3><div class="meta">프로젝트에서 참여자로 선택된 항목만 표시됩니다. 기본값은 공개이며, 체크를 해제하면 이 크루 프로필에서 숨깁니다.</div>'
        + '<div id="crewProjects" class="check-list">' + projectVisibilityListHtml(candidateProjects, explicitProjectVisibilities) + '</div>'
        + '<div class="toolbar"><button id="saveCrewProjects" class="primary">프로젝트 공개 저장</button></div>'
        + '<h3>공개 블로그</h3><div class="meta">작성자로 연결된 블로그만 프로젝트별로 표시됩니다.</div><div id="crewBlogs">' + crewBlogGroupsHtml(crew, visibleBlogIds) + '</div>'
        + '<div class="toolbar"><button id="saveCrewBlogs" class="primary">블로그 공개 저장</button></div>';
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
          body: JSON.stringify({ projects: collectCheckedItemsIn('crewProjects', 'crewProject', 'projectSourceId') }),
        });
        await showCrew(id);
      };
      $('saveCrewBlogs').onclick = async () => {
        await api('/admin/crews/' + id + '/blogs', {
          method: 'PUT',
          body: JSON.stringify({ blogs: collectCheckedItemsIn('crewBlogs', 'crewBlog', 'blogPostSourceId') }),
        });
        await showCrew(id);
      };
    }

    async function loadProjects() {
      setStatus('projectStatus', '불러오는 중...');
      try {
        state.projects = (await api('/admin/projects')).data;
        await ensureCrewsData();
        renderProjectList();
      } catch (error) {
        setStatus('projectStatus', error.message, true);
      }
    }
    function renderProjectList() {
      const projects = state.projects.filter(matchesProjectSearch);
      $('projectList').innerHTML = projects.length
        ? projects.map((project) => selectableRowHtml('projectBulk', project.id, project.titleKo, projectMeta(project), visibilityBadge(project.adminProfile?.isVisible))).join('')
        : emptyHtml(state.projects.length ? '검색 결과가 없습니다.' : '동기화된 프로젝트가 없습니다.');
      $('projectList').querySelectorAll('button').forEach((button) => button.addEventListener('click', () => showProject(button.dataset.id)));
      bindBulkSelection('projectBulk', 'projectBulkToolbar', 'projectBulkStatus');
      setStatus('projectStatus', projects.length + '개');
    }

    async function showProject(id) {
      const project = (await api('/admin/projects/' + id)).data;
      if (state.crews.length === 0) await loadCrews();
      if (state.blogs.length === 0) await loadBlogs();
      const participantIds = resolveProjectParticipantIds(project, state.crews);
      const featuredBlogIds = new Set(project.featuredBlogs.map((item) => item.blogPostSourceId));
      const candidateBlogs = blogsForProject(project);
      const periods = project.periodOverrides.length > 0 ? project.periodOverrides : [{ label: '', startedAt: project.startedAt || '', endedAt: project.endedAt || '' }];
      $('projectDetail').innerHTML = '<h2>' + esc(project.titleKo) + '</h2>'
        + '<label class="inline"><input id="projectVisible" type="checkbox" ' + (project.adminProfile?.isVisible ? 'checked' : '') + '> 공개 프로젝트 사용</label>'
        + '<label>한글 제목</label><input id="projectKo" placeholder="' + esc(project.titleKo || '') + '" value="' + esc(project.adminProfile?.titleKoOverride || '') + '">'
        + '<label>영문 제목</label><input id="projectEn" placeholder="' + esc(project.titleEn || '') + '" value="' + esc(project.adminProfile?.titleEnOverride || '') + '">'
        + '<label>요약 제목</label><input id="projectBrief" placeholder="' + esc(project.titleBrief || '') + '" value="' + esc(project.adminProfile?.titleBriefOverride || '') + '">'
        + '<label>소개글</label><textarea id="projectDescription">' + esc(project.adminProfile?.description || '') + '</textarea>'
        + '<div class="toolbar"><button id="saveProject" class="primary">프로젝트 정보 저장</button></div>'
        + '<h3>진행기간</h3><div id="projectPeriods">' + periods.map(periodRowHtml).join('') + '</div>'
        + '<div class="toolbar"><button id="addProjectPeriod">기간 추가</button><button id="saveProjectPeriods" class="primary">진행기간 저장</button></div>'
        + '<h3>참여자</h3><div id="projectParticipants" class="check-list">' + checkboxListHtml('projectParticipant', state.crews, participantIds, (item) => item.name) + '</div>'
        + '<div class="toolbar"><button id="saveProjectParticipants" class="primary">참여자 저장</button></div>'
        + '<h3>대표 블로그</h3><div class="meta">현재 프로젝트에 기록된 블로그만 표시됩니다.</div><div id="projectBlogs" class="check-list">' + checkboxListHtml('projectBlog', candidateBlogs, featuredBlogIds, (item) => item.title) + '</div>'
        + '<div class="toolbar"><button id="saveProjectBlogs" class="primary">대표 블로그 저장</button></div>';
      $('saveProject').onclick = async () => {
        await api('/admin/projects/' + id, { method: 'PATCH', body: JSON.stringify({
          isVisible: $('projectVisible').checked,
          titleKoOverride: emptyToNull($('projectKo').value),
          titleEnOverride: emptyToNull($('projectEn').value),
          titleBriefOverride: emptyToNull($('projectBrief').value),
          description: $('projectDescription').value,
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
          body: JSON.stringify({ participants: collectCheckedItemsIn('projectParticipants', 'projectParticipant', 'crewSourceId') }),
        });
        await loadProjects();
        await showProject(id);
      };
      $('saveProjectBlogs').onclick = async () => {
        await api('/admin/projects/' + id + '/featured-blogs', {
          method: 'PUT',
          body: JSON.stringify({ blogs: collectCheckedItemsIn('projectBlogs', 'projectBlog', 'blogPostSourceId').filter((item) => item.isVisible).map(({ blogPostSourceId }, index) => ({ blogPostSourceId, sortOrder: index })) }),
        });
        await showProject(id);
      };
    }

    async function loadCloudProducts() {
      setStatus('cloudProductStatus', '불러오는 중...');
      try {
        state.cloudProducts = (await api('/admin/cloud-products')).data;
        await ensureProjectsData();
        renderCloudProductList();
      } catch (error) {
        setStatus('cloudProductStatus', error.message, true);
      }
    }
    function renderCloudProductList() {
      const products = state.cloudProducts.filter(matchesCloudProductSearch);
      $('cloudProductList').innerHTML = products.length
        ? products.map((product) => selectableRowHtml('cloudProductBulk', product.id, product.productName, cloudProductMeta(product), visibilityBadge(product.isVisible))).join('')
        : emptyHtml(state.cloudProducts.length ? '검색 결과가 없습니다.' : '등록된 제품이 없습니다.');
      $('cloudProductList').querySelectorAll('button').forEach((button) => button.addEventListener('click', () => showCloudProduct(button.dataset.id)));
      bindBulkSelection('cloudProductBulk', 'cloudProductBulkToolbar', 'cloudProductBulkStatus');
      setStatus('cloudProductStatus', products.length + '개');
    }
    async function showCloudProduct(id) {
      const product = id === 'new'
        ? emptyCloudProduct()
        : (await api('/admin/cloud-products/' + id)).data;
      await Promise.all([ensureProjectsData(), ensureCrewsData()]);
      const isNew = id === 'new';
      $('cloudProductDetail').innerHTML = '<h2>' + (isNew ? '제품 등록' : esc(product.productName)) + '</h2>'
        + '<label class="inline"><input id="cloudProductVisible" type="checkbox" ' + (product.isVisible ? 'checked' : '') + '> 공개 제품 사용</label>'
        + '<label>카테고리 코드</label><input id="cloudProductCategoryCode" placeholder="CAT_PLATFORM" value="' + esc(product.categoryCode || product.category?.code || '') + '">'
        + '<label>카테고리명</label><input id="cloudProductCategoryTitle" placeholder="플랫폼" value="' + esc(product.category?.categoryTitle || '') + '">'
        + '<label>카테고리 이미지 URL</label><input id="cloudProductCategoryImage" value="' + esc(product.category?.categoryImageUrl || '') + '">'
        + '<label>제품명</label><input id="cloudProductName" value="' + esc(product.productName || '') + '">'
        + '<label>제품 아이콘 URL</label><input id="cloudProductIcon" value="' + esc(product.productIconUrl || '') + '">'
        + '<label>클라우드 링크</label><input id="cloudProductCloudLink" value="' + esc(product.cloudLink || '') + '">'
        + '<label>연결 프로젝트</label><select id="cloudProductProject"><option value="">연결 안 함</option>' + projectOptionsHtml(product.projectSourceId || '') + '</select>'
        + '<label>정렬순서</label><input id="cloudProductSortOrder" inputmode="numeric" value="' + esc(product.sortOrder ?? 0) + '">'
        + '<label>목록 설명</label><textarea id="cloudProductDescription">' + esc(product.description || '') + '</textarea>'
        + '<label>상세 본문</label><textarea id="cloudProductContent">' + esc(product.content || '') + '</textarea>'
        + '<div class="toolbar"><button id="saveCloudProduct" class="primary">' + (isNew ? '제품 등록' : '제품 저장') + '</button>' + (isNew ? '' : '<button id="deleteCloudProduct">삭제</button>') + '</div>'
        + '<h3>참여자</h3><div class="meta">연결 프로젝트를 선택하면 해당 프로젝트 참여자가 기본값으로 채워집니다. 기본값으로 들어온 참여자도 삭제할 수 있습니다.</div>'
        + '<div class="toolbar"><select id="cloudProductCrewPicker" style="width:280px"><option value="">크루 선택</option>' + crewOptionsHtml() + '</select><button id="addCloudProductCrew">크루 추가</button><button id="addManualCloudProductParticipant">수기입력</button></div>'
        + '<div id="cloudProductParticipants">' + ((product.participants || []).length ? product.participants.map(cloudProductParticipantRowHtml).join('') : emptyHtml('참여자를 추가하세요.')) + '</div>'
        + '<h3>관련 서비스</h3><div id="cloudProductRelatedServices">' + ((product.relatedServices || []).length ? product.relatedServices.map(cloudProductRelatedServiceRowHtml).join('') : cloudProductRelatedServiceRowHtml({})) + '</div>'
        + '<div class="toolbar"><button id="addCloudProductRelatedService">관련 서비스 추가</button></div>';
      bindCloudProductParticipantControls();
      $('cloudProductProject').onchange = () => {
        setCloudProductParticipants(projectDefaultParticipants($('cloudProductProject').value));
      };
      $('saveCloudProduct').onclick = async () => {
        const payload = collectCloudProductPayload();
        const path = isNew ? '/admin/cloud-products' : '/admin/cloud-products/' + id;
        await api(path, { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(payload) });
        await loadCloudProducts();
        $('cloudProductDetail').innerHTML = emptyHtml(isNew ? '제품이 등록되었습니다.' : '제품이 저장되었습니다.');
      };
      if (!isNew) {
        $('deleteCloudProduct').onclick = async () => {
          if (!confirm('이 제품을 삭제할까요?')) return;
          await api('/admin/cloud-products/' + id, { method: 'DELETE' });
          await loadCloudProducts();
          $('cloudProductDetail').innerHTML = emptyHtml('제품이 삭제되었습니다.');
        };
      }
      $('addCloudProductCrew').onclick = () => {
        const crew = state.crews.find((item) => item.id === $('cloudProductCrewPicker').value);
        if (!crew) return;
        appendCloudProductParticipant(crewToCloudProductParticipant(crew));
      };
      $('addManualCloudProductParticipant').onclick = () => {
        appendCloudProductParticipant({});
      };
      $('addCloudProductRelatedService').onclick = () => {
        $('cloudProductRelatedServices').insertAdjacentHTML('beforeend', cloudProductRelatedServiceRowHtml({}));
      };
    }

    async function loadBlogs() {
      setStatus('blogStatus', '불러오는 중...');
      try {
        state.blogs = (await api('/admin/blogs')).data;
        await Promise.all([ensureCrewsData(), ensureProjectsData()]);
        renderBlogList();
      } catch (error) {
        setStatus('blogStatus', error.message, true);
      }
    }
    function renderBlogList() {
      const blogs = state.blogs.filter(matchesBlogSearch);
      $('blogList').innerHTML = blogs.length
        ? blogs.map((blog) => rowHtml(blog.id, blog.title, blogMeta(blog), '<span class="badge">원천</span>')).join('')
        : emptyHtml(state.blogs.length ? '검색 결과가 없습니다.' : '동기화된 블로그가 없습니다.');
      $('blogList').querySelectorAll('button').forEach((button) => button.addEventListener('click', () => showBlog(button.dataset.id)));
      setStatus('blogStatus', blogs.length + '개');
    }
    function showBlog(id) {
      const blog = state.blogs.find((item) => item.id === id);
      if (!blog) {
        $('blogDetail').innerHTML = emptyHtml('블로그를 찾을 수 없습니다.');
        return;
      }

      $('blogDetail').innerHTML = '<h2>' + esc(blog.title) + '</h2>'
        + '<div class="meta" style="margin-top:8px">' + esc(blogMeta(blog)) + '</div>'
        + '<div class="content meta" style="padding-left:0">추가 관리 항목은 추후 제공 예정입니다.</div>';
    }

    function activityTermRowHtml(item) {
      return '<div class="term-card">'
        + '<span class="badge readonly">' + esc(item.generation) + '기</span>'
        + '<div><div class="title">' + esc(item.activityTerm) + '</div><div class="meta">팀: ' + esc(item.teams.length ? item.teams.join(', ') : '미지정') + '</div></div>'
        + '<div class="meta">크루 ' + esc(item.crewCount) + '명</div>'
        + '</div>';
    }
    function rowHtml(id, title, meta, badgeHtml = '') {
      return '<div class="row"><div><div class="title">' + esc(title || '') + '</div><div class="meta">' + esc(meta || '') + '</div></div><div class="toolbar" style="margin:0">' + badgeHtml + '<button data-id="' + esc(id) + '">열기</button></div></div>';
    }
    function selectableRowHtml(name, id, title, meta, badgeHtml = '') {
      return '<div class="row selectable"><input type="checkbox" name="' + esc(name) + '" data-id="' + esc(id) + '"><div><div class="title">' + esc(title || '') + '</div><div class="meta">' + esc(meta || '') + '</div></div><div class="toolbar" style="margin:0">' + badgeHtml + '<button data-id="' + esc(id) + '">열기</button></div></div>';
    }
    function checkboxListHtml(name, items, selectedIds, labeler) {
      if (!items.length) return emptyHtml('표시할 항목이 없습니다.');
      return items.map((item, index) =>
        '<label class="check-item"><input type="checkbox" name="' + esc(name) + '" data-id="' + esc(item.id) + '" data-order="' + index + '" ' + (selectedIds.has(item.id) ? 'checked' : '') + '><span><strong>' + esc(labeler(item) || item.id) + '</strong></span></label>'
      ).join('');
    }
    function projectVisibilityListHtml(projects, explicitProjectVisibilities) {
      if (!projects.length) return emptyHtml('이 크루가 참여자로 등록된 프로젝트가 없습니다.');
      return projects.map((project, index) => {
        const checked = explicitProjectVisibilities.has(project.id) ? explicitProjectVisibilities.get(project.id) : true;
        return '<label class="check-item"><input type="checkbox" name="crewProject" data-id="' + esc(project.id) + '" data-order="' + index + '" ' + (checked ? 'checked' : '') + '><span><strong>' + esc(project.titleKo) + '</strong><div class="meta">' + esc(projectMeta(project)) + '</div></span></label>';
      }).join('');
    }
    function crewBlogGroupsHtml(crew, visibleBlogIds) {
      const blogs = state.blogs.filter((blog) => crewMatchesParticipantRefs(crew, blog.participantRefs));
      if (!blogs.length) return emptyHtml('작성자로 연결된 블로그가 없습니다.');
      const groups = new Map();
      for (const blog of blogs) {
        const projectName = blog.projectName || '프로젝트 미지정';
        groups.set(projectName, [...(groups.get(projectName) || []), blog]);
      }
      return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right, 'ko')).map(([projectName, items]) =>
        '<details class="blog-group"><summary>&gt; ' + esc(projectName) + ' -----------</summary><div class="check-list">'
        + items.map((blog, index) => '<label class="check-item"><input type="checkbox" name="crewBlog" data-id="' + esc(blog.id) + '" data-order="' + index + '" ' + (visibleBlogIds.has(blog.id) ? 'checked' : '') + '><span><strong>' + esc(blog.title) + '</strong><div class="meta">' + esc(blogMeta(blog)) + '</div></span></label>').join('')
        + '</div></details>'
      ).join('');
    }
    function termTeamRowHtml(item) {
      return '<div class="form-row term-row">'
        + '<input data-field="generation" inputmode="numeric" placeholder="기수" value="' + esc(item.generation ?? '') + '">'
        + '<input data-field="activityTerm" placeholder="Notion 작성기수" value="' + esc(item.activityTerm || '') + '">'
        + '<input data-field="teamName" placeholder="팀" value="' + esc(item.teamName || '') + '">'
        + '</div>';
    }
    function periodRowHtml(item) {
      return '<div class="form-row period-row">'
        + '<input data-field="label" placeholder="라벨" value="' + esc(item.label || '') + '">'
        + '<input data-field="startedAt" placeholder="시작 기수" value="' + esc(item.startedAt || '') + '">'
        + '<input data-field="endedAt" placeholder="종료 기수" value="' + esc(item.endedAt || '') + '">'
        + '</div>';
    }
    function cloudProductParticipantRowHtml(item) {
      const sourceLabel = item.crewSourceId ? '크루' : '수기';
      return '<div class="form-row cloud-product-participant-row">'
        + '<input data-field="crewPublicId" inputmode="numeric" placeholder="공개 crewId" value="' + esc(item.crewPublicId ?? '') + '">'
        + '<input data-field="crewName" placeholder="이름" value="' + esc(item.crewName || '') + '">'
        + '<input data-field="profileUrl" placeholder="프로필 이미지 URL" value="' + esc(item.profileUrl || '') + '">'
        + '<input data-field="univDepartment" placeholder="학과" value="' + esc(item.univDepartment || '') + '">'
        + '<input data-field="univJoinedYear" placeholder="학번/입학년도" value="' + esc(item.univJoinedYear || '') + '">'
        + '<input data-field="crewSourceId" placeholder="CrewSource ID(선택)" value="' + esc(item.crewSourceId || '') + '">'
        + '<button type="button" class="ghost" data-remove-participant="true">' + sourceLabel + ' 삭제</button>'
        + '</div>';
    }
    function cloudProductRelatedServiceRowHtml(item) {
      return '<div class="form-row cloud-product-related-service-row">'
        + '<input data-field="pageTitle" placeholder="서비스명" value="' + esc(item.pageTitle || '') + '">'
        + '<input data-field="thumbnailUrl" placeholder="썸네일 URL" value="' + esc(item.thumbnailUrl || '') + '">'
        + '<input data-field="serviceLink" placeholder="서비스 링크" value="' + esc(item.serviceLink || '') + '">'
        + '</div>';
    }
    function projectOptionsHtml(selectedId) {
      return state.projects.map((project) =>
        '<option value="' + esc(project.id) + '" ' + (project.id === selectedId ? 'selected' : '') + '>' + esc(project.titleKo || project.id) + '</option>'
      ).join('');
    }
    function crewOptionsHtml() {
      return state.crews.map((crew) =>
        '<option value="' + esc(crew.id) + '">' + esc(crew.name || crew.id) + '</option>'
      ).join('');
    }
    function appendCloudProductParticipant(item) {
      const container = $('cloudProductParticipants');
      if (!container.querySelector('.cloud-product-participant-row')) {
        container.innerHTML = '';
      }
      container.insertAdjacentHTML('beforeend', cloudProductParticipantRowHtml(item));
      bindCloudProductParticipantControls();
    }
    function setCloudProductParticipants(items) {
      $('cloudProductParticipants').innerHTML = items.length
        ? items.map(cloudProductParticipantRowHtml).join('')
        : emptyHtml('참여자를 추가하세요.');
      bindCloudProductParticipantControls();
    }
    function bindCloudProductParticipantControls() {
      document.querySelectorAll('[data-remove-participant="true"]').forEach((button) => {
        button.onclick = () => {
          button.closest('.cloud-product-participant-row')?.remove();
          if (!$('cloudProductParticipants').querySelector('.cloud-product-participant-row')) {
            $('cloudProductParticipants').innerHTML = emptyHtml('참여자를 추가하세요.');
          }
        };
      });
    }
    function projectDefaultParticipants(projectId) {
      const project = state.projects.find((item) => item.id === projectId);
      if (!project) return [];
      return state.crews
        .filter((crew) => resolveProjectParticipantIds(project, state.crews).has(crew.id))
        .map(crewToCloudProductParticipant);
    }
    function crewToCloudProductParticipant(crew) {
      return {
        crewSourceId: crew.id,
        crewName: crew.name || '',
        profileUrl: crew.profileImageUrl || '',
        univDepartment: '',
        univJoinedYear: crew.joinedGen ? String(crew.joinedGen) : '',
      };
    }
    function emptyCloudProduct() {
      return {
        isVisible: false,
        categoryCode: '',
        category: null,
        projectSourceId: '',
        productName: '',
        productIconUrl: '',
        cloudLink: '',
        sortOrder: 0,
        description: '',
        content: '',
        participants: [],
        relatedServices: [],
      };
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
    function collectCloudProductPayload() {
      return {
        isVisible: $('cloudProductVisible').checked,
        categoryCode: $('cloudProductCategoryCode').value.trim(),
        categoryTitle: $('cloudProductCategoryTitle').value.trim(),
        categoryImageUrl: emptyToNull($('cloudProductCategoryImage').value),
        projectSourceId: emptyToNull($('cloudProductProject').value),
        productIconUrl: emptyToNull($('cloudProductIcon').value),
        productName: $('cloudProductName').value.trim(),
        description: $('cloudProductDescription').value.trim(),
        cloudLink: emptyToNull($('cloudProductCloudLink').value),
        content: $('cloudProductContent').value.trim(),
        sortOrder: Number($('cloudProductSortOrder').value || 0),
        participants: collectCloudProductParticipants(),
        relatedServices: collectCloudProductRelatedServices(),
      };
    }
    function collectCloudProductParticipants() {
      return Array.from(document.querySelectorAll('.cloud-product-participant-row')).map((row, index) => ({
        crewPublicId: numberOrNull(row.querySelector('[data-field="crewPublicId"]').value),
        crewName: row.querySelector('[data-field="crewName"]').value.trim(),
        profileUrl: emptyToNull(row.querySelector('[data-field="profileUrl"]').value),
        univDepartment: emptyToNull(row.querySelector('[data-field="univDepartment"]').value),
        univJoinedYear: emptyToNull(row.querySelector('[data-field="univJoinedYear"]').value),
        crewSourceId: emptyToNull(row.querySelector('[data-field="crewSourceId"]').value),
        sortOrder: index,
      })).filter((item) => item.crewName);
    }
    function collectCloudProductRelatedServices() {
      return Array.from(document.querySelectorAll('.cloud-product-related-service-row')).map((row, index) => ({
        pageTitle: row.querySelector('[data-field="pageTitle"]').value.trim(),
        thumbnailUrl: emptyToNull(row.querySelector('[data-field="thumbnailUrl"]').value),
        serviceLink: emptyToNull(row.querySelector('[data-field="serviceLink"]').value),
        sortOrder: index,
      })).filter((item) => item.pageTitle);
    }
    function collectCheckedItems(name, idField) {
      return Array.from(document.querySelectorAll('input[name="' + name + '"]')).map((input, index) => ({
        [idField]: input.dataset.id,
        isVisible: input.checked,
        sortOrder: index,
      }));
    }
    function collectCheckedItemsIn(containerId, name, idField) {
      return Array.from($(containerId).querySelectorAll('input[name="' + name + '"]')).map((input, index) => ({
        [idField]: input.dataset.id,
        isVisible: input.checked,
        sortOrder: index,
      }));
    }
    async function ensureCrewsData() {
      if (state.crews.length === 0) {
        state.crews = (await api('/admin/crews')).data;
      }
    }
    async function ensureProjectsData() {
      if (state.projects.length === 0) {
        state.projects = (await api('/admin/projects')).data;
      }
    }
    function collectBulkIds(name) {
      return Array.from(document.querySelectorAll('input[name="' + name + '"]:checked')).map((input) => input.dataset.id);
    }
    function bindBulkSelection(name, toolbarId, statusId) {
      document.querySelectorAll('input[name="' + name + '"]').forEach((input) => {
        input.addEventListener('change', () => updateBulkToolbar(name, toolbarId, statusId));
      });
      updateBulkToolbar(name, toolbarId, statusId);
      syncBulkAllCheckbox(name);
    }
    function updateBulkToolbar(name, toolbarId, statusId) {
      const count = collectBulkIds(name).length;
      $(toolbarId).classList.toggle('hidden', count === 0);
      $(statusId).textContent = count + '개 선택';
      syncBulkAllCheckbox(name);
    }
    function bindBulkAllCheckbox(inputId, name, toolbarId, statusId) {
      $(inputId).addEventListener('change', (event) => {
        document.querySelectorAll('input[name="' + name + '"]').forEach((input) => {
          input.checked = event.target.checked;
        });
        updateBulkToolbar(name, toolbarId, statusId);
      });
    }
    function syncBulkAllCheckbox(name) {
      const checkboxId = name === 'crewBulk' ? 'crewBulkAll' : name === 'projectBulk' ? 'projectBulkAll' : name === 'cloudProductBulk' ? 'cloudProductBulkAll' : '';
      if (!checkboxId || !$(checkboxId)) return;
      const inputs = Array.from(document.querySelectorAll('input[name="' + name + '"]'));
      const checkedCount = inputs.filter((input) => input.checked).length;
      $(checkboxId).checked = inputs.length > 0 && checkedCount === inputs.length;
      $(checkboxId).indeterminate = checkedCount > 0 && checkedCount < inputs.length;
    }
    async function updateSelectedVisibility(name, pathPrefix, isVisible, reload) {
      const ids = collectBulkIds(name);
      if (ids.length === 0) return;
      await Promise.all(ids.map((id) => api(pathPrefix + '/' + id, {
        method: 'PATCH',
        body: JSON.stringify({ isVisible }),
      })));
      await reload();
    }
    function isCrewProjectCandidate(project, crewId) {
      if (Array.isArray(project.participantOverrides) && project.participantOverrides.length > 0) {
        return project.participantOverrides.some((item) => item.crewSourceId === crewId && item.isVisible);
      }

      const crew = state.crews.find((item) => item.id === crewId);
      return Boolean(crew && crewMatchesParticipantRefs(crew, project.participantRefs));
    }
    function matchesCrewSearch(crew) {
      const query = normalizeSearch($('crewSearch').value);
      if (!query) return true;
      const projectNames = state.projects
        .filter((project) => isCrewProjectCandidate(project, crew.id))
        .flatMap(projectSearchValues);
      return containsSearch([crew.name, ...projectNames], query);
    }
    function matchesProjectSearch(project) {
      const query = normalizeSearch($('projectSearch').value);
      if (!query) return true;
      return containsSearch([...projectSearchValues(project), ...projectCrewNames(project)], query);
    }
    function matchesBlogSearch(blog) {
      const query = normalizeSearch($('blogSearch').value);
      if (!query) return true;
      return containsSearch([blog.title, blog.projectName, ...blogAuthorNames(blog)], query);
    }
    function matchesCloudProductSearch(product) {
      const query = normalizeSearch($('cloudProductSearch').value);
      if (!query) return true;
      return containsSearch([
        product.productName,
        product.categoryCode,
        product.category?.categoryTitle,
        product.projectSource?.titleKo,
        product.projectSource?.titleEn,
      ], query);
    }
    function crewMeta(crew) {
      const generations = [...new Set([...(crew.termTeamOverrides || []), ...(crew.termTeamSources || [])].map((item) => item.generation).filter(Boolean))].sort((a, b) => a - b);
      return generations.length ? generations.map((item) => item + '기').join(', ') : '기수 정보 없음';
    }
    function projectMeta(project) {
      const count = resolveProjectParticipantIds(project, state.crews).size;
      const period = project.endedAt ? project.startedAt + '~' + project.endedAt : project.startedAt;
      return [period || '기간 미지정', '참여자 ' + count + '명'].join(' · ');
    }
    function blogMeta(blog) {
      return [
        formatDateTime(blog.recordedAt),
        blogAuthorNames(blog).join(', ') || '작성자 미확인',
        blog.projectName || '프로젝트 미지정',
      ].join(' · ');
    }
    function cloudProductMeta(product) {
      return [
        product.category?.categoryTitle || product.categoryCode || '카테고리 미지정',
        product.projectSource?.titleKo || '연결 프로젝트 없음',
        'publicId ' + product.publicId,
      ].join(' · ');
    }
    function blogsForProject(project) {
      const projectNames = projectSearchValues(project).map(normalizeSearch).filter(Boolean);
      return state.blogs.filter((blog) => {
        const blogProjectValues = [blog.projectName, ...(Array.isArray(blog.projectRefs) ? blog.projectRefs : [])]
          .map(normalizeSearch)
          .filter(Boolean);
        return blogProjectValues.some((value) => projectNames.includes(value));
      });
    }
    function projectSearchValues(project) {
      return [
        project.titleKo,
        project.titleEn,
        project.titleBrief,
        project.adminProfile?.titleKoOverride,
        project.adminProfile?.titleEnOverride,
        project.adminProfile?.titleBriefOverride,
      ].filter(Boolean);
    }
    function projectCrewNames(project) {
      const participantIds = resolveProjectParticipantIds(project, state.crews);
      return state.crews.filter((crew) => participantIds.has(crew.id)).map((crew) => crew.name);
    }
    function resolveProjectParticipantIds(project, crews) {
      if (Array.isArray(project.participantOverrides) && project.participantOverrides.length > 0) {
        return new Set(project.participantOverrides.filter((item) => item.isVisible).map((item) => item.crewSourceId));
      }

      return new Set(crews.filter((crew) => crewMatchesParticipantRefs(crew, project.participantRefs)).map((crew) => crew.id));
    }
    function blogAuthorNames(blog) {
      return state.crews
        .filter((crew) => crewMatchesParticipantRefs(crew, blog.participantRefs))
        .map((crew) => crew.name);
    }
    function crewMatchesParticipantRefs(crew, participantRefs) {
      if (!Array.isArray(participantRefs) || !Array.isArray(crew.profileAccountIds)) {
        return false;
      }

      return crew.profileAccountIds.some((accountId) => participantRefs.includes(accountId));
    }
    function containsSearch(values, query) {
      return values.some((value) => normalizeSearch(value).includes(query));
    }
    function normalizeSearch(value) {
      return String(value ?? '').trim().toLocaleLowerCase('ko');
    }
    function formatDateTime(value) {
      if (!value) return '작성시간 없음';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '작성시간 없음';
      return new Intl.DateTimeFormat('ko-KR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    }
    function visibilityBadge(isVisible) {
      return isVisible ? '<span class="badge public">공개</span>' : '<span class="badge private">비공개</span>';
    }
    function emptyHtml(message) {
      return '<div class="content meta">' + esc(message) + '</div>';
    }
    function esc(value) {
      return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    }
    function emptyToNull(value) { return value.trim() ? value : null; }
    function numberOrNull(value) {
      const parsed = Number(value);
      return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }

    window.loadSync = loadSync;
    window.loadActivityTerms = loadActivityTerms;
    window.loadCrews = loadCrews;
    window.loadProjects = loadProjects;
    window.loadCloudProducts = loadCloudProducts;
    window.loadBlogs = loadBlogs;
    $('refreshActivityTerms').onclick = loadActivityTerms;
    $('refreshCrews').onclick = loadCrews;
    $('refreshProjects').onclick = loadProjects;
    $('refreshCloudProducts').onclick = loadCloudProducts;
    $('refreshBlogs').onclick = loadBlogs;
    $('newCloudProduct').onclick = () => showCloudProduct('new');
    $('crewSearch').addEventListener('input', renderCrewList);
    $('projectSearch').addEventListener('input', renderProjectList);
    $('cloudProductSearch').addEventListener('input', renderCloudProductList);
    $('blogSearch').addEventListener('input', renderBlogList);
    bindBulkAllCheckbox('crewBulkAll', 'crewBulk', 'crewBulkToolbar', 'crewBulkStatus');
    bindBulkAllCheckbox('projectBulkAll', 'projectBulk', 'projectBulkToolbar', 'projectBulkStatus');
    bindBulkAllCheckbox('cloudProductBulkAll', 'cloudProductBulk', 'cloudProductBulkToolbar', 'cloudProductBulkStatus');
    $('bulkShowCrews').onclick = () => updateSelectedVisibility('crewBulk', '/admin/crews', true, loadCrews);
    $('bulkHideCrews').onclick = () => updateSelectedVisibility('crewBulk', '/admin/crews', false, loadCrews);
    $('bulkShowProjects').onclick = () => updateSelectedVisibility('projectBulk', '/admin/projects', true, loadProjects);
    $('bulkHideProjects').onclick = () => updateSelectedVisibility('projectBulk', '/admin/projects', false, loadProjects);
    $('bulkShowCloudProducts').onclick = () => updateSelectedVisibility('cloudProductBulk', '/admin/cloud-products', true, loadCloudProducts);
    $('bulkHideCloudProducts').onclick = () => updateSelectedVisibility('cloudProductBulk', '/admin/cloud-products', false, loadCloudProducts);
    boot();
  </script>
</body>
</html>`;

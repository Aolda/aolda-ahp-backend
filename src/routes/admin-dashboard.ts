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
      --glass: rgba(255, 255, 255, 0.46);
      --glass-strong: rgba(255, 255, 255, 0.62);
      --glass-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
      --ease-snap: cubic-bezier(0, 1, 1, 1);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(900px 460px at 12% 8%, rgba(56, 189, 248, 0.2), transparent 60%),
        radial-gradient(760px 420px at 94% 18%, rgba(20, 184, 166, 0.18), transparent 58%),
        radial-gradient(820px 520px at 68% 96%, rgba(148, 163, 184, 0.2), transparent 62%),
        linear-gradient(145deg, #f8fafc 0%, #eef6f7 48%, #f6f8fb 100%);
      background-attachment: fixed;
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
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-bottom: 26px;
    }
    h1, h2, h3 { margin: 0; color: var(--card-foreground); }
    h1 { font-size: 19px; font-weight: 800; }
    h2 { font-size: 32px; line-height: 1.12; font-weight: 850; }
    h3 { font-size: 15px; font-weight: 800; }
    main {
      display: grid;
      grid-template-columns: 250px minmax(0, 1fr);
      min-height: 100vh;
      transition: all 220ms var(--ease-snap);
    }
    main.sidebar-collapsed {
      grid-template-columns: 72px minmax(0, 1fr);
    }
    nav {
      display: flex;
      flex-direction: column;
      margin: .5rem;
      border-radius: .75rem;
      padding: 12px;
      background: var(--glass);
      backdrop-filter: blur(18px) saturate(125%);
      box-shadow: var(--glass-shadow);
      align-self: start;
      height: calc(100vh - 1rem);
      position: sticky;
      top: .5rem;
      overflow: hidden;
      transition: all 220ms var(--ease-snap);
    }
    nav button {
      width: 100%;
      justify-content: flex-start;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      border: 0;
      border-radius: .75rem;
      padding: 0 12px;
      background: rgba(255, 255, 255, 0.46);
      color: var(--muted-foreground);
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.035);
      backdrop-filter: blur(14px) saturate(125%);
      transition: all 220ms var(--ease-snap);
    }
    nav button:hover { background: rgba(255, 255, 255, 0.72); }
    nav button.active {
      background: rgba(15, 23, 42, 0.9);
      color: #ffffff;
    }
    nav button .nav-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    main.sidebar-collapsed nav {
      padding: 10px;
    }
    main.sidebar-collapsed nav button {
      justify-content: center;
      padding: 0;
    }
    main.sidebar-collapsed nav button .nav-label {
      display: none;
    }
    .nav-logo {
      display: grid;
      place-items: center;
      aspect-ratio: 1 / 1;
      width: 38px;
      margin: 0;
      border-radius: .75rem;
      background: rgba(255, 255, 255, 0.56);
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
      transition: all 220ms var(--ease-snap);
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }
    main.sidebar-collapsed .nav-brand {
      justify-content: center;
    }
    main:not(.sidebar-collapsed) .nav-logo {
      width: 38px;
    }
    .nav-toggle {
      margin-bottom: 14px;
    }
    .nav-spacer {
      flex: 1 1 auto;
      min-height: 12px;
    }
    .nav-logout {
      margin-top: auto;
    }
    .nav-logo-svg {
      display: block;
      width: 22px;
      height: 22px;
    }
    .icon {
      width: 18px;
      height: 18px;
      flex: 0 0 18px;
      stroke-width: 1.8;
    }
    section { padding: 24px 22px 22px; }
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
    .session-card {
      min-height: 42px;
      margin-bottom: 0;
      padding: 0 8px 0 14px;
      border-radius: .75rem;
      background: var(--glass-strong);
      backdrop-filter: blur(18px) saturate(125%);
      box-shadow: var(--glass-shadow);
    }
    nav .session-card {
      min-height: 38px;
      flex: 1;
      margin: 0;
      padding: 0 8px;
      justify-content: flex-start;
      overflow: hidden;
    }
    nav .session-card #session {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    main.sidebar-collapsed nav .session-card {
      display: none;
    }
    main.sidebar-collapsed nav .session-card #session {
      display: none;
    }
    .page-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 18px;
    }
    .page-subtitle {
      margin-top: 8px;
      color: var(--muted-foreground);
      font-size: 16px;
      line-height: 1.5;
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
    .team-combobox {
      position: relative;
    }
    .team-menu {
      position: absolute;
      left: 0;
      right: 0;
      top: calc(100% + 6px);
      z-index: 6;
      display: grid;
      gap: 4px;
      max-height: 220px;
      overflow: auto;
      padding: 6px;
      border-radius: .75rem;
      background: rgba(255, 255, 255, 0.88);
      box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
      backdrop-filter: blur(18px) saturate(125%);
    }
    .team-menu button {
      min-height: 32px;
      border: 0;
      border-radius: 10px;
      justify-content: flex-start;
      text-align: left;
      background: transparent;
      padding: 0 10px;
      font-weight: 650;
    }
    .team-menu button:hover {
      background: var(--muted);
    }
    .toast-root {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 30;
      display: grid;
      gap: 10px;
      width: min(360px, calc(100vw - 36px));
      pointer-events: none;
    }
    .toast {
      padding: 14px 16px;
      border-radius: .75rem;
      background: rgba(255, 255, 255, 0.82);
      color: var(--foreground);
      box-shadow: 0 14px 36px rgba(15, 23, 42, 0.14);
      backdrop-filter: blur(18px) saturate(125%);
      opacity: 0;
      transform: translateY(10px);
      animation: toast-in 180ms var(--ease-snap) forwards;
    }
    .toast.success {
      box-shadow: 0 14px 36px rgba(14, 118, 196, 0.14);
    }
    .toast.danger {
      box-shadow: 0 14px 36px rgba(220, 38, 38, 0.14);
    }
    .toast-title {
      font-weight: 850;
    }
    .toast-message {
      margin-top: 4px;
      color: var(--muted-foreground);
      font-size: 12px;
      line-height: 1.45;
    }
    .markdown-preview {
      margin-top: 12px;
      padding: 16px;
      border-radius: .75rem;
      background: rgba(255, 255, 255, 0.62);
      box-shadow: 0 5px 16px rgba(15, 23, 42, 0.04);
      backdrop-filter: blur(14px) saturate(125%);
      line-height: 1.65;
    }
    .markdown-preview h1,
    .markdown-preview h2,
    .markdown-preview h3 {
      margin: 18px 0 8px;
    }
    .markdown-preview h1:first-child,
    .markdown-preview h2:first-child,
    .markdown-preview h3:first-child {
      margin-top: 0;
    }
    .markdown-preview p {
      margin: 8px 0;
      color: var(--foreground);
    }
    .markdown-preview ul,
    .markdown-preview ol {
      margin: 8px 0;
      padding-left: 22px;
    }
    .markdown-preview blockquote {
      margin: 10px 0;
      padding-left: 12px;
      border-left: 3px solid rgba(14, 118, 196, 0.35);
      color: var(--muted-foreground);
    }
    @keyframes toast-in {
      to {
        opacity: 1;
        transform: translateY(0);
      }
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
    .sync-panel {
      display: grid;
      gap: 14px;
    }
    .sync-summary {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }
    .sync-stat {
      padding: 14px;
      border-radius: .75rem;
      background: rgba(255, 255, 255, 0.58);
      box-shadow: 0 5px 16px rgba(15, 23, 42, 0.04);
      backdrop-filter: blur(14px) saturate(125%);
    }
    .sync-stat strong {
      display: block;
      margin-top: 4px;
      font-size: 20px;
      color: var(--foreground);
    }
    .sync-steps {
      display: grid;
      gap: 10px;
    }
    .sync-step {
      display: grid;
      grid-template-columns: 34px minmax(0, 1fr) auto;
      gap: 12px;
      align-items: center;
      padding: 14px;
      border-radius: .75rem;
      background: rgba(255, 255, 255, 0.58);
      box-shadow: 0 5px 16px rgba(15, 23, 42, 0.04);
      backdrop-filter: blur(14px) saturate(125%);
    }
    .sync-step-index {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.08);
      color: var(--muted-foreground);
      font-weight: 800;
    }
    .sync-step.active .sync-step-index {
      background: var(--primary);
      color: var(--primary-foreground);
    }
    .sync-step.done .sync-step-index {
      background: #dcfce7;
      color: #166534;
    }
    .sync-step.failed .sync-step-index {
      background: #fee2e2;
      color: #991b1b;
    }
    .sync-step-title {
      font-weight: 800;
      color: var(--foreground);
    }
    .sync-step-message {
      margin-top: 4px;
      color: var(--muted-foreground);
      font-size: 12px;
      overflow-wrap: anywhere;
    }
    .sync-progress {
      height: 8px;
      margin-top: 10px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.08);
      overflow: hidden;
    }
    .sync-progress-fill {
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #0e76c4, #38bdf8);
      transition: width 220ms var(--ease-snap);
    }
    .sync-step-count {
      min-width: 78px;
      text-align: right;
      color: var(--muted-foreground);
      font-weight: 750;
    }
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
      main.sidebar-collapsed { grid-template-columns: 1fr; }
      nav {
        min-height: auto;
        height: auto;
        position: static;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      .nav-logo { display: none; }
      .nav-brand { grid-column: 1 / -1; }
      nav .session-card { width: auto; }
      main.sidebar-collapsed nav .session-card #session { display: inline; }
      .nav-spacer { display: none; }
      .nav-logout { margin-top: 0; }
      .nav-toggle { grid-column: 1 / -1; }
      nav button { margin-bottom: 0; }
      main.sidebar-collapsed nav button .nav-label { display: inline; }
      main.sidebar-collapsed nav button { justify-content: flex-start; padding: 0 12px; }
      .grid { grid-template-columns: 1fr; }
      .list { max-height: none; }
      .page-head { display: block; }
      .form-row { grid-template-columns: 1fr; }
      .term-card { grid-template-columns: 1fr; }
      .sync-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .sync-step { grid-template-columns: 34px minmax(0, 1fr); }
      .sync-step-count { grid-column: 2; text-align: left; }
    }
  </style>
</head>
<body>
  <svg aria-hidden="true" width="0" height="0" style="position:absolute">
    <symbol id="icon-panel-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 4h16v16H4z"></path><path d="M9 4v16"></path>
    </symbol>
    <symbol id="icon-refresh" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4"></path><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"></path>
    </symbol>
    <symbol id="icon-calendar-stats" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 5h16v14H4z"></path><path d="M16 3v4"></path><path d="M8 3v4"></path><path d="M4 11h16"></path><path d="M8 16h2"></path><path d="M14 16h2"></path>
    </symbol>
    <symbol id="icon-users" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 7a4 4 0 1 0 0 8a4 4 0 0 0 0 -8"></path><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path><path d="M21 21v-2a4 4 0 0 0 -3 -3.85"></path>
    </symbol>
    <symbol id="icon-folder-code" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 5h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2H5a2 2 0 0 1 -2 -2V7a2 2 0 0 1 2 -2"></path><path d="M10 13l-2 2l2 2"></path><path d="M14 13l2 2l-2 2"></path>
    </symbol>
    <symbol id="icon-package" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3l8 4.5v9L12 21l-8 -4.5v-9z"></path><path d="M12 12l8 -4.5"></path><path d="M12 12v9"></path><path d="M12 12L4 7.5"></path><path d="M16 5.25l-8 4.5"></path>
    </symbol>
    <symbol id="icon-notebook" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 4h11a2 2 0 0 1 2 2v14H8a3 3 0 0 1 -3 -3V5a1 1 0 0 1 1 -1"></path><path d="M8 4v17"></path><path d="M10 8h5"></path><path d="M10 12h5"></path>
    </symbol>
    <symbol id="icon-logout" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 8V6a2 2 0 0 0 -2 -2H5a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2"></path><path d="M9 12h12"></path><path d="M18 9l3 3l-3 3"></path>
    </symbol>
  </svg>
  <div id="loginView" class="login">
    <h2>관리콘솔 로그인</h2>
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
      <div class="nav-brand">
        <div class="nav-logo" aria-label="Aolda 로고">
          <svg class="nav-logo-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" role="img" aria-label="Aolda">
            <defs>
              <linearGradient id="aolda-logo-linear-gradient" x1="19.1" y1="6.1" x2="3.3" y2="20.1" gradientTransform="translate(0 24) scale(1 -1)" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#206ca5"></stop>
                <stop offset="1" stop-color="#0e76c4"></stop>
              </linearGradient>
              <mask id="aolda-logo-mask" x="-6.3" y=".2" width="31.7" height="27.4" maskUnits="userSpaceOnUse">
                <circle fill="#d9d9d9" cx="11.1" cy="10.8" r="10.6"></circle>
              </mask>
              <linearGradient id="aolda-logo-linear-gradient1" x1="-177.8" y1="-82.4" x2="-180.6" y2="-93.1" gradientTransform="translate(182.7 -70.2) scale(1 -1)" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#58aee5"></stop>
                <stop offset="1" stop-color="#fff" stop-opacity="0"></stop>
              </linearGradient>
              <linearGradient id="aolda-logo-linear-gradient2" x1="9.7" y1="11" x2="20" y2="-3.1" gradientTransform="translate(0 24) scale(1 -1)" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#a7d7f0"></stop>
                <stop offset="1" stop-color="#fff" stop-opacity="0"></stop>
              </linearGradient>
            </defs>
            <circle fill="url(#aolda-logo-linear-gradient)" cx="11.1" cy="10.8" r="10.6"></circle>
            <g mask="url(#aolda-logo-mask)">
              <ellipse fill="url(#aolda-logo-linear-gradient1)" cx="3.5" cy="17.8" rx="10.6" ry="7.6" transform="translate(-9.7 5.3) rotate(-35.5)"></ellipse>
              <ellipse fill="url(#aolda-logo-linear-gradient2)" cx="14.8" cy="20" rx="10.6" ry="7.6"></ellipse>
            </g>
          </svg>
        </div>
        <div class="toolbar session-card">
          <span id="session" class="muted"></span>
        </div>
      </div>
      <button id="sidebarToggle" class="nav-toggle" type="button" title="사이드바 접기">
        <svg class="icon"><use href="#icon-panel-left"></use></svg><span class="nav-label">메뉴 접기</span>
      </button>
      <button class="nav-item active" data-tab="sync" data-loader="loadSync" title="동기화">
        <svg class="icon"><use href="#icon-refresh"></use></svg><span class="nav-label">동기화</span>
      </button>
      <button class="nav-item" data-tab="activityTerms" data-loader="loadActivityTerms" title="활동기수">
        <svg class="icon"><use href="#icon-calendar-stats"></use></svg><span class="nav-label">활동기수</span>
      </button>
      <button class="nav-item" data-tab="crews" data-loader="loadCrews" title="크루 관리">
        <svg class="icon"><use href="#icon-users"></use></svg><span class="nav-label">크루 관리</span>
      </button>
      <button class="nav-item" data-tab="projects" data-loader="loadProjects" title="프로젝트 관리">
        <svg class="icon"><use href="#icon-folder-code"></use></svg><span class="nav-label">프로젝트 관리</span>
      </button>
      <button class="nav-item" data-tab="cloudProducts" data-loader="loadCloudProducts" title="제품 관리">
        <svg class="icon"><use href="#icon-package"></use></svg><span class="nav-label">제품 관리</span>
      </button>
      <button class="nav-item" data-tab="blogs" data-loader="loadBlogs" title="블로그 관리">
        <svg class="icon"><use href="#icon-notebook"></use></svg><span class="nav-label">블로그 관리</span>
      </button>
      <div class="nav-spacer"></div>
      <button id="logout" class="nav-logout hidden" type="button" title="로그아웃">
        <svg class="icon"><use href="#icon-logout"></use></svg><span class="nav-label">로그아웃</span>
      </button>
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
        <div class="card"><div id="syncOutput" class="content sync-panel"></div></div>
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
            <button id="blogAiManage">AI관리</button>
            <input id="blogSearch" style="width:280px" placeholder="블로그 제목, 프로젝트명, 크루명 검색" />
            <button id="refreshBlogs">새로고침</button>
          </div>
        </div>
        <div id="blogAiPanel" class="card hidden" style="margin-bottom:18px">
          <div class="content">
            <h3>AI관리</h3>
            <label>기본 블로깅 프롬프트</label>
            <textarea id="blogDefaultPrompt"></textarea>
            <div class="toolbar"><button id="saveBlogAiConfig" class="primary">AI 설정 저장</button><span id="blogAiStatus" class="status"></span></div>
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
  <div id="toastRoot" class="toast-root" aria-live="polite"></div>

  <script>
    const state = {
      token: localStorage.getItem('adminToken') || '',
      activityTerms: [],
      crews: [],
      projects: [],
      cloudProducts: [],
      blogs: [],
      blogAiConfig: null,
      blogPublishStates: {},
      syncPollTimer: null,
      sidebarCollapsed: localStorage.getItem('adminSidebarCollapsed') === 'true',
    };
    const $ = (id) => document.getElementById(id);

    function setStatus(id, value, danger = false) {
      const el = $(id);
      el.textContent = value || '';
      el.className = danger ? 'status danger' : 'status';
    }
    function notify(title, message = '', type = 'success') {
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      toast.innerHTML = '<div class="toast-title">' + esc(title) + '</div>' + (message ? '<div class="toast-message">' + esc(message) + '</div>' : '');
      $('toastRoot').appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 220);
      }, 3200);
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
      applySidebarState();
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
      notify('로그아웃 완료', '관리자 세션이 종료되었습니다.');
    });
    $('sidebarToggle').addEventListener('click', () => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('adminSidebarCollapsed', String(state.sidebarCollapsed));
      applySidebarState();
    });
    function applySidebarState() {
      $('appView').classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
      $('sidebarToggle').title = state.sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기';
    }
    document.querySelectorAll('nav .nav-item').forEach((button) => {
      button.addEventListener('click', async () => {
        document.querySelectorAll('nav .nav-item').forEach((item) => item.classList.remove('active'));
        document.querySelectorAll('.tab').forEach((item) => item.classList.add('hidden'));
        button.classList.add('active');
        $(button.dataset.tab).classList.remove('hidden');
        if (button.dataset.loader && window[button.dataset.loader]) {
          await window[button.dataset.loader]();
        }
      });
    });

    async function loadSync() {
      try {
        const result = await api('/admin/sync/notion/jobs/latest');
        renderSyncJob(result.job);
        if (result.job?.status === 'RUNNING') {
          pollSyncJob(result.job.id);
        }
      } catch (error) {
        renderSyncError(error.message);
      }
    }
    $('syncNow').addEventListener('click', async () => {
      $('syncNow').disabled = true;
      renderSyncStarting();
      try {
        const result = await api('/admin/sync/notion', { method: 'POST' });
        renderSyncJob(result.job);
        pollSyncJob(result.job.id);
      } catch (error) {
        renderSyncError(error.message);
        $('syncNow').disabled = false;
      }
    });
    function pollSyncJob(jobId) {
      if (state.syncPollTimer) {
        clearTimeout(state.syncPollTimer);
      }
      state.syncPollTimer = setTimeout(async () => {
        try {
          const result = await api('/admin/sync/notion/jobs/' + encodeURIComponent(jobId));
          renderSyncJob(result.job);
          if (result.job.status === 'RUNNING') {
            pollSyncJob(jobId);
            return;
          }
          $('syncNow').disabled = false;
          notify(result.job.status === 'SUCCEEDED' ? '동기화 완료' : '동기화 실패', syncStatusText(result.job.status), result.job.status === 'SUCCEEDED' ? 'success' : 'danger');
          await Promise.all([loadActivityTerms(), loadCrews(), loadProjects(), loadCloudProducts(), loadBlogs()]);
        } catch (error) {
          renderSyncError(error.message);
          $('syncNow').disabled = false;
        }
      }, 3000);
    }
    function renderSyncJob(job) {
      if (!job) {
        $('syncOutput').innerHTML = '<div class="meta">아직 실행된 동기화 작업이 없습니다.</div>';
        $('syncNow').disabled = false;
        return;
      }
      const elapsed = Math.max(0, Math.round((Date.parse(job.finishedAt || new Date().toISOString()) - Date.parse(job.startedAt)) / 1000));
      const lastLog = job.logs[job.logs.length - 1];
      const steps = buildSyncSteps(job);
      $('syncNow').disabled = job.status === 'RUNNING';
      $('syncOutput').innerHTML =
        '<div class="sync-summary">'
        + syncStatHtml('상태', syncStatusText(job.status))
        + syncStatHtml('처리', job.totalCount + '건')
        + syncStatHtml('생성', job.createdCount + '건')
        + syncStatHtml('수정', job.updatedCount + '건')
        + '</div>'
        + '<div class="sync-steps">' + steps.map(syncStepHtml).join('') + '</div>'
        + '<div class="meta">마지막 메시지: ' + esc(lastLog?.message || '-') + ' · 소요 시간 ' + elapsed + '초</div>'
        + (job.errorMessage ? '<div class="danger">' + esc(job.errorMessage) + '</div>' : '');
    }
    function renderSyncStarting() {
      $('syncOutput').innerHTML =
        '<div class="sync-summary">'
        + syncStatHtml('상태', '시작 중')
        + syncStatHtml('처리', '0건')
        + syncStatHtml('생성', '0건')
        + syncStatHtml('수정', '0건')
        + '</div>'
        + '<div class="sync-steps">' + ['crew', 'project', 'blog'].map((stage, index) => syncStepHtml({
          stage,
          label: syncStageLabel(stage),
          status: stage === 'crew' ? 'active' : 'pending',
          message: stage === 'crew' ? '동기화 작업을 준비하고 있습니다.' : '대기 중',
          processed: 0,
          total: 0,
          percent: 0,
          index: index + 1,
        })).join('') + '</div>';
    }
    function renderSyncError(message) {
      $('syncOutput').innerHTML = '<div class="danger">' + esc(message) + '</div>';
    }
    function buildSyncSteps(job) {
      const stageOrder = ['crew', 'project', 'blog'];
      const failed = job.status === 'FAILED';
      return stageOrder.map((stage, index) => {
        const logs = job.logs.filter((log) => log.metadata?.stage === stage);
        const last = logs[logs.length - 1];
        const processed = Number(last?.metadata?.processed ?? 0);
        const total = Number(last?.metadata?.total ?? 0);
        const completed = logs.some((log) => log.message.includes('completed'));
        const percent = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : (completed ? 100 : 0);
        const active = job.status === 'RUNNING' && logs.length > 0 && !completed;
        return {
          stage,
          label: syncStageLabel(stage),
          status: failed && logs.length > 0 && !completed ? 'failed' : completed || job.status === 'SUCCEEDED' ? 'done' : active ? 'active' : 'pending',
          message: last?.message || '대기 중',
          processed,
          total,
          percent,
          index: index + 1,
        };
      });
    }
    function syncStepHtml(step) {
      const count = step.total > 0 ? step.processed + '/' + step.total : '-';
      return '<div class="sync-step ' + esc(step.status) + '">'
        + '<div class="sync-step-index">' + (step.status === 'done' ? '✓' : step.index) + '</div>'
        + '<div><div class="sync-step-title">' + esc(step.label) + '</div>'
        + '<div class="sync-step-message">' + esc(step.message) + '</div>'
        + '<div class="sync-progress"><div class="sync-progress-fill" style="width:' + step.percent + '%"></div></div></div>'
        + '<div class="sync-step-count">' + esc(count) + '</div>'
        + '</div>';
    }
    function syncStatHtml(label, value) {
      return '<div class="sync-stat"><span class="meta">' + esc(label) + '</span><strong>' + esc(value) + '</strong></div>';
    }
    function syncStageLabel(stage) {
      return { crew: '크루', project: '프로젝트', blog: '블로그' }[stage] || stage;
    }
    function syncStatusText(status) {
      return { RUNNING: '진행 중', SUCCEEDED: '완료', FAILED: '실패' }[status] || status;
    }

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
        notify('크루 프로필 저장 완료', crew.name);
        await loadCrews();
      };
      $('addCrewTerm').onclick = () => {
        $('crewTermTeams').insertAdjacentHTML('beforeend', termTeamRowHtml({ generation: '', activityTerm: '', teamName: '' }));
        bindTeamComboboxes();
      };
      bindTeamComboboxes();
      $('saveCrewTerms').onclick = async () => {
        await api('/admin/crews/' + id + '/term-teams', {
          method: 'PUT',
          body: JSON.stringify({ items: collectCrewTermTeams() }),
        });
        notify('기수별 팀 저장 완료', crew.name);
        await showCrew(id);
      };
      $('saveCrewProjects').onclick = async () => {
        await api('/admin/crews/' + id + '/projects', {
          method: 'PUT',
          body: JSON.stringify({ projects: collectCheckedItemsIn('crewProjects', 'crewProject', 'projectSourceId') }),
        });
        notify('프로젝트 공개 설정 저장 완료', crew.name);
        await showCrew(id);
      };
      $('saveCrewBlogs').onclick = async () => {
        await api('/admin/crews/' + id + '/blogs', {
          method: 'PUT',
          body: JSON.stringify({ blogs: collectCheckedItemsIn('crewBlogs', 'crewBlog', 'blogPostSourceId') }),
        });
        notify('블로그 공개 설정 저장 완료', crew.name);
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
        notify('프로젝트 정보 저장 완료', project.titleKo);
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
        notify('진행기간 저장 완료', project.titleKo);
        await showProject(id);
      };
      $('saveProjectParticipants').onclick = async () => {
        await api('/admin/projects/' + id + '/participants', {
          method: 'PUT',
          body: JSON.stringify({ participants: collectCheckedItemsIn('projectParticipants', 'projectParticipant', 'crewSourceId') }),
        });
        notify('참여자 저장 완료', project.titleKo);
        await loadProjects();
        await showProject(id);
      };
      $('saveProjectBlogs').onclick = async () => {
        await api('/admin/projects/' + id + '/featured-blogs', {
          method: 'PUT',
          body: JSON.stringify({ blogs: collectCheckedItemsIn('projectBlogs', 'projectBlog', 'blogPostSourceId').filter((item) => item.isVisible).map(({ blogPostSourceId }, index) => ({ blogPostSourceId, sortOrder: index })) }),
        });
        notify('대표 블로그 저장 완료', project.titleKo);
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
        notify(isNew ? '제품 등록 완료' : '제품 저장 완료', payload.productName);
        await loadCloudProducts();
        $('cloudProductDetail').innerHTML = emptyHtml(isNew ? '제품이 등록되었습니다.' : '제품이 저장되었습니다.');
      };
      if (!isNew) {
        $('deleteCloudProduct').onclick = async () => {
          if (!confirm('이 제품을 삭제할까요?')) return;
          await api('/admin/cloud-products/' + id, { method: 'DELETE' });
          notify('제품 삭제 완료', product.productName);
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
        await ensureBlogAiConfig();
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
    async function showBlog(id) {
      const blog = state.blogs.find((item) => item.id === id);
      if (!blog) {
        $('blogDetail').innerHTML = emptyHtml('블로그를 찾을 수 없습니다.');
        return;
      }
      await ensureBlogAiConfig();
      const publishState = await loadBlogPublishState(id);

      $('blogDetail').innerHTML = '<h2>' + esc(blog.title) + '</h2>'
        + '<div class="meta" style="margin-top:8px">' + esc(blogMeta(blog)) + '</div>'
        + blogPublishSectionHtml(blog, publishState)
        + blogBodySectionHtml(blog);
      bindBlogPublishControls(blog);
    }

    async function ensureBlogAiConfig() {
      if (state.blogAiConfig) return state.blogAiConfig;
      state.blogAiConfig = (await api('/admin/blogs/ai-config')).data;
      $('blogDefaultPrompt').value = state.blogAiConfig.defaultPrompt || '';
      return state.blogAiConfig;
    }
    async function toggleBlogAiPanel() {
      await ensureBlogAiConfig();
      $('blogAiPanel').classList.toggle('hidden');
    }
    async function saveBlogAiConfig() {
      setStatus('blogAiStatus', '저장 중...');
      try {
        const result = await api('/admin/blogs/ai-config', {
          method: 'PUT',
          body: JSON.stringify({ defaultPrompt: $('blogDefaultPrompt').value }),
        });
        state.blogAiConfig = result.data;
        setStatus('blogAiStatus', '저장됨');
        notify('AI 설정 저장 완료', '기본 블로깅 프롬프트가 변경되었습니다.');
      } catch (error) {
        setStatus('blogAiStatus', error.message, true);
      }
    }
    async function loadBlogPublishState(blogId) {
      const stateResult = (await api('/admin/blogs/' + blogId + '/publish-state')).data;
      state.blogPublishStates[blogId] = stateResult;
      return stateResult;
    }
    function blogPublishSectionHtml(blog, publishState) {
      return '<div class="content" style="padding-left:0">'
        + '<h3>공개게시</h3>'
        + '<div class="meta">AI 기반 초안을 생성한 뒤 blog.aoldacloud.com 공개 게시를 목업으로 관리합니다.</div>'
        + '<div class="toolbar" style="margin-top:12px">'
        + '<button id="showBlogDraftPrompt" class="primary">블로깅 초안 자동생성</button>'
        + '<label class="inline" style="' + (publishState.isPublished ? '' : 'opacity:.45') + '"><input id="blogPublishVisible" type="checkbox" ' + (publishState.isVisible ? 'checked' : '') + ' ' + (publishState.isPublished ? '' : 'disabled') + '> 게시 토글</label>'
        + '<span class="badge ' + (publishState.isPublished ? 'public' : 'private') + '">' + (publishState.isPublished ? '게시됨' : '미게시') + '</span>'
        + '</div>'
        + '<div id="blogDraftPromptPanel" class="hidden" style="margin-top:12px">'
        + '<label>기본 블로깅 프롬프트</label><textarea readonly>' + esc(state.blogAiConfig?.defaultPrompt || '') + '</textarea>'
        + '<label>커스텀 프롬프트</label><textarea id="blogCustomPrompt" placeholder="이번 초안에 추가로 반영할 내용을 입력하세요."></textarea>'
        + '<div class="toolbar"><button id="generateBlogDraft" class="primary">생성</button><span id="blogDraftStatus" class="status"></span></div>'
        + '</div>'
        + '<div id="blogDraftEditor" class="' + (publishState.draft ? '' : 'hidden') + '" style="margin-top:12px">'
        + '<label>공개 초안</label><textarea id="blogDraftContent">' + esc(publishState.draft || '') + '</textarea>'
        + '<div class="toolbar"><button id="regenerateBlogDraft">재생성</button><button id="hideBlogDraftEditor">뒤로가기</button><button id="publishBlogDraft" class="primary">게시</button><span id="blogPublishStatus" class="status"></span></div>'
        + '</div>'
        + '</div>';
    }
    function blogBodySectionHtml(blog) {
      return '<div class="content" style="padding-left:0">'
        + '<h3>블로깅 본문</h3>'
        + '<div class="meta">Notion에서 동기화된 원문을 Markdown 렌더링 형태로 확인합니다.</div>'
        + '<div class="markdown-preview">' + renderMarkdownPreview(blog.contentPreview || '') + '</div>'
        + '</div>';
    }
    function renderMarkdownPreview(markdown) {
      if (!markdown.trim()) {
        return '<p class="meta">동기화된 본문이 없습니다. Notion 동기화를 다시 실행하면 본문이 채워집니다.</p>';
      }
      const lines = markdown.split(/\r?\n/);
      let html = '';
      let listType = '';
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) {
          html += closeMarkdownList(listType);
          listType = '';
          continue;
        }
        const bullet = line.match(/^[-*]\s+(.+)$/);
        const numbered = line.match(/^\d+\.\s+(.+)$/);
        if (bullet || numbered) {
          const nextType = bullet ? 'ul' : 'ol';
          if (listType !== nextType) {
            html += closeMarkdownList(listType) + '<' + nextType + '>';
            listType = nextType;
          }
          html += '<li>' + esc((bullet || numbered)[1]) + '</li>';
          continue;
        }
        html += closeMarkdownList(listType);
        listType = '';
        if (line.startsWith('### ')) html += '<h3>' + esc(line.slice(4)) + '</h3>';
        else if (line.startsWith('## ')) html += '<h2>' + esc(line.slice(3)) + '</h2>';
        else if (line.startsWith('# ')) html += '<h1>' + esc(line.slice(2)) + '</h1>';
        else if (line.startsWith('> ')) html += '<blockquote>' + esc(line.slice(2)) + '</blockquote>';
        else html += '<p>' + esc(line) + '</p>';
      }
      html += closeMarkdownList(listType);
      return html;
    }
    function closeMarkdownList(listType) {
      return listType ? '</' + listType + '>' : '';
    }
    function bindBlogPublishControls(blog) {
      $('showBlogDraftPrompt').onclick = () => {
        $('blogDraftPromptPanel').classList.remove('hidden');
      };
      if ($('hideBlogDraftEditor')) {
        $('hideBlogDraftEditor').onclick = () => {
          $('blogDraftEditor').classList.add('hidden');
          $('blogDraftPromptPanel').classList.remove('hidden');
        };
      }
      if ($('regenerateBlogDraft')) {
        $('regenerateBlogDraft').onclick = () => {
          $('blogDraftPromptPanel').classList.remove('hidden');
          $('blogDraftEditor').classList.add('hidden');
        };
      }
      $('generateBlogDraft').onclick = async () => {
        setStatus('blogDraftStatus', '생성 중...');
        try {
          const result = await api('/admin/blogs/' + blog.id + '/draft', {
            method: 'POST',
            body: JSON.stringify({ customPrompt: $('blogCustomPrompt').value }),
          });
          state.blogPublishStates[blog.id] = result.data;
          $('blogDraftPromptPanel').classList.add('hidden');
          $('blogDraftEditor').classList.remove('hidden');
          $('blogDraftContent').value = result.data.draft || '';
          setStatus('blogDraftStatus', '');
          notify('초안 생성 완료', blog.title);
        } catch (error) {
          setStatus('blogDraftStatus', error.message, true);
        }
      };
      $('publishBlogDraft').onclick = async () => {
        setStatus('blogPublishStatus', '게시 중...');
        try {
          const result = await api('/admin/blogs/' + blog.id + '/publish', {
            method: 'POST',
            body: JSON.stringify({ draft: $('blogDraftContent').value }),
          });
          state.blogPublishStates[blog.id] = result.data;
          notify('게시 완료', '목업 게시 상태로 전환되었습니다.');
          await showBlog(blog.id);
        } catch (error) {
          setStatus('blogPublishStatus', error.message, true);
        }
      };
      $('blogPublishVisible').onchange = async () => {
        await api('/admin/blogs/' + blog.id + '/publish-state', {
          method: 'PATCH',
          body: JSON.stringify({ isVisible: $('blogPublishVisible').checked }),
        });
        notify($('blogPublishVisible').checked ? '공개 전환 완료' : '비공개 전환 완료', blog.title);
      };
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
        + '<div class="team-combobox"><input data-field="teamName" placeholder="팀" value="' + esc(item.teamName || '') + '" autocomplete="off"><div class="team-menu hidden"></div></div>'
        + '</div>';
    }
    function bindTeamComboboxes() {
      document.querySelectorAll('.team-combobox').forEach((box) => {
        const input = box.querySelector('[data-field="teamName"]');
        const menu = box.querySelector('.team-menu');
        input.onfocus = () => renderTeamMenu(input, menu);
        input.oninput = () => renderTeamMenu(input, menu);
        input.onblur = () => setTimeout(() => menu.classList.add('hidden'), 140);
      });
    }
    function renderTeamMenu(input, menu) {
      const value = input.value.trim();
      const query = normalizeSearch(value);
      const teams = knownTeamNames().filter((team) => !query || normalizeSearch(team).includes(query)).slice(0, 12);
      const exact = knownTeamNames().some((team) => normalizeSearch(team) === query);
      const createButton = value && !exact
        ? '<button type="button" data-team-create="' + esc(value) + '">+ 신규 팀 생성: ' + esc(value) + '</button>'
        : '';
      menu.innerHTML = teams.map((team) => '<button type="button" data-team="' + esc(team) + '">' + esc(team) + '</button>').join('') + createButton;
      if (!menu.innerHTML) {
        menu.innerHTML = '<button type="button" disabled>일치하는 팀이 없습니다.</button>';
      }
      menu.classList.remove('hidden');
      menu.querySelectorAll('[data-team]').forEach((button) => {
        button.onclick = () => {
          input.value = button.dataset.team;
          menu.classList.add('hidden');
        };
      });
      menu.querySelectorAll('[data-team-create]').forEach((button) => {
        button.onclick = () => {
          input.value = button.dataset.teamCreate;
          menu.classList.add('hidden');
        };
      });
    }
    function knownTeamNames() {
      return [...new Set(state.activityTerms.flatMap((item) => item.teams || []).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right, 'ko'));
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
      notify(isVisible ? '일괄 공개 완료' : '일괄 비공개 완료', ids.length + '개 항목이 변경되었습니다.');
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
    $('blogAiManage').onclick = toggleBlogAiPanel;
    $('saveBlogAiConfig').onclick = saveBlogAiConfig;
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

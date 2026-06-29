process.env.USE_MOCK_DATA = 'true';
process.env.DATABASE_URL = '';
process.env.CREW_PROFILE_IMAGE_SYNC_ON_START = 'false';

async function main(): Promise<void> {
  const { buildApp } = await import('../server');
  const app = await buildApp();

  try {
    await app.ready();

    await expectStatus('GET /health', app.inject({ method: 'GET', url: '/health' }), 200);
    await expectStatus('GET /team/crew', app.inject({ method: 'GET', url: '/team/crew' }), 200);
    await expectStatus('GET /team/project', app.inject({ method: 'GET', url: '/team/project' }), 200);
    await expectStatus('GET /openapi.json', app.inject({ method: 'GET', url: '/openapi.json' }), 200);

    const adminPage = await expectStatus(
      'GET /admin',
      app.inject({ method: 'GET', url: '/admin' }),
      200,
    );
    assert(
      String(adminPage.headers['content-type'] ?? '').includes('text/html'),
      'admin page must be HTML',
    );
    assert(adminPage.body.includes('Aolda 관리자 콘솔'), 'admin page must contain dashboard title');

    await expectStatus(
      'POST /admin/login without DB',
      app.inject({
        method: 'POST',
        url: '/admin/login',
        headers: { 'content-type': 'application/json' },
        payload: { email: 'admin', password: 'admin' },
      }),
      503,
    );

    const project = await expectStatus(
      'GET /team/project with endedAt',
      app.inject({ method: 'GET', url: '/team/project' }),
      200,
    );
    const projectBody = JSON.parse(project.body) as {
      data?: { projects?: Array<Record<string, unknown>> };
    };
    assert(
      projectBody.data?.projects?.every((item) => Object.prototype.hasOwnProperty.call(item, 'endedAt')),
      'project list items must include endedAt',
    );

    // eslint-disable-next-line no-console
    console.log('http-smoke:ok');
  } finally {
    await app.close();
  }
}

async function expectStatus(
  label: string,
  responsePromise: Promise<{ statusCode: number; body: string; headers: Record<string, unknown> }>,
  expectedStatus: number,
) {
  const response = await responsePromise;
  assert(
    response.statusCode === expectedStatus,
    `${label} expected ${expectedStatus}, got ${response.statusCode}: ${response.body}`,
  );

  return response;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});

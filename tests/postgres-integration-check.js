const request = require('supertest');
const assert = require('assert');
const { randomUUID } = require('crypto');

const databaseUrl = process.env.DATABASE_URL || '';
if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
  console.error('POSTGRES_INTEGRATION_TEST_REQUIRES_DATABASE_URL');
  process.exit(1);
}

const app = require('../src/app');
const prisma = require('../src/utils/prisma');
const marker = `PostgreSQL integration ${randomUUID()}`;
let ventureId;

(async () => {
  try {
    const created = await request(app).post('/api/ventures').send({
      name: marker,
      category: 'Integration test',
      stage: 'Intake',
      description: 'Temporary venture used to verify the PostgreSQL assessment graph.',
      hasToken: false,
    });
    assert.strictEqual(created.status, 201, created.text);
    ventureId = created.body.venture.id;
    assert.ok(created.body.assessment?.domains?.length, 'assessment domains were not created');

    const fetched = await request(app).get(`/api/ventures/${ventureId}`);
    assert.strictEqual(fetched.status, 200, fetched.text);
    assert.strictEqual(fetched.body.name, marker);

    const updated = await request(app).patch(`/api/ventures/${ventureId}`).send({
      description: 'Updated through the PostgreSQL integration test.',
    });
    assert.strictEqual(updated.status, 200, updated.text);
    assert.strictEqual(updated.body.description, 'Updated through the PostgreSQL integration test.');

    const questionId = fetched.body.assessment.domains[0].questions[0].id;
    const response = await request(app).patch(`/api/questions/${questionId}/response`).send({
      body: 'Verified PostgreSQL response persistence.',
    });
    assert.strictEqual(response.status, 200, response.text);

    const evidence = await request(app).post(`/api/questions/${questionId}/evidence`).send({
      type: 'Integration test',
      content: 'Verified PostgreSQL evidence persistence.',
      sourceLabel: 'Automated integration test',
    });
    assert.strictEqual(evidence.status, 201, evidence.text);

    const additionalAssessment = await request(app)
      .post(`/api/ventures/${ventureId}/assessments`)
      .send({ stage: 'Questioning' });
    assert.strictEqual(additionalAssessment.status, 201, additionalAssessment.text);
    assert.ok(additionalAssessment.body.domains?.length, 'additional assessment graph was not returned');

    console.log('POSTGRES_CREATE_READ_UPDATE_GRAPH_TESTS_PASSED');
  } catch (error) {
    console.error('POSTGRES_INTEGRATION_TEST_FAILED');
    console.error(error.stack || error.message);
    process.exitCode = 1;
  } finally {
    if (ventureId) await prisma.venture.delete({ where: { id: ventureId } }).catch(() => {});
    await prisma.$disconnect();
  }
})();

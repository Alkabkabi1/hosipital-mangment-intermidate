export function getOpenApiDocument() {
  const doc: any = {
    openapi: '3.1.0',
    info: { title: 'Hospital API', version: '1.0.0' },
    servers: [{ url: '/api' }, { url: '/api/v1' }],
    paths: {
      '/health': { get: { summary: 'Health', responses: { '200': { description: 'OK' } } } },
      '/ready': { get: { summary: 'Readiness', responses: { '200': { description: 'Ready' }, '503': { description: 'Not ready' } } } },
      '/auth/login': {
        post: {
          summary: 'Login',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: {
              oneOf: [
                { type:'object', required:['identifier','password'], properties:{
                    identifier:{ type:'string', description:'username or email' },
                    password:{ type:'string', minLength:6 }
                }},
                { type:'object', required:['email','password'], properties:{
                    email:{ type:'string' }, password:{ type:'string', minLength:6 }
                }},
                { type:'object', required:['username','password'], properties:{
                    username:{ type:'string' }, password:{ type:'string', minLength:6 }
                }}
              ]
            } } }
          },
          responses: { '200': { description: 'Logged in' }, '401': { description: 'Invalid credentials' } }
        }
      },
      '/employee/requests/clearance': {
        post: {
          summary: 'Create clearance request',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ClearanceCreate' } } }
          },
          responses: { '201': { description: 'Created' }, '422': { description: 'Validation failed' } }
        }
      },
      '/employee/requests/onboarding': {
        post: {
          summary: 'Create onboarding request',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OnboardingCreate' } } } },
          responses: { '201': { description: 'Created' }, '422': { description: 'Validation failed' } }
        }
      },
      '/employee/requests/delegation': {
        post: {
          summary: 'Create delegation request',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/DelegationCreate' } } } },
          responses: { '201': { description: 'Created' }, '422': { description: 'Validation failed' } }
        }
      },
    },
    components: {
      schemas: {
        ClearanceCreate: {
          type: 'object',
          required: ['email', 'reason', 'lastWorkingDay'],
          properties: {
            email: { type: 'string', format: 'email' },
            reason: { type: 'string' },
            lastWorkingDay: { type: 'string', format: 'date' }
          }
        },
        OnboardingCreate: {
          type: 'object',
          required: ['startDate'],
          properties: {
            jobTitle: { type: 'string' },
            position: { type: 'string' },
            department: { type: 'string' },
            departmentId: { type: ['integer', 'string'] },
            startDate: { type: 'string', format: 'date' },
            contractType: { type: 'string' },
            salary: { type: 'number', minimum: 3000, maximum: 100000 }
          }
        },
        DelegationCreate: {
          oneOf: [
            {
              type: 'object',
              required: ['fromEmail', 'toEmail', 'validFrom', 'validTo'],
              properties: {
                fromEmail: { type: 'string', format: 'email' },
                toEmail: { type: 'string', format: 'email' },
                validFrom: { type: 'string', format: 'date' },
                validTo: { type: 'string', format: 'date' }
              }
            },
            {
              type: 'object',
              required: ['reference_number', 'delegation_type', 'scope_description', 'start_date', 'end_date'],
              properties: {
                reference_number: { type: 'string' },
                delegation_type: { type: 'string' },
                scope_description: { type: 'string' },
                start_date: { type: 'string', format: 'date' },
                end_date: { type: 'string', format: 'date' }
              }
            }
          ]
        }
      }
    }
  };
  return doc;
}

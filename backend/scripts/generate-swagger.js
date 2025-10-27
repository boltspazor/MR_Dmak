const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MR Communication Tool API (generated)',
      version: process.env.npm_package_version || '1.0.0',
      description: 'Generated OpenAPI spec for inspection',
    },
    servers: [
      { url: 'http://localhost:5001' }
    ]
  },
  apis: [path.join(__dirname, '../src/**/*.ts'), path.join(__dirname, '../src/**/*.js')]
};

const spec = swaggerJsdoc(options);
const out = path.join(__dirname, '../swagger/openapi.generated.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(spec, null, 2));
console.log('Wrote', out);

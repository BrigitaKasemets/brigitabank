const YAML = require('yaml');
const fs = require('fs');
const path = require('path');

// Loe OpenAPI spetsifikatsiooni fail
const openApiPath = path.join(__dirname, 'openapi.yaml');
const openApiContent = fs.readFileSync(openApiPath, 'utf8');
const swaggerSpec = YAML.parse(openApiContent);

module.exports = swaggerSpec;
export const successSchema = (example: unknown) => ({
  description: 'OK',
  type: 'object',
  additionalProperties: true,
  example,
});

export const errorSchema = (code: string, description: string) => ({
  description,
  type: 'object',
  additionalProperties: false,
  properties: {
    code: { type: 'string', enum: [code] },
  },
  required: ['code'],
  example: { code },
});

export const serviceUnavailableSchema = (codes: string[]) => ({
  description: 'Service Unavailable',
  oneOf: codes.map((code) => errorSchema(code, 'Service Unavailable')),
});

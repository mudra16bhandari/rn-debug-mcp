import { z } from 'zod';

const configSchema = z.object({
    WS_PORT: z.preprocess((val) => parseInt(val as string, 10), z.number().default(4567)),
    HTTP_PORT: z.preprocess((val) => parseInt(val as string, 10), z.number().default(4568)),
    MAX_BUFFER_SIZE: z.preprocess((val) => parseInt(val as string, 10), z.number().default(5000)),
    MAX_EVENT_AGE_MS: z.preprocess((val) => parseInt(val as string, 10), z.number().default(300000)),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const config = configSchema.parse({
    WS_PORT: process.env.WS_PORT,
    HTTP_PORT: process.env.HTTP_PORT,
    MAX_BUFFER_SIZE: process.env.MAX_BUFFER_SIZE,
    MAX_EVENT_AGE_MS: process.env.MAX_EVENT_AGE_MS,
    NODE_ENV: process.env.NODE_ENV,
});

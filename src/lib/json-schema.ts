import { z } from 'zod';

export const observationsSchema = z.object({
  items: z.array(z.string())
    .min(0)
    .max(3)
    .describe("Exactly three observations from the image")
});

export type Observations = z.infer<typeof observationsSchema>;

import { z } from "zod";
import { ServiceBucket } from "@/generated/prisma/enums";

export const createClientSchema = z.object({
  name: z.string().trim().min(2, "Enter the client's legal or trading name"),
  country: z.string().trim().min(2, "Enter a country"),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, "Use a 3-letter ISO currency code, e.g. KES"),
  serviceBucket: z.enum(ServiceBucket, {
    error: "Choose a service portfolio bucket",
  }),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

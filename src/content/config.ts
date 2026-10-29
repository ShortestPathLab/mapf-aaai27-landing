import { SITE } from "@config";
import { defineCollection, z } from "astro:content";

const team = defineCollection({
  type: "data",
  schema: () =>
    z.object({
      title: z.string(),
      role: z.string().optional(),
      description: z.string(),
      url: z.string().optional(),
      image: z.string().optional(),
      affiliation: z.string().optional(),
      tag: z
        .string()
        .array()
        .or(z.string().transform(s => [s]))
        .optional(),
    }),
});

const program = defineCollection({
  type: "data",
  schema: z.array(
    z.object({
      date: z.string(),
      events: z.array(
        z.object({
          time: z.string(),
          name: z.string().optional(),
          description: z.string().optional(),
          events: z.array(
            z.object({
              elevated: z.boolean().default(false),
              presenters: z.array(z.string()).default([]),
              image: z.string().optional(),
              imageOffset: z.string().optional(),
              name: z.string(),
              description: z.string(),
            })
          ),
        })
      ),
    })
  ),
});

export const collections = { team, program };

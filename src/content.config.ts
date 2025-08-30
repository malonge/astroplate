import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

// about collection schema
const aboutCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/about" }),
  schema: z.object({
    title: z.string(),
    meta_title: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    draft: z.boolean().optional(),
  }),
});

// contact collection schema
const contactCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/contact" }),
  schema: z.object({
    title: z.string(),
    meta_title: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    draft: z.boolean().optional(),
  }),
});

// projects collection schema
const projectsCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/projects" }),
  schema: z.object({
    title: z.string(),
    meta_title: z.string().optional(),
    description: z.string().optional(),
    date: z.date().optional(),
    image: z.string().optional(),
    author: z.string().default("Admin"),
    categories: z.array(z.string()).default(["others"]),
    tags: z.array(z.string()).default(["others"]),
    draft: z.boolean().optional(),
  }),
});

// Homepage collection schema
const homepageCollection = defineCollection({
  loader: glob({ pattern: "**/-*.{md,mdx}", base: "src/content/homepage" }),
  schema: z.object({
    banner: z.object({
      name: z.string(),
      title: z.string(),
      tagline: z.string(),
      image: z.string().optional(),
      button: z.object({
        enable: z.boolean(),
        label: z.string(),
        link: z.string(),
      }),
    }),
    projects: z.object({
      title: z.string(),
      items: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          icon: z.string(),
          links: z.array(
            z.object({
              label: z.string(),
              url: z.string(),
            }),
          ),
        }),
      ),
    }),
    publications: z.object({
      title: z.string(),
      items: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          journal: z.string(),
          year: z.string(),
          icon: z.string(),
          links: z.array(
            z.object({
              label: z.string(),
              url: z.string(),
            }),
          ),
        }),
      ),
    }),
    cta: z.object({
      title: z.string(),
      description: z.string(),
      links: z.array(
        z.object({
          label: z.string(),
          url: z.string(),
        }),
      ),
    }),
  }),
});

// Export collections
export const collections = {
  about: aboutCollection,
  contact: contactCollection,
  projects: projectsCollection,
  homepage: homepageCollection,
};

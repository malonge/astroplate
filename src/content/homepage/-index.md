---
# Banner
banner:
  image: "/images/profile.png"
  name: "Michael Alonge"
  title: "Software Engineer & Computational Biologist"
  tagline: "Building scalable software for managing and interpreting genomic data."
  button:
    enable: true
    label: "Read My Bio"
    link: "/about"

# Projects Section
projects:
  title: "Featured Projects"
  items:
    - title: "Using BigQuery to analyze genetic variants at scale (coming soon)"
      description: "This pipeline fetches or generates VCF files, converts them into Avro batches, and efficiently ingests them into BigQuery using custom schemas. Partitioning and clustering optimize storage and query performance for large-scale genomic datasets."
      icon: "database"
      links:
        - label: "Learn More"
          url: "/projects/bq-variants"
    - title: "Arkadia - IoT Home Environment Monitoring System"
      description: "A microservices architecture with containerized services, a custom BME280 client, and a React frontend. The system demonstrates continuous data processing through a polling-based pipeline including real-time sensor readings, Redis caching, FastAPI endpoints, and data visualizations."
      icon: "chart"
      links:
        - label: "Learn More"
          url: "/projects/arkadia"
    - title: "Building a Modern Resume with Astro: JSON Data, Print-Optimized CSS, and SEO Benefits"
      description: "I built a modern resume system that combines Astro's static site generation with the JSON Resume standard and print-optimized CSS to create both an SEO-friendly web presence and recruiter-ready PDF downloads."
      icon: "briefcase"
      links:
        - label: "Learn More"
          url: "/projects/cv-design"

# Publications Section
publications:
  title: "Selected Publications"
  items:
    - title: "The complete sequence of a human genome"
      description: "I was a member of the Telomere-to-Telomere Consortium, contributing to the first every complete sequence of a human genome. I contributed by correcting small and structural misassemblies in the draft assembly."
      journal: "Science"
      year: "2022"
      icon: "dna"
      links:
        - label: "Learn More"
          url: "/publications"
    - title: "The genetic and epigenetic landscape of the Arabidopsis centromeres"
      description: "We resolved and characteried all five Arabidopsis thaliana centromeres for the first time. I lead the assembly of the centromere sequences."
      journal: "Science"
      year: "2021"
      icon: "microscope"
      links:
        - label: "Learn More"
          url: "/publications"
    - title: "Major Impacts of Widespread Structural Variation on Gene Expression and Crop Improvement in Tomato"
      description: "We made a catalog of structural variants in tomato and explored several examples of their impact on traits. I lead the catalog creation and introgression analysis."
      journal: "Cell"
      year: "2020"
      icon: "cloud"
      links:
        - label: "Learn More"
          url: "/publications"

# Call to Action Section
cta:
  title: "Explore More"
  description: "Discover more about my work and experience."
  links:
    - label: "See All Projects"
      url: "/projects"
    - label: "View My CV"
      url: "/cv"
    - label: "See My Publications"
      url: "/publications"
---

<h1 align=center>Astro + Tailwind CSS + TypeScript Starter and Boilerplate</h1>

<p align=center>Astroplate is a free starter template built with Astro, TailwindCSS & TypeScript, providing everything you need to jumpstart your Astro project and save valuable time.</p>

<p align=center>Made with ♥ by <a href="https://zeon.studio/">Zeon Studio</a></p>

<p align=center> If you find this project useful, please give it a ⭐ to show your support. </p>

<h2 align="center"> <a target="_blank" href="https://astroplate.netlify.app/" rel="nofollow">👀 Demo</a> | <a target="_blank" href="https://astroplate-multilang.netlify.app/" rel="nofollow">👀 Demo Multilang</a> | <a  target="_blank" href="https://pagespeed.web.dev/analysis/https-astroplate-netlify-app/yzx3foum3w?form_factor=desktop">Page Speed (100%)🚀</a>
</h2>

<p align=center>
  <a href="https://github.com/withastro/astro/releases/tag/astro%405.7.8">
    <img src="https://img.shields.io/static/v1?label=ASTRO&message=5.7&color=000&logo=astro"  alt="Astro Version 5.7"/>
  </a>

  <a href="https://github.com/zeon-studio/astroplate/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/zeon-studio/astroplate" alt="license"></a>

  <img src="https://img.shields.io/github/languages/code-size/zeon-studio/astroplate" alt="code size">

  <a href="https://github.com/zeon-studio/astroplate/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/zeon-studio/astroplate" alt="contributors"></a>
</p>

## 📌 Key Features

- 👥 Multi-Authors
- 🌐 Multilingual
- 🎯 Similar Posts Suggestion
- 🔍 Search Functionality
- 🌑 Dark Mode
- 🏷️ Tags & Categories
- 🔗 Netlify setting pre-configured
- 📞 Support contact form
- 📱 Fully responsive
- 📝 Write and update content in Markdown / MDX
- 📎 Google Tag Manager
- 💬 Disqus Comment
- 🔳 Syntax Highlighting

### 📄 15+ Pre-designed Pages

- 🏠 Homepage
- 👤 About
- 📞 Contact
- 👥 Authors
- 👤 Author Single
- 📝 Blog
- 📝 Blog Single
- 🚫 Custom 404
- 💡 Elements
- 📄 Privacy Policy
- 🏷️ Tags
- 🏷️ Tag Single
- 🗂️ Categories
- 🗂️ Category Single
- 🔍 Search

## 🔗 Integrations

- astro/react
- astro/sitemap
- astro/tailwind

## 🚀 Getting Started

### 📦 Dependencies

- astro v5.7+
- node v20.10+
- yarn v1.22+
- tailwind v4+

### 👉 Install Dependencies

```bash
yarn install
```

### 👉 Development Command

```bash
yarn run dev
```

### 👉 Build Command

```bash
yarn run build
```

### 👉 Build and Run With Docker

```bash
docker build -t astroplate .
# or
# docker --build-arg INSTALLER=npm build -t astroplate .
# or
# docker --build-arg INSTALLER=pnpm build -t astroplate .

docker run -p 3000:80 astroplate
# or
# docker run --rm -p 3000:80 astroplate
```

To access the shell within the container:

```bash
docker run -it --rm astroplate ash
```

<!-- licence -->

## 📝 License

Copyright (c) 2023 - Present, Designed & Developed by [Zeon Studio](https://zeon.studio/)

**Code License:** Released under the [MIT](https://github.com/zeon-studio/astroplate/blob/main/LICENSE) license.

**Image license:** The images are only for demonstration purposes. They have their license, we don't have permission to share those images.

# Customization Notes

Here I will document how I (Michael Alonge) customized the Astroplate template to my personal website.

## CV

The CV page combines a few key components:

- A JSON file that contains my professional information following the [JSON Resume standard](https://jsonresume.org/)
- A HTML/CSS typeset resume template by [Min–Zhong John Lu](https://github.com/mnjul/html-resume?tab=readme-ov-file)
- The astroplate template

The resume data is stored in `src/config/cv.json` and is treated as a configuration. This decouples the resume data from the resume template. Then I extended and customized the HTML/CSS template provided by Min–Zhong John Lu in `src/styles/cv.css` and `src/pages/cv.astro` to create a modern, print-optimized resume. By default, the `cv` page behaves like a normal website page and all of my resume content is embedded directly in the page. However, I added a print button to the page that allows the user to print the resume to a formatted PDF.

## Route Validation

I added a route validation script to the project to ensure that the routes are generated correctly. This is done by checking the `dist` directory for the generated HTML files and comparing them to the expected routes.

To run the script, use the following command:

```bash
./scripts/validate-routes.sh
```

This script is also run as a GitHub Actions workflow to ensure that the routes are generated correctly before deployment. The GHA workflow is located in the `.github/workflows/validate-routes.yml` file.
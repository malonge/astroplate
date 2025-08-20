import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load CV data
const cvData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/config/cv.json'), 'utf8'));

// Function to format date for display
function formatDate(dateString) {
  if (dateString === "Present") return "Present";
  
  // Handle year-only strings (like "2025", "2022")
  if (/^\d{4}$/.test(dateString)) {
    return dateString;
  }
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Function to calculate duration between dates
function calculateDuration(startDate, endDate) {
  if (endDate === "Present") return "Present";
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  
  if (years > 0 && months > 0) {
    return `${years}y ${months}m`;
  } else if (years > 0) {
    return `${years}y`;
  } else {
    return `${months}m`;
  }
}

// Generate markdown content
function generateMarkdown() {
  let markdown = `# ${cvData.basics.name}\n`;
  markdown += `${cvData.basics.label}\n\n`;
  
  // Contact information
  markdown += `**Email:** ${cvData.basics.email}  \n`;
  markdown += `**Phone:** ${cvData.basics.phone}  \n`;
  markdown += `**Location:** ${cvData.basics.location.city}, ${cvData.basics.location.region}  \n`;
  if (cvData.basics.url) markdown += `**Website:** ${cvData.basics.url}  \n`;
  
  // Social profiles
  if (cvData.basics.profiles) {
    cvData.basics.profiles.forEach(profile => {
      markdown += `**${profile.network}:** ${profile.url}  \n`;
    });
  }
  markdown += '\n';
  
  // Summary
  markdown += `## Professional Summary\n\n`;
  markdown += `${cvData.basics.summary}\n\n`;
  
  // Work experience
  markdown += `## Professional Experience\n\n`;
  cvData.work?.forEach(job => {
    markdown += `### ${job.position}\n`;
    markdown += `**${job.name}** | ${formatDate(job.startDate)} - ${formatDate(job.endDate)} (${calculateDuration(job.startDate, job.endDate)})\n\n`;
    markdown += `${job.summary}\n\n`;
    if (job.highlights && job.highlights.length > 0) {
      markdown += `**Key Achievements:**\n`;
      job.highlights.forEach(highlight => {
        markdown += `• ${highlight}\n`;
      });
      markdown += '\n';
    }
  });
  
  // Volunteer experience
  if (cvData.volunteer && cvData.volunteer.length > 0) {
    markdown += `## Volunteer Experience\n\n`;
    cvData.volunteer.forEach(volunteer => {
      markdown += `### ${volunteer.position}\n`;
      markdown += `**${volunteer.organization}** | ${formatDate(volunteer.startDate)} - ${formatDate(volunteer.endDate)}\n\n`;
      markdown += `${volunteer.summary}\n\n`;
      if (volunteer.highlights && volunteer.highlights.length > 0) {
        markdown += `**Key Achievements:**\n`;
        volunteer.highlights.forEach(highlight => {
          markdown += `• ${highlight}\n`;
        });
        markdown += '\n';
      }
    });
  }
  
  // Education
  markdown += `## Education\n\n`;
  cvData.education?.forEach(edu => {
    markdown += `### ${edu.studyType} in ${edu.area}\n`;
    markdown += `**${edu.institution}** | ${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}\n`;
    if (edu.score) markdown += `**GPA:** ${edu.score}\n`;
    if (edu.courses && edu.courses.length > 0) {
      markdown += `**Relevant Coursework:** ${edu.courses.join(', ')}\n`;
    }
    markdown += '\n';
  });
  
  // Awards
  if (cvData.awards && cvData.awards.length > 0) {
    markdown += `## Awards & Recognition\n\n`;
    cvData.awards.forEach(award => {
      markdown += `### ${award.title}\n`;
      markdown += `**${award.awarder}** | ${formatDate(award.date)}\n\n`;
      markdown += `${award.summary}\n\n`;
    });
  }
  
  // Certificates
  if (cvData.certificates && cvData.certificates.length > 0) {
    markdown += `## Certifications\n\n`;
    cvData.certificates.forEach(cert => {
      markdown += `### ${cert.name}\n`;
      markdown += `**${cert.issuer}** | ${formatDate(cert.date)}\n`;
      if (cert.url) markdown += `**Certificate:** ${cert.url}\n`;
      markdown += '\n';
    });
  }
  
  // Publications
  if (cvData.publications && cvData.publications.length > 0) {
    markdown += `## Publications\n\n`;
    cvData.publications.forEach(pub => {
      markdown += `### ${pub.name}\n`;
      markdown += `**${pub.publisher}** | ${formatDate(pub.releaseDate)}\n\n`;
      markdown += `${pub.summary}\n`;
      if (pub.url) markdown += `**Publication:** ${pub.url}\n`;
      markdown += '\n';
    });
  }
  
  // Skills
  markdown += `## Skills\n\n`;
  cvData.skills?.forEach(skillGroup => {
    markdown += `**${skillGroup.name}** (${skillGroup.level})\n`;
    markdown += `${skillGroup.keywords.join(', ')}\n\n`;
  });
  
  // Projects
  if (cvData.projects && cvData.projects.length > 0) {
    markdown += `## Projects\n\n`;
    cvData.projects.forEach(project => {
      markdown += `### ${project.name}\n`;
      markdown += `${formatDate(project.startDate)} - ${formatDate(project.endDate)}\n\n`;
      markdown += `${project.description}\n\n`;
      if (project.highlights && project.highlights.length > 0) {
        markdown += `**Key Highlights:**\n`;
        project.highlights.forEach(highlight => {
          markdown += `• ${highlight}\n`;
        });
        markdown += '\n';
      }
      if (project.url) markdown += `**Project URL:** ${project.url}\n\n`;
    });
  }
  
  // Languages
  if (cvData.languages && cvData.languages.length > 0) {
    markdown += `## Languages\n\n`;
    cvData.languages.forEach(lang => {
      markdown += `• **${lang.language}:** ${lang.fluency}\n`;
    });
    markdown += '\n';
  }
  
  // Interests
  if (cvData.interests && cvData.interests.length > 0) {
    markdown += `## Interests\n\n`;
    cvData.interests.forEach(interest => {
      markdown += `### ${interest.name}\n`;
      markdown += `${interest.keywords.join(', ')}\n\n`;
    });
  }
  
  // References
  if (cvData.references && cvData.references.length > 0) {
    markdown += `## References\n\n`;
    cvData.references.forEach(ref => {
      markdown += `### ${ref.name}\n`;
      markdown += `${ref.reference}\n\n`;
    });
  }
  
  return markdown;
}

// Generate HTML from markdown (simple conversion for PDF generation)
function generateHTML(markdown) {
  // Simple markdown to HTML conversion
  let html = markdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/• (.*$)/gim, '<li>$1</li>')
    .replace(/\*\*(.*?):\*\*/g, '<strong>$1:</strong>');
  
  // Wrap in proper HTML structure
  html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${cvData.basics.name} - CV</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 5px;
            margin-top: 30px;
        }
        h3 {
            color: #2c3e50;
            margin-top: 20px;
        }
        strong {
            color: #2c3e50;
        }
        li {
            margin-bottom: 5px;
        }
        p {
            margin-bottom: 15px;
        }
        .contact-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .job {
            margin-bottom: 25px;
            padding-left: 15px;
            border-left: 3px solid #3498db;
        }
        .education {
            margin-bottom: 20px;
            padding-left: 15px;
            border-left: 3px solid #27ae60;
        }
        .project {
            margin-bottom: 20px;
            padding-left: 15px;
            border-left: 3px solid #9b59b6;
        }
    </style>
</head>
<body>
    <p>${html}</p>
</body>
</html>`;
  
  return html;
}

// Generate PDF from HTML
async function generatePDF(html) {
  // Try to find Chrome/Chromium executable
  const chromePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
    '/usr/bin/google-chrome', // Linux
    '/usr/bin/chromium-browser', // Linux
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' // Windows
  ];
  
  let executablePath = null;
  for (const path of chromePaths) {
    if (fs.existsSync(path)) {
      executablePath = path;
      break;
    }
  }
  
  if (!executablePath) {
    console.error('Chrome/Chromium not found. Please install Chrome or specify the path manually.');
    console.log('You can also generate just the markdown file by commenting out the PDF generation in the script.');
    return;
  }
  
  const browser = await puppeteer.launch({
    executablePath: executablePath,
    headless: true
  });
  const page = await browser.newPage();
  
  await page.setContent(html);
  await page.pdf({
    path: path.join(__dirname, '../public/cv.pdf'),
    format: 'A4',
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    },
    printBackground: true
  });
  
  await browser.close();
  console.log('PDF generated successfully at public/cv.pdf');
}

// Main execution
async function main() {
  try {
    // Generate markdown
    const markdown = generateMarkdown();
    const markdownPath = path.join(__dirname, '../src/content/cv.md');
    
    // Ensure directory exists
    const dir = path.dirname(markdownPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write markdown file
    fs.writeFileSync(markdownPath, markdown);
    console.log('Markdown file generated successfully at src/content/cv.md');
    
    // Generate HTML and PDF
    const html = generateHTML(markdown);
    await generatePDF(html);
    
  } catch (error) {
    console.error('Error generating CV:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateMarkdown, generateHTML, generatePDF };

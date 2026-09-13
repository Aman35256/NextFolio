# ATS Best Practices Guide

## 1. How ATS Parsers Work
- Applicant Tracking Systems (ATS) scan resumes to extract text and match keywords against a job description.
- They utilize Natural Language Processing (NLP), layout analysis, and keyword frequency counting.
- If a resume has a complex layout (e.g., tables, text boxes, images, columns), the parser might misread or skip content.

## 2. Parsing Friendly Layout Rules
- **Use standard section headings**: Use common headers like "Experience", "Education", "Skills", and "Projects". Avoid creative titles like "Where I've Been" or "My Superpowers".
- **Avoid tables and text boxes**: ATS parsers read left-to-right. Tables and text boxes can cause text from different sections to be mashed together.
- **Do not put contact info in headers/footers**: Many older ATS parsers ignore headers and footers entirely. Keep your name and contact details at the top of the body.
- **Use bullet points**: Bullet points are parsed easily and help structure your experience chronologically.

## 3. Keyword Density and Formatting
- **Optimize for keywords**: Cross-reference your resume with the job description. Include exact skill matches (e.g., "React", "TypeScript", "CI/CD").
- **Do not overstuff**: Keyword density should be natural (between 1% and 3%). Avoid hiding keywords in white font or repeating them excessively, which modern parsers flag as spam.
- **Format acronyms and spellings**: Use both the acronym and full term where appropriate (e.g., "AWS (Amazon Web Services)", "Continuous Integration (CI)").
- **Use standard date formats**: Use "MM/YYYY" or "Month YYYY" (e.g., "05/2024" or "May 2024") to help the parser calculate experience duration accurately.

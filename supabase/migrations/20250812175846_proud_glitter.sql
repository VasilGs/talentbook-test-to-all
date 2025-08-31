/*
  # Add example job posts

  1. New Data
    - Insert 5 example job posts with realistic data
    - Include various job types, locations, and experience levels
    - Use placeholder company logos from Pexels

  2. Security
    - Data will be publicly viewable through existing RLS policies
*/

-- Insert example job posts
INSERT INTO public.job_posts (
  company_name,
  company_logo,
  company_website,
  position,
  location,
  salary,
  job_type,
  experience_level,
  short_description,
  requirements,
  skills,
  application_link,
  is_remote,
  status
) VALUES 
(
  'TechCorp Solutions',
  'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1',
  'https://techcorp.com',
  'Senior Software Engineer',
  'Sofia, Bulgaria',
  '5000-7000 BGN net',
  'Full-time',
  'Senior',
  'Join our innovative team to build cutting-edge web applications using modern technologies. We offer flexible working hours, great benefits, and opportunities for professional growth.',
  'Bachelor''s degree in Computer Science or related field. 5+ years of experience in full-stack development. Strong knowledge of React, Node.js, and PostgreSQL. Experience with cloud platforms (AWS/Azure). Excellent problem-solving skills and team collaboration.',
  '["React", "Node.js", "PostgreSQL", "AWS", "TypeScript", "Docker"]',
  'https://techcorp.com/careers/senior-software-engineer',
  false,
  'active'
),
(
  'Digital Marketing Pro',
  'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1',
  'https://digitalmarketingpro.com',
  'Marketing Manager',
  'Remote',
  '4000-5500 EUR net',
  'Full-time',
  'Mid-level',
  'Lead our digital marketing initiatives and drive brand growth across multiple channels. Perfect opportunity for a creative marketer looking to make a significant impact.',
  '3+ years of digital marketing experience. Proven track record in social media marketing, content creation, and campaign management. Experience with Google Analytics, Facebook Ads, and marketing automation tools. Strong analytical and communication skills.',
  '["Digital Marketing", "Social Media", "Google Analytics", "Content Creation", "SEO", "PPC"]',
  'https://digitalmarketingpro.com/apply',
  true,
  'active'
),
(
  'StartupXYZ',
  'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1',
  'https://startupxyz.com',
  'Product Designer',
  'Plovdiv, Bulgaria',
  '3500-4500 BGN net',
  'Full-time',
  'Mid-level',
  'Shape the future of our product by creating intuitive and beautiful user experiences. Work closely with engineering and product teams in a fast-paced startup environment.',
  '2+ years of product design experience. Proficiency in Figma, Sketch, or similar design tools. Strong understanding of UX/UI principles and user-centered design. Experience with design systems and prototyping. Portfolio showcasing web and mobile designs.',
  '["Figma", "UI/UX Design", "Prototyping", "Design Systems", "User Research", "Adobe Creative Suite"]',
  'https://startupxyz.com/careers',
  false,
  'active'
),
(
  'FinTech Innovations',
  'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1',
  'https://fintechinnovations.com',
  'Data Analyst',
  'Varna, Bulgaria',
  '4000-5000 BGN net',
  'Full-time',
  'Entry-level',
  'Analyze financial data to drive business decisions and insights. Great opportunity for a recent graduate or career changer to enter the exciting world of fintech.',
  'Bachelor''s degree in Mathematics, Statistics, Economics, or related field. Strong analytical and problem-solving skills. Proficiency in SQL and Excel. Knowledge of Python or R is a plus. Interest in financial markets and data visualization.',
  '["SQL", "Excel", "Python", "Data Analysis", "Statistics", "Tableau"]',
  'https://fintechinnovations.com/jobs/data-analyst',
  false,
  'active'
),
(
  'Creative Agency Hub',
  'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1',
  'https://creativeagencyhub.com',
  'Frontend Developer',
  'Burgas, Bulgaria',
  '3000-4000 BGN net',
  'Contract',
  'Mid-level',
  'Build responsive and interactive websites for our diverse client portfolio. Work with a creative team on exciting projects ranging from corporate websites to e-commerce platforms.',
  '2+ years of frontend development experience. Strong skills in HTML, CSS, JavaScript, and modern frameworks (React/Vue). Experience with responsive design and cross-browser compatibility. Knowledge of version control (Git) and build tools.',
  '["JavaScript", "React", "CSS", "HTML", "Git", "Responsive Design", "Webpack"]',
  'https://creativeagencyhub.com/apply/frontend-developer',
  false,
  'active'
);
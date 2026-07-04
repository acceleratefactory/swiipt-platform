-- ============================================================
-- Sprint 18 — Phase A Batch 2: Seed Career Segments
-- Run AFTER Batch 1. Idempotent — safe to re-run.
-- ============================================================

INSERT INTO career_segments (slug, name, description, icon, sort_order) VALUES
('job_seeker', 'Job Seekers', 'International job opportunities matched to your skills and experience', '💼', 1),
('student', 'Students & Scholars', 'Scholarships, fellowships, and fully funded programmes worldwide', '🎓', 2),
('healthcare', 'Healthcare Professionals', 'UK NHS, UAE hospitals, Canadian health systems hiring Nigerian professionals', '🏥', 3),
('tech_professional', 'Tech Professionals', 'Remote and relocation opportunities for developers, designers, and product people', '💻', 4),
('footballer', 'Footballers', 'Trials, academy invitations, and agent representation opportunities in Europe and Asia', '⚽', 5),
('sports_professional', 'Sports Professionals', 'Opportunities for athletes across basketball, athletics, swimming, and other sports', '🏆', 6),
('freelancer', 'Freelancers & Creators', 'High-paying international clients, platforms, and contracts', '🎨', 7),
('entrepreneur', 'Entrepreneurs & SMEs', 'Business expansion, trade missions, and market entry opportunities', '🚀', 8),
('trade_worker', 'Skilled Trade Workers', 'Construction, electrical, plumbing, and other trade opportunities in Europe and Gulf', '🔧', 9),
('caregiver', 'Caregivers & Domestic Workers', 'Legal caregiver and domestic worker placements in the UK, Canada, and UAE', '❤️', 10)
ON CONFLICT (slug) DO NOTHING;

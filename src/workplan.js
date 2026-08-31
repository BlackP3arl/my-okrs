const PA1 = 'Community and Member-Centric Service';
const PA2 = 'Optimise and Innovate Solutions';
const PA3 = 'Pension Sustainability';
const PA4 = 'Organizational Development and Resilience';

export const divisions = [PA1, PA2, PA3, PA4];

const TEAM_DEFS = [
  ['Pension Office', PA1, '#6046db', '#eeeafd', 'Organisation-wide strategy and five-year goals.'],
  ['Client Relations', PA1, '#2670b7', '#e6f1fc', 'Client experience, service quality, and support channels.'],
  ['Public Relations', PA1, '#b55b14', '#fff0df', 'Public awareness, perception, and communications.'],
  ['Stakeholder Relations', PA1, '#be185d', '#fce7f3', 'Member engagement and stakeholder partnerships.'],
  ['Events and Brand Management', PA1, '#ea580c', '#ffedd5', 'Campaigns, events, and brand programmes.'],
  ['Pension Coverage Extension', PA1, '#0f766e', '#ccfbf1', 'Coverage expansion across employers and informal workers.'],
  ['Member Services', PA1, '#0284c7', '#e0f2fe', 'Member-facing service delivery.'],
  ['Pension Services', PA1, '#0e7490', '#cffafe', 'Core pension service operations.'],
  ['Pensions and Benefits', PA1, '#1d4ed8', '#dbeafe', 'Benefit administration and payouts.'],
  ['Collection and Compliance', PA1, '#c2410c', '#ffedd5', 'Contribution collection and employer compliance.'],
  ['Registration and Records', PA1, '#57534e', '#f5f5f4', 'Member registration, records, and archives.'],
  ['Software Engineering', PA2, '#4338ca', '#e0e7ff', 'Application development and platform delivery.'],
  ['Data Services', PA2, '#0369a1', '#e0f2fe', 'Data platforms, analytics, and data management.'],
  ['Innovation and Technology', PA2, '#6d28d9', '#ede9fe', 'Digital platforms, infrastructure, and technology programmes.'],
  ['Cloud and Security', PA2, '#1e3a8a', '#dbeafe', 'Cloud operations, cybersecurity, and encryption.'],
  ['Investment and Research', PA3, '#b45309', '#fef3c7', 'Investments, research, and portfolio strategy.'],
  ['Fund Management', PA3, '#a16207', '#fef9c3', 'Fund operations and investment administration.'],
  ['Policy and Programs', PA3, '#147b68', '#e2f5ef', 'Policy design, programmes, and regulatory reform.'],
  ['Legal Affairs', PA3, '#9f1239', '#ffe4e6', 'Legal, regulatory, and case management.'],
  ['Human Resources', PA4, '#b43f6b', '#fde8ef', 'People, learning, recruitment, and employee experience.'],
  ['Financial Management', PA4, '#0f766e', '#ccfbf1', 'Finance, ERP, and procurement systems.'],
  ['General Services', PA4, '#52606d', '#e5e7eb', 'Facilities, procurement, and shared services.'],
  ['Corporate Affairs', PA4, '#6b21a8', '#f3e8ff', 'Corporate coordination and administration.'],
  ['Executive Bureau', PA4, '#1e40af', '#dbeafe', 'Executive coordination and organisational governance.'],
  ['Finance', PA4, '#047857', '#d1fae5', 'Financial sponsorship and corporate finance support.'],
  ['Enterprise Risk and Compliance', PA4, '#7c2d12', '#ffedd5', 'Enterprise risk, compliance, and GRC.'],
  ['Internal Audit and Risk Management', PA4, '#9a3412', '#ffedd5', 'Internal audit and investment risk oversight.'],
  ['Building Committee', PA4, '#365314', '#ecfccb', 'New office building and facilities commercialisation.'],
];

export const teamColors = Object.fromEntries(TEAM_DEFS.map(([name, , color, soft]) => [name, {color, soft}]));

export const initialCompany = {
  name: 'Pension Office',
  tagline: 'Annual Work Plan 2026',
  industry: 'Social Security',
  website: 'https://pension.gov.mv',
  domain: 'pension.gov.mv',
  description: 'The Maldives Pension Office administers the Maldives Retirement Pension Scheme and related social protection services, with this workspace tracking the 2026 Annual Work Plan.',
  logo: '',
};

export const initialProfile = {
  name: 'Strategy Office',
  email: 'strategy@pension.gov.mv',
  role: 'Workspace admin',
  title: 'Annual Work Plan 2026',
  photo: '',
};

export const initialCycles = [
  {id: 'cy2025', name: '2025', start: '2025-01-01', end: '2025-12-31', status: 'Closed', description: 'Prior-year annual objectives from the five-year plan.'},
  {id: 'cy2026', name: '2026', start: '2026-01-01', end: '2026-12-31', status: 'Active', description: 'Current Annual Work Plan execution cycle.'},
  {id: 'cy2027', name: '2027', start: '2027-01-01', end: '2027-12-31', status: 'Planning', description: 'Forward-year objectives in the five-year plan.'},
];

export const initialTeams = TEAM_DEFS.map(([name, division, color, soft, description], i) => ({
  id: `team${i}`,
  name,
  division,
  lead: name === 'Pension Office' ? 'Strategy Office' : '',
  color,
  soft,
  description,
  members: name === 'Pension Office' ? ['Strategy Office'] : [name],
}));

const memberNames = ['Strategy Office', ...TEAM_DEFS.map(([name]) => name).filter(name => name !== 'Pension Office')];
export const initialMembers = memberNames.map((name, i) => ({
  id: `member${i}`,
  name,
  email: `${name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')}@pension.gov.mv`,
  role: name === 'Strategy Office' ? 'Workspace admin' : 'Department',
  status: 'Active',
}));

const initials = name => name.split(' ').filter(Boolean).map(x => x[0]).join('').slice(0, 2).toUpperCase();

function item({id, title, description, team, division, owner, period, parentId, krs = [], related = [], type}) {
  const extra = [
    type === 'Aspirational' ? 'Aspirational.' : '',
    related.length ? `Related departments: ${related.join(', ')}.` : '',
  ].filter(Boolean).join(' ');
  return {
    id,
    title,
    description: extra ? `${description} ${extra}`.trim() : description,
    team,
    division,
    owner: owner || team,
    initials: initials(owner || team),
    progress: 0,
    status: 'Not started',
    period,
    parentId: parentId || null,
    updated: 'Imported',
    keyResults: krs.map((krTitle, i) => ({id: `${id}-kr${i + 1}`, title: krTitle, value: 0})),
    initiatives: [],
  };
}

function parent(id, code, title, description, division) {
  return item({
    id,
    title: `${code}  ${title}`,
    description,
    team: 'Pension Office',
    division,
    owner: 'Strategy Office',
    period: '2026',
  });
}

export const initialGoals = [
  parent('g-1-1', '1.1', 'Enhance client satisfaction and brand reputation by positioning Pension Office as a leader in Client Experience', 'Five-year goal: build a client-centric culture, multi-channel support, and internationally recognised service quality.', PA1),
  item({id: 'g-1-1-a', title: '1.1.a  Establish a client-centric culture to improve service quality.', description: 'Lay the foundations for client-centric service across the organisation.', team: 'Client Relations', division: PA1, period: '2025', parentId: 'g-1-1', related: ['Collection and Compliance', 'Pensions and Benefits', 'Pension Coverage Extension', 'Registration and Records', 'Public Relations', 'Innovation and Technology'], krs: [
    'Comprehensive assessment of client service touchpoints conducted and key areas for improvement identified.',
    'Client-centric Service Strategy developed and implemented.',
    'Employee training programs initiated with 100% of employees completing customer service training.',
  ]}),
  item({id: 'g-1-1-b', title: '1.1.b  Strengthen and expand client-centric practices to enhance service quality.', description: 'Extend client-centric practices and personalised communication.', team: 'Client Relations', division: PA1, period: '2026', parentId: 'g-1-1', related: ['Stakeholder Relations', 'Pension Services'], krs: [
    'Customer service training completed for 100% of employees.',
    '2 additional client-centric service initiatives launched.',
    'A personalized communication strategy developed and rolled out for 50% of clients.',
  ]}),
  item({id: 'g-1-1-c', title: '1.1.c  Embed client-centricity in organisation’s culture and external perception.', description: 'Make client-centricity visible internally and externally.', team: 'Client Relations', division: PA1, period: '2027', parentId: 'g-1-1', related: ['Stakeholder Relations', 'Pension Services'], krs: [
    'Promotion of client-centric culture initiated in public domains.',
    'Personalized communication strategy extended to 100% of clients.',
    'Customer satisfaction scores increased by 20% compared to 2025 baseline.',
  ]}),
  item({id: 'g-1-1-d', title: '1.1.d  Enhance existing multi-channel Client Support Mechanism to improve client satisfaction.', description: 'Strengthen the current multi-channel support model.', team: 'Client Relations', division: PA1, period: '2025', parentId: 'g-1-1', related: ['Stakeholder Relations', 'Innovation and Technology'], krs: [
    'A client experience strategy, including new service guidelines and response protocols, developed and implemented.',
    'Requirements gathered for the development of a unified platform for client interactions.',
    'First contact resolution rate maintained at 70% of client service requests.',
  ]}),
  item({id: 'g-1-1-e', title: '1.1.e  Optimize and expand multi-channel support capabilities.', description: 'Fully enhance the organisation’s approach to support services.', team: 'Client Relations', division: PA1, period: '2026', parentId: 'g-1-1', related: ['Stakeholder Relations', 'Innovation and Technology', 'Software Engineering'], krs: [
    'Unified platform for client interactions developed.',
    'Unified platform implemented for client interactions across all channels.',
    'First contact resolution rate increased to 70%.',
    'Data analytics implemented for personalized services.',
  ]}),
  item({id: 'g-1-1-f', title: '1.1.f  Initiate proactive service measures and lay groundwork for predictive support.', description: 'Begin proactive outreach and predictive client support capability.', team: 'Client Relations', division: PA1, period: '2026', parentId: 'g-1-1', related: ['Stakeholder Relations', 'Innovation and Technology', 'Software Engineering'], krs: [
    'Collection and analysis of client data initiated for personalized services.',
    'Proactive outreach for client support initiated, reaching 5% of clients.',
    'Requirements for a predictive client support system identified and documented.',
    'Development of predictive client support system initiated.',
    'Predictive client support system implemented across 50% of channels.',
    'Decision-making empowerment tools introduced for client service teams.',
  ]}),
  item({id: 'g-1-1-g', title: '1.1.g  Fully implement and optimize predictive and proactive service capabilities.', description: 'Scale predictive support and reduce client-reported issues.', team: 'Client Relations', division: PA1, period: '2027', parentId: 'g-1-1', related: ['Stakeholder Relations', 'Innovation and Technology', 'Software Engineering'], krs: [
    'Feedback system launched with a 5% user participation rate.',
    'Proactive outreach extended to 15% of clients.',
    'Predictive client support system fully implemented across all service channels.',
    '10% reduction in client-reported issues achieved through proactive and predictive measures.',
  ]}),
  item({id: 'g-1-1-h', title: '1.1.h  Achieve ISSA Certification for Service Quality.', description: 'Elevate service standards and demonstrate commitment to international best practices in social security administration.', team: 'Policy and Programs', division: PA1, period: '2026', parentId: 'g-1-1', related: ['Stakeholder Relations', 'Pension Services'], krs: [
    'Self-assessment on ISSA Recognition for Service Quality completed.',
    'Gaps identified in the self-assessment addressed.',
    'Internal policies and procedures updated and aligned with ISSA Guidelines.',
    'Documentation submitted for the ISSA Recognition Programme.',
    '100% of the feedback and recommendations addressed and resolved.',
    'Obtained the ISSA Certificate of Excellence in Service Quality.',
  ]}),

  parent('g-1-2', '1.2', 'Strengthen public perception of the contributory pension system and promote saving behaviour', 'Empower individuals to make informed decisions about retirement, financial literacy, and MRPS participation.', PA1),
  item({id: 'g-1-2-a', title: '1.2.a  Increase public awareness on evolving demographic trends and disruptions impacting future workforce and retirement systems.', description: 'Build public understanding of workforce and retirement challenges.', team: 'Public Relations', division: PA1, period: '2025', parentId: 'g-1-2', related: ['Stakeholder Relations', 'Events and Brand Management'], krs: [
    'Awareness campaign launched on future workforce and retirement challenges.',
    'Social media series on impact of workforce transformation on retirement planning launched.',
    'Outreach program completed for universities and colleges.',
    'Public forum / panel discussion on future workforce retirement needs held.',
  ]}),
  item({id: 'g-1-2-b', title: '1.2.b  Encourage individuals to prioritize retirement planning in response to demographic shifts.', description: 'Help people plan for retirement amid evolving workforce realities.', team: 'Public Relations', division: PA1, period: '2026', parentId: 'g-1-2', related: ['Stakeholder Relations', 'Events and Brand Management'], krs: [
    'Educational program on early retirement planning launched.',
    'Workshops on managing personal finances and retirement planning conducted.',
    'Retirement planning toolkits launched for self-employed and gig workers.',
    'Partnerships established with employers to promote retirement planning tools.',
    'Testimonials and stories on effectiveness of retirement planning published.',
  ]}),
  item({id: 'g-1-2-c', title: '1.2.c  Raise awareness on the vital role of social protection systems in ensuring economic security and wellbeing.', description: 'Communicate the role of social protection in the Maldives.', team: 'Public Relations', division: PA1, period: '2027', parentId: 'g-1-2', related: ['Stakeholder Relations', 'Events and Brand Management'], krs: [
    'Awareness campaign launched on the vital role of social protection systems.',
    'Public forum / panel discussions held on social protection systems and demographic changes.',
    'Social media series on responsibilities of various actors in social protection systems launched.',
    'Testimonials and stories published on success of social protection mechanisms in Maldives.',
  ]}),
  item({id: 'g-1-2-d', title: '1.2.d  Introduce foundational financial literacy concepts from an early age.', description: 'Raise awareness on managing money wisely among youth.', team: 'Public Relations', division: PA1, period: '2025', parentId: 'g-1-2', related: ['Stakeholder Relations', 'Events and Brand Management'], krs: [
    'Financial literacy syllabus developed.',
    'Interactive seminar and workshop series conducted for students.',
    'Partnerships established with educational institutes to conduct financial literacy programs.',
    'Youth-focused social media content series launched.',
  ]}),
  item({id: 'g-1-2-e', title: '1.2.e  Empower individuals to make informed and practical financial decisions.', description: 'Give people tools and programmes that shape future financial outcomes.', team: 'Public Relations', division: PA1, period: '2026', parentId: 'g-1-2', related: ['Stakeholder Relations', 'Events and Brand Management', 'Innovation and Technology', 'Software Engineering'], krs: [
    'Interactive workshop series on financial simulation/games launched.',
    'Mentorship program for youth established.',
    'Personal finance tracking features introduced for Pension App.',
    'Financial planning toolkits and content made available on the Pension Office website.',
  ]}),
  item({id: 'g-1-2-f', title: '1.2.f  Encourage long-term financial planning and savings behavior.', description: 'Help individuals build sustainable financial security.', team: 'Public Relations', division: PA1, period: '2027', parentId: 'g-1-2', related: ['Stakeholder Relations', 'Events and Brand Management', 'Innovation and Technology'], krs: [
    'Awareness campaign on long-term financial security launched.',
    'Workshop series conducted on entrepreneurship and wealth-building strategies.',
    'Youth ambassador program launched.',
    'Interactive financial planning tools introduced on the Pension Office website.',
  ]}),
  item({id: 'g-1-2-g', title: '1.2.g  Engage with MRPS members to establish understanding of the scheme and benefits of contributing regularly.', description: 'Improve member literacy on MRPS and regular contributions.', team: 'Public Relations', division: PA1, period: '2025', parentId: 'g-1-2', related: ['Stakeholder Relations', 'Events and Brand Management', 'Innovation and Technology', 'Software Engineering'], krs: [
    'Lifecycle engagement strategy developed for MRPS members.',
    'Easy-to-understand content collection created for MRPS.',
    'Onboarding program for new members launched.',
    'Revamped MRPS savings calculator launched.',
  ]}),
  item({id: 'g-1-2-h', title: '1.2.h  Engage with MRPS members to encourage them to increase contributions and optimize their savings.', description: 'Help members maximise contributions.', team: 'Public Relations', division: PA1, period: '2026', parentId: 'g-1-2', related: ['Stakeholder Relations', 'Events and Brand Management'], krs: [
    'Workshop series on optimising MRPS contributions launched.',
    'Financial advisory content developed for member segments.',
    'Success stories on benefits of contribution maximisation published.',
    'Personalized member journey maps feature introduced.',
  ]}),
  item({id: 'g-1-2-i', title: '1.2.i  Empower MRPS members to maximise use of the scheme for long-term retirement security.', description: 'Deepen member use of MRPS for retirement security.', team: 'Public Relations', division: PA1, period: '2027', parentId: 'g-1-2', related: ['Stakeholder Relations', 'Events and Brand Management'], krs: [
    'Retirement readiness campaign launched.',
    'Program launched in partnership with employers to incentivise members to increase contributions.',
    'Public lectures / panel discussions held on the future of retirement planning in Maldives.',
  ]}),
  item({id: 'g-1-2-j', title: '1.2.j  Develop a national Pension Perception Index to benchmark the Maldives Pension System.', description: 'Understand perceptions, trends, and challenges in the pension system.', team: 'Public Relations', division: PA1, period: '2026', parentId: 'g-1-2', related: ['Policy and Programs', 'Stakeholder Relations', 'Data Services'], krs: [
    'Pension Perception Index, outlining the key dimensions, indicators, and data sources, designed.',
    'Data collected, and research finalised for Pension Perception Index score.',
    'Pension Perception Index launched.',
  ]}),
  item({id: 'g-1-2-k', title: '1.2.k  Identify and engage with unregistered employers to increase MRPS membership.', description: 'Bring unregistered employers into MRPS.', team: 'Pension Coverage Extension', division: PA1, period: '2026', parentId: 'g-1-2', related: ['Collection and Compliance', 'Data Services'], krs: [
    'Mechanism to identify potential unregistered employers created and implemented.',
    'Analysis to identify unregistered employers who have not enrolled employees conducted and information on at least 50 such employers provided for compliance action.',
    'Unregistered employers analyzed and data for targeted awareness sessions delivered to reach at least 50 potential employers.',
  ]}),
  item({id: 'g-1-2-l', title: '1.2.l  Implement targeted measures to enhance participation of informal sector workers in the MRPS.', description: 'Close coverage gaps in the informal sector.', team: 'Pension Coverage Extension', division: PA1, period: '2027', parentId: 'g-1-2', related: ['Policy and Programs', 'Data Services', 'Stakeholder Relations'], krs: [
    'Composition of informal sector mapped and coverage gaps identified.',
    'Measures introduced for 3 key industry groups within the informal sector.',
    'Participation of informal sector workers in MRPS increased by 10%.',
  ]}),

  parent('g-1-3', '1.3', 'Champion socio-economic advancement by contributing to and leading initiatives that promote a resilient and inclusive society', 'Youth programmes and partnerships that improve wellbeing for young people and the elderly.', PA1),
  item({id: 'g-1-3-a', title: '1.3.a  Launch a value-based youth program to drive behavioural change and socio-economic advancement of young people.', description: 'Design and pilot a value-based youth programme.', team: 'Public Relations', division: PA1, period: '2025', parentId: 'g-1-3', related: ['Policy and Programs', 'Events and Brand Management'], krs: [
    'Program framework including program content, implementation plan, and monitoring & evaluation framework completed.',
    'Pilot program conducted in two atolls, engaging at least 50 young people.',
    'Program satisfaction rate of 80% achieved from participants based on post-program surveys.',
  ]}),
  item({id: 'g-1-3-b', title: '1.3.b  Expand the reach of the value-based youth program to nationwide scale.', description: 'Grow the youth programme beyond the pilot.', team: 'Public Relations', division: PA1, period: '2026', parentId: 'g-1-3', related: ['Policy and Programs', 'Events and Brand Management'], krs: [
    'Program design refined based on pilot feedback to enhance engagement and impact.',
    'Phase 2 of the value-based youth program conducted in four new atolls, engaging at least 200 young people.',
  ]}),
  item({id: 'g-1-3-c', title: '1.3.c  Establish collaborations with state agencies and NGOs to enhance the health and well-being of the elderly and youth.', description: 'Deliver joint wellbeing initiatives with partners.', team: 'Policy and Programs', division: PA1, period: '2027', parentId: 'g-1-3', related: ['Stakeholder Relations', 'Legal Affairs'], krs: [
    'Two initiatives implemented in collaboration with state agencies.',
    'Two initiatives implemented in collaboration with NGOs or CSOs.',
  ]}),

  parent('g-2-1', '2.1', 'Leverage systems, infrastructure, and expertise to extend services to partner agencies', 'Enhance data sharing and system harmonization to strengthen public services through SaaS, data centre, and agency offerings.', PA2),
  item({id: 'g-2-1-a', title: '2.1.a  Introduce Software-as-a-Service (SaaS) offerings for other institutions.', description: 'Accelerate digital transformation of public services through SaaS.', team: 'Software Engineering', division: PA2, period: '2025', parentId: 'g-2-1', related: ['Innovation and Technology', 'Legal Affairs'], krs: [
    'Technical documentation completed for SaaS products.',
    'Operational readiness achieved to manage SaaS offerings.',
    'Capacity established to provide technical support to clients.',
    'Auth and PenSign offered on a SaaS basis.',
  ]}),
  item({id: 'g-2-1-b', title: '2.1.b  Introduce Data Centre Services to enhance data sharing and system harmonization across public institutions.', description: 'Stand up data centre services for partner institutions.', team: 'Data Services', division: PA2, period: '2026', parentId: 'g-2-1', related: ['Innovation and Technology', 'Pension Services', 'Legal Affairs'], krs: [
    'Data Sharing Policy and Procedure developed.',
    'Operational readiness achieved to manage Data Centre Services.',
    'Technical documentation completed for Data Centre Services.',
    'Data Centre Services launched.',
  ]}),
  item({id: 'g-2-1-c', title: '2.1.c  Establish operational readiness to introduce agency services to partner agencies and public service institutes.', description: 'Prepare Contribution Agency Service for launch.', team: 'Data Services', division: PA2, period: '2026', parentId: 'g-2-1', related: ['Innovation and Technology', 'Collection and Compliance', 'Legal Affairs'], krs: [
    'Operational readiness achieved to introduce agency services.',
    'Technical documentation completed for Contribution Agency Service.',
    'Support team established to address issues related to Agency Services.',
    'Contribution Agency Service introduced.',
  ]}),
  item({id: 'g-2-1-d', title: '2.1.d  Introduce the Payout Agency Service to expand agency service offerings.', description: 'Meet partner agency payout needs and raise satisfaction.', team: 'Data Services', division: PA2, period: '2027', parentId: 'g-2-1', related: ['Innovation and Technology', 'Legal Affairs'], krs: [
    'Operational readiness achieved to introduce agency services.',
    'Technical documentation completed for Payout Agency Service.',
    'Payout Agency Service introduced.',
    'Satisfaction score of 4.7/5 achieved across all agency services.',
  ]}),
  item({id: 'g-2-1-e', title: '2.1.e  Expand services and requirements to strive for sustainable business solutions.', description: 'Assess feasibility and build operating capability for sustainable offerings.', team: 'Innovation and Technology', division: PA2, period: '2027', parentId: 'g-2-1', type: 'Aspirational', related: ['Investment and Research', 'Policy and Programs'], krs: [
    'Feasibility study and business case analysis completed.',
    'Organizational and operational frameworks developed.',
    'Infrastructure and operational capabilities established.',
  ]}),

  parent('g-2-2', '2.2', 'Enhance service quality through automation and integration of cutting-edge technology', 'Redevelop core member and payout systems and introduce AI-enabled service capabilities.', PA2),
  item({id: 'g-2-2-a', title: '2.2.a  Redevelop the Member Portal to enhance user experience and functionality.', description: 'Deliver a more usable, personalised member portal.', team: 'Software Engineering', division: PA2, period: '2026', parentId: 'g-2-2', related: ['Innovation and Technology', 'Collection and Compliance'], krs: [
    'Key features and improvements identified for the new portal.',
    'Improved navigation and accessibility features developed.',
    'New personalized dashboards implemented.',
    'Enhanced account management options implemented.',
    'Redeveloped Member Portal launched.',
  ]}),
  item({id: 'g-2-2-b', title: '2.2.b  Redevelop the Information Management System (IMS) to enhance performance, scalability, and usability.', description: 'Replace IMS to serve departments more effectively.', team: 'Software Engineering', division: PA2, period: '2026', parentId: 'g-2-2', related: ['Innovation and Technology'], krs: [
    'Key features and areas for improvements identified.',
    'New system developed.',
    'New Information Management System successfully deployed.',
  ]}),
  item({id: 'g-2-2-c', title: '2.2.c  Introduce an AI-powered robotic kiosk system for office security and access management.', description: 'Pilot and roll out robotic kiosks at key entry points.', team: 'Data Services', division: PA2, period: '2027', parentId: 'g-2-2', type: 'Aspirational', related: ['Member Services', 'Innovation and Technology', 'Stakeholder Relations'], krs: [
    'Facial recognition implemented for real-time visitor identification.',
    'New security alert feature implemented for monitoring of entrances and exits.',
    'Prototype Robotic Kiosk installed at the main entrance.',
    'AI-powered instruction system developed to provide information to visitors.',
    'Visitor profile management system developed for automatic retrieval of visitor information.',
    'Final version of the Robotic Kiosk rolled out to key entry points.',
  ]}),
  item({id: 'g-2-2-d', title: '2.2.d  Explore options for integrating a payment gateway into the KOSHAARU Pension Information Management System.', description: 'Improve operational efficiency and member convenience through payments.', team: 'Innovation and Technology', division: PA2, period: '2027', parentId: 'g-2-2', type: 'Aspirational', related: ['Innovation and Technology'], krs: [
    'Analysis of available payment gateway options completed.',
    'Feasibility of integrating payment gateway services assessed.',
    'Payment gateway service provider selected.',
    'Partnership established with selected service provider.',
  ]}),
  item({id: 'g-2-2-e', title: '2.2.e  Pilot a program to develop an e-wallet application for pensioners.', description: 'Enhance pension services with an e-wallet offering.', team: 'Software Engineering', division: PA2, period: '2027', parentId: 'g-2-2', type: 'Aspirational', related: ['Innovation and Technology'], krs: [
    'Technical specifications and requirements for the application identified.',
    'Beta version of the application developed and tested.',
    'Pilot launch of the application conducted.',
  ]}),
  item({id: 'g-2-2-f', title: '2.2.f  Roll out the new mobile application to enhance service quality and member experience.', description: 'Complete testing and launch the Pension Office mobile app.', team: 'Software Engineering', division: PA2, period: '2026', parentId: 'g-2-2', related: ['Public Relations', 'Client Relations'], krs: [
    'Completed 100% testing of mobile app.',
    'Mobile App launched and implemented.',
  ]}),
  item({id: 'g-2-2-g', title: '2.2.g  Redevelop and launch the KOSHAARU payout service.', description: 'Improve payout efficiency and member satisfaction.', team: 'Software Engineering', division: PA2, period: '2026', parentId: 'g-2-2', related: ['Data Services', 'Pensions and Benefits', 'Pension Services'], krs: [
    'Key features and improvements identified for the new system.',
    'Billing service redeveloped.',
    'Payout service redeveloped.',
    'Payout system successfully launched.',
  ]}),
  item({id: 'g-2-2-h', title: '2.2.h  Integrate AI tools across various services to enhance performance and user experience.', description: 'Select and deploy AI tools in identified service areas.', team: 'Innovation and Technology', division: PA2, period: '2026', parentId: 'g-2-2', related: ['General Services', 'Human Resources'], krs: [
    'Requirements identified for utilizing AI tools to enhance performance.',
    'AI tool(s) selected as per the organizational needs.',
    'Selected AI tool(s) procured.',
    'AI tool(s) integrated across at least 50% of the identified areas.',
  ]}),
  item({id: 'g-2-2-i', title: '2.2.i  Improve integration of AI-powered search features in internal and external applications.', description: 'Raise search accuracy and reduce manual support load.', team: 'Data Services', division: PA2, period: '2026', parentId: 'g-2-2', related: ['Innovation and Technology'], krs: [
    'Accuracy of search feature usage for internal documents and data retrieval increased by 15%.',
    'Search query processing time reduced by 50% compared to the current system.',
    'Chatbot deployed for internal use cases.',
    'Number of manual support requests reduced by 30%.',
    '75% positive feedback score from internal users of AI-powered applications.',
  ]}),

  parent('g-3-1', '3.1', 'Diversify domestic investments to optimise portfolio allocation and strengthen resilience', 'Reduce government-security concentration and grow development and private-sector investments.', PA3),
  item({id: 'g-3-1-a', title: '3.1.a  Develop a long-term divestment plan to reduce holdings in government securities.', description: 'Align investments to the investment horizon and optimize returns.', team: 'Investment and Research', division: PA3, period: '2025', parentId: 'g-3-1', related: ['Fund Management'], krs: [
    'Concept paper on divestment developed to outline the framework for reducing holdings in government securities.',
    'Stakeholders consulted to discuss and implement the divestment plan.',
    'Long-term divestment / conversion plan developed with targets for different time horizons.',
  ]}),
  item({id: 'g-3-1-b', title: '3.1.b  Implement a long-term divestment plan to reduce holdings in government securities.', description: 'Execute the approved divestment plan.', team: 'Investment and Research', division: PA3, period: '2026', parentId: 'g-3-1', related: ['Fund Management'], krs: [
    'Long-term divestment plan finalised.',
    'Long-term divestment implemented with targets for different time horizons.',
  ]}),
  item({id: 'g-3-1-c', title: '3.1.c  Increase investments in multi-sectoral development projects to support sustainable economic growth.', description: 'Partner on economic, infrastructure, and ESG financing.', team: 'Investment and Research', division: PA3, period: '2026', parentId: 'g-3-1', krs: [
    'Strategic partnership established with government agencies to identify development projects.',
    'Partnered with private, government and international agencies to identify financing options for ESG initiatives including climate financing.',
    'Invested in development projects (economic development projects, infrastructure development projects).',
  ]}),
  item({id: 'g-3-1-d', title: '3.1.d  Increase investments in the private sector to support expansion of economic activities and growth.', description: 'Create instruments and diligence frameworks for private-sector financing.', team: 'Investment and Research', division: PA3, period: '2027', parentId: 'g-3-1', related: ['Legal Affairs', 'Public Relations'], krs: [
    'Strategic partnership established with CMDA and other stakeholders to conduct awareness sessions on financing options through MRPS.',
    'Financial instruments tailored for private sector financing developed.',
    'Due diligence frameworks and performance monitoring frameworks developed for the structured financial instruments.',
    'Investments made in a structured financial instrument.',
  ]}),

  parent('g-3-2', '3.2', 'Enhance MRPS portfolios through international diversification', 'Build foreign-currency capacity, policy readiness, and ETF investment capability.', PA3),
  item({id: 'g-3-2-a', title: '3.2.a  Explore opportunities for foreign currency accumulation to diversify investments.', description: 'Identify FX accumulation options domestically and with multilateral partners.', team: 'Investment and Research', division: PA3, period: '2025', parentId: 'g-3-2', related: ['Legal Affairs'], krs: [
    'Explored opportunities for foreign currency accumulation through collaboration with international and multilateral agencies.',
    'Determined the operational changes of holding and investing USD.',
    'Explored opportunities for foreign currency accumulation within the domestic market.',
  ]}),
  item({id: 'g-3-2-b', title: '3.2.b  Ensure readiness for international investments by developing frameworks, policies, and procedures.', description: 'Prepare jurisdictions, diligence, and custody for overseas investment.', team: 'Investment and Research', division: PA3, period: '2026', parentId: 'g-3-2', related: ['Fund Management'], krs: [
    'Jurisdictions for MRPS investments identified and approval from CMDA obtained.',
    'A due diligence framework developed for ETFs.',
    'Requirements for international custodial services determined.',
  ]}),
  item({id: 'g-3-2-c', title: '3.2.c  Initiate investments in Exchange-Traded Funds (ETFs) to optimize portfolio allocation.', description: 'Stand up ETF operations and begin investment.', team: 'Investment and Research', division: PA3, period: '2027', parentId: 'g-3-2', related: ['Fund Management'], krs: [
    'Pilot simulation for ETFs developed.',
    'Operational set up for investments in ETFs completed.',
    'Conducted a portfolio optimization exercise including the Return Seeking Portfolio.',
    'Revised Statement of Investment Principles (SOIP) and Strategic Asset Allocation (SAA).',
    'Initiated investments in ETFs.',
  ]}),

  parent('g-3-3', '3.3', 'Provide MRPS members with greater flexibility in choosing investment portfolios and retirement options', 'Design post-retirement withdrawals and life-cycle funds for members.', PA3),
  item({id: 'g-3-3-a', title: '3.3.a  Develop and design post-retirement withdrawal options.', description: 'Give members more flexible retirement options.', team: 'Investment and Research', division: PA3, period: '2027', parentId: 'g-3-3', type: 'Aspirational', related: ['Policy and Programs', 'Legal Affairs', 'Stakeholder Relations'], krs: [
    'Preliminary research on post-retirement withdrawal options conducted.',
    'An implementation plan developed for the introduction of post-retirement withdrawal options.',
    'Awareness sessions conducted for members on post-retirement withdrawal options.',
    'Post-retirement withdrawal options introduced to members.',
  ]}),
  item({id: 'g-3-3-b', title: '3.3.b  Develop and design flexible investment portfolios tailored for members.', description: 'Introduce life-cycle fund options.', team: 'Investment and Research', division: PA3, period: '2027', parentId: 'g-3-3', type: 'Aspirational', related: ['Policy and Programs', 'Legal Affairs', 'Stakeholder Relations'], krs: [
    'Preliminary research conducted on introducing life cycle fund options for members.',
    'Implementation plan developed for the introduction of life cycle fund options.',
    'Awareness sessions conducted for members on life cycle funds.',
    'Life cycle funds introduced to members.',
  ]}),

  parent('g-3-4', '3.4', 'Introduce supplementary saving portfolios to strengthen the social protection system and address socio-economic needs', 'Design and launch supplementary savings products for MRPS members.', PA3),
  item({id: 'g-3-4-a', title: '3.4.a  Develop Supplementary Saving Portfolios that meet the socio-economic needs of MRPS members.', description: 'Model multiple supplementary savings portfolios.', team: 'Policy and Programs', division: PA3, period: '2026', parentId: 'g-3-4', related: ['Investment and Research'], krs: [
    'Review of existing supplementary savings schemes and global best practices conducted.',
    'Model for multiple supplementary savings portfolios developed.',
    'Operational and technical requirements identified.',
    'Two supplementary savings portfolios proposed.',
  ]}),
  item({id: 'g-3-4-b', title: '3.4.b  Implement the first Supplementary Savings Portfolio for MRPS members.', description: 'Launch one supplementary savings portfolio.', team: 'Policy and Programs', division: PA3, period: '2027', parentId: 'g-3-4', related: ['Investment and Research', 'Innovation and Technology', 'Pension Services', 'Stakeholder Relations', 'Legal Affairs'], krs: [
    'Partnerships established with relevant stakeholders.',
    'Implementation plan developed including operational readiness, regulatory and legislative revisions, and public awareness sessions.',
    'Operational readiness achieved for the implementation of supplementary savings portfolios.',
    'One supplementary savings portfolio launched.',
  ]}),

  parent('g-3-5', '3.5', 'Strengthen the pension system through research and dialogue on developments in the social security and financial sectors', 'Host international exchange, publish research, and align MRPS regulation with KOSHAARU.', PA3),
  item({id: 'g-3-5-a', title: '3.5.a  Host an international conference on pensions and social security.', description: 'Foster dialogue and exchange of best practices.', team: 'Policy and Programs', division: PA3, period: '2026', parentId: 'g-3-5', related: ['Innovation and Technology', 'Investment and Research', 'Stakeholder Relations', 'Corporate Affairs', 'Executive Bureau', 'Pension Services', 'Finance'], krs: [
    'Partnerships secured with international organisations to support conference organisation.',
    'Theme and concept developed for the conference.',
    'Financial and in-kind sponsorships secured to meet 40% of the projected expenses.',
    'Conference hosted with international participation.',
    'Conference report produced and disseminated.',
  ]}),
  item({id: 'g-3-5-b', title: '3.5.b  Establish a research publication platform to promote evidence-based policy making.', description: 'Create a digital research platform for social security and financial-sector research.', team: 'Policy and Programs', division: PA3, period: '2027', parentId: 'g-3-5', type: 'Aspirational', related: ['Investment and Research', 'Innovation and Technology', 'Stakeholder Relations'], krs: [
    'A concept for establishing a research publication platform finalised.',
    'Collaborations secured with two academic institutions or research organisations.',
    'Digital infrastructure for the research publication platform established.',
    'Publication platform launched with at least four publications.',
  ]}),
  item({id: 'g-3-5-c', title: '3.5.c  Streamline MRPS Regulation to address requirements under the new KOSHAARU System.', description: 'Close regulatory gaps created by the new system.', team: 'Legal Affairs', division: PA3, period: '2026', parentId: 'g-3-5', related: ['Innovation and Technology', 'Pension Services'], krs: [
    'Comprehensive gap analysis of existing MRPS Regulation and the requirements under the new KOSHAARU System completed.',
    'Revised MRPS Regulation drafted and circulated for feedback.',
    'Revised MRPS Regulation finalized.',
  ]}),

  parent('g-4-1', '4.1', 'Improve operational processes and systems through enhancement of functions, organisation-wide digitalisation, and automation', 'Modernise HR, finance, fund, legal, data, and pension operations.', PA4),
  item({id: 'g-4-1-a', title: '4.1.a  Implement a Performance Appraisal system to enhance employee evaluation and development.', description: 'Procure, configure, and migrate PA operations.', team: 'Human Resources', division: PA4, period: '2026', parentId: 'g-4-1', related: ['Innovation and Technology', 'General Services'], krs: [
    'User requirements for the PA System identified.',
    'PA System procured.',
    'System configuration completed to meet the organisation\'s requirements.',
    'All relevant staff trained to use the new PA System.',
    'PA operations migrated to the new System.',
  ]}),
  item({id: 'g-4-1-b', title: '4.1.b  Implement a Recruitment Management System to streamline recruitment.', description: 'Procure, configure, and migrate recruitment operations.', team: 'Human Resources', division: PA4, period: '2026', parentId: 'g-4-1', related: ['Innovation and Technology', 'General Services'], krs: [
    'User requirements for the Recruitment System identified.',
    'Recruitment System procured.',
    'System configuration completed to meet the organisation\'s requirements.',
    'All relevant staff trained to use the new Recruitment System.',
    'Recruitment operations migrated to the new System.',
  ]}),
  item({id: 'g-4-1-c', title: '4.1.c  Expand the existing ERP System (Microsoft Dynamics) for procurement and vendor management.', description: 'Streamline procurement and launch a vendor portal.', team: 'Financial Management', division: PA4, period: '2026', parentId: 'g-4-1', related: ['General Services', 'Innovation and Technology'], krs: [
    'Requirements identified for procurement and vendor management.',
    'Procurement enhancements for Microsoft Dynamics acquired and implemented.',
    'New procurement module integrated with the accounting system.',
    'Vendor portal launched.',
    'Average procurement cycle time reduced by 30%.',
  ]}),
  item({id: 'g-4-1-d', title: '4.1.d  Integrate the HR System (Humanlot) with Microsoft Dynamics 365.', description: 'Improve data flow between HR and ERP.', team: 'Financial Management', division: PA4, period: '2026', parentId: 'g-4-1', related: ['Human Resources', 'Innovation and Technology', 'General Services'], krs: [
    'Integration requirements and challenges identified for both systems.',
    'Services and resources required for the integration procured.',
    'HR System integrated with the ERP platform.',
  ]}),
  item({id: 'g-4-1-e', title: '4.1.e  Establish groundwork for a fund and investment management solution.', description: 'Prepare processes and requirements before implementation.', team: 'Fund Management', division: PA4, period: '2026', parentId: 'g-4-1', related: ['Investment and Research', 'General Services', 'Innovation and Technology'], krs: [
    'Research conducted to evaluate features and compatibility of potential solutions.',
    'Requirements identified for the new system.',
    'Pre-implementation changes required to the fund management processes identified.',
    'Internal processes aligned with the anticipated system requirements.',
  ]}),
  item({id: 'g-4-1-f', title: '4.1.f  Implement a fund and investment management solution.', description: 'Procure, integrate, train, and transition fund management activity.', team: 'Fund Management', division: PA4, period: '2026', parentId: 'g-4-1', related: ['Investment and Research', 'General Services', 'Innovation and Technology'], krs: [
    'Selected fund and investment management solution procured.',
    'New system integrated with the existing accounting system.',
    '90% of required functionalities implemented successfully.',
    '90% of relevant staff trained for proficiency in using the new system.',
    'Historical fund and investment data migrated to the new system.',
    '100% of fund management activities transitioned to the new system.',
  ]}),
  item({id: 'g-4-1-g', title: '4.1.g  Develop a document classification framework and establish a functional archive.', description: 'Standardise archiving for the Pension Office.', team: 'Registration and Records', division: PA4, period: '2026', parentId: 'g-4-1', krs: [
    'Comprehensive document classification framework developed and archiving system implemented.',
    'SOP for archiving new documents implemented.',
  ]}),
  item({id: 'g-4-1-h', title: '4.1.h  Automate court case and legal document management.', description: 'Procure and migrate legal cases onto a dedicated platform.', team: 'Legal Affairs', division: PA4, period: '2026', parentId: 'g-4-1', related: ['Innovation and Technology', 'Corporate Affairs', 'General Services'], krs: [
    'Requirements identified for a case and document management system.',
    'Solution selected from the market and procured.',
    'Procured system implemented and all court cases and legal documents migrated to the new platform.',
    'Legal Affairs team and relevant stakeholders trained on the new system.',
  ]}),
  item({id: 'g-4-1-i', title: '4.1.i  Develop a Management System Portal for ISMS and QMS activities.', description: 'Centralise management-system work in a new portal.', team: 'Software Engineering', division: PA4, period: '2026', parentId: 'g-4-1', related: ['Innovation and Technology', 'Policy and Programs'], krs: [
    'Key features and improvements identified for the new Portal.',
    'New Management System Portal developed.',
    'ISMS and QMS activities migrated to the new Portal.',
    'Management System Portal successfully launched.',
  ]}),
  item({id: 'g-4-1-j', title: '4.1.j  Redevelop the ticketing system to enhance efficiency and functionality.', description: 'Replace the ticketing system for users and support teams.', team: 'Software Engineering', division: PA4, period: '2026', parentId: 'g-4-1', related: ['Innovation and Technology'], krs: [
    'Key features and improvements identified for the new system.',
    'New ticketing system developed.',
    'New Ticketing System successfully launched.',
  ]}),
  item({id: 'g-4-1-k', title: '4.1.k  Enhance the Authorization Service by automating access granting and revocation.', description: 'Improve efficiency and security of access management.', team: 'Software Engineering', division: PA4, period: '2026', parentId: 'g-4-1', related: ['Innovation and Technology'], krs: [
    'Access granting process automated based on predefined roles and permissions.',
    'Automatic access revocation implemented for users no longer requiring authorization or upon role change.',
    'Real-time monitoring integrated to track and audit access changes automatically.',
    'Manual intervention reduced in the access management process by 90%.',
  ]}),
  item({id: 'g-4-1-l', title: '4.1.l  Develop a Data Dictionary for all systems.', description: 'Standardise data attributes across the organisation.', team: 'Data Services', division: PA4, period: '2026', parentId: 'g-4-1', related: ['Innovation and Technology'], krs: [
    'Identified and documented 100% of data attributes across all systems used within the organization.',
    'Naming conventions, formats, and definitions for all key data attributes standardized, ensuring consistency across 100% of systems.',
    'A centralized platform implemented to host the data dictionary, ensuring easy access and updates by relevant stakeholders.',
  ]}),
  item({id: 'g-4-1-m', title: '4.1.m  Implement a data archiving mechanism for long-term data management.', description: 'Automate archiving for compliance and storage optimisation.', team: 'Data Services', division: PA4, period: '2026', parentId: 'g-4-1', related: ['Innovation and Technology'], krs: [
    'Data Archiving Policy and Procedure established.',
    'Data Archiving Process automated.',
  ]}),
  item({id: 'g-4-1-n', title: '4.1.n  Introduce a proof of life requirement to ensure accurate pension payouts.', description: 'Prevent fraudulent claims by verifying living status before payout.', team: 'Pensions and Benefits', division: PA4, period: '2026', parentId: 'g-4-1', related: ['Innovation and Technology'], krs: [
    'Streamlined process for collecting and verifying proof of life developed.',
    'Seamless integration of the proof of life process with the pension payout system ensured to automatically suspend payments for recipients who do not complete verification.',
  ]}),
  item({id: 'g-4-1-o', title: '4.1.o  Establish a dedicated Recoveries Department.', description: 'Consolidate debt recovery across departments.', team: 'Pension Services', division: PA4, period: '2026', parentId: 'g-4-1', related: ['Pensions and Benefits'], krs: [
    'Recovery Department established defining its structure, responsibilities, and processes for debt collection.',
    'Debt recovery responsibilities, including contributions and overpayment recovery, transferred to Recoveries Department.',
    'Clear debt recovery techniques and outreach protocols implemented to improve efficiency and reduce outstanding debts.',
  ]}),
  item({id: 'g-4-1-p', title: '4.1.p  Introduce an Alternative Dispute Resolution (ADR) mechanism for non-compliant cases.', description: 'Resolve cases more efficiently and reduce lengthy court proceedings.', team: 'Collection and Compliance', division: PA4, period: '2026', parentId: 'g-4-1', related: ['Legal Affairs'], krs: [
    'Most suitable approach in the local context finalized by conducting a comprehensive review of ADR mechanisms used in similar regulatory environments.',
    'ADR policy, including case criteria, timelines, and procedures for resolution, established.',
    'ADR process launched and at least 40% of non-compliant cases resolved through the mechanism within the first six months of implementation.',
  ]}),
  item({id: 'g-4-1-q', title: '4.1.q  Separate the pension contribution collection function.', description: 'Streamline collection and same-day reconciliation.', team: 'Pension Services', division: PA4, period: '2026', parentId: 'g-4-1', related: ['Collection and Compliance'], krs: [
    'New collection function established by clearly defining roles, responsibilities, and staffing requirement.',
    'Standardized procedures developed and enforced to ensure that 100% of pension contributions are reconciled within the same day of receipt.',
    'Unmatched and excess pension contribution transactions resolved by implementing enhanced tracking, monitoring, and follow-up mechanisms.',
  ]}),

  parent('g-4-2', '4.2', 'Introduce digital infrastructure management and cyber security solutions', 'Strengthen monitoring, response, and security across all systems.', PA4),
  item({id: 'g-4-2-a', title: '4.2.a  Enhance cybersecurity through Endpoint Detection and Response (EDR) solutions.', description: 'Select, procure, and implement EDR.', team: 'Cloud and Security', division: PA4, period: '2026', parentId: 'g-4-2', related: ['Innovation and Technology', 'General Services'], krs: [
    'Options available in the market assessed.',
    'Preferred solution selected.',
    'Selected solution procured.',
    'Selected solution implemented.',
  ]}),
  item({id: 'g-4-2-b', title: '4.2.b  Introduce a data masking solution to enhance data security and privacy.', description: 'Protect sensitive data in non-production and shared environments.', team: 'Data Services', division: PA4, period: '2026', parentId: 'g-4-2', related: ['Innovation and Technology'], krs: [
    'Compliance and security requirements for data masking identified.',
    'Data masking solution selected.',
    'Selected data masking solution implemented successfully.',
  ]}),
  item({id: 'g-4-2-c', title: '4.2.c  Establish a solution for audit log visualization of database-level activities.', description: 'Link application requests to CloudSQL logs and alert on anomalies.', team: 'Data Services', division: PA4, period: '2026', parentId: 'g-4-2', related: ['Innovation and Technology'], krs: [
    'User requests from the software level linked to CloudSQL audit logs.',
    'Interactive dashboards developed in BigQuery for visualizing audit log data.',
    'Alert mechanism introduced for flagging of abnormal activities.',
  ]}),
  item({id: 'g-4-2-d', title: '4.2.d  Implement a robust data deletion procedure for resources stored on Cloud.', description: 'Improve compliance, security, and resource management.', team: 'Cloud and Security', division: PA4, period: '2026', parentId: 'g-4-2', related: ['Innovation and Technology'], krs: [
    'Procedure to identify data resources for deletion developed and standards established for compliance and security.',
    'Data deletion procedure implemented in a test environment.',
    'Data deletion solution deployed in the production environment with zero downtime.',
    'Post-deployment audit conducted to verify compliance and effectiveness.',
  ]}),
  item({id: 'g-4-2-e', title: '4.2.e  Establish a Secure Internal Encryption Key Management Process.', description: 'Generate, distribute, store, and audit encryption keys internally.', team: 'Cloud and Security', division: PA4, period: '2026', parentId: 'g-4-2', related: ['Innovation and Technology'], krs: [
    'Internal encryption key management process formulated.',
    'Encryption key generation, distribution, and storage protocols implemented.',
    'Security audit conducted to ensure compliance with industry standards.',
    'Relevant personnel trained on the new encryption key management procedures.',
  ]}),
  item({id: 'g-4-2-f', title: '4.2.f  Convert Pension GCP encryption keys from Google-managed to Pension Office-managed keys.', description: 'Take ownership of cloud encryption keys with zero data loss.', team: 'Cloud and Security', division: PA4, period: '2026', parentId: 'g-4-2', related: ['Innovation and Technology'], krs: [
    'Current Google-managed encryption key configurations assessed and the migration plan documented.',
    'Transitioned to Pension Office-managed keys with zero data loss.',
    'All applications and services using the encryption keys updated to utilize the new keys.',
    'Security audit post-migration conducted to validate the integrity and security of the new key management process.',
  ]}),

  parent('g-4-3', '4.3', 'Adopt robust governance, compliance and risk frameworks to ensure member trust, business continuity, and regulatory alignment', 'Implement ISSA, ISO 31000, compliance, GRC, and investment-risk frameworks.', PA4),
  item({id: 'g-4-3-a', title: '4.3.a  Implement a Data Governance Framework aligned with ISSA Guidelines.', description: 'Raise data integrity, quality, and compliance.', team: 'Data Services', division: PA4, period: '2026', parentId: 'g-4-3', related: ['Innovation and Technology'], krs: [
    'Data governance policies and standards developed in alignment with ISSA guidelines.',
    'Data Governance Council, Data Stewards, and Data Owners established for all major data domains.',
    'Data quality management processes and tools implemented, achieving a 95% data quality rate for critical data sets.',
    'Compliance with data security and regulatory requirements ensured by implementing appropriate access controls and achieving zero compliance violations.',
    'Metadata management rolled out across the organization, documenting 100% of data lineage for key systems.',
    '100% of relevant staff trained on the new data governance policies and procedures.',
  ]}),
  item({id: 'g-4-3-b', title: '4.3.b  Achieve ISSA Certification for Good Governance.', description: 'Demonstrate adherence to international governance standards.', team: 'Policy and Programs', division: PA4, period: '2026', parentId: 'g-4-3', related: ['Executive Bureau'], krs: [
    'Self-assessment on ISSA Recognition for Good Governance completed.',
    'Gaps identified in the self-assessment addressed.',
    'Internal policies and procedures updated and aligned with ISSA Guidelines.',
    'Documentation submitted for the ISSA Recognition Programme.',
    '100% of the feedback and recommendations addressed and resolved.',
    'Obtained the ISSA Certificate of Excellence in Good Governance.',
  ]}),
  item({id: 'g-4-3-c', title: '4.3.c  Implement an ISO 31000:2018 compliant risk management framework.', description: 'Establish identification, assessment, and mitigation of risks.', team: 'Policy and Programs', division: PA4, period: '2026', parentId: 'g-4-3', related: ['Enterprise Risk and Compliance', 'General Services'], krs: [
    'Consultant onboarded for development and implementation of risk management framework and processes.',
    'GAP analysis completed.',
    'All necessary documentation developed as per ISO 31000:2018 guidelines.',
    'ISO 31000:2018 compliant risk management framework and processes implemented.',
  ]}),
  item({id: 'g-4-3-d', title: '4.3.d  Verify compliance with ISO 31000:2018 guidelines.', description: 'Demonstrate commitment to risk-management best practice.', team: 'Policy and Programs', division: PA4, period: '2027', parentId: 'g-4-3', related: ['Enterprise Risk and Compliance', 'General Services'], krs: [
    'Internal audit of the implemented risk management mechanism conducted.',
    'Independent audit firm hired for conformity assessment.',
    'Conformity assessment audit(s) completed.',
    'Successfully assessed for conformity with ISO 31000:2018 guidelines.',
  ]}),
  item({id: 'g-4-3-e', title: '4.3.e  Establish a compliance function to enhance adherence to internal and regulatory requirements.', description: 'Stand up mandate, policy, and operating compliance activity.', team: 'Enterprise Risk and Compliance', division: PA4, period: '2026', parentId: 'g-4-3', related: ['Human Resources'], krs: [
    'Key personnel recruited for the newly established compliance function.',
    'Charter developed outlining the compliance function\'s mandate, scope, and reporting lines.',
    'Current compliance practices reviewed.',
    'Compliance Policy aligned with ISO 37301:2021.',
    'Compliance activities initiated under the revised Policy.',
  ]}),
  item({id: 'g-4-3-f', title: '4.3.f  Develop and implement a Governance, Risk, and Compliance (GRC) framework.', description: 'Integrate existing risk and compliance functions on a digital GRC platform.', team: 'Enterprise Risk and Compliance', division: PA4, period: '2027', parentId: 'g-4-3', related: ['Executive Bureau', 'Legal Affairs', 'Policy and Programs'], krs: [
    'Existing governance, risk management, and compliance frameworks aligned.',
    'GRC digital solution implemented to streamline processes and enhance reporting.',
    'Organization-wide training on the GRC framework conducted.',
    'Cross-functional GRC committee established to coordinate GRC activities.',
  ]}),
  item({id: 'g-4-3-g', title: '4.3.g  Implement the investment risk management and risk budgeting frameworks.', description: 'Manage investment risks in line with MRPS investment principles.', team: 'Investment and Research', division: PA4, period: '2026', parentId: 'g-4-3', related: ['Internal Audit and Risk Management'], krs: [
    'Investment risk management framework and risk budgeting framework implemented.',
    'Investment risk dashboards for monitoring of key risk indicators developed.',
  ]}),

  parent('g-4-4', '4.4', 'Establish an ESG strategy to align operations with international standards', 'Embed environmental, social, and governance practices across functions.', PA4),
  item({id: 'g-4-4-a', title: '4.4.a  Develop ESG policies and guidelines to establish the foundations for ESG implementation.', description: 'Prioritise material issues and publish ESG policy.', team: 'Policy and Programs', division: PA4, period: '2026', parentId: 'g-4-4', related: ['Investment and Research', 'Executive Bureau', 'Pension Services'], krs: [
    'Materiality assessment conducted to identify and prioritize key ESG issues.',
    'Comprehensive ESG policy document developed for the organisation.',
    'Specific ESG guidelines developed for key operational areas.',
  ]}),
  item({id: 'g-4-4-b', title: '4.4.b  Implement ESG guidelines for key operational areas.', description: 'Start integrating ESG into operations and investment frameworks.', team: 'Policy and Programs', division: PA4, period: '2027', parentId: 'g-4-4', related: ['Investment and Research', 'Executive Bureau'], krs: [
    'Tailored ESG training programmes conducted for all employees.',
    'ESG guidelines implemented across at least 2 key operational functions.',
    'Existing investment guidelines and risk management frameworks reviewed to incorporate ESG considerations.',
  ]}),

  parent('g-4-5', '4.5', 'Introduce innovative solutions to maintain operational excellence through emerging technologies', 'Apply AI/ML and modern test environments to core delivery.', PA4),
  item({id: 'g-4-5-a', title: '4.5.a  Implement AI/ML solutions to classify internal documents.', description: 'Reduce manual classification workload with automated tagging.', team: 'Data Services', division: PA4, period: '2026', parentId: 'g-4-5', related: ['Innovation and Technology'], krs: [
    'Document classification implemented using AI/ML algorithms.',
    '90% accuracy in document classification based on predefined document categories.',
    '70% reduction in manual document classification workload.',
    'Automated document categorization and tagging implemented.',
  ]}),
  item({id: 'g-4-5-b', title: '4.5.b  Implement test drive / pods technology to enhance testing efficiency, scalability, and reliability.', description: 'Standardise ephemeral test environments in the CI/CD pipeline.', team: 'Innovation and Technology', division: PA4, period: '2026', parentId: 'g-4-5', related: ['Software Engineering', 'General Services'], krs: [
    'Requirements identified according to infrastructure and development practices.',
    'Test drive / pods solution selected.',
    'Standardized test drive/pod environment template established.',
    'Test drive/pods solution integrated with the existing CI/CD pipeline.',
    'Time required to set up testing environments for projects reduced by 40%.',
    'Centralized dashboard implemented for monitoring and managing all active test drives/pods.',
    'Production bug incidents reduced by 25%.',
  ]}),

  parent('g-4-6', '4.6', 'Transform and enhance human resource management to enrich employee experience and create a culture of continuous learning', 'Stand up L&D and employee engagement functions, then scale them with technology.', PA4),
  item({id: 'g-4-6-a', title: '4.6.a  Establish a dedicated Learning and Development function within the HR Department.', description: 'Build strategy, competency, and flagship training programmes.', team: 'Human Resources', division: PA4, period: '2025', parentId: 'g-4-6', related: ['General Services'], krs: [
    'Training and Development Strategy developed to enhance employee skills and competency.',
    'Competency Framework and Competency Dictionary developed.',
    'Competency Assessment for all employees conducted.',
    'At least 4 training programs conducted annually with international trainers.',
    'First international scholarship awarded under the revised Scholarship Policy.',
  ]}),
  item({id: 'g-4-6-b', title: '4.6.b  Establish an Employee Happiness and Engagement function within the HR Department.', description: 'Sustain satisfaction, retention, mentorship, and engagement activity.', team: 'Human Resources', division: PA4, period: '2026', parentId: 'g-4-6', krs: [
    'Employee satisfaction level maintained above 80% annually.',
    'Turnover rate of managerial and key staff maintained below 10% annually.',
    'Mentorship program established to pair new hires with experienced employees.',
    'New employee wellness initiative introduced.',
    'At least 4 major employee engagement activities conducted annually that cater to employees working from the office and remotely.',
  ]}),
  item({id: 'g-4-6-c', title: '4.6.c  Enhance the Learning and Development function with continuous learning and innovative technologies.', description: 'Launch LMS, international partnerships, and executive development.', team: 'Human Resources', division: PA4, period: '2027', parentId: 'g-4-6', krs: [
    'Learning Management System (LMS) launched.',
    'Partnership established with an international institution to offer internship, knowledge exchange and training opportunities.',
    'Executive Development Program introduced for managerial staff to develop leadership skills and facilitate succession planning.',
  ]}),

  parent('g-4-7', '4.7', 'Develop a modern office space to enhance operational efficiency and service delivery', 'Build, fit out, and commercialise the Hulhumale’ Pension Office building.', PA4),
  item({id: 'g-4-7-a', title: '4.7.a  Complete all preliminary works and commence construction of the Pension Office building in Hulhumale’.', description: 'Select the contractor, finalise designs, and start construction.', team: 'Building Committee', division: PA4, period: '2025', parentId: 'g-4-7', related: ['Executive Bureau', 'General Services'], krs: [
    'Contractor selected under design and built contract.',
    'Building designs completed and finalised.',
    'Building construction commenced.',
  ]}),
  item({id: 'g-4-7-b', title: '4.7.b  Complete the interior design of the new office facilities.', description: 'Fit the building to operational requirements.', team: 'Building Committee', division: PA4, period: '2026', parentId: 'g-4-7', related: ['Stakeholder Relations', 'Public Relations', 'General Services'], krs: [
    'Interior design consultant hired.',
    'Interior design finalised.',
  ]}),
  item({id: 'g-4-7-c', title: '4.7.c  Ensure operational readiness for commercialisation and management of the new building facilities.', description: 'Plan relocation and commercial use of the new facilities.', team: 'Building Committee', division: PA4, period: '2027', parentId: 'g-4-7', related: ['Financial Management', 'General Services'], krs: [
    'Transition Plan developed for relocation of operations.',
    'Business Plan developed for commercialisation of new facilities.',
    'Operational requirements for managing the facilities assessed.',
  ]}),
];

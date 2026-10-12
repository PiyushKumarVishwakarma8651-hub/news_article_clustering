import { NewsArticle } from '../types/ml';

export const INITIAL_ARTICLES: NewsArticle[] = [
  // ==========================================
  // INDIA: Economy, Banking, RBI & Markets
  // ==========================================
  {
    id: 'art-in-01',
    title: 'Reserve Bank of India Holds Repo Rate Steady at 6.5% as Retail Inflation Moderates',
    content: 'The Monetary Policy Committee of the Reserve Bank of India, chaired by the Governor, unanimously voted to keep the benchmark repo rate unchanged at 6.5 percent. The central bank highlighted that easing food prices and steady domestic manufacturing have helped anchor retail headline inflation within the target band. Financial markets responded favorably as both the BSE Sensex and NSE Nifty indices reached fresh record highs.',
    source: 'The Economic Times',
    publishedDate: '2026-03-14',
    author: 'Pooja Subramanian'
  },
  {
    id: 'art-in-02',
    title: 'Unified Payments Interface (UPI) Clocks Record 16 Billion Monthly Transactions',
    content: 'The National Payments Corporation of India reported that the Unified Payments Interface crossed a historic milestone of sixteen billion transactions in a single month. Growth was propelled by widespread merchant adoption, the integration of credit lines on UPI, and expanding cross-border linkages with Singapore, the UAE, and France. Digital financial transactions now account for over eighty percent of retail payments across urban and rural India.',
    source: 'LiveMint',
    publishedDate: '2026-03-11',
    author: 'Aditya Nair'
  },
  {
    id: 'art-in-03',
    title: 'India GDP Growth Projected at 7.2% as Capital Expenditure Boosts Manufacturing Sector',
    content: 'International financial institutions and the Ministry of Statistics reaffirmed India’s gross domestic product growth forecast at 7.2 percent for the fiscal year, maintaining its standing as the fastest-growing major global economy. Robust tax collections, strong private consumption, and heavy government budgetary allocation toward national highway and logistics freight corridors supported the expansion.',
    source: 'Business Standard',
    publishedDate: '2026-03-08',
    author: 'Sandeep Mukherjee'
  },
  {
    id: 'art-in-04',
    title: 'BSE Sensex Crosses Historic 85,000 Mark Led by Banking and Information Technology Shares',
    content: 'Indian benchmark equity indices experienced a strong bull run, with the 30-share BSE Sensex breaching the 85,000 milestone for the first time in history. Domestic institutional investors and retail systematic investment plans pumped record inflows into large-cap banking, engineering, and IT software stocks, overcoming foreign portfolio outflows in emerging markets.',
    source: 'Financial Express',
    publishedDate: '2026-03-05',
    author: 'Rohit Kulkarni'
  },
  {
    id: 'art-in-05',
    title: 'Foreign Direct Investment Inflows Surge as Multinationals Expand Global Capability Centres in India',
    content: 'Global enterprise corporations established over one hundred new Global Capability Centres across Bengaluru, Hyderabad, and Pune over the past year. Driven by India’s deep engineering talent pool in artificial intelligence, cloud architecture, and financial risk analytics, total annual services exports touched an all-time high of nearly four hundred billion dollars.',
    source: 'The Hindu BusinessLine',
    publishedDate: '2026-03-02',
    author: 'Meenakshi Iyer'
  },

  // ==========================================
  // INDIA: Space Exploration & Science (ISRO)
  // ==========================================
  {
    id: 'art-in-06',
    title: 'ISRO Successfully Conducts Hot Test of Gaganyaan Crew Module Propulsion System',
    content: 'The Indian Space Research Organisation completed a crucial qualification hot test of the Gaganyaan liquid propulsion system at the ISRO Propulsion Complex in Mahendragiri. The bipropellant thruster engine demonstrated nominal chamber pressure and precise attitude orientation commands, clearing the way for the uncrewed orbital test flight scheduled from the Satish Dhawan Space Centre in Sriharikota.',
    source: 'The Hindu',
    publishedDate: '2026-03-13',
    author: 'R. K. Radhakrishnan'
  },
  {
    id: 'art-in-07',
    title: 'Aditya-L1 Solar Observatory Captures High-Energy Coronal Mass Ejection Towards Earth',
    content: 'India’s maiden dedicated solar spacecraft, positioned at the Lagrange Point 1 approximately 1.5 million kilometers from Earth, detected a massive class-X solar flare and coronal mass ejection. Scientists at the Physical Research Laboratory in Ahmedabad analyzed data from the Visible Emission Line Coronagraph, providing early warning telemetry for global satellite operators.',
    source: 'Deccan Herald',
    publishedDate: '2026-03-09',
    author: 'K. S. Ramanathan'
  },
  {
    id: 'art-in-08',
    title: 'Chandrayaan-3 Moon Rover Data Confirms Ancient Magma Ocean Mineral Signatures at Lunar South Pole',
    content: 'Planetary scientists analyzing in-situ data transmitted by the Pragyan rover in the lunar south polar region published peer-reviewed findings validating the lunar magma ocean hypothesis. The rover’s Alpha Particle X-Ray Spectrometer revealed extensive ferroan anorthosite deposits, confirming that the Moon’s upper crust solidified from a molten ocean four billion years ago.',
    source: 'The Times of India Science',
    publishedDate: '2026-03-06',
    author: 'Sunita Sharma'
  },
  {
    id: 'art-in-09',
    title: 'ISRO Small Satellite Launch Vehicle (SSLV) Deploys Earth Observation Constellation into Orbit',
    content: 'In its commercial operational mission, ISRO’s Small Satellite Launch Vehicle lifted off from the first launch pad in Sriharikota, injecting sixteen micro-satellites into a low-Earth sun-synchronous orbit. NewSpace India Limited hailed the success as a major stride in capturing commercial small-satellite launch demand from global telecom and climate startups.',
    source: 'Press Trust of India',
    publishedDate: '2026-02-27',
    author: 'PTI Bureau'
  },
  {
    id: 'art-in-10',
    title: 'India Approves Bharatiya Antariksh Station Project with First Orbital Module Slated for 2028',
    content: 'The Union Cabinet approved financial allocation for the Bharatiya Antariksh Station, India’s planned sovereign orbital space laboratory. The multi-module space station will support long-duration microgravity biomedical research, metallurgy experiments, and deep space exploration refueling ahead of India’s planned crewed lunar landing program.',
    source: 'Hindustan Times',
    publishedDate: '2026-02-23',
    author: 'Aniruddh Sen'
  },

  // ==========================================
  // INDIA: Semiconductors, Startups & Tech
  // ==========================================
  {
    id: 'art-in-11',
    title: 'India Semiconductor Mission: Tata Electronics Breaks Ground on Dholera Commercial Fab',
    content: 'Construction commenced on India’s first commercial mega semiconductor fabrication plant in Dholera, Gujarat, spearheaded by Tata Electronics in collaboration with Taiwan’s Powerchip Semiconductor Manufacturing Corp. With an investment exceeding ninety-one thousand crore rupees, the facility will fabricate silicon chips at twenty-eight nanometer nodes for automotive, power electronics, and wireless communications.',
    source: 'The Economic Times Tech',
    publishedDate: '2026-03-12',
    author: 'Aakash Verma'
  },
  {
    id: 'art-in-12',
    title: 'Indian AI Startups Raise Record Venture Funding for Indic Language Foundation Models',
    content: 'Venture capital investments in India’s artificial intelligence ecosystem surged, with homegrown foundation model builders securing hundreds of millions of dollars in seed and growth capital. Startups in Bengaluru and Hyderabad are building multilingual neural networks trained on twenty-two scheduled Indian languages to power government e-governance, agricultural advisories, and vernacular banking bots.',
    source: 'YourStory Media',
    publishedDate: '2026-03-10',
    author: 'Sneha Banerjee'
  },
  {
    id: 'art-in-13',
    title: 'Micron Technology Inaugurates Advanced Semiconductor Assembly and Test Unit in Sanand',
    content: 'Semiconductor memory manufacturer Micron Technology operationalized its state-of-the-art cleanroom assembly and test packaging facility in Sanand, Gujarat. The packaging plant will process DRAM and NAND flash memory chips for global export, generating thousands of high-tech manufacturing and electrical engineering jobs in the western industrial corridor.',
    source: 'Mint Tech',
    publishedDate: '2026-03-04',
    author: 'Varun Grover'
  },
  {
    id: 'art-in-14',
    title: 'Digital India Bhashini Platform Bridges Vernacular Language Divide Across Digital Governance',
    content: 'The Ministry of Electronics and Information Technology expanded the Bhashini national language translation engine across federal and state welfare portals. Leveraging speech-to-speech AI models and voice recognition, rural citizens can now access crop insurance, land records, and welfare pensions using their native mother tongues without typing.',
    source: 'NDTV Gadgets 360',
    publishedDate: '2026-02-26',
    author: 'Nikhil Chandran'
  },

  // ==========================================
  // INDIA: Clean Energy & Infrastructure
  // ==========================================
  {
    id: 'art-in-15',
    title: 'World’s Largest Renewable Energy Park in Khavda Exceeds 10 Gigawatt Operational Capacity',
    content: 'The world’s largest hybrid solar and wind energy park, spanning over seven hundred square kilometers in the Rann of Kutch at Khavda, Gujarat, reached ten gigawatts of operational grid capacity. When fully completed at thirty gigawatts, the colossal clean energy complex will generate green electricity equivalent to powering twenty million Indian homes and displace sixty million tonnes of carbon dioxide annually.',
    source: 'The Indian Express',
    publishedDate: '2026-03-13',
    author: 'Devendra Patel'
  },
  {
    id: 'art-in-16',
    title: 'Indian Railways Rolls Out Next-Generation Vande Bharat Sleeper Express on Long-Distance Corridors',
    content: 'Indian Railways officially flagged off the inaugural commercial run of the Vande Bharat Sleeper train between New Delhi and Mumbai. Engineered at the Integral Coach Factory in Chennai, the semi-high-speed aerodynamic train features crash-worthy stainless steel coach bodies, intelligent sensor toilets, and automated Kavach train collision avoidance protection.',
    source: 'The Tribune India',
    publishedDate: '2026-03-07',
    author: 'Manpreet Singh'
  },
  {
    id: 'art-in-17',
    title: 'National Green Hydrogen Mission Allocates Electrolyser Manufacturing Incentives to Heavy Industries',
    content: 'Under the Strategic Interventions for Green Hydrogen Transition programme, the Ministry of New and Renewable Energy awarded production-linked incentives to heavy industrial conglomerates. The initiative targets establishing five million tonnes of annual green hydrogen production capacity by 2030 to decarbonize domestic steel smelting, fertilizer plants, and petroleum refineries.',
    source: 'Business Standard Energy',
    publishedDate: '2026-03-01',
    author: 'Kavita Chawla'
  },
  {
    id: 'art-in-18',
    title: 'Rooftop Solar Scheme PM Surya Ghar Reaches Five Million Household Installations',
    content: 'The Ministry of Power announced that the PM Surya Ghar Muft Bijli Yojana crossed five million domestic rooftop photovoltaic installations across Indian states. Beneficiaries receive substantial direct benefit transfer subsidies, generating up to three hundred units of free solar electricity monthly while feeding surplus power back into the state electricity distribution grid.',
    source: 'Dainik Jagran Post',
    publishedDate: '2026-02-24',
    author: 'Rakesh Bhargava'
  },

  // ==========================================
  // INDIA: Healthcare, Biotech & Pharmaceuticals
  // ==========================================
  {
    id: 'art-in-19',
    title: 'Serum Institute of India Expands Global Distribution of Affordable Malaria Vaccine',
    content: 'The Serum Institute of India shipped millions of doses of the revolutionary R21/Matrix-M malaria vaccine to vulnerable countries in sub-Saharan Africa. Manufactured in Pune at high volume and low cost in partnership with the University of Oxford, the vaccine is projected to drastically reduce infant malaria mortality across endemic tropical regions.',
    source: 'The Times of India Health',
    publishedDate: '2026-03-14',
    author: 'Ananya Deshmukh'
  },
  {
    id: 'art-in-20',
    title: 'AIIMS New Delhi Deploys AI Diagnostic Imaging for Early Detection of Oral and Cervical Cancers',
    content: 'Clinicians at the All India Institute of Medical Sciences (AIIMS) in New Delhi integrated deep learning imaging software into community health screening vans. The automated diagnostic algorithms analyze mobile colposcopy and mucosal oral scans in real time, detecting pre-cancerous lesions with ninety-six percent sensitivity before symptoms appear.',
    source: 'India Today Health',
    publishedDate: '2026-03-09',
    author: 'Dr. Neha Kapoor'
  },
  {
    id: 'art-in-21',
    title: 'Indian Generic Pharmaceutical Firms Secure Global Regulatory Approvals for Complex Biosimilars',
    content: 'Leading Indian pharmaceutical companies in Hyderabad and Ahmedabad received approval from international health authorities to export affordable biosimilar monoclonal antibodies for autoimmune and rheumatic diseases. The certifications cement India’s reputation as the "Pharmacy of the World", significantly reducing biologic treatment expenses for millions of patients.',
    source: 'Pharmabiz India',
    publishedDate: '2026-03-03',
    author: 'Suresh Varma'
  },
  {
    id: 'art-in-22',
    title: 'Indigenous CAR-T Cell Gene Therapy Extends Remission in Relapsed Leukemia Patients',
    content: 'Oncologists at Tata Memorial Hospital in Mumbai presented five-year clinical survival data for India’s indigenously engineered NexCAR19 gene therapy. By reprogramming patient T-cells locally, the breakthrough treatment delivers curative cell therapy at one-tenth of international costs, providing a lifesaver for patients with pediatric and adult blood malignancies.',
    source: 'The Hindu Science',
    publishedDate: '2026-02-25',
    author: 'Bhavna Kulkarni'
  },

  // ==========================================
  // INDIA: Sports, Cricket & Athletics
  // ==========================================
  {
    id: 'art-in-23',
    title: 'Indian Premier League (IPL) Auction Shatters Records as Franchises Bid for T20 All-Rounders',
    content: 'The Indian Premier League player auction concluded in Jeddah with unprecedented bidding wars as franchises invested record purses in dynamic international and domestic T20 all-rounders. Broadcast viewership metrics across digital streaming platforms surpassed five hundred million concurrent viewers, solidifying the IPL as one of the world’s most valuable sports leagues.',
    source: 'ESPNCricinfo India',
    publishedDate: '2026-03-12',
    author: 'Gaurav Kalra'
  },
  {
    id: 'art-in-24',
    title: 'Neeraj Chopra Clinches Diamond League Javelin Gold with Historic 90-Meter Throw',
    content: 'Double Olympic medalist Neeraj Chopra delivered a sensational performance at the season-opening Diamond League athletics meet, breaching the elusive ninety-meter barrier on his second attempt. The star javelin thrower attributed the milestone throw to optimized approach velocity and refined biomechanical release angles developed during off-season training.',
    source: 'Sportstar',
    publishedDate: '2026-03-08',
    author: 'Avishek Roy'
  },
  {
    id: 'art-in-25',
    title: 'Indian Grandmasters Dominate FIDE Candidates Chess Tournament in Historic Clean Sweep',
    content: 'Indian chess prodigies staged a historic showing at the FIDE Candidates Tournament, outplaying seasoned world champions to secure top positions on the global leaderboard. The remarkable achievements of India’s young grandmasters have sparked a nationwide surge in chess academies, with international grandmasters hailing India as the reigning superpower of modern chess.',
    source: 'ChessBase India',
    publishedDate: '2026-03-02',
    author: 'Sagar Shah'
  },
  {
    id: 'art-in-26',
    title: 'Indian Women’s Cricket Team Triumphs in Thrilling Multi-Nation ODI Series Decider',
    content: 'The Indian women’s national cricket team clinched the bilateral trophy with a pulsating three-wicket victory in the deciding one-day international at Wankhede Stadium. An unbeaten counter-attacking half-century by the middle-order wicketkeeper batter guided the hosts over the target line against top-ranked opposition.',
    source: 'Cricbuzz',
    publishedDate: '2026-02-22',
    author: 'Purnima Rao'
  },

  // ==========================================
  // INTERNATIONAL: Macroeconomics & Central Banks
  // ==========================================
  {
    id: 'art-intl-01',
    title: 'US Federal Reserve Holds Interest Rates Steady Amid Persistent Global Inflation Trends',
    content: 'The US Federal Reserve maintained benchmark interest rates at their target range following the Federal Open Market Committee summit in Washington. Central bank governors emphasized that while headline consumer price pressures have eased, resilient services inflation and steady payroll hiring warrant caution before initiating monetary easing cycles. Global equity and foreign exchange markets stabilized following the announcement.',
    source: 'Financial Times Post',
    publishedDate: '2026-03-14',
    author: 'Arthur Sterling'
  },
  {
    id: 'art-intl-02',
    title: 'European Central Bank Signals Measured Rate Cuts as Eurozone Manufacturing Growth Cools',
    content: 'The European Central Bank indicated readiness to lower deposit interest rates at its upcoming monetary conference in Frankfurt. European monetary policymakers highlighted softening industrial production in Germany and moderating wage contracts, seeking to balance price stability with growth revival across the twenty-nation Eurozone currency bloc.',
    source: 'Global Markets Daily',
    publishedDate: '2026-03-10',
    author: 'Henrietta Vance'
  },
  {
    id: 'art-intl-03',
    title: 'International Monetary Fund Upgrades Global Economic Outlook Citing Resilient Asian Trade',
    content: 'In its World Economic Outlook update, the International Monetary Fund lifted its global growth forecast by two-tenths of a percentage point. The multilateral lender credited resilient domestic demand in India, a rebound in global tech exports, and moderating energy commodity prices for averting a worldwide economic contraction.',
    source: 'Economics Dispatch',
    publishedDate: '2026-03-05',
    author: 'Rachel Bloom'
  },

  // ==========================================
  // INTERNATIONAL: Frontier AI & Deep Tech
  // ==========================================
  {
    id: 'art-intl-04',
    title: 'OpenAI Unveils Frontier Reasoning Architecture with Continuous Chain-of-Thought Verification',
    content: 'OpenAI officially introduced its next-generation reasoning AI model, showcasing dramatic breakthroughs in mathematical theorem generation, software architecture design, and scientific problem solving. The new neural model executes dynamic test-time compute, evaluating multiple reasoning branches before generating its final response.',
    source: 'TechChronicle',
    publishedDate: '2026-03-13',
    author: 'Elena Vance'
  },
  {
    id: 'art-intl-05',
    title: 'Nvidia Unveils Next-Generation AI Superchip Accelerating Hyperscale Datacenter Workloads',
    content: 'Semiconductor leader Nvidia debuted its high-density graphics processing unit architecture engineered specifically for training frontier multimodal neural foundations. Featuring high-bandwidth memory and optical interconnects, the hardware cuts power consumption by thirty percent while accelerating transformer tensor processing threefold.',
    source: 'Silicon Herald',
    publishedDate: '2026-03-11',
    author: 'Marcus Chen'
  },
  {
    id: 'art-intl-06',
    title: 'Quantum Laboratory Demonstrates Fault-Tolerant Logical Qubits Linking Over 1000 Physical Qubits',
    content: 'Quantum physics researchers announced a breakthrough in quantum error correction by linking over one thousand superconducting qubits into fault-tolerant logical memory. The advance preserves quantum coherence across thousands of algorithmic operations, moving commercial quantum chemistry and cryptography simulations closer to reality.',
    source: 'Quantum Science Today',
    publishedDate: '2026-03-06',
    author: 'David Lindqvist'
  },

  // ==========================================
  // INTERNATIONAL: Deep Space & Astronomy
  // ==========================================
  {
    id: 'art-intl-07',
    title: 'James Webb Space Telescope Uncovers Primitive Galaxy Clusters at the Cosmic Dawn',
    content: 'Astronomers analyzing deep infrared data from the James Webb Space Telescope identified ultra-dense stellar clusters that formed merely three hundred million years after the Big Bang. The observed stars exhibit low metallicity, challenging established cosmological timescales regarding early galaxy assembly.',
    source: 'Cosmos Journal',
    publishedDate: '2026-03-12',
    author: 'Dr. Evelyn Ward'
  },
  {
    id: 'art-intl-08',
    title: 'NASA Artemis Lunar Mission Completes Exhaustive Wet Dress Rehearsal at Kennedy Space Center',
    content: 'Launch controllers completed the cryogenic propellant loading demonstration for the Space Launch System rocket ahead of the Artemis crewed lunar orbit flight. Teams successfully pumped liquid hydrogen and oxygen into the core stage tanks while astronaut crews conducted simulated launch countdown protocols.',
    source: 'AeroSpace Tribune',
    publishedDate: '2026-03-08',
    author: 'Neil Armstrong Jr.'
  },

  // ==========================================
  // INTERNATIONAL: Climate & Global Governance
  // ==========================================
  {
    id: 'art-intl-09',
    title: 'UN Climate Summit Concludes with Binding Pact to Triple Global Renewable Energy by 2030',
    content: 'Delegates from one hundred and ninety nations ratified a historic international climate accord pledging to triple global renewable electricity capacity and double energy efficiency rates by the end of the decade. The agreement establishes a multilateral climate resilience fund to assist developing nations in adopting clean solar, wind, and battery technologies.',
    source: 'Global Climate Monitor',
    publishedDate: '2026-03-11',
    author: 'Mateo Fernandez'
  },
  {
    id: 'art-intl-10',
    title: 'Multilateral Maritime Security Accord Ratified to Safeguard Critical Commercial Shipping Corridors',
    content: 'Naval representatives and diplomatic envoys from thirty coastal nations signed a mutual defense pact establishing joint surveillance and escort operations across critical commercial shipping chokepoints in the Red Sea and Strait of Malacca, ensuring safe transit for global container freighters and energy tankers.',
    source: 'Diplomatic Wire',
    publishedDate: '2026-03-04',
    author: 'Beatrice Fontaine'
  },
  {
    id: 'art-intl-11',
    title: 'Phase 3 Clinical Trial Confirms Efficacy of Personalized mRNA Cancer Vaccine',
    content: 'International oncology researchers published trial findings demonstrating that bespoke mRNA cancer therapeutic vaccines reduced tumor recurrence by forty-nine percent when combined with checkpoint inhibitor immunotherapy in melanoma and lung cancer patients.',
    source: 'Clinical Oncology Lancet',
    publishedDate: '2026-02-28',
    author: 'Dr. Julian Thorne'
  },
  {
    id: 'art-intl-12',
    title: 'Olympic Committee Finalizes Host City and New Urban Sports Roster for Upcoming Games',
    content: 'The International Olympic Committee voted to approve the inclusion of new youth-oriented urban disciplines, including sport climbing and competitive breaking, while finalizing venue sustainability criteria for upcoming Summer and Winter Olympic Games.',
    source: 'Olympic Athletics Herald',
    publishedDate: '2026-02-21',
    author: 'Claire McAllister'
  }
];

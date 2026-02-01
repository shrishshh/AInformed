// Mock news data for the platform
export const newsCategories = [
    'All',
    'Technology',
    'Sports',
    'Business',
    'Entertainment',
    'Politics',
    'Science',
    'Health'
  ];
  
  export const mockNewsArticles = [
    {
      id: 1,
      title: 'AI Breakthrough: New Model Achieves Human-Level Understanding',
      summary: 'Researchers at leading tech companies unveiled an advanced artificial intelligence system that demonstrates unprecedented comprehension of complex human language. The model showcases remarkable reasoning capabilities, outperforming previous benchmarks by significant margins. Scientists believe this breakthrough could revolutionize various industries including healthcare, education, and scientific research in coming years.',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
      category: 'Technology',
      source: 'Tech Daily',
      sourceUrl: 'https://example.com/ai-breakthrough-article',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      saved: false
    },
    {
      id: 2,
      title: 'Historic Victory: Underdogs Clinch Championship Title',
      summary: 'In an unprecedented turn of events, the season\'s underdog team secured a stunning championship victory against overwhelming odds. Their remarkable journey from bottom rankings to champions captivated millions worldwide. The team\'s strategic gameplay and unwavering determination proved decisive in the final moments. Analysts call this one of sports history\'s greatest comeback stories ever witnessed.',
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
      category: 'Sports',
      source: 'Sports Network',
      sourceUrl: 'https://example.com/championship-victory',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      saved: false
    },
    {
      id: 3,
      title: 'Global Markets Surge on Economic Recovery Signals',
      summary: 'International stock markets experienced significant gains following encouraging economic indicators and positive corporate earnings reports. Investors showed renewed confidence as inflation concerns eased and employment figures exceeded expectations. Financial experts predict sustained growth momentum throughout the quarter. Central banks maintained supportive monetary policies, further bolstering market sentiment and consumer confidence across regions.',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
      category: 'Business',
      source: 'Financial Times',
      sourceUrl: 'https://example.com/markets-surge',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      saved: false
    },
    {
      id: 4,
      title: 'Blockbuster Film Breaks Opening Weekend Records Worldwide',
      summary: 'The latest cinematic release shattered box office records, earning unprecedented revenue during its opening weekend across global markets. Critics praised the film\'s innovative storytelling and groundbreaking visual effects. Audiences flocked to theaters in record numbers, creating a cultural phenomenon. Industry analysts project the film will become one of the highest-grossing productions in entertainment history.',
      image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
      category: 'Entertainment',
      source: 'Entertainment Weekly',
      sourceUrl: 'https://example.com/blockbuster-film',
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      saved: false
    },
    {
      id: 5,
      title: 'Climate Summit Produces Landmark International Agreement',
      summary: 'World leaders concluded a historic climate summit with a comprehensive agreement addressing urgent environmental challenges. The accord includes ambitious emissions reduction targets and substantial funding commitments for renewable energy initiatives. Participating nations pledged unprecedented cooperation in combating climate change. Environmental organizations welcomed the agreement as a crucial step toward sustainable future development and preservation.',
      image: 'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=800&q=80',
      category: 'Politics',
      source: 'World News',
      sourceUrl: 'https://example.com/climate-summit',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      saved: false
    },
    {
      id: 6,
      title: 'Quantum Computing Breakthrough Solves Complex Problem',
      summary: 'Scientists achieved a major milestone in quantum computing by solving a calculation previously impossible for classical computers. The breakthrough demonstrates quantum supremacy in practical applications beyond theoretical demonstrations. Researchers utilized advanced error correction techniques and novel quantum algorithms. This achievement opens new possibilities for drug discovery, cryptography, and complex system modeling in multiple scientific domains.',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80',
      category: 'Science',
      source: 'Science Journal',
      sourceUrl: 'https://example.com/quantum-breakthrough',
      timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
      saved: false
    },
    {
      id: 7,
      title: 'New Treatment Shows Promise in Cancer Research Trial',
      summary: 'Medical researchers reported encouraging results from clinical trials of an innovative cancer treatment approach. The therapy demonstrated remarkable effectiveness in targeting specific tumor types with minimal side effects. Patient outcomes exceeded initial projections, offering hope for improved treatment options. Regulatory agencies are expediting review processes to potentially accelerate the therapy\'s availability to patients worldwide soon.',
      image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&q=80',
      category: 'Health',
      source: 'Medical News',
      sourceUrl: 'https://example.com/cancer-treatment',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      saved: false
    },
    {
      id: 8,
      title: 'Revolutionary Smartphone Features AI-Powered Camera System',
      summary: 'Leading tech manufacturer unveiled their latest smartphone featuring an advanced artificial intelligence-powered camera system. The device employs machine learning algorithms to automatically optimize photo quality in various lighting conditions. Early reviews praise the phone\'s computational photography capabilities and extended battery life. Industry experts predict this innovation will set new standards for mobile photography technology.',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
      category: 'Technology',
      source: 'Tech Review',
      sourceUrl: 'https://example.com/revolutionary-smartphone',
      timestamp: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
      saved: false
    },
    {
      id: 9,
      title: 'Tennis Star Announces Retirement After Legendary Career',
      summary: 'One of tennis\'s greatest champions announced retirement following an illustrious career spanning over two decades. The athlete accumulated numerous Grand Slam titles and inspired millions worldwide through exceptional performances and sportsmanship. Tributes poured in from fellow players, fans, and sports organizations globally. The announcement marks the end of an era in professional tennis history.',
      image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80',
      category: 'Sports',
      source: 'Sports Today',
      sourceUrl: 'https://example.com/tennis-retirement',
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      saved: false
    },
    {
      id: 10,
      title: 'Startup Secures Record Funding for Green Technology',
      summary: 'An emerging clean energy startup raised unprecedented venture capital funding to develop sustainable technology solutions. Investors showed strong confidence in the company\'s innovative approach to renewable energy storage and distribution. The funding will accelerate research and commercial deployment of their proprietary systems. Industry observers believe this investment signals growing mainstream commitment to environmental sustainability initiatives.',
      image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80',
      category: 'Business',
      source: 'Business Insider',
      sourceUrl: 'https://example.com/startup-funding',
      timestamp: new Date(Date.now() - 1000 * 60 * 270).toISOString(),
      saved: false
    }
  ];
  
  // Mock word definitions
  export const mockWordDefinitions = {
    'unprecedented': {
      word: 'unprecedented',
      standardDefinition: 'Never done or known before; without previous instance.',
      contextualExplanation: 'Used to emphasize that something is completely new, unusual, or remarkable in its magnitude or nature. Often used in news to highlight the exceptional or historic nature of events.',
      examples: [
        'The company achieved unprecedented growth in the last quarter.',
        'This situation calls for unprecedented measures.'
      ]
    },
    'benchmark': {
      word: 'benchmark',
      standardDefinition: 'A standard or point of reference against which things may be compared or assessed.',
      contextualExplanation: 'In technology and business contexts, it refers to performance standards used for comparison. Commonly used when discussing measurements, testing, or evaluation of systems.',
      examples: [
        'The new processor exceeded all previous benchmarks.',
        'We use industry benchmarks to measure our success.'
      ]
    },
    'bolstering': {
      word: 'bolstering',
      standardDefinition: 'Support or strengthen; prop up.',
      contextualExplanation: 'Used to describe actions that reinforce, support, or make something stronger. Often appears in economic or political contexts when describing supportive measures.',
      examples: [
        'The government is bolstering the economy with new policies.',
        'Additional training is bolstering employee skills.'
      ]
    },
    'momentum': {
      word: 'momentum',
      standardDefinition: 'The quantity of motion of a moving body; impetus gained by movement.',
      contextualExplanation: 'In business and news contexts, refers to the force or speed of progress. Used to describe growing trends, movements, or developments that are gaining strength.',
      examples: [
        'The campaign is gaining momentum across the country.',
        'Market momentum continued throughout the quarter.'
      ]
    }
  };
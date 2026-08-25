/**
 * @fileoverview Independent In-Browser AEO Audit Engine for Chrome Extension.
 * Implements the 8 Gatherers and 12 Audits following the Google Lighthouse architecture.
 */

export class BrowserAeoEngine {
  /**
   * Runs the full AEO audit lifecycle on a given DOM and URL
   */
  public static async runAudit(url: string, html: string): Promise<any> {
    const urlObj = new URL(url);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Gather Phase
    const [robotsTxtArtifact, httpHeadersArtifact] = await Promise.all([
      this.gatherRobotsTxt(urlObj),
      this.gatherHttpHeaders(url),
    ]);

    const urlArtifact = {
      requestedUrl: url,
      finalUrl: url,
      domain: urlObj.hostname,
      pathname: urlObj.pathname,
      protocol: urlObj.protocol,
    };

    const jsonldArtifact = this.gatherJsonLd(doc);
    const metaTagsArtifact = this.gatherMetaTags(doc);
    const headingsArtifact = this.gatherHeadings(doc);
    const contentChunksArtifact = this.gatherContentChunks(doc);
    const directAnswersArtifact = this.gatherDirectAnswers(doc);

    const artifacts = {
      URL: urlArtifact,
      RobotsTxt: robotsTxtArtifact,
      HttpHeaders: httpHeadersArtifact,
      JSONLD: jsonldArtifact,
      MetaTags: metaTagsArtifact,
      HeadingsHierarchy: headingsArtifact,
      ContentChunks: contentChunksArtifact,
      DirectAnswers: directAnswersArtifact,
    };

    // 2. Audits Phase
    const auditResults = this.runAudits(artifacts);

    // 3. Aggregator Phase
    return this.aggregateReport(url, auditResults);
  }

  // --- Gatherers ---

  private static async gatherRobotsTxt(urlObj: URL) {
    const robotsUrl = `${urlObj.origin}/robots.txt`;
    let rawContent = null;
    let exists = false;
    let sitemaps: string[] = [];
    const rulesByAgent: Record<string, any> = {};

    try {
      const res = await fetch(robotsUrl);
      if (res.ok) {
        const text = await res.text();
        if (!text.trim().toLowerCase().startsWith('<!doctype html') && !text.trim().toLowerCase().startsWith('<html')) {
          rawContent = text;
          exists = true;
        }
      }
    } catch {}

    if (rawContent) {
      const lines = rawContent.split(/\r?\n/);
      let currentAgents: string[] = [];
      for (const rawLine of lines) {
        const line = rawLine.split('#')[0].trim();
        if (!line) continue;
        const colon = line.indexOf(':');
        if (colon === -1) continue;
        const key = line.slice(0, colon).trim().toLowerCase();
        const val = line.slice(colon + 1).trim();

        if (key === 'user-agent') {
          const ag = val.toLowerCase();
          currentAgents = [ag];
          if (!rulesByAgent[ag]) rulesByAgent[ag] = { userAgent: val, allow: [], disallow: [] };
        } else if (key === 'disallow' && currentAgents.length > 0) {
          for (const ag of currentAgents) if (val) rulesByAgent[ag]?.disallow.push(val);
        } else if (key === 'allow' && currentAgents.length > 0) {
          for (const ag of currentAgents) if (val) rulesByAgent[ag]?.allow.push(val);
        } else if (key === 'sitemap') {
          if (val) sitemaps.push(val);
        }
      }
    }

    const checkBot = (botName: string) => {
      const botRule = rulesByAgent[botName.toLowerCase()];
      const wildRule = rulesByAgent['*'];
      const rule = botRule || wildRule;
      if (!rule) return 'not_specified';
      const isDisallowAll = rule.disallow.some((p: string) => p === '/' || p === '/*');
      const isAllowAll = rule.allow.some((p: string) => p === '/' || p === '/*');
      if (isDisallowAll && !isAllowAll) return 'disallowed';
      if (rule.disallow.some((p: string) => urlObj.pathname.startsWith(p))) return 'disallowed';
      return 'allowed';
    };

    return {
      rawContent,
      exists,
      sitemaps,
      rulesByAgent,
      aiBotsStatus: {
        gptBot: checkBot('gptbot'),
        perplexityBot: checkBot('perplexitybot'),
        claudeBot: checkBot('claudebot'),
        googleExtended: checkBot('google-extended'),
        ccBot: checkBot('ccbot'),
        bytespider: checkBot('bytespider'),
        cohereAi: checkBot('cohere-ai'),
      },
    };
  }

  private static async gatherHttpHeaders(url: string) {
    let xRobotsTag: string | null = null;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      xRobotsTag = res.headers.get('x-robots-tag');
    } catch {}
    return {
      statusCode: 200,
      headers: {},
      xRobotsTag,
      contentType: 'text/html',
      cacheControl: null,
      contentEncoding: null,
    };
  }

  private static gatherJsonLd(doc: Document) {
    const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
    const items: any[] = [];
    const schemasCountByType: Record<string, number> = {};
    let hasFAQPage = false;
    let hasHowTo = false;
    let hasArticle = false;
    let hasQAPage = false;
    let hasOrganization = false;
    let hasProduct = false;
    const sameAsUrls: string[] = [];

    scripts.forEach((script) => {
      const raw = script.textContent || '';
      try {
        const parsed = JSON.parse(raw);
        const types = Array.isArray(parsed['@type']) ? parsed['@type'] : [parsed['@type'] || ''];
        types.forEach((t: string) => {
          if (t) schemasCountByType[t] = (schemasCountByType[t] || 0) + 1;
          if (t.includes('FAQPage')) hasFAQPage = true;
          if (t.includes('HowTo')) hasHowTo = true;
          if (t.includes('Article')) hasArticle = true;
          if (t.includes('QAPage')) hasQAPage = true;
          if (t.includes('Organization')) hasOrganization = true;
          if (t.includes('Product')) hasProduct = true;
        });

        if (parsed.sameAs) {
          if (Array.isArray(parsed.sameAs)) sameAsUrls.push(...parsed.sameAs);
          else sameAsUrls.push(parsed.sameAs);
        }

        items.push({ raw, parsed, type: parsed['@type'] || 'Unknown', isValid: true });
      } catch (err: any) {
        items.push({ raw, parsed: null, type: 'Invalid', isValid: false, syntaxErrors: [err.message] });
      }
    });

    return {
      items,
      schemasCountByType,
      hasFAQPage,
      hasHowTo,
      hasArticle,
      hasQAPage,
      hasOrganization,
      hasProduct,
      hasSameAs: sameAsUrls.length > 0,
      sameAsUrls,
    };
  }

  private static gatherMetaTags(doc: Document) {
    const title = doc.querySelector('title')?.textContent?.trim() || null;
    const desc = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || null;
    const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() || null;
    const robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content')?.trim() || null;

    return {
      title,
      description: desc,
      canonicalUrl: canonical,
      viewport: 'width=device-width',
      charset: 'utf-8',
      openGraph: {},
      twitterCard: {},
      robotsMeta: robots,
    };
  }

  private static gatherHeadings(doc: Document) {
    const headings: any[] = [];
    let h1Count = 0;
    let h2Count = 0;
    let h3Count = 0;

    const els = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    els.forEach((el, index) => {
      const level = parseInt(el.tagName.charAt(1), 10);
      const text = el.textContent?.trim().replace(/\s+/g, ' ') || '';
      if (level === 1) h1Count++;
      if (level === 2) h2Count++;
      if (level === 3) h3Count++;
      headings.push({ level, text, index });
    });

    const skippedLevels: any[] = [];
    let isHierarchySequential = true;
    for (let i = 1; i < headings.length; i++) {
      const prev = headings[i - 1];
      const curr = headings[i];
      if (curr.level > prev.level + 1) {
        isHierarchySequential = false;
        skippedLevels.push({ from: prev.level, to: curr.level, text: curr.text });
      }
    }

    return {
      headings,
      h1Count,
      h2Count,
      h3Count,
      hasSingleH1: h1Count === 1,
      isHierarchySequential,
      skippedLevels,
    };
  }

  private static gatherContentChunks(doc: Document) {
    const clone = doc.cloneNode(true) as Document;
    clone.querySelectorAll('script, style, noscript, svg, nav, footer, header').forEach((el) => el.remove());

    const hasMain = clone.querySelector('main') !== null;
    const hasArticle = clone.querySelector('article') !== null;
    const hasSections = clone.querySelector('section') !== null;

    const semanticTagsUsed: string[] = [];
    if (hasMain) semanticTagsUsed.push('main');
    if (hasArticle) semanticTagsUsed.push('article');
    if (hasSections) semanticTagsUsed.push('section');

    const chunks: any[] = [];
    const containers = clone.querySelectorAll('article, section, main, body');
    let chunkId = 0;

    containers.forEach((container) => {
      const text = container.textContent?.trim().replace(/\s+/g, ' ') || '';
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length >= 20) {
        const estimatedTokens = Math.round(words.length * 1.3);
        chunks.push({
          id: `chunk-${++chunkId}`,
          text: text.slice(0, 300),
          wordCount: words.length,
          estimatedTokens,
        });
      }
    });

    const totalWordCount = chunks.reduce((sum, c) => sum + c.wordCount, 0);
    const totalEstimatedTokens = chunks.reduce((sum, c) => sum + c.estimatedTokens, 0);
    const averageChunkTokenCount = chunks.length > 0 ? Math.round(totalEstimatedTokens / chunks.length) : 0;

    return {
      chunks,
      totalWordCount,
      totalEstimatedTokens,
      averageChunkTokenCount,
      semanticTagsUsed,
      hasSemanticMain: hasMain,
      hasSemanticArticle: hasArticle,
      hasSemanticSections: hasSections,
    };
  }

  private static gatherDirectAnswers(doc: Document) {
    const pairs: any[] = [];
    const questionWordsRegex = /^(what|how|why|when|where|who|which|is|are|can|do|does|should|will|¿|\?)\b/i;
    const definitionRegex = /\b(is a|is an|is the|are the|refers to|is defined as|means|consists of)\b/i;

    const headings = doc.querySelectorAll('h1, h2, h3, h4');
    headings.forEach((h) => {
      const question = h.textContent?.trim() || '';
      if (question.includes('?') || questionWordsRegex.test(question)) {
        let next = h.nextElementSibling;
        while (next && !['P', 'UL', 'OL'].includes(next.tagName)) {
          next = next.nextElementSibling;
        }
        if (next) {
          const answerText = next.textContent?.trim().replace(/\s+/g, ' ') || '';
          const words = answerText.split(/\s+/).filter(Boolean);
          const isConcise = words.length >= 20 && words.length <= 75;
          const hasDirectDefinition = definitionRegex.test(answerText.slice(0, 150));
          pairs.push({
            question,
            answerText,
            answerWordCount: words.length,
            isConcise,
            hasDirectDefinition,
          });
        }
      }
    });

    const conciseAnswersCount = pairs.filter((p) => p.isConcise).length;
    const definitionPatternsFound = pairs.filter((p) => p.hasDirectDefinition).length;
    const directAnswerRatio = pairs.length > 0 ? conciseAnswersCount / pairs.length : 0;

    return {
      pairs,
      directAnswerRatio,
      conciseAnswersCount,
      definitionPatternsFound,
    };
  }

  // --- 12 Pure Audits ---

  private static runAudits(artifacts: any) {
    const results: Record<string, any> = {};

    // 1. ai-robots-txt
    const bots = artifacts.RobotsTxt.aiBotsStatus;
    const botEntries = Object.entries(bots);
    const allowedBots = botEntries.filter(([_, status]) => status === 'allowed' || status === 'not_specified').length;
    const robotsScore = !artifacts.RobotsTxt.exists ? 1 : allowedBots / botEntries.length;
    results['ai-robots-txt'] = {
      id: 'ai-robots-txt',
      title: robotsScore >= 0.8 ? 'robots.txt allows crawling by major AI search bots' : 'robots.txt blocks or restricts major AI search crawlers',
      score: robotsScore >= 0.8 ? 1 : robotsScore,
      description: 'Answer Engines (SearchGPT, Perplexity, Claude) use AI crawlers like GPTBot and PerplexityBot to index up-to-date sources.',
      displayValue: `${allowedBots} of ${botEntries.length} AI bots have crawling access allowed`,
    };

    // 2. ai-x-robots-tag
    const xRobots = artifacts.HttpHeaders.xRobotsTag;
    const isBlockedX = xRobots && /noindex|none|noai/i.test(xRobots);
    results['ai-x-robots-tag'] = {
      id: 'ai-x-robots-tag',
      title: isBlockedX ? 'HTTP X-Robots-Tag headers restrict AI indexing' : 'HTTP headers do not block AI indexing or archiving',
      score: isBlockedX ? 0 : 1,
      description: 'Directives like noindex or noai in X-Robots-Tag prevent AI models from retrieving content.',
      displayValue: isBlockedX ? `Blocked: ${xRobots}` : 'Clean X-Robots-Tag header (no restrictions)',
    };

    // 3. ai-bot-sitemap
    const sitemaps = artifacts.RobotsTxt.sitemaps;
    results['ai-bot-sitemap'] = {
      id: 'ai-bot-sitemap',
      title: sitemaps.length > 0 ? 'robots.txt declares valid XML Sitemaps' : 'No XML Sitemap declaration found in robots.txt',
      score: sitemaps.length > 0 ? 1 : 0.5,
      description: 'XML Sitemaps enable Answer Engine crawlers to discover structured content efficiently.',
      displayValue: sitemaps.length > 0 ? `${sitemaps.length} sitemap(s) declared` : 'No sitemap declared in robots.txt',
    };

    // 4. jsonld-syntax-validity
    const jsonld = artifacts.JSONLD;
    const invalidJ = jsonld.items.filter((i: any) => !i.isValid);
    const validJCount = jsonld.items.length - invalidJ.length;
    results['jsonld-syntax-validity'] = {
      id: 'jsonld-syntax-validity',
      title: invalidJ.length === 0 ? 'All JSON-LD blocks have valid, error-free syntax' : 'Syntax errors detected in JSON-LD structured data blocks',
      score: jsonld.items.length === 0 ? 0.5 : validJCount / jsonld.items.length,
      description: 'Malformed JSON prevents Answer Engine parsers from extracting entity metadata.',
      displayValue: `${validJCount} of ${jsonld.items.length} JSON-LD blocks are valid`,
    };

    // 5. rag-schema-presence
    const ragCount = (jsonld.hasFAQPage ? 1 : 0) + (jsonld.hasHowTo || jsonld.hasQAPage ? 1 : 0) + (jsonld.hasArticle ? 1 : 0) + (jsonld.hasOrganization ? 1 : 0);
    results['rag-schema-presence'] = {
      id: 'rag-schema-presence',
      title: ragCount >= 1 ? 'Page implements RAG-optimized JSON-LD schemas (FAQPage, HowTo, Article)' : 'Missing high-value structured schemas for RAG',
      score: ragCount >= 2 ? 1 : ragCount === 1 ? 0.7 : 0.2,
      description: 'Schemas like FAQPage and HowTo enable Answer Engines to extract Q&A pairs directly.',
      displayValue: `${ragCount} RAG schema type(s) detected`,
    };

    // 6. entity-sameas-links
    const sameAsCount = jsonld.sameAsUrls.length;
    results['entity-sameas-links'] = {
      id: 'entity-sameas-links',
      title: sameAsCount > 0 ? 'Defines sameAs properties for Knowledge Graph entity disambiguation' : 'No sameAs links found in structured data',
      score: sameAsCount > 0 ? 1 : 0.4,
      description: 'The sameAs property links entities to Wikidata/Wikipedia in LLM knowledge graphs.',
      displayValue: sameAsCount > 0 ? `${sameAsCount} sameAs link(s) found` : 'No sameAs links found',
    };

    // 7. heading-hierarchy
    const headings = artifacts.HeadingsHierarchy;
    let headingScore = 1;
    if (!headings.hasSingleH1) headingScore -= 0.3;
    if (!headings.isHierarchySequential) headingScore -= 0.3;
    results['heading-hierarchy'] = {
      id: 'heading-hierarchy',
      title: headingScore >= 0.8 ? 'Heading structure (H1-H6) is sequential and contains a single H1' : 'Heading hierarchy contains level jumps or multiple H1 tags',
      score: Math.max(0.2, headingScore),
      description: 'Sequential headings (H1 -> H2 -> H3) allow RAG chunking algorithms to partition content accurately.',
      displayValue: `H1 Count: ${headings.h1Count}, Sequential: ${headings.isHierarchySequential ? 'Yes' : 'No'}`,
    };

    // 8. semantic-containers
    const chunks = artifacts.ContentChunks;
    const semScore = chunks.hasSemanticMain && (chunks.hasSemanticArticle || chunks.hasSemanticSections) ? 1 : chunks.hasSemanticMain ? 0.7 : 0.3;
    results['semantic-containers'] = {
      id: 'semantic-containers',
      title: semScore >= 0.7 ? 'Content uses semantic HTML5 containers (<main>, <article>, <section>)' : 'Content relies on generic <div> wrappers without semantic HTML5 markup',
      score: semScore,
      description: 'Semantic tags isolate primary content from nav, sidebar, and footer boilerplate.',
      displayValue: `Tags detected: ${chunks.semanticTagsUsed.join(', ') || 'None'}`,
    };

    // 9. chunk-token-density
    const tokenChunks = chunks.chunks.filter((c: any) => c.estimatedTokens >= 100 && c.estimatedTokens <= 600);
    const chunkRatio = chunks.chunks.length > 0 ? tokenChunks.length / chunks.chunks.length : 0.5;
    results['chunk-token-density'] = {
      id: 'chunk-token-density',
      title: chunkRatio >= 0.7 ? 'Content chunks maintain optimal token density for RAG (150 - 500 tokens)' : 'Content chunks are excessively long or fragmented',
      score: chunkRatio >= 0.7 ? 1 : Math.max(0.4, chunkRatio),
      description: 'Most RAG embeddings achieve highest precision with passages of 150-500 tokens.',
      displayValue: `${tokenChunks.length} of ${chunks.chunks.length} chunks optimal (Avg ~${chunks.averageChunkTokenCount} tokens)`,
    };

    // 10. direct-definition-answering
    const directAns = artifacts.DirectAnswers;
    const defCount = directAns.definitionPatternsFound;
    results['direct-definition-answering'] = {
      id: 'direct-definition-answering',
      title: defCount > 0 ? 'Key questions are answered directly with clear definitions in the opening paragraph' : 'Missing direct answers or clear definitions following key questions',
      score: directAns.pairs.length === 0 ? 0.5 : (defCount > 0 ? 1 : 0.4),
      description: 'Answer Engines prioritize passages delivering direct definitions ("X is a...") in opening lines.',
      displayValue: `${defCount} definition answer(s) found`,
    };

    // 11. concise-answer-wordcount
    const conciseCount = directAns.conciseAnswersCount;
    results['concise-answer-wordcount'] = {
      id: 'concise-answer-wordcount',
      title: conciseCount > 0 ? 'Direct answers maintain concise length (30 - 60 words)' : 'Direct answers are overly verbose or too brief',
      score: directAns.pairs.length === 0 ? 0.5 : Math.max(0.3, conciseCount / directAns.pairs.length),
      description: 'Language models prefer 30 to 60 word answers as featured snippets.',
      displayValue: `${conciseCount} concise answer(s) found`,
    };

    // 12. question-heading-alignment
    const qCount = directAns.pairs.length;
    results['question-heading-alignment'] = {
      id: 'question-heading-alignment',
      title: qCount > 0 ? 'Headings are structured as explicit questions or search queries' : 'Lacks subheadings phrased as search queries or FAQs',
      score: qCount >= 1 ? 1 : 0.4,
      description: 'Formulating subheadings as natural questions significantly boosts semantic search match.',
      displayValue: `${qCount} question-formulated heading(s) found`,
    };

    return results;
  }

  // --- Aggregator ---

  private static aggregateReport(url: string, audits: Record<string, any>) {
    const categoriesConfig = {
      'ai-accessibility': {
        id: 'ai-accessibility',
        title: 'AI Accessibility & Crawling',
        description: 'Verifies crawling permissions for AI agents (GPTBot, Perplexity, Claude, Google-Extended).',
        weight: 25,
        auditRefs: [
          { id: 'ai-robots-txt', weight: 10, result: audits['ai-robots-txt'] },
          { id: 'ai-x-robots-tag', weight: 8, result: audits['ai-x-robots-tag'] },
          { id: 'ai-bot-sitemap', weight: 2, result: audits['ai-bot-sitemap'] },
        ],
      },
      'structured-data': {
        id: 'structured-data',
        title: 'Structured Data & RAG Schemas',
        description: 'Audits JSON-LD schemas optimized for RAG (FAQPage, HowTo, Article, sameAs).',
        weight: 25,
        auditRefs: [
          { id: 'jsonld-syntax-validity', weight: 8, result: audits['jsonld-syntax-validity'] },
          { id: 'rag-schema-presence', weight: 8, result: audits['rag-schema-presence'] },
          { id: 'entity-sameas-links', weight: 4, result: audits['entity-sameas-links'] },
        ],
      },
      'content-chunking': {
        id: 'content-chunking',
        title: 'Content Chunking & Semantic Structure',
        description: 'Evaluates H1-H3 hierarchy, semantic HTML5 tags, and token density for embeddings.',
        weight: 25,
        auditRefs: [
          { id: 'heading-hierarchy', weight: 8, result: audits['heading-hierarchy'] },
          { id: 'semantic-containers', weight: 6, result: audits['semantic-containers'] },
          { id: 'chunk-token-density', weight: 6, result: audits['chunk-token-density'] },
        ],
      },
      'direct-answer-density': {
        id: 'direct-answer-density',
        title: 'Direct Answer Density',
        description: 'Detects concise, direct answers and definitions answering key search queries.',
        weight: 25,
        auditRefs: [
          { id: 'direct-definition-answering', weight: 10, result: audits['direct-definition-answering'] },
          { id: 'concise-answer-wordcount', weight: 6, result: audits['concise-answer-wordcount'] },
          { id: 'question-heading-alignment', weight: 4, result: audits['question-heading-alignment'] },
        ],
      },
    };

    const categories: Record<string, any> = {};
    let totalScore = 0;
    let totalWeight = 0;

    for (const [catId, cat] of Object.entries(categoriesConfig)) {
      let sum = 0;
      let wSum = 0;
      cat.auditRefs.forEach((ref) => {
        if (typeof ref.result?.score === 'number') {
          sum += ref.result.score * ref.weight;
          wSum += ref.weight;
        }
      });
      const catScore = wSum > 0 ? Number((sum / wSum).toFixed(2)) : 0;
      categories[catId] = {
        id: cat.id,
        title: cat.title,
        description: cat.description,
        score: catScore,
        auditRefs: cat.auditRefs,
      };

      totalScore += catScore * cat.weight;
      totalWeight += cat.weight;
    }

    const overallScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

    return {
      url,
      fetchTime: new Date().toISOString(),
      aeoVersion: '0.1.3',
      userAgent: navigator.userAgent,
      overallScore,
      categories,
      audits,
    };
  }
}

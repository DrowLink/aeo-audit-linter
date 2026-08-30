/**
 * @fileoverview Independent In-Browser SEO, GEO & AEO Audit Engine for Chrome Extension.
 * Implements Gatherers and Audits following the Google Lighthouse architecture with zero Node dependencies.
 */

const COMMON_STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'him', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its',
  'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'you', 'your', 'yours',
  // Spanish
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con', 'no', 'una', 'su',
  'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí', 'porque', 'esta', 'son', 'entre', 'está',
  'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante',
  'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos',
]);

export class BrowserAeoEngine {
  /**
   * Runs the full SEO, GEO & AEO audit lifecycle on a given DOM and URL
   */
  static async runAudit(url, html) {
    const urlObj = new URL(url);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Gather Phase
    const [robotsTxtArtifact, httpHeadersArtifact, llmsTxtArtifact] = await Promise.all([
      this.gatherRobotsTxt(urlObj),
      this.gatherHttpHeaders(url),
      this.gatherLlmsTxt(urlObj),
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
    const imagesArtifact = this.gatherImages(doc);
    const linksArtifact = this.gatherLinks(doc, url);
    const keywordsArtifact = this.gatherKeywords(doc);
    const contentChunksArtifact = this.gatherContentChunks(doc);
    const directAnswersArtifact = this.gatherDirectAnswers(doc);

    const artifacts = {
      URL: urlArtifact,
      RobotsTxt: robotsTxtArtifact,
      HttpHeaders: httpHeadersArtifact,
      JSONLD: jsonldArtifact,
      MetaTags: metaTagsArtifact,
      HeadingsHierarchy: headingsArtifact,
      Images: imagesArtifact,
      Links: linksArtifact,
      Keywords: keywordsArtifact,
      ContentChunks: contentChunksArtifact,
      DirectAnswers: directAnswersArtifact,
      LlmsTxt: llmsTxtArtifact,
    };

    // 2. Audits Phase
    const auditResults = this.runAudits(artifacts);

    // 3. Aggregator Phase
    const report = this.aggregateReport(url, auditResults);
    report.artifacts = artifacts;
    return report;
  }

  // --- Gatherers ---

  static async gatherRobotsTxt(urlObj) {
    const robotsUrl = `${urlObj.origin}/robots.txt`;
    let rawContent = null;
    let exists = false;
    let sitemaps = [];
    const rulesByAgent = {};

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
      let currentAgents = [];
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

    const checkBot = (botName) => {
      const rule = rulesByAgent[botName.toLowerCase()] || rulesByAgent['*'];
      if (!rule) return 'not_specified';
      if (rule.disallow.includes('/') || rule.disallow.includes('/*')) return 'disallowed';
      if (rule.allow.includes('/') || rule.allow.includes('/*')) return 'allowed';
      if (rule.disallow.length > 0) return 'partially_disallowed';
      return 'allowed';
    };

    return {
      rawContent,
      exists,
      sitemaps,
      rulesByAgent,
      aiBotsStatus: {
        gptBot: checkBot('GPTBot'),
        perplexityBot: checkBot('PerplexityBot'),
        claudeBot: checkBot('ClaudeBot'),
        googleExtended: checkBot('Google-Extended'),
        ccBot: checkBot('CCBot'),
        bytespider: checkBot('Bytespider'),
        cohereAi: checkBot('cohere-ai'),
      },
    };
  }

  static async gatherHttpHeaders(url) {
    let xRobotsTag = null;
    let contentType = null;
    let statusCode = 200;

    try {
      const res = await fetch(url, { method: 'HEAD' });
      statusCode = res.status;
      xRobotsTag = res.headers.get('x-robots-tag');
      contentType = res.headers.get('content-type');
    } catch {}

    return {
      statusCode,
      xRobotsTag,
      contentType,
      headers: {},
    };
  }

  static async gatherLlmsTxt(urlObj) {
    const llmsUrl = `${urlObj.origin}/llms.txt`;
    const llmsFullUrl = `${urlObj.origin}/llms-full.txt`;
    let rawContent = null;
    let exists = false;
    let hasFullVersion = false;

    try {
      const res = await fetch(llmsUrl);
      if (res.ok) {
        const text = await res.text();
        const trimmed = text.trim().toLowerCase();
        if (!trimmed.startsWith('<!doctype html') && !trimmed.startsWith('<html')) {
          rawContent = text;
          exists = true;
        }
      }
    } catch {}

    try {
      const resFull = await fetch(llmsFullUrl);
      if (resFull.ok) {
        const textFull = await resFull.text();
        const trimmed = textFull.trim().toLowerCase();
        if (!trimmed.startsWith('<!doctype html') && !trimmed.startsWith('<html')) {
          hasFullVersion = true;
        }
      }
    } catch {}

    let totalDeclaredLinks = 0;
    if (rawContent) {
      const linkMatches = rawContent.match(/^[-*]\s+\[.+\]\(.+\)/gm);
      if (linkMatches) totalDeclaredLinks = linkMatches.length;
    }

    return {
      exists,
      rawContent,
      hasFullVersion,
      totalDeclaredLinks,
    };
  }

  static gatherJsonLd(doc) {
    const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
    const items = [];
    const schemasCountByType = {};
    let hasFAQPage = false;
    let hasHowTo = false;
    let hasArticle = false;
    let hasQAPage = false;
    let hasOrganization = false;
    let hasProduct = false;
    const sameAsUrls = [];

    const authorEeat = {
      hasAuthorSchema: false,
      authorName: undefined,
      authorType: undefined,
      authorSameAsUrls: [],
      hasPublisherSchema: false,
      publisherName: undefined,
      hasDatePublished: false,
      datePublished: undefined,
      hasDateModified: false,
      dateModified: undefined,
      hasDomAuthorByline: false,
      domAuthorText: undefined,
      hasDomPublishedDate: false,
    };

    scripts.forEach((script) => {
      const raw = script.textContent || '';
      try {
        const parsed = JSON.parse(raw);
        const types = Array.isArray(parsed['@type']) ? parsed['@type'] : [parsed['@type'] || ''];
        types.forEach((t) => {
          if (t) schemasCountByType[t] = (schemasCountByType[t] || 0) + 1;
          if (t.includes('FAQPage')) hasFAQPage = true;
          if (t.includes('HowTo')) hasHowTo = true;
          if (t.includes('Article')) hasArticle = true;
          if (t.includes('QAPage')) hasQAPage = true;
          if (t.includes('Organization')) hasOrganization = true;
          if (t.includes('Product')) hasProduct = true;
          if (t.includes('Person')) {
            authorEeat.hasAuthorSchema = true;
            authorEeat.authorType = 'Person';
            if (parsed.name) authorEeat.authorName = parsed.name;
          }
        });

        if (parsed.author) {
          authorEeat.hasAuthorSchema = true;
          if (typeof parsed.author === 'object') {
            if (parsed.author.name) authorEeat.authorName = parsed.author.name;
            if (parsed.author['@type']) authorEeat.authorType = parsed.author['@type'];
            if (parsed.author.sameAs) {
              if (Array.isArray(parsed.author.sameAs)) authorEeat.authorSameAsUrls.push(...parsed.author.sameAs);
              else authorEeat.authorSameAsUrls.push(parsed.author.sameAs);
            }
          } else if (typeof parsed.author === 'string') {
            authorEeat.authorName = parsed.author;
          }
        }

        if (parsed.publisher) {
          authorEeat.hasPublisherSchema = true;
          authorEeat.publisherName = typeof parsed.publisher === 'object' ? parsed.publisher.name : parsed.publisher;
        }

        if (parsed.datePublished) {
          authorEeat.hasDatePublished = true;
          authorEeat.datePublished = String(parsed.datePublished);
        }

        if (parsed.dateModified) {
          authorEeat.hasDateModified = true;
          authorEeat.dateModified = String(parsed.dateModified);
        }

        if (parsed.sameAs) {
          if (Array.isArray(parsed.sameAs)) sameAsUrls.push(...parsed.sameAs);
          else sameAsUrls.push(parsed.sameAs);
        }

        items.push({ raw, parsed, isValid: true });
      } catch (err) {
        items.push({ raw, parsed: null, isValid: false, syntaxErrors: [err.message] });
      }
    });

    const domAuthor = doc.querySelector('[rel="author"], .author, .byline, [itemprop="author"]');
    if (domAuthor && domAuthor.textContent?.trim()) {
      authorEeat.hasDomAuthorByline = true;
      authorEeat.domAuthorText = domAuthor.textContent.trim().replace(/\s+/g, ' ');
    }

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
      authorEeat,
    };
  }

  static gatherMetaTags(doc) {
    const titleEl = doc.querySelector('title');
    const title = titleEl ? titleEl.textContent?.trim() || null : null;

    const descEl = doc.querySelector('meta[name="description" i]');
    const description = descEl ? descEl.getAttribute('content')?.trim() || null : null;

    const canonicalEl = doc.querySelector('link[rel="canonical" i]');
    const canonicalUrl = canonicalEl ? canonicalEl.getAttribute('href')?.trim() || null : null;

    const viewportEl = doc.querySelector('meta[name="viewport" i]');
    const viewport = viewportEl ? viewportEl.getAttribute('content')?.trim() || null : null;

    const robotsEl = doc.querySelector('meta[name="robots" i]');
    const robotsMeta = robotsEl ? robotsEl.getAttribute('content')?.trim() || null : null;

    const openGraph = {};
    doc.querySelectorAll('meta[property^="og:" i]').forEach((el) => {
      const prop = el.getAttribute('property');
      const val = el.getAttribute('content');
      if (prop && val) openGraph[prop.toLowerCase()] = val;
    });

    const twitterCard = {};
    doc.querySelectorAll('meta[name^="twitter:" i], meta[property^="twitter:" i]').forEach((el) => {
      const name = el.getAttribute('name') || el.getAttribute('property');
      const val = el.getAttribute('content');
      if (name && val) twitterCard[name.toLowerCase()] = val;
    });

    return {
      title,
      description,
      canonicalUrl,
      viewport,
      robotsMeta,
      openGraph,
      twitterCard,
    };
  }

  static gatherHeadings(doc) {
    const headings = [];
    let h1Count = 0;
    let h2Count = 0;
    let h3Count = 0;
    let h4Count = 0;
    let h5Count = 0;
    let h6Count = 0;

    const els = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    els.forEach((el, index) => {
      const level = parseInt(el.tagName.charAt(1), 10);
      const text = el.textContent?.trim().replace(/\s+/g, ' ') || '';
      if (level === 1) h1Count++;
      if (level === 2) h2Count++;
      if (level === 3) h3Count++;
      if (level === 4) h4Count++;
      if (level === 5) h5Count++;
      if (level === 6) h6Count++;
      headings.push({ level, text, index, id: el.id || undefined });
    });

    const skippedLevels = [];
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
      h4Count,
      h5Count,
      h6Count,
      hasSingleH1: h1Count === 1,
      isHierarchySequential,
      skippedLevels,
    };
  }

  static gatherImages(doc) {
    const images = [];
    let missingAltCount = 0;
    let passedAltCount = 0;

    doc.querySelectorAll('img').forEach((el) => {
      const src = el.getAttribute('src') || el.getAttribute('data-src') || '';
      const altAttr = el.getAttribute('alt');
      const role = el.getAttribute('role');
      const isDecorative = role === 'presentation' || role === 'none';
      const hasAlt = altAttr !== null;
      const altText = hasAlt ? altAttr.trim() : null;

      if (!hasAlt && !isDecorative) {
        missingAltCount++;
      } else {
        passedAltCount++;
      }

      images.push({
        src,
        alt: altText,
        hasAlt,
        isDecorative,
        width: el.width || undefined,
        height: el.height || undefined,
        loading: el.getAttribute('loading') || undefined,
      });
    });

    return {
      images,
      totalImages: images.length,
      missingAltCount,
      passedAltCount,
    };
  }

  static gatherLinks(doc, baseUrlStr) {
    let baseHostname = '';
    try {
      baseHostname = new URL(baseUrlStr).hostname.toLowerCase();
    } catch {}

    const links = [];
    let internalLinksCount = 0;
    let externalLinksCount = 0;
    let missingTextCount = 0;
    let nonCrawlableCount = 0;

    doc.querySelectorAll('a').forEach((el) => {
      const href = el.getAttribute('href') || '';
      const text = el.textContent?.trim().replace(/\s+/g, ' ') || '';
      const rel = el.getAttribute('rel') || undefined;
      const target = el.getAttribute('target') || undefined;

      const trimmed = href.trim();
      const isAnchorOnly = trimmed === '' || trimmed.startsWith('#');
      const isJs = trimmed.toLowerCase().startsWith('javascript:');
      const isMailOrTel = trimmed.toLowerCase().startsWith('mailto:') || trimmed.toLowerCase().startsWith('tel:');

      const isCrawlable = !isJs && !isAnchorOnly && !isMailOrTel && trimmed.length > 0;

      let isInternal = false;
      let isExternal = false;

      if (isCrawlable) {
        try {
          const resolved = new URL(trimmed, baseUrlStr);
          if (baseHostname && (resolved.hostname.toLowerCase() === baseHostname || resolved.hostname.toLowerCase().endsWith('.' + baseHostname))) {
            isInternal = true;
            internalLinksCount++;
          } else {
            isExternal = true;
            externalLinksCount++;
          }
        } catch {
          if (!trimmed.startsWith('http')) {
            isInternal = true;
            internalLinksCount++;
          } else {
            isExternal = true;
            externalLinksCount++;
          }
        }
      } else {
        nonCrawlableCount++;
      }

      const hasText = text.length > 0 || el.querySelector('img[alt]') !== null || Boolean(el.getAttribute('aria-label')?.trim());
      if (!hasText) {
        missingTextCount++;
      }

      links.push({
        href: trimmed,
        text: text || el.getAttribute('aria-label') || el.querySelector('img')?.getAttribute('alt') || '',
        isInternal,
        isExternal,
        hasText,
        isCrawlable,
        rel,
        target,
      });
    });

    return {
      links,
      totalLinks: links.length,
      internalLinksCount,
      externalLinksCount,
      missingTextCount,
      nonCrawlableCount,
    };
  }

  static gatherKeywords(doc) {
    const clone = doc.cloneNode(true);
    clone.querySelectorAll('script, style, noscript, svg, iframe').forEach((el) => el.remove());

    const bodyText = clone.body?.textContent?.toLowerCase() || '';
    const tokens = bodyText.match(/[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ]{3,}/g) || [];
    const totalWords = tokens.length;
    const frequencyMap = {};

    tokens.forEach((token) => {
      if (COMMON_STOP_WORDS.has(token) || /^\d+$/.test(token)) return;
      frequencyMap[token] = (frequencyMap[token] || 0) + 1;
    });

    const topKeywords = Object.entries(frequencyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([word, count]) => ({
        word,
        count,
        densityPercent: totalWords > 0 ? Number(((count / totalWords) * 100).toFixed(2)) : 0,
      }));

    return {
      topKeywords,
      totalWords,
    };
  }

  static gatherContentChunks(doc) {
    const semanticContainers = Array.from(doc.querySelectorAll('article, section, main, [role="main"], [role="article"]'));
    const chunks = [];
    let totalWordCount = 0;

    const elementsToChunk = semanticContainers.length > 0 ? semanticContainers : Array.from(doc.querySelectorAll('p, div > p, ul, table'));

    elementsToChunk.forEach((el, index) => {
      const text = el.textContent?.trim().replace(/\s+/g, ' ') || '';
      const words = text.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      if (wordCount < 10) return;

      totalWordCount += wordCount;
      const estimatedTokens = Math.round(wordCount * 1.33);

      chunks.push({
        id: `chunk-${index}`,
        text: text.slice(0, 200) + (text.length > 200 ? '...' : ''),
        wordCount,
        estimatedTokens,
        parentTag: el.tagName.toLowerCase(),
        hasList: el.querySelectorAll('ul, ol').length > 0,
        hasTable: el.querySelectorAll('table').length > 0,
        isSemanticContainer: ['article', 'section', 'main'].includes(el.tagName.toLowerCase()),
      });
    });

    const totalEstimatedTokens = Math.round(totalWordCount * 1.33);
    const averageChunkTokenCount = chunks.length > 0 ? Math.round(totalEstimatedTokens / chunks.length) : 0;

    const hasMain = doc.querySelector('main, [role="main"]') !== null;
    const hasArticle = doc.querySelector('article, [role="article"]') !== null;
    const hasSections = doc.querySelectorAll('section').length > 0;

    const semanticTagsUsed = [];
    if (hasMain) semanticTagsUsed.push('main');
    if (hasArticle) semanticTagsUsed.push('article');
    if (hasSections) semanticTagsUsed.push('section');

    const totalTablesCount = doc.querySelectorAll('table').length;
    const totalListsCount = doc.querySelectorAll('ul, ol').length;
    const totalListItemsCount = doc.querySelectorAll('li').length;
    const structuredTablesCount = doc.querySelectorAll('table th').length > 0 ? totalTablesCount : 0;

    return {
      chunks,
      totalWordCount,
      totalEstimatedTokens,
      averageChunkTokenCount,
      semanticTagsUsed,
      hasSemanticMain: hasMain,
      hasSemanticArticle: hasArticle,
      hasSemanticSections: hasSections,
      totalTablesCount,
      totalListsCount,
      totalListItemsCount,
      structuredTablesCount,
    };
  }

  static gatherDirectAnswers(doc) {
    const pairs = [];
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

    const fullText = doc.body?.textContent?.replace(/\s+/g, ' ') || '';
    const percentageMatches = fullText.match(/\b\d+(?:\.\d+)?\s*(?:%|percent\b|por ciento\b)/gi) || [];
    const numericalMatches = fullText.match(/(?:[\$€£¥]\s*\d+(?:\.\d+)?|\b\d+(?:\.\d+)?\s*(?:ms|kb|mb|gb|tb|km|kg|k|m|million|billion|millones|tokens|users|usuarios|fps)\b)/gi) || [];
    const citationMatches = fullText.match(/\b(?:according to|study by|research by|survey by|reported by|published by|data shows|data from|source:|según|estudio de|investigación de|fuente:|datos de|informe de)\b/gi) || [];
    const externalLinks = Array.from(doc.querySelectorAll('a[href^="http"]'))
      .map((a) => a.getAttribute('href') || '')
      .filter((h) => {
        try {
          return new URL(h).hostname !== window.location.hostname;
        } catch {
          return false;
        }
      });

    return {
      pairs,
      directAnswerRatio,
      conciseAnswersCount,
      definitionPatternsFound,
      facts: {
        percentagesCount: percentageMatches.length,
        numericalMetricsCount: numericalMatches.length,
        citationPhrasesCount: citationMatches.length,
        externalSourcesCount: externalLinks.length,
        totalFactSignals: percentageMatches.length + numericalMatches.length + citationMatches.length + externalLinks.length,
      },
    };
  }

  // --- Audits ---

  static runAudits(artifacts) {
    const results = {};

    // --- 1. SEO Fundamentals ---
    // seo-title
    const title = artifacts.MetaTags.title;
    const tLen = title ? title.trim().length : 0;
    if (!title || tLen === 0) {
      results['seo-title'] = {
        id: 'seo-title',
        title: 'Document has a descriptive <title> element of optimal length',
        score: 0,
        description: 'Crucial for search engines and AI to identify the page topic. Optimal length: 30-60 chars.',
        displayValue: 'Missing <title> tag',
      };
    } else if (tLen >= 30 && tLen <= 60) {
      results['seo-title'] = {
        id: 'seo-title',
        title: 'Document has a descriptive <title> element of optimal length',
        score: 1,
        description: 'Optimal title length between 30 and 60 characters.',
        displayValue: `Optimal length (${tLen} chars)`,
      };
    } else if (tLen < 30) {
      results['seo-title'] = {
        id: 'seo-title',
        title: 'Document <title> is shorter than recommended (30-60 characters)',
        score: 0.7,
        description: 'Short titles may fail to provide enough topical context.',
        displayValue: `Title too short (${tLen} chars)`,
      };
    } else {
      results['seo-title'] = {
        id: 'seo-title',
        title: 'Document <title> is longer than recommended (30-60 characters)',
        score: 0.8,
        description: 'Titles longer than 60 characters risk snippet truncation.',
        displayValue: `Title too long (${tLen} chars)`,
      };
    }

    // seo-meta-description
    const desc = artifacts.MetaTags.description;
    const dLen = desc ? desc.trim().length : 0;
    if (!desc || dLen === 0) {
      results['seo-meta-description'] = {
        id: 'seo-meta-description',
        title: 'Document has a meta description of optimal length',
        score: 0,
        description: 'Meta descriptions summarize page content in search snippets. Optimal: 70-155 chars.',
        displayValue: 'Missing meta description',
      };
    } else if (dLen >= 70 && dLen <= 155) {
      results['seo-meta-description'] = {
        id: 'seo-meta-description',
        title: 'Document has a meta description of optimal length',
        score: 1,
        description: 'Optimal description length between 70 and 155 characters.',
        displayValue: `Optimal length (${dLen} chars)`,
      };
    } else if (dLen < 70) {
      results['seo-meta-description'] = {
        id: 'seo-meta-description',
        title: 'Meta description is shorter than recommended (70-155 characters)',
        score: 0.6,
        description: 'Short meta descriptions provide insufficient context.',
        displayValue: `Description too short (${dLen} chars)`,
      };
    } else {
      results['seo-meta-description'] = {
        id: 'seo-meta-description',
        title: 'Meta description is longer than recommended (70-155 characters)',
        score: 0.75,
        description: 'Descriptions over 155 characters may be truncated.',
        displayValue: `Description too long (${dLen} chars)`,
      };
    }

    // seo-canonical
    const canonical = artifacts.MetaTags.canonicalUrl;
    results['seo-canonical'] = {
      id: 'seo-canonical',
      title: canonical ? 'Document has a valid canonical URL link element' : 'Document is missing a canonical URL link tag',
      score: canonical ? 1 : 0,
      description: 'Canonical URLs prevent duplicate content and specify the preferred authoritative URL.',
      displayValue: canonical ? `Canonical: ${canonical}` : 'Canonical not set',
    };

    // seo-indexability
    const metaRobots = (artifacts.MetaTags.robotsMeta || '').toLowerCase();
    const xRobots = (artifacts.HttpHeaders.xRobotsTag || '').toLowerCase();
    const isNoIndex = metaRobots.includes('noindex') || xRobots.includes('noindex');
    results['seo-indexability'] = {
      id: 'seo-indexability',
      title: isNoIndex ? 'Page indexing is blocked by directives (noindex)' : 'Page is indexable by search engines and AI crawlers',
      score: isNoIndex ? 0 : 1,
      description: 'Verifies robots meta tags and HTTP headers do not block indexing.',
      displayValue: isNoIndex ? 'Blocked by noindex' : 'Page is fully indexable',
    };

    // seo-image-alt
    const images = artifacts.Images;
    const imgTotal = images.totalImages;
    const imgMissing = images.missingAltCount;
    const imgScore = imgTotal === 0 ? 1 : Number(((imgTotal - imgMissing) / imgTotal).toFixed(2));
    results['seo-image-alt'] = {
      id: 'seo-image-alt',
      title: imgMissing === 0 ? 'Image elements have descriptive alt attributes' : 'Some image elements are missing alt attributes',
      score: imgScore,
      description: 'Alt attributes are essential for image search indexing and accessibility.',
      displayValue: imgTotal === 0 ? 'No images found' : (imgMissing === 0 ? `All ${imgTotal} images have alt text` : `${imgMissing} of ${imgTotal} missing alt`),
    };

    // seo-crawlable-links
    const links = artifacts.Links;
    const lTotal = links.totalLinks;
    const lNonCrawlable = links.nonCrawlableCount;
    const lMissingText = links.missingTextCount;
    let lScore = 1;
    if (lTotal > 0) {
      lScore = Math.max(0.2, 1 - (lNonCrawlable / lTotal) * 0.6 - (lMissingText / lTotal) * 0.4);
    }
    results['seo-crawlable-links'] = {
      id: 'seo-crawlable-links',
      title: lNonCrawlable === 0 && lMissingText === 0 ? 'Links are crawlable and have descriptive anchor text' : 'Some links are not crawlable or lack anchor text',
      score: Number(lScore.toFixed(2)),
      description: 'Search crawlers follow anchor tags with valid hrefs and descriptive text.',
      displayValue: lTotal === 0 ? 'No links found' : `${links.internalLinksCount} internal, ${links.externalLinksCount} external links`,
    };

    // seo-open-graph
    const og = artifacts.MetaTags.openGraph || {};
    const ogScore = (og['og:title'] ? 0.35 : 0) + (og['og:description'] ? 0.35 : 0) + (og['og:image'] ? 0.3 : 0);
    results['seo-open-graph'] = {
      id: 'seo-open-graph',
      title: ogScore >= 0.7 ? 'Open Graph and social snippet metadata are configured' : 'Incomplete Open Graph metadata (og:title, og:desc, og:image)',
      score: ogScore > 0 ? Number(ogScore.toFixed(2)) : 0,
      description: 'Open Graph tags power rich previews in search engines, social networks, and chat AI.',
      displayValue: ogScore === 1 ? 'Open Graph complete' : (ogScore > 0 ? 'Partial Open Graph tags' : 'No Open Graph tags found'),
    };

    // seo-viewport-mobile
    const viewport = artifacts.MetaTags.viewport;
    const hasVp = viewport && viewport.includes('width=device-width');
    results['seo-viewport-mobile'] = {
      id: 'seo-viewport-mobile',
      title: hasVp ? 'Document has a mobile-friendly <meta name="viewport"> tag' : 'Missing or suboptimal mobile viewport configuration',
      score: hasVp ? 1 : (viewport ? 0.7 : 0),
      description: 'Mobile responsiveness is mandatory for mobile-first indexing.',
      displayValue: hasVp ? 'Viewport configured' : (viewport || 'Missing viewport'),
    };

    // seo-https
    const isHttps = artifacts.URL.protocol === 'https:' || artifacts.URL.finalUrl.startsWith('https://');
    results['seo-https'] = {
      id: 'seo-https',
      title: isHttps ? 'Page is served securely over HTTPS' : 'Page is served over insecure HTTP',
      score: isHttps ? 1 : 0,
      description: 'HTTPS is a core security and search ranking signal.',
      displayValue: isHttps ? 'HTTPS Secure' : 'HTTP Insecure',
    };

    // --- 2. AI Accessibility & Crawling ---
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

    const isBlockedX = xRobots && /noindex|none|noai/i.test(xRobots);
    results['ai-x-robots-tag'] = {
      id: 'ai-x-robots-tag',
      title: isBlockedX ? 'HTTP X-Robots-Tag headers restrict AI indexing' : 'HTTP headers do not block AI indexing or archiving',
      score: isBlockedX ? 0 : 1,
      description: 'Directives like noindex or noai in X-Robots-Tag prevent AI models from retrieving content.',
      displayValue: isBlockedX ? `Blocked: ${xRobots}` : 'Clean X-Robots-Tag header (no restrictions)',
    };

    const sitemaps = artifacts.RobotsTxt.sitemaps;
    results['ai-bot-sitemap'] = {
      id: 'ai-bot-sitemap',
      title: sitemaps.length > 0 ? 'robots.txt declares valid XML Sitemaps' : 'No XML Sitemap declaration found in robots.txt',
      score: sitemaps.length > 0 ? 1 : 0.5,
      description: 'XML Sitemaps enable Answer Engine crawlers to discover structured content efficiently.',
      displayValue: sitemaps.length > 0 ? `${sitemaps.length} sitemap(s) declared` : 'No sitemap declared in robots.txt',
    };

    const llms = artifacts.LlmsTxt;
    results['ai-llms-txt'] = {
      id: 'ai-llms-txt',
      title: llms.exists ? 'Website provides a standard /llms.txt file for LLM consumption' : 'Missing /llms.txt file for direct LLM and AI agent ingestion',
      score: llms.exists ? (llms.hasFullVersion ? 1 : 0.9) : 0,
      description: 'The /llms.txt standard provides clean Markdown summaries and links formatted for LLMs.',
      displayValue: llms.exists ? `/llms.txt active (${llms.totalDeclaredLinks} link(s) found)` : 'No /llms.txt file found',
    };

    // --- 3. Structured Data & RAG Schemas ---
    const jsonld = artifacts.JSONLD;
    const invalidJ = jsonld.items.filter((i) => !i.isValid);
    const validJCount = jsonld.items.length - invalidJ.length;
    results['jsonld-syntax-validity'] = {
      id: 'jsonld-syntax-validity',
      title: invalidJ.length === 0 ? 'All JSON-LD blocks have valid, error-free syntax' : 'Syntax errors detected in JSON-LD structured data blocks',
      score: jsonld.items.length === 0 ? 0.5 : validJCount / jsonld.items.length,
      description: 'Malformed JSON prevents Answer Engine parsers from extracting entity metadata.',
      displayValue: `${validJCount} of ${jsonld.items.length} JSON-LD blocks are valid`,
    };

    const ragCount = (jsonld.hasFAQPage ? 1 : 0) + (jsonld.hasHowTo || jsonld.hasQAPage ? 1 : 0) + (jsonld.hasArticle ? 1 : 0) + (jsonld.hasOrganization ? 1 : 0);
    results['rag-schema-presence'] = {
      id: 'rag-schema-presence',
      title: ragCount >= 1 ? 'Page implements RAG-optimized JSON-LD schemas (FAQPage, HowTo, Article)' : 'Missing high-value structured schemas for RAG',
      score: ragCount >= 2 ? 1 : ragCount === 1 ? 0.7 : 0.2,
      description: 'Schemas like FAQPage and HowTo enable Answer Engines to extract Q&A pairs directly.',
      displayValue: `${ragCount} RAG schema type(s) detected`,
    };

    const sameAsCount = jsonld.sameAsUrls.length;
    results['entity-sameas-links'] = {
      id: 'entity-sameas-links',
      title: sameAsCount > 0 ? 'Defines sameAs properties for Knowledge Graph entity disambiguation' : 'No sameAs links found in structured data',
      score: sameAsCount > 0 ? 1 : 0.4,
      description: 'The sameAs property links entities to Wikidata/Wikipedia in LLM knowledge graphs.',
      displayValue: sameAsCount > 0 ? `${sameAsCount} sameAs link(s) found` : 'No sameAs links found',
    };

    const eeat = jsonld.authorEeat || {};
    let eeatScore = 0.5;
    if (eeat.hasAuthorSchema && eeat.authorSameAsUrls?.length > 0 && (eeat.hasPublisherSchema || eeat.hasDomAuthorByline)) {
      eeatScore = 1.0;
    } else if (eeat.hasAuthorSchema && (eeat.hasPublisherSchema || eeat.hasDomAuthorByline)) {
      eeatScore = 0.85;
    } else if (eeat.hasAuthorSchema || eeat.hasDomAuthorByline) {
      eeatScore = 0.65;
    } else if (eeat.hasPublisherSchema || jsonld.hasOrganization) {
      eeatScore = 0.5;
    } else {
      eeatScore = 0.3;
    }
    results['author-eeat-presence'] = {
      id: 'author-eeat-presence',
      title: eeatScore >= 0.85 ? 'Content features verified author credentials and E-E-A-T structured schema' : 'Missing author credentials, publisher identity, or E-E-A-T metadata',
      score: eeatScore,
      description: 'E-E-A-T signals (Author schema, profile links, publisher info) verify authority for Answer Engines.',
      displayValue: eeat.authorName || eeat.domAuthorText ? `Author: ${eeat.authorName || eeat.domAuthorText}` : (eeat.hasPublisherSchema ? 'Publisher verified' : 'No author credentials detected'),
    };

    // --- 4. Content Chunking & Semantic Structure ---
    const headings = artifacts.HeadingsHierarchy;
    let headingScore = 1;
    if (!headings.hasSingleH1) headingScore -= 0.3;
    if (!headings.isHierarchySequential) headingScore -= 0.3;
    results['heading-hierarchy'] = {
      id: 'heading-hierarchy',
      title: headingScore >= 0.8 ? 'Heading structure (H1-H6) is sequential and contains a single H1' : 'Heading hierarchy contains level jumps or multiple H1 tags',
      score: Math.max(0.2, headingScore),
      description: 'Sequential headings (H1 -> H2 -> H3) allow RAG chunking algorithms to partition content accurately.',
      displayValue: `H1: ${headings.h1Count}, H2: ${headings.h2Count}, H3: ${headings.h3Count}`,
    };

    const chunks = artifacts.ContentChunks;
    const semScore = chunks.hasSemanticMain && (chunks.hasSemanticArticle || chunks.hasSemanticSections) ? 1 : chunks.hasSemanticMain ? 0.7 : 0.3;
    results['semantic-containers'] = {
      id: 'semantic-containers',
      title: semScore >= 0.7 ? 'Content uses semantic HTML5 containers (<main>, <article>, <section>)' : 'Content relies on generic <div> wrappers without semantic HTML5 markup',
      score: semScore,
      description: 'Semantic tags isolate primary content from nav, sidebar, and footer boilerplate.',
      displayValue: `Tags detected: ${chunks.semanticTagsUsed.join(', ') || 'None'}`,
    };

    const tokenChunks = chunks.chunks.filter((c) => c.estimatedTokens >= 100 && c.estimatedTokens <= 600);
    const chunkRatio = chunks.chunks.length > 0 ? tokenChunks.length / chunks.chunks.length : 0.5;
    results['chunk-token-density'] = {
      id: 'chunk-token-density',
      title: chunkRatio >= 0.7 ? 'Content chunks maintain optimal token density for RAG (150 - 500 tokens)' : 'Content chunks are excessively long or fragmented',
      score: chunkRatio >= 0.7 ? 1 : Math.max(0.4, chunkRatio),
      description: 'Most RAG embeddings achieve highest precision with passages of 150-500 tokens.',
      displayValue: `${tokenChunks.length} of ${chunks.chunks.length} chunks optimal (Avg ~${chunks.averageChunkTokenCount} tokens)`,
    };

    const totalTables = chunks.totalTablesCount || 0;
    const totalLists = chunks.totalListsCount || 0;
    const totalItems = chunks.totalListItemsCount || 0;
    let scannableScore = 0.5;
    if (chunks.totalWordCount < 150) {
      scannableScore = 1;
    } else if (totalTables > 0 && totalLists > 0) {
      scannableScore = 1;
    } else if (totalTables > 0 || totalLists >= 2) {
      scannableScore = 0.9;
    } else if (totalLists === 1 && totalItems >= 3) {
      scannableScore = 0.8;
    } else if (chunks.totalWordCount > 500) {
      scannableScore = 0.3;
    }
    results['table-list-scannability'] = {
      id: 'table-list-scannability',
      title: scannableScore >= 0.8 ? 'Content leverages structured HTML tables and lists for rapid LLM extraction' : 'Content lacks structured tables or lists for quick answer extraction',
      score: scannableScore,
      description: 'Generative search engines favor bulleted lists and tables over dense paragraphs.',
      displayValue: `${totalTables} table(s), ${totalLists} list(s) (${totalItems} items)`,
    };

    // --- 5. Direct Answer Density & Fact Grounding ---
    const directAns = artifacts.DirectAnswers;
    const defCount = directAns.definitionPatternsFound;
    results['direct-definition-answering'] = {
      id: 'direct-definition-answering',
      title: defCount > 0 ? 'Key questions are answered directly with clear definitions in the opening paragraph' : 'Missing direct answers or clear definitions following key questions',
      score: directAns.pairs.length === 0 ? 0.5 : (defCount > 0 ? 1 : 0.4),
      description: 'Answer Engines prioritize passages delivering direct definitions ("X is a...") in opening lines.',
      displayValue: `${defCount} definition answer(s) found`,
    };

    const conciseCount = directAns.conciseAnswersCount;
    results['concise-answer-wordcount'] = {
      id: 'concise-answer-wordcount',
      title: conciseCount > 0 ? 'Direct answers maintain concise length (30 - 60 words)' : 'Direct answers are overly verbose or too brief',
      score: directAns.pairs.length === 0 ? 0.5 : Math.max(0.3, conciseCount / directAns.pairs.length),
      description: 'Language models prefer 30 to 60 word answers as featured snippets.',
      displayValue: `${conciseCount} concise answer(s) found`,
    };

    const qCount = directAns.pairs.length;
    results['question-heading-alignment'] = {
      id: 'question-heading-alignment',
      title: qCount > 0 ? 'Headings are structured as explicit questions or search queries' : 'Lacks subheadings phrased as search queries or FAQs',
      score: qCount >= 1 ? 1 : 0.4,
      description: 'Formulating subheadings as natural questions significantly boosts semantic search match.',
      displayValue: `${qCount} question-formulated heading(s) found`,
    };

    const factSignals = directAns.facts?.totalFactSignals || 0;
    const extCount = directAns.facts?.externalSourcesCount || 0;
    const pCount = directAns.facts?.percentagesCount || 0;
    const numCount = directAns.facts?.numericalMetricsCount || 0;
    let factScore = 0.5;
    if (factSignals >= 4 && extCount >= 1) factScore = 1.0;
    else if (factSignals >= 3) factScore = 0.85;
    else if (factSignals >= 1) factScore = 0.65;
    else factScore = 0.3;

    results['fact-citation-density'] = {
      id: 'fact-citation-density',
      title: factScore >= 0.85 ? 'Content incorporates concrete statistics, verifiable metrics, and authoritative citations' : 'Content lacks statistics, numerical metrics, or authoritative citations',
      score: factScore,
      description: 'Citing verifiable percentages and authoritative sources increases LLM synthesis and citation frequency by up to 40%.',
      displayValue: `${factSignals} fact signal(s) found (${pCount} %, ${numCount} metrics, ${extCount} sources)`,
    };

    return results;
  }

  // --- Aggregator ---

  static aggregateReport(url, audits) {
    const categoriesConfig = {
      'seo-fundamentals': {
        id: 'seo-fundamentals',
        title: 'Core SEO & Indexability',
        description: 'Audits title tags, meta descriptions, canonical URLs, mobile viewport, image alt attributes, and link crawlability.',
        weight: 20,
        auditRefs: [
          { id: 'seo-title', weight: 8, result: audits['seo-title'] },
          { id: 'seo-meta-description', weight: 7, result: audits['seo-meta-description'] },
          { id: 'seo-canonical', weight: 6, result: audits['seo-canonical'] },
          { id: 'seo-indexability', weight: 8, result: audits['seo-indexability'] },
          { id: 'seo-image-alt', weight: 5, result: audits['seo-image-alt'] },
          { id: 'seo-crawlable-links', weight: 5, result: audits['seo-crawlable-links'] },
          { id: 'seo-open-graph', weight: 4, result: audits['seo-open-graph'] },
          { id: 'seo-viewport-mobile', weight: 4, result: audits['seo-viewport-mobile'] },
          { id: 'seo-https', weight: 5, result: audits['seo-https'] },
        ],
      },
      'ai-accessibility': {
        id: 'ai-accessibility',
        title: 'AI Accessibility & Crawling',
        description: 'Verifies crawling permissions for AI agents (GPTBot, Perplexity, Claude, Google-Extended).',
        weight: 20,
        auditRefs: [
          { id: 'ai-robots-txt', weight: 9, result: audits['ai-robots-txt'] },
          { id: 'ai-x-robots-tag', weight: 7, result: audits['ai-x-robots-tag'] },
          { id: 'ai-bot-sitemap', weight: 3, result: audits['ai-bot-sitemap'] },
          { id: 'ai-llms-txt', weight: 6, result: audits['ai-llms-txt'] },
        ],
      },
      'structured-data': {
        id: 'structured-data',
        title: 'Structured Data & RAG Schemas',
        description: 'Audits JSON-LD schemas optimized for RAG (FAQPage, HowTo, Article, sameAs, Author E-E-A-T).',
        weight: 20,
        auditRefs: [
          { id: 'jsonld-syntax-validity', weight: 7, result: audits['jsonld-syntax-validity'] },
          { id: 'rag-schema-presence', weight: 8, result: audits['rag-schema-presence'] },
          { id: 'entity-sameas-links', weight: 4, result: audits['entity-sameas-links'] },
          { id: 'author-eeat-presence', weight: 6, result: audits['author-eeat-presence'] },
        ],
      },
      'content-chunking': {
        id: 'content-chunking',
        title: 'Content Chunking & Semantic Structure',
        description: 'Evaluates H1-H3 hierarchy, semantic HTML5 tags, token density, and structured tables/lists.',
        weight: 20,
        auditRefs: [
          { id: 'heading-hierarchy', weight: 7, result: audits['heading-hierarchy'] },
          { id: 'semantic-containers', weight: 6, result: audits['semantic-containers'] },
          { id: 'chunk-token-density', weight: 6, result: audits['chunk-token-density'] },
          { id: 'table-list-scannability', weight: 6, result: audits['table-list-scannability'] },
        ],
      },
      'direct-answer-density': {
        id: 'direct-answer-density',
        title: 'Direct Answer Density & Fact Grounding',
        description: 'Detects concise, direct answers, clear definitions, and verifiable facts/citations.',
        weight: 20,
        auditRefs: [
          { id: 'direct-definition-answering', weight: 8, result: audits['direct-definition-answering'] },
          { id: 'concise-answer-wordcount', weight: 6, result: audits['concise-answer-wordcount'] },
          { id: 'question-heading-alignment', weight: 5, result: audits['question-heading-alignment'] },
          { id: 'fact-citation-density', weight: 6, result: audits['fact-citation-density'] },
        ],
      },
    };

    const categories = {};
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
      aeoVersion: '0.2.0',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Chrome Extension',
      overallScore,
      categories,
      audits,
    };
  }
}

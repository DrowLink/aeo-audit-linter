import { describe, it, expect } from 'vitest';
import { evaluateQualityGates } from '../runner/assertions.js';
import type { AeoReportResult } from '../types/config.js';

describe('CI/CD Quality Gates Evaluator', () => {
  const mockReport: AeoReportResult = {
    url: 'https://example.com',
    fetchTime: '2026-08-25T00:00:00Z',
    aeoVersion: '0.1.4',
    userAgent: 'test',
    overallScore: 85,
    categories: {
      'ai-accessibility': {
        id: 'ai-accessibility',
        title: 'AI Accessibility & Crawling',
        description: '',
        score: 1.0,
        auditRefs: [],
      },
      'structured-data': {
        id: 'structured-data',
        title: 'Structured Data & RAG Schemas',
        description: '',
        score: 0.75,
        auditRefs: [],
      },
      'content-chunking': {
        id: 'content-chunking',
        title: 'Content Chunking & Semantic Structure',
        description: '',
        score: 0.90,
        auditRefs: [],
      },
      'direct-answer-density': {
        id: 'direct-answer-density',
        title: 'Direct Answer Density & Fact Grounding',
        description: '',
        score: 0.70,
        auditRefs: [],
      },
    },
    audits: {},
  };

  it('passes when overall score is above failUnder threshold', () => {
    const result = evaluateQualityGates(mockReport, { failUnder: 80 });
    expect(result.passed).toBe(true);
    expect(result.failures.length).toBe(0);
  });

  it('fails when overall score is below failUnder threshold', () => {
    const result = evaluateQualityGates(mockReport, { failUnder: 90 });
    expect(result.passed).toBe(false);
    expect(result.failures.length).toBe(1);
    expect(result.failures[0]?.target).toBe('overall');
    expect(result.failures[0]?.actual).toBe(85);
    expect(result.failures[0]?.expected).toBe(90);
  });

  it('evaluates category assertions successfully when all thresholds are met', () => {
    const result = evaluateQualityGates(mockReport, {
      categoryAssertions: {
        'ai-accessibility': 95,
        'content-chunking': 80,
      },
    });
    expect(result.passed).toBe(true);
    expect(result.failures.length).toBe(0);
  });

  it('detects category failures and formats expected vs actual scores', () => {
    const result = evaluateQualityGates(mockReport, {
      categoryAssertions: {
        'structured-data': 90, // actual is 75
        'direct-answer-density': 80, // actual is 70
      },
    });
    expect(result.passed).toBe(false);
    expect(result.failures.length).toBe(2);
    expect(result.failures[0]?.name).toBe('Structured Data & RAG Schemas');
    expect(result.failures[0]?.actual).toBe(75);
    expect(result.failures[0]?.expected).toBe(90);
  });

  it('flags missing/unknown categories as assertion failures', () => {
    const result = evaluateQualityGates(mockReport, {
      categoryAssertions: {
        'unknown-category': 50,
      },
    });
    expect(result.passed).toBe(false);
    expect(result.failures[0]?.name).toBe('unknown-category');
    expect(result.failures[0]?.actual).toBe(0);
  });
});

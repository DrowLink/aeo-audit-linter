/**
 * @fileoverview Audit validating that image elements have informative or appropriate alt attributes.
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class SeoImageAltAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'seo-image-alt',
    title: 'Image elements have descriptive alt attributes',
    failureTitle: 'Some images are missing alt attributes',
    description:
      'Informative alternative text helps search engines, multimodal AI models, and assistive technologies understand visual assets.',
    requiredArtifacts: ['Images'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const images = artifacts.Images;

    if (images.totalImages === 0) {
      return this.generateAuditResult({
        score: 1,
        scoreDisplayMode: 'informative',
        displayValue: 'No images found on page',
      });
    }

    const missingAlt = images.missingAltCount;
    const total = images.totalImages;
    const passedRatio = (total - missingAlt) / total;
    const score = Number(passedRatio.toFixed(2));

    const missingItems = images.images
      .filter((img) => !img.hasAlt && !img.isDecorative)
      .slice(0, 10);

    return this.generateAuditResult({
      score,
      displayValue:
        missingAlt === 0
          ? `All ${total} image${total > 1 ? 's have' : ' has'} alt text`
          : `${missingAlt} of ${total} image${total > 1 ? 's' : ''} missing alt text`,
      explanation:
        missingAlt > 0
          ? 'Images missing alt attributes cannot be parsed by screen readers or multimodal search indexing.'
          : undefined,
      details:
        missingItems.length > 0
          ? this.makeTableDetails(
              [
                { key: 'src', label: 'Image Source (src)', valueType: 'url' },
                { key: 'status', label: 'Alt Status', valueType: 'text' },
              ],
              missingItems.map((img) => ({
                src: img.src || '(inline/no src)',
                status: 'Missing alt attribute',
              }))
            )
          : undefined,
    });
  }
}

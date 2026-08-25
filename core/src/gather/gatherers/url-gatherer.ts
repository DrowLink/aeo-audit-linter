/**
 * @fileoverview URLGatherer para resolver y parsear URLs de origen y destino.
 */

import { Gatherer } from '../gatherer.js';
import type { URLArtifact, GathererContext } from '../../types/index.js';

export class URLGatherer extends Gatherer<'URL'> {
  public override readonly name = 'URL' as const;

  public override async getArtifact(context: GathererContext): Promise<URLArtifact> {
    const finalUrl = await context.driver.getUrl();
    const parsed = new URL(finalUrl);

    return {
      requestedUrl: context.url,
      finalUrl,
      domain: parsed.hostname,
      pathname: parsed.pathname,
      protocol: parsed.protocol,
    };
  }
}

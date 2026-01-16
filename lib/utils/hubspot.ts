/**
 * HubSpot API Client
 *
 * Handles fetching content from HubSpot (landing pages, case studies, etc.)
 * API Docs: https://developers.hubspot.com/docs/api/cms/pages
 */

import { ContentType } from '@/types/database';

// HubSpot API response types
interface HubSpotLandingPage {
  id: string;
  name: string;
  slug: string;
  url: string;
  created: string;
  updated: string;
  publishDate?: string;
  metaDescription?: string;
  htmlTitle?: string;
  pageExpiryEnabled?: boolean;
  contentGroupId?: string;
  [key: string]: any;
}

interface HubSpotPagesResponse {
  results: HubSpotLandingPage[];
  paging?: {
    next?: {
      after: string;
    };
  };
}

export interface HubSpotContent {
  id: string;
  slug: string;
  title: string;
  url: string;
  excerpt?: string;
  publishedDate?: Date;
  updatedDate?: Date;
  contentType: ContentType;
  metadata: Record<string, any>;
}

// TODO: Configure these based on your HubSpot setup
// The user mentioned only certain types of landing pages should be pulled
// Add specific criteria here once determined
export interface LandingPageFilterConfig {
  // Examples of potential filters:
  contentGroupIds?: string[]; // Specific content groups/folders
  namePatterns?: string[]; // Landing pages with names matching patterns
  urlPatterns?: string[]; // Landing pages with URLs matching patterns
  tags?: string[]; // Landing pages with specific tags
  excludePatterns?: string[]; // Patterns to exclude
}

class HubSpotClient {
  private apiKey: string;
  private baseUrl = 'https://api.hubapi.com';

  constructor() {
    const apiKey = process.env.HUBSPOT_API_KEY;

    if (!apiKey) {
      throw new Error('HUBSPOT_API_KEY must be set in environment variables');
    }

    this.apiKey = apiKey;
  }

  /**
   * Fetch landing pages from HubSpot
   */
  private async fetchLandingPages(
    limit: number = 100,
    after?: string
  ): Promise<HubSpotPagesResponse> {
    let url = `${this.baseUrl}/cms/v3/pages/landing-pages?limit=${limit}`;
    if (after) {
      url += `&after=${after}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HubSpot API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Fetch all landing pages (handles pagination)
   */
  private async fetchAllLandingPages(): Promise<HubSpotLandingPage[]> {
    let allPages: HubSpotLandingPage[] = [];
    let after: string | undefined;

    while (true) {
      const response = await this.fetchLandingPages(100, after);
      allPages = allPages.concat(response.results);

      // Check if there are more pages
      if (!response.paging?.next?.after) {
        break;
      }

      after = response.paging.next.after;
    }

    return allPages;
  }

  /**
   * Filter landing pages based on criteria
   *
   * Filters for:
   * - Pages with PC/LP, TM/LP, or WBR/LP in name
   * - ONLY EMBED pages that end with "Case Study" (not other EMBED pages like transcripts)
   */
  private filterLandingPages(
    pages: HubSpotLandingPage[],
    filter?: LandingPageFilterConfig
  ): HubSpotLandingPage[] {
    if (!filter) {
      return pages;
    }

    return pages.filter(page => {
      const nameLower = page.name.toLowerCase();

      // Filter by content group IDs (folders in HubSpot)
      if (filter.contentGroupIds && filter.contentGroupIds.length > 0) {
        if (!page.contentGroupId || !filter.contentGroupIds.includes(page.contentGroupId)) {
          return false;
        }
      }

      // Special handling for EMBED pages - ONLY case studies
      if (nameLower.includes('embed -')) {
        // Only include if it ends with "case study"
        return nameLower.endsWith('case study');
      }

      // Filter by name patterns (PC/LP, TM/LP, WBR/LP)
      if (filter.namePatterns && filter.namePatterns.length > 0) {
        const matchesName = filter.namePatterns.some(pattern =>
          nameLower.includes(pattern.toLowerCase())
        );
        if (!matchesName) {
          return false;
        }
      }

      // Filter by URL patterns
      if (filter.urlPatterns && filter.urlPatterns.length > 0) {
        const matchesUrl = filter.urlPatterns.some(pattern =>
          page.url.toLowerCase().includes(pattern.toLowerCase())
        );
        if (!matchesUrl) {
          return false;
        }
      }

      // Exclude patterns
      if (filter.excludePatterns && filter.excludePatterns.length > 0) {
        const matchesExclude = filter.excludePatterns.some(pattern =>
          nameLower.includes(pattern.toLowerCase()) ||
          page.url.toLowerCase().includes(pattern.toLowerCase())
        );
        if (matchesExclude) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Determine content type from landing page metadata
   */
  private determineContentType(page: HubSpotLandingPage): ContentType {
    const name = page.name.toLowerCase();
    const url = page.url.toLowerCase();

    // Case studies (PDF viewer pages)
    if (name.includes('case study') || name.includes('case-study') ||
        url.includes('case-study') || url.includes('case_study')) {
      return 'case_study';
    }

    // Webinars
    if (name.includes('webinar') || url.includes('webinar')) {
      return 'webinar';
    }

    // Whitepapers
    if (name.includes('whitepaper') || name.includes('white paper') ||
        url.includes('whitepaper') || url.includes('white-paper')) {
      return 'whitepaper';
    }

    // Default to landing page
    return 'landing_page';
  }

  /**
   * Extract PDF URL from case study landing page HTML
   *
   * Case study pages use a PDF viewer with JavaScript that loads the PDF:
   * PDFViewerApplication.open("https://www2.centercode.com/hubfs/files/...")
   */
  private async extractPdfUrl(pageUrl: string): Promise<string | null> {
    try {
      const response = await fetch(pageUrl);
      if (!response.ok) {
        console.error(`Failed to fetch page ${pageUrl}: ${response.status}`);
        return null;
      }

      const html = await response.text();

      // Look for PDFViewerApplication.open("URL")
      const pdfUrlMatch = html.match(/PDFViewerApplication\.open\(["']([^"']+)["']\)/);

      if (pdfUrlMatch && pdfUrlMatch[1]) {
        return pdfUrlMatch[1];
      }

      return null;
    } catch (error) {
      console.error(`Error extracting PDF URL from ${pageUrl}:`, error);
      return null;
    }
  }

  /**
   * Transform HubSpot landing page to our content format
   */
  private async transformLandingPage(page: HubSpotLandingPage): Promise<HubSpotContent> {
    const contentType = this.determineContentType(page);
    const metadata: Record<string, any> = {
      hubspotId: page.id,
      htmlTitle: page.htmlTitle,
      contentGroupId: page.contentGroupId,
      pageExpiryEnabled: page.pageExpiryEnabled,
      rawData: page,
    };

    // For case studies, extract the PDF URL
    if (contentType === 'case_study' && page.url) {
      const pdfUrl = await this.extractPdfUrl(page.url);
      if (pdfUrl) {
        metadata.pdfUrl = pdfUrl;
        console.log(`   ✓ Extracted PDF URL for case study: ${page.name}`);
      } else {
        console.log(`   ⚠ Could not extract PDF URL for case study: ${page.name}`);
      }
    }

    return {
      id: page.id,
      slug: page.slug,
      title: page.name,
      url: page.url,
      excerpt: page.metaDescription,
      publishedDate: page.publishDate ? new Date(page.publishDate) : new Date(page.created),
      updatedDate: new Date(page.updated),
      contentType,
      metadata,
    };
  }

  /**
   * Fetch premium content landing pages
   *
   * @param filter - Optional filter configuration for specific landing page types
   */
  async fetchPremiumContent(filter?: LandingPageFilterConfig): Promise<HubSpotContent[]> {
    console.log('Fetching landing pages from HubSpot...');
    const allPages = await this.fetchAllLandingPages();
    console.log(`Found ${allPages.length} total landing pages`);

    const filteredPages = this.filterLandingPages(allPages, filter);
    console.log(`After filtering: ${filteredPages.length} landing pages`);

    // Transform pages (async for case study PDF extraction)
    console.log('Transforming landing pages...');
    const transformedPages = await Promise.all(
      filteredPages.map(page => this.transformLandingPage(page))
    );

    return transformedPages;
  }

  /**
   * Fetch all content from HubSpot
   *
   * Filters for:
   * - Landing pages with PC/LP, TM/LP, or WBR/LP in name
   * - Case study PDF viewer pages: EMBED - [**] Case Study (NOT other EMBED pages)
   */
  async fetchAllContent(): Promise<HubSpotContent[]> {
    const filter: LandingPageFilterConfig = {
      namePatterns: [
        'PC/LP',      // Premium Content Landing Pages
        'TM/LP',      // Template Landing Pages
        'WBR/LP',     // Webinar Landing Pages
      ],
      // Note: EMBED pages are handled specially in filterLandingPages()
      // Only EMBED pages ending with "Case Study" are included
    };

    return this.fetchPremiumContent(filter);
  }
}

// Export singleton instance (lazy-initialized)
let _hubspotClient: HubSpotClient | null = null;

export const hubspotClient = {
  get instance(): HubSpotClient {
    if (!_hubspotClient) {
      _hubspotClient = new HubSpotClient();
    }
    return _hubspotClient;
  },

  // Proxy methods for convenience
  fetchPremiumContent: async (filter?: LandingPageFilterConfig) => {
    return hubspotClient.instance.fetchPremiumContent(filter);
  },
  fetchAllContent: async () => {
    return hubspotClient.instance.fetchAllContent();
  },
};

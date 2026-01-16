/**
 * Webflow CMS API Client
 *
 * Handles fetching content from Webflow CMS collections.
 * API Docs: https://developers.webflow.com/reference/list-items
 */

import { ContentType } from '@/types/database';

// Webflow V2 API response types
interface WebflowItem {
  id: string;
  cmsLocaleId: string | null;
  lastPublished: string;
  lastUpdated: string;
  createdOn: string;
  isArchived: boolean;
  isDraft: boolean;
  fieldData: {
    slug?: string;
    name?: string;
    'post-body'?: string;
    'post-summary'?: string;
    'main-image'?: {
      url: string;
      alt?: string | null;
    };
    'original-date-published'?: string;
    [key: string]: any; // Allow other custom fields
  };
}

interface WebflowResponse {
  items: WebflowItem[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface WebflowContent {
  id: string;
  slug: string;
  title: string;
  url: string;
  excerpt?: string;
  content?: string;
  imageUrl?: string;
  publishedDate?: Date;
  updatedDate?: Date;
  contentType: ContentType;
  metadata: Record<string, any>;
}

class WebflowClient {
  private apiKey: string;
  private siteId: string;
  private baseUrl = 'https://api.webflow.com';

  constructor() {
    const apiKey = process.env.WEBFLOW_API_KEY;
    const siteId = process.env.WEBFLOW_SITE_ID;

    if (!apiKey || !siteId) {
      throw new Error('WEBFLOW_API_KEY and WEBFLOW_SITE_ID must be set in environment variables');
    }

    this.apiKey = apiKey;
    this.siteId = siteId;
  }

  /**
   * Fetch items from a Webflow collection (V2 API)
   */
  private async fetchCollection(
    collectionId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<WebflowResponse> {
    const url = `${this.baseUrl}/v2/collections/${collectionId}/items?limit=${limit}&offset=${offset}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Webflow API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Fetch all items from a collection (handles pagination)
   *
   * SAFEGUARD: Only returns published/live items (not drafts, not archived, must have publish date)
   */
  private async fetchAllItems(collectionId: string): Promise<WebflowItem[]> {
    let allItems: WebflowItem[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.fetchCollection(collectionId, limit, offset);

      // SAFEGUARD: Only include items that are:
      // 1. Not drafts
      // 2. Not archived
      // 3. Have been published (have a lastPublished date)
      const publishedItems = response.items.filter(
        item => !item.isDraft && !item.isArchived && item.lastPublished
      );

      allItems = allItems.concat(publishedItems);

      // Check if we've fetched all items
      if (offset + limit >= response.pagination.total) {
        break;
      }

      offset += limit;
    }

    return allItems;
  }

  /**
   * Transform Webflow item to our content format (V2 API)
   */
  private transformItem(item: WebflowItem, contentType: ContentType): WebflowContent {
    // Build full URL
    const baseUrl = 'https://www.centercode.com'; // TODO: Make this configurable
    const slug = item.fieldData.slug || '';
    const url = `${baseUrl}/blog/${slug}`;

    return {
      id: item.id,
      slug,
      title: item.fieldData.name || '',
      url,
      excerpt: item.fieldData['post-summary'],
      content: item.fieldData['post-body'],
      imageUrl: item.fieldData['main-image']?.url,
      publishedDate: item.fieldData['original-date-published']
        ? new Date(item.fieldData['original-date-published'])
        : new Date(item.lastPublished),
      updatedDate: new Date(item.lastUpdated),
      contentType,
      metadata: {
        webflowId: item.id,
        createdOn: item.createdOn,
        lastPublished: item.lastPublished,
        rawData: item, // Store full response for reference
      },
    };
  }

  /**
   * Fetch blog posts from Webflow
   */
  async fetchBlogPosts(): Promise<WebflowContent[]> {
    const collectionId = process.env.WEBFLOW_BLOG_COLLECTION_ID;

    if (!collectionId) {
      throw new Error('WEBFLOW_BLOG_COLLECTION_ID must be set in environment variables');
    }

    console.log(`Fetching blog posts from Webflow collection ${collectionId}...`);
    const items = await this.fetchAllItems(collectionId);
    console.log(`Found ${items.length} published blog posts`);

    return items.map(item => this.transformItem(item, 'blog_post'));
  }

  /**
   * Fetch resources/premium content from Webflow (if separate collection exists)
   */
  async fetchResources(): Promise<WebflowContent[]> {
    const collectionId = process.env.WEBFLOW_RESOURCES_COLLECTION_ID;

    if (!collectionId) {
      console.log('WEBFLOW_RESOURCES_COLLECTION_ID not set, skipping resources');
      return [];
    }

    console.log(`Fetching resources from Webflow collection ${collectionId}...`);
    const items = await this.fetchAllItems(collectionId);
    console.log(`Found ${items.length} published resources`);

    // Determine content type based on item properties
    return items.map(item => {
      // Try to infer content type from item metadata
      const contentType: ContentType = 'other'; // Default, could be more intelligent
      return this.transformItem(item, contentType);
    });
  }

  /**
   * Fetch all content from Webflow
   */
  async fetchAllContent(): Promise<WebflowContent[]> {
    const [blogPosts, resources] = await Promise.all([
      this.fetchBlogPosts(),
      this.fetchResources(),
    ]);

    return [...blogPosts, ...resources];
  }
}

// Export singleton instance (lazy-initialized)
let _webflowClient: WebflowClient | null = null;

export const webflowClient = {
  get instance(): WebflowClient {
    if (!_webflowClient) {
      _webflowClient = new WebflowClient();
    }
    return _webflowClient;
  },

  // Proxy methods for convenience
  fetchBlogPosts: async () => {
    return webflowClient.instance.fetchBlogPosts();
  },
  fetchResources: async () => {
    return webflowClient.instance.fetchResources();
  },
  fetchAllContent: async () => {
    return webflowClient.instance.fetchAllContent();
  },
};

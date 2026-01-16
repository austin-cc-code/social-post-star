#!/usr/bin/env node
/**
 * Webflow API Diagnostic Tool
 * Tests different API versions and endpoints to diagnose connection issues
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const WEBFLOW_API_KEY = process.env.WEBFLOW_API_KEY;
const WEBFLOW_SITE_ID = process.env.WEBFLOW_SITE_ID;
const WEBFLOW_COLLECTION_ID = process.env.WEBFLOW_BLOG_COLLECTION_ID;

async function testWebflowAPI() {
  console.log('🔍 Webflow API Diagnostics\n');
  console.log('Configuration:');
  console.log(`  API Key: ${WEBFLOW_API_KEY ? '✓ Set' : '✗ Missing'}`);
  console.log(`  Site ID: ${WEBFLOW_SITE_ID || '✗ Missing'}`);
  console.log(`  Collection ID: ${WEBFLOW_COLLECTION_ID || '✗ Missing'}`);
  console.log('\n');

  if (!WEBFLOW_API_KEY || !WEBFLOW_SITE_ID || !WEBFLOW_COLLECTION_ID) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  // Test 1: V1 API - Get site info
  console.log('Test 1: V1 API - Get Site Info');
  console.log('═'.repeat(60));
  try {
    const url = `https://api.webflow.com/sites/${WEBFLOW_SITE_ID}`;
    console.log(`GET ${url}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
        'accept-version': '1.0.0',
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✓ Success:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('✗ Error:', error);
    }
  } catch (error) {
    console.error('✗ Exception:', error);
  }
  console.log('\n');

  // Test 2: V1 API - List collections
  console.log('Test 2: V1 API - List Collections');
  console.log('═'.repeat(60));
  try {
    const url = `https://api.webflow.com/sites/${WEBFLOW_SITE_ID}/collections`;
    console.log(`GET ${url}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
        'accept-version': '1.0.0',
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Found ${data.length} collections`);
      data.forEach((col: any) => {
        console.log(`  - ${col.name} (${col._id})`);
      });
    } else {
      const error = await response.text();
      console.log('✗ Error:', error);
    }
  } catch (error) {
    console.error('✗ Exception:', error);
  }
  console.log('\n');

  // Test 3: V1 API - Get collection items (current implementation)
  console.log('Test 3: V1 API - Get Collection Items');
  console.log('═'.repeat(60));
  try {
    const url = `https://api.webflow.com/collections/${WEBFLOW_COLLECTION_ID}/items?limit=5`;
    console.log(`GET ${url}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
        'accept-version': '1.0.0',
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Found ${data.items?.length || 0} items`);
      if (data.items && data.items.length > 0) {
        console.log('Sample item:', JSON.stringify(data.items[0], null, 2));
      }
    } else {
      const error = await response.text();
      console.log('✗ Error:', error);
    }
  } catch (error) {
    console.error('✗ Exception:', error);
  }
  console.log('\n');

  // Test 4: V2 API - Get site info
  console.log('Test 4: V2 API - Get Site Info');
  console.log('═'.repeat(60));
  try {
    const url = `https://api.webflow.com/v2/sites/${WEBFLOW_SITE_ID}`;
    console.log(`GET ${url}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✓ Success:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('✗ Error:', error);
    }
  } catch (error) {
    console.error('✗ Exception:', error);
  }
  console.log('\n');

  // Test 5: V2 API - List collections
  console.log('Test 5: V2 API - List Collections');
  console.log('═'.repeat(60));
  try {
    const url = `https://api.webflow.com/v2/sites/${WEBFLOW_SITE_ID}/collections`;
    console.log(`GET ${url}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✓ Success');
      console.log('Collections:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('✗ Error:', error);
    }
  } catch (error) {
    console.error('✗ Exception:', error);
  }
  console.log('\n');

  // Test 6: V2 API - Get collection items
  console.log('Test 6: V2 API - Get Collection Items');
  console.log('═'.repeat(60));
  try {
    const url = `https://api.webflow.com/v2/collections/${WEBFLOW_COLLECTION_ID}/items`;
    console.log(`GET ${url}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✓ Success');
      console.log('Data:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('✗ Error:', error);
    }
  } catch (error) {
    console.error('✗ Exception:', error);
  }
  console.log('\n');

  console.log('═'.repeat(60));
  console.log('Diagnostics complete');
}

testWebflowAPI();

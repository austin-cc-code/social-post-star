#!/usr/bin/env node
const path = require('path');
const { neon } = require('@neondatabase/serverless');

require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

let connectionString = process.env.DATABASE_URL.replace('-pooler.', '.');
const sql = neon(connectionString);

async function create() {
  console.log('Creating schema...\n');
  
  try {
    // Create enums one by one
    console.log('1. Creating content_source enum...');
    await sql.unsafe("CREATE TYPE content_source AS ENUM ('webflow', 'hubspot', 'youtube', 'manual')");
    
    console.log('2. Creating content_type enum...');
    await sql.unsafe("CREATE TYPE content_type AS ENUM ('blog_post', 'whitepaper', 'case_study', 'webinar', 'video', 'landing_page', 'labs_app', 'other')");
    
    console.log('3. Creating post_type enum...');
    await sql.unsafe("CREATE TYPE post_type AS ENUM ('content_announcement', 'content_promotion', 'social_proof', 'centercode_feature', 'company_news', 'event_announcement', 'event_promotion', 'sharing_industry_article', 'labs_app_launch', 'labs_app_promotion', 'partnership_announcement', 'holiday_celebration', 'industry_day_celebration', 'other')");
    
    console.log('4. Creating platform enum...');
    await sql.unsafe("CREATE TYPE platform AS ENUM ('linkedin', 'facebook', 'twitter')");
    
    console.log('5. Creating post_status enum...');
    await sql.unsafe("CREATE TYPE post_status AS ENUM ('pending', 'accepted', 'rejected')");
    
    console.log('6. Creating feedback_type enum...');
    await sql.unsafe("CREATE TYPE feedback_type AS ENUM ('accept', 'reject')");
    
    console.log('7. Creating special_day_type enum...');
    await sql.unsafe("CREATE TYPE special_day_type AS ENUM ('holiday', 'industry_day')");
    
    console.log('8. Creating brand_voice_source enum...');
    await sql.unsafe("CREATE TYPE brand_voice_source AS ENUM ('style_guide', 'example_post', 'feedback')");
    
    console.log('\n✓ All enums created!\n');
    
    // Now verify they exist
    const types = await sql`SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e' ORDER BY typname`;
    console.log('🏷️  Enums in database:');
    types.forEach(t => console.log(`   - ${t.typname}`));
    
    console.log('\n✅ Success!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

create().then(() => process.exit(0));

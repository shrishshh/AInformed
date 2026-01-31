# Testing Instagram Integration

This guide explains how to test the Instagram news source integration.

## Quick Test Methods

### Method 1: Test the API Endpoint Directly

1. **Start your development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Test the Instagram fetcher directly** via API:
   ```
   http://localhost:3000/api/ai-news?refresh=true&limit=100
   ```

3. **Check the response**:
   - Look for `_sources.instagram` in the JSON response
   - Should show a count of Instagram posts fetched
   - Articles with `_isInstagram: true` are Instagram posts

### Method 2: Test via Browser Console

1. **Open your website**: `http://localhost:3000`

2. **Open browser DevTools** (F12) → Console tab

3. **Fetch and log Instagram articles**:
   ```javascript
   fetch('/api/ai-news?refresh=true&limit=500')
     .then(r => r.json())
     .then(data => {
       const instagram = data.articles.filter(a => a._isInstagram);
       console.log(`Instagram posts: ${instagram.length}`);
       console.log('Instagram articles:', instagram);
     });
   ```

### Method 3: Check Server Logs

1. **Watch your terminal** where `npm run dev` is running

2. **Look for these log messages**:
   ```
   Updating all caches (RSS + GDELT + HN + Instagram)...
   Instagram cache updated: X posts
   📸 Instagram: X
   ```

3. **If you see errors**, they'll appear like:
   ```
   Error fetching Instagram posts: [error message]
   Instagram fetch failed: [error details]
   ```

### Method 4: Test the Fetcher Function Directly

Create a test file or use Node.js REPL:

```typescript
// test-instagram.ts (or run in Node REPL)
import { fetchInstagramPosts, convertInstagramToNewsFormat } from './src/lib/instagramFetcher';

async function test() {
  console.log('Testing Instagram fetcher...');
  const posts = await fetchInstagramPosts();
  console.log(`Fetched ${posts.length} posts`);
  
  if (posts.length > 0) {
    console.log('First post:', posts[0]);
  }
  
  const formatted = convertInstagramToNewsFormat(posts);
  console.log(`Formatted ${formatted.length} articles`);
  console.log('First formatted article:', formatted[0]);
}

test().catch(console.error);
```

Run it:
```bash
npx tsx test-instagram.ts
# or
node --loader ts-node/esm test-instagram.ts
```

## Expected Results

### ✅ Success Indicators

1. **API Response** should include:
   ```json
   {
     "_sources": {
       "instagram": 5,  // Number of Instagram posts
       ...
     },
     "articles": [
       {
         "title": "Post caption...",
         "description": "Post caption...",
         "url": "https://www.instagram.com/p/...",
         "image": "https://...",
         "source": { "name": "Instagram: Creator Name" },
         "_isInstagram": true,
         "creatorUsername": "username",
         "creatorFullName": "Full Name",
         ...
       }
     ]
   }
   ```

2. **Server Logs** should show:
   ```
   Fetching Instagram posts from: https://sidemindlabs.app.n8n.cloud/webhook/instagram-news
   Instagram: Fetched X posts from Y creators
   Instagram cache updated: X posts
   ```

3. **Website** should display Instagram posts:
   - Mixed with other news articles
   - Source shows as "Instagram: Creator Name"
   - Images/videos should load (if URLs are valid)

### ❌ Common Issues & Fixes

#### Issue 1: No Instagram Posts Appearing

**Symptoms**: `_sources.instagram: 0` or no `_isInstagram` articles

**Possible Causes**:
- n8n webhook is down or returning empty array
- Network/CORS issues
- Cache hasn't refreshed yet

**Fixes**:
1. **Force refresh**: Add `?refresh=true` to API call
2. **Check webhook directly**:
   ```bash
   curl https://sidemindlabs.app.n8n.cloud/webhook/instagram-news
   ```
3. **Check server logs** for error messages
4. **Wait 15 minutes** for cache to refresh automatically

#### Issue 2: Error Fetching from Webhook

**Symptoms**: Server logs show `Error fetching Instagram posts: ...`

**Possible Causes**:
- Webhook URL is incorrect
- n8n workflow is not active
- Rate limiting
- Network timeout

**Fixes**:
1. **Verify webhook URL** in `src/lib/instagramFetcher.ts`
2. **Test webhook manually** with curl/Postman
3. **Check n8n workflow** is active and running
4. **Check network connectivity** from your server

#### Issue 3: Posts Not Displaying on Website

**Symptoms**: API returns posts but website doesn't show them

**Possible Causes**:
- Client-side filtering is excluding them
- Image URLs are broken
- React component not rendering them

**Fixes**:
1. **Check browser console** for errors
2. **Verify articles in API response**: `/api/ai-news?refresh=true`
3. **Check if filters are applied**: Remove any source/product filters
4. **Inspect network tab** for failed image loads

## Testing Checklist

- [ ] API endpoint returns Instagram posts (`_sources.instagram > 0`)
- [ ] Server logs show successful fetch
- [ ] Instagram posts appear on homepage
- [ ] Post images/videos load correctly
- [ ] Source name shows as "Instagram: Creator Name"
- [ ] Clicking post opens Instagram link
- [ ] Cache refreshes every 15 minutes
- [ ] Force refresh (`?refresh=true`) works
- [ ] No errors in browser console
- [ ] No errors in server logs

## Debugging Commands

### Check Cache Status
```javascript
// In browser console
fetch('/api/ai-news?refresh=true')
  .then(r => r.json())
  .then(d => console.log('Sources:', d._sources));
```

### Check Specific Instagram Posts
```javascript
// In browser console
fetch('/api/ai-news?refresh=true&limit=500')
  .then(r => r.json())
  .then(d => {
    const instagram = d.articles.filter(a => a._isInstagram);
    console.table(instagram.map(a => ({
      title: a.title.substring(0, 50),
      creator: a.creatorFullName,
      url: a.url
    })));
  });
```

### Test Webhook Directly
```bash
# Test if webhook is accessible
curl -v https://sidemindlabs.app.n8n.cloud/webhook/instagram-news

# Or with better formatting
curl https://sidemindlabs.app.n8n.cloud/webhook/instagram-news | jq
```

## Production Testing

When deploying to production:

1. **Verify environment variables** (if any)
2. **Check webhook is accessible** from production server
3. **Monitor logs** for first few cache updates
4. **Test with `?refresh=true`** to force immediate fetch
5. **Verify posts appear** on live website

---

**Note**: Instagram posts are cached for 15 minutes. If you don't see new posts immediately, wait for the cache to refresh or use `?refresh=true`.

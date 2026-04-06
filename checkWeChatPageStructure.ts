import { chromium } from 'playwright';

async function main() {
  // Launch browser with headless: false to see what's happening
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to WeChat MP home page
    console.log('Navigating to https://mp.weixin.qq.com...');
    await page.goto('https://mp.weixin.qq.com', {
      waitUntil: 'networkidle',
    });

    console.log('Page loaded. Current URL:', page.url());
    console.log('Page title:', await page.title());

    // Get all links on the page
    const links = await page.$$('a');
    console.log('Number of links on page:', links.length);

    // Collect all links with href or title attributes
    const linkData = [];
    for (let i = 0; i < links.length; i++) {
      const href = await links[i].getAttribute('href');
      const title = await links[i].getAttribute('title');
      const text = await links[i].innerText();

      if (href || title || text) {
        linkData.push({
          index: i,
          href: href || '',
          title: title || '',
          text: text.trim(),
        });
      }
    }

    // Log all collected links
    console.log('\nAll links on page:');
    linkData.forEach((link, index) => {
      console.log(`Link ${index}: href="${link.href}", title="${link.title}", text="${link.text}"`);
    });

    // Log all links that might be related to content management or drafts
    console.log('\nLinks related to content management/drafts:');
    const relatedLinks = linkData.filter(link => {
      const hrefLower = link.href.toLowerCase();
      const titleLower = link.title.toLowerCase();
      const textLower = link.text.toLowerCase();

      return hrefLower.includes('content') ||
             hrefLower.includes('draft') ||
             hrefLower.includes('appmsg') ||
             titleLower.includes('内容') ||
             titleLower.includes('管理') ||
             textLower.includes('内容') ||
             textLower.includes('管理') ||
             textLower.includes('草稿');
    });

    relatedLinks.forEach((link, index) => {
      console.log(`Link ${index}: href="${link.href}", title="${link.title}", text="${link.text}"`);
    });

    // Take a screenshot of the page for debugging
    await page.screenshot({ path: 'wechat_mp_home.png', fullPage: true });
    console.log('\nScreenshot saved as wechat_mp_home.png');

  } catch (error) {
    console.error('Error:', error);
  }

  // Wait a bit for user to see the page
  console.log('\nWaiting for 10 seconds before closing browser...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  await browser.close();
  console.log('Browser closed.');
}

main().catch(console.error);

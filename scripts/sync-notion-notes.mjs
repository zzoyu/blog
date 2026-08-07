import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DB_NOTES = process.env.NOTION_DATABASE_ID_BOOK_NOTES;
const NOTION_DB_BOOKS = process.env.NOTION_DATABASE_ID_BOOKS;
const NOTION_DB_DEV_POSTS = process.env.NOTION_DATABASE_ID_DEV_POSTS;
const BOOKS_YAML_PATH = path.join(projectRoot, 'data', 'books.yml');

if (!NOTION_API_KEY) {
  console.error('❌ NOTION_API_KEY 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const HEADERS = {
  'Authorization': `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json'
};

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function loadBooksYaml() {
  if (!fs.existsSync(BOOKS_YAML_PATH)) return {};
  try {
    return yaml.load(fs.readFileSync(BOOKS_YAML_PATH, 'utf-8')) || {};
  } catch (e) {
    return {};
  }
}

// 💡 기존 마크다운 파일의 lastmod (최종 수정일시) 읽어오기
function getExistingLastMod(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/lastmod:\s*['"]?([^'\n\r"]+)['"]?/);
    return match ? match[1].trim() : null;
  } catch (e) {
    return null;
  }
}

function richTextToMd(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return '';
  return richTextArray.map(item => {
    if (item.type === 'equation') {
      const expr = (item.equation?.expression || item.plain_text || '').trim();
      return `$${expr}$`;
    }

    let text = item.plain_text || '';
    if (!text) return '';

    if (item.href) {
      text = `[${text}](${item.href})`;
    }
    const annotations = item.annotations || {};
    if (annotations.code) text = `\`${text}\``;
    if (annotations.bold) text = `**${text}**`;
    if (annotations.italic) text = `*${text}*`;
    if (annotations.strikethrough) text = `~~${text}~~`;
    return text;
  }).join('');
}

async function getPage(pageId) {
  const url = `https://api.notion.com/v1/pages/${pageId}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return null;
  return await res.json();
}

// 📖 Notion API 페이징 루프(has_more & start_cursor) 적용으로 블록 100% 완전 수집
async function getBlockChildren(blockId) {
  let allBlocks = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    let url = `https://api.notion.com/v1/blocks/${blockId}/children?page_size=100`;
    if (startCursor) url += `&start_cursor=${startCursor}`;

    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) break;
      const data = await res.json();
      const results = data.results || [];
      allBlocks.push(...results);
      hasMore = data.has_more;
      startCursor = data.next_cursor;
    } catch (e) {
      break;
    }
  }
  return allBlocks;
}

// 📖 Notion 블록 ➔ 마크다운 변환 (콜아웃 자식 블록, 수식, 임베드 등 완벽 지원)
async function blocksToMd(blocks, indentLevel = 0) {
  const lines = [];
  const indent = '  '.repeat(indentLevel);

  for (const block of blocks) {
    const type = block.type;
    switch (type) {
      case 'paragraph':
        lines.push(`${indent}${richTextToMd(block.paragraph.rich_text)}`);
        lines.push('');
        break;
      case 'heading_1':
        lines.push(`${indent}# ${richTextToMd(block.heading_1.rich_text)}`);
        lines.push('');
        break;
      case 'heading_2':
        lines.push(`${indent}## ${richTextToMd(block.heading_2.rich_text)}`);
        lines.push('');
        break;
      case 'heading_3':
        lines.push(`${indent}### ${richTextToMd(block.heading_3.rich_text)}`);
        lines.push('');
        break;
      case 'bulleted_list_item':
        lines.push(`${indent}- ${richTextToMd(block.bulleted_list_item.rich_text)}`);
        break;
      case 'numbered_list_item':
        lines.push(`${indent}1. ${richTextToMd(block.numbered_list_item.rich_text)}`);
        break;
      case 'to_do':
        const checked = block.to_do.checked ? 'x' : ' ';
        lines.push(`${indent}- [${checked}] ${richTextToMd(block.to_do.rich_text)}`);
        break;
      case 'quote':
        lines.push(`${indent}> ${richTextToMd(block.quote.rich_text)}`);
        lines.push('');
        break;
      case 'callout':
        const iconEmoji = block.callout.icon?.type === 'emoji' ? block.callout.icon.emoji : '💡';
        lines.push(`${indent}> ${iconEmoji} ${richTextToMd(block.callout.rich_text)}`);
        lines.push('');
        break;
      case 'code':
        const lang = block.code.language || '';
        lines.push(`${indent}\`\`\`${lang}`);
        lines.push(`${indent}${richTextToMd(block.code.rich_text)}`);
        lines.push(`${indent}\`\`\``);
        lines.push('');
        break;
      case 'divider':
        lines.push(`${indent}---`);
        lines.push('');
        break;
      case 'equation':
        const eqExpr = block.equation?.expression || '';
        lines.push(`${indent}$$\n${eqExpr}\n$$`);
        lines.push('');
        break;
      case 'image':
        const imgUrl = block.image.type === 'file' ? block.image.file?.url : block.image.external?.url;
        if (imgUrl) {
          lines.push(`${indent}![image](${imgUrl})`);
          lines.push('');
        }
        break;
      case 'embed':
        const embedUrl = block.embed?.url;
        if (embedUrl) {
          lines.push(`${indent}[${embedUrl}](${embedUrl})`);
          lines.push('');
        }
        break;
      case 'bookmark':
        const bmUrl = block.bookmark?.url;
        if (bmUrl) {
          lines.push(`${indent}[${bmUrl}](${bmUrl})`);
          lines.push('');
        }
        break;
      case 'video':
        const videoUrl = block.video?.type === 'file' ? block.video.file?.url : block.video?.external?.url;
        if (videoUrl) {
          lines.push(`${indent}[video](${videoUrl})`);
          lines.push('');
        }
        break;
      case 'toggle':
        lines.push(`${indent}<details><summary>${richTextToMd(block.toggle.rich_text)}</summary>`);
        lines.push('');
        break;
      default:
        break;
    }

    // 자식 블록이 존재하는 경우 파싱
    if (block.has_children) {
      const childBlocks = await getBlockChildren(block.id);
      if (childBlocks.length > 0) {
        let childMd = await blocksToMd(childBlocks, type === 'callout' || type === 'quote' ? 0 : indentLevel + 1);
        if (type === 'callout' || type === 'quote') {
          childMd = childMd.split('\n').map(line => line.trim() ? `> ${line}` : '>').join('\n');
        }
        lines.push(childMd);
      }
      if (type === 'toggle') {
        lines.push(`${indent}</details>`);
        lines.push('');
      }
    }
  }
  return lines.join('\n');
}

async function fetchNotionDB(dbId, filter) {
  const url = `https://api.notion.com/v1/databases/${dbId}/query`;
  const options = {
    method: 'POST',
    headers: HEADERS
  };
  if (filter) {
    options.body = JSON.stringify({ filter });
  }
  const res = await fetch(url, options);
  if (!res.ok) {
    const fallbackRes = await fetch(url, { method: 'POST', headers: HEADERS });
    if (!fallbackRes.ok) return [];
    const fbData = await fallbackRes.json();
    return fbData.results || [];
  }
  const data = await res.json();
  return data.results || [];
}

async function syncBooksToNotion(localBooks) {
  if (!NOTION_DB_BOOKS) {
    console.log('💡 NOTION_DATABASE_ID_BOOKS 환경변수가 설정되지 않아 도서 일괄 동기화를 건너뜁니다.\n');
    return;
  }

  console.log('📖 Notion 도서 데이터베이스 일괄 동기화 중...');

  const notionBooks = await fetchNotionDB(NOTION_DB_BOOKS);
  const existingIsbns = new Set();
  const existingTitles = new Set();

  notionBooks.forEach(page => {
    const props = page.properties;
    if (props.isbn && props.isbn.number) {
      existingIsbns.add(String(props.isbn.number));
    }
    if (props.title && props.title.title && props.title.title.length > 0) {
      existingTitles.add(props.title.title.map(t => t.plain_text).join('').trim());
    }
  });

  let createdCount = 0;
  for (const [bookId, bookData] of Object.entries(localBooks)) {
    const title = bookData.title;
    const isbn = String(bookData.isbn || '');
    const author = bookData.author || '';
    const category = bookData.category || 'math';
    const totalPage = parseInt(bookData.total_page || '0', 10);
    const currentPage = parseInt(bookData.current_page || '0', 10);
    const status = bookData.status || 'waiting';
    const startedAt = bookData.started_at || null;

    if ((isbn && existingIsbns.has(isbn)) || (title && existingTitles.has(title))) {
      continue;
    }

    console.log(`  [신규 등록] '${title}' (ISBN: ${isbn})...`);

    const coverTemplate = process.env.BOOK_API_URL_KB || 'https://contents.kyobobook.co.kr/sih/fit-in/300x0/pdt/{isbn}.jpg';
    const coverUrl = coverTemplate.includes('{isbn}') ? coverTemplate.replace('{isbn}', isbn) : `${coverTemplate}${isbn}`;

    const payload = {
      parent: { database_id: NOTION_DB_BOOKS },
      cover: {
        type: 'external',
        external: { url: coverUrl }
      },
      properties: {
        title: {
          title: [{ text: { content: title } }]
        },
        author: {
          rich_text: [{ text: { content: author } }]
        },
        isbn: {
          number: parseInt(isbn, 10) || null
        },
        category: {
          select: { name: category }
        },
        total_page: {
          number: totalPage
        },
        current_page: {
          number: currentPage
        },
        status: {
          status: { name: status }
        }
      }
    };

    if (startedAt) {
      payload.properties.started_at = {
        date: { start: startedAt }
      };
    }

    try {
      const res = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        console.log(`    └─ ✅ Notion 도서 DB 표지 커버 포함 일괄 추가 완료!`);
        createdCount++;
      } else {
        console.log(`    └─ ⚠️ Notion 추가 실패 (${res.status})`);
      }
    } catch (e) {
      console.log(`    └─ ⚠️ Notion API 오류: ${e.message}`);
    }
  }

  console.log(`✨ 총 ${createdCount}권의 도서가 Notion DB에 일괄 동기화되었습니다!\n`);
}

async function syncDevPostsFromNotion() {
  if (!NOTION_DB_DEV_POSTS) return;

  console.log('💻 Notion 개발 포스트 데이터베이스 (development) 동기화 중...');

  const filter = {
    property: '공개',
    checkbox: { equals: true }
  };

  const pages = await fetchNotionDB(NOTION_DB_DEV_POSTS, filter);

  if (!pages.length) {
    console.log('  └─ 💡 "공개: true" 상태인 개발 포스트가 없습니다.\n');
    return;
  }

  let count = 0;
  let skippedCount = 0;

  for (const page of pages) {
    const props = page.properties;
    const lastEditedTime = page.last_edited_time;

    let title = '';
    if (props.Issue && props.Issue.title && props.Issue.title.length > 0) {
      title = props.Issue.title.map(t => t.plain_text).join('');
    } else if (props.title && props.title.title && props.title.title.length > 0) {
      title = props.title.title.map(t => t.plain_text).join('');
    } else if (props.Name && props.Name.title && props.Name.title.length > 0) {
      title = props.Name.title.map(t => t.plain_text).join('');
    }
    if (!title) continue;

    let dateStr = new Date().toISOString().slice(0, 10);
    if (props['작성일시'] && (props['작성일시'].date || props['작성일시'].created_time)) {
      dateStr = (props['작성일시'].date?.start || props['작성일시'].created_time).slice(0, 10);
    } else if (props.date && (props.date.date || props.date.created_time)) {
      dateStr = (props.date.date?.start || props.date.created_time).slice(0, 10);
    }

    let slug = '';
    if (props.slug && props.slug.rich_text && props.slug.rich_text.length > 0) {
      slug = props.slug.rich_text.map(t => t.plain_text).join('').trim();
    }
    if (!slug) slug = slugify(title) || `dev-${page.id.replace(/-/g, '').slice(0, 8)}`;

    const targetDir = path.join(projectRoot, 'content', 'posts', 'development');
    fs.mkdirSync(targetDir, { recursive: true });
    const targetFile = path.join(targetDir, `${slug}.md`);

    // 💡 최종 수정시간(last_edited_time) 비교 스킵 검사
    const existingLastMod = getExistingLastMod(targetFile);
    if (existingLastMod && existingLastMod === lastEditedTime) {
      console.log(`  [스킵 ⏩] '${title}' (최종 수정일시 변경 없음: ${lastEditedTime})`);
      skippedCount++;
      continue;
    }

    const tagsList = [];
    if (props['태그'] && props['태그'].multi_select && Array.isArray(props['태그'].multi_select)) {
      props['태그'].multi_select.forEach(t => {
        if (t.name) tagsList.push(t.name);
      });
    } else if (props.tags && props.tags.multi_select && Array.isArray(props.tags.multi_select)) {
      props.tags.multi_select.forEach(t => {
        if (t.name) tagsList.push(t.name);
      });
    }

    const isMemo = props['long form']?.checkbox !== true;

    console.log(`  [동기화 🔄] '${title}' (slug: ${slug}, memo: ${isMemo}, lastmod: ${lastEditedTime})...`);

    const blocks = await getBlockChildren(page.id);
    const bodyMd = await blocksToMd(blocks);

    const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: ${dateStr}
lastmod: ${lastEditedTime}
categories: ["development"]
${isMemo ? 'memo: true' : ''}
${tagsList.length > 0 ? `tags: ${JSON.stringify(tagsList)}` : ''}
---

${bodyMd}
`;

    fs.writeFileSync(targetFile, frontmatter, 'utf-8');
    console.log(`    └─ ✅ 생성 완료: content/posts/development/${slug}.md`);
    count++;
  }

  console.log(`✨ 개발 포스트 갱신 ${count}개, 스킵 ${skippedCount}개 완료!\n`);
}

async function main() {
  console.log('🚀 Notion 독서노트 & 도서 & 개발 포스트 동기화 시작...\n');

  const localBooks = loadBooksYaml();

  // 1. 도서 일괄 동기화 (data/books.yml ➔ Notion 도서 DB)
  await syncBooksToNotion(localBooks);

  // 2. 개발 포스트 DB 동기화 ("공개: true" ➔ content/posts/development/)
  await syncDevPostsFromNotion();

  const bookCache = new Map();

  // 3. Notion 독서노트 DB 동기화
  if (NOTION_DB_NOTES) {
    console.log('📚 Notion 독서노트 데이터베이스 동기화 중...');

    const pages = await fetchNotionDB(NOTION_DB_NOTES);
    const filteredPages = pages.filter(p => !p.properties.draft || p.properties.draft.checkbox === false);

    if (!filteredPages.length) {
      console.log('  └─ 💡 발행(draft: false) 상태인 독서노트가 없습니다.\n');
    } else {
      let count = 0;
      let skippedCount = 0;

      for (const page of filteredPages) {
        const props = page.properties;
        const lastEditedTime = page.last_edited_time;

        let title = '';
        if (props.title && props.title.title && props.title.title.length > 0) {
          title = props.title.title.map(t => t.plain_text).join('');
        } else if (props.Name && props.Name.title && props.Name.title.length > 0) {
          title = props.Name.title.map(t => t.plain_text).join('');
        }
        if (!title) continue;

        let dateStr = new Date().toISOString().slice(0, 10);
        if (props.date && props.date.created_time) {
          dateStr = props.date.created_time.slice(0, 10);
        }

        let slug = '';
        if (props.slug && props.slug.rich_text && props.slug.rich_text.length > 0) {
          slug = props.slug.rich_text.map(t => t.plain_text).join('').trim();
        }
        if (!slug) slug = slugify(title) || `note-${page.id.replace(/-/g, '').slice(0, 8)}`;

        let matchedBookId = '';
        let bookCategory = '';

        if (props.book && props.book.relation && props.book.relation.length > 0) {
          const relationPageId = props.book.relation[0].id;

          if (bookCache.has(relationPageId)) {
            matchedBookId = bookCache.get(relationPageId);
            if (matchedBookId && localBooks[matchedBookId] && localBooks[matchedBookId].category) {
              bookCategory = localBooks[matchedBookId].category.toLowerCase();
            }
          } else {
            const relPage = await getPage(relationPageId);
            if (relPage && relPage.properties) {
              const relProps = relPage.properties;
              let relIsbn = relProps.isbn ? String(relProps.isbn.number || '') : '';
              let relTitle = relProps.title && relProps.title.title && relProps.title.title.length > 0 ? relProps.title.title.map(t => t.plain_text).join('') : '';

              for (const [k, v] of Object.entries(localBooks)) {
                if ((relIsbn && String(v.isbn) === relIsbn) || (relTitle && v.title === relTitle)) {
                  matchedBookId = k;
                  if (v.category) bookCategory = v.category.toLowerCase();
                  break;
                }
              }

              if (!matchedBookId && relTitle) {
                matchedBookId = slugify(relTitle);
              }

              if (!bookCategory && relProps.category && relProps.category.select && relProps.category.select.name) {
                bookCategory = relProps.category.select.name.toLowerCase();
              }

              bookCache.set(relationPageId, matchedBookId);
            }
          }
        }

        const categoryPath = bookCategory || 'math';
        const targetDir = path.join(projectRoot, 'content', 'posts', 'notes', 'books', categoryPath);
        fs.mkdirSync(targetDir, { recursive: true });
        const targetFile = path.join(targetDir, `${slug}.md`);

        // 💡 최종 수정시간(last_edited_time) 비교 스킵 검사
        const existingLastMod = getExistingLastMod(targetFile);
        if (existingLastMod && existingLastMod === lastEditedTime) {
          console.log(`  [스킵 ⏩] '${title}' (최종 수정일시 변경 없음: ${lastEditedTime})`);
          skippedCount++;
          continue;
        }

        const tagsList = [];
        if (props.tags && props.tags.multi_select && Array.isArray(props.tags.multi_select)) {
          props.tags.multi_select.forEach(t => {
            if (t.name) tagsList.push(t.name);
          });
        }

        console.log(`  [동기화 🔄] '${title}' (slug: ${slug}, category: ${categoryPath}, lastmod: ${lastEditedTime})...`);

        const blocks = await getBlockChildren(page.id);
        const bodyMd = await blocksToMd(blocks);

        const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: ${dateStr}
lastmod: ${lastEditedTime}
categories: ["notes"]
${tagsList.length > 0 ? `tags: ${JSON.stringify(tagsList)}` : ''}
${matchedBookId ? `book: "${matchedBookId}"` : ''}
---

${bodyMd}
`;

        fs.writeFileSync(targetFile, frontmatter, 'utf-8');
        console.log(`    └─ ✅ 생성 완료: content/posts/notes/books/${categoryPath}/${slug}.md`);
        count++;
      }
      console.log(`✨ 독서노트 갱신 ${count}개, 스킵 ${skippedCount}개 완료!\n`);
    }
  }

  console.log('🎉 Notion 동기화 작업이 모두 완료되었습니다!');
}

main().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});

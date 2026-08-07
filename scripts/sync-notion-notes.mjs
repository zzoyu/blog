import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DB_NOTES = process.env.NOTION_DATABASE_ID_BOOK_NOTES;
const NOTION_DB_BOOKS = process.env.NOTION_DATABASE_ID_BOOKS;

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
  const booksPath = path.join(projectRoot, 'data', 'books.yml');
  if (!fs.existsSync(booksPath)) return {};
  const content = fs.readFileSync(booksPath, 'utf-8');

  const books = {};
  let currentKey = null;

  content.split('\n').forEach(line => {
    const keyMatch = line.match(/^([a-zA-Z0-9_-]+):$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      books[currentKey] = {};
    } else if (currentKey && line.startsWith('  ')) {
      const propMatch = line.match(/^\s+([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (propMatch) {
        let val = propMatch[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        books[currentKey][propMatch[1]] = val;
      }
    }
  });

  return books;
}

function richTextToMd(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return '';
  return richTextArray.map(item => {
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

async function getBlockChildren(blockId) {
  const url = `https://api.notion.com/v1/blocks/${blockId}/children?page_size=100`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

async function blocksToMd(blocks) {
  const lines = [];
  for (const block of blocks) {
    const type = block.type;
    switch (type) {
      case 'paragraph':
        lines.push(richTextToMd(block.paragraph.rich_text));
        lines.push('');
        break;
      case 'heading_1':
        lines.push(`# ${richTextToMd(block.heading_1.rich_text)}`);
        lines.push('');
        break;
      case 'heading_2':
        lines.push(`## ${richTextToMd(block.heading_2.rich_text)}`);
        lines.push('');
        break;
      case 'heading_3':
        lines.push(`### ${richTextToMd(block.heading_3.rich_text)}`);
        lines.push('');
        break;
      case 'bulleted_list_item':
        lines.push(`- ${richTextToMd(block.bulleted_list_item.rich_text)}`);
        break;
      case 'numbered_list_item':
        lines.push(`1. ${richTextToMd(block.numbered_list_item.rich_text)}`);
        break;
      case 'to_do':
        const checked = block.to_do.checked ? 'x' : ' ';
        lines.push(`- [${checked}] ${richTextToMd(block.to_do.rich_text)}`);
        break;
      case 'quote':
        lines.push(`> ${richTextToMd(block.quote.rich_text)}`);
        lines.push('');
        break;
      case 'callout':
        lines.push(`> 💡 ${richTextToMd(block.callout.rich_text)}`);
        lines.push('');
        break;
      case 'code':
        const lang = block.code.language || '';
        lines.push(`\`\`\`${lang}`);
        lines.push(richTextToMd(block.code.rich_text));
        lines.push(`\`\`\``);
        lines.push('');
        break;
      case 'divider':
        lines.push('---');
        lines.push('');
        break;
      case 'image':
        const imgUrl = block.image.type === 'file' ? block.image.file.url : block.image.external?.url;
        if (imgUrl) {
          lines.push(`![image](${imgUrl})`);
          lines.push('');
        }
        break;
      default:
        break;
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

// 📖 Notion 도서 데이터베이스 일괄 동기화 함수
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
    const isbn = bookData.isbn;
    const author = bookData.author || '';
    const category = bookData.category || 'math';
    const totalPage = parseInt(bookData.total_page || '0', 10);
    const currentPage = parseInt(bookData.current_page || '0', 10);
    const status = bookData.status || 'waiting';
    const startedAt = bookData.started_at || null;

    if ((isbn && existingIsbns.has(String(isbn))) || (title && existingTitles.has(title))) {
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

async function main() {
  console.log('🚀 Notion 독서노트 & 도서 동기화 시작...\n');

  const localBooks = loadBooksYaml();

  // 1. 도서 일괄 동기화 (data/books.yml ➔ Notion 도서 DB)
  await syncBooksToNotion(localBooks);

  const bookCache = new Map();

  // 2. Notion 독서노트 DB 동기화
  if (NOTION_DB_NOTES) {
    console.log('📚 Notion 독서노트 데이터베이스 동기화 중...');

    const pages = await fetchNotionDB(NOTION_DB_NOTES);
    const filteredPages = pages.filter(p => !p.properties.draft || p.properties.draft.checkbox === false);

    if (!filteredPages.length) {
      console.log('  └─ 💡 발행(draft: false) 상태인 독서노트가 없습니다.\n');
    } else {
      let count = 0;
      for (const page of filteredPages) {
        const props = page.properties;

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

        // Tags 파싱 (Frontmatter tags 속성으로 주입)
        const tagsList = [];
        if (props.tags && props.tags.multi_select && Array.isArray(props.tags.multi_select)) {
          props.tags.multi_select.forEach(t => {
            if (t.name) tagsList.push(t.name);
          });
        }

        // URL 주소 경로에 사용할 책 카테고리 (연결 도서 카테고리 우선, 없으면 기본값 math)
        const categoryPath = bookCategory || 'math';

        console.log(`  [처리 중] '${title}' (slug: ${slug}, category: ${categoryPath}, tags: ${JSON.stringify(tagsList)})...`);

        const blocks = await getBlockChildren(page.id);
        const bodyMd = await blocksToMd(blocks);

        const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: ${dateStr}
categories: ["notes"]
${tagsList.length > 0 ? `tags: ${JSON.stringify(tagsList)}` : ''}
${matchedBookId ? `book: "${matchedBookId}"` : ''}
---

${bodyMd}
`;

        const targetDir = path.join(projectRoot, 'content', 'posts', 'notes', 'books', categoryPath);
        fs.mkdirSync(targetDir, { recursive: true });
        const targetFile = path.join(targetDir, `${slug}.md`);

        fs.writeFileSync(targetFile, frontmatter, 'utf-8');
        console.log(`    └─ ✅ 생성 완료: content/posts/notes/books/${categoryPath}/${slug}.md`);
        count++;
      }
      console.log(`✨ 독서노트 총 ${count}개 동기화 완료!\n`);
    }
  }

  console.log('🎉 Notion 동기화 작업이 모두 완료되었습니다!');
}

main().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});

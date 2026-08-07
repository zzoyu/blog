import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import * as yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const KB_TEMPLATE = process.env.BOOK_API_URL_KB || 'https://contents.kyobobook.co.kr/sih/fit-in/300x0/pdt/{isbn}.jpg';
const BOOKS_YAML_PATH = path.join(projectRoot, 'data', 'books.yml');

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

function saveBooksYaml(booksObject) {
  const yamlString = yaml.dump(booksObject, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: true
  });
  fs.writeFileSync(BOOKS_YAML_PATH, yamlString, 'utf-8');
}

// 🔍 Autocomplete 검색 API (.env 변수 활용)
async function searchKyobo(keyword) {
  const template = process.env.SEARCH_KB_AUTOCOMPLETE_URL || 'https://search.kyobobook.co.kr/srp/api/v2/search/autocomplete/shop?keyword={keyword}&gbCode=TOT&page=1&pageSize=10&deviceType=P';
  const url = template.replace('{keyword}', encodeURIComponent(keyword));
  const referer = process.env.SEARCH_KB_SITE_REFERER || 'https://search.kyobobook.co.kr/';

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': referer
    }
  });
  if (!res.ok) throw new Error(`검색 API 요청 실패 (${res.status})`);
  const json = await res.json();
  return json?.data?.resultDocuments || [];
}

// 🔍 통합 상세 검색 API (.env 변수 활용)
async function searchKyoboDetailApi(keyword) {
  const url = process.env.SEARCH_KB_DETAIL_API_URL || 'https://search.kyobobook.co.kr/searchTabAsync';
  const refererBase = process.env.SEARCH_KB_SITE_REFERER || 'https://search.kyobobook.co.kr/';

  const bodyData = new URLSearchParams({
    keyword: keyword,
    suggestKeyword: '',
    searchDvsnCode: '',
    gbCode: 'TOT',
    target: 'total',
    tagKeyword: ''
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': `${refererBase}search?keyword=${encodeURIComponent(keyword)}&gbCode=TOT&target=total`,
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: bodyData.toString()
  });

  if (!res.ok) return [];
  const html = await res.text();

  const items = [];
  const prodRegex = /<li class="prod_item"[\s\S]*?<\/li>/g;
  const matches = [...html.matchAll(prodRegex)];

  for (const m of matches) {
    const itemHtml = m[0];

    const pidMatch = itemHtml.match(/data-pid="(S\d+)"/) || itemHtml.match(/detail\/(S\d+)/);
    const bidMatch = itemHtml.match(/data-bid="(\d+)"/) || itemHtml.match(/data-isbn="(\d+)"/);

    let title = '';
    const titleAttrMatch = itemHtml.match(/data-name="([^"]+)"/) || itemHtml.match(/data-kbbfn-title="([^"]+)"/);
    if (titleAttrMatch) {
      title = titleAttrMatch[1];
    } else {
      const titleTagMatch = itemHtml.match(/class="prod_info"[\s\S]*?<span[^>]*>(.*?)<\/span>/);
      if (titleTagMatch) title = titleTagMatch[1].replace(/<[^>]*>/g, '').trim();
    }

    // 저자 정밀 파싱 (1저자/대표 저자 우선)
    let author = '';
    const mainAuthorMatch = itemHtml.match(/class="author[^"]*"[^>]*>(.*?)<\/a>[\s\S]{0,200}?<span class="type">저자/);
    if (mainAuthorMatch) {
      author = mainAuthorMatch[1].replace(/<[^>]*>/g, '').trim();
    }
    if (!author) {
      const repMatch = itemHtml.match(/class="author\s+rep"[^>]*>(.*?)<\/a>/) || itemHtml.match(/class="author[^"]*rep[^"]*"[^>]*>(.*?)<\/a>/);
      if (repMatch) author = repMatch[1].replace(/<[^>]*>/g, '').trim();
    }
    if (!author) {
      const firstAuthorMatch = itemHtml.match(/class="prod_author"[\s\S]*?<a[^>]*class="author[^"]*"[^>]*>(.*?)<\/a>/) || itemHtml.match(/class="author[^"]*"[^>]*>(.*?)<\/a>/);
      if (firstAuthorMatch) author = firstAuthorMatch[1].replace(/<[^>]*>/g, '').trim();
    }
    if (!author) author = '미상';

    let publisher = '-';
    const pubMatch = itemHtml.match(/class="publish"[^>]*>(.*?)<\/a>/) || itemHtml.match(/class="prod_publish"[\s\S]*?<a[^>]*>(.*?)<\/a>/);
    if (pubMatch) publisher = pubMatch[1].replace(/<[^>]*>/g, '').trim();

    const saleCmdtId = pidMatch ? pidMatch[1] : '';
    const isbn = bidMatch ? bidMatch[1] : '';

    if (title && (saleCmdtId || isbn)) {
      items.push({
        cmdt_NAME: title,
        sale_CMDTID: saleCmdtId,
        cmdtcode: isbn,
        chrc_NAME: author,
        pbcm_NAME: publisher
      });
    }
  }

  return items;
}

// 📖 상세 페이지 파싱 (.env 변수 활용)
async function fetchTotalPage(saleCmdtId, isbn) {
  const idsToTry = [saleCmdtId, isbn].filter(Boolean);
  const template = process.env.SEARCH_KB_PRODUCT_DETAIL_URL || 'https://product.kyobobook.co.kr/detail/{id}';
  const referer = process.env.SEARCH_KB_SITE_REFERER || 'https://search.kyobobook.co.kr/';

  for (const id of idsToTry) {
    try {
      const url = template.replace('{id}', id);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': referer,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      if (!res.ok) continue;
      const html = await res.text();

      const m1 = html.match(/(\d+)\s*쪽\s*\|/);
      if (m1 && m1[1]) return parseInt(m1[1], 10);

      const m2 = html.match(/<span>(\d+)\s*쪽/);
      if (m2 && m2[1]) return parseInt(m2[1], 10);

      const m3 = html.match(/쪽수[\s\S]{1,100}?(\d+)\s*쪽/);
      if (m3 && m3[1]) return parseInt(m3[1], 10);

      const m4 = html.match(/"(?:page|itemPage|pdtPcnt)":\s*"?(\d+)"?/i);
      if (m4 && m4[1]) return parseInt(m4[1], 10);
    } catch (e) {
      // ignore
    }
  }
  return 0;
}

async function fetchImage(url, destPath) {
  const referer = process.env.SEARCH_KB_SITE_REFERER || 'https://search.kyobobook.co.kr/';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': referer
      }
    });
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 500) return false;
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (e) {
    return false;
  }
}

async function addBookToNotion({ title, author, isbn, category, totalPage, coverUrl }) {
  const key = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_DATABASE_ID_BOOKS;
  if (!key || !dbId) return false;

  const payload = {
    parent: { database_id: dbId },
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
        number: totalPage || 0
      },
      current_page: {
        number: 0
      },
      status: {
        status: { name: 'waiting' }
      }
    }
  };

  if (coverUrl) {
    payload.cover = {
      type: 'external',
      external: { url: coverUrl }
    };
  }

  try {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

async function main() {
  const query = process.argv.slice(2).join(' ');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (q) => new Promise(resolve => rl.question(q, resolve));

  let keyword = query;
  if (!keyword) {
    keyword = await ask('🔍 검색할 책 제목이나 키워드를 입력하세요: ');
  }

  if (!keyword.trim()) {
    console.log('검색어가 입력되지 않았습니다.');
    rl.close();
    return;
  }

  console.log(`\n교보문고에서 '${keyword}' 검색 중...`);
  const results = await searchKyobo(keyword);

  if (!results.length) {
    console.log('❌ 기본 검색 결과가 없습니다. 상세 검색 API 조회를 시도합니다...');
  }

  console.log('\n📖 검색 결과 목록:');
  results.forEach((item, idx) => {
    const cleanTitle = (item.cmdt_NAME || '').replace(/<[^>]*>/g, '').trim();
    const cleanAuthor = (item.chrc_NAME || '미상').replace(/<[^>]*>/g, '').trim();
    const cleanPublisher = (item.pbcm_NAME || '-').replace(/<[^>]*>/g, '').trim();
    console.log(`[${idx + 1}] ${cleanTitle} | 저자: ${cleanAuthor} | 출판사: ${cleanPublisher} | ISBN: ${item.cmdtcode}`);
  });

  const detailOptIdx = results.length + 1;
  console.log(`[${detailOptIdx}] 🔍 교보문고 통합 상세 검색 결과 보기 (searchTabAsync API 사용)`);

  const answer = await ask(`\n추가할 도서 번호를 선택하세요 (1-${detailOptIdx}): `);
  let selectedIdx = parseInt(answer, 10) - 1;

  let selectedBook = null;

  if (selectedIdx === detailOptIdx - 1) {
    console.log(`\n🔍 교보문고 통합 상세 검색 API (searchTabAsync) 조회 중...`);
    const detailResults = await searchKyoboDetailApi(keyword);

    if (!detailResults.length) {
      console.log('❌ 상세 검색 API 조회 결과도 없습니다.');
      rl.close();
      return;
    }

    console.log('\n🔍 교보문고 통합 상세 검색 결과 (searchTabAsync API):');
    detailResults.forEach((item, idx) => {
      console.log(`[${idx + 1}] ${item.cmdt_NAME} | 저자: ${item.chrc_NAME} | 출판사: ${item.pbcm_NAME} | ISBN: ${item.cmdtcode}`);
    });

    const detailAnswer = await ask(`\n상세 검색 결과에서 추가할 도서 번호를 선택하세요 (1-${detailResults.length}): `);
    const detailIdx = parseInt(detailAnswer, 10) - 1;

    if (isNaN(detailIdx) || detailIdx < 0 || detailIdx >= detailResults.length) {
      console.log('잘못된 선택입니다.');
      rl.close();
      return;
    }

    selectedBook = detailResults[detailIdx];
  } else if (!isNaN(selectedIdx) && selectedIdx >= 0 && selectedIdx < results.length) {
    selectedBook = results[selectedIdx];
  } else {
    console.log('잘못된 선택입니다.');
    rl.close();
    return;
  }

  const book = selectedBook;
  const title = (book.cmdt_NAME || '').replace(/<[^>]*>/g, '').trim();
  const author = (book.chrc_NAME || '').replace(/<[^>]*>/g, '').trim();
  const isbn = String(book.cmdtcode || '');
  const saleCmdtId = book.sale_CMDTID || book.saleCmdtId || book.sale_cmdtid;

  // 기존 등록 여부 체크 (js-yaml 사용)
  const booksYamlObj = loadBooksYaml();
  let existingKey = null;
  for (const [k, v] of Object.entries(booksYamlObj)) {
    if (v.isbn && isbn && String(v.isbn) === isbn) {
      existingKey = k;
      break;
    }
  }

  console.log(`\n📖 상세 정보(총 페이지 수) 조회 중...`);
  const fetchedPage = await fetchTotalPage(saleCmdtId, isbn);

  if (fetchedPage > 0) {
    console.log(`  └─ ✅ 총 페이지 수 추출 성공: ${fetchedPage}쪽`);
  } else {
    console.log(`  └─ ⚠️ 총 페이지 수를 자동으로 가져오지 못했습니다.`);
  }

  // 1. total_page 확인/수정 프롬프트
  const defaultPage = (fetchedPage > 0) ? fetchedPage : (existingKey && booksYamlObj[existingKey].total_page ? parseInt(booksYamlObj[existingKey].total_page, 10) : 0);
  const pagePrompt = await ask(`\n총 페이지 수 (total_page) [기본값: ${defaultPage}]: `);
  const parsedPage = parseInt(pagePrompt.trim(), 10);
  const totalPage = (!isNaN(parsedPage) && parsedPage >= 0) ? parsedPage : defaultPage;

  // 2. slug 설정
  let defaultSlug = existingKey || slugify(title);
  if (!defaultSlug) {
    defaultSlug = `book-${isbn}`;
  }
  const customSlug = await ask(`book-id (slug)를 입력하세요 [기본값: ${defaultSlug}]: `);
  const bookId = customSlug.trim() || defaultSlug;

  if (booksYamlObj[bookId]) {
    existingKey = bookId;
  }

  // 3. 중복 확인 시 사용자 의사 확인
  if (existingKey) {
    const ex = booksYamlObj[existingKey];
    console.log(`\n⚠️ '${existingKey}' (제목: "${ex.title}") 도서가 이미 'data/books.yml'에 등록되어 있습니다.`);
    const overwriteAnswer = await ask(`   기존 정보를 업데이트(덮어쓰기)하시겠습니까? (y/N) [기본값: N]: `);

    if (overwriteAnswer.trim().toLowerCase() !== 'y' && overwriteAnswer.trim().toLowerCase() !== 'yes') {
      console.log('💡 작업을 취소했습니다.');
      rl.close();
      return;
    }
  }

  // 4. category 설정
  const existingCategory = existingKey ? booksYamlObj[existingKey].category : null;
  const defaultCategory = existingCategory || ((title.includes('수학') || author.includes('수학')) ? 'math' : 'dev');
  const categoryInput = await ask(`카테고리를 입력하세요 (예: math, dev 등) [기본값: ${defaultCategory}]: `);
  const category = categoryInput.trim() || defaultCategory;

  // 기존 객체 보존 및 신규 도서 정보 구성
  const existingItem = existingKey ? booksYamlObj[existingKey] : {};
  booksYamlObj[bookId] = {
    title: title,
    author: author,
    isbn: isbn,
    category: category,
    total_page: totalPage,
    current_page: existingItem.current_page !== undefined ? existingItem.current_page : 0,
    status: existingItem.status || 'waiting',
    started_at: existingItem.started_at || '',
    finished_at: existingItem.finished_at || '',
    note_url: existingItem.note_url || '',
    cover_path: existingItem.cover_path || ''
  };

  // js-yaml 로 깔끔하게 파일 저장
  saveBooksYaml(booksYamlObj);

  console.log(`\n✅ 'data/books.yml'에 성공적으로 ${existingKey ? '업데이트' : '추가'}되었습니다:`);
  console.log('----------------------------------------');
  console.log(yaml.dump({ [bookId]: booksYamlObj[bookId] }).trim());
  console.log('----------------------------------------');

  // 표지 이미지 URL
  const coverUrl = KB_TEMPLATE.includes('{isbn}') ? KB_TEMPLATE.replace('{isbn}', isbn) : `${KB_TEMPLATE}${isbn}`;

  // Notion 도서 DB 자동 등록 시도
  if (process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID_BOOKS) {
    console.log(`\n📝 Notion 도서 데이터베이스에 자동 등록 시도 중...`);
    if (await addBookToNotion({ title, author, isbn, category, totalPage, coverUrl })) {
      console.log(`  └─ ✅ Notion 도서 DB에 커버 이미지와 함께 성공적으로 추가되었습니다!`);
    } else {
      console.log(`  └─ ⚠️ Notion 도서 DB 추가를 건너뛰었습니다.`);
    }
  }

  // 표지 이미지 자동 다운로드
  const targetCover = path.join(projectRoot, 'assets', 'img', 'books', `${bookId}.jpg`);

  console.log(`\n🖼️ 표지 이미지 다운로드 시도 중... (${coverUrl})`);
  if (await fetchImage(coverUrl, targetCover)) {
    console.log(`✅ 표지 이미지가 'assets/img/books/${bookId}.jpg' 로 저장되었습니다.`);
  } else {
    console.log(`⚠️ 표지 이미지 자동 다운로드 실패. 필요 시 'bun run fetch-covers'를 실행해 주세요.`);
  }

  rl.close();
}

main().catch(err => {
  console.error('오류 발생:', err);
  process.exit(1);
});

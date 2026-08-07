import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

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

async function fetchImage(url, destPath) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
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
    console.log('❌ 검색 결과가 없습니다.');
    rl.close();
    return;
  }

  console.log('\n📖 검색 결과 목록:');
  results.forEach((item, idx) => {
    const cleanTitle = (item.cmdt_NAME || '').replace(/<[^>]*>/g, '').trim();
    const cleanAuthor = (item.chrc_NAME || '미상').replace(/<[^>]*>/g, '').trim();
    const cleanPublisher = (item.pbcm_NAME || '-').replace(/<[^>]*>/g, '').trim();
    console.log(`[${idx + 1}] ${cleanTitle} | 저자: ${cleanAuthor} | 출판사: ${cleanPublisher} | ISBN: ${item.cmdtcode}`);
  });

  const answer = await ask(`\n추가할 도서 번호를 선택하세요 (1-${results.length}): `);
  const selectedIdx = parseInt(answer, 10) - 1;

  if (isNaN(selectedIdx) || selectedIdx < 0 || selectedIdx >= results.length) {
    console.log('잘못된 선택입니다.');
    rl.close();
    return;
  }

  const book = results[selectedIdx];
  const title = (book.cmdt_NAME || '').replace(/<[^>]*>/g, '').trim();
  const author = (book.chrc_NAME || '').replace(/<[^>]*>/g, '').trim();
  const isbn = book.cmdtcode;

  let defaultSlug = slugify(title);
  if (!defaultSlug) {
    defaultSlug = `book-${isbn}`;
  }

  const customSlug = await ask(`\nbook-id (slug)를 입력하세요 [기본값: ${defaultSlug}]: `);
  const bookId = customSlug.trim() || defaultSlug;

  const categoryInput = await ask(`카테고리를 입력하세요 (예: math, dev 등) [기본값: math]: `);
  const category = categoryInput.trim() || 'math';

  const yamlContent = `
${bookId}:
  title: "${title}"
  author: "${author}"
  isbn: "${isbn}"
  category: "${category}"
  total_page: 0
  current_page: 0
  status: "waiting"
  started_at: ""
  finished_at: ""
  note_url: ""
  cover_path: ""
`;

  const booksPath = path.join(projectRoot, 'data', 'books.yml');
  fs.appendFileSync(booksPath, yamlContent);
  console.log(`\n✅ 'data/books.yml'에 '${title}' (${bookId}) 정보가 성공적으로 추가되었습니다!`);

  // 표지 이미지 자동 다운로드
  const targetCover = path.join(projectRoot, 'assets', 'img', 'books', `${bookId}.jpg`);
  const coverUrl = KB_TEMPLATE.includes('{isbn}') ? KB_TEMPLATE.replace('{isbn}', isbn) : `${KB_TEMPLATE}${isbn}`;

  console.log(`🖼️ 표지 이미지 다운로드 시도 중... (${coverUrl})`);
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

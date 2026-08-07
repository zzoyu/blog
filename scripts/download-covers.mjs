import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 무효(이미지 없음)로 판단할 MD5 해시 목록 (예: 교보문고 no-image placeholder)
const INVALID_MD5_HASHES = [
  '281213994c3cab7edf776a897dd0b52f'
];

function getMd5(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

const KB_TEMPLATE = process.env.BOOK_API_URL_KB;
const OL_TEMPLATE = process.env.BOOK_API_URL_OL;

// 2. URL 템플릿 변환 함수
function buildUrl(template, isbn) {
  if (!template || !isbn) return null;
  if (template.includes('{isbn}')) return template.replace('{isbn}', isbn);
  if (template.includes('%s')) return template.replace('%s', isbn);
  return `${template}${isbn}`;
}

// 3. 이미지 다운로드 함수
async function fetchAndSaveImage(url, destPath) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) return false;
    
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 500) return false; // 유효하지 않은 작은 픽셀/에러 이미지 방지

    // MD5 검사: 알려진 placeholder 이미지면 실패 처리
    const hash = getMd5(buffer);
    if (INVALID_MD5_HASHES.includes(hash)) {
      return false;
    }

    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (err) {
    return false;
  }
}

// 4. 간단한 YAML books 데이터 추출기
function parseBooksYaml(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const books = [];
  let currentBook = null;

  content.split('\n').forEach(line => {
    const indent = line.search(/\S/);
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    if (indent === 0 && trimmed.endsWith(':')) {
      if (currentBook) books.push(currentBook);
      currentBook = { id: trimmed.slice(0, -1) };
    } else if (currentBook && indent > 0 && trimmed.includes(':')) {
      const idx = trimmed.indexOf(':');
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      currentBook[key] = val;
    }
  });
  if (currentBook) books.push(currentBook);
  return books;
}

async function main() {
  console.log('📚 도서 표지 이미지 일괄 다운로드 시작...\n');
  console.log(`- KB URL pattern : ${KB_TEMPLATE || '(미설정)'}`);
  console.log(`- OL URL pattern : ${OL_TEMPLATE || '(미설정)'}\n`);

  if (!KB_TEMPLATE && !OL_TEMPLATE) {
    console.error('❌ BOOK_API_URL_KB 또는 BOOK_API_URL_OL 환경변수가 설정되어 있지 않습니다.');
    process.exit(1);
  }

  const booksPath = path.join(projectRoot, 'data', 'books.yml');
  const books = parseBooksYaml(booksPath);
  const assetsBooksDir = path.join(projectRoot, 'assets', 'img', 'books');

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const book of books) {
    const { id, title, isbn, isbn_en, cover_path } = book;
    const targetFile = path.join(assetsBooksDir, `${id}.jpg`);
    const relCoverPath = `img/books/${id}.jpg`;

    // 이미지 파일이 이미 존재하는 경우 무효 MD5 검사
    if (fs.existsSync(targetFile)) {
      const fileBuffer = fs.readFileSync(targetFile);
      const fileHash = getMd5(fileBuffer);
      if (INVALID_MD5_HASHES.includes(fileHash)) {
        fs.unlinkSync(targetFile); // 무효 이미지 삭제 후 시도
      } else {
        console.log(`[스킵] ${title} (${id}) - 이미 유효한 로컬 표지 이미지 존재함 (${relCoverPath})`);
        skipCount++;
        continue;
      }
    }

    console.log(`[시도] ${title} (${id})...`);
    let downloaded = false;

    // 1순위: KB + isbn
    if (!downloaded && KB_TEMPLATE && isbn) {
      const url = buildUrl(KB_TEMPLATE, isbn);
      if (await fetchAndSaveImage(url, targetFile)) {
        console.log(`  └─ ✅ 1순위 성공 (KB + isbn: ${isbn}) -> ${relCoverPath}`);
        downloaded = true;
      }
    }

    // 2순위: KB + isbn_en
    if (!downloaded && KB_TEMPLATE && isbn_en) {
      const url = buildUrl(KB_TEMPLATE, isbn_en);
      if (await fetchAndSaveImage(url, targetFile)) {
        console.log(`  └─ ✅ 2순위 성공 (KB + isbn_en: ${isbn_en}) -> ${relCoverPath}`);
        downloaded = true;
      }
    }

    // 3순위: OL + isbn_en
    if (!downloaded && OL_TEMPLATE && isbn_en) {
      const url = buildUrl(OL_TEMPLATE, isbn_en);
      if (await fetchAndSaveImage(url, targetFile)) {
        console.log(`  └─ ✅ 3순위 성공 (OL + isbn_en: ${isbn_en}) -> ${relCoverPath}`);
        downloaded = true;
      }
    }

    if (downloaded) {
      successCount++;
    } else {
      console.log(`  └─ ❌ 실패: 사용 가능한 표지 이미지를 다운로드할 수 없습니다.`);
      failCount++;
    }
  }

  console.log('\n----------------------------------------');
  console.log(`✨ 완료! 성공: ${successCount}개 | 스킵: ${skipCount}개 | 실패: ${failCount}개`);
  console.log('💡 다운로드된 이미지는 assets/img/books/ 폴더에 저장됩니다.');
}

main();

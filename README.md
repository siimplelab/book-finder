# 📚 도서 검색 시스템 (SPARQL LOD)

국립중앙도서관 SPARQL Linked Open Data를 사용하여 도서 목록을 검색하고 엑셀 파일로 다운로드할 수 있는 웹 애플리케이션입니다.

## ✨ 주요 기능

- 🔍 **다양한 검색 옵션**: 발행처, 제목, 저자별 검색 지원
- 📊 **결과 테이블 표시**: 검색된 도서들의 상세 정보를 깔끔한 테이블로 표시
- 📥 **엑셀 다운로드**: 검색 결과를 엑셀 파일(.xlsx)로 다운로드
- 📱 **반응형 디자인**: 모바일과 데스크톱 모두에서 최적화된 UI
- ⚡ **실시간 로딩**: 검색 진행 상황을 실시간으로 표시
- 🔓 **API 키 불필요**: SPARQL LOD 사용으로 인증 없이 접근 가능

## 🚀 시작하기

### 사전 요구사항

- Node.js 18.17 이상
- npm 또는 yarn
- ✅ **API 키 불필요!**

### 데이터 소스

이 시스템은 [국립중앙도서관 SPARQL LOD 엔드포인트](http://lod.nl.go.kr/sparql)를 사용합니다.
- API 키나 별도 인증이 필요하지 않습니다
- 오픈 데이터로 누구나 자유롭게 접근 가능합니다
- 구조화된 메타데이터 형태로 제공됩니다

### 설치 및 실행

```bash
# 의존성 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

서버가 시작되면 [http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인할 수 있습니다.

## 🎯 사용법

1. **검색 유형 선택**: 발행처, 제목, 저자 중 원하는 검색 유형을 선택합니다.
2. **검색어 입력**: 검색하고자 하는 키워드를 입력합니다.
   - 발행처: "네이버웹툰 유한회사", "민음사", "창비" 등
   - 제목: "해리포터", "토지", "1984" 등
   - 저자: "김영하", "무라카미", "조정래" 등
3. **검색 실행**: "SPARQL 검색" 버튼을 클릭하여 검색을 실행합니다.
4. **결과 확인**: 검색된 도서 목록을 테이블로 확인합니다.
5. **엑셀 다운로드**: "엑셀 다운로드" 버튼을 클릭하여 결과를 다운로드합니다.

## 📋 검색 결과 필드

- **제목**: 도서 제목
- **저자**: 저자 정보
- **발행처**: 발행처 정보
- **발행년도**: 발행년도
- **ISBN**: ISBN 번호
- **분류번호**: 도서분류번호
- **주제**: 주제 분야
- **형태사항**: 페이지 수, 크기 등
- **언어**: 언어 코드
- **청구기호**: 도서관 청구기호

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Excel Export**: xlsx
- **Development**: ESLint, PostCSS

## 📁 프로젝트 구조

```
library-finder/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   └── api.ts          # API 호출 함수
│   └── types/
│       └── book.ts         # TypeScript 타입 정의
├── public/
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## 🔧 커스터마이징

### 검색 결과 개수 변경

`src/app/page.tsx`에서 `pageSize` 값을 수정하여 한 번에 가져올 결과 개수를 조정할 수 있습니다:

```typescript
const results = await searchBooksByPublisher({
  apiKey: apiKey.trim(),
  publisher: publisher.trim(),
  pageNum: page,
  pageSize: 50, // 이 값을 변경
});
```

### 엑셀 파일 필드 커스터마이징

`src/lib/api.ts`의 `exportToExcel` 함수에서 엑셀 파일에 포함될 필드를 수정할 수 있습니다.

## ⚠️ 주의사항

- API 키는 안전하게 보관하고 외부에 노출되지 않도록 주의하세요.
- 국립중앙도서관 API 이용약관을 준수하여 사용하세요.
- API 호출 제한이 있을 수 있으니 과도한 요청은 피해주세요.

## 🐛 문제 해결

### CORS 오류가 발생하는 경우

브라우저의 CORS 정책으로 인해 직접 API 호출이 차단될 수 있습니다. 이 경우 Next.js API Routes를 통해 서버사이드에서 API를 호출하도록 수정해야 할 수 있습니다.

### 검색 결과가 없는 경우

- API 키가 올바른지 확인하세요.
- 발행처명의 정확한 표기를 확인하세요.
- 국립중앙도서관에 해당 발행처의 도서가 등록되어 있는지 확인하세요.

## 📝 라이선스

이 프로젝트는 MIT 라이선스하에 제공됩니다.

## 🤝 기여

버그 리포트나 기능 개선 제안은 언제든 환영합니다. Issues나 Pull Request를 통해 기여해주세요.

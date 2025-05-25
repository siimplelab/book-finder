import { Book } from '@/types/book';
import { searchBooksByKeyword as searchSparql } from './sparql-api';
import { searchBooksAlternative, getDummyBooks } from './alternative-api';

export type SearchMethod = 'sparql' | 'alternative' | 'dummy' | 'failed';

export interface SearchResult {
  books: Book[];
  method: SearchMethod;
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
  note?: string;
}

export const unifiedBookSearch = async (
  keyword: string,
  searchType: 'title' | 'author' | 'publisher' = 'publisher',
  limit: number = 50,
  page: number = 1
): Promise<SearchResult> => {
  console.log(`통합 검색 시작: "${keyword}" (${searchType}) - 페이지 ${page}`);

  // 상용 출판사인지 확인 (SPARQL에는 없는 데이터)
  const commercialPublishers = ['네이버웹툰', '네이버', '민음사', '문학동네', '창비', '창작과비평사', '랜덤하우스', '열린책들', '을유문화사', '북하우스', '시공사', '가나'];
  const isCommercialSearch = searchType === 'publisher' && 
    commercialPublishers.some(pub => keyword.toLowerCase().includes(pub.toLowerCase()));

  if (isCommercialSearch) {
    console.log('🏢 상용 출판사 검색 감지, 서지정보시스템으로 직접 이동...');
  } else {
    // 1단계: SPARQL LOD 검색 시도 (학술자료용)
    try {
      console.log('1단계: SPARQL LOD 검색 시도...');
      const sparqlBooks = await searchSparql(keyword, searchType);
      
      // 필터링된 실제 결과가 있는지 확인
      const actualResults = sparqlBooks.filter(book => {
        const lowerKeyword = keyword.toLowerCase();
        switch (searchType) {
          case 'title':
            return book.title.toLowerCase().includes(lowerKeyword);
          case 'author':
            return book.author.toLowerCase().includes(lowerKeyword);
          case 'publisher':
            return book.publisher.toLowerCase().includes(lowerKeyword);
          default:
            return true;
        }
      });
      
      if (actualResults && actualResults.length > 0) {
        console.log(`✅ SPARQL 검색 성공: ${actualResults.length}건 발견`);
        return {
          books: actualResults,
          method: 'sparql',
          totalCount: actualResults.length,
          page,
          limit,
          totalPages: 1
        };
      } else {
        console.log('⚠️ SPARQL에서 실제 매칭 결과 없음, 2단계로 진행...');
      }
    } catch (error) {
      console.warn('⚠️ SPARQL 검색 실패:', error);
    }
  }

  // 2단계: 서지정보시스템 검색 시도 (실제 도서 데이터)
  try {
    console.log('2단계: 서지정보시스템 검색 시도...');
    const seojiResult = await searchBooksAlternative(keyword, searchType, limit, page);
    
    if (seojiResult && seojiResult.books.length > 0) {
      console.log(`✅ 서지정보시스템 검색 성공: ${seojiResult.books.length}건 발견`);
      return {
        books: seojiResult.books,
        method: 'alternative',
        totalCount: seojiResult.totalCount,
        page: seojiResult.page,
        limit: seojiResult.limit,
        totalPages: seojiResult.totalPages,
        note: seojiResult.note
      };
    } else {
      console.log('⚠️ 서지정보시스템에서 검색 결과 없음, 3단계로 진행...');
    }
  } catch (error) {
    console.warn('⚠️ 서지정보시스템 검색 실패:', error);
  }

  // 3단계: 더미 데이터 반환 (최후의 수단)
  try {
    console.log('3단계: 더미 데이터 생성...');
    const dummyBooks = getDummyBooks(keyword);
    
    if (dummyBooks && dummyBooks.length > 0) {
      console.log(`✅ 더미 데이터 제공: ${dummyBooks.length}건`);
      return {
        books: dummyBooks,
        method: 'dummy',
        totalCount: dummyBooks.length,
        page,
        limit,
        totalPages: 1,
        error: 'API 연결 실패로 테스트 데이터를 표시합니다.'
      };
    }
  } catch (error) {
    console.error('더미 데이터 생성 실패:', error);
  }

  // 모든 방법 실패
  console.error('❌ 모든 검색 방법 실패');
  return {
    books: [],
    method: 'failed',
    totalCount: 0,
    page,
    limit,
    totalPages: 0,
    error: '모든 검색 방법이 실패했습니다. 나중에 다시 시도해주세요.'
  };
};

// 각 검색 방법의 상태를 확인하는 함수
export const checkSearchMethodStatus = async (): Promise<{
  sparql: boolean;
  alternative: boolean;
}> => {
  const status = {
    sparql: false,
    alternative: false
  };

  // SPARQL 상태 확인
  try {
    await searchSparql('테스트', 'title');
    status.sparql = true;
  } catch {
    // SPARQL 실패
  }

  // 대안 API 상태 확인
  try {
    await searchBooksAlternative('테스트', 'title', 1);
    status.alternative = true;
  } catch {
    // 대안 API 실패
  }

  return status;
}; 
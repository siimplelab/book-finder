import axios from 'axios';
import { Book } from '@/types/book';

export interface PaginatedBookResult {
  books: Book[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  note?: string;
}

export const searchBooksAlternative = async (
  keyword: string, 
  searchType: 'title' | 'author' | 'publisher' = 'publisher',
  limit: number = 50,
  page: number = 1
): Promise<PaginatedBookResult> => {

  try {
    console.log('대안 API (서지정보시스템) 호출:', { keyword, searchType, limit });
    
    const response = await axios.get('/api/nl-search', {
      params: {
        keyword: keyword,
        searchType: searchType,
        limit: limit,
        page: page,
      },
      headers: {
        'Accept': 'application/json',
      }
    });

    console.log('서지정보시스템 API 응답:', response.data);

    // 새로운 응답 형식 처리
    if (response.data?.books && Array.isArray(response.data.books)) {
      const books = response.data.books.map((item: Record<string, unknown>) => ({
        id: String(item.id || ''),
        title: String(item.title || ''),
        author: String(item.author || ''),
        publisher: String(item.publisher || ''),
        publishYear: String(item.publishYear || ''),
        isbn: String(item.isbn || ''),
        classification: String(item.classification || ''),
        subject: String(item.subject || ''),
        extent: String(item.extent || ''),
        language: String(item.language || ''),
        callNumber: String(item.callNumber || ''),
      }));
      
      const totalCount = Number(response.data.totalCount) || books.length;
      const totalPages = Number(response.data.totalPages) || Math.ceil(totalCount / limit);
      const note = response.data.note;
      console.log(`✅ 서지정보시스템에서 ${books.length}건 반환 (총 ${totalCount}건 중)`);
      if (note) console.log(`📋 ${note}`);
      
      return {
        books,
        totalCount,
        page,
        limit,
        totalPages,
        note: String(note || '')
      };
    }

    // 기존 형식도 지원 (하위 호환성)
    if (response.data?.result?.record) {
      const books = response.data.result.record.map((item: Record<string, unknown>, index: number) => ({
        id: String(item.id_number || `alt-${index}`),
        title: String(item.title_info || ''),
        author: String(item.author_info || ''),
        publisher: String(item.pub_info || ''),
        publishYear: String(item.pub_year_info || ''),
        isbn: String(item.isbn || ''),
        classification: String(item.class_no || ''),
        subject: String(item.subject_info || ''),
        extent: String(item.extent_info || ''),
        language: String(item.lang_code || ''),
        callNumber: String(item.call_no || ''),
      }));
      
      return {
        books,
        totalCount: books.length,
        page,
        limit,
        totalPages: 1,
        note: ''
      };
    }

    console.log('⚠️ 서지정보시스템에서 데이터를 찾을 수 없음');
    return {
      books: [],
      totalCount: 0,
      page,
      limit,
      totalPages: 0,
      note: '검색 결과가 없습니다.'
    };
  } catch (error) {
    console.error('서지정보시스템 API 호출 실패:', error);
    throw new Error('서지정보시스템을 통한 검색에 실패했습니다.');
  }
};

// 테스트용 더미 데이터 - SPARQL이 완전히 실패할 경우 사용
export const getDummyBooks = (searchKeyword: string): Book[] => {
  const dummyData: Book[] = [
    {
      id: 'dummy-1',
      title: `${searchKeyword} 관련 도서 1 (테스트 데이터)`,
      author: '테스트 저자',
      publisher: searchKeyword.includes('네이버') ? '네이버웹툰 유한회사' : '테스트 출판사',
      publishYear: '2023',
      isbn: '9788000000001',
      classification: '813.7',
      subject: '만화',
      extent: '200p',
      language: 'kor',
      callNumber: 'T813.7-1',
    },
    {
      id: 'dummy-2',
      title: `${searchKeyword} 관련 도서 2 (테스트 데이터)`,
      author: '테스트 저자 2',
      publisher: searchKeyword.includes('네이버') ? '네이버웹툰 유한회사' : '테스트 출판사 2',
      publishYear: '2024',
      isbn: '9788000000002',
      classification: '813.7',
      subject: '웹툰',
      extent: '150p',
      language: 'kor',
      callNumber: 'T813.7-2',
    },
  ];

  return dummyData.filter(book => 
    book.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    book.author.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    book.publisher.toLowerCase().includes(searchKeyword.toLowerCase())
  );
}; 
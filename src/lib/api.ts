import axios from 'axios';
import { SearchParams, Book } from '@/types/book';

const API_BASE_URL = 'https://www.nl.go.kr/NL/search/openApi/search.do';

interface ApiRecord {
  id_number?: string;
  title_info?: string;
  author_info?: string;
  pub_info?: string;
  pub_year_info?: string;
  isbn?: string;
  class_no?: string;
  subject_info?: string;
  extent_info?: string;
  lang_code?: string;
  call_no?: string;
}

export const searchBooksByPublisher = async (params: SearchParams): Promise<Book[]> => {
  try {
    const searchParams = new URLSearchParams({
      key: params.apiKey,
      apiType: 'json',
      srchTarget: '1', // 통합자료검색
      kwd: `발행처:${params.publisher}`,
      pageNum: (params.pageNum || 1).toString(),
      pageSize: (params.pageSize || 100).toString(),
    });

    const response = await axios.get(`${API_BASE_URL}?${searchParams.toString()}`);
    
    if (response.data?.result?.record) {
      // API 응답 데이터를 Book 타입으로 매핑
      return response.data.result.record.map((item: ApiRecord) => ({
        id: item.id_number || '',
        title: item.title_info || '',
        author: item.author_info || '',
        publisher: item.pub_info || '',
        publishYear: item.pub_year_info || '',
        isbn: item.isbn || '',
        classification: item.class_no || '',
        subject: item.subject_info || '',
        extent: item.extent_info || '',
        language: item.lang_code || '',
        callNumber: item.call_no || '',
      }));
    }
    
    return [];
  } catch (error) {
    console.error('API 호출 중 오류 발생:', error);
    throw new Error('서적 정보를 가져오는데 실패했습니다.');
  }
};

export const exportToExcel = async (books: Book[], fileName: string = 'books') => {
  const { utils, writeFile } = await import('xlsx');
  
  const worksheet = utils.json_to_sheet(books.map(book => ({
    '제목': book.title,
    '저자': book.author,
    '발행처': book.publisher,
    '발행년도': book.publishYear,
    'ISBN': book.isbn,
    '분류번호': book.classification,
    '주제': book.subject,
    '형태사항': book.extent,
    '언어': book.language,
    '청구기호': book.callNumber,
  })));
  
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, '도서목록');
  
  writeFile(workbook, `${fileName}.xlsx`);
}; 
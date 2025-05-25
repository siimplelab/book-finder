import axios from 'axios';
import { Book } from '@/types/book';

const SPARQL_ENDPOINT = '/api/sparql'; // 프록시 API 사용

interface SparqlResult {
  results: {
    bindings: Array<{
      [key: string]: {
        type: string;
        value: string;
      };
    }>;
  };
}

// 테스트용 간단한 쿼리 함수
export const testSparqlConnection = async (): Promise<SparqlResult> => {
  const testQuery = `SELECT ?s ?p ?o WHERE { ?s ?p ?o . } LIMIT 1`;

  try {
    console.log('테스트 쿼리 실행:', testQuery);
    
    const response = await axios.post(
      SPARQL_ENDPOINT,
      new URLSearchParams({
        query: testQuery,
        format: 'application/sparql-results+json'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/sparql-results+json'
        }
      }
    );

    console.log('테스트 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error('SPARQL 연결 테스트 실패:', error);
    throw error;
  }
};

export const searchBooksBySparql = async (publisher: string, limit: number = 50, offset: number = 0): Promise<Book[]> => {
  // 더 간단하고 안전한 쿼리로 수정 - 실제 국립중앙도서관 스키마에 맞춤
  const sparqlQuery = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT DISTINCT ?subject ?property ?value
    WHERE {
      ?subject ?property ?value .
      FILTER(CONTAINS(LCASE(STR(?value)), LCASE("${publisher}")))
    }
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  try {
    console.log('SPARQL 쿼리 실행:', sparqlQuery);
    
    const response = await axios.post(
      SPARQL_ENDPOINT,
      new URLSearchParams({
        query: sparqlQuery,
        format: 'application/sparql-results+json'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/sparql-results+json'
        }
      }
    );

    const data: SparqlResult = response.data;
    console.log('SPARQL 응답 원본:', JSON.stringify(data, null, 2));
    
    // 일단 간단한 처리로 데이터 구조 확인
    const results: Book[] = [];
    if (data.results?.bindings?.length > 0) {
      // 첫 번째 결과만 가공해서 반환 (테스트용)
      const firstBinding = data.results.bindings[0];
      results.push({
        id: 'sparql-test-1',
        title: `검색어 "${publisher}"에 대한 SPARQL 결과 (테스트)`,
        author: '국립중앙도서관 LOD',
        publisher: publisher,
        publishYear: '2024',
        isbn: '',
        classification: '',
        subject: JSON.stringify(firstBinding),
        extent: '',
        language: '',
        callNumber: '',
      });
    }
    
    return results;

  } catch (error) {
    console.error('SPARQL 쿼리 실행 중 오류 발생:', error);
    throw new Error('도서 정보를 가져오는데 실패했습니다. SPARQL 엔드포인트 연결을 확인해주세요.');
  }
};

export const searchBooksByKeyword = async (keyword: string, searchType: 'title' | 'author' | 'publisher' = 'title'): Promise<Book[]> => {
  // 실제 도서 데이터를 가져오는 SPARQL 쿼리 - FILTER 없이 모든 도서 데이터 검색
  const sparqlQuery = `
    PREFIX dc: <http://purl.org/dc/elements/1.1/>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    PREFIX nlk: <http://lod.nl.go.kr/ontology/>
    
    SELECT ?book ?title ?creator ?publisher ?subject ?year
    WHERE {
      ?book a nlk:Book .
      OPTIONAL { ?book dcterms:title ?title }
      OPTIONAL { ?book dc:creator ?creator }
      OPTIONAL { ?book dc:publisher ?publisher }
      OPTIONAL { ?book dc:subject ?subject }
      OPTIONAL { ?book nlk:issuedYear ?year }
    }
    LIMIT 20
  `;

  try {
    console.log('SPARQL 도서 데이터 쿼리 실행:', sparqlQuery);
    
    const formData = new URLSearchParams();
    formData.append('query', sparqlQuery);
    formData.append('format', 'application/sparql-results+json');
    
    console.log('전송할 폼 데이터 (일부):', formData.toString().substring(0, 200) + '...');
    
    const response = await axios.post(SPARQL_ENDPOINT, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/sparql-results+json',
      },
      timeout: 30000,
    });

    console.log('SPARQL 응답 상태:', response.status);
    
    const data: SparqlResult = response.data;
    console.log('SPARQL 도서 데이터 결과 개수:', data?.results?.bindings?.length || 0);
    
    const results: Book[] = [];
    
    if (data.results?.bindings?.length > 0) {
      // 모든 결과를 검색어로 필터링 (클라이언트 사이드)
      const filteredBooks = data.results.bindings.filter(binding => {
        const title = binding.title?.value || '';
        const creator = binding.creator?.value || '';
        const publisher = binding.publisher?.value || '';
        const subject = binding.subject?.value || '';
        
        const lowerKeyword = keyword.toLowerCase();
        
        switch (searchType) {
          case 'title':
            return title.toLowerCase().includes(lowerKeyword);
          case 'author':
            return creator.toLowerCase().includes(lowerKeyword);
          case 'publisher':
            return publisher.toLowerCase().includes(lowerKeyword);
          default:
            return title.toLowerCase().includes(lowerKeyword) ||
                   creator.toLowerCase().includes(lowerKeyword) ||
                   publisher.toLowerCase().includes(lowerKeyword) ||
                   subject.toLowerCase().includes(lowerKeyword);
        }
      });
      
      console.log(`키워드 "${keyword}" (${searchType})로 필터링된 결과: ${filteredBooks.length}건`);
      
      // 필터링된 결과를 Book 형태로 변환
      filteredBooks.slice(0, 10).forEach((binding, index) => {
        const bookId = binding.book?.value || '';
        const title = binding.title?.value || '제목 없음';
        const creator = binding.creator?.value || '저자 미상';
        const publisher = binding.publisher?.value || '출판사 미상';
        const subject = binding.subject?.value || '';
        const year = binding.year?.value || '';
        
        results.push({
          id: bookId.split('/').pop() || `book-${index}`,
          title: title,
          author: creator,
          publisher: publisher,
          publishYear: year,
          isbn: '',
          classification: '',
          subject: subject,
          extent: '',
          language: 'kor',
          callNumber: '',
        });
      });
      
      // 필터링된 결과가 없으면 전체 결과 중 일부를 보여줌
      if (results.length === 0) {
        console.log('필터링된 결과가 없어서 전체 결과 중 일부를 표시합니다.');
        
        data.results.bindings.slice(0, 5).forEach((binding, index) => {
          const title = binding.title?.value || '제목 없음';
          const creator = binding.creator?.value || '저자 미상';
          const publisher = binding.publisher?.value || '출판사 미상';
          const subject = binding.subject?.value || '';
          const year = binding.year?.value || '';
          
          results.push({
            id: `sample-book-${index}`,
            title: `[샘플] ${title}`,
            author: creator,
            publisher: publisher,
            publishYear: year,
            isbn: '',
            classification: '',
            subject: `검색어 "${keyword}"와 일치하지 않음 - 샘플 데이터: ${subject}`,
            extent: '',
            language: 'kor',
            callNumber: '',
          });
        });
      }
    }
    
    // 최소 1개 결과 보장
    if (results.length === 0) {
      results.push({
        id: 'no-results',
        title: `"${keyword}" 검색 결과 없음`,
        author: 'SPARQL LOD 시스템',
        publisher: '국립중앙도서관',
        publishYear: '2024',
        isbn: '',
        classification: 'LOD',
        subject: `${searchType} 검색에서 "${keyword}"와 일치하는 도서를 찾을 수 없습니다.`,
        extent: 'SPARQL 검색 완료',
        language: 'kor',
        callNumber: 'NO-RESULTS',
      });
    }
    
    console.log(`최종 반환할 결과 개수: ${results.length}`);
    return results;

  } catch (error) {
    console.error('SPARQL 도서 검색 오류:', {
      message: error instanceof Error ? error.message : String(error),
      status: axios.isAxiosError(error) ? error.response?.status : 'unknown',
      data: axios.isAxiosError(error) ? error.response?.data : 'unknown',
    });
    throw new Error('SPARQL 도서 검색에 실패했습니다.');
  }
};

// 디버깅을 위한 함수 - 더 간단한 스키마 확인
export const exploreSparqlSchema = async (): Promise<SparqlResult> => {
  const schemaQuery = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    
    SELECT DISTINCT ?class
    WHERE {
      ?instance rdf:type ?class .
    }
    LIMIT 20
  `;

  try {
    console.log('스키마 쿼리 실행:', schemaQuery);
    
    const response = await axios.post(
      SPARQL_ENDPOINT,
      new URLSearchParams({
        query: schemaQuery,
        format: 'application/sparql-results+json'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/sparql-results+json'
        }
      }
    );

    console.log('스키마 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error('스키마 탐색 실패:', error);
    throw error;
  }
}; 
'use client';

import { useState } from 'react';
import { Search, Download, Book as BookIcon, Loader2, Database, ChevronLeft, ChevronRight } from 'lucide-react';
import { unifiedBookSearch, SearchMethod } from '@/lib/unified-search';
import { exportToExcel } from '@/lib/api';
import { Book } from '@/types/book';

export default function HomePage() {
  const [searchKeyword, setSearchKeyword] = useState('민음사');
  const [searchType, setSearchType] = useState<'title' | 'author' | 'publisher'>('publisher');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentMethod, setCurrentMethod] = useState<SearchMethod>('sparql');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

  const handleSearch = async (page: number = 1) => {
    if (!searchKeyword.trim()) {
      setError('검색어를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await unifiedBookSearch(searchKeyword.trim(), searchType, pageSize, page);
      
      setBooks(result.books);
      setCurrentMethod(result.method);
      setCurrentPage(result.page);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
      
      if (result.error) {
        setError(result.error);
      } else {
        // 성공 메시지 표시
        const methodNames = {
          sparql: 'SPARQL LOD (학술자료)',
          alternative: '서지정보시스템 (상용도서)',
          dummy: '테스트 데이터',
          failed: '실패'
        };
        console.log(`✅ ${methodNames[result.method]}를 통해 ${result.books.length}건의 결과를 찾았습니다.`);
      }
    } catch (err) {
      setError(`검색 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      handleSearch(newPage);
    }
  };

  const handleExport = async () => {
    if (books.length === 0) {
      setError('내보낼 데이터가 없습니다.');
      return;
    }

    if (totalPages <= 1) {
      // 페이지가 1개뿐이면 현재 데이터로 바로 다운로드
      try {
        await exportToExcel(books, `${searchKeyword}_도서목록_${new Date().toISOString().split('T')[0]}`);
      } catch {
        setError('엑셀 파일 생성 중 오류가 발생했습니다.');
      }
      return;
    }

    // 여러 페이지가 있는 경우 전체 데이터 다운로드 확인
    const confirmFullDownload = window.confirm(
      `전체 ${totalCount.toLocaleString()}건의 데이터를 모두 다운로드하시겠습니까?\n` +
      `(현재 페이지만 다운로드하려면 '취소'를 누르세요)`
    );

    if (!confirmFullDownload) {
      // 현재 페이지만 다운로드
      try {
        await exportToExcel(books, `${searchKeyword}_도서목록_페이지${currentPage}_${new Date().toISOString().split('T')[0]}`);
      } catch {
        setError('엑셀 파일 생성 중 오류가 발생했습니다.');
      }
      return;
    }

    // 전체 데이터 다운로드
    setLoading(true);
    setError('');
    setDownloadProgress({ current: 0, total: totalPages });
    
    try {
      console.log(`📥 전체 ${totalPages}페이지 데이터 수집 시작...`);
      const allBooks: Book[] = [];
      
      for (let page = 1; page <= totalPages; page++) {
        console.log(`📄 페이지 ${page}/${totalPages} 수집 중...`);
        setDownloadProgress({ current: page, total: totalPages });
        
        const result = await unifiedBookSearch(searchKeyword.trim(), searchType, pageSize, page);
        
        if (result.books && result.books.length > 0) {
          allBooks.push(...result.books);
        }
        
        // 너무 빠른 요청을 방지하기 위한 짧은 대기
        if (page < totalPages) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`✅ 전체 ${allBooks.length}건 데이터 수집 완료`);
      
      if (allBooks.length > 0) {
        await exportToExcel(
          allBooks, 
          `${searchKeyword}_도서목록_전체${allBooks.length}건_${new Date().toISOString().split('T')[0]}`
        );
        console.log(`💾 엑셀 파일 다운로드 완료: ${allBooks.length}건`);
      } else {
        setError('다운로드할 데이터를 수집하지 못했습니다.');
      }
    } catch (err) {
      console.error('전체 데이터 다운로드 실패:', err);
      setError(`전체 데이터 다운로드 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Database className="h-10 w-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">도서 검색 시스템</h1>
          </div>
          <p className="text-gray-600">주요 출판사의 도서 목록을 검색하고 전체 데이터를 엑셀로 다운로드하세요</p>
          <div className="text-sm mt-2">
            <span className="text-green-600">✅ API 키 불필요 | ✅ 실시간 검색 | ✅ 전체 데이터 다운로드</span>
            {currentMethod !== 'sparql' && (
              <span className="text-orange-600 ml-4">
                ⚠️ {currentMethod === 'alternative' ? '서지정보시스템 모드' : currentMethod === 'dummy' ? '테스트 모드' : '오류 모드'}로 실행 중
              </span>
            )}
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label htmlFor="searchType" className="block text-sm font-medium text-gray-700 mb-2">
                검색 유형
              </label>
              <select
                id="searchType"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'title' | 'author' | 'publisher')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="publisher">발행처</option>
                <option value="title">제목</option>
                <option value="author">저자</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="searchKeyword" className="block text-sm font-medium text-gray-700 mb-2">
                검색어
              </label>
              <input
                id="searchKeyword"
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder={`${searchType === 'publisher' ? '발행처명' : searchType === 'title' ? '도서 제목' : '저자명'}을 입력하세요`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(1)}
              />
            </div>
            <div>
              <label htmlFor="pageSize" className="block text-sm font-medium text-gray-700 mb-2">
                페이지 크기
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1); // 페이지 크기 변경시 첫 페이지로
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={20}>20건</option>
                <option value={50}>50건</option>
                <option value={100}>100건</option>
                <option value={200}>200건</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => handleSearch(1)}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {loading ? '검색 중...' : 'SPARQL 검색'}
              </button>
            </div>
          </div>
          
          {/* Search Type Info & Quick Publishers */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600 mb-3">
              {searchType === 'publisher' && '💡 발행처 검색: 정확한 발행처명이나 일부만 입력해도 검색됩니다. (예: 네이버웹툰, 민음사, 창비)'}
              {searchType === 'title' && '💡 제목 검색: 도서 제목의 일부 또는 전체를 입력하세요. (예: 해리포터, 토지, 1984)'}
              {searchType === 'author' && '💡 저자 검색: 저자명이나 일부를 입력하세요. (예: 김영하, 무라카미, 조정래)'}
            </p>
            
            {searchType === 'publisher' && (
              <div>
                <p className="text-xs text-gray-500 mb-2">🔥 주요 출판사 빠른 검색:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: '네이버웹툰 유한회사', count: '4,567권', color: 'bg-green-100 text-green-800' },
                    { name: '민음사', count: '3,200권', color: 'bg-blue-100 text-blue-800' },
                    { name: '창비', count: '2,800권', color: 'bg-purple-100 text-purple-800' },
                    { name: '문학동네', count: '2,500권', color: 'bg-orange-100 text-orange-800' },
                    { name: '랜덤하우스', count: '1,800권', color: 'bg-red-100 text-red-800' },
                    { name: '열린책들', count: '1,500권', color: 'bg-indigo-100 text-indigo-800' },
                    { name: '을유문화사', count: '1,200권', color: 'bg-yellow-100 text-yellow-800' }
                  ].map((publisher) => (
                    <button
                      key={publisher.name}
                      onClick={() => {
                        setSearchKeyword(publisher.name);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium hover:opacity-80 transition-opacity ${publisher.color}`}
                    >
                      {publisher.name} ({publisher.count})
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {(searchKeyword.includes('네이버웹툰') || searchKeyword.includes('민음사') || 
              searchKeyword.includes('창비') || searchKeyword.includes('문학동네') ||
              searchKeyword.includes('랜덤하우스') || searchKeyword.includes('열린책들') ||
              searchKeyword.includes('을유문화사')) && (
              <div className="mt-2 text-xs text-blue-700">
                🚀 <strong>주요 출판사 검색:</strong> 수백~수천 권의 전체 도서를 페이지네이션으로 탐색할 수 있습니다. 페이지 크기를 조정하여 한 번에 더 많은 결과를 확인하세요.
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Download Progress */}
        {loading && downloadProgress.total > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-800 font-medium">전체 데이터 다운로드 진행 중...</p>
              <span className="text-blue-600 text-sm">
                {downloadProgress.current}/{downloadProgress.total} 페이지
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-blue-700 text-xs mt-2">
              💡 전체 {totalCount.toLocaleString()}건의 데이터를 수집하여 엑셀 파일로 저장합니다.
            </p>
          </div>
        )}

        {/* Results */}
        {books.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  검색 결과 ({books.length}건 표시 / 전체 {totalCount.toLocaleString()}건)
                </h2>
                {totalPages > 1 && (
                  <p className="text-sm text-gray-600 mt-1">
                    📄 페이지 {currentPage} / {totalPages} (페이지당 {pageSize}건)
                  </p>
                )}
                {currentMethod === 'alternative' && (
                  <p className="text-sm text-blue-600 mt-1">
                    {searchKeyword.includes('네이버웹툰') && '📚 네이버웹툰 유한회사 출간 도서 전체 목록'}
                    {searchKeyword.includes('민음사') && '📚 민음사 출간 도서 전체 목록'}
                    {searchKeyword.includes('창비') && '📚 창비 출간 도서 전체 목록'}
                    {searchKeyword.includes('문학동네') && '📚 문학동네 출간 도서 전체 목록'}
                    {searchKeyword.includes('랜덤하우스') && '📚 랜덤하우스 출간 도서 전체 목록'}
                    {searchKeyword.includes('열린책들') && '📚 열린책들 출간 도서 전체 목록'}
                    {searchKeyword.includes('을유문화사') && '📚 을유문화사 출간 도서 전체 목록'}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {loading ? 
                    downloadProgress.total > 0 ? 
                      `다운로드 중... (${downloadProgress.current}/${downloadProgress.total})` : 
                      '다운로드 중...' 
                    : totalPages > 1 ? `엑셀 다운로드` : '엑셀 다운로드'
                  }
                </button>
                {totalPages > 1 && !loading && (
                  <div className="text-xs text-gray-600 flex items-center">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      전체 {totalCount.toLocaleString()}건 다운로드 가능
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제목
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      저자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      발행처
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      발행년도
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ISBN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      주제
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {books.map((book, index) => (
                    <tr key={`${book.id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        <div title={book.title}>{book.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {book.author}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {book.publisher}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {book.publishYear}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {book.isbn}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        <div title={book.subject}>{book.subject}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    이전
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      전체 <span className="font-medium">{totalCount.toLocaleString()}</span>건 중{' '}
                      <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span>-
                      <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span>건 표시
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {/* Page Numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* No Results */}
        {!loading && books.length === 0 && !error && (
          <div className="text-center py-12">
            <BookIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">검색 결과가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">다른 검색어나 검색 유형을 시도해보세요.</p>
          </div>
        )}

                {/* Footer Info */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">📚 지원하는 출판사 정보</h3>
          <div className="text-xs text-blue-700 space-y-1">
            <p>• <strong>네이버웹툰 유한회사:</strong> 4,567권 (신의 탑, 노블레스, 갓 오브 하이스쿨 등)</p>
            <p>• <strong>민음사:</strong> 3,200권 (세계문학전집, 한국문학, 철학서 등)</p>
            <p>• <strong>창비:</strong> 2,800권 (토지, 태백산맥, 인문학서 등)</p>
            <p>• <strong>문학동네:</strong> 2,500권 (해리포터, 영미문학, 판타지소설 등)</p>
            <p>• <strong>랜덤하우스:</strong> 1,800권 (스티브 잡스, 사피엔스, 총균쇠 등)</p>
            <p>• <strong>열린책들:</strong> 1,500권 (백년의 고독, 노인과 바다, 1984 등)</p>
            <p>• <strong>을유문화사:</strong> 1,200권 (서양철학사, 칸트, 헤겔 등)</p>
            <p>• <strong>기타 출판사:</strong> 500권씩 지원 (가나, 북하우스, 시공사 등)</p>
            <p>• <strong>기능:</strong> 페이지네이션, 전체 데이터 엑셀 다운로드, 실시간 검색</p>
          </div>
          <div className="mt-3 flex gap-4">
            <a 
              href="/debug" 
              className="text-xs text-blue-800 underline hover:text-blue-900"
            >
              🔧 SPARQL 연결 디버깅 페이지
            </a>
            <span className="text-xs text-gray-500">
              💡 검색어 예시: 민음사, 창비, 문학동네, 네이버웹툰
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

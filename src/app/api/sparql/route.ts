import { NextRequest, NextResponse } from 'next/server';

const SPARQL_ENDPOINT = 'http://lod.nl.go.kr/sparql';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log('=== SPARQL 프록시 요청 시작 ===');
    console.log('요청 본문:', body);
    
    // URL Parameters 파싱해서 쿼리 확인
    const urlParams = new URLSearchParams(body);
    const query = urlParams.get('query');
    console.log('파싱된 SPARQL 쿼리:', query);
    
    console.log('SPARQL 엔드포인트로 요청 전송:', SPARQL_ENDPOINT);
    
    const response = await fetch(SPARQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'Mozilla/5.0 (compatible; SPARQLClient/1.0)',
      },
      body: body,
    });

    console.log('SPARQL 엔드포인트 응답 상태:', response.status);
    console.log('SPARQL 응답 헤더들:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SPARQL 엔드포인트 오류 응답:', errorText);
      
      // 더 구체적인 오류 정보 제공
      let errorMessage = `SPARQL 엔드포인트 오류 (${response.status})`;
      if (response.status === 400) {
        errorMessage += ' - 잘못된 쿼리 문법';
      } else if (response.status === 500) {
        errorMessage += ' - 서버 내부 오류';
      } else if (response.status === 503) {
        errorMessage += ' - 서비스 일시 불가';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorText,
          query: query 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('SPARQL 성공 응답 (첫 100자):', JSON.stringify(data).substring(0, 100) + '...');
    console.log('결과 바인딩 개수:', data?.results?.bindings?.length || 0);

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('=== SPARQL 프록시 오류 ===');
    console.error('오류 타입:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('오류 메시지:', error instanceof Error ? error.message : String(error));
    console.error('오류 스택:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'SPARQL 프록시에서 오류가 발생했습니다',
        details: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : typeof error
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 
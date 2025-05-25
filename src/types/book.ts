export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publishYear: string;
  isbn: string;
  classification: string;
  subject: string;
  extent: string;
  language: string;
  callNumber: string;
}

export interface ApiResponse {
  result: {
    total: number;
    record: Book[];
  };
}

export interface SearchParams {
  apiKey: string;
  publisher: string;
  pageNum?: number;
  pageSize?: number;
} 
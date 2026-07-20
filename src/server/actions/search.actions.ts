'use server';

import * as searchService from '@/server/services/search.service';

export async function searchPosts(query: string) {
  return searchService.searchPosts(query);
}

export async function searchAll(query: string) {
  return searchService.searchAll(query);
}

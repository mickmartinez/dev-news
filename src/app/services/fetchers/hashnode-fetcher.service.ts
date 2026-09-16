import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { DEVTO_TAGS } from '../../data/topic-tags';

/** Shape of a single post as returned by the Hashnode public GraphQL API. */
export interface HashnodePost {
  id: string;
  title: string;
  brief: string | null;
  url: string;
  publishedAt: string;
  coverImage: { url: string } | null;
  author: { name: string } | null;
}

interface HashnodeTagPostsResponse {
  data: {
    tag: {
      posts: { nodes: HashnodePost[] };
    } | null;
  };
}

const HASHNODE_GRAPHQL_API = 'https://gql.hashnode.com/';

const POSTS_BY_TAG_QUERY = `
  query PostsByTag($slug: String!) {
    tag(slug: $slug) {
      posts(page: 0) {
        nodes {
          id
          title
          brief
          url
          publishedAt
          coverImage { url }
          author { name }
        }
      }
    }
  }
`;

/** Fetches Hashnode articles for each configured tag slug and merges/de-dupes the results. */
@Injectable({ providedIn: 'root' })
export class HashnodeFetcherService {
  private readonly http = inject(HttpClient);

  fetchArticles(): Observable<HashnodePost[]> {
    const requests = DEVTO_TAGS.map((slug) =>
      this.http
        .post<HashnodeTagPostsResponse>(HASHNODE_GRAPHQL_API, {
          query: POSTS_BY_TAG_QUERY,
          variables: { slug },
        })
        .pipe(catchError(() => of<HashnodeTagPostsResponse>({ data: { tag: null } }))),
    );

    return forkJoin(requests).pipe(
      map((responses) => {
        const byId = new Map<string, HashnodePost>();
        for (const response of responses) {
          for (const post of response.data.tag?.posts.nodes ?? []) {
            byId.set(post.id, post);
          }
        }
        return Array.from(byId.values());
      }),
    );
  }
}

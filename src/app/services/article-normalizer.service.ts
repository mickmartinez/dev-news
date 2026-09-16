import { Injectable } from '@angular/core';
import { UnifiedArticle } from '../models/article.model';
import { DevToArticle } from './fetchers/devto-fetcher.service';
import { MsLearnCatalogEntry } from './fetchers/mslearn-fetcher.service';
import { HackerNewsHit } from './fetchers/hackernews-fetcher.service';
import { HashnodePost } from './fetchers/hashnode-fetcher.service';
import { GitHubRepo } from './fetchers/github-fetcher.service';

/**
 * Pure mapping functions that convert each source API's raw payload into the
 * single `UnifiedArticle` shape. No HTTP calls or side effects live here so
 * every mapper can be unit tested in isolation with fixture data.
 */
@Injectable({ providedIn: 'root' })
export class ArticleNormalizerService {
  normalizeDevTo(articles: DevToArticle[]): UnifiedArticle[] {
    return articles.map((article) => ({
      id: `devto-${article.id}`,
      source: 'devto',
      title: article.title,
      url: article.url,
      summary: article.description,
      author: article.user.name,
      publishedAt: article.published_at,
      tags: article.tag_list.map((tag) => tag.toLowerCase()),
      thumbnailUrl: article.cover_image,
      metric: { label: 'reactions', value: article.public_reactions_count },
    }));
  }

  normalizeMsLearn(entries: MsLearnCatalogEntry[]): UnifiedArticle[] {
    return entries.map((entry) => ({
      id: `mslearn-${entry.uid}`,
      source: 'mslearn',
      title: entry.title,
      url: entry.url,
      summary: entry.summary,
      author: null,
      publishedAt: entry.last_modified,
      tags: [],
      thumbnailUrl: null,
      metric: null,
    }));
  }

  normalizeHackerNews(hits: HackerNewsHit[]): UnifiedArticle[] {
    return hits
      .filter((hit) => hit.title !== null)
      .map((hit) => ({
        id: `hackernews-${hit.objectID}`,
        source: 'hackernews',
        title: hit.title as string,
        url: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
        summary: null,
        author: hit.author,
        publishedAt: hit.created_at,
        tags: hit._tags.map((tag) => tag.toLowerCase()),
        thumbnailUrl: null,
        metric: { label: 'points', value: hit.points ?? 0 },
      }));
  }

  normalizeHashnode(posts: HashnodePost[]): UnifiedArticle[] {
    return posts.map((post) => ({
      id: `hashnode-${post.id}`,
      source: 'hashnode',
      title: post.title,
      url: post.url,
      summary: post.brief,
      author: post.author?.name ?? null,
      publishedAt: post.publishedAt,
      tags: [],
      thumbnailUrl: post.coverImage?.url ?? null,
      metric: null,
    }));
  }

  normalizeGitHub(repos: GitHubRepo[]): UnifiedArticle[] {
    return repos.map((repo) => ({
      id: `github-${repo.id}`,
      source: 'github',
      title: repo.full_name,
      url: repo.html_url,
      summary: repo.description,
      author: repo.owner.login,
      publishedAt: repo.pushed_at,
      tags: repo.topics.map((topic) => topic.toLowerCase()),
      thumbnailUrl: repo.owner.avatar_url,
      metric: { label: 'stars', value: repo.stargazers_count },
    }));
  }
}

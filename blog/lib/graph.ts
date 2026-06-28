// blog/lib/graph.ts
// Pure knowledge-graph builder from the posts registry: nodes = posts, edges = related[] links
// (undirected, deduped), node colour keyed by primary tag. Consumed by /blog/graph.
import type { Post } from './posts'

export interface GraphNode { slug: string; title: string; tag: string; kind: 'note' | 'post' }
export interface GraphEdge { a: string; b: string }
export interface Graph { nodes: GraphNode[]; edges: GraphEdge[] }

/** Build an undirected post graph. Edges only between existing posts; self-links dropped. */
export function buildGraph(posts: Post[]): Graph {
  const slugs = new Set(posts.map(p => p.slug))
  const nodes: GraphNode[] = posts.map(p => ({ slug: p.slug, title: p.title, tag: p.tags[0] ?? 'AI', kind: p.kind ?? 'post' }))

  const seen = new Set<string>()
  const edges: GraphEdge[] = []
  for (const post of posts) {
    for (const rel of post.related) {
      if (rel === post.slug || !slugs.has(rel)) continue
      const [a, b] = [post.slug, rel].sort()
      const key = `${a}|${b}`
      if (seen.has(key)) continue
      seen.add(key)
      edges.push({ a, b })
    }
  }
  return { nodes, edges }
}

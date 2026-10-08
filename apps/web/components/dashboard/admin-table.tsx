import Link from 'next/link'
import { CONSOLE_CARD } from './console-shared'
import { cn } from '@/lib/utils'

export type AdminTableColumn = { key: string; label: string; sortable?: boolean; align?: 'left' | 'right' }
export type AdminTableRow = { key: string; cells: React.ReactNode[] }

export function AdminTable({
  caption,
  columns,
  rows,
  basePath,
  query = {},
  sort,
  direction = 'desc',
  page = 1,
  pageSize = 50,
  total,
  error,
  emptyText,
}: {
  caption: string
  columns: AdminTableColumn[]
  rows: AdminTableRow[]
  basePath: string
  query?: Record<string, string | undefined>
  sort?: string
  direction?: 'asc' | 'desc'
  page?: number
  pageSize?: number
  total: number
  error?: boolean
  emptyText: string
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const firstPage = Math.max(1, page - 2)
  const lastPage = Math.min(pageCount, page + 2)
  const href = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) if (value) params.set(key, value)
    for (const [key, value] of Object.entries(overrides)) params.set(key, String(value))
    const search = params.toString()
    return search ? `${basePath}?${search}` : basePath
  }

  if (error) {
    return <div role="alert" className={cn(CONSOLE_CARD, 'p-5 text-sm text-danger')}>Could not load {caption.toLowerCase()}. <Link href={basePath} className="underline">Retry</Link></div>
  }

  return (
    <section className={cn(CONSOLE_CARD, 'overflow-hidden')}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead><tr className="border-b border-app-border text-xs text-app-muted">
            {columns.map((column) => {
              const active = sort === column.key
              const nextDirection = active && direction === 'asc' ? 'desc' : 'asc'
              return <th key={column.key} scope="col" aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'} className={cn('whitespace-nowrap px-3 py-2.5 font-semibold', column.align === 'right' && 'text-right')}>
                {column.sortable ? <Link href={href({ sort: column.key, direction: nextDirection, page: 1 })} className="inline-flex min-h-8 items-center gap-1 hover:text-app-fg">{column.label}<span aria-hidden="true">{active ? direction === 'asc' ? '↑' : '↓' : '↕'}</span></Link> : column.label}
              </th>
            })}
          </tr></thead>
          <tbody>{rows.length ? rows.map((row) => <tr key={row.key} className="border-b border-app-border last:border-0">{row.cells.map((cell, index) => <td key={`${row.key}-${columns[index]?.key ?? index}`} className={cn('px-3 py-2 align-middle', columns[index]?.align === 'right' && 'text-right')}>{cell}</td>)}</tr>) : <tr><td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-app-muted">{emptyText}</td></tr>}</tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-app-border px-3 py-2.5 text-xs text-app-muted">
        <span className="tabular-nums">{total === 0 ? '0 results' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}</span>
        <nav aria-label={`${caption} pages`} className="flex items-center gap-1">
          {page > 1 && <Link href={href({ page: page - 1 })} className="flex min-h-9 items-center rounded-md px-2 hover:bg-app-elevated">Previous</Link>}
          {firstPage > 1 && <Link href={href({ page: 1 })} aria-label="Page 1" className="flex min-h-9 min-w-9 items-center justify-center rounded-md px-2 tabular-nums hover:bg-app-elevated">1</Link>}
          {firstPage > 2 && <span aria-hidden="true" className="px-1">…</span>}
          {Array.from({ length: lastPage - firstPage + 1 }, (_, index) => firstPage + index).map((number) => <Link key={number} href={href({ page: number })} aria-current={number === page ? 'page' : undefined} className={cn('flex min-h-9 min-w-9 items-center justify-center rounded-md px-2 tabular-nums', number === page ? 'bg-ember/15 font-bold text-ember' : 'hover:bg-app-elevated')}>{number}</Link>)}
          {lastPage < pageCount - 1 && <span aria-hidden="true" className="px-1">…</span>}
          {lastPage < pageCount && <Link href={href({ page: pageCount })} aria-label={`Page ${pageCount}`} className="flex min-h-9 min-w-9 items-center justify-center rounded-md px-2 tabular-nums hover:bg-app-elevated">{pageCount}</Link>}
          {page < pageCount && <Link href={href({ page: page + 1 })} className="flex min-h-9 items-center rounded-md px-2 hover:bg-app-elevated">Next</Link>}
        </nav>
      </div>
    </section>
  )
}

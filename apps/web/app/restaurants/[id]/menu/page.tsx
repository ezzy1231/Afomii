import Link from 'next/link'
import { ArrowLeft, MapPin, Utensils } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PageFooter from '@/components/PageFooter'
import { getRestaurantDetail } from '@/lib/supabase/queries'
import { notFound } from 'next/navigation'

type Props = { params: { id: string } }

export default async function RestaurantMenuPage({ params }: Props) {
  const restaurant = await getRestaurantDetail(params.id)
  if (!restaurant) notFound()

  const branchesWithMenu = restaurant.branches.filter((branch) => branch.menuItems.length > 0)

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/restaurants/${restaurant.id}`}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-card px-3.5 py-2 text-sm font-semibold text-app-fg transition-colors hover:bg-app-input"
        >
          <ArrowLeft className="size-4 text-ember" />
          Back to {restaurant.name}
        </Link>

        <header className="mb-7 rounded-3xl border border-app-border bg-app-card p-6 shadow-card sm:p-8">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-ember/10 text-ember">
            <Utensils className="size-6" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-app-fg">{restaurant.name} menu</h1>
          {restaurant.category && <p className="mt-1 text-sm text-app-muted">{restaurant.category}</p>}
        </header>

        {branchesWithMenu.length ? (
          <div className="space-y-6">
            {branchesWithMenu.map((branch) => {
              const categories = [...new Set(branch.menuItems.map((item) => item.category))]
              return (
                <section key={branch.id} className="rounded-3xl border border-app-border bg-app-card p-5 shadow-card sm:p-7">
                  <div className="mb-5 border-b border-app-border pb-4">
                    <h2 className="text-xl font-bold text-app-fg">{branch.branchName}</h2>
                    {branch.address && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-app-muted">
                        <MapPin className="size-4 shrink-0 text-ember" />
                        {branch.address}
                      </p>
                    )}
                  </div>

                  <div className="space-y-6">
                    {categories.map((category) => (
                      <div key={category}>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-ember">{category}</h3>
                        <div className="divide-y divide-app-border">
                          {branch.menuItems.filter((item) => item.category === category).map((item) => (
                            <article key={item.id} className="flex items-start justify-between gap-4 py-3.5 first:pt-1 last:pb-1">
                              <div className="min-w-0">
                                <h4 className="font-semibold text-app-fg">{item.name}</h4>
                                {item.description && <p className="mt-1 text-sm leading-5 text-app-muted">{item.description}</p>}
                              </div>
                              <p className="shrink-0 text-sm font-bold tabular-nums text-app-fg">ETB {item.price}</p>
                            </article>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-app-border bg-app-card px-6 py-12 text-center">
            <Utensils className="mx-auto size-8 text-app-muted" />
            <h2 className="mt-3 text-lg font-bold text-app-fg">Menu not available yet</h2>
            <p className="mt-1 text-sm text-app-muted">This restaurant has not added menu items for its branches.</p>
          </div>
        )}
      </main>
      <PageFooter />
    </>
  )
}

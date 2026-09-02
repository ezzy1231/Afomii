import Link from "next/link";
import Navbar from "./Navbar";
import Footer from "./Footer";

type InfoPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
};

export default function InfoPage({
  eyebrow,
  title,
  intro,
  sections,
}: InfoPageProps) {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ember">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-bold text-app-fg sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-app-muted">{intro}</p>
        <div className="mt-12 space-y-6">
          {sections.map((section) => (
            <section key={section.heading} className="card-elevated p-6 sm:p-8">
              <h2 className="text-xl font-bold text-app-fg">
                {section.heading}
              </h2>
              <p className="mt-3 leading-7 text-app-muted">{section.body}</p>
            </section>
          ))}
        </div>
        <Link href="/" className="btn-primary mt-10 inline-flex">
          Back to home
        </Link>
      </main>
      <Footer />
    </>
  );
}

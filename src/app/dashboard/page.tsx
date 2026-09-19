import Link from "next/link";

const preferenceCards = [
  { label: "Liked", value: "0", hint: "Movies that feel like you" },
  { label: "Watched", value: "0", hint: "Your viewing history" },
  { label: "Rated", value: "0", hint: "Half-star opinions" },
];

export default function DashboardPage() {
  return <main className="dashboard-shell"><nav className="topbar"><Link className="wordmark" href="/">cine<span>circle</span></Link><div className="nav-links"><Link href="/">Discover</Link><Link className="button button-dark" href="/playlists/new">New playlist</Link></div></nav><section className="dashboard-intro"><p className="eyebrow">Your space</p><h1>Keep your<br /><em>favorites close.</em></h1><p>Sign in to create playlists, track what you have seen, and tune your recommendations.</p></section><section className="preference-grid">{preferenceCards.map((card) => <article className="preference-card" key={card.label}><p>{card.label}</p><strong>{card.value}</strong><span>{card.hint}</span></article>)}</section><section className="empty-dashboard"><p className="eyebrow">Your playlists</p><h2>A blank page is a good place to start.</h2><p>Create a playlist around a mood, a memory, or the people you want to watch with.</p><Link className="button button-coral" href="/playlists/new">Create your first playlist <span>→</span></Link></section></main>;
}
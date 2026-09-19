import Link from "next/link";
import PublicProfile from "./public-profile";

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <main className="dashboard-shell"><nav className="topbar"><Link className="wordmark" href="/">cine<span>circle</span></Link><div className="nav-links"><Link href="/">Discover</Link><Link className="button button-dark" href="/dashboard">Your dashboard</Link></div></nav><PublicProfile username={username} /></main>;
}

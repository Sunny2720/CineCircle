import Link from "next/link";
import AccountPanel from "./account-panel";
import DashboardData from "./dashboard-data";
import PeoplePanel from "./people-panel";

export default function DashboardPage() {
  return <main className="dashboard-shell"><nav className="topbar"><Link className="wordmark" href="/">cine<span>circle</span></Link><div className="nav-links"><Link href="/">Discover</Link><Link className="button button-dark" href="/playlists/new">New playlist</Link></div></nav><section className="dashboard-intro"><p className="eyebrow">Your space</p><h1>Keep your<br /><em>favorites close.</em></h1><p>Your account keeps your movie taste and private playlists safely yours.</p></section><AccountPanel /><DashboardData /><PeoplePanel /></main>;
}

import Link from "next/link";
import { Brand } from "@/components/Navbar";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div><Brand /><div className="footer-meta" style={{ marginTop: 8 }}>One AI. Every Task.</div></div>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link href="/">Home</Link><Link href="/tools">AI Tools</Link><Link href="/pricing">Pricing</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="mailto:hello@nexora.ai">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
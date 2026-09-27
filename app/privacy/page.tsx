import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

export default function PrivacyPage() {
  return <div className="site-shell"><Navbar /><main className="section"><article className="section-inner legal-copy"><div className="eyebrow">NEXORA AI</div><h1>Privacy</h1><p>NEXORA AI stores account data, conversations, writing results and uploaded file metadata in Firebase services configured by the operator. Each record is associated with its account and Firestore rules restrict access to that account.</p><p>AI requests are sent to the server-configured provider to fulfill the requested task. Do not submit sensitive information unless you are comfortable with the configured AI provider&apos;s data practices.</p><p>This Phase 1 foundation does not provide legal advice or a complete regulatory privacy program. The operator should replace this page with a reviewed policy before public production use.</p></article></main><SiteFooter /></div>;
}
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

export default function TermsPage() {
  return <div className="site-shell"><Navbar /><main className="section"><article className="section-inner legal-copy"><div className="eyebrow">NEXORA AI</div><h1>Terms</h1><p>NEXORA AI provides AI-assisted tools for informational and productivity use. You are responsible for reviewing generated content before relying on or sharing it.</p><p>Keep your account credentials secure. Do not upload content that you do not have permission to process. Service availability depends on the Firebase and AI provider configuration supplied by the operator.</p><p>This Phase 1 foundation is not a substitute for reviewed legal terms. The operator should publish final terms before opening the service to customers.</p></article></main><SiteFooter /></div>;
}
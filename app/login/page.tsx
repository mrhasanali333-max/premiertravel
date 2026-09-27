import { Navbar } from "@/components/Navbar";
import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return <><Navbar /><AuthForm mode="login" /></>;
}
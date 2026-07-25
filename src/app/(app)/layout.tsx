import ScholaraShell from '@/components/scholara/ScholaraShell'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ScholaraShell>{children}</ScholaraShell>
}

// Layout untuk halaman admin master data
import { AdminLayout } from "@/components/AdminLayout"

export default function AdminMasterDataLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}

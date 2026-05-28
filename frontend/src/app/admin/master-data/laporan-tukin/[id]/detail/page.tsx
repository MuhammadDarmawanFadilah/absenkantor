'use client';

// This page is for /admin/master-data/laporan-tukin/[id]/detail
// It redirects to the main [id] page since they show the same content
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LaporanTukinDetailRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main detail page
    router.replace(`/admin/master-data/laporan-tukin/${params.id}`);
  }, [params.id, router]);

  return (
    <div className="container mx-auto py-6">
      <div className="text-center py-8">
        <div className="text-lg">Redirecting...</div>
      </div>
    </div>
  );
}

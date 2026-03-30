'use client';

import { Skeleton, SkeletonTable, SkeletonCard, SkeletonList } from './Skeleton';

export { Skeleton, SkeletonTable, SkeletonCard, SkeletonList };

export function LoadingPage() {
  return (
    <>
      <div className="page-content">
        <Skeleton width="40%" height="32px" />
        <div style={{ marginTop: '24px' }}>
          <SkeletonTable rows={3} />
        </div>
      </div>
    </>
  );
}

export function LoadingCard() {
  return (
    <div className="card">
      <div className="card-content">
        <SkeletonCard />
      </div>
    </div>
  );
}

export function LoadingList({ count = 5 }: { count?: number }) {
  return <SkeletonList count={count} />;
}
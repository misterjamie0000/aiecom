import { useParams, Link } from 'react-router-dom';
import { usePublicCmsPage } from '@/hooks/usePublicCmsPage';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileX } from 'lucide-react';

export default function CmsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, error } = usePublicCmsPage(slug || '');

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-md mx-auto">
          <FileX className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The page you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO Meta Tags */}
      {page.meta_title && (
        <title>{page.meta_title}</title>
      )}
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link 
            to="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-sm font-medium">{page.title}</span>
        </nav>

        {/* Page Title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-8">{page.title}</h1>

        {/* Page Content */}
        <div 
          className="prose prose-neutral dark:prose-invert max-w-none
            prose-headings:font-semibold
            prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-ul:my-4 prose-li:text-muted-foreground
            prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: page.content || '' }}
        />

        {/* Last Updated */}
        <div className="mt-12 pt-6 border-t text-sm text-muted-foreground">
          Last updated: {new Date(page.updated_at).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>
    </>
  );
}

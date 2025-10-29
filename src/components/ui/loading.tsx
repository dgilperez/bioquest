import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Loading({ message = 'Loading...', size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
      <Loader2 className={`${sizeClasses[size]} text-nature-600 animate-spin mb-4`} />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

export function PageLoading({ message }: { message?: string }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Loading message={message} size="lg" />
    </div>
  );
}

export function SectionLoading({ message }: { message?: string }) {
  return <Loading message={message} size="md" />;
}

export function InlineLoading({ message }: { message?: string }) {
  return <Loading message={message} size="sm" />;
}

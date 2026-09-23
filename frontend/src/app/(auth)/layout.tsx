export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface-subtle p-4">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}

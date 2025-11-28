export const LoadingScreen = ({ message = "Preparing your experience..." }: { message?: string }) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4 animate-pulse">
        <div className="h-12 w-12 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

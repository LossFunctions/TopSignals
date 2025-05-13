

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-6 px-4 sm:px-6 lg:px-8 text-center">
      <p className="text-sm text-gray-400">
        Not financial advice • © {currentYear} Top Signals
      </p>
    </footer>
  );
}
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-gray-900 group-[.toaster]:text-white group-[.toaster]:border-gray-800 group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-gray-400',
          actionButton: 'group-[.toast]:bg-yellow-600 group-[.toast]:text-black',
          cancelButton: 'group-[.toast]:bg-gray-800 group-[.toast]:text-gray-400',
          success: 'group-[.toast]:bg-green-900 group-[.toast]:text-green-100 group-[.toast]:border-green-800',
          error: 'group-[.toast]:bg-red-900 group-[.toast]:text-red-100 group-[.toast]:border-red-800',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
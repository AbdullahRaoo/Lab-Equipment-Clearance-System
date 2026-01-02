import Image from 'next/image';

interface NutechLogoProps {
    className?: string;
    variant?: 'light' | 'dark';
    showText?: boolean;
}

export function NutechLogo({ className = '', variant = 'dark', showText = false }: NutechLogoProps) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <Image
                src="/nutechlogo.svg"
                alt="NUTECH Logo"
                width={180}
                height={55}
                className={`h-10 w-auto ${variant === 'light' ? 'brightness-0 invert' : ''}`}
                priority
            />
            {showText && (
                <span className={`font-semibold text-sm ${variant === 'light' ? 'text-white' : 'text-gray-600'}`}>
                    ECMS
                </span>
            )}
        </div>
    );
}

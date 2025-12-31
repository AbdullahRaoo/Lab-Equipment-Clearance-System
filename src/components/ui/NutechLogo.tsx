import Image from 'next/image';

interface NutechLogoProps {
    className?: string;
    variant?: 'light' | 'dark';
}

export function NutechLogo({ className = '', variant = 'dark' }: NutechLogoProps) {
    // Using a reliable generic education icon for now if external images are blocked, 
    // but pointing to the NUTECH URL structure for production.
    // Ideally, asset would be local.

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="relative w-10 h-10 flex-shrink-0">
                {/* Placeholder logo using CSS shapes if image fails load */}
                <div className="absolute inset-0 bg-[#105a4b] rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-white shadow-sm">
                    NU
                </div>
            </div>
            <div className="flex flex-col">
                <span className={`font-bold text-lg leading-tight tracking-tight ${variant === 'light' ? 'text-white' : 'text-[#105a4b]'}`}>
                    NUTECH
                </span>
                <span className={`text-[10px] uppercase tracking-wider font-semibold ${variant === 'light' ? 'text-gray-300' : 'text-gray-500'}`}>
                    University
                </span>
            </div>
        </div>
    );
}

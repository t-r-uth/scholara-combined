import Image from 'next/image'

interface UserAvatarProps {
  name: string
  avatarUrl?: string | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_PX: Record<NonNullable<UserAvatarProps['size']>, number> = {
  sm: 24,
  md: 36,
  lg: 56,
}

function initialsFromName(name: string) {
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

export default function UserAvatar({ name, avatarUrl, className = '', size = 'md' }: UserAvatarProps) {
  const initials = initialsFromName(name)
  const sizeClass = size === 'sm' ? 'user-avatar--sm' : size === 'lg' ? 'user-avatar--lg' : ''
  const px = SIZE_PX[size]

  if (avatarUrl?.trim()) {
    return (
      <Image
        src={avatarUrl.trim()}
        alt=""
        width={px}
        height={px}
        className={`user-avatar user-avatar--img ${sizeClass} ${className}`.trim()}
        loading="lazy"
        unoptimized
      />
    )
  }

  return (
    <div className={`user-avatar ${sizeClass} ${className}`.trim()} aria-hidden>
      {initials}
    </div>
  )
}

export interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  hidden?: boolean
}

export default function Breadcrumbs({ items, hidden = false }: BreadcrumbsProps) {
  // If hidden is true, don't render the breadcrumbs
  if (hidden) {
    return null
  }

  return null
}

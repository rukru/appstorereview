import { Review } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Calendar, User, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewCardProps {
  review: Review
  className?: string
}

const getRatingColor = (rating: number) => {
  if (rating >= 4) return 'text-green-500'
  if (rating >= 3) return 'text-yellow-500'
  return 'text-red-500'
}

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

export function ReviewCard({ review, className }: ReviewCardProps) {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">{review.title}</CardTitle>
          <Badge
            variant={review.platform === 'appstore' ? 'default' : 'secondary'}
            className="ml-2 flex items-center gap-1"
          >
            <Smartphone className="h-3 w-3" />
            {review.platform === 'appstore' ? 'App Store' : 'Google Play'}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  data-testid="star-icon"
                  className={cn(
                    'h-4 w-4',
                    i < review.rating
                      ? getRatingColor(review.rating) + ' fill-current'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            <span className={cn('font-medium', getRatingColor(review.rating))}>
              {review.rating}/5
            </span>
          </div>

          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>{review.author}</span>
          </div>

          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(review.date)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm leading-relaxed text-foreground">
          {review.content}
        </p>

        {review.version && (
          <div className="mt-3 pt-3 border-t">
            <Badge variant="outline" className="text-xs">
              Version {review.version}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

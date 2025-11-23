import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, MessageSquare, Image as ImageIcon, Eye, TrendingUp } from "lucide-react";
import { useGBPProfileStats } from "@/hooks/useGBPProfileStats";
import { Skeleton } from "@/components/ui/skeleton";

interface GBPProfileCardProps {
  profile: any;
  onClick: () => void;
}

export const GBPProfileCard = ({ profile, onClick }: GBPProfileCardProps) => {
  const { data: stats, isLoading: statsLoading } = useGBPProfileStats(profile.id);

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {profile.is_mock && (
                <Badge variant="secondary" className="text-xs">Demo</Badge>
              )}
              <Badge variant={profile.is_active ? "default" : "outline"} className="text-xs">
                {profile.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
              {profile.business_name || profile.connection_name}
            </h3>
          </div>
        </div>

        {!statsLoading && stats ? (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{stats.averageRating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">
              ({stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        ) : (
          <Skeleton className="h-5 w-32" />
        )}

        {profile.business_address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{profile.business_address}</span>
          </div>
        )}

        {profile.business_categories && profile.business_categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.business_categories.slice(0, 3).map((category: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {category}
              </Badge>
            ))}
            {profile.business_categories.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{profile.business_categories.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {!statsLoading && stats ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-semibold">{stats.totalPosts}</div>
                <div className="text-xs text-muted-foreground">Posts</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-semibold">{stats.totalPhotos}</div>
                <div className="text-xs text-muted-foreground">Fotos</div>
              </div>
            </div>

            {stats.profileViews && stats.profileViews > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-semibold">{stats.profileViews.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Views</div>
                </div>
              </div>
            )}

            {stats.profileSearches && stats.profileSearches > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-semibold">{stats.profileSearches.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Buscas</div>
                </div>
              </div>
            )}

            {stats.unreadReviews > 0 && (
              <div className="col-span-2">
                <Badge variant="destructive" className="text-xs">
                  {stats.unreadReviews} review(s) não lida(s)
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}

        <Button className="w-full" variant="outline" size="sm">
          Ver Detalhes →
        </Button>
      </CardContent>
    </Card>
  );
};
